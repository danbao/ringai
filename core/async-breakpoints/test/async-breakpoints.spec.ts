/* eslint sonarjs/no-identical-functions: 0 */
import {describe, it, expect} from 'vitest';

import {AsyncBreakpoints, BreakStackError} from '../src';

describe('Async Breakpoints', () => {
    it('No breakpoints set', async () => {
        const asyncBreakpoint = new AsyncBreakpoints();

        await asyncBreakpoint.waitBeforeInstructionBreakpoint();
        await asyncBreakpoint.waitAfterInstructionBreakpoint();
    });

    it('Before instruction breakpoint', async () => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addBeforeInstructionBreakpoint();
        const breakpoint = asyncBreakpoint.waitBeforeInstructionBreakpoint();
        setTimeout(() => asyncBreakpoint.resolveBeforeInstructionBreakpoint());

        await breakpoint;
    });

    it('Before instruction breakpoint check', async () => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addBeforeInstructionBreakpoint();

        expect(
            asyncBreakpoint.isBeforeInstructionBreakpointActive(),
        ).toBe(true);
        asyncBreakpoint.resolveBeforeInstructionBreakpoint();
        expect(
            asyncBreakpoint.isBeforeInstructionBreakpointActive(),
        ).toBe(false);
    });

    it('Before break call', () => new Promise<void>((resolve, reject) => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addBeforeInstructionBreakpoint();

        asyncBreakpoint.waitBeforeInstructionBreakpoint().catch((err) => {
            try {
                expect(err).toBeInstanceOf(BreakStackError);
                resolve();
            } catch (e) {
                reject(e);
            }
        });

        asyncBreakpoint.breakStack();
    }));

    it('After instruction breakpoint', async () => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addAfterInstructionBreakpoint();
        const breakpoint = asyncBreakpoint.waitAfterInstructionBreakpoint();
        setTimeout(() => asyncBreakpoint.resolveAfterInstructionBreakpoint());

        await breakpoint;
    });

    it('After instruction breakpoint check', async () => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addAfterInstructionBreakpoint();

        expect(
            asyncBreakpoint.isAfterInstructionBreakpointActive(),
        ).toBe(true);
        asyncBreakpoint.resolveAfterInstructionBreakpoint();
        expect(
            asyncBreakpoint.isAfterInstructionBreakpointActive(),
        ).toBe(false);
    });

    it('After break call', () => new Promise<void>((resolve, reject) => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addAfterInstructionBreakpoint();

        asyncBreakpoint.waitAfterInstructionBreakpoint().catch((err) => {
            try {
                expect(err).toBeInstanceOf(BreakStackError);
                resolve();
            } catch (e) {
                reject(e);
            }
        });

        asyncBreakpoint.breakStack();
    }));

    it('Concurrent same breakpoint call', () => new Promise<void>((resolve, reject) => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addBeforeInstructionBreakpoint();

        Promise.all([
            asyncBreakpoint.waitBeforeInstructionBreakpoint(),
            asyncBreakpoint.waitBeforeInstructionBreakpoint(),
        ])
            .then(() => resolve())
            .catch(() => reject(new Error('Not finished')));

        asyncBreakpoint.resolveBeforeInstructionBreakpoint();
        asyncBreakpoint.resolveAfterInstructionBreakpoint();
    }));

    it('Concurrent different breakpoint break', () => new Promise<void>((resolve, reject) => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addAfterInstructionBreakpoint();

        Promise.all([
            asyncBreakpoint.waitAfterInstructionBreakpoint(),
            asyncBreakpoint.waitAfterInstructionBreakpoint(),
        ]).catch((err) => {
            try {
                expect(err).toBeInstanceOf(BreakStackError);
                resolve();
            } catch (e) {
                reject(e);
            }
        });

        asyncBreakpoint.breakStack();
    }));

    it('Concurrent different breakpoint call', () => new Promise<void>((resolve, reject) => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addBeforeInstructionBreakpoint();
        asyncBreakpoint.addAfterInstructionBreakpoint();

        Promise.all([
            asyncBreakpoint.waitBeforeInstructionBreakpoint(),
            asyncBreakpoint.waitAfterInstructionBreakpoint(),
        ])
            .then(() => resolve())
            .catch(() => reject(new Error('Not finished')));

        asyncBreakpoint.resolveBeforeInstructionBreakpoint();
        asyncBreakpoint.resolveAfterInstructionBreakpoint();
    }));

    it('Concurrent different breakpoint break', () => new Promise<void>((resolve, reject) => {
        const asyncBreakpoint = new AsyncBreakpoints();

        asyncBreakpoint.addBeforeInstructionBreakpoint();
        asyncBreakpoint.addAfterInstructionBreakpoint();

        Promise.all([
            asyncBreakpoint.waitBeforeInstructionBreakpoint(),
            asyncBreakpoint.waitAfterInstructionBreakpoint(),
        ]).catch((err) => {
            try {
                expect(err).toBeInstanceOf(BreakStackError);
                resolve();
            } catch (e) {
                reject(e);
            }
        });

        asyncBreakpoint.breakStack();
    }));
});
