#!/usr/bin/env node

/**
 * Analyze e2e test logs to find steps that take longer than 30 seconds
 */

// Read test log content from file
function readLogContent() {
    const fs = require('fs');
    const path = require('path');

    try {
        // Try to read the latest log file - search from root directory
        const logFiles = [
            path.join(
                __dirname,
                '..',
                'packages',
                'e2e-test-app',
                'performance-test.log',
            ), // New performance test log
            path.join(
                __dirname,
                '..',
                'packages',
                'e2e-test-app',
                'temp-performance-log.txt',
            ), // Temporary log
            path.join(
                __dirname,
                '..',
                'packages',
                'e2e-test-app',
                'e2e-test-output.log',
            ),
            path.join(
                __dirname,
                '..',
                'packages',
                'e2e-test-app',
                'e2e-test-iframe-fix.log',
            ),
            path.join(
                __dirname,
                '..',
                'packages',
                'e2e-test-app',
                'e2e-test-hybrid-fix.log',
            ),
            path.join(
                __dirname,
                '..',
                'packages',
                'e2e-test-app',
                'e2e-test-locator-api.log',
            ),
        ];

        for (const logFile of logFiles) {
            if (fs.existsSync(logFile)) {
                console.log(
                    `📖 Reading log file: ${path.relative(
                        process.cwd(),
                        logFile,
                    )}`,
                );
                return fs.readFileSync(logFile, 'utf8');
            }
        }

        // Try to get logs from recent test runs
        console.log(
            '⚠️  No existing log files found, attempting to run tests and capture logs...',
        );
        return runTestsAndCaptureLog();
    } catch (error) {
        console.error('Error reading log file:', error.message);
        return '';
    }
}

// Run tests and capture logs
function runTestsAndCaptureLog() {
    const {execSync} = require('child_process');
    const fs = require('fs');
    const path = require('path');

    try {
        console.log('🚀 Running E2E tests to generate performance data...');

        // Create temporary log file path
        const tempLogFile = path.join(
            __dirname,
            '..',
            'packages',
            'e2e-test-app',
            'temp-performance-log.txt',
        );

        // Run tests and capture output
        const testCommand =
            'cd packages/e2e-test-app && pnpm run test:playwright:headless';

        try {
            const output = execSync(testCommand, {
                encoding: 'utf8',
                stdio: 'pipe',
                timeout: 300000, // 5 minutes timeout
                cwd: path.join(__dirname, '..'),
            });

            // Save output to temporary file
            fs.writeFileSync(tempLogFile, output);
            console.log(
                `✅ Test completed, log saved to: ${path.relative(
                    process.cwd(),
                    tempLogFile,
                )}`,
            );

            return output;
        } catch (testError) {
            // Try to get output even if tests fail
            const output = testError.stdout || testError.stderr || '';
            if (output) {
                fs.writeFileSync(tempLogFile, output);
                console.log(
                    `⚠️  Tests failed but captured output: ${path.relative(
                        process.cwd(),
                        tempLogFile,
                    )}`,
                );
                return output;
            }
            throw testError;
        }
    } catch (error) {
        console.error('❌ Failed to run tests:', error.message);
        console.log(
            '❌ No log data available - tests failed and no existing log files found',
        );
        return '';
    }
}

const logContent = readLogContent();

function parseTimeFromLog(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds;
}

function formatDuration(seconds) {
    if (seconds >= 60) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
}

