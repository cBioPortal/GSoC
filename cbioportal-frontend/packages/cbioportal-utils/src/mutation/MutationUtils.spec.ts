import { assert } from 'chai';
import { GenomicLocation } from 'genome-nexus-ts-api-client';

import {
    countMutationsByProteinChange,
    groupMutationsByProteinStartPos,
    extractGenomicLocation,
    genomicLocationString,
    uniqueGenomicLocations,
    normalizeChromosome,
    generateHgvsgByMutation,
    hasValidGenomicLocation,
} from './MutationUtils';

import { Mutation } from '../model/Mutation';

describe('MutationUtils', () => {
    let mutationsToCount: Mutation[];

    beforeAll(() => {
        mutationsToCount = [
            {
                proteinPosStart: 66,
                proteinChange: 'D66B',
            },
            {
                proteinPosStart: 66,
                proteinChange: 'D66B',
            },
            {
                proteinPosStart: 66,
                proteinChange: 'D66B',
            },
            {
                proteinPosStart: 66,
                proteinChange: 'D66B',
            },
            {
                proteinPosStart: 66,
                proteinChange: 'D66B',
            },
            {
                proteinPosStart: 666,
                proteinChange: 'D666C',
            },
            {
                proteinPosStart: 666,
                proteinChange: 'D666F',
            },
        ];
    });

    describe('countMutationsByProteinChange', () => {
        it('returns an empty array when there are no mutations', () => {
            assert.equal(
                countMutationsByProteinChange([]).length,
                0,
                'no mutation count for an empty input'
            );
        });

        it('counts and sorts mutations by protein change values', () => {
            const mutationCountByProteinChange = countMutationsByProteinChange(
                mutationsToCount
            );

            assert.equal(
                mutationCountByProteinChange.length,
                3,
                'there should be 3 unique protein change values'
            );

            assert.deepEqual(
                mutationCountByProteinChange[0],
                { proteinChange: 'D66B', count: 5 },
                'first protein change should be D66B with 5 count'
            );

            assert.deepEqual(
                mutationCountByProteinChange[1],
                { proteinChange: 'D666C', count: 1 },
                'second protein change should be D666C with 1 count'
            );

            assert.deepEqual(
                mutationCountByProteinChange[2],
                { proteinChange: 'D666F', count: 1 },
                'third protein change should be D666F with 1 count'
            );
        });
    });

    describe('groupMutationsByProteinStartPos', () => {
        it('returns an empty object when there are no mutations', () => {
            assert.deepEqual(
                groupMutationsByProteinStartPos([]),
                {},
                'no mutations for an empty input'
            );
        });

        it('groups mutations by protein start position', () => {
            const mutationCountByProteinChange = groupMutationsByProteinStartPos(
                mutationsToCount
            );

            assert.equal(
                mutationCountByProteinChange[66].length,
                5,
                'there should be 5 mutations at posititon 66'
            );

            assert.equal(
                mutationCountByProteinChange[666].length,
                2,
                'there should be 2 mutations at posititon 666'
            );

            assert.deepEqual(
                mutationCountByProteinChange[666][0],
                { proteinPosStart: 666, proteinChange: 'D666C' },
                'first mutation at pos 666 should be D666C'
            );
            assert.deepEqual(
                mutationCountByProteinChange[666][1],
                { proteinPosStart: 666, proteinChange: 'D666F' },
                'second mutation at pos 666 should be D666F'
            );
        });
    });

    describe('extractGenomicLocation', () => {
        it('extracts genomic location', () => {
            let mutation0: Partial<Mutation> = {
                chromosome: 'chr1',
                startPosition: 100,
                endPosition: 200,
                referenceAllele: 'C',
                variantAllele: 'G',
            };
            assert.deepEqual(
                extractGenomicLocation(mutation0),
                {
                    chromosome: '1',
                    start: 100,
                    end: 200,
                    referenceAllele: 'C',
                    variantAllele: 'G',
                },
                'chr1 should be converted to 1'
            );
        });
    });

    describe('genomicLocationString', () => {
        it('extracts genomic location', () => {
            let genomicLocation: GenomicLocation = {
                chromosome: '1',
                start: 100,
                end: 100,
                referenceAllele: 'C',
                variantAllele: 'G',
            };
            assert.equal(
                genomicLocationString(genomicLocation),
                '1,100,100,C,G',
                'genomic location string should be:  1,100,100,C,G'
            );
        });
        it('normalizes chromosome', () => {
            let chromosome: string = '23';
            assert.equal(
                normalizeChromosome(chromosome),
                'X',
                'normalized chromosome should be: X'
            );
        });
    });

    describe('uniqueGenomicLocations', () => {
        //  These three mutations should map to only two genomic locations
        let mutationList: Partial<Mutation>[] = [
            {
                chromosome: 'chr1',
                startPosition: 100,
                endPosition: 200,
                referenceAllele: 'C',
                variantAllele: 'G',
            },
            {
                chromosome: 'chr1',
                startPosition: 100,
                endPosition: 200,
                referenceAllele: 'C',
                variantAllele: 'G',
            },
            {
                chromosome: 'chr2',
                startPosition: 200,
                endPosition: 300,
                referenceAllele: 'C',
                variantAllele: 'G',
            },
        ];
        it('extract unique genomic locations', () => {
            let genomicLocations = uniqueGenomicLocations(mutationList);
            assert.equal(
                genomicLocations.length,
                2,
                'return value should indicate only 2 unique genomic locations'
            );
            assert.equal(
                genomicLocations[0].chromosome,
                '1',
                'zeroeth genomic location should map to chr1'
            );
            assert.equal(
                genomicLocations[1].chromosome,
                '2',
                'first genomic location should map to chr2'
            );
        });
    });

    describe('generate Hgvsg by mutation', () => {
        it('has valid genomic location', () => {
            const validateMutations: Partial<Mutation>[] = [
                {
                    // valid
                    chromosome: 'X',
                    startPosition: 47836189,
                    endPosition: 47836189,
                    referenceAllele: 'C',
                    variantAllele: 'G',
                },
                {
                    // invalid allele, referenceAllele = "NA"
                    chromosome: '17',
                    startPosition: 7574030,
                    endPosition: 7574030,
                    referenceAllele: 'NA',
                    variantAllele: 'G',
                },
                {
                    // invalid allele, both referenceAllele and variantAllele are "-"
                    chromosome: '17',
                    startPosition: 7577498,
                    endPosition: 7577498,
                    referenceAllele: '-',
                    variantAllele: '-',
                },
                {
                    // invalid allele, referenceAllele is empty
                    chromosome: '17',
                    startPosition: 7577498,
                    endPosition: 7577498,
                    referenceAllele: '',
                    variantAllele: '-',
                },
                {
                    // invalid position, startPosition is -1
                    chromosome: '17',
                    startPosition: -1,
                    endPosition: 7664673,
                    referenceAllele: 'G',
                    variantAllele: 'C',
                },
                {
                    // invalid, missing chr
                    chromosome: '',
                    startPosition: 7577594,
                    endPosition: 7577595,
                    referenceAllele: 'AC',
                    variantAllele: '-',
                },
            ];

            assert.equal(
                true,
                hasValidGenomicLocation(validateMutations[0]),
                'should be valid genomic location'
            );
            assert.equal(
                false,
                hasValidGenomicLocation(validateMutations[1]),
                'should be invalid allele, referenceAllele = NA'
            );
            assert.equal(
                false,
                hasValidGenomicLocation(validateMutations[2]),
                'should be invalid allele, both referenceAllele and variantAllele are -'
            );
            assert.equal(
                false,
                hasValidGenomicLocation(validateMutations[3]),
                'should be invalid allele, referenceAllele is empty'
            );
            assert.equal(
                false,
                hasValidGenomicLocation(validateMutations[4]),
                'should be invalid position, startPosition is -1'
            );
            assert.equal(
                false,
                hasValidGenomicLocation(validateMutations[5]),
                'should be invalid, missing chr'
            );
        });

        it('generate substitution hgvsg', () => {
            const substitutionMutation: Partial<Mutation>[] = [
                {
                    // substitution
                    chromosome: '17',
                    startPosition: 7577121,
                    endPosition: 7577121,
                    referenceAllele: 'G',
                    variantAllele: 'A',
                },
            ];

            assert.equal(
                '17:g.7577121G>A',
                generateHgvsgByMutation(substitutionMutation[0]),
                'the hgvsg should be 17:g.7577121G>A'
            );
        });

        it('generate insertion hgvsg', () => {
            const insertionMutations: Partial<Mutation>[] = [
                {
                    // ins, length of variantAllele > 1
                    chromosome: '17',
                    startPosition: 7579590,
                    endPosition: 7579591,
                    referenceAllele: '-',
                    variantAllele: 'CT',
                },
                {
                    // ins, length of variantAllele = 1
                    chromosome: '17',
                    startPosition: 3637855,
                    endPosition: 3637856,
                    referenceAllele: '-',
                    variantAllele: 'C',
                },
            ];

            assert.equal(
                '17:g.7579590_7579591insCT',
                generateHgvsgByMutation(insertionMutations[0]),
                'should be insertion 17:g.7579590_7579591insCT: (chr):g.(start)_(end)ins(var)'
            );
            assert.equal(
                '17:g.3637855_3637856insC',
                generateHgvsgByMutation(insertionMutations[1]),
                'should be insertion 17:g.3637855_3637856insC: (chr):g.(start)_(end)ins(var)'
            );
        });

        it('generate deletion hgvsg', () => {
            const deletionMutations: Partial<Mutation>[] = [
                {
                    // del, length of referenceAllele = 1
                    chromosome: '17',
                    startPosition: 7574030,
                    endPosition: 7574030,
                    referenceAllele: 'G',
                    variantAllele: '-',
                },
                {
                    // del, length of referenceAllele > 1
                    chromosome: '17',
                    startPosition: 7577594,
                    endPosition: 7577595,
                    referenceAllele: 'AC',
                    variantAllele: '-',
                },
            ];

            assert.equal(
                '17:g.7574030del',
                generateHgvsgByMutation(deletionMutations[0]),
                'should be deletion 17:g.7574030del: (chr):g.(start)del'
            );
            assert.equal(
                '17:g.7577594_7577595del',
                generateHgvsgByMutation(deletionMutations[1]),
                'should be deletion 17:g.7577594_7577595del: (chr):g.(start)_(end)del'
            );
        });

        it('generate delins hgvsg', () => {
            const delinsMutations: Partial<Mutation>[] = [
                {
                    // delins, length of variantAllele = 1
                    chromosome: '17',
                    startPosition: 7573443,
                    endPosition: 7573443,
                    referenceAllele: 'C',
                    variantAllele: 'TGG',
                },
                {
                    // delins, length of variantAllele > 1
                    chromosome: '17',
                    startPosition: 7578205,
                    endPosition: 7578207,
                    referenceAllele: 'CTA',
                    variantAllele: 'TTT',
                },
            ];

            assert.equal(
                '17:g.7573443delinsTGG',
                generateHgvsgByMutation(delinsMutations[0]),
                'should be delins 17:g.7573443delinsTGG: (chr):g.(start)delins(var)'
            );
            assert.equal(
                '17:g.7578205_7578207delinsTTT',
                generateHgvsgByMutation(delinsMutations[1]),
                'should be delins 17:g.7578205_7578207delinsTTT: (chr):g.(start)_(end)delins(var)'
            );
        });
    });
});
