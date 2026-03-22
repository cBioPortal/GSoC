import { assert } from 'chai';
import {
    calculateExpressionTendency,
    formatPercentage,
    getAlterationScatterData,
    getExpressionScatterData,
    getAlterationRowData,
    getExpressionRowData,
    getFilteredData,
    getBarChartTooltipContent,
    getAlterationsTooltipContent,
    getAlterationEnrichmentColumns,
    getEnrichmentBarPlotData,
    getGeneListOptions,
    pickGenericAssayEnrichmentProfiles,
    ContinousDataPvalueTooltip,
} from './EnrichmentsUtil';
import expect from 'expect';
import expectJSX from 'expect-jsx';
import _ from 'lodash';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { render } from '@testing-library/react';
import React from 'react';

expect.extend(expectJSX);

const exampleAlterationEnrichments = [
    {
        entrezGeneId: 1956,
        hugoGeneSymbol: 'EGFR',
        cytoband: '7p11.2',
        counts: [
            {
                alteredCount: 3,
                name: 'altered group',
                profiledCount: 4,
            },
            {
                alteredCount: 0,
                name: 'unaltered group',
                profiledCount: 4,
            },
        ],
        pValue: 0.00003645111904935468,
        qValue: 0.2521323904643863,
    },
    {
        entrezGeneId: 6468,
        hugoGeneSymbol: 'FBXW4',
        cytoband: '10q24.32',
        counts: [
            {
                alteredCount: 2,
                name: 'altered group',
                profiledCount: 4,
            },
            {
                alteredCount: 0,
                name: 'unaltered group',
                profiledCount: 4,
            },
        ],
        pValue: 0.0015673981191222392,
        qValue: 0.9385345997286061,
    },
    {
        entrezGeneId: 23066,
        hugoGeneSymbol: 'CAND2',
        cytoband: '3p25.2',
        counts: [
            {
                alteredCount: 2,
                name: 'altered group',
                profiledCount: 4,
            },
            {
                alteredCount: 0,
                name: 'unaltered group',
                profiledCount: 4,
            },
        ],
        pValue: 0.0015673981191222392,
        qValue: 0.9385345997286061,
    },
];

const exampleAlterationEnrichmentRowData = [
    {
        checked: true,
        disabled: true,
        entrezGeneId: 1956,
        hugoGeneSymbol: 'EGFR',
        cytoband: '7p11.2',
        groupsSet: {
            'altered group': {
                name: 'altered group',
                alteredCount: 3,
                profiledCount: 4,
                alteredPercentage: 75,
            },
            'unaltered group': {
                name: 'unaltered group',
                alteredCount: 0,
                profiledCount: 4,
                alteredPercentage: 0,
            },
        },
        logRatio: Infinity,
        pValue: 0.00003645111904935468,
        qValue: 0.2521323904643863,
        value: undefined,
        enrichedGroup: 'altered group',
    },
    {
        checked: false,
        disabled: false,
        entrezGeneId: 6468,
        hugoGeneSymbol: 'FBXW4',
        cytoband: '10q24.32',
        groupsSet: {
            'altered group': {
                name: 'altered group',
                alteredCount: 2,
                profiledCount: 4,
                alteredPercentage: 50,
            },
            'unaltered group': {
                name: 'unaltered group',
                alteredCount: 0,
                profiledCount: 4,
                alteredPercentage: 0,
            },
        },
        logRatio: Infinity,
        pValue: 0.0015673981191222392,
        qValue: 0.9385345997286061,
        value: undefined,
        enrichedGroup: 'altered group',
    },
    {
        checked: false,
        disabled: false,
        entrezGeneId: 23066,
        hugoGeneSymbol: 'CAND2',
        cytoband: '3p25.2',
        groupsSet: {
            'altered group': {
                name: 'altered group',
                alteredCount: 2,
                profiledCount: 4,
                alteredPercentage: 50,
            },
            'unaltered group': {
                name: 'unaltered group',
                alteredCount: 0,
                profiledCount: 4,
                alteredPercentage: 0,
            },
        },
        logRatio: Infinity,
        pValue: 0.0015673981191222392,
        qValue: 0.9385345997286061,
        value: undefined,
        enrichedGroup: 'altered group',
    },
];

