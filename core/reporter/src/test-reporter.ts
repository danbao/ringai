import type { ITestReporter, IReporterOptions } from './interfaces.js';

/**
 * Base class for all reporters providing common functionality
 */
export abstract class TestReporter implements ITestReporter {
    public name: string = 'base';
    public output: NodeJS.WriteStream;
    public colors: boolean;
    public verbose: boolean;
    
    constructor(options: IReporterOptions = {}) {
        this.output = options.output || process.stdout;
        this.colors = options.colors !== false;
        this.verbose = options.verbose || false;
    }
    
    /**
     * Called when test run starts
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onStart(runInfo: { startTime: number; tests: unknown[] }): void {
        // Default no-op - override in subclasses
    }
    
    /**
     * Called when a test passes
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onTestPass(test: unknown): void {
        // Default no-op - override in subclasses
    }
    
    /**
     * Called when a test fails
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onTestFail(test: unknown): void {
        // Default no-op - override in subclasses
    }
    
    /**
     * Called when a test is skipped
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onTestSkip(test: unknown): void {
        // Default no-op - override in subclasses
    }
    
    /**
     * Called when a test is pending
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onTestPending(test: unknown): void {
        // Default no-op - override in subclasses
    }
    
    /**
     * Called when test run ends
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onEnd(result: unknown): void {
        // Default no-op - override in subclasses
    }
    
    /**
     * Called when there's a runner error
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onError(error: Error): void {
        // Default no-op - override in subclasses
    }
    
    /**
     * Write a string to the output
     */
    protected write(text: string): void {
        this.output.write(text);
    }
    
    /**
     * Write a string with newline to the output
     */
    protected writeln(text: string = ''): void {
        this.output.write(text + '\n');
    }
    
    /**
     * Get color codes (simple implementation)
     */
    protected getColor(color: string): string {
        if (!this.colors) return '';
        
        const colors: Record<string, string> = {
            reset: '\x1b[0m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            cyan: '\x1b[36m',
            gray: '\x1b[90m',
            bold: '\x1b[1m',
        };
        
        return colors[color] || '';
    }
    
    /**
     * Apply color to text
     */
    protected colorize(color: string, text: string): string {
        const colorCode = this.getColor(color);
        const resetCode = this.getColor('reset');
        return `${colorCode}${text}${resetCode}`;
    }
    
    /**
     * Format duration in human-readable format
     */
    protected formatDuration(ms: number): string {
        if (ms < 1000) {
            return `${ms}ms`;
        } else if (ms < 60000) {
            return `${(ms / 1000).toFixed(2)}s`;
        } else {
            const minutes = Math.floor(ms / 60000);
            const seconds = ((ms % 60000) / 1000).toFixed(0);
            return `${minutes}m ${seconds}s`;
        }
    }
    
    /**
     * Cleanup method - override in subclasses
     */
    async close(): Promise<void> {
        // Default no-op
    }
}
