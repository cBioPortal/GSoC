import { assert } from 'chai';
import LazyMemo from './LazyMemo';

describe('LazyMemo', () => {
    it('correct lifecycle of two elements', () => {
        // set up
        const computationCount: { [eltId: string]: number } = {};
        const memo = new LazyMemo(
            (elt: { id: string }) => elt.id,
            (elt: { id: string }) => {
                computationCount[elt.id] = computationCount[elt.id] || 0;
                computationCount[elt.id] += 1;
                return elt.id + elt.id;
            }
        );

        const elt = { id: 'yo' };
        assert.isFalse(
            memo.has(elt),
            'element doesnt exist before its requested'
        );
        assert.equal(
            computationCount[elt.id],
            undefined,
            'no computation when `has` is called'
        );
        assert.equal(memo.get(elt), 'yoyo', 'computation works correctly');
        assert.equal(
            computationCount[elt.id],
            1,
            'computation happened once because it was requested'
        );
        assert.isTrue(
            memo.has(elt),
            'element now exists because it was requested'
        );
        assert.equal(
            computationCount[elt.id],
            1,
            '`has` still doesnt trigger computation'
        );
        assert.equal(memo.get(elt), 'yoyo', 'element is still the same');
        assert.equal(
            computationCount[elt.id],
            1,
            'computation didnt happen again'
        );
        assert.isTrue(memo.has(elt), 'element still exists');
        assert.equal(
            computationCount[elt.id],
            1,
            '`has` still doesnt trigger computation'
        );

        const elt2 = { id: 'hi' };
        assert.isFalse(
            memo.has(elt2),
            'element doesnt exist before its requested'
        );
        assert.equal(
            computationCount[elt2.id],
            undefined,
            'no computation when `has` is called'
        );
        assert.equal(memo.get(elt2), 'hihi', 'computation works correctly');
        assert.equal(
            computationCount[elt2.id],
            1,
            'computation happened once because it was requested'
        );
        assert.isTrue(
            memo.has(elt2),
            'element now exists because it was requested'
        );
        assert.equal(
            computationCount[elt2.id],
            1,
            '`has` still doesnt trigger computation'
        );
        assert.equal(memo.get(elt2), 'hihi', 'element is still the same');
        assert.equal(
            computationCount[elt2.id],
            1,
            'computation didnt happen again'
        );
        assert.isTrue(memo.has(elt2), 'element still exists');
        assert.equal(
            computationCount[elt2.id],
            1,
            '`has` still doesnt trigger computation'
        );

        // check that `elt` is still there
        assert.equal(memo.get(elt), 'yoyo', 'element is still the same');
        assert.equal(
            computationCount[elt.id],
            1,
            'computation didnt happen again'
        );
        assert.isTrue(memo.has(elt), 'element still exists');
        assert.equal(
            computationCount[elt.id],
            1,
            '`has` still doesnt trigger computation'
        );

        // check that `elt2` is still there
        assert.equal(memo.get(elt2), 'hihi', 'element is still the same');
        assert.equal(
            computationCount[elt2.id],
            1,
            'computation didnt happen again'
        );
        assert.isTrue(memo.has(elt2), 'element still exists');
        assert.equal(
            computationCount[elt2.id],
            1,
            '`has` still doesnt trigger computation'
        );
    });
});
