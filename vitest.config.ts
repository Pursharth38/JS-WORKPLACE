// ⚠️ Shared file. Dev A owns CI config (P1-07); this is the test runner setup.
//    On merge, union the `include` globs rather than replacing them — Dev C's
//    unlock.test.ts and grading.test.ts live under the same tests/ tree.
import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './') },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    // e2e is Playwright's, not Vitest's.
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
})
