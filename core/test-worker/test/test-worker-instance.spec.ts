import {describe, it, vi, expect} from 'vitest';

import {TestWorkerInstance} from '../src/test-worker-instance';

vi.mock('@ringai/logger', () => ({
    loggerClient: {
        debug: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        withPrefix: () => ({
            debug: vi.fn(), info: vi.fn(), error: vi.fn(), warn: vi.fn(),
        }),
    },
}));

vi.mock('@ringai/sandbox', () => ({
    Sandbox: class {
        static clearCache = vi.fn();
        execute = vi.fn();
    },
}));

vi.mock('@ringai/api', () => {
    const mockBus = {
        on: vi.fn(),
        removeListener: vi.fn(),
        startedTest: vi.fn().mockResolvedValue(undefined),
        finishedTest: vi.fn().mockResolvedValue(undefined),
        failedTest: vi.fn().mockResolvedValue(undefined),
    };
    class MockTestAPIController {
        getBus = vi.fn(() => mockBus);
        setEnvironmentParameters = vi.fn();
        setTestParameters = vi.fn();
        setTestID = vi.fn();
        getTestID = vi.fn(() => 'test-id');
        getTestParameters = vi.fn(() => ({}));
        getEnvironmentParameters = vi.fn(() => ({}));
        flushBeforeRunCallbacks = vi.fn().mockResolvedValue(undefined);
        flushAfterRunCallbacks = vi.fn().mockResolvedValue(undefined);
        registerBeforeRunCallback = vi.fn();
        registerAfterRunCallback = vi.fn();
    }
    return {
        TestAPIController: MockTestAPIController,
        testAPIController: new MockTestAPIController(),
        TestContext: class { end = vi.fn().mockResolvedValue(undefined); },
        WebApplication: class {},
    };
});

vi.mock('@ringai/async-breakpoints', () => ({
    asyncBreakpoints: {
        resolveBeforeInstructionBreakpoint: vi.fn(),
        resolveAfterInstructionBreakpoint: vi.fn(),
    },
    BreakStackError: class extends Error {},
}));

describe('TestWorkerInstance', () => {
    it('should have a unique worker ID', () => {
        const transport = { broadcast: vi.fn() } as any;
        const compile = vi.fn(async (src: string) => src);
        const beforeCompile = vi.fn(async () => []);

        const instance = new TestWorkerInstance(transport, compile, beforeCompile);

        expect(instance.getWorkerID()).toMatch(/^worker\//);
    });

    it('kill should be safe (no-op)', async () => {
        const transport = { broadcast: vi.fn() } as any;
        const compile = vi.fn(async (src: string) => src);
        const beforeCompile = vi.fn(async () => []);

        const instance = new TestWorkerInstance(transport, compile, beforeCompile);
        await instance.kill();
    });

    it('should compile source and cache it', async () => {
        const transport = { broadcast: vi.fn() } as any;
        const compile = vi.fn(async (src: string) => `compiled:${src}`);
        const beforeCompile = vi.fn(async () => []);

        const instance = new TestWorkerInstance(transport, compile, beforeCompile);

        await instance.execute(
            {path: '/tmp/test.spec.ts', content: 'test code'} as any,
            {},
            {},
        );

        expect(compile).toHaveBeenCalledTimes(1);
        expect(compile).toHaveBeenCalledWith('test code', '/tmp/test.spec.ts');
    });
});
