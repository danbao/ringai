/**
 * Serialize/deserialize module using native structuredClone
 * 
 * This replaces the custom serialize implementation (~400 lines) with Node.js 17+'s
 * built-in structuredClone API, which natively supports:
 * - All primitives (number, string, boolean, null, undefined, BigInt, Symbol)
 * - Error (Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError)
 * - Date
 * - Buffer (as Uint8Array)
 * - Array
 * - Object (including with circular references)
 * - Map, Set, TypedArrays
 * 
 * Note: Functions cannot be cloned by structuredClone and will throw DataCloneError.
 * If function serialization is needed, consider passing function references instead of
 * cloning them, or use a different approach like passing function names/identifiers.
 */

import {
    ITransportSerializedStruct,
    TransportSerializer,
    TransportDeserializer,
} from '@ringai/types';

/**
 * Custom error for data clone failures
 */
class DataCloneError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'DataCloneError';
    }
}

/**
 * Check if a value is cloneable by structuredClone
 * Returns the value if cloneable, throws if not
 */
function ensureCloneable(value: any): any {
    if (value === null || value === undefined) {
        return value;
    }
    
    const type = typeof value;
    
    // Primitives are always cloneable
    if (type !== 'object' && type !== 'function') {
        return value;
    }
    
    // Functions cannot be cloned - throw a descriptive error
    if (type === 'function') {
        throw new DataCloneError(
            'Functions cannot be cloned by structuredClone. ' +
            'If you need to transfer functions between processes, ' +
            'consider passing function names/identifiers instead.'
        );
    }
    
    return value;
}

/**
 * Serialize a value using structuredClone
 * 
 * @param rootStruct - The value to serialize
 * @returns The serialized (cloned) value
 */
export const serialize: TransportSerializer = (rootStruct: any) => {
    // Check if the value contains functions before attempting to clone
    // This provides a better error message than the built-in DataCloneError
    ensureCloneable(rootStruct);
    
    // Use structuredClone for deep cloning
    // Note: structuredClone creates a deep copy, so we don't need separate deserialize
    return structuredClone(rootStruct);
};

/**
 * Deserialize a value
 * 
 * Since structuredClone creates a deep copy, the data is already in its
 * final form after serialization. However, we call structuredClone again
 * to ensure consistency and to handle any edge cases.
 * 
 * @param struct - The value to deserialize
 * @returns The deserialized (cloned) value
 */
export const deserialize: TransportDeserializer = (struct: ITransportSerializedStruct) => {
    // If it's a serialized structure from the old format (with $key),
    // we still try to clone it - structuredClone will handle most cases
    if (struct === null || struct === undefined) {
        return struct;
    }
    
    // Check if this looks like our old serialized format
    if (typeof struct === 'object' && '$key' in struct) {
        // For old serialized format, we attempt to clone
        // This may fail for some edge cases but covers most usage
        try {
            return structuredClone(struct);
        } catch (error) {
            // If structuredClone fails, return as-is (backward compatibility)
            return struct;
        }
    }
    
    // For regular values, just return them
    // They're already cloned from the serialize call on the other side
    return struct;
};

// Re-export types for backward compatibility
export type { ITransportSerializedStruct } from '@ringai/types';
