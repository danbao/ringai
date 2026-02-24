import * as chai from 'chai';
import {vi} from 'vitest';

import {TestWorkerTinypool} from '../src/test-worker-tinypool';
import {TestStatus, TestWorkerAction} from '@ringai/types';

// Mock tinypool to avoid spinning real worker_threads
const runMock = vi.fn();
const destroyMock = vi.fn();
const tinypoolCtorMock = vi.fn();

vi.mock('tinypool', () => {
    return {
        default: function Tinypool(options: any) {
            tinypoolCtorMock(options);
            return {
                run: runMock,
                destroy: destroyMock,
            };
        },
    };
});

describe('TestWorkerTinypool', () => {
    it('init should create Tinypool with expected options', async () => {
        const transport = {send: vi.fn()} as any;
        const worker = new TestWorkerTinypool(transport, '/abs/worker-script.js');

        await worker.init();

        chai.expect(tinypoolCtorMock.mock.calls.length).to.equal(1);
        const options = tinypoolCtorMock.mock.calls[0][0];
        chai.expect(options.filename).to.equal('/abs/worker-script.js');
        chai.expect(options.maxThreads).to.equal(4);
        chai.expect(options.minThreads).to.equal(1);
    });

    it('executeTest should send done status when pool resolves success', async () => {
        const transport = {send: vi.fn()} as any;
        const worker = new TestWorkerTinypool(transport, '/abs/worker-script.js');
        await worker.init();

        runMock.mockResolvedValueOnce({success: true});

        await worker.executeTest({id: 1});

        chai.expect(transport.send.mock.calls.length).to.equal(1);
        const [, action, message] = transport.send.mock.calls[0];
        chai.expect(action).to.equal(TestWorkerAction.executionComplete);
        chai.expect(message.status).to.equal(TestStatus.done);
    });

    it('executeTest should send failed status when pool resolves success=false', async () => {
        const transport = {send: vi.fn()} as any;
        const worker = new TestWorkerTinypool(transport, '/abs/worker-script.js');
        await worker.init();

        const err = new Error('no');
        runMock.mockResolvedValueOnce({success: false, error: err});

        await worker.executeTest({id: 2});

        chai.expect(transport.send.mock.calls.length).to.equal(1);
        const [, action, message] = transport.send.mock.calls[0];
        chai.expect(action).to.equal(TestWorkerAction.executionComplete);
        chai.expect(message.status).to.equal(TestStatus.failed);
        chai.expect(message.error).to.equal(err);
    });

    it('executeTest should send failed status when pool.run throws', async () => {
        const transport = {send: vi.fn()} as any;
        const worker = new TestWorkerTinypool(transport, '/abs/worker-script.js');
        await worker.init();

        runMock.mockRejectedValueOnce(new Error('boom'));

        await worker.executeTest({id: 3});

        chai.expect(transport.send.mock.calls.length).to.equal(1);
        const [, action, message] = transport.send.mock.calls[0];
        chai.expect(action).to.equal(TestWorkerAction.executionComplete);
        chai.expect(message.status).to.equal(TestStatus.failed);
        chai.expect(message.error).to.be.instanceOf(Error);
        chai.expect(String(message.error.message)).to.include('boom');
    });

    it('kill should destroy pool, emit exit and be safe when called twice', async () => {
        const transport = {send: vi.fn()} as any;
        const worker = new TestWorkerTinypool(transport, '/abs/worker-script.js');
        await worker.init();

        const onExit = vi.fn();
        worker.on('exit', onExit);

        await worker.kill();
        await worker.kill();

        chai.expect(destroyMock.mock.calls.length).to.equal(1);
        chai.expect(onExit.mock.calls.length).to.equal(2);
    });
});
