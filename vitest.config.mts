import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // Unit tests don't touch CSS; skip the app's Tailwind PostCSS config.
  css: { postcss: {} },
  test: { include: ["src/**/*.test.ts"] },
});
