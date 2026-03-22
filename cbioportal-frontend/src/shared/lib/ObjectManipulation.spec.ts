import { assert } from 'chai';
import React from 'react';
import { renameKeys, dropKeys } from './ObjectManipulation';

describe('ObjectManipulation functions', () => {
    it('should rename keys in a flat object', () => {
        let dict = {
            a: 0,
            b: 1,
            c: 2,
        };
        let keyMap = {
            a: 'A',
        };
        let rv = renameKeys(dict, keyMap);
        assert.equal(rv.A, 0);
        // Keep non existing
        assert.equal(rv.b, 1);
        assert.equal(rv.c, 2);
        // old dict stays the same
        assert.equal(dict.a, 0);
        assert.equal(dict.b, 1);
        assert.equal(dict.c, 2);
    });
});

describe('ObjectManipulation functions', () => {
    it('should remove keys in a flat object', () => {
        let dict = {
            a: 0,
            b: 1,
            c: 2,
        };
        let keyMap = {
            a: 'A',
        };
        let rv = dropKeys(dict, ['b', 'c']);
        assert.equal(rv.a, 0);
        assert.equal(rv.b, undefined);
        assert.equal(rv.c, undefined);
        // old dict stays the same
        assert.equal(dict.a, 0);
        assert.equal(dict.b, 1);
        assert.equal(dict.c, 2);
    });
});
