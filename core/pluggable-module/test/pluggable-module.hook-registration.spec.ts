import {describe, it, expect} from 'vitest';
import {PluggableModule} from '../src/pluggable-module';

describe('PluggableModule (hookable) - register/unregister', () => {
    it('registerHook should register and returned disposer should unregister handler', async () => {
        const mod = new PluggableModule();

        const calls: Array<string> = [];

        const dispose = mod.registerHook('my:hook', async () => {
            calls.push('called');
        });

        await mod.getHookable().callHook('my:hook');
        expect(calls).toEqual(['called']);

        // Disposer from hookable removes handler but keeps hook key in internal map
        dispose();

        await mod.getHookable().callHook('my:hook');
        expect(calls).toEqual(['called']);
    });

    it('registerHooks should register multiple hooks and disposer should unregister all handlers', async () => {
        const mod = new PluggableModule();

        const calls: Array<string> = [];

        const dispose = mod.registerHooks({
            a: () => calls.push('a'),
            b: [() => calls.push('b1'), () => calls.push('b2')],
        });

        await mod.getHookable().callHook('a');
        // hookable.addHooks() expands array into "b:0", "b:1" hook names
        await mod.getHookable().callHook('b:0');
        await mod.getHookable().callHook('b:1');
        expect(calls).toEqual(['a', 'b1', 'b2']);

        dispose();

        await mod.getHookable().callHook('a');
        await mod.getHookable().callHook('b:0');
        await mod.getHookable().callHook('b:1');
        expect(calls).toEqual(['a', 'b1', 'b2']);
    });
});
