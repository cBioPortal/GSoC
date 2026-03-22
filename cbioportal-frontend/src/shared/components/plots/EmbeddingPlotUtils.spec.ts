import { assert } from 'chai';
import {
    makeEmbeddingScatterPlotData,
    EmbeddingPlotPoint,
} from './EmbeddingPlotUtils';
import {
    preComputeClinicalDataMaps,
    createSampleLookupMap,
    createSampleIdLookupMap,
    aggregateMolecularDataByPatient,
} from '../../lib/PatientMolecularDataUtils';
import { Sample } from 'cbioportal-ts-api-client';
import {
    PatientEmbeddingData,
    SampleEmbeddingData,
} from '../embeddings/EmbeddingTypes';

describe('EmbeddingPlotUtils', () => {
    describe('preComputeClinicalDataMaps', () => {
        it('returns correct maps for sample-level attributes', () => {
            const clinicalData = [
                {
                    studyId: 'study1',
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    value: 'Yes',
                },
                {
                    studyId: 'study1',
                    sampleId: 'sample2',
                    patientId: 'patient1',
                    value: 'No',
                },
            ];

            const categoryToColor = { Yes: '#00FF00', No: '#FF0000' };

            const result = preComputeClinicalDataMaps(
                clinicalData,
                categoryToColor,
                undefined,
                false // sample-level attribute
            );

            assert.equal(result.colorMap.get('study1:sample1'), '#00FF00');
            assert.equal(result.colorMap.get('study1:sample2'), '#FF0000');
            assert.equal(result.valueMap.get('study1:sample1'), 'Yes');
            assert.equal(result.valueMap.get('study1:sample2'), 'No');
            assert.isUndefined(result.patientColorMap);
            assert.isUndefined(result.patientValueMap);
        });

        it('returns correct maps for patient-level attributes', () => {
            const clinicalData = [
                {
                    studyId: 'study1',
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    value: 'Male',
                },
                {
                    studyId: 'study1',
                    sampleId: 'sample2',
                    patientId: 'patient1',
                    value: 'Male',
                },
                {
                    studyId: 'study1',
                    sampleId: 'sample3',
                    patientId: 'patient2',
                    value: 'Female',
                },
            ];

            const categoryToColor = { Male: '#0000FF', Female: '#FF00FF' };

            const result = preComputeClinicalDataMaps(
                clinicalData,
                categoryToColor,
                undefined,
                true // patient-level attribute
            );

            // Sample-level maps should still be populated
            assert.equal(result.colorMap.get('study1:sample1'), '#0000FF');
            assert.equal(result.colorMap.get('study1:sample3'), '#FF00FF');

            // Patient-level maps should be populated
            assert.equal(result.patientColorMap!.get('patient1'), '#0000FF');
            assert.equal(result.patientColorMap!.get('patient2'), '#FF00FF');
            assert.equal(result.patientValueMap!.get('patient1'), 'Male');
            assert.equal(result.patientValueMap!.get('patient2'), 'Female');
        });

        it('handles empty clinical data array', () => {
            const result = preComputeClinicalDataMaps([], {}, undefined, false);

            assert.equal(result.colorMap.size, 0);
            assert.equal(result.valueMap.size, 0);
        });

        it('uses default color for missing category', () => {
            const clinicalData = [
                {
                    studyId: 'study1',
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    value: 'Unknown',
                },
            ];

            const categoryToColor = { Yes: '#00FF00', No: '#FF0000' };

            const result = preComputeClinicalDataMaps(
                clinicalData,
                categoryToColor,
                undefined,
                false
            );

            // Should use default color #BEBEBE for missing category
            assert.equal(result.colorMap.get('study1:sample1'), '#BEBEBE');
        });

        it('handles numerical value to color function', () => {
            const clinicalData = [
                {
                    studyId: 'study1',
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    value: '50',
                },
                {
                    studyId: 'study1',
                    sampleId: 'sample2',
                    patientId: 'patient2',
                    value: '100',
                },
            ];

            const numericalValueToColor = (value: number) => {
                return value > 75 ? '#FF0000' : '#00FF00';
            };

            const result = preComputeClinicalDataMaps(
                clinicalData,
                undefined,
                numericalValueToColor,
                false
            );

            assert.equal(result.colorMap.get('study1:sample1'), '#00FF00');
            assert.equal(result.colorMap.get('study1:sample2'), '#FF0000');
        });
    });

    describe('createSampleLookupMap', () => {
        it('creates correct patient to sample mapping', () => {
            const samples: Sample[] = [
                {
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    studyId: 'study1',
                    uniqueSampleKey: 'study1:sample1',
                    uniquePatientKey: 'study1:patient1',
                } as Sample,
                {
                    sampleId: 'sample2',
                    patientId: 'patient2',
                    studyId: 'study1',
                    uniqueSampleKey: 'study1:sample2',
                    uniquePatientKey: 'study1:patient2',
                } as Sample,
            ];

            const result = createSampleLookupMap(samples);

            assert.equal(result.size, 2);
            assert.equal(result.get('patient1')?.sampleId, 'sample1');
            assert.equal(result.get('patient2')?.sampleId, 'sample2');
        });
    });

    describe('createSampleIdLookupMap', () => {
        it('creates correct sampleId to sample mapping', () => {
            const samples: Sample[] = [
                {
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    studyId: 'study1',
                    uniqueSampleKey: 'study1:sample1',
                    uniquePatientKey: 'study1:patient1',
                } as Sample,
                {
                    sampleId: 'sample2',
                    patientId: 'patient2',
                    studyId: 'study1',
                    uniqueSampleKey: 'study1:sample2',
                    uniquePatientKey: 'study1:patient2',
                } as Sample,
            ];

            const result = createSampleIdLookupMap(samples);

            assert.equal(result.size, 2);
            assert.equal(result.get('sample1')?.patientId, 'patient1');
            assert.equal(result.get('sample2')?.patientId, 'patient2');
        });
    });

    describe('aggregateMolecularDataByPatient', () => {
        it('correctly unions mutations across patient samples', () => {
            const samples: Sample[] = [
                {
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    studyId: 'study1',
                } as Sample,
                {
                    sampleId: 'sample2',
                    patientId: 'patient1',
                    studyId: 'study1',
                } as Sample,
            ];

            const mutations = [
                {
                    studyId: 'study1',
                    sampleId: 'sample1',
                    mutationType: 'Missense_Mutation',
                },
                {
                    studyId: 'study1',
                    sampleId: 'sample2',
                    mutationType: 'Nonsense_Mutation',
                },
            ];

            const result = aggregateMolecularDataByPatient(
                samples,
                mutations,
                [],
                []
            );

            assert.equal(result.size, 1);
            const patientData = result.get('patient1');
            assert.equal(patientData!.mutations.length, 2);
            assert.equal(patientData!.hasAnyAlteration, true);
        });

        it('handles patients with no alterations', () => {
            const samples: Sample[] = [
                {
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    studyId: 'study1',
                } as Sample,
            ];

            const result = aggregateMolecularDataByPatient(samples, [], [], []);

            assert.equal(result.size, 1);
            const patientData = result.get('patient1');
            assert.equal(patientData!.mutations.length, 0);
            assert.equal(patientData!.hasAnyAlteration, false);
        });
    });

    describe('makeEmbeddingScatterPlotData - basic functionality', () => {
        // Create a minimal mock store
        const createMockStore = (selectedSamples: Sample[] = []) => {
            return {
                samples: {
                    result: [
                        {
                            sampleId: 'sample1',
                            patientId: 'patient1',
                            studyId: 'study1',
                            uniqueSampleKey: 'study1:sample1',
                            uniquePatientKey: 'study1:patient1',
                        } as Sample,
                        {
                            sampleId: 'sample2',
                            patientId: 'patient2',
                            studyId: 'study1',
                            uniqueSampleKey: 'study1:sample2',
                            uniquePatientKey: 'study1:patient2',
                        } as Sample,
                    ],
                },
                selectedSamples: {
                    result: selectedSamples,
                },
                filteredSamplesByDetailedCancerType: {
                    result: {
                        'Colorectal Cancer': [
                            {
                                sampleId: 'sample1',
                                patientId: 'patient1',
                                studyId: 'study1',
                            } as Sample,
                        ],
                        Melanoma: [
                            {
                                sampleId: 'sample2',
                                patientId: 'patient2',
                                studyId: 'study1',
                            } as Sample,
                        ],
                    },
                },
                clinicalDataCache: {
                    get: () => ({ isComplete: false }),
                },
                annotatedMutationCache: undefined,
                annotatedCnaCache: undefined,
                structuralVariantCache: undefined,
            } as any;
        };

        it('marks non-cohort samples correctly', () => {
            const embeddingData: PatientEmbeddingData = {
                embedding_type: 'patients',
                title: 'Test UMAP',
                studyIds: ['study1'],
                description: 'Test embedding',
                totalPatients: 2,
                sampleSize: 2,
                data: [
                    { patientId: 'patient1', x: 1.0, y: 2.0 },
                    { patientId: 'patient_not_in_cohort', x: 3.0, y: 4.0 },
                ],
            };

            const store = createMockStore();
            const result = makeEmbeddingScatterPlotData(
                embeddingData,
                store,
                undefined
            );

            assert.equal(result.length, 2);

            // First point should be in cohort
            assert.equal(result[0].isInCohort, true);
            assert.equal(result[0].patientId, 'patient1');

            // Second point should NOT be in cohort
            assert.equal(result[1].isInCohort, false);
            assert.equal(result[1].patientId, 'patient_not_in_cohort');
            assert.include(
                result[1].displayLabel!,
                'not in this cohort' as any
            );
        });

        it('marks unselected samples when there is a selection filter', () => {
            const embeddingData: PatientEmbeddingData = {
                embedding_type: 'patients',
                title: 'Test UMAP',
                studyIds: ['study1'],
                description: 'Test embedding',
                totalPatients: 2,
                sampleSize: 2,
                data: [
                    { patientId: 'patient1', x: 1.0, y: 2.0 },
                    { patientId: 'patient2', x: 3.0, y: 4.0 },
                ],
            };

            // Only select patient1
            const selectedSamples = [
                {
                    sampleId: 'sample1',
                    patientId: 'patient1',
                    studyId: 'study1',
                } as Sample,
            ];

            const store = createMockStore(selectedSamples);
            const result = makeEmbeddingScatterPlotData(
                embeddingData,
                store,
                undefined
            );

            assert.equal(result.length, 2);

            // First point should have normal coloring
            assert.equal(result[0].patientId, 'patient1');
            assert.notEqual(result[0].displayLabel, 'Unselected');

            // Second point should be marked as "Unselected"
            assert.equal(result[1].patientId, 'patient2');
            // Patient2 is in cohort but not selected, so should show normal cancer type
            // (unselected styling is applied in EmbeddingsTab, not here)
        });

        it('uses default cancer type coloring when no coloring option specified', () => {
            const embeddingData: PatientEmbeddingData = {
                embedding_type: 'patients',
                title: 'Test UMAP',
                studyIds: ['study1'],
                description: 'Test embedding',
                totalPatients: 2,
                sampleSize: 2,
                data: [
                    { patientId: 'patient1', x: 1.0, y: 2.0 },
                    { patientId: 'patient2', x: 3.0, y: 4.0 },
                ],
            };

            const store = createMockStore();
            const result = makeEmbeddingScatterPlotData(
                embeddingData,
                store,
                undefined
            );

            assert.equal(result.length, 2);
            assert.equal(result[0].displayLabel, 'Colorectal Cancer');
            assert.equal(result[1].displayLabel, 'Melanoma');
        });
    });
});
