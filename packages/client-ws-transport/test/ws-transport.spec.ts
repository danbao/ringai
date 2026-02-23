import {describe, it, beforeEach, afterEach} from 'vitest';
import {strict as assert} from 'node:assert';

import {ClientWsTransportEvents, DevtoolEvents} from '@testring/types';
import {ClientWsTransport} from '../src/ws-transport.js';

class FakeWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;

    public readyState = FakeWebSocket.CONNECTING;
    public url: string;

    public onopen: null | (() => void) = null;
    public onmessage: null | ((message: {data: any}) => void) = null;
    public onclose: null | (() => void) = null;
    public onerror: null | ((e: any) => void) = null;

    public sent: any[] = [];
    public closeCalls = 0;

    constructor(url: string) {
        this.url = url;
        FakeWebSocket.instances.push(this);
    }

    static instances: FakeWebSocket[] = [];

    send(data: any) {
        this.sent.push(data);
    }

    close() {
        this.closeCalls++;
        this.readyState = FakeWebSocket.CLOSED;
        this.onclose?.();
    }

    _open() {
        this.readyState = FakeWebSocket.OPEN;
        this.onopen?.();
    }

    _message(data: any) {
        this.onmessage?.({data});
    }

    _error(err: any) {
        this.onerror?.(err);
    }
}

describe('ClientWsTransport', () => {
    const realWebSocket = (globalThis as any).WebSocket;

    beforeEach(() => {
        FakeWebSocket.instances = [];
        (globalThis as any).WebSocket = FakeWebSocket as any;
    });

    afterEach(() => {
        (globalThis as any).WebSocket = realWebSocket;
    });

    it('connect() disconnects previous connection (re-entrant connect) and sets handlers', () => {
        const transport = new ClientWsTransport('localhost', 1234, false);

        transport.connect('ws://first');
        assert.equal(FakeWebSocket.instances.length, 1);
        const first = FakeWebSocket.instances[0]!;

        transport.connect('ws://second');
        assert.equal(first.closeCalls, 1);
        assert.equal(FakeWebSocket.instances.length, 2);
        const second = FakeWebSocket.instances[1]!;

        assert.equal(typeof second.onopen, 'function');
        assert.equal(typeof second.onmessage, 'function');
        assert.equal(typeof second.onclose, 'function');
        assert.equal(typeof second.onerror, 'function');

        assert.equal(transport.getConnectionStatus(), false);
        second._open();
        assert.equal(transport.getConnectionStatus(), true);
    });

    it('disconnect() closes connection if exists and emits CLOSE', () => {
        const transport = new ClientWsTransport('localhost', 1234, false);

        const events: string[] = [];
        transport.on(ClientWsTransportEvents.CLOSE, () => events.push('close'));

        transport.connect('ws://x');
        const ws = FakeWebSocket.instances[0]!;
        ws._open();

        transport.disconnect();
        assert.equal(ws.closeCalls, 1);
        assert.deepEqual(events, ['close']);
    });

    it('send() queues messages until OPEN then flushes on OPEN in order', async () => {
        const transport = new ClientWsTransport('localhost', 1234, false);
        transport.connect('ws://x');
        const ws = FakeWebSocket.instances[0]!;

        const p1 = transport.send(DevtoolEvents.HANDSHAKE_REQUEST, {appId: 'a'});
        const p2 = transport.send(DevtoolEvents.HANDSHAKE_REQUEST, {appId: 'b'});

        assert.equal(ws.sent.length, 0);

        ws._open();
        await Promise.all([p1, p2]);

        assert.equal(ws.sent.length, 2);
        assert.deepEqual(JSON.parse(ws.sent[0]), {
            type: DevtoolEvents.HANDSHAKE_REQUEST,
            payload: {appId: 'a'},
        });
        assert.deepEqual(JSON.parse(ws.sent[1]), {
            type: DevtoolEvents.HANDSHAKE_REQUEST,
            payload: {appId: 'b'},
        });
    });

    it('messageHandler parses JSON string data and passes through non-JSON', () => {
        const transport = new ClientWsTransport('localhost', 1234, false);
        transport.connect('ws://x');
        const ws = FakeWebSocket.instances[0]!;

        const received: any[] = [];
        transport.on(ClientWsTransportEvents.MESSAGE, (m) => received.push(m));

        ws._message('{"type":"X","payload":1}');
        ws._message('not-json');
        ws._message({raw: true});

        assert.deepEqual(received[0], {type: 'X', payload: 1});
        assert.equal(received[1], 'not-json');
        assert.deepEqual(received[2], {raw: true});
    });

    it('handshake() resolves on HANDSHAKE_RESPONSE without error, and rejects when payload.error is string', async () => {
        const transport = new ClientWsTransport('localhost', 1234, false);
        transport.connect('ws://x');
        const ws = FakeWebSocket.instances[0]!;
        ws._open();

        const ok = transport.handshake('app');
        ws._message(
            JSON.stringify({
                type: DevtoolEvents.HANDSHAKE_RESPONSE,
                payload: {error: null},
            }),
        );
        await ok;

        const bad = transport.handshake('app');
        ws._message(
            JSON.stringify({
                type: DevtoolEvents.HANDSHAKE_RESPONSE,
                payload: {error: 'nope'},
            }),
        );
        await assert.rejects(bad, /nope/);
    });

    it('reconnects on error when shouldReconnect=true using previous url', () => {
        const transport = new ClientWsTransport('localhost', 1234, true);
        transport.connect('ws://first');
        const first = FakeWebSocket.instances[0]!;

        first._error(new Error('boom'));

        assert.equal(FakeWebSocket.instances.length, 2);
        const second = FakeWebSocket.instances[1]!;
        assert.equal(first.closeCalls, 1);
        assert.equal(second.url, 'ws://first');
    });
});
