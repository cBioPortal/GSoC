import { assert } from 'chai';
import { Mutation, Sample } from 'cbioportal-ts-api-client';
import { MutationStatus } from '../mutation/PatientViewMutationsTabUtils';
import {
    generateMutationIdByGeneAndProteinChangeAndEvent,
    generateMutationIdByGeneAndProteinChangeSampleIdAndEvent,
} from '../../../shared/lib/StoreUtils';
import { CoverageInformation } from '../../../shared/lib/GenePanelUtils';
import {
    ceil10,
    computeRenderData,
    floor10,
    getYAxisTickmarks,
    IPoint,
    numLeadingDecimalZeros,
    round10,
    minimalDistinctTickStrings,
    yValueScaleFunction,
    splitMutationsBySampleGroup,
} from './VAFChartUtils';
import { GROUP_BY_NONE } from './/VAFChartControls';

import _ from 'lodash';
import { assertDeepEqualInAnyOrder } from 'shared/lib/SpecUtils';

describe('VAFChartUtils', () => {
    describe('computeRenderData', () => {
        function roughlyDeepEqualPoints(
            actual: IPoint[],
            expected: IPoint[],
            message?: string
        ) {
            // theres no other way to do this in chai
            actual.forEach(d => {
                d.y = d.y.toFixed(5) as any;
            });
            expected.forEach(d => {
                d.y = d.y.toFixed(5) as any;
            });

            assert.deepEqual(actual, expected, message);
        }

        function checkResult(
            actual: { grayPoints: IPoint[]; lineData: IPoint[][] },
            expected: { grayPoints: IPoint[]; lineData: IPoint[][] },
            messagePrefix?: string
        ) {
            // gray points in any order
            roughlyDeepEqualPoints(
                actual.grayPoints,
                expected.grayPoints,
                `${messagePrefix || ''}grayPoints`
            );

            // lines in any order, but the actual order of each line internally does matter
            assert.equal(
                actual.lineData.length,
                expected.lineData.length,
                `${messagePrefix || ''}lineData length`
            );

            const mutationKeyToLineData = _.keyBy(actual.lineData, d =>
                generateMutationIdByGeneAndProteinChangeSampleIdAndEvent(
                    d[0].mutation
                )
            );

            for (const line of expected.lineData) {
                const mutationKey = generateMutationIdByGeneAndProteinChangeSampleIdAndEvent(
                    line[0].mutation
                );

                roughlyDeepEqualPoints(
                    mutationKeyToLineData[mutationKey],
                    line,
                    `${messagePrefix || ''}mutation with key ${mutationKey}`
                );
            }
        }

        function makeSample(i: number) {
            return {
                sampleId: `sample${i}`,
                patientId: 'patient',
                uniqueSampleKey: `uniqueKey${i}`,
                studyId: 'study',
            } as Sample;
        }

        function makeMutation(
            sampleI: number,
            hugoGeneSymbol: string,
            proteinChange: string,
            vafPercent?: number,
            mutationStatus: string = ''
        ) {
            return {
                gene: {
                    hugoGeneSymbol,
                },
                mutationStatus,
                uniqueSampleKey: `uniqueKey${sampleI}`,
                uniquePatientKey: `uniquePatientKey`,
                sampleId: `sample${sampleI}`,
                patientId: 'patient',
                studyId: 'study',
                proteinChange,
                chr: '1',
                startPosition: 0,
                endPosition: 0,
                referenceAllele: '',
                variantAllele: '',
                tumorAltCount: vafPercent,
                tumorRefCount:
                    vafPercent === undefined ? undefined : 100 - vafPercent,
                molecularProfileId: 'mutations',
            } as Mutation;
        }

        function makeCoverageInfo(
            profiledIs: number[],
            unprofiledIs: number[],
            unprofiledByGene: { i: number; notProfiledByGene: any }[] = []
        ) {
            const ret: CoverageInformation = { samples: {}, patients: {} };
            for (const i of profiledIs) {
                ret.samples[`uniqueKey${i}`] = {
                    byGene: {},
                    allGenes: [
                        {
                            molecularProfileId: 'mutations',
                            patientId: 'patient',
                            profiled: true,
                            sampleId: `sample${i}`,
                            studyId: 'study',
                            uniquePatientKey: `uniquePatientKey`,
                            uniqueSampleKey: `uniqueKey${i}`,
                        },
                    ],
                    notProfiledByGene: {},
                    notProfiledAllGenes: [],
                };
            }
            for (const i of unprofiledIs) {
                ret.samples[`uniqueKey${i}`] = {
                    byGene: {},
                    notProfiledAllGenes: [
                        {
                            molecularProfileId: 'mutations',
                            patientId: 'patient',
                            profiled: false,
                            sampleId: `sample${i}`,
                            studyId: 'study',
                            uniquePatientKey: `uniquePatientKey`,
                            uniqueSampleKey: `uniqueKey${i}`,
                        },
                    ],
                    notProfiledByGene: {},
                    allGenes: [],
                };
            }
            for (const obj of unprofiledByGene) {
                ret.samples[`uniqueKey${obj.i}`] = {
                    byGene: {},
                    allGenes: [],
                    notProfiledByGene: obj.notProfiledByGene,
                    notProfiledAllGenes: [],
                };
            }
            return ret;
        }

        const sampleIdIndex = {
            sample1: 0,
            sample2: 1,
            sample3: 2,
            sample4: 3,
        };

        it('handles case of empty data', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2, 3], []),
                    GROUP_BY_NONE,
                    {}
                ),
                {
                    grayPoints: [],
                    lineData: [],
                }
            );
        });
        it('returns correct result when every sample has vaf data for every mutation', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(2, 'gene1', 'proteinchange1', 10),
                            makeMutation(3, 'gene1', 'proteinchange1', 15),
                        ],

                        [
                            makeMutation(
                                1,
                                'gene2',
                                'proteinchange2',
                                30,
                                'uncalled'
                            ),
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(3, 'gene2', 'proteinchange2', 25),
                        ],

                        [
                            makeMutation(1, 'gene3', 'proteinchange3', 40),
                            makeMutation(2, 'gene3', 'proteinchange3', 60),
                            makeMutation(3, 'gene3', 'proteinchange3', 80),
                        ],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2, 3], []),
                    GROUP_BY_NONE,
                    {}
                ),
                {
                    grayPoints: [],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene1',
                                    'proteinchange1',
                                    10
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 10 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene1',
                                    'proteinchange1',
                                    15
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 15 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene2',
                                    'proteinchange2',
                                    30,
                                    'uncalled'
                                ),
                                mutationStatus:
                                    MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED,
                                x: 0,
                                y: 30 / 100,
                            },
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene2',
                                    'proteinchange2',
                                    50
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 50 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene2',
                                    'proteinchange2',
                                    25
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 25 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene3',
                                    'proteinchange3',
                                    60
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 60 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene3',
                                    'proteinchange3',
                                    80
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 80 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when every sample has data for every mutation, but not all have VAF', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(2, 'gene1', 'proteinchange1'),
                            makeMutation(3, 'gene1', 'proteinchange1', 15),
                        ],

                        [
                            makeMutation(1, 'gene2', 'proteinchange2', 30),
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(3, 'gene2', 'proteinchange2'),
                        ],

                        [
                            makeMutation(1, 'gene3', 'proteinchange3', 40),
                            makeMutation(2, 'gene3', 'proteinchange3'),
                            makeMutation(3, 'gene3', 'proteinchange3', 80),
                        ],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2, 3], []),
                    GROUP_BY_NONE,
                    {}
                ),
                {
                    grayPoints: [
                        {
                            sampleId: 'sample2',
                            mutation: makeMutation(
                                2,
                                'gene1',
                                'proteinchange1'
                            ),
                            mutationStatus: MutationStatus.MUTATED_BUT_NO_VAF,
                            x: 1,
                            y: 17.5 / 100,
                        },
                        {
                            sampleId: 'sample2',
                            mutation: makeMutation(
                                2,
                                'gene3',
                                'proteinchange3'
                            ),
                            mutationStatus: MutationStatus.MUTATED_BUT_NO_VAF,
                            x: 1,
                            y: 60 / 100,
                        },
                    ],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene1',
                                    'proteinchange1',
                                    15
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 15 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene2',
                                    'proteinchange2',
                                    30
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 30 / 100,
                            },
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene2',
                                    'proteinchange2',
                                    50
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 50 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene3',
                                    'proteinchange3',
                                    80
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 80 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when not every sample has data for every mutation', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(2, 'gene1', 'proteinchange1'),
                            makeMutation(3, 'gene1', 'proteinchange1', 60),
                        ],

                        [
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(3, 'gene2', 'proteinchange2'),
                        ],

                        [
                            makeMutation(1, 'gene3', 'proteinchange3', 40),
                            makeMutation(2, 'gene3', 'proteinchange3'),
                        ],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2, 3], []),
                    GROUP_BY_NONE,
                    {}
                ),
                {
                    grayPoints: [
                        {
                            sampleId: 'sample2',
                            mutation: makeMutation(
                                2,
                                'gene1',
                                'proteinchange1'
                            ),
                            mutationStatus: MutationStatus.MUTATED_BUT_NO_VAF,
                            x: 1,
                            y: 40 / 100,
                        },
                    ],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene1',
                                    'proteinchange1',
                                    60
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 60 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene2',
                                    'proteinchange2',
                                    50
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 50 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when one sample has no data for any mutation', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(3, 'gene1', 'proteinchange1'),
                        ],

                        [makeMutation(3, 'gene2', 'proteinchange2', 50)],

                        [
                            makeMutation(1, 'gene3', 'proteinchange3', 40),
                            makeMutation(3, 'gene3', 'proteinchange3', 65),
                        ],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2, 3], []),
                    GROUP_BY_NONE,
                    {}
                ),
                {
                    grayPoints: [],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene2',
                                    'proteinchange2',
                                    50
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 50 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus:
                                    MutationStatus.PROFILED_BUT_NOT_MUTATED,
                                x: 1,
                                y: 0,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene3',
                                    'proteinchange3',
                                    65
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 65 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when some not profiled', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [makeMutation(1, 'gene1', 'proteinchange1', 20)],

                        [
                            makeMutation(1, 'gene2', 'proteinchange2', 20),
                            makeMutation(3, 'gene2', 'proteinchange2', 30),
                        ],

                        [
                            makeMutation(1, 'gene3', 'proteinchange3', 40),
                            makeMutation(2, 'gene3', 'proteinchange3'),
                        ],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo(
                        [1, 3],
                        [],
                        [
                            {
                                i: 2,
                                notProfiledByGene: {
                                    gene1: {
                                        molecularProfileId: 'mutations',
                                        patientId: 'patient',
                                        profiled: false,
                                        sampleId: `sample2`,
                                        studyId: 'study',
                                        uniquePatientKey: `uniquePatientKey`,
                                        uniqueSampleKey: `uniqueKey2`,
                                    },
                                    gene2: {
                                        molecularProfileId: 'mutations',
                                        patientId: 'patient',
                                        profiled: false,
                                        sampleId: `sample2`,
                                        studyId: 'study',
                                        uniquePatientKey: `uniquePatientKey`,
                                        uniqueSampleKey: `uniqueKey2`,
                                    },
                                },
                            },
                        ]
                    ),
                    GROUP_BY_NONE,
                    {}
                ),
                {
                    grayPoints: [
                        {
                            sampleId: 'sample2',
                            mutation: makeMutation(
                                1,
                                'gene2',
                                'proteinchange2',
                                20
                            ),
                            mutationStatus: MutationStatus.NOT_PROFILED,
                            x: 1,
                            y: 25 / 100,
                        },
                    ],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene2',
                                    'proteinchange2',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene2',
                                    'proteinchange2',
                                    30
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 30 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when a sample is not profiled at all', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(2, 'gene1', 'proteinchange1'),
                        ],

                        [makeMutation(2, 'gene2', 'proteinchange2', 50)],

                        [
                            makeMutation(1, 'gene3', 'proteinchange3', 40),
                            makeMutation(2, 'gene3', 'proteinchange3'),
                        ],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2], [3]),
                    GROUP_BY_NONE,
                    {}
                ),
                {
                    grayPoints: [],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene2',
                                    'proteinchange2',
                                    50
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 50 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when grouped by sample type and every sample has vaf data for every mutation', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [makeMutation(1, 'gene1', 'proteinchange1', 20)],
                        [
                            makeMutation(2, 'gene1', 'proteinchange1', 10),
                            makeMutation(3, 'gene1', 'proteinchange1', 15),
                        ],
                        [
                            makeMutation(
                                1,
                                'gene2',
                                'proteinchange2',
                                30,
                                'uncalled'
                            ),
                        ],
                        [
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(3, 'gene2', 'proteinchange2', 25),
                        ],

                        [makeMutation(1, 'gene3', 'proteinchange3', 40)],
                        [
                            makeMutation(2, 'gene3', 'proteinchange3', 60),
                            makeMutation(3, 'gene3', 'proteinchange3', 80),
                        ],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2, 3], []),
                    'SampleType',
                    {
                        sample1: 'Primary',
                        sample2: 'Recurrence',
                        sample3: 'Recurrence',
                    }
                ),
                {
                    grayPoints: [],
                    lineData: [
                        [
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene1',
                                    'proteinchange1',
                                    10
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 10 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene1',
                                    'proteinchange1',
                                    15
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 15 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene2',
                                    'proteinchange2',
                                    50
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 50 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene2',
                                    'proteinchange2',
                                    25
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 25 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene3',
                                    'proteinchange3',
                                    60
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 60 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene3',
                                    'proteinchange3',
                                    80
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 80 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene2',
                                    'proteinchange2',
                                    30,
                                    'uncalled'
                                ),
                                mutationStatus:
                                    MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED,
                                x: 0,
                                y: 30 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when grouped by sample collection source and every sample has data for every mutation, but not all have VAF', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(3, 'gene1', 'proteinchange1', 15),
                        ],
                        [makeMutation(2, 'gene1', 'proteinchange1')],
                        [
                            makeMutation(1, 'gene2', 'proteinchange2', 30),
                            makeMutation(3, 'gene2', 'proteinchange2'),
                        ],
                        [makeMutation(2, 'gene2', 'proteinchange2', 50)],
                        [
                            makeMutation(1, 'gene3', 'proteinchange3', 40),
                            makeMutation(3, 'gene3', 'proteinchange3', 80),
                        ],
                        [makeMutation(2, 'gene3', 'proteinchange3')],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2, 3], []),
                    'SampleCollectionSource',
                    {
                        sample1: 'Outside',
                        sample2: 'Inside',
                        sample3: 'Outside',
                    }
                ),
                {
                    grayPoints: [],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene1',
                                    'proteinchange1',
                                    15
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 15 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene2',
                                    'proteinchange2',
                                    30
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 30 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene2',
                                    'proteinchange2',
                                    50
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 50 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene3',
                                    'proteinchange3',
                                    80
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 80 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when grouped by sample collection source and not every sample has data for every mutation', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(3, 'gene1', 'proteinchange1', 60),
                        ],
                        [makeMutation(2, 'gene1', 'proteinchange1')],
                        [makeMutation(2, 'gene2', 'proteinchange2', 50)],
                        [makeMutation(3, 'gene2', 'proteinchange2')],
                        [makeMutation(1, 'gene3', 'proteinchange3', 40)],
                        [makeMutation(2, 'gene3', 'proteinchange3')],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2, 3], []),
                    'SampleCollectionSource',
                    {
                        sample1: 'Outside',
                        sample2: 'Inside',
                        sample3: 'Outside',
                    }
                ),
                {
                    grayPoints: [],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene1',
                                    'proteinchange1',
                                    60
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 60 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene2',
                                    'proteinchange2',
                                    50
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 50 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when grouped by sample collection source and one sample has no data for any mutation', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(3, 'gene1', 'proteinchange1'),
                        ],
                        [makeMutation(3, 'gene2', 'proteinchange2', 50)],
                        [
                            makeMutation(1, 'gene3', 'proteinchange3', 40),
                            makeMutation(3, 'gene3', 'proteinchange3', 65),
                        ],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2, 3], []),
                    'SampleCollectionSource',
                    {
                        sample1: 'Outside',
                        sample2: 'Inside',
                        sample3: 'Outside',
                    }
                ),
                {
                    grayPoints: [],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene2',
                                    'proteinchange2',
                                    50
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 50 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene3',
                                    'proteinchange3',
                                    65
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 65 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when grouped by sample collection source and some samples are not profiled', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [makeMutation(1, 'gene1', 'proteinchange1', 20)],
                        [
                            makeMutation(1, 'gene2', 'proteinchange2', 20),
                            makeMutation(3, 'gene2', 'proteinchange2', 30),
                        ],
                        [makeMutation(1, 'gene3', 'proteinchange3', 40)],
                        [makeMutation(2, 'gene3', 'proteinchange3')],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo(
                        [1, 3],
                        [],
                        [
                            {
                                i: 2,
                                notProfiledByGene: {
                                    gene1: {
                                        molecularProfileId: 'mutations',
                                        patientId: 'patient',
                                        profiled: false,
                                        sampleId: `sample2`,
                                        studyId: 'study',
                                        uniquePatientKey: `uniquePatientKey`,
                                        uniqueSampleKey: `uniqueKey2`,
                                    },
                                    gene2: {
                                        molecularProfileId: 'mutations',
                                        patientId: 'patient',
                                        profiled: false,
                                        sampleId: `sample2`,
                                        studyId: 'study',
                                        uniquePatientKey: `uniquePatientKey`,
                                        uniqueSampleKey: `uniqueKey2`,
                                    },
                                },
                            },
                        ]
                    ),
                    'SampleCollectionSource',
                    {
                        sample1: 'Outside',
                        sample2: 'Inside',
                        sample3: 'Outside',
                    }
                ),
                {
                    grayPoints: [],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene2',
                                    'proteinchange2',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene2',
                                    'proteinchange2',
                                    30
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 30 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when grouped by sample type and a sample is not profiled at all', () => {
            checkResult(
                computeRenderData(
                    [makeSample(1), makeSample(2), makeSample(3)],
                    [
                        [makeMutation(1, 'gene1', 'proteinchange1', 20)],
                        [makeMutation(2, 'gene1', 'proteinchange1')],
                        [makeMutation(2, 'gene2', 'proteinchange2', 50)],
                        [makeMutation(1, 'gene3', 'proteinchange3', 40)],
                        [makeMutation(2, 'gene3', 'proteinchange3')],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2], [3]),
                    'SampleType',
                    {
                        sample1: 'Primary',
                        sample2: 'Recurrence',
                        sample3: 'Recurrence',
                    }
                ),
                {
                    grayPoints: [],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene2',
                                    'proteinchange2',
                                    50
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 50 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene3',
                                    'proteinchange3',
                                    40
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 40 / 100,
                            },
                        ],
                    ],
                }
            );
        });
        it('returns correct result when grouped by tumor purity and one sample is not part of any group', () => {
            checkResult(
                computeRenderData(
                    [
                        makeSample(1),
                        makeSample(2),
                        makeSample(3),
                        makeSample(4),
                    ],
                    [
                        [makeMutation(1, 'gene1', 'proteinchange1', 20)],
                        [makeMutation(2, 'gene1', 'proteinchange1', 10)],
                        [
                            makeMutation(3, 'gene1', 'proteinchange1', 15),
                            makeMutation(4, 'gene1', 'proteinchange1', 25),
                        ],
                        [makeMutation(1, 'gene2', 'proteinchange2', 30)],
                        [makeMutation(2, 'gene2', 'proteinchange2', 50)],
                        [
                            makeMutation(3, 'gene2', 'proteinchange2', 25),
                            makeMutation(4, 'gene2', 'proteinchange2', 35),
                        ],
                    ],
                    sampleIdIndex,
                    'mutations',
                    makeCoverageInfo([1, 2, 3, 4], []),
                    'TumorPurity',
                    { sample2: '40', sample3: '30', sample4: '30' }
                ),
                {
                    grayPoints: [],
                    lineData: [
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene1',
                                    'proteinchange1',
                                    20
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 20 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene1',
                                    'proteinchange1',
                                    10
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 10 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene1',
                                    'proteinchange1',
                                    15
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 15 / 100,
                            },
                            {
                                sampleId: 'sample4',
                                mutation: makeMutation(
                                    4,
                                    'gene1',
                                    'proteinchange1',
                                    25
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 3,
                                y: 25 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample1',
                                mutation: makeMutation(
                                    1,
                                    'gene2',
                                    'proteinchange2',
                                    30
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 0,
                                y: 30 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample2',
                                mutation: makeMutation(
                                    2,
                                    'gene2',
                                    'proteinchange2',
                                    50
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 1,
                                y: 50 / 100,
                            },
                        ],
                        [
                            {
                                sampleId: 'sample3',
                                mutation: makeMutation(
                                    3,
                                    'gene2',
                                    'proteinchange2',
                                    25
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 2,
                                y: 25 / 100,
                            },
                            {
                                sampleId: 'sample4',
                                mutation: makeMutation(
                                    4,
                                    'gene2',
                                    'proteinchange2',
                                    35
                                ),
                                mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                                x: 3,
                                y: 35 / 100,
                            },
                        ],
                    ],
                }
            );
        });
    });

    describe('getYAxisTickmarks', () => {
        it('handles normal case', () => {
            const tickmarks = getYAxisTickmarks(0, 10, 6);
            assertDeepEqualInAnyOrder(tickmarks, [0, 2, 4, 6, 8, 10]);
        });
        it('handles zero length', () => {
            const tickmarks = getYAxisTickmarks(0, 10, 0);
            assertDeepEqualInAnyOrder(tickmarks, [0, 10]);
        });
        it('handles undefined length (defaults to 6)', () => {
            const tickmarks = getYAxisTickmarks(0, 10, undefined);
            assertDeepEqualInAnyOrder(tickmarks, [0, 2, 4, 6, 8, 10]);
        });
        it('handles same minY and maxY', () => {
            const tickmarks = getYAxisTickmarks(0, 0, 6);
            assertDeepEqualInAnyOrder(tickmarks, [0, 0, 0, 0, 0, 0]);
        });
    });

    describe('round10', () => {
        it('rounds integer', () => {
            assert.equal(round10(1, 0), 1);
        });
        it('rounds float to integer', () => {
            assert.equal(round10(1.001, 0), 1);
        });
        it('rounds decimal place', () => {
            assert.equal(round10(1.0018, -3), 1.002);
        });
    });

    describe('floor10', () => {
        it('rounds integer', () => {
            assert.equal(floor10(1, 0), 1);
        });
        it('rounds float to integer', () => {
            assert.equal(floor10(1.001, 0), 1);
        });
        it('rounds decimal place', () => {
            assert.equal(floor10(1.0015, -3), 1.001);
        });
    });

    describe('ceil10', () => {
        it('rounds integer', () => {
            assert.equal(ceil10(1, 0), 1);
        });
        it('rounds float to integer', () => {
            assert.equal(ceil10(1.001, 0), 2);
        });
        it('rounds decimal place', () => {
            assert.equal(ceil10(1.0013, -3), 1.002);
        });
    });

    describe('numLeadingDecimalZeros', () => {
        it('handles integer correctly', () => {
            assert.equal(numLeadingDecimalZeros(1), 0);
        });
        it('handles decimal correctly', () => {
            assert.equal(numLeadingDecimalZeros(0.001), 2);
        });
        it('handles decimal larger than 1 correctly', () => {
            assert.equal(numLeadingDecimalZeros(1.001), 0);
        });
        it('handles decimal larger than 0.1 correctly', () => {
            assert.equal(numLeadingDecimalZeros(0.1), 0);
        });
    });

    describe('minimalDistinctTickStrings', () => {
        it('works with empty array', () => {
            assert.deepEqual(minimalDistinctTickStrings([]), []);
        });
        it('converts to string', () => {
            assert.deepEqual(minimalDistinctTickStrings([1]), ['1']);
        });
        it('deduplicate numbers', () => {
            assert.deepEqual(minimalDistinctTickStrings([1, 1]), ['1']);
        });
        it('shows equals digits in fractional part', () => {
            assert.deepEqual(minimalDistinctTickStrings([1, 1.1]), [
                '1.0',
                '1.1',
            ]);
        });
        it('shows just enough numbers in fractional part to distinguish number', () => {
            assert.deepEqual(
                minimalDistinctTickStrings([0.01, 0.002, 0.0003]),
                ['0.010', '0.002', '0.000']
            );
        });
        it('falls back on the scientific notation of original numbers if 3 decimal digits are not enough to distinguish', () => {
            assert.deepEqual(minimalDistinctTickStrings([0.0001, 0.000201]), [
                '1e-4',
                '2.01e-4',
            ]);
        });
    });

    describe('yValueScaleFunction', () => {
        it('handles linear scale, zero minY tickmark', () => {
            const yPadding = 10;
            const f = yValueScaleFunction(0, 10, 120, false);
            assert.equal(f(1), 120 - yPadding - 10);
        });
        it('handles linear scale, larger than zero minY tickmark', () => {
            const yPadding = 10;
            const f = yValueScaleFunction(1, 9, 120, false);
            assert.equal(f(1), 120 - yPadding - 0);
        });
        it('handles log10 scale, zero minY tickmark', () => {
            const yPadding = 10;
            const f = yValueScaleFunction(0, 10, 120, true);
            assert.equal(f(1), 120 - yPadding - 75);
        });
        it('handles log10 scale, larger than zero minY tickmark', () => {
            const yPadding = 10;
            const f = yValueScaleFunction(1, 9, 120, true);
            assert.approximately(f(2), 120 - yPadding - 31.5, 0.1);
        });
    });

    describe('splitMutationsBySampleGroup', () => {
        function checkResult(
            actual: Mutation[][],
            expected: Mutation[][],
            messagePrefix?: string
        ) {
            assert.equal(
                actual.length,
                expected.length,
                `${messagePrefix || ''}mutations length`
            );
            actual.forEach((mutationGroup, groupIndex) => {
                mutationGroup.forEach((mutation, mutationIndex) => {
                    const actualMutationKey = generateMutationIdByGeneAndProteinChangeSampleIdAndEvent(
                        mutation
                    );
                    const expectedMutationKey = generateMutationIdByGeneAndProteinChangeSampleIdAndEvent(
                        expected[groupIndex][mutationIndex]
                    );
                    assert.equal(
                        actualMutationKey,
                        expectedMutationKey,
                        `${messagePrefix ||
                            ''}mutation with key ${actualMutationKey}`
                    );
                });
            });
        }

        function makeMutation(
            sampleI: number,
            hugoGeneSymbol: string,
            proteinChange: string,
            vafPercent?: number,
            mutationStatus: string = ''
        ) {
            return {
                gene: {
                    hugoGeneSymbol,
                },
                mutationStatus,
                uniqueSampleKey: `uniqueKey${sampleI}`,
                uniquePatientKey: `uniquePatientKey`,
                sampleId: `sample${sampleI}`,
                patientId: 'patient',
                studyId: 'study',
                proteinChange,
                chr: '1',
                startPosition: 0,
                endPosition: 0,
                referenceAllele: '',
                variantAllele: '',
                tumorAltCount: vafPercent,
                tumorRefCount:
                    vafPercent === undefined ? undefined : 100 - vafPercent,
                molecularProfileId: 'mutations',
            } as Mutation;
        }

        it('returns correct result when all samples have a group', () => {
            checkResult(
                splitMutationsBySampleGroup(
                    [
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(2, 'gene1', 'proteinchange1', 30),
                            makeMutation(3, 'gene1', 'proteinchange1', 40),
                            makeMutation(4, 'gene1', 'proteinchange1', 10),
                        ],
                        [
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(3, 'gene2', 'proteinchange2', 20),
                            makeMutation(4, 'gene2', 'proteinchange2', 60),
                        ],
                        [
                            makeMutation(1, 'gene3', 'proteinchange3', 40),
                            makeMutation(2, 'gene3', 'proteinchange3', 50),
                        ],
                    ],
                    {
                        sample1: 'group1',
                        sample2: 'group2',
                        sample3: 'group3',
                        sample4: 'group2',
                    }
                ),
                [
                    [makeMutation(1, 'gene1', 'proteinchange1', 20)],
                    [
                        makeMutation(2, 'gene1', 'proteinchange1', 30),
                        makeMutation(4, 'gene1', 'proteinchange1', 10),
                    ],
                    [makeMutation(3, 'gene1', 'proteinchange1', 40)],
                    [
                        makeMutation(2, 'gene2', 'proteinchange2', 50),
                        makeMutation(4, 'gene2', 'proteinchange2', 60),
                    ],
                    [makeMutation(3, 'gene2', 'proteinchange2', 20)],
                    [makeMutation(1, 'gene3', 'proteinchange3', 40)],
                    [makeMutation(2, 'gene3', 'proteinchange3', 50)],
                ]
            );
        });
        it('returns correct result when one sample has no group', () => {
            checkResult(
                splitMutationsBySampleGroup(
                    [
                        [
                            makeMutation(1, 'gene1', 'proteinchange1', 20),
                            makeMutation(2, 'gene1', 'proteinchange1', 30),
                            makeMutation(3, 'gene1', 'proteinchange1', 40),
                            makeMutation(4, 'gene1', 'proteinchange1', 10),
                        ],
                        [
                            makeMutation(2, 'gene2', 'proteinchange2', 50),
                            makeMutation(3, 'gene2', 'proteinchange2', 20),
                            makeMutation(4, 'gene2', 'proteinchange2', 60),
                        ],
                        [
                            makeMutation(1, 'gene3', 'proteinchange3', 40),
                            makeMutation(2, 'gene3', 'proteinchange3', 50),
                        ],
                    ],
                    { sample2: 'group2', sample3: 'group3', sample4: 'group2' }
                ),
                [
                    [makeMutation(1, 'gene1', 'proteinchange1', 20)],
                    [
                        makeMutation(2, 'gene1', 'proteinchange1', 30),
                        makeMutation(4, 'gene1', 'proteinchange1', 10),
                    ],
                    [makeMutation(3, 'gene1', 'proteinchange1', 40)],
                    [
                        makeMutation(2, 'gene2', 'proteinchange2', 50),
                        makeMutation(4, 'gene2', 'proteinchange2', 60),
                    ],
                    [makeMutation(3, 'gene2', 'proteinchange2', 20)],
                    [makeMutation(1, 'gene3', 'proteinchange3', 40)],
                    [makeMutation(2, 'gene3', 'proteinchange3', 50)],
                ]
            );
        });
    });
});
