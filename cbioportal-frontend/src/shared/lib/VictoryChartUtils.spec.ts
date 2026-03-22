import { assert } from 'chai';
import { adjustedLongestLabelLength } from './VictoryChartUtils';

describe('VictoryChartUtils functions', () => {
    it('adjustedLongestLabelLength', () => {
        assert.equal(adjustedLongestLabelLength(['Test']), 5);
        assert.equal(adjustedLongestLabelLength(['Test', 'Tes']), 5);
        assert.equal(adjustedLongestLabelLength(['Test', 'Testt']), 6);
        assert.equal(adjustedLongestLabelLength(['']), 0);
        assert.equal(adjustedLongestLabelLength([]), 0);
        assert.equal(adjustedLongestLabelLength([' ']), 2);
        assert.equal(adjustedLongestLabelLength(['T']), 2);
        assert.equal(adjustedLongestLabelLength(['t']), 1);
        assert.equal(adjustedLongestLabelLength(['Tt']), 3);
    });
});
