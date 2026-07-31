import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

// Separate from vitest.config.ts on purpose: these tests hit a REAL local
// Supabase Postgres instance (RLS, SECURITY DEFINER functions) rather than
// mocks, so they require `npx supabase start` running locally first and
// are excluded from the default fast `pnpm test` run.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["**/*.integration.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
    testTimeout: 20_000,
  },
});
