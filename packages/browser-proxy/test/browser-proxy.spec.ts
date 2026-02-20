/* eslint sonarjs/no-identical-functions: 0 */

import * as path from 'path';
import * as chai from 'chai';
import {
    BrowserProxyMessageTypes,
    BrowserProxyActions,
    IBrowserProxyCommandResponse,
    IBrowserProxyCommand,
} from '@testring/types';
import {TransportMock} from '@testring/test-utils';
import {BrowserProxy} from '../src/browser-proxy/browser-proxy';

const asyncPluginPath = path.resolve(__dirname, './fixtures/async-plugin.cjs');
const pluginPath = path.resolve(__dirname, './fixtures/sync-plugin.cjs');
const pluginConfig = {};
const commandMock: IBrowserProxyCommand = {
    action: BrowserProxyActions.click,
    args: ['foo', 'bar'],
};

describe('Browser proxy', () => {
    it('should listen to incoming messages and call onAction hook when gets message', async () => {
        const uid = 'testUid';
        const transport = new TransportMock();

        new BrowserProxy(transport, pluginPath, pluginConfig);

        const responsePromise = new Promise<IBrowserProxyCommandResponse>((resolve) => {
            transport.on<IBrowserProxyCommandResponse>(
                BrowserProxyMessageTypes.response,
                (response) => resolve(response),
            );
        });

        await new Promise((r) => setTimeout(r, 10));

        transport.emit(BrowserProxyMessageTypes.execute, {
            uid,
            applicant: 'test',
            command: commandMock,
        });

        const response = await responsePromise;
        chai.expect(response.uid).to.be.equal(uid);
        chai.expect(response.error).to.be.equal(null);
    });

    it('should work with async hooks', async () => {
        const uid = 'testUid';
        const transport = new TransportMock();
        new BrowserProxy(transport, asyncPluginPath, pluginConfig);

        const responsePromise = new Promise<IBrowserProxyCommandResponse>((resolve) => {
            transport.on<IBrowserProxyCommandResponse>(
                BrowserProxyMessageTypes.response,
                (response) => resolve(response),
            );
        });

        await new Promise((r) => setTimeout(r, 10));

        transport.emit(BrowserProxyMessageTypes.execute, {
            uid,
            applicant: 'test',
            command: commandMock,
        });

        const response = await responsePromise;
        chai.expect(response.uid).to.be.equal(uid);
        chai.expect(response.error).to.be.equal(null);
    });

    it('should broadcast response with exception if onAction hook fails', async () => {
        const uid = 'testUid';
        const transport = new TransportMock();
        new BrowserProxy(transport, pluginPath, pluginConfig);

        const responsePromise = new Promise<IBrowserProxyCommandResponse>((resolve) => {
            transport.on<IBrowserProxyCommandResponse>(
                BrowserProxyMessageTypes.response,
                (response) => resolve(response),
            );
        });

        await new Promise((r) => setTimeout(r, 10));

        transport.emit(BrowserProxyMessageTypes.execute, {
            uid,
            command: {
                action: 'barrelRoll' as BrowserProxyActions,
                arguments: ['foo', 'bar'],
            },
        });

        const response = await responsePromise;
        chai.expect(response).to.have.property('uid', uid);
        chai.expect(response).to.have.property('error');
    });
});
