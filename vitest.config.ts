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
        hookTimeout: 30000,
        // Use threads pool for better performance on multi-core systems
        pool: 'threads',
        poolOptions: {
            threads: {
                // Use available CPUs minus one to keep system responsive
                maxThreads: Math.max(1, require('os').cpus().length - 1),
                minThreads: 1,
            },
        },
        // Better error reporting
        dangerouslyIgnoreUnhandledErrors: false,
        // Show full test names in output
        fullStackTrace: true,
        // Environment variables for tests
        env: {
            NODE_ENV: 'test',
        },
        coverage: {
            provider: 'v8',
            reportsDirectory: './.coverage',
            reporter: ['text', 'text-summary', 'lcov', 'html'],
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
