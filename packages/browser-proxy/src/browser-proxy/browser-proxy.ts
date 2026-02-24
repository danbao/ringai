import {
    BrowserProxyActions,
    BrowserProxyMessageTypes,
    IBrowserProxyCommandResponse,
    IBrowserProxyMessage,
    IBrowserProxyPlugin,
    ITransport,
} from '@ringai/types';
import {requirePlugin} from '@ringai/utils';
import {loggerClient} from '@ringai/logger';

async function resolvePlugin(pluginPath: string): Promise<any> {
    const resolvedPlugin = await requirePlugin(pluginPath);

    if (typeof resolvedPlugin !== 'function') {
        throw new TypeError('plugin is not a function');
    }

    return resolvedPlugin;
}

export class BrowserProxy {
    private plugin: IBrowserProxyPlugin | undefined;

    private pluginReady: Promise<void>;

    private killed = false;

    private logger = loggerClient.withPrefix('[browser-proxy]');

    public removeHandlers: Array<() => void> = [];

    constructor(
        private transportInstance: ITransport,
        pluginPath: string,
        pluginConfig: any,
    ) {
        this.pluginReady = this.loadPlugin(pluginPath, pluginConfig);
        this.registerCommandListener();
    }

    private async loadPlugin(pluginPath: string, pluginConfig: any) {
        let pluginFactory: any;

        try {
            pluginFactory = await resolvePlugin(pluginPath);
        } catch (error) {
            this.logger.error(`Can't load plugin ${pluginPath}`, error);
        }

        if (pluginFactory) {
            try {
                this.plugin = pluginFactory(pluginConfig);
            } catch (error) {
                this.transportInstance.broadcastUniversally(
                    BrowserProxyMessageTypes.exception,
                    error instanceof Error ? error : new Error(String(error)),
                );
            }
        }
    }

    private registerCommandListener() {
        this.removeHandlers.push(
            this.transportInstance.on(
                BrowserProxyMessageTypes.execute,
                (message: any) => this.onMessage(message),
            ),
        );
    }

    private sendEmptyResponse(uid: string) {
        this.transportInstance.broadcastUniversally(
            BrowserProxyMessageTypes.response,
            {
                uid,
            },
        );
    }

    private async onMessage(message: IBrowserProxyMessage) {
        const {uid, applicant, command} = message;

        try {
            await this.pluginReady;

            if (this.killed) {
                this.sendEmptyResponse(uid);
                return;
            }

            if (!this.plugin) {
                if (
                    command.action === BrowserProxyActions.end ||
                    command.action === BrowserProxyActions.kill
                ) {
                    this.sendEmptyResponse(uid);
                    return;
                }
                throw new ReferenceError('Cannot find browser proxy plugin!');
            }

            if (command.action === BrowserProxyActions.kill) {
                this.killed = true;
            }

            const method = (this.plugin as any)[command.action];
            const response = await method.call(this.plugin, applicant, ...command.args);

            this.transportInstance.broadcastUniversally<IBrowserProxyCommandResponse>(
                BrowserProxyMessageTypes.response,
                {
                    uid,
                    response,
                    error: null,
                },
            );
        } catch (error) {
            this.transportInstance.broadcastUniversally<IBrowserProxyCommandResponse>(
                BrowserProxyMessageTypes.response,
                {
                    uid,
                    error: error instanceof Error ? error : new Error(String(error)),
                    response: null,
                },
            );
        }
    }
}
