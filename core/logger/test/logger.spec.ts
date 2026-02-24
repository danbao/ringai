
import {Writable} from 'stream';
import {LoggerPlugins} from '@ringai/types';
import {TransportMock} from '@ringai/test-utils';
import {LoggerServer} from '../src/logger-server';
import {LoggerClient} from '../src/logger-client';
import {LOG_ENTITY} from './fixtures/constants';

const DEFAULT_CONFIG: any = {};
const DEFAULT_WRITABLE_CONFIG = {
    write: () => {
        /* empty */
    },
};

describe('Logger', () => {
    it('should relay message from client to server through transport', () => new Promise<void>((resolve, reject) => {
        const transport = new TransportMock();
        const stdout = new Writable(DEFAULT_WRITABLE_CONFIG);
        const loggerServer = new LoggerServer(
            DEFAULT_CONFIG,
            transport,
            stdout,
        );
        const loggerClient = new LoggerClient(transport);
        const onLog = loggerServer.getHook(LoggerPlugins.onLog);

        if (onLog) {
            onLog.readHook('testPlugin', () => {
                resolve();
            });
        }

        loggerClient.log(LOG_ENTITY);
    }));
});
