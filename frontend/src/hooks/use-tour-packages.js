import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resolveApiUrl } from "@/lib/api-contract";

function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export function useTourPackages() {
  return useQuery({
    queryKey: ["/api/tour-packages"],
    queryFn: async () => {
      const res = await fetch(resolveApiUrl("/api/tour-packages"), { headers: getAuthHeaders(), credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tour packages");
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 2
  });
}

export function useCreateTourPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await fetch(resolveApiUrl("/api/tour-packages"), {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
        credentials: "include"
      });
      if (!res.ok) {
        let msg = "Failed to create package";
        try { const err = await res.json(); msg = err.message || msg; } catch (e) {}
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tour-packages"] })
  });
}

export function useDeleteTourPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await fetch(resolveApiUrl(`/api/tour-packages/${id}`), {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete package");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/tour-packages"] })
  });
}
