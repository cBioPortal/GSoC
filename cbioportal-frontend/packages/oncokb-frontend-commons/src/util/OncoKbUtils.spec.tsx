import { assert } from 'chai';

import { Mutation } from 'cbioportal-utils';

import {
    defaultOncoKbIndicatorFilter,
    getPositionalVariant,
    groupOncoKbIndicatorDataByMutations,
    parseOncoKBAbstractReference,
} from './OncoKbUtils';

describe('OncoKbUtils', () => {
    describe('groupOncoKbIndicatorDataByMutations', () => {
        const mutationsByPosition = {
            [666]: [
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_66',
                    proteinChange: 'D666V',
                    mutationType: 'Missense_Mutation',
                    proteinPosStart: 666,
                    proteinPosEnd: 666,
                },
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_67',
                    proteinChange: 'D666Z',
                    mutationType: 'Missense_Mutation',
                    proteinPosStart: 666,
                    proteinPosEnd: 666,
                },
            ],
            [790]: [
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_0',
                    proteinChange: 'T790M',
                    mutationType: 'Missense_Mutation',
                    proteinPosStart: 790,
                    proteinPosEnd: 790,
                },
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_1',
                    proteinChange: 'T790M',
                    mutationType: 'Missense_Mutation',
                    proteinPosStart: 790,
                    proteinPosEnd: 790,
                },
            ],
            [858]: [
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_2',
                    proteinChange: 'L858R',
                    mutationType: 'Missense_Mutation',
                    proteinPosStart: 858,
                    proteinPosEnd: 858,
                },
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_3',
                    proteinChange: 'L858R',
                    mutationType: 'Missense_Mutation',
                    proteinPosStart: 858,
                    proteinPosEnd: 858,
                },
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_4',
                    proteinChange: 'L858R',
                    mutationType: 'Missense_Mutation',
                    proteinPosStart: 858,
                    proteinPosEnd: 858,
                },
                {
                    gene: {
                        hugoGeneSymbol: 'EGFR',
                        entrezGeneId: 1956,
                    },
                    uniqueSampleKey: 'uniqueSampleKey_5',
                    proteinChange: 'L858L',
                    mutationType: 'Silent',
                    proteinPosStart: 858,
                    proteinPosEnd: 858,
                },
            ],
        };

        const uniqueSampleKeyToTumorType: { [key: string]: string } = {
            uniqueSampleKey_0: 'Lung Adenocarcinoma',
            uniqueSampleKey_1: 'Lung Adenocarcinoma',
            uniqueSampleKey_2: 'Lung Adenocarcinoma',
            uniqueSampleKey_3: 'Lung Adenocarcinoma',
            uniqueSampleKey_4: 'Lung Adenocarcinoma',
            uniqueSampleKey_5: 'Lung Adenocarcinoma',
            uniqueSampleKey_66: 'Lung Adenocarcinoma',
            uniqueSampleKey_67: 'Lung Adenocarcinoma',
        };

        const oncoKbData = {
            indicatorMap: {
                '1956_Lung_Adenocarcinoma_T790M_Missense_Mutation': {
                    oncogenic: 'Oncogenic',
                    mutationEffect: {
                        knownEffect: 'Gain-of-function',
                    },
                },
                '1956_Lung_Adenocarcinoma_L858R_Missense_Mutation': {
                    oncogenic: 'Likely Oncogenic',
                    mutationEffect: {
                        knownEffect: 'Gain-of-function',
                    },
                },
                '1956_Lung_Adenocarcinoma_D666V_Missense_Mutation': {
                    oncogenic: 'Inconclusive',
                    mutationEffect: {
                        knownEffect: 'Unknown',
                    },
                },
                '1956_Lung_Adenocarcinoma_D666Z_Missense_Mutation': {
                    oncogenic: 'Unknown',
                    mutationEffect: {
                        knownEffect: 'None',
                    },
                },
                '1956_Lung_Adenocarcinoma_L858L_Silent': {
                    oncogenic: 'NA',
                    mutationEffect: {
                        knownEffect: 'NA',
                    },
                },
            },
        };

        it('groups OncoKB indicator data by mutation protein positions', () => {
            const grouped = groupOncoKbIndicatorDataByMutations(
                mutationsByPosition,
                oncoKbData as any,
                (mutation: Mutation) =>
                    uniqueSampleKeyToTumorType[
                        (mutation as any).uniqueSampleKey
                    ],
                (mutation: Mutation) => (mutation as any).gene.entrezGeneId,
                defaultOncoKbIndicatorFilter
            );

            assert.equal(
                grouped[790].length,
                2,
                'all should be picked by the indicator filter as oncogenic at position 790'
            );
            assert.equal(
                grouped[858].length,
                3,
                '3 out of 4 should be picked by the indicator filter as oncogenic at position 858'
            );
            assert.isUndefined(
                grouped[666],
                'none should be picked by the indicator filter as oncogenic at position 666'
            );
        });
    });

    describe('getPositionalVariant', () => {
        it('Missense with one amino acid change', () => {
            const missenseAlteration = 'V600E';
            const expectedPositionalVariant = 'V600';
            assert.equal(
                getPositionalVariant(missenseAlteration),
                expectedPositionalVariant,
                'V600 should be returned'
            );
        });
        it('Missense with multiple amino acid changes', () => {
            const missenseAlteration = 'VK600EI';
            const expectedPositionalVariant = 'V600';
            assert.equal(
                getPositionalVariant(missenseAlteration),
                expectedPositionalVariant,
                'V600 should be returned'
            );
        });
        it('Input is positional alteration', () => {
            const oneAAAlteration = 'V600';
            const twoAAAlteration = 'VK600';
            const expectedPositionalVariant = 'V600';
            assert.equal(
                getPositionalVariant(oneAAAlteration),
                expectedPositionalVariant,
                'V600 should be returned'
            );
            assert.equal(
                getPositionalVariant(twoAAAlteration),
                expectedPositionalVariant,
                'V600 should be returned'
            );
        });
        it('Undefined returned for delins missense alteration', () => {
            // the structure is too complex to parse, we simply skip for this scenario
            const missenseAlteration = 'M277_D278delinsIY';
            assert.equal(
                getPositionalVariant(missenseAlteration),
                undefined,
                'undefined should be returned'
            );
        });
        it('Undefined returned for other type of alteration', () => {
            const inframeDeletion = 'N486_T491delinsK';
            assert.equal(
                getPositionalVariant(inframeDeletion),
                undefined,
                'undefined should be returned'
            );
        });
        it('Undefined returned for empty string', () => {
            const missenseAlteration = '';
            assert.equal(
                getPositionalVariant(missenseAlteration),
                undefined,
                'V600 should be returned'
            );
        });
    });

    describe('parseOncoKBAbstractReference', () => {
        it('Valid abstract reference passed', () => {
            const abstractReference =
                '(Abstract: Hunger et al. ASH 2017. http://www.bloodjournal.org/content/130/Suppl_1/98)';
            const expectedOutput = {
                abstractTitle: 'Hunger et al. ASH 2017.',
                abstractLink:
                    'http://www.bloodjournal.org/content/130/Suppl_1/98',
            };
            assert.deepEqual(
                parseOncoKBAbstractReference(abstractReference),
                expectedOutput
            );
        });
        it('Invalid abstract reference containing abstract string', () => {
            const abstractReference =
                '(Abstract: Fakih et al. Abstract# 3003, ASCO 2019. https://meetinglibrary.asco.org/record/12411/Abstract)';
            const expectedOutput = {
                abstractTitle: 'Fakih et al. Abstract# 3003, ASCO 2019.',
                abstractLink:
                    'https://meetinglibrary.asco.org/record/12411/Abstract',
            };
            assert.deepEqual(
                parseOncoKBAbstractReference(abstractReference),
                expectedOutput
            );
        });
        it('Undefined returned for abstract with missing link', () => {
            const abstractReference = '(Abstract: Hunger et al. ASH 2017.)';
            assert.equal(
                parseOncoKBAbstractReference(abstractReference),
                undefined,
                'undefined should be returned'
            );
        });
        it('Undefined returned for non-abstract reference', () => {
            const pmidReference = '(PMID: 11753428)';
            assert.equal(
                parseOncoKBAbstractReference(pmidReference),
                undefined,
                'undefined should be returned'
            );
        });
        it('Undefined returned for empty string', () => {
            const abstractReference = '';
            assert.equal(
                parseOncoKBAbstractReference(abstractReference),
                undefined,
                'undefined should be returned'
            );
        });
    });
});
