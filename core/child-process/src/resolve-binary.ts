import * as fs from 'node:fs';
import * as path from 'node:path';
import process from 'node:process';
import { createRequire } from 'node:module';

const IS_WIN = process.platform === 'win32';

function findNodeModulesDir(modulePath: string) {
    if (modulePath === '/') {
        throw new Error('There is no any node_module directory!');
    }

    if (modulePath.endsWith('node_modules')) {
        return modulePath;
    }

    return findNodeModulesDir(path.dirname(modulePath));
}

function windowsQuotes(str: string): string {
    if (!/ /.test(str)) {
        return str;
    }

    return '"' + str + '"';
}

function escapify(str: string) {
    if (IS_WIN) {
        return path.normalize(str).split(/\\/).map(windowsQuotes).join('\\\\');
    } else if (/[^-_.~/\w]/.test(str)) {
        return "'" + str.replace(/'/g, "'\"'\"'") + "'";
    }
    return str;
}

export function resolveBinary(name: string): string {
    const esmRequire = createRequire(import.meta.url);
    const modulePath = esmRequire.resolve(name);
    const nodeModules = findNodeModulesDir(modulePath);
    const binSuffix = IS_WIN ? '.cmd' : '';
    const binaryPath = path.join(nodeModules, '.bin', name) + binSuffix;

    if (fs.existsSync(binaryPath)) {
        return escapify(binaryPath);
    }

    // pnpm uses a content-addressable store; walk up to the root node_modules
    let dir = nodeModules;
    while (true) {
        const parent = path.dirname(dir);
        if (parent === dir) break;
        dir = parent;
        const candidate = path.join(dir, 'node_modules', '.bin', name) + binSuffix;
        if (fs.existsSync(candidate)) {
            return escapify(candidate);
        }
    }

    throw new ReferenceError(
        `Package ${name} is existing, but it doesn't have bin`,
    );
}