function analyzeLongSteps() {
    const lines = logContent
        .trim()
        .split('\n')
        .filter((line) => line.trim());
    const longSteps = [];

    // Find all lines containing [step]
    const stepLines = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('[step]') && line.match(/\d{2}:\d{2}:\d{2}/)) {
            stepLines.push({
                index: i,
                line: line,
                timeMatch: line.match(/(\d{2}:\d{2}:\d{2})/),
                time: null,
            });
        }
    }

    // Calculate time
    stepLines.forEach((step) => {
        if (step.timeMatch) {
            step.time = parseTimeFromLog(step.timeMatch[1]);
        }
    });

    // Analyze time intervals between adjacent steps
    for (let i = 0; i < stepLines.length - 1; i++) {
        const currentStep = stepLines[i];
        const nextStep = stepLines[i + 1];

        if (currentStep.time !== null && nextStep.time !== null) {
            let duration = nextStep.time - currentStep.time;

            // Handle cross-hour cases
            if (duration < 0) {
                duration += 3600; // Add one hour
            }

            // Only record steps that take 30 seconds or more
            if (duration >= 30) {
                // Extract step description
                const stepMatch = currentStep.line.match(
                    /\[step\] (.+?)(?:\s+for \d+)?$/,
                );
                const stepDescription = stepMatch
                    ? stepMatch[1]
                    : currentStep.line;

                longSteps.push({
                    startTime: currentStep.timeMatch[1],
                    endTime: nextStep.timeMatch[1],
                    duration: duration,
                    description: stepDescription.trim(),
                    fullLine: currentStep.line,
                    worker:
                        currentStep.line.match(/worker\/([^|]+)/)?.[1] ||
                        'unknown',
                });
            }
        }
    }

    return longSteps;
}

function analyzeModerateLongSteps() {
    const lines = logContent
        .trim()
        .split('\n')
        .filter((line) => line.trim());
    const longSteps = [];

    // Find all lines containing [step]
    const stepLines = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('[step]') && line.match(/\d{2}:\d{2}:\d{2}/)) {
            stepLines.push({
                index: i,
                line: line,
                timeMatch: line.match(/(\d{2}:\d{2}:\d{2})/),
                time: null,
            });
        }
    }

    // Calculate time
    stepLines.forEach((step) => {
        if (step.timeMatch) {
            step.time = parseTimeFromLog(step.timeMatch[1]);
        }
    });

    // Analyze time intervals between adjacent steps
    for (let i = 0; i < stepLines.length - 1; i++) {
        const currentStep = stepLines[i];
        const nextStep = stepLines[i + 1];

        if (currentStep.time !== null && nextStep.time !== null) {
            let duration = nextStep.time - currentStep.time;

            // Handle cross-hour cases
            if (duration < 0) {
                duration += 3600; // Add one hour
            }

            // Record steps that take more than 10 seconds
            if (duration > 10) {
                // Extract step description
                const stepMatch = currentStep.line.match(
                    /\[step\] (.+?)(?:\s+for \d+)?$/,
                );
                const stepDescription = stepMatch
                    ? stepMatch[1]
                    : currentStep.line;

                longSteps.push({
                    startTime: currentStep.timeMatch[1],
                    endTime: nextStep.timeMatch[1],
                    duration: duration,
                    description: stepDescription.trim(),
                    fullLine: currentStep.line,
                    worker:
                        currentStep.line.match(/worker\/([^|]+)/)?.[1] ||
                        'unknown',
                });
            }
        }
    }

    return longSteps.sort((a, b) => b.duration - a.duration);
}

