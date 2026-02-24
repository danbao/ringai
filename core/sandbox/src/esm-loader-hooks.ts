/**
 * ESM Loader Hooks for Mock and Instrumentation
 * 
 * This module provides hooks for intercepting ESM module loading
 * to enable mocking and code instrumentation during tests.
 * 
 * Target: Phase 3.4.3 - 创建 ESM loader hooks 用于 mock/instrumentation
 */

import { fileURLToPath } from 'url';

type MockedModule = {
    [key: string]: any;
};

type ModuleMock = {
    default?: MockedModule;
    namedExports?: MockedModule;
};

type LoaderHook = {
    /**
     * Called before a module is loaded
     * Return a mocked module to replace the original
     */
    onLoad?: (specifier: string, context: any) => Promise<ModuleMock | null> | ModuleMock | null;
    
    /**
     * Called after a module is loaded
     * Can be used to instrument or transform the module
     */
    onLoaded?: (specifier: string, module: any) => Promise<any> | any;
    
    /**
     * Called when there's an error loading a module
     */
    onError?: (specifier: string, error: Error) => void;
};

/**
 * ESM Loader Hooks Registry
 * 
 * Manages hooks for intercepting ESM module loading
 */
class ESMLoaderHooks {
    private hooks: Map<string, LoaderHook> = new Map();
    private mockedModules: Map<string, ModuleMock> = new Map();

    /**
     * Register a hook for a specific module or pattern
     */
    public registerHook(pattern: string, hook: LoaderHook): void {
        this.hooks.set(pattern, hook);
    }

    /**
    register a hook
 * Un     */
    public unregisterHook(pattern: string): void {
        this.hooks.delete(pattern);
    }

    /**
     * Mock a module
     */
    public mockModule(specifier: string, mock: ModuleMock): void {
        this.mockedModules.set(specifier, mock);
    }

    /**
     * Clear a module mock
     */
    public unmockModule(specifier: string): void {
        this.mockedModules.delete(specifier);
    }

    /**
     * Clear all mocks
     */
    public clearMocks(): void {
        this.mockedModules.clear();
    }

    /**
     * Check if a module is mocked
     */
    public isMocked(specifier: string): boolean {
        return this.mockedModules.has(specifier);
    }

    /**
     * Get mocked module if exists
     */
    public getMock(specifier: string): ModuleMock | undefined {
        return this.mockedModules.get(specifier);
    }

    /**
     * Find matching hooks for a specifier
     */
    public findMatchingHooks(specifier: string): LoaderHook[] {
        const matchingHooks: LoaderHook[] = [];
        
        for (const [pattern, hook] of this.hooks) {
            if (this.matchPattern(specifier, pattern)) {
                matchingHooks.push(hook);
            }
        }
        
        return matchingHooks;
    }

    /**
     * Match a specifier against a pattern
     * Supports wildcards (*)
     */
    private matchPattern(specifier: string, pattern: string): boolean {
        if (specifier === pattern) {
            return true;
        }
        
        // Handle wildcards
        if (pattern.includes('*')) {
            const regex = new RegExp(
                '^' + pattern.replace(/\*/g, '.*') + '$'
            );
            return regex.test(specifier);
        }
        
        return false;
    }
}

/**
 * Global loader hooks instance
 */
export const esmLoaderHooks = new ESMLoaderHooks();

/**
 * Create a custom Node.js loader for ESM
 * 
 * This can be used with --loader flag or module.register()
 * 
 * @example
 * // In a test file:
 * import { createESMLoader } from '@ringai/sandbox/esm-loader';
 * 
 * const loader = createESMLoader({
 *   onLoad: async (specifier) => {
 *     if (specifier === './my-module') {
 *       return { default: { mock: true } };
 *     }
 *     return null;
 *   }
 * });
 * 
 * module.register(loader, { flags: ['--experimental-loader'] });
 */
export function createESMLoader(hook: LoaderHook): any {
    // Register the provided hook to the global registry
    const hookId = `loader-${Date.now()}`;
    esmLoaderHooks.registerHook(hookId, hook);
    
    return {
        // Node.js loader API version
        version: 'v1',
        
        /**
         * Resolve hook - called before loading a module
         */
        async resolve(specifier: string, context: any, nextResolve: any) {
            // Check if we have mocks for this specifier
            const mock = esmLoaderHooks.getMock(specifier);
            
            if (mock) {
                // Return a data: URL for the mocked module
                const mockCode = generateMockModuleCode(mock);
                return {
                    shortCircuit: true,
                    url: `data:application/javascript,${encodeURIComponent(mockCode)}`,
                };
            }
            
            // Run onLoad hooks
            for (const h of esmLoaderHooks.findMatchingHooks(specifier)) {
                if (h.onLoad) {
                    try {
                        const result = await h.onLoad(specifier, context);
                        if (result) {
                            esmLoaderHooks.mockModule(specifier, result);
                        }
                    } catch (error) {
                        if (h.onError) {
                            h.onError(specifier, error as Error);
                        }
                    }
                }
            }
            
            // Continue with normal resolution
            return nextResolve(specifier, context);
        },
        
        /**
         * Load hook - called when loading a module
         */
        async load(url: string, context: any, nextLoad: any) {
            const specifier = url.startsWith('file:') 
                ? fileURLToPath(url) 
                : url;
            
            // Check for mocks
            const mock = esmLoaderHooks.getMock(specifier);
            if (mock) {
                return {
                    format: 'module',
                    source: generateMockModuleCode(mock),
                };
            }
            
            // Run onLoaded hooks
            for (const h of esmLoaderHooks.findMatchingHooks(specifier)) {
                if (h.onLoaded) {
                    try {
                        // The source will be loaded by nextLoad
                        const result = await nextLoad(url, context);
                        if (result.source) {
                            await h.onLoaded(specifier, result.source);
                        }
                    } catch (error) {
                        if (h.onError) {
                            h.onError(specifier, error as Error);
                        }
                    }
                }
            }
            
            return nextLoad(url, context);
        },
        
        /**
         * Global hook - called for global operations
         */
        globalHook: {
            // Can be used for custom global variables
        },
    };
}

/**
 * Generate JavaScript code for a mocked module
 */
function generateMockModuleCode(mock: ModuleMock): string {
    const exports: string[] = [];
    
    if (mock.default) {
        exports.push(`export default ${JSON.stringify(mock.default)}`);
    }
    
    if (mock.namedExports) {
        const entries = Object.entries(mock.namedExports)
            .map(([key, value]) => `export const ${key} = ${JSON.stringify(value)}`)
            .join(';\n');
        exports.push(entries);
    }
    
    if (exports.length === 0) {
        return 'export default {}';
    }
    
    return exports.join(';\n');
}

/**
 * Create a simple mock for a module
 * 
 * @example
 * import { createMock } from '@ringai/sandbox/esm-loader';
 * 
 * const mock = createMock({
 *   myFunction: () => 'mocked result',
 *   myValue: 42,
 * });
 * 
 * esmLoaderHooks.mockModule('./my-module', mock);
 */
export function createMock(namedExports: MockedModule): ModuleMock {
    return {
        namedExports,
    };
}

/**
 * Create a default export mock
 * 
 * @example
 * import { createDefaultMock } from '@ringai/sandbox/esm-loader';
 * 
 * const mock = createDefaultMock({
 *   foo: 'bar',
 * });
 * 
 * esmLoaderHooks.mockModule('./my-module', mock);
 */
export function createDefaultMock(defaultExport: MockedModule): ModuleMock {
    return {
        default: defaultExport,
    };
}

export { ESMLoaderHooks, LoaderHook, ModuleMock, MockedModule };
