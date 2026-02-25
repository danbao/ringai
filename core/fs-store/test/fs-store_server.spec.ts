
import {describe, it, expect} from 'vitest';
import * as os from 'os';
import * as path from 'path';

import {
    FSStoreServer,
    serverState,
    fsStoreServerHooks,
} from '../src/fs-store-server';
import {FS_CONSTANTS} from '../src/utils';

import {transport} from '@ringai/transport';

import {IFSStoreReq, IFSStoreResp, fsReqType} from '@ringai/types';

const msgNamePrefix = 'fs-st_test';

const reqName = msgNamePrefix + FS_CONSTANTS['FS_REQ_NAME_POSTFIX'];
const respName = msgNamePrefix + FS_CONSTANTS['FS_RESP_NAME_POSTFIX'];
const releaseReqName = msgNamePrefix + FS_CONSTANTS['FS_RELEASE_NAME_POSTFIX'];
const cleanReqName = msgNamePrefix + FS_CONSTANTS['FS_CLEAN_REQ_NAME_POSTFIX'];

describe('fs-store-server', () => {
    it('should init fss and test the transport lock', (done) => {
        const FSS = new FSStoreServer(10, msgNamePrefix);

        expect(FSS.getState()).toBe(serverState.initialized);

        const lockRequestID = 'lock_test';
        const accessRequestID = 'acc_test';
        const unlinkRequestID = 'unlink_test';

        const baseFileName = 'tmp.tmp';

        const state = {lock: 0, access: 0, unlink: 0};

        transport.on<IFSStoreResp>(
            respName,
            ({requestId, fullPath, status, action}) => {
                expect(requestId).toBeOneOf([
                    lockRequestID,
                    accessRequestID,
                    unlinkRequestID,
                ]);
                switch (action) {
                    case fsReqType.access:
                        state.access -= 1;
                        transport.broadcast<IFSStoreReq>(
                            releaseReqName,
                            {
                                requestId: accessRequestID,
                                action: fsReqType.access,
                                meta: {
                                    fileName: baseFileName,
                                },
                            },
                        );
                        break;
                    case fsReqType.unlink:
                        state.unlink -= 1;
                        break;
                }
                expect(typeof status).toBe('string');
                expect(typeof fullPath).toBe('string');
                expect(fullPath).toBe(
                    path.join(os.tmpdir(), baseFileName),
                );
            },
        );

        const onRelease = FSS.getHook(fsStoreServerHooks.ON_RELEASE);
        expect(onRelease).toBeDefined();

        onRelease &&
            onRelease.readHook(
                'testRelease',
                ({requestId, fileName, action}: { requestId: string; fileName: string; action: fsReqType }) => {
                    expect(requestId).toBeOneOf([
                        lockRequestID,
                        accessRequestID,
                        unlinkRequestID,
                    ]);
                    switch (action) {
                        case fsReqType.lock:
                            state.lock -= 1;
                            break;
                    }
                    expect(typeof fileName).toBe('string');
                },
            );

        transport.broadcast<IFSStoreReq>(reqName, {
            requestId: lockRequestID,
            action: fsReqType.lock,
            meta: {
                fileName: baseFileName,
            },
        });
        state.lock += 1;

        transport.broadcast<IFSStoreReq>(reqName, {
            requestId: accessRequestID,
            action: fsReqType.access,
            meta: {
                fileName: baseFileName,
            },
        });
        state.access += 1;

        transport.broadcast<IFSStoreReq>(reqName, {
            requestId: unlinkRequestID,
            action: fsReqType.unlink,
            meta: {
                fileName: baseFileName,
            },
        });
        state.unlink += 1;

        setTimeout(() => {
            expect(state).toEqual({
                lock: 1,
                access: 0,
                unlink: 1,
            });
            transport.broadcast<IFSStoreReq>(releaseReqName, {
                requestId: lockRequestID,
                action: fsReqType.lock,
                meta: {
                    fileName: baseFileName,
                },
            });

            setTimeout(() => {
                expect(state).toEqual({
                    lock: 0,
                    access: 0,
                    unlink: 0,
                });

                transport.broadcast<{}>(cleanReqName, {});

                done();
            }, 100);
        }, 100);
    });
});
