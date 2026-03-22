import { assert } from 'chai';
import { getFocusOutText } from './GeneSelectionBoxUtils';

describe('GeneSelectionBoxUtils', () => {
    it('should return correct gene box focus out text', () => {
        assert.equal(getFocusOutText([]), '', 'when no genes selected');
        assert.equal(
            getFocusOutText(['TP53']),
            'TP53',
            'when selected genes can fit in 13 characters'
        );
        assert.equal(
            getFocusOutText(['TP53', 'CDKN2A', 'EGFR_PY992']),
            'TP53 CDKN2A and 1 more',
            'when selected genes cannott fit in 13 characters'
        );
    });
});
