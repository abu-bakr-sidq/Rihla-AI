import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

const isReplit = process.env.REPL_ID !== undefined;
const isDev = process.env.NODE_ENV !== "production";

export default defineConfig({
  envDir: path.resolve(import.meta.dirname),
  plugins: [
    react(),
    ...(isReplit && isDev ? [runtimeErrorOverlay()] : []),
    ...(isReplit && isDev
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "frontend", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "frontend"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    minify: false,
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy) => {
          let backendDownLogged = false;
          proxy.on("error", (err) => {
            if (err?.code === "ECONNREFUSED") {
              if (!backendDownLogged) {
                backendDownLogged = true;
                console.warn("[vite-proxy] Backend is not reachable at http://127.0.0.1:5000 yet.");
              }
              return;
            }
            console.warn("[vite-proxy] Proxy error:", err?.message || err);
          });
          proxy.on("proxyReq", (_proxyReq, req) => {
            backendDownLogged = false;
            console.log("Sending Request to the Target:", req.method, req.url);
          });
          proxy.on("proxyRes", (proxyRes, req) => {
            console.log(
              "Received Response from the Target:",
              proxyRes.statusCode,
              req.url,
            );
          });
        },
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
