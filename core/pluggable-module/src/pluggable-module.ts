import { Hookable } from 'hookable';
import type { IPluggableModule } from '@testring/types';

type HookDescriptor = string;
type HookHandler = (...args: any[]) => any | Promise<any>;

/**
 * Legacy Hook class - kept for backward compatibility
 * Provides write (modifier) and read (listener) hook semantics
 */
class LegacyHook {
    private writeHooks: Map<string, HookHandler> = new Map();
    private readHooks: Map<string, HookHandler> = new Map();

    private generateError(pluginName: string, error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));

        const generatedError = new Error(
            `Plugin ${pluginName} failed: ${err.message}`,
        );

        generatedError.stack = err.stack ?? 'No stack trace available';

        return generatedError;
    }

    public writeHook(pluginName: string, modifier: HookHandler) {
        this.writeHooks.set(pluginName, modifier);
    }

    public readHook(pluginName: string, reader: HookHandler) {
        this.readHooks.set(pluginName, reader);
    }

    public async callHooks<T = any>(...data: Array<any>): Promise<T> {
        const {writeHooks, readHooks} = this;

        let dataArguments = data;

        for (const [key, hook] of writeHooks) {
            try {
                dataArguments = [
                    await hook(...dataArguments),
                    ...dataArguments.slice(1),
                ];
            } catch (error) {
                throw this.generateError(key, error);
            }
        }

        for (const [key, hook] of readHooks) {
            try {
                await hook(...dataArguments);
            } catch (error) {
                throw this.generateError(key, error);
            }
        }

        return dataArguments[0] as T;
    }

    public getHookNames(): string[] {
        const writeNames = Array.from(this.writeHooks.keys());
        const readNames = Array.from(this.readHooks.keys());
        return [...new Set([...writeNames, ...readNames])];
    }

    public hasPlugin(pluginName: string): boolean {
        return this.writeHooks.has(pluginName) || this.readHooks.has(pluginName);
    }

    public removePlugin(pluginName: string): boolean {
        const writeRemoved = this.writeHooks.delete(pluginName);
        const readRemoved = this.readHooks.delete(pluginName);
        return writeRemoved || readRemoved;
    }
}

/**
 * PluggableModule - Manages plugin hooks using hookable library
 * 
 * This is a refactored version using the hookable library from unjs,
 * providing:
 * - Type-safe hook registration
 * - Async/await hook execution
 * - Hook dependency ordering
 * - Built-in dispose support
 * - beforeEach/afterEach callbacks
 * 
 * Maintains backward compatibility with legacy Hook API
 */
export class PluggableModule implements IPluggableModule<LegacyHook> {
    // New hookable instance for modern hook management
    protected hookable: Hookable;
    
    // Legacy hook instances for backward compatibility
    protected pluginHooks: Map<string, LegacyHook> = new Map();

    constructor(hooks: Array<HookDescriptor> = []) {
        // Initialize new hookable
        this.hookable = new Hookable();
        
        // Create legacy Hook instances for backward compatibility
        this.createHooks(hooks);
    }

    private createHooks(hooks: Array<HookDescriptor> = []) {
        for (const hookName of hooks) {
            if (hookName !== undefined) {
                this.pluginHooks.set(hookName, new LegacyHook());
            }
        }
    }

    /**
     * Call a registered hook by name
     */
    protected async callHook<T = any>(name: string, ...args: any[]): Promise<T> {
        // Try new hookable first
        const hookNames = Object.keys((this.hookable as any)._hooks || {});
        if (hookNames.includes(name)) {
            return this.hookable.callHook(name, ...args) as Promise<T>;
        }
        
        // Fallback to legacy hook
        const pluginHook = this.pluginHooks.get(name);

        if (pluginHook === undefined) {
            throw new ReferenceError(`There is no plugin called ${name}.`);
        }

        return pluginHook.callHooks<T>(...args);
    }

    /**
     * Get the legacy hook by name (backward compatibility)
     */
    public getHook(name: string): LegacyHook | void {
        return this.pluginHooks.get(name);
    }

    /**
     * Register a hook handler using new hookable API
     */
    public registerHook(name: string, handler: HookHandler): () => void {
        return this.hookable.hook(name, handler);
    }

    /**
     * Register multiple hooks at once
     */
    public registerHooks(hooks: Record<string, HookHandler | HookHandler[]>): () => void {
        return this.hookable.addHooks(hooks);
    }

    /**
     * Register a callback before each hook is called
     */
    public registerBeforeEach(callback: (event: { name: string; args: any[] }) => void): () => void {
        return this.hookable.beforeEach(callback as any);
    }

    /**
     * Register a callback after each hook is called
     */
    public registerAfterEach(callback: (event: { name: string; args: any[] }) => void): () => void {
        return this.hookable.afterEach(callback as any);
    }

    /**
     * Get all registered hook names
     */
    public getHookNames(): string[] {
        const legacyNames = Array.from(this.pluginHooks.keys());
        const newHookNames = Object.keys((this.hookable as any)._hooks || {});
        return [...new Set([...legacyNames, ...newHookNames])];
    }

    /**
     * Check if a hook exists
     */
    public hasHook(name: string): boolean {
        return this.pluginHooks.has(name) || Object.keys((this.hookable as any)._hooks || {}).includes(name);
    }

    /**
     * Remove all hooks
     */
    public removeAllHooks(): void {
        this.pluginHooks.clear();
        this.hookable.removeAllHooks();
    }

    /**
     * Get the underlying hookable instance for advanced usage
     */
    public getHookable(): Hookable {
        return this.hookable;
    }
}

/**
 * Create a new PluggableModule instance
 */
export function createPluggableModule(
    hooks: Array<HookDescriptor> = []
): PluggableModule {
    return new PluggableModule(hooks);
}
