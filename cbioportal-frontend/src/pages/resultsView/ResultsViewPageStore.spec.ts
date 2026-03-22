import { assert } from 'chai';
import {
    buildDefaultOQLProfile,
    extendSamplesWithCancerType,
} from './ResultsViewPageStore';
import { CancerStudy, ClinicalData, Sample } from 'cbioportal-ts-api-client';

describe('buildDefaultOQLProfile', () => {
    it('produces correct default queryies based on alteration profiles and zscore/rppa', () => {
        assert.equal(
            buildDefaultOQLProfile(['COPY_NUMBER_ALTERATION'], 2, 2),
            'AMP HOMDEL'
        );
        assert.equal(
            buildDefaultOQLProfile(['MUTATION_EXTENDED'], 2, 2),
            'MUT'
        );
        assert.equal(
            buildDefaultOQLProfile(['STRUCTURAL_VARIANT'], 2, 2),
            'FUSION'
        );
        assert.equal(
            buildDefaultOQLProfile(
                ['MUTATION_EXTENDED', 'COPY_NUMBER_ALTERATION'],
                2,
                2
            ),
            'MUT AMP HOMDEL'
        );
        assert.equal(
            buildDefaultOQLProfile(
                [
                    'MUTATION_EXTENDED',
                    'STRUCTURAL_VARIANT',
                    'COPY_NUMBER_ALTERATION',
                ],
                2,
                2
            ),
            'MUT FUSION AMP HOMDEL'
        );
        assert.equal(
            buildDefaultOQLProfile(
                ['MUTATION_EXTENDED', 'MRNA_EXPRESSION'],
                2,
                2
            ),
            'MUT EXP>=2 EXP<=-2'
        );
        assert.equal(
            buildDefaultOQLProfile(
                ['MUTATION_EXTENDED', 'PROTEIN_LEVEL'],
                2,
                2
            ),
            'MUT PROT>=2 PROT<=-2'
        );
    });
});

