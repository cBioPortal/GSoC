import { assert } from 'chai';
import { PlotsTabOption, PlotsTabDataSource } from './PlotsTab';
import { generateQuickPlots, ButtonInfo, TypeSourcePair } from './QuickPlots';
import { GenericAssayTypeConstants } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';

describe('Quick Plot Links in the Plots Tab', () => {
    describe('generateQuickplots', () => {
        it('should make no quickplots', () => {
            const dataTypes: PlotsTabOption[] = [];
            const dataSources: PlotsTabDataSource = {};
            const horizontal: TypeSourcePair = {
                type: undefined,
                source: undefined,
            };
            const vertical: TypeSourcePair = {
                type: undefined,
                source: undefined,
            };

            const actual = generateQuickPlots(
                dataTypes,
                dataSources,
                [],
                0,
                horizontal,
                vertical
            );
            const expected: ButtonInfo[] = [];

            assert.deepEqual(actual, expected);
        });

        it('should make a mRNA vs CNA quickplot', () => {
            const dataTypes: PlotsTabOption[] = [
                { value: 'COPY_NUMBER_ALTERATION', label: 'Copy Number' },
                { value: 'MRNA_EXPRESSION', label: 'mRNA' },
            ];
            const dataSources: PlotsTabDataSource = {};
            const horizontal: TypeSourcePair = {
                type: 'COPY_NUMBER_ALTERATION',
                source: undefined,
            };
            const vertical: TypeSourcePair = {
                type: 'MRNA_EXPRESSION',
                source: undefined,
            };

            const actual = generateQuickPlots(
                dataTypes,
                dataSources,
                [],
                0,
                horizontal,
                vertical
            );
            const expected: ButtonInfo[] = [
                {
                    selected: true,
                    display: 'mRNA vs CNA',
                    plotModel: {
                        vertical: {
                            dataType: {
                                value: 'MRNA_EXPRESSION',
                                label: 'mRNA',
                            },
                            dataSource: undefined,
                            useSameGene: true,
                        },
                        horizontal: {
                            dataType: {
                                value: 'COPY_NUMBER_ALTERATION',
                                label: 'Copy Number',
                            },
                            dataSource: undefined,
                        },
                    },
                },
            ];

            assert.deepEqual(actual, expected);
        });

        it('should make a mRNA vs methyl quickplot', () => {
            const dataTypes: PlotsTabOption[] = [
                { value: 'METHYLATION', label: 'DNA Methylation' },
                { value: 'MRNA_EXPRESSION', label: 'mRNA' },
            ];
            const dataSources: PlotsTabDataSource = {};
            const horizontal: TypeSourcePair = {
                type: 'METHYLATION',
                source: undefined,
            };
            const vertical: TypeSourcePair = {
                type: 'MRNA_EXPRESSION',
                source: undefined,
            };

            const actual = generateQuickPlots(
                dataTypes,
                dataSources,
                [],
                0,
                horizontal,
                vertical
            );
            const expected: ButtonInfo[] = [
                {
                    selected: true,
                    display: 'mRNA vs methyl',
                    plotModel: {
                        vertical: {
                            dataType: {
                                value: 'MRNA_EXPRESSION',
                                label: 'mRNA',
                            },
                            dataSource: undefined,
                            useSameGene: true,
                        },
                        horizontal: {
                            dataType: {
                                value: 'METHYLATION',
                                label: 'DNA Methylation',
                            },
                            dataSource: undefined,
                        },
                    },
                },
            ];

            assert.deepEqual(actual, expected);
        });

        it('should make a mutation count vs FGA quickplot', () => {
            const dataTypes: PlotsTabOption[] = [
                { value: 'clinical_attribute', label: 'Clinical Attribute' },
            ];
            const dataSources: PlotsTabDataSource = {
                clinical_attribute: [
                    { value: 'MUTATION_COUNT', label: 'Mutation Count' },
                    {
                        value: 'FRACTION_GENOME_ALTERED',
                        label: 'Fraction Genome Altered',
                    },
                ],
            };
            const horizontal: TypeSourcePair = {
                type: 'clinical_attribute',
                source: 'FRACTION_GENOME_ALTERED',
            };
            const vertical: TypeSourcePair = {
                type: 'clinical_attribute',
                source: 'MUTATION_COUNT',
            };

            const actual = generateQuickPlots(
                dataTypes,
                dataSources,
                [],
                0,
                horizontal,
                vertical
            );
            const expected: ButtonInfo[] = [
                {
                    selected: true,
                    display: 'Mut# vs FGA',
                    plotModel: {
                        vertical: {
                            dataType: {
                                value: 'clinical_attribute',
                                label: 'Clinical Attribute',
                            },
                            dataSource: {
                                value: 'MUTATION_COUNT',
                                label: 'Mutation Count',
                            },
                        },
                        horizontal: {
                            dataType: {
                                value: 'clinical_attribute',
                                label: 'Clinical Attribute',
                            },
                            dataSource: {
                                value: 'FRACTION_GENOME_ALTERED',
                                label: 'Fraction Genome Altered',
                            },
                        },
                    },
                },
            ];

            assert.deepEqual(actual, expected);
        });

        it('should make mutation count vs cancer type detailed quickplot', () => {
            const dataTypes: PlotsTabOption[] = [
                { value: 'clinical_attribute', label: 'Clinical Attribute' },
            ];
            const dataSources: PlotsTabDataSource = {
                clinical_attribute: [
                    { value: 'MUTATION_COUNT', label: 'Mutation Count' },
                    {
                        value: 'CANCER_TYPE_DETAILED',
                        label: 'Cancer Type Detailed',
                    },
                ],
            };
            const cancerTypes = [
                'Colon Adenocarcinoma',
                'Colorectal Adenocarcinoma',
                'Rectal Adenocarcinoma',
            ];
            const horizontal: TypeSourcePair = {
                type: 'clinical_attribute',
                source: 'CANCER_TYPE_DETAILED',
            };
            const vertical: TypeSourcePair = {
                type: 'clinical_attribute',
                source: 'MUTATION_COUNT',
            };

            const actual = generateQuickPlots(
                dataTypes,
                dataSources,
                cancerTypes,
                0,
                horizontal,
                vertical
            );
            const expected: ButtonInfo[] = [
                {
                    selected: true,
                    display: 'Mut# vs Dx',
                    plotModel: {
                        vertical: {
                            dataType: {
                                value: 'clinical_attribute',
                                label: 'Clinical Attribute',
                            },
                            dataSource: {
                                value: 'MUTATION_COUNT',
                                label: 'Mutation Count',
                            },
                        },
                        horizontal: {
                            dataType: {
                                value: 'clinical_attribute',
                                label: 'Clinical Attribute',
                            },
                            dataSource: {
                                value: 'CANCER_TYPE_DETAILED',
                                label: 'Cancer Type Detailed',
                            },
                        },
                    },
                },
            ];

            assert.deepEqual(actual, expected);
        });

        it('should make mutation count vs cancer type quickplot', () => {
            const dataTypes: PlotsTabOption[] = [
                { value: 'clinical_attribute', label: 'Clinical Attribute' },
            ];
            const dataSources: PlotsTabDataSource = {
                clinical_attribute: [
                    { value: 'MUTATION_COUNT', label: 'Mutation Count' },
                    { value: 'CANCER_TYPE', label: 'Cancer Type' },
                ],
            };
            const cancerTypes = [
                'Breast Invasive Ductal Carcinoma',
                'Peritoneal Mesothelioma',
                'Uterine Endometrioid Carcinoma',
                'ural Mesothelioma, Epithelioid Type',
                'Lung Adenocarcinoma',
                'Bladder Urothelial Carcinoma',
                'Hepatocellular Carcinoma',
                'Uterine Clear Cell Carcinoma',
                'Breast Mixed Ductal and Lobular Carcinoma',
                'Stomach Adenocarcinoma',
                'Upper Tract Urothelial Carcinoma',
                'High-Grade Serous Ovarian Cancer',
                'Clear Cell Ovarian Cancer',
                'Uterine Undifferentiated Carcinoma',
                'Uterine Leiomyosarcoma',
                'Yolk Sac Tumor',
            ];
            const horizontal: TypeSourcePair = {
                type: 'clinical_attribute',
                source: 'CANCER_TYPE_DETAILED',
            };
            const vertical: TypeSourcePair = {
                type: 'clinical_attribute',
                source: 'MUTATION_COUNT',
            };

            const actual = generateQuickPlots(
                dataTypes,
                dataSources,
                cancerTypes,
                0,
                horizontal,
                vertical
            );
            const expected: ButtonInfo[] = [
                {
                    selected: true,
                    display: 'Mut# vs Dx',
                    plotModel: {
                        vertical: {
                            dataType: {
                                value: 'clinical_attribute',
                                label: 'Clinical Attribute',
                            },
                            dataSource: {
                                value: 'MUTATION_COUNT',
                                label: 'Mutation Count',
                            },
                        },
                        horizontal: {
                            dataType: {
                                value: 'clinical_attribute',
                                label: 'Clinical Attribute',
                            },
                            dataSource: {
                                value: 'CANCER_TYPE',
                                label: 'Cancer Type',
                            },
                        },
                    },
                },
            ];

            assert.deepEqual(actual, expected);
        });

        it('should make mRNA vs cancer type detailed quickplot', () => {
            const dataTypes: PlotsTabOption[] = [
                { value: 'clinical_attribute', label: 'Clinical Attribute' },
                { value: 'MRNA_EXPRESSION', label: 'mRNA' },
            ];
            const dataSources: PlotsTabDataSource = {
                clinical_attribute: [
                    {
                        value: 'CANCER_TYPE_DETAILED',
                        label: 'Cancer Type Detailed',
                    },
                ],
            };
            const cancerTypes = [
                'Colon Adenocarcinoma',
                'Colorectal Adenocarcinoma',
                'Rectal Adenocarcinoma',
            ];
            const horizontal: TypeSourcePair = {
                type: 'clinical_attribute',
                source: 'CANCER_TYPE_DETAILED',
            };
            const vertical: TypeSourcePair = {
                type: 'MRNA_EXPRESSION',
                source: undefined,
            };

            const actual = generateQuickPlots(
                dataTypes,
                dataSources,
                cancerTypes,
                0,
                horizontal,
                vertical
            );
            const expected: ButtonInfo[] = [
                {
                    selected: true,
                    display: 'mRNA vs Dx',
                    plotModel: {
                        vertical: {
                            dataType: {
                                value: 'MRNA_EXPRESSION',
                                label: 'mRNA',
                            },
                            dataSource: undefined,
                        },
                        horizontal: {
                            dataType: {
                                value: 'clinical_attribute',
                                label: 'Clinical Attribute',
                            },
                            dataSource: {
                                value: 'CANCER_TYPE_DETAILED',
                                label: 'Cancer Type Detailed',
                            },
                        },
                    },
                },
            ];

            assert.deepEqual(actual, expected);
        });

        it('should make mRNA vs mutation type detailed quickplot', () => {
            const dataTypes: PlotsTabOption[] = [
                { value: 'MUTATION_EXTENDED', label: 'Mutation' },
                { value: 'MRNA_EXPRESSION', label: 'mRNA' },
            ];
            const dataSources: PlotsTabDataSource = {};
            const mutationCount = 1;
            const horizontal: TypeSourcePair = {
                type: 'MUTATION_EXTENDED',
                source: undefined,
            };
            const vertical: TypeSourcePair = {
                type: 'MRNA_EXPRESSION',
                source: undefined,
            };

            const actual = generateQuickPlots(
                dataTypes,
                dataSources,
                [],
                mutationCount,
                horizontal,
                vertical
            );
            const expected: ButtonInfo[] = [
                {
                    selected: true,
                    display: 'mRNA vs mut type',
                    plotModel: {
                        vertical: {
                            dataType: {
                                value: 'MRNA_EXPRESSION',
                                label: 'mRNA',
                            },
                            dataSource: undefined,
                            useSameGene: true,
                        },
                        horizontal: {
                            dataType: {
                                value: 'MUTATION_EXTENDED',
                                label: 'Mutation',
                            },
                            dataSource: undefined,
                        },
                    },
                },
            ];

            assert.deepEqual(actual, expected);
        });

        it('should make Protein vs mRNA quickplot', () => {
            const dataTypes: PlotsTabOption[] = [
                { value: 'PROTEIN_LEVEL', label: 'Protein' },
                { value: 'MRNA_EXPRESSION', label: 'mRNA' },
            ];
            const dataSources: PlotsTabDataSource = {
                PROTEIN_LEVEL: [
                    {
                        value: 'brca_tcga_protein_quantification',
                        label: 'Protein levels (mass spectrometry by CPTAC)',
                    },
                ],
            };
            const mutationCount = 1;
            const horizontal: TypeSourcePair = {
                type: 'MRNA_EXPRESSION',
                source: undefined,
            };
            const vertical: TypeSourcePair = {
                type: 'PROTEIN_LEVEL',
                source: 'undefined',
            };

            const actual = generateQuickPlots(
                dataTypes,
                dataSources,
                [],
                mutationCount,
                horizontal,
                vertical
            );
            const expected: ButtonInfo[] = [
                {
                    selected: true,
                    display: 'Protein vs mRNA',
                    plotModel: {
                        vertical: {
                            dataType: {
                                value: 'PROTEIN_LEVEL',
                                label: 'Protein',
                            },
                            dataSource: {
                                value: 'brca_tcga_protein_quantification',
                                label:
                                    'Protein levels (mass spectrometry by CPTAC)',
                            },
                            useSameGene: true,
                        },
                        horizontal: {
                            dataType: {
                                value: 'MRNA_EXPRESSION',
                                label: 'mRNA',
                            },
                            dataSource: undefined,
                        },
                    },
                },
            ];

            assert.deepEqual(actual, expected);
        });

        it('should make Protein vs mRNA quickplot', () => {
            const dataTypes: PlotsTabOption[] = [
                { value: 'PROTEIN_LEVEL', label: 'Protein' },
                { value: 'MRNA_EXPRESSION', label: 'mRNA' },
            ];
            const dataSources: PlotsTabDataSource = {
                PROTEIN_LEVEL: [
                    {
                        value: 'brca_tcga_protein_quantification',
                        label: 'Protein levels (mass spectrometry by CPTAC)',
                    },
                ],
            };
            const mutationCount = 1;
            const horizontal: TypeSourcePair = {
                type: 'MRNA_EXPRESSION',
                source: undefined,
            };
            const vertical: TypeSourcePair = {
                type: 'PROTEIN_LEVEL',
                source: undefined,
            };

            const actual = generateQuickPlots(
                dataTypes,
                dataSources,
                [],
                mutationCount,
                horizontal,
                vertical
            );
            const expected: ButtonInfo[] = [
                {
                    selected: true,
                    display: 'Protein vs mRNA',
                    plotModel: {
                        vertical: {
                            dataType: {
                                value: 'PROTEIN_LEVEL',
                                label: 'Protein',
                            },
                            dataSource: {
                                value: 'brca_tcga_protein_quantification',
                                label:
                                    'Protein levels (mass spectrometry by CPTAC)',
                            },
                            useSameGene: true,
                        },
                        horizontal: {
                            dataType: {
                                value: 'MRNA_EXPRESSION',
                                label: 'mRNA',
                            },
                            dataSource: undefined,
                        },
                    },
                },
            ];

            assert.deepEqual(actual, expected);
        });

        it('should make sample order vs treatment IC50 quickplot', () => {
            const dataTypes: PlotsTabOption[] = [
                {
                    value: GenericAssayTypeConstants.TREATMENT_RESPONSE,
                    label: 'Treatments',
                },
            ];
            const dataSources: PlotsTabDataSource = {};
            const horizontal: TypeSourcePair = {
                type: 'none',
                source: undefined,
            };
            const vertical: TypeSourcePair = {
                type: GenericAssayTypeConstants.TREATMENT_RESPONSE,
                source: undefined,
            };

            const actual = generateQuickPlots(
                dataTypes,
                dataSources,
                [],
                0,
                horizontal,
                vertical
            );
            const expected: ButtonInfo[] = [
                {
                    selected: true,
                    display: 'Tx Waterfall',
                    plotModel: {
                        vertical: {
                            dataType: {
                                value:
                                    GenericAssayTypeConstants.TREATMENT_RESPONSE,
                                label: 'Treatments',
                            },
                            dataSource: undefined,
                        },
                        horizontal: {
                            dataType: {
                                value: 'none',
                                label: 'Ordered samples',
                            },
                            dataSource: undefined,
                        },
                    },
                },
            ];

            assert.deepEqual(actual, expected);
        });

        it('should make fraction genome altered vs cancer type detailed quickplot', () => {
            const dataTypes: PlotsTabOption[] = [
                { value: 'clinical_attribute', label: 'Clinical Attribute' },
            ];
            const dataSources: PlotsTabDataSource = {
                clinical_attribute: [
                    {
                        value: 'FRACTION_GENOME_ALTERED',
                        label: 'Fraction Genome Altered',
                    },
                    {
                        value: 'CANCER_TYPE_DETAILED',
                        label: 'Cancer Type Detailed',
                    },
                ],
            };
            const cancerTypes = [
                'Colon Adenocarcinoma',
                'Colorectal Adenocarcinoma',
                'Rectal Adenocarcinoma',
            ];
            const horizontal: TypeSourcePair = {
                type: 'clinical_attribute',
                source: 'CANCER_TYPE_DETAILED',
            };
            const vertical: TypeSourcePair = {
                type: 'clinical_attribute',
                source: 'FRACTION_GENOME_ALTERED',
            };

            const actual = generateQuickPlots(
                dataTypes,
                dataSources,
                cancerTypes,
                0,
                horizontal,
                vertical
            );
            const expected: ButtonInfo[] = [
                {
                    selected: true,
                    display: 'FGA vs Dx',
                    plotModel: {
                        vertical: {
                            dataType: {
                                value: 'clinical_attribute',
                                label: 'Clinical Attribute',
                            },
                            dataSource: {
                                value: 'FRACTION_GENOME_ALTERED',
                                label: 'Fraction Genome Altered',
                            },
                        },
                        horizontal: {
                            dataType: {
                                value: 'clinical_attribute',
                                label: 'Clinical Attribute',
                            },
                            dataSource: {
                                value: 'CANCER_TYPE_DETAILED',
                                label: 'Cancer Type Detailed',
                            },
                        },
                    },
                },
            ];

            assert.deepEqual(actual, expected);
        });

        it('should make fraction genome altered vs cancer type quickplot', () => {
            const dataTypes: PlotsTabOption[] = [
                { value: 'clinical_attribute', label: 'Clinical Attribute' },
            ];
            const dataSources: PlotsTabDataSource = {
                clinical_attribute: [
                    {
                        value: 'FRACTION_GENOME_ALTERED',
                        label: 'Fraction Genome Altered',
                    },
                    { value: 'CANCER_TYPE', label: 'Cancer Type' },
                ],
            };
            const cancerTypes = [
                'Breast Invasive Ductal Carcinoma',
                'Peritoneal Mesothelioma',
                'Uterine Endometrioid Carcinoma',
                'ural Mesothelioma, Epithelioid Type',
                'Lung Adenocarcinoma',
                'Bladder Urothelial Carcinoma',
                'Hepatocellular Carcinoma',
                'Uterine Clear Cell Carcinoma',
                'Breast Mixed Ductal and Lobular Carcinoma',
                'Stomach Adenocarcinoma',
                'Upper Tract Urothelial Carcinoma',
                'High-Grade Serous Ovarian Cancer',
                'Clear Cell Ovarian Cancer',
                'Uterine Undifferentiated Carcinoma',
                'Uterine Leiomyosarcoma',
                'Yolk Sac Tumor',
            ];
            const horizontal: TypeSourcePair = {
                type: 'clinical_attribute',
                source: 'CANCER_TYPE_DETAILED',
            };
            const vertical: TypeSourcePair = {
                type: 'clinical_attribute',
                source: 'FRACTION_GENOME_ALTERED',
            };

            const actual = generateQuickPlots(
                dataTypes,
                dataSources,
                cancerTypes,
                0,
                horizontal,
                vertical
            );
            const expected: ButtonInfo[] = [
                {
                    selected: true,
                    display: 'FGA vs Dx',
                    plotModel: {
                        vertical: {
                            dataType: {
                                value: 'clinical_attribute',
                                label: 'Clinical Attribute',
                            },
                            dataSource: {
                                value: 'FRACTION_GENOME_ALTERED',
                                label: 'Fraction Genome Altered',
                            },
                        },
                        horizontal: {
                            dataType: {
                                value: 'clinical_attribute',
                                label: 'Clinical Attribute',
                            },
                            dataSource: {
                                value: 'CANCER_TYPE',
                                label: 'Cancer Type',
                            },
                        },
                    },
                },
            ];

            assert.deepEqual(actual, expected);
        });
    });
});
