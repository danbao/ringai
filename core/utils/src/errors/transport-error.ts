import {RingaiError} from './ringai-error';
import type {ErrorContext} from './types';

/**
 * Error for transport-related failures
 */
export class TransportError extends RingaiError {
    constructor(message: string, context?: ErrorContext | string) {
        super(message, context);
        // Error.name is automatically set to "TransportError" via class inheritance
    }
}
