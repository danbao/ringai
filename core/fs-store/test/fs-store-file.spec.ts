
import * as fs from 'fs';
import * as path from 'path';
import {describe, it, expect, beforeAll, afterAll} from 'vitest';

import {loggerClient} from '@ringai/logger';

import {FSStoreServer, fsStoreServerHooks} from '../src/fs-store-server';
import {FSStoreFile} from '../src/fs-store-file';

import {fsReqType, FSStoreType} from '@ringai/types';

interface ReadOptions {
    action: fsReqType;
    ffName: string;
}

const {readFile} = fs.promises;

const prefix = 'fsf-test';
const log = loggerClient.withPrefix(prefix);
let FSS: FSStoreServer;

const tmpDir = 'tmp';

const filetype = FSStoreType.text;

describe('fs-store-file', () => {
    beforeAll(() => {
        FSS = new FSStoreServer(10, prefix);
    });
    afterAll(async () => {
        const onRelease = FSS.getHook(fsStoreServerHooks.ON_RELEASE);
        if (onRelease) {
            onRelease.removePlugin('testRelease');
        }
        await fs.promises.rm(tmpDir, {recursive: true}).catch(() => {});
    });
    it('store file static methods test', async () => {
        const onRelease = FSS.getHook(fsStoreServerHooks.ON_RELEASE);

        expect(onRelease).toBeDefined();

        onRelease &&
            onRelease.readHook(
                'testRelease',
                ({fileName}: { fileName: string; }) => {
                    expect(typeof fileName).toBe('string');
                },
            );

        const str = 'test data';
        const fullPath = await FSStoreFile.write(Buffer.from(str), {
            meta: {type: filetype, ext: 'txt'},
            fsStorePrefix: prefix,
        });
        const fName = path.basename(fullPath);
        expect(typeof fName).toBe('string');

        const fullPath_02 = await FSStoreFile.append(Buffer.from(str + '2'), {
            meta: {type: filetype, fileName: fName},
            fsStorePrefix: prefix,
        });
        expect(fullPath_02).toBe(fullPath_02);

        const contents = await FSStoreFile.read({
            meta: {type: filetype, fileName: fName},
            fsStorePrefix: prefix,
        });
        expect(contents.toString()).toBe(str + str + '2');

        const fullPath_03 = await FSStoreFile.write(Buffer.from(str), {
            meta: {type: filetype, fileName: fName},
            fsStorePrefix: prefix,
        });
        expect(fullPath_03).toBe(fullPath);

        const contents_01 = await readFile(fullPath_03);
        expect(contents_01.toString()).toBe(str);

        const fullPath_04 = await FSStoreFile.write(Buffer.from(str + '2'), {
            meta: {type: filetype, fileName: fName},
            fsStorePrefix: prefix,
        });
        expect(fullPath_04).toBe(fullPath);

        const contents_02 = await readFile(fullPath_04);
        expect(contents_02.toString()).toBe(str + '2');

        return Promise.resolve();
    });

    it('store object create random file', async () => {
        const onFileName = FSS.getHook(fsStoreServerHooks.ON_FILENAME);

        expect(onFileName).toBeDefined();

        onFileName &&
            onFileName.writeHook('testFileName', (_: string, opts: any) => {
                const {
                    meta: {fileName, ext},
                } = opts;

                if (!fileName) {
                    return path.join(tmpDir, `${Date.now()}.${ext || 'tmp'}`);
                }
                return path.join(tmpDir, fileName);
            });
        const file = new FSStoreFile({
            meta: {type: filetype},
            fsStorePrefix: prefix,
        });

        const str = 'qwerty';

        await file.write(Buffer.from(str));
        const data = (await file.read()).toString();

        expect(data).toBe(str);

        return file.unlink();
    });
    it('store object should lock access & unlink data', async () => {
        const fileName = 'tmp.tmp';
        const file = new FSStoreFile({
            meta: {type: filetype, fileName},
            fsStorePrefix: prefix,
        });

        const state = {lock: 0, access: 0, unlink: 0};
        const onRelease = FSS.getHook(fsStoreServerHooks.ON_RELEASE);
        expect(onRelease).toBeDefined();

        onRelease &&
            onRelease.readHook('testRelease', (readOptions: ReadOptions) => {
            const {action, fileName} = readOptions as any;
            switch (action) {
                case fsReqType.lock:
                if (state.lock) {
                    state.lock -= 1;
                }
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
            log.debug({fileName, state}, 'release hook done');
            });

        try {
            await file.lock();
            state.lock += 1;

            await file.write(Buffer.from('data'));
            state.access += 1;

            await file.append(Buffer.from(' more data'));
            state.access += 1;

            const content = await file.read();
            state.access += 1;
            expect(content.toString()).toBe('data more data');

            const wasUnlocked = await file.unlock();
            expect(wasUnlocked).toBe(true);

            state.unlink += 1;
            await file.unlink();
        } catch (e) {
            log.error(e, 'ERROR during file write test');
            throw e;
        }

        return new Promise((res, rej) => {
            setTimeout(() => {
                try {
                    expect(state).toEqual({
                        lock: 0,
                        access: 0,
                        unlink: 0,
                    });
                    res();
                } catch (e) {
                    rej(e);
                }
            }, 100);
        });
    });
    it('store object should transactional lock access & unlink data', async () => {
        const fileName = 'tmp_01.tmp';
        const file = new FSStoreFile({
            meta: {type: filetype, fileName},
            fsStorePrefix: prefix,
        });

        try {
            await file.lock();

            await Promise.all([
                file.transaction(async () => {
                    await file.write(Buffer.from('data'));
                    await file.append(Buffer.from(' more data'));

                    const content = await file.read();
                    expect(content.toString()).toBe(
                        'data more data',
                    );
                }),
                file.transaction(async () => {
                    await file.write(Buffer.from('data02'));
                    await file.append(Buffer.from(' more data02'));

                    const content = await file.read();
                    expect(content.toString()).toBe(
                        'data02 more data02',
                    );
                }),
            ]);

            const wasUnlocked = await file.unlock();
            expect(wasUnlocked).toBe(true);
            await file.unlink();
        } catch (e) {
            log.error(e, 'ERROR during file write test 02');
            throw e;
        }
        return Promise.resolve();
    });
});
