# Ubuntu Test Failure Reporting Issue

## Problem Description

When running E2E tests in Ubuntu environment, it was discovered that tests actually failed (such as assertion errors), but the final overall report showed them as successful. This issue only occurs in Ubuntu, while other operating systems (such as macOS, Windows) work normally.

## Problem Symptoms

1. Test logs show clear failure information:
   ```
   1:40:17 PM | info | main | [step end] Test failed AssertionError: [assert] include(exp = "Success", inc = "Example")
   1:40:17 PM | error | main | [worker-controller] AssertionError: [assert] include(exp = "Success", inc = "Example")
   ```

2. But the final report shows tests as passed, not reflecting the failure status

3. CI pipeline may show green (success), despite actual test failures

## Root Cause

### 1. Process Error Propagation Issue

In `packages/e2e-test-app/src/test-runner.ts`, the child process error handling is not robust enough:

```typescript
// Original problematic code
const ringaiProcess = childProcess.exec(
    `node ${ringaiFile} ${args.join(' ')}`,
    {},
    (error, _stdout, _stderr) => {
        mockWebServer.stop();
        if (error) {
            throw error; // Error thrown here may be ignored
        }
    },
);
```

### 2. Platform-Specific Process Management Differences

Process management and error propagation mechanisms in Ubuntu/Linux differ from other operating systems, especially in CI environments.

### 3. Asynchronous Error Handling Timing Issues

There are timing races between error handling callbacks and process exit events, causing error states to be lost.

## Solution

### 1. Improve test-runner.ts Error Handling

```typescript
async function runTests() {
    await mockWebServer.start();

    return new Promise<void>((resolve, reject) => {
        const ringaiProcess = childProcess.exec(
            `node ${ringaiFile} ${args.join(' ')}`,
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

        // Add process exit event handling
        ringaiProcess.on('exit', (code, signal) => {
            console.log(`[test-runner] Process exited with code: ${code}, signal: ${signal}`);
            if (code !== 0 && code !== null) {
                const error = new Error(`Test process exited with non-zero code: ${code}`);
                (error as any).code = code;
                (error as any).signal = signal;
                mockWebServer.stop();
                reject(error);
            }
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
```

### 2. Improve CLI Error Handling

In `core/cli/src/commands/runCommand.ts`:

```typescript
if (testRunResult) {
    this.logger.error('Found errors:');

    testRunResult.forEach((error, index) => {
        this.logger.error(`Error ${index + 1}:`, error.message);
        this.logger.error('Stack:', error.stack);
    });

    const errorMessage = `Failed ${testRunResult.length}/${tests.length} tests.`;
    this.logger.error(errorMessage);
    
    // Ensure correct exit code is set
    const error = new Error(errorMessage);
    (error as any).exitCode = 1;
    (error as any).testFailures = testRunResult.length;
    (error as any).totalTests = tests.length;
    
    throw error;
}
```

### 3. Platform-Specific Handling

Add special handling for Linux/Ubuntu:

```typescript
// More strict error detection in Linux/Ubuntu CI environment
if (isLinux && isCI) {
    if ((code !== 0 && code !== null) || signal) {
        const error = new Error(`Test process exited with non-zero code: ${code}, signal: ${signal}`);
        (error as any).code = code;
        (error as any).signal = signal;
        mockWebServer.stop();
        reject(error);
        return;
    }
}
```

## Verification

Use the provided test script to verify the fix:

```bash
node test-error-handling.js
```

This script will:
1. Run tests that are known to fail
2. Check if failures are correctly reported
3. Verify that improved error logs exist

## Prevention Measures

1. **Monitor CI Logs**: Regularly check CI logs to ensure test failures are correctly reported
2. **Use Strict Mode**: Use `--bail` parameter in CI environment to stop immediately when tests fail
3. **Add Health Checks**: Add additional validation steps in CI pipeline
4. **Platform Testing**: Ensure error handling mechanisms are tested on all target platforms

## Related Files

- `packages/e2e-test-app/src/test-runner.ts` - Main fix
- `core/cli/src/commands/runCommand.ts` - CLI error handling improvements
- `core/cli/src/index.ts` - Main entry error handling
- `core/test-run-controller/src/test-run-controller.ts` - Test controller improvements
