import {describe, expect, it} from 'vitest';

import {DotReporter} from '../src/reporters/dot-reporter.js';
import {SpecReporter} from '../src/reporters/spec-reporter.js';
import {JsonReporter} from '../src/reporters/json-reporter.js';

describe('core/reporter built-in reporters output', () => {
    it('DotReporter should output stable summary (no colors)', () => {
        const chunks: string[] = [];
        const output = {
            write: (s: string) => {
                chunks.push(s);
                return true;
            },
        } as any;

        const r = new DotReporter({output, colors: false});
        r.onStart({startTime: 1, tests: []});
        r.onTestPass({} as any);
        r.onTestFail({} as any);
        r.onTestSkip({} as any);
        r.onTestPending({} as any);
        r.onEnd({
            startTime: 1,
            endTime: 11,
            duration: 10,
            tests: [],
            state: {total: 4, passed: 1, failed: 1, skipped: 1, pending: 1, retries: 0},
            success: false,
            error: 'boom',
        } as any);

        const out = chunks.join('');
        expect(out).toContain('Ringai Test Runner - Dot Mode');
        expect(out).toContain('Test Summary');
        expect(out).toContain('1 passed');
        expect(out).toContain('1 failed');
        expect(out).toContain('1 skipped');
        expect(out).toContain('1 pending');
        expect(out).toContain('Total: 4 tests');
        expect(out).toContain('Duration: 10ms');
        expect(out).toContain('Error: boom');
        expect(out).toContain('Tests failed');

        // progress markers in order
        expect(out).toContain('.FSP');
    });

    it('SpecReporter should print pass/fail lines and include error message', () => {
        const chunks: string[] = [];
        const output = {
            write: (s: string) => {
                chunks.push(s);
                return true;
            },
        } as any;

        const r = new SpecReporter({output, colors: false});
        r.onStart({startTime: 1, tests: []});
        r.onTestPass({title: 'ok', duration: 5} as any);
        r.onTestFail({title: 'bad', error: {message: 'nope'}} as any);
        r.onEnd({
            state: {total: 2, passed: 1, failed: 1, skipped: 0, pending: 0, retries: 0},
            duration: 10,
            success: false,
        } as any);

        const out = chunks.join('');
        expect(out).toContain('Ringai Test Runner');
        expect(out).toContain('✓ ok (5ms)');
        expect(out).toContain('✗ bad');
        expect(out).toContain('nope');
        expect(out).toContain('Test Summary');
        expect(out).toContain('1 passed');
        expect(out).toContain('1 failed');
        expect(out).toContain('Total: 2 tests');
        expect(out).toContain('Duration: 10ms');
        expect(out).toContain('Tests failed');
    });

    it('JsonReporter should output stable JSON structure', () => {
        const chunks: string[] = [];
        const output = {
            write: (s: string) => {
                chunks.push(s);
                return true;
            },
        } as any;

        const r = new JsonReporter({output, colors: false});
        const startTime = Date.UTC(2020, 0, 1, 0, 0, 0);
        const endTime = startTime + 10;

        r.onStart({startTime, tests: []});
        r.onTestPass({
            title: 'ok',
            fullTitle: 'suite ok',
            status: 'passed',
            duration: 5,
            file: {path: '/a.test.ts'},
            retries: 0,
            startTime,
            endTime,
        } as any);

        r.onEnd({
            startTime,
            endTime,
            duration: 10,
            tests: [],
            state: {total: 1, passed: 1, failed: 0, skipped: 0, pending: 0, retries: 0},
            success: true,
        } as any);

        const out = chunks.join('');
        const parsed = JSON.parse(out);

        expect(parsed.success).toBe(true);
        expect(parsed.stats.tests).toBe(1);
        expect(parsed.stats.passes).toBe(1);
        expect(parsed.tests[0]).toMatchObject({
            title: 'ok',
            fullTitle: 'suite ok',
            state: 'passed',
            duration: 5,
            file: '/a.test.ts',
            retries: 0,
        });
        expect(parsed.tests[0].startTime).toBe(new Date(startTime).toISOString());
        expect(parsed.tests[0].endTime).toBe(new Date(endTime).toISOString());
    });
});