function analyzeFiveSecondSteps() {
    const lines = logContent
        .trim()
        .split('\n')
        .filter((line) => line.trim());
    const longSteps = [];

    // Find all lines containing [step]
    const stepLines = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('[step]') && line.match(/\d{2}:\d{2}:\d{2}/)) {
            stepLines.push({
                index: i,
                line: line,
                timeMatch: line.match(/(\d{2}:\d{2}:\d{2})/),
                time: null,
            });
        }
    }

    // Calculate time
    stepLines.forEach((step) => {
        if (step.timeMatch) {
            step.time = parseTimeFromLog(step.timeMatch[1]);
        }
    });

    // Analyze time intervals between adjacent steps
    for (let i = 0; i < stepLines.length - 1; i++) {
        const currentStep = stepLines[i];
        const nextStep = stepLines[i + 1];

        if (currentStep.time !== null && nextStep.time !== null) {
            let duration = nextStep.time - currentStep.time;

            // Handle cross-hour cases
            if (duration < 0) {
                duration += 3600; // Add one hour
            }

            // Record steps that take more than 5 seconds
            if (duration > 5) {
                // Extract step description
                const stepMatch = currentStep.line.match(
                    /\[step\] (.+?)(?:\s+for \d+)?$/,
                );
                const stepDescription = stepMatch
                    ? stepMatch[1]
                    : currentStep.line;

                longSteps.push({
                    startTime: currentStep.timeMatch[1],
                    endTime: nextStep.timeMatch[1],
                    duration: duration,
                    description: stepDescription.trim(),
                    fullLine: currentStep.line,
                    worker:
                        currentStep.line.match(/worker\/([^|]+)/)?.[1] ||
                        'unknown',
                });
            }
        }
    }

    return longSteps.sort((a, b) => b.duration - a.duration);
}

function generateReport() {
    const longSteps = analyzeLongSteps();

    console.log('🔍 Analysis of E2E test steps taking longer than 30 seconds');
    console.log('='.repeat(80));
    console.log();

    // Debug information
    const fiveSecondSteps = analyzeFiveSecondSteps();
    const moderateSteps = analyzeModerateLongSteps();

    console.log('📊 Debug information:');
    console.log(
        `Total analyzed steps: ${
            logContent.split('\n').filter((line) => line.includes('[step]'))
                .length
        }`,
    );
    console.log(
        `Found ${fiveSecondSteps.length} steps taking more than 5 seconds`,
    );
    console.log(
        `Found ${moderateSteps.length} steps taking more than 10 seconds`,
    );
    console.log(`Found ${longSteps.length} steps taking more than 30 seconds`);
    console.log();

    if (longSteps.length === 0) {
        console.log('✅ No steps taking longer than 30 seconds found');

        // Show some longer steps for reference
        if (moderateSteps.length > 0) {
            console.log('\n📋 Steps taking more than 10 seconds (reference):');
            moderateSteps.slice(0, 5).forEach((step, index) => {
                console.log(
                    `${index + 1}. 🕐 Duration: ${formatDuration(
                        step.duration,
                    )}`,
                );
                console.log(
                    `   ⏰ Time range: ${step.startTime} → ${step.endTime}`,
                );
                console.log(`   👷 Worker: ${step.worker}`);
                console.log(`   � 步骤r: ${step.description}`);
                console.log();
            });
        }

        if (fiveSecondSteps.length > 0) {
            console.log('\n📋 Steps taking more than 5 seconds statistics:');
            console.log(`Total: ${fiveSecondSteps.length} steps`);
            console.log('Top 5 longest:');
            fiveSecondSteps.slice(0, 5).forEach((step, index) => {
                console.log(
                    `${index + 1}. 🕐 ${formatDuration(step.duration)} - ${
                        step.description
                    }`,
                );
            });
        }
        return;
    }

    console.log(
        `⚠️  Found ${longSteps.length} steps taking longer than 30 seconds:\n`,
    );

    // Sort by duration
    longSteps.sort((a, b) => b.duration - a.duration);

    longSteps.forEach((step, index) => {
        console.log(
            `${index + 1}. 🕐 Duration: ${formatDuration(step.duration)}`,
        );
        console.log(`   ⏰ Time range: ${step.startTime} → ${step.endTime}`);
        console.log(`   📝 Step: ${step.description}`);
        console.log();
    });

    // Statistical analysis
    console.log('📊 Statistical analysis:');
    console.log('-'.repeat(40));

    const totalLongTime = longSteps.reduce(
        (sum, step) => sum + step.duration,
        0,
    );
    const averageDuration = Math.round(totalLongTime / longSteps.length);
    const maxDuration = Math.max(...longSteps.map((step) => step.duration));

    console.log(`Total long-running steps: ${longSteps.length}`);
    console.log(`Total extra time: ${formatDuration(totalLongTime)}`);
    console.log(`Average duration: ${formatDuration(averageDuration)}`);
    console.log(`Maximum duration: ${formatDuration(maxDuration)}`);

    // Category analysis
    console.log('\n🏷️  Step type analysis:');
    console.log('-'.repeat(40));

    const categories = {};
    longSteps.forEach((step) => {
        let category = 'Other';

        if (step.description.includes('Clicking for')) {
            category = 'Click Operations';
        } else if (
            step.description.includes('Getting text') ||
            step.description.includes('Getting CSS')
        ) {
            category = 'Element Queries';
        } else if (step.description.includes('Waiting')) {
            category = 'Wait Operations';
        } else if (step.description.includes('Checking if')) {
            category = 'Element Checks';
        }

        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(step);
    });

    Object.entries(categories).forEach(([category, steps]) => {
        const totalTime = steps.reduce((sum, step) => sum + step.duration, 0);
        console.log(
            `${category}: ${steps.length} steps, total ${formatDuration(
                totalTime,
            )}`,
        );
    });

    // Problem analysis and suggestions
    console.log('\n🔧 Problem analysis and optimization suggestions:');
    console.log('='.repeat(80));

    longSteps.forEach((step, index) => {
        console.log(`\n${index + 1}. ${step.description}`);
        console.log(`   Duration: ${formatDuration(step.duration)}`);

        const {analysis, suggestion} = getAnalysisAndSuggestion(step);
        console.log(`   ${analysis}`);
        console.log(`   ${suggestion}`);
    });
}

