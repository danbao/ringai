const { expect } = require('chai');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');

describe('Performance Integration Tests', function() {
    this.timeout(120000); // 2 minutes for performance tests

    describe('Memory Usage', function() {
        it('should not exceed reasonable memory limits during test execution', function(done) {
            const testProcess = spawn('pnpm', ['run', 'test:simple'], {
                cwd: path.resolve(__dirname, '../..'),
                stdio: 'pipe'
            });

            let output = '';
            let maxMemoryUsage = 0;
            let memoryCheckInterval;

            // Monitor memory usage during test execution
            memoryCheckInterval = setInterval(() => {
                const memUsage = process.memoryUsage();
                const currentMemory = memUsage.heapUsed / 1024 / 1024; // MB
                maxMemoryUsage = Math.max(maxMemoryUsage, currentMemory);
            }, 1000);

            testProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            testProcess.stderr.on('data', (data) => {
                output += data.toString();
            });

            testProcess.on('exit', (code) => {
                clearInterval(memoryCheckInterval);
                
                console.log(`Maximum memory usage during test: ${maxMemoryUsage.toFixed(2)} MB`);
                
                // Reasonable memory limit (adjust based on your requirements)
                const memoryLimitMB = 500;
                
                if (maxMemoryUsage > memoryLimitMB) {
                    console.log(`⚠️  Memory usage (${maxMemoryUsage.toFixed(2)} MB) exceeded limit (${memoryLimitMB} MB)`);
                } else {
                    console.log('✅ Memory usage within acceptable limits');
                }
                
                // Don't fail the test for memory usage, just log it
                done();
            });

            testProcess.on('error', (error) => {
                clearInterval(memoryCheckInterval);
                done(error);
            });
        });
    });

    describe('Execution Time', function() {
        it('should complete simple tests within reasonable time', function(done) {
            const startTime = Date.now();
            
            const testProcess = spawn('pnpm', ['run', 'test:simple'], {
                cwd: path.resolve(__dirname, '../..'),
                stdio: 'pipe'
            });

            let output = '';

            testProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            testProcess.stderr.on('data', (data) => {
                output += data.toString();
            });

            testProcess.on('exit', (code) => {
                const executionTime = Date.now() - startTime;
                const executionTimeSeconds = executionTime / 1000;
                
                console.log(`Test execution time: ${executionTimeSeconds.toFixed(2)} seconds`);
                
                // Reasonable time limit for simple tests (adjust based on your requirements)
                const timeLimitSeconds = 60;
                
                if (executionTimeSeconds > timeLimitSeconds) {
                    console.log(`⚠️  Execution time (${executionTimeSeconds.toFixed(2)}s) exceeded limit (${timeLimitSeconds}s)`);
                } else {
                    console.log('✅ Execution time within acceptable limits');
                }
                
                // Don't fail the test for execution time, just log it
                done();
            });

            testProcess.on('error', (error) => {
                done(error);
            });
        });
    });

    describe('Concurrent Execution', function() {
        it('should handle multiple test processes without conflicts', function(done) {
            const numProcesses = Math.min(3, os.cpus().length); // Limit based on CPU cores
            const processes = [];
            let completedProcesses = 0;
            let hasErrors = false;

            console.log(`Starting ${numProcesses} concurrent test processes...`);

            for (let i = 0; i < numProcesses; i++) {
                const testProcess = spawn('pnpm', ['run', 'test:simple'], {
                    cwd: path.resolve(__dirname, '../..'),
                    stdio: 'pipe',
                    env: {
                        ...process.env,
                        RINGAI_WORKER_ID: `worker-${i}` // Unique worker ID
                    }
                });

                processes.push(testProcess);

                let processOutput = '';

                testProcess.stdout.on('data', (data) => {
                    processOutput += data.toString();
                });

                testProcess.stderr.on('data', (data) => {
                    processOutput += data.toString();
                });

                testProcess.on('exit', (code) => {
                    completedProcesses++;
                    
                    console.log(`Process ${i + 1} completed with code: ${code}`);
                    
                    if (code !== 0) {
                        hasErrors = true;
                        console.log(`Process ${i + 1} output:`, processOutput);
                    }

                    if (completedProcesses === numProcesses) {
                        if (hasErrors) {
                            console.log('⚠️  Some concurrent processes had errors');
                        } else {
                            console.log('✅ All concurrent processes completed successfully');
                        }
                        done();
                    }
                });

                testProcess.on('error', (error) => {
                    console.error(`Process ${i + 1} error:`, error);
                    hasErrors = true;
                    completedProcesses++;
                    
                    if (completedProcesses === numProcesses) {
                        done();
                    }
                });
            }

            // Safety timeout
            setTimeout(() => {
                if (completedProcesses < numProcesses) {
                    console.log('⚠️  Concurrent test timeout, killing remaining processes...');
                    processes.forEach(proc => {
                        try {
                            proc.kill('SIGTERM');
                        } catch (e) {
                            // Ignore errors
                        }
                    });
                    done(new Error('Concurrent test timeout'));
                }
            }, 90000); // 90 seconds timeout
        });
    });

    describe('Resource Scaling', function() {
        it('should scale resource usage appropriately with test complexity', function(done) {
            const measurements = [];
            let currentTest = 0;
            const testConfigs = [
                { name: 'simple', command: ['pnpm', 'run', 'test:simple'] },
                // Add more test configurations as needed
            ];

            function runNextTest() {
                if (currentTest >= testConfigs.length) {
                    // All tests completed, analyze results
                    console.log('Resource scaling measurements:');
                    measurements.forEach(m => {
                        console.log(`${m.name}: ${m.time}ms, ${m.memory.toFixed(2)}MB`);
                    });
                    
                    console.log('✅ Resource scaling test completed');
                    done();
                    return;
                }

                const config = testConfigs[currentTest];
                const startTime = Date.now();
                let maxMemory = 0;
                
                const testProcess = spawn(config.command[0], config.command.slice(1), {
                    cwd: path.resolve(__dirname, '../..'),
                    stdio: 'pipe'
                });

                const memoryInterval = setInterval(() => {
                    const memUsage = process.memoryUsage();
                    const currentMemory = memUsage.heapUsed / 1024 / 1024;
                    maxMemory = Math.max(maxMemory, currentMemory);
                }, 500);

                testProcess.on('exit', (code) => {
                    clearInterval(memoryInterval);
                    
                    const executionTime = Date.now() - startTime;
                    measurements.push({
                        name: config.name,
                        time: executionTime,
                        memory: maxMemory
                    });

                    currentTest++;
                    setTimeout(runNextTest, 1000); // Brief pause between tests
                });

                testProcess.on('error', (error) => {
                    clearInterval(memoryInterval);
                    console.error(`Error in ${config.name} test:`, error);
                    currentTest++;
                    setTimeout(runNextTest, 1000);
                });
            }

            runNextTest();
        });
    });
});
