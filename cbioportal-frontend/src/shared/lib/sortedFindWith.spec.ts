import { assert } from 'chai';
import { sortedFindWith } from './sortedFindWith';

describe('sortedFindWith', () => {
    // for each test: it finds the target element
    //              if target element doesnt exist, it returns undefined
    it('empty array', () => {
        const array: number[] = [];
        assert.isUndefined(sortedFindWith(array, t => 0));
    });
    it('one element array', () => {
        const array = [{ id: 0, name: 'hey' }];
        assert.isUndefined(sortedFindWith(array, t => Math.sign(t.id + 1)));
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id)),
            {
                id: 0,
                name: 'hey',
            }
        );
    });
    it('two element array', () => {
        const array = [
            { id: 0, name: 'hey' },
            { id: 1, name: 'yo' },
        ];
        assert.isUndefined(sortedFindWith(array, t => Math.sign(t.id + 1)));
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 1)),
            {
                id: 1,
                name: 'yo',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id)),
            {
                id: 0,
                name: 'hey',
            }
        );
    });
    it('three element array', () => {
        const array = [
            { id: 0, name: 'A' },
            { id: 1, name: 'B' },
            { id: 2, name: 'C' },
        ];
        assert.isUndefined(sortedFindWith(array, t => Math.sign(t.id - 3)));
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 2)),
            {
                id: 2,
                name: 'C',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 1)),
            {
                id: 1,
                name: 'B',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id)),
            {
                id: 0,
                name: 'A',
            }
        );
    });
    it('four element array', () => {
        const array = [
            { id: 0, name: 'A' },
            { id: 1, name: 'B' },
            { id: 2, name: 'C' },
            { id: 3, name: 'D' },
        ];
        assert.isUndefined(sortedFindWith(array, t => Math.sign(t.id + 1)));
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 3)),
            {
                id: 3,
                name: 'D',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 2)),
            {
                id: 2,
                name: 'C',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 1)),
            {
                id: 1,
                name: 'B',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id)),
            {
                id: 0,
                name: 'A',
            }
        );
    });
    it('several element even length array', () => {
        const array = [
            { id: 0, name: 'A' },
            { id: 1, name: 'B' },
            { id: 2, name: 'C' },
            { id: 3, name: 'D' },
            { id: 4, name: 'E' },
            { id: 5, name: 'F' },
            { id: 6, name: 'G' },
            { id: 7, name: 'H' },
        ];
        assert.isUndefined(sortedFindWith(array, t => Math.sign(t.id - 10)));
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 7)),
            {
                id: 7,
                name: 'H',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 6)),
            {
                id: 6,
                name: 'G',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 5)),
            {
                id: 5,
                name: 'F',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 4)),
            {
                id: 4,
                name: 'E',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 3)),
            {
                id: 3,
                name: 'D',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 2)),
            {
                id: 2,
                name: 'C',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 1)),
            {
                id: 1,
                name: 'B',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id)),
            {
                id: 0,
                name: 'A',
            }
        );
    });
    it('several element odd length array', () => {
        const array = [
            { id: 0, name: 'A' },
            { id: 1, name: 'B' },
            { id: 2, name: 'C' },
            { id: 3, name: 'D' },
            { id: 4, name: 'E' },
            { id: 5, name: 'F' },
            { id: 6, name: 'G' },
        ];
        assert.isUndefined(sortedFindWith(array, t => Math.sign(t.id - 10)));
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 6)),
            {
                id: 6,
                name: 'G',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 5)),
            {
                id: 5,
                name: 'F',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 4)),
            {
                id: 4,
                name: 'E',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 3)),
            {
                id: 3,
                name: 'D',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 2)),
            {
                id: 2,
                name: 'C',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id - 1)),
            {
                id: 1,
                name: 'B',
            }
        );
        assert.deepEqual(
            sortedFindWith(array, t => Math.sign(t.id)),
            {
                id: 0,
                name: 'A',
            }
        );
    });
});
