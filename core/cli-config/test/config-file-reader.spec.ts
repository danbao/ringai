/* eslint sonarjs/no-identical-functions: 0 */

import * as path from 'path';
import {describe, it, expect} from 'vitest';
import {getFileConfig} from '../src/config-file-reader';

describe('config-file-reader', () => {
    it('should load config as promise from .cjs', async () => {
        const filePath = path.join(__dirname, './fixtures/testringrc.cjs');
        const config = await getFileConfig(filePath, {} as any);

        expect(config).toEqual({
            debug: true,
        });
    });

    it('should load config as object from .cjs', async () => {
        const filePath = path.join(__dirname, './fixtures/testringrc_obj.cjs');
        const config = await getFileConfig(filePath, {} as any);

        expect(config).toEqual({
            debug: true,
        });
    });

    it('should load config as object from the file with unsupported extension', () => new Promise<void>((resolve, reject) => {
        const filePath = path.join(__dirname, './fixtures/testring_invalid.ts');

        getFileConfig(filePath, {} as any)
            .then((config) => {
                reject(`
                    Config has been parsed, content:
                    ${config}
                `);
            })
            .catch((exception) => {
                expect(exception).toBeInstanceOf(Error);
                resolve();
            });
    }));

    it('should find config', async () => {
        const filePath = path.join(__dirname, './fixtures/testring.json');
        const config = await getFileConfig(filePath, {} as any);

        expect(config).toEqual({
            debug: true,
        });
    });

    it('should return null if there is no such config', async () => {
        const filePath = path.join(
            __dirname,
            './fixtures/nonexistent-config.json',
        );
        const config = await getFileConfig(filePath, {} as any);

        // eslint-disable-next-line
        expect(config).toBeNull();
    });

    it('should throw correct exception when config file is invalid', () => new Promise<void>((resolve, reject) => {
        const filePath = path.join(__dirname, './fixtures/invalid.json');

        getFileConfig(filePath, {} as any)
            .then((config) => {
                reject(`
                    Config has been parsed, content:
                    ${config}
                `);
            })
            .catch((exception) => {
                expect(exception).toBeInstanceOf(SyntaxError);
                resolve();
            });
    }));
});
