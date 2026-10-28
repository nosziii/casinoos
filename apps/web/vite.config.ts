import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/ws": { target: "ws://127.0.0.1:3000", ws: true },
    },
  },
});

