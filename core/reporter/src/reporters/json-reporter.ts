import { TestReporter } from '../test-reporter.js';
import type { ITestResult, IReporterOptions, ITestRunResult } from '../interfaces.js';

/**
 * JSON reporter - outputs test results in JSON format
 * Useful for CI systems and programmatic processing
 */
export class JsonReporter extends TestReporter {
    public override name = 'json';
    
    private startTime: number = 0;
    private tests: ITestResult[] = [];
    private passCount: number = 0;
    private failCount: number = 0;
    private skipCount: number = 0;
    private pendingCount: number = 0;
    
    constructor(options: IReporterOptions = {}) {
        super(options);
    }
    
    override onStart(runInfo: { startTime: number; tests: unknown[] }): void {
        this.startTime = runInfo.startTime;
        this.tests = [];
        this.passCount = 0;
        this.failCount = 0;
        this.skipCount = 0;
        this.pendingCount = 0;
    }
    
    override onTestPass(test: ITestResult): void {
        this.passCount++;
        this.tests.push(test);
    }
    
    override onTestFail(test: ITestResult): void {
        this.failCount++;
        this.tests.push(test);
    }
    
    override onTestSkip(test: ITestResult): void {
        this.skipCount++;
        this.tests.push(test);
    }
    
    override onTestPending(test: ITestResult): void {
        this.pendingCount++;
        this.tests.push(test);
    }
    
    override onEnd(result: ITestRunResult): void {
        // Build the JSON output
        const output = {
            stats: {
                suites: 1,
                tests: result.state.total,
                passes: this.passCount,
                failures: this.failCount,
                skipped: this.skipCount,
                pending: this.pendingCount,
                retries: result.state.retries,
                start: new Date(this.startTime).toISOString(),
                end: new Date(result.endTime).toISOString(),
                duration: result.duration,
            },
            tests: this.tests.map(test => ({
                title: test.title,
                fullTitle: test.fullTitle,
                state: test.status,
                duration: test.duration,
                file: test.file.path,
                error: test.error ? {
                    message: test.error.message,
                    stack: test.error.stack,
                } : undefined,
                retries: test.retries,
                startTime: new Date(test.startTime).toISOString(),
                endTime: new Date(test.endTime).toISOString(),
            })),
            success: result.success,
            error: result.error,
        };
        
        // Write JSON output
        this.writeln(JSON.stringify(output, null, 2));
    }
}
