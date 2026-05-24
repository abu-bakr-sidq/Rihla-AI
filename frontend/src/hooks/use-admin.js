import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-contract";

function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function useAdminUsers() {
  return useQuery({
    queryKey: [api.admin.users.path],
    queryFn: async () => {
      const res = await fetch(api.admin.users.path, { headers: getAuthHeaders(), credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch users");
      return await res.json();
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true
  });
}

function useAdminStats() {
  return useQuery({
    queryKey: [api.admin.stats.path],
    queryFn: async () => {
      const res = await fetch(api.admin.stats.path, { headers: getAuthHeaders(), credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch stats");
      return await res.json();
    }
  });
}

function useAdminActivity() {
  return useQuery({
    queryKey: ["/api/admin/activity"],
    queryFn: async () => {
      const res = await fetch("/api/admin/activity", { headers: getAuthHeaders(), credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch activity logs");
      return await res.json();
    }
  });
}

function useAdminAllTrips() {
  return useQuery({
    queryKey: [api.admin.allTrips.path, "v2"],
    queryFn: async () => {
      const res = await fetch(api.admin.allTrips.path, { headers: getAuthHeaders(), credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch all trips");
      return await res.json();
    }
  });
}

function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, status }) => {
      if (!userId) throw new Error("User ID is required");
      const idStr = userId.toString();
      const path = api.admin.updateUser.path.replace(":id", idStr);
      const res = await fetch(path, {
        method: api.admin.updateUser.method,
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to update user status");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.users.path] });
    }
  });
}

function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId) => {
      if (!userId) throw new Error("User ID is required");
      const idStr = userId.toString();
      const path = api.admin.deleteUser.path.replace(":id", idStr);
      const res = await fetch(path, {
        method: api.admin.deleteUser.method,
        headers: getAuthHeaders(),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete user");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.admin.users.path] });
    }
  });
}

// Composite hook combining users + stats + activity for the admin panel
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
      trips.refetch()
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
    refetch
  };
}

export {
  useAdmin,
  useAdminStats,
  useAdminUsers,
  useAdminActivity,
  useAdminAllTrips,
  useUpdateUserStatus,
  useDeleteUser
};
