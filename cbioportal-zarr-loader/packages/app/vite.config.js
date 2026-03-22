import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: process.env.VITE_BASE_URL || "/",
  plugins: [
    react(),
    {
      name: "docs-bypass",
      configureServer(server) {
        // Serve /docs/* as static files instead of rewriting to index.html
        server.middlewares.use((req, _res, next) => {
          if (req.url?.startsWith("/docs")) {
            req.headers.accept = "";
          }
          next();
        });
      },
    },
  ],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
  },
});
