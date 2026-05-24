import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  envDir: path.resolve(import.meta.dirname, ".."),
  plugins: [
    react(),
  ],
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "../shared"),
      "@assets": path.resolve(import.meta.dirname, "../attached_assets"),
      react: path.resolve(import.meta.dirname, "node_modules/react"),
      "react-dom": path.resolve(import.meta.dirname, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(
        import.meta.dirname,
        "node_modules/react/jsx-runtime.js",
      ),
      "react/jsx-dev-runtime": path.resolve(
        import.meta.dirname,
        "node_modules/react/jsx-dev-runtime.js",
      ),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
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
