import { assert } from 'chai';
import {
    unescapeTabDelimited,
    longestCommonStartingSubstring,
    stringListToIndexSet,
    stringListToSet,
    unquote,
    isUrl,
} from './StringUtils';

describe('longestCommonStartingSubstring', () => {
    it('finds correct result on various inputs', () => {
        assert.equal(longestCommonStartingSubstring('', ''), '');
        assert.equal(longestCommonStartingSubstring('', 'a'), '');
        assert.equal(longestCommonStartingSubstring('a', 'a'), 'a');
        assert.equal(longestCommonStartingSubstring('ab', 'a'), 'a');
        assert.equal(longestCommonStartingSubstring('a', 'ab'), 'a');
        assert.equal(
            longestCommonStartingSubstring('hellothere', 'hellobye'),
            'hello'
        );
        assert.equal(
            longestCommonStartingSubstring('hellobye', 'hellothere'),
            'hello'
        );
    });
});

describe('stringListToSet', () => {
    it('gives correct result on various inputs', () => {
        assert.deepEqual(stringListToSet([]), {}, 'empty list');
        assert.deepEqual(stringListToSet(['a']), { a: true }, 'one element');
        assert.deepEqual(
            stringListToSet(['a', 'b']),
            { a: true, b: true },
            'two elements'
        );
        assert.deepEqual(
            stringListToSet(['a', 'b', 'C', 'd', 'E', 'FG']),
            { a: true, b: true, C: true, d: true, E: true, FG: true },
            'several elements'
        );
    });
});

describe('stringListToIndexSet', () => {
    it('gives correct result on various inputs', () => {
        assert.deepEqual(stringListToIndexSet([]), {}, 'empty list');
        assert.deepEqual(stringListToIndexSet(['a']), { a: 0 }, 'one element');
        assert.deepEqual(
            stringListToIndexSet(['a', 'b']),
            { a: 0, b: 1 },
            'two elements'
        );
        assert.deepEqual(
            stringListToIndexSet(['a', 'b', 'C', 'd', 'E', 'FG']),
            { a: 0, b: 1, C: 2, d: 3, E: 4, FG: 5 },
            'several elements'
        );
    });
});

describe('unquote and decodeTabDelimited', () => {
    it('unquotes only wrapping quotes and replaces all \\t and \\n characters in a string', () => {
        assert.equal(
            unquote(
                unescapeTabDelimited(
                    '"cBioPortal\\n\'Redefining\'\\t"Data Analysis""'
                )
            ),
            'cBioPortal\n\'Redefining\'\t"Data Analysis"'
        );
    });
});

describe('isUrl', () => {
    it('gives correct result on various inputs', () => {
        assert.isFalse(isUrl('example.com'));
        assert.isFalse(isUrl('http'));
        assert.isTrue(isUrl('http://example.com'));
        assert.isTrue(isUrl('https://example.com'));
        assert.isTrue(isUrl('http://www.example.com'));
        assert.isTrue(isUrl('https://www.example.com'));
    });
});
