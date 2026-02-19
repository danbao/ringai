import {IFile} from '../fs-reader';
import {TestStatus} from './enums';

export type FileCompiler = (
    source: string,
    filename: string,
) => Promise<string>;

export interface ITestExecutionMessage extends IFile {
    waitForRelease: boolean;
    dependencies: Record<string, unknown>;
    parameters: Record<string, unknown>;
    envParameters: Record<string, unknown>;
}

export type ITestEvaluationMessage = IFile;

export interface ITestExecutionCompleteMessage {
    status: TestStatus;
    error: Error | null;
}

export interface ITestControllerExecutionState {
    paused: boolean;
    pausedTilNext: boolean;
    pending: boolean;
}
