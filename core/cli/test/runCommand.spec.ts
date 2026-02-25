import {describe, expect, it, vi, beforeEach} from 'vitest';

// Mock heavy deps used inside RunCommand.execute
vi.mock('@ringai/logger', () => {
    return {
        loggerClient: {info: vi.fn(), error: vi.fn()},
        LoggerServer: vi.fn(),
    };
});

vi.mock('@ringai/test-run-controller', () => {
    class TestRunController {
        runQueue = vi.fn().mockResolvedValue(null);
        kill = vi.fn().mockResolvedValue(undefined);
        constructor(_config?: any, _testWorker?: any, _reporter?: any) {}
    }
    return {TestRunController};
});

vi.mock('@ringai/plugin-api', () => ({applyPlugins: vi.fn()}));

vi.mock('@ringai/fs-reader', () => {
    class FSReader {
        find = vi.fn().mockResolvedValue(['a.test.ts', 'b.test.ts']);
    }
    return {FSReader};
});

vi.mock('@ringai/test-worker', () => {
    return {
        TestWorker: vi.fn(),
    };
});

vi.mock('@ringai/web-application', () => {
    class WebApplicationController {
        init = vi.fn();
        kill = vi.fn();
        constructor(_browserProxy?: any, _transport?: any) {}
    }
    return {WebApplicationController};
});

vi.mock('@ringai/browser-proxy', () => {
    class BrowserProxyController {
        init = vi.fn().mockResolvedValue(undefined);
        kill = vi.fn().mockResolvedValue(undefined);
    }
    return { BrowserProxyController };
});

vi.mock('@ringai/fs-store', () => {
    class FSStoreServer {
        cleanUpTransport = vi.fn();
        constructor(_maxWriteThreadCount?: number) {}
    }

    return {FSStoreServer};
});

import {runTests} from '../src/commands/runCommand.js';

describe('core/cli runCommand', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should throw when required tests field is missing', () => {
        const config = {
            // missing tests
            maxWriteThreadCount: 1,
            workerLimit: 'local',
            screenshots: false,
        } as any;

        expect(() => runTests(config, {} as any, process.stdout)).toThrow(
            'required field --tests in arguments or config',
        );
    });

    it('should pass mapping of workerLimit/screenshots into TestWorker options', async () => {
        const {TestWorker} = await import('@ringai/test-worker');

        const config = {
            tests: 'tests/**/*.test.ts',
            maxWriteThreadCount: 2,
            workerLimit: 'local',
            screenshots: true,
        } as any;

        const cmd = runTests(config, {} as any, process.stdout);
        await cmd.execute();

        expect(TestWorker).toHaveBeenCalledTimes(1);
        const [, options] = (TestWorker as any).mock.calls[0];
        expect(options).toEqual({
            waitForRelease: false,
            localWorker: true,
            screenshots: true,
        });
    });

    it('should map workerLimit != local into localWorker=false', async () => {
        const {TestWorker} = await import('@ringai/test-worker');

        const config = {
            tests: 'tests/**/*.test.ts',
            maxWriteThreadCount: 2,
            workerLimit: 4,
            screenshots: false,
        } as any;

        const cmd = runTests(config, {} as any, process.stdout);
        await cmd.execute();

        const [, options] = (TestWorker as any).mock.calls[0];
        expect(options.localWorker).toBe(false);
    });
});
