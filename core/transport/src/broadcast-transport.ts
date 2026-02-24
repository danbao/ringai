import {
    TransportInternalMessageType,
    TransportMessageHandler,
    ITransportBroadcastMessage,
    ITransportDirectMessage,
    ITransportSerializedStruct,
} from '@ringai/types';
import {deserialize, serialize} from './serialize';

function isSerializedStruct(v: unknown): v is ITransportSerializedStruct {
    return v !== null && typeof v === 'object' && '$key' in v && typeof (v as ITransportSerializedStruct).$key === 'string';
}

class BroadcastTransport {
    constructor(
        private triggerListeners: TransportMessageHandler,
        private rootProcess: NodeJS.Process,
    ) {
        this.registerRootProcess();
    }

    /**
     * Sending message to all connected processes
     */
    public broadcast(type: string, payload: unknown): void {
        this.sendMessage({
            type,
            payload: serialize(payload),
        });
    }

    public broadcastLocal(type: string, payload: unknown) {
        this.triggerListeners({
            type,
            payload,
        });
    }

    private registerRootProcess() {
        this.rootProcess.on('message', (message) =>
            this.handleRootProcessMessage(message as ITransportDirectMessage),
        );
    }

    private handleRootProcessMessage(message: ITransportDirectMessage) {
        if (!message || typeof message.type !== 'string') {
            return;
        }

        let normalizedMessage: ITransportDirectMessage = message;

        if (isSerializedStruct(message.payload)) {
            normalizedMessage = {
                ...message,
                payload: deserialize(message.payload),
            };
        }

        this.triggerListeners(normalizedMessage);

        this.sendMessage({
            type: TransportInternalMessageType.messageResponse,
            payload: normalizedMessage.uid,
        });
    }

    private sendMessage(message: ITransportBroadcastMessage) {
        if (typeof this.rootProcess.send === 'function') {
            this.rootProcess.send(message);
        }
    }
}

export {BroadcastTransport};
