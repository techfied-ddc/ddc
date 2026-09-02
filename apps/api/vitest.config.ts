import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals:     true,
    environment: 'node',
    include:     ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    setupFiles:  ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include:  ['src/**'],
      exclude:  ['src/**/*.test.ts', 'src/db/seed/**'],
    },
    // Run tests serially — integration tests share a DB
    pool:        'forks',
    poolOptions: { forks: { singleFork: true } },
  },
});
