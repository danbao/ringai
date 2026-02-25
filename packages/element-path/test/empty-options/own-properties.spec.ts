/* eslint-disable @typescript-eslint/ban-ts-comment */
import {expect} from 'vitest';
import {createElementPath} from '../../src';

describe('own properties', () => {
    const empty = createElementPath();

    it('.flows is hidden', () => {
        // @ts-ignore
        expect(empty.flows.toString()).toBe(
            "(//*[@data-test-automation-id='root']//*[@data-test-automation-id='flows'])[1]",
        );
    });

    it('.regexp is hidden', () => {
        expect(empty['regexp']?.toString()).toBe(
            "(//*[@data-test-automation-id='root']//*[@data-test-automation-id='regexp'])[1]",
        );
    });

    it('.attributeName is hidden', () => {
        // @ts-ignore
        expect(empty.attributeName.toString()).toBe(
            "(//*[@data-test-automation-id='root']//*[@data-test-automation-id='attributeName'])[1]",
        );
    });

    it('.searchMask is hidden', () => {
        // @ts-ignore
        expect(empty.searchMask.toString()).toBe(
            "(//*[@data-test-automation-id='root']//*[@data-test-automation-id='searchMask'])[1]",
        );
    });

    it('.searchOptions is hidden', () => {
        // @ts-ignore
        expect(empty.searchOptions.toString()).toBe(
            "(//*[@data-test-automation-id='root']//*[@data-test-automation-id='searchOptions'])[1]",
        );
    });

    it('.parent is hidden', () => {
        // @ts-ignore
        expect(empty.parent.toString()).toBe(
            "(//*[@data-test-automation-id='root']//*[@data-test-automation-id='parent'])[1]",
        );
    });
});
