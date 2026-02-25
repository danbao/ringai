
import {describe, it, expect} from 'vitest';
import * as path from 'path';
import * as fs from 'fs';

import {getConfig, defaultConfiguration} from '../src';

const fileConfigPath = path.resolve(__dirname, './fixtures/fileConfig.json');
const envConfigPath = path.resolve(__dirname, './fixtures/envConfig.json');
const envConfigWithExtendPath = path.resolve(
    __dirname,
    './fixtures/envConfig_extend.json',
);

const fileConfig = JSON.parse(fs.readFileSync(fileConfigPath, 'utf-8'));
const envConfig = JSON.parse(fs.readFileSync(envConfigPath, 'utf-8'));

describe('Get config', () => {
    it('should return default configuration if nothing else passed', async () => {
        const config = await getConfig();

        expect(config).toEqual(defaultConfiguration);
    });

    it('should override default config fields with file config', async () => {
        const config = await getConfig([`--config=${fileConfigPath}`]);

        expect(config).toHaveProperty(
            'workerLimit',
            fileConfig.workerLimit,
        );
    });

    it('should override default and file config fields with file config', async () => {
        const config = await getConfig([
            `--config=${fileConfigPath}`,
            `--env-config=${envConfigPath}`,
        ]);

        expect(config).toHaveProperty(
            'workerLimit',
            fileConfig.workerLimit,
        );
    });

    it('should override config fields with env config', async () => {
        const config = await getConfig([`--env-config=${envConfigPath}`]);

        expect(config).toHaveProperty(
            'workerLimit',
            envConfig.workerLimit,
        );
    });

    it('should override file config fields with arguments', async () => {
        const override = 'argumentsConfig';

        const config = await getConfig([
            `--env-config=${envConfigPath}`,
            `--worker-limit=${override}`,
        ]);

        expect(config).toHaveProperty('workerLimit', override);
    });

    it('should override every resolved config fields with arguments', async () => {
        const override = 'argumentsConfig';

        const config = await getConfig([
            `--config=${fileConfigPath}`,
            `--env-config=${envConfigPath}`,
            `--worker-limit=${override}`,
        ]);

        expect(config).toHaveProperty('workerLimit', override);
    });

    it('should override config fields with env config with @extend', async () => {
        const config = await getConfig([
            `--env-config=${envConfigWithExtendPath}`,
        ]);

        expect(config).toHaveProperty(
            'workerLimit',
            envConfig.workerLimit,
        );
    });

    // eslint-disable-next-line sonarjs/no-identical-functions
    it('should override default and file config fields with file config and ignore @extend', async () => {
        const config = await getConfig([
            `--config=${fileConfigPath}`,
            `--env-config=${envConfigPath}`,
        ]);

        expect(config).toHaveProperty(
            'workerLimit',
            fileConfig.workerLimit,
        );
    });

    it('should override file config fields with @extend and arguments', async () => {
        const override = 'argumentsConfig';

        const config = await getConfig([
            `--env-config=${envConfigWithExtendPath}`,
            `--worker-limit=${override}`,
        ]);

        expect(config).toHaveProperty('workerLimit', override);
    });

    it('should override every resolved config fields with @extend and arguments', async () => {
        const override = 'argumentsConfig';

        const config = await getConfig([
            `--config=${fileConfigPath}`,
            `--env-config=${envConfigWithExtendPath}`,
            `--worker-limit=${override}`,
        ]);

        expect(config).toHaveProperty('workerLimit', override);
    });
});
