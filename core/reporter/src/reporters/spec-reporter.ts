import { TestReporter } from '../test-reporter.js';
import type { ITestResult, IReporterOptions } from '../interfaces.js';

/**
 * Spec reporter - displays test results in a hierarchical format
 * Similar to Mocha's spec reporter
 */
export class SpecReporter extends TestReporter {
    public override name = 'spec';
    
    private errorMessages: string[] = [];
    
    constructor(options: IReporterOptions = {}) {
        super(options);
    }
    
    override onStart(_runInfo: { startTime: number; tests: unknown[] }): void {
        this.writeln();
        this.writeln(this.colorize('bold', '  Ringai Test Runner'));
        this.writeln(this.colorize('bold', '  ='.repeat(20)));
        this.writeln();
    }
    
    override onTestPass(test: ITestResult): void {
        // Build the test hierarchy display
        const icon = this.colorize('green', '✓');
        const title = test.fullTitle || test.title;
        
        this.write(`  ${icon} `);
        this.write(title);
        
        if (test.duration > 0) {
            this.write(` ${this.colorize('gray', `(${this.formatDuration(test.duration)})`)}`);
        }
        
        this.writeln();
    }
    
    override onTestFail(test: ITestResult): void {
        const icon = this.colorize('red', '✗');
        const title = test.fullTitle || test.title;
        
        this.write(`  ${icon} `);
        this.write(this.colorize('red', title));
        this.writeln();
        
        // Show error details
        if (test.error) {
            this.errorMessages.push(test.error.message);
            
            const indent = '    ';
            const errorMessage = test.error.message;
            const errorLines = errorMessage.split('\n');
            
            for (const line of errorLines) {
                this.writeln(`${indent}${this.colorize('red', line)}`);
            }
            
            if (this.verbose && test.error.stack) {
                this.writeln(`${indent}${this.colorize('gray', test.error.stack.split('\n').slice(1, 3).join('\n'))}`);
            }
        }
    }
    
    override onTestSkip(test: ITestResult): void {
        const icon = this.colorize('yellow', '○');
        const title = test.fullTitle || test.title;
        
        this.write(`  ${icon} `);
        this.write(this.colorize('yellow', title));
        this.writeln();
    }
    
    override onTestPending(test: ITestResult): void {
        const icon = this.colorize('cyan', '⊘');
        const title = test.fullTitle || test.title;
        
        this.write(`  ${icon} `);
        this.write(this.colorize('cyan', title));
        this.writeln();
    }
    
    override onEnd(result: { 
        state: { 
            passed: number; 
            failed: number; 
            skipped: number; 
            pending: number; 
            total: number; 
            retries: number;
        }; 
        duration: number;
        success: boolean;
        error?: string;
    }): void {
        this.writeln();
        
        // Summary section
        const { state, duration, success, error } = result;
        
        this.writeln(this.colorize('bold', '  Test Summary'));
        this.writeln(this.colorize('bold', '  -'.repeat(25)));
        
        const summary = [
            `${state.passed} passed`,
        ];
        
        if (state.failed > 0) {
            summary.push(this.colorize('red', `${state.failed} failed`));
        }
        
        if (state.skipped > 0) {
            summary.push(this.colorize('yellow', `${state.skipped} skipped`));
        }
        
        if (state.pending > 0) {
            summary.push(this.colorize('cyan', `${state.pending} pending`));
        }
        
        if (state.retries > 0) {
            summary.push(`${state.retries} retries`);
        }
        
        this.writeln(`  ${summary.join(', ')}`);
        this.writeln(`  Total: ${state.total} tests`);
        this.writeln(`  Duration: ${this.formatDuration(duration)}`);
        
        if (error) {
            this.writeln();
            this.writeln(this.colorize('red', `  Error: ${error}`));
        }
        
        this.writeln();
        
        // Exit code indicator
        if (success) {
            this.writeln(this.colorize('green', '  ✓ Tests passed'));
        } else {
            this.writeln(this.colorize('red', '  ✗ Tests failed'));
        }
        
        this.writeln();
    }
}
