import { assert } from 'chai';
import {
    getMolecularDataBuckets,
    prioritizeMutations,
    getPossibleRNASeqVersions,
} from './expressionHelpers';
import { CoverageInformation } from '../../../shared/lib/GenePanelUtils';
import {
    studyData as sampleStudyData,
    mutationsKeyedBySampleId,
    coverageInformation,
} from './expressionHelpers.sample.js';
import { Mutation, NumericGeneMolecularData } from 'cbioportal-ts-api-client';
import { assertDeepEqualInAnyOrder } from 'shared/lib/SpecUtils';

describe('getMolecularDataBuckets', () => {
    let expectedResult: any;

    let sampleMolecularData: NumericGeneMolecularData[];

    beforeAll(() => {
        sampleMolecularData = sampleStudyData as NumericGeneMolecularData[];
        expectedResult = {
            mutationBuckets: {
                missense: [
                    {
                        uniqueSampleKey:
                            'VENHQS1BQi0yODEzLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        uniquePatientKey:
                            'VENHQS1BQi0yODEzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        entrezGeneId: 7157,
                        molecularProfileId:
                            'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                        sampleId: 'TCGA-AB-2813-03',
                        patientId: 'TCGA-AB-2813',
                        studyId: 'laml_tcga_pan_can_atlas_2018',
                        value: 1933.49628137823,
                    },
                    {
                        uniqueSampleKey:
                            'VENHQS1BQi0yODg1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        uniquePatientKey:
                            'VENHQS1BQi0yODg1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        entrezGeneId: 7157,
                        molecularProfileId:
                            'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                        sampleId: 'TCGA-AB-2885-03',
                        patientId: 'TCGA-AB-2885',
                        studyId: 'laml_tcga_pan_can_atlas_2018',
                        value: 3611.93208371068,
                    },
                    {
                        uniqueSampleKey:
                            'VENHQS1BQi0yOTA0LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        uniquePatientKey:
                            'VENHQS1BQi0yOTA0OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        entrezGeneId: 7157,
                        molecularProfileId:
                            'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                        sampleId: 'TCGA-AB-2904-03',
                        patientId: 'TCGA-AB-2904',
                        studyId: 'laml_tcga_pan_can_atlas_2018',
                        value: 2207.05060168879,
                    },
                    {
                        uniqueSampleKey:
                            'VENHQS1BQi0yOTA4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        uniquePatientKey:
                            'VENHQS1BQi0yOTA4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        entrezGeneId: 7157,
                        molecularProfileId:
                            'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                        sampleId: 'TCGA-AB-2908-03',
                        patientId: 'TCGA-AB-2908',
                        studyId: 'laml_tcga_pan_can_atlas_2018',
                        value: 736.368378251112,
                    },
                    {
                        uniqueSampleKey:
                            'VENHQS1BQi0yOTM1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        uniquePatientKey:
                            'VENHQS1BQi0yOTM1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        entrezGeneId: 7157,
                        molecularProfileId:
                            'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                        sampleId: 'TCGA-AB-2935-03',
                        patientId: 'TCGA-AB-2935',
                        studyId: 'laml_tcga_pan_can_atlas_2018',
                        value: 1360.59575189892,
                    },
                    {
                        uniqueSampleKey:
                            'VENHQS1BQi0yOTQxLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        uniquePatientKey:
                            'VENHQS1BQi0yOTQxOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        entrezGeneId: 7157,
                        molecularProfileId:
                            'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                        sampleId: 'TCGA-AB-2941-03',
                        patientId: 'TCGA-AB-2941',
                        studyId: 'laml_tcga_pan_can_atlas_2018',
                        value: 1483.63187640152,
                    },
                    {
                        uniqueSampleKey:
                            'VENHQS1BQi0yOTQzLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        uniquePatientKey:
                            'VENHQS1BQi0yOTQzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        entrezGeneId: 7157,
                        molecularProfileId:
                            'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                        sampleId: 'TCGA-AB-2943-03',
                        patientId: 'TCGA-AB-2943',
                        studyId: 'laml_tcga_pan_can_atlas_2018',
                        value: 1595.84612349971,
                    },
                    {
                        uniqueSampleKey:
                            'VENHQS1BQi0yOTUyLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        uniquePatientKey:
                            'VENHQS1BQi0yOTUyOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        entrezGeneId: 7157,
                        molecularProfileId:
                            'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                        sampleId: 'TCGA-AB-2952-03',
                        patientId: 'TCGA-AB-2952',
                        studyId: 'laml_tcga_pan_can_atlas_2018',
                        value: 2711.30470514441,
                    },
                ],
                splice: [
                    {
                        uniqueSampleKey:
                            'VENHQS1BQi0yODM4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        uniquePatientKey:
                            'VENHQS1BQi0yODM4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        entrezGeneId: 7157,
                        molecularProfileId:
                            'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                        sampleId: 'TCGA-AB-2838-03',
                        patientId: 'TCGA-AB-2838',
                        studyId: 'laml_tcga_pan_can_atlas_2018',
                        value: 666.898408595377,
                    },
                    {
                        uniqueSampleKey:
                            'VENHQS1BQi0yODY4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        uniquePatientKey:
                            'VENHQS1BQi0yODY4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        entrezGeneId: 7157,
                        molecularProfileId:
                            'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                        sampleId: 'TCGA-AB-2868-03',
                        patientId: 'TCGA-AB-2868',
                        studyId: 'laml_tcga_pan_can_atlas_2018',
                        value: 916.328015361695,
                    },
                    {
                        uniqueSampleKey:
                            'VENHQS1BQi0yODU3LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        uniquePatientKey:
                            'VENHQS1BQi0yODU3OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        entrezGeneId: 7157,
                        molecularProfileId:
                            'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                        sampleId: 'TCGA-AB-2857-03',
                        patientId: 'TCGA-AB-2857',
                        studyId: 'laml_tcga_pan_can_atlas_2018',
                        value: 256.24401856776,
                    },
                ],
                trunc: [
                    {
                        uniqueSampleKey:
                            'VENHQS1BQi0yODIwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        uniquePatientKey:
                            'VENHQS1BQi0yODIwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        entrezGeneId: 7157,
                        molecularProfileId:
                            'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                        sampleId: 'TCGA-AB-2820-03',
                        patientId: 'TCGA-AB-2820',
                        studyId: 'laml_tcga_pan_can_atlas_2018',
                        value: 177.760665663725,
                    },
                    {
                        uniqueSampleKey:
                            'VENHQS1BQi0yODYwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        uniquePatientKey:
                            'VENHQS1BQi0yODYwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        entrezGeneId: 7157,
                        molecularProfileId:
                            'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                        sampleId: 'TCGA-AB-2860-03',
                        patientId: 'TCGA-AB-2860',
                        studyId: 'laml_tcga_pan_can_atlas_2018',
                        value: 609.377468235893,
                    },
                    {
                        uniqueSampleKey:
                            'VENHQS1BQi0yOTM4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        uniquePatientKey:
                            'VENHQS1BQi0yOTM4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                        entrezGeneId: 7157,
                        molecularProfileId:
                            'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                        sampleId: 'TCGA-AB-2938-03',
                        patientId: 'TCGA-AB-2938',
                        studyId: 'laml_tcga_pan_can_atlas_2018',
                        value: 3676.54978407445,
                    },
                ],
            },
            unmutatedBucket: [
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODAzLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2803-03',
                    patientId: 'TCGA-AB-2803',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1788.21460808472,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODA1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODA1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2805-03',
                    patientId: 'TCGA-AB-2805',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1344.67858067715,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODA2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODA2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2806-03',
                    patientId: 'TCGA-AB-2806',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2540.32735948506,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODA3LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODA3OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2807-03',
                    patientId: 'TCGA-AB-2807',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1598.9317050419,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODA4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODA4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2808-03',
                    patientId: 'TCGA-AB-2808',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2061.40427018172,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODEwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODEwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2810-03',
                    patientId: 'TCGA-AB-2810',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2152.67057918194,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODExLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODExOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2811-03',
                    patientId: 'TCGA-AB-2811',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 624.24918630397,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODEyLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODEyOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2812-03',
                    patientId: 'TCGA-AB-2812',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1841.75214610246,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODE0LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODE0OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2814-03',
                    patientId: 'TCGA-AB-2814',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1683.19457756399,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODE1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODE1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2815-03',
                    patientId: 'TCGA-AB-2815',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2001.90237612469,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODE2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODE2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2816-03',
                    patientId: 'TCGA-AB-2816',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1236.75548752757,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODE3LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODE3OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2817-03',
                    patientId: 'TCGA-AB-2817',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2343.75827833472,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODE4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODE4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2818-03',
                    patientId: 'TCGA-AB-2818',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1315.45888900806,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODE5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODE5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2819-03',
                    patientId: 'TCGA-AB-2819',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2641.11811991005,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODIxLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODIxOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2821-03',
                    patientId: 'TCGA-AB-2821',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1975.51232008478,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODIyLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODIyOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2822-03',
                    patientId: 'TCGA-AB-2822',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1908.97942918316,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODIzLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODIzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2823-03',
                    patientId: 'TCGA-AB-2823',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1408.09488545273,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODI0LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODI0OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2824-03',
                    patientId: 'TCGA-AB-2824',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2567.96936244079,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODI1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODI1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2825-03',
                    patientId: 'TCGA-AB-2825',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1383.86669712374,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODI2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODI2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2826-03',
                    patientId: 'TCGA-AB-2826',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1674.01344676103,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODI4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODI4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2828-03',
                    patientId: 'TCGA-AB-2828',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2081.51850711245,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODMwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODMwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2830-03',
                    patientId: 'TCGA-AB-2830',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 3174.59718837311,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODMyLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODMyOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2832-03',
                    patientId: 'TCGA-AB-2832',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2639.71154964626,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODM0LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODM0OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2834-03',
                    patientId: 'TCGA-AB-2834',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2191.61245353832,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODM1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODM1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2835-03',
                    patientId: 'TCGA-AB-2835',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1632.62606197935,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODM2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODM2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2836-03',
                    patientId: 'TCGA-AB-2836',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1611.06550463004,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODM3LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODM3OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2837-03',
                    patientId: 'TCGA-AB-2837',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1311.63507520076,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODM5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODM5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2839-03',
                    patientId: 'TCGA-AB-2839',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1925.63450211081,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODQwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODQwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2840-03',
                    patientId: 'TCGA-AB-2840',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1253.1986917416,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODQxLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODQxOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2841-03',
                    patientId: 'TCGA-AB-2841',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1253.58845139798,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODQyLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODQyOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2842-03',
                    patientId: 'TCGA-AB-2842',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1215.75052973983,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODQ0LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODQ0OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2844-03',
                    patientId: 'TCGA-AB-2844',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2267.58609073223,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODQ1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODQ1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2845-03',
                    patientId: 'TCGA-AB-2845',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2735.70695031769,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODQ2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODQ2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2846-03',
                    patientId: 'TCGA-AB-2846',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1993.09392021168,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODQ4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODQ4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2848-03',
                    patientId: 'TCGA-AB-2848',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1188.04216802313,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODQ5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODQ5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2849-03',
                    patientId: 'TCGA-AB-2849',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1054.54795224178,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODUxLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODUxOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2851-03',
                    patientId: 'TCGA-AB-2851',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1694.19337687052,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODUzLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODUzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2853-03',
                    patientId: 'TCGA-AB-2853',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2082.66552795242,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODU0LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODU0OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2854-03',
                    patientId: 'TCGA-AB-2854',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1592.77859733259,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODU1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODU1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2855-03',
                    patientId: 'TCGA-AB-2855',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1324.85498862883,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODU4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODU4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2858-03',
                    patientId: 'TCGA-AB-2858',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2325.08690673244,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODU5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODU5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2859-03',
                    patientId: 'TCGA-AB-2859',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1648.48530924521,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODYxLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODYxOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2861-03',
                    patientId: 'TCGA-AB-2861',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2040.76473289326,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODYyLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODYyOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2862-03',
                    patientId: 'TCGA-AB-2862',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2370.2790217851,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODYzLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODYzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2863-03',
                    patientId: 'TCGA-AB-2863',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1803.45794611311,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODY1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODY1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2865-03',
                    patientId: 'TCGA-AB-2865',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1820.02929468688,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODY2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODY2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2866-03',
                    patientId: 'TCGA-AB-2866',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1868.20041144734,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODY3LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODY3OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2867-03',
                    patientId: 'TCGA-AB-2867',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1698.77907538236,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODY5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODY5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2869-03',
                    patientId: 'TCGA-AB-2869',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2838.7168106737,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODcwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODcwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2870-03',
                    patientId: 'TCGA-AB-2870',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2259.95885856607,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODcxLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODcxOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2871-03',
                    patientId: 'TCGA-AB-2871',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2201.29975547619,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODcyLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODcyOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2872-03',
                    patientId: 'TCGA-AB-2872',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1568.54456819753,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODczLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODczOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2873-03',
                    patientId: 'TCGA-AB-2873',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1252.87238067155,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODc0LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODc0OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2874-03',
                    patientId: 'TCGA-AB-2874',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1998.88494630076,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODc1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODc1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2875-03',
                    patientId: 'TCGA-AB-2875',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2394.39762742069,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODc3LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODc3OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2877-03',
                    patientId: 'TCGA-AB-2877',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2335.41991344316,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODc5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODc5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2879-03',
                    patientId: 'TCGA-AB-2879',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2698.24205966406,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODgwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODgwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2880-03',
                    patientId: 'TCGA-AB-2880',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2133.91566920404,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODgxLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODgxOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2881-03',
                    patientId: 'TCGA-AB-2881',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1773.75699784411,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODgyLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODgyOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2882-03',
                    patientId: 'TCGA-AB-2882',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2506.02666657686,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODg0LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODg0OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2884-03',
                    patientId: 'TCGA-AB-2884',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1585.76565899318,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODg2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODg2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2886-03',
                    patientId: 'TCGA-AB-2886',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1916.33562139233,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODg3LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODg3OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2887-03',
                    patientId: 'TCGA-AB-2887',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2307.80433815885,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODg4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODg4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2888-03',
                    patientId: 'TCGA-AB-2888',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1243.06463862956,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODg5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODg5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2889-03',
                    patientId: 'TCGA-AB-2889',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2112.21558451363,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODkwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODkwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2890-03',
                    patientId: 'TCGA-AB-2890',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1248.92034322393,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODk1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODk1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2895-03',
                    patientId: 'TCGA-AB-2895',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2157.07695692621,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODk2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODk2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2896-03',
                    patientId: 'TCGA-AB-2896',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2208.95548965813,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODk3LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODk3OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2897-03',
                    patientId: 'TCGA-AB-2897',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1797.32817297004,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODk4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODk4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2898-03',
                    patientId: 'TCGA-AB-2898',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1397.9420517842,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yODk5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yODk5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2899-03',
                    patientId: 'TCGA-AB-2899',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1837.53066101895,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTAwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTAwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2900-03',
                    patientId: 'TCGA-AB-2900',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1421.53459296011,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTAxLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTAxOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2901-03',
                    patientId: 'TCGA-AB-2901',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1571.95631424684,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTAzLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2903-03',
                    patientId: 'TCGA-AB-2903',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1604.80414703577,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTA5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTA5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2909-03',
                    patientId: 'TCGA-AB-2909',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2020.85543718553,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTEwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTEwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2910-03',
                    patientId: 'TCGA-AB-2910',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2509.24672510324,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTExLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTExOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2911-03',
                    patientId: 'TCGA-AB-2911',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1658.48159781717,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTEyLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTEyOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2912-03',
                    patientId: 'TCGA-AB-2912',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1999.78837178495,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTEzLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTEzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2913-03',
                    patientId: 'TCGA-AB-2913',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2167.84883763882,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTE0LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTE0OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2914-03',
                    patientId: 'TCGA-AB-2914',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2107.60987082658,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTE1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTE1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2915-03',
                    patientId: 'TCGA-AB-2915',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1841.05610296281,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTE2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTE2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2916-03',
                    patientId: 'TCGA-AB-2916',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1457.81914431299,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTE3LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTE3OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2917-03',
                    patientId: 'TCGA-AB-2917',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 787.562589276388,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTE5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTE5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2919-03',
                    patientId: 'TCGA-AB-2919',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2174.83726483412,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTIwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTIwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2920-03',
                    patientId: 'TCGA-AB-2920',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 426.671902090457,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTIxLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTIxOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2921-03',
                    patientId: 'TCGA-AB-2921',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1965.33869959136,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTI0LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTI0OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2924-03',
                    patientId: 'TCGA-AB-2924',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1517.29864192273,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTI1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTI1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2925-03',
                    patientId: 'TCGA-AB-2925',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2899.12774686378,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTI3LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTI3OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2927-03',
                    patientId: 'TCGA-AB-2927',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1733.81563868591,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTI4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTI4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2928-03',
                    patientId: 'TCGA-AB-2928',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1873.52409108823,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTI5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTI5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2929-03',
                    patientId: 'TCGA-AB-2929',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2258.12649044576,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTMwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTMwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2930-03',
                    patientId: 'TCGA-AB-2930',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2182.24085141973,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTMxLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTMxOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2931-03',
                    patientId: 'TCGA-AB-2931',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2537.85616022237,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTMyLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTMyOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2932-03',
                    patientId: 'TCGA-AB-2932',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1665.85415250103,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTMzLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTMzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2933-03',
                    patientId: 'TCGA-AB-2933',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1312.23311763241,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTM0LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTM0OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2934-03',
                    patientId: 'TCGA-AB-2934',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1352.78681027758,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTM2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTM2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2936-03',
                    patientId: 'TCGA-AB-2936',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1104.38112723191,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTM3LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTM3OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2937-03',
                    patientId: 'TCGA-AB-2937',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 3462.79318484978,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTM5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTM5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2939-03',
                    patientId: 'TCGA-AB-2939',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 3063.51008082741,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTQwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTQwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2940-03',
                    patientId: 'TCGA-AB-2940',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2599.68517658652,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTQyLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTQyOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2942-03',
                    patientId: 'TCGA-AB-2942',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1781.35209371164,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTQ0LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTQ0OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2944-03',
                    patientId: 'TCGA-AB-2944',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1310.54772037797,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTQ2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTQ2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2946-03',
                    patientId: 'TCGA-AB-2946',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1776.30680566074,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTQ4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTQ4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2948-03',
                    patientId: 'TCGA-AB-2948',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2117.55270494459,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTQ5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTQ5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2949-03',
                    patientId: 'TCGA-AB-2949',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1373.98435977826,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTUwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTUwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2950-03',
                    patientId: 'TCGA-AB-2950',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2074.81692571294,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTU0LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTU0OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2954-03',
                    patientId: 'TCGA-AB-2954',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2074.05824646957,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTU1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTU1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2955-03',
                    patientId: 'TCGA-AB-2955',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1979.3250732801,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTU2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTU2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2956-03',
                    patientId: 'TCGA-AB-2956',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1764.25376173983,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTU5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTU5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2959-03',
                    patientId: 'TCGA-AB-2959',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1345.87445301342,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTYzLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTYzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2963-03',
                    patientId: 'TCGA-AB-2963',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1881.45066184365,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTY0LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTY0OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2964-03',
                    patientId: 'TCGA-AB-2964',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2762.92891447724,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTY1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTY1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2965-03',
                    patientId: 'TCGA-AB-2965',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2200.20735351849,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTY2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTY2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2966-03',
                    patientId: 'TCGA-AB-2966',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1882.25505544704,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTY3LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTY3OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2967-03',
                    patientId: 'TCGA-AB-2967',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2073.39891648322,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTY5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTY5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2969-03',
                    patientId: 'TCGA-AB-2969',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2481.12208398712,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTcwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTcwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2970-03',
                    patientId: 'TCGA-AB-2970',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1713.85609070569,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTcxLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTcxOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2971-03',
                    patientId: 'TCGA-AB-2971',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1745.70739023164,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTcyLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTcyOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2972-03',
                    patientId: 'TCGA-AB-2972',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2117.06505322917,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTczLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTczOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2973-03',
                    patientId: 'TCGA-AB-2973',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1415.73860352769,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTc1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTc1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2975-03',
                    patientId: 'TCGA-AB-2975',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2151.88500923068,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTc2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTc2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2976-03',
                    patientId: 'TCGA-AB-2976',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2053.37444552453,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTc3LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTc3OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2977-03',
                    patientId: 'TCGA-AB-2977',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1698.1278572711,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTc4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTc4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2978-03',
                    patientId: 'TCGA-AB-2978',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2042.63454596292,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTgwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTgwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2980-03',
                    patientId: 'TCGA-AB-2980',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2006.16647353876,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTgyLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTgyOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2982-03',
                    patientId: 'TCGA-AB-2982',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1703.80786686657,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTgzLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTgzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2983-03',
                    patientId: 'TCGA-AB-2983',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2253.70348950725,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTg0LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTg0OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2984-03',
                    patientId: 'TCGA-AB-2984',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 5294.60157561752,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTg1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTg1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2985-03',
                    patientId: 'TCGA-AB-2985',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1280.90576164835,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTg2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTg2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2986-03',
                    patientId: 'TCGA-AB-2986',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 3106.35421390278,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTg3LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTg3OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2987-03',
                    patientId: 'TCGA-AB-2987',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1308.4907900295,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTg4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTg4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2988-03',
                    patientId: 'TCGA-AB-2988',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1850.79149845405,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTkwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTkwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2990-03',
                    patientId: 'TCGA-AB-2990',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1851.16210521772,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTkxLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTkxOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2991-03',
                    patientId: 'TCGA-AB-2991',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1951.00825996249,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTkyLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTkyOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2992-03',
                    patientId: 'TCGA-AB-2992',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1498.18012440288,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTkzLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTkzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2993-03',
                    patientId: 'TCGA-AB-2993',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2490.80089427716,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTk0LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTk0OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2994-03',
                    patientId: 'TCGA-AB-2994',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 795.090382923908,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTk1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTk1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2995-03',
                    patientId: 'TCGA-AB-2995',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2518.40163368769,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTk2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTk2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2996-03',
                    patientId: 'TCGA-AB-2996',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2335.69966719483,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTk4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTk4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2998-03',
                    patientId: 'TCGA-AB-2998',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1580.42662970776,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0yOTk5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0yOTk5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-2999-03',
                    patientId: 'TCGA-AB-2999',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1531.844589731,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0zMDAwLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0zMDAwOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-3000-03',
                    patientId: 'TCGA-AB-3000',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2742.81909818936,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0zMDAxLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0zMDAxOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-3001-03',
                    patientId: 'TCGA-AB-3001',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1467.50721737233,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0zMDAyLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0zMDAyOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-3002-03',
                    patientId: 'TCGA-AB-3002',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1451.67105608046,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0zMDA1LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0zMDA1OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-3005-03',
                    patientId: 'TCGA-AB-3005',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2650.43200590934,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0zMDA2LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0zMDA2OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-3006-03',
                    patientId: 'TCGA-AB-3006',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2813.46480265146,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0zMDA3LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0zMDA3OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-3007-03',
                    patientId: 'TCGA-AB-3007',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2044.87469252051,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0zMDA4LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0zMDA4OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-3008-03',
                    patientId: 'TCGA-AB-3008',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 3090.94450099928,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0zMDA5LTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0zMDA5OmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-3009-03',
                    patientId: 'TCGA-AB-3009',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2044.63983926182,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0zMDExLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0zMDExOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-3011-03',
                    patientId: 'TCGA-AB-3011',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 2310.5118505363,
                },
                {
                    uniqueSampleKey:
                        'VENHQS1BQi0zMDEyLTAzOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    uniquePatientKey:
                        'VENHQS1BQi0zMDEyOmxhbWxfdGNnYV9wYW5fY2FuX2F0bGFzXzIwMTg',
                    entrezGeneId: 7157,
                    molecularProfileId:
                        'laml_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median',
                    sampleId: 'TCGA-AB-3012-03',
                    patientId: 'TCGA-AB-3012',
                    studyId: 'laml_tcga_pan_can_atlas_2018',
                    value: 1683.52925246819,
                },
            ],
            unsequencedBucket: [],
        };
    });

    it('should assign items to appropriate mutation buckets', () => {
        let showMutations = true;
        let hugoGeneSymbol = 'TP53';
        const ret = getMolecularDataBuckets(
            sampleMolecularData,
            showMutations,
            mutationsKeyedBySampleId,
            coverageInformation,
            hugoGeneSymbol
        );
        assertDeepEqualInAnyOrder(ret, expectedResult);
    });

    it('all items in unMutated collection if we are not showing mutations', () => {
        let showMutations = false;
        let hugoGeneSymbol = 'TP53';
        const ret = getMolecularDataBuckets(
            sampleMolecularData,
            showMutations,
            mutationsKeyedBySampleId,
            coverageInformation,
            hugoGeneSymbol
        );
        assertDeepEqualInAnyOrder(
            ret.mutationBuckets,
            {},
            'no mutations recorded'
        );
        assert.equal(
            ret.unsequencedBucket.length,
            0,
            'no unsequeced mutations'
        );
        assert.equal(ret.unmutatedBucket.length, sampleStudyData.length);
    });

    it("puts unmutated items in unsequenced bucket if they don't appear in coverage info", () => {
        let showMutations = true;
        let hugoGeneSymbol = 'TP53';
        let emptyCoverageInformation = {
            samples: {},
        } as CoverageInformation;
        const ret = getMolecularDataBuckets(
            sampleMolecularData,
            showMutations,
            mutationsKeyedBySampleId,
            emptyCoverageInformation,
            hugoGeneSymbol
        );
        assertDeepEqualInAnyOrder(
            ret.mutationBuckets,
            expectedResult.mutationBuckets,
            'mutations are recorded'
        );
        assert.equal(
            ret.unsequencedBucket.length,
            151,
            'categorized as unsequenced mutations'
        );
    });
});

