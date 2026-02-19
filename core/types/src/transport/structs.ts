export type TransportMessageHandler<T = unknown> = (
    payload: T,
    source?: string,
) => void;

export type TransportSerializer = (v: unknown) => ITransportSerializedStruct;

export type TransportDeserializer = (struct: ITransportSerializedStruct) => unknown;

export interface ITransportSerializedStruct {
    $key: string;

    [key: string]: unknown;
}

export interface ITransportMessage<T = unknown> {
    type: string;
    payload: T;
}

export interface ITransportDirectMessage extends ITransportMessage {
    uid: string;
}

export type ITransportBroadcastMessage = ITransportMessage;
