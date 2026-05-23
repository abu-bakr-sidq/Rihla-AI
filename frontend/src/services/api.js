import axios from "axios";

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || "/api",
    timeout: 10000,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("auth_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle global auth errors (e.g. 401 redirect to login)
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("auth_token");
            // Do not redirect if we are already on the auth page or fetching /auth/me
            const isAuthReq = error.config.url && (error.config.url.includes('/auth/me') || error.config.url.includes('/auth/login'));
            const isAuthPage = window.location.pathname === "/auth" || window.location.pathname === "/login";
            if (!isAuthReq && !isAuthPage) {
                window.location.href = "/auth";
            }
        }
        return Promise.reject(error);
    }
);
