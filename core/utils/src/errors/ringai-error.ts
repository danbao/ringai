import type {ErrorContext} from './types';

/**
 * Base error class for all ringai errors
 * Provides structured error context and proper error chaining
 *
 * Usage:
 *   throw new RingaiError('Something went wrong');
 *   throw new RingaiError('Something went wrong', 'contextId');
 *   throw new RingaiError('Something went wrong', { code: 'ERR_CODE', contextId: 'worker-1' });
 *   throw new RingaiError('Something went wrong', { cause: originalError });
 */
export class RingaiError extends Error {
    public readonly code?: string;
    public readonly contextId?: string;
    public readonly metadata?: Record<string, unknown>;
    // Use override for 'cause' since it's defined in ES2022 Error
    public override readonly cause?: Error;

    constructor(
        message: string,
        context?: ErrorContext | string,
        options?: ErrorOptions,
    ) {
        // Handle overload: either pass context as string (message) or ErrorContext
        let finalMessage = message;
        let finalOptions = options;

        if (typeof context === 'string') {
            // Overload: RingaiError(message, string) - string is treated as contextId
            finalMessage = context ? `${context}: ${message}` : message;
        } else if (context && typeof context === 'object') {
            // Overload: RingaiError(message, ErrorContext)
            const ctx = context;
            if (ctx.cause) {
                finalOptions = {cause: ctx.cause, ...options};
            }
            if (ctx.code || ctx.contextId) {
                const prefix = [ctx.code, ctx.contextId].filter(Boolean).join(':');
                finalMessage = prefix ? `${prefix}: ${message}` : message;
            }
        }

        super(finalMessage, finalOptions);

        // Set Error.name to the actual subclass name (Error doesn't do this automatically)
        this.name = new.target.name;

        // Handle optional properties - assign them directly from context
        if (typeof context === 'object' && context !== null) {
            // Explicitly assign each property to avoid exactOptionalPropertyTypes issue
            const ctx = context as ErrorContext;
            if (ctx.code !== undefined) {
                this.code = ctx.code;
            }
            if (ctx.contextId !== undefined) {
                this.contextId = ctx.contextId;
            }
            if (ctx.metadata !== undefined) {
                this.metadata = ctx.metadata;
            }
            if (ctx.cause !== undefined && this.cause === undefined) {
                // Some environments might not propagate ErrorOptions.cause reliably
                Object.defineProperty(this, 'cause', {
                    value: ctx.cause,
                    writable: false,
                    configurable: true,
                    enumerable: false,
                });
            }
        } else if (typeof context === 'string') {
            this.contextId = context;
        }

        // Maintains proper stack trace in V8 environments
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    /**
     * Convert error to JSON-serializable object
     */
    toJSON(): Record<string, unknown> {
        const result: Record<string, unknown> = {
            name: this.name,
            message: this.message,
            stack: this.stack,
        };

        // Use bracket notation for index signature access
        if (this.code !== undefined) {
            result['code'] = this.code;
        }
        if (this.contextId !== undefined) {
            result['contextId'] = this.contextId;
        }
        if (this.metadata !== undefined) {
            result['metadata'] = this.metadata;
        }
        if (this.cause !== undefined) {
            result['cause'] = this.cause.toString();
        }

        return result;
    }
}
