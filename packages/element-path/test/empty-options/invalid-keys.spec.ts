import {expect} from 'vitest';
import {createElementPath} from '../../src';

describe('invalid keys', () => {
    const empty = createElementPath();

    describe('getters', () => {
        it("['']", () => {
            const error = () => empty[''];
            expect(error).toThrow('Key can not me empty');
        });

        it("['*foo*bar*']", () => {
            const error = () => empty['*foo*bar*'];
            expect(error).toThrow(
                'Masks prefix, suffix and inner ask are not supported',
            );
        });

        it("['foo*bar*']", () => {
            const error = () => empty['foo*bar*'];
            expect(error).toThrow(
                'Masks prefix, suffix and inner ask are not supported',
            );
        });

        it("['*foo*bar']", () => {
            const error = () => empty['*foo*bar'];
            expect(error).toThrow(
                'Masks prefix, suffix and inner ask are not supported',
            );
        });

        it("['foo*bar*baz']", () => {
            const error = () => empty['foo*bar*baz'];
            expect(error).toThrow(
                'Masks with more than two parts are not supported',
            );
        });

        it("['{}']", () => {
            const error = () => empty['{}'];
            expect(error).toThrow('Text search param can not be empty');
        });

        it("['foo*{}']", () => {
            const error = () => empty['foo*{}'];
            expect(error).toThrow('Text search param can not be empty');
        });

        it("['{}()']", () => {
            const error = () => empty['{}()'];
            expect(error).toThrow('Text search param can not be empty');
        });

        it("['()']", () => {
            const error = () => empty['()'];
            expect(error).toThrow('Selector can not contain only sub query');
        });

        it("['foo*()']", () => {
            const error = () => empty['foo*()'];
            expect(error).toThrow('Sub Query can not be empty');
        });

        it("['(test)']", () => {
            const error = () => empty['(test)'];
            expect(error).toThrow('Selector can not contain only sub query');
        });

        it("['foo*'][0][0]", () => {
            const error = () => {
                const element = empty['foo*']?.[0];
                if (!element) {throw new Error('Element not found');}
                return element[0];
            };
            expect(error).toThrow(
                'Can not select index element from already sliced element',
            );
        });

        it("['foo*']['0'][0]", () => {
            const error = () => {
                const element = empty['foo*']?.['0'];
                if (!element) {throw new Error('Element not found');}
                return element[0];
            };
            expect(error).toThrow(
                'Can not select index element from already sliced element',
            );
        });

        it("['foo*'][0]['0']", () => {
            const error = () => {
                const element = empty['foo*']?.[0];
                if (!element) {throw new Error('Element not found');}
                return element['0'];
            };
            expect(error).toThrow(
                'Can not select index element from already sliced element',
            );
        });
    });
});
