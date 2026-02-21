#!/usr/bin/env node

/**
 * 运行测试并分析性能的综合脚本
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
    logFile: path.join(__dirname, '..', 'packages', 'e2e-test-app', 'performance-test.log'),
    testTimeout: 300000, // 5 minutes
    testCommand: 'pnpm run test:playwright:headless',
    testWorkingDir: path.join(__dirname, '..', 'packages', 'e2e-test-app')
};

// 清理旧的日志文件
function cleanupOldLogs() {
    try {
        if (fs.existsSync(CONFIG.logFile)) {
            fs.unlinkSync(CONFIG.logFile);
            console.log('🧹 Cleaned up old log file');
        }
    } catch (error) {
        console.warn('⚠️  Could not clean up old log file:', error.message);
    }
}

// 运行测试并捕获日志
function runTestsWithLogging() {
    return new Promise((resolve, reject) => {
        console.log('🚀 Starting E2E tests with performance logging...');
        console.log(`📁 Working directory: ${CONFIG.testWorkingDir}`);
        console.log(`📝 Log file: ${path.relative(process.cwd(), CONFIG.logFile)}`);
        
        // 创建日志文件的写入流
        const logStream = fs.createWriteStream(CONFIG.logFile, { flags: 'w' });
        
        // 启动测试进程
        const testProcess = spawn('pnpm', ['run', 'test:playwright:headless'], {
            cwd: CONFIG.testWorkingDir,
            stdio: ['inherit', 'pipe', 'pipe']
        });

        let hasOutput = false;

        // 捕获标准输出
        testProcess.stdout.on('data', (data) => {
            hasOutput = true;
            const output = data.toString();
            process.stdout.write(output); // 显示到控制台
            logStream.write(output); // 写入日志文件
        });

        // 捕获标准错误
        testProcess.stderr.on('data', (data) => {
            hasOutput = true;
            const output = data.toString();
            process.stderr.write(output); // 显示到控制台
            logStream.write(output); // 写入日志文件
        });

        // 处理进程结束
        testProcess.on('close', (code) => {
            logStream.end();
            
            if (hasOutput) {
                console.log(`\n✅ Test execution completed with exit code: ${code}`);
                console.log(`📄 Log saved to: ${path.relative(process.cwd(), CONFIG.logFile)}`);
                resolve({ code, hasOutput: true });
            } else {
                console.log(`\n❌ Test execution failed with exit code: ${code} (no output captured)`);
                reject(new Error(`Test process failed with code ${code} and no output`));
            }
        });

        // 处理进程错误
        testProcess.on('error', (error) => {
            logStream.end();
            console.error('❌ Failed to start test process:', error.message);
            reject(error);
        });

        // 设置超时
        setTimeout(() => {
            if (!testProcess.killed) {
                console.log('⏰ Test timeout reached, terminating process...');
                testProcess.kill('SIGTERM');
                setTimeout(() => {
                    if (!testProcess.killed) {
                        testProcess.kill('SIGKILL');
                    }
                }, 5000);
            }
        }, CONFIG.testTimeout);
    });
}

// 分析性能日志
function analyzePerformance() {
    console.log('\n🔍 Starting performance analysis...');
    
    try {
        // 运行性能分析脚本
        const analysisScript = path.join(__dirname, 'analyze-long-steps.js');
        const output = execSync(`node "${analysisScript}"`, {
            encoding: 'utf8',
            stdio: 'pipe'
        });
        
        console.log(output);
        return true;
    } catch (error) {
        console.error('❌ Performance analysis failed:', error.message);
        if (error.stdout) {
            console.log('📊 Partial analysis output:');
            console.log(error.stdout);
        }
        return false;
    }
}

// 主函数
async function main() {
    console.log('🎯 E2E Test Performance Analysis Tool');
    console.log('=====================================\n');

    try {
        // 1. 清理旧日志
        cleanupOldLogs();

        // 2. 运行测试
        const testResult = await runTestsWithLogging();
        
        // 3. 分析性能（无论测试是否成功都尝试分析）
        const analysisSuccess = analyzePerformance();
        
        // 4. 总结
        console.log('\n📋 Summary:');
        console.log('===========');
        console.log(`Tests: ${testResult.code === 0 ? '✅ Passed' : '❌ Failed'} (exit code: ${testResult.code})`);
        console.log(`Analysis: ${analysisSuccess ? '✅ Completed' : '❌ Failed'}`);
        console.log(`Log file: ${path.relative(process.cwd(), CONFIG.logFile)}`);
        
        if (fs.existsSync(path.join(__dirname, '..', 'docs', 'performance-analysis.md'))) {
            console.log(`Report: docs/performance-analysis.md`);
        }

        // 退出码：如果分析成功就返回0，否则返回测试的退出码
        process.exit(analysisSuccess ? 0 : testResult.code);
        
    } catch (error) {
        console.error('\n❌ Script execution failed:', error.message);
        
        // 即使失败也尝试运行分析（可能有部分日志）
        console.log('\n🔄 Attempting analysis with any available data...');
        analyzePerformance();
        
        process.exit(1);
    }
}

// 如果直接运行此脚本
if (require.main === module) {
    main();
}

module.exports = { runTestsWithLogging, analyzePerformance, main };
