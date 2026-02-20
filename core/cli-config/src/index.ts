import { IConfig } from '@testring/types';
import { getArguments } from './arguments-parser.js';
import { getFileConfig } from './config-file-reader.js';
import { defaultConfiguration } from './default-config.js';
import { mergeConfigs } from './merge-configs.js';

export { defaultConfiguration };

export function defineConfig(config: Partial<IConfig>): Partial<IConfig> {
    return config;
}

/**
 * Get configuration
 *
 * Priority (highest to lowest):
 * 1. CLI arguments
 * 2. File config (--config)
 * 3. Environment config (--env-config)
 * 4. Default configuration
 */
async function getConfig(argv?: string[]): Promise<IConfig> {
    const args = argv ? getArguments(argv) : null;

    const configPath = args?.config as string | undefined;
    const envConfigPath = args?.envConfig as string | undefined;

    const fileConfig = await getFileConfig(
        configPath || defaultConfiguration.config,
        defaultConfiguration,
    );

    const envConfig = await getFileConfig(envConfigPath, defaultConfiguration);

    // Priority: defaults < envConfig < fileConfig < args
    const configs: Partial<IConfig>[] = [];

    if (envConfig) {
        configs.push(envConfig);
    }

    if (fileConfig) {
        configs.push(fileConfig);
    }

    if (args) {
        configs.push(args);
    }

    return mergeConfigs(defaultConfiguration, ...configs);
}

export { getConfig, getFileConfig };
