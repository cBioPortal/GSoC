import { assert } from 'chai';
import { logicalAnd } from './LogicUtils';

describe('LogicUtils', () => {
    describe('logicalAnd', () => {
        it('returns correct output on several inputs', () => {
            assert.isTrue(logicalAnd([]), 'empty input');
            assert.isTrue(logicalAnd([true]), 'true input');
            assert.isTrue(logicalAnd([true, true]), 'true two args');
            assert.isTrue(
                logicalAnd([true, true, true, true, true]),
                'five args'
            );
            assert.isFalse(logicalAnd([true, false, false]), 'false args');
        });
    });
});
