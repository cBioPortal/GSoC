import { assert } from 'chai';
import ChromosomeColumnFormatter from './ChromosomeColumnFormatter';

/**
 * @author Selcuk Onur Sumer
 */
describe('ChromosomeColumnFormatter', () => {
    const a = '1';
    const b = 'chr2';
    const c = '22';
    const d = 'chrX';
    const e = 'Y';
    const f = 'chrY';

    it('properly extracts sort value from a chromosome string value', () => {
        assert.isAbove(
            ChromosomeColumnFormatter.extractSortValue(b),
            ChromosomeColumnFormatter.extractSortValue(a)
        );

        assert.isAbove(
            ChromosomeColumnFormatter.extractSortValue(d),
            ChromosomeColumnFormatter.extractSortValue(c)
        );

        assert.isAbove(
            ChromosomeColumnFormatter.extractSortValue(e),
            ChromosomeColumnFormatter.extractSortValue(d)
        );

        assert.isAbove(
            ChromosomeColumnFormatter.extractSortValue(c),
            ChromosomeColumnFormatter.extractSortValue(b)
        );

        assert.equal(
            ChromosomeColumnFormatter.extractSortValue(e),
            ChromosomeColumnFormatter.extractSortValue(f)
        );
    });
});
