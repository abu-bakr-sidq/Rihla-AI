import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-contract";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

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

function useAdminUsers() {
  return useQuery({
    queryKey: [api.admin.users.path],
    queryFn: async () => {
      const res = await fetch(apiUrl(api.admin.users.path), {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      return await res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });
}

function useAdminStats() {
  return useQuery({
    queryKey: [api.admin.stats.path],
    queryFn: async () => {
      const res = await fetch(apiUrl(api.admin.stats.path), {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return await res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });
}

function useAdminActivity() {
  return useQuery({
    queryKey: ["/api/admin/activity"],
    queryFn: async () => {
      const res = await fetch(apiUrl("/api/admin/activity"), {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch activity logs");
      return await res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });
}

function useAdminAllTrips() {
  return useQuery({
    queryKey: [api.admin.allTrips.path, "v2"],
    queryFn: async () => {
      const res = await fetch(apiUrl(api.admin.allTrips.path), {
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch all trips");
      return await res.json();
    },
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });
}

function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, status }) => {
      if (!userId) throw new Error("User ID is required");
      const idStr = userId.toString();
      const path = api.admin.updateUser.path.replace(":id", idStr);
      const res = await fetch(apiUrl(path), {
        method: api.admin.updateUser.method,
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update user status");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.users.path] });
    },
  });
}

function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId) => {
      if (!userId) throw new Error("User ID is required");
      const idStr = userId.toString();
      const path = api.admin.deleteUser.path.replace(":id", idStr);
      const res = await fetch(apiUrl(path), {
        method: api.admin.deleteUser.method,
        headers: getAuthHeaders(),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.users.path] });
    },
  });
}

function useAdmin() {
  const users = useAdminUsers();
  const stats = useAdminStats();
  const activity = useAdminActivity();
  const trips = useAdminAllTrips();

  const refetch = async () => {
    await Promise.all([
      users.refetch(),
      stats.refetch(),
      activity.refetch(),
      trips.refetch(),
    ]);
  };

  return {
    data: {
      users: users.data || [],
      stats: stats.data || {},
      activity: activity.data || [],
      trips: trips.data || [],
    },
    isLoading: users.isLoading || stats.isLoading || activity.isLoading || trips.isLoading,
    isError: users.isError || stats.isError || activity.isError || trips.isError,
    refetch,
  };
}

export {
  useAdmin,
  useAdminStats,
  useAdminUsers,
  useAdminActivity,
  useAdminAllTrips,
  useUpdateUserStatus,
  useDeleteUser,
};