function saveReportToFile() {
    const fs = require('fs');
    const path = require('path');

    const longSteps = analyzeLongSteps();
    const moderateSteps = analyzeModerateLongSteps();
    const fiveSecondSteps = analyzeFiveSecondSteps();

    const reportContent = `# E2E Test Long-Running Steps Analysis Report

## Execution Time
${new Date().toLocaleString('en-US')}

## Overview
- Total analyzed test steps: ${
        logContent.split('\n').filter((line) => line.includes('[step]')).length
    }
- Found ${fiveSecondSteps.length} steps taking more than 5 seconds
- Found ${moderateSteps.length} steps taking more than 10 seconds
- Found ${longSteps.length} steps taking more than 30 seconds

## Steps Taking More Than 30 Seconds Details

${
    longSteps.length === 0
        ? '✅ No steps taking longer than 30 seconds found'
        : longSteps
              .map(
                  (step, index) => `
### ${index + 1}. ${step.description}

- **Duration**: ${formatDuration(step.duration)}
- **Time Range**: ${step.startTime} → ${step.endTime}
- **Worker**: ${step.worker}
- **Full Log**: \`${step.fullLine}\`

**Problem Analysis**:
${getAnalysisForStep(step)}

**Optimization Suggestions**:
${getSuggestionForStep(step)}
`,
              )
              .join('\n')
}

## Steps Taking More Than 5 Seconds Statistics

Total: ${fiveSecondSteps.length} steps

### Top 10 Longest Steps Taking More Than 5 Seconds

${fiveSecondSteps
    .slice(0, 10)
    .map(
        (step, index) => `
${index + 1}. **${step.description}**
   - Duration: ${formatDuration(step.duration)}
   - Time Range: ${step.startTime} → ${step.endTime}
   - Worker: ${step.worker}
`,
    )
    .join('\n')}

## Steps Taking More Than 10 Seconds (Top 10)

${moderateSteps
    .slice(0, 10)
    .map(
        (step, index) => `
### ${index + 1}. ${step.description}

- **Duration**: ${formatDuration(step.duration)}
- **Time Range**: ${step.startTime} → ${step.endTime}
- **Worker**: ${step.worker}
`,
    )
    .join('\n')}

## Overall Statistics

