import * as React from 'react';
import { assert } from 'chai';
import {
    toFixedWithThreshold,
    formatLogOddsRatio,
    formatSignificanceValueWithStyle,
    roundLogRatio,
    toFixedWithoutTrailingZeros,
    getPercentage,
    shortenStudyName,
} from 'shared/lib/FormatUtils';
import expect from 'expect';
import expectJSX from 'expect-jsx';
expect.extend(expectJSX);

describe('toFixedWithThreshold', () => {
    it('has the same behavior with regular toFixed function when the result is not expected to be a zero value', () => {
        assert.equal(toFixedWithThreshold(0.324, 2), '0.32');
        assert.equal(toFixedWithThreshold(0.0032, 3), '0.003');
        assert.equal(toFixedWithThreshold(0.006, 2), '0.01');
    });

    it('returns zero value string only if the actual value is zero', () => {
        assert.equal(toFixedWithThreshold(0, 1), '0.0');
        assert.equal(toFixedWithThreshold(0, 2), '0.00');
        assert.equal(toFixedWithThreshold(0, 3), '0.000');
    });

    it('converts zero value results into an inequality if the actual value is not zero', () => {
        assert.equal(toFixedWithThreshold(0.000333, 3), '<0.001');
        assert.equal(toFixedWithThreshold(0.000666, 2), '<0.01');
        assert.equal(toFixedWithThreshold(0.00666, 1), '<0.1');
        assert.equal(toFixedWithThreshold(0.0333, 1), '<0.1');
    });

    it('works for negative numbers too', () => {
        assert.equal(toFixedWithThreshold(-0.324, 2), '-0.32');
        assert.equal(toFixedWithThreshold(-0.0032, 3), '-0.003');
        assert.equal(toFixedWithThreshold(-0.006, 2), '-0.01');
        assert.equal(toFixedWithThreshold(-0.000333, 3), '>-0.001');
        assert.equal(toFixedWithThreshold(-0.000666, 2), '>-0.01');
        assert.equal(toFixedWithThreshold(-0.00666, 1), '>-0.1');
        assert.equal(toFixedWithThreshold(-0.0333, 1), '>-0.1');
    });
});

describe('#formatLogOddsRatio()', () => {
    it('returns <-10 for -11', () => {
        assert.equal(formatLogOddsRatio(-11), '<-10');
    });

    it('returns >10 for 11', () => {
        assert.equal(formatLogOddsRatio(11), '>10');
    });

    it('returns 10 for 10', () => {
        assert.equal(formatLogOddsRatio(10), '10.00');
    });

    it('returns 1.23 for 1.234', () => {
        assert.equal(formatLogOddsRatio(1.234), '1.23');
    });
});

describe('#formatSignificanceValueWithStyle()', () => {
    it('returns <span>0.300</span> for 0.3', () => {
        expect(formatSignificanceValueWithStyle(0.3)).toEqualJSX(
            <span>0.300</span>
        );
    });

    it('returns <b><span>0.030</span></b> for 0.03', () => {
        expect(formatSignificanceValueWithStyle(0.03)).toEqualJSX(
            <b>
                <span>0.0300</span>
            </b>
        );
    });
});

describe('#getPercentage', () => {
    it('gets less than 1', () => {
        assert.equal(getPercentage(0.004), '<1%');
    });
    it('gets zero perc', () => {
        assert.equal(getPercentage(0), '0%');
    });
    it('gets 1%', () => {
        assert.equal(getPercentage(0.01), '1%');
    });
    it('rounds down 52.4', () => {
        assert.equal(getPercentage(0.524), '52%');
    });
    it('rounds up 52.6', () => {
        assert.equal(getPercentage(0.526), '53%');
    });
    it('handles more than 100%', () => {
        assert.equal(getPercentage(1.526), '153%');
    });
});

describe('#roundLogRatio()', () => {
    it('returns 5 for 8 and 5', () => {
        assert.equal(roundLogRatio(8, 5), 5);
    });

    it('returns -3 for -4 and 3', () => {
        assert.equal(roundLogRatio(-4, 3), -3);
    });

    it('returns 3.21 for 3.2123 and 10', () => {
        assert.equal(roundLogRatio(3.2123, 10), 3.21);
    });
});

describe('toFixedWithoutTrailingZeros', () => {
    it('removes trailing zeros right after decimal point', () => {
        assert.equal(toFixedWithoutTrailingZeros(2, 5), '2');
        assert.equal(toFixedWithoutTrailingZeros(5, 5), '5');
    });
    it('removes trailing zeros not right after decimal point', () => {
        assert.equal(toFixedWithoutTrailingZeros(2.25, 5), '2.25');
        assert.equal(toFixedWithoutTrailingZeros(2.5, 100), '2.5');
    });
    it('doesnt remove non-trailing zeros', () => {
        assert.equal(toFixedWithoutTrailingZeros(12.025, 3), '12.025');
        assert.equal(toFixedWithoutTrailingZeros(51.05, 2), '51.05');
        assert.equal(toFixedWithoutTrailingZeros(5100.05, 2), '5100.05');
        assert.equal(toFixedWithoutTrailingZeros(5100.5, 1), '5100.5');
        assert.equal(toFixedWithoutTrailingZeros(0.025, 3), '0.025');
        assert.equal(toFixedWithoutTrailingZeros(0.05, 2), '0.05');
        assert.equal(toFixedWithoutTrailingZeros(0.5, 1), '0.5');
        assert.equal(toFixedWithoutTrailingZeros(80, 1), '80');
        assert.equal(toFixedWithoutTrailingZeros(8020, 1), '8020');
        assert.equal(toFixedWithoutTrailingZeros(80, 0), '80');
        assert.equal(toFixedWithoutTrailingZeros(8020, 0), '8020');
    });
    it('removes trailing zeros not right after decimal point', () => {
        assert.equal(toFixedWithoutTrailingZeros(2.25, 5), '2.25');
        assert.equal(toFixedWithoutTrailingZeros(2.5, 100), '2.5');
    });
});

describe('shortenStudyName', () => {
    it('returns the study name as is if the left parenthesis index is not found, less than or equal to 50', () => {
        assert.equal(
            shortenStudyName('MSK-IMPACT Clinical Sequencing Cohort'),
            'MSK-IMPACT Clinical Sequencing Cohort'
        );
        assert.equal(
            shortenStudyName(
                'MSK-IMPACT Clinical Sequencing Cohort (MSKCC, Nat Med 2017)'
            ),
            'MSK-IMPACT Clinical Sequencing Cohort (MSKCC, Nat Med 2017)'
        );
    });

    it('returns the study name truncated if the left parenthesis index is greater than 50', () => {
        assert.equal(
            shortenStudyName(
                'Anaplastic Oligodendroglioma and Anaplastic Oligoastrocytoma (MSKCC, Neuro Oncol 2017)'
            ),
            'Anaplastic Oligodendroglioma and Anaplastic Oligo...(MSKCC, Neuro Oncol 2017)'
        );
    });
});
