import {describe, it, expect} from 'vitest';
import {Hook} from '../src/hook';

describe('Hook (legacy) - execution order & error propagation', () => {
    it('should execute write hooks in insertion order, then read hooks in insertion order', async () => {
        const hook = new Hook();

        const calls: string[] = [];

        hook.writeHook('w1', async (value: number) => {
            calls.push('w1');
            return value + 1;
        });
        hook.writeHook('w2', async (value: number) => {
            calls.push('w2');
            return value * 2;
        });

        hook.readHook('r1', async (value: number) => {
            calls.push(`r1:${value}`);
        });
        hook.readHook('r2', async (value: number) => {
            calls.push(`r2:${value}`);
        });

        const result = await hook.callHooks<number>(1);

        // ((1 + 1) * 2) = 4
        expect(result).toBe(4);
        expect(calls).toEqual(['w1', 'w2', 'r1:4', 'r2:4']);
    });

    it('should fail-fast when a write hook throws and wrap error with plugin name', async () => {
        const hook = new Hook();

        const calls: string[] = [];

        hook.writeHook('w1', async (value: number) => {
            calls.push('w1');
            return value + 1;
        });

        hook.writeHook('badPlugin', async () => {
            calls.push('bad');
            throw new Error('boom');
        });

        hook.writeHook('w3', async () => {
            calls.push('w3');
            return 999;
        });

        hook.readHook('r1', async () => {
            calls.push('r1');
        });

        let caught: any;
        try {
            await hook.callHooks(1);
        } catch (e) {
            caught = e;
        }

        expect(caught).toBeInstanceOf(Error);
        expect(String(caught.message)).toContain('Plugin badPlugin failed: boom');
        // fail-fast: w3 and reads are not executed
        expect(calls).toEqual(['w1', 'bad']);
    });

    it('should fail-fast when a read hook throws and wrap error with plugin name', async () => {
        const hook = new Hook();

        const calls: string[] = [];

        hook.writeHook('w1', async (value: number) => {
            calls.push('w1');
            return value + 1;
        });

        hook.readHook('r1', async () => {
            calls.push('r1');
        });
        hook.readHook('badRead', async () => {
            calls.push('badRead');
            throw new Error('read boom');
        });
        hook.readHook('r3', async () => {
            calls.push('r3');
        });

        let caught: any;
        try {
            await hook.callHooks(1);
        } catch (e) {
            caught = e;
        }

        expect(caught).toBeInstanceOf(Error);
        expect(String(caught.message)).toContain('Plugin badRead failed: read boom');
        expect(calls).toEqual(['w1', 'r1', 'badRead']);
    });
});
