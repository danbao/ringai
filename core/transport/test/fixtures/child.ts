import process from 'node:process';
import {Transport} from '@ringai/transport';
import {PAYLOAD, REQUEST_NAME, RESPONSE_NAME} from './constants.ts';

const transport = new Transport(process);

transport.on(REQUEST_NAME, () => {
    transport.broadcast(RESPONSE_NAME, PAYLOAD);
});
