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
    onStart(_runInfo: { startTime: number; tests: unknown[] }): void {
    }
    
    onTestPass(_test: unknown): void {
    }
    
    onTestFail(_test: unknown): void {
    }
    
    onTestSkip(_test: unknown): void {
    }
    
    onTestPending(_test: unknown): void {
    }
    
    onEnd(_result: unknown): void {
    }
    
    onError(_error: Error): void {
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
