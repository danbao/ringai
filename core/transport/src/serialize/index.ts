import {
    ITransportSerializedStruct,
    TransportSerializer,
    TransportDeserializer,
} from '@ringai/types';

const FUNCTION_MARKER = '__$$fn$$__';

function prepareForClone(value: any, seen = new WeakSet()): any {
    if (value === null || value === undefined) return value;

    const type = typeof value;
    if (type === 'function') {
        return { [FUNCTION_MARKER]: value.toString() };
    }
    if (type !== 'object') return value;

    if (seen.has(value)) return value;
    seen.add(value);

    if (Array.isArray(value)) {
        let changed = false;
        const result = value.map((item) => {
            const prepared = prepareForClone(item, seen);
            if (prepared !== item) changed = true;
            return prepared;
        });
        return changed ? result : value;
    }

    if (value instanceof Date || value instanceof RegExp ||
        value instanceof Error || value instanceof Map ||
        value instanceof Set || ArrayBuffer.isView(value)) {
        return value;
    }

    let changed = false;
    const result: Record<string, any> = {};
    for (const key of Object.keys(value)) {
        const prepared = prepareForClone(value[key], seen);
        if (prepared !== value[key]) changed = true;
        result[key] = prepared;
    }
    return changed ? result : value;
}

function restoreFromClone(value: any): any {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'object') return value;

    if (Array.isArray(value)) {
        let changed = false;
        const result = value.map((item) => {
            const restored = restoreFromClone(item);
            if (restored !== item) changed = true;
            return restored;
        });
        return changed ? result : value;
    }

    if (value[FUNCTION_MARKER]) {
        // eslint-disable-next-line no-eval
        return (0, eval)(`(${value[FUNCTION_MARKER]})`);
    }

    if (value instanceof Date || value instanceof RegExp ||
        value instanceof Error || value instanceof Map ||
        value instanceof Set || ArrayBuffer.isView(value)) {
        return value;
    }

    let changed = false;
    const result: Record<string, any> = {};
    for (const key of Object.keys(value)) {
        const restored = restoreFromClone(value[key]);
        if (restored !== value[key]) changed = true;
        result[key] = restored;
    }
    return changed ? result : value;
}

export const serialize: TransportSerializer = (rootStruct: any) => {
    const prepared = prepareForClone(rootStruct);
    return structuredClone(prepared);
};

export const deserialize: TransportDeserializer = (struct: ITransportSerializedStruct) => {
    if (struct === null || struct === undefined) return struct;
    return restoreFromClone(struct);
};

export type { ITransportSerializedStruct } from '@ringai/types';
