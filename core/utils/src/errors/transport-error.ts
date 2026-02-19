import {TestringError} from './testring-error';
import type {ErrorContext} from './types';

/**
 * Error for transport-related failures
 */
export class TransportError extends TestringError {
    constructor(message: string, context?: ErrorContext | string) {
        super(message, context);
        // Error.name is automatically set to "TransportError" via class inheritance
    }
}
