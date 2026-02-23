import {describe, expect, it, vi} from 'vitest';

import {ReporterManager} from '../src/reporter-manager.js';

function makeReporter(name: string) {
    return {
        name,
        onStart: vi.fn(),
        onTestPass: vi.fn(),
        onTestFail: vi.fn(),
        onTestSkip: vi.fn(),
        onTestPending: vi.fn(),
        onEnd: vi.fn(),
        onError: vi.fn(),
        close: vi.fn().mockResolvedValue(undefined),
    };
}

describe('core/reporter ReporterManager', () => {
    it('should add built-in reporter by default when none configured', () => {
        const mgr = new ReporterManager();
        expect(mgr.getReporters().length).toBe(1);
    });

    it('should add reporters and fan-out events to all reporters', () => {
        const r1 = makeReporter('r1');
        const r2 = makeReporter('r2');

        const mgr = new ReporterManager([
            {reporter: r1 as any},
            {reporter: r2 as any},
        ]);

        const tests = [{id: 't1'}] as any;
        mgr.start(tests);
        mgr.testPass({id: 't1', title: 'ok'} as any);
        mgr.testFail({id: 't2', title: 'bad'} as any);
        mgr.testSkip({id: 't3'} as any);
        mgr.testPending({id: 't4'} as any);
        const result = mgr.end(false, 'boom');
        mgr.error(new Error('x'));

        expect(r1.onStart).toHaveBeenCalledWith({startTime: expect.any(Number), tests});
        expect(r2.onStart).toHaveBeenCalled();

        expect(r1.onTestPass).toHaveBeenCalledTimes(1);
        expect(r2.onTestFail).toHaveBeenCalledTimes(1);
        expect(r1.onTestSkip).toHaveBeenCalledTimes(1);
        expect(r2.onTestPending).toHaveBeenCalledTimes(1);

        expect(result.success).toBe(false);
        expect(result.error).toBe('boom');
        expect(r1.onEnd).toHaveBeenCalledWith(expect.objectContaining({success: false}));
        expect(r2.onEnd).toHaveBeenCalledWith(expect.objectContaining({success: false}));

        expect(r1.onError).toHaveBeenCalledTimes(1);
        expect(r2.onError).toHaveBeenCalledTimes(1);
    });

    it('should throw if reporter name is unknown', () => {
        expect(() => new ReporterManager([{reporter: 'nope' as any}])).toThrow('Unknown reporter: nope');
    });

    it('should close all reporters', async () => {
        const r1 = makeReporter('r1');
        const r2 = makeReporter('r2');
        const mgr = new ReporterManager([{reporter: r1 as any}, {reporter: r2 as any}]);
        await mgr.close();
        expect(r1.close).toHaveBeenCalledTimes(1);
        expect(r2.close).toHaveBeenCalledTimes(1);
    });
});
