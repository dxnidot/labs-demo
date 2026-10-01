import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api/finanzas": {
        target: "http://127.0.0.1:8083",
        changeOrigin: true,
      },
      "/salud/keycloak": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: () => "/realms/lab",
      },
      "/adk": {
        target: "http://localhost:8010",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/adk/, ""),
      },
      "/api": {
        target: "http://localhost:8081",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "node",
  },
});
