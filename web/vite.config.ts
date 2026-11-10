import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    fs: {
      allow: [path.resolve(__dirname, "..")],
    },
    proxy: {
      "/api": "http://127.0.0.1:8787",
      "/ws": {
        target: "http://127.0.0.1:8787",
        ws: true,
      },
    },
  },
});