const exampleExpressionEnrichments = [
    {
        entrezGeneId: 25979,
        hugoGeneSymbol: 'DHRS7B',
        cytoband: '17p11.2',
        groupsStatistics: [
            {
                meanExpression: 8.797111512335256,
                name: 'altered group',
                standardDeviation: 0.09305770504332485,
            },
            {
                meanExpression: 9.548546748530768,
                name: 'unaltered group',
                standardDeviation: 0.5899774772149077,
            },
        ],
        pValue: 1.9359580614715825e-9,
        qValue: 0.000024032306741578182,
    },
    {
        entrezGeneId: 5774,
        hugoGeneSymbol: 'PTPN3',
        cytoband: '9q31.3',
        groupsStatistics: [
            {
                meanExpression: 8.973330136818843,
                name: 'altered group',
                standardDeviation: 0.15386396864659846,
            },
            {
                meanExpression: 7.599637956820568,
                name: 'unaltered group',
                standardDeviation: 1.5212548411382572,
            },
        ],
        pValue: 3.698700537372556e-9,
        qValue: 0.000024032306741578182,
    },
    {
        entrezGeneId: 2049,
        hugoGeneSymbol: 'EPHB3',
        cytoband: '3q27.1',
        groupsStatistics: [
            {
                meanExpression: 8.082947701098236,
                name: 'altered group',
                standardDeviation: 0.33113816397794055,
            },
            {
                meanExpression: 5.430662108616908,
                name: 'unaltered group',
                standardDeviation: 1.8406977746799924,
            },
        ],
        pValue: 5.631839749745262e-9,
        qValue: 0.000024395252515979897,
    },
];

const exampleExpressionEnrichmentRowData = [
    {
        checked: false,
        disabled: false,
        entrezGeneId: 25979,
        hugoGeneSymbol: 'DHRS7B',
        cytoband: '17p11.2',
        groupsSet: {
            'altered group': {
                meanExpression: 8.797111512335256,
                name: 'altered group',
                standardDeviation: 0.09305770504332485,
            },
            'unaltered group': {
                meanExpression: 9.548546748530768,
                name: 'unaltered group',
                standardDeviation: 0.5899774772149077,
            },
        },
        logRatio: -0.7514352361955119,
        pValue: 1.9359580614715825e-9,
        qValue: 0.000024032306741578182,
        enrichedGroup: 'unaltered group',
    },
    {
        checked: false,
        disabled: false,
        entrezGeneId: 5774,
        hugoGeneSymbol: 'PTPN3',
        cytoband: '9q31.3',
        groupsSet: {
            'altered group': {
                meanExpression: 8.973330136818843,
                name: 'altered group',
                standardDeviation: 0.15386396864659846,
            },
            'unaltered group': {
                meanExpression: 7.599637956820568,
                name: 'unaltered group',
                standardDeviation: 1.5212548411382572,
            },
        },
        logRatio: 1.373692179998275,
        pValue: 3.698700537372556e-9,
        qValue: 0.000024032306741578182,
        enrichedGroup: 'altered group',
    },
    {
        checked: false,
        disabled: false,
        entrezGeneId: 2049,
        hugoGeneSymbol: 'EPHB3',
        cytoband: '3q27.1',
        groupsSet: {
            'altered group': {
                meanExpression: 8.082947701098236,
                name: 'altered group',
                standardDeviation: 0.33113816397794055,
            },
            'unaltered group': {
                meanExpression: 5.430662108616908,
                name: 'unaltered group',
                standardDeviation: 1.8406977746799924,
            },
        },
        logRatio: 2.652285592481328,
        pValue: 5.631839749745262e-9,
        qValue: 0.000024395252515979897,
        enrichedGroup: 'altered group',
    },
];

