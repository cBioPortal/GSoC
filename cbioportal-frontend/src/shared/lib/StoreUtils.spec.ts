import {
    evaluatePutativeDriverInfo,
    fetchGermlineConsentedSamples,
    fetchOncoKbData,
    fetchSamplesWithoutCancerTypeClinicalData,
    fetchStudiesForSamplesWithoutCancerTypeClinicalData,
    filterAndAnnotateMolecularData,
    filterAndAnnotateMutations,
    findMrnaRankMolecularProfileId,
    findSamplesWithoutCancerTypeClinicalData,
    generateMutationIdByEvent,
    generateMutationIdByGeneAndProteinChangeAndEvent,
    getOncoKbOncogenic,
    makeStudyToCancerTypeMap,
    mergeMutationsIncludingUncalled,
    noGenePanelUsed,
    PUTATIVE_DRIVER,
    PUTATIVE_PASSENGER,
} from './StoreUtils';
import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';
import { MobxPromise } from 'cbioportal-frontend-commons';
import {
    CancerStudy,
    ClinicalData,
    Gene,
    Mutation,
    Sample,
} from 'cbioportal-ts-api-client';
import { initMutation } from 'test/MutationMockUtils';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import { observable } from 'mobx';
import { getSimplifiedMutationType } from 'shared/lib/oql/AccessorsForOqlFilter';
import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';
import { AnnotatedNumericGeneMolecularData } from 'shared/model/AnnotatedNumericGeneMolecularData';
import { CustomDriverNumericGeneMolecularData } from 'shared/model/CustomDriverNumericGeneMolecularData';

