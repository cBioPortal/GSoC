import { formatNumberValueInSignificantDigits } from './FormatUtils';
import { assert } from 'chai';

describe('FormatUtils', () => {
    describe('formatNumberValueInSignificantDigits', () => {
        it('returns null if null', () => {
            assert.equal(formatNumberValueInSignificantDigits(null, 6), null);
        });

        it('does not format if no significant digits', () => {
            assert.equal(
                formatNumberValueInSignificantDigits(1.12345),
                1.12345
            );
        });

        it('formats zero', () => {
            assert.equal(
                formatNumberValueInSignificantDigits(0, 0),
                0,
                'should be zero with no decimal points'
            );
        });

        it('formats numbers smaller than 1 with decimal points', () => {
            assert.equal(formatNumberValueInSignificantDigits(0.012, 3), 0.012);

            assert.equal(
                formatNumberValueInSignificantDigits(0.0126, 3),
                0.0126
            );

            assert.equal(
                formatNumberValueInSignificantDigits(0.01267, 3),
                0.0127
            );
        });

        it('formats numbers smaller than 999 without decimal points', () => {
            assert.equal(formatNumberValueInSignificantDigits(1, 2), 1);

            assert.equal(formatNumberValueInSignificantDigits(12, 2), 12);

            assert.equal(formatNumberValueInSignificantDigits(123, 2), 120);

            assert.equal(formatNumberValueInSignificantDigits(126, 2), 130);
        });

        it('formats numbers smaller than 999 with decimal points', () => {
            assert.equal(formatNumberValueInSignificantDigits(1.1, 3), 1.1);

            assert.equal(formatNumberValueInSignificantDigits(1.12, 3), 1.12);

            assert.equal(formatNumberValueInSignificantDigits(1.126, 3), 1.13);

            assert.equal(formatNumberValueInSignificantDigits(11.3, 3), 11.3);

            assert.equal(formatNumberValueInSignificantDigits(11.36, 3), 11.4);

            assert.equal(formatNumberValueInSignificantDigits(66.66, 3), 66.7);

            assert.equal(formatNumberValueInSignificantDigits(666.66, 3), 667);
        });

        it('formats numbers bigger than 999 with decimal points', () => {
            assert.equal(
                formatNumberValueInSignificantDigits(1001.01, 4),
                1001
            );

            assert.equal(
                formatNumberValueInSignificantDigits(1001.01, 5),
                1001
            );

            assert.equal(
                formatNumberValueInSignificantDigits(1001.06, 5),
                1001.1
            );

            assert.equal(
                formatNumberValueInSignificantDigits(1001.01, 6),
                1001.01
            );

            assert.equal(
                formatNumberValueInSignificantDigits(66666.01, 6),
                66666
            );
        });

        it('formats numbers bigger than 999 without decimal points', () => {
            assert.equal(formatNumberValueInSignificantDigits(1111, 4), 1111);

            assert.equal(formatNumberValueInSignificantDigits(1111, 3), 1110);

            assert.equal(formatNumberValueInSignificantDigits(1111, 2), 1100);
        });
    });
});
