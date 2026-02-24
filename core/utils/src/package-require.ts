import * as path from 'node:path';
import { createRequire } from 'node:module';
import resolveModule from 'resolve';

const esmRequire = createRequire(import.meta.url);

const requireById = <T = unknown>(id: string): T => {
    return esmRequire(id) as T;
};

const requireResolveById = (id: string, options?: {paths?: string[]}) => {
    return esmRequire.resolve(id, options);
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
        return resolveModule.sync(modulePath, {
            basedir: process.cwd(),
        });
    }
}

interface RequireError extends Error {
    stack?: string;
    message: string;
}

export function requirePackageSync<T = unknown>(modulePath: string, parentModule?: string): T {

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

export async function requirePackage<T = unknown>(modulePath: string, parentModule?: string): Promise<T> {

    const fileName = resolvePackage(modulePath, parentModule);

    try {
        return requireById<T>(fileName);
    } catch (exception: unknown) {
        const requireError = exception as RequireError;
        if (requireError && (requireError as any).code === 'ERR_REQUIRE_ESM') {
            const mod = await import(fileName);
            return (mod.default ?? mod) as T;
        }

        const error = new ReferenceError(
            `Error, while requiring '${modulePath}': ${requireError.message}`,
        );

        if (requireError.stack) {
            error.stack = requireError.stack;
        }

        throw error;
    }
}
