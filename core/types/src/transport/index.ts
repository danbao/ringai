import {EventEmitter} from 'events';
import {TransportMessageHandler} from './structs';

type RemoveHandlerFunction = () => void;

// Worker process message types
export type WorkerMessage = {
    type: string;
    payload: unknown;
};

// Worker events for type-safe event emitter
export type WorkerEvents = {
    close: [code: number, signal: string];
    disconnect: [];
    error: [err: Error];
    exit: [code: number, signal: string];
};

export interface IWorkerEmitter extends EventEmitter {
    send(message: WorkerMessage, callback?: (error: Error | null) => void): boolean;
    kill(signal?: NodeJS.Signals): void;

    addListener<K extends keyof WorkerEvents>(event: K, listener: (...args: WorkerEvents[K]) => void): this;
    addListener(event: string, listener: (...args: unknown[]) => void): this;
    addListener(
        event: 'close',
        listener: (code: number, signal: string) => void,
    ): this;
    addListener(event: 'disconnect', listener: () => void): this;
    addListener(event: 'error', listener: (err: Error) => void): this;
    addListener(
        event: 'exit',
        listener: (code: number, signal: string) => void,
    ): this;

    emit<K extends keyof WorkerEvents>(event: K, ...args: WorkerEvents[K]): boolean;
    emit(event: string | symbol, ...args: unknown[]): boolean;
    emit(event: 'close', code: number, signal: string): boolean;
    emit(event: 'disconnect'): boolean;
    emit(event: 'error', err: Error): boolean;
    emit(event: 'exit', code: number, signal: string): boolean;

    on<K extends keyof WorkerEvents>(event: K, listener: (...args: WorkerEvents[K]) => void): this;
    on(event: string, listener: (...args: unknown[]) => void): this;
    on(event: 'close', listener: (code: number, signal: string) => void): this;
    on(event: 'disconnect', listener: () => void): this;
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'exit', listener: (code: number, signal: string) => void): this;

    once<K extends keyof WorkerEvents>(event: K, listener: (...args: WorkerEvents[K]) => void): this;
    once(event: string, listener: (...args: unknown[]) => void): this;
    once(
        event: 'close',
        listener: (code: number, signal: string) => void,
    ): this;
    once(event: 'disconnect', listener: () => void): this;
    once(event: 'error', listener: (err: Error) => void): this;
    once(event: 'exit', listener: (code: number, signal: string) => void): this;

    prependListener<K extends keyof WorkerEvents>(event: K, listener: (...args: WorkerEvents[K]) => void): this;
    prependListener(event: string, listener: (...args: unknown[]) => void): this;
    prependListener(
        event: 'close',
        listener: (code: number, signal: string) => void,
    ): this;
    prependListener(event: 'disconnect', listener: () => void): this;
    prependListener(event: 'error', listener: (err: Error) => void): this;
    prependListener(
        event: 'exit',
        listener: (code: number, signal: string) => void,
    ): this;

    prependOnceListener<K extends keyof WorkerEvents>(event: K, listener: (...args: WorkerEvents[K]) => void): this;
    prependOnceListener(
        event: string,
        listener: (...args: unknown[]) => void,
    ): this;
    prependOnceListener(
        event: 'close',
        listener: (code: number, signal: string) => void,
    ): this;
    prependOnceListener(event: 'disconnect', listener: () => void): this;
    prependOnceListener(event: 'error', listener: (err: Error) => void): this;
    prependOnceListener(
        event: 'exit',
        listener: (code: number, signal: string) => void,
    ): this;
}

export interface ITransport {
    send<T = unknown>(
        processID: string,
        messageType: string,
        payload: T,
    ): Promise<void>;

    broadcast<T = unknown>(messageType: string, payload: T): void;

    broadcastLocal<T = unknown>(messageType: string, payload: T): void;

    broadcastUniversally<T = unknown>(messageType: string, payload: T): void;

    isChildProcess(): boolean;

    registerChild(processID: string, child: IWorkerEmitter): void;

    on<T = unknown>(
        messageType: string,
        callback: TransportMessageHandler<T>,
    ): RemoveHandlerFunction;

    once<T = unknown>(
        messageType: string,
        callback: TransportMessageHandler<T>,
    ): RemoveHandlerFunction;

    onceFrom<T = unknown>(
        processID: string,
        messageType: string,
        callback: TransportMessageHandler<T>,
    ): RemoveHandlerFunction;
}
