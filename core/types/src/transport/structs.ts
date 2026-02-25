export type TransportMessageHandler<T = unknown> = (
    payload: T,
    source?: string,
) => void;