${
    longSteps.length > 0
        ? `
- Total long-running steps: ${longSteps.length}
- Total extra time: ${formatDuration(
              longSteps.reduce((sum, step) => sum + step.duration, 0),
          )}
- Average duration: ${formatDuration(
              Math.round(
                  longSteps.reduce((sum, step) => sum + step.duration, 0) /
                      longSteps.length,
              ),
          )}
- Maximum duration: ${formatDuration(
              Math.max(...longSteps.map((step) => step.duration)),
          )}
`
        : ''
}

## Generated At
${new Date().toISOString()}
`;

    // Save to docs folder in root directory
    const reportPath = path.join(
        __dirname,
        '..',
        'docs',
        'performance-analysis.md',
    );

    // Ensure directory exists
    const docsDir = path.dirname(reportPath);
    if (!fs.existsSync(docsDir)) {
        fs.mkdirSync(docsDir, {recursive: true});
    }

    fs.writeFileSync(reportPath, reportContent, 'utf8');
    console.log(
        `\n📄 Detailed report saved to: ${path.relative(
            process.cwd(),
            reportPath,
        )}`,
    );
}

// Problem analysis rules list
const analysisRules = [
    {
        patterns: ['halfHoveredButton', 'partiallyHoveredButton'],
        analysis:
            '🔍 Issue: Clicking covered button, Playwright waits for element to become clickable in non-headless mode',
        suggestion:
            '💡 Suggestion: Use the force option or a shorter timeout, or use headless mode in a CI environment.',
    },
    {
        patterns: ['Getting CSS property'],
        analysis:
            '🔍 Issue: CSS property query timeout, possibly due to element rendering delay or selector issues',
        suggestion:
            '💡 Suggestion: Check if element exists, optimize CSS selector, or add element wait logic',
    },
    {
        patterns: ['Checking if', 'classes'],
        matchAll: true,
        analysis:
            '🔍 Issue: Class name check timeout, possibly due to element state change delay',
        suggestion: 
            '💡 Suggestion: Add element state waiting, or use a more precise selector.',
    },
    {
        patterns: ['Waiting'],
        analysis:
            '🔍 Issue: Wait operation timeout, element may not appear or condition may not be met',
        suggestion:
            '💡 Suggestion: Check if wait condition is correct, consider using shorter timeout or different wait strategy',
    },
    {
        patterns: ['Getting selected text'],
        analysis:
            '🔍 Issue: Getting selected text timeout, possibly due to select element state issues',
        suggestion:
            '💡 Suggestion: Ensure select element is properly rendered and selected, add state check',
    },
    {
        patterns: ['Getting text'],
        analysis:
            '🔍 Issue: Text retrieval timeout, possibly due to element rendering delay or selector issues',
        suggestion:
            '💡 Suggestion: Check if element exists, optimize selector, or add element wait logic',
    },
    {
        patterns: ['Clicking for'],
        analysis:
            '🔍 Issue: Click operation timeout, element may not be clickable or is blocked',
        suggestion:
            '💡 Suggestion: Check element state, use force option, or optimize element locating',
    },
];

function getAnalysisAndSuggestion(step) {
    const description = step.description;

    for (const rule of analysisRules) {
        const matches = rule.matchAll
            ? rule.patterns.every((pattern) => description.includes(pattern))
            : rule.patterns.some((pattern) => description.includes(pattern));

        if (matches) {
            return {
                analysis: rule.analysis,
                suggestion: rule.suggestion,
            };
        }
    }

    // Default analysis
    return {
        analysis:
            '🔍 Issue: Step execution time is abnormally long, requires further investigation',
        suggestion:
            '💡 Suggestion: Check network connection, element state, or consider optimizing test logic',
    };
}

function getAnalysisForStep(step) {
    return getAnalysisAndSuggestion(step).analysis;
}

function getSuggestionForStep(step) {
    return getAnalysisAndSuggestion(step).suggestion;
}

if (require.main === module) {
    generateReport();
    saveReportToFile();
}

module.exports = {analyzeLongSteps, generateReport, saveReportToFile};
