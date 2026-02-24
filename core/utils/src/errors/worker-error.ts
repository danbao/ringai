import {RingaiError} from './ringai-error';
import type {ErrorContext} from './types';

/**
 * Error for worker-related failures
 */
export class WorkerError extends RingaiError {
    constructor(message: string, context?: ErrorContext | string) {
        super(message, context);
        // Error.name is automatically set to "WorkerError" via class inheritance
    }
}