describe('StoreUtils', () => {
    let emptyMutationData: MobxPromise<Mutation[]>;
    let emptyUncalledMutationData: MobxPromise<Mutation[]>;
    let mutationDataWithNoKeyword: MobxPromise<Mutation[]>;
    let mutationDataWithKeywords: MobxPromise<Mutation[]>;
    let mutationDataWithFusionsOnly: MobxPromise<Mutation[]>;
    let uncalledMutationDataWithNewEvent: MobxPromise<Mutation[]>;
    let mutationDataWithMutationsOnly: MobxPromise<Mutation[]>;
    let mutationDataWithBothMutationsAndFusions: MobxPromise<Mutation[]>;

    beforeAll(() => {
        emptyMutationData = {
            result: [],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };

        mutationDataWithNoKeyword = {
            result: [{}, {}] as Mutation[],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };

        mutationDataWithKeywords = {
            result: [{ keyword: 'one' }] as Mutation[],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };

        emptyUncalledMutationData = {
            result: [],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };

        const fusions: Mutation[] = [
            initMutation({
                gene: {
                    // fusion for ERG
                    hugoGeneSymbol: 'ERG',
                    proteinChange: 'TMPRSS2-ERG fusion',
                },
            }),
            initMutation({
                gene: {
                    // same fusion for TMPRSS2
                    hugoGeneSymbol: 'TMPRSS2',
                    proteinChange: 'TMPRSS2-ERG fusion',
                },
            }),
            initMutation({
                gene: {
                    // different fusion
                    hugoGeneSymbol: 'FOXP1',
                    proteinChange: 'FOXP1-intragenic',
                },
            }),
        ];

        const mutations: Mutation[] = [
            initMutation({
                // mutation
                gene: {
                    chromosome: 'X',
                    hugoGeneSymbol: 'TP53',
                },
                proteinChange: 'mutated',
                startPosition: 100,
                endPosition: 100,
                referenceAllele: 'A',
                variantAllele: 'T',
            }),
            initMutation({
                // another mutation with the same mutation event
                gene: {
                    chromosome: 'X',
                    hugoGeneSymbol: 'TP53',
                },
                proteinChange: 'mutated',
                startPosition: 100,
                endPosition: 100,
                referenceAllele: 'A',
                variantAllele: 'T',
            }),
            initMutation({
                // mutation with different mutation event
                gene: {
                    chromosome: 'Y',
                    hugoGeneSymbol: 'PTEN',
                },
                proteinChange: 'mutated',
                startPosition: 111,
                endPosition: 112,
                referenceAllele: 'T',
                variantAllele: 'A',
            }),
        ];

        uncalledMutationDataWithNewEvent = {
            result: [
                initMutation({
                    // mutation with different mutation event
                    gene: {
                        chromosome: '17',
                        hugoGeneSymbol: 'BRCA1',
                    },
                    proteinChange: 'mutated',
                    startPosition: 111,
                    endPosition: 112,
                    referenceAllele: 'T',
                    variantAllele: 'A',
                }),
            ],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };

        mutationDataWithFusionsOnly = {
            result: fusions,
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };

        mutationDataWithMutationsOnly = {
            result: mutations,
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };

        mutationDataWithBothMutationsAndFusions = {
            result: [...mutations, ...fusions],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };
    });

    describe('makeStudyToCancerTypeMap', () => {
        let studies: CancerStudy[];
        beforeAll(() => {
            studies = [];
            studies.push({
                studyId: '0',
                cancerType: {
                    name: 'ZERO',
                },
            } as CancerStudy);
            studies.push({
                studyId: '1',
                cancerType: {
                    name: 'ONE',
                },
            } as CancerStudy);
            studies.push({
                studyId: '2',
                cancerType: {
                    name: 'TWO',
                },
            } as CancerStudy);
            studies.push({
                studyId: '3',
                cancerType: {
                    name: 'three',
                },
            } as CancerStudy);
        });

        it('gives empty map if no studies', () => {
            assert.deepEqual(makeStudyToCancerTypeMap([]), {});
        });
        it('handles one study properly', () => {
            assert.deepEqual(makeStudyToCancerTypeMap([studies[0]]), {
                0: 'ZERO',
            });
        });
        it('handles more than one study properly', () => {
            assert.deepEqual(
                makeStudyToCancerTypeMap([studies[1], studies[2]]),
                { 1: 'ONE', 2: 'TWO' }
            );
            assert.deepEqual(
                makeStudyToCancerTypeMap([studies[2], studies[1], studies[3]]),
                { 1: 'ONE', 2: 'TWO', 3: 'three' }
            );
            assert.deepEqual(makeStudyToCancerTypeMap(studies), {
                0: 'ZERO',
                1: 'ONE',
                2: 'TWO',
                3: 'three',
            });
        });
    });

    describe('mergeMutationsIncludingUncalled', () => {
        it('merges mutations properly when there is only fusion data', () => {
            const mergedFusions = mergeMutationsIncludingUncalled(
                mutationDataWithFusionsOnly,
                emptyMutationData
            );

            assert.equal(mergedFusions.length, 3);
        });

        it('merges mutations properly when there is only mutation data', () => {
            const mergedMutations = mergeMutationsIncludingUncalled(
                mutationDataWithMutationsOnly,
                emptyMutationData
            );

            assert.equal(mergedMutations.length, 2);

            const sortedMutations = _.sortBy(mergedMutations, 'length');

            assert.equal(sortedMutations[0].length, 1);
            assert.equal(sortedMutations[1].length, 2);

            assert.equal(
                generateMutationIdByGeneAndProteinChangeAndEvent(
                    sortedMutations[1][0]
                ),
                generateMutationIdByGeneAndProteinChangeAndEvent(
                    sortedMutations[1][1]
                ),
                'mutation ids of merged mutations should be same'
            );

            assert.equal(
                generateMutationIdByEvent(sortedMutations[1][0]),
                generateMutationIdByEvent(sortedMutations[1][1]),
                'event based mutation ids of merged mutations should be same, too'
            );
        });

        it('merges mutations properly when there are both mutation and fusion data ', () => {
            const mergedMutations = mergeMutationsIncludingUncalled(
                mutationDataWithBothMutationsAndFusions,
                emptyMutationData
            );

            assert.equal(mergedMutations.length, 5);
        });

        it('does not include new mutation events from the uncalled mutations, only mutation events already called in >=1 sample should be added', () => {
            const mergedMutations = mergeMutationsIncludingUncalled(
                mutationDataWithBothMutationsAndFusions,
                uncalledMutationDataWithNewEvent
            );

            assert.equal(mergedMutations.length, 5);
        });
    });

    describe('fetchOncoKbData', () => {
        it("won't fetch onkokb data if there are no mutations", done => {
            fetchOncoKbData({}, [], emptyMutationData).then((data: any) => {
                assert.deepEqual(data, {
                    indicatorMap: {},
                });
                done();
            });
        });
    });

    describe('fetchGermlineConsentedSamples', () => {
        const studyIdsWithoutGermlineData: MobxPromise<string[]> = {
            result: ['study_with_no_germline_data'],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };

        const studyIdsWithSomeGermlineData: MobxPromise<string[]> = {
            result: ['study_with_no_germline_data', 'mskimpact'],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };

        const studiesWithGermlineConsentedSamples = ['mskimpact'];

        it("won't fetch germline consented samples for studies with no germline data", done => {
            const getAllSampleIdsInSampleListStub = sinon.stub();
            const client = {
                getAllSampleIdsInSampleListUsingGET: getAllSampleIdsInSampleListStub,
            };

            fetchGermlineConsentedSamples(
                studyIdsWithoutGermlineData,
                studiesWithGermlineConsentedSamples,
                client as any
            )
                .then((data: any) => {
                    assert.deepEqual(data, []);
                    assert.isTrue(
                        getAllSampleIdsInSampleListStub.notCalled,
                        'getAllSampleIdsInSample should NOT be called'
                    );
                    done();
                })
                .catch(done);
        });

        it('will fetch germline consented samples for only the studies with germline data', done => {
            const getAllSampleIdsInSampleListStub = sinon.stub();
            getAllSampleIdsInSampleListStub.returns(
                Promise.resolve([
                    {
                        sampleId: 'mskimpact_sample_0',
                        studyId: 'mskimpact',
                    },
                    {
                        sampleId: 'mskimpact_sample_1',
                        studyId: 'mskimpact',
                    },
                    {
                        sampleId: 'mskimpact_sample_2',
                        studyId: 'mskimpact',
                    },
                ])
            );

            const client = {
                getAllSampleIdsInSampleListUsingGET: getAllSampleIdsInSampleListStub,
            };

            fetchGermlineConsentedSamples(
                studyIdsWithSomeGermlineData,
                studiesWithGermlineConsentedSamples,
                client as any
            )
                .then((data: any) => {
                    assert.isTrue(
                        getAllSampleIdsInSampleListStub.calledOnce,
                        'getAllSampleIdsInSample should be called only once'
                    );
                    assert.isTrue(
                        getAllSampleIdsInSampleListStub.calledWith({
                            sampleListId: 'mskimpact_germline',
                        }),
                        'getAllSampleIdsInSample should be called with the correct sample list id (mskimpact_germline)'
                    );
                    assert.equal(
                        data.length,
                        3,
                        'getAllSampleIdsInSample should return an array of size 3'
                    );
                    done();
                })
                .catch(done);
        });
    });

    describe('samples without cancer type clinical data', () => {
        const studyId: string = 'study';
        let samples: MobxPromise<Sample[]> = {
            result: [
                { sampleId: 'Sample1', uniqueSampleKey: 'Sample1' },
                { sampleId: 'Sample2', uniqueSampleKey: 'Sample2' },
                { sampleId: 'Sample3', uniqueSampleKey: 'Sample3' },
                { sampleId: 'Sample4', uniqueSampleKey: 'Sample4' },
            ] as Sample[],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };

        let samplesWithoutCancerTypeClinicalData: MobxPromise<Sample[]> = {
            result: [
                {
                    sampleId: 'Sample4',
                    studyId: 'study4',
                    uniqueSampleKey: 'Sample4',
                },
            ] as Sample[],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };

        let sampleIds: MobxPromise<string[]> = {
            result: ['Sample1', 'Sample2', 'Sample3', 'Sample4'] as string[],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };

        let clinicalDataForSamples: MobxPromise<ClinicalData[]> = {
            result: [
                {
                    clinicalAttributeId: 'CANCER_TYPE_DETAILED',
                    sampleId: 'Sample1',
                    value: 'Invasive Breast Carcinoma',
                    uniqueSampleKey: 'Sample1',
                },
                {
                    clinicalAttributeId: 'CANCER_TYPE',
                    sampleId: 'Sample1',
                    value: 'Breast',
                    uniqueSampleKey: 'Sample1',
                },
                {
                    clinicalAttributeId: 'CANCER_TYPE_DETAILED',
                    sampleId: 'Sample2',
                    value: 'Prostate Adenocarcinoma',
                    uniqueSampleKey: 'Sample2',
                },
                {
                    clinicalAttributeId: 'CANCER_TYPE',
                    sampleId: 'Sample3',
                    value: 'Skin',
                    uniqueSampleKey: 'Sample3',
                },
            ] as ClinicalData[],
            status: 'complete' as 'complete',
            peekStatus: 'complete',
            isPending: false,
            isError: false,
            isComplete: true,
            error: undefined,
        };

        it('finds samples without cancer type clinical data', () => {
            const samplesWithoutCancerType = findSamplesWithoutCancerTypeClinicalData(
                samples,
                clinicalDataForSamples
            );

            assert.deepEqual(samplesWithoutCancerType, [
                { sampleId: 'Sample4', uniqueSampleKey: 'Sample4' } as Partial<
                    Sample
                >,
            ]);
        });

        const fetchSamplesStub = sinon.stub();
        const fetchStudiesStub = sinon.stub();

        const client = {
            fetchSamplesUsingPOST: fetchSamplesStub,
            fetchStudiesUsingPOST: fetchStudiesStub,
        };

        it('fetches samples without cancer type clinical data', () => {
            const samplesWithoutCancerTypeClinicalData = fetchSamplesWithoutCancerTypeClinicalData(
                sampleIds,
                studyId,
                clinicalDataForSamples,
                client as any
            );

            assert.isTrue(
                fetchSamplesStub.called,
                'fetchSamples should be called'
            );
            assert.isTrue(
                fetchSamplesStub.calledWith({
                    sampleFilter: {
                        sampleIdentifiers: [
                            { sampleId: 'Sample4', studyId: 'study' },
                        ],
                    },
                }),
                'fetchSamples should be called with the correct sample id (Sample4)'
            );
        });

        it('fetches studies for samples without cancer type clinical data', () => {
            const studies = fetchStudiesForSamplesWithoutCancerTypeClinicalData(
                samplesWithoutCancerTypeClinicalData,
                client as any
            );

            assert.isTrue(
                fetchStudiesStub.calledOnce,
                'fetchStudies should be called only once'
            );
            assert.isTrue(
                fetchStudiesStub.calledWith({
                    studyIds: ['study4'],
                    projection: 'DETAILED',
                }),
                'fetchStudy should be called with the correct study id (study4)'
            );
        });
    });

    describe('noGenePanelUsed()', () => {
        it('handles undefined values', () => {
            assert.isTrue(noGenePanelUsed(undefined));
        });
        it('handles "WES"-tag values', () => {
            assert.isTrue(noGenePanelUsed('WES'));
        });
        it('handles "WGS"-tag values', () => {
            assert.isTrue(noGenePanelUsed('WGS'));
        });
        it('returns false for any other gene panel id', () => {
            assert.isFalse(noGenePanelUsed('dummy_gene_panel_id'));
        });
    });

    describe('filterAndAnnotateMolecularData', () => {
        it('returns empty list for empty input', () => {
            assert.deepEqual(
                filterAndAnnotateMolecularData([], () => ({} as any), {}),
                {
                    data: [],
                    vus: [],
                }
            );
        });
        it('annotates a single VUS CNA datum', () => {
            assert.deepEqual(
                filterAndAnnotateMolecularData(
                    [
                        {
                            value: 0,
                            entrezGeneId: 1,
                        } as CustomDriverNumericGeneMolecularData,
                    ],
                    () => ({
                        oncoKb: '',
                        customDriverBinary: false,
                        customDriverTier: undefined, // can be undefined, empty string, tier name
                    }),
                    { 1: { hugoGeneSymbol: 'mygene' } as Gene }
                ),
                {
                    data: [],
                    vus: [
                        {
                            value: 0,
                            hugoGeneSymbol: 'mygene',
                            entrezGeneId: 1,
                            oncoKbOncogenic: '',
                            putativeDriver: false,
                        } as AnnotatedNumericGeneMolecularData,
                    ],
                }
            );
        });
        it('annotates a single driver CNA datum - OncoKB', () => {
            assert.deepEqual(
                filterAndAnnotateMolecularData(
                    [
                        {
                            value: 0,
                            entrezGeneId: 1,
                        } as CustomDriverNumericGeneMolecularData,
                    ],
                    () => ({
                        oncoKb: 'Oncogenic',
                        customDriverBinary: false,
                        customDriverTier: undefined,
                    }),
                    { 1: { hugoGeneSymbol: 'mygene' } as Gene }
                ),
                {
                    vus: [],
                    data: [
                        {
                            value: 0,
                            hugoGeneSymbol: 'mygene',
                            entrezGeneId: 1,
                            oncoKbOncogenic: 'Oncogenic',
                            putativeDriver: true,
                        } as AnnotatedNumericGeneMolecularData,
                    ],
                }
            );
        });
        it('annotates a single driver CNA datum - custom driver annotation', () => {
            assert.deepEqual(
                filterAndAnnotateMolecularData(
                    [
                        {
                            value: 0,
                            entrezGeneId: 1,
                        } as CustomDriverNumericGeneMolecularData,
                    ],
                    () => ({
                        oncoKb: '',
                        customDriverBinary: true,
                        customDriverTier: undefined,
                    }),
                    { 1: { hugoGeneSymbol: 'mygene' } as Gene }
                ),
                {
                    vus: [],
                    data: [
                        {
                            value: 0,
                            hugoGeneSymbol: 'mygene',
                            entrezGeneId: 1,
                            oncoKbOncogenic: '',
                            putativeDriver: true,
                        } as AnnotatedNumericGeneMolecularData,
                    ],
                }
            );
        });
        it('annotates a single driver CNA datum - custom driver tier', () => {
            assert.deepEqual(
                filterAndAnnotateMolecularData(
                    [
                        {
                            value: 0,
                            entrezGeneId: 1,
                        } as CustomDriverNumericGeneMolecularData,
                    ],
                    () => ({
                        oncoKb: '',
                        customDriverBinary: false,
                        customDriverTier:
                            'All_mutations_in_tier_become_Drivers!',
                        // tier name
                    }),
                    { 1: { hugoGeneSymbol: 'mygene' } as Gene }
                ),
                {
                    vus: [],
                    data: [
                        {
                            value: 0,
                            hugoGeneSymbol: 'mygene',
                            entrezGeneId: 1,
                            oncoKbOncogenic: '',
                            putativeDriver: true,
                        } as AnnotatedNumericGeneMolecularData,
                    ],
                }
            );
        });
        it('annotates a single driver VUS datum - disregards empty string custom driver tier', () => {
            assert.deepEqual(
                filterAndAnnotateMolecularData(
                    [
                        {
                            value: 0,
                            entrezGeneId: 1,
                        } as CustomDriverNumericGeneMolecularData,
                    ],
                    () => ({
                        oncoKb: '',
                        customDriverBinary: false,
                        customDriverTier: '',
                        // tier name
                    }),
                    { 1: { hugoGeneSymbol: 'mygene' } as Gene }
                ),
                {
                    vus: [
                        {
                            value: 0,
                            hugoGeneSymbol: 'mygene',
                            entrezGeneId: 1,
                            oncoKbOncogenic: '',
                            putativeDriver: false,
                        } as AnnotatedNumericGeneMolecularData,
                    ],
                    data: [],
                }
            );
        });
        it('annotates a few CNA data points', () => {
            assert.deepEqual(
                filterAndAnnotateMolecularData(
                    [
                        { value: 0, entrezGeneId: 1 },
                        {
                            value: 1,
                            entrezGeneId: 2,
                        } as CustomDriverNumericGeneMolecularData,
                    ] as CustomDriverNumericGeneMolecularData[],
                    () => ({
                        oncoKb: '',
                        customDriverBinary: true,
                        customDriverTier: undefined,
                        // tier name
                    }),
                    {
                        1: { hugoGeneSymbol: 'mygene1' } as Gene,
                        2: { hugoGeneSymbol: 'mygene2' } as Gene,
                    }
                ),
                {
                    vus: [],
                    data: [
                        {
                            value: 0,
                            hugoGeneSymbol: 'mygene1',
                            entrezGeneId: 1,
                            oncoKbOncogenic: '',
                            putativeDriver: true,
                        },
                        {
                            value: 1,
                            hugoGeneSymbol: 'mygene2',
                            entrezGeneId: 2,
                            oncoKbOncogenic: '',
                            putativeDriver: true,
                        },
                    ] as AnnotatedNumericGeneMolecularData[],
                }
            );
        });
        it('correctly sorts VUS and annotated CNA data points', () => {
            assert.deepEqual(
                filterAndAnnotateMolecularData(
                    [
                        { value: 0, entrezGeneId: 1 },
                        {
                            value: 1,
                            entrezGeneId: 2,
                        } as AnnotatedNumericGeneMolecularData,
                    ] as AnnotatedNumericGeneMolecularData[],
                    cnaDatum => {
                        if (cnaDatum.entrezGeneId === 1) {
                            return {
                                oncoKb: '',
                                customDriverBinary: true,
                                customDriverTier: undefined,
                            };
                        } else {
                            return {
                                oncoKb: '',
                                customDriverBinary: false,
                                customDriverTier: undefined,
                            };
                        }
                    },
                    {
                        1: { hugoGeneSymbol: 'mygene1' } as Gene,
                        2: { hugoGeneSymbol: 'mygene2' } as Gene,
                    }
                ),
                {
                    data: [
                        {
                            value: 0,
                            hugoGeneSymbol: 'mygene1',
                            entrezGeneId: 1,
                            oncoKbOncogenic: '',
                            putativeDriver: true,
                        },
                    ] as AnnotatedNumericGeneMolecularData[],
                    vus: [
                        {
                            value: 1,
                            hugoGeneSymbol: 'mygene2',
                            entrezGeneId: 2,
                            oncoKbOncogenic: '',
                            putativeDriver: false,
                        },
                    ] as AnnotatedNumericGeneMolecularData[],
                }
            );
        });
    });

    describe('evaluateDiscreteCNAPutativeDriverInfo', () => {
        it('no driver annotations present', () => {
            assert.deepEqual(
                evaluatePutativeDriverInfo(
                    {
                        entrezGeneId: 1,
                        value: 0,
                        driverFilter: PUTATIVE_PASSENGER,
                        driverFilterAnnotation: '',
                        driverTiersFilter: 'Class 1',
                        driverTiersFilterAnnotation: '',
                    } as CustomDriverNumericGeneMolecularData,
                    {
                        oncogenic: 'Unknown',
                    } as IndicatorQueryResp,
                    false,
                    observable.map<string, boolean>({ 'Class 1': false })
                ),
                {
                    oncoKb: '',
                    customDriverBinary: false,
                    customDriverTier: undefined,
                }
            );
        });
        it('OncoKb', () => {
            assert.deepEqual(
                evaluatePutativeDriverInfo(
                    {
                        entrezGeneId: 1,
                        value: 0,
                        driverFilter: PUTATIVE_PASSENGER,
                        driverFilterAnnotation: '',
                        driverTiersFilter: 'Class 1',
                        driverTiersFilterAnnotation: '',
                    } as CustomDriverNumericGeneMolecularData,
                    {
                        oncogenic: 'Oncogenic',
                    } as IndicatorQueryResp,
                    false,
                    observable.map<string, boolean>({ 'Class 1': false })
                ),
                {
                    oncoKb: 'Oncogenic',
                    customDriverBinary: false,
                    customDriverTier: undefined,
                }
            );
        });
        it('custom driver annnotation', () => {
            assert.deepEqual(
                evaluatePutativeDriverInfo(
                    {
                        entrezGeneId: 1,
                        value: 0,
                        driverFilter: PUTATIVE_DRIVER,
                        driverFilterAnnotation: '',
                        driverTiersFilter: 'Class 1',
                        driverTiersFilterAnnotation: '',
                    } as CustomDriverNumericGeneMolecularData,
                    {
                        oncogenic: 'Unknown',
                    } as IndicatorQueryResp,
                    false,
                    observable.map<string, boolean>({ 'Class 1': false })
                ),
                {
                    oncoKb: '',
                    customDriverBinary: false,
                    customDriverTier: undefined,
                }
            );
            assert.deepEqual(
                evaluatePutativeDriverInfo(
                    {
                        entrezGeneId: 1,
                        value: 0,
                        driverFilter: PUTATIVE_DRIVER,
                        driverFilterAnnotation: '',
                        driverTiersFilter: 'Class 1',
                        driverTiersFilterAnnotation: '',
                    } as CustomDriverNumericGeneMolecularData,
                    {
                        oncogenic: 'Unknown',
                    } as IndicatorQueryResp,
                    true,
                    observable.map<string, boolean>({ 'Class 1': false })
                ),
                {
                    oncoKb: '',
                    customDriverBinary: true,
                    customDriverTier: undefined,
                }
            );
        });
        it('custom tiers active', () => {
            assert.deepEqual(
                evaluatePutativeDriverInfo(
                    {
                        entrezGeneId: 1,
                        value: 0,
                        driverFilter: PUTATIVE_PASSENGER,
                        driverFilterAnnotation: '',
                        driverTiersFilter: 'Class 1',
                        driverTiersFilterAnnotation: '',
                    } as CustomDriverNumericGeneMolecularData,
                    {
                        oncogenic: 'Unknown',
                    } as IndicatorQueryResp,
                    false,
                    observable.map<string, boolean>({ 'Class 1': true })
                ),
                {
                    oncoKb: '',
                    customDriverBinary: false,
                    customDriverTier: 'Class 1',
                }
            );
            assert.deepEqual(
                evaluatePutativeDriverInfo(
                    {
                        entrezGeneId: 1,
                        value: 0,
                        driverFilter: PUTATIVE_PASSENGER,
                        driverFilterAnnotation: '',
                        driverTiersFilter: 'Class 2',
                        driverTiersFilterAnnotation: '',
                    } as CustomDriverNumericGeneMolecularData,
                    {
                        oncogenic: 'Unknown',
                    } as IndicatorQueryResp,
                    false,
                    observable.map<string, boolean>({
                        'Class 2': false,
                        'Class 1': true,
                    })
                ),
                {
                    oncoKb: '',
                    customDriverBinary: false,
                    customDriverTier: undefined,
                }
            );
        });
    });

    describe('filterAndAnnotateMutations', () => {
        it('returns empty list for empty input', () => {
            assert.deepEqual(
                filterAndAnnotateMutations([], () => ({} as any), {}),
                {
                    data: [],
                    germline: [],
                    vus: [],
                    vusAndGermline: [],
                }
            );
        });
        it('annotates a single mutation', () => {
            assert.deepEqual(
                filterAndAnnotateMutations(
                    [{ mutationType: 'missense', entrezGeneId: 1 } as Mutation],
                    () => ({
                        oncoKb: '',
                        hotspots: true,
                        customDriverBinary: false,
                    }),
                    { 1: { hugoGeneSymbol: 'mygene' } as Gene }
                ),
                {
                    data: [
                        {
                            mutationType: 'missense',
                            hugoGeneSymbol: 'mygene',
                            entrezGeneId: 1,
                            simplifiedMutationType: getSimplifiedMutationType(
                                'missense'
                            ),
                            isHotspot: true,
                            oncoKbOncogenic: '',
                            putativeDriver: true,
                        } as AnnotatedMutation,
                    ],
                    germline: [],
                    vus: [],
                    vusAndGermline: [],
                }
            );
        });
        it('annotates a few mutations', () => {
            assert.deepEqual(
                filterAndAnnotateMutations(
                    [
                        {
                            mutationType: 'missense',
                            entrezGeneId: 1,
                        } as Mutation,
                        {
                            mutationType: 'in_frame_del',
                            entrezGeneId: 1,
                        } as Mutation,
                        { mutationType: 'asdf', entrezGeneId: 134 } as Mutation,
                    ],
                    () => ({
                        oncoKb: '',
                        hotspots: true,
                        customDriverBinary: false,
                    }),
                    {
                        1: { hugoGeneSymbol: 'gene1hello' } as Gene,
                        134: { hugoGeneSymbol: 'gene3hello' } as Gene,
                    }
                ),
                {
                    data: [
                        {
                            mutationType: 'missense',
                            hugoGeneSymbol: 'gene1hello',
                            entrezGeneId: 1,
                            simplifiedMutationType: getSimplifiedMutationType(
                                'missense'
                            ),
                            isHotspot: true,
                            oncoKbOncogenic: '',
                            putativeDriver: true,
                        },
                        {
                            mutationType: 'in_frame_del',
                            hugoGeneSymbol: 'gene1hello',
                            entrezGeneId: 1,
                            simplifiedMutationType: getSimplifiedMutationType(
                                'in_frame_del'
                            ),
                            isHotspot: true,
                            oncoKbOncogenic: '',
                            putativeDriver: true,
                        },
                        {
                            mutationType: 'asdf',
                            hugoGeneSymbol: 'gene3hello',
                            entrezGeneId: 134,
                            simplifiedMutationType: getSimplifiedMutationType(
                                'asdf'
                            ),
                            isHotspot: true,
                            oncoKbOncogenic: '',
                            putativeDriver: true,
                        },
                    ] as AnnotatedMutation[],
                    vus: [],
                    germline: [],
                    vusAndGermline: [],
                }
            );
        });
        it('excludes a single non-annotated mutation', () => {
            assert.deepEqual(
                filterAndAnnotateMutations(
                    [{ mutationType: 'missense', entrezGeneId: 1 } as Mutation],
                    () => ({
                        oncoKb: '',
                        hotspots: false,
                        customDriverBinary: false,
                    }),
                    {
                        1: { hugoGeneSymbol: 'gene1hello' } as Gene,
                        134: { hugoGeneSymbol: 'gene3hello' } as Gene,
                    }
                ),
                {
                    data: [],
                    germline: [],
                    vus: [
                        {
                            mutationType: 'missense',
                            hugoGeneSymbol: 'gene1hello',
                            entrezGeneId: 1,
                            simplifiedMutationType: getSimplifiedMutationType(
                                'missense'
                            ),
                            isHotspot: false,
                            oncoKbOncogenic: '',
                            putativeDriver: false,
                        },
                    ] as AnnotatedMutation[],
                    vusAndGermline: [],
                }
            );
        });
        it('excludes non-annotated mutations from a list of a few', () => {
            assert.deepEqual(
                filterAndAnnotateMutations(
                    [
                        {
                            mutationType: 'missense',
                            entrezGeneId: 1,
                        } as Mutation,
                        {
                            mutationType: 'in_frame_del',
                            entrezGeneId: 1,
                        } as Mutation,
                        { mutationType: 'asdf', entrezGeneId: 134 } as Mutation,
                    ],
                    m =>
                        m.mutationType === 'in_frame_del'
                            ? {
                                  oncoKb: '',
                                  hotspots: false,
                                  customDriverBinary: true,
                              }
                            : {
                                  oncoKb: '',
                                  hotspots: false,
                                  customDriverBinary: false,
                              },
                    {
                        1: { hugoGeneSymbol: 'gene1hello' } as Gene,
                        134: { hugoGeneSymbol: 'gene3hello' } as Gene,
                    }
                ),
                {
                    data: [
                        {
                            mutationType: 'in_frame_del',
                            hugoGeneSymbol: 'gene1hello',
                            entrezGeneId: 1,
                            simplifiedMutationType: getSimplifiedMutationType(
                                'in_frame_del'
                            ),
                            isHotspot: false,
                            oncoKbOncogenic: '',
                            putativeDriver: true,
                        },
                    ] as AnnotatedMutation[],
                    vus: [
                        {
                            mutationType: 'missense',
                            hugoGeneSymbol: 'gene1hello',
                            entrezGeneId: 1,
                            simplifiedMutationType: getSimplifiedMutationType(
                                'missense'
                            ),
                            isHotspot: false,
                            oncoKbOncogenic: '',
                            putativeDriver: false,
                        },
                        {
                            mutationType: 'asdf',
                            hugoGeneSymbol: 'gene3hello',
                            entrezGeneId: 134,
                            simplifiedMutationType: getSimplifiedMutationType(
                                'asdf'
                            ),
                            isHotspot: false,
                            oncoKbOncogenic: '',
                            putativeDriver: false,
                        },
                    ] as AnnotatedMutation[],
                    germline: [],
                    vusAndGermline: [],
                }
            );
        });
        it('excludes a single germline mutation', () => {
            assert.deepEqual(
                filterAndAnnotateMutations(
                    [
                        {
                            mutationType: 'missense',
                            entrezGeneId: 1,
                            mutationStatus: 'germline',
                        } as Mutation,
                    ],
                    () => ({
                        oncoKb: '',
                        hotspots: false,
                        customDriverBinary: false,
                    }),
                    {
                        1: { hugoGeneSymbol: 'gene1hello' } as Gene,
                        134: { hugoGeneSymbol: 'gene3hello' } as Gene,
                    }
                ),
                {
                    data: [],
                    vusAndGermline: [
                        {
                            mutationType: 'missense',
                            hugoGeneSymbol: 'gene1hello',
                            mutationStatus: 'germline',
                            entrezGeneId: 1,
                            simplifiedMutationType: getSimplifiedMutationType(
                                'missense'
                            ),
                            isHotspot: false,
                            oncoKbOncogenic: '',
                            putativeDriver: false,
                        },
                    ] as AnnotatedMutation[],
                    vus: [],
                    germline: [],
                }
            );
        });
        it('excludes germline mutations from a list of a few', () => {
            assert.deepEqual(
                filterAndAnnotateMutations(
                    [
                        {
                            mutationType: 'missense',
                            entrezGeneId: 1,
                            mutationStatus: 'germline',
                        } as Mutation,
                        {
                            mutationType: 'in_frame_del',
                            entrezGeneId: 1,
                        } as Mutation,
                        {
                            mutationType: 'asdf',
                            entrezGeneId: 134,
                            mutationStatus: 'germline',
                        } as Mutation,
                    ],
                    m =>
                        m.mutationType === 'in_frame_del'
                            ? {
                                  oncoKb: '',
                                  hotspots: false,
                                  customDriverBinary: true,
                              }
                            : {
                                  oncoKb: '',
                                  hotspots: false,
                                  customDriverBinary: false,
                              },
                    {
                        1: { hugoGeneSymbol: 'gene1hello' } as Gene,
                        134: { hugoGeneSymbol: 'gene3hello' } as Gene,
                    }
                ),
                {
                    data: [
                        {
                            mutationType: 'in_frame_del',
                            hugoGeneSymbol: 'gene1hello',
                            entrezGeneId: 1,
                            simplifiedMutationType: getSimplifiedMutationType(
                                'in_frame_del'
                            ),
                            isHotspot: false,
                            oncoKbOncogenic: '',
                            putativeDriver: true,
                        },
                    ] as AnnotatedMutation[],
                    germline: [],
                    vus: [],
                    vusAndGermline: [
                        {
                            mutationType: 'missense',
                            hugoGeneSymbol: 'gene1hello',
                            mutationStatus: 'germline',
                            entrezGeneId: 1,
                            simplifiedMutationType: getSimplifiedMutationType(
                                'missense'
                            ),
                            isHotspot: false,
                            oncoKbOncogenic: '',
                            putativeDriver: false,
                        },
                        {
                            mutationType: 'asdf',
                            hugoGeneSymbol: 'gene3hello',
                            mutationStatus: 'germline',
                            entrezGeneId: 134,
                            simplifiedMutationType: getSimplifiedMutationType(
                                'asdf'
                            ),
                            isHotspot: false,
                            oncoKbOncogenic: '',
                            putativeDriver: false,
                        },
                    ] as AnnotatedMutation[],
                }
            );
        });
    });

    describe('getOncoKbOncogenic', () => {
        it('should return Likely Oncogenic if thats the input', () => {
            assert.equal(
                getOncoKbOncogenic({
                    oncogenic: 'Likely Oncogenic',
                } as IndicatorQueryResp),
                'Likely Oncogenic'
            );
        });
        it('should return Oncogenic if thats the input', () => {
            assert.equal(
                getOncoKbOncogenic({
                    oncogenic: 'Oncogenic',
                } as IndicatorQueryResp),
                'Oncogenic'
            );
        });
        it('should return Resistance if thats the input', () => {
            assert.equal(
                getOncoKbOncogenic({
                    oncogenic: 'Resistance',
                } as IndicatorQueryResp),
                'Resistance'
            );
        });
        it('should return empty string for any other case', () => {
            assert.equal(
                getOncoKbOncogenic({
                    oncogenic: 'Likely Neutral',
                } as IndicatorQueryResp),
                ''
            );
            assert.equal(
                getOncoKbOncogenic({
                    oncogenic: 'Inconclusive',
                } as IndicatorQueryResp),
                ''
            );
            assert.equal(
                getOncoKbOncogenic({
                    oncogenic: 'Unknown',
                } as IndicatorQueryResp),
                ''
            );
            assert.equal(
                getOncoKbOncogenic({ oncogenic: '' } as IndicatorQueryResp),
                ''
            );
            assert.equal(
                getOncoKbOncogenic({
                    oncogenic: 'asdfasdfasefawer',
                } as IndicatorQueryResp),
                ''
            );
            assert.equal(
                getOncoKbOncogenic({ oncogenic: undefined } as any),
                ''
            );
        });
    });

    describe('findMrnaRankMolecularProfileId', () => {
        it('requires `rna_seq` in profile name', () => {
            const list = [
                'ucec_tcga_pub_rppa',
                'ucec_tcga_pub_rppa_Zscores',
                'ucec_tcga_pub_gistic',
                'ucec_tcga_pub_linear_CNA',
                'ucec_tcga_pub_mutations',
                'ucec_tcga_pub_methylation_hm27',
                'ucec_tcga_pub_mrna',
                'ucec_tcga_pub_mrna_median_Zscores',
                ',ucec_tcga_pub_mrna_median_all_sample_Zscores',
                'ucec_tcga_pub_rna_seq_v2_mrna',
                'ucec_tcga_pub_rna_seq_v2_mrna_median_Zscores',
                'ucec_tcga_pub_rna_seq_v2_mrna_median_all_sample_Zscores',
            ];

            assert.equal(
                findMrnaRankMolecularProfileId(list),
                'ucec_tcga_pub_rna_seq_v2_mrna_median_Zscores'
            );
        });

        it('does not match rppa profiles', () => {
            const list = [
                'brca_tcga_pub_rppa',
                'brca_tcga_pub_rppa_Zscores',
                'brca_tcga_pub_gistic',
                'brca_tcga_pub_mrna',
                'brca_tcga_pub_mrna_median_Zscores',
                'brca_tcga_pub_linear_CNA',
                'brca_tcga_pub_methylation_hm27',
                'brca_tcga_pub_mutations',
                'brca_tcga_pub_mirna',
                'brca_tcga_pub_mirna_median_Zscores',
                'brca_tcga_pub_mrna_merged_median_Zscores',
                'brca_tcga_pub_mrna_median_all_sample_Zscores',
            ];

            assert.equal(findMrnaRankMolecularProfileId(list), null);
        });
    });
});
