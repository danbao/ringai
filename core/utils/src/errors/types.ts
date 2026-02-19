/**
 * Error context interface for structured error information
 */
export interface ErrorContext {
    /**
     * Optional error code for programmatic error handling
     */
    code?: string;

    /**
     * Optional context identifier (e.g., worker ID, plugin name)
     */
    contextId?: string;

    /**
     * Optional additional context data
     */
    metadata?: Record<string, unknown>;

    /**
     * Optional cause of the error (chained errors)
     */
    cause?: Error;
}
