import type { 
    ITestReporter, 
    IReporterOptions, 
    IReporterConfig,
    BuiltInReporter,
    ITestResult,
    ITestRunResult,
    ITestState
} from './interfaces.js';
import { SpecReporter } from './reporters/spec-reporter.js';
import { DotReporter } from './reporters/dot-reporter.js';
import { JsonReporter } from './reporters/json-reporter.js';
import { AIJsonReporter } from './reporters/ai-json-reporter.js';

/**
 * Manages multiple reporters and dispatches events to them
 */
export class ReporterManager {
    private reporters: ITestReporter[] = [];
    private startTime: number = 0;
    private state: ITestState = {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        pending: 0,
        retries: 0,
    };
    private tests: ITestResult[] = [];
    
    /**
     * Built-in reporters map - use any to avoid strict constructor type issues
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private static readonly builtInReporters: Record<BuiltInReporter, any> = {
        spec: SpecReporter,
        dot: DotReporter,
        json: JsonReporter,
        'ai-json': AIJsonReporter,
        list: SpecReporter,
    };
    
    /**
     * Create a new ReporterManager
     */
    constructor(
        configs: IReporterConfig[] = [],
        defaultOptions: IReporterOptions = {}
    ) {
        for (const config of configs) {
            this.addReporter(config, defaultOptions);
        }
        
        // If no reporters added, add spec reporter by default
        if (this.reporters.length === 0) {
            this.addReporter({ reporter: 'spec' }, defaultOptions);
        }
    }
    
    /**
     * Add a reporter to the manager
     */
    addReporter(config: IReporterConfig, defaultOptions: IReporterOptions = {}): void {
        const options = { ...defaultOptions, ...config.options };
        const reporter = this.createReporter(config.reporter, options);
        this.reporters.push(reporter);
    }
    
    /**
     * Create a reporter instance
     */
    private createReporter(
        reporter: BuiltInReporter | ITestReporter | string | (new (options?: IReporterOptions) => ITestReporter),
        options: IReporterOptions
    ): ITestReporter {
        // If it's already an instance
        if (typeof reporter === 'object') {
            return reporter;
        }
        
        // If it's a class constructor
        if (typeof reporter === 'function') {
            return new reporter(options);
        }
        
        // If it's a built-in reporter name
        if (reporter in ReporterManager.builtInReporters) {
            const ReporterClass = ReporterManager.builtInReporters[reporter as BuiltInReporter];
            return new ReporterClass(options);
        }
        
        // Try to load as external module (for custom reporters)
        // This is a simplified implementation - in production you'd want more robust module loading
        throw new Error(`Unknown reporter: ${reporter}. Available built-in reporters: spec, dot, json`);
    }
    
    /**
     * Get all registered reporters
     */
    getReporters(): ITestReporter[] {
        return [...this.reporters];
    }
    
    /**
     * Notify all reporters that tests are about to run
     */
    start(tests: ITestResult[]): void {
        this.startTime = Date.now();
        this.tests = [];
        this.state = {
            total: tests.length,
            passed: 0,
            failed: 0,
            skipped: 0,
            pending: 0,
            retries: 0,
        };
        
        for (const reporter of this.reporters) {
            if (reporter.onStart) {
                reporter.onStart({ startTime: this.startTime, tests });
            }
        }
    }
    
    /**
     * Notify all reporters that a test passed
     */
    testPass(test: ITestResult): void {
        this.state.passed++;
        this.tests.push(test);
        
        for (const reporter of this.reporters) {
            if (reporter.onTestPass) {
                reporter.onTestPass(test);
            }
        }
    }
    
    /**
     * Notify all reporters that a test failed
     */
    testFail(test: ITestResult): void {
        this.state.failed++;
        this.tests.push(test);
        
        for (const reporter of this.reporters) {
            if (reporter.onTestFail) {
                reporter.onTestFail(test);
            }
        }
    }
    
    /**
     * Notify all reporters that a test was skipped
     */
    testSkip(test: ITestResult): void {
        this.state.skipped++;
        this.tests.push(test);
        
        for (const reporter of this.reporters) {
            if (reporter.onTestSkip) {
                reporter.onTestSkip(test);
            }
        }
    }
    
    /**
     * Notify all reporters that a test is pending
     */
    testPending(test: ITestResult): void {
        this.state.pending++;
        this.tests.push(test);
        
        for (const reporter of this.reporters) {
            if (reporter.onTestPending) {
                reporter.onTestPending(test);
            }
        }
    }
    
    /**
     * Notify all reporters that the test run has ended
     */
    end(success: boolean, error?: string): ITestRunResult {
        const endTime = Date.now();
        const duration = endTime - this.startTime;
        
        const result: ITestRunResult = {
            startTime: this.startTime,
            endTime,
            duration,
            tests: this.tests,
            state: { ...this.state },
            success,
        };
        
        // Only include error if it's defined (for exactOptionalPropertyTypes)
        if (error !== undefined) {
            result.error = error;
        }
        
        for (const reporter of this.reporters) {
            if (reporter.onEnd) {
                reporter.onEnd(result);
            }
        }
        
        return result;
    }
    
    /**
     * Notify all reporters about an error
     */
    error(err: Error): void {
        for (const reporter of this.reporters) {
            if (reporter.onError) {
                reporter.onError(err);
            }
        }
    }
    
    /**
     * Get current test state
     */
    getState(): ITestState {
        return { ...this.state };
    }
    
    /**
     * Close all reporters and cleanup
     */
    async close(): Promise<void> {
        await Promise.all(
            this.reporters.map(reporter => reporter.close?.() || Promise.resolve())
        );
    }
}
