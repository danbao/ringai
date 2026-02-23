
import * as path from 'path';
import * as chai from 'chai';
import {fork} from '@ringai/child-process';
import {Transport} from '@ringai/transport';
import {WebApplicationControllerEventType} from '@ringai/types';
import {BrowserProxyControllerMock} from '@ringai/test-utils';
import {generateUniqId} from '@ringai/utils';
import {WebApplicationController} from '../src/web-application-controller';
import {ELEMENT_NAME, TEST_NAME} from './fixtures/constants';

const testProcessPath = path.resolve(__dirname, './fixtures/test-process.ts');

// TODO (flops) add more tests
describe('WebApplicationController functional', () => {
    it('should get messages from', () => new Promise<void>((resolve, reject) => {
        const processID = generateUniqId();

        const transport = new Transport();
        const browserProxyMock = new BrowserProxyControllerMock();
        const controller = new WebApplicationController(
            browserProxyMock,
            transport,
        );

        fork(testProcessPath).then((testProcess) => {
            controller.init();
            transport.registerChild(processID, testProcess);

            controller.on(
                WebApplicationControllerEventType.afterResponse,
                (message) => {
                    try {
                        const requests = browserProxyMock.$getCommands();

                        chai.expect(requests).to.have.lengthOf(1);

                        const request = requests[0];
                        chai.expect(request!.args[0]).includes(ELEMENT_NAME);
                        chai.expect(message.command).to.be.equal(request);
                        chai.expect(message.applicant).includes(TEST_NAME);

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
