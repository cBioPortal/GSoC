import { assert } from 'chai';
import {
    CLIN_ATTR_DATA_TYPE,
    getMutationProfileDuplicateSamplesReport,
    makeAxisDataPromise_Molecular_MakeMutationData,
    makeClinicalAttributeOptions,
    makeScatterPlotData,
    MUT_PROFILE_COUNT_MULTIPLE,
    MUT_PROFILE_COUNT_MUTATED,
    MUT_PROFILE_COUNT_NOT_MUTATED,
    MUT_PROFILE_COUNT_NOT_PROFILED,
    mutationTypeToDisplayName,
    mutTypeCategoryOrder,
    mutVsWildCategoryOrder,
    makeWaterfallPlotData,
    IWaterfallPlotData,
    getWaterfallPlotDownloadData,
    getLimitValues,
    MUT_PROFILE_COUNT_DRIVER,
    MUT_PROFILE_COUNT_VUS,
    mutDriverVsVUSCategoryOrder,
    logScalePossible,
} from './PlotsTabUtils';
import { Mutation, Sample, Gene } from 'cbioportal-ts-api-client';
import { AlterationTypeConstants, DataTypeConstants } from 'shared/constants';
import { MutationCountBy, AxisMenuSelection } from './PlotsTab';
import {
    CoverageInformation,
    CoverageInformationForCase,
} from 'shared/lib/GenePanelUtils';
import {
    makeAxisLogScaleFunction,
    IAxisData,
    axisHasNegativeNumbers,
} from './PlotsTabUtils';

import _ from 'lodash';
import { GenericAssayTypeConstants } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';
import { AnnotatedNumericGeneMolecularData } from 'shared/model/AnnotatedNumericGeneMolecularData';

