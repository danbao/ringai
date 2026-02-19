import * as path from 'path';
import * as fs from 'fs/promises';
import { IConfig } from '@testring/types';
import { getArguments } from './arguments-parser.js';
import { defaultConfiguration } from './default-config.js';
import { mergeConfigs } from './merge-configs.js';

// Re-export for backward compatibility
export { defaultConfiguration };

/**
 * Define config helper - allows type-safe configuration
 * Similar to Vite/Nuxt/Astro's defineConfig
 * 
 * @example
 * // testring.config.ts
 * import { defineConfig } from '@testring/cli-config';
 * 
 * export default defineConfig({
 *   workerLimit: 4,
 *   screenshots: 'afterError',
 * });
 */
export function defineConfig(config: Partial<IConfig>): Partial<IConfig> {
    return config;
}

// Cache for loaded config files
const configCache = new Map<string, Partial<IConfig>>();

/**
 * Try to load config from various file formats
 * Supports: .ts, .js, .mjs, .json
 */
async function tryLoadConfigFile(filePath: string): Promise<Partial<IConfig> | null> {
    // Check cache first
    if (configCache.has(filePath)) {
        return configCache.get(filePath)!;
    }

    try {
        const ext = path.extname(filePath);
        const resolvedPath = await fs.realpath(filePath);
        
        let config: Partial<IConfig> = {};
        
        if (ext === '.json') {
            const content = await fs.readFile(resolvedPath, 'utf-8');
            config = JSON.parse(content);
        } else if (ext === '.js' || ext === '.mjs') {
            // Dynamic import for ESM
            const module = await import(resolvedPath);
            config = module.default || module;
        } else if (ext === '.ts') {
            // For TypeScript files, we need to use ts-node or similar
            // For now, try to load as ESM with tsx
            try {
                const module = await import(resolvedPath + '?t=' + Date.now());
                config = module.default || module;
            } catch {
                console.warn(`Warning: Could not load TypeScript config ${filePath}. Make sure tsx is installed.`);
                return null;
            }
        }
        
        if (config && typeof config === 'object') {
            configCache.set(filePath, config);
            return config;
        }
    } catch (error) {
        // Config file not found or invalid, that's OK
    }
    
    return null;
}

/**
 * Try multiple config file paths and return the first one that exists
 */
async function findConfigFile(configPaths: string[]): Promise<string | null> {
    for (const configPath of configPaths) {
        try {
            await fs.access(configPath);
            return configPath;
        } catch {
            continue;
        }
    }
    return null;
}

/**
 * Get configuration
 * 
 * Priority (highest to lowest):
 * 1. CLI arguments
 * 2. Config file (testring.config.{ts,js,mjs,json})
 * 3. Environment variables (TESTRING_*)
 * 4. Default configuration
 */
async function getConfig(argv: string[] = process.argv.slice(2)): Promise<IConfig> {
    // Parse CLI arguments using existing yargs-based parser
    const args = getArguments(argv) || {};
    
    // Get debug status from CLI or environment
    const isDebugging = process.env['TESTRING_DEBUG'] === 'true' || process.argv.includes('--debug');
    const debugProperty = { debug: isDebugging };
    
    // Try to find config file in standard locations
    const configFilePaths = [
        (args.config as string) || 'testring.config',
        'testring.config.ts',
        'testring.config.js',
        'testring.config.mjs',
        'testring.config.json',
    ];
    
    const configFilePath = await findConfigFile(configFilePaths);
    
    // Load environment config if specified
    let envConfig = {};
    const envConfigPath = (args.envConfig as string) || process.env['TESTRING_ENV_CONFIG'];
    if (envConfigPath) {
        const loadedEnvConfig = await tryLoadConfigFile(envConfigPath);
        if (loadedEnvConfig) {
            envConfig = loadedEnvConfig;
        }
    }
    
    // Load main config file if found
    let fileConfig = {};
    if (configFilePath) {
        const loadedConfig = await tryLoadConfigFile(configFilePath);
        if (loadedConfig) {
            fileConfig = loadedConfig;
        }
    }
    
    // Merge all configurations
    const finalConfig = mergeConfigs(
        defaultConfiguration,
        envConfig || {},
        fileConfig || {},
        args || {},
        debugProperty,
    );
    
    return finalConfig as IConfig;
}

/**
 * Resolve config file path
 */
async function resolveConfigPath(name?: string): Promise<string | undefined> {
    const configPaths = name 
        ? [name] 
        : ['testring.config.ts', 'testring.config.js', 'testring.config.mjs', 'testring.config.json'];
    
    return (await findConfigFile(configPaths)) || undefined;
}

export { getConfig, resolveConfigPath };
