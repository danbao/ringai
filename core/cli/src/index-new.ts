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
import { loggerClient } from '@testring/logger';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Note: dist entry is located at ./dist/index-new.js, package.json is one level up.
const pkg = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf-8'));
const version = pkg.version;

// Define the main CLI command
const mainCommand = defineCommand({
    meta: {
        name: 'testring',
        version: `testring version: ${version}`,
        description: 'Modern E2E test automation framework',
    },
    subCommands: {
        run: defineCommand({
            meta: {
                name: 'run',
                description: 'Run tests',
            },
            run: async () => {
                const config = await getConfig(process.argv);
                const command = runTests(config, transport, process.stdout);

                return command.execute().catch(async (exception) => {
                    loggerClient.error('[CLI] Test execution failed:', exception?.message);
                    if (exception?.stack) {
                        loggerClient.error('[CLI] Stack trace:', exception.stack);
                    }

                    if (exception?.testFailures && exception?.totalTests) {
                        loggerClient.error(
                            `[CLI] Test summary: ${exception.testFailures}/${exception.totalTests} tests failed`,
                        );
                    }

                    await command.shutdown();

                    const exitCode = exception?.exitCode || exception?.code || 1;

                    setTimeout(() => {
                        process.exit(exitCode);
                    }, 500);
                });
            },
        }),
        init: defineCommand({
            meta: {
                name: 'init',
                description: 'Initialize a new testring project',
            },
            run: async () => {
                await runInitCommand();
            },
        }),
        plugin: defineCommand({
            meta: {
                name: 'plugin',
                description: 'List available plugins',
            },
            run: async () => {
                await runPluginListCommand();
            },
        }),
    },
});

// Create and run the main CLI
const cli = createMain(mainCommand);

cli({
    rawArgs: process.argv,
}).catch((error) => {
    console.error(kleur.red('Error:'), error.message);
    process.exit(1);
});