describe('PlotsTabUtils', () => {
    describe('makeClinicalAttributeOptions', () => {
        it('returns correct for empty input', () => {
            assert.deepEqual(makeClinicalAttributeOptions([]), []);
        });
        it('returns correct options, sorted and filtering out everything besides number and string', () => {
            assert.deepEqual(
                makeClinicalAttributeOptions([
                    {
                        datatype: 'string',
                        clinicalAttributeId: 'attribute2',
                        displayName: 'Second Attribute',
                        priority: '',
                    },
                    {
                        datatype: 'number',
                        clinicalAttributeId: 'attribute1',
                        displayName: 'First Attribute',
                        priority: '0',
                    },
                    {
                        datatype: 'string',
                        clinicalAttributeId: 'attribute3',
                        displayName: 'Third Attribute',
                        priority: '',
                    },
                    {
                        datatype: 'counts_map',
                        clinicalAttributeId: 'attribute4',
                        displayName: 'Bad attribute',
                        priority: '3',
                    },
                ]),
                [
                    {
                        value: 'attribute1',
                        label: 'First Attribute',
                        priority: 0,
                    },
                    {
                        value: 'attribute2',
                        label: 'Second Attribute',
                        priority: -1,
                    },
                    {
                        value: 'attribute3',
                        label: 'Third Attribute',
                        priority: -1,
                    },
                ]
            );
        });
    });
    describe('makeScatterPlotData', () => {
        it('does not create data for NaN values', () => {
            const data = makeScatterPlotData(
                {
                    datatype: 'number',
                    data: [
                        { uniqueSampleKey: 'sample1', value: NaN },
                        { uniqueSampleKey: 'sample2', value: 3 },
                        { uniqueSampleKey: 'sample3', value: 1 },
                    ],
                },
                {
                    datatype: 'number',
                    data: [
                        { uniqueSampleKey: 'sample1', value: 0 },
                        { uniqueSampleKey: 'sample2', value: NaN },
                        { uniqueSampleKey: 'sample3', value: 4 },
                    ],
                },
                {
                    sample1: {
                        sampleId: 'sample1',
                        studyId: 'study',
                    } as Sample,
                    sample2: {
                        sampleId: 'sample2',
                        studyId: 'study',
                    } as Sample,
                    sample3: {
                        sampleId: 'sample3',
                        studyId: 'study',
                    } as Sample,
                },
                {}
            );
            assert.equal(data.length, 1, 'only one datum - others have NaN');
            const datum: any = data[0];
            const target: any = {
                uniqueSampleKey: 'sample3',
                sampleId: 'sample3',
                studyId: 'study',
                x: 1,
                y: 4,
            };
            for (const key of [
                'uniqueSampleKey',
                'sampleId',
                'studyId',
                'x',
                'y',
            ]) {
                assert.equal(target[key], datum[key], key);
            }
        });
    });

    describe('makeWaterfallPlotData', () => {
        const mockParams = {
            axisData: {
                datatype: 'number',
                data: [{ uniqueSampleKey: 'sample1', value: 1 }],
            },
            uniqueSampleKeyToSample: {
                sample1: ({
                    sampleId: 'sample1',
                    studyId: 'study',
                } as any) as Sample,
                sample2: ({
                    sampleId: 'sample2',
                    studyId: 'study',
                } as any) as Sample,
                sample3: ({
                    sampleId: 'sample3',
                    studyId: 'study',
                } as any) as Sample,
            },
            coverageInformation: {
                sample1: ({
                    byGene: {},
                    allGenes: [],
                } as any) as CoverageInformationForCase,
                sample2: ({
                    byGene: {},
                    allGenes: [],
                } as any) as CoverageInformationForCase,
                sample3: ({
                    byGene: {},
                    allGenes: [],
                } as any) as CoverageInformationForCase,
            },
            selectedGene: ({
                entrezGeneId: 1234,
                hugoGeneSymbol: 'geneA',
            } as any) as Gene,
            mutations: {
                molecularProfileIds: [],
                data: [
                    {
                        entrezGeneId: 1234,
                        uniqueSampleKey: 'sample1',
                        oncoKbOncogenic: 'MutationA',
                        mutationType: 'missense_mutation',
                    },
                    {
                        entrezGeneId: 1234,
                        uniqueSampleKey: 'sample1',
                        oncoKbOncogenic: 'MutationB',
                        mutationType: 'missense_mutation',
                    },
                    {
                        entrezGeneId: 5678,
                        uniqueSampleKey: 'sample2',
                        oncoKbOncogenic: 'MutationC',
                        mutationType: 'missense_mutation',
                    },
                    {
                        entrezGeneId: 5678,
                        uniqueSampleKey: 'sample2',
                        oncoKbOncogenic: 'MutationD',
                        mutationType: 'missense_mutation',
                    },
                ] as AnnotatedMutation[],
            },
            copyNumberAlterations: {
                molecularProfileIds: [],
                data: [
                    {
                        entrezGeneId: 1234,
                        uniqueSampleKey: 'sample1',
                        oncoKbOncogenic: 'DuplicationA',
                        value: 1,
                    },
                    {
                        entrezGeneId: 1234,
                        uniqueSampleKey: 'sample1',
                        oncoKbOncogenic: 'DuplicationB',
                        value: 2,
                    },
                    {
                        entrezGeneId: 5678,
                        uniqueSampleKey: 'sample2',
                        oncoKbOncogenic: 'DuplicationC',
                        value: 3,
                    },
                    {
                        entrezGeneId: 5678,
                        uniqueSampleKey: 'sample2',
                        oncoKbOncogenic: 'DuplicationD',
                        value: 4,
                    },
                ] as AnnotatedNumericGeneMolecularData[],
            },
        };

        it('does not create data for NaN values', () => {
            const i = {
                ...mockParams,
                axisData: {
                    datatype: 'number',
                    data: [
                        { uniqueSampleKey: 'sample1', value: NaN },
                        { uniqueSampleKey: 'sample2', value: NaN },
                        { uniqueSampleKey: 'sample3', value: 3 },
                    ],
                },
            };

            const data = makeWaterfallPlotData(
                i.axisData,
                i.uniqueSampleKeyToSample,
                i.coverageInformation,
                i.selectedGene,
                undefined,
                undefined
            );
            assert.equal(data.length, 1, 'only one datum - others have NaN');
            const datum: any = data[0];
            const target: any = {
                uniqueSampleKey: 'sample3',
                sampleId: 'sample3',
                studyId: 'study',
                value: 3,
            };
            for (const key of [
                'uniqueSampleKey',
                'sampleId',
                'studyId',
                'x',
                'y',
            ]) {
                assert.equal(target[key], datum[key], key);
            }
        });

        it('should return most severe CNA of user-selected gene', () => {
            const i = {
                ...mockParams,
                mutations: undefined,
            };

            const data = makeWaterfallPlotData(
                i.axisData,
                i.uniqueSampleKeyToSample,
                i.coverageInformation,
                i.selectedGene,
                i.mutations,
                i.copyNumberAlterations
            );
            assert.equal(data.length, 1);
            assert.equal(data[0].dispCna!.oncoKbOncogenic, 'DuplicationB');
        });

        it("should return no CNA when user-selected gene has no CNA's", () => {
            const i = {
                ...mockParams,
                axisData: {
                    datatype: 'number',
                    data: [{ uniqueSampleKey: 'sample2', value: 1 }],
                },
                mutations: undefined,
            };

            const data = makeWaterfallPlotData(
                i.axisData,
                i.uniqueSampleKeyToSample,
                i.coverageInformation,
                i.selectedGene,
                i.mutations,
                i.copyNumberAlterations
            );
            assert.equal(data.length, 1);
            assert.isUndefined(data[0].dispCna);
        });

        it('should return most severe mutation of user-selected gene', () => {
            const i = {
                ...mockParams,
                copyNumberAlterations: undefined,
            };

            const data = makeWaterfallPlotData(
                i.axisData,
                i.uniqueSampleKeyToSample,
                i.coverageInformation,
                i.selectedGene,
                i.mutations,
                i.copyNumberAlterations
            );
            assert.equal(data.length, 1);
            assert.equal(data[0].dispMutationType!, 'missense');
        });

        it("should return no mutation when user-selected gene has no mutations's", () => {
            const i = {
                ...mockParams,
                axisData: {
                    datatype: 'number',
                    data: [{ uniqueSampleKey: 'sample2', value: 1 }],
                },
                copyNumberAlterations: undefined,
            };

            const data = makeWaterfallPlotData(
                i.axisData,
                i.uniqueSampleKeyToSample,
                i.coverageInformation,
                i.selectedGene,
                i.mutations,
                i.copyNumberAlterations
            );
            assert.equal(data.length, 1);
            assert.isUndefined(data[0].dispMutationType);
        });
    });

    describe('getMutationProfileDuplicateSamplesReport', () => {
        let horzAxisDataWithDuplicates: any;
        let vertAxisDataWithDuplicates: any;
        let horzAxisData: any;
        let vertAxisData: any;

        beforeAll(() => {
            horzAxisData = {
                data: [
                    { uniqueSampleKey: 'sample1', value: [0] },
                    { uniqueSampleKey: 'sample2', value: [1] },
                    { uniqueSampleKey: 'sample3', value: [3] },
                ],
            };
            vertAxisData = {
                data: [
                    { uniqueSampleKey: 'sample1', value: [0] },
                    { uniqueSampleKey: 'sample2', value: [3] },
                    { uniqueSampleKey: 'sample3', value: [1] },
                ],
            };
            horzAxisDataWithDuplicates = {
                data: [
                    { uniqueSampleKey: 'sample1', value: [0, 1] },
                    { uniqueSampleKey: 'sample2', value: [1] },
                    { uniqueSampleKey: 'sample3', value: [1, 2, 3] },
                ],
            };
            vertAxisDataWithDuplicates = {
                data: [
                    { uniqueSampleKey: 'sample1', value: [0] },
                    { uniqueSampleKey: 'sample2', value: [1, 2, 3, 4] },
                    { uniqueSampleKey: 'sample3', value: [1, 2] },
                ],
            };
        });

        it('gives the correct result with zero mutation profiles', () => {
            assert.deepEqual(
                getMutationProfileDuplicateSamplesReport(
                    horzAxisData,
                    vertAxisData,
                    { dataType: CLIN_ATTR_DATA_TYPE },
                    { dataType: AlterationTypeConstants.COPY_NUMBER_ALTERATION }
                ),
                { showMessage: false, numSamples: 0, numSurplusPoints: 0 }
            );

            assert.deepEqual(
                getMutationProfileDuplicateSamplesReport(
                    horzAxisDataWithDuplicates,
                    vertAxisDataWithDuplicates,
                    { dataType: CLIN_ATTR_DATA_TYPE },
                    { dataType: AlterationTypeConstants.COPY_NUMBER_ALTERATION }
                ),
                { showMessage: false, numSamples: 0, numSurplusPoints: 0 }
            );
        });
        it('gives the correct result with one mutation profile', () => {
            assert.deepEqual(
                getMutationProfileDuplicateSamplesReport(
                    horzAxisData,
                    vertAxisData,
                    { dataType: CLIN_ATTR_DATA_TYPE },
                    { dataType: AlterationTypeConstants.MUTATION_EXTENDED }
                ),
                { showMessage: false, numSamples: 0, numSurplusPoints: 0 }
            );

            assert.deepEqual(
                getMutationProfileDuplicateSamplesReport(
                    horzAxisDataWithDuplicates,
                    vertAxisDataWithDuplicates,
                    { dataType: CLIN_ATTR_DATA_TYPE },
                    { dataType: AlterationTypeConstants.MUTATION_EXTENDED }
                ),
                { showMessage: true, numSamples: 2, numSurplusPoints: 4 }
            );
        });
        it('gives the correct result with two mutation profiles', () => {
            assert.deepEqual(
                getMutationProfileDuplicateSamplesReport(
                    horzAxisData,
                    vertAxisData,
                    { dataType: AlterationTypeConstants.MUTATION_EXTENDED },
                    { dataType: AlterationTypeConstants.MUTATION_EXTENDED }
                ),
                { showMessage: false, numSamples: 0, numSurplusPoints: 0 }
            );

            assert.deepEqual(
                getMutationProfileDuplicateSamplesReport(
                    horzAxisDataWithDuplicates,
                    vertAxisData,
                    { dataType: AlterationTypeConstants.MUTATION_EXTENDED },
                    { dataType: AlterationTypeConstants.MUTATION_EXTENDED }
                ),
                { showMessage: true, numSamples: 2, numSurplusPoints: 3 }
            );

            assert.deepEqual(
                getMutationProfileDuplicateSamplesReport(
                    horzAxisDataWithDuplicates,
                    vertAxisDataWithDuplicates,
                    { dataType: AlterationTypeConstants.MUTATION_EXTENDED },
                    { dataType: AlterationTypeConstants.MUTATION_EXTENDED }
                ),
                { showMessage: true, numSamples: 3, numSurplusPoints: 9 }
            );
        });
    });

    describe('makeAxisDataPromise_Molecular_MakeMutationData', () => {
        let mutations: Pick<
            AnnotatedMutation,
            | 'uniqueSampleKey'
            | 'proteinChange'
            | 'mutationType'
            | 'putativeDriver'
            | 'tumorAltCount'
            | 'tumorRefCount'
        >[];
        let coverageInformation: CoverageInformation;
        let samples: Pick<Sample, 'uniqueSampleKey'>[];
        let molecularProfileId: string;

        beforeAll(() => {
            molecularProfileId = 'mutations';
            mutations = [
                {
                    uniqueSampleKey: 'sample1',
                    proteinChange: '',
                    mutationType: 'missense',
                    putativeDriver: true,
                    tumorAltCount: 12,
                    tumorRefCount: 88,
                },
                {
                    uniqueSampleKey: 'sample1',
                    proteinChange: '',
                    mutationType: 'missense',
                    putativeDriver: true,
                    tumorAltCount: 10,
                    tumorRefCount: 90,
                },
                {
                    uniqueSampleKey: 'sample2',
                    proteinChange: '',
                    mutationType: 'in_frame_del',
                    putativeDriver: false,
                    tumorAltCount: 5,
                    tumorRefCount: 95,
                },
                {
                    uniqueSampleKey: 'sample2',
                    proteinChange: '',
                    mutationType: 'nonsense',
                    putativeDriver: true,
                    tumorAltCount: 8,
                    tumorRefCount: 92,
                },
                {
                    uniqueSampleKey: 'sample3',
                    proteinChange: '',
                    mutationType: 'missense',
                    putativeDriver: false,
                    tumorAltCount: 15,
                    tumorRefCount: 85,
                },
            ];
            coverageInformation = {
                samples: {
                    sample1: {
                        byGene: { BRCA1: [{ molecularProfileId } as any] },
                        allGenes: [],
                        notProfiledByGene: {},
                        notProfiledAllGenes: [],
                    },
                    sample2: {
                        byGene: {},
                        allGenes: [{ molecularProfileId } as any],
                        notProfiledByGene: {},
                        notProfiledAllGenes: [],
                    },
                    sample3: {
                        byGene: { BRCA1: [{ molecularProfileId } as any] },
                        allGenes: [],
                        notProfiledByGene: {},
                        notProfiledAllGenes: [],
                    },
                    sample4: {
                        byGene: {},
                        allGenes: [{ molecularProfileId } as any],
                        notProfiledByGene: {},
                        notProfiledAllGenes: [],
                    },
                    sample5: {
                        byGene: {},
                        allGenes: [],
                        notProfiledByGene: {
                            BRCA1: [{ molecularProfileId } as any],
                        },
                        notProfiledAllGenes: [],
                    },
                    sample6: {
                        byGene: {},
                        allGenes: [],
                        notProfiledByGene: {},
                        notProfiledAllGenes: [{ molecularProfileId } as any],
                    },
                },
                patients: {},
            };
            samples = [
                { uniqueSampleKey: 'sample1' },
                { uniqueSampleKey: 'sample2' },
                { uniqueSampleKey: 'sample3' },
                { uniqueSampleKey: 'sample4' },
                { uniqueSampleKey: 'sample5' },
                { uniqueSampleKey: 'sample6' },
            ];
        });

        it('gives the correct result with no mutations', () => {
            assert.deepEqual(
                makeAxisDataPromise_Molecular_MakeMutationData(
                    [molecularProfileId],
                    'BRCA1',
                    [],
                    {} as any,
                    MutationCountBy.MutationType,
                    []
                ),
                {
                    data: [],
                    hugoGeneSymbol: 'BRCA1',
                    datatype: 'string',
                    categoryOrder: mutTypeCategoryOrder,
                }
            );
        });
        it('gives the correct result for mutated vs wild type data', () => {
            assert.deepEqual(
                makeAxisDataPromise_Molecular_MakeMutationData(
                    [molecularProfileId],
                    'BRCA1',
                    mutations,
                    coverageInformation,
                    MutationCountBy.MutatedVsWildType,
                    samples
                ),
                {
                    data: [
                        {
                            uniqueSampleKey: 'sample1',
                            value: MUT_PROFILE_COUNT_MUTATED,
                        },
                        {
                            uniqueSampleKey: 'sample2',
                            value: MUT_PROFILE_COUNT_MUTATED,
                        },
                        {
                            uniqueSampleKey: 'sample3',
                            value: MUT_PROFILE_COUNT_MUTATED,
                        },
                        {
                            uniqueSampleKey: 'sample4',
                            value: MUT_PROFILE_COUNT_NOT_MUTATED,
                        },
                        {
                            uniqueSampleKey: 'sample5',
                            value: MUT_PROFILE_COUNT_NOT_PROFILED,
                        },
                        {
                            uniqueSampleKey: 'sample6',
                            value: MUT_PROFILE_COUNT_NOT_PROFILED,
                        },
                    ],
                    hugoGeneSymbol: 'BRCA1',
                    datatype: 'string',
                    categoryOrder: mutVsWildCategoryOrder,
                }
            );
        });
        it('gives the correct result for driver vs vus data', () => {
            assert.deepEqual(
                makeAxisDataPromise_Molecular_MakeMutationData(
                    [molecularProfileId],
                    'BRCA1',
                    mutations,
                    coverageInformation,
                    MutationCountBy.DriverVsVUS,
                    samples
                ),
                {
                    data: [
                        {
                            uniqueSampleKey: 'sample1',
                            value: MUT_PROFILE_COUNT_DRIVER,
                        },
                        {
                            uniqueSampleKey: 'sample2',
                            value: MUT_PROFILE_COUNT_DRIVER,
                        },
                        {
                            uniqueSampleKey: 'sample3',
                            value: MUT_PROFILE_COUNT_VUS,
                        },
                        {
                            uniqueSampleKey: 'sample4',
                            value: MUT_PROFILE_COUNT_NOT_MUTATED,
                        },
                        {
                            uniqueSampleKey: 'sample5',
                            value: MUT_PROFILE_COUNT_NOT_PROFILED,
                        },
                        {
                            uniqueSampleKey: 'sample6',
                            value: MUT_PROFILE_COUNT_NOT_PROFILED,
                        },
                    ],
                    hugoGeneSymbol: 'BRCA1',
                    datatype: 'string',
                    categoryOrder: mutDriverVsVUSCategoryOrder,
                }
            );
        });
        it('gives the correct result for variant allele frequency', () => {
            assert.deepEqual(
                makeAxisDataPromise_Molecular_MakeMutationData(
                    [molecularProfileId],
                    'BRCA1',
                    mutations,
                    coverageInformation,
                    MutationCountBy.VariantAlleleFrequency,
                    samples
                ),
                {
                    data: [
                        {
                            uniqueSampleKey: 'sample1',
                            value: [
                                12 / (12 + 88), // 0.12
                                10 / (10 + 90), // 0.10
                            ],
                        },
                        {
                            uniqueSampleKey: 'sample2',
                            value: [
                                5 / (5 + 95), // 0.05
                                8 / (8 + 92), // 0.08
                            ],
                        },
                        {
                            uniqueSampleKey: 'sample3',
                            value: [15 / (15 + 85)], // 0.15
                        },
                    ],
                    hugoGeneSymbol: 'BRCA1',
                    datatype: 'number',
                }
            );
        });
        it('gives the correct result for mutation type data', () => {
            assert.deepEqual(
                makeAxisDataPromise_Molecular_MakeMutationData(
                    [molecularProfileId],
                    'BRCA1',
                    mutations,
                    coverageInformation,
                    MutationCountBy.MutationType,
                    samples
                ),
                {
                    data: [
                        {
                            uniqueSampleKey: 'sample1',
                            value: [mutationTypeToDisplayName.missense],
                        },
                        {
                            uniqueSampleKey: 'sample2',
                            value: MUT_PROFILE_COUNT_MULTIPLE,
                        },
                        {
                            uniqueSampleKey: 'sample3',
                            value: [mutationTypeToDisplayName.missense],
                        },
                        {
                            uniqueSampleKey: 'sample4',
                            value: MUT_PROFILE_COUNT_NOT_MUTATED,
                        },
                        {
                            uniqueSampleKey: 'sample5',
                            value: MUT_PROFILE_COUNT_NOT_PROFILED,
                        },
                        {
                            uniqueSampleKey: 'sample6',
                            value: MUT_PROFILE_COUNT_NOT_PROFILED,
                        },
                    ],
                    hugoGeneSymbol: 'BRCA1',
                    datatype: 'string',
                    categoryOrder: mutTypeCategoryOrder,
                }
            );
        });
    });

    describe('makeAxisLogScaleFunction', () => {
        it('should return log2(val+1)-transformation function for non treatment data', () => {
            const axisMenuSelection = ({
                dataType: AlterationTypeConstants.MRNA_EXPRESSION,
                logScale: true,
            } as any) as AxisMenuSelection;
            const funcs = makeAxisLogScaleFunction(axisMenuSelection);
            assert.equal(funcs!.fLogScale(2), Math.log2(3));
            assert.equal(funcs!.fInvLogScale(1), 1);
            assert.equal(funcs!.fLogScale(8), Math.log2(9));
            assert.equal(funcs!.fInvLogScale(3), 7);
        });

        it('should return log10-transformation function for treatment data', () => {
            const axisMenuSelection = ({
                dataType: GenericAssayTypeConstants.TREATMENT_RESPONSE,
                logScale: true,
                genericAssayDataType: DataTypeConstants.LIMITVALUE,
            } as any) as AxisMenuSelection;
            const funcs = makeAxisLogScaleFunction(axisMenuSelection);
            assert.equal(funcs!.fLogScale(10), 1);
            assert.equal(funcs!.fInvLogScale(1), 10);
            assert.equal(funcs!.fLogScale(100), 2);
            assert.equal(funcs!.fInvLogScale(2), 100);
        });

        it('should apply offset before log10-transformation for treatment data', () => {
            const axisMenuSelection = ({
                dataType: GenericAssayTypeConstants.TREATMENT_RESPONSE,
                logScale: true,
                genericAssayDataType: DataTypeConstants.LIMITVALUE,
            } as any) as AxisMenuSelection;
            const funcs = makeAxisLogScaleFunction(axisMenuSelection);
            assert.equal(funcs!.fLogScale(0, 10), 1);
            assert.equal(funcs!.fLogScale(90, 10), 2);
            assert.equal(funcs!.fInvLogScale(11, 10), 10);
        });
    });

    describe('logScalePossible', () => {
        it('should return true when positive data is type number', () => {
            const axisData = ({
                datatype: 'number',
                data: [{ value: 1 }, { value: 2 }],
            } as any) as IAxisData;
            const axisMenuSelection = ({
                dataType: CLIN_ATTR_DATA_TYPE,
                genericAssayDataType: DataTypeConstants.LIMITVALUE,
            } as any) as AxisMenuSelection;
            assert.isTrue(logScalePossible(axisMenuSelection, axisData));
        });
        it('should return false when negative data is type number', () => {
            const axisData = ({
                datatype: 'number',
                data: [{ value: 1 }, { value: -2 }],
            } as any) as IAxisData;
            const axisMenuSelection = ({
                dataType: CLIN_ATTR_DATA_TYPE,
                genericAssayDataType: DataTypeConstants.LIMITVALUE,
            } as any) as AxisMenuSelection;
            assert.isFalse(logScalePossible(axisMenuSelection, axisData));
        });
    });

    describe('axisHasNegativeNumbers', () => {
        it('should return false when data is not numerical', () => {
            const axisData = ({
                datatype: 'string',
                data: [{ value: 'category2' }, { value: 'category1' }],
            } as any) as IAxisData;
            assert.isFalse(axisHasNegativeNumbers(axisData));
        });

        it('should return false when data consists of positive numbers', () => {
            const axisData = ({
                datatype: 'number',
                data: [{ value: 1 }, { value: 2 }],
            } as any) as IAxisData;
            assert.isFalse(axisHasNegativeNumbers(axisData));
        });

        it('should return true when data has negative numbers', () => {
            const axisData = ({
                datatype: 'number',
                data: [{ value: 1 }, { value: -2 }],
            } as any) as IAxisData;
            assert.isTrue(axisHasNegativeNumbers(axisData));
        });

        it('should return false when no data points are passed', () => {
            const axisData = ({
                datatype: 'number',
                data: [],
            } as any) as IAxisData;
            assert.isFalse(axisHasNegativeNumbers(axisData));
        });
    });

    describe('getWaterfallPlotDownloadData', () => {
        const mockProps = {
            data: ([
                {
                    sampleId: 'sample1',
                    value: 1,
                    mutations: ([
                        { entrezGeneId: '1234', proteinChange: 'changeA' },
                        { entrezGeneId: '1234', proteinChange: 'changeB' },
                    ] as any) as AnnotatedMutation,
                },
                {
                    sampleId: 'sample2',
                    value: 2,
                    mutations: ([
                        { entrezGeneId: '1234', proteinChange: 'changeC' },
                        { entrezGeneId: '1234', proteinChange: 'changeD' },
                    ] as any) as AnnotatedMutation,
                },
            ] as any) as IWaterfallPlotData[],
            sortOrder: 'ASC',
            pivotThreshold: 0.1,
            axisLabel: 'profile1',
            entrezGeneIdToGene: {
                1234: ({
                    entrezGeneId: '1234',
                    hugoGeneSymbol: 'GeneA',
                } as any) as Gene,
            },
        };

        const text = getWaterfallPlotDownloadData(
            mockProps.data,
            mockProps.sortOrder,
            mockProps.pivotThreshold,
            mockProps.axisLabel,
            mockProps.entrezGeneIdToGene,
            true
        );

        const elements = _.map(text.split('\n'), d => d.split('\t'));

        it('should sort data points in ascending order', () => {
            assert.equal(elements.length, 3);
            assert.equal(elements[1][0], 'sample1');
            assert.equal(elements[2][0], 'sample2');
        });

        it('should sort data points in descending order', () => {
            const i = {
                ...mockProps,
                sortOrder: 'DESC',
            };

            const myText = getWaterfallPlotDownloadData(
                i.data,
                i.sortOrder,
                i.pivotThreshold,
                i.axisLabel,
                i.entrezGeneIdToGene
            );

            const myElements = _.map(myText.split('\n'), d => d.split('\t'));

            assert.equal(myElements.length, 3);
            assert.equal(myElements[1][0], 'sample2');
            assert.equal(myElements[2][0], 'sample1');
        });

        it('should add mutation summary when mutations are known for sample', () => {
            assert.equal(elements[0].length, 5);
            assert.equal(elements[1][4], 'GeneA: changeA, changeB');
            assert.equal(elements[2][4], 'GeneA: changeC, changeD');
        });
    });

    describe('limitValueTypes', () => {
        it('returns unique list of concatenated thresholdTypes and values', () => {
            const data = [
                { uniqueSampleKey: 'A', value: 5, thresholdType: undefined },
                { uniqueSampleKey: 'B', value: 6, thresholdType: '' },
                { uniqueSampleKey: 'C', value: 7, thresholdType: '>' },
                { uniqueSampleKey: 'D', value: 8, thresholdType: '>' },
            ];
            const types = getLimitValues(data);
            assert.deepEqual(types, ['>7.00', '>8.00']);
        });

        it('returns empty array when multiple values in dattum', () => {
            const data = [
                { uniqueSampleKey: 'A', value: [5, 5], thresholdType: '>' },
            ];
            const types = getLimitValues(data);
            assert.deepEqual(types, []);
        });
    });
});
