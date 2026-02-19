import * as path from 'node:path';
import { createRequire } from 'node:module';
import * as resolve from 'resolve';

const require = createRequire(import.meta.url);

const requireById = <T = unknown>(id: string): T => {
    return require(id) as T;
};

const requireResolveById = (id: string, options?: {paths?: string[]}) => {
    return require.resolve(id, options);
};

export function resolvePackage(
    modulePath: string,
    parentModule?: string,
): string {

    try {
        if (typeof parentModule === 'string') {
            const parentModuleDir = path.dirname(parentModule);
            const relativeModulePath = path.resolve(
                parentModuleDir,
                modulePath,
            );

            try {
                return requireResolveById(relativeModulePath);
            } catch {
                return requireResolveById(modulePath);
            }
        }

        return requireResolveById(modulePath);
    } catch {
        return resolve.sync(modulePath, {
            basedir: process.cwd(),
        });
    }
}

interface RequireError extends Error {
    stack?: string;
    message: string;
}

export function requirePackage<T = unknown>(modulePath: string, parentModule?: string): T {

    const fileName = resolvePackage(modulePath, parentModule);

    try {
        return requireById<T>(fileName);
    } catch (exception: unknown) {
        const requireError = exception as RequireError;
        const error = new ReferenceError(
            `Error, while requiring '${modulePath}': ${requireError.message}`,
        );

        if (requireError.stack) {
            error.stack = requireError.stack;
        }

        throw error;
    }
}
