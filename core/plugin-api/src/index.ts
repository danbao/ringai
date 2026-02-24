import {IConfig, IPluginModules} from '@ringai/types';
import {PluginController} from './plugin-controller';
import {PluginAPI} from './plugin-api';

const applyPlugins = async (
    pluginsDestinations: IPluginModules,
    config: IConfig,
): Promise<void> => {
    const controller = new PluginController(pluginsDestinations);

    await controller.initialize(config.plugins);
};

export {applyPlugins, PluginAPI};
