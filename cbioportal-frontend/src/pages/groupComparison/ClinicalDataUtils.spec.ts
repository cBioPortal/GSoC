import { assert } from 'chai';
import {
    PatientIdentifier,
    Sample,
    SampleIdentifier,
} from 'cbioportal-ts-api-client/dist';
import {
    filterSampleList,
    getOverlappingPatientsMap,
    getOverlappingSamplesMap,
} from './ClinicalDataUtils';
import { ComparisonGroup } from './GroupComparisonUtils';

describe('ClinicalDataUtils', () => {
    const overlappingSamples: SampleIdentifier[] = [
        {
            sampleId: 'sample1',
            studyId: 'study1',
        },
        {
            sampleId: 'sample2',
            studyId: 'study1',
        },
        {
            sampleId: 'sample1',
            studyId: 'study2',
        },
        {
            sampleId: 'sample2',
            studyId: 'study2',
        },
    ];
    const overlappingPatients: PatientIdentifier[] = [
        {
            patientId: 'patient1',
            studyId: 'study1',
        },
        {
            patientId: 'patient2',
            studyId: 'study1',
        },
        {
            patientId: 'patient1',
            studyId: 'study2',
        },
        {
            patientId: 'patient2',
            studyId: 'study2',
        },
    ];
    const sampleList: Sample[] = [
        {
            copyNumberSegmentPresent: false,
            patientId: 'patient1',
            sampleId: 'sample1',
            sampleType: 'Blood Derived Normal',
            sequenced: false,
            studyId: 'study1',
            uniquePatientKey: 'fakekey',
            uniqueSampleKey: 'fakekey',
        },
        {
            copyNumberSegmentPresent: false,
            patientId: 'patient_n',
            sampleId: 'sample1',
            sampleType: 'Blood Derived Normal',
            sequenced: false,
            studyId: 'study1',
            uniquePatientKey: 'fakekey',
            uniqueSampleKey: 'fakekey',
        },
        {
            copyNumberSegmentPresent: false,
            patientId: 'patient1',
            sampleId: 'sample_n',
            sampleType: 'Blood Derived Normal',
            sequenced: false,
            studyId: 'study1',
            uniquePatientKey: 'fakekey',
            uniqueSampleKey: 'fakekey',
        },
        {
            copyNumberSegmentPresent: false,
            patientId: 'patient1',
            sampleId: 'sample1',
            sampleType: 'Blood Derived Normal',
            sequenced: false,
            studyId: 'study_n',
            uniquePatientKey: 'fakekey',
            uniqueSampleKey: 'fakekey',
        },
    ];
    const group = [
        {
            studies: [
                {
                    id: 'study1',
                    samples: ['sample1', 'sample2'],
                    patients: ['patient1'],
                },
            ],
        },
        {
            studies: [
                {
                    id: 'study1',
                    samples: ['sample1'],
                    patients: ['patient1', 'patient2'],
                },
            ],
        },
    ] as ComparisonGroup[];

    describe('getOverlappingPatientsMap', () => {
        it('overlappingPatientsMap, key: study id, value: set of patient ids', () => {
            assert.deepEqual(getOverlappingPatientsMap(overlappingPatients), {
                study1: new Set(['patient1', 'patient2']),
                study2: new Set(['patient1', 'patient2']),
            });
        });
    });

    describe('getOverlappingSamplesMap', () => {
        it('overlappingSamplesMap, key: study id, value: set of sample ids', () => {
            assert.deepEqual(getOverlappingSamplesMap(overlappingSamples), {
                study1: new Set(['sample1', 'sample2']),
                study2: new Set(['sample1', 'sample2']),
            });
        });
    });

    describe('filterSampleList', () => {
        it('filter overlapping samples', () => {
            assert.deepEqual(filterSampleList(sampleList, group), [
                {
                    copyNumberSegmentPresent: false,
                    patientId: 'patient1',
                    sampleId: 'sample1',
                    sampleType: 'Blood Derived Normal',
                    sequenced: false,
                    studyId: 'study_n',
                    uniquePatientKey: 'fakekey',
                    uniqueSampleKey: 'fakekey',
                },
            ]);
        });
    });
});
