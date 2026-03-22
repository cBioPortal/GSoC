import { getSignificantMutationalSignatures } from '../../../shared/lib/GenericAssayUtils/MutationalSignaturesUtils';
import React from 'react';
import { assert } from 'chai';
import { IMutationalSignatureMeta } from 'shared/model/MutationalSignature';

const sampleMutationalSignatureMeta = [
    {
        mutationalSignatureId: 'firstMutationalSignature',
        name: 'Mutational Signature 1',
        description: 'Mutational Signature 1',
        url: 'url 1',
        category: 'category 1',
        confidenceStatement:
            'Signature 1, the aging signature, is detected in this case.',
    },
    {
        mutationalSignatureId: 'secondMutationalSignature',
        name: 'Mutational Signature 2',
        description: 'Mutational Signature 2',
        url: 'url 2',
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
        confidence: 0.02,
        numberOfMutationsForSample: 20,
        meta: sampleMutationalSignatureMeta[0],
    },
    {
        sampleId: 'secondSample',
        uniqueSampleKey: 'secondSample',
        patientId: 'firstPatient',
        uniquePatientKey: 'firstPatient',
        studyId: 'firstStudy',
        mutationalSignatureId: 'secondMutationalSignature',
        version: 'v2',
        value: 2,
        confidence: 0.03,
        numberOfMutationsForSample: 20,
        meta: sampleMutationalSignatureMeta[1],
    },
    {
        sampleId: 'secondSample',
        uniqueSampleKey: 'secondSample',
        patientId: 'firstPatient',
        uniquePatientKey: 'firstPatient',
        studyId: 'firstStudy',
        mutationalSignatureId: 'secondMutationalSignature',
        version: 'v2',
        value: 2,
        confidence: 0.1,
        numberOfMutationsForSample: 20,
        meta: sampleMutationalSignatureMeta[1],
    },
];

describe('SignificantMutationalSignatures', () => {
    it(
        'extracts significant mutational signatures, builds confidence statement, and prepares signatures for ' +
            'header using mutational signature sample data and metadata',
        () => {
            let result = getSignificantMutationalSignatures(
                sampleMutationalSignatureData,
                'firstSample'
            );

            assert.deepEqual(result, [sampleMutationalSignatureData[0]]);
        }
    );
});
