import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        include: [
            'core/*/test/**/*.spec.ts',
            'packages/*/test/**/*.spec.ts',
            'packages/*/test/**/*.spec.js',
        ],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            'packages/e2e-test-app/**',
            'packages/devtool-frontend/**',
            'packages/devtool-extension/**',
            'core/types/**',
            'core/cli/test/run.functional.spec.ts',
            'core/test-worker/test/test-worker.functional.spec.ts',
        ],
        testTimeout: 60000,
        pool: 'forks',
        coverage: {
            provider: 'v8',
            reportsDirectory: './.coverage',
            include: [
                'core/*/src/**/*.ts',
                'packages/*/src/**/*.ts',
            ],
            exclude: [
                'core/*/src/index.ts',
                'core/types/**',
                'packages/*/src/index.ts',
                'packages/devtool-*/**',
                'packages/e2e-test-app/**',
                'packages/plugin-playwright-driver/**',
            ],
        },
    },
});