const exampleAlterations = [
    {
        alterationSubType: 'missense',
        alterationType: 'MUTATION_EXTENDED',
        center: 'hgsc.bcm.edu;broad.mit.edu;ucsc.edu;bcgsc.ca;mdanderson.org',
        driverFilter: '',
        driverFilterAnnotation: '',
        driverTiersFilter: '',
        driverTiersFilterAnnotation: '',
        endPosition: 55224349,
        entrezGeneId: 1956,
        fisValue: 1.4013e-45,
        functionalImpactScore: '',
        gene: {
            entrezGeneId: 1956,
            hugoGeneSymbol: 'EGFR',
            type: 'protein-coding',
            cytoband: '7p11.2',
            length: 188307,
            chromosome: '7',
        },
        keyword: 'EGFR R377 missense',
        linkMsa: '',
        linkPdb: '',
        linkXvar: '',
        molecularProfileAlterationType: 'MUTATION_EXTENDED',
        molecularProfileId: 'acc_tcga_mutations',
        mutationStatus: 'Somatic',
        mutationType: 'Missense_Mutation',
        ncbiBuild: 'GRCh37',
        normalAltCount: 0,
        normalRefCount: 110,
        patientId: 'TCGA-OR-A5K0',
        proteinChange: 'R377K',
        proteinPosEnd: 377,
        proteinPosStart: 377,
        referenceAllele: 'G',
        refseqMrnaId: 'NM_005228.3',
        sampleId: 'TCGA-OR-A5K0-01',
        startPosition: 55224349,
        studyId: 'acc_tcga',
        tumorAltCount: 66,
        tumorRefCount: 53,
        uniquePatientKey: 'VENHQS1PUi1BNUswOmFjY190Y2dh',
        uniqueSampleKey: 'VENHQS1PUi1BNUswLTAxOmFjY190Y2dh',
        validationStatus: 'Untested',
        variantAllele: 'A',
        variantType: 'SNP',
    },
    {
        alterationSubType: 'amp',
        alterationType: 'COPY_NUMBER_ALTERATION',
        entrezGeneId: 1956,
        gene: {
            entrezGeneId: 1956,
            hugoGeneSymbol: 'EGFR',
            type: 'protein-coding',
            cytoband: '7p11.2',
            length: 188307,
        },
        molecularProfileAlterationType: 'COPY_NUMBER_ALTERATION',
        molecularProfileId: 'acc_tcga_gistic',
        patientId: 'TCGA-OR-A5LO',
        sampleId: 'TCGA-OR-A5LO-01',
        studyId: 'acc_tcga',
        uniquePatientKey: 'VENHQS1PUi1BNUxPOmFjY190Y2dh',
        uniqueSampleKey: 'VENHQS1PUi1BNUxPLTAxOmFjY190Y2dh',
        value: 2,
    },
];

const exampleBoxPlotScatterData = [
    {
        x: 1.922684807165747,
        y: 9.940678152790728,
        sampleId: 'TCGA-OR-A5J1-01',
        studyId: 'acc_tcga',
        alterations: '',
    },
    {
        x: 2.0781361505168783,
        y: 8.34481740339671,
        sampleId: 'TCGA-OR-A5J2-01',
        studyId: 'acc_tcga',
        alterations: '',
    },
    {
        x: 1.8867908893279546,
        y: 9.660310790006957,
        sampleId: 'TCGA-OR-A5J3-01',
        studyId: 'acc_tcga',
        alterations: '',
    },
];

const exampleMolecularData = [
    {
        entrezGeneId: 25979,
        gene: {
            geneticEntityId: 9829,
            entrezGeneId: 25979,
            hugoGeneSymbol: 'DHRS7B',
            type: 'protein-coding',
        },
        molecularProfileId: 'acc_tcga_rna_seq_v2_mrna',
        patientId: 'TCGA-OR-A5J1',
        sampleId: 'TCGA-OR-A5J1-01',
        studyId: 'acc_tcga',
        uniquePatientKey: 'VENHQS1PUi1BNUoxOmFjY190Y2dh',
        uniqueSampleKey: 'VENHQS1PUi1BNUoxLTAxOmFjY190Y2dh',
        value: 981.7483,
    },
    {
        entrezGeneId: 25979,
        gene: {
            geneticEntityId: 9829,
            entrezGeneId: 25979,
            hugoGeneSymbol: 'DHRS7B',
            type: 'protein-coding',
        },
        molecularProfileId: 'acc_tcga_rna_seq_v2_mrna',
        patientId: 'TCGA-OR-A5J2',
        sampleId: 'TCGA-OR-A5J2-01',
        studyId: 'acc_tcga',
        uniquePatientKey: 'VENHQS1PUi1BNUoyOmFjY190Y2dh',
        uniqueSampleKey: 'VENHQS1PUi1BNUoyLTAxOmFjY190Y2dh',
        value: 324.1175,
    },
    {
        entrezGeneId: 25979,
        gene: {
            geneticEntityId: 9829,
            entrezGeneId: 25979,
            hugoGeneSymbol: 'DHRS7B',
            type: 'protein-coding',
        },
        molecularProfileId: 'acc_tcga_rna_seq_v2_mrna',
        patientId: 'TCGA-OR-A5J3',
        sampleId: 'TCGA-OR-A5J3-01',
        studyId: 'acc_tcga',
        uniquePatientKey: 'VENHQS1PUi1BNUozOmFjY190Y2dh',
        uniqueSampleKey: 'VENHQS1PUi1BNUozLTAxOmFjY190Y2dh',
        value: 808.1766,
    },
];

