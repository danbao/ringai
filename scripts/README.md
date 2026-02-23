# Scripts Directory

This directory contains utility scripts for the Ringai project.

## Available Scripts

### Performance Analysis

- `analyze-long-steps.js` - Analyzes test execution logs to identify performance bottlenecks and long-running steps

## Usage

Run scripts from the project root directory:

```bash
# Run tests and analyze performance (recommended)
pnpm run analyze:performance

# Analyze existing log files only
pnpm run analyze:performance:logs-only

# For CI environments (includes additional logging)
pnpm run analyze:performance:ci

# Or run scripts directly
node scripts/run-tests-and-analyze.js
node scripts/analyze-long-steps.js
```

## Performance Analysis Tool

### Overview

The performance analysis tool (`analyze-long-steps.js`) automatically scans E2E test logs to identify steps that take longer than expected, helping developers optimize test performance and identify potential issues.

### Features

- **Automatic Log Detection**: Scans multiple log files in the e2e-test-app directory
- **Threshold Analysis**: Identifies steps taking >30 seconds (critical) and >10 seconds (moderate)
- **Detailed Reporting**: Provides categorized analysis with specific optimization suggestions
- **CI Integration**: Automatically runs after test execution in CI pipeline
- **Artifact Generation**: Creates detailed markdown reports for review

### Log Files Analyzed

The tool automatically searches for and analyzes these log files:
- `packages/e2e-test-app/e2e-test-output.log`
- `packages/e2e-test-app/e2e-test-iframe-fix.log`
- `packages/e2e-test-app/e2e-test-hybrid-fix.log`
- `packages/e2e-test-app/e2e-test-locator-api.log`

### Report Output

1. **Console Output**: Real-time analysis with color-coded results
2. **Markdown Report**: Detailed report saved to `docs/performance-analysis.md`
3. **CI Artifacts**: Reports uploaded as GitHub Actions artifacts (30-day retention)

### Performance Categories

The tool categorizes slow steps into:
- **Click Operations**: Button clicks and interactions
- **Element Queries**: CSS property queries and element inspections
- **Wait Operations**: Explicit waits and timeouts
- **Element Checks**: Visibility and state verifications

### Optimization Suggestions

For each slow step, the tool provides:
- **Problem Analysis**: Root cause identification
- **Specific Recommendations**: Actionable optimization steps
- **Best Practices**: General performance improvement guidelines

### Example Output

```
🔍 E2E测试中超过30秒的步骤分析
================================================================================

⚠️  发现 4 个超过30秒的步骤:

1. 🕐 持续时间: 31s
   ⏰ 时间段: 13:04:47 → 13:05:18
   📝 步骤: Getting CSS property "background-color"
   🔍 问题: CSS属性查询超时，可能是元素渲染延迟或选择器问题
   💡 建议: 检查元素是否存在，优化CSS选择器，或添加元素等待逻辑
```

## CI Integration

### GitHub Actions

The performance analysis is automatically integrated into the CI pipeline:

1. **Trigger**: Runs after all tests complete
2. **Conditions**: Only on Ubuntu with Node.js 22 (primary CI environment)
3. **Error Handling**: Uses `continue-on-error: true` to prevent CI failures
4. **Artifacts**: Reports are uploaded and available for 30 days

### Configuration

The CI integration is configured in `.github/workflows/node.js.yml`:

```yaml
- name: Analyze Test Performance
  if: ${{ matrix.os=='ubuntu-latest' && matrix.node-version=='22'}}
  run: pnpm run analyze:performance:ci
  continue-on-error: true

- name: Upload Performance Analysis Report
  if: ${{ matrix.os=='ubuntu-latest' && matrix.node-version=='22'}}
  uses: actions/upload-artifact@v4
  with:
    name: performance-analysis-report
    path: docs/performance-analysis.md
    retention-days: 30
```

### Accessing Reports

1. **GitHub Actions**: Download artifacts from the Actions tab
2. **Local Development**: Check `docs/performance-analysis.md`
3. **Console Output**: View real-time analysis during script execution

## Development

### Adding New Analysis Rules

To add new performance analysis rules:

1. Modify the categorization logic in `analyzeLongSteps()`
2. Add new problem patterns in `getAnalysisForStep()`
3. Include corresponding suggestions in `getSuggestionForStep()`

### Customizing Thresholds

Current thresholds:
- **Critical**: ≥30 seconds
- **Moderate**: >10 seconds

Modify these in the respective analysis functions as needed.

## Troubleshooting

### No Log Files Found

If the tool reports "No log files found":
1. Ensure E2E tests have been run recently
2. Check that log files exist in `packages/e2e-test-app/`
3. Verify file permissions and paths

### Missing Reports

If reports aren't generated:
1. Check console output for errors
2. Verify `docs/` directory exists and is writable
3. Ensure Node.js has file system permissions

### CI Integration Issues

If CI performance analysis fails:
1. Check GitHub Actions logs for specific errors
2. Verify pnpm scripts are correctly configured
3. Ensure artifact upload permissions are set
