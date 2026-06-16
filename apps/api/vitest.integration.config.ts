import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@laundry-palu/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
    },
  },
  test: {
    globals: false,
    environment: 'node',
    envFile: '.env.test',
    testTimeout: 30_000,
    hookTimeout: 30_000,
    include: ['tests/integration/**/*.test.ts'],
    globalSetup: './tests/integration/global-setup.ts',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
  },
});
