import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, resolveApiUrl } from "@/lib/api-contract";

function parseWithLogging(schema, data, label) {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw new Error(`Invalid response format from ${label}`);
  }
  return result.data;
}

function getAuthHeaders() {
  const token = localStorage.getItem("auth_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export function useUser(options = {}) {
  const { enabled = true } = options;
  return useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(resolveApiUrl(api.auth.me.path), {
        headers: getAuthHeaders(),
        credentials: "include"
      });
      if (res.status === 401) {
        localStorage.removeItem("auth_token");
        return null;
      }
      if (!res.ok) throw new Error("Failed to fetch user");
      const raw = await res.json();
      return parseWithLogging(api.auth.me.responses[200], raw, "auth.me");
    },
    retry: false,
    enabled,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const validated = api.auth.login.input.parse(data);
      const res = await fetch(resolveApiUrl(api.auth.login.path), {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include"
      });
      const raw = await res.json();
      if (!res.ok) {
        throw new Error(raw.message || "Login failed");
      }
      const parsed = parseWithLogging(api.auth.login.responses[200], raw, "auth.login");

      if (parsed.token) {
        localStorage.setItem("auth_token", parsed.token);
      }
      return parsed.user || parsed;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.auth.me.path] })
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const validated = api.auth.register.input.parse(data);
      const res = await fetch(resolveApiUrl(api.auth.register.path), {
        method: api.auth.register.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include"
      });
      const raw = await res.json();
      if (!res.ok) {
        throw new Error(raw.message || "Registration failed");
      }
      return raw;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.auth.me.path] })
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(resolveApiUrl(api.auth.logout.path), {
        method: api.auth.logout.method,
        headers: getAuthHeaders(),
        credentials: "include"
      });
      if (!res.ok) throw new Error("Logout failed");
      localStorage.removeItem("auth_token");
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null);
      queryClient.clear();
    }
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const validated = api.auth.updateProfile.input.parse(data);
      const res = await fetch(resolveApiUrl(api.auth.updateProfile.path), {
        method: api.auth.updateProfile.method,
        headers: getAuthHeaders(),
        body: JSON.stringify(validated),
        credentials: "include"
      });
      const raw = await res.json();
      if (!res.ok) {
        throw new Error(raw.message || "Update failed");
      }
      return raw;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.users.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.stats.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity"] });
    }
  });
}

export function useUpdatePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const validated = api.auth.updatePassword.input.parse(data);
      const res = await fetch(resolveApiUrl(api.auth.updatePassword.path), {
        method: api.auth.updatePassword.method,
        headers: getAuthHeaders(),
        body: JSON.stringify(validated),
        credentials: "include"
      });
      const raw = await res.json();
      if (!res.ok) {
        throw new Error(raw.message || "Password update failed");
      }
      return raw;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.users.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.stats.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity"] });
    }
  });
}

export function useRevokeSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(resolveApiUrl(api.auth.revokeSessions.path), {
        method: api.auth.revokeSessions.method,
        headers: getAuthHeaders(),
        credentials: "include"
      });
      const raw = await res.json();
      if (!res.ok) {
        throw new Error(raw.message || "Failed to revoke sessions");
      }
      return raw;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.me.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.users.path] });
      queryClient.invalidateQueries({ queryKey: [api.admin.stats.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity"] });
    }
  });
}
