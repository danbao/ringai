/* eslint sonarjs/no-identical-functions: 0 */

import * as chai from 'chai';
import {createRequire} from 'node:module';
import {TransportMock} from '@ringai/test-utils';
import {testAPIController, TestAPIController} from '@ringai/api';
import {
    TestWorkerAction,
    TestStatus,
    ITestExecutionMessage,
    ITestExecutionCompleteMessage,
} from '@ringai/types';
import {WorkerController} from '../src/worker/worker-controller';

const require = createRequire(import.meta.url);
const RINGAI_API_ABSOLUTE_PATH = require.resolve('@ringai/api').replace(/\\/g, '/');

describe('WorkerController', () => {
    it('should run sync test', () => new Promise<void>((resolve, reject) => {
        const transportMock = new TransportMock();
        const nTestAPIController = new TestAPIController();
        const workerController = new WorkerController(
            transportMock,
            nTestAPIController,
        );

        workerController.init();

        transportMock.on<ITestExecutionCompleteMessage>(
            TestWorkerAction.executionComplete,
            (message) => {
                chai.expect(message.status).to.be.equal(TestStatus.done);
                chai.expect(message.error).to.be.equal(null);

                resolve();
            },
        );

        transportMock.broadcast<ITestExecutionMessage>(
            TestWorkerAction.executeTest,
            {
                waitForRelease: false,
                content: `
                function test () {}
                test();
            `,
                path: 'test.js',
                dependencies: {},
                parameters: {},
                envParameters: null,
            },
        );
    }));

    it('should fail sync test correctly', () => new Promise<void>((resolve, reject) => {
        const ERROR_TEXT = 'look ama error';

        const transportMock = new TransportMock();
        const nTestAPIController = new TestAPIController();
        const workerController = new WorkerController(
            transportMock,
            nTestAPIController,
        );

        workerController.init();

        transportMock.on<ITestExecutionCompleteMessage>(
            TestWorkerAction.executionComplete,
            (message) => {
                chai.expect(message.status).to.be.equal(TestStatus.failed);
                chai.expect(message.error).to.be.instanceof(Error);
                chai.expect((message.error as Error).message).to.be.equal(
                    ERROR_TEXT,
                );

                resolve();
            },
        );

        transportMock.broadcast<ITestExecutionMessage>(
            TestWorkerAction.executeTest,
            {
                waitForRelease: false,
                content: `throw new Error("${ERROR_TEXT}")`,
                path: 'test.js',
                dependencies: {},
                parameters: {},
                envParameters: null,
            },
        );
    }));

    it('should run async test', () => new Promise<void>((resolve, reject) => {
        const transportMock = new TransportMock();
        const workerController = new WorkerController(
            transportMock,
            testAPIController,
        );

        workerController.init();

        transportMock.on<ITestExecutionCompleteMessage>(
            TestWorkerAction.executionComplete,
            (message) => {
                chai.expect(message.status).to.be.equal(TestStatus.done);
                chai.expect(message.error).to.be.equal(null);

                resolve();
            },
        );

        transportMock.broadcast<ITestExecutionMessage>(
            TestWorkerAction.executeTest,
            {
                waitForRelease: false,
                content: `
                var api = require('${RINGAI_API_ABSOLUTE_PATH}');

                async function runMock () {
                    var fns = Array.prototype.slice.apply(arguments);
                    var bus = api.testAPIController.getBus();

                    await bus.startedTest();

                    try {
                        for (let i = 0; i < fns.length; i++) {
                            await fns[i]();
                        }
                        await bus.finishedTest();
                    } catch (err) {
                        await bus.failedTest(err);
                    }
                };

                async function test() {
                }

                runMock(test);
            `,
                path: 'test.js',
                dependencies: {},
                parameters: {},
                envParameters: null,
            },
        );
    }));

    it('should fail async test', () => new Promise<void>((resolve, reject) => {
        const ERROR_TEXT = 'look ama error';

        const transportMock = new TransportMock();
        const workerController = new WorkerController(
            transportMock,
            testAPIController,
        );

        workerController.init();

        transportMock.on<ITestExecutionCompleteMessage>(
            TestWorkerAction.executionComplete,
            (message) => {
                chai.expect(message.status).to.be.equal(TestStatus.failed);
                chai.expect(message.error).to.be.instanceof(Error);
                chai.expect((message.error as Error).message).to.be.equal(
                    ERROR_TEXT,
                );

                resolve();
            },
        );

        transportMock.broadcast<ITestExecutionMessage>(
            TestWorkerAction.executeTest,
            {
                waitForRelease: false,
                content: `
                var api = require('${RINGAI_API_ABSOLUTE_PATH}');

                async function runMock () {
                    var fns = Array.prototype.slice.apply(arguments);
                    var bus = api.testAPIController.getBus();

                    await bus.startedTest();

                    try {
                        for (let i = 0; i < fns.length; i++) {
                            await fns[i]();
                        }
                        await bus.finishedTest();
                    } catch (err) {
                        await bus.failedTest(err);
                    }
                };

                async function test() {
                    throw new Error("${ERROR_TEXT}");
                }

                runMock(test);
            `,
                path: 'test.js',
                dependencies: {},
                parameters: {},
                envParameters: null,
            },
        );
    }));

    it('should run async test with await pending in it', () => new Promise<void>((resolve, reject) => {
        const transportMock = new TransportMock();
        const workerController = new WorkerController(
            transportMock,
            testAPIController,
        );

        workerController.init();

        transportMock.on<ITestExecutionCompleteMessage>(
            TestWorkerAction.executionComplete,
            (message) => {
                chai.expect(message.status).to.be.equal(TestStatus.done);
                chai.expect(message.error).to.be.equal(null);

                resolve();
            },
        );

        transportMock.broadcast<ITestExecutionMessage>(
            TestWorkerAction.executeTest,
            {
                waitForRelease: false,
                content: `
                var api = require('${RINGAI_API_ABSOLUTE_PATH}');

                async function runMock () {
                    var fns = Array.prototype.slice.apply(arguments);
                    var bus = api.testAPIController.getBus();

                    await bus.startedTest();

                    try {
                        for (let i = 0; i < fns.length; i++) {
                            await fns[i]();
                        }
                        await bus.finishedTest();
                    } catch (err) {
                        await bus.failedTest(err);
                    }
                };

                async function test() {
                    await new Promise(resolve => setTimeout(() => resolve(), 300));
                }

                runMock(test);
            `,
                path: 'test.js',
                dependencies: {},
                parameters: {},
                envParameters: null,
            },
        );
    }));
});
