import { TestReporter } from '../test-reporter.js';
import type { ITestResult, IReporterOptions, ITestRunResult } from '../interfaces.js';

/**
 * Dot reporter - displays progress with dots
 * . = pass, F = fail, P = pending, S = skipped
 */
export class DotReporter extends TestReporter {
    public name = 'dot';
    
    private dots: string[] = [];
    private currentLineLength: number = 0;
    private readonly maxLineLength = 80;
    
    constructor(options: IReporterOptions = {}) {
        super(options);
    }
    
    override onStart(_runInfo: { startTime: number; tests: unknown[] }): void {
        this.writeln();
        this.writeln(this.colorize('bold', '  Testring Test Runner - Dot Mode'));
        this.writeln(this.colorize('bold', '  ='.repeat(20)));
        this.writeln();
    }
    
    override onTestPass(_test: ITestResult): void {
        this.addDot(this.colorize('green', '.'));
    }
    
    override onTestFail(_test: ITestResult): void {
        this.addDot(this.colorize('red', 'F'));
    }
    
    override onTestSkip(_test: ITestResult): void {
        this.addDot(this.colorize('yellow', 'S'));
    }
    
    override onTestPending(_test: ITestResult): void {
        this.addDot(this.colorize('cyan', 'P'));
    }
    
    /**
     * Add a dot to the output
     */
    private addDot(dot: string): void {
        this.dots.push(dot);
        
        if (this.currentLineLength >= this.maxLineLength) {
            this.write('\n');
            this.write('  ');
            this.currentLineLength = 0;
        }
        
        this.write(dot);
        this.currentLineLength++;
    }
    
    override onEnd(result: ITestRunResult): void {
        const { state, duration, success, error } = result;
        
        this.writeln();
        this.writeln();
        
        // Summary
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
