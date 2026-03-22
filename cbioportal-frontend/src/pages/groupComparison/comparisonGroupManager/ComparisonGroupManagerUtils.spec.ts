import chai, { assert, expect } from 'chai';
import deepEqualInAnyOrder from 'deep-equal-in-any-order';
import { PatientIdentifier, SampleIdentifier } from 'cbioportal-ts-api-client';
import { getStudiesAttr } from './ComparisonGroupManagerUtils';
chai.use(deepEqualInAnyOrder);

describe('ComparisonGroupManagerUtils', () => {
    describe('getStudiesAttr', () => {
        it('empty for empty', () => {
            assert.deepEqual(getStudiesAttr([]), []);
        });
        it('fills with samples, no patients attr when patients not given', () => {
            (expect(
                getStudiesAttr([
                    { studyId: 'study1', sampleId: 'sample1' },
                    { studyId: 'study1', sampleId: 'sample2' },
                    { studyId: 'study2', sampleId: 'sample1' },
                    { studyId: 'study2', sampleId: 'sample2' },
                    { studyId: 'study2', sampleId: 'sample3' },
                    { studyId: 'study3', sampleId: 'sample1' },
                ])
            ).to.deep as any).equalInAnyOrder([
                { id: 'study1', samples: ['sample1', 'sample2'] },
                { id: 'study2', samples: ['sample1', 'sample2', 'sample3'] },
                { id: 'study3', samples: ['sample1'] },
            ]);
        });
        it('fills with samples and patients when both given', () => {
            (expect(
                getStudiesAttr(
                    [
                        { studyId: 'study1', sampleId: 'sample1' },
                        { studyId: 'study1', sampleId: 'sample2' },
                        { studyId: 'study2', sampleId: 'sample1' },
                        { studyId: 'study2', sampleId: 'sample2' },
                        { studyId: 'study2', sampleId: 'sample3' },
                        { studyId: 'study3', sampleId: 'sample1' },
                    ],
                    [
                        { studyId: 'study2', patientId: 'patient2' },
                        { studyId: 'study2', patientId: 'patient3' },
                        { studyId: 'study2', patientId: 'patient1' },
                        { studyId: 'study3', patientId: 'patient2' },
                        { studyId: 'study3', patientId: 'patient1' },
                        { studyId: 'study1', patientId: 'patient1' },
                    ]
                )
            ).to.deep as any).equalInAnyOrder([
                {
                    id: 'study1',
                    samples: ['sample1', 'sample2'],
                    patients: ['patient1'],
                },
                {
                    id: 'study2',
                    samples: ['sample1', 'sample2', 'sample3'],
                    patients: ['patient1', 'patient2', 'patient3'],
                },
                {
                    id: 'study3',
                    samples: ['sample1'],
                    patients: ['patient1', 'patient2'],
                },
            ]);
        });
    });
});
