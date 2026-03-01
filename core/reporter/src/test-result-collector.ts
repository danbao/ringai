import type { IQueuedTest, ITestWorkerCallbackMeta } from '@ringai/types';
import type { ITestResult, ITestRunResult, ITestState } from './interfaces.js';
import type { ReporterManager } from './reporter-manager.js';

/**
 * Bridges TestRunController hooks to ReporterManager events.
 *
 * Tracks per-test start times and converts IQueuedTest + error data
 * into ITestResult objects that the reporter system can consume.
 */
export class TestResultCollector {
    private testStartTimes: Map<string, number> = new Map();
    private results: ITestResult[] = [];
    private runStartTime: number = 0;
    private state: ITestState = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        pending: 0,
        retries: 0,
    };

    constructor(private reporterManager: ReporterManager) {}

    private getTestId(queuedTest: IQueuedTest): string {
        return queuedTest.test.path;
    }

    private buildTestResult(
        queuedTest: IQueuedTest,
        error: Error | null,
    ): ITestResult {
        const id = this.getTestId(queuedTest);
        const startTime = this.testStartTimes.get(id) ?? Date.now();
        const endTime = Date.now();

        const result: ITestResult = {
            id,
            file: queuedTest.test,
            title: queuedTest.test.path.split('/').pop() ?? queuedTest.test.path,
            fullTitle: queuedTest.test.path,
            status: error ? 'failed' : 'passed',
            duration: endTime - startTime,
            retries: queuedTest.retryCount,
            startTime,
            endTime,
        };

        if (error) {
            result.error = error;
        }

        return result;
    }

    /**
     * Register this collector's hooks with a TestRunController.
     * Call this after creating both the controller and the collector.
     */
    registerHooks(controller: {
        registerHook: (name: string, handler: (...args: any[]) => any) => () => void;
    }): void {
        controller.registerHook('beforeRun', (testQueue: IQueuedTest[]) => {
            this.runStartTime = Date.now();
            this.results = [];
            this.state = {
                total: testQueue.length,
                passed: 0,
                failed: 0,
                skipped: 0,
                pending: 0,
                retries: 0,
            };
            this.reporterManager.start([]);
            return testQueue;
        });

        controller.registerHook('beforeTest', (queuedTest: IQueuedTest, _meta: ITestWorkerCallbackMeta) => {
            this.testStartTimes.set(this.getTestId(queuedTest), Date.now());
        });

        controller.registerHook('afterTest', (queuedTest: IQueuedTest, error: Error | null, _meta: ITestWorkerCallbackMeta) => {
            const result = this.buildTestResult(queuedTest, error);
            this.results.push(result);

            if (error) {
                this.state.failed++;
                this.reporterManager.testFail(result);
            } else {
                this.state.passed++;
                this.reporterManager.testPass(result);
            }
        });

        controller.registerHook('beforeTestRetry', (_queuedTest: IQueuedTest, _error: Error, _meta: ITestWorkerCallbackMeta) => {
            this.state.retries++;
        });

        controller.registerHook('afterRun', (error: Error | null) => {
            const success = error === null && this.state.failed === 0;
            this.reporterManager.end(success, error?.message);
        });
    }

    getResults(): ITestResult[] {
        return [...this.results];
    }

    getRunResult(): ITestRunResult {
        const endTime = Date.now();
        return {
            startTime: this.runStartTime,
            endTime,
            duration: endTime - this.runStartTime,
            tests: this.results,
            state: { ...this.state },
            success: this.state.failed === 0,
        };
    }
}
