import process from 'node:process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMain, defineCommand } from 'citty';
import kleur from 'kleur';
import { runTests } from './commands/runCommand.js';
import { runInitCommand } from './commands/initCommand.js';
import { runPluginListCommand } from './commands/pluginCommand.js';
import { getConfig } from '@ringai/cli-config';
import { transport } from '@ringai/transport';
import { loggerClient } from '@ringai/logger';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
const version = pkg.version;

const mainCommand = defineCommand({
    meta: {
        name: 'ringai',
        version: `ringai version: ${version}`,
        description: 'Modern E2E test automation framework',
    },
    subCommands: {
        run: defineCommand({
            meta: { name: 'run', description: 'Run tests' },
            run: async () => {
                const config = await getConfig(process.argv);
                const command = runTests(config, transport, process.stdout);
                return command.execute().then(() => {
                    setTimeout(() => process.exit(0), 200);
                }).catch(async (exception) => {
                    loggerClient.error('[CLI] Test execution failed:', exception.message);
                    if (exception.stack) {
                        loggerClient.error('[CLI] Stack trace:', exception.stack);
                    }

                    if (exception.testFailures && exception.totalTests) {
                        loggerClient.error(
                            `[CLI] Test summary: ${exception.testFailures}/${exception.totalTests} tests failed`,
                        );
                    }

                    await command.shutdown();

                    const exitCode = exception.exitCode || exception.code || 1;
                    setTimeout(() => process.exit(exitCode), 200);
                });
            },
        }),
        init: defineCommand({
            meta: { name: 'init', description: 'Initialize a new ringai project' },
            run: async () => runInitCommand(),
        }),
        plugin: defineCommand({
            meta: { name: 'plugin', description: 'List available plugins' },
            run: async () => runPluginListCommand(),
        }),
    },
});

const cli = createMain(mainCommand);

/**
 * Backward-compatible programmatic entry.
 */
export async function runCLI(argv: string[]): Promise<void> {
    await cli({ rawArgs: argv.slice(2) });
}


