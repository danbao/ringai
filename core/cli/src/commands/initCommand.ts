import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import kleur from 'kleur';
import { CliError } from './utils/cli-error.js';

interface InitAnswers {
    projectName: string;
    browser: 'playwright';
    reporter: 'spec' | 'dot' | 'json';
    plugins: string[];
}

function askQuestion(question: string): Promise<string> {
    return new Promise((resolve) => {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question(question, (answer: string) => {
            rl.close();
            resolve(answer);
        });
    });
}

function askConfirm(question: string, defaultValue: boolean = false): Promise<boolean> {
    return new Promise((resolve) => {
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const prompt = defaultValue ? `${question} (Y/n)` : `${question} (y/N)`;
        rl.question(prompt, (answer: string) => {
            rl.close();
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
        const rl = createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question('\nEnter your choice (number): ', (answer: string) => {
            rl.close();
            const idx = parseInt(answer.trim(), 10) - 1;
            if (isNaN(idx) || idx < 0 || idx >= options.length) {
                resolve(defaultValue);
            } else {
                resolve(options[idx]!.value);
            }
        });
    });
}

export async function runInitCommand() {
    console.log(kleur.yellow().bold('\nWelcome to Ringai v1.0 initialization wizard!'));
    console.log(kleur.dim('This will create a basic ringai configuration in your project.\n'));

    try {
        const defaultProjectName = 'my-ringai-app';
        const projectNameAnswer = await askQuestion(`What is your project name? (${defaultProjectName}): `);
        const projectName = projectNameAnswer.trim() || defaultProjectName;

        if (!projectName) {
            throw new CliError('Project name is required');
        }

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
            plugins = ['ringai-plugin-compiler', 'ringai-plugin-fs-store'];
        }

        // Generate config
        const config = generateConfig(projectName, {
            browser,
            reporter,
            plugins,
        });

        // Write config file
        const configPath = join(process.cwd(), 'ringai.config.ts');
        writeFileSync(configPath, config, 'utf-8');

        // Write test example
        const testDir = join(process.cwd(), 'tests');
        if (!existsSync(testDir)) {
            mkdirSync(testDir, { recursive: true });
        }

        const testExample = generateTestExample();
        writeFileSync(join(testDir, 'example.test.ts'), testExample, 'utf-8');

        // Update package.json scripts
        updatePackageJson();

        console.log('\n' + kleur.green().bold('✓ Ringai initialized successfully!'));
        console.log(kleur.dim('\nNext steps:'));
        console.log(kleur.dim(`  1. Edit ${configPath} to customize your configuration`));
        console.log(kleur.dim('  2. Add your tests in the tests/ directory'));
        console.log(kleur.dim('  3. Run: pnpm ringai run --tests "tests/**/*.test.ts"'));

    } catch (error) {
        if (error instanceof CliError) {
            console.log(kleur.yellow('\nInitialization cancelled.'));
            return;
        }
        throw error;
    }
}

interface ConfigOptions {
    browser: InitAnswers['browser'];
    reporter: InitAnswers['reporter'];
    plugins: string[];
}

function generateConfig(projectName: string, options: ConfigOptions): string {
    const pluginsImport = options.plugins.length > 0
        ? `\nimport { compiler } from '@ringai/plugin-compiler';\nimport { fsStore } from '@ringai/plugin-fs-store';`
        : '';

    const pluginsConfig = options.plugins.length > 0
        ? `
    plugins: [
        compiler(),
        fsStore(),
    ],`
        : '';

    return `// ringai.config.ts - Ringai v1.0 Configuration
// Generated by ringai init

${pluginsImport}
import { defineConfig } from '@ringai/cli-config';

export default defineConfig({
    project: '${projectName}',
    tests: 'tests/**/*.test.ts',
    workerLimit: 4,
    reporter: '${options.reporter}',${pluginsConfig}
});
`;
}

function generateTestExample(): string {
    return `import { test, expect } from 'vitest';

test('example test', async ({ page }) => {
    await page.goto('https://example.com');
    await expect(page.locator('h1')).toContainText('Example');
});
`;
}

function updatePackageJson() {
    try {
        const packageJsonPath = join(process.cwd(), 'package.json');
        if (!existsSync(packageJsonPath)) {
            console.log(kleur.yellow('\n⚠ No package.json found. Please add ringai scripts manually.'));
            return;
        }

        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

        if (!packageJson.scripts) {
            packageJson.scripts = {};
        }

        if (!packageJson.scripts.ringai) {
            packageJson.scripts.ringai = 'ringai run';
            writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
            console.log(kleur.green('\n✓ Added ringai script to package.json'));
        }
    } catch {
        console.log(kleur.yellow('\n⚠ Could not update package.json automatically.'));
    }
}
