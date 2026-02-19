import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import kleur from 'kleur';
import { CliError } from './utils/cli-error.js';

interface InitAnswers {
    projectName: string;
    testFramework: 'vitest' | 'mocha';
    browser: 'playwright';
    reporter: 'spec' | 'dot' | 'json';
    plugins: string[];
}

function askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        readline.question(question, (answer: string) => {
            readline.close();
            resolve(answer);
        });
    });
}

function askConfirm(question: string, defaultValue: boolean = false): Promise<boolean> {
    return new Promise((resolve) => {
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const prompt = defaultValue ? `${question} (Y/n)` : `${question} (y/N)`;
        readline.question(prompt, (answer: string) => {
            readline.close();
            const normalized = answer.toLowerCase().trim();
            if (normalized === '') {
                resolve(defaultValue);
            } else {
                resolve(normalized === 'y' || normalized === 'yes');
            }
        });
    });
}

function askSelect<T extends string>(question: string, options: { label: string; value: T }[], defaultValue: T): Promise<T> {
    return new Promise((resolve) => {
        console.log(`\n${question}`);
        options.forEach((opt, idx) => {
            const marker = opt.value === defaultValue ? '✓' : ' ';
            console.log(`  ${marker} ${idx + 1}. ${opt.label}`);
        });
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        readline.question('\nEnter your choice (number): ', (answer: string) => {
            readline.close();
            const idx = parseInt(answer.trim(), 10) - 1;
            if (isNaN(idx) || idx < 0 || idx >= options.length) {
                resolve(defaultValue);
            } else {
                resolve(options[idx].value);
            }
        });
    });
}

export async function runInitCommand() {
    console.log(kleur.yellow().bold('\nWelcome to Testring v1.0 initialization wizard!'));
    console.log(kleur.dim('This will create a basic testring configuration in your project.\n'));

    try {
        const defaultProjectName = 'my-testring-app';
        const projectNameAnswer = await askQuestion(`What is your project name? (${defaultProjectName}): `);
        const projectName = projectNameAnswer.trim() || defaultProjectName;

        if (!projectName) {
            throw new CliError('Project name is required');
        }

        const testFramework = await askSelect<InitAnswers['testFramework']>(
            'Which test framework would you like to use?',
            [
                { label: 'Vitest (recommended)', value: 'vitest' },
                { label: 'Mocha', value: 'mocha' },
            ],
            'vitest'
        );

        const browser: InitAnswers['browser'] = 'playwright';

        const reporter = await askSelect<InitAnswers['reporter']>(
            'Which reporter would you like to use?',
            [
                { label: 'Spec (detailed output)', value: 'spec' },
                { label: 'Dot (minimal)', value: 'dot' },
                { label: 'JSON', value: 'json' },
            ],
            'spec'
        );

        const shouldAddPlugins = await askConfirm(
            'Would you like to add some common plugins?',
            true
        );

        let plugins: string[] = [];
        if (shouldAddPlugins) {
            plugins = ['testring-plugin-babel', 'testring-plugin-fs-store'];
        }

        // Generate config
        const config = generateConfig(projectName, {
            testFramework,
            browser,
            reporter,
            plugins,
        });

        // Write config file
        const configPath = join(process.cwd(), 'testring.config.ts');
        writeFileSync(configPath, config, 'utf-8');

        // Write test example
        const testDir = join(process.cwd(), 'tests');
        if (!existsSync(testDir)) {
            mkdirSync(testDir, { recursive: true });
        }

        const testExample = generateTestExample(testFramework);
        writeFileSync(join(testDir, 'example.test.ts'), testExample, 'utf-8');

        // Update package.json scripts
        updatePackageJson();

        console.log('\n' + kleur.green().bold('✓ Testring initialized successfully!'));
        console.log(kleur.dim('\nNext steps:'));
        console.log(kleur.dim(`  1. Edit ${configPath} to customize your configuration`));
        console.log(kleur.dim('  2. Add your tests in the tests/ directory'));
        console.log(kleur.dim('  3. Run: pnpm testring run --tests "tests/**/*.test.ts"'));

    } catch (error) {
        if (error instanceof CliError) {
            console.log(kleur.yellow('\nInitialization cancelled.'));
            return;
        }
        throw error;
    }
}

interface ConfigOptions {
    testFramework: InitAnswers['testFramework'];
    browser: InitAnswers['browser'];
    reporter: InitAnswers['reporter'];
    plugins: string[];
}

function generateConfig(projectName: string, options: ConfigOptions): string {
    const pluginsImport = options.plugins.length > 0
        ? `\nimport { babel } from '@testring/plugin-babel';\nimport { fsStore } from '@testring/plugin-fs-store';`
        : '';

    const pluginsConfig = options.plugins.length > 0
        ? `
    plugins: [
        babel(),
        fsStore(),
    ],`
        : '';

    return `// testring.config.ts - Testring v1.0 Configuration
// Generated by testring init

${pluginsImport}
import { defineConfig } from '@testring/cli-config';

export default defineConfig({
    project: '${projectName}',
    tests: 'tests/**/*.test.ts',
    workerLimit: 4,
    reporter: '${options.reporter}',${pluginsConfig}
});
`;
}

function generateTestExample(framework: InitAnswers['testFramework']): string {
    if (framework === 'vitest') {
        return `import { test, expect } from 'vitest';

test('example test', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page.locator('h1')).toContainText('Example');
});
`;
    }

    return `import { assert } from 'chai';

describe('example test suite', () => {
    it('should pass', async () => {
        assert.equal(1, 1, '1 should equal 1');
    });
});
`;
}

function updatePackageJson() {
    try {
        const packageJsonPath = join(process.cwd(), 'package.json');
        if (!existsSync(packageJsonPath)) {
            console.log(kleur.yellow('\n⚠ No package.json found. Please add testring scripts manually.'));
            return;
        }

        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

        if (!packageJson.scripts) {
            packageJson.scripts = {};
        }

        if (!packageJson.scripts.testring) {
            packageJson.scripts.testring = 'testring run';
            require('fs').writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
            console.log(kleur.green('\n✓ Added testring script to package.json'));
        }
    } catch {
        console.log(kleur.yellow('\n⚠ Could not update package.json automatically.'));
    }
}
