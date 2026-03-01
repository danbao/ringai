import os from 'node:os';
import { TestReporter } from '../test-reporter.js';
import type { ITestResult, IReporterOptions, ITestRunResult } from '../interfaces.js';

type ErrorCategory = 'assertion' | 'timeout' | 'network' | 'element' | 'script' | 'unknown';

interface IAITestError {
    message: string;
    type: string;
    stack: string;
    category: ErrorCategory;
}

interface IAITestEntry {
    id: string;
    title: string;
    fullTitle: string;
    file: string;
    status: 'passed' | 'failed' | 'skipped' | 'flaky';
    duration: number;
    retries: number;
    error?: IAITestError;
    artifacts: {
        screenshot?: string;
        trace?: string;
        video?: string;
    };
}

interface IAITestReport {
    meta: {
        framework: string;
        version: string;
        timestamp: string;
        environment: {
            os: string;
            nodeVersion: string;
            arch: string;
        };
    };
    summary: {
        total: number;
        passed: number;
        failed: number;
        skipped: number;
        flaky: number;
        duration: number;
        successRate: number;
    };
    tests: IAITestEntry[];
}

function categorizeError(error: Error): ErrorCategory {
    const msg = error.message.toLowerCase();
    const stack = (error.stack ?? '').toLowerCase();

    if (msg.includes('assert') || msg.includes('expect') || msg.includes('equal')) {
        return 'assertion';
    }
    if (msg.includes('timeout') || msg.includes('timed out') || msg.includes('exceeded')) {
        return 'timeout';
    }
    if (msg.includes('net::') || msg.includes('econnrefused') || msg.includes('fetch') || msg.includes('network')) {
        return 'network';
    }
    if (msg.includes('selector') || msg.includes('locator') || msg.includes('element') || msg.includes('not found') || stack.includes('waitfor')) {
        return 'element';
    }
    if (msg.includes('syntaxerror') || msg.includes('referenceerror') || msg.includes('typeerror') || msg.includes('cannot read')) {
        return 'script';
    }
    return 'unknown';
}

/**
 * AI-optimized JSON reporter that outputs structured data
 * designed for consumption by LLMs and automated analysis tools.
 *
 * Features:
 * - Error categorization (assertion/timeout/network/element/script)
 * - Environment metadata for reproducibility
 * - Flaky test detection (passed after retries)
 * - Artifact path references per test
 * - Compact, machine-parseable structure
 *
 * Usage: --reporter ai-json
 */
export class AIJsonReporter extends TestReporter {
    public override name = 'ai-json';

    private startTime: number = 0;
    private tests: ITestResult[] = [];

    constructor(options: IReporterOptions = {}) {
        super(options);
    }

    override onStart(runInfo: { startTime: number; tests: unknown[] }): void {
        this.startTime = runInfo.startTime;
        this.tests = [];
    }

    override onTestPass(test: ITestResult): void {
        this.tests.push(test);
    }

    override onTestFail(test: ITestResult): void {
        this.tests.push(test);
    }

    override onTestSkip(test: ITestResult): void {
        this.tests.push(test);
    }

    override onTestPending(test: ITestResult): void {
        this.tests.push(test);
    }

    override onEnd(result: ITestRunResult): void {
        const flakyCount = this.tests.filter(
            t => t.status === 'passed' && t.retries > 0,
        ).length;

        const total = result.state.total;
        const passed = result.state.passed;

        const report: IAITestReport = {
            meta: {
                framework: 'ringai',
                version: '0.8.0',
                timestamp: new Date().toISOString(),
                environment: {
                    os: `${os.platform()} ${os.release()}`,
                    nodeVersion: process.version,
                    arch: os.arch(),
                },
            },
            summary: {
                total,
                passed,
                failed: result.state.failed,
                skipped: result.state.skipped,
                flaky: flakyCount,
                duration: result.duration,
                successRate: total > 0 ? Math.round((passed / total) * 10000) / 100 : 0,
            },
            tests: this.tests.map(test => {
                const entry: IAITestEntry = {
                    id: test.id,
                    title: test.title,
                    fullTitle: test.fullTitle,
                    file: test.file.path,
                    status: test.status === 'passed' && test.retries > 0 ? 'flaky' : test.status,
                    duration: test.duration,
                    retries: test.retries,
                    artifacts: {},
                };

                if (test.error) {
                    entry.error = {
                        message: test.error.message,
                        type: test.error.constructor?.name ?? 'Error',
                        stack: test.error.stack ?? '',
                        category: categorizeError(test.error),
                    };
                }

                return entry;
            }),
        };

        this.writeln(JSON.stringify(report, null, 2));
    }
}
