/* eslint sonarjs/no-identical-functions: 0 */

import {describe, it, expect} from 'vitest';
import {TestWorkerMock} from '@ringai/test-utils';
import {TestRunControllerPlugins} from '@ringai/types/src/test-run-controller';
import {TestRunController} from '../src/test-run-controller';

const DEFAULT_TIMEOUT = 60 * 1000;

const generateTestFile = (index: number) => ({
    path: `qwerty-${index}.js`,
    content: `console.log(${index})`,
    meta: {},
});

const generateTestFiles = (count: number) =>
    Array.from({length: count}, (_v, i) => generateTestFile(i));

describe('TestRunController', () => {
    it('should fail if zero workers are passed', async () => {
        const workerLimit = 0;
        const config = {
            bail: false,
            workerLimit,
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(10);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);

        const errors = (await testRunController.runQueue(tests)) as Error[];

        expect(errors).toHaveLength(1);
        expect(errors[0]).toBeInstanceOf(Error);

        expect(testWorkerMock.$getSpawnedCount()).toBe(workerLimit);
    });

    it('should run spawn workers with count from according limit', async () => {
        const workerLimit = 20;
        const config = {
            bail: false,
            workerLimit,
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(40);

        const testWorkerMock = new TestWorkerMock(false, 100);
        const testRunController = new TestRunController(config, testWorkerMock);

        await testRunController.runQueue(tests);

        expect(testWorkerMock.$getSpawnedCount()).toBe(workerLimit);
    });

    it('should run only one local worker', async () => {
        const config = {
            bail: false,
            workerLimit: 'local',
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(10);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);

        await testRunController.runQueue(tests);

        expect(testWorkerMock.$getSpawnedCount()).toBe(1);
    });

    it('should run all test in one local worker', async () => {
        const testsFiledCount = 10;
        const config = {
            bail: false,
            workerLimit: 'local',
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsFiledCount);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);

        const errors = (await testRunController.runQueue(tests)) as Error[];

        expect(errors).toHaveLength(testsFiledCount);
        expect(testWorkerMock.$getSpawnedCount()).toBe(1);
    });

    it('should run spawn workers by test count, if limit is higher', async () => {
        const testsCount = 2;
        const config = {
            bail: false,
            workerLimit: 10,
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);

        await testRunController.runQueue(tests);

        expect(testWorkerMock.$getSpawnedCount()).toBe(testsCount);
    });

    it('should fail instantly, if bail flag passed', async () => {
        const config = {
            bail: true,
            workerLimit: 2,
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(2);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);

        const errors = await testRunController.runQueue(tests);

        expect(errors).toHaveLength(1);
    });

    it('should run spawn workers according the limit and complete without kill', async () => {
        const workerLimit = 20;
        const testsCount = 40;
        const config = {
            bail: false,
            workerLimit,
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);

        await testRunController.runQueue(tests);

        expect(testWorkerMock.$getSpawnedCount()).toBe(workerLimit);
        // kill is not called during normal execution — only on shutdown
        expect(testWorkerMock.$getKillCallsCount()).toBe(0);
    });

    it('should run spawn workers and kill all when kill() is called externally', async () => {
        const workerLimit = 2;
        const testsCount = 4;
        const config = {
            bail: false,
            workerLimit,
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock(false, 500);
        const testRunController = new TestRunController(config, testWorkerMock);

        const runQueue = testRunController.runQueue(tests);

        await new Promise<void>((resolve) =>
            setTimeout(() => {
                testRunController.kill();
                resolve();
            }, 100),
        );

        expect(testWorkerMock.$getSpawnedCount()).toBe(workerLimit);
        expect(testWorkerMock.$getKillCallsCount()).toBe(
            workerLimit,
        );

        await runQueue;
    });

    it('should run spawn workers and kill by testTimeout delay', async () => {
        const workerLimit = 1;
        const testsCount = 2;
        const config = {
            bail: false,
            workerLimit,
            timeout: DEFAULT_TIMEOUT,
            testTimeout: 100,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock(false, 1000);
        const testRunController = new TestRunController(config, testWorkerMock);

        const delayErrors = (await testRunController.runQueue(
            tests,
        )) as Error[];

        expect(testWorkerMock.$getSpawnedCount()).toBe(workerLimit);
        // kill is called once per timed-out test
        expect(testWorkerMock.$getKillCallsCount()).toBe(testsCount);

        expect(delayErrors).toHaveLength(testsCount);
    });

    it('should use retries when test fails', async () => {
        const testsCount = 3;
        const retriesCount = 5;
        const config = {
            workerLimit: 2,
            retryDelay: 0,
            retryCount: retriesCount,
            testTimeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);

        const errors = await testRunController.runQueue(tests);

        const executionCalls = testWorkerMock.$getExecutionCallsCount();

        // Errors are generated only when last retry has failed
        expect(errors).toHaveLength(testsCount);

        // Runner must try to run all failed test with given retries number
        expect(executionCalls).toBe(
            testsCount + testsCount * retriesCount,
        );
    });

    it('should not use retries when test fails', async () => {
        const testsCount = 3;
        const retriesCount = 5;
        const config = {
            workerLimit: 2,
            retryDelay: 0,
            retryCount: retriesCount,
            testTimeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);
        const shouldNotRetry = testRunController.getHook(
            TestRunControllerPlugins.shouldNotRetry,
        );

        if (shouldNotRetry) {
            shouldNotRetry.writeHook(
                'testPlugin',
                (state: boolean, _queueItem: unknown, {processID}: {processID: string | number}) => {
                    expect(processID).toBe(
                        testWorkerMock.$getInstanceName(),
                    );
                    expect(state).toBe(false);
                    return true;
                },
            );
        }

        const errors = await testRunController.runQueue(tests);

        const executionCalls = testWorkerMock.$getExecutionCallsCount();

        // Errors are generated only when last retry has failed
        expect(errors).toHaveLength(testsCount);

        // Runner must not try to retry tests run
        expect(executionCalls).toBe(testsCount);
    });

    it('should not start tests execution', async () => {
        const testsCount = 3;
        const retriesCount = 5;
        const config = {
            workerLimit: 2,
            retryDelay: 0,
            retryCount: retriesCount,
            testTimeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);
        const shouldNotStart = testRunController.getHook(
            TestRunControllerPlugins.shouldNotExecute,
        );

        if (shouldNotStart) {
            shouldNotStart.writeHook('testPlugin', (state: boolean) => {
                expect(state).toBe(false);
                return true;
            });
        }

        const errors = await testRunController.runQueue(tests);

        const executionCalls = testWorkerMock.$getExecutionCallsCount();

        // There should not ba any errors
        expect(errors).toBe(null);

        // Runner must not try to retry tests run
        expect(executionCalls).toBe(0);
    });

    it('should not start tests', async () => {
        const testsCount = 3;
        const retriesCount = 5;
        const config = {
            workerLimit: 2,
            retryDelay: 0,
            retryCount: retriesCount,
            testTimeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);
        const shouldNotStart = testRunController.getHook(
            TestRunControllerPlugins.shouldNotStart,
        );

        if (shouldNotStart) {
            shouldNotStart.writeHook(
                'testPlugin',
                (state: boolean, _queueItem: unknown, {processID}: {processID: string | number}) => {
                    expect(processID).toBe(
                        testWorkerMock.$getInstanceName(),
                    );
                    expect(state).toBe(false);
                    return true;
                },
            );
        }

        const errors = await testRunController.runQueue(tests);

        const executionCalls = testWorkerMock.$getExecutionCallsCount();

        // There should not ba any errors
        expect(errors).toBe(null);

        // Runner must not try to retry tests run
        expect(executionCalls).toBe(0);
    });

    it('should be matching processID meta', async () => {
        const config = {
            bail: true,
            workerLimit: 2,
            timeout: DEFAULT_TIMEOUT,
        } as any;
        const tests = generateTestFiles(2);

        const testWorkerMock = new TestWorkerMock();
        const testRunController = new TestRunController(config, testWorkerMock);
        const beforeTest = testRunController.getHook(
            TestRunControllerPlugins.beforeTest,
        );
        const afterTest = testRunController.getHook(
            TestRunControllerPlugins.afterTest,
        );

        if (beforeTest && afterTest) {
            beforeTest.readHook('testPlugin', (_entry: unknown, {processID}: {processID: string | number}) => {
                expect(processID).toBe(
                    testWorkerMock.$getInstanceName(),
                );
            });

            afterTest.writeHook('testPlugin', (_entry: unknown, _error: Error | null, {processID}: {processID: string | number}) => {
                expect(processID).toBe(
                    testWorkerMock.$getInstanceName(),
                );
            });
        }

        const errors = await testRunController.runQueue(tests);
        if (errors && errors.length > 0) {
            throw errors[0];
        }
        expect(errors).toBe(null);
    });

    it('should throw an error processID meta afterTest hook', async () => {
        const testsCount = 1;
        const config = {
            bail: true,
            workerLimit: testsCount,
            timeout: DEFAULT_TIMEOUT,
        } as any;

        const tests = generateTestFiles(testsCount);

        const testWorkerMock = new TestWorkerMock(true);
        const testRunController = new TestRunController(config, testWorkerMock);
        const beforeTest = testRunController.getHook(
            TestRunControllerPlugins.beforeTest,
        );
        const afterTest = testRunController.getHook(
            TestRunControllerPlugins.afterTest,
        );

        if (beforeTest && afterTest) {
            beforeTest.readHook('testPlugin', (_entry: unknown, {processID}: {processID: string | number}) => {
                expect(processID).toBe(
                    testWorkerMock.$getInstanceName(),
                );
            });

            afterTest.writeHook('testPlugin', (_entry: unknown, error: Error | null, {processID}: {processID: string | number}) => {
                expect(processID).toBe(
                    testWorkerMock.$getInstanceName(),
                );
                expect(error).toEqual(
                    testWorkerMock.$getErrorInstance(),
                );
            });
        }

        const errors = (await testRunController.runQueue(tests)) as Error[];
        expect(errors).toHaveLength(testsCount);
        expect(errors[0]).toEqual(
            testWorkerMock.$getErrorInstance(),
        );
    });
});
