import { assert } from 'chai';
import {
    getGenesetProfiles,
    sortRnaSeqProfilesToTop,
    filterAndSortProfiles,
} from './CoExpressionTabUtils';

const profiles = [
    {
        molecularAlterationType: 'MUTATION_EXTENDED',
    },
    {
        molecularAlterationType: 'MRNA_EXPRESSION',
        molecularProfileId: 'merged_median_zscores_rna_seq',
    },
    {
        molecularAlterationType: 'PROTEIN_LEVEL',
        molecularProfileId: 'aposidjpao',
    },
    {
        molecularAlterationType: 'MRNA_EXPRESSION',
        molecularProfileId: 'blah2_zscores',
    },
    {
        molecularAlterationType: 'PROTEIN_LEVEL',
        molecularProfileId: 'blah_zscores',
    },
    {
        molecularAlterationType: 'GENESET_SCORE',
        molecularProfileId: 'someid',
    },
    {
        molecularAlterationType: 'GENESET_SCORE',
        molecularProfileId: 'someid_gsva_pvalues',
    },
] as any;

describe('CoExpressionTabUtils', () => {
    describe('filterAndSortProfiles', () => {
        it('returns empty if no profiles given', () => {
            assert.equal(filterAndSortProfiles([]).length, 0);
        });
        it('returns empty if no valid profiles', () => {
            assert.equal(filterAndSortProfiles([profiles[0]]).length, 0);
            assert.equal(filterAndSortProfiles([profiles[3]]).length, 0);
            assert.equal(
                filterAndSortProfiles([profiles[0], profiles[3], profiles[4]])
                    .length,
                0
            );
        });
        it('returns valid profiles, with rna seq sorted to the top', () => {
            assert.deepEqual(filterAndSortProfiles(profiles), [
                profiles[1],
                profiles[2],
            ]);
        });
    });
    describe('getGenesetProfiles', () => {
        it('returns empty if no profiles given', () => {
            assert.equal(getGenesetProfiles([]).length, 0);
        });
        it('returns empty if no valid profiles', () => {
            assert.equal(getGenesetProfiles([profiles[0]]).length, 0);
            assert.equal(getGenesetProfiles([profiles[1]]).length, 0);
            assert.equal(
                getGenesetProfiles([profiles[1], profiles[2], profiles[4]])
                    .length,
                0
            );
        });
        it('returns valid profiles', () => {
            assert.deepEqual(getGenesetProfiles(profiles), [profiles[5]]);
        });
    });
    describe('sortProfiles', () => {
        it('sorts profiles, with rna seq to the top', () => {
            assert.deepEqual(
                sortRnaSeqProfilesToTop([profiles[2], profiles[1]]),
                [profiles[1], profiles[2]]
            );
        });
    });
});