describe('prioritizeMutations', () => {
    it('reorders mutations appropriately', () => {
        const mutations = [
            { mutationType: 'Missense_Mutation' } as Mutation,
            { mutationType: 'Splice_Region' } as Mutation,
        ];
        assert.deepEqual(prioritizeMutations(mutations), [
            { mutationType: 'Splice_Region' },
            { mutationType: 'Missense_Mutation' },
        ] as Mutation[]);
    });

    it('maintains mutation order appropriately', () => {
        const mutations = [
            { mutationType: 'Splice_Region' } as Mutation,
            { mutationType: 'Missense_Mutation' } as Mutation,
        ];
        assert.deepEqual(prioritizeMutations(mutations), [
            { mutationType: 'Splice_Region' },
            { mutationType: 'Missense_Mutation' },
        ] as Mutation[]);
    });

    it('reorders mutation appropriately with three mutations', () => {
        const mutations = [
            { mutationType: 'Missense_Mutation' } as Mutation,
            { mutationType: 'Splice_Region' } as Mutation,
            { mutationType: 'in_frame_insertion' } as Mutation,
        ];
        assert.deepEqual(prioritizeMutations(mutations), [
            { mutationType: 'Splice_Region' },
            { mutationType: 'in_frame_insertion' },
            { mutationType: 'Missense_Mutation' },
        ] as Mutation[]);
    });
});

describe('getPossibleRNASeqVersions', () => {
    it('return appropriate RNA seq version options', () => {
        assert.deepEqual(
            getPossibleRNASeqVersions([{ molecularProfileId: '' }]),
            []
        );
        assert.deepEqual(
            getPossibleRNASeqVersions([
                { molecularProfileId: 'acc_tcga_rna_seq_v2_mrna' },
            ]),
            [{ label: 'RNA Seq V2', value: 'rna_seq_v2_mrna' }]
        );
        assert.deepEqual(
            getPossibleRNASeqVersions([
                { molecularProfileId: 'laml_tcga_rna_seq_mrna' },
            ]),
            [{ label: 'RNA Seq', value: 'rna_seq_mrna' }]
        );
        assert.deepEqual(
            getPossibleRNASeqVersions([
                { molecularProfileId: 'acc_tcga_rna_seq_v2_mrna' },
                { molecularProfileId: 'laml_tcga_rna_seq_mrna' },
            ]),
            [
                { label: 'RNA Seq V2', value: 'rna_seq_v2_mrna' },
                { label: 'RNA Seq', value: 'rna_seq_mrna' },
            ]
        );
    });
});
