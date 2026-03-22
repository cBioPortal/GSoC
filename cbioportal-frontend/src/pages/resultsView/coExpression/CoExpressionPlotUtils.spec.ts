import { assert } from 'chai';
import { getUniquePrecision } from './CoExpressionPlotUtils';

describe('CoExpressionPlotUtils', () => {
    describe('getUniquePrecision', () => {
        it('empty array', () => {
            assert.equal(getUniquePrecision(0, []), 0);
        });
        it('value not present', () => {
            assert.equal(getUniquePrecision(0, [1]), 0);
        });
        it('completely unique', () => {
            assert.equal(getUniquePrecision(23, [11, 2, 23, 43, 59, 0]), 0);
        });
        it('unique at one decimal', () => {
            assert.equal(getUniquePrecision(1.5, [1.2, 1.6, 2, 5, 1.5]), 1);
        });
        it('unique at 2 decimals', () => {
            assert.equal(
                getUniquePrecision(6.51, [1.23, 1.6, 6.53, 5, 6.51]),
                2
            );
        });
        it('unique at 5 decimals', () => {
            assert.equal(
                getUniquePrecision(
                    1.23456,
                    [1.23456, 1.23459, 2.23456, 43.31314, 5],
                    10
                ),
                5
            );
        });
    });
});
