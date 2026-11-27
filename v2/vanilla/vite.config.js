import { scanResourcesPlugin } from "@microblink/platform-sdk/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // Copies the camera resources (WASM + workers) into public/resources.
    ...scanResourcesPlugin(),
  ],
  server: {
    port: 5173,
    // Forwards /api/* to the example server, so the app and backend share an origin.
    proxy: { "/api": "http://localhost:3001" },
  },
});
