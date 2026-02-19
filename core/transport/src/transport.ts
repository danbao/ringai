import process from 'node:process';

import {isChildProcess} from '@testring/child-process';
import {
    ITransport,
    IWorkerEmitter,
    TransportMessageHandler,
    ITransportDirectMessage,
} from '@testring/types';
import {DirectTransport} from './direct-transport';
import {BroadcastTransport} from './broadcast-transport';
import {EventEmitter} from 'events';

const IS_CHILD_PROCESS = isChildProcess();

export class Transport implements ITransport {
    private emitter: EventEmitter = new EventEmitter();

    private directTransport: DirectTransport;

    private broadcastTransport: BroadcastTransport;

    constructor(
        rootProcess: NodeJS.Process = process,
        private broadcastToLocal: boolean = IS_CHILD_PROCESS,
    ) {
        const handler: TransportMessageHandler = (payload, source) =>
            this.triggerListeners(payload as ITransportDirectMessage, source);

        this.directTransport = new DirectTransport(handler);

        this.broadcastTransport = new BroadcastTransport(handler, rootProcess);
    }

    public getProcessesList(): Array<string> {
        return this.directTransport.getProcessesList();
    }

    public send(
        processID: string,
        messageType: string,
        payload: unknown,
    ): Promise<void> {
        return this.directTransport.send(processID, messageType, payload);
    }

    public broadcast(messageType: string, payload: unknown): void {
        this.broadcastTransport.broadcast(messageType, payload);
    }

    public broadcastLocal(messageType: string, payload: unknown): void {
        this.broadcastTransport.broadcastLocal(messageType, payload);
    }

    public broadcastUniversally(
        messageType: string,
        payload: unknown,
    ): void {
        if (this.isChildProcess()) {
            this.broadcast(messageType, payload);
        } else {
            this.broadcastLocal(messageType, payload);
        }
    }

    public isChildProcess() {
        return this.broadcastToLocal;
    }

    public registerChild(processID: string, child: IWorkerEmitter) {
        this.directTransport.registerChild(processID, child);
    }

    public on<T = unknown>(
        messageType: string,
        callback: TransportMessageHandler<T>,
    ) {
        this.emitter.on(messageType, callback);

        return () => this.emitter.removeListener(messageType, callback);
    }

    public once<T = unknown>(
        messageType: string,
        callback: TransportMessageHandler<T>,
    ) {
        this.emitter.once(messageType, callback);

        return () => this.emitter.removeListener(messageType, callback);
    }

    public onceFrom<T = unknown>(
        processID: string,
        messageType: string,
        callback: TransportMessageHandler<T>,
    ) {
        const handler = (message: T, source: string) => {
            if (processID === source) {
                callback(message);
                this.emitter.removeListener(messageType, handler);
            }
        };

        this.emitter.on(messageType, handler);

        return () => this.emitter.removeListener(messageType, handler);
    }

    private triggerListeners(
        message: ITransportDirectMessage,
        processID?: string,
    ) {
        this.emitter.emit(message.type, message.payload, processID);
    }
}
