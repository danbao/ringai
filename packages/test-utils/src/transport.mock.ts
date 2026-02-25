import {EventEmitter} from 'events';
import {ITransport} from '@ringai/types';

export class TransportMock extends EventEmitter implements ITransport {
    public getProcessStdioConfig() {
        return [];
    }

    public broadcast<T = any>(messageType: string, payload: T) {
        this.emit(messageType, payload);
    }

    public broadcastFrom<T = any>(
        messageType: string,
        payload: T,
        processID: string,
    ) {
        this.emit(messageType, payload, processID);
    }

    public send<T = any>(
        _src: string,
        messageType: string,
        payload: T,
    ): Promise<void> {
        this.emit(messageType, payload);

        return Promise.resolve();
    }

    public override on<T = any>(
        messageType: string,
        callback: (m: T, source?: string) => void,
    ): any {
        super.on(messageType, callback);

        return () => this.removeListener(messageType, callback);
    }

    public override once<T = any>(
        messageType: string,
        callback: (m: T, source?: string) => void,
    ): any {
        const wrappedCallback = (message: T, source?: string) => {
            this.removeListener(messageType, wrappedCallback);
            callback(message, source);
        };

        super.on(messageType, wrappedCallback);

        return () => this.removeListener(messageType, wrappedCallback);
    }
}
