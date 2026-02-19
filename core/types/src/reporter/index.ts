/**
 * Reporter types for testring
 */

export const enum ReporterPlugins {
    onStart = 'onStart',
    onTestPass = 'onTestPass',
    onTestFail = 'onTestFail',
    onTestSkip = 'onTestSkip',
    onTestPending = 'onTestPending',
    onEnd = 'onEnd',
    onError = 'onError',
}

export interface IReporterConfig {
    reporter: string;
    options?: Record<string, unknown>;
}

export interface ITestResult {
    id: string;
    title: string;
    fullTitle: string;
    state: 'passed' | 'failed' | 'pending' | 'skipped';
    duration: number;
    error?: Error;
    retries: number;
    startTime: number;
    endTime: number;
}

export interface ITestStats {
    suites: number;
    tests: number;
    passes: number;
    failures: number;
    skipped: number;
    pending: number;
    retries: number;
    startTime: string;
    endTime: string;
    duration: number;
}

export interface ITestReport {
    stats: ITestStats;
    tests: ITestResult[];
    success: boolean;
    error?: string;
}
