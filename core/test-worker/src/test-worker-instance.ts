import * as path from 'node:path';
import {loggerClient} from '@ringai/logger';
import {generateUniqId, restructureError} from '@ringai/utils';
import {
    IFile,
    ITransport,
    ITestWorkerConfig,
    ITestWorkerInstance,
    ITestExecutionMessage,
    TestWorkerAction,
    FileCompiler,
    TestEvents,
} from '@ringai/types';
import {Sandbox} from '@ringai/sandbox';
import {TestAPIController, TestContext, WebApplication} from '@ringai/api';
import {BreakStackError} from '@ringai/async-breakpoints';

const WORKER_DEFAULT_CONFIG: ITestWorkerConfig = {
    screenshots: 'disable',
    waitForRelease: false,
};

export class TestWorkerInstance implements ITestWorkerInstance {
    private config: ITestWorkerConfig;
    private compileCache: Map<string, string> = new Map();
    private workerID = `worker/${generateUniqId()}`;
    private logger = loggerClient;
    private abortController: AbortController | null = null;

    constructor(
        private transport: ITransport,
        private compile: FileCompiler,
        private beforeCompile: (
            paths: Array<string>,
            filePath: string,
            fileContent: string,
        ) => Promise<Array<string>>,
        workerConfig: Partial<ITestWorkerConfig> = {},
    ) {
        this.config = { ...WORKER_DEFAULT_CONFIG, ...workerConfig };
    }

    public async execute(
        file: IFile,
        parameters: Record<string, unknown>,
        envParameters: Record<string, unknown>,
    ): Promise<void> {
        await this.beforeCompile([], file.path, file.content);
        const compiledSource = await this.compileSource(file.content, file.path);

        const message: ITestExecutionMessage = {
            waitForRelease: this.config.waitForRelease,
            path: file.path,
            content: compiledSource,
            dependencies: {},
            parameters,
            envParameters,
        };

        await this.executeTest(message);
    }

    public getWorkerID() {
        return this.workerID;
    }

    public async kill() {
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
    }

    private async executeTest(message: ITestExecutionMessage): Promise<void> {
        this.abortController = new AbortController();
        const signal = this.abortController.signal;
        const workerAPI = new TestAPIController();

        this.transport.broadcast(TestWorkerAction.register, {});

        try {
            await this.runTest(message, workerAPI, signal);
            await this.completeSuccess(workerAPI);
        } catch (error) {
            if (error instanceof BreakStackError) {
                await this.completeSuccess(workerAPI);
            } else {
                await this.completeFailed(error as Error, workerAPI);
                throw error;
            }
        } finally {
            this.abortController = null;
        }
    }

    private async completeSuccess(api: TestAPIController): Promise<void> {
        try { await api.flushAfterRunCallbacks(); } catch { /* ignore */ }
        this.transport.broadcast(TestWorkerAction.unregister, {});
    }

    private async completeFailed(error: Error, api: TestAPIController): Promise<void> {
        this.logger.error(error?.message || error, 'Error during test execution');
        if (error?.stack) {
            this.logger.error(error.stack);
        }
        try { await api.flushAfterRunCallbacks(); } catch { /* ignore */ }
        this.transport.broadcast(TestWorkerAction.unregister, {});
    }

    private async runTest(
        message: ITestExecutionMessage,
        workerAPI: TestAPIController,
        signal: AbortSignal,
    ): Promise<void> {
        const testID = path.relative(process.cwd(), message.path);

        workerAPI.setEnvironmentParameters(message.envParameters);
        workerAPI.setTestParameters(message.parameters);
        workerAPI.setTestID(testID);

        const scopedRun = this.createScopedRun(workerAPI, signal);
        const scopedBeforeRun = (cb: any) => workerAPI.registerBeforeRunCallback(cb);
        const scopedAfterRun = (cb: any) => workerAPI.registerAfterRunCallback(cb);

        const moduleOverrides = new Map<string, any>();
        moduleOverrides.set('@ringai/api', {
            testAPIController: workerAPI,
            TestAPIController,
            TestContext,
            WebApplication,
            run: scopedRun,
            beforeRun: scopedBeforeRun,
            afterRun: scopedAfterRun,
        });
        moduleOverrides.set('ringai', {
            run: scopedRun,
            default: scopedRun,
        });

        const sandbox = new Sandbox(
            message.content,
            message.path,
            message.dependencies as any,
            moduleOverrides,
        );
        const bus = workerAPI.getBus();

        let isAsync = false;
        let finishCallback = () => { /* empty */ };
        let failCallback = (_error: Error) => { /* empty */ };

        const startHandler = () => (isAsync = true);
        const finishHandler = () => finishCallback();
        const failHandler = (error: Error) => failCallback(error);

        const removeListeners = () => {
            bus.removeListener(TestEvents.started, startHandler);
            bus.removeListener(TestEvents.finished, finishHandler);
            bus.removeListener(TestEvents.failed, failHandler);
        };

        bus.on(TestEvents.started, startHandler);
        bus.on(TestEvents.finished, finishHandler);
        bus.on(TestEvents.failed, failHandler);

        try {
            await sandbox.execute();
        } catch (err) {
            removeListeners();
            throw restructureError(err as Error);
        }

        if (isAsync) {
            return new Promise<void>((resolve, reject) => {
                const onAbort = () => {
                    removeListeners();
                    reject(new Error('Test execution aborted'));
                };

                if (signal.aborted) {
                    removeListeners();
                    reject(new Error('Test execution aborted'));
                    return;
                }

                signal.addEventListener('abort', onAbort, {once: true});

                finishCallback = () => {
                    signal.removeEventListener('abort', onAbort);
                    removeListeners();
                    resolve();
                };
                failCallback = (error) => {
                    signal.removeEventListener('abort', onAbort);
                    removeListeners();
                    reject(error);
                };
            });
        }

        removeListeners();
    }

    private createScopedRun(workerAPI: TestAPIController, signal: AbortSignal) {
        return async function run(...tests: Array<(api: any) => void | Promise<void>>) {
            const testID = workerAPI.getTestID();
            const bus = workerAPI.getBus();

            const api = new TestContext({}, workerAPI);

            workerAPI.registerAfterRunCallback(async () => {
                try { await api.end(); } catch (err) { loggerClient.error(err); }
            });

            let passed = false;
            let catchedError;
            try {
                if (signal.aborted) throw new Error('Test execution aborted');

                await bus.startedTest();
                await workerAPI.flushBeforeRunCallbacks();
                loggerClient.startStep(testID);

                for (const test of tests) {
                    if (signal.aborted) throw new Error('Test execution aborted');
                    await test.call(api, api);
                }
                passed = true;
            } catch (error) {
                catchedError = restructureError(error as Error);
            } finally {
                if (passed) {
                    loggerClient.endStep(testID, 'Test passed');
                    await bus.finishedTest();
                } else {
                    loggerClient.endStep(testID, 'Test failed', catchedError);
                    await bus.failedTest(catchedError as Error);
                }
            }
        };
    }

    private async compileSource(source: string, filename: string): Promise<string> {
        const cachedSource = this.compileCache.get(source);
        if (cachedSource) return cachedSource;

        try {
            this.logger.debug(`Compile source file ${filename}`);
            const compiledSource = await this.compile(source, filename);
            this.compileCache.set(source, compiledSource);
            return compiledSource;
        } catch (error) {
            this.logger.error(`Compilation ${filename} failed`);
            throw error;
        }
    }
}