describe('extendSamplesWithCancerType', () => {
    var arg2 = [
        {
            name: 'NCI-60 Cell Lines (NCI, Cancer Res. 2012)',
            description:
                'NCI-60 cell line project; raw data at <A HREF="http://discover.nci.nih.gov/cellminer/loadDownload.do">CellMiner</A>.',
            publicStudy: true,
            pmid: '22802077',
            citation: 'Reinhold et al., Cancer Res. 2012',
            groups: 'PUBLIC',
            status: 0,
            allSampleCount: 60,
            sequencedSampleCount: 60,
            cnaSampleCount: 60,
            mrnaRnaSeqSampleCount: 0,
            mrnaRnaSeqV2SampleCount: 0,
            mrnaMicroarraySampleCount: 60,
            miRnaSampleCount: 0,
            methylationHm27SampleCount: 0,
            rppaSampleCount: 0,
            massSpectrometrySampleCount: 0,
            completeSampleCount: 0,
            studyId: 'cellline_nci60',
            cancerType: {
                name: 'Mixed Cancer Types',
                dedicatedColor: 'Black',
                shortName: 'MIXED',
                parent: 'cup',
                cancerTypeId: 'mixed',
            },
        },
    ] as CancerStudy[];

    var arg0: Sample[];
    beforeEach(() => {
        arg0 = ([
            {
                uniqueSampleKey: 'QlRfNTQ5OmNlbGxsaW5lX25jaTYw',
                uniquePatientKey: 'QlRfNTQ5OmNlbGxsaW5lX25jaTYw',
                sampleType: 'Primary Solid Tumor',
                sampleId: 'BT_549',
                patientId: 'BT_549',
                studyId: 'cellline_nci60',
            },
        ] as unknown) as Sample[];
    });

    it('when both CANCER_TYPE and CANCER_TYPE_DETAILED are present, should populated appropriately', () => {
        var arg1 = [
            {
                uniqueSampleKey: 'QlRfNTQ5OmNlbGxsaW5lX25jaTYw',
                uniquePatientKey: 'QlRfNTQ5OmNlbGxsaW5lX25jaTYw',
                sampleId: 'BT_549',
                patientId: 'BT_549',
                studyId: 'cellline_nci60',
                clinicalAttributeId: 'CANCER_TYPE',
                value: 'Breast Sarcoma',
            },
            {
                uniqueSampleKey: 'QlRfNTQ5OmNlbGxsaW5lX25jaTYw',
                uniquePatientKey: 'QlRfNTQ5OmNlbGxsaW5lX25jaTYw',
                sampleId: 'BT_549',
                patientId: 'BT_549',
                studyId: 'cellline_nci60',
                clinicalAttributeId: 'CANCER_TYPE_DETAILED',
                value: 'Breast',
            },
        ] as ClinicalData[];

        const ret = extendSamplesWithCancerType(arg0, arg1, arg2);

        const expectedResult = [
            {
                uniqueSampleKey: 'QlRfNTQ5OmNlbGxsaW5lX25jaTYw',
                uniquePatientKey: 'QlRfNTQ5OmNlbGxsaW5lX25jaTYw',
                sampleType: 'Primary Solid Tumor',
                sampleId: 'BT_549',
                patientId: 'BT_549',
                studyId: 'cellline_nci60',
                cancerType: 'Breast Sarcoma',
                cancerTypeDetailed: 'Breast',
            },
        ];

        assert.deepEqual(ret, expectedResult);
    });

    it('when only CANCER_TYPE_DETAILED are present, cancerType should fall back to that of study', () => {
        var arg1 = [
            {
                uniqueSampleKey: 'QlRfNTQ5OmNlbGxsaW5lX25jaTYw',
                uniquePatientKey: 'QlRfNTQ5OmNlbGxsaW5lX25jaTYw',
                sampleId: 'BT_549',
                patientId: 'BT_549',
                studyId: 'cellline_nci60',
                clinicalAttributeId: 'CANCER_TYPE_DETAILED',
                value: 'Breast',
            },
        ] as ClinicalData[];

        const ret = extendSamplesWithCancerType(arg0, arg1, arg2);

        const expectedResult = [
            {
                uniqueSampleKey: 'QlRfNTQ5OmNlbGxsaW5lX25jaTYw',
                uniquePatientKey: 'QlRfNTQ5OmNlbGxsaW5lX25jaTYw',
                sampleType: 'Primary Solid Tumor',
                sampleId: 'BT_549',
                patientId: 'BT_549',
                studyId: 'cellline_nci60',
                cancerType: 'Mixed Cancer Types',
                cancerTypeDetailed: 'Breast',
            },
        ];

        assert.deepEqual(ret[0], expectedResult[0]);
    });

    it('when CANCER_TYPE_DETAILED missing, cancerTypeDetailed should be CANCER_TYPE', () => {
        var arg1 = [
            {
                uniqueSampleKey: 'QlRfNTQ5OmNlbGxsaW5lX25jaTYw',
                uniquePatientKey: 'QlRfNTQ5OmNlbGxsaW5lX25jaTYw',
                sampleId: 'BT_549',
                patientId: 'BT_549',
                studyId: 'cellline_nci60',
                clinicalAttributeId: 'CANCER_TYPE',
                value: 'Breast',
            },
        ] as ClinicalData[];

        const ret = extendSamplesWithCancerType(arg0, arg1, arg2);

        const expectedResult = [
            {
                uniqueSampleKey: 'QlRfNTQ5OmNlbGxsaW5lX25jaTYw',
                uniquePatientKey: 'QlRfNTQ5OmNlbGxsaW5lX25jaTYw',
                sampleType: 'Primary Solid Tumor',
                sampleId: 'BT_549',
                patientId: 'BT_549',
                studyId: 'cellline_nci60',
                cancerType: 'Breast',
                cancerTypeDetailed: 'Breast',
            },
        ];

        assert.deepEqual(ret[0], expectedResult[0]);
    });
});
