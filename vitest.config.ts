import { defineConfig } from 'vitest/config';
import os from 'os';

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
            // Functional tests that require child process IPC - need ESM sandbox rework
            'core/test-worker/test/worker-controller.spec.ts',
            'packages/browser-proxy/test/browser-proxy-controller.functional.spec.ts',
            'packages/web-application/test/web-application-controller.functional.spec.ts',
        ],
        testTimeout: 60000,
        hookTimeout: 30000,
        pool: 'threads',
        maxWorkers: Math.max(1, os.cpus().length - 1),
        minWorkers: 1,
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
