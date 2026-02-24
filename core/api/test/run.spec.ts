import {describe, it, expect, vi, beforeEach} from 'vitest';

vi.mock('@ringai/async-breakpoints', () => {
    return {
        asyncBreakpoints: {
            waitBeforeInstructionBreakpoint: vi.fn(async () => undefined),
            waitAfterInstructionBreakpoint: vi.fn(async () => undefined),
        },
    };
});

// unit under test
import {run, beforeRun, afterRun} from '../src/run';

// dependencies
import {testAPIController} from '../src/test-api-controller';

vi.mock('@ringai/transport', () => ({
    transport: {},
}));

vi.mock('@ringai/logger', () => {
    const loggerClient = {
        withPrefix: vi.fn(() => loggerClient),
        startStep: vi.fn(),
        endStep: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    };

    return {
        loggerClient,
    };
});

describe('core/api run', () => {
    beforeEach(() => {
        testAPIController.setTestID('test-id');
        testAPIController.setTestParameters({runData: {}} as any);
        testAPIController.setEnvironmentParameters({} as any);
    });

    it('should call beforeRun callbacks before tests and afterRun callbacks after tests (order)', async () => {
        const events: string[] = [];

        beforeRun(() => {
            events.push('before-1');
        });
        beforeRun(async () => {
            events.push('before-2');
        });

        afterRun(() => {
            events.push('after-1');
        });
        afterRun(async () => {
            events.push('after-2');
        });

        await run(async () => {
            events.push('test');
        });

        await testAPIController.flushAfterRunCallbacks();

        // run() registers its own afterRun(api.end) callback as well.
        // We only assert relative ordering around tests.
        const beforeIdx = Math.max(events.indexOf('before-1'), events.indexOf('before-2'));
        const testIdx = events.indexOf('test');
        const afterIdx = Math.min(events.indexOf('after-1'), events.indexOf('after-2'));

        expect(beforeIdx).toBeGreaterThanOrEqual(0);
        expect(testIdx).toBeGreaterThan(beforeIdx);
        expect(afterIdx).toBeGreaterThan(testIdx);

        expect(events).toEqual(['before-1', 'before-2', 'test', 'after-1', 'after-2']);
    });
});
