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
      "/api/llm": {
        target: "http://localhost:8010",
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
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              // Cadena de Markdown (la usan Chat y el asistente de Finanzas, que cargan al inicio).
              name: "markdown",
              test: /node_modules[\\/](react-markdown|remark-[^\\/]+|remark|micromark[^\\/]*|mdast-[^\\/]+|hast-[^\\/]+|unified|unist-[^\\/]+|vfile[^\\/]*|decode-named-character-reference|character-entities[^\\/]*|trim-lines|trough|bail|devlop|space-separated-tokens|comma-separated-tokens|property-information|html-url-attributes|is-plain-obj|ccount|markdown-table|longest-streak|zwitch|estree-util-[^\\/]+|style-to-[^\\/]+|inline-style-parser)[\\/]/,
            },
            {
              name: "vendor",
              test: /node_modules[\\/](react|react-dom|react-router|scheduler|keycloak-js|lucide-react)[\\/]/,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: "node",
  },
});
