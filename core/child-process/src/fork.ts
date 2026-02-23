import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import process from 'node:process';
import { createRequire } from 'node:module';
import {getAvailablePort} from '@ringai/utils';
import {IChildProcessForkOptions, IChildProcessFork} from '@ringai/types';
import {spawn} from './spawn';
import {ChildProcess} from 'child_process';

interface ChildProcessExtension extends ChildProcess {
    debugPort: number | null;
}

function getNumberRange(start: number, end: number): Array<number> {
    const length = start - end;

    return Array.from({length}, (_, i) => i + start);
}

let _tsxPath: string | null = null;
function resolveTsxImportPath(): string {
    if (_tsxPath) return _tsxPath;
    try {
        const esmRequire = createRequire(new URL('file://' + process.cwd() + '/package.json'));
        _tsxPath = esmRequire.resolve('tsx/esm');
        return _tsxPath;
    } catch {
        // fallback
    }
    try {
        const esmRequire = createRequire(import.meta.url);
        _tsxPath = esmRequire.resolve('tsx/esm');
        return _tsxPath;
    } catch {
        // fallback
    }
    _tsxPath = 'tsx/esm';
    return _tsxPath;
}

const PREFERRED_DEBUG_PORTS: Array<number> = [
    9229,
    9222,
    ...getNumberRange(9230, 9240),
];
const DEFAULT_FORK_OPTIONS: IChildProcessForkOptions = {
    debug: false,
    debugPortRange: PREFERRED_DEBUG_PORTS,
};

function getTsEnv(filePath: string): Record<string, string | undefined> | undefined {
    const extension = path.extname(filePath);
    if (extension === '.ts') {
        const tsxPath = resolveTsxImportPath();
        const tsxUrl = tsxPath.startsWith('file://') ? tsxPath : pathToFileURL(tsxPath).href;
        return {
            NODE_OPTIONS: `--import ${tsxUrl}`,
        };
    }
    return undefined;
}

const getForkOptions = (
    options: Partial<IChildProcessForkOptions>,
): IChildProcessForkOptions => ({
    ...DEFAULT_FORK_OPTIONS,
    ...options,
});

export async function fork(
    filePath: string,
    args: Array<string> = [],
    options: Partial<IChildProcessForkOptions> = {},
): Promise<IChildProcessFork> {
    const mergedOptions = getForkOptions(options);
    const childArg = `--ringai-parent-pid=${process.pid}`;

    const processArgs: Array<string> = [];
    let debugPort: number | null = null;

    if (mergedOptions.debug) {
        debugPort = await getAvailablePort(mergedOptions.debugPortRange);
        processArgs.push(`--inspect-brk=${debugPort}`);
    }

    const env = getTsEnv(filePath);

    const childProcess: ChildProcess = spawn(process.execPath, [
        ...processArgs,
        filePath,
        childArg,
        ...args,
    ], env);

    const childProcessExtended = childProcess as ChildProcessExtension;
    childProcessExtended.debugPort = debugPort;

    return childProcessExtended;
}
