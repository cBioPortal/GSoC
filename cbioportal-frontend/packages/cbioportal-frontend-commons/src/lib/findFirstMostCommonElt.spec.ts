import { assert } from 'chai';
import { findFirstMostCommonElt } from './findFirstMostCommonElt';

describe('findFirstMostCommonElt', () => {
    it('returns undefined with empty list input', () => {
        assert.equal(findFirstMostCommonElt([]), undefined);
    });
    it('returns only element with single element list', () => {
        assert.equal(findFirstMostCommonElt([3]), 3);
        assert.equal(findFirstMostCommonElt(['']), '');
        assert.equal(findFirstMostCommonElt(['a']), 'a');
    });
    it('returns first element in two element list', () => {
        assert.equal(findFirstMostCommonElt([4, 5]), 4);
        assert.equal(findFirstMostCommonElt(['', 'a']), '');
        assert.equal(findFirstMostCommonElt(['a', '']), 'a');
    });
    it('returns most common element in three element list', () => {
        assert.equal(findFirstMostCommonElt([6, 7, 7]), 7);
        assert.equal(findFirstMostCommonElt(['a', 'b', 'b']), 'b');
    });
    it('returns first, most common element in longer list of strings', () => {
        assert.equal(
            findFirstMostCommonElt([
                'a',
                'b',
                'b',
                'b',
                'c',
                'c',
                'c',
                'c',
                'd',
                'e',
                'e',
                'f',
                'g',
                'g',
                'g',
                'g',
                'g',
                'g',
            ]),
            'g'
        );
        assert.equal(
            findFirstMostCommonElt([
                'a',
                'b',
                'b',
                'b',
                'g',
                'g',
                'g',
                'g',
                'g',
                'g',
                'c',
                'c',
                'c',
                'c',
                'd',
                'e',
                'e',
                'f',
            ]),
            'g'
        );
    });
});
