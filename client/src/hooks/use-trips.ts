import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

function parseWithLogging<T>(schema: any, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw new Error(`Invalid response format from ${label}`);
  }
  return result.data;
}

export function useTrips() {
  return useQuery({
    queryKey: [api.trips.list.path],
    queryFn: async () => {
      const res = await fetch(api.trips.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch trips");
      return parseWithLogging(api.trips.list.responses[200], await res.json(), "trips.list");
    },
  });
}

export function useTrip(id: number) {
  return useQuery({
    queryKey: [api.trips.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.trips.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch trip");
      return parseWithLogging(api.trips.get.responses[200], await res.json(), "trips.get");
    },
    enabled: !!id,
  });
}

export function useGenerateTrip() {
  return useMutation({
    mutationFn: async (data: any) => {
      const validated = api.trips.generate.input.parse(data);
      const res = await fetch(api.trips.generate.path, {
        method: api.trips.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to generate trip itinerary. Please try again.");
      }
      return parseWithLogging(api.trips.generate.responses[200], await res.json(), "trips.generate");
    },
  });
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const validated = api.trips.create.input.parse(data);
      const res = await fetch(api.trips.create.path, {
        method: api.trips.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to save trip");
      return parseWithLogging(api.trips.create.responses[201], await res.json(), "trips.create");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.trips.list.path] }),
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.trips.delete.path, { id });
      const res = await fetch(url, {
        method: api.trips.delete.method,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete trip");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.trips.list.path] }),
  });
}
