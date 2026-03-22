import { assert } from 'chai';
import { truncateGeneList } from './PathwayMapperHelpers';

describe('PathwayMapperHelpers', () => {
    describe('truncateGeneList', () => {
        it('truncates empty list as an empty string', () => {
            assert.equal(truncateGeneList([], 1), '');
        });

        it('should not truncate if the threshold is greater than the actual length of list', () => {
            assert.equal(truncateGeneList(['MDM2', 'TP53'], 66), 'MDM2 TP53');
        });

        it('truncates gene list without producing any partial gene name', () => {
            assert.equal(truncateGeneList(['MDM2'], 1), '...');
            assert.equal(truncateGeneList(['MDM2', 'CDKN2A'], 7), 'MDM2 ...');
            assert.equal(
                truncateGeneList(['MDM2', 'CDKN2A', 'TP53'], 12),
                'MDM2 CDKN2A ...'
            );
        });
    });
});
