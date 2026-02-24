import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import {requirePackage, resolvePackage} from './package-require';

const PREFIXES = ['@ringai/plugin-', 'ringai-plugin-', '@ringai/'];

function normalizeExport<T>(module: T): T {
    // filtering null and other falsy values
    if (!module) {
        return module;
    }

    const anyModule = module as Record<string, unknown>;
    // returning original module, if it wasn't transformed by babel
    if (!anyModule['__esModule']) {
        return module;
    }

    // returning default as default
    return anyModule['default'] ? anyModule['default'] as T : module;
}

export async function requirePlugin<T = unknown>(pluginPath: string): Promise<T> {
    let resolvedPlugin;
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const parentModule = path.join(__dirname, '../..');

    for (let index = 0; index < PREFIXES.length; index++) {
        try {
            resolvedPlugin = resolvePackage(
                PREFIXES[index] + pluginPath,
                parentModule,
            );
        } catch (e) {
            continue;
        }
        break;
    }

    if (!resolvedPlugin) {
        resolvedPlugin = resolvePackage(pluginPath);
    }

    const plugin = await requirePackage<T>(resolvedPlugin);

    return normalizeExport(plugin);
}
