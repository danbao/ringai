type HookWriteHandler = (...args: any[]) => any | Promise<any>;
type HookReadHandler = (...args: any[]) => void | Promise<void>;

export class Hook {
    private writeHooks: Map<string, HookWriteHandler> = new Map();

    private readHooks: Map<string, HookReadHandler> = new Map();

    private generateError(pluginName: string, error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));

        const generatedError = new Error(
            `Plugin ${pluginName} failed: ${err.message}`,
        );

        generatedError.stack = err.stack ?? 'No stack trace available';

        return generatedError;
    }

    public writeHook(pluginName: string, modifier: HookWriteHandler) {
        this.writeHooks.set(pluginName, modifier);
    }

    public readHook(pluginName: string, reader: HookReadHandler) {
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
}
