import { defineConfig } from "vitest/config";
import { getViteConfig } from "astro/config";

export default getViteConfig(
  defineConfig({
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./test/setup.ts"],
      include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
      coverage: {
        include: ["src/lib/**", "src/components/**", "src/pages/api/**"],
        exclude: ["src/env.d.ts"],
      },
    },
  })
);
