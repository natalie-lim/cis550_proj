import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url))
    }
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "istanbul",
      reporter: ["text", "html"],
      include: [
        "app/api/compare/route.ts",
        "app/api/search/zip/route.ts",
        "app/api/state/[stateCode]/route.ts",
        "app/api/zip/[zipCode]/schools/route.ts",
        "components/HousingTrendChart.tsx",
        "components/InsightsPanel.tsx",
        "components/SiteNav.tsx"
      ]
    }
  }
});
