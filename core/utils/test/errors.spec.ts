import {describe, it, expect} from 'vitest';

import {
    RingaiError,
    TransportError,
    PluginError,
    ConfigError,
    WorkerError,
} from '../src/errors';

describe('errors', () => {
    describe('RingaiError', () => {
        it('should create a basic error', () => {
            const error = new RingaiError('Test error');
            expect(error.message).toBe('Test error');
            expect(error.name).toBe('RingaiError');
        });

        it('should create error with context string', () => {
            const error = new RingaiError('Test error', 'worker-1');
            expect(error.message).toBe('worker-1: Test error');
            expect(error.contextId).toBe('worker-1');
        });

        it('should create error with ErrorContext', () => {
            const originalError = new Error('Original');
            const error = new RingaiError('Test error', {
                code: 'ERR_TEST',
                contextId: 'plugin-1',
                metadata: {foo: 'bar'},
                cause: originalError,
            });

            expect(error.message).toBe('ERR_TEST:plugin-1: Test error');
            expect(error.code).toBe('ERR_TEST');
            expect(error.contextId).toBe('plugin-1');
            expect(error.metadata).toEqual({foo: 'bar'});
            expect(error.cause).toBe(originalError);
        });

        it('should serialize to JSON correctly', () => {
            const error = new RingaiError('Test error', {
                code: 'ERR_TEST',
                contextId: 'worker-1',
            });

            const json = error.toJSON();
            expect(json['name']).toBe('RingaiError');
            expect(json['message']).toBe('ERR_TEST:worker-1: Test error');
            expect(json['code']).toBe('ERR_TEST');
            expect(json['contextId']).toBe('worker-1');
        });
    });

    it('TransportError should create transport error', () => {
        const error = new TransportError('Connection failed', 'transport-1');
        expect(error.name).toBe('TransportError');
        expect(error.message).toBe('transport-1: Connection failed');
    });

    it('PluginError should create plugin error', () => {
        const error = new PluginError('Plugin not found', 'my-plugin');
        expect(error.name).toBe('PluginError');
        expect(error.message).toBe('my-plugin: Plugin not found');
    });

    it('ConfigError should create config error', () => {
        const error = new ConfigError('Invalid config', {code: 'ERR_CONFIG'});
        expect(error.name).toBe('ConfigError');
        expect(error.code).toBe('ERR_CONFIG');
    });

    it('WorkerError should create worker error', () => {
        const error = new WorkerError('Worker crashed');
        expect(error.name).toBe('WorkerError');
        expect(error.message).toBe('Worker crashed');
    });
});
