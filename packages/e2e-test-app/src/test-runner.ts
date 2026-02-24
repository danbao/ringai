import * as childProcess from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import {MockWebServer} from './mock-web-server';
import * as path from 'node:path';
import * as os from 'node:os';

const esmRequire = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const mockWebServer = new MockWebServer();

const filenameArgIndex = process.argv.findIndex(
    (arg) => arg === __filename || path.resolve(arg) === __filename
);
const args = process.argv.slice(filenameArgIndex + 1);
const ringaiDir = path.resolve(esmRequire.resolve('ringai'), '..', '..');
const ringaiFile = path.resolve(ringaiDir, 'bin', 'ringai.cjs');

// Platform-specific configuration
const isLinux = os.platform() === 'linux';
const isCI = process.env['CI'] === 'true';

console.log(`[test-runner] Platform: ${os.platform()}, Release: ${os.release()}`);
console.log(`[test-runner] Is Linux: ${isLinux}, Is CI: ${isCI}`);

async function runTests() {
    await mockWebServer.start();

    return new Promise<void>((resolve, reject) => {
        const ringaiProcess = childProcess.spawn(
            process.execPath,
            [ringaiFile, 'run', ...args],
            {stdio: ['inherit', 'pipe', 'pipe']},
        );

        if (ringaiProcess.stdout) {
            ringaiProcess.stdout.pipe(process.stdout);
        }

        if (ringaiProcess.stderr) {
            ringaiProcess.stderr.pipe(process.stderr);
        }

        ringaiProcess.on('close', (code, signal) => {
            mockWebServer.stop();
            console.log(`[test-runner] Process exited with code: ${code}, signal: ${signal}`);

            if ((code !== 0 && code !== null) || (isLinux && isCI && signal)) {
                const error = new Error(`Test process exited with non-zero code: ${code}, signal: ${signal}`);
                (error as any).code = code;
                (error as any).signal = signal;
                reject(error);
                return;
            }

            console.log('[test-runner] Test execution completed successfully');
            resolve();
        });

        ringaiProcess.on('error', (error) => {
            console.error('[test-runner] Process error:', error);
            mockWebServer.stop();
            reject(error);
        });
    });
}

runTests().catch((error) => {
    console.error('[test-runner] Fatal error:', error.message);
    console.error('[test-runner] Stack:', error.stack);
    process.exit(error.code || 1);
});
