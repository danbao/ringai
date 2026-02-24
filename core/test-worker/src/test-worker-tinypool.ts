/**
 * TestWorker implementation using Tinypool (worker_threads pool)
 * 
 * This is an experimental implementation that replaces child_process.fork()
 * with worker_threads for better performance and lower overhead.
 * 
 * Target: Phase 4.3 - TestWorker → Tinypool
 */

import { EventEmitter } from 'events';
import Tinypool from 'tinypool';
import { 
    ITransport, 
    TestWorkerAction, 
    IWorkerEmitter,
    ITestExecutionCompleteMessage,
    TestStatus 
} from '@ringai/types';
import { loggerClient } from '@ringai/logger';
import { generateUniqId } from '@ringai/utils';

const logger = loggerClient.withPrefix('[test-worker-tinypool]');

/**
 * TestWorkerTinypool - Uses Tinypool (worker_threads) instead of child_process.fork()
 * 
 * Benefits:
 * - Lower overhead than child_process (no separate V8 instance)
 * - Shared memory support via SharedArrayBuffer
 * - MessagePort for zero-copy transfer
 * - Automatic worker recycling and timeout management
 */
export class TestWorkerTinypool extends EventEmitter implements IWorkerEmitter {
    private pool: Tinypool | null = null;
    private workerID: string;

    constructor(
        private transport: ITransport,
        private workerScript: string
    ) {
        super();
        this.workerID = `worker/tinypool-${generateUniqId()}`;
    }

    /**
     * Initialize the Tinypool worker
     */
    public async init(): Promise<void> {
        this.pool = new Tinypool({
            filename: this.workerScript,
            // Use worker threads for better performance
            // Number of workers in the pool (default: number of CPUs)
            maxThreads: 4,
            // Minimum number of idle workers to keep
            minThreads: 1,
        });

        logger.debug(`Initialized Tinypool with worker: ${this.workerScript}`);
    }

    /**
     * Execute a test in the worker pool
     */
    public async executeTest(payload: any): Promise<void> {
        if (!this.pool) {
            throw new Error('Tinypool not initialized');
        }

        try {
            // Run the test in a worker thread
            const result = await this.pool.run({
                type: TestWorkerAction.executeTest,
                payload,
            });

            // Send completion message back to transport
            const message: ITestExecutionCompleteMessage = {
                status: result.success ? TestStatus.done : TestStatus.failed,
                error: result.error,
            };

            this.transport.send(this.workerID, TestWorkerAction.executionComplete, message);
        } catch (error) {
            const message: ITestExecutionCompleteMessage = {
                status: TestStatus.failed,
                error: error instanceof Error ? error : new Error(String(error)),
            };

            this.transport.send(this.workerID, TestWorkerAction.executionComplete, message);
        }
    }

    /**
     * Send a message to the worker
     */
    public send(message: any): boolean {
        if (message.type === TestWorkerAction.executeTest) {
            this.executeTest(message.payload);
            return true;
        }
        return false;
    }

    /**
     * Kill the worker pool
     */
    public async kill(): Promise<void> {
        if (this.pool) {
            await this.pool.destroy();
            this.pool = null;
        }
        this.emit('exit');
        logger.debug(`Killed Tinypool worker ${this.workerID}`);
    }
}

/**
 * Create a Tinypool-based worker instance
 * This can be used as an alternative to child_process.fork()
 */
export function createTinypoolWorker(
    transport: ITransport,
    workerScript: string
): TestWorkerTinypool {
    return new TestWorkerTinypool(transport, workerScript);
}
