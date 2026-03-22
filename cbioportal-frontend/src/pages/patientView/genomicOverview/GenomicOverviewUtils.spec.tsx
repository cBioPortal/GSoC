import { assert } from 'chai';
import {
    COLOR_GENEPANEL_ICON,
    genePanelIdToIconData,
    WHOLEGENOME_LABEL,
    sampleIdToIconData,
    COLOR_WHOLEGENOME_ICON,
    IKeyedIconData,
    computeMutationFrequencyBySample,
} from './GenomicOverviewUtils';
import { GenePanelIdSpecialValue } from 'shared/lib/StoreUtils';
import { MutationFrequenciesBySample } from 'pages/patientView/vafPlot/VAFPlot';

describe('GenomicOverviewUtils', () => {
    describe('genePanelIdToIconData()', () => {
        const expectedData = {
            A: { label: 'P1', color: COLOR_GENEPANEL_ICON, genePanelId: 'A' },
            B: { label: 'P2', color: COLOR_GENEPANEL_ICON, genePanelId: 'B' },
            C: { label: 'P3', color: COLOR_GENEPANEL_ICON, genePanelId: 'C' },
        };

        it('generates icon data', () => {
            const genePanelIds = ['A', 'B', 'C'];
            assert.deepEqual(genePanelIdToIconData(genePanelIds), expectedData);
        });

        it('generates icon data independent of input order', () => {
            const genePanelIds = ['C', 'B', 'A'];
            assert.deepEqual(genePanelIdToIconData(genePanelIds), expectedData);
        });

        it('removes undefined entries', () => {
            const genePanelIds = ['A', 'B', 'C', undefined];
            assert.deepEqual(genePanelIdToIconData(genePanelIds), expectedData);
        });

        it('adds whole-genome icon data', () => {
            const genePanelIds = [
                GenePanelIdSpecialValue.WHOLE_EXOME_SEQ,
                GenePanelIdSpecialValue.WHOLE_GENOME_SEQ,
            ];

            const expectedData: any = {};
            expectedData[GenePanelIdSpecialValue.WHOLE_EXOME_SEQ] = {
                label: WHOLEGENOME_LABEL,
                color: COLOR_WHOLEGENOME_ICON,
                genePanelId: GenePanelIdSpecialValue.WHOLE_EXOME_SEQ,
            };
            expectedData[GenePanelIdSpecialValue.WHOLE_GENOME_SEQ] = {
                label: WHOLEGENOME_LABEL,
                color: COLOR_WHOLEGENOME_ICON,
                genePanelId: GenePanelIdSpecialValue.WHOLE_GENOME_SEQ,
            };

            assert.deepEqual(genePanelIdToIconData(genePanelIds), expectedData);
        });
    });

    describe('sampleIdToIconData()', () => {
        const iconLookUp = {
            panel1: {
                label: 'P1',
                color: COLOR_GENEPANEL_ICON,
                genePanelId: 'panel1',
            },
            panel2: {
                label: 'P2',
                color: COLOR_GENEPANEL_ICON,
                genePanelId: 'panel2',
            },
        };

        it('links icon data', () => {
            const sampleToGenePanelId = {
                sampleA: 'panel1',
                sampleB: 'panel2',
            } as { [sampleId: string]: string };

            const expectedData = {
                sampleA: {
                    label: 'P1',
                    color: COLOR_GENEPANEL_ICON,
                    genePanelId: 'panel1',
                },
                sampleB: {
                    label: 'P2',
                    color: COLOR_GENEPANEL_ICON,
                    genePanelId: 'panel2',
                },
            };

            assert.deepEqual(
                sampleIdToIconData(sampleToGenePanelId, iconLookUp),
                expectedData
            );
        });

        it('returns empty object when sampleToGenePanel data is undefined', () => {
            assert.deepEqual(sampleIdToIconData(undefined, iconLookUp), {});
        });

        it('links undefined genePanelId to whole-genome analysis icon', () => {
            const sampleToGenePanelId = {
                sampleA: undefined,
                sampleB: 'panel1',
            } as { [sampleId: string]: string | undefined };

            const expectedData = {
                sampleA: {
                    label: WHOLEGENOME_LABEL,
                    color: COLOR_WHOLEGENOME_ICON,
                    genePanelId: undefined,
                },
                sampleB: {
                    label: 'P1',
                    color: COLOR_GENEPANEL_ICON,
                    genePanelId: 'panel1',
                },
            };

            assert.deepEqual(
                sampleIdToIconData(sampleToGenePanelId, iconLookUp),
                expectedData
            );
        });

        it('links whole-genome genePanelIds to whole-genome analysis icon', () => {
            const myIconLookup: IKeyedIconData = {
                panel1: {
                    label: 'P1',
                    color: COLOR_GENEPANEL_ICON,
                    genePanelId: 'panel1',
                },
            };
            myIconLookup[GenePanelIdSpecialValue.WHOLE_EXOME_SEQ] = {
                label: WHOLEGENOME_LABEL,
                color: COLOR_WHOLEGENOME_ICON,
                genePanelId: GenePanelIdSpecialValue.WHOLE_EXOME_SEQ,
            };
            myIconLookup[GenePanelIdSpecialValue.WHOLE_GENOME_SEQ] = {
                label: WHOLEGENOME_LABEL,
                color: COLOR_WHOLEGENOME_ICON,
                genePanelId: GenePanelIdSpecialValue.WHOLE_GENOME_SEQ,
            };

            const sampleToGenePanelId = {
                sampleA: GenePanelIdSpecialValue.WHOLE_EXOME_SEQ,
                sampleB: GenePanelIdSpecialValue.WHOLE_GENOME_SEQ,
                sampleC: 'panel1',
            } as { [sampleId: string]: string | undefined };

            const expectedData = {
                sampleA: {
                    label: WHOLEGENOME_LABEL,
                    color: COLOR_WHOLEGENOME_ICON,
                    genePanelId: GenePanelIdSpecialValue.WHOLE_EXOME_SEQ,
                },
                sampleB: {
                    label: WHOLEGENOME_LABEL,
                    color: COLOR_WHOLEGENOME_ICON,
                    genePanelId: GenePanelIdSpecialValue.WHOLE_GENOME_SEQ,
                },
                sampleC: {
                    label: 'P1',
                    color: COLOR_GENEPANEL_ICON,
                    genePanelId: 'panel1',
                },
            };

            assert.deepEqual(
                sampleIdToIconData(sampleToGenePanelId, myIconLookup),
                expectedData
            );
        });

        it('returns empty object when all samples are whole genome', () => {
            const myIconLookup: IKeyedIconData = {};
            myIconLookup[GenePanelIdSpecialValue.WHOLE_EXOME_SEQ] = {
                label: WHOLEGENOME_LABEL,
                color: COLOR_WHOLEGENOME_ICON,
                genePanelId: GenePanelIdSpecialValue.WHOLE_EXOME_SEQ,
            };
            myIconLookup[GenePanelIdSpecialValue.WHOLE_GENOME_SEQ] = {
                label: WHOLEGENOME_LABEL,
                color: COLOR_WHOLEGENOME_ICON,
                genePanelId: GenePanelIdSpecialValue.WHOLE_GENOME_SEQ,
            };

            const sampleToGenePanelId = {
                sampleA: GenePanelIdSpecialValue.WHOLE_EXOME_SEQ,
                sampleB: GenePanelIdSpecialValue.WHOLE_GENOME_SEQ,
                sampleC: GenePanelIdSpecialValue.UNKNOWN,
            } as { [sampleId: string]: string | undefined };

            const expectedData = {};

            assert.deepEqual(
                sampleIdToIconData(sampleToGenePanelId, myIconLookup),
                expectedData
            );
        });
    });

    describe('computeMutationFrequencyBySample()', () => {
        function assertDeepEqualFrequencies(
            actual: MutationFrequenciesBySample,
            expected: MutationFrequenciesBySample,
            message: string
        ) {
            assert.equal(
                Object.keys(actual).length,
                Object.keys(expected).length,
                message
            );
            for (const sample of Object.keys(actual)) {
                const actualList = actual[sample];
                const expectedList = expected[sample];
                for (let i = 0; i < actualList.length; i++) {
                    if (isNaN(actualList[i])) {
                        assert.isTrue(isNaN(expectedList[i]), message);
                    } else {
                        assert.closeTo(
                            actualList[i],
                            expectedList[i],
                            0.0000001,
                            message
                        );
                    }
                }
            }
        }

        let mergedMutations: any[][];

        it('computes the correct frequencies for a single sample', () => {
            mergedMutations = [];
            assert.deepEqual(
                computeMutationFrequencyBySample(mergedMutations, {}),
                {},
                'no frequencies with no mutations'
            );

            mergedMutations = [
                [{ sampleId: 'sample1', tumorAltCount: 10, tumorRefCount: 30 }],
            ];

            assertDeepEqualFrequencies(
                computeMutationFrequencyBySample(mergedMutations, {}),
                { sample1: [0.25] },
                'correctly calculates variant allele frequencies'
            );

            mergedMutations = [
                [{ sampleId: 'sample1', tumorAltCount: 10, tumorRefCount: 30 }],
                [{ sampleId: 'sample1', tumorAltCount: 1, tumorRefCount: 5 }],
                [{ sampleId: 'sample1', tumorAltCount: 2, tumorRefCount: 8 }],
                [
                    {
                        sampleId: 'sample1',
                        tumorAltCount: 100,
                        tumorRefCount: 1000,
                    },
                ],
            ];

            assertDeepEqualFrequencies(
                computeMutationFrequencyBySample(mergedMutations, {}),
                { sample1: [1 / 4, 1 / 6, 1 / 5, 1 / 11] },
                'correctly calculates, part 2'
            );
        });

        it(`computes the correct frequencies for multiple samples, such that 
                the frequency lists are the same length, padded by NaNs for any 
                mutation which that sample does not have`, () => {
            // cases:
            // one mutation for one sample
            // one mutation for both samples
            // a few mutations with both, some with either one
            // a few mutations with both
            mergedMutations = [
                [{ sampleId: 'sample1', tumorAltCount: 10, tumorRefCount: 30 }],
            ];
            assertDeepEqualFrequencies(
                computeMutationFrequencyBySample(mergedMutations, {
                    sample1: 1,
                    sample2: 2,
                }),
                { sample1: [1 / 4], sample2: [NaN] },
                'case: one mutation for one sample'
            );

            mergedMutations = [
                [
                    {
                        sampleId: 'sample1',
                        tumorAltCount: 10,
                        tumorRefCount: 30,
                    },
                    {
                        sampleId: 'sample2',
                        tumorAltCount: 20,
                        tumorRefCount: 30,
                    },
                ],
            ];

            assertDeepEqualFrequencies(
                computeMutationFrequencyBySample(mergedMutations, {
                    sample1: 1,
                    sample2: 2,
                }),
                { sample1: [1 / 4], sample2: [2 / 5] },
                'case: one mutation for both samples'
            );

            mergedMutations = [
                [
                    {
                        sampleId: 'sample1',
                        tumorAltCount: 10,
                        tumorRefCount: 30,
                    },
                    {
                        sampleId: 'sample2',
                        tumorAltCount: 20,
                        tumorRefCount: 30,
                    },
                ],
                [
                    {
                        sampleId: 'sample1',
                        tumorAltCount: 10,
                        tumorRefCount: 30,
                    },
                    {
                        sampleId: 'sample2',
                        tumorAltCount: 20,
                        tumorRefCount: 30,
                    },
                ],
                [{ sampleId: 'sample2', tumorAltCount: 30, tumorRefCount: 80 }],
                [{ sampleId: 'sample1', tumorAltCount: 10, tumorRefCount: 40 }],
                [{ sampleId: 'sample1', tumorAltCount: 20, tumorRefCount: 40 }],
            ];

            assertDeepEqualFrequencies(
                computeMutationFrequencyBySample(mergedMutations, {
                    sample1: 1,
                    sample2: 2,
                }),
                {
                    sample1: [1 / 4, 1 / 4, 1 / 5, 1 / 3, NaN],
                    sample2: [2 / 5, 2 / 5, 3 / 11, NaN, NaN],
                },
                'case: a few mutations for both, a few for only one'
            );

            mergedMutations = [
                [
                    {
                        sampleId: 'sample1',
                        tumorAltCount: 10,
                        tumorRefCount: 30,
                    },
                    {
                        sampleId: 'sample2',
                        tumorAltCount: 20,
                        tumorRefCount: 30,
                    },
                ],
                [
                    {
                        sampleId: 'sample1',
                        tumorAltCount: 10,
                        tumorRefCount: 30,
                    },
                    {
                        sampleId: 'sample2',
                        tumorAltCount: 20,
                        tumorRefCount: 30,
                    },
                ],
                [
                    {
                        sampleId: 'sample1',
                        tumorAltCount: 30,
                        tumorRefCount: 80,
                    },
                    {
                        sampleId: 'sample2',
                        tumorAltCount: 30,
                        tumorRefCount: 80,
                    },
                ],
                [
                    {
                        sampleId: 'sample1',
                        tumorAltCount: 10,
                        tumorRefCount: 40,
                    },
                    {
                        sampleId: 'sample2',
                        tumorAltCount: 10,
                        tumorRefCount: 40,
                    },
                ],
                [
                    {
                        sampleId: 'sample1',
                        tumorAltCount: 20,
                        tumorRefCount: 40,
                    },
                    {
                        sampleId: 'sample2',
                        tumorAltCount: 10,
                        tumorRefCount: 40,
                    },
                ],
            ];

            assertDeepEqualFrequencies(
                computeMutationFrequencyBySample(mergedMutations, {
                    sample1: 1,
                    sample2: 2,
                }),
                {
                    sample1: [1 / 4, 1 / 4, 3 / 11, 1 / 5, 1 / 3],
                    sample2: [2 / 5, 2 / 5, 3 / 11, 1 / 5, 1 / 5],
                },
                'case: all mutations for both'
            );
        });
    });
});
