import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@/lib/api-contract";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const PENDING_TRIPS_KEY = "pending_trips_sync";

function apiUrl(path) {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath === "/api") return API_BASE_URL;
  if (normalizedPath.startsWith("/api/")) {
    return `${API_BASE_URL}${normalizedPath.slice(4)}`;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}

function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function parseWithLogging(schema, data, label) {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw new Error(`Invalid response format from ${label}`);
  }
  return result.data;
}

function getPendingTrips() {
  try {
    const parsed = JSON.parse(localStorage.getItem(PENDING_TRIPS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setPendingTrips(trips) {
  try {
    if (!trips?.length) {
      localStorage.removeItem(PENDING_TRIPS_KEY);
      return;
    }
    localStorage.setItem(PENDING_TRIPS_KEY, JSON.stringify(trips));
  } catch {}
}

async function syncPendingTrips() {
  const token = localStorage.getItem("auth_token");
  if (!token) return;

  const pending = getPendingTrips();
  if (!pending.length) return;

  const remaining = [];

  for (const trip of pending) {
    try {
      const res = await fetch(apiUrl(api.trips.create.path), {
        method: api.trips.create.method,
        headers: getAuthHeaders(),
        body: JSON.stringify(trip),
        credentials: "include",
      });

      if (!res.ok) {
        remaining.push(trip);
      }
    } catch {
      remaining.push(trip);
    }
  }

  setPendingTrips(remaining);
}

function useTrips() {
  return useQuery({
    queryKey: [api.trips.list.path],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return [];

      await syncPendingTrips();
      const res = await fetch(apiUrl(api.trips.list.path), {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch trips");
      return parseWithLogging(api.trips.list.responses[200], await res.json(), "trips.list");
    },
  });
}

function useTrip(id) {
  return useQuery({
    queryKey: [api.trips.get.path, id],
    queryFn: async () => {
      const url = apiUrl(buildUrl(api.trips.get.path, { id }));
      const res = await fetch(url, { headers: getAuthHeaders(), credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch trip");
      return parseWithLogging(api.trips.get.responses[200], await res.json(), "trips.get");
    },
    enabled: !!id,
  });
}

function useGenerateTrip() {
  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch(apiUrl(api.trips.generate.path), {
        method: api.trips.generate.method,
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) {
        let msg = "Failed to generate trip itinerary. Please try again.";
        try {
          const d = await res.json();
          msg = d.message || msg;
        } catch {}
        throw new Error(msg);
      }
      return await res.json();
    },
  });
}

function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const parseResult = api.trips.create.input.safeParse(data);
      const payload = parseResult.success ? parseResult.data : data;
      const res = await fetch(apiUrl(api.trips.create.path), {
        method: api.trips.create.method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) {
        let errMsg = "Failed to save trip";
        try {
          const errBody = await res.json();
          errMsg = errBody.message || errBody.error || errMsg;
          console.error("[Trip Create Error]", errBody);
        } catch {}
        throw new Error(errMsg);
      }
      return await res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.trips.list.path] }),
  });
}

function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error("Trip ID is required");
      const url = apiUrl(buildUrl(api.trips.delete.path, { id: id.toString() }));
      const res = await fetch(url, {
        method: api.trips.delete.method,
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete trip");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.trips.list.path] }),
  });
}

function useUpdateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      if (!id) throw new Error("Trip ID is required");
      const payload = api.trips.update.input.parse(data);
      const url = apiUrl(buildUrl(api.trips.update.path, { id: id.toString() }));
      const res = await fetch(url, {
        method: api.trips.update.method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
        credentials: "include",
      });
      if (!res.ok) {
        let errMsg = "Failed to update trip";
        try {
          const errBody = await res.json();
          errMsg = errBody.message || errBody.error || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.trips.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.trips.get.path, variables.id] });
    },
  });
}

function useDeleteAllTrips() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(apiUrl("/api/trips"), {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) {
        let msg = "Failed to delete all trips";
        try {
          const d = await res.json();
          msg = d.message || msg;
        } catch {}
        throw new Error(msg);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.trips.list.path] }),
  });
}

export {
  useCreateTrip,
  useDeleteTrip,
  useDeleteAllTrips,
  useGenerateTrip,
  useTrip,
  useTrips,
  useUpdateTrip,
};
