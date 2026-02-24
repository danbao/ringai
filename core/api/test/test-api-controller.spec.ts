import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@ringai/async-breakpoints', () => {
    return {
        asyncBreakpoints: {
            waitBeforeInstructionBreakpoint: vi.fn(async () => undefined),
            waitAfterInstructionBreakpoint: vi.fn(async () => undefined),
        },
    };
});

import {asyncBreakpoints} from '@ringai/async-breakpoints';
import {TestEvents} from '@ringai/types';

import {BusEmitter, TestAPIController} from '../src/test-api-controller';

describe('core/api TestAPIController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should set/get testID, testParameters, environmentParameters', () => {
        const api = new TestAPIController();

        api.setTestID('id-1');
        api.setTestParameters({runData: {a: 1}});
        api.setEnvironmentParameters({env: 'x'});

        expect(api.getTestID()).toBe('id-1');
        expect(api.getTestParameters()).toEqual({runData: {a: 1}});
        expect(api.getEnvironmentParameters()).toEqual({env: 'x'});
    });

    it('flushBeforeRunCallbacks should call async breakpoints and execute callbacks in order then clear', async () => {
        const api = new TestAPIController();
        const events: string[] = [];

        api.registerBeforeRunCallback(() => events.push('a'));
        api.registerBeforeRunCallback(async () => events.push('b'));

        await api.flushBeforeRunCallbacks();
        await api.flushBeforeRunCallbacks();

        expect(asyncBreakpoints.waitBeforeInstructionBreakpoint).toHaveBeenCalledTimes(2);
        expect(asyncBreakpoints.waitAfterInstructionBreakpoint).toHaveBeenCalledTimes(2);

        // second flush should do nothing besides breakpoints
        expect(events).toEqual(['a', 'b']);
    });

    it('flushAfterRunCallbacks should call async breakpoints and execute callbacks in order then clear', async () => {
        const api = new TestAPIController();
        const events: string[] = [];

        api.registerAfterRunCallback(() => events.push('a'));
        api.registerAfterRunCallback(async () => events.push('b'));

        await api.flushAfterRunCallbacks();
        await api.flushAfterRunCallbacks();

        expect(asyncBreakpoints.waitBeforeInstructionBreakpoint).toHaveBeenCalledTimes(2);
        expect(asyncBreakpoints.waitAfterInstructionBreakpoint).toHaveBeenCalledTimes(2);

        expect(events).toEqual(['a', 'b']);
    });
});

describe('core/api BusEmitter', () => {
    it('startedTest/finishedTest/failedTest should emit proper events', async () => {
        const bus = new BusEmitter();
        const started = vi.fn();
        const finished = vi.fn();
        const failed = vi.fn();

        bus.on(TestEvents.started, started);
        bus.on(TestEvents.finished, finished);
        bus.on(TestEvents.failed, failed);

        const error = new Error('boom');

        await bus.startedTest();
        await bus.finishedTest();
        await bus.failedTest(error);

        expect(started).toHaveBeenCalledTimes(1);
        expect(finished).toHaveBeenCalledTimes(1);
        expect(failed).toHaveBeenCalledTimes(1);
        expect(failed).toHaveBeenCalledWith(error);
    });
});
