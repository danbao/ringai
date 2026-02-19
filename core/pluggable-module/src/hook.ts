type HookHandler = (...args: any[]) => any | Promise<any>;

/**
 * Legacy Hook class - provides write (modifier) and read (listener) hook semantics
 * This is kept for backward compatibility with existing code
 * 
 * For new code, use the hookable library directly via PluggableModule.getHookable()
 */
export class Hook {
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

    /**
     * Get all registered hook names
     */
    public getHookNames(): string[] {
        const writeNames = Array.from(this.writeHooks.keys());
        const readNames = Array.from(this.readHooks.keys());
        return [...new Set([...writeNames, ...readNames])];
    }

    /**
     * Check if a plugin has registered any hooks
     */
    public hasPlugin(pluginName: string): boolean {
        return this.writeHooks.has(pluginName) || this.readHooks.has(pluginName);
    }

    /**
     * Remove a plugin's hooks
     */
    public removePlugin(pluginName: string): boolean {
        const writeRemoved = this.writeHooks.delete(pluginName);
        const readRemoved = this.readHooks.delete(pluginName);
        return writeRemoved || readRemoved;
    }
}
