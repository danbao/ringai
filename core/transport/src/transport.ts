import {
    ITransport,
    IWorkerEmitter,
    TransportMessageHandler,
} from '@ringai/types';
import {EventEmitter} from 'events';

export class Transport implements ITransport {
    private emitter: EventEmitter = new EventEmitter();

    public send<T = unknown>(
        _processID: string,
        messageType: string,
        payload: T,
    ): Promise<void> {
        this.emitter.emit(messageType, payload);
        return Promise.resolve();
    }

    public broadcast<T = unknown>(messageType: string, payload: T): void {
        this.emitter.emit(messageType, payload);
    }

    public broadcastLocal<T = unknown>(messageType: string, payload: T): void {
        this.emitter.emit(messageType, payload);
    }

    public broadcastUniversally<T = unknown>(
        messageType: string,
        payload: T,
    ): void {
        this.emitter.emit(messageType, payload);
    }

    public isChildProcess() {
        return false;
    }

    public registerChild(_processID: string, _child: IWorkerEmitter) {
        // No-op: single process, no child processes
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
        _processID: string,
        messageType: string,
        callback: TransportMessageHandler<T>,
    ) {
        this.emitter.once(messageType, callback);
        return () => this.emitter.removeListener(messageType, callback);
    }
}
