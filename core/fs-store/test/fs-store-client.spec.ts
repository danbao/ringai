
import {describe, it, expect, beforeAll, afterAll} from 'vitest';

import {FSStoreServer, fsStoreServerHooks} from '../src/fs-store-server';
import {FSStoreClient} from '../src/fs-store-client';

import {fsReqType} from '@ringai/types';

let FSS: FSStoreServer;

interface ReadOptions {
    action: fsReqType;
    ffName: string;
}

describe('fs-store-client', () => {
    beforeAll(() => {
        FSS = new FSStoreServer(10);
    });
    afterAll(() => {
        const onRelease = FSS.getHook(fsStoreServerHooks.ON_RELEASE);
        if (onRelease) {
            onRelease.removePlugin('testRelease');
        }
    });
    it('client should lock access & unlink data', () => new Promise<void>((resolve, reject) => {
        const done = (err?: any) => { if (err) reject(err); else resolve(); };
        const FSC = new FSStoreClient();

        const fileName = 'tmp.tmp';

        const state = {lock: 0, access: 0, unlink: 0};
        const onRelease = FSS.getHook(fsStoreServerHooks.ON_RELEASE);
        expect(onRelease).toBeDefined();

        onRelease &&
            onRelease.readHook('testRelease', (readOptions: any) => {
            const {action, fileName} = readOptions;
            switch (action) {
                case fsReqType.lock:
                break;
                case fsReqType.access:
                state.access -= 1;
                break;
                case fsReqType.unlink:
                state.unlink -= 1;
                break;
            }
            if (fileName !== undefined) {
                expect(typeof fileName).toBe('string');
            }
            });

        const lockReqId = FSC.getLock({fileName}, (fName) => {
            try {
                expect(fName.includes(fileName)).toBe(true);
            } catch (err) {
                done(err);
            }
            state.lock += 1;
        });
        const accessReqId = FSC.getAccess({fileName}, (fName) => {
            try {
                expect(fName.includes(fileName)).toBe(true);
            } catch (err) {
                done(err);
            }
            state.access += 1;
        });
        const unlinkReqId = FSC.getUnlink({fileName}, (fName) => {
            try {
                expect(fName.includes(fileName)).toBe(true);
            } catch (err) {
                done(err);
            }
        });
        state.unlink += 1;
        setTimeout(() => {
            expect(state).toEqual({
                lock: 1,
                access: 1,
                unlink: 1,
            });
            const lockCB = () => {
                state.lock -= 1;
            };

            const lockRelRet = FSC.release(lockReqId, lockCB);
            expect(lockRelRet).toBe(true);

            const accessRelRet = FSC.release(accessReqId);
            expect(accessRelRet).toBe(true);

            const unlinkRelRet = FSC.release(unlinkReqId);
            expect(unlinkRelRet).toBe(true);

            setTimeout(() => {
                expect(state).toEqual({
                    lock: 0,
                    access: 0,
                    unlink: 0,
                });
                done();
            }, 200);
        }, 200);
    }));
});
