import {TestringError} from './testring-error';
import type {ErrorContext} from './types';

/**
 * Error for plugin-related failures
 */
export class PluginError extends TestringError {
    constructor(message: string, context?: ErrorContext | string) {
        super(message, context);
        // Error.name is automatically set to "PluginError" via class inheritance
    }
}
