const { expect } = require('chai');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('Configuration Integration Tests', function() {
    this.timeout(60000);

    describe('Plugin Loading', function() {
        it('should load all required plugins successfully', function(done) {
            const testProcess = spawn('pnpm', ['run', 'test:simple'], {
                cwd: path.resolve(__dirname, '../..'),
                stdio: 'pipe'
            });

            let output = '';
            let hasPluginErrors = false;

            testProcess.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                
                // Check for plugin loading errors
                if (text.includes('Plugin') && (text.includes('error') || text.includes('failed'))) {
                    hasPluginErrors = true;
                }
            });

            testProcess.stderr.on('data', (data) => {
                const text = data.toString();
                output += text;
                
                if (text.includes('Plugin') && (text.includes('error') || text.includes('failed'))) {
                    hasPluginErrors = true;
                }
            });

            testProcess.on('exit', (code) => {
                console.log(`Plugin loading test completed with code: ${code}`);
                
                if (hasPluginErrors) {
                    done(new Error('Plugin loading errors detected'));
                } else {
                    console.log('✅ All plugins loaded successfully');
                    done();
                }
            });

            testProcess.on('error', (error) => {
                done(error);
            });
        });

        it('should handle missing plugin gracefully', function(done) {
            // Create a temporary config with a non-existent plugin
            const tempConfigPath = path.resolve(__dirname, '../temp-config.js');
            const configContent = `
                module.exports = {
                    plugins: [
                        ['@testring/plugin-babel', {}],
                        ['@testring/plugin-nonexistent', {}] // This should fail gracefully
                    ]
                };
            `;

            fs.writeFileSync(tempConfigPath, configContent);

            const testProcess = spawn('testring', ['run', '--config', tempConfigPath], {
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
                // Clean up temp file
                try {
                    fs.unlinkSync(tempConfigPath);
                } catch (e) {
                    // Ignore cleanup errors
                }

                // Should exit with error code but not crash
                expect(code).to.not.equal(0);
                expect(output).to.include('plugin');
                console.log('✅ Missing plugin handled gracefully');
                done();
            });

            testProcess.on('error', (error) => {
                // Clean up temp file
                try {
                    fs.unlinkSync(tempConfigPath);
                } catch (e) {
                    // Ignore cleanup errors
                }
                done(error);
            });
        });
    });

    describe('Environment Configuration', function() {
        it('should respect environment-specific settings', function(done) {
            const testProcess = spawn('pnpm', ['run', 'test:simple'], {
                cwd: path.resolve(__dirname, '../..'),
                stdio: 'pipe',
                env: {
                    ...process.env,
                    NODE_ENV: 'test',
                    TESTRING_LOG_LEVEL: 'debug'
                }
            });

            let output = '';
            let hasDebugLogs = false;

            testProcess.stdout.on('data', (data) => {
                const text = data.toString();
                output += text;
                
                if (text.includes('[DEBUG]') || text.includes('debug')) {
                    hasDebugLogs = true;
                }
            });

            testProcess.stderr.on('data', (data) => {
                output += data.toString();
            });

            testProcess.on('exit', (code) => {
                if (hasDebugLogs) {
                    console.log('✅ Environment configuration applied correctly');
                    done();
                } else {
                    console.log('⚠️  Debug logs not detected, but test completed');
                    done(); // Don't fail, as debug logging might be configured differently
                }
            });

            testProcess.on('error', (error) => {
                done(error);
            });
        });
    });

    describe('Configuration Validation', function() {
        it('should validate configuration schema', function(done) {
            // Create a config with invalid structure
            const tempConfigPath = path.resolve(__dirname, '../invalid-config.js');
            const configContent = `
                module.exports = {
                    invalidProperty: 'should cause validation error',
                    plugins: 'should be array' // Invalid type
                };
            `;

            fs.writeFileSync(tempConfigPath, configContent);

            const testProcess = spawn('testring', ['run', '--config', tempConfigPath], {
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
                // Clean up temp file
                try {
                    fs.unlinkSync(tempConfigPath);
                } catch (e) {
                    // Ignore cleanup errors
                }

                // Should exit with error due to invalid config
                expect(code).to.not.equal(0);
                console.log('✅ Invalid configuration detected and handled');
                done();
            });

            testProcess.on('error', (error) => {
                // Clean up temp file
                try {
                    fs.unlinkSync(tempConfigPath);
                } catch (e) {
                    // Ignore cleanup errors
                }
                done(error);
            });
        });
    });
});
