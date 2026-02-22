import {beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@testring/transport', () => ({
    transport: {name: 'mock-transport'},
}));

vi.mock('@testring/logger', () => {
    const loggerClient = {
        withPrefix: vi.fn(() => loggerClient),
        startStep: vi.fn(),
        endStep: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    };

    return {loggerClient};
});

// Keep it simple: we only need isStopped/end from WebApplication in this unit.
vi.mock('@testring/web-application', () => {
    class WebApplication {
        static instances: any[] = [];
        public end = vi.fn(async () => undefined);
        private stopped = false;

        constructor(...args: any[]) {
            (this.constructor as any).instances.push(args);
        }

        public isStopped() {
            return this.stopped;
        }

        public setStopped(value: boolean) {
            this.stopped = value;
        }
    }

    return {WebApplication};
});

import {loggerClient} from '@testring/logger';
import {WebApplication} from '@testring/web-application';

import {TestContext} from '../src/test-context';
import {testAPIController} from '../src/test-api-controller';

describe('core/api TestContext', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (WebApplication as any).instances = [];

        testAPIController.setTestID('test-id');
        testAPIController.setTestParameters({runData: {some: 'run-data'}} as any);
        testAPIController.setEnvironmentParameters({env: 'params'} as any);
    });

    it('should lazily create application once and cache it on the instance (non-enumerable)', () => {
        const ctx = new TestContext({});

        const app1 = ctx.application;
        const app2 = ctx.application;

        expect(app1).toBe(app2);

        // created once
        expect((WebApplication as any).instances).toHaveLength(1);

        // property should exist but be non-enumerable
        expect(Object.prototype.hasOwnProperty.call(ctx, 'application')).toBe(true);
        expect(Object.keys(ctx)).not.toContain('application');
    });

    it('should get parameters/environment via testAPIController getters (default plumbing)', () => {
        const ctx = new TestContext({});

        expect(ctx.getParameters()).toEqual({runData: {some: 'run-data'}});
        expect(ctx.getEnvironment()).toEqual({env: 'params'});
    });

    it('logBusiness should end previous step before starting a new one and stopLogBusiness should be idempotent', async () => {
        const ctx = new TestContext({});

        await ctx.logBusiness('step-1');
        await ctx.logBusiness('step-2');

        expect(loggerClient.startStep).toHaveBeenCalledTimes(2);
        expect(loggerClient.startStep).toHaveBeenNthCalledWith(1, 'step-1');
        expect(loggerClient.startStep).toHaveBeenNthCalledWith(2, 'step-2');

        // step-1 ended when step-2 started
        expect(loggerClient.endStep).toHaveBeenCalledTimes(1);
        expect(loggerClient.endStep).toHaveBeenCalledWith('step-1');

        await ctx.stopLogBusiness();
        await ctx.stopLogBusiness();

        // step-2 ended once
        expect(loggerClient.endStep).toHaveBeenCalledTimes(2);
        expect(loggerClient.endStep).toHaveBeenLastCalledWith('step-2');
    });

    it('log/logWarning/logError should prefix messages', async () => {
        const ctx = new TestContext({});

        await ctx.log('a', 1);
        await ctx.logWarning('b', 2);
        await ctx.logError('c', 3);

        expect(loggerClient.info).toHaveBeenCalledWith('[logged inside test]', 'a', 1);
        expect(loggerClient.warn).toHaveBeenCalledWith('[logged inside test]', 'b', 2);
        expect(loggerClient.error).toHaveBeenCalledWith('[logged inside test]', 'c', 3);
    });

    it('initCustomApplication should create, store and expose custom application instances', () => {
        class MyApp extends WebApplication {}

        const ctx = new TestContext({});
        const custom = ctx.initCustomApplication(MyApp);

        expect(custom).toBeInstanceOf(MyApp);
        expect(ctx.getCustomApplicationsList()).toEqual([custom]);
        expect((WebApplication as any).instances).toHaveLength(1);
    });

    it('end should end main application (if not stopped) and all custom applications (if not stopped)', async () => {
        const ctx = new TestContext({});

        const app = ctx.application as any;
        const custom1 = ctx.initCustomApplication(WebApplication as any) as any;
        const custom2 = ctx.initCustomApplication(WebApplication as any) as any;

        custom2.setStopped(true);

        await ctx.end();

        expect(app.end).toHaveBeenCalledTimes(1);
        expect(custom1.end).toHaveBeenCalledTimes(1);
        expect(custom2.end).not.toHaveBeenCalled();
    });

    it('end should catch errors from ending and logError them', async () => {
        const ctx = new TestContext({});
        const app = ctx.application as any;
        const err = new Error('boom');
        app.end.mockRejectedValueOnce(err);

        await ctx.end();

        expect(loggerClient.error).toHaveBeenCalledWith('[logged inside test]', err);
    });

    it('cloneInstance should create a shallow copy that keeps prototype and merges extra fields', () => {
        const ctx = new TestContext({});

        const cloned = ctx.cloneInstance({hello: 'world'});

        expect(cloned).toBeInstanceOf(TestContext);
        expect((cloned as any).hello).toBe('world');
    });
});
