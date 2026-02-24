const { spawn } = require('child_process');
const { promisify } = require('util');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const execAsync = promisify(exec);

/**
 * Integration test utilities
 */
class IntegrationTestUtils {
    /**
     * Run a ringai command and capture output
     * @param {string[]} args - Command arguments
     * @param {Object} options - Spawn options
     * @returns {Promise<{code: number, stdout: string, stderr: string}>}
     */
    static runRingaiCommand(args, options = {}) {
        return new Promise((resolve, reject) => {
            const defaultOptions = {
                cwd: path.resolve(__dirname, '../..'),
                stdio: 'pipe',
                ...options
            };

            const process = spawn('ringai', args, defaultOptions);
            
            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            process.on('exit', (code) => {
                resolve({ code, stdout, stderr });
            });

            process.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Run a pnpm script and capture output
     * @param {string} script - pnpm script name
     * @param {Object} options - Spawn options
     * @returns {Promise<{code: number, stdout: string, stderr: string}>}
     */
    static runNpmScript(script, options = {}) {
        return new Promise((resolve, reject) => {
            const defaultOptions = {
                cwd: path.resolve(__dirname, '../..'),
                stdio: 'pipe',
                ...options
            };

            const process = spawn('pnpm', ['run', script], defaultOptions);
            
            let stdout = '';
            let stderr = '';

            process.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            process.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            process.on('exit', (code) => {
                resolve({ code, stdout, stderr });
            });

            process.on('error', (error) => {
                reject(error);
            });
        });
    }

    /**
     * Create a temporary test file
     * @param {string} filename - File name
     * @param {string} content - File content
     * @returns {string} - Full path to created file
     */
    static createTempTestFile(filename, content) {
        const filePath = path.resolve(__dirname, `../${filename}`);
        fs.writeFileSync(filePath, content);
        return filePath;
    }

    /**
     * Create a temporary config file
     * @param {string} filename - File name
     * @param {Object} config - Configuration object
     * @returns {string} - Full path to created file
     */
    static createTempConfigFile(filename, config) {
        const filePath = path.resolve(__dirname, `../${filename}`);
        const content = `module.exports = ${JSON.stringify(config, null, 2)};`;
        fs.writeFileSync(filePath, content);
        return filePath;
    }

    /**
     * Clean up temporary files
     * @param {string[]} filePaths - Array of file paths to delete
     */
    static cleanupTempFiles(filePaths) {
        filePaths.forEach(filePath => {
            try {
                fs.unlinkSync(filePath);
            } catch (error) {
                // Ignore cleanup errors
                console.warn(`Failed to cleanup ${filePath}:`, error.message);
            }
        });
    }

    /**
     * Get current browser process count
     * @returns {Promise<number>} - Number of browser processes
     */
    static async getBrowserProcessCount() {
        try {
            const { stdout } = await execAsync('pgrep -f "playwright.*chrom" | wc -l');
            return parseInt(stdout.trim());
        } catch (error) {
            return 0; // No processes found or command failed
        }
    }

    /**
     * Kill all browser processes
     * @returns {Promise<void>}
     */
    static async killAllBrowserProcesses() {
        try {
            await execAsync('pkill -9 -f "playwright.*chrom" 2>/dev/null || true');
        } catch (error) {
            // Ignore errors - processes might not exist
        }
    }

    /**
     * Wait for a condition to be true
     * @param {Function} condition - Function that returns boolean
     * @param {number} timeout - Timeout in milliseconds
     * @param {number} interval - Check interval in milliseconds
     * @returns {Promise<boolean>} - True if condition met, false if timeout
     */
    static async waitForCondition(condition, timeout = 10000, interval = 500) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (await condition()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        return false;
    }

    /**
     * Monitor resource usage during test execution
     * @param {Function} testFunction - Function to execute while monitoring
     * @returns {Promise<{maxMemory: number, executionTime: number, result: any}>}
     */
    static async monitorResourceUsage(testFunction) {
        const startTime = Date.now();
        let maxMemory = 0;
        
        const memoryInterval = setInterval(() => {
            const memUsage = process.memoryUsage();
            const currentMemory = memUsage.heapUsed / 1024 / 1024; // MB
            maxMemory = Math.max(maxMemory, currentMemory);
        }, 100);

        try {
            const result = await testFunction();
            const executionTime = Date.now() - startTime;
            
            clearInterval(memoryInterval);
            
            return {
                maxMemory,
                executionTime,
                result
            };
        } catch (error) {
            clearInterval(memoryInterval);
            throw error;
        }
    }

    /**
     * Create a test that should fail
     * @param {string} errorMessage - Expected error message
     * @returns {string} - Test content
     */
    static createFailingTest(errorMessage = 'This test should fail') {
        return `
            const { run } = require('@ringai/e2e-test-app/test/utils');

            run(async (api) => {
                const app = api.application;
                await app.assert.equal(1, 2, '${errorMessage}');
            });
        `;
    }

    /**
     * Create a test that should timeout
     * @param {number} delay - Delay in milliseconds
     * @returns {string} - Test content
     */
    static createTimeoutTest(delay = 10000) {
        return `
            const { run } = require('@ringai/e2e-test-app/test/utils');

            run(async (api) => {
                await new Promise(resolve => setTimeout(resolve, ${delay}));
            });
        `;
    }

    /**
     * Validate test output contains expected patterns
     * @param {string} output - Test output to validate
     * @param {string[]} expectedPatterns - Array of expected patterns
     * @returns {boolean} - True if all patterns found
     */
    static validateOutput(output, expectedPatterns) {
        return expectedPatterns.every(pattern => {
            const regex = new RegExp(pattern, 'i');
            return regex.test(output);
        });
    }
}

module.exports = IntegrationTestUtils;
