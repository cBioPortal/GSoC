import { assert } from 'chai';
import { categorizedSamplesCount } from './QueryStoreUtils';
import { SampleList } from 'cbioportal-ts-api-client';
import { VirtualStudy } from 'shared/api/session-service/sessionServiceModels';

describe('QueryStoreUtils', () => {
    describe('categorizedSamples', () => {
        let allSampleLists = [
            {
                category: 'all_cases_in_study',
                sampleIds: ['sample1'],
                studyId: 'study1',
            },
            {
                category: 'all_cases_in_study',
                sampleIds: ['sample1'],
                studyId: 'study2',
            },
        ];
        let mutationSampleLists = [
            {
                category: 'all_cases_with_mutation_data',
                sampleIds: ['sample1'],
                studyId: 'study1',
            },
            {
                category: 'all_cases_with_mutation_data',
                sampleIds: ['sample1'],
                studyId: 'study2',
            },
        ];
        let mutationCnaSampleLists = [
            {
                category: 'all_cases_with_mutation_and_cna_data',
                sampleIds: ['sample1'],
                studyId: 'study1',
            },
        ];
        let cnaSampleLists = [
            {
                category: 'all_cases_with_cna_data',
                sampleIds: ['sample1'],
                studyId: 'study1',
            },
        ];

        const virtualStudy = {
            id: 'vs1',
            data: {
                studies: [
                    {
                        id: 'study2',
                        samples: ['sample1'],
                    },
                ],
            },
        };

        it('returns correct categoried samples count when everything is empty', () => {
            assert.deepEqual(categorizedSamplesCount([], [], []), {
                w_mut: 0,
                w_cna: 0,
                w_mut_cna: 0,
                all: 0,
            });
        });
        it('returns correct categoried samples count when only `all_cases_with_mutation_data` sets are present', () => {
            assert.deepEqual(
                categorizedSamplesCount(
                    [...allSampleLists, ...mutationSampleLists] as SampleList[],
                    ['study1', 'study2'],
                    []
                ),
                { w_mut: 2, w_cna: 0, w_mut_cna: 0, all: 2 }
            );
        });
        it('returns correct categoried samples count when only `all_cases_with_cna_data` sets are present', () => {
            assert.deepEqual(
                categorizedSamplesCount(
                    cnaSampleLists as SampleList[],
                    ['study1', 'study2'],
                    []
                ),
                { w_mut: 0, w_cna: 1, w_mut_cna: 0, all: 0 }
            );
        });
        it('returns correct categoried samples count when only `all_cases_with_mutation_and_cna_data` sets are present', () => {
            assert.deepEqual(
                categorizedSamplesCount(
                    mutationCnaSampleLists as SampleList[],
                    ['study1', 'study2'],
                    []
                ),
                { w_mut: 0, w_cna: 0, w_mut_cna: 1, all: 0 }
            );
        });
        it('returns correct categoried samples count when only sets are present', () => {
            assert.deepEqual(
                categorizedSamplesCount(
                    [
                        ...mutationSampleLists,
                        ...cnaSampleLists,
                        ...mutationCnaSampleLists,
                    ] as SampleList[],
                    ['study1', 'study2'],
                    []
                ),
                { w_mut: 2, w_cna: 1, w_mut_cna: 1, all: 0 }
            );
        });

        it('returns correct categoried samples count when virtual study is in selected studies', () => {
            assert.deepEqual(
                categorizedSamplesCount(
                    mutationSampleLists as SampleList[],
                    ['vs1'],
                    [virtualStudy] as VirtualStudy[]
                ),
                { w_mut: 1, w_cna: 0, w_mut_cna: 0, all: 0 }
            );
            assert.deepEqual(
                categorizedSamplesCount(
                    cnaSampleLists as SampleList[],
                    ['vs1'],
                    [virtualStudy] as VirtualStudy[]
                ),
                { w_mut: 0, w_cna: 0, w_mut_cna: 0, all: 0 }
            );
            assert.deepEqual(
                categorizedSamplesCount(
                    mutationCnaSampleLists as SampleList[],
                    ['vs1'],
                    [virtualStudy] as VirtualStudy[]
                ),
                { w_mut: 0, w_cna: 0, w_mut_cna: 0, all: 0 }
            );
            assert.deepEqual(
                categorizedSamplesCount(
                    [
                        ...mutationSampleLists,
                        ...cnaSampleLists,
                        ...mutationCnaSampleLists,
                    ] as SampleList[],
                    ['vs1'],
                    [virtualStudy] as VirtualStudy[]
                ),
                { w_mut: 1, w_cna: 0, w_mut_cna: 0, all: 0 }
            );
            assert.deepEqual(
                categorizedSamplesCount(
                    [
                        ...mutationSampleLists,
                        ...cnaSampleLists,
                        ...mutationCnaSampleLists,
                    ] as SampleList[],
                    ['study1', 'vs1'],
                    [virtualStudy] as VirtualStudy[]
                ),
                { w_mut: 2, w_cna: 1, w_mut_cna: 1, all: 0 }
            );
        });
    });
});
