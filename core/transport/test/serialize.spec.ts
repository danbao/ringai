import * as chai from 'chai';
import {serialize, deserialize} from '../src/serialize';

describe('serialize', () => {
    it('should serialize array without data loss', () => {
        const data = [
            0,
            1,
            'string',
            null,
            undefined,
            NaN,
            {
                array: [null, 'another string', 2],
            },
        ];
        const serializedData = serialize(data);
        const deserializedData = deserialize(serializedData);

        chai.expect(deserializedData).to.be.deep.equal(data);
    });

    it('should serialize error', () => {
        const errorTypes = [
            'EvalError',
            'RangeError',
            'ReferenceError',
            'SyntaxError',
            'TypeError',
            'URIError',
        ];

        for (const errorType of errorTypes) {
            const error = new (global as Record<string, any>)[errorType]('test');

            const serializedError = serialize(error);
            const deserializedError = deserialize(serializedError);

            chai.expect(deserializedError.name).to.be.equal(error.name);
            chai.expect(deserializedError.message).to.be.equal(error.message);
            chai.expect(deserializedError.stack).to.be.equal(error.stack);
        }
    });

    it('should serialize custom error', () => {
        class CustomError extends Error {}

        const error = new CustomError('test');

        const serializedError = serialize(error);
        const deserializedError = deserialize(serializedError);

        chai.expect(deserializedError.name).to.be.equal('Error');
        chai.expect(deserializedError.message).to.be.equal(error.message);
        chai.expect(deserializedError.stack).to.be.equal(error.stack);
    });

    it('should serialize and deserialize functions via string representation', () => {
        const arrowFunction = (a: any, b: any) => {
            return a + b + 2;
        };

        const serialized = serialize(arrowFunction);
        const deserialized = deserialize(serialized);
        chai.expect(typeof deserialized).to.equal('function');
        chai.expect(deserialized(1, 2)).to.equal(5);
    });

    it('should serialize objects with circular references', () => {
        const obj1: any = {};
        const obj2: any = {};

        obj1.a = obj1;
        obj1.b = obj2;
        obj2.a = obj1;
        obj2.b = obj2;

        const serialized = serialize(obj1);
        
        // structuredClone preserves circular references
        chai.expect(serialized.a).to.equal(serialized);
        chai.expect(serialized.b.a).to.equal(serialized);
        chai.expect(serialized.b.b).to.equal(serialized.b);
    });

    it('should serialize Date objects', () => {
        const date = new Date('2024-01-01T00:00:00Z');
        
        const serialized = serialize(date);
        const deserialized = deserialize(serialized);
        
        chai.expect(deserialized).to.be.instanceof(Date);
        chai.expect(deserialized.getTime()).to.equal(date.getTime());
    });

    it('should serialize Buffer as Uint8Array', () => {
        const buffer = Buffer.from('hello world');
        
        const serialized = serialize(buffer);
        const deserialized = deserialize(serialized);
        
        // Buffer becomes Uint8Array after structuredClone
        chai.expect(deserialized).to.be.instanceof(Uint8Array);
        chai.expect(Buffer.from(deserialized).toString()).to.equal('hello world');
    });

    it('should serialize Map', () => {
        const map = new Map([['key1', 'value1'], ['key2', 'value2']]);
        
        const serialized = serialize(map);
        const deserialized = deserialize(serialized);
        
        chai.expect(deserialized).to.be.instanceof(Map);
        chai.expect(deserialized.get('key1')).to.equal('value1');
        chai.expect(deserialized.get('key2')).to.equal('value2');
    });

    it('should serialize Set', () => {
        const set = new Set([1, 2, 3]);
        
        const serialized = serialize(set);
        const deserialized = deserialize(serialized);
        
        chai.expect(deserialized).to.be.instanceof(Set);
        chai.expect(deserialized.has(1)).to.be.true;
        chai.expect(deserialized.has(2)).to.be.true;
        chai.expect(deserialized.has(3)).to.be.true;
    });

    it('should serialize nested objects', () => {
        const data = {
            level1: {
                level2: {
                    level3: 'value'
                },
                array: [1, 2, 3]
            }
        };
        
        const serialized = serialize(data);
        const deserialized = deserialize(serialized);
        
        chai.expect(deserialized).to.be.deep.equal(data);
    });
});
