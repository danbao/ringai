import type { IFile } from '@ringai/types';

/**
 * Represents the current state of a test run
 */
export interface ITestState {
    /**
     * Total number of tests
     */
    total: number;
    
    /**
     * Number of passed tests
     */
    passed: number;
    
    /**
     * Number of failed tests
     */
    failed: number;
    
    /**
     * Number of skipped tests
     */
    skipped: number;
    
    /**
     * Number of pending tests
     */
    pending: number;
    
    /**
     * Number of retries performed
     */
    retries: number;
}

/**
 * Represents a single test result
 */
export interface ITestResult {
    /**
     * Unique identifier for the test
     */
    id: string;
    
    /**
     * Test file information
     */
    file: IFile;
    
    /**
     * Test name/description
     */
    title: string;
    
    /**
     * Full test title including describe blocks
     */
    fullTitle: string;
    
    /**
     * Test status
     */
    status: 'passed' | 'failed' | 'pending' | 'skipped';
    
    /**
     * Test duration in milliseconds
     */
    duration: number;
    
    /**
     * Error object if test failed
     */
    error?: Error;
    
    /**
     * Number of retries attempted
     */
    retries: number;
    
    /**
     * Timestamp when test started
     */
    startTime: number;
    
    /**
     * Timestamp when test ended
     */
    endTime: number;
}

/**
 * Represents the complete test run result
 */
export interface ITestRunResult {
    /**
     * Test run start timestamp
     */
    startTime: number;
    
    /**
     * Test run end timestamp
     */
    endTime: number;
    
    /**
     * Total duration in milliseconds
     */
    duration: number;
    
    /**
     * Test results
     */
    tests: ITestResult[];
    
    /**
     * Current test state
     */
    state: ITestState;
    
    /**
     * Whether the test run was successful
     */
    success: boolean;
    
    /**
     * Error message if run failed
     */
    error?: string;
}

/**
 * Reporter options
 */
export interface IReporterOptions {
    /**
     * Output stream (default: process.stdout)
     */
    output?: NodeJS.WriteStream;
    
    /**
     * Color output enabled (default: true)
     */
    colors?: boolean;
    
    /**
     * Verbose output (default: false)
     */
    verbose?: boolean;
    
    /**
     * Reporter-specific options
     */
    [key: string]: unknown;
}

/**
 * Base interface for all reporters
 */
export interface ITestReporter {
    /**
     * Reporter name
     */
    name: string;
    
    /**
     * Called when test run starts
     */
    onStart?: (runInfo: { startTime: number; tests: ITestResult[] }) => void;
    
    /**
     * Called when a test passes
     */
    onTestPass?: (test: ITestResult) => void;
    
    /**
     * Called when a test fails
     */
    onTestFail?: (test: ITestResult) => void;
    
    /**
     * Called when a test is skipped
     */
    onTestSkip?: (test: ITestResult) => void;
    
    /**
     * Called when a test is pending
     */
    onTestPending?: (test: ITestResult) => void;
    
    /**
     * Called when test run ends
     */
    onEnd?: (result: ITestRunResult) => void;
    
    /**
     * Called when there's a runner error
     */
    onError?: (error: Error) => void;
    
    /**
     * Cleanup method
     */
    close?: () => void | Promise<void>;
}

/**
 * Reporter constructor type
 */
export type ReporterConstructor = new (options?: IReporterOptions) => ITestReporter;

/**
 * Built-in reporter names
 */
export type BuiltInReporter = 'spec' | 'dot' | 'json' | 'ai-json' | 'list';

/**
 * Reporter configuration
 */
export interface IReporterConfig {
    /**
     * Reporter name or class
     */
    reporter: BuiltInReporter | ReporterConstructor | string;
    
    /**
     * Reporter options
     */
    options?: IReporterOptions;
}
