import { assert } from 'chai';
import * as React from 'react';
import {
    ALTERATION_FILTER_DEFAULTS,
    annotationFilterActive,
    calcIntervalBinValues,
    calculateLayout,
    calculateNewLayoutForFocusedChart,
    ChartMeta,
    chartMetaComparator,
    ChartMetaDataTypeEnum,
    clinicalDataCountComparator,
    customBinsAreValid,
    DataBin,
    driverTierFilterActive,
    filterCategoryBins,
    filterIntervalBins,
    filterNumericalBins,
    findSpot,
    formatFrequency,
    formatNumericalTickValues,
    formatRange,
    ensureBackwardCompatibilityOfFilters,
    GENE_FILTER_QUERY_DEFAULTS,
    geneFilterQueryFromOql,
    geneFilterQueryToOql,
    generateCategoricalData,
    generateMatrixByLayout,
    generateNumericalData,
    getBinName,
    getClinicalDataCountWithColorByCategoryCounts,
    getClinicalDataCountWithColorByClinicalDataCount,
    getClinicalEqualityFilterValuesByString,
    getCNAByAlteration,
    getDataIntervalFilterValues,
    getDefaultChartTypeByClinicalAttribute,
    getExponent,
    getFilteredMolecularProfilesByAlterationType,
    getFilteredSampleIdentifiers,
    getFilteredStudiesWithSamples,
    getFrequencyStr,
    getGroupedClinicalDataByBins,
    getNonZeroUniqueBins,
    getPatientIdentifiers,
    getPositionXByUniqueKey,
    getPositionYByUniqueKey,
    getPriorityByClinicalAttribute,
    getQValue,
    getRequestedAwaitPromisesForClinicalData,
    getSamplesByExcludingFiltersOnChart,
    getStudyViewTabId,
    getVirtualStudyDescription,
    intervalFiltersDisplayValue,
    isDataBinSelected,
    isEveryBinDistinct,
    isFocusedChartShrunk,
    isLogScaleByDataBins,
    isLogScaleByValues,
    isOccupied,
    makePatientToClinicalAnalysisGroup,
    needAdditionShiftForLogScaleBarChart,
    pickClinicalDataColors,
    shouldShowChart,
    showOriginStudiesInSummaryDescription,
    statusFilterActive,
    StudyViewFilterWithSampleIdentifierFilters,
    toFixedDigit,
    transformSampleDataToSelectedSampleClinicalData,
    updateCustomIntervalFilter,
    updateGeneQuery,
    updateSavedUserPreferenceChartIds,
    groupSamplesByMutationStatus,
} from 'pages/studyView/StudyViewUtils';
import {
    CancerStudy,
    ClinicalAttribute,
    ClinicalData,
    DataFilterValue,
    Sample,
    StudyViewFilter,
} from 'cbioportal-ts-api-client';
import { StudyViewPageTabKeyEnum } from 'pages/studyView/StudyViewPageTabs';
import { SpecialChartsUniqueKeyEnum } from './StudyViewUtils';
import { Layout } from 'react-grid-layout';
import sinon, { spy } from 'sinon';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import { ChartDimension, ChartTypeEnum } from './StudyViewConfig';
import {
    CLI_NO_COLOR,
    CLI_YES_COLOR,
    DEFAULT_NA_COLOR,
    RESERVED_CLINICAL_VALUE_COLORS,
} from 'shared/lib/Colors';
import {
    ChartUserSetting,
    CustomChartIdentifierWithValue,
    VirtualStudy,
} from 'shared/api/session-service/sessionServiceModels';
import {
    MobxPromise,
    remoteData,
    toPromise,
} from 'cbioportal-frontend-commons';
import { autorun, observable, runInAction } from 'mobx';

import { AlterationTypeConstants, DataTypeConstants } from 'shared/constants';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import {
    oqlQueryToStructVarGenePair,
    updateStructuralVariantQuery,
} from 'pages/studyView/StructVarUtils';
import {
    STRUCTVARAnyGeneStr,
    STRUCTVARNullGeneStr,
    STUCTVARDownstreamFusionStr,
    STUCTVARUpstreamFusionStr,
} from 'shared/lib/oql/oqlfilter';

