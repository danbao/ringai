
import * as path from 'path';
import {expect} from 'vitest';
import {fork} from '@ringai/child-process';
import {Transport} from '@ringai/transport';
import {WebApplicationControllerEventType} from '@ringai/types';
import {BrowserProxyControllerMock} from '@ringai/test-utils';
import {WebApplicationController} from '../src/web-application-controller';
import {ELEMENT_NAME, TEST_NAME} from './fixtures/constants';

const testProcessPath = path.resolve(__dirname, './fixtures/test-process.ts');

// TODO (flops) add more tests
describe('WebApplicationController functional', () => {
    it('should get messages from', () => new Promise<void>((resolve, reject) => {
        const transport = new Transport();
        const browserProxyMock = new BrowserProxyControllerMock();
        const controller = new WebApplicationController(
            browserProxyMock,
            transport,
        );

        fork(testProcessPath).then((testProcess) => {
            controller.init();

            controller.on(
                WebApplicationControllerEventType.afterResponse,
                (message) => {
                    try {
                        const requests = browserProxyMock.$getCommands();

                        expect(requests).toHaveLength(1);

                        const request = requests[0];
                        expect(request!.args[0]).toContain(ELEMENT_NAME);
                        expect(message.command).toBe(request);
                        expect(message.applicant).toContain(TEST_NAME);

                        resolve();
                    } catch (e) {
                        reject(e);
                    } finally {
                        setImmediate(() => {
                            testProcess.kill();
                        });
                    }
                },
            );

            if (testProcess.stderr) {
                testProcess.stderr.on('data', (message) => {
                    reject(message.toString());
                });
            } else {
                reject(new Error('Failed to get STDERR'));
            }
        });
    }));
});
