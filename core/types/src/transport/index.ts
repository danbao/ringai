import {TransportMessageHandler} from './structs';

type RemoveHandlerFunction = () => void;

export interface ITransport {
    send<T = unknown>(
        processID: string,
        messageType: string,
        payload: T,
    ): Promise<void>;

    broadcast<T = unknown>(messageType: string, payload: T): void;

    on<T = unknown>(
        messageType: string,
        callback: TransportMessageHandler<T>,
    ): RemoveHandlerFunction;

    once<T = unknown>(
        messageType: string,
        callback: TransportMessageHandler<T>,
    ): RemoveHandlerFunction;
}
