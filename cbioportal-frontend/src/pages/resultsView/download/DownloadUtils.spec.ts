import { assert } from 'chai';

import { GeneticTrackDatum } from 'shared/components/oncoprint/Oncoprint';
import {
    GenePanelData,
    MolecularProfile,
    Sample,
} from 'cbioportal-ts-api-client';
import {
    generateCaseAlterationData,
    generateDownloadData,
    generateGeneAlterationData,
    generateMutationDownloadData,
    generateOqlData,
    updateOqlData,
    decideMolecularProfileSortingOrder,
    generateStructuralDownloadData,
} from './DownloadUtils';
import oql_parser, { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import {
    AnnotatedMutation,
    AnnotatedStructuralVariant,
} from 'shared/model/AnnotatedMutation';
import { ExtendedAlteration } from 'shared/model/ExtendedAlteration';

describe('DownloadUtils', () => {
    const genes = [
        {
            geneticEntityId: 4598,
            entrezGeneId: 5728,
            hugoGeneSymbol: 'PTEN',
            type: 'protein-coding',
        },
        {
            geneticEntityId: 5808,
            entrezGeneId: 7157,
            hugoGeneSymbol: 'TP53',
            type: 'protein-coding',
        },
        {
            geneticEntityId: 1575,
            entrezGeneId: 1956,
            hugoGeneSymbol: 'EGFR',
            type: 'protein-coding',
        },
    ];

    const samples = ([
        {
            uniqueSampleKey: 'UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3',
            uniquePatientKey: 'UC0wMDAwMzc4Om1za19pbXBhY3RfMjAxNw',
            sampleType: 'Primary Solid Tumor',
            sampleId: 'P-0000378-T01-IM3',
            patientId: 'P-0000378',
            studyId: 'msk_impact_2017',
        },
        {
            uniqueSampleKey: 'VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ',
            uniquePatientKey: 'VENHQS1FRS1BMjBDOnNrY21fdGNnYQ',
            sampleType: 'Metastatic',
            sampleId: 'TCGA-EE-A20C-06',
            patientId: 'TCGA-EE-A20C',
            studyId: 'skcm_tcga',
        },
    ] as unknown) as Sample[];

    const sampleDataWithNoAlteration: (ExtendedAlteration &
        AnnotatedMutation)[] = [];

    const mrnaDataForTCGAEEA20C = {
        oncoKbOncogenic: '',
        uniqueSampleKey: 'VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ',
        uniquePatientKey: 'VENHQS1FRS1BMjBDOnNrY21fdGNnYQ',
        molecularProfileId: 'skcm_tcga_rna_seq_v2_mrna_median_Zscores',
        sampleId: 'TCGA-EE-A20C-06',
        patientId: 'TCGA-EE-A20C',
        studyId: 'skcm_tcga',
        value: 2.4745,
        entrezGeneId: 5728,
        gene: {
            geneticEntityId: 4598,
            entrezGeneId: 5728,
            hugoGeneSymbol: 'PTEN',
            type: 'protein-coding',
        },
        molecularProfileAlterationType: 'MRNA_EXPRESSION',
        alterationType: 'MRNA_EXPRESSION',
        alterationSubType: 'high',
    };

    const proteinDataForTCGAEEA20C = {
        oncoKbOncogenic: '',
        uniqueSampleKey: 'VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ',
        uniquePatientKey: 'VENHQS1FRS1BMjBDOnNrY21fdGNnYQ',
        molecularProfileId: 'skcm_tcga_rppa_Zscores',
        sampleId: 'TCGA-EE-A20C-06',
        patientId: 'TCGA-EE-A20C',
        studyId: 'skcm_tcga',
        value: 2.5406,
        entrezGeneId: 5728,
        gene: {
            geneticEntityId: 4598,
            entrezGeneId: 5728,
            hugoGeneSymbol: 'PTEN',
            type: 'protein-coding',
        },
        molecularProfileAlterationType: 'PROTEIN_LEVEL',
        alterationType: 'PROTEIN_LEVEL',
        alterationSubType: 'high',
    };

    const cnaDataForTCGAEEA20C = {
        molecularProfileAlterationType: 'COPY_NUMBER_ALTERATION',
        uniqueSampleKey: 'VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ',
        uniquePatientKey: 'VENHQS1FRS1BMjBDOnNrY21fdGNnYQ',
        molecularProfileId: 'skcm_tcga_gistic',
        sampleId: 'TCGA-EE-A20C-06',
        patientId: 'TCGA-EE-A20C',
        studyId: 'skcm_tcga',
        value: -1,
        entrezGeneId: 7157,
        gene: {
            geneticEntityId: 5808,
            entrezGeneId: 7157,
            hugoGeneSymbol: 'TP53',
            type: 'protein-coding',
        },
    };

    const sampleDataWithMutation = [
        {
            putativeDriver: true,
            isHotspot: true,
            oncoKbOncogenic: 'likely oncogenic',
            simplifiedMutationType: 'missense',
            uniqueSampleKey: 'UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3',
            uniquePatientKey: 'UC0wMDAwMzc4Om1za19pbXBhY3RfMjAxNw',
            molecularProfileId: 'msk_impact_2017_mutations',
            sampleId: 'P-0000378-T01-IM3',
            patientId: 'P-0000378',
            entrezGeneId: 1956,
            gene: {
                geneticEntityId: 1575,
                entrezGeneId: 1956,
                hugoGeneSymbol: 'EGFR',
                type: 'protein-coding',
            },
            studyId: 'msk_impact_2017',
            center: 'NA',
            mutationStatus: 'Germline',
            validationStatus: 'NA',
            tumorAltCount: 425,
            tumorRefCount: 7757,
            normalAltCount: -1,
            normalRefCount: -1,
            startPosition: 55233043,
            endPosition: 55233043,
            referenceAllele: 'G',
            proteinChange: 'G598A',
            mutationType: 'Missense_Mutation',
            linkPdb:
                'getma.org/pdb.php?prot=EGFR_HUMAN&from=482&to=681&var=G598A',
            linkMsa:
                'getma.org/?cm=msa&ty=f&p=EGFR_HUMAN&rb=482&re=681&var=G598A',
            ncbiBuild: 'GRCh37',
            variantType: 'SNP',
            keyword: 'EGFR G598 missense',
            driverFilter: '',
            driverFilterAnnotation: '',
            driverTiersFilter: '',
            driverTiersFilterAnnotation: '',
            variantAllele: 'C',
            refseqMrnaId: 'NM_005228.3',
            proteinPosStart: 598,
            proteinPosEnd: 598,
            molecularProfileAlterationType: 'MUTATION_EXTENDED',
            alterationType: 'MUTATION_EXTENDED',
            alterationSubType: 'missense',
        },
        {
            putativeDriver: false,
            isHotspot: false,
            oncoKbOncogenic: '',
            simplifiedMutationType: 'missense',
            uniqueSampleKey: 'UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3',
            uniquePatientKey: 'UC0wMDAwMzc4Om1za19pbXBhY3RfMjAxNw',
            molecularProfileId: 'msk_impact_2017_mutations',
            sampleId: 'P-0000378-T01-IM3',
            patientId: 'P-0000378',
            entrezGeneId: 1956,
            gene: {
                geneticEntityId: 1575,
                entrezGeneId: 1956,
                hugoGeneSymbol: 'EGFR',
                type: 'protein-coding',
            },
            studyId: 'msk_impact_2017',
            center: 'NA',
            mutationStatus: 'NA',
            validationStatus: 'NA',
            tumorAltCount: 1694,
            tumorRefCount: 3870,
            normalAltCount: -1,
            normalRefCount: -1,
            startPosition: 55220325,
            endPosition: 55220325,
            referenceAllele: 'G',
            proteinChange: 'G239C',
            mutationType: 'Missense_Mutation',
            ncbiBuild: 'GRCh37',
            variantType: 'SNP',
            keyword: 'EGFR G239 missense',
            driverFilter: '',
            driverFilterAnnotation: '',
            driverTiersFilter: '',
            driverTiersFilterAnnotation: '',
            variantAllele: 'T',
            refseqMrnaId: 'NM_005228.3',
            proteinPosStart: 239,
            proteinPosEnd: 239,
            molecularProfileAlterationType: 'MUTATION_EXTENDED',
            alterationType: 'MUTATION_EXTENDED',
            alterationSubType: 'missense',
        },
    ] as (ExtendedAlteration & AnnotatedMutation)[];

    const sampleDataWithStructuralVariant = [
        {
            uniqueSampleKey: 'UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3',
            uniquePatientKey: 'UC0wMDAwMzc4Om1za19pbXBhY3RfMjAxNw',
            molecularProfileId: 'msk_impact_2017_fusion',
            sampleId: 'P-0000378-T01-IM3',
            patientId: 'P-0000378',
            studyId: 'msk_impact_2017',
            site1EntrezGeneId: 1956,
            site1HugoSymbol: 'EGFR',
            site1Chromosome: 'NA',
            site1Position: -1,
            ncbiBuild: 'NA',
            center: 'MSKCC-DMP',
            eventInfo: 'EGFR-intragenic',
            variantClass: 'INTRAGENIC',
            comments: 'EGFR EGFR-intragenic',
            molecularProfileAlterationType: 'STRUCTURAL_VARIANT',
            alterationType: 'STRUCTURAL_VARIANT',
            alterationSubType: '',
        },
    ] as (ExtendedAlteration & AnnotatedStructuralVariant)[];

    const caseAggregatedDataByOQLLine = [
        {
            cases: {
                samples: {
                    UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [
                        ...sampleDataWithMutation,
                        ...sampleDataWithStructuralVariant,
                    ],
                    VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [],
                },
            },
            oql: {
                gene: 'EGFR',
                oql_line: 'EGFR: AMP HOMDEL MUT FUSION;',
                parsed_oql_line: oql_parser.parse(
                    'EGFR: AMP HOMDEL MUT FUSION;'
                )![0],
                data: [
                    ...sampleDataWithMutation,
                    ...sampleDataWithStructuralVariant,
                ],
            },
        },
        {
            cases: {
                samples: {
                    UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [],
                    VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [
                        mrnaDataForTCGAEEA20C,
                        proteinDataForTCGAEEA20C,
                    ],
                },
            },
            oql: {
                gene: 'PTEN',
                oql_line: 'PTEN: AMP HOMDEL MUT FUSION;',
                parsed_oql_line: oql_parser.parse(
                    'PTEN: AMP HOMDEL MUT FUSION;'
                )![0],
                data: [mrnaDataForTCGAEEA20C, proteinDataForTCGAEEA20C],
            },
        },
        {
            cases: {
                samples: {
                    UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [],
                    VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [],
                },
            },
            oql: {
                gene: 'TP53',
                oql_line: 'TP53: AMP HOMDEL MUT FUSION;',
                parsed_oql_line: oql_parser.parse(
                    'TP53: AMP HOMDEL MUT FUSION;'
                )![0],
                data: [],
            },
        },
    ] as any;

    describe('generateOqlData', () => {
        it('generates empty oql data for a sample with no alteration data', () => {
            const geneticTrackDatum: GeneticTrackDatum = {
                sample: 'TCGA-BF-A1PV-01',
                patient: 'TCGA-BF-A1PV',
                study_id: 'skcm_tcga',
                uid: 'VENHQS1CRi1BMVBWLTAxOnNrY21fdGNnYQ',
                trackLabel: 'PTEN',
                data: sampleDataWithNoAlteration,
            };

            const oqlData = generateOqlData(geneticTrackDatum);

            assert.equal(
                oqlData.geneSymbol,
                'PTEN',
                'gene symbol is correct for the sample with no alteration'
            );
            assert.equal(
                oqlData.cna.length,
                0,
                'cna data is empty for the sample with no alteration'
            );
            assert.equal(
                oqlData.mutation.length,
                0,
                'mutation data is empty for the sample with no alteration'
            );
            assert.equal(
                oqlData.structuralVariant.length,
                0,
                'structural variant data is empty for the sample with no alteration'
            );
            assert.equal(
                oqlData.mrnaExp.length,
                0,
                'mRNA expression data is empty for the sample with no alteration'
            );
            assert.equal(
                oqlData.proteinLevel.length,
                0,
                'protein level data is empty for the sample with no alteration'
            );
        });

        it('generates oql data properly for samples with multiple alteration types', () => {
            const geneticTrackDatum: GeneticTrackDatum = {
                sample: 'TCGA-EE-A20C-06',
                patient: 'TCGA-EE-A20C',
                study_id: 'skcm_tcga',
                uid: 'VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ',
                trackLabel: 'PTEN',
                data: [
                    mrnaDataForTCGAEEA20C,
                    proteinDataForTCGAEEA20C,
                ] as any[],
                disp_mrna: 'high',
                disp_prot: 'high',
            };

            const oqlData = generateOqlData(geneticTrackDatum);

            assert.equal(
                oqlData.geneSymbol,
                'PTEN',
                'gene symbol is correct for the sample with mrna and protein data only'
            );
            assert.equal(
                oqlData.cna.length,
                0,
                'cna data is empty for the sample with mrna and protein data only'
            );
            assert.equal(
                oqlData.mutation.length,
                0,
                'mutation data is empty for the sample with mrna and protein data only'
            );
            assert.equal(
                oqlData.structuralVariant.length,
                0,
                'structural variant data is empty for the sample with mrna and protein data only'
            );

            assert.equal(
                oqlData.mrnaExp.length,
                1,
                'mRNA expression data exists for the sample with mrna and protein data only'
            );
            assert.equal(
                oqlData.proteinLevel.length,
                1,
                'protein level data exists for the sample with mrna and protein data only'
            );

            assert.deepEqual(
                oqlData.mrnaExp,
                [{ type: 'HIGH', value: 2.4745 }],
                'mRNA expression data is correct for the sample with mrna and protein data only'
            );
            assert.deepEqual(
                oqlData.proteinLevel,
                [{ type: 'HIGH', value: 2.5406 }],
                'protein level data is correct for the sample with mrna and protein data only'
            );
        });

        it('generates oql data properly for samples with multiple mutations/fusions', () => {
            const geneticTrackDatum: GeneticTrackDatum = {
                sample: 'P-0000378-T01-IM3',
                patient: 'P-0000378',
                study_id: 'msk_impact_2017',
                uid: 'UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3',
                trackLabel: 'EGFR',
                data: [
                    ...sampleDataWithMutation,
                    ...sampleDataWithStructuralVariant,
                ],
                disp_structuralVariant: 'sv',
                disp_cna: 'amp',
                disp_mut: 'missense_rec',
            };

            const oqlData = generateOqlData(geneticTrackDatum);

            assert.equal(
                oqlData.geneSymbol,
                'EGFR',
                'gene symbol is correct for the sample with both mutation and structural variant data'
            );
            assert.deepEqual(
                oqlData.mrnaExp,
                [],
                'mRNA expression data is empty for the sample with mutation and structural variant data'
            );
            assert.deepEqual(
                oqlData.proteinLevel,
                [],
                'protein level data is empty for the sample with mutation and structural variant data'
            );
            assert.deepEqual(
                oqlData.cna,
                [],
                'CNA data is empty for the sample with mutation and structural variant data'
            );
            assert.deepEqual(
                oqlData.structuralVariant,
                ['EGFR-intragenic'],
                'structural variant data is correct for the sample with mutation and structural variant data'
            );
            assert.deepEqual(
                oqlData.mutation,
                [
                    {
                        proteinChange: 'G598A',
                        isGermline: true,
                        putativeDriver: true,
                    },
                    {
                        proteinChange: 'G239C',
                        isGermline: false,
                        putativeDriver: false,
                    },
                ],
                'mutation data is correct for the sample with mutation and fusion data'
            );
        });
    });

    describe('generateGeneAlterationData', () => {
        it('returns empty list in case of empty input', () => {
            const sampleKeys = {};

            const caseAlterationData = generateGeneAlterationData(
                caseAggregatedDataByOQLLine,
                sampleKeys
            );

            assert.equal(
                caseAlterationData.length,
                0,
                'case alteration data should be empty'
            );
        });

        it('generates gene alteration data for multiple samples', () => {
            const sampleKeys = {
                PTEN: [
                    'UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3',
                    'VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ',
                ],
                TP53: [
                    'UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3',
                    'VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ',
                ],
                EGFR: [
                    'UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3',
                    'VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ',
                ],
            };

            const caseAlterationData = generateGeneAlterationData(
                caseAggregatedDataByOQLLine,
                sampleKeys
            );

            assert.equal(
                caseAlterationData[0].oqlLine,
                'EGFR: AMP HOMDEL MUT FUSION;',
                'OQL line is correct for the gene EGFR'
            );
            assert.equal(
                caseAlterationData[0].altered,
                1,
                'number of altered samples is correct for the gene EGFR'
            );
            assert.equal(
                caseAlterationData[0].percentAltered,
                '50%',
                'alteration percent is correct for the gene EGFR'
            );

            assert.equal(
                caseAlterationData[1].oqlLine,
                'PTEN: AMP HOMDEL MUT FUSION;',
                'OQL line is correct for the gene PTEN'
            );
            assert.equal(
                caseAlterationData[1].altered,
                1,
                'number of altered samples is correct for the gene PTEN'
            );
            assert.equal(
                caseAlterationData[1].percentAltered,
                '50%',
                'alteration percent is correct for the gene PTEN'
            );

            assert.equal(
                caseAlterationData[2].oqlLine,
                'TP53: AMP HOMDEL MUT FUSION;',
                'OQL line is correct for the gene TP53'
            );
            assert.equal(
                caseAlterationData[2].altered,
                0,
                'number of altered samples is correct for the gene TP53'
            );
            assert.equal(
                caseAlterationData[2].percentAltered,
                '0%',
                'alteration percent is correct for the gene TP53'
            );
        });
    });

    describe('generateMutationDownloadData', () => {
        it('generates download data for mutated samples', () => {
            const sampleAlterationDataByGene = {
                EGFR_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [
                    ...sampleDataWithMutation,
                ],
                PTEN_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [],
                TP53_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [],
                EGFR_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [],
                PTEN_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [],
                TP53_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [],
            };

            const downloadData = generateMutationDownloadData(
                sampleAlterationDataByGene,
                samples,
                genes,
                (uniqueSampleKey: string, study: string, gene: string) => {
                    return !(
                        uniqueSampleKey ===
                            'VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ' &&
                        gene === 'PTEN'
                    );
                }
            );

            const expectedResult = [
                ['STUDY_ID', 'SAMPLE_ID', 'PTEN', 'TP53', 'EGFR'],
                [
                    'msk_impact_2017',
                    'P-0000378-T01-IM3',
                    'WT',
                    'WT',
                    'G598A [germline] G239C',
                ],
                ['skcm_tcga', 'TCGA-EE-A20C-06', 'NP', 'WT', 'WT'],
            ];

            assert.deepEqual(
                downloadData,
                expectedResult,
                'mutation download data is correctly generated'
            );
        });
    });

    describe('generateStructuralVariantDownloadData', () => {
        it('generates download data for structural variant samples', () => {
            const sampleAlterationDataByGene = {
                EGFR_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [
                    ...sampleDataWithStructuralVariant,
                ],
                PTEN_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [],
                TP53_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [],
                EGFR_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [],
                PTEN_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [],
                TP53_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [],
            };

            const downloadData = generateStructuralDownloadData(
                sampleAlterationDataByGene,
                samples,
                genes,
                () => true
            );

            const expectedResult = [
                ['STUDY_ID', 'SAMPLE_ID', 'PTEN', 'TP53', 'EGFR'],
                [
                    'msk_impact_2017',
                    'P-0000378-T01-IM3',
                    'NA',
                    'NA',
                    'EGFR-intragenic',
                ],
                ['skcm_tcga', 'TCGA-EE-A20C-06', 'NA', 'NA', 'NA'],
            ];

            assert.deepEqual(
                downloadData,
                expectedResult,
                'structural variant download data is correctly generated'
            );
        });
    });

    describe('generateDownloadData', () => {
        it('generates download data for mRNA expression alterations', () => {
            const sampleAlterationDataByGene = {
                EGFR_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [],
                PTEN_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [],
                TP53_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [],
                EGFR_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [],
                PTEN_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [
                    mrnaDataForTCGAEEA20C as ExtendedAlteration &
                        AnnotatedMutation,
                ],
                TP53_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [],
            };

            const downloadData = generateDownloadData(
                sampleAlterationDataByGene,
                samples,
                genes,
                (uniqueSampleKey: string, study: string, gene: string) => {
                    return !(
                        uniqueSampleKey ===
                            'VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ' &&
                        gene === 'EGFR'
                    );
                }
            );

            const expectedResult = [
                ['STUDY_ID', 'SAMPLE_ID', 'PTEN', 'TP53', 'EGFR'],
                ['msk_impact_2017', 'P-0000378-T01-IM3', 'NA', 'NA', 'NA'],
                ['skcm_tcga', 'TCGA-EE-A20C-06', '2.4745', 'NA', 'NP'],
            ];

            assert.deepEqual(
                downloadData,
                expectedResult,
                'mRNA download data is correctly generated'
            );
        });

        it('generates download data for protein expression alterations', () => {
            const sampleAlterationDataByGene = {
                EGFR_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [],
                PTEN_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [],
                TP53_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [],
                EGFR_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [],
                PTEN_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [
                    proteinDataForTCGAEEA20C as ExtendedAlteration &
                        AnnotatedMutation,
                ],
                TP53_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [],
            };

            const downloadData = generateDownloadData(
                sampleAlterationDataByGene,
                samples,
                genes,
                (uniqueSampleKey: string, study: string, gene: string) => {
                    return !(
                        uniqueSampleKey ===
                            'VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ' &&
                        gene === 'TP53'
                    );
                }
            );

            const expectedResult = [
                ['STUDY_ID', 'SAMPLE_ID', 'PTEN', 'TP53', 'EGFR'],
                ['msk_impact_2017', 'P-0000378-T01-IM3', 'NA', 'NA', 'NA'],
                ['skcm_tcga', 'TCGA-EE-A20C-06', '2.5406', 'NP', 'NA'],
            ];

            assert.deepEqual(
                downloadData,
                expectedResult,
                'protein download data is correctly generated'
            );
        });

        it('generates download data for copy number altered samples', () => {
            const sampleAlterationDataByGene = {
                EGFR_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [],
                PTEN_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [],
                TP53_UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: [],
                EGFR_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [],
                PTEN_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [],
                TP53_VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: [
                    cnaDataForTCGAEEA20C as ExtendedAlteration &
                        AnnotatedMutation,
                ],
            };

            const downloadData = generateDownloadData(
                sampleAlterationDataByGene,
                samples,
                genes,
                (uniqueSampleKey: string, study: string, gene: string) => {
                    return !(
                        uniqueSampleKey ===
                            'UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3' &&
                        gene !== 'PTEN'
                    );
                }
            );

            const expectedResult = [
                ['STUDY_ID', 'SAMPLE_ID', 'PTEN', 'TP53', 'EGFR'],
                ['msk_impact_2017', 'P-0000378-T01-IM3', 'NA', 'NP', 'NP'],
                ['skcm_tcga', 'TCGA-EE-A20C-06', 'NA', '-1', 'NA'],
            ];

            assert.deepEqual(
                downloadData,
                expectedResult,
                'CNA download data is correctly generated'
            );
        });
    });

    describe('generateCaseAlterationData', () => {
        it('properly handles not sequenced genes when generating case alteration data', () => {
            const genePanelInformation = {
                samples: {
                    UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: {
                        byGene: {},
                        allGenes: [],
                        notProfiledByGene: {},
                        notProfiledAllGenes: [],
                    },
                    VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: {
                        byGene: {},
                        allGenes: [
                            {
                                molecularProfileId: 'AsdfasD',
                                profiled: true,
                            } as GenePanelData,
                        ],
                        notProfiledByGene: {},
                        notProfiledAllGenes: [],
                    },
                },
                patients: {},
            };

            const geneAlterationData = {
                EGFR: {
                    gene: 'EGFR',
                    oqlLine: 'EGFR: AMP HOMDEL MUT FUSION;',
                    sequenced: 0,
                    altered: 0,
                    percentAltered: 'N/S',
                },
            };

            const selectedMolecularProfiles = [
                { molecularProfileId: 'AsdfasD' } as MolecularProfile,
            ];

            const caseAlterationData = generateCaseAlterationData(
                'EGFR TP53 PTEN',
                (oql_parser.parse(
                    'DUMMYGENE: AMP HOMDEL MUT FUSION'
                )![0] as SingleGeneQuery).alterations,
                selectedMolecularProfiles,
                caseAggregatedDataByOQLLine,
                caseAggregatedDataByOQLLine,
                genePanelInformation,
                samples,
                geneAlterationData
            );

            assert.isFalse(
                caseAlterationData[0].oqlData['EGFR'].sequenced,
                'cases with the gene EGFR should be marked as not sequenced'
            );

            assert.isTrue(
                caseAlterationData[1].oqlData['PTEN'].sequenced,
                'cases with the gene other than EGFR should be marked as sequenced'
            );
        });

        it('generates case alteration data for multiple samples', () => {
            const genePanelInformation = {
                samples: {
                    UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3: {
                        byGene: {},
                        allGenes: [
                            {
                                molecularProfileId: 'AsdfasD',
                                profiled: true,
                            } as GenePanelData,
                        ],
                        notProfiledByGene: {},
                        notProfiledAllGenes: [],
                    },
                    VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ: {
                        byGene: {},
                        allGenes: [
                            {
                                molecularProfileId: 'AsdfasD',
                                profiled: true,
                            } as GenePanelData,
                        ],
                        notProfiledByGene: {},
                        notProfiledAllGenes: [],
                    },
                },
                patients: {},
            };

            const selectedMolecularProfiles = [
                { molecularProfileId: 'AsdfasD' } as MolecularProfile,
            ];

            const caseAlterationData = generateCaseAlterationData(
                'EGFR TP53 PTEN',
                (oql_parser.parse(
                    'DUMMYGENE: AMP HOMDEL MUT FUSION'
                )![0] as SingleGeneQuery).alterations,
                selectedMolecularProfiles,
                caseAggregatedDataByOQLLine,
                caseAggregatedDataByOQLLine,
                genePanelInformation,
                samples
            );

            assert.equal(
                caseAlterationData.length,
                2,
                'case alteration data has correct size'
            );

            assert.equal(
                caseAlterationData[0].sampleId,
                'P-0000378-T01-IM3',
                'sample id is correct for the sample key UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3'
            );
            assert.equal(
                caseAlterationData[0].studyId,
                'msk_impact_2017',
                'study id is correct for the sample key UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3'
            );
            assert.isTrue(
                caseAlterationData[0].altered,
                'sample UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3 is altered'
            );
            assert.deepEqual(
                caseAlterationData[0].oqlData['EGFR'].mutation,
                [
                    {
                        proteinChange: 'G598A',
                        isGermline: true,
                        putativeDriver: true,
                    },
                    {
                        proteinChange: 'G239C',
                        isGermline: false,
                        putativeDriver: false,
                    },
                ],
                'mutation data is correct for the sample key UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3'
            );
            assert.deepEqual(
                caseAlterationData[0].oqlData['EGFR'].structuralVariant,
                ['EGFR-intragenic'],
                'structural variant data is correct for the sample key UC0wMDAwMzc4LVQwMS1JTTM6bXNrX2ltcGFjdF8yMDE3'
            );

            assert.equal(
                caseAlterationData[1].sampleId,
                'TCGA-EE-A20C-06',
                'sample id is correct for the sample key VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ'
            );
            assert.equal(
                caseAlterationData[1].studyId,
                'skcm_tcga',
                'study id is correct for the sample key VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ'
            );
            assert.isTrue(
                caseAlterationData[1].altered,
                'sample VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ is altered'
            );
            assert.deepEqual(
                caseAlterationData[1].oqlData['PTEN'].mrnaExp,
                [{ type: 'HIGH', value: 2.4745 }],
                'mRNA data is correct for the sample key VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ'
            );
            assert.deepEqual(
                caseAlterationData[1].oqlData['PTEN'].proteinLevel,
                [{ type: 'HIGH', value: 2.5406 }],
                'protein data is correct for the sample key VENHQS1FRS1BMjBDLTA2OnNrY21fdGNnYQ'
            );
        });
    });

    describe('sampleOqlReport', () => {
        it('properly updates oql data', () => {
            const sampleOql = {
                sequenced: true,
                geneSymbol: 'EGFR',
                mutation: [],
                structuralVariant: [],
                cna: [],
                mrnaExp: [],
                proteinLevel: [],
                isMutationNotProfiled: false,
                isStructuralVariantNotProfiled: false,
                isCnaNotProfiled: false,
                isMrnaExpNotProfiled: false,
                isProteinLevelNotProfiled: false,
                alterationTypes: [],
            };

            const notProfiledGeneticTrackDatum: GeneticTrackDatum[] = [
                {
                    sample: 'TCGA-S9-A7J0-01',
                    patient: 'TCGA-S9-A7J0',
                    study_id: 'lgg_tcga',
                    uid: 'VENHQS1TOS1BN0owLTAxOmxnZ190Y2dh',
                    profiled_in: [
                        {
                            uniqueSampleKey: 'VENHQS1EVS02Mzk1LTAxOmxnZ190Y2dh',
                            uniquePatientKey: 'VENHQS1EVS02Mzk1OmxnZ190Y2dh',
                            molecularProfileId: 'lgg_tcga_gistic',
                            sampleId: 'TCGA-DU-6395-01',
                            patientId: 'TCGA-DU-6395',
                            studyId: 'lgg_tcga',
                            profiled: true,
                        } as GenePanelData,
                        {
                            uniqueSampleKey: 'VENHQS1EVS02Mzk1LTAxOmxnZ190Y2dh',
                            uniquePatientKey: 'VENHQS1EVS02Mzk1OmxnZ190Y2dh',
                            molecularProfileId: 'lgg_tcga_mutations',
                            sampleId: 'TCGA-DU-6395-01',
                            patientId: 'TCGA-DU-6395',
                            studyId: 'lgg_tcga',
                            profiled: true,
                        } as GenePanelData,
                    ],
                    trackLabel: 'EGFR',
                    data: [],
                },
                {
                    sample: 'TCGA-F6-A8O3-01',
                    patient: 'TCGA-F6-A8O3',
                    study_id: 'lgg_tcga',
                    uid: 'VENHQS1GNi1BOE8zLTAxOmxnZ190Y2dh',
                    profiled_in: [
                        {
                            uniqueSampleKey: 'VENHQS1GNi1BOE8zLTAxOmxnZ190Y2dh',
                            uniquePatientKey: 'VENHQS1GNi1BOE8zOmxnZ190Y2dh',
                            molecularProfileId: 'lgg_tcga_gistic',
                            sampleId: 'TCGA-F6-A8O3-01',
                            patientId: 'TCGA-F6-A8O3',
                            studyId: 'lgg_tcga',
                            profiled: true,
                        } as GenePanelData,
                    ],
                    not_profiled_in: [
                        {
                            uniqueSampleKey: 'VENHQS1GNi1BOE8zLTAxOmxnZ190Y2dh',
                            uniquePatientKey: 'VENHQS1GNi1BOE8zOmxnZ190Y2dh',
                            molecularProfileId: 'lgg_tcga_mutations',
                            sampleId: 'TCGA-F6-A8O3-01',
                            patientId: 'TCGA-F6-A8O3',
                            studyId: 'lgg_tcga',
                            profiled: false,
                        } as GenePanelData,
                    ],
                    trackLabel: 'EGFR',
                    data: [],
                },
                {
                    sample: 'TCGA-DU-6396-01',
                    patient: 'TCGA-DU-6396',
                    study_id: 'lgg_tcga',
                    uid: 'VENHQS1EVS02Mzk2LTAxOmxnZ190Y2dh',
                    profiled_in: [],
                    not_profiled_in: [
                        {
                            uniqueSampleKey: 'VENHQS1EVS02Mzk2LTAxOmxnZ190Y2dh',
                            uniquePatientKey: 'VENHQS1EVS02Mzk2OmxnZ190Y2dh',
                            molecularProfileId: 'lgg_tcga_gistic',
                            sampleId: 'TCGA-DU-6396-01',
                            patientId: 'TCGA-DU-6396',
                            studyId: 'lgg_tcga',
                            profiled: true,
                        } as GenePanelData,
                        {
                            uniqueSampleKey: 'VENHQS1EVS02Mzk2LTAxOmxnZ190Y2dh',
                            uniquePatientKey: 'VENHQS1EVS02Mzk2OmxnZ190Y2dh',
                            molecularProfileId: 'lgg_tcga_mutations',
                            sampleId: 'TCGA-DU-6396-01',
                            patientId: 'TCGA-DU-6396',
                            studyId: 'lgg_tcga',
                            profiled: true,
                        } as GenePanelData,
                    ],
                    trackLabel: 'EGFR',
                    data: [],
                },
            ];

            const sampleMolecularProfileIdToMolecularProfile: {
                [molecularProfileId: string]: MolecularProfile;
            } = {
                lgg_tcga_rppa: {
                    molecularAlterationType: 'PROTEIN_LEVEL',
                    datatype: 'LOG2-VALUE',
                    name: 'Protein expression (RPPA)',
                    description:
                        'Protein expression measured by reverse-phase protein array',
                    showProfileInAnalysisTab: false,
                    molecularProfileId: 'lgg_tcga_rppa',
                    studyId: 'lgg_tcga',
                } as MolecularProfile,
                lgg_tcga_rppa_Zscores: {
                    molecularAlterationType: 'PROTEIN_LEVEL',
                    datatype: 'Z-SCORE',
                    name: 'Protein expression Z-scores (RPPA)',
                    description:
                        'Protein expression, measured by reverse-phase protein array, Z-scores',
                    showProfileInAnalysisTab: true,
                    molecularProfileId: 'lgg_tcga_rppa_Zscores',
                    studyId: 'lgg_tcga',
                } as MolecularProfile,
                lgg_tcga_gistic: {
                    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
                    datatype: 'DISCRETE',
                    name: 'Putative copy-number alterations from GISTIC',
                    description:
                        'Putative copy-number calls on 513 cases determined using GISTIC 2.0. Values: -2 = homozygous deletion; -1 = hemizygous deletion; 0 = neutral / no change; 1 = gain; 2 = high level amplification.',
                    showProfileInAnalysisTab: true,
                    molecularProfileId: 'lgg_tcga_gistic',
                    studyId: 'lgg_tcga',
                } as MolecularProfile,
                lgg_tcga_mrna: {
                    molecularAlterationType: 'MRNA_EXPRESSION',
                    datatype: 'CONTINUOUS',
                    name: 'mRNA expression (microarray)',
                    description:
                        'Expression levels for 17155 genes in 27 difg cases (Agilent microarray).',
                    showProfileInAnalysisTab: false,
                    molecularProfileId: 'lgg_tcga_mrna',
                    studyId: 'lgg_tcga',
                } as MolecularProfile,
                lgg_tcga_mrna_median_Zscores: {
                    molecularAlterationType: 'MRNA_EXPRESSION',
                    datatype: 'Z-SCORE',
                    name: 'mRNA Expression z-Scores (microarray)',
                    description:
                        'mRNA z-Scores (Agilent microarray) compared to the expression distribution of each gene tumors that are diploid for this gene.',
                    showProfileInAnalysisTab: true,
                    molecularProfileId: 'lgg_tcga_mrna_median_Zscores',
                    studyId: 'lgg_tcga',
                } as MolecularProfile,
                lgg_tcga_rna_seq_v2_mrna: {
                    molecularAlterationType: 'MRNA_EXPRESSION',
                    datatype: 'CONTINUOUS',
                    name: 'mRNA expression (RNA Seq V2 RSEM)',
                    description:
                        'Expression levels for 20532 genes in 530 difg cases (RNA Seq V2 RSEM).',
                    showProfileInAnalysisTab: false,
                    molecularProfileId: 'lgg_tcga_rna_seq_v2_mrna',
                    studyId: 'lgg_tcga',
                } as MolecularProfile,
                lgg_tcga_rna_seq_v2_mrna_median_Zscores: {
                    molecularAlterationType: 'MRNA_EXPRESSION',
                    datatype: 'Z-SCORE',
                    name: 'mRNA Expression z-Scores (RNA Seq V2 RSEM)',
                    description:
                        'mRNA z-Scores (RNA Seq V2 RSEM) compared to the expression distribution of each gene tumors that are diploid for this gene.',
                    showProfileInAnalysisTab: true,
                    molecularProfileId:
                        'lgg_tcga_rna_seq_v2_mrna_median_Zscores',
                    studyId: 'lgg_tcga',
                } as MolecularProfile,
                lgg_tcga_linear_CNA: {
                    molecularAlterationType: 'COPY_NUMBER_ALTERATION',
                    datatype: 'CONTINUOUS',
                    name: 'Relative linear copy-number values',
                    description:
                        'Relative linear copy-number values for each gene (from Affymetrix SNP6).',
                    showProfileInAnalysisTab: false,
                    molecularProfileId: 'lgg_tcga_linear_CNA',
                    studyId: 'lgg_tcga',
                } as MolecularProfile,
                lgg_tcga_methylation_hm450: {
                    molecularAlterationType: 'METHYLATION',
                    datatype: 'CONTINUOUS',
                    name: 'Methylation (HM450)',
                    description:
                        'Methylation (HM450) beta-values for genes in 530 cases. For genes with multiple methylation probes, the probe most anti-correlated with expression.',
                    showProfileInAnalysisTab: false,
                    molecularProfileId: 'lgg_tcga_methylation_hm450',
                    studyId: 'lgg_tcga',
                } as MolecularProfile,
                lgg_tcga_mutations: {
                    molecularAlterationType: 'MUTATION_EXTENDED',
                    datatype: 'MAF',
                    name: 'Mutations',
                    description:
                        'Mutation data from whole exome sequencing. Mutation packager: LGG/20160128/gdac.broadinstitute.org_LGG.Mutation_Packager_Calls.Level_3.2016012800.0.0.tar.gz.',
                    showProfileInAnalysisTab: true,
                    molecularProfileId: 'lgg_tcga_mutations',
                    studyId: 'lgg_tcga',
                } as MolecularProfile,
            };

            const oqlData0 = updateOqlData(
                notProfiledGeneticTrackDatum[0],
                sampleOql,
                sampleMolecularProfileIdToMolecularProfile
            );

            assert.equal(
                oqlData0.isCnaNotProfiled,
                false,
                'cna is profiled for the zero not profiled GeneticTrackDatum'
            );
            assert.equal(
                oqlData0.isStructuralVariantNotProfiled,
                false,
                'structural variant is profiled for the zero not profiled GeneticTrackDatum'
            );
            assert.equal(
                oqlData0.isMrnaExpNotProfiled,
                true,
                'mrna is profiled for the zero not profiled GeneticTrackDatum'
            );
            assert.equal(
                oqlData0.isMutationNotProfiled,
                false,
                'mutation is profiled for the zero not profiled GeneticTrackDatum'
            );
            assert.equal(
                oqlData0.isProteinLevelNotProfiled,
                true,
                'protein level is profiled for the zero not profiled GeneticTrackDatum'
            );

            const oqlData1 = updateOqlData(
                notProfiledGeneticTrackDatum[1],
                sampleOql,
                sampleMolecularProfileIdToMolecularProfile
            );

            assert.equal(
                oqlData1.isCnaNotProfiled,
                false,
                'cna is profiled for the one not profiled GeneticTrackDatum'
            );
            assert.equal(
                oqlData1.isStructuralVariantNotProfiled,
                true,
                'structural variant is not profiled for the one not profiled GeneticTrackDatum'
            );
            assert.equal(
                oqlData1.isMrnaExpNotProfiled,
                true,
                'mrna is profiled for the one not profiled GeneticTrackDatum'
            );
            assert.equal(
                oqlData1.isMutationNotProfiled,
                true,
                'mutation is not profiled for the one not profiled GeneticTrackDatum'
            );
            assert.equal(
                oqlData1.isProteinLevelNotProfiled,
                true,
                'protein level is profiled for the one not profiled GeneticTrackDatum'
            );

            const oqlData2 = updateOqlData(
                notProfiledGeneticTrackDatum[2],
                sampleOql,
                sampleMolecularProfileIdToMolecularProfile
            );

            assert.equal(
                oqlData2.isCnaNotProfiled,
                true,
                'cna is not profiled for the two not profiled GeneticTrackDatum'
            );
            assert.equal(
                oqlData2.isStructuralVariantNotProfiled,
                true,
                'structural variant is not profiled for the two not profiled GeneticTrackDatum'
            );
            assert.equal(
                oqlData2.isMrnaExpNotProfiled,
                true,
                'mrna is profiled for the two not profiled GeneticTrackDatum'
            );
            assert.equal(
                oqlData2.isMutationNotProfiled,
                true,
                'mutation is not profiled for the two not profiled GeneticTrackDatum'
            );
            assert.equal(
                oqlData2.isProteinLevelNotProfiled,
                true,
                'protein level is profiled for the two not profiled GeneticTrackDatum'
            );
        });
    });

    describe('molecularProfileSortingOrder', () => {
        it('should return specific number for 7 specific molecular profile types', () => {
            assert.equal(
                decideMolecularProfileSortingOrder('MUTATION_EXTENDED'),
                1,
                'MUTATION_EXTENDED should be the 1st type'
            );
            assert.equal(
                decideMolecularProfileSortingOrder('COPY_NUMBER_ALTERATION'),
                2,
                'COPY_NUMBER_ALTERATION should be the 2nd type'
            );
            assert.equal(
                decideMolecularProfileSortingOrder('GENESET_SCORE'),
                3,
                'GENESET_SCORE should be the 3rd type'
            );
            assert.equal(
                decideMolecularProfileSortingOrder('MRNA_EXPRESSION'),
                4,
                'MRNA_EXPRESSION should be the 4th type'
            );
            assert.equal(
                decideMolecularProfileSortingOrder('METHYLATION'),
                5,
                'METHYLATION should be the 5th type'
            );
            assert.equal(
                decideMolecularProfileSortingOrder('METHYLATION_BINARY'),
                6,
                'METHYLATION_BINARY should be the 6th type'
            );
            assert.equal(
                decideMolecularProfileSortingOrder('PROTEIN_LEVEL'),
                7,
                'PROTEIN_LEVEL should be the 7th type'
            );
        });

        it('should return maximum number for the other types', () => {
            assert.equal(
                decideMolecularProfileSortingOrder('STRUCTURAL_VARIANT'),
                Number.MAX_VALUE,
                'STRUCTURAL_VARIANT should be put to the end'
            );
        });
    });
});
