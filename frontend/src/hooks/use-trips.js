import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@/lib/api-contract";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const PENDING_TRIPS_KEY = "pending_trips_sync";
const PENDING_ID_PREFIX = "__pending__:";
const SAVED_TRIPS_CACHE_KEY = "saved_trips_cache";

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

function normalizeTripRecord(raw = {}) {
  return {
    ...raw,
    id: raw?.id ?? raw?._id ?? null,
    _id: raw?._id ?? raw?.id ?? null,
    destination: String(raw?.destination || "").trim(),
    startDate: raw?.startDate ? String(raw.startDate) : "",
    endDate: raw?.endDate ? String(raw.endDate) : "",
    days: Number(raw?.days) || raw?.itinerary?.trip_overview?.total_days || 1,
    budget: raw?.budget != null ? String(raw.budget) : "moderate",
    currency: raw?.currency ? String(raw.currency) : "USD",
    travelStyle: raw?.travelStyle ? String(raw.travelStyle) : "balanced",
    interests: Array.isArray(raw?.interests) ? raw.interests : [],
    itinerary: raw?.itinerary ?? null,
    costBreakdown: raw?.costBreakdown ?? {},
    status: raw?.status ? String(raw.status) : "planned",
    travelers: Number(raw?.travelers) || raw?.preferences?.travelers || 1,
    preferences: raw?.preferences && typeof raw.preferences === "object" ? raw.preferences : {},
    createdAt: raw?.createdAt ? String(raw.createdAt) : undefined,
  };
}

function parseTripListSafely(data) {
  const parsed = api.trips.list.responses[200].safeParse(data);
  if (parsed.success) return parsed.data;

  console.error("[Zod] trips.list validation failed, attempting salvage:", parsed.error.format());
  const rawTrips = Array.isArray(data) ? data : [];
  return rawTrips
    .map((item) => normalizeTripRecord(item))
    .filter((trip) => Boolean(trip.id) && Boolean(trip.destination));
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

function getSavedTripsCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SAVED_TRIPS_CACHE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setSavedTripsCache(trips) {
  try {
    if (!trips?.length) {
      localStorage.removeItem(SAVED_TRIPS_CACHE_KEY);
      return;
    }
    localStorage.setItem(SAVED_TRIPS_CACHE_KEY, JSON.stringify(trips));
  } catch {}
}

function queuePendingTrip(trip) {
  if (!trip?.destination) return;

  const pending = getPendingTrips();
  const fingerprint = buildTripFingerprint(trip);
  const alreadyQueued = pending.some((item) => buildTripFingerprint(item) === fingerprint);
  if (alreadyQueued) return;

  pending.push({
    ...trip,
    status: trip?.status || "planned",
  });
  setPendingTrips(pending);
}

function buildTripFingerprint(trip) {
  return [
    String(trip?.destination || "").trim().toLowerCase(),
    String(trip?.startDate || "").trim(),
    String(trip?.endDate || "").trim(),
    String(trip?.travelStyle || trip?.preferences?.travelStyle || "").trim().toLowerCase(),
  ].join("|");
}

function decoratePendingTrip(trip, index) {
  return {
    ...trip,
    id: `${PENDING_ID_PREFIX}${index}`,
    _id: `${PENDING_ID_PREFIX}${index}`,
    pendingSync: true,
    status: trip?.status || "planned",
  };
}

function mergeTripsWithPending(serverTrips = []) {
  const cachedTrips = getSavedTripsCache()
    .map((trip) => normalizeTripRecord(trip))
    .filter((trip) => Boolean(trip.id) && Boolean(trip.destination));

  const mergedSaved = [];
  const mergedSavedSeen = new Set();

  [...serverTrips, ...cachedTrips].forEach((trip) => {
    const normalized = normalizeTripRecord(trip);
    const key = String(normalized.id || buildTripFingerprint(normalized));
    if (!key || mergedSavedSeen.has(key)) return;
    mergedSavedSeen.add(key);
    mergedSaved.push(normalized);
  });

  const pendingTrips = getPendingTrips();
  if (!pendingTrips.length) return mergedSaved;

  const existing = new Set(mergedSaved.map((trip) => buildTripFingerprint(trip)));
  const pendingOnly = pendingTrips
    .map((trip, index) => decoratePendingTrip(trip, index))
    .filter((trip) => !existing.has(buildTripFingerprint(trip)));

  return [...pendingOnly, ...mergedSaved];
}

function removePendingTripById(id) {
  if (!String(id || "").startsWith(PENDING_ID_PREFIX)) return false;
  const index = Number(String(id).slice(PENDING_ID_PREFIX.length));
  const pending = getPendingTrips();
  if (!Number.isInteger(index) || index < 0 || index >= pending.length) return false;
  pending.splice(index, 1);
  setPendingTrips(pending);
  return true;
}

function upsertSavedTripCache(trip) {
  const normalized = normalizeTripRecord(trip);
  if (!normalized.id || !normalized.destination) return;

  const existing = getSavedTripsCache();
  const next = [
    normalized,
    ...existing.filter((item) => String(item?.id || item?._id) !== String(normalized.id)),
  ];
  setSavedTripsCache(next.slice(0, 30));
}

function removeSavedTripById(id) {
  const existing = getSavedTripsCache();
  const next = existing.filter((item) => String(item?.id || item?._id) !== String(id));
  setSavedTripsCache(next);
}

async function syncPendingTrips() {
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
        if (res.status === 401 || res.status === 403) {
          remaining.push(trip);
          continue;
        }
        remaining.push(trip);
      } else {
        try {
          const savedTrip = await res.json();
          upsertSavedTripCache(savedTrip);
        } catch {}
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
      await syncPendingTrips();
      const res = await fetch(apiUrl(api.trips.list.path), {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (res.status === 401 || res.status === 403) {
        return mergeTripsWithPending([]);
      }
      if (!res.ok) throw new Error("Failed to fetch trips");
      const parsed = parseTripListSafely(await res.json());
      parsed.forEach((trip) => upsertSavedTripCache(trip));
      return mergeTripsWithPending(parsed);
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
      const parsed = parseWithLogging(api.trips.get.responses[200], await res.json(), "trips.get");
      upsertSavedTripCache(parsed);
      return parsed;
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
      try {
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

          if (res.status >= 500) {
            queuePendingTrip(payload);
          }

          throw new Error(errMsg);
        }
        const parsed = await res.json();
        upsertSavedTripCache(parsed);
        return parsed;
      } catch (err) {
        if (err instanceof TypeError) {
          queuePendingTrip(payload);
        }
        throw err;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.trips.list.path] }),
  });
}

function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (!id) throw new Error("Trip ID is required");
      if (removePendingTripById(id)) {
        removeSavedTripById(id);
        return;
      }
      const url = apiUrl(buildUrl(api.trips.delete.path, { id: id.toString() }));
      const res = await fetch(url, {
        method: api.trips.delete.method,
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete trip");
      removeSavedTripById(id);
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
      const parsed = await res.json();
      upsertSavedTripCache(parsed);
      return parsed;
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
      setPendingTrips([]);
      setSavedTripsCache([]);
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