describe('StudyViewUtils', () => {
    const emptyStudyViewFilter: StudyViewFilter = {
        clinicalDataFilters: [],
        geneFilters: [],
    } as any;

    describe('updateGeneQuery', () => {
        it('when gene selected in table', () => {
            assert.deepEqual(
                updateGeneQuery([{ gene: 'TP53', alterations: false }], 'TTN'),
                [
                    {
                        gene: 'TP53',
                        alterations: false,
                    },
                    { gene: 'TTN', alterations: false },
                ]
            );
            assert.deepEqual(
                updateGeneQuery(
                    [
                        { gene: 'TP53', alterations: false },
                        {
                            gene: 'TTN',
                            alterations: false,
                        },
                    ],
                    'ALK'
                ),
                [
                    { gene: 'TP53', alterations: false },
                    { gene: 'TTN', alterations: false },
                    {
                        gene: 'ALK',
                        alterations: false,
                    },
                ]
            );
        });
        it('when gene unselected in table', () => {
            assert.deepEqual(
                updateGeneQuery([{ gene: 'TP53', alterations: false }], 'TP53'),
                []
            );
            assert.deepEqual(
                updateGeneQuery(
                    [
                        { gene: 'TP53', alterations: false },
                        {
                            gene: 'TTN',
                            alterations: false,
                        },
                    ],
                    'TP53'
                ),
                [{ gene: 'TTN', alterations: false }]
            );
            assert.deepEqual(
                updateGeneQuery(
                    [
                        { gene: 'TP53', alterations: false },
                        {
                            gene: 'TTN',
                            alterations: false,
                        },
                    ],
                    'ALK'
                ),
                [
                    { gene: 'TP53', alterations: false },
                    { gene: 'TTN', alterations: false },
                    {
                        gene: 'ALK',
                        alterations: false,
                    },
                ]
            );
        });
    });

    describe('updateStructuralVariantQuery', () => {
        it.each([
            [
                [
                    {
                        gene: 'A',
                        alterations: [
                            {
                                alteration_type: STUCTVARDownstreamFusionStr,
                                gene: 'B',
                            },
                        ],
                    },
                ] as SingleGeneQuery[],
                'A',
                'B',
                [] as SingleGeneQuery[],
            ],
            [
                [
                    {
                        gene: 'B',
                        alterations: [
                            {
                                alteration_type: STUCTVARUpstreamFusionStr,
                                gene: 'A',
                            },
                        ],
                    },
                ] as SingleGeneQuery[],
                'A',
                'B',
                [] as SingleGeneQuery[],
            ],
            [
                [] as SingleGeneQuery[],
                'A',
                'B',
                [
                    {
                        gene: 'A',
                        alterations: [
                            {
                                alteration_type: STUCTVARDownstreamFusionStr,
                                gene: 'B',
                                modifiers: [],
                            },
                        ],
                    },
                ] as SingleGeneQuery[],
            ],
            [
                [{ gene: 'X' }] as SingleGeneQuery[],
                'A',
                'B',
                [
                    { gene: 'X' },
                    {
                        gene: 'A',
                        alterations: [
                            {
                                alteration_type: STUCTVARDownstreamFusionStr,
                                gene: 'B',
                                modifiers: [],
                            },
                        ],
                    },
                ] as SingleGeneQuery[],
            ],
        ])(
            'updates queries',
            (input, selectedGene1, selectedGene2, expected) => {
                assert.deepEqual(
                    updateStructuralVariantQuery(
                        input,
                        selectedGene1,
                        selectedGene2
                    ),
                    expected
                );
            }
        );
    });

    describe('getVirtualStudyDescription', () => {
        let studies = [
            {
                name: 'Study 1',
                studyId: 'study1',
                uniqueSampleKeys: ['1', '2'],
            },
            {
                name: 'Study 2',
                studyId: 'study2',
                uniqueSampleKeys: ['3', '4'],
            },
        ];

        it('when all samples are selected', () => {
            assert.isTrue(
                getVirtualStudyDescription(
                    '',
                    studies as any,
                    {} as any,
                    {} as any,
                    {} as any,
                    {} as any
                ).startsWith(
                    '4 samples from 2 studies:\n- Study 1 (2 samples)\n- Study 2 (2 samples)'
                )
            );
        });
        it('when filters are applied', () => {
            let filter = ({
                clinicalDataFilters: [
                    {
                        attributeId: 'attribute1',
                        values: [
                            {
                                value: 'value1',
                            },
                        ],
                    },
                    {
                        attributeId: 'attribute2',
                        values: [
                            {
                                end: 0,
                                start: 10,
                                value: `10`,
                            },
                        ],
                    },
                ],
                sampleTreatmentFilters: { filters: [] },
                patientTreatmentFilters: { filters: [] },
                genomicDataFilters: [],
                geneFilters: [
                    {
                        geneQueries: [[geneFilterQueryFromOql('GENE1')]],
                        molecularProfileIds: ['cancer_study_sequenced'],
                    },
                    {
                        geneQueries: [[geneFilterQueryFromOql('GENE1')]],
                        molecularProfileIds: [
                            'cancer_study_structural_variants',
                        ],
                    },
                    {
                        geneQueries: [[geneFilterQueryFromOql('GENE2:HOMDEL')]],
                        molecularProfileIds: ['cancer_study_cna'],
                    },
                ],
                studyIds: ['study1', 'study2'],
                sampleIdentifiers: [],
                sampleIdentifiersSet: {
                    attribute3: [
                        {
                            sampleId: 'sample 1',
                            studyId: 'study1',
                        },
                        {
                            sampleId: 'sample 1',
                            studyId: 'study2',
                        },
                    ],
                },
                mutationCountVsCNASelection: {
                    xEnd: 0,
                    xStart: 0,
                    yEnd: 0,
                    yStart: 0,
                },
                numberOfSamplesPerPatient: [],
                genomicProfiles: [],
                caseLists: [],
                genericAssayDataFilters: [],
                customDataFilters: [],
            } as unknown) as StudyViewFilterWithSampleIdentifierFilters;
            assert.isTrue(
                getVirtualStudyDescription(
                    '',
                    studies as any,
                    filter,
                    {
                        attribute1: 'attribute1 name',
                        attribute2: 'attribute2 name',
                        attribute3: 'attribute3 name',
                        cancer_study_sequenced: ' Mutated Genes',
                        cancer_study_structural_variants:
                            'Structural Variant Genes',
                        cancer_study_cna: 'CNA Genes',
                    },
                    {} as any,
                    {} as any
                ).startsWith(
                    '4 samples from 2 studies:\n- Study 1 (2 samples)\n- Study 2 (2 samples)' +
                        '\n\nFilters:\n-  Mutated Genes:\n  - GENE1\n- Structural Variant Genes:\n  - GENE1\n- CNA Genes:' +
                        '\n  - GENE2:HOMDEL\n- attribute1 name: value1\n' +
                        '- attribute2 name: 10 < x ≤ 0\n- attribute3 name: 2 samples\n\nCreated on'
                )
            );
        });
        it('when username is not null', () => {
            assert.isTrue(
                getVirtualStudyDescription(
                    '',
                    studies as any,
                    {} as any,
                    {} as any,
                    {} as any,
                    {} as any,
                    'user1'
                ).startsWith(
                    '4 samples from 2 studies:\n- Study 1 (2 samples)\n- Study 2 (2 samples)'
                )
            );
            assert.isTrue(
                getVirtualStudyDescription(
                    '',
                    studies as any,
                    {} as any,
                    {} as any,
                    {} as any,
                    {} as any,
                    'user1'
                ).endsWith('by user1')
            );
        });
        it('when previousDescription is defined', () => {
            let filter = {
                clinicalDataFilters: [
                    {
                        attributeId: 'attribute1',
                        values: [
                            {
                                value: 'value1',
                            },
                        ],
                    },
                ],
            } as any;

            assert.isTrue(
                getVirtualStudyDescription(
                    'test\nCreated on ...',
                    studies as any,
                    filter,
                    {
                        attribute1: 'attribute1 name',
                        attribute2: 'attribute2 name',
                        attribute3: 'attribute3 name',
                    },
                    {} as any,
                    {} as any
                ).startsWith('test\n\nCreated on')
            );
        });
    });

    describe('shouldShowChart', () => {
        const hasInfoFilter = {
            clinicalDataFilters: [
                {
                    attributeId: 'attribute1',
                    values: [
                        {
                            value: 'value1',
                        },
                    ],
                },
            ],
            geneFilters: [],
        } as any;
        it('return true when there is only one sample in the study', () => {
            assert.isTrue(shouldShowChart(emptyStudyViewFilter, 1, 1));
        });
        it('return true when unique number of data bigger than one', () => {
            assert.isTrue(shouldShowChart(emptyStudyViewFilter, 2, 2));
        });
        it('return true when study view is filtered', () => {
            assert.isTrue(shouldShowChart(hasInfoFilter, 1, 2));
        });
        it('return false when study view is not filtered, unique number of data less than 2, and there are more than one sample in the study', () => {
            assert.isFalse(shouldShowChart(emptyStudyViewFilter, 1, 2));
        });
    });

    describe('makePatientToClinicalAnalysisGroup', () => {
        it('returns correct result on empty input', () => {
            assert.deepEqual(makePatientToClinicalAnalysisGroup([], {}), {});
        });
        it('returns correct result with no conflicting samples', () => {
            assert.deepEqual(
                makePatientToClinicalAnalysisGroup(
                    [
                        {
                            uniqueSampleKey: 'sample1.1',
                            uniquePatientKey: 'patient1',
                        },
                        {
                            uniqueSampleKey: 'sample1.2',
                            uniquePatientKey: 'patient1',
                        },
                        {
                            uniqueSampleKey: 'sample2.1',
                            uniquePatientKey: 'patient2',
                        },
                        {
                            uniqueSampleKey: 'sample3.1',
                            uniquePatientKey: 'patient3',
                        },
                        {
                            uniqueSampleKey: 'sample3.2',
                            uniquePatientKey: 'patient3',
                        },
                    ],
                    {
                        'sample1.1': 'a',
                        'sample1.2': 'a',
                        'sample2.1': 'b',
                        'sample3.1': 'c',
                        'sample3.2': 'c',
                    }
                ),
                { patient1: 'a', patient2: 'b', patient3: 'c' }
            );
        });
        it('omits patients with samples in different analysis groups', () => {
            assert.deepEqual(
                makePatientToClinicalAnalysisGroup(
                    [
                        {
                            uniqueSampleKey: 'sample1.1',
                            uniquePatientKey: 'patient1',
                        },
                        {
                            uniqueSampleKey: 'sample1.2',
                            uniquePatientKey: 'patient1',
                        },
                        {
                            uniqueSampleKey: 'sample2.1',
                            uniquePatientKey: 'patient2',
                        },
                        {
                            uniqueSampleKey: 'sample3.1',
                            uniquePatientKey: 'patient3',
                        },
                        {
                            uniqueSampleKey: 'sample3.2',
                            uniquePatientKey: 'patient3',
                        },
                    ],
                    {
                        'sample1.1': 'a',
                        'sample1.2': 'b',
                        'sample2.1': 'b',
                        'sample3.1': 'c',
                        'sample3.2': 'c',
                    }
                ),
                { patient2: 'b', patient3: 'c' }
            );
        });
    });

    describe('processDataBins', () => {
        const linearScaleDataBinsWithNa = [
            {
                attributeId: 'PB_BLAST_PERCENTAGE',
                specialValue: '<=',
                end: 20,
                count: 70,
            },
            {
                attributeId: 'PB_BLAST_PERCENTAGE',
                start: 20,
                end: 40,
                count: 3,
            },
            {
                attributeId: 'PB_BLAST_PERCENTAGE',
                start: 40,
                end: 60,
                count: 5,
            },
            {
                attributeId: 'PB_BLAST_PERCENTAGE',
                start: 60,
                end: 80,
                count: 11,
            },
            {
                attributeId: 'PB_BLAST_PERCENTAGE',
                start: 80,
                end: 100,
                count: 69,
            },
            {
                attributeId: 'PB_BLAST_PERCENTAGE',
                specialValue: 'NA',
                count: 2,
            },
        ] as any;

        const logScaleDataBinsWithNaAndSpecialValues = [
            {
                attributeId: 'DAYS_TO_LAST_FOLLOWUP',
                specialValue: '<=',
                end: 10,
                count: 1,
            },
            {
                attributeId: 'DAYS_TO_LAST_FOLLOWUP',
                start: 10,
                end: 31,
                count: 3,
            },
            {
                attributeId: 'DAYS_TO_LAST_FOLLOWUP',
                start: 31,
                end: 100,
                count: 5,
            },
            {
                attributeId: 'DAYS_TO_LAST_FOLLOWUP',
                start: 100,
                end: 316,
                count: 23,
            },
            {
                attributeId: 'DAYS_TO_LAST_FOLLOWUP',
                start: 316,
                end: 1000,
                count: 67,
            },
            {
                attributeId: 'DAYS_TO_LAST_FOLLOWUP',
                start: 1000,
                end: 3162,
                count: 55,
            },
            {
                attributeId: 'DAYS_TO_LAST_FOLLOWUP',
                start: 3162,
                end: 10000,
                count: 6,
            },
            {
                attributeId: 'DAYS_TO_LAST_FOLLOWUP',
                specialValue: '>',
                start: 10000,
                count: 16,
            },
            {
                attributeId: 'DAYS_TO_LAST_FOLLOWUP',
                specialValue: 'NA',
                count: 66,
            },
            {
                attributeId: 'DAYS_TO_LAST_FOLLOWUP',
                specialValue: 'REDACTED',
                count: 666,
            },
        ] as any;

        const scientificSmallNumberBins = [
            {
                attributeId: 'SILENT_RATE',
                start: 1e-8,
                end: 1e-7,
                count: 1,
            },
            {
                attributeId: 'SILENT_RATE',
                start: 1e-7,
                end: 1e-6,
                count: 16,
            },
            {
                attributeId: 'SILENT_RATE',
                start: 1e-6,
                end: 1e-5,
                count: 32,
            },
            {
                attributeId: 'SILENT_RATE',
                specialValue: '>',
                start: 1e-5,
                count: 1,
            },
        ] as any;

        const noNumericalDataBins = [
            {
                attributeId: 'CANCER_TYPE',
                specialValue: 'BREAST',
                count: 1,
            },
            {
                attributeId: 'CANCER_TYPE',
                specialValue: 'SKIN',
                count: 11,
            },
            {
                attributeId: 'CANCER_TYPE',
                specialValue: 'BRAIN',
                count: 121,
            },
            {
                attributeId: 'CANCER_TYPE',
                specialValue: 'NA',
                count: 66,
            },
            {
                attributeId: 'CANCER_TYPE',
                specialValue: 'REDACTED',
                count: 666,
            },
        ] as any;

        const logScaleDataBinsWithNegativeAndNaAndSpecialValues = [
            {
                attributeId: 'DAYS_TO_BIRTH',
                start: -31622,
                end: -10000,
                count: 78,
            },
            {
                attributeId: 'DAYS_TO_BIRTH',
                start: -10000,
                end: -3162,
                count: 14,
            },
            {
                attributeId: 'DAYS_TO_BIRTH',
                start: -3162,
                end: -1000,
                count: 31,
            },
            {
                attributeId: 'DAYS_TO_BIRTH',
                start: -1000,
                end: -316,
                count: 12,
            },
            {
                attributeId: 'DAYS_TO_BIRTH',
                start: -316,
                end: -100,
                count: 6,
            },
            {
                attributeId: 'DAYS_TO_BIRTH',
                start: -100,
                end: -31,
                count: 2,
            },
            {
                attributeId: 'DAYS_TO_BIRTH',
                start: -31,
                end: -10,
                count: 2,
            },
            {
                attributeId: 'DAYS_TO_BIRTH',
                start: -10,
                end: -1,
                count: 0,
            },
            {
                attributeId: 'DAYS_TO_BIRTH',
                start: -1,
                end: 1,
                count: 0,
            },
            {
                attributeId: 'DAYS_TO_BIRTH',
                start: 1,
                end: 10,
                count: 2,
            },
            {
                attributeId: 'DAYS_TO_BIRTH',
                start: 10,
                end: 31,
                count: 7,
            },
            {
                attributeId: 'DAYS_TO_BIRTH',
                specialValue: 'NA',
                count: 66,
            },
            {
                attributeId: 'DAYS_TO_BIRTH',
                specialValue: 'REDACTED',
                count: 666,
            },
        ] as any;

        const logScaleDataBinsStartingWithZeroAndContainsNa = [
            {
                attributeId: 'DAYS_TO_COLLECTION',
                start: 0,
                end: 3,
                count: 1,
            },
            {
                attributeId: 'DAYS_TO_COLLECTION',
                start: 3,
                end: 10,
                count: 1,
            },
            {
                attributeId: 'DAYS_TO_COLLECTION',
                start: 10,
                end: 31,
                count: 13,
            },
            {
                attributeId: 'DAYS_TO_COLLECTION',
                start: 31,
                end: 100,
                count: 47,
            },
            {
                attributeId: 'DAYS_TO_COLLECTION',
                start: 100,
                end: 316,
                count: 78,
            },
            {
                attributeId: 'DAYS_TO_COLLECTION',
                start: 316,
                end: 1000,
                count: 82,
            },
            {
                attributeId: 'DAYS_TO_COLLECTION',
                start: 1000,
                end: 3162,
                count: 63,
            },
            {
                attributeId: 'DAYS_TO_COLLECTION',
                start: 3162,
                end: 10000,
                count: 22,
            },
            {
                attributeId: 'DAYS_TO_COLLECTION',
                specialValue: 'NA',
                count: 225,
            },
        ] as any;

        const noGroupingDataBinsWithNa = [
            {
                attributeId: 'ACTIONABLE_ALTERATIONS',
                start: 0,
                end: 0,
                count: 16,
            },
            {
                attributeId: 'ACTIONABLE_ALTERATIONS',
                start: 1,
                end: 1,
                count: 6,
            },
            {
                attributeId: 'ACTIONABLE_ALTERATIONS',
                start: 2,
                end: 2,
                count: 4,
            },
            {
                attributeId: 'ACTIONABLE_ALTERATIONS',
                start: 3,
                end: 3,
                count: 1,
            },
            {
                attributeId: 'ACTIONABLE_ALTERATIONS',
                start: 5,
                end: 5,
                count: 1,
            },
            {
                attributeId: 'ACTIONABLE_ALTERATIONS',
                specialValue: 'NA',
                count: 4,
            },
        ] as any;

        it('generates clinical data interval filter values from data bins', () => {
            const values: DataFilterValue[] = getDataIntervalFilterValues([
                linearScaleDataBinsWithNa[0],
                linearScaleDataBinsWithNa[2],
                linearScaleDataBinsWithNa[5],
            ] as any);

            assert.deepEqual(values, [
                { end: 20, start: undefined, value: undefined },
                { start: 40, end: 60, value: undefined },
                { value: 'NA', start: undefined, end: undefined },
            ] as any);
        });

        it('processes linear scaled data bins including NA count', () => {
            const numericalBins = filterNumericalBins(
                linearScaleDataBinsWithNa
            );
            assert.equal(numericalBins.length, 5, 'NA should be filtered out');

            const formattedTickValues = formatNumericalTickValues(
                numericalBins
            );
            assert.deepEqual(formattedTickValues, [
                '≤20',
                '20',
                '40',
                '60',
                '80',
                '100',
            ]);

            const intervalBins = filterIntervalBins(numericalBins);
            assert.equal(
                intervalBins.length,
                4,
                'First bin with the special values (<=) should be filtered out'
            );

            const intervalBinValues = calcIntervalBinValues(intervalBins);
            assert.deepEqual(intervalBinValues, [20, 40, 60, 80, 100]);

            const isLogScale = isLogScaleByValues(intervalBinValues);
            assert.isFalse(isLogScale);

            const categoryBins = filterCategoryBins(linearScaleDataBinsWithNa);
            assert.equal(
                categoryBins.length,
                1,
                'Only the bin with NA special value should be included'
            );

            const needAdditionShift = needAdditionShiftForLogScaleBarChart(
                numericalBins
            );
            assert.isFalse(needAdditionShift);

            const normalizedNumericalData = generateNumericalData(
                numericalBins
            );
            assert.deepEqual(
                normalizedNumericalData.map(data => data.x),
                [1, 2.5, 3.5, 4.5, 5.5]
            );

            const normalizedCategoryData = generateCategoricalData(
                categoryBins,
                6
            );
            assert.deepEqual(
                normalizedCategoryData.map(data => data.x),
                [7]
            );
        });

        it('processes log scaled data bins including NA and REDACTED counts', () => {
            const numericalBins = filterNumericalBins(
                logScaleDataBinsWithNaAndSpecialValues
            );
            assert.equal(
                numericalBins.length,
                8,
                'NA and REDACTED should be filtered out'
            );

            const formattedTickValues = formatNumericalTickValues(
                numericalBins
            );
            assert.deepEqual(formattedTickValues, [
                '≤10',
                '10',
                '',
                '10^2',
                '',
                '10^3',
                '',
                '10^4',
                '>10^4',
            ]);

            const intervalBins = filterIntervalBins(numericalBins);
            assert.equal(
                intervalBins.length,
                6,
                'First and last bins with the special values (<= and >) should be filtered out'
            );

            const intervalBinValues = calcIntervalBinValues(intervalBins);
            assert.deepEqual(intervalBinValues, [
                10,
                31,
                100,
                316,
                1000,
                3162,
                10000,
            ]);

            const isLogScale = isLogScaleByValues(intervalBinValues);
            assert.isTrue(isLogScale);

            const categoryBins = filterCategoryBins(
                logScaleDataBinsWithNaAndSpecialValues
            );
            assert.equal(
                categoryBins.length,
                2,
                'Only the bins with NA and REDACTED special values should be included'
            );

            const needAdditionShift = needAdditionShiftForLogScaleBarChart(
                numericalBins
            );
            assert.isFalse(needAdditionShift);

            const normalizedNumericalData = generateNumericalData(
                numericalBins
            );
            assert.deepEqual(
                normalizedNumericalData.map(data => data.x),
                [1, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 9]
            );

            const normalizedCategoryData = generateCategoricalData(
                categoryBins,
                9
            );
            assert.deepEqual(
                normalizedCategoryData.map(data => data.x),
                [10, 11]
            );
        });

        it('processes log scaled data bins including negative values and NA and REDACTED counts', () => {
            const numericalBins = filterNumericalBins(
                logScaleDataBinsWithNegativeAndNaAndSpecialValues
            );
            assert.equal(
                numericalBins.length,
                11,
                'NA and REDACTED should be filtered out'
            );

            const formattedTickValues = formatNumericalTickValues(
                numericalBins
            );
            assert.deepEqual(formattedTickValues, [
                '-10^5',
                '',
                '-10^4',
                '',
                '-10^3',
                '',
                '-10^2',
                '',
                '-10',
                '-1',
                '1',
                '10',
                '',
                '10^2',
            ]);

            const intervalBins = filterIntervalBins(numericalBins);
            assert.equal(
                intervalBins.length,
                11,
                'Should be same as the number of mumerical bins'
            );

            const intervalBinValues = calcIntervalBinValues(intervalBins);
            assert.deepEqual(intervalBinValues, [
                -31622,
                -10000,
                -3162,
                -1000,
                -316,
                -100,
                -31,
                -10,
                -1,
                1,
                10,
                31,
            ]);

            const isLogScale = isLogScaleByValues(intervalBinValues);
            assert.isTrue(isLogScale);

            const categoryBins = filterCategoryBins(
                logScaleDataBinsWithNegativeAndNaAndSpecialValues
            );
            assert.equal(
                categoryBins.length,
                2,
                'Only the bins with NA and REDACTED special values should be included'
            );

            const needAdditionShift = needAdditionShiftForLogScaleBarChart(
                numericalBins
            );
            assert.isTrue(needAdditionShift);

            const normalizedNumericalData = generateNumericalData(
                numericalBins
            );
            assert.deepEqual(
                normalizedNumericalData.map(data => data.x),
                [2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5]
            );

            const normalizedCategoryData = generateCategoricalData(
                categoryBins,
                13
            );
            assert.deepEqual(
                normalizedCategoryData.map(data => data.x),
                [14, 15]
            );
        });

        it('processes log scaled data bins starting with zero and including NA counts', () => {
            const numericalBins = filterNumericalBins(
                logScaleDataBinsStartingWithZeroAndContainsNa
            );
            assert.equal(numericalBins.length, 8, 'NA should be filtered out');

            const formattedTickValues = formatNumericalTickValues(
                numericalBins
            );
            assert.deepEqual(formattedTickValues, [
                '0',
                '',
                '10',
                '',
                '10^2',
                '',
                '10^3',
                '',
                '10^4',
            ]);

            const intervalBins = filterIntervalBins(numericalBins);
            assert.equal(
                intervalBins.length,
                8,
                'Should be same as the number of mumerical bins'
            );

            const intervalBinValues = calcIntervalBinValues(intervalBins);
            assert.deepEqual(intervalBinValues, [
                0,
                3,
                10,
                31,
                100,
                316,
                1000,
                3162,
                10000,
            ]);

            const isLogScale = isLogScaleByValues(intervalBinValues);
            assert.isTrue(isLogScale);

            const categoryBins = filterCategoryBins(
                logScaleDataBinsStartingWithZeroAndContainsNa
            );
            assert.equal(
                categoryBins.length,
                1,
                'Only NA bin should be included'
            );

            const needAdditionShift = needAdditionShiftForLogScaleBarChart(
                numericalBins
            );
            assert.isFalse(needAdditionShift);

            const normalizedNumericalData = generateNumericalData(
                numericalBins
            );
            assert.deepEqual(
                normalizedNumericalData.map(data => data.x),
                [1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5, 8.5]
            );

            const normalizedCategoryData = generateCategoricalData(
                categoryBins,
                9
            );
            assert.deepEqual(
                normalizedCategoryData.map(data => data.x),
                [10]
            );
        });

        it('processes scientific small numbers data bins', () => {
            const numericalBins = filterNumericalBins(
                scientificSmallNumberBins
            );
            assert.equal(
                numericalBins.length,
                4,
                'all bins should be included'
            );

            const formattedTickValues = formatNumericalTickValues(
                numericalBins
            );
            assert.deepEqual(formattedTickValues, [
                '1e-8',
                '1e-7',
                '1e-6',
                '1e-5',
                '>1e-5',
            ]);

            const intervalBins = filterIntervalBins(numericalBins);
            assert.equal(
                intervalBins.length,
                3,
                'Last bin with the special values (>) should be filtered out'
            );

            const intervalBinValues = calcIntervalBinValues(intervalBins);
            assert.deepEqual(intervalBinValues, [1e-8, 1e-7, 1e-6, 1e-5]);

            const isLogScale = isLogScaleByValues(intervalBinValues);
            assert.isFalse(isLogScale);

            const categoryBins = filterCategoryBins(scientificSmallNumberBins);
            assert.equal(
                categoryBins.length,
                0,
                'There should not be any category bin'
            );

            const needAdditionShift = needAdditionShiftForLogScaleBarChart(
                numericalBins
            );
            assert.isFalse(needAdditionShift);

            const normalizedNumericalData = generateNumericalData(
                numericalBins
            );
            assert.deepEqual(
                normalizedNumericalData.map(data => data.x),
                [1.5, 2.5, 3.5, 5]
            );

            const normalizedCategoryData = generateCategoricalData(
                categoryBins,
                5
            );
            assert.equal(normalizedCategoryData.length, 0);
        });

        it('processes no grouping data bins including NA count', () => {
            const numericalBins = filterNumericalBins(noGroupingDataBinsWithNa);
            assert.equal(numericalBins.length, 5, 'NA should be filtered out');

            const formattedTickValues = formatNumericalTickValues(
                numericalBins
            );
            assert.deepEqual(formattedTickValues, ['0', '1', '2', '3', '5']);

            const intervalBins = filterIntervalBins(numericalBins);
            assert.equal(
                intervalBins.length,
                5,
                'should be equal to number of numerical bins'
            );

            const intervalBinValues = calcIntervalBinValues(intervalBins);
            assert.deepEqual(intervalBinValues, [0, 1, 2, 3, 5]);

            const isLogScale = isLogScaleByValues(intervalBinValues);
            assert.isFalse(isLogScale);

            const categoryBins = filterCategoryBins(noGroupingDataBinsWithNa);
            assert.equal(
                categoryBins.length,
                1,
                'Only the bin with NA special value should be included'
            );

            const normalizedNumericalData = generateNumericalData(
                numericalBins
            );
            assert.deepEqual(
                normalizedNumericalData.map(data => data.x),
                [1, 2, 3, 4, 5]
            );

            const normalizedCategoryData = generateCategoricalData(
                categoryBins,
                5
            );
            assert.deepEqual(
                normalizedCategoryData.map(data => data.x),
                [6]
            );
        });

        it('processes no numerical data bins', () => {
            const numericalBins = filterNumericalBins(noNumericalDataBins);
            assert.equal(
                numericalBins.length,
                0,
                'all bins should be filtered out'
            );

            const formattedTickValues = formatNumericalTickValues(
                numericalBins
            );
            assert.equal(
                formattedTickValues.length,
                0,
                'there should be no numerical tick values'
            );

            const intervalBins = filterIntervalBins(numericalBins);
            assert.equal(
                intervalBins.length,
                0,
                'should be equal to number of numerical bins'
            );

            const intervalBinValues = calcIntervalBinValues(intervalBins);
            assert.equal(
                intervalBinValues.length,
                0,
                'there should be no interval bin values'
            );

            const isLogScale = isLogScaleByValues(intervalBinValues);
            assert.isFalse(isLogScale);

            const categoryBins = filterCategoryBins(noNumericalDataBins);
            assert.equal(categoryBins.length, 5, 'all bins should be included');

            const normalizedNumericalData = generateNumericalData(
                numericalBins
            );
            assert.deepEqual(
                normalizedNumericalData.map(data => data.x),
                []
            );

            const normalizedCategoryData = generateCategoricalData(
                categoryBins,
                0
            );
            assert.deepEqual(
                normalizedCategoryData.map(data => data.x),
                [1, 2, 3, 4, 5]
            );
        });

        it('determines log scale from an array of data bins', () => {
            assert.isFalse(isLogScaleByDataBins(linearScaleDataBinsWithNa));
            assert.isFalse(isLogScaleByDataBins(noGroupingDataBinsWithNa));
            assert.isFalse(isLogScaleByDataBins(noNumericalDataBins));
            assert.isTrue(
                isLogScaleByDataBins(logScaleDataBinsWithNaAndSpecialValues)
            );
            assert.isTrue(
                isLogScaleByDataBins(
                    logScaleDataBinsWithNegativeAndNaAndSpecialValues
                )
            );
        });
    });

    describe('intervalFiltersDisplayValue', () => {
        const filterValuesWithBothEndsClosed = [
            { start: 10, end: 20 },
            { start: 20, end: 30 },
            { start: 30, end: 40 },
            { start: 40, end: 50 },
        ] as DataFilterValue[];

        const filterValuesWithBothEndsClosedAndSpecialValues = [
            ...filterValuesWithBothEndsClosed,
            { value: 'NA' },
            { value: 'REDACTED' },
        ] as DataFilterValue[];

        const filterValuesWithBothEndsOpen = [
            { end: 10 },
            { start: 10, end: 20 },
            { start: 20, end: 30 },
            { start: 30, end: 40 },
            { start: 40, end: 50 },
            { start: 50 },
        ] as DataFilterValue[];

        const filterValuesWithBothEndsOpenAndSpecialValues = [
            ...filterValuesWithBothEndsOpen,
            { value: 'NA' },
            { value: 'REDACTED' },
        ] as DataFilterValue[];

        const filterValuesWithStartOpen = [
            { end: 10 },
            { start: 10, end: 20 },
            { start: 20, end: 30 },
            { start: 30, end: 40 },
            { start: 40, end: 50 },
        ] as DataFilterValue[];

        const filterValuesWithStartOpenAndSpecialValues = [
            ...filterValuesWithStartOpen,
            { value: 'NA' },
            { value: 'REDACTED' },
        ] as DataFilterValue[];

        const filterValuesWithEndOpen = [
            { start: 10, end: 20 },
            { start: 20, end: 30 },
            { start: 30, end: 40 },
            { start: 40, end: 50 },
            { start: 50 },
        ] as DataFilterValue[];

        const filterValuesWithEndOpenAndSpecialValues = [
            ...filterValuesWithEndOpen,
            { value: 'NA' },
            { value: 'REDACTED' },
        ] as DataFilterValue[];

        const filterDiscreteValuesWithEndOpen = [
            { start: 10, end: 10 },
            { start: 20, end: 20 },
            { start: 30, end: 30 },
            { start: 40, end: 40 },
            { start: 50 },
        ] as DataFilterValue[];

        const filterDiscreteValuesWithEndOpenAndSpecialValues = [
            ...filterDiscreteValuesWithEndOpen,
            { value: 'NA' },
            { value: 'REDACTED' },
        ] as DataFilterValue[];

        const filterValuesWithSpecialValuesOnly = [
            { value: 'NA' },
            { value: 'REDACTED' },
        ] as DataFilterValue[];

        const filterValuesWithDistinctNumerals = [
            { start: 20, end: 20 },
            { start: 30, end: 30 },
            { start: 40, end: 40 },
        ] as DataFilterValue[];

        const filterValuesWithDistinctNumeralsAndSpecialValues = [
            ...filterValuesWithDistinctNumerals,
            { value: 'NA' },
            { value: 'REDACTED' },
        ] as DataFilterValue[];

        const filterValuesWithSingleDistinctValue = [
            { start: 666, end: 666 },
        ] as DataFilterValue[];

        const filterValuesWithSingleDistinctValueAndSpecialValues = [
            ...filterValuesWithSingleDistinctValue,
            { value: 'NA' },
            { value: 'REDACTED' },
        ] as DataFilterValue[];

        it('generates display value for filter values with both ends closed', () => {
            const value = intervalFiltersDisplayValue(
                filterValuesWithBothEndsClosed,
                () => {},
                true
            );

            assert.equal(value, '10 < x ≤ 50');
        });

        it('generates display value for filter values with both ends closed, with special values', () => {
            const value = intervalFiltersDisplayValue(
                filterValuesWithBothEndsClosedAndSpecialValues,
                () => {},
                true
            );

            assert.equal(value, '10 < x ≤ 50, NA, REDACTED');
        });

        it('generates display value for filter values with both ends open', () => {
            const value = intervalFiltersDisplayValue(
                filterValuesWithBothEndsOpen,
                () => {},
                true
            );
            assert.equal(value, 'All Numbers');
        });

        it('generates display value for filter values with both ends open, with special values', () => {
            const value = intervalFiltersDisplayValue(
                filterValuesWithBothEndsOpenAndSpecialValues,
                () => {},
                true
            );
            assert.equal(value, 'All Numbers, NA, REDACTED');
        });

        it('generates display value for filter values with start open, end closed', () => {
            const value = intervalFiltersDisplayValue(
                filterValuesWithStartOpen,
                () => {},
                true
            );
            assert.equal(value, '≤ 50');
        });

        it('generates display value for filter values with start open, end closed, with special values', () => {
            const value = intervalFiltersDisplayValue(
                filterValuesWithStartOpenAndSpecialValues,
                () => {},
                true
            );
            assert.equal(value, '≤ 50, NA, REDACTED');
        });

        it('generates display value for filter values with start closed, end open', () => {
            const value = intervalFiltersDisplayValue(
                filterValuesWithEndOpen,
                () => {},
                true
            );
            assert.equal(value, '> 10');
        });

        it('generates display value for filter values with start closed, end open, with special values', () => {
            const value = intervalFiltersDisplayValue(
                filterValuesWithEndOpenAndSpecialValues,
                () => {},
                true
            );
            assert.equal(value, '> 10, NA, REDACTED');
        });

        it('generates display value for filter values with discrete start closed, end open', () => {
            const value = intervalFiltersDisplayValue(
                filterDiscreteValuesWithEndOpen,
                () => {},
                true
            );
            assert.equal(value, '≥ 10');
        });

        it('generates display value for filter values with discrete start closed, end open, with special values', () => {
            const value = intervalFiltersDisplayValue(
                filterDiscreteValuesWithEndOpenAndSpecialValues,
                () => {},
                true
            );
            assert.equal(value, '≥ 10, NA, REDACTED');
        });

        it('generates display value for filter values with special values only', () => {
            const value = intervalFiltersDisplayValue(
                filterValuesWithSpecialValuesOnly,
                () => {},
                true
            );
            assert.equal(value, 'NA, REDACTED');
        });

        it('generates display value for filter values with distinct values only', () => {
            const value = intervalFiltersDisplayValue(
                filterValuesWithDistinctNumerals,
                () => {},
                true
            );
            assert.equal(value, '20 ≤ x ≤ 40');
        });

        it('generates display value for filter values with distinct values and special values', () => {
            const value = intervalFiltersDisplayValue(
                filterValuesWithDistinctNumeralsAndSpecialValues,
                () => {},
                true
            );
            assert.equal(value, '20 ≤ x ≤ 40, NA, REDACTED');
        });

        it('generates display value for filter values with a single distinct value', () => {
            const value = intervalFiltersDisplayValue(
                filterValuesWithSingleDistinctValue,
                () => {},
                true
            );
            assert.equal(value, '666');
        });

        it('generates display value for filter values with a single distinct value and special values', () => {
            const value = intervalFiltersDisplayValue(
                filterValuesWithSingleDistinctValueAndSpecialValues,
                () => {},
                true
            );
            assert.equal(value, '666, NA, REDACTED');
        });
    });

    describe('isEveryBinDistinct', () => {
        const noBinDistinct = [
            { start: 10, end: 20 },
            { start: 20, end: 30 },
            { start: 30, end: 40 },
            { start: 40, end: 50 },
        ] as DataBin[];

        const everyBinDistinct = [
            { start: 0, end: 0 },
            { start: 10, end: 10 },
            { start: 20, end: 20 },
            { start: 30, end: 30 },
        ] as DataBin[];

        const someBinsDistinct = [
            { start: 0, end: 0 },
            { start: 10, end: 10 },
            { start: 20, end: 30 },
            { start: 30, end: 40 },
        ] as DataBin[];

        it('accepts a list of bins with all distinct values', () => {
            assert.isTrue(
                isEveryBinDistinct(everyBinDistinct),
                'should be true when every bin is distinct'
            );
        });

        it('rejects an empty list', () => {
            assert.isFalse(
                isEveryBinDistinct([]),
                'empty list should not be classified as distinct'
            );
        });

        it('rejects a list of bins with no distinct values', () => {
            assert.isFalse(
                isEveryBinDistinct(noBinDistinct),
                'should be false when no bin is distinct'
            );
        });

        it('rejects a list of bins with some distinct values', () => {
            assert.isFalse(
                isEveryBinDistinct(someBinsDistinct),
                'should be false when some bins are distinct'
            );
        });
    });

    describe('isDataBinSelected', () => {
        const categoryFilter = {
            value: 'Unknown',
        } as DataFilterValue;

        const singlePointFilter = {
            start: 14,
            end: 14,
        } as DataFilterValue;

        const startExclusiveEndInclusiveFilter = {
            start: 14,
            end: 15,
        } as DataFilterValue;

        const startExclusiveOpenEndedFilter: DataFilterValue = {
            start: 14,
            value: '>',
        } as DataFilterValue;

        const startInclusiveOpenEndedFilter: DataFilterValue = {
            start: 14,
            value: '>=',
        } as DataFilterValue;

        const endExclusiveOpenStartFilter: DataFilterValue = {
            end: 14,
            value: '<',
        } as DataFilterValue;

        const endInclusiveOpenStartFilter: DataFilterValue = {
            end: 14,
            value: '<=',
        } as DataFilterValue;

        describe('test isDataBinSelected with a single point data bin for all filters', () => {
            it('rejects a single point data bin for any categorical filter', () => {
                const dataBin = {
                    start: 14,
                    end: 14,
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [categoryFilter]),
                    '14 should be rejected by Unknown'
                );
            });

            it('accepts a single point data bin that falls into a single point filter', () => {
                const dataBin = {
                    start: 14,
                    end: 14,
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [singlePointFilter]),
                    '14 should be accepted by 14'
                );
            });

            it('rejects a single point data bin that does not fall into a start inclusive open ended filter', () => {
                const dataBin = {
                    start: 13,
                    end: 13,
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [singlePointFilter]),
                    '13 should be rejected by 14'
                );
            });

            it('accepts a single point data bin that falls into a start exclusive end inclusive filter', () => {
                const dataBin = {
                    start: 15,
                    end: 15,
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [
                        startExclusiveEndInclusiveFilter,
                    ]),
                    '15 should be accepted by (14, 15]'
                );
            });

            it('rejects a single point data bin that does not fall into a start exclusive end inclusive filter', () => {
                const dataBin = {
                    start: 14,
                    end: 14,
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [
                        startExclusiveEndInclusiveFilter,
                    ]),
                    '14 should be rejected by (14, 15]'
                );
            });

            it('accepts a single point data bin that falls into a start exclusive open ended filter', () => {
                const dataBin = {
                    start: 15,
                    end: 15,
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [startExclusiveOpenEndedFilter]),
                    '15 should be accepted by (14, Infinity)'
                );
            });

            it('rejects a single point data bin that does not fall into a start exclusive open ended filter', () => {
                const dataBin = {
                    start: 14,
                    end: 14,
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [startExclusiveOpenEndedFilter]),
                    '14 should be rejected by (14, Infinity)'
                );
            });

            it('accepts a single point data bin that falls into a start inclusive open ended filter', () => {
                const dataBin = {
                    start: 14,
                    end: 14,
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [startInclusiveOpenEndedFilter]),
                    '14 should be accepted by [14, Infinity)'
                );
            });

            it('rejects a single point data bin that does not fall into a start inclusive open ended filter', () => {
                const dataBin = {
                    start: 13,
                    end: 13,
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [startInclusiveOpenEndedFilter]),
                    '13 should be rejected by [14, Infinity)'
                );
            });

            it('accepts a single point data bin that falls into a end exclusive open start filter', () => {
                const dataBin = {
                    start: 13,
                    end: 13,
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [endExclusiveOpenStartFilter]),
                    '13 should be accepted by (-Infinity, 14)'
                );
            });

            it('rejects a single point data bin that does not fall into an end exclusive open start filter', () => {
                const dataBin = {
                    start: 14,
                    end: 14,
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [endExclusiveOpenStartFilter]),
                    '14 should be rejected by (-Infinity, 14)'
                );
            });

            it('accepts a single point data bin that falls into an end inclusive open start filter', () => {
                const dataBin = {
                    start: 14,
                    end: 14,
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [endInclusiveOpenStartFilter]),
                    '14 should be accepted by (-Infinity, 14]'
                );
            });

            it('rejects a single point data bin that does not fall into an end inclusive open start filter', () => {
                const dataBin = {
                    start: 15,
                    end: 15,
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [endInclusiveOpenStartFilter]),
                    '15 should be rejected by (-Infinity, 14]'
                );
            });
        });

        describe('test isDataBinSelected with a start exclusive end inclusive data bin for all filters', () => {
            it('rejects a start exclusive end inclusive data bin for any categorical filter', () => {
                const dataBin = {
                    start: 13,
                    end: 14,
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [categoryFilter]),
                    '(13, 14] should be rejected by Unknown'
                );
            });

            it('rejects a start exclusive end inclusive data bin for any single point filter', () => {
                const dataBin = {
                    start: 13,
                    end: 14,
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [singlePointFilter]),
                    '(13, 14] should be accepted by 14'
                );
            });

            it('accepts a start exclusive end inclusive data bin that falls into a start exclusive end inclusive filter', () => {
                const dataBin = {
                    start: 14,
                    end: 15,
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [
                        startExclusiveEndInclusiveFilter,
                    ]),
                    '(14, 15] should be accepted by (14, 15]'
                );
            });

            it('rejects a start exclusive end inclusive data bin that does not fall into a start exclusive end inclusive filter', () => {
                const dataBin = {
                    start: 13,
                    end: 15,
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [
                        startExclusiveEndInclusiveFilter,
                    ]),
                    '(13, 15] should be rejected by (14, 15]'
                );
            });

            it('accepts a start exclusive end inclusive data bin that falls into a start exclusive open ended filter', () => {
                const dataBin = {
                    start: 14,
                    end: 15,
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [startExclusiveOpenEndedFilter]),
                    '(14, 15] should be accepted by (14, Infinity)'
                );
            });

            it('rejects a start exclusive end inclusive data bin that does not fall into a start exclusive open ended filter', () => {
                const dataBin = {
                    start: 13,
                    end: 15,
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [startExclusiveOpenEndedFilter]),
                    '(13, 15] should be rejected by (14, Infinity)'
                );
            });

            it('accepts a start exclusive end inclusive data bin that falls into a start inclusive open ended filter', () => {
                const dataBin = {
                    start: 14,
                    end: 15,
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [startInclusiveOpenEndedFilter]),
                    '(14, 15] should be accepted by [14, Infinity)'
                );
            });

            it('rejects a start exclusive end inclusive data bin that does not fall into a start inclusive open ended filter', () => {
                const dataBin = {
                    start: 13,
                    end: 15,
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [startInclusiveOpenEndedFilter]),
                    '(13, 15] should be rejected by [14, Infinity)'
                );
            });

            it('accepts a start exclusive end inclusive data bin that falls into a end exclusive open start filter', () => {
                const dataBin = {
                    start: 12,
                    end: 13,
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [endExclusiveOpenStartFilter]),
                    '(12, 13] should be accepted by (-Infinity, 14)'
                );
            });

            it('rejects a start exclusive end inclusive data bin that does not fall into an end exclusive open start filter', () => {
                const dataBin = {
                    start: 13,
                    end: 14,
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [endExclusiveOpenStartFilter]),
                    '(13, 14] should be rejected by (-Infinity, 14)'
                );
            });

            it('accepts a start exclusive end inclusive data bin that falls into an end inclusive open start filter', () => {
                const dataBin = {
                    start: 13,
                    end: 14,
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [endInclusiveOpenStartFilter]),
                    '(13, 14] should be accepted by (-Infinity, 14]'
                );
            });

            it('rejects a start exclusive end inclusive data bin that does not fall into an end inclusive open start filter', () => {
                const dataBin = {
                    start: 14,
                    end: 15,
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [endInclusiveOpenStartFilter]),
                    '(14, 15] should be rejected by (-Infinity, 14]'
                );
            });
        });

        describe('test isDataBinSelected with a start exclusive open ended data bin for all filters', () => {
            it('rejects a start exclusive open ended data bin for any categorical filter', () => {
                const dataBin = {
                    start: 14,
                    specialValue: '>',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [categoryFilter]),
                    '(14, Infinity) should be rejected by Unknown'
                );
            });

            it('rejects a start exclusive open ended data bin for any single point filter', () => {
                const dataBin = {
                    start: 13,
                    specialValue: '>',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [singlePointFilter]),
                    '(13, Infinity) should be rejected by 14'
                );
            });

            it('rejects a start exclusive open ended data bin for any start exclusive end inclusive filter', () => {
                const dataBin = {
                    start: 14,
                    specialValue: '>',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [
                        startExclusiveEndInclusiveFilter,
                    ]),
                    '(14, Infinity) should be rejected by (14, 15]'
                );
            });

            it('accepts a start exclusive open ended data bin that falls into a start exclusive open ended filter', () => {
                const dataBin = {
                    start: 14,
                    specialValue: '>',
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [startExclusiveOpenEndedFilter]),
                    '(14, Infinity) should be accepted by (14, Infinity)'
                );
            });

            it('rejects a start exclusive open ended data bin that does not fall into a start exclusive open ended filter', () => {
                const dataBin = {
                    start: 13,
                    specialValue: '>',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [startExclusiveOpenEndedFilter]),
                    '(13, Infinity) should be rejected by (14, Infinity)'
                );
            });

            it('accepts a start exclusive open ended data bin that falls into a start inclusive open ended filter', () => {
                const dataBin = {
                    start: 14,
                    specialValue: '>',
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [startInclusiveOpenEndedFilter]),
                    '(14, Infinity) should be accepted by [14, Infinity)'
                );
            });

            it('rejects a start exclusive open ended data bin that does not fall into a start inclusive open ended filter', () => {
                const dataBin = {
                    start: 13,
                    specialValue: '>',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [startInclusiveOpenEndedFilter]),
                    '(13, Infinity) should be rejected by [14, Infinity)'
                );
            });

            it('rejects a start exclusive open ended data bin for any end exclusive open start filter', () => {
                const dataBin = {
                    start: 13,
                    specialValue: '>',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [endExclusiveOpenStartFilter]),
                    '(13, Infinity) should be rejected by (-Infinity, 14)'
                );
            });

            it('rejects a start exclusive open ended data bin for any end inclusive open start filter', () => {
                const dataBin = {
                    start: 13,
                    specialValue: '>',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [endInclusiveOpenStartFilter]),
                    '(13, Infinity) should be rejected by (-Infinity, 14]'
                );
            });
        });

        describe('test isDataBinSelected with a start inclusive open ended data bin for all filters', () => {
            it('rejects a start inclusive open ended data bin for any categorical filter', () => {
                const dataBin = {
                    start: 14,
                    specialValue: '>=',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [categoryFilter]),
                    '[14, Infinity) should be rejected by Unknown'
                );
            });

            it('rejects a start inclusive open ended data bin for any single point filter', () => {
                const dataBin = {
                    start: 14,
                    specialValue: '>=',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [singlePointFilter]),
                    '[14, Infinity) should be rejected by 14'
                );
            });

            it('rejects a start inclusive open ended data bin for any start exclusive end inclusive filter', () => {
                const dataBin = {
                    start: 14,
                    specialValue: '>=',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [
                        startExclusiveEndInclusiveFilter,
                    ]),
                    '[14, Infinity) should be rejected by (14, 15]'
                );
            });

            it('rejects a start inclusive open ended data bin for any end exclusive open start filter', () => {
                const dataBin = {
                    start: 13,
                    specialValue: '>=',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [endExclusiveOpenStartFilter]),
                    '[13, Infinity) should be rejected by (-Infinity, 14)'
                );
            });

            it('rejects a start inclusive open ended data bin for any end inclusive open start filter', () => {
                const dataBin = {
                    start: 13,
                    specialValue: '>=',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [endInclusiveOpenStartFilter]),
                    '[13, Infinity) should be rejected by (-Infinity, 14]'
                );
            });

            it('accepts a start inclusive open ended data bin that falls into a start exclusive open ended filter', () => {
                const dataBin = {
                    start: 15,
                    specialValue: '>=',
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [startExclusiveOpenEndedFilter]),
                    '[15, Infinity) should be accepted by (14, Infinity)'
                );
            });

            it('rejects a start inclusive open ended data bin that does not fall into a start exclusive open ended filter', () => {
                const dataBin = {
                    start: 14,
                    specialValue: '>=',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [startExclusiveOpenEndedFilter]),
                    '[14, Infinity) should be rejected by (14, Infinity)'
                );
            });

            it('accepts a start inclusive open ended data bin that falls into a start inclusive open ended filter', () => {
                const dataBin = {
                    start: 14,
                    specialValue: '>=',
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [startInclusiveOpenEndedFilter]),
                    '[14, Infinity) should be accepted by [14, Infinity)'
                );
            });

            it('rejects a start inclusive open ended data bin that does not fall into a start inclusive open ended filter', () => {
                const dataBin = {
                    start: 13,
                    specialValue: '>=',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [startInclusiveOpenEndedFilter]),
                    '[13, Infinity) should be rejected by [14, Infinity)'
                );
            });
        });

        describe('test isDataBinSelected with an end exclusive open start data bin for all filters', () => {
            it('rejects an end exclusive open start data bin for any categorical filter', () => {
                const dataBin = {
                    start: 14,
                    specialValue: '<',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [categoryFilter]),
                    '(-Infinity, 14) should be rejected by Unknown'
                );
            });

            it('rejects an end exclusive open start data bin for any single point filter', () => {
                const dataBin = {
                    end: 15,
                    specialValue: '<',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [singlePointFilter]),
                    '(-Infinity, 15) should be rejected by 14'
                );
            });

            it('rejects an end exclusive open start data bin for any start exclusive end inclusive filter', () => {
                const dataBin = {
                    end: 15,
                    specialValue: '<',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [
                        startExclusiveEndInclusiveFilter,
                    ]),
                    '(-Infinity, 15) should be rejected by (14, 15]'
                );
            });

            it('rejects an end exclusive open start data bin for any start exclusive open ended filter', () => {
                const dataBin = {
                    end: 15,
                    specialValue: '<',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [startExclusiveOpenEndedFilter]),
                    '(-Infinity, 15) should be rejected by (14, Infinity)'
                );
            });

            it('rejects an end exclusive open start data bin for any start inclusive open ended filter', () => {
                const dataBin = {
                    end: 14,
                    specialValue: '<',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [startInclusiveOpenEndedFilter]),
                    '(-Infinity, 14) should be rejected by [14, Infinity)'
                );
            });

            it('accepts an end exclusive open start data bin that falls into an end exclusive open start filter', () => {
                const dataBin = {
                    end: 13,
                    specialValue: '<',
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [endExclusiveOpenStartFilter]),
                    '(-Infinity, 13) should be accepted by (-Infinity, 14)'
                );
            });

            it('rejects an end exclusive open start data bin that does not fall into an end exclusive open start filter', () => {
                const dataBin = {
                    end: 15,
                    specialValue: '<',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [endExclusiveOpenStartFilter]),
                    '(-Infinity, 15) should be rejected by (-Infinity, 14)'
                );
            });

            it('accepts an end exclusive open start data bin that falls into an end inclusive open start filter', () => {
                const dataBin = {
                    end: 14,
                    specialValue: '<',
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [endInclusiveOpenStartFilter]),
                    '(-Infinity, 14) should be accepted by (-Infinity, 14]'
                );
            });

            it('rejects an end exclusive open start data bin that does not fall into an end inclusive open start filter', () => {
                const dataBin = {
                    end: 15,
                    specialValue: '<',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [endInclusiveOpenStartFilter]),
                    '(-Infinity, 15) should be rejected by (-Infinity, 14]'
                );
            });
        });

        describe('test isDataBinSelected with an end inclusive open start data bin for all filters', () => {
            it('rejects an end inclusive open start data bin for any categorical filter', () => {
                const dataBin = {
                    start: 14,
                    specialValue: '<=',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [categoryFilter]),
                    '(-Infinity, 14] should be rejected by Unknown'
                );
            });

            it('rejects an end inclusive open start data bin for any single point filter', () => {
                const dataBin = {
                    end: 14,
                    specialValue: '<=',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [singlePointFilter]),
                    '(-Infinity, 14] should be rejected by 14'
                );
            });

            it('rejects an end inclusive open start data bin for any start exclusive end inclusive filter', () => {
                const dataBin = {
                    end: 14,
                    specialValue: '<=',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [
                        startExclusiveEndInclusiveFilter,
                    ]),
                    '(-Infinity, 14] should be rejected by (14, 15]'
                );
            });

            it('rejects an end inclusive open start data bin for any start exclusive open ended filter', () => {
                const dataBin = {
                    end: 14,
                    specialValue: '<=',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [startExclusiveOpenEndedFilter]),
                    '(-Infinity, 14] should be rejected by (14, Infinity)'
                );
            });

            it('rejects an end inclusive open start data bin for any start inclusive open ended filter', () => {
                const dataBin = {
                    end: 14,
                    specialValue: '<=',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [startInclusiveOpenEndedFilter]),
                    '(-Infinity, 14] should be rejected by [14, Infinity)'
                );
            });

            it('accepts an end inclusive open start data bin that falls into an end exclusive open start filter', () => {
                const dataBin = {
                    end: 13,
                    specialValue: '<=',
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [endExclusiveOpenStartFilter]),
                    '(-Infinity, 13] should be accepted by (-Infinity, 14)'
                );
            });

            it('rejects an end inclusive open start data bin that does not fall into an end exclusive open start filter', () => {
                const dataBin = {
                    end: 14,
                    specialValue: '<=',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [endExclusiveOpenStartFilter]),
                    '(-Infinity, 14] should be rejected by (-Infinity, 14)'
                );
            });

            it('accepts an end inclusive open start data bin that falls into an end inclusive open start filter', () => {
                const dataBin = {
                    end: 14,
                    specialValue: '<=',
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [endInclusiveOpenStartFilter]),
                    '(-Infinity, 14] should be accepted by (-Infinity, 14]'
                );
            });

            it('rejects an end inclusive open start data bin that does not fall into an end inclusive open start filter', () => {
                const dataBin = {
                    end: 15,
                    specialValue: '<=',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [endInclusiveOpenStartFilter]),
                    '(-Infinity, 15] should be rejected by (-Infinity, 14]'
                );
            });
        });

        describe('test isDataBinSelected with a categorical data bin for all filters', () => {
            it('rejects a categorical data bin for any single point filter', () => {
                const dataBin = {
                    specialValue: 'Unknown',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [singlePointFilter]),
                    'Unknown should be rejected by 14'
                );
            });

            it('rejects a categorical data bin for any start exclusive end inclusive filter', () => {
                const dataBin = {
                    specialValue: 'Unknown',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [
                        startExclusiveEndInclusiveFilter,
                    ]),
                    'Unknown should be rejected by (14, 15]'
                );
            });

            it('rejects a categorical data bin for any start exclusive open ended filter', () => {
                const dataBin = {
                    specialValue: 'Unknown',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [startExclusiveOpenEndedFilter]),
                    'Unknown should be rejected by (14, Infinity)'
                );
            });

            it('rejects a categorical data bin for any start inclusive open ended filter', () => {
                const dataBin = {
                    specialValue: 'Unknown',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [startInclusiveOpenEndedFilter]),
                    'Unknown should be rejected by [14, Infinity)'
                );
            });

            it('rejects a categorical data bin for any end exclusive open start filter', () => {
                const dataBin = {
                    specialValue: 'Unknown',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [endExclusiveOpenStartFilter]),
                    'Unknown should be rejected by (-Infinity, 14)'
                );
            });

            it('rejects a categorical data bin for any an end inclusive open start filter', () => {
                const dataBin = {
                    specialValue: 'Unknown',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [endInclusiveOpenStartFilter]),
                    'Unknown should be rejected by (-Infinity, 14]'
                );
            });

            it('accepts a categorical data bin that matches a categorical filter', () => {
                const dataBin = {
                    specialValue: 'Unknown',
                } as DataBin;

                assert.isTrue(
                    isDataBinSelected(dataBin, [categoryFilter]),
                    'Unknown should be accepted by Unknown'
                );
            });

            it('rejects a categorical data bin that does not match a categorical filter', () => {
                const dataBin = {
                    specialValue: 'Known',
                } as DataBin;

                assert.isFalse(
                    isDataBinSelected(dataBin, [categoryFilter]),
                    'Known should be rejected by Unknown'
                );
            });
        });
    });

    describe('updateCustomIntervalFilter', () => {
        let newRange: { start?: number; end?: number };
        let getDataBinsResult1 = observable.box<DataBin[]>([], { deep: false });
        let getDataBinsResult2 = observable.box<DataBin[]>([], { deep: false });
        let getCurrentFiltersResult: DataFilterValue[];
        let afterUpdatingCustomBins: boolean;

        const dataBinsPromise1 = remoteData({
            invoke: () => Promise.resolve(getDataBinsResult1.get()),
        });
        const dataBinsPromise2 = remoteData({
            invoke: () => Promise.resolve(getDataBinsResult2.get()),
        });
        const disposer = autorun(() => {
            dataBinsPromise1.result;
            dataBinsPromise2.result;
        });

        const updateCustomBins = spy(() => {
            afterUpdatingCustomBins = true;
        });
        const getDataBins = spy(() => {
            if (afterUpdatingCustomBins) {
                return dataBinsPromise2;
            } else {
                return dataBinsPromise1;
            }
        });
        const getCurrentFilters = spy(() => {
            return getCurrentFiltersResult;
        });
        const updateIntervalFilters = spy(() => {});

        beforeEach(() => {
            updateCustomBins.resetHistory();
            getDataBins.resetHistory();
            updateIntervalFilters.resetHistory();
            getCurrentFilters.resetHistory();
            afterUpdatingCustomBins = false;
        });
        afterAll(() => {
            disposer();
        });
        it('retains categorical filters when updating the range ', async () => {
            newRange = { start: 3, end: 8 };
            getCurrentFiltersResult = ([
                { value: 'NA' },
                { start: 0, end: 10 },
            ] as any) as DataFilterValue[];
            runInAction(() => {
                getDataBinsResult1.set(([
                    {
                        id: '0',
                        count: 5,
                        specialValue: 'NA',
                    },
                    {
                        id: '1',
                        count: 5,
                        start: 0,
                        end: 10,
                    },
                ] as any) as DataBin[]);
                getDataBinsResult2.set(([
                    {
                        id: '0',
                        count: 5,
                        specialValue: 'NA',
                    },
                    {
                        id: '1',
                        count: 5,
                        start: 0,
                        end: 3,
                    },
                    {
                        id: '2',
                        count: 5,
                        start: 3,
                        end: 8,
                    },
                    {
                        id: '3',
                        count: 5,
                        start: 8,
                        end: 10,
                    },
                ] as any) as DataBin[]);
            });
            await toPromise(dataBinsPromise1);
            await toPromise(dataBinsPromise2);

            await updateCustomIntervalFilter(
                newRange,
                {} as ChartMeta,
                getDataBins,
                getCurrentFilters,
                updateCustomBins,
                updateIntervalFilters
            );

            assert.deepEqual(updateCustomBins.args[0][1], [0, 3, 8, 10]);
            assert.deepEqual(updateIntervalFilters.args[0][1], [
                {
                    id: '2',
                    count: 5,
                    start: 3,
                    end: 8,
                },
                {
                    specialValue: 'NA',
                    start: undefined,
                    end: undefined,
                },
            ]);
        });
        it('updates a range correctly when it is partially overlapping', async () => {
            newRange = { start: 3, end: 14 };
            getCurrentFiltersResult = ([
                { value: 'NA' },
                { start: 0, end: 10 },
            ] as any) as DataFilterValue[];
            runInAction(() => {
                getDataBinsResult1.set(([
                    {
                        id: '0',
                        count: 5,
                        specialValue: 'NA',
                    },
                    {
                        id: '1',
                        count: 5,
                        start: 0,
                        end: 10,
                    },
                ] as any) as DataBin[]);
                getDataBinsResult2.set(([
                    {
                        id: '0',
                        count: 5,
                        specialValue: 'NA',
                    },
                    {
                        id: '1',
                        count: 5,
                        start: 0,
                        end: 3,
                    },
                    {
                        id: '2',
                        count: 5,
                        start: 3,
                        end: 10,
                    },
                    {
                        id: '3',
                        count: 5,
                        start: 10,
                        end: 14,
                    },
                ] as any) as DataBin[]);
            });
            await toPromise(dataBinsPromise1);
            await toPromise(dataBinsPromise2);

            await updateCustomIntervalFilter(
                newRange,
                {} as ChartMeta,
                getDataBins,
                getCurrentFilters,
                updateCustomBins,
                updateIntervalFilters
            );

            assert.deepEqual(updateCustomBins.args[0][1], [0, 3, 10, 14]);
            assert.deepEqual(updateIntervalFilters.args[0][1], [
                {
                    id: '2',
                    count: 5,
                    start: 3,
                    end: 10,
                },
                {
                    id: '3',
                    count: 5,
                    start: 10,
                    end: 14,
                },
                {
                    specialValue: 'NA',
                    start: undefined,
                    end: undefined,
                },
            ]);
        });
    });

    describe('toFixedDigit', () => {
        const negativeValues = [
            -666.666,
            -3,
            -2.2499999999999,
            -2.0000000000001,
            -1,
            -0.6000000000000001,
            -0.002499999998,
        ];

        const positiveValues = [
            0.002499999998,
            0.6000000000000001,
            1,
            1.5999999999999999,
            1.7999999999999998,
            2.0000000000000001,
            16.99999999999998,
            666.666,
        ];

        it('handles negative values properly', () => {
            assert.equal(toFixedDigit(negativeValues[0]), '-666.67');
            assert.equal(toFixedDigit(negativeValues[1]), '-3');
            assert.equal(toFixedDigit(negativeValues[2]), '-2.25');
            assert.equal(toFixedDigit(negativeValues[3]), '-2');
            assert.equal(toFixedDigit(negativeValues[4]), '-1');
            assert.equal(toFixedDigit(negativeValues[5]), '-0.6');
            assert.equal(toFixedDigit(negativeValues[6]), '-0.0025');
        });

        it('handles zero properly', () => {
            assert.equal(toFixedDigit(0), '0');
        });

        it('handles positive values properly', () => {
            //assert.equal(toFixedDigit(positiveValues[0]), "0.0025");
            assert.equal(toFixedDigit(positiveValues[0]), '0.0025');
            assert.equal(toFixedDigit(positiveValues[1]), '0.6');
            assert.equal(toFixedDigit(positiveValues[2]), '1');
            assert.equal(toFixedDigit(positiveValues[3]), '1.6');
            assert.equal(toFixedDigit(positiveValues[4]), '1.8');
            assert.equal(toFixedDigit(positiveValues[5]), '2');
            assert.equal(toFixedDigit(positiveValues[6]), '17');
            assert.equal(toFixedDigit(positiveValues[7]), '666.67');
        });
    });

    describe('pickClinicalDataColors', () => {
        const clinicalDataCountWithFixedValues = [
            {
                value: 'FALSE',
                count: 26,
            },
            {
                value: 'TRUE',
                count: 66,
            },
            {
                value: 'NA',
                count: 16,
            },
        ];

        const clinicalDataCountWithFixedMixedCaseValues = [
            {
                value: 'Yes',
                count: 26,
            },
            {
                value: 'No',
                count: 66,
            },
            {
                value: 'Male',
                count: 36,
            },
            {
                value: 'F',
                count: 26,
            },
            {
                value: 'Na',
                count: 16,
            },
        ];

        const clinicalDataCountWithBothFixedAndOtherValues = [
            {
                value: 'Yes',
                count: 26,
            },
            {
                value: 'NO',
                count: 66,
            },
            {
                value: 'na',
                count: 16,
            },
            {
                value: 'WHY',
                count: 46,
            },
            {
                value: 'weather',
                count: 36,
            },
            {
                value: 'is',
                count: 36,
            },
            {
                value: 'so',
                count: 36,
            },
            {
                value: 'hot',
                count: 36,
            },
        ];

        it('picks predefined colors for known clinical attribute values', () => {
            const colors = pickClinicalDataColors(
                clinicalDataCountWithFixedValues
            );
            assert.equal(colors['TRUE'], RESERVED_CLINICAL_VALUE_COLORS.true);
            assert.equal(colors['FALSE'], RESERVED_CLINICAL_VALUE_COLORS.false);
            assert.equal(colors['NA'], RESERVED_CLINICAL_VALUE_COLORS.na);
        });

        it('picks predefined colors for known clinical attribute values in mixed letter case', () => {
            const colors = pickClinicalDataColors(
                clinicalDataCountWithFixedMixedCaseValues
            );

            assert.equal(colors['Yes'], RESERVED_CLINICAL_VALUE_COLORS.yes);
            assert.equal(colors['No'], RESERVED_CLINICAL_VALUE_COLORS.no);
            assert.equal(colors['Na'], RESERVED_CLINICAL_VALUE_COLORS.na);
            assert.equal(colors['Male'], RESERVED_CLINICAL_VALUE_COLORS.male);
            assert.equal(colors['F'], RESERVED_CLINICAL_VALUE_COLORS.f);
        });

        it('does not pick already picked colors again for non-fixed values', () => {
            const availableColors = [
                '#66AA00',
                '#666666',
                '#2986E2',
                RESERVED_CLINICAL_VALUE_COLORS.na,
                RESERVED_CLINICAL_VALUE_COLORS.no,
                '#f88508',
                RESERVED_CLINICAL_VALUE_COLORS.yes,
                '#f88507',
            ];

            const colors = pickClinicalDataColors(
                clinicalDataCountWithBothFixedAndOtherValues,
                availableColors
            );

            assert.equal(colors['Yes'], RESERVED_CLINICAL_VALUE_COLORS.yes);
            assert.equal(colors['NO'], RESERVED_CLINICAL_VALUE_COLORS.no);
            assert.equal(colors['na'], RESERVED_CLINICAL_VALUE_COLORS.na);
            assert.equal(colors['WHY'], '#66AA00');
            assert.equal(colors['weather'], '#666666');
            assert.equal(colors['is'], '#2986E2');
            assert.equal(colors['so'], '#f88508');
            assert.equal(colors['hot'], '#f88507');
        });
    });

    describe('getExponent', () => {
        it('handles negative values properly', () => {
            assert.equal(getExponent(-1), 0);
            assert.equal(getExponent(-3), 0.5);
            assert.equal(getExponent(-10), 1);
            assert.equal(getExponent(-31), 1.5);
            assert.equal(getExponent(-100), 2);
            assert.equal(getExponent(-316), 2.5);
            assert.equal(getExponent(-1000), 3);
        });

        it('handles zero properly', () => {
            assert.equal(getExponent(0), -Infinity);
        });

        it('handles positive values properly', () => {
            //assert.equal(toFixedDigit(positiveValues[0]), "0.0025");
            assert.equal(getExponent(1), 0);
            assert.equal(getExponent(3), 0.5);
            assert.equal(getExponent(10), 1);
            assert.equal(getExponent(31), 1.5);
            assert.equal(getExponent(100), 2);
            assert.equal(getExponent(316), 2.5);
            assert.equal(getExponent(1000), 3);
        });
    });

    describe('getCNAByAlteration', () => {
        it('return proper string from proper alteration', () => {
            assert.isTrue(getCNAByAlteration(-2) === 'HOMDEL');
            assert.isTrue(getCNAByAlteration(-1) === 'HETLOSS');
            assert.isTrue(getCNAByAlteration(0) === 'DIPLOID');
            assert.isTrue(getCNAByAlteration(1) === 'GAIN');
            assert.isTrue(getCNAByAlteration(2) === 'AMP');
            assert.isTrue(getCNAByAlteration('NA') === 'Not Profiled');
        });

        it('return empty string when alteration is not valid', () => {
            assert.isTrue(getCNAByAlteration(3) === '');
            assert.isTrue(getCNAByAlteration(-1.2) === '');
            assert.isTrue(getCNAByAlteration('not a number') === 'NA');
        });

        it('return NA string when alteration is not valid', () => {
            assert.isTrue(getCNAByAlteration('not a number') === 'NA');
            assert.isTrue(getCNAByAlteration('invalid string') === 'NA');
        });
    });

    describe('getDefaultChartTypeByClinicalAttribute', () => {
        it('return TABLE when the clinical attributes are pre-defined as table', () => {
            let attr: ClinicalAttribute = {
                clinicalAttributeId: 'CANCER_TYPE',
            } as ClinicalAttribute;
            assert.isTrue(
                getDefaultChartTypeByClinicalAttribute(attr) ===
                    ChartTypeEnum.TABLE
            );

            attr.clinicalAttributeId = 'CANCER_TYPE_DETAILED';
            assert.isTrue(
                getDefaultChartTypeByClinicalAttribute(attr) ===
                    ChartTypeEnum.TABLE
            );
        });

        it('return PIE_CHART when clinical attribute has data type as STRING', () => {
            const attr: ClinicalAttribute = {
                datatype: 'STRING',
            } as ClinicalAttribute;
            assert.isTrue(
                getDefaultChartTypeByClinicalAttribute(attr) ===
                    ChartTypeEnum.PIE_CHART
            );
        });

        it('return BAR_CHART when clinical attribute has data type as STRING', () => {
            const attr: ClinicalAttribute = {
                datatype: 'NUMBER',
            } as ClinicalAttribute;
            assert.isTrue(
                getDefaultChartTypeByClinicalAttribute(attr) ===
                    ChartTypeEnum.BAR_CHART
            );
        });
    });

    describe('isOccupied', () => {
        it('Return false if the matrix is empty', () => {
            assert.isFalse(isOccupied([], { x: 0, y: 0 }, { w: 1, h: 1 }));
        });
        it('Check the bigger chart starts from even index', () => {
            // x
            assert.isTrue(
                isOccupied(
                    [['1', '', '', '2', '', '']],
                    { x: 1, y: 0 },
                    { w: 2, h: 1 }
                )
            );
            assert.isTrue(
                isOccupied(
                    [['1', '', '', '2', '', '']],
                    { x: 2, y: 0 },
                    { w: 2, h: 1 }
                )
            );
            assert.isFalse(
                isOccupied(
                    [['1', '', '', '2', '', '']],
                    { x: 4, y: 0 },
                    { w: 2, h: 1 }
                )
            );

            // y
            assert.isTrue(
                isOccupied(
                    [
                        ['1', '1', '', ''],
                        ['2', '2', '', ''],
                    ],
                    { x: 2, y: 1 },
                    { w: 2, h: 2 }
                )
            );
        });
        it('Return proper value', () => {
            assert.isTrue(
                isOccupied([['1', '2', '']], { x: 0, y: 0 }, { w: 1, h: 1 })
            );
            assert.isTrue(
                isOccupied([['1', '2', '']], { x: 1, y: 0 }, { w: 1, h: 1 })
            );
            assert.isFalse(
                isOccupied([['1', '2', '']], { x: 2, y: 0 }, { w: 1, h: 1 })
            );

            assert.isTrue(
                isOccupied([['1', '2', '']], { x: 2, y: 0 }, { w: 2, h: 1 })
            );

            assert.isTrue(
                isOccupied(
                    [
                        ['1', '1', ''],
                        ['2', '2', ''],
                    ],
                    { x: 0, y: 0 },
                    { w: 1, h: 1 }
                )
            );
            assert.isTrue(
                isOccupied(
                    [
                        ['1', '1', ''],
                        ['2', '2', ''],
                    ],
                    { x: 0, y: 1 },
                    { w: 1, h: 1 }
                )
            );

            assert.isFalse(
                isOccupied(
                    [
                        ['1', '1', '', ''],
                        ['2', '2', '', ''],
                    ],
                    { x: 2, y: 0 },
                    { w: 2, h: 2 }
                )
            );
            assert.isFalse(
                isOccupied(
                    [
                        ['1', '1', '', ''],
                        ['2', '2', '', ''],
                        ['3', '3', '', ''],
                    ],
                    { x: 2, y: 2 },
                    { w: 2, h: 2 }
                )
            );
        });
    });

    describe('findSpot', () => {
        it('0,0 should be returned if the matrix is empty', () => {
            assert.deepEqual(findSpot([], { w: 1, h: 1 }), { x: 0, y: 0 });
        });
        it('The first index in next row should be returned if the matrix is fully occupied', () => {
            assert.deepEqual(findSpot([['1', '2']], { w: 1, h: 1 }), {
                x: 0,
                y: 1,
            });
        });
        it('Return proper position', () => {
            assert.deepEqual(findSpot([['1', '2', '']], { w: 1, h: 1 }), {
                x: 2,
                y: 0,
            });
            assert.deepEqual(findSpot([['1', '2', '']], { w: 2, h: 1 }), {
                x: 0,
                y: 1,
            });
            assert.deepEqual(
                findSpot(
                    [
                        ['1', '1', ''],
                        ['2', '2', ''],
                    ],
                    { w: 1, h: 1 }
                ),
                { x: 2, y: 0 }
            );
            assert.deepEqual(
                findSpot(
                    [
                        ['1', '1', ''],
                        ['2', '2', ''],
                    ],
                    { w: 2, h: 1 }
                ),
                { x: 0, y: 2 }
            );
        });
    });

    describe('calculateLayout', () => {
        let visibleAttrs: ChartMeta[] = [];
        let visibleAttrsChartDimensions: { [id: string]: ChartDimension } = {};
        const clinicalAttr: ClinicalAttribute = {
            clinicalAttributeId: 'test',
            datatype: 'STRING',
            description: '',
            displayName: '',
            patientAttribute: true,
            priority: '1',
            studyId: '',
        };
        for (let i = 0; i < 8; i++) {
            const uniqueKey = 'test' + i;
            visibleAttrs.push({
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: uniqueKey,
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: false,
                priority: 1,
            });
            visibleAttrsChartDimensions[uniqueKey] = { w: 1, h: 1 };
        }

        it('Empty array should be returned when no attributes given', () => {
            let layout: Layout[] = calculateLayout(
                [],
                6,
                visibleAttrsChartDimensions,
                []
            );
            assert.isArray(layout);
            assert.equal(layout.length, 0);
        });

        it('The layout is not expected - 1', () => {
            let layout: Layout[] = calculateLayout(
                visibleAttrs,
                6,
                visibleAttrsChartDimensions,
                []
            );
            assert.equal(layout.length, 8);
            assert.equal(layout[0].i, 'test0');
            assert.equal(layout[0].x, 0);
            assert.equal(layout[0].y, 0);
            assert.equal(layout[1].i, 'test1');
            assert.equal(layout[1].x, 1);
            assert.equal(layout[1].y, 0);
            assert.equal(layout[2].i, 'test2');
            assert.equal(layout[2].x, 2);
            assert.equal(layout[2].y, 0);
            assert.equal(layout[3].i, 'test3');
            assert.equal(layout[3].x, 3);
            assert.equal(layout[3].y, 0);
            assert.equal(layout[4].i, 'test4');
            assert.equal(layout[4].x, 4);
            assert.equal(layout[4].y, 0);
            assert.equal(layout[5].i, 'test5');
            assert.equal(layout[5].x, 5);
            assert.equal(layout[5].y, 0);
            assert.equal(layout[6].i, 'test6');
            assert.equal(layout[6].x, 0);
            assert.equal(layout[6].y, 1);
            assert.equal(layout[7].i, 'test7');
            assert.equal(layout[7].x, 1);
            assert.equal(layout[7].y, 1);
        });

        it('The layout is not expected - 2', () => {
            let layout: Layout[] = calculateLayout(
                visibleAttrs,
                2,
                visibleAttrsChartDimensions,
                []
            );
            assert.equal(layout.length, 8);
            assert.equal(layout[0].i, 'test0');
            assert.equal(layout[0].x, 0);
            assert.equal(layout[0].y, 0);
            assert.equal(layout[1].i, 'test1');
            assert.equal(layout[1].x, 1);
            assert.equal(layout[1].y, 0);
            assert.equal(layout[2].i, 'test2');
            assert.equal(layout[2].x, 0);
            assert.equal(layout[2].y, 1);
            assert.equal(layout[3].i, 'test3');
            assert.equal(layout[3].x, 1);
            assert.equal(layout[3].y, 1);
            assert.equal(layout[4].i, 'test4');
            assert.equal(layout[4].x, 0);
            assert.equal(layout[4].y, 2);
            assert.equal(layout[5].i, 'test5');
            assert.equal(layout[5].x, 1);
            assert.equal(layout[5].y, 2);
            assert.equal(layout[6].i, 'test6');
            assert.equal(layout[6].x, 0);
            assert.equal(layout[6].y, 3);
            assert.equal(layout[7].i, 'test7');
            assert.equal(layout[7].x, 1);
            assert.equal(layout[7].y, 3);
        });

        it('Higher priority chart should be displayed first', () => {
            let visibleAttrsChartDimensions: {
                [id: string]: ChartDimension;
            } = {};
            visibleAttrs = [
                {
                    clinicalAttribute: clinicalAttr,
                    displayName: clinicalAttr.displayName,
                    description: clinicalAttr.description,
                    uniqueKey: 'test0',
                    dataType: ChartMetaDataTypeEnum.CLINICAL,
                    patientAttribute: clinicalAttr.patientAttribute,
                    renderWhenDataChange: true,
                    priority: 10,
                },
                {
                    clinicalAttribute: clinicalAttr,
                    displayName: clinicalAttr.displayName,
                    description: clinicalAttr.description,
                    uniqueKey: 'test1',
                    dataType: ChartMetaDataTypeEnum.CLINICAL,
                    patientAttribute: clinicalAttr.patientAttribute,
                    renderWhenDataChange: false,
                    priority: 20,
                },
            ];
            visibleAttrsChartDimensions['test0'] = { w: 2, h: 2 };
            visibleAttrsChartDimensions['test1'] = { w: 1, h: 1 };

            let layout: Layout[] = calculateLayout(
                visibleAttrs,
                4,
                visibleAttrsChartDimensions,
                []
            );
            assert.equal(layout.length, 2);
            assert.equal(layout[0].i, 'test1');
            assert.equal(layout[0].x, 0);
            assert.equal(layout[0].y, 0);

            assert.equal(layout[1].i, 'test0');
            assert.equal(layout[1].x, 2);
            assert.equal(layout[1].y, 0);
        });

        it('The lower priority chart should occupy the empty space first', () => {
            let visibleAttrsChartDimensions: {
                [id: string]: ChartDimension;
            } = {};
            visibleAttrs = [
                {
                    clinicalAttribute: clinicalAttr,
                    displayName: clinicalAttr.displayName,
                    description: clinicalAttr.description,
                    uniqueKey: 'test0',
                    dataType: ChartMetaDataTypeEnum.CLINICAL,
                    patientAttribute: clinicalAttr.patientAttribute,
                    renderWhenDataChange: false,
                    priority: 10,
                },
                {
                    clinicalAttribute: clinicalAttr,
                    displayName: clinicalAttr.displayName,
                    description: clinicalAttr.description,
                    uniqueKey: 'test1',
                    dataType: ChartMetaDataTypeEnum.CLINICAL,
                    patientAttribute: clinicalAttr.patientAttribute,
                    renderWhenDataChange: true,
                    priority: 5,
                },
                {
                    clinicalAttribute: clinicalAttr,
                    displayName: clinicalAttr.displayName,
                    description: clinicalAttr.description,
                    uniqueKey: 'test2',
                    dataType: ChartMetaDataTypeEnum.CLINICAL,
                    patientAttribute: clinicalAttr.patientAttribute,
                    renderWhenDataChange: false,
                    priority: 2,
                },
            ];
            visibleAttrsChartDimensions['test0'] = { w: 2, h: 1 };
            visibleAttrsChartDimensions['test1'] = { w: 2, h: 2 };
            visibleAttrsChartDimensions['test2'] = { w: 1, h: 1 };

            let layout: Layout[] = calculateLayout(
                visibleAttrs,
                4,
                visibleAttrsChartDimensions,
                []
            );
            assert.equal(layout.length, 3);
            assert.equal(layout[0].i, 'test0');
            assert.equal(layout[0].x, 0);
            assert.equal(layout[0].y, 0);

            assert.equal(layout[1].i, 'test1');
            assert.equal(layout[1].x, 2);
            assert.equal(layout[1].y, 0);

            assert.equal(layout[2].i, 'test2');
            assert.equal(layout[2].x, 0);
            assert.equal(layout[2].y, 1);
        });

        it('The chart should utilize the horizontal space in the last row', () => {
            let visibleAttrsChartDimensions: {
                [id: string]: ChartDimension;
            } = {};
            visibleAttrs = [
                {
                    clinicalAttribute: clinicalAttr,
                    displayName: clinicalAttr.displayName,
                    description: clinicalAttr.description,
                    uniqueKey: 'test0',
                    dataType: ChartMetaDataTypeEnum.CLINICAL,
                    patientAttribute: clinicalAttr.patientAttribute,
                    renderWhenDataChange: false,
                    priority: 1,
                },
                {
                    clinicalAttribute: clinicalAttr,
                    displayName: clinicalAttr.displayName,
                    description: clinicalAttr.description,
                    uniqueKey: 'test1',
                    dataType: ChartMetaDataTypeEnum.CLINICAL,
                    patientAttribute: clinicalAttr.patientAttribute,
                    renderWhenDataChange: true,
                    priority: 1,
                },
                {
                    clinicalAttribute: clinicalAttr,
                    displayName: clinicalAttr.displayName,
                    description: clinicalAttr.description,
                    uniqueKey: 'test2',
                    dataType: ChartMetaDataTypeEnum.CLINICAL,
                    patientAttribute: clinicalAttr.patientAttribute,
                    renderWhenDataChange: false,
                    priority: 1,
                },
                {
                    clinicalAttribute: clinicalAttr,
                    displayName: clinicalAttr.displayName,
                    description: clinicalAttr.description,
                    uniqueKey: 'test3',
                    dataType: ChartMetaDataTypeEnum.CLINICAL,
                    patientAttribute: clinicalAttr.patientAttribute,
                    renderWhenDataChange: false,
                    priority: 1,
                },
                {
                    clinicalAttribute: clinicalAttr,
                    displayName: clinicalAttr.displayName,
                    description: clinicalAttr.description,
                    uniqueKey: 'test4',
                    dataType: ChartMetaDataTypeEnum.CLINICAL,
                    patientAttribute: clinicalAttr.patientAttribute,
                    renderWhenDataChange: false,
                    priority: 1,
                },
            ];
            visibleAttrsChartDimensions['test0'] = { w: 2, h: 2 };
            visibleAttrsChartDimensions['test1'] = { w: 2, h: 2 };
            visibleAttrsChartDimensions['test2'] = { w: 2, h: 1 };
            visibleAttrsChartDimensions['test3'] = { w: 1, h: 1 };
            visibleAttrsChartDimensions['test4'] = { w: 1, h: 1 };

            let layout: Layout[] = calculateLayout(
                visibleAttrs,
                4,
                visibleAttrsChartDimensions,
                []
            );
            assert.equal(layout.length, 5);
            assert.equal(layout[0].i, 'test0');
            assert.equal(layout[0].x, 0);
            assert.equal(layout[0].y, 0);

            assert.equal(layout[1].i, 'test1');
            assert.equal(layout[1].x, 2);
            assert.equal(layout[1].y, 0);

            assert.equal(layout[2].i, 'test2');
            assert.equal(layout[2].x, 0);
            assert.equal(layout[2].y, 2);

            assert.equal(layout[3].i, 'test3');
            assert.equal(layout[3].x, 2);
            assert.equal(layout[3].y, 2);

            assert.equal(layout[4].i, 'test4');
            assert.equal(layout[4].x, 3);
            assert.equal(layout[4].y, 2);
        });
    });

    describe('getSamplesByExcludingFiltersOnChart', () => {
        it('Test getQValue', () => {
            assert.equal(getQValue(0), '0');
            assert.equal(getQValue(0.00001), '1.000e-5');
            assert.equal(getQValue(-0.01), '-1.000e-2');
        });
    });

    describe('getSamplesByExcludingFiltersOnChart', () => {
        let fetchStub: sinon.SinonStub;
        beforeEach(() => {
            fetchStub = sinon.stub(
                internalClient,
                'fetchFilteredSamplesUsingPOST'
            );
            fetchStub.returns(Promise.resolve([]));
        });
        afterEach(() => {
            fetchStub.restore();
        });

        it('no filters selected', done => {
            getSamplesByExcludingFiltersOnChart(
                SpecialChartsUniqueKeyEnum.CANCER_STUDIES,
                emptyStudyViewFilter,
                {},
                [{ sampleId: 'sample1', studyId: 'study1' }],
                ['study1']
            )
                .then(() => {
                    const expectedFilters = {
                        studyViewFilter: {
                            ...emptyStudyViewFilter,
                            sampleIdentifiers: [
                                { sampleId: 'sample1', studyId: 'study1' },
                            ],
                            structuralVariantFilters: undefined,
                        },
                    };
                    const actualFilters = fetchStub.getCall(0).args[0];
                    expect(actualFilters).toStrictEqual(expectedFilters);
                    done();
                })
                .catch(done);
        });

        it('has filter for one chart', done => {
            getSamplesByExcludingFiltersOnChart(
                SpecialChartsUniqueKeyEnum.MUTATION_COUNT,
                emptyStudyViewFilter,
                {
                    [SpecialChartsUniqueKeyEnum.CANCER_STUDIES]: [
                        { sampleId: 'sample1', studyId: 'study1' },
                    ],
                },
                [
                    { sampleId: 'sample1', studyId: 'study1' },
                    { sampleId: 'sample2', studyId: 'study1' },
                ],
                ['study1']
            )
                .then(() => {
                    const expectedFilters = {
                        studyViewFilter: {
                            ...emptyStudyViewFilter,
                            sampleIdentifiers: [
                                { sampleId: 'sample1', studyId: 'study1' },
                            ],
                            structuralVariantFilters: undefined,
                        },
                    };
                    const actualFilters = fetchStub.getCall(0).args[0];
                    expect(actualFilters).toStrictEqual(expectedFilters);
                    done();
                })
                .catch(done);
        });

        it('no filters selected and queriedSampleIdentifiers is empty', done => {
            getSamplesByExcludingFiltersOnChart(
                SpecialChartsUniqueKeyEnum.CANCER_STUDIES,
                emptyStudyViewFilter,
                {},
                [],
                ['study1']
            )
                .then(() => {
                    const expectedFilters = {
                        studyViewFilter: {
                            ...emptyStudyViewFilter,
                            studyIds: ['study1'],
                            structuralVariantFilters: undefined,
                        },
                    };
                    const actualFilters = fetchStub.getCall(0).args[0];
                    expect(actualFilters).toStrictEqual(expectedFilters);
                    done();
                })
                .catch(done);
        });

        it('has filter for one chart and queriedSampleIdentifiers is empty', done => {
            getSamplesByExcludingFiltersOnChart(
                SpecialChartsUniqueKeyEnum.MUTATION_COUNT,
                emptyStudyViewFilter,
                {
                    [SpecialChartsUniqueKeyEnum.CANCER_STUDIES]: [
                        { sampleId: 'sample1', studyId: 'study1' },
                    ],
                },
                [],
                ['study1']
            )
                .then(() => {
                    const expectedFilters = {
                        studyViewFilter: {
                            ...emptyStudyViewFilter,
                            sampleIdentifiers: [
                                { sampleId: 'sample1', studyId: 'study1' },
                            ],
                            structuralVariantFilters: undefined,
                        },
                    };
                    const actualFilters = fetchStub.getCall(0).args[0];
                    expect(actualFilters).toStrictEqual(expectedFilters);
                    done();
                })
                .catch(done);
        });
    });

    describe('getFilteredSampleIdentifiers', () => {
        let samples: Sample[] = [
            {
                sampleId: 'sample1',
                studyId: 'study1',
                sequenced: true,
                copyNumberSegmentPresent: false,
            },
            {
                sampleId: 'sample2',
                studyId: 'study1',
                sequenced: false,
                copyNumberSegmentPresent: true,
            },
        ] as any;
        it('when filter function is not present', () => {
            assert.deepEqual(getFilteredSampleIdentifiers([]), []);
            assert.deepEqual(getFilteredSampleIdentifiers(samples), [
                { sampleId: 'sample1', studyId: 'study1' },
                { sampleId: 'sample2', studyId: 'study1' },
            ]);
        });

        it('when filter function is present', () => {
            assert.deepEqual(
                getFilteredSampleIdentifiers(
                    samples,
                    sample => sample.sequenced
                ),
                [{ sampleId: 'sample1', studyId: 'study1' }]
            );
            assert.deepEqual(
                getFilteredSampleIdentifiers(
                    samples,
                    sample => sample.copyNumberSegmentPresent
                ),
                [{ sampleId: 'sample2', studyId: 'study1' }]
            );
        });
    });

    describe('showOriginStudiesInSummaryDescription', () => {
        it('hide origin studies in summary description', () => {
            assert.equal(showOriginStudiesInSummaryDescription([], []), false);
            assert.equal(
                showOriginStudiesInSummaryDescription(
                    [{ studyId: 'CancerStudy1' }] as CancerStudy[],
                    [] as VirtualStudy[]
                ),
                false
            );
            assert.equal(
                showOriginStudiesInSummaryDescription(
                    [{ studyId: 'CancerStudy1' }] as CancerStudy[],
                    [{ id: 'VirtualStudy1' }] as VirtualStudy[]
                ),
                false
            );
        });
        it('show origin studies in summary description', () => {
            assert.equal(
                showOriginStudiesInSummaryDescription([], [
                    { id: 'VirtualStudy1' },
                ] as VirtualStudy[]),
                true
            );
        });
    });

    describe('groupSamplesByMutationStatus', () => {
        const data = [
            {
                counts: [
                    {
                        value: 'NOT_PROFILED',
                        sampleIds: ['ignore_me_001'],
                    },
                ],
            },
            {
                counts: [
                    {
                        value: 'Missense_Mutation',
                        sampleIds: ['study_ABC_123', 'study_DEF_456'],
                    },
                ],
            },
            {
                counts: [
                    {
                        value: 'NOT_MUTATED',
                        sampleIds: ['study_GHI_789'],
                    },
                ],
            },
        ] as any;

        const studyId: string[] = ['study_ABC', 'study_DEF', 'study_GHI'];

        it('groups and creates SampleIdentifier  by mutation status correctly', () => {
            const result = groupSamplesByMutationStatus(data, studyId);
            assert.deepEqual(result, {
                MUTATED: [
                    {
                        studyId: 'study_ABC',
                        sampleId: '123',
                    },
                    {
                        studyId: 'study_DEF',
                        sampleId: '456',
                    },
                ],
                NOT_MUTATED: [
                    {
                        studyId: 'study_GHI',
                        sampleId: '789',
                    },
                ],
            });
        });

        it('handles missing or empty counts safely', () => {
            const emptyData = [{}, { counts: [] }];
            expect(groupSamplesByMutationStatus(emptyData, [])).toEqual({});
        });
    });

    describe('getFilteredStudiesWithSamples', () => {
        const samples: Sample[] = [
            {
                sampleId: 'sample1',
                studyId: 'study1',
                uniqueSampleKey: 'sample1',
            },
        ] as any;
        const physicalStudies: CancerStudy[] = [{ studyId: 'study1' }] as any;
        const virtualStudies: VirtualStudy[] = [
            {
                id: 'virtualStudy1',
                data: {
                    name: 'virtual study 1',
                    description: 'virtual study 1',
                    studies: [
                        { id: 'study1', samples: ['sample1'] },
                        { id: 'study2', samples: ['sample1'] },
                    ],
                },
            },
        ] as any;
        it('returns expected results', () => {
            assert.deepEqual(getFilteredStudiesWithSamples([], [], []), []);
            assert.deepEqual(
                getFilteredStudiesWithSamples(samples, physicalStudies, []),
                [{ studyId: 'study1', uniqueSampleKeys: ['sample1'] }] as any
            );
            assert.deepEqual(
                getFilteredStudiesWithSamples(
                    samples,
                    physicalStudies,
                    virtualStudies
                ),
                [
                    {
                        studyId: 'study1',
                        uniqueSampleKeys: ['sample1'],
                    },
                    {
                        studyId: 'virtualStudy1',
                        name: 'virtual study 1',
                        description: 'virtual study 1',
                        uniqueSampleKeys: ['sample1'],
                    },
                ] as any
            );
        });
    });

    describe('getFrequencyStr', () => {
        const negativeValues = [
            -666.666,
            -3,
            -2.2499999999999,
            -1,
            -0.6000000000000001,
            -0.002499999998,
        ];

        const positiveValues = [
            0.002499999998,
            0.6000000000000001,
            1,
            1.00001,
            1.5999999999999999,
            1.7999999999999998,
            16.99999999999998,
            16.77,
            16.74,
            666.666,
        ];

        it('handles negative values properly', () => {
            assert.equal(getFrequencyStr(negativeValues[0]), 'NA');
            assert.equal(getFrequencyStr(negativeValues[1]), 'NA');
            assert.equal(getFrequencyStr(negativeValues[2]), 'NA');
            assert.equal(getFrequencyStr(negativeValues[3]), 'NA');
            assert.equal(getFrequencyStr(negativeValues[4]), 'NA');
            assert.equal(getFrequencyStr(negativeValues[5]), 'NA');
        });

        it('handles zero properly', () => {
            assert.equal(getFrequencyStr(0), '0%');
        });

        it('handles positive values properly', () => {
            //assert.equal(getFrequencyStr(positiveValues[0]), "0.0025");
            assert.equal(getFrequencyStr(positiveValues[0]), '<0.1%');
            assert.equal(getFrequencyStr(positiveValues[1]), '0.6%');
            assert.equal(getFrequencyStr(positiveValues[2]), '1.0%');
            assert.equal(getFrequencyStr(positiveValues[3]), '1.0%');
            assert.equal(getFrequencyStr(positiveValues[4]), '1.6%');
            assert.equal(getFrequencyStr(positiveValues[5]), '1.8%');
            assert.equal(getFrequencyStr(positiveValues[6]), '17.0%');
            assert.equal(getFrequencyStr(positiveValues[7]), '16.8%');
            assert.equal(getFrequencyStr(positiveValues[8]), '16.7%');
            assert.equal(getFrequencyStr(positiveValues[9]), '666.7%');
        });
    });

    describe('formatFrequency', () => {
        const negativeValues = [-666.666, -0.002499999998];

        const positiveValues = [
            0.002499999998,
            0.6000000000000001,
            1,
            1.00001,
            1.5999999999999999,
            1.7999999999999998,
            16.99999999999998,
            16.77,
            16.74,
            666.666,
        ];

        it('handles negative values properly', () => {
            assert.equal(formatFrequency(negativeValues[0]), -1);
            assert.equal(formatFrequency(negativeValues[1]), -1);
        });

        it('handles zero properly', () => {
            assert.equal(formatFrequency(0), 0);
        });

        it('handles positive values properly', () => {
            assert.equal(formatFrequency(positiveValues[0]), 0.05);
            assert.equal(formatFrequency(positiveValues[1]), 0.6);
            assert.equal(formatFrequency(positiveValues[2]), 1);
            assert.equal(formatFrequency(positiveValues[3]), 1);
            assert.equal(formatFrequency(positiveValues[4]), 1.6);
            assert.equal(formatFrequency(positiveValues[5]), 1.8);
            assert.equal(formatFrequency(positiveValues[6]), 17);
            assert.equal(formatFrequency(positiveValues[7]), 16.8);
            assert.equal(formatFrequency(positiveValues[8]), 16.7);
            assert.equal(formatFrequency(positiveValues[9]), 666.7);
        });
    });

    describe('getClinicalDataCountWithColorByClinicalDataCount', () => {
        it('NA should be placed at the last and also get predefined color for NA', () => {
            const result = getClinicalDataCountWithColorByClinicalDataCount([
                {
                    count: 50,
                    value: 'NA',
                },
                {
                    count: 10,
                    value: 'Stage I',
                },
            ]);
            assert.equal(result.length, 2);
            assert.equal(result[0].value, 'Stage I');
            assert.equal(result[1].color, DEFAULT_NA_COLOR);
        });

        it('Test the reserved value', () => {
            const result = getClinicalDataCountWithColorByClinicalDataCount([
                {
                    count: 50,
                    value: 'Male',
                },
                {
                    count: 10,
                    value: 'F',
                },
            ]);
            assert.equal(result.length, 2);
            assert.equal(result[0].color, RESERVED_CLINICAL_VALUE_COLORS.male);
            assert.equal(result[1].color, RESERVED_CLINICAL_VALUE_COLORS.f);
        });
    });

    describe('clinicalDataCountComparator', () => {
        it('returns zero if both NA', () => {
            assert.equal(
                clinicalDataCountComparator(
                    { value: 'NA', count: 1 },
                    { value: 'na', count: 666 }
                ),
                0
            );
        });

        it('returns 1 if a is NA, but not b', () => {
            assert.equal(
                clinicalDataCountComparator(
                    { value: 'NA', count: 666 },
                    { value: 'HIGH', count: 66 }
                ),
                1
            );
        });

        it('returns -1 if b is NA, but not a', () => {
            assert.equal(
                clinicalDataCountComparator(
                    { value: 'FEMALE', count: 6 },
                    { value: 'NA', count: 666 }
                ),
                -1
            );
        });

        it('returns count difference if none NA', () => {
            assert.equal(
                clinicalDataCountComparator(
                    { value: 'FEMALE', count: 6 },
                    { value: 'MALE', count: 16 }
                ),
                10
            );
            assert.equal(
                clinicalDataCountComparator(
                    { value: 'FEMALE', count: 16 },
                    { value: 'MALE', count: 6 }
                ),
                -10
            );
            assert.equal(
                clinicalDataCountComparator(
                    { value: 'FEMALE', count: 666 },
                    { value: 'MALE', count: 666 }
                ),
                0
            );
        });
    });

    describe('chartMetaComparator', () => {
        it('returns 0 if priority and display name are exactly same', () => {
            assert.equal(
                chartMetaComparator(
                    { priority: 100, displayName: 'test chart' } as ChartMeta,
                    { priority: 100, displayName: 'test chart' } as ChartMeta
                ),
                0
            );
        });

        it('returns difference if priority is higher', () => {
            assert.equal(
                chartMetaComparator(
                    { priority: 100, displayName: 'name b' } as ChartMeta,
                    { priority: 50, displayName: 'name a' } as ChartMeta
                ),
                -50
            );
        });

        it('returns difference if priority is lower', () => {
            assert.equal(
                chartMetaComparator(
                    { priority: 50, displayName: 'name a' } as ChartMeta,
                    { priority: 100, displayName: 'name b' } as ChartMeta
                ),
                50
            );
        });

        it('when priority is same, returns 1 if displayName is alphabet higher', () => {
            assert.equal(
                chartMetaComparator(
                    { priority: 100, displayName: 'name z' } as ChartMeta,
                    { priority: 100, displayName: 'name a' } as ChartMeta
                ),
                1
            );
        });

        it('when priority is same, returns -1 if displayName is alphabet lower', () => {
            assert.equal(
                chartMetaComparator(
                    { priority: 100, displayName: 'name a' } as ChartMeta,
                    { priority: 100, displayName: 'name z' } as ChartMeta
                ),
                -1
            );
        });
    });

    describe('getRequestedAwaitPromisesForClinicalData', () => {
        // Create some references
        const unfilteredPromise: MobxPromise<any> = {
            result: [],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };
        const newlyAddedUnfilteredPromise: MobxPromise<any> = {
            result: [],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };
        const initialVisibleAttributesPromise: MobxPromise<any> = {
            result: [],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };
        it('initialVisibleAttributesPromise should be used when the chart is default visible attribute and in initial state', () => {
            const promises = getRequestedAwaitPromisesForClinicalData(
                true,
                true,
                false,
                false,
                unfilteredPromise,
                newlyAddedUnfilteredPromise,
                initialVisibleAttributesPromise
            );
            assert.equal(promises.length, 1);
            assert.isTrue(promises[0] === initialVisibleAttributesPromise);
        });
        it('newlyAddedUnfilteredPromise should be used when the chart is not default visible attribute, at the time the chart is not filtered', () => {
            const promises = getRequestedAwaitPromisesForClinicalData(
                false,
                true,
                false,
                false,
                unfilteredPromise,
                newlyAddedUnfilteredPromise,
                initialVisibleAttributesPromise
            );
            assert.equal(promises.length, 1);
            assert.isTrue(promises[0] === newlyAddedUnfilteredPromise);
        });
        it('unfilteredPromise should be used when there are filters applied, but attribute is unfiltered, ignore whether the chart is default visible attribute', () => {
            let promises = getRequestedAwaitPromisesForClinicalData(
                true,
                false,
                true,
                false,
                unfilteredPromise,
                newlyAddedUnfilteredPromise,
                initialVisibleAttributesPromise
            );
            assert.equal(promises.length, 1);
            assert.isTrue(promises[0] === unfilteredPromise);

            promises = getRequestedAwaitPromisesForClinicalData(
                false,
                false,
                true,
                false,
                unfilteredPromise,
                newlyAddedUnfilteredPromise,
                initialVisibleAttributesPromise
            );
            assert.equal(promises.length, 1);
            assert.isTrue(promises[0] === unfilteredPromise);
        });

        it('unfilteredPromise should be used when there are filters applied, when it is newly added chart', () => {
            let promises = getRequestedAwaitPromisesForClinicalData(
                true,
                false,
                true,
                false,
                unfilteredPromise,
                newlyAddedUnfilteredPromise,
                initialVisibleAttributesPromise
            );
            assert.equal(promises.length, 1);
            assert.isTrue(promises[0] === unfilteredPromise);
        });

        it('When chart is filtered and not in initial state, empty array should be returned. Ignore whether the chart is default visible attribute', () => {
            let promises = getRequestedAwaitPromisesForClinicalData(
                true,
                false,
                true,
                true,
                unfilteredPromise,
                newlyAddedUnfilteredPromise,
                initialVisibleAttributesPromise
            );
            assert.equal(promises.length, 0);

            promises = getRequestedAwaitPromisesForClinicalData(
                false,
                false,
                true,
                true,
                unfilteredPromise,
                newlyAddedUnfilteredPromise,
                initialVisibleAttributesPromise
            );
            assert.equal(promises.length, 0);
        });
    });

    describe('getPriorityByClinicalAttribute', () => {
        it('The priority from database needs to overwrite the frontned config in the frontend', () => {
            let attr = {
                clinicalAttributeId: 'AGE',
                datatype: 'STRING',
                description: '',
                displayName: '',
                patientAttribute: true,
                priority: '10',
                studyId: '',
            };
            assert.equal(getPriorityByClinicalAttribute(attr), 10);
        });
        it('The frontned config priority should be used when the DB priority is set to default', () => {
            let attr = {
                clinicalAttributeId: 'AGE',
                datatype: 'STRING',
                description: '',
                displayName: '',
                patientAttribute: true,
                priority: '1',
                studyId: '',
            };
            assert.equal(getPriorityByClinicalAttribute(attr), 9);
        });
    });

    describe('getClinicalEqualityFilterValuesByString', () => {
        it('the values should be separated by comma', () => {
            let result = getClinicalEqualityFilterValuesByString('test1,test2');
            assert.equal(result.length, 2);
            assert.equal(result[0], 'test1');

            result = getClinicalEqualityFilterValuesByString('test1;test2');
            assert.equal(result.length, 1);
        });

        it('Allow using back slash to escape the comma actually in the content', () => {
            let result = getClinicalEqualityFilterValuesByString(
                'test1\\,test2'
            );
            assert.equal(result.length, 1);
            assert.equal(result[0], 'test1,test2');
        });

        it('Allow using back slash to escape the comma actually in the content, multiple instances', () => {
            let result = getClinicalEqualityFilterValuesByString(
                'test1\\,test2,test3, test4\\,test5\\,test6'
            );
            assert.equal(result.length, 3);
            assert.equal(result[0], 'test1,test2');
            assert.equal(result[1], 'test3');
            assert.equal(result[2], 'test4,test5,test6');
        });
    });

    describe('getClinicalDataCountWithColorByCategoryCounts', () => {
        it('When both counts are zero', () => {
            assert.deepEqual(
                [],
                getClinicalDataCountWithColorByCategoryCounts(0, 0)
            );
        });
        it('When only yesCount is > 0', () => {
            assert.deepEqual(
                [
                    {
                        count: 10,
                        value: 'YES',
                        color: CLI_YES_COLOR,
                        freq: '100.0%',
                        percentage: 1,
                    },
                ],
                getClinicalDataCountWithColorByCategoryCounts(10, 0)
            );
        });
        it('When only noCount is > 0', () => {
            assert.deepEqual(
                [
                    {
                        count: 10,
                        value: 'NO',
                        color: CLI_NO_COLOR,
                        freq: '100.0%',
                        percentage: 1,
                    },
                ],
                getClinicalDataCountWithColorByCategoryCounts(0, 10)
            );
        });
        it('When both counts are > 0', () => {
            assert.deepEqual(
                [
                    {
                        count: 10,
                        value: 'YES',
                        color: CLI_YES_COLOR,
                        freq: '50.0%',
                        percentage: 0.5,
                    },
                    {
                        count: 10,
                        value: 'NO',
                        color: CLI_NO_COLOR,
                        freq: '50.0%',
                        percentage: 0.5,
                    },
                ],
                getClinicalDataCountWithColorByCategoryCounts(10, 10)
            );
        });
    });

    describe('calculateNewLayoutForFocusedChart', () => {
        it('should return the previous x, y, and new chartMeta dimension for not overflow position', () => {
            const clinicalAttr: ClinicalAttribute = {
                clinicalAttributeId: 'test',
                datatype: 'STRING',
                description: '',
                displayName: '',
                patientAttribute: true,
                priority: '1',
                studyId: '',
            };
            const layout = {
                x: 1,
                y: 1,
                w: 1,
                h: 1,
            };
            const focusedChartMeta = {
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: 'test',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: false,
                priority: 1,
            };
            const focusedChartDimension = { w: 2, h: 2 };
            const cols = 5;
            const newLayout = calculateNewLayoutForFocusedChart(
                layout,
                focusedChartMeta,
                cols,
                focusedChartDimension
            );
            assert.equal(newLayout.i, 'test');
            assert.equal(newLayout.x, 1);
            assert.equal(newLayout.y, 1);
            assert.equal(newLayout.w, 2);
            assert.equal(newLayout.h, 2);
            assert.equal(newLayout.isResizable, true);
        });

        it('should return the fixed x, previous y, and new chartMeta dimension for the overflow positions', () => {
            const clinicalAttr: ClinicalAttribute = {
                clinicalAttributeId: 'test',
                datatype: 'STRING',
                description: '',
                displayName: '',
                patientAttribute: true,
                priority: '1',
                studyId: '',
            };
            const layout = {
                x: 4,
                y: 1,
                w: 1,
                h: 1,
            };
            const focusedChartMeta = {
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: 'test',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: false,
                priority: 1,
            };
            const focusedChartDimension = { w: 2, h: 2 };
            const cols = 5;
            const newLayout = calculateNewLayoutForFocusedChart(
                layout,
                focusedChartMeta,
                cols,
                focusedChartDimension
            );
            assert.equal(newLayout.i, 'test');
            assert.equal(newLayout.x, 3);
            assert.equal(newLayout.y, 1);
            assert.equal(newLayout.w, 2);
            assert.equal(newLayout.h, 2);
            assert.equal(newLayout.isResizable, true);
        });

        it('should return the fixed x, previous y, and new chartMeta dimension for the shrunk chart', () => {
            const clinicalAttr: ClinicalAttribute = {
                clinicalAttributeId: 'test',
                datatype: 'STRING',
                description: '',
                displayName: '',
                patientAttribute: true,
                priority: '1',
                studyId: '',
            };
            const layout = {
                x: 1,
                y: 1,
                w: 2,
                h: 2,
            };
            const focusedChartMeta = {
                clinicalAttribute: clinicalAttr,
                displayName: clinicalAttr.displayName,
                description: clinicalAttr.description,
                uniqueKey: 'test',
                dataType: ChartMetaDataTypeEnum.CLINICAL,
                patientAttribute: clinicalAttr.patientAttribute,
                renderWhenDataChange: false,
                priority: 1,
            };
            const focusedChartDimension = { w: 1, h: 1 };
            const cols = 5;
            const newLayout = calculateNewLayoutForFocusedChart(
                layout,
                focusedChartMeta,
                cols,
                focusedChartDimension
            );
            assert.equal(newLayout.i, 'test');
            assert.equal(newLayout.x, 2);
            assert.equal(newLayout.y, 1);
            assert.equal(newLayout.w, 1);
            assert.equal(newLayout.h, 1);
            assert.equal(newLayout.isResizable, true);
        });
    });

    describe('generateMatrixByLayout', () => {
        it('should return the generated matrix', () => {
            const layout = {
                i: 'test',
                x: 1,
                y: 1,
                w: 1,
                h: 1,
                isResizable: true,
            };
            const cols = 5;
            const matrix = generateMatrixByLayout(layout, cols);
            for (let i = 0; i < matrix.length; i++) {
                for (let j = 0; j < cols; j++) {
                    if (i === 1 && j === 1) {
                        assert.equal(matrix[i][j], 'test');
                        break;
                    }
                    assert.equal(matrix[i][j], '');
                }
            }
        });
    });

    describe('isFocusedChartShrunk', () => {
        const largeDimension = { w: 2, h: 2 };
        const smallDimension = { w: 1, h: 1 };
        it('should return true if the chart shrunk', () => {
            assert.equal(
                isFocusedChartShrunk(largeDimension, smallDimension),
                true
            );
        });
        it('should return false if the chart not shrunk', () => {
            assert.equal(
                isFocusedChartShrunk(smallDimension, largeDimension),
                false
            );
        });
        it('should return false if the dimension is not changed', () => {
            assert.equal(
                isFocusedChartShrunk(smallDimension, smallDimension),
                false
            );
            assert.equal(
                isFocusedChartShrunk(largeDimension, largeDimension),
                false
            );
        });
    });

    const layoutForPositionTest = [
        {
            i: 'test',
            x: 1,
            y: 1,
            w: 1,
            h: 1,
        } as Layout,
    ];

    describe('getPositionXByUniqueKey', () => {
        it('should return undefined for the not exist uniqueKey', () => {
            assert.equal(
                getPositionXByUniqueKey(layoutForPositionTest, 'test1'),
                undefined
            );
            assert.equal(getPositionXByUniqueKey([], 'test'), undefined);
            assert.equal(getPositionXByUniqueKey([], ''), undefined);
        });
        it('should return the X value of the layout which matches the uniqueKey', () => {
            assert.equal(
                getPositionXByUniqueKey(layoutForPositionTest, 'test'),
                1
            );
        });
    });

    describe('getPositionYByUniqueKey', () => {
        it('should return undefined for the not exist uniqueKey', () => {
            assert.equal(
                getPositionYByUniqueKey(layoutForPositionTest, 'test1'),
                undefined
            );
            assert.equal(getPositionYByUniqueKey([], 'test'), undefined);
            assert.equal(getPositionYByUniqueKey([], ''), undefined);
        });
        it('should return the Y value of the layout which matches the uniqueKey', () => {
            assert.equal(
                getPositionYByUniqueKey(layoutForPositionTest, 'test'),
                1
            );
        });
    });

    describe('getStudyViewTabId', () => {
        it('gets study view tab id correctly', () => {
            assert.equal(getStudyViewTabId('study'), undefined);
            assert.equal(getStudyViewTabId('study/'), undefined);
            assert.equal(getStudyViewTabId('study/asdf'), 'asdf' as any);
            assert.equal(
                getStudyViewTabId('study/summary'),
                StudyViewPageTabKeyEnum.SUMMARY
            );
            assert.equal(
                getStudyViewTabId('study/summary/'),
                StudyViewPageTabKeyEnum.SUMMARY
            );
        });
    });

    describe('customBinsAreValid', () => {
        it('If the bins have string, it should be invalid', () => {
            assert.isTrue(!customBinsAreValid(['1', 'test']));
        });
        it('If there is no bin defined, it should be invalid', () => {
            assert.isTrue(!customBinsAreValid([]));
        });
        it('Test a valid bin', () => {
            assert.isTrue(customBinsAreValid(['1', '2']));
        });
    });

    describe('formatRange', () => {
        it('should format min max range with no special value', () => {
            const actual = formatRange(1.5, 2.5, undefined);
            const expected = '(1.5, 2.5]';
            assert.equal(actual, expected);
        });

        it('should format min max range with special value', () => {
            const actual = formatRange(1, 2, 'Foo ');
            const expected = 'Foo 1-2';

            assert.equal(actual, expected);
        });

        it('should format min range with special value', () => {
            const acutal = formatRange(1, undefined, '<=');
            const expected = '≤1';

            assert.equal(acutal, expected);
        });

        it('should format max range with special value', () => {
            const actual = formatRange(undefined, 2, '>=');
            const expected = '≥2';

            assert.equal(actual, expected);
        });

        it('should format min max range where min = max', () => {
            const actual = formatRange(10, 10, undefined);
            const expected = '10';

            assert.equal(actual, expected);
        });
    });

    describe('getBinName', () => {
        it('should return correct bin name', () => {
            assert.equal(getBinName({ specialValue: 'NA' } as any), 'NA');
            assert.equal(getBinName({ start: 10, end: 20 } as any), '10-20');
            assert.equal(
                getBinName({ start: 10, specialValue: '<=' } as any),
                '<=10'
            );
            assert.equal(
                getBinName({ specialValue: '>', end: 20 } as any),
                '>20'
            );
        });
    });

    describe('getGroupedClinicalDataByBins', () => {
        let clinicalData = [
            {
                patientId: 'patient1',
                sampleId: 'sample1',
                studyId: 'study1',
                uniquePatientKey: 'patient1',
                value: 10,
            },
            {
                patientId: 'patient2',
                sampleId: 'sample2',
                studyId: 'study1',
                uniquePatientKey: 'patient2',
                value: 11,
            },
            {
                patientId: 'patient3',
                sampleId: 'sample3',
                studyId: 'study1',
                uniquePatientKey: 'patient3',
                value: 20,
            },
            {
                patientId: 'patient4',
                sampleId: 'sample4',
                studyId: 'study1',
                uniquePatientKey: 'patient4',
                value: 30,
            },
            {
                patientId: 'patient5',
                sampleId: 'sample5',
                studyId: 'study1',
                uniquePatientKey: 'patient5',
                value: 40,
            },
            {
                patientId: 'patient6',
                sampleId: 'sample6',
                studyId: 'study1',
                uniquePatientKey: 'patient6',
                value: 45,
            },
            {
                patientId: 'patient7',
                sampleId: 'sample7',
                studyId: 'study1',
                uniquePatientKey: 'patient7',
                value: 'NA',
            },
        ];

        let dataBins = [
            {
                end: 10,
                specialValue: '<=',
            },
            {
                start: 10,
                end: 20,
            },
            {
                start: 20,
                end: 40,
            },
            {
                start: 40,
                specialValue: '>',
            },
            {
                specialValue: 'NA',
            },
        ];

        it('should return grouped clinicalData by bins', () => {
            assert.deepEqual(
                getGroupedClinicalDataByBins(
                    clinicalData as any,
                    dataBins as any
                ),
                {
                    '<=10': [
                        {
                            patientId: 'patient1',
                            sampleId: 'sample1',
                            studyId: 'study1',
                            uniquePatientKey: 'patient1',
                            value: 10,
                        },
                    ],
                    '10-20': [
                        {
                            patientId: 'patient2',
                            sampleId: 'sample2',
                            studyId: 'study1',
                            uniquePatientKey: 'patient2',
                            value: 11,
                        },
                        {
                            patientId: 'patient3',
                            sampleId: 'sample3',
                            studyId: 'study1',
                            uniquePatientKey: 'patient3',
                            value: 20,
                        },
                    ],
                    '20-40': [
                        {
                            patientId: 'patient4',
                            sampleId: 'sample4',
                            studyId: 'study1',
                            uniquePatientKey: 'patient4',
                            value: 30,
                        },
                        {
                            patientId: 'patient5',
                            sampleId: 'sample5',
                            studyId: 'study1',
                            uniquePatientKey: 'patient5',
                            value: 40,
                        },
                    ],
                    '>40': [
                        {
                            patientId: 'patient6',
                            sampleId: 'sample6',
                            studyId: 'study1',
                            uniquePatientKey: 'patient6',
                            value: 45,
                        },
                    ],
                    NA: [
                        {
                            patientId: 'patient7',
                            sampleId: 'sample7',
                            studyId: 'study1',
                            uniquePatientKey: 'patient7',
                            value: 'NA',
                        },
                    ],
                } as any
            );
        });
    });

    describe('updateChartIds', () => {
        const chartSetting1: ChartUserSetting = {
            id: 'SAMPLE_CANCER_TYPE',
            chartType: 'PIE_CHART',
            layout: {
                x: 0,
                y: 0,
                w: 1,
                h: 1,
            },
            patientAttribute: false,
        };
        const chartSetting2: ChartUserSetting = {
            id: 'SAMPLE_SAMPLE_TYPE',
            chartType: 'PIE_CHART',
            layout: {
                x: 0,
                y: 0,
                w: 1,
                h: 1,
            },
            patientAttribute: false,
        };

        it('should return correct chart settings', () => {
            assert.deepEqual(
                updateSavedUserPreferenceChartIds([chartSetting1]),
                [{ ...chartSetting1, id: 'CANCER_TYPE' }]
            );
            assert.deepEqual(
                updateSavedUserPreferenceChartIds([
                    { ...chartSetting1, id: 'CANCER_TYPE' },
                ]),
                [{ ...chartSetting1, id: 'CANCER_TYPE' }]
            );
            assert.deepEqual(
                updateSavedUserPreferenceChartIds([
                    chartSetting1,
                    chartSetting2,
                ]),
                [
                    { ...chartSetting1, id: 'CANCER_TYPE' },
                    { ...chartSetting2, id: 'SAMPLE_TYPE' },
                ]
            );
            assert.deepEqual(
                updateSavedUserPreferenceChartIds([
                    { ...chartSetting1, id: 'CANCER_TYPE' },
                    { ...chartSetting2, id: 'SAMPLE_TYPE' },
                ]),
                [
                    { ...chartSetting1, id: 'CANCER_TYPE' },
                    { ...chartSetting2, id: 'SAMPLE_TYPE' },
                ]
            );
        });
    });

    describe('geneFilterQuery and OQL conversion', () => {
        it('converts simple gene filter to OQL', () => {
            assert.strictEqual(
                'BRCA1',
                geneFilterQueryToOql({
                    hugoGeneSymbol: 'BRCA1',
                    entrezGeneId: 0,
                    alterations: [],
                    includeDriver: true,
                    includeVUS: true,
                    includeUnknownOncogenicity: true,
                    tiersBooleanMap: {},
                    includeUnknownTier: true,
                    includeGermline: true,
                    includeSomatic: true,
                    includeUnknownStatus: true,
                })
            );
        });
        it('adds CNA alterations to OQL', () => {
            assert.strictEqual(
                'BRCA1:AMP HETLOSS',
                geneFilterQueryToOql({
                    hugoGeneSymbol: 'BRCA1',
                    entrezGeneId: 0,
                    alterations: ['AMP', 'HETLOSS'],
                    includeDriver: true,
                    includeVUS: true,
                    includeUnknownOncogenicity: true,
                    tiersBooleanMap: [],
                    includeUnknownTier: true,
                    includeGermline: true,
                    includeSomatic: true,
                    includeUnknownStatus: true,
                })
            );
        });
        it('creates simple gene filter from OQL', () => {
            assert.deepEqual(
                {
                    hugoGeneSymbol: 'BRCA1',
                    entrezGeneId: 0,
                    alterations: [],
                    includeDriver: true,
                    includeVUS: true,
                    includeUnknownOncogenicity: true,
                    tiersBooleanMap: {},
                    includeUnknownTier: true,
                    includeGermline: true,
                    includeSomatic: true,
                    includeUnknownStatus: true,
                },
                geneFilterQueryFromOql('BRCA1')
            );
        });
        it('creates simple gene filter with CNA alterations from OQL', () => {
            assert.deepEqual(
                {
                    hugoGeneSymbol: 'BRCA1',
                    entrezGeneId: 0,
                    alterations: ['AMP', 'HETLOSS'],
                    includeDriver: true,
                    includeVUS: true,
                    includeUnknownOncogenicity: true,
                    tiersBooleanMap: {},
                    includeUnknownTier: true,
                    includeGermline: true,
                    includeSomatic: true,
                    includeUnknownStatus: true,
                },
                geneFilterQueryFromOql('BRCA1: AMP HETLOSS ')
            );
        });
        it('explicit false overrides default true for boolean fields', () => {
            const result = geneFilterQueryFromOql(
                'BRCA1',
                false,
                false,
                false,
                undefined,
                false,
                false,
                false,
                false
            );
            assert.isFalse(result.includeDriver);
            assert.isFalse(result.includeVUS);
            assert.isFalse(result.includeUnknownOncogenicity);
            assert.isFalse(result.includeUnknownTier);
            assert.isFalse(result.includeGermline);
            assert.isFalse(result.includeSomatic);
            assert.isFalse(result.includeUnknownStatus);
        });
        it('explicit tiersBooleanMap overrides default empty map', () => {
            const tiers = { tier1: true, tier2: false };
            const result = geneFilterQueryFromOql(
                'BRCA1',
                undefined,
                undefined,
                undefined,
                tiers
            );
            assert.deepEqual(result.tiersBooleanMap, tiers);
        });
    });

    describe('annotationFilterActive', () => {
        it('false when all excluded', () => {
            assert.isFalse(annotationFilterActive(false, false, false));
        });
        it('false when all included', () => {
            assert.isFalse(annotationFilterActive(true, true, true));
        });

        it('true when only single annotation type included', () => {
            assert(annotationFilterActive(false, true, false));
        });
    });

    describe('tierFilterActive', () => {
        it('false when all tier types included', () => {
            assert.isFalse(driverTierFilterActive({ tier1: true }, true));
        });
        it('false when all tier types excluded', () => {
            assert.isFalse(driverTierFilterActive({ tier1: false }, false));
        });
        it('true when single tier not selected', () => {
            assert(driverTierFilterActive({ tier1: true, tier2: false }, true));
        });
        it('true when unkown tier not selected', () => {
            assert(driverTierFilterActive({ tier1: true, tier2: true }, false));
        });
    });

    describe('statusFilterActive', () => {
        it('false when all mutation status included', () => {
            assert.isFalse(statusFilterActive(true, true, true));
        });
        it('false when all mutation status excluded', () => {
            assert.isFalse(statusFilterActive(false, false, false));
        });
        it('false when single mutation status included', () => {
            assert(statusFilterActive(false, true, false));
        });
    });

    describe('getNonZeroUniqueBins', () => {
        const noBinDistinct = [
            { start: 10, end: 20 },
            { start: 20, end: 30 },
            { start: 30, end: 40 },
            { start: 40, end: 50 },
        ] as DataBin[];

        const everyBinDistinct = [
            { start: 0, end: 0 },
            { start: 10, end: 10 },
            { start: 20, end: 20 },
            { start: 30, end: 30 },
        ] as DataBin[];

        const someBinsDistinct = [
            { start: 0, end: 0 },
            { start: 10, end: 10 },
            { start: 20, end: 30 },
            { start: 30, end: 40 },
        ] as DataBin[];

        it('should return correct non zero unique bins', () => {
            assert.deepEqual(getNonZeroUniqueBins(noBinDistinct), [
                10,
                20,
                30,
                40,
                50,
            ]);
            assert.deepEqual(getNonZeroUniqueBins(everyBinDistinct), [
                10,
                20,
                30,
            ]);
            assert.deepEqual(getNonZeroUniqueBins(someBinsDistinct), [
                10,
                20,
                30,
                40,
            ]);
        });
    });

    describe('getPatientIdentifiers', () => {
        it('should return all identifiers for 1 group and 1 study', () => {
            const groups = [
                {
                    studies: [
                        {
                            id: 'S01',
                            samples: [],
                            patients: ['P01', 'P02', 'P03'],
                        },
                    ],
                },
            ];

            const actual = getPatientIdentifiers(groups);
            const expected = [
                { studyId: 'S01', patientId: 'P01' },
                { studyId: 'S01', patientId: 'P02' },
                { studyId: 'S01', patientId: 'P03' },
            ];

            assert.deepEqual(actual.sort(), expected.sort());
        });

        it('should return all identifiers for 1 group and 2 studies', () => {
            const groups = [
                {
                    studies: [
                        {
                            id: 'S01',
                            samples: [],
                            patients: ['P01', 'P02', 'P03'],
                        },
                        {
                            id: 'S02',
                            samples: [],
                            patients: ['P01', 'P02', 'P03'],
                        },
                    ],
                },
            ];

            const actual = getPatientIdentifiers(groups);
            const expected = [
                { studyId: 'S01', patientId: 'P01' },
                { studyId: 'S01', patientId: 'P02' },
                { studyId: 'S01', patientId: 'P03' },
                { studyId: 'S02', patientId: 'P01' },
                { studyId: 'S02', patientId: 'P02' },
                { studyId: 'S02', patientId: 'P03' },
            ];

            assert.deepEqual(actual.sort(), expected.sort());
        });

        it('should return all identifiers for 2 groups and 3 studies', () => {
            const groups = [
                {
                    studies: [
                        {
                            id: 'S01',
                            samples: [],
                            patients: ['P01', 'P02', 'P03'],
                        },
                        {
                            id: 'S02',
                            samples: [],
                            patients: ['P01', 'P02', 'P03'],
                        },
                    ],
                },
                {
                    studies: [
                        {
                            id: 'S01',
                            samples: [],
                            patients: ['P01', 'P02', 'P03'],
                        },
                        {
                            id: 'S03',
                            samples: [],
                            patients: ['P01', 'P02', 'P03'],
                        },
                    ],
                },
            ];

            const actual = getPatientIdentifiers(groups);
            const expected = [
                { studyId: 'S01', patientId: 'P01' },
                { studyId: 'S01', patientId: 'P02' },
                { studyId: 'S01', patientId: 'P03' },
                { studyId: 'S02', patientId: 'P01' },
                { studyId: 'S02', patientId: 'P02' },
                { studyId: 'S02', patientId: 'P03' },
                { studyId: 'S03', patientId: 'P01' },
                { studyId: 'S03', patientId: 'P02' },
                { studyId: 'S03', patientId: 'P03' },
            ];

            assert.deepEqual(actual.sort(), expected.sort());
        });
    });

    describe('getFilteredMolecularProfilesByAlterationType', () => {
        const studyIdToMolecularProfiles: any = {
            study_1: [
                {
                    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
                    datatype: 'DISCRETE',
                    molecularProfileId: 'study_1_cna',
                    studyId: 'study_1',
                },
            ],
            study_2: [
                {
                    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
                    datatype: 'DISCRETE',
                    molecularProfileId: 'study_2_cna',
                    studyId: 'study_2',
                },
            ],
            study_3: [
                {
                    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
                    datatype: 'LOG2-VALUE',
                    molecularProfileId: 'study_3_log2_cna',
                    studyId: 'study_3',
                },
            ],
        };
        it('filter profiles by alteration type', () => {
            const result = [
                {
                    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
                    datatype: 'DISCRETE',
                    molecularProfileId: 'study_1_cna',
                    studyId: 'study_1',
                },
                {
                    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
                    datatype: 'DISCRETE',
                    molecularProfileId: 'study_2_cna',
                    studyId: 'study_2',
                },
                {
                    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
                    datatype: 'LOG2-VALUE',
                    molecularProfileId: 'study_3_log2_cna',
                    studyId: 'study_3',
                },
            ];
            assert.deepEqual(
                getFilteredMolecularProfilesByAlterationType(
                    studyIdToMolecularProfiles,
                    AlterationTypeConstants.COPY_NUMBER_ALTERATION
                ),
                result
            );
        });
        it('filter profiles by alteration type, also filte by allowed data types', () => {
            const result = [
                {
                    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
                    datatype: 'DISCRETE',
                    molecularProfileId: 'study_1_cna',
                    studyId: 'study_1',
                },
                {
                    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
                    datatype: 'DISCRETE',
                    molecularProfileId: 'study_2_cna',
                    studyId: 'study_2',
                },
            ];
            assert.deepEqual(
                getFilteredMolecularProfilesByAlterationType(
                    studyIdToMolecularProfiles,
                    AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                    [DataTypeConstants.DISCRETE]
                ),
                result
            );
        });
    });

    describe('Create object for group comparison custom numerical data', () => {
        it('transform sample data to clinical data ', function() {
            const sampleData = [
                {
                    patientId: 'TCGA-Test-Patient1',
                    sampleId: 'TCGA-Test-Sample1',
                    studyId: 'TCGA-Test',
                    value: '3',
                } as CustomChartIdentifierWithValue,
                {
                    patientId: 'TCGA-Test-Patient2',
                    sampleId: 'TCGA-Test-Sample2',
                    studyId: 'TCGA-Test',
                    value: '1',
                } as CustomChartIdentifierWithValue,
                {
                    patientId: 'TCGA-Test-Patient3',
                    sampleId: 'TCGA-Test-Sample3',
                    studyId: 'TCGA-Test',
                    value: '4',
                } as CustomChartIdentifierWithValue,
                {
                    patientId: 'TCGA-Test-Patient4',
                    sampleId: 'TCGA-Test-Sample4',
                    studyId: 'TCGA-Test',
                    value: '3',
                } as CustomChartIdentifierWithValue,
            ];

            const selectedSamples = [
                {
                    patientId: 'TCGA-Test-Patient1',
                    sampleId: 'TCGA-Test-Sample1',
                    studyId: 'TCGA-Test',
                    uniquePatientKey: '124Axce343',
                    uniqueSampleKey: '12cvgt4gv',
                } as Sample,
                {
                    patientId: 'TCGA-Test-Patient2',
                    sampleId: 'TCGA-Test-Sample2',
                    studyId: 'TCGA-Test',
                    uniquePatientKey: '349bvdmas',
                    uniqueSampleKey: '21cax68m4c',
                } as Sample,
            ];

            const clinicalAttributeTest = {
                clinicalAttributeId: '640882e01bf4f517ddb3a261',
                datatype: 'NUMBER',
                description: 'Test data',
                displayName: 'Test data',
                patientAttribute: false,
                priority: '0',
                studyId: 'TCGA-test',
            } as ClinicalAttribute;

            const outputObject = [
                {
                    clinicalAttribute: clinicalAttributeTest,
                    clinicalAttributeId:
                        clinicalAttributeTest.clinicalAttributeId,
                    patientId: 'TCGA-Test-Patient1',
                    sampleId: 'TCGA-Test-Sample1',
                    studyId: 'TCGA-Test',
                    uniquePatientKey: '124Axce343',
                    uniqueSampleKey: '12cvgt4gv',
                    value: '3',
                } as ClinicalData,
                {
                    clinicalAttribute: clinicalAttributeTest,
                    clinicalAttributeId:
                        clinicalAttributeTest.clinicalAttributeId,
                    patientId: 'TCGA-Test-Patient2',
                    sampleId: 'TCGA-Test-Sample2',
                    studyId: 'TCGA-Test',
                    uniquePatientKey: '349bvdmas',
                    uniqueSampleKey: '21cax68m4c',
                    value: '1',
                } as ClinicalData,
            ];
            let result = transformSampleDataToSelectedSampleClinicalData(
                sampleData,
                selectedSamples,
                clinicalAttributeTest
            );
            assert.deepEqual(result, outputObject);
        });
    });

    describe('oqlQueryToGene1Gene2Representation', () => {
        it.each([
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            alteration_type: STUCTVARDownstreamFusionStr,
                            gene: 'B',
                        },
                    ],
                } as SingleGeneQuery,
                [{ gene1HugoSymbolOrOql: 'A', gene2HugoSymbolOrOql: 'B' }],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            alteration_type: STUCTVARUpstreamFusionStr,
                            gene: 'B',
                        },
                    ],
                } as SingleGeneQuery,
                [{ gene1HugoSymbolOrOql: 'B', gene2HugoSymbolOrOql: 'A' }],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            alteration_type: STUCTVARDownstreamFusionStr,
                            gene: 'B',
                        },
                        {
                            alteration_type: STUCTVARUpstreamFusionStr,
                            gene: 'B',
                        },
                    ],
                } as SingleGeneQuery,
                [
                    { gene1HugoSymbolOrOql: 'A', gene2HugoSymbolOrOql: 'B' },
                    { gene1HugoSymbolOrOql: 'B', gene2HugoSymbolOrOql: 'A' },
                ],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            alteration_type: STUCTVARDownstreamFusionStr,
                            gene: STRUCTVARAnyGeneStr,
                        },
                    ],
                } as SingleGeneQuery,
                [
                    {
                        gene1HugoSymbolOrOql: 'A',
                        gene2HugoSymbolOrOql: STRUCTVARAnyGeneStr,
                    },
                ],
            ],
            [
                {
                    gene: 'A',
                    alterations: [
                        {
                            alteration_type: STUCTVARDownstreamFusionStr,
                            gene: STRUCTVARNullGeneStr,
                        },
                    ],
                } as SingleGeneQuery,
                [
                    {
                        gene1HugoSymbolOrOql: 'A',
                        gene2HugoSymbolOrOql: STRUCTVARNullGeneStr,
                    },
                ],
            ],
        ])(
            'should convert oql query to gene1/gene2 representation',
            (oqlQuery, expected) => {
                assert.deepEqual(
                    expected,
                    oqlQueryToStructVarGenePair(oqlQuery)
                );
            }
        );
    });

    describe('ensureBackwardCompatibilityOfFilters', () => {
        describe('geneFilters', () => {
            it('converts legacy string gene queries to GeneFilterQuery objects', () => {
                const filters: any = {
                    geneFilters: [{ geneQueries: [['BRCA1']] }],
                };
                const result = ensureBackwardCompatibilityOfFilters(filters);
                assert.deepEqual(result.geneFilters![0].geneQueries[0][0], {
                    ...GENE_FILTER_QUERY_DEFAULTS,
                    hugoGeneSymbol: 'BRCA1',
                });
            });

            it('fills in missing fields with defaults for existing GeneFilterQuery objects', () => {
                const partial: any = {
                    hugoGeneSymbol: 'TP53',
                    entrezGeneId: 7157,
                };
                const filters: any = {
                    geneFilters: [{ geneQueries: [[partial]] }],
                };
                const result = ensureBackwardCompatibilityOfFilters(filters);
                const query = result.geneFilters![0].geneQueries[0][0];
                assert.equal(query.hugoGeneSymbol, 'TP53');
                assert.equal(query.entrezGeneId, 7157);
                assert.isTrue(query.includeDriver);
                assert.isTrue(query.includeGermline);
                assert.deepEqual(query.tiersBooleanMap, {});
            });

            it('preserves explicit false values in GeneFilterQuery objects', () => {
                const withFalse: any = {
                    hugoGeneSymbol: 'KRAS',
                    entrezGeneId: 0,
                    includeDriver: false,
                    includeVUS: false,
                };
                const filters: any = {
                    geneFilters: [{ geneQueries: [[withFalse]] }],
                };
                const result = ensureBackwardCompatibilityOfFilters(filters);
                const query = result.geneFilters![0].geneQueries[0][0];
                assert.isFalse(query.includeDriver);
                assert.isFalse(query.includeVUS);
            });
        });

        describe('structuralVariantFilters', () => {
            it('fills in missing fields with defaults', () => {
                const partial: any = {
                    gene1Query: { hugoSymbol: 'ALK' },
                    gene2Query: { hugoSymbol: 'EML4' },
                };
                const filters: any = {
                    structuralVariantFilters: [
                        { structVarQueries: [[partial]] },
                    ],
                };
                const result = ensureBackwardCompatibilityOfFilters(filters);
                const query = result.structuralVariantFilters![0]
                    .structVarQueries[0][0];
                assert.isTrue(query.includeDriver);
                assert.isTrue(query.includeGermline);
                assert.isTrue(query.includeSomatic);
                assert.deepEqual(query.tiersBooleanMap, {});
            });

            it('preserves explicit false values', () => {
                const withFalse: any = {
                    gene1Query: { hugoSymbol: 'ALK' },
                    gene2Query: { hugoSymbol: 'EML4' },
                    includeGermline: false,
                    includeSomatic: false,
                };
                const filters: any = {
                    structuralVariantFilters: [
                        { structVarQueries: [[withFalse]] },
                    ],
                };
                const result = ensureBackwardCompatibilityOfFilters(filters);
                const query = result.structuralVariantFilters![0]
                    .structVarQueries[0][0];
                assert.isFalse(query.includeGermline);
                assert.isFalse(query.includeSomatic);
                assert.isTrue(query.includeDriver);
            });
        });

        describe('alterationFilter', () => {
            it('fills in missing fields with defaults from ALTERATION_FILTER_DEFAULTS', () => {
                const filters: any = {
                    alterationFilter: {},
                };
                const result = ensureBackwardCompatibilityOfFilters(filters);
                assert.deepEqual(
                    result.alterationFilter,
                    ALTERATION_FILTER_DEFAULTS
                );
            });

            it('preserves explicit false values', () => {
                const filters: any = {
                    alterationFilter: {
                        includeDriver: false,
                        includeGermline: false,
                    },
                };
                const result = ensureBackwardCompatibilityOfFilters(filters);
                assert.isFalse(result.alterationFilter!.includeDriver);
                assert.isFalse(result.alterationFilter!.includeGermline);
                assert.isTrue(result.alterationFilter!.includeVUS);
            });

            it('preserves explicit copyNumberAlterationEventTypes override', () => {
                const filters: any = {
                    alterationFilter: {
                        copyNumberAlterationEventTypes: {
                            AMP: true,
                            HOMDEL: false,
                        },
                    },
                };
                const result = ensureBackwardCompatibilityOfFilters(filters);
                assert.deepEqual(
                    result.alterationFilter!.copyNumberAlterationEventTypes,
                    { AMP: true, HOMDEL: false }
                );
            });
        });
    });
});
