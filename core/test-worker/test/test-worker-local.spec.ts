import * as chai from 'chai';
import {vi} from 'vitest';

import {TestWorkerLocal} from '../src/test-worker-local';
import {TestWorkerAction} from '@ringai/types';

// Mock controller so we can test routing without running real test execution
vi.mock('../src/worker/worker-controller', () => {
    return {
        WorkerController: class WorkerController {
            executeTest = vi.fn();
            constructor() {}
        },
    };
});

describe('TestWorkerLocal', () => {
    it('should route executeTest messages to workerController.executeTest', () => {
        const transport = {} as any;
        const worker = new TestWorkerLocal(transport);

        const payload = {path: 'a', content: 'b'};
        worker.send({type: TestWorkerAction.executeTest, payload} as any);

        const controller = (worker as any).workerController;
        chai.expect(controller).to.exist;

        chai.expect(controller.executeTest).to.be.a('function');
        chai.expect(controller.executeTest.mock.calls.length).to.equal(1);
        chai.expect(controller.executeTest.mock.calls[0][0]).to.deep.equal(payload);
    });

    it('kill should emit exit and can be called multiple times (idempotent)', () => {
        const transport = {} as any;
        const worker = new TestWorkerLocal(transport);

        const onExit = vi.fn();
        worker.on('exit', onExit);

        worker.kill();
        worker.kill();

        chai.expect(onExit.mock.calls.length).to.equal(2);
    });
});
