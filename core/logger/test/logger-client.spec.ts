
import {describe, it, expect, vi} from 'vitest';


import {TransportMock} from '@ringai/test-utils';
import {LoggerMessageTypes, LogTypes, FSFileLogType} from '@ringai/types';

import {LoggerClient} from '../src/logger-client';
import {report, stepsTypes} from './fixtures/constants';

describe('Logger client', () => {
    it('should broadcast messages on log, info, warn, error and debug', () => {
        const spy = vi.fn();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport);

        transport.on(LoggerMessageTypes.REPORT, spy);

        loggerClient.log(...report);
        loggerClient.info(...report);
        loggerClient.warn(...report);
        loggerClient.error(...report);
        loggerClient.debug(...report);
        loggerClient.success(...report);
        loggerClient.verbose(...report);
        loggerClient.file('README.md', {type: FSFileLogType.SCREENSHOT});

        expect(spy.mock.calls.length).toBe(8);

        for (let i = 0, len = spy.mock.calls.length; i < len; i++) {
            expect(spy.mock.calls[i][0].prefix).toBe(null);
        }
    });

    it('should broadcast messages log, info, warn, error and debug with prefix', () => {
        const PREFIX = 'myPrefix';
        const spy = vi.fn();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport, PREFIX);

        transport.on(LoggerMessageTypes.REPORT, spy);
        loggerClient.log(...report);
        loggerClient.info(...report);
        loggerClient.warn(...report);
        loggerClient.error(...report);
        loggerClient.debug(...report);
        loggerClient.success(...report);
        loggerClient.verbose(...report);
        loggerClient.file('README.md', {type: FSFileLogType.SCREENSHOT});

        expect(spy.mock.calls.length).toBe(8);

        for (let i = 0, len = spy.mock.calls.length; i < len; i++) {
            expect(spy.mock.calls[i][0].prefix).toBe(PREFIX);
        }
    });

    it('should broadcast messages log, info, warn, error and debug from generated logger', () => {
        const PREFIX = 'addingPrefix';
        const spy = vi.fn();
        const transport = new TransportMock();
        const loggerParent = new LoggerClient(transport);
        const loggerClient = loggerParent.withPrefix(PREFIX);

        transport.on(LoggerMessageTypes.REPORT, spy);
        loggerClient.log(...report);
        loggerClient.info(...report);
        loggerClient.warn(...report);
        loggerClient.error(...report);
        loggerClient.debug(...report);
        loggerClient.success(...report);
        loggerClient.verbose(...report);

        expect(spy.mock.calls.length).toBe(7);

        for (let i = 0, len = spy.mock.calls.length; i < len; i++) {
            expect(spy.mock.calls[i][0].prefix).toBe(PREFIX);
        }
    });

    it('should broadcast messages log, info, warn, error and debug from generated logger saving prefix', () => {
        const PREFIX = 'savingPrefix';
        const spy = vi.fn();
        const transport = new TransportMock();
        const loggerParent = new LoggerClient(transport, PREFIX);
        const loggerClient = loggerParent.createNewLogger();

        transport.on(LoggerMessageTypes.REPORT, spy);
        loggerClient.log(...report);
        loggerClient.info(...report);
        loggerClient.warn(...report);
        loggerClient.error(...report);
        loggerClient.debug(...report);
        loggerClient.success(...report);
        loggerClient.verbose(...report);

        expect(spy.mock.calls.length).toBe(7);

        for (let i = 0, len = spy.mock.calls.length; i < len; i++) {
            expect(spy.mock.calls[i][0].prefix).toBe(PREFIX);
        }
    });

    it('should open multiple inherited steps with sync startStep', () => {
        const PREFIX = 'savingPrefix';
        const spy = vi.fn();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport, PREFIX);
        transport.on(LoggerMessageTypes.REPORT, spy);

        loggerClient.startStepLog('log');
        loggerClient.startStepInfo('info');
        loggerClient.startStepDebug('debug');
        loggerClient.startStepSuccess('success');
        loggerClient.startStepWarning('warning');
        loggerClient.startStepError('error');
        loggerClient.log(...report);

        expect(spy.mock.calls.length).toBe(7);

        expect(spy.mock.calls[0][0].parentStep).toBe(null);
        expect(spy.mock.calls[0][0]).toMatchObject(stepsTypes[0]);

        for (let i = 1, len = spy.mock.calls.length; i < len; i++) {
            expect(spy.mock.calls[i][0].parentStep).toBe(
                spy.mock.calls[i - 1][0].stepUid,
            );
            expect(spy.mock.calls[i][0]).toMatchObject(stepsTypes[i]);
        }
    });

    it('should open multiple inherited steps with async step', async () => {
        const PREFIX = 'savingPrefix';
        const spy = vi.fn();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport, PREFIX);
        transport.on(LoggerMessageTypes.REPORT, spy);

        await loggerClient.stepLog('log', async () => {
            await loggerClient.stepInfo('info', async () => {
                await loggerClient.stepDebug('debug', async () => {
                    await loggerClient.stepSuccess('success', async () => {
                        await loggerClient.stepWarning('warning', async () => {
                            await loggerClient.stepError('error', async () => {
                                loggerClient.log(...report);
                            });
                        });
                    });
                });
            });
        });

        expect(spy.mock.calls.length).toBe(7);

        expect(spy.mock.calls[0][0].parentStep).toBe(null);
        expect(spy.mock.calls[0][0]).toMatchObject(stepsTypes[0]);

        for (let i = 1, len = spy.mock.calls.length; i < len; i++) {
            expect(spy.mock.calls[i][0].parentStep).toBe(
                spy.mock.calls[i - 1][0].stepUid,
            );
            expect(spy.mock.calls[i][0]).toMatchObject(stepsTypes[i]);
        }
    });

    it('should not be inherited', async () => {
        const PREFIX = 'savingPrefix';
        const spy = vi.fn();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport, PREFIX);
        transport.on(LoggerMessageTypes.REPORT, spy);

        try {
            await loggerClient.stepLog('log', () => {
                throw TypeError('Preventing');
            });
        } catch (err) {
            expect(err).toBeInstanceOf(TypeError);
            expect((err as Error).message).toBe('Preventing');
        }

        loggerClient.log(...report);

        expect(spy.mock.calls.length).toBe(2);

        expect(spy.mock.calls[0][0].parentStep).toBe(null);
        expect(spy.mock.calls[1][0]).toMatchObject({
            content: report,
            type: LogTypes.log,
            parentStep: null,
        });
    });

    it('should not be inherited with async callback', async () => {
        const PREFIX = 'savingPrefix';
        const spy = vi.fn();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport, PREFIX);
        transport.on(LoggerMessageTypes.REPORT, spy);

        try {
            await loggerClient.stepLog('log', async () => {
                await loggerClient.stepInfo('info', async () => {
                    throw TypeError('Preventing');
                });
            });
        } catch (err) {
            expect(err).toBeInstanceOf(TypeError);
            expect((err as Error).message).toBe('Preventing');
        }

        loggerClient.log(...report);

        expect(spy.mock.calls.length).toBe(3);

        expect(spy.mock.calls[0][0].parentStep).toBe(null);
        expect(spy.mock.calls[1][0].parentStep).toBe(
            spy.mock.calls[0][0].stepUid,
        );
        expect(spy.mock.calls[2][0]).toMatchObject({
            content: report,
            type: LogTypes.log,
            parentStep: null,
        });
    });

    it('should close one step by message', async () => {
        const PREFIX = 'savingPrefixWithSteps';
        const spy = vi.fn();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport, PREFIX);

        transport.on(LoggerMessageTypes.REPORT, spy);

        loggerClient.startStep('start1');
        loggerClient.startStep('start2');
        loggerClient.endStep('start2');
        loggerClient.log(...report);

        expect(spy.mock.calls.length).toBe(3);

        expect(spy.mock.calls[0][0]).toMatchObject({
            content: ['start1'],
            type: LogTypes.step,
            parentStep: null,
        });

        expect(spy.mock.calls[1][0]).toMatchObject({
            content: ['start2'],
            type: LogTypes.step,
            parentStep: spy.mock.calls[0][0].stepUid,
        });

        expect(spy.mock.calls[2][0]).toMatchObject({
            content: report,
            type: LogTypes.log,
            parentStep: spy.mock.calls[0][0].stepUid,
        });
    });

    it('should close started all steps', async () => {
        const PREFIX = 'savingPrefixWithSteps';
        const spy = vi.fn();
        const transport = new TransportMock();
        const loggerClient = new LoggerClient(transport, PREFIX);

        transport.on(LoggerMessageTypes.REPORT, spy);

        loggerClient.startStep('start1');
        loggerClient.startStep('start2');
        loggerClient.endStep();
        loggerClient.log(...report);

        expect(spy.mock.calls.length).toBe(3);

        expect(spy.mock.calls[0][0]).toMatchObject({
            content: ['start1'],
            type: LogTypes.step,
            parentStep: null,
        });

        expect(spy.mock.calls[1][0]).toMatchObject({
            content: ['start2'],
            type: LogTypes.step,
            parentStep: spy.mock.calls[0][0].stepUid,
        });

        expect(spy.mock.calls[2][0]).toMatchObject({
            content: report,
            type: LogTypes.log,
            parentStep: null,
        });
    });

    it('should broadcast messages from different instances but with saving levels', async () => {
        const PREFIX = 'savingPrefixWithSteps';
        const spy = vi.fn();
        const transport = new TransportMock();
        const loggerParent = new LoggerClient(transport, PREFIX);
        const loggerClient = loggerParent.withPrefix(PREFIX);

        transport.on(LoggerMessageTypes.REPORT, spy);

        await loggerParent.step('start step', () => {
            loggerClient.log(...report);
            loggerParent.info(...report);
        });

        loggerClient.warn(...report);
        loggerParent.error(...report);

        await loggerClient.step('start second step', async () => {
            loggerClient.debug(...report);
            loggerParent.verbose(...report);
        });

        expect(spy.mock.calls.length).toBe(8);

        for (let i = 0, len = spy.mock.calls.length; i < len; i++) {
            expect(spy.mock.calls[i][0].prefix).toBe(PREFIX);
        }

        expect(spy.mock.calls[0][0]).toMatchObject({
            content: ['start step'],
            type: LogTypes.step,
            parentStep: null,
        });
        expect(spy.mock.calls[1][0]).toMatchObject({
            content: report,
            type: LogTypes.log,
            parentStep: spy.mock.calls[0][0].stepUid,
        });
        expect(spy.mock.calls[2][0]).toMatchObject({
            content: report,
            type: LogTypes.info,
            parentStep: spy.mock.calls[0][0].stepUid,
        });

        expect(spy.mock.calls[3][0]).toMatchObject({
            content: report,
            type: LogTypes.warning,
            parentStep: null,
        });
        expect(spy.mock.calls[4][0]).toMatchObject({
            content: report,
            type: LogTypes.error,
            parentStep: null,
        });

        expect(spy.mock.calls[5][0]).toMatchObject({
            content: ['start second step'],
            type: LogTypes.step,
            parentStep: null,
        });
        expect(spy.mock.calls[6][0]).toMatchObject({
            content: report,
            type: LogTypes.debug,
            parentStep: spy.mock.calls[5][0].stepUid,
        });
        expect(spy.mock.calls[7][0]).toMatchObject({
            content: report,
            type: LogTypes.debug,
            parentStep: spy.mock.calls[5][0].stepUid,
        });
    });

    it('should broadcast messages with marker', async () => {
        const MARKER = 1;
        const spy = vi.fn();
        const transport = new TransportMock();
        const loggerParent = new LoggerClient(transport);
        const loggerClient = loggerParent.withMarker(MARKER);

        transport.on(LoggerMessageTypes.REPORT, spy);
        loggerClient.log(...report);
        loggerClient.info(...report);
        loggerClient.warn(...report);
        loggerClient.error(...report);
        loggerClient.debug(...report);
        loggerClient.success(...report);
        loggerClient.verbose(...report);

        expect(spy.mock.calls.length).toBe(7);

        for (let i = 0, len = spy.mock.calls.length; i < len; i++) {
            expect(spy.mock.calls[i][0].marker).toBe(MARKER);
        }
    });

    it('should broadcast messages with marker override marker', async () => {
        const MARKER = 1;
        const spy = vi.fn();
        const transport = new TransportMock();
        const loggerParent = new LoggerClient(transport, null, MARKER);
        const loggerClient = loggerParent.withMarker(null);

        transport.on(LoggerMessageTypes.REPORT, spy);

        loggerParent.log(...report);
        loggerParent.info(...report);
        loggerParent.warn(...report);
        loggerParent.error(...report);
        loggerParent.debug(...report);
        loggerParent.success(...report);
        loggerParent.verbose(...report);

        loggerClient.log(...report);
        loggerClient.info(...report);
        loggerClient.warn(...report);
        loggerClient.error(...report);
        loggerClient.debug(...report);
        loggerClient.success(...report);
        loggerClient.verbose(...report);

        expect(spy.mock.calls.length).toBe(14);

        for (let i = 0, len = spy.mock.calls.length / 2; i < len; i++) {
            expect(spy.mock.calls[i][0].marker).toBe(MARKER);
        }

        for (let i = spy.mock.calls.length / 2, len = spy.mock.calls.length; i < len; i++) {
            expect(spy.mock.calls[i][0].marker).toBe(null);
        }
    });
});
