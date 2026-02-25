import {describe, it, expect, vi} from 'vitest';
import {Transport} from '../src/transport';

describe('Transport', () => {
    it('should emit and receive messages via on()', () => {
        const transport = new Transport();
        const handler = vi.fn();

        transport.on('test', handler);
        transport.broadcast('test', {data: 1});

        expect(handler).toHaveBeenCalledWith({data: 1});
    });

    it('should emit and receive messages via once()', () => {
        const transport = new Transport();
        const handler = vi.fn();

        transport.once('test', handler);
        transport.broadcast('test', 'first');
        transport.broadcast('test', 'second');

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith('first');
    });

    it('should support removing listeners', () => {
        const transport = new Transport();
        const handler = vi.fn();

        const remove = transport.on('test', handler);
        remove();
        transport.broadcast('test', 'data');

        expect(handler).not.toHaveBeenCalled();
    });

    it('send() should emit locally', async () => {
        const transport = new Transport();
        const handler = vi.fn();

        transport.on('test', handler);
        await transport.send('any-process', 'test', {value: 42});

        expect(handler).toHaveBeenCalledWith({value: 42});
    });

    it('broadcast should emit multiple times', () => {
        const transport = new Transport();
        const handler = vi.fn();

        transport.on('msg', handler);

        transport.broadcast('msg', 'a');
        transport.broadcast('msg', 'b');
        transport.broadcast('msg', 'c');

        expect(handler).toHaveBeenCalledTimes(3);
    });


});
