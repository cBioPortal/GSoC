import { assert } from 'chai';
import { toggleIncluded } from './ArrayUtils';

describe('ArrayUtils', () => {
    describe('toggleIncluded', () => {
        it('toggles empty and singleton', () => {
            assert.deepEqual(toggleIncluded('a', []), ['a']);
            assert.deepEqual(toggleIncluded('a', ['a']), []);
        });
        it('toggles element from singleton', () => {
            assert.deepEqual(toggleIncluded('a', ['b']), ['b', 'a']);
            assert.deepEqual(toggleIncluded('a', ['a', 'b']), ['b']);
        });
        it('toggles element from multiple', () => {
            assert.deepEqual(toggleIncluded('a', ['b', 'c']), ['b', 'c', 'a']);
            assert.deepEqual(toggleIncluded('a', ['a', 'b', 'c']), ['b', 'c']);
        });
    });
});
