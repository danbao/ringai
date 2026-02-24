import {LogLevel} from '@ringai/types';
import {transport} from '@ringai/transport';

import {DevtoolWorkerController} from './worker/devtool-worker-controller';
import {loggerClient, LoggerServer} from '@ringai/logger';

import {defaultDevtoolConfig} from './default-devtool-config';

const server = new DevtoolWorkerController(transport);

new LoggerServer(
    {
        logLevel: 'verbose' as LogLevel,
        silent: false,
    },
    transport,
    process.stdout,
);

server.init(defaultDevtoolConfig).catch((err) => {
    loggerClient.error(err);
});
