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
        const ringaiProcess = childProcess.exec(
            `node ${ringaiFile} run ${args.join(' ')}`,
            {},
            (error, _stdout, _stderr) => {
                mockWebServer.stop();

                if (error) {
                    console.error('[test-runner] Test execution failed:', error.message);
                    console.error('[test-runner] Exit code:', error.code);
                    console.error('[test-runner] Signal:', error.signal);
                    reject(error);
                } else {
                    console.log('[test-runner] Test execution completed successfully');
                    resolve();
                }
            },
        );

        if (ringaiProcess.stdout) {
            ringaiProcess.stdout.pipe(process.stdout);
        }

        if (ringaiProcess.stderr) {
            ringaiProcess.stderr.pipe(process.stderr);
        }

        // Handle process exit events with platform-specific logic
        ringaiProcess.on('exit', (code, signal) => {
            console.log(`[test-runner] Process exited with code: ${code}, signal: ${signal}`);

            // On Linux/Ubuntu, be more aggressive about detecting failures
            if (isLinux && isCI) {
                // In CI on Linux, any non-zero exit code or signal indicates failure
                if ((code !== 0 && code !== null) || signal) {
                    const error = new Error(`Test process exited with non-zero code: ${code}, signal: ${signal}`);
                    (error as any).code = code;
                    (error as any).signal = signal;
                    mockWebServer.stop();
                    reject(error);
                    return;
                }
            } else {
                // Standard handling for other platforms
                if (code !== 0 && code !== null) {
                    const error = new Error(`Test process exited with non-zero code: ${code}`);
                    (error as any).code = code;
                    (error as any).signal = signal;
                    mockWebServer.stop();
                    reject(error);
                    return;
                }
            }

            // If we reach here and the callback hasn't been called yet,
            // wait a bit to see if the callback will be called
            setTimeout(() => {
                if (!ringaiProcess.killed) {
                    console.log('[test-runner] Process exit detected, but no callback yet. Assuming success.');
                }
            }, 100);
        });

        ringaiProcess.on('error', (error) => {
            console.error('[test-runner] Process error:', error);
            mockWebServer.stop();
            reject(error);
        });

        ringaiProcess.on('unhandledRejection', (reason, promise) => {
            // eslint-disable-next-line no-console
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });

        ringaiProcess.on('uncaughtException', (error) => {
            // eslint-disable-next-line no-console
            console.error('Uncaught Exception:', error);
        });
    });
}

runTests().catch((error) => {
    console.error('[test-runner] Fatal error:', error.message);
    console.error('[test-runner] Stack:', error.stack);
    process.exit(error.code || 1);
});
