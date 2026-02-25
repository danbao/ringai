
import {describe, it, expect, afterEach} from 'vitest';
import {fileReaderFactory, fileResolverFactory} from '@ringai/test-utils';
import {Sandbox} from '../src/sandbox';

const fixturesFileReader = fileReaderFactory(__dirname, 'fixtures', 'sandbox');
const fixturesFileResolver = fileResolverFactory(
    __dirname,
    'fixtures',
    'sandbox',
);

const createExportFromGlobal = (key: string) => {
    return `module.exports = global["${key}"];`;
};

describe('Sandbox', () => {
    afterEach(() => Sandbox.clearCache());

    // TODO (flops) add dependencies tests

    describe('Compilation', () => {
        it('should compile module', async () => {
            const source = await fixturesFileReader('simple-module.js');
            const sandbox = new Sandbox(source, 'simple-module.js', {});
            const module = sandbox.execute();

            expect(module).toBe('Hello, world!');
        });

        it('should throw exception, if code have some inner exceptions', async () => {
            const source = await fixturesFileReader('eval-error.js');
            const sandbox = new Sandbox(source, 'eval-error.js', {});

            try {
                sandbox.execute();

                return Promise.reject('Code was compiled');
            } catch {
                return Promise.resolve();
            }
        });

        it("should throw SyntaxError, when can't compile code", async () => {
            const source = await fixturesFileReader('es6-export.js');
            const sandbox = new Sandbox(source, 'es6-export.js', {});

            try {
                sandbox.execute();

                return Promise.reject('Code was compiled');
            } catch (error) {
                expect(error).toBeInstanceOf(SyntaxError);
            }
        });

        it('should wrap string exception into EvalError', async () => {
            const source = await fixturesFileReader('string-exception.js');
            const sandbox = new Sandbox(source, 'string-exception.js', {});

            try {
                sandbox.execute();

                return Promise.reject('Code was compiled');
            } catch (exception) {
                expect(exception).toBeInstanceOf(EvalError);
            }
        });
    });

    describe('Environment', () => {
        it('should have all primitives provided', async () => {
            const source = await fixturesFileReader('primitives.js');
            const sandbox = new Sandbox(source, 'primitives.js', {});

            sandbox.execute(); // should not throw
        });

        it('should correctly pass "instanceof" check for all primitives', async () => {
            const source = await fixturesFileReader('primitives.js');
            const sandbox = new Sandbox(source, 'primitives.js', {});
            const {array, map, set, weakMap, weakSet, promise, buffer, error} =
                sandbox.execute();

            expect(array instanceof Array).toBe(true);
            expect(map instanceof Map).toBe(true);
            expect(set instanceof Set).toBe(true);
            expect(weakMap instanceof WeakMap).toBe(true);
            expect(weakSet instanceof WeakSet).toBe(true);
            expect(promise instanceof Promise).toBe(true);
            expect(buffer instanceof Buffer).toBe(true);
            expect(error instanceof Error).toBe(true);
        });

        it('should set global variables into own context', async () => {
            const source = await fixturesFileReader('global-variable.js');
            const sandbox = new Sandbox(source, 'global-variable.js', {});

            const module = sandbox.execute();
            const context = sandbox.getContext();

            expect(module).toBe(true);
            expect(context['amaGlobal']).toBe(true);
            expect((global as any)['amaGlobal']).toBe(undefined);
        });

        it('should correctly handle function declarations', async () => {
            const source = await fixturesFileReader('function-declaration.js');
            const sandbox = new Sandbox(source, 'function-declaration.js', {});

            sandbox.execute();

            expect(sandbox.execute()).toBe(1);
        });

        it('should read global variables from current process context', () => {
            const key = '__$test-machine_sandbox_test_dependency$__';
            const sandbox = new Sandbox(
                createExportFromGlobal(key),
                'global.js',
                {},
            );

            (global as any)[key] = {};

            sandbox.execute();

            const context = sandbox.getContext();

            expect(context[key]).toBe((global as any)[key]);

            delete (global as any)[key];
        });
    });

    describe('Resolve', () => {
        it('should import from "node_modules"', async () => {
            const source = await fixturesFileReader('external-dependency.js');
            const sandbox = new Sandbox(source, 'external-dependency.js', {});

            expect(sandbox.execute()).toBe(true);
        });

        it('should import native module', async () => {
            const source = await fixturesFileReader('native-dependency.js');
            const sandbox = new Sandbox(source, 'native-dependency.js', {});

            expect(sandbox.execute()).toBe(true);
        });

        it("should throw ReferenceError, when can't resolve dependency", async () => {
            const source = await fixturesFileReader('invalid-dependency.js');
            const sandbox = new Sandbox(source, 'invalid-dependency.js', {});

            try {
                sandbox.execute();

                return Promise.reject('Code was compiled');
            } catch (error) {
                expect(error).toBeInstanceOf(Error);
            }
        });

        it('should resolve circular dependencies', async () => {
            const testData = {
                test: true,
                someData: [1, 2, 3],
            };

            const sourceName1 = './cyclic-dependency';
            const sourceName2 = './cyclic-dependency-2';

            const sourceNameFile1 = sourceName1 + '.js';
            const sourceNameFile2 = sourceName2 + '.js';

            const source1 = await fixturesFileReader(sourceNameFile1);
            const source2 = `
                require('${sourceName1}');
                
                module.exports = ${JSON.stringify(testData)};
            `;

            const filePath1 = await fixturesFileResolver(sourceNameFile1);
            const filePath2 = await fixturesFileResolver(sourceNameFile2);

            const sandbox1 = new Sandbox(source1, filePath1, {
                [filePath1]: {
                    [sourceName2]: {
                        path: filePath2,
                        content: source2,
                    },
                },
                [filePath2]: {
                    [sourceName1]: {
                        path: filePath1,
                        content: source1,
                    },
                },
            });

            const result = sandbox1.execute();

            expect(result).toEqual(testData);
        });

        it('should handle error propagation in circular dependency', async () => {
            const sourceName1 = './cyclic-dependency';
            const sourceName2 = './cyclic-dependency-2';

            const sourceNameFile1 = sourceName1 + '.js';
            const sourceNameFile2 = sourceName2 + '.js';

            const source1 = await fixturesFileReader(sourceNameFile1);
            const source2 = `
                require('${sourceName1}');
                
                throw new Error('test');
            `;

            const filePath1 = await fixturesFileResolver(sourceNameFile1);
            const filePath2 = await fixturesFileResolver(sourceNameFile2);

            let error;

            try {
                const sandbox1 = new Sandbox(source1, filePath1, {
                    [filePath1]: {
                        [sourceName2]: {
                            path: filePath2,
                            content: source2,
                        },
                    },
                });

                sandbox1.execute();

                error = new Error('code executed somehow');
            } catch {
                error = null;
            }

            if (error) {
                throw error;
            }
        });
    });

    describe('Exports', () => {
        it('should correctly handle exports reference', async () => {
            const source = await fixturesFileReader('exports-reference.js');
            const sandbox = new Sandbox(source, 'exports-reference.js', {});

            expect(sandbox.execute().data).toBe(true);
        });

        it('should add fields to "module" object', async () => {
            const source = await fixturesFileReader('module-mutation.js');
            const sandbox = new Sandbox(source, 'module-mutation.js', {});

            const module = sandbox.execute();
            const context = sandbox.getContext();

            expect(module).toBe(true);
            expect(context.module.customField).toBe(true);
        });

        it('should correctly provide commonjs module.exports object', async () => {
            const source = await fixturesFileReader(
                'commonjs-module-exports.js',
            );
            const sandbox = new Sandbox(
                source,
                'commonjs-module-exports.js',
                {},
            );

            expect(sandbox.execute().equals).toBe(true);
        });

        it('should correctly provide commonjs exports object', async () => {
            const source = await fixturesFileReader('commonjs-exports.js');
            const sandbox = new Sandbox(source, 'commonjs-exports.js', {});

            expect(sandbox.execute().equals).toBe(true);
        });
    });

    describe('Evaluate', () => {
        it('Evaluate code in sandbox', async () => {
            const source = 'var test = 10;';
            const sandbox = new Sandbox(source, 'test-data.js', {});

            await sandbox.execute();

            await Sandbox.evaluateScript('test-data.js', 'test = 20;');
            const context = sandbox.getContext();
            expect(context.test).toBe(20);
        });
    });
});
