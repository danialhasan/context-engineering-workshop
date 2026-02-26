import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const proxyTarget = process.env.CEW_GUI_API_PROXY_TARGET || "http://127.0.0.1:8765";

export default defineConfig({
  root: __dirname,
  base: "./",
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: path.resolve(__dirname, "../gui"),
    emptyOutDir: true,
  },
});
