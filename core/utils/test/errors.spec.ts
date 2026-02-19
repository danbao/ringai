import * as chai from 'chai';

import {
    TestringError,
    TransportError,
    PluginError,
    ConfigError,
    WorkerError,
} from '../src/errors';

const {expect} = chai;

describe('errors', () => {
    describe('TestringError', () => {
        it('should create a basic error', () => {
            const error = new TestringError('Test error');
            expect(error.message).to.equal('Test error');
            expect(error.name).to.equal('TestringError');
        });

        it('should create error with context string', () => {
            const error = new TestringError('Test error', 'worker-1');
            expect(error.message).to.equal('worker-1: Test error');
            expect(error.contextId).to.equal('worker-1');
        });

        it('should create error with ErrorContext', () => {
            const originalError = new Error('Original');
            const error = new TestringError('Test error', {
                code: 'ERR_TEST',
                contextId: 'plugin-1',
                metadata: {foo: 'bar'},
                cause: originalError,
            });

            expect(error.message).to.equal('ERR_TEST:plugin-1: Test error');
            expect(error.code).to.equal('ERR_TEST');
            expect(error.contextId).to.equal('plugin-1');
            expect(error.metadata).to.deep.equal({foo: 'bar'});
            expect(error.cause).to.equal(originalError);
        });

        it('should serialize to JSON correctly', () => {
            const error = new TestringError('Test error', {
                code: 'ERR_TEST',
                contextId: 'worker-1',
            });

            const json = error.toJSON();
            expect(json['name']).to.equal('TestringError');
            expect(json['message']).to.equal('ERR_TEST:worker-1: Test error');
            expect(json['code']).to.equal('ERR_TEST');
            expect(json['contextId']).to.equal('worker-1');
        });
    });

    it('TransportError should create transport error', () => {
        const error = new TransportError('Connection failed', 'transport-1');
        expect(error.name).to.equal('TransportError');
        expect(error.message).to.equal('transport-1: Connection failed');
    });

    it('PluginError should create plugin error', () => {
        const error = new PluginError('Plugin not found', 'my-plugin');
        expect(error.name).to.equal('PluginError');
        expect(error.message).to.equal('my-plugin: Plugin not found');
    });

    it('ConfigError should create config error', () => {
        const error = new ConfigError('Invalid config', {code: 'ERR_CONFIG'});
        expect(error.name).to.equal('ConfigError');
        expect(error.code).to.equal('ERR_CONFIG');
    });

    it('WorkerError should create worker error', () => {
        const error = new WorkerError('Worker crashed');
        expect(error.name).to.equal('WorkerError');
        expect(error.message).to.equal('Worker crashed');
    });
});
