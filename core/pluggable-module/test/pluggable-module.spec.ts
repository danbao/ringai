
import {describe, it, expect} from 'vitest';
import {PluggableModule} from '../src/pluggable-module';

class TestModule extends PluggableModule {
    static hookName = 'testHook';

    constructor() {
        super([TestModule.hookName]);
    }

    call(...args: { main?: number; mainExtra?: number; }[]) {
        return this.callHook(TestModule.hookName, ...args);
    }
}

describe('PluggableModule', () => {
    it('should handle sync hooks', () => new Promise<void>((resolve) => {
        const testData = {};
        const testModule = new TestModule();
        const hook = testModule.getHook(TestModule.hookName);

        if (hook) {
            hook.readHook('testPlugin', (data: any) => {
                expect(data).toBe(testData);
                resolve();
            });

            testModule.call(testData);
        }
    }));

    it('should handle async hooks', async () => {
        const testData = {main: 1};
        const testModule = new TestModule();
        const hook = testModule.getHook(TestModule.hookName);

        if (hook) {
            hook.writeHook('testPlugin', async (data: any) => {
                return {
                    ...data,
                    additional: 1,
                };
            });

            const result = await testModule.call(testData);

            expect(result).toEqual({
                main: 1,
                additional: 1,
            });
        }
    });

    it('should process multiple arguments', async () => {
        const testData = {main: 1};
        const testDataExtra = {mainExtra: 2};
        const additional = {additional: 1};

        const expectedResult = {
            main: 1,
            mainExtra: 2,
            additional: 1,
        };

        const testModule = new TestModule();
        const hook = testModule.getHook(TestModule.hookName);

        // eslint-disable-next-line no-unused-expressions
        expect(!!hook).toBe(true);

        if (hook) {
            hook.writeHook('testPlugin1', async (data: any, dataExtra: any) => {
                expect(data).toEqual(testData);
                expect(dataExtra).toEqual(testDataExtra);
                return {
                    ...data,
                    ...dataExtra,
                    ...additional,
                };
            });
            hook.writeHook('testPlugin2', async (data: any, dataExtra: any) => {
                expect(data).toEqual(expectedResult);
                expect(dataExtra).toEqual(testDataExtra);
                return {
                    ...data,
                };
            });

            const result = await testModule.call(testData, testDataExtra);

            expect(result).toEqual(expectedResult);
        }
    });
});
