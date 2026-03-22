import { assert } from 'chai';
import { cytobandFilter } from './ResultsViewTableUtils';

describe('CoExpressionTableUtils', () => {
    describe('cytobandFilter', () => {
        it('returns false if no cytoband', () => {
            assert.isFalse(cytobandFilter({ cytoband: null } as any, 'asdfa'));
        });
        it('returns false if no match', () => {
            assert.isFalse(cytobandFilter({ cytoband: 'hello' } as any, 'hi'));
        });
        it('returns false if match in middle', () => {
            assert.isFalse(cytobandFilter({ cytoband: 'hello' } as any, 'ell'));
        });
        it('returns true if match at beginning', () => {
            assert.isTrue(cytobandFilter({ cytoband: 'hello' } as any, 'h'));
            assert.isTrue(cytobandFilter({ cytoband: 'hello' } as any, 'he'));
            assert.isTrue(cytobandFilter({ cytoband: 'hello' } as any, 'hel'));
            assert.isTrue(cytobandFilter({ cytoband: 'hello' } as any, 'hell'));
            assert.isTrue(
                cytobandFilter({ cytoband: 'hello' } as any, 'hello')
            );
        });
        it('returns false if no match for complete query', () => {
            assert.isFalse(
                cytobandFilter({ cytoband: 'hello' } as any, 'hellothere')
            );
        });
        it('returns true on empty input', () => {
            assert.isTrue(cytobandFilter({ cytoband: 'hello' } as any, ''));
        });
        it('returns true if minus sign at beginning and nothing following', () => {
            assert.isTrue(cytobandFilter({ cytoband: 'hello' } as any, '-'));
        });
        it('returns false if match but minus sign at beginning of filter string', () => {
            assert.isFalse(cytobandFilter({ cytoband: 'hello' } as any, '-he'));
            assert.isFalse(cytobandFilter({ cytoband: '17p' } as any, '-17p'));
        });
        it('returns true if no match but minus sign at beginning', () => {
            assert.isTrue(cytobandFilter({ cytoband: '17p' } as any, '-3p'));
        });
        it('returns true if match in middle but minus sign at beginning', () => {
            assert.isTrue(cytobandFilter({ cytoband: '17p' } as any, '-7p'));
        });
        it('returns true if matches at least one query, all positive', () => {
            assert.isTrue(
                cytobandFilter({ cytoband: '17p' } as any, '17p 5p 3p')
            );
        });
        it('returns true if no match every query, all negative', () => {
            assert.isTrue(
                cytobandFilter({ cytoband: '17p' } as any, '-5 -3 -7p -1p')
            );
        });
        it('returns true if passes at least one positive query and every negative query', () => {
            assert.isTrue(
                cytobandFilter(
                    { cytoband: '17p' } as any,
                    '-5 -3 17p -7p -1p 3p'
                )
            );
        });
        it('returns false if it doesnt match any query, all positive', () => {
            assert.isFalse(
                cytobandFilter({ cytoband: '17p' } as any, '1p 1q 5p')
            );
        });
        it('returns false if it matches at least one query, all negative', () => {
            assert.isFalse(
                cytobandFilter({ cytoband: '17p' } as any, '-5 -3 -17p -1p')
            );
        });
        it('returns false if fails every query, mix of positive and negative', () => {
            assert.isFalse(
                cytobandFilter({ cytoband: '17p' } as any, '-17p 3q -1')
            );
        });
    });
});
