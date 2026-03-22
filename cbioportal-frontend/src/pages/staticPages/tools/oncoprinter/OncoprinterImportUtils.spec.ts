import { assert } from 'chai';
import {
    generateUniqueLabel,
    getOncoprinterClinicalInput,
    getOncoprinterGeneticInput,
    getOncoprinterHeatmapInput,
} from './OncoprinterImportUtils';
import { SpecialAttribute } from '../../../../shared/cache/ClinicalDataCache';
import { ONCOPRINTER_VAL_NA } from './OncoprinterClinicalAndHeatmapUtils';
import { IHeatmapTrackSpec } from '../../../../shared/components/oncoprint/Oncoprint';
import { PUTATIVE_DRIVER } from 'shared/lib/StoreUtils';
import { AlterationTypeConstants, DataTypeConstants } from 'shared/constants';

describe('OncoprinterImportUtils', () => {
    describe('generateUniqueLabel', () => {
        it('returns the same unique label if its unused, and keeps count correctly', () => {
            const counts: any = {};
            const label = generateUniqueLabel('label', counts);
            assert.equal(label, 'label');
            assert.deepEqual(counts, { label: 1 });
        });
        it('disambiguates an already-used label, and keeps track of counts correctly', () => {
            const counts: any = { label: 1 };
            const label = generateUniqueLabel('label', counts);
            assert.equal(label, 'label_2');
            assert.deepEqual(counts, { label: 2, label_2: 1 });
        });
        it('disambiguates correctly when the same label is already used, and keeps track of counts correctly', () => {
            const counts: any = { label: 2, label_2: 1 };
            let label = generateUniqueLabel('label', counts);
            assert.equal(label, 'label_3');
            assert.deepEqual(counts, { label: 3, label_2: 1, label_3: 1 });

            label = generateUniqueLabel('label_2', counts);
            assert.equal(label, 'label_2_2');
            assert.deepEqual(counts, {
                label: 3,
                label_2: 2,
                label_3: 1,
                label_2_2: 1,
            });
        });
    });
    describe('getOncoprinterGeneticInput', () => {
        const data: any[] = [
            {
                label: 'label1',
                data: [
                    {
                        sample: 'sample1',
                        patient: 'patient1',
                        data: [
                            {
                                molecularProfileAlterationType:
                                    AlterationTypeConstants.MUTATION_EXTENDED,
                                proteinChange: 'proteinChange1',
                                mutationType: 'missense',
                                hugoGeneSymbol: 'gene1',
                                mutationStatus: 'germline',
                                driverFilter: PUTATIVE_DRIVER,
                            },
                            {
                                molecularProfileAlterationType:
                                    AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                                hugoGeneSymbol: 'gene1',
                                value: -2,
                            },
                            {
                                molecularProfileAlterationType:
                                    AlterationTypeConstants.MRNA_EXPRESSION,
                                hugoGeneSymbol: 'gene1',
                                alterationSubType: 'high',
                            },
                        ],
                    },
                    {
                        sample: 'sample2',
                        patient: 'patient2',
                        data: [
                            {
                                molecularProfileAlterationType:
                                    AlterationTypeConstants.MUTATION_EXTENDED,
                                proteinChange: 'proteinChange2',
                                mutationType: 'frameshift',
                                mutationStatus: 'germline',
                                hugoGeneSymbol: 'gene1',
                            },
                            {
                                molecularProfileAlterationType:
                                    AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                                hugoGeneSymbol: 'gene1',
                                value: 2,
                            },
                            {
                                molecularProfileAlterationType:
                                    AlterationTypeConstants.PROTEIN_LEVEL,
                                hugoGeneSymbol: 'gene1',
                                alterationSubType: 'high',
                            },
                        ],
                    },
                ],
            },
            {
                label: 'label2',
                data: [
                    {
                        sample: 'sample1',
                        patient: 'patient1',
                        data: [
                            {
                                molecularProfileAlterationType:
                                    AlterationTypeConstants.MUTATION_EXTENDED,
                                proteinChange: 'promoter',
                                mutationType: 'promoter',
                                hugoGeneSymbol: 'gene2',
                            },
                            {
                                molecularProfileAlterationType:
                                    AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                                hugoGeneSymbol: 'gene2',
                                value: 1,
                            },
                            {
                                molecularProfileAlterationType:
                                    AlterationTypeConstants.MRNA_EXPRESSION,
                                hugoGeneSymbol: 'gene2',
                                alterationSubType: 'low',
                            },
                        ],
                    },
                    {
                        sample: 'sample2',
                        patient: 'patient2',
                        data: [
                            {
                                molecularProfileAlterationType:
                                    AlterationTypeConstants.STRUCTURAL_VARIANT,
                                hugoGeneSymbol: 'gene1',
                                site1HugoSymbol: 'gene1',
                                site2HugoSymbol: 'gene2',
                                eventInfo: 'gene1-gene2',
                                variantClass: 'FUSION',
                                comments: 'gene1 gene1-gene2',
                            },
                            {
                                molecularProfileAlterationType:
                                    AlterationTypeConstants.COPY_NUMBER_ALTERATION,
                                hugoGeneSymbol: 'gene2',
                                value: 0,
                            },
                            {
                                molecularProfileAlterationType:
                                    AlterationTypeConstants.PROTEIN_LEVEL,
                                hugoGeneSymbol: 'gene2',
                                alterationSubType: 'low',
                            },
                        ],
                    },
                ],
            },
        ];
        it('produces correct oncoprinter genetic input for 2 samples x 2 genes', () => {
            assert.deepEqual(
                getOncoprinterGeneticInput(
                    data,
                    ['sample1', 'sample2'],
                    'sample'
                ),
                'sample1  gene1  proteinChange1  MISSENSE_GERMLINE_DRIVER  label1\n' +
                    'sample1  gene1  HOMDEL  CNA  label1\n' +
                    'sample1  gene1  HIGH  EXP  label1\n' +
                    'sample2  gene1  proteinChange2  TRUNC_GERMLINE  label1\n' +
                    'sample2  gene1  AMP  CNA  label1\n' +
                    'sample2  gene1  HIGH  PROT  label1\n' +
                    'sample1  gene2  promoter  PROMOTER  label2\n' +
                    'sample1  gene2  GAIN  CNA  label2\n' +
                    'sample1  gene2  LOW  EXP  label2\n' +
                    'sample2  gene1-gene2  gene1-gene2  FUSION  label2\n' +
                    'sample2\n' +
                    'sample2  gene2  LOW  PROT  label2\n' +
                    'sample1\nsample2'
            );
        });
        it('produces correct oncoprinter genetic input for 2 patients x 2 genes', () => {
            assert.deepEqual(
                getOncoprinterGeneticInput(
                    data,
                    ['patient1', 'patient2'],
                    'patient'
                ),
                'patient1  gene1  proteinChange1  MISSENSE_GERMLINE_DRIVER  label1\n' +
                    'patient1  gene1  HOMDEL  CNA  label1\n' +
                    'patient1  gene1  HIGH  EXP  label1\n' +
                    'patient2  gene1  proteinChange2  TRUNC_GERMLINE  label1\n' +
                    'patient2  gene1  AMP  CNA  label1\n' +
                    'patient2  gene1  HIGH  PROT  label1\n' +
                    'patient1  gene2  promoter  PROMOTER  label2\n' +
                    'patient1  gene2  GAIN  CNA  label2\n' +
                    'patient1  gene2  LOW  EXP  label2\n' +
                    'patient2  gene1-gene2  gene1-gene2  FUSION  label2\n' +
                    'patient2\n' +
                    'patient2  gene2  LOW  PROT  label2\n' +
                    'patient1\npatient2'
            );
        });
        it('handles structural variants with driver annotation correctly', () => {
            const svData: any[] = [
                {
                    label: 'BAP1',
                    data: [
                        {
                            sample: 'TCGA-LK-A4O5',
                            patient: 'TCGA-LK-A4O5',
                            data: [
                                {
                                    molecularProfileAlterationType:
                                        AlterationTypeConstants.STRUCTURAL_VARIANT,
                                    site1HugoSymbol: 'ACY1',
                                    site2HugoSymbol: 'BAP1',
                                    eventInfo: 'ACY1-BAP1 fusion',
                                    variantClass: 'FUSION',
                                    alterationType:
                                        AlterationTypeConstants.STRUCTURAL_VARIANT,
                                    driverFilter: PUTATIVE_DRIVER,
                                },
                            ],
                        },
                    ],
                },
            ];
            const result = getOncoprinterGeneticInput(
                svData,
                ['TCGA-LK-A4O5'],
                'sample'
            );
            // Should combine both gene symbols and include FUSION_DRIVER for driver annotations
            assert.equal(
                result,
                'TCGA-LK-A4O5  ACY1-BAP1  ACY1-BAP1_fusion  FUSION_DRIVER  BAP1\nTCGA-LK-A4O5'
            );
        });
        it('exports structural variants with putativeDriver flag correctly', () => {
            const svData: any[] = [
                {
                    label: 'BAP1',
                    data: [
                        {
                            sample: 'TCGA-LK-A4O5',
                            patient: 'TCGA-LK-A4O5',
                            data: [
                                {
                                    molecularProfileAlterationType:
                                        AlterationTypeConstants.STRUCTURAL_VARIANT,
                                    site1HugoSymbol: 'ACY1',
                                    site2HugoSymbol: 'BAP1',
                                    eventInfo: 'ACY1-BAP1 fusion',
                                    putativeDriver: true,
                                },
                            ],
                        },
                    ],
                },
            ];
            const result = getOncoprinterGeneticInput(
                svData,
                ['TCGA-LK-A4O5'],
                'sample'
            );
            // Should detect driver from putativeDriver boolean flag
            assert.equal(
                result,
                'TCGA-LK-A4O5  ACY1-BAP1  ACY1-BAP1_fusion  FUSION_DRIVER  BAP1\nTCGA-LK-A4O5'
            );
        });
        it('handles intragenic structural variants correctly', () => {
            const svData: any[] = [
                {
                    label: 'EGFR',
                    data: [
                        {
                            sample: 'sample1',
                            patient: 'patient1',
                            data: [
                                {
                                    molecularProfileAlterationType:
                                        AlterationTypeConstants.STRUCTURAL_VARIANT,
                                    site1HugoSymbol: 'EGFR',
                                    site2HugoSymbol: undefined,
                                    eventInfo: 'EGFR truncation',
                                    variantClass: 'DELETION',
                                    alterationType:
                                        AlterationTypeConstants.STRUCTURAL_VARIANT,
                                },
                            ],
                        },
                    ],
                },
            ];
            const result = getOncoprinterGeneticInput(
                svData,
                ['sample1'],
                'sample'
            );
            // For intragenic SVs (only one gene), should use that single gene
            assert.equal(
                result,
                'sample1  EGFR  EGFR_truncation  FUSION  EGFR\nsample1'
            );
        });
    });

    describe('getOncoprinterClinicalInput', () => {
        const data: any[] = [
            {
                attr_id: 'MUTATION_COUNT',
                sample: 'sample1',
                patient: 'patient1',
                attr_val: 5,
            },
            {
                attr_id: 'cancer_type',
                sample: 'sample1',
                patient: 'patient1',
                attr_val: 'Prostate',
            },
            {
                attr_id: SpecialAttribute.MutationSpectrum,
                sample: 'sample1',
                patient: 'patient1',
                attr_val: {
                    'C>A': 3,
                    'C>G': 4,
                    'C>T': 5,
                    'T>A': 10,
                    'T>C': 2,
                    'T>G': 0,
                },
            },
            {
                attr_id: 'age',
                sample: 'sample1',
                patient: 'patient1',
                na: true,
            },
            {
                attr_id: 'MUTATION_COUNT',
                sample: 'sample2',
                patient: 'patient2',
                attr_val: 12,
            },
            {
                attr_id: 'cancer_type',
                sample: 'sample2',
                patient: 'patient2',
                na: true,
            },
            {
                attr_id: SpecialAttribute.MutationSpectrum,
                sample: 'sample2',
                patient: 'patient2',
                na: true,
            },
            {
                attr_id: 'age',
                sample: 'sample2',
                patient: 'patient2',
                attr_val: 19,
            },
        ];
        const attributeIdToAttribute: any = {
            age: {
                displayName: 'Age',
                datatype: 'NUMBER',
                clinicalAttributeId: 'age',
            },
            MUTATION_COUNT: {
                displayName: 'Mutation Count',
                datatype: 'NUMBER',
                clinicalAttributeId: 'MUTATION_COUNT',
            },
            cancer_type: {
                displayName: 'Cancer type',
                datatype: 'STRING',
                clinicalAttributeId: 'cancer_type',
            },
            [SpecialAttribute.MutationSpectrum]: {
                displayName: 'Mutation Spectrum',
                datatype: 'COUNTS_MAP',
                clinicalAttributeId: SpecialAttribute.MutationSpectrum,
            },
        };

        it('produces correct oncoprinter clinical and heatmap input for 2 samples x 4 tracks', () => {
            assert.deepEqual(
                getOncoprinterClinicalInput(
                    data,
                    ['sample1', 'sample2'],
                    [
                        'age',
                        'MUTATION_COUNT',
                        'cancer_type',
                        SpecialAttribute.MutationSpectrum,
                    ],
                    attributeIdToAttribute,
                    'sample'
                ),
                'Sample  Age(number)  Mutation_Count(lognumber)  Cancer_type(string)  Mutation_Spectrum(C>A/C>G/C>T/T>A/T>C/T>G)\n' +
                    `sample1  ${ONCOPRINTER_VAL_NA}  5  Prostate  3/4/5/10/2/0\n` +
                    `sample2  19  12  ${ONCOPRINTER_VAL_NA}  ${ONCOPRINTER_VAL_NA}`
            );
        });
        it('produces correct oncoprinter clinical input for 2 patients x 4 tracks', () => {
            assert.deepEqual(
                getOncoprinterClinicalInput(
                    data,
                    ['patient1', 'patient2'],
                    [
                        'age',
                        'MUTATION_COUNT',
                        'cancer_type',
                        SpecialAttribute.MutationSpectrum,
                    ],
                    attributeIdToAttribute,
                    'patient'
                ),
                'Sample  Age(number)  Mutation_Count(lognumber)  Cancer_type(string)  Mutation_Spectrum(C>A/C>G/C>T/T>A/T>C/T>G)\n' +
                    `patient1  ${ONCOPRINTER_VAL_NA}  5  Prostate  3/4/5/10/2/0\n` +
                    `patient2  19  12  ${ONCOPRINTER_VAL_NA}  ${ONCOPRINTER_VAL_NA}`
            );
        });
    });

    describe('getOncoprinterHeatmapInput', () => {
        const heatmapTracks: IHeatmapTrackSpec[] = [
            {
                key: 'mrna-zscores',
                label: 'PTEN',
                molecularProfileId: 'zscores',
                molecularAlterationType: 'MRNA_EXPRESSION',
                molecularProfileName: 'mRNA (z-scores)',
                datatype: DataTypeConstants.ZSCORE,
                data: [
                    {
                        profile_data: 1.5,
                        sample: 'sample1',
                        patient: 'patient1',
                        study_id: '',
                        uid: 'sample1',
                        na: false,
                    },
                    {
                        profile_data: -1,
                        sample: 'sample2',
                        patient: 'patient2',
                        study_id: '',
                        uid: 'sample2',
                        na: false,
                    },
                ],
                trackGroupIndex: 2,
            },
            {
                key: 'mrna',
                label: 'BRCA1',
                molecularProfileId: 'mrna',
                molecularAlterationType: 'MRNA_EXPRESSION',
                molecularProfileName: 'mRNA values',
                datatype: DataTypeConstants.CONTINUOUS,
                data: [
                    {
                        profile_data: 6,
                        sample: 'sample1',
                        patient: 'patient1',
                        study_id: '',
                        uid: 'sample1',
                        na: false,
                    },
                    {
                        profile_data: null,
                        sample: 'sample2',
                        patient: 'patient2',
                        study_id: '',
                        uid: 'sample2',
                        na: true,
                    },
                ],
                trackGroupIndex: 2,
            },
            {
                key: 'methylation',
                label: 'TP53',
                molecularProfileId: 'methylation',
                molecularAlterationType: 'METHYLATION',
                molecularProfileName: 'Methylation (HM27)',
                datatype: DataTypeConstants.CONTINUOUS,
                data: [
                    {
                        profile_data: 0.3,
                        sample: 'sample1',
                        patient: 'patient1',
                        study_id: '',
                        uid: 'sample1',
                        na: false,
                    },
                    {
                        profile_data: 0.8,
                        sample: 'sample2',
                        patient: 'patient2',
                        study_id: '',
                        uid: 'sample2',
                        na: false,
                    },
                ],
                trackGroupIndex: 2,
            },
        ];

        it('produces correct oncoprinter heatmap input for 2 samples x 3 tracks', () => {
            assert.equal(
                getOncoprinterHeatmapInput(
                    heatmapTracks,
                    ['sample1', 'sample2'],
                    'sample'
                ),
                `Sample  PTEN_mRNA_z-scores(heatmapZscores)  BRCA1_mRNA_values(heatmap)  TP53_Methylation_HM27(heatmap01)\n` +
                    `sample1  1.5  6  0.3\n` +
                    `sample2  -1  ${ONCOPRINTER_VAL_NA}  0.8`
            );
        });
        it('produces correct oncoprinter heatmap input for 2 patients x 3 tracks', () => {
            assert.equal(
                getOncoprinterHeatmapInput(
                    heatmapTracks,
                    ['patient1', 'patient2'],
                    'patient'
                ),
                'Sample  PTEN_mRNA_z-scores(heatmapZscores)  BRCA1_mRNA_values(heatmap)  TP53_Methylation_HM27(heatmap01)\n' +
                    `patient1  1.5  6  0.3\n` +
                    `patient2  -1  ${ONCOPRINTER_VAL_NA}  0.8`
            );
        });
    });
});
