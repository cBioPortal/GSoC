import * as ClinicalInformationMutationalSignatureTable from './ClinicalInformationMutationalSignatureTable';
import React from 'react';
import { assert } from 'chai';
import { prepareMutationalSignatureDataForTable } from '../mutationalSignatures/MutationalSignatureBarChartUtils';
import { IMutationalSignature } from 'shared/model/MutationalSignature';

const sampleMutationalSignatureMeta = [
    {
        mutationalSignatureId: 'firstMutationalSignature',
        name: 'Mutational Signature 1',
        description: 'Description Signature 1',
        url: 'COSMIC/FakeMutationalSignature1',
        category: 'category 1',
        confidenceStatement:
            'Signature 1, the aging signature, is detected in this case.',
    },
    {
        mutationalSignatureId: 'secondMutationalSignature',
        name: 'Mutational Signature 2',
        description: 'Description Signature 2',
        url: 'COSMIC/FakeMutationalSignature2',
        category: 'category 2',
        confidenceStatement:
            'Signature 2, the APOBEC signature, is detected in this case.  This signature often coccurs with signature 13, the other APOBEC signature',
    },
];

const sampleMutationalSignatureData = [
    {
        sampleId: 'firstSample',
        uniqueSampleKey: 'firstSample',
        patientId: 'firstPatient',
        uniquePatientKey: 'firstPatient',
        studyId: 'firstStudy',
        mutationalSignatureId: 'firstMutationalSignature',
        version: 'v2',
        value: 1,
        confidence: 0.9,
        numberOfMutationsForSample: 20,
        meta: sampleMutationalSignatureMeta[0],
    } as IMutationalSignature,
    {
        sampleId: 'secondSample',
        uniqueSampleKey: 'secondSample',
        patientId: 'firstPatient',
        uniquePatientKey: 'firstPatient',
        studyId: 'firstStudy',
        mutationalSignatureId: 'firstMutationalSignature',
        version: 'v2',
        value: 2,
        confidence: 0.8,
        numberOfMutationsForSample: 20,
        meta: sampleMutationalSignatureMeta[0],
    } as IMutationalSignature,
    {
        sampleId: 'firstSample',
        uniqueSampleKey: 'firstSample',
        patientId: 'firstPatient',
        uniquePatientKey: 'firstPatient',
        studyId: 'firstStudy',
        mutationalSignatureId: 'secondMutationalSignature',
        version: 'v2',
        value: 3,
        confidence: 0.4,
        numberOfMutationsForSample: 20,
        meta: sampleMutationalSignatureMeta[1],
    } as IMutationalSignature,
    {
        sampleId: 'secondSample',
        uniqueSampleKey: 'secondSample',
        patientId: 'firstPatient',
        uniquePatientKey: 'firstPatient',
        studyId: 'firstStudy',
        mutationalSignatureId: 'secondMutationalSignature',
        version: 'v2',
        value: 10,
        confidence: 0.01,
        numberOfMutationsForSample: 20,
        meta: sampleMutationalSignatureMeta[1],
    } as IMutationalSignature,
];
const samples = [{ id: 'firstSample' }, { id: 'secondSample' }];
describe('ClinicalInformationMutationalSignatureTable', () => {
    it('takes mutational signature sample data and formats it for mutational signature table to render', () => {
        let result = prepareMutationalSignatureDataForTable(
            sampleMutationalSignatureData,
            ['firstSample', 'secondSample']
        );
        assert.deepEqual(result, [
            {
                name: 'Mutational Signature 1',
                sampleValues: {
                    firstSample: {
                        value: 1,
                        confidence: 0.9,
                    },
                    secondSample: {
                        value: 2,
                        confidence: 0.8,
                    },
                },
                description: 'Description Signature 1',
                url: 'COSMIC/FakeMutationalSignature1',
            },
            {
                name: 'Mutational Signature 2',
                sampleValues: {
                    firstSample: {
                        value: 3,
                        confidence: 0.4,
                    },
                    secondSample: {
                        value: 10,
                        confidence: 0.01,
                    },
                },
                description: 'Description Signature 2',
                url: 'COSMIC/FakeMutationalSignature2',
            },
        ]);
    });
});