describe('EnrichmentsUtil', () => {
    describe('#calculateExpressionTendency()', () => {
        it('returns Over-expressed for 3', () => {
            assert.equal(calculateExpressionTendency(3), 'Over-expressed');
        });

        it('returns Under-expressed for 0', () => {
            assert.equal(calculateExpressionTendency(0), 'Under-expressed');
        });

        it('returns Under-expressed for -7', () => {
            assert.equal(calculateExpressionTendency(-7), 'Under-expressed');
        });
    });

    describe('#formatPercentage()', () => {
        it('returns 3 (75.00%) for altered count 3 and profiled count 4', () => {
            assert.equal(
                formatPercentage('altered group', {
                    groupsSet: {
                        'altered group': {
                            name: 'altered group',
                            alteredCount: 3,
                            alteredPercentage: 75,
                        },
                    },
                } as any),
                '3 (75.00%)'
            );
        });

        it('returns 1 (1.00%) for altered count 1 and profiled count 100', () => {
            assert.equal(
                formatPercentage('altered group', {
                    groupsSet: {
                        'altered group': {
                            name: 'altered group',
                            alteredCount: 1,
                            alteredPercentage: 1,
                        },
                    },
                } as any),
                '1 (1.00%)'
            );
        });
    });

    describe('#getAlterationScatterData()', () => {
        it('returns empty array for empty array', () => {
            assert.deepEqual(getAlterationScatterData([], []), []);
        });

        it('returns correct scatter data', () => {
            assert.deepEqual(
                getAlterationScatterData(
                    exampleAlterationEnrichmentRowData as any,
                    ['EGFR']
                ),
                [
                    {
                        x: 10,
                        y: 2.804820678721167,
                        hugoGeneSymbol: 'FBXW4',
                        logRatio: Infinity,
                        pValue: 0.0015673981191222392,
                        qValue: 0.9385345997286061,
                        hovered: false,
                    },
                    {
                        x: 10,
                        y: 2.804820678721167,
                        hugoGeneSymbol: 'CAND2',
                        logRatio: Infinity,
                        pValue: 0.0015673981191222392,
                        qValue: 0.9385345997286061,
                        hovered: false,
                    },
                ]
            );
        });
    });

    describe('#getExpressionScatterData()', () => {
        it('returns empty array for empty array', () => {
            assert.deepEqual(getExpressionScatterData([], []), []);
        });

        it('returns correct scatter data', () => {
            assert.deepEqual(
                getExpressionScatterData(exampleExpressionEnrichmentRowData, [
                    'EGFR',
                ]),
                [
                    {
                        x: -0.7514352361955119,
                        y: 8.713104055017682,
                        hugoGeneSymbol: 'DHRS7B',
                        entrezGeneId: 25979,
                        logRatio: -0.7514352361955119,
                        pValue: 1.9359580614715825e-9,
                        qValue: 0.000024032306741578182,
                        hovered: false,
                    },
                    {
                        x: 1.373692179998275,
                        y: 8.431950829601448,
                        hugoGeneSymbol: 'PTPN3',
                        entrezGeneId: 5774,
                        logRatio: 1.373692179998275,
                        pValue: 3.698700537372556e-9,
                        qValue: 0.000024032306741578182,
                        hovered: false,
                    },
                    {
                        x: 2.652285592481328,
                        y: 8.249349711250797,
                        hugoGeneSymbol: 'EPHB3',
                        entrezGeneId: 2049,
                        logRatio: 2.652285592481328,
                        pValue: 5.631839749745262e-9,
                        qValue: 0.000024395252515979897,
                        hovered: false,
                    },
                ]
            );
        });
    });

    describe('#getAlterationRowData()', () => {
        it('returns empty array for empty array', () => {
            assert.deepEqual(getAlterationRowData([], [], []), []);
        });

        it('returns correct row data', () => {
            assert.deepEqual(
                getAlterationRowData(
                    exampleAlterationEnrichments,
                    ['EGFR'],
                    [{ name: 'altered group' }, { name: 'unaltered group' }]
                ),
                exampleAlterationEnrichmentRowData as any
            );
        });
    });

    describe('#getExpressionRowData()', () => {
        it('returns empty array for empty array', () => {
            assert.deepEqual(getExpressionRowData([], ['EGFR'], []), []);
        });

        it('returns correct row data', () => {
            assert.deepEqual(
                getExpressionRowData(
                    exampleExpressionEnrichments,
                    ['EGFR'],
                    [{ name: 'altered group' }, { name: 'unaltered group' }]
                ),
                exampleExpressionEnrichmentRowData
            );
        });
    });

    describe('#getFilteredData()', () => {
        it('returns correct filtered data', () => {
            assert.deepEqual(
                getFilteredData(
                    exampleAlterationEnrichmentRowData as any,
                    ['altered group', 'unaltered group'],
                    false,
                    () => true
                ),
                exampleAlterationEnrichmentRowData
            );

            assert.deepEqual(
                getFilteredData(
                    exampleAlterationEnrichmentRowData as any,
                    ['unaltered group'],
                    true,
                    () => true
                ),
                []
            );

            assert.deepEqual(
                getFilteredData(
                    exampleAlterationEnrichmentRowData as any,
                    ['altered group'],
                    false,
                    (hugoGeneSymbol: string) =>
                        ['FBXW4'].includes(hugoGeneSymbol)
                ),
                [
                    {
                        checked: false,
                        disabled: false,
                        entrezGeneId: 6468,
                        hugoGeneSymbol: 'FBXW4',
                        cytoband: '10q24.32',
                        groupsSet: {
                            'altered group': {
                                name: 'altered group',
                                alteredCount: 2,
                                profiledCount: 4,
                                alteredPercentage: 50,
                            },
                            'unaltered group': {
                                name: 'unaltered group',
                                alteredCount: 0,
                                profiledCount: 4,
                                alteredPercentage: 0,
                            },
                        },
                        logRatio: Infinity,
                        pValue: 0.0015673981191222392,
                        qValue: 0.9385345997286061,
                        enrichedGroup: 'altered group',
                        value: undefined,
                    },
                ]
            );
        });
    });

    describe('#getBarChartTooltipContent()', () => {
        it('returns correct tooltip content', () => {
            const exampleTooltipModel1 = {
                datum: {
                    x: 2,
                    y: 1,
                    index: 0,
                },
            };
            assert.equal(
                getBarChartTooltipContent(exampleTooltipModel1, 'EGFR'),
                'Query Genes Altered: 1'
            );

            const exampleTooltipModel2 = {
                datum: {
                    x: 2,
                    y: 5,
                    index: 1,
                },
            };
            assert.equal(
                getBarChartTooltipContent(exampleTooltipModel2, 'EGFR'),
                'Query Genes Unaltered: 5'
            );

            const exampleTooltipModel3 = {
                datum: {
                    x: 4,
                    y: 1,
                    index: 0,
                },
            };
            assert.equal(
                getBarChartTooltipContent(exampleTooltipModel3, 'EGFR'),
                'Query Genes Altered, EGFR Unaltered: 1'
            );

            const exampleTooltipModel4 = {
                datum: {
                    x: 1,
                    y: 1,
                    index: 1,
                },
            };
            assert.equal(
                getBarChartTooltipContent(exampleTooltipModel4, 'EGFR'),
                'Query Genes Altered, EGFR Altered: 1'
            );

            const exampleTooltipModel5 = {
                datum: {
                    x: 3,
                    y: 3,
                    index: 2,
                },
            };
            assert.equal(
                getBarChartTooltipContent(exampleTooltipModel5, 'EGFR'),
                'Query Genes Unaltered, EGFR Altered: 3'
            );

            const exampleTooltipModel6 = {
                datum: {
                    x: 4,
                    y: 4,
                    index: 3,
                },
            };
            assert.equal(
                getBarChartTooltipContent(exampleTooltipModel6, 'EGFR'),
                'Query Genes Unaltered, EGFR Unaltered: 4'
            );
        });
    });

    describe('#getAlterationsTooltipContent()', () => {
        it('returns correct tooltip content', () => {
            assert.equal(
                getAlterationsTooltipContent(exampleAlterations),
                'EGFR: MUT; AMP; '
            );
        });
    });

    describe('#getGroupColumns()', () => {
        it('returns correct group columns', () => {
            assert.deepEqual(getAlterationEnrichmentColumns([]), []);
            assert.deepEqual(
                _.map(
                    getAlterationEnrichmentColumns([
                        { name: 'altered group', description: '' },
                    ]),
                    datum => datum.name
                ),
                []
            );
            assert.deepEqual(
                _.map(
                    getAlterationEnrichmentColumns(
                        [
                            { name: 'altered group', description: '' },
                            { name: 'unaltered group', description: '' },
                        ],
                        true
                    ),
                    datum => datum.name
                ),
                ['Log2 Ratio', 'Tendency', 'altered group', 'unaltered group']
            );
            assert.deepEqual(
                _.map(
                    getAlterationEnrichmentColumns([
                        { name: 'group1', description: '' },
                        { name: 'group2', description: '' },
                    ]),
                    datum => datum.name
                ),
                ['Log2 Ratio', 'Enriched in', 'group1', 'group2']
            );
            assert.deepEqual(
                _.map(
                    getAlterationEnrichmentColumns([
                        { name: 'group1', description: '' },
                        { name: 'group2', description: '' },
                        { name: 'group3', description: '' },
                    ]),
                    datum => datum.name
                ),
                ['Most enriched in', 'group1', 'group2', 'group3']
            );
        });
    });

    describe('#getEnrichmentBarPlotData()', () => {
        it('returns correct data', () => {
            const data = _.keyBy(
                exampleAlterationEnrichmentRowData,
                datum => datum.hugoGeneSymbol
            );
            //empty requests
            assert.deepEqual(getEnrichmentBarPlotData({}, []), []);
            //empty genes
            assert.deepEqual(getEnrichmentBarPlotData(data, []), []);
            //genes not present in data
            assert.deepEqual(getEnrichmentBarPlotData(data, ['ABC']), []);
            //genes present in data
            assert.deepEqual(getEnrichmentBarPlotData(data, ['EGFR']), [
                {
                    minorCategory: 'altered group',
                    counts: [
                        { majorCategory: 'EGFR', count: 75, percentage: 100 },
                    ],
                },
                {
                    minorCategory: 'unaltered group',
                    counts: [
                        { majorCategory: 'EGFR', count: 0, percentage: 0 },
                    ],
                },
            ]);
        });
    });

    describe('#getGeneListOptions()', () => {
        it('returns correct options', () => {
            //empty requests
            assert.deepEqual(getGeneListOptions([]), [
                { label: 'User-defined genes', genes: [] },
            ] as any);

            //non empty requests
            assert.deepEqual(
                getGeneListOptions(exampleAlterationEnrichmentRowData),
                [
                    { label: 'User-defined genes', genes: [] },
                    {
                        label: 'Genes with highest frequency in any group',
                        genes: ['EGFR', 'FBXW4', 'CAND2'],
                    },
                    {
                        label: 'Genes with highest average frequency',
                        genes: ['EGFR', 'FBXW4', 'CAND2'],
                    },
                    {
                        label: 'Genes with most significant p-value',
                        genes: ['EGFR', 'FBXW4', 'CAND2'],
                    },
                    { label: 'Sync with table (up to 100 genes)', genes: [] },
                ]
            );

            //non empty requests
            let exampleCopyNumberAlterationEnrichmentRowData = _.map(
                exampleAlterationEnrichmentRowData,
                rowDatum => {
                    let value = 2;
                    if (rowDatum.hugoGeneSymbol === 'FBXW4') {
                        value = -2;
                    }
                    return {
                        ...rowDatum,
                        value,
                    };
                }
            );
            assert.deepEqual(
                getGeneListOptions(
                    exampleCopyNumberAlterationEnrichmentRowData,
                    true
                ),
                [
                    { label: 'User-defined genes', genes: [] },
                    {
                        label: 'Genes with highest frequency in any group',
                        genes: ['EGFR: AMP', 'FBXW4: HOMDEL', 'CAND2: AMP'],
                    },
                    {
                        label: 'Genes with highest average frequency',
                        genes: ['EGFR: AMP', 'FBXW4: HOMDEL', 'CAND2: AMP'],
                    },
                    {
                        label: 'Genes with most significant p-value',
                        genes: ['EGFR: AMP', 'FBXW4: HOMDEL', 'CAND2: AMP'],
                    },
                    { label: 'Sync with table (up to 100 genes)', genes: [] },
                ]
            );
        });
    });

    describe('#pickGenericAssayEnrichmentProfiles()', () => {
        it('returns picked Generic Assay profiles', () => {
            const profiles = [
                {
                    molecularProfileId: 'profile_1',
                    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
                    datatype: 'DISCRETE',
                },
                {
                    molecularProfileId: 'profile_2',
                    molecularAlterationType: 'MUTATION_EXTENDED',
                    datatype: 'MAF',
                },
                {
                    molecularProfileId: 'profile_3',
                    molecularAlterationType: 'MRNA_EXPRESSION',
                    datatype: 'CONTINUOUS',
                },
                {
                    molecularProfileId: 'profile_4',
                    molecularAlterationType: 'STRUCTURAL_VARIANT',
                    datatype: 'FUSION',
                },
                {
                    molecularProfileId: 'profile_5',
                    molecularAlterationType: 'GENERIC_ASSAY',
                    datatype: 'LIMIT-VALUE',
                },
                {
                    molecularProfileId: 'profile_6',
                    molecularAlterationType: 'GENERIC_ASSAY',
                    datatype: 'CATEGORICAL',
                },
                {
                    molecularProfileId: 'profile_7',
                    molecularAlterationType: 'GENERIC_ASSAY',
                    datatype: 'BINARY',
                },
            ] as MolecularProfile[];
            const expectedResult = [
                {
                    molecularProfileId: 'profile_5',
                    molecularAlterationType: 'GENERIC_ASSAY',
                    datatype: 'LIMIT-VALUE',
                } as MolecularProfile,
            ];
            const result = pickGenericAssayEnrichmentProfiles(profiles);
            assert.equal(result.length, 1);
            assert.deepEqual(result, expectedResult);
        });
    });

    describe('#ContinousDataPvalueTooltip()', () => {
        const DEFAULT_PROPS = {};
        const LESS_THAN_THREE_GROUP_PROPS = { groupSize: 2 };
        const GREATER_THAN_OR_EQUAL_TO_THREE_GROUP_PROPS = { groupSize: 3 };

        it("returns Student's t-test by default", () => {
            const component = render(
                <ContinousDataPvalueTooltip {...DEFAULT_PROPS} />
            );
            assert.equal(
                component.container.textContent,
                "Derived from Student's t-test"
            );
        });

        it("returns Student's t-test tooltip for group size < 3", () => {
            const component = render(
                <ContinousDataPvalueTooltip {...LESS_THAN_THREE_GROUP_PROPS} />
            );
            assert.equal(
                component.container.textContent,
                "Derived from Student's t-test"
            );
        });

        it('returns one-way ANOVA tooltip for group size >= 3', () => {
            const component = render(
                <ContinousDataPvalueTooltip
                    {...GREATER_THAN_OR_EQUAL_TO_THREE_GROUP_PROPS}
                />
            );
            assert.equal(
                component.container.textContent,
                'Derived from one-way ANOVA'
            );
        });
    });
});
