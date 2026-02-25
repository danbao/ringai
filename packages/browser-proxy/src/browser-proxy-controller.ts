import {
    BrowserProxyPlugins,
    IBrowserProxyCommand,
    IBrowserProxyController,
    IBrowserProxyPlugin,
    IBrowserProxyWorkerConfig,
} from '@ringai/types';
import {PluggableModule} from '@ringai/pluggable-module';
import {loggerClient} from '@ringai/logger';
import {requirePlugin} from '@ringai/utils';

const logger = loggerClient.withPrefix('[browser-proxy-controller]');

export class BrowserProxyController
    extends PluggableModule
    implements IBrowserProxyController
{
    private plugin: IBrowserProxyPlugin | null = null;
    private logger = logger;
    private defaultPluginConfig: IBrowserProxyWorkerConfig = {
        plugin: 'unknown',
        config: null,
    };

    constructor() {
        super([BrowserProxyPlugins.getPlugin]);
    }

    public async init(): Promise<void> {
        const pluginConfig: IBrowserProxyWorkerConfig = await this.callHook(
            BrowserProxyPlugins.getPlugin,
            this.defaultPluginConfig,
        );

        if (pluginConfig.plugin === 'unknown') {
            this.logger.warn('No browser proxy plugin configured');
            return;
        }

        const pluginFactory = await requirePlugin<(config: any) => IBrowserProxyPlugin>(
            pluginConfig.plugin,
        );

        if (typeof pluginFactory !== 'function') {
            throw new TypeError(
                `Browser proxy plugin "${pluginConfig.plugin}" is not a function`,
            );
        }

        this.plugin = pluginFactory(pluginConfig.config);
        this.logger.debug(`Browser proxy plugin "${pluginConfig.plugin}" loaded`);
    }

    public async execute(
        applicant: string,
        command: IBrowserProxyCommand,
    ): Promise<any> {
        if (!this.plugin) {
            throw new Error('Browser proxy plugin is not initialized');
        }

        const method = (this.plugin as any)[command.action];

        if (typeof method !== 'function') {
            throw new Error(`Unknown browser proxy action: ${command.action}`);
        }

        return method.call(this.plugin, applicant, ...command.args);
    }

    public async kill(): Promise<void> {
        if (this.plugin) {
            try {
                await this.plugin.kill();
            } catch (err) {
                this.logger.error('Failed to kill browser proxy plugin:', err);
            }
            this.plugin = null;
        }
    }
}
