import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['*.spec.mjs'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['*.mjs'],
      exclude: ['*.spec.mjs', 'vitest.config.mjs', 'main.mjs'],
      thresholds: {
        lines: 100,
        branches: 100,
        functions: 100,
        statements: 100,
      },
    },
  },
});
