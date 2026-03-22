import { assert } from 'chai';
import { getTwoTailedPValue } from './FisherExactTestCalculator';

describe('#calculatePValue()', () => {
    it('returns 1 for all zero counts', () => {
        assert.equal(1, getTwoTailedPValue(0, 0, 0, 0));
    });

    it('returns 1 for all one counts', () => {
        assert.equal(1, getTwoTailedPValue(0, 0, 0, 0));
    });

    it('returns correct p values for multiple different counts', () => {
        assert.equal(
            0.00036917378321091467,
            getTwoTailedPValue(9, 268, 0, 384)
        );

        assert.equal(0.0023260213212133113, getTwoTailedPValue(9, 268, 1, 383));

        assert.equal(0.999999999999234, getTwoTailedPValue(0, 277, 1, 383));

        assert.equal(
            0.000007200394775273417,
            getTwoTailedPValue(24, 253, 5, 379)
        );
    });
});
