
import {fork} from '@ringai/child-process';
import process from 'node:process';
import * as path from 'path';
import * as chai from 'chai';
import {
    CHILD_PROCESS_NAME,
    REQUEST_NAME,
    RESPONSE_NAME,
    PAYLOAD,
} from './fixtures/constants';
import {Transport} from '../src/transport';

describe('Transport functional test', () => {
    it('should create connection between child and parent process', () => new Promise<void>((resolve, reject) => {
        const childEntryPath = path.resolve(__dirname, './fixtures/child.ts');
        fork(childEntryPath).then((childProcess) => {
            const transport = new Transport(process);

            if (childProcess.stderr) {
                childProcess.stderr.on('data', (error) => {
                    reject(error.toString());
                });
            } else {
                reject(new Error('No STDERR'));
            }

            transport.registerChild(CHILD_PROCESS_NAME, childProcess);

            const removeCallback = transport.on(RESPONSE_NAME, (payload) => {
                childProcess.kill();
                childProcess.on('close', () => {
                    try {
                        chai.expect(payload).to.be.deep.equal(PAYLOAD);

                        resolve();
                    } catch (error) {
                        reject(error);
                    } finally {
                        removeCallback();
                    }
                });
            });

            transport
                .send(CHILD_PROCESS_NAME, REQUEST_NAME, null)
                .catch((error) => reject(error));
        });
    }));

    it("should wipe out children from registry, when it's closed", () => new Promise<void>((resolve, reject) => {
        const childEntryPath = path.resolve(__dirname, './fixtures/child.ts');

        fork(childEntryPath).then((childProcess) => {
            const transport = new Transport(process);

            transport.registerChild(CHILD_PROCESS_NAME, childProcess);

            chai.expect(transport.getProcessesList()).to.have.length(1);

            childProcess.on('close', () => {
                try {
                    chai.expect(transport.getProcessesList()).to.have.length(0);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            });

            childProcess.kill();
        });
    }));
});
