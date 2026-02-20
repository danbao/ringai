import process from 'node:process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createMain, defineCommand } from 'citty';
import kleur from 'kleur';
import { runTests } from './commands/runCommand.js';
import { runInitCommand } from './commands/initCommand.js';
import { runPluginListCommand } from './commands/pluginCommand.js';
import { getConfig } from '@testring/cli-config';
import { transport } from '@testring/transport';
import { loggerClient, LoggerServer } from '@testring/logger';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
const version = pkg.version;

const mainCommand = defineCommand({
    meta: {
        name: 'testring',
        version: `testring version: ${version}`,
        description: 'Modern E2E test automation framework',
    },
    subCommands: {
        run: defineCommand({
            meta: { name: 'run', description: 'Run tests' },
            run: async () => {
                const config = await getConfig(process.argv);
                // start logger transport early
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const loggerServer = new LoggerServer(config, transport, process.stdout);

                const command = runTests(config, transport, process.stdout);
                return command.execute().catch(async (exception) => {
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
            meta: { name: 'init', description: 'Initialize a new testring project' },
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


