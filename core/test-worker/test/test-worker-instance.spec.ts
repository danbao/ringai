import * as chai from 'chai';
import {vi} from 'vitest';

import {TestWorkerInstance} from '../src/test-worker-instance';
import {TestWorkerAction, TestStatus} from '@ringai/types';

vi.mock('@ringai/fs-store', () => {
    return {
        FSClientGet: () => ({
            releaseAllWorkerActions: vi.fn(),
        }),
        FSStoreClient: class {},
    };
});

vi.mock('../src/test-worker-local', () => {
    const {EventEmitter} = require('events');
    return {
        TestWorkerLocal: class TestWorkerLocal extends EventEmitter {
            send = vi.fn(async () => true);
            kill = vi.fn(() => {
                this.emit('exit');
            });
        },
    };
});

const flush = async () => {
    // allow promise chains + timers used internally (delay(100) etc.)
    await new Promise((r) => setTimeout(r, 0));
};

describe('TestWorkerInstance', () => {
    it('should handle localWorker execution (transport.once) and not call transport.send', async () => {
        const transport = {
            once: vi.fn((_action: any, _handler: any) => vi.fn()),
            onceFrom: vi.fn(),
            send: vi.fn(),
            registerChild: vi.fn(),
        } as any;

        const compile = vi.fn(async (src: string) => src);
        const beforeCompile = vi.fn(async () => []);

        const instance = new TestWorkerInstance(
            transport,
            compile as any,
            beforeCompile as any,
            {localWorker: true},
        );

        const executePromise = instance.execute(
            {path: '/tmp/t.spec.ts', content: 'test'} as any,
            {},
            {},
        );

        await flush();

        chai.expect(transport.once.mock.calls.length).to.equal(1);
        chai.expect(transport.once.mock.calls[0][0]).to.equal(
            TestWorkerAction.executionComplete,
        );
        chai.expect(transport.send.mock.calls.length).to.equal(0);

        const completeHandler = transport.once.mock.calls[0][1];
        completeHandler({status: TestStatus.done});

        await executePromise;
    });

    it('kill should be safe when no worker has been created yet', async () => {
        const transport = {
            once: vi.fn(),
            onceFrom: vi.fn(),
            send: vi.fn(),
            registerChild: vi.fn(),
        } as any;

        const compile = vi.fn(async (src: string) => src);
        const beforeCompile = vi.fn(async () => []);

        const instance = new TestWorkerInstance(
            transport,
            compile as any,
            beforeCompile as any,
            {localWorker: true},
        );

        await instance.kill();
    });
});
