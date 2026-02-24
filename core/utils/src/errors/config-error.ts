import {RingaiError} from './ringai-error';
import type {ErrorContext} from './types';

/**
 * Error for configuration-related failures
 */
export class ConfigError extends RingaiError {
    constructor(message: string, context?: ErrorContext | string) {
        super(message, context);
        // Error.name is automatically set to "ConfigError" via class inheritance
    }
}
