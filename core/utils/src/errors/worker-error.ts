import {TestringError} from './testring-error';
import type {ErrorContext} from './types';

/**
 * Error for worker-related failures
 */
export class WorkerError extends TestringError {
    constructor(message: string, context?: ErrorContext | string) {
        super(message, context);
        // Error.name is automatically set to "WorkerError" via class inheritance
    }
}
