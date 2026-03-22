import { assert } from 'chai';
import {
    CancerStudy,
    Gene,
    MolecularProfile,
    Mutation,
    NumericGeneMolecularData,
    Sample,
} from 'cbioportal-ts-api-client';
import {
    annotateMolecularDatum,
    annotateMutationPutativeDriver,
    buildResultsViewPageTitle,
    computeCustomDriverAnnotationReport,
    fetchQueriedStudies,
    filterSubQueryData,
    getGeneAndProfileChunksForRequest,
    getMultipleGeneResultKey,
    getSampleAlteredMap,
    getSingleGeneResultKey,
    initializeCustomDriverAnnotationSettings,
    isPanCanStudy,
    isRNASeqProfile,
    isTCGAProvStudy,
    isTCGAPubStudy,
    parseGenericAssayGroups,
} from './ResultsViewPageStoreUtils';
import {
    MergedTrackLineFilterOutput,
    OQLLineFilterOutput,
} from '../../shared/lib/oql/oqlfilter';
import { observable } from 'mobx';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import _ from 'lodash';
import sinon from 'sinon';
import sessionServiceClient from 'shared/api//sessionServiceInstance';
import client from 'shared/api/cbioportalClientInstance';
import AccessorsForOqlFilter, {
    getSimplifiedMutationType,
} from '../../shared/lib/oql/AccessorsForOqlFilter';
import { AlteredStatus } from './mutualExclusivity/MutualExclusivityUtil';
import {
    filterAndAnnotateMutations,
    getOncoKbOncogenic,
} from 'shared/lib/StoreUtils';
import oql_parser, { SingleGeneQuery } from '../../shared/lib/oql/oql-parser';
import {
    VirtualStudy,
    VirtualStudyData,
} from 'shared/api/session-service/sessionServiceModels';
import $ from 'jquery';
import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';
import { AnnotatedExtendedAlteration } from 'shared/model/AnnotatedExtendedAlteration';
import { CustomDriverNumericGeneMolecularData } from 'shared/model/CustomDriverNumericGeneMolecularData';
import { IQueriedMergedTrackCaseData } from 'shared/model/IQueriedMergedTrackCaseData';

describe('ResultsViewPageStoreUtils', () => {
    describe('computeCustomDriverAnnotationReport', () => {
        let driverFilterMutation: Mutation;
        let driverTiersFilterMutation: Mutation;
        let bothMutation: Mutation;
        let neitherMutation: Mutation;

        beforeAll(() => {
            driverFilterMutation = {
                driverFilter: 'B',
            } as Mutation;

            driverTiersFilterMutation = {
                driverTiersFilter: 'T',
            } as Mutation;

            bothMutation = {
                driverFilter: 'ADFADF',
                driverTiersFilter: 'SDPOIFJP',
            } as Mutation;

            neitherMutation = {} as Mutation;
        });

        it('returns the right report for empty list', () => {
            assert.deepEqual(computeCustomDriverAnnotationReport([]), {
                hasBinary: false,
                tiers: [],
            });
        });
        it('returns the right report for no annotations, one element', () => {
            assert.deepEqual(
                computeCustomDriverAnnotationReport([neitherMutation]),
                {
                    hasBinary: false,
                    tiers: [],
                }
            );
        });
        it('returns the right report for no annotations, three elements', () => {
            assert.deepEqual(
                computeCustomDriverAnnotationReport([
                    neitherMutation,
                    neitherMutation,
                    neitherMutation,
                ]),
                {
                    hasBinary: false,
                    tiers: [],
                }
            );
        });
        it('returns the right report for just binary annotations, one element', () => {
            assert.deepEqual(
                computeCustomDriverAnnotationReport([driverFilterMutation]),
                { hasBinary: true, tiers: [] }
            );
        });
        it('returns the right report for just binary annotations, three elements', () => {
            assert.deepEqual(
                computeCustomDriverAnnotationReport([
                    neitherMutation,
                    driverFilterMutation,
                    driverFilterMutation,
                ]),
                { hasBinary: true, tiers: [] }
            );
        });
        it('returns the right report for just tiers annotations, one element', () => {
            assert.deepEqual(
                computeCustomDriverAnnotationReport([
                    driverTiersFilterMutation,
                ]),
                {
                    hasBinary: false,
                    tiers: ['T'],
                }
            );
        });
        it('returns the right report for just tiers annotations, three elements', () => {
            assert.deepEqual(
                computeCustomDriverAnnotationReport([
                    driverTiersFilterMutation,
                    driverTiersFilterMutation,
                    neitherMutation,
                ]),
                {
                    hasBinary: false,
                    tiers: ['T'],
                }
            );
        });
        it('returns the right report for binary and tier annotation in one element', () => {
            assert.deepEqual(
                computeCustomDriverAnnotationReport([bothMutation]),
                {
                    hasBinary: true,
                    tiers: ['SDPOIFJP'],
                }
            );
        });
        it('returns the right report for binary and tier annotation, both present in three elements', () => {
            assert.deepEqual(
                computeCustomDriverAnnotationReport([
                    bothMutation,
                    neitherMutation,
                    bothMutation,
                ]),
                {
                    hasBinary: true,
                    tiers: ['SDPOIFJP'],
                }
            );
        });
        it('returns the right report for binary and tier annotation in different elements', () => {
            assert.deepEqual(
                computeCustomDriverAnnotationReport([
                    driverTiersFilterMutation,
                    driverFilterMutation,
                ]),
                {
                    hasBinary: true,
                    tiers: ['T'],
                }
            );
        });
        it('returns the right report for binary and tier annotation in different elements, including an element with no annotation', () => {
            assert.deepEqual(
                computeCustomDriverAnnotationReport([
                    driverTiersFilterMutation,
                    driverFilterMutation,
                    neitherMutation,
                ]),
                {
                    hasBinary: true,
                    tiers: ['T'],
                }
            );
        });
    });

    describe('filterSubQueryData', () => {
        // I believe these metadata to be all `new AccessorsForOqlFilter()` needs
        // tslint:disable-next-line no-object-literal-type-assertion
        const makeBasicExpressionProfile = () =>
            ({
                molecularAlterationType: 'MRNA_EXPRESSION',
                datatype: 'Z-SCORE',
                molecularProfileId: 'brca_tcga_mrna_median_Zscores',
                studyId: 'brca_tcga',
            } as MolecularProfile);

        // I believe this to be the projection the filter function needs
        const makeMinimalExpressionData = (
            points: {
                entrezGeneId: number;
                uniqueSampleKey: string;
                value: number;
            }[]
        ) =>
            points.map(({ entrezGeneId, uniqueSampleKey, value }) => ({
                entrezGeneId,
                value,
                uniqueSampleKey,
                sampleId: `TCGA-${uniqueSampleKey}`,
                uniquePatientKey: `${uniqueSampleKey}_PATIENT`,
                patientId: `TCGA-${uniqueSampleKey}_PATIENT`,
                molecularProfileId: 'brca_tcga_mrna_median_Zscores',
                studyId: 'brca_tcga',
                gene: {
                    entrezGeneId,
                    hugoGeneSymbol: `GENE${entrezGeneId}`,
                    type: 'protein-coding',
                },
            })) as NumericGeneMolecularData[];

        const makeMinimalCaseArrays = (sampleKeys: string[]) => ({
            samples: sampleKeys.map(uniqueSampleKey => ({ uniqueSampleKey })),
            patients: sampleKeys.map(uniqueSampleKey => ({
                uniquePatientKey: `${uniqueSampleKey}_PATIENT`,
            })),
        });

        it('returns undefined when queried for a non-merged track', () => {
            // given
            const accessorsInstance = new AccessorsForOqlFilter([
                makeBasicExpressionProfile(),
            ]);
            const dataArray: NumericGeneMolecularData[] = makeMinimalExpressionData(
                [
                    {
                        entrezGeneId: 1000,
                        uniqueSampleKey: 'SAMPLE1',
                        value: 1.5,
                    },
                ]
            );
            const { samples, patients } = makeMinimalCaseArrays(['SAMPLE1']);
            const queryLine: OQLLineFilterOutput<object> = {
                gene: 'GENE400',
                oql_line: 'GENE400: EXP>=2;',
                parsed_oql_line: oql_parser.parse(
                    'GENE400: EXP>=2'
                )![0] as SingleGeneQuery,
                data: [],
            };
            // when
            const data = filterSubQueryData(
                queryLine,
                '',
                dataArray,
                accessorsInstance,
                samples,
                patients
            );
            // then
            assert.isUndefined(data);
        });

        it('returns a two-element array with no alterations if queried for a two-gene merged track that matches none', () => {
            // given
            const accessorsInstance = new AccessorsForOqlFilter([
                makeBasicExpressionProfile(),
            ]);
            const dataArray: NumericGeneMolecularData[] = makeMinimalExpressionData(
                [
                    {
                        entrezGeneId: 1000,
                        uniqueSampleKey: 'SAMPLE1',
                        value: 1.5,
                    },
                    {
                        entrezGeneId: 1001,
                        uniqueSampleKey: 'SAMPLE1',
                        value: 1.5,
                    },
                ]
            );
            const { samples, patients } = makeMinimalCaseArrays(['SAMPLE1']);
            // [DATATYPES: EXP<-3; GENE1000 GENE1001],
            const queryLine: MergedTrackLineFilterOutput<object> = {
                list: [
                    {
                        oql_line: 'GENE1000: EXP<-3;',
                        gene: 'GENE1000',
                        data: [],
                        parsed_oql_line: oql_parser.parse(
                            'GENE1000: EXP<-3;'
                        )![0] as SingleGeneQuery,
                    },
                    {
                        oql_line: 'GENE1001: EXP<-3;',
                        gene: 'GENE1001',
                        data: [],
                        parsed_oql_line: oql_parser.parse(
                            'GENE1001: EXP<-3;'
                        )![0] as SingleGeneQuery,
                    },
                ],
            };
            // when
            const data = filterSubQueryData(
                queryLine,
                '',
                dataArray,
                accessorsInstance,
                samples,
                patients
            );
            // then
            assert.lengthOf(data!, 2);
            assert.deepEqual(data![0].cases, {
                samples: { SAMPLE1: [] },
                patients: { SAMPLE1_PATIENT: [] },
            });
            assert.deepEqual(data![1].cases, {
                samples: { SAMPLE1: [] },
                patients: { SAMPLE1_PATIENT: [] },
            });
        });

        it('lists alterations that match genes in a merged track', () => {
            // given
            const accessorsInstance = new AccessorsForOqlFilter([
                makeBasicExpressionProfile(),
            ]);
            const dataArray: NumericGeneMolecularData[] = makeMinimalExpressionData(
                [
                    {
                        entrezGeneId: 1000,
                        uniqueSampleKey: 'SAMPLE1',
                        value: 0,
                    },
                    {
                        entrezGeneId: 1000,
                        uniqueSampleKey: 'SAMPLE2',
                        value: 0,
                    },
                    {
                        entrezGeneId: 1001,
                        uniqueSampleKey: 'SAMPLE1',
                        value: 2.2,
                    },
                    {
                        entrezGeneId: 1001,
                        uniqueSampleKey: 'SAMPLE2',
                        value: 2.7,
                    },
                ]
            );
            const { samples, patients } = makeMinimalCaseArrays([
                'SAMPLE1',
                'SAMPLE2',
            ]);
            // [DATATYPES: EXP >= 2.5; GENE1000 GENE1001]'
            const queryLine: MergedTrackLineFilterOutput<object> = {
                list: [
                    {
                        oql_line: 'GENE1000: EXP>2.5;',
                        gene: 'GENE1000',
                        data: [],
                        parsed_oql_line: oql_parser.parse(
                            'GENE1000: EXP>2.5;'
                        )![0] as SingleGeneQuery,
                    },
                    {
                        oql_line: 'GENE1001: EXP>2.5;',
                        gene: 'GENE1001',
                        data: [],
                        parsed_oql_line: oql_parser.parse(
                            'GENE1001: EXP>2.5;'
                        )![0] as SingleGeneQuery,
                    },
                ],
            };
            // when
            const data = filterSubQueryData(
                queryLine,
                '',
                dataArray,
                accessorsInstance,
                samples,
                patients
            );
            // then
            const gene2AlterationsBySample = data![1].cases.samples;
            assert.lengthOf(gene2AlterationsBySample['SAMPLE1'], 0);
            assert.lengthOf(gene2AlterationsBySample['SAMPLE2'], 1);
            assert.equal(
                gene2AlterationsBySample['SAMPLE2'][0].alterationSubType,
                'high'
            );
        });
    });

    describe('initializeCustomDriverAnnotationSettings', () => {
        it('initializes selection for empty list of tiers', () => {
            let mutationAnnotationSettings = {
                driverTiers: observable.map<boolean>(),
            };

            initializeCustomDriverAnnotationSettings(
                { tiers: [] } as any,
                mutationAnnotationSettings,
                false,
                false,
                false
            );

            assert.deepEqual(
                _.fromPairs(mutationAnnotationSettings.driverTiers.toJSON()),
                {}
            );
        });

        it.skip('initializes selection for given tiers', () => {
            // TODO: figure out why doing driverTiers.set in this test is causing crazy problems
            let mutationAnnotationSettings = {
                driverTiers: observable.map<boolean>(),
            };
            let enableCustomTiers = false;

            initializeCustomDriverAnnotationSettings(
                { tiers: ['a', 'b', 'c'] } as any,
                mutationAnnotationSettings,
                enableCustomTiers,
                false,
                false
            );

            assert.deepEqual(
                _.fromPairs(mutationAnnotationSettings.driverTiers.toJSON()),
                { a: false, b: false, c: false },
                'initialized to false'
            );

            enableCustomTiers = true;

            initializeCustomDriverAnnotationSettings(
                { tiers: ['a', 'b', 'c'] } as any,
                mutationAnnotationSettings,
                enableCustomTiers,
                false,
                false
            );

            assert.deepEqual(
                _.fromPairs(mutationAnnotationSettings.driverTiers.toJSON()),
                { a: true, b: true, c: true },
                'initialized to true'
            );
        });

        it('sets hotspots and oncoKb if option is set and there are no custom annotations', () => {
            let mutationAnnotationSettings = {
                hotspots: false,
                oncoKb: false,
                driverTiers: observable.map<boolean>(),
            };
            initializeCustomDriverAnnotationSettings(
                { hasBinary: false, tiers: [] } as any,
                mutationAnnotationSettings,
                false,
                true,
                true
            );

            assert.isTrue(mutationAnnotationSettings.hotspots);
            assert.isTrue(mutationAnnotationSettings.oncoKb);
        });
        it.skip('does not set hotspots and oncoKb if option is set and there are custom annotations', () => {
            // TODO: figure out why doing driverTiers.set in this test is causing crazy problems
            let mutationAnnotationSettings = {
                hotspots: false,
                oncoKb: false,
                driverTiers: observable.map<boolean>(),
            };
            initializeCustomDriverAnnotationSettings(
                { hasBinary: true, tiers: [] } as any,
                mutationAnnotationSettings,
                false,
                true,
                true
            );
            assert.isFalse(mutationAnnotationSettings.hotspots);
            assert.isFalse(mutationAnnotationSettings.oncoKb);
            initializeCustomDriverAnnotationSettings(
                { hasBinary: false, tiers: ['a'] } as any,
                mutationAnnotationSettings,
                false,
                true,
                true
            );
            assert.isFalse(mutationAnnotationSettings.hotspots);
            assert.isFalse(mutationAnnotationSettings.oncoKb);
        });
        it('does not set hotspots and oncoKb if option is not set', () => {
            let mutationAnnotationSettings = {
                hotspots: false,
                oncoKb: false,
                driverTiers: observable.map<boolean>(),
            };
            initializeCustomDriverAnnotationSettings(
                { hasBinary: true, tiers: [] } as any,
                mutationAnnotationSettings,
                false,
                false,
                false
            );
            assert.isFalse(mutationAnnotationSettings.hotspots);
            assert.isFalse(mutationAnnotationSettings.oncoKb);
        });
    });

    describe('annotateMutationPutativeDriver', () => {
        it('annotates with hotspot, oncokb', () => {
            assert.deepEqual(
                annotateMutationPutativeDriver(
                    {
                        mutationType: 'missense',
                    } as Mutation,
                    {
                        hotspots: true,
                        oncoKb: 'oncogenic',
                    } as any
                ),
                {
                    putativeDriver: true,
                    isHotspot: true,
                    oncoKbOncogenic: 'oncogenic',
                    simplifiedMutationType: getSimplifiedMutationType(
                        'missense'
                    ),
                    mutationType: 'missense',
                } as any
            );
        });
        it('annotates with custom driver annotations', () => {
            assert.deepEqual(
                annotateMutationPutativeDriver(
                    {
                        mutationType: 'asdfasdf',
                    } as Mutation,
                    {
                        hotspots: false,
                        oncoKb: '',
                        customDriverBinary: false,
                        customDriverTier: 'hello',
                    } as any
                ),
                {
                    putativeDriver: true,
                    isHotspot: false,
                    oncoKbOncogenic: '',
                    simplifiedMutationType: getSimplifiedMutationType(
                        'asdfasdf'
                    ),
                    mutationType: 'asdfasdf',
                } as any,
                'tier'
            );

            assert.deepEqual(
                annotateMutationPutativeDriver(
                    {
                        mutationType: 'missense',
                    } as Mutation,
                    {
                        hotspots: false,
                        oncoKb: '',
                        customDriverBinary: true,
                    } as any
                ),
                {
                    putativeDriver: true,
                    isHotspot: false,
                    oncoKbOncogenic: '',
                    simplifiedMutationType: getSimplifiedMutationType(
                        'missense'
                    ),
                    mutationType: 'missense',
                } as any,
                'binary'
            );
        });
        it('annotates with all', () => {
            assert.deepEqual(
                annotateMutationPutativeDriver(
                    {
                        mutationType: 'asdfasdf',
                    } as Mutation,
                    {
                        hotspots: true,
                        oncoKb: 'oncogenic',
                        customDriverBinary: true,
                        customDriverTier: 'hello',
                    } as any
                ),
                {
                    putativeDriver: true,
                    isHotspot: true,
                    oncoKbOncogenic: 'oncogenic',
                    simplifiedMutationType: getSimplifiedMutationType(
                        'asdfasdf'
                    ),
                    mutationType: 'asdfasdf',
                } as any
            );
        });
        it('annotates with none', () => {
            assert.deepEqual(
                annotateMutationPutativeDriver(
                    {
                        mutationType: 'cvzxcv',
                    } as Mutation,
                    {
                        hotspots: false,
                        oncoKb: '',
                        customDriverBinary: false,
                    } as any
                ),
                {
                    putativeDriver: false,
                    isHotspot: false,
                    oncoKbOncogenic: '',
                    simplifiedMutationType: getSimplifiedMutationType('cvzxcv'),
                    mutationType: 'cvzxcv',
                } as any
            );
        });
    });

    describe('annotateDiscreteCNAPutativeDriver', () => {
        it('annotates single element as driver when OncoKB string passed', () => {
            assert.deepEqual(
                annotateMolecularDatum(
                    {
                        value: 0,
                        molecularProfileId: 'profile',
                        entrezGeneId: 9,
                    } as CustomDriverNumericGeneMolecularData,
                    { oncoKb: 'any_string' } as any
                ),
                {
                    value: 0,
                    molecularProfileId: 'profile',
                    putativeDriver: true,
                    oncoKbOncogenic: 'any_string',
                    entrezGeneId: 9,
                } as any
            );
        });
        it('annotates single element as VUS when empty string passed', () => {
            assert.deepEqual(
                annotateMolecularDatum(
                    {
                        value: 0,
                        molecularProfileId: 'profile',
                        entrezGeneId: 9,
                    } as CustomDriverNumericGeneMolecularData,
                    { oncoKb: '' } as any
                ),
                {
                    value: 0,
                    molecularProfileId: 'profile',
                    putativeDriver: false,
                    oncoKbOncogenic: '',
                    entrezGeneId: 9,
                } as any
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

    describe('getDefaultSelectedStudiesForExpressionTab', () => {
        it('recognizes pub tcga study', () => {
            const studyId = 'blca_tcga_pub';
            assert.isTrue(isTCGAPubStudy(studyId));
            assert.isFalse(isTCGAProvStudy(studyId));
            assert.isFalse(isPanCanStudy(studyId));
        });

        it('recognizes provisional tcga study', () => {
            const studyId = 'blca_tcga';
            assert.isFalse(isTCGAPubStudy(studyId));
            assert.isTrue(isTCGAProvStudy(studyId));
            assert.isFalse(isPanCanStudy(studyId));
        });

        it('recognizes pan can tcga study', () => {
            const studyId = 'blca_tcga_pan_can_atlas_2018';
            assert.isFalse(isTCGAPubStudy(studyId));
            assert.isFalse(isTCGAProvStudy(studyId));
            assert.isTrue(isPanCanStudy(studyId));
        });
    });

    describe('getRNASeqProfiles', () => {
        it('properly recognizes expression profile based on patterns in id', () => {
            assert.isFalse(isRNASeqProfile(''), 'blank is false');
            assert.isTrue(
                isRNASeqProfile('acc_tcga_rna_seq_v2_mrna'),
                'matches seq v2 id'
            );
            assert.isTrue(
                isRNASeqProfile(
                    'chol_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median'
                ),
                'matches pan can v2'
            );
            assert.isTrue(isRNASeqProfile('laml_tcga_rna_seq_mrna'));
            assert.isFalse(
                isRNASeqProfile(
                    'chol_tcga_pan_can_atlas_2018_rna_seq_v2_mrna_median_Zscores'
                ),
                "doesn't match zscores profils"
            );
        });
    });

    describe('getQueriedStudies', () => {
        const virtualStudy: VirtualStudy = {
            id: 'shared_study',
            data: {
                name: 'Shared Study',
                description: 'Shared Study',
                studies: [
                    {
                        id: 'test_study',
                        samples: ['sample-01', 'sample-02', 'sample-03'],
                    },
                ],
            } as VirtualStudyData,
        } as VirtualStudy;

        let physicalStudies: { [id: string]: CancerStudy } = {
            physical_study_1: {
                studyId: 'physical_study_1',
            } as CancerStudy,
            physical_study_2: {
                studyId: 'physical_study_2',
            } as CancerStudy,
        };

        let virtualStudies: VirtualStudy[] = [
            $.extend({}, virtualStudy, {
                id: 'virtual_study_1',
            }) as VirtualStudy,
            $.extend({}, virtualStudy, {
                id: 'virtual_study_2',
            }) as VirtualStudy,
        ];

        beforeAll(() => {
            sinon
                .stub(sessionServiceClient, 'getUserVirtualStudies')
                .callsFake(function fakeFn(id: string) {
                    return new Promise((resolve, reject) => {
                        resolve(virtualStudies);
                    });
                });
            //
            sinon
                .stub(client, 'fetchStudiesUsingPOST')
                .callsFake(function fakeFn(parameters: {
                    studyIds: Array<string>;
                    projection?: 'ID' | 'SUMMARY' | 'DETAILED' | 'META';
                }) {
                    return new Promise((resolve, reject) => {
                        resolve(
                            _.reduce(
                                parameters.studyIds,
                                (acc: CancerStudy[], next) => {
                                    let obj = physicalStudies[next];
                                    if (!_.isUndefined(obj)) {
                                        acc.push(obj);
                                    }
                                    return acc;
                                },
                                []
                            )
                        );
                    });
                });
        });
        afterAll(() => {
            //(sessionServiceClient.getVirtualStudy as sinon.SinonStub).restore();
            //(client.fetchStudiesUsingPOST as sinon.SinonStub).restore();
        });

        it('when queried ids is empty', async () => {
            let test = await fetchQueriedStudies({}, [], []);
            assert.deepEqual(test, []);
        });

        it('when only physical studies are present', async () => {
            let test = await fetchQueriedStudies(
                physicalStudies,
                ['physical_study_1', 'physical_study_2'],
                virtualStudies
            );
            assert.deepEqual(
                _.map(test, obj => obj.studyId),
                ['physical_study_1', 'physical_study_2']
            );
        });

        it('when only virtual studies are present', async () => {
            let test = await fetchQueriedStudies(
                {},
                ['virtual_study_1', 'virtual_study_2'],
                virtualStudies
            );
            assert.deepEqual(
                _.map(test, obj => obj.studyId),
                ['virtual_study_1', 'virtual_study_2']
            );
        });

        it('when physical and virtual studies are present', async () => {
            let test = await fetchQueriedStudies(
                physicalStudies,
                ['physical_study_1', 'virtual_study_2'],
                virtualStudies
            );
            assert.deepEqual(
                _.map(test, obj => obj.studyId),
                ['physical_study_1', 'virtual_study_2']
            );
        });

        //this case is not possible because id in these scenarios are first identified in QueryBuilder.java and
        //returned to query selector page
        it('when virtual study query having private study or unknow virtual study id', async () => {
            let test = await fetchQueriedStudies(
                {},
                ['shared_study1'],
                virtualStudies
            );
            // assume no studies returned
            assert.equal(test.length, 0);
        });
    });

    describe('buildResultsViewPageTitle', () => {
        it('handles various numbers of studies and genes', () => {
            let genes = ['KRAS', 'NRAS', 'BRAF'];
            let studies = [{ name: 'Study Number One' } as CancerStudy];
            let ret = buildResultsViewPageTitle(genes, studies);
            let expectedResult =
                'cBioPortal for Cancer Genomics: KRAS, NRAS and 1 other gene in Study Number One';
            assert.equal(ret, expectedResult, 'three genes, one study');

            genes = ['KRAS', 'NRAS', 'BRAF', 'KFED'];
            studies = [{ name: 'Study Number One' } as CancerStudy];
            ret = buildResultsViewPageTitle(genes, studies);
            expectedResult =
                'cBioPortal for Cancer Genomics: KRAS, NRAS and 2 other genes in Study Number One';
            assert.equal(ret, expectedResult, 'two genes, one study');

            genes = ['KRAS', 'NRAS'];
            studies = [{ name: 'Study Number One' } as CancerStudy];
            ret = buildResultsViewPageTitle(genes, studies);
            expectedResult =
                'cBioPortal for Cancer Genomics: KRAS, NRAS in Study Number One';
            assert.equal(ret, expectedResult, 'two genes, one study');

            genes = ['KRAS'];
            studies = [{ name: 'Study Number One' } as CancerStudy];
            ret = buildResultsViewPageTitle(genes, studies);
            expectedResult =
                'cBioPortal for Cancer Genomics: KRAS in Study Number One';
            assert.equal(ret, expectedResult, 'one gene, one study');

            genes = ['KRAS'];
            studies = [
                { name: 'Study Number One' } as CancerStudy,
                { name: 'Study Number Two' } as CancerStudy,
            ];
            ret = buildResultsViewPageTitle(genes, studies);
            expectedResult =
                'cBioPortal for Cancer Genomics: KRAS in Study Number One and 1 other study';
            assert.equal(ret, expectedResult, 'one gene two studies');

            genes = ['KRAS'];
            studies = [
                { name: 'Study Number One' } as CancerStudy,
                { name: 'Study Number Two' } as CancerStudy,
                { name: 'Study Number Two' } as CancerStudy,
            ];
            ret = buildResultsViewPageTitle(genes, studies);
            expectedResult =
                'cBioPortal for Cancer Genomics: KRAS in Study Number One and 2 other studies';
            assert.equal(ret, expectedResult, 'one gene, three studies');
        });
    });
});

const defaultOqlAlterations = (oql_parser.parse(
    'DUMMYGENE: MUT FUSION'
)![0] as SingleGeneQuery).alterations;

describe('getSampleAlteredMap', () => {
    const filteredAlterationData = ([
        {
            cases: {
                samples: {},
                patients: {},
            },
            oql: {
                label: 'RAS',
                list: [
                    {
                        gene: 'KRAS',
                        parsed_oql_line: oql_parser.parse(
                            'KRAS: MUT FUSION;'
                        )![0] as SingleGeneQuery,
                        oql_line: 'KRAS: MUT FUSION;',
                        data: [
                            {
                                uniqueSampleKey: 'QjA4NTpjaG9sX251c18yMDEy',
                            },
                            {
                                uniqueSampleKey: 'UjEwNDpjaG9sX251c18yMDEy',
                            },
                            {
                                uniqueSampleKey: 'VzAxMjpjaG9sX251c18yMDEy',
                            },
                        ],
                    },
                    {
                        gene: 'NRAS',
                        parsed_oql_line: oql_parser.parse(
                            'NRAS: MUT FUSION;'
                        )![0] as SingleGeneQuery,
                        oql_line: 'NRAS: MUT FUSION;',
                        data: [],
                    },
                ],
            },
            mergedTrackOqlList: [
                {
                    cases: {
                        samples: {},
                        patients: {},
                    },
                    oql: {
                        gene: 'KRAS',
                        parsed_oql_line: oql_parser.parse(
                            'KRAS: MUT FUSION;'
                        )![0] as SingleGeneQuery,
                        oql_line: 'KRAS: MUT FUSION;',
                        data: [
                            {
                                uniqueSampleKey: 'QjA4NTpjaG9sX251c18yMDEy',
                            },
                            {
                                uniqueSampleKey: 'UjEwNDpjaG9sX251c18yMDEy',
                            },
                            {
                                uniqueSampleKey: 'VzAxMjpjaG9sX251c18yMDEy',
                            },
                        ],
                    },
                },
                {
                    cases: {
                        samples: {},
                        patients: {},
                    },
                    oql: {
                        gene: 'NRAS',
                        parsed_oql_line: oql_parser.parse(
                            'NRAS: MUT FUSION;'
                        )![0] as SingleGeneQuery,
                        oql_line: 'NRAS: MUT FUSION;',
                        data: [],
                    },
                },
            ],
        },
        {
            cases: {
                samples: {},
                patients: {},
            },
            oql: {
                list: [
                    {
                        gene: 'SMAD4',
                        parsed_oql_line: oql_parser.parse(
                            'SMAD4: MUT FUSION;'
                        )![0] as SingleGeneQuery,
                        oql_line: 'SMAD4: MUT FUSION;',
                        data: [
                            {
                                uniqueSampleKey: 'QjA5OTpjaG9sX251c18yMDEy',
                            },
                            {
                                uniqueSampleKey: 'UjEwNDpjaG9sX251c18yMDEy',
                            },
                            {
                                uniqueSampleKey: 'VTA0NDpjaG9sX251c18yMDEy',
                            },
                            {
                                uniqueSampleKey: 'VzAxMjpjaG9sX251c18yMDEy',
                            },
                        ],
                    },
                    {
                        gene: 'RAN',
                        parsed_oql_line: oql_parser.parse(
                            'RAN: MUT FUSION;'
                        )![0] as SingleGeneQuery,
                        oql_line: 'RAN: MUT FUSION;',
                        data: [],
                    },
                ],
            },
            mergedTrackOqlList: [
                {
                    cases: {
                        samples: {},
                        patients: {},
                    },
                    oql: {
                        gene: 'SMAD4',
                        parsed_oql_line: oql_parser.parse(
                            'SMAD4: MUT FUSION;'
                        )![0] as SingleGeneQuery,
                        oql_line: 'SMAD4: MUT FUSION;',
                        data: [
                            {
                                uniqueSampleKey: 'QjA5OTpjaG9sX251c18yMDEy',
                            },
                            {
                                uniqueSampleKey: 'UjEwNDpjaG9sX251c18yMDEy',
                            },
                            {
                                uniqueSampleKey: 'VTA0NDpjaG9sX251c18yMDEy',
                            },
                            {
                                uniqueSampleKey: 'VzAxMjpjaG9sX251c18yMDEy',
                            },
                        ],
                    },
                },
                {
                    cases: {
                        samples: {},
                        patients: {},
                    },
                    oql: {
                        gene: 'RAN',
                        parsed_oql_line: oql_parser.parse(
                            'RAN: MUT FUSION;'
                        )![0] as SingleGeneQuery,
                        oql_line: 'RAN: MUT FUSION;',
                        data: [],
                    },
                },
            ],
        },
        {
            cases: {
                samples: {},
                patients: {},
            },
            oql: {
                gene: 'SMAD4',
                parsed_oql_line: oql_parser.parse(
                    'SMAD4: MUT;'
                )![0] as SingleGeneQuery,
                oql_line: 'SMAD4: MUT;',
                data: [
                    {
                        uniqueSampleKey: 'QjA5OTpjaG9sX251c18yMDEy',
                    },
                    {
                        uniqueSampleKey: 'UjEwNDpjaG9sX251c18yMDEy',
                    },
                    {
                        uniqueSampleKey: 'VTA0NDpjaG9sX251c18yMDEy',
                    },
                    {
                        uniqueSampleKey: 'VzAxMjpjaG9sX251c18yMDEy',
                    },
                ],
            },
        },
        {
            cases: {
                samples: {},
                patients: {},
            },
            oql: {
                gene: 'KRAS',
                parsed_oql_line: oql_parser.parse(
                    'KRAS: MUT FUSION;'
                )![0] as SingleGeneQuery,
                oql_line: 'KRAS: MUT FUSION;',
                data: [
                    {
                        uniqueSampleKey: 'QjA4NTpjaG9sX251c18yMDEy',
                    },
                    {
                        uniqueSampleKey: 'UjEwNDpjaG9sX251c18yMDEy',
                    },
                    {
                        uniqueSampleKey: 'VzAxMjpjaG9sX251c18yMDEy',
                    },
                ],
            },
        },
    ] as unknown) as IQueriedMergedTrackCaseData[];

    var samples = ([
        {
            uniqueSampleKey: 'QjA4NTpjaG9sX251c18yMDEy',
            uniquePatientKey: 'QjA4NTpjaG9sX251c18yMDEy',
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            copyNumberSegmentPresent: false,
            sampleId: 'B085',
            patientId: 'B085',
            studyId: 'chol_nus_2012',
        },
        {
            uniqueSampleKey: 'QjA5OTpjaG9sX251c18yMDEy',
            uniquePatientKey: 'QjA5OTpjaG9sX251c18yMDEy',
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            copyNumberSegmentPresent: false,
            sampleId: 'B099',
            patientId: 'B099',
            studyId: 'chol_nus_2012',
        },
        {
            uniqueSampleKey: 'UjEwNDpjaG9sX251c18yMDEy',
            uniquePatientKey: 'UjEwNDpjaG9sX251c18yMDEy',
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            copyNumberSegmentPresent: false,
            sampleId: 'R104',
            patientId: 'R104',
            studyId: 'chol_nus_2012',
        },
        {
            uniqueSampleKey: 'VDAyNjpjaG9sX251c18yMDEy',
            uniquePatientKey: 'VDAyNjpjaG9sX251c18yMDEy',
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            copyNumberSegmentPresent: false,
            sampleId: 'T026',
            patientId: 'T026',
            studyId: 'chol_nus_2012',
        },
        {
            uniqueSampleKey: 'VTA0NDpjaG9sX251c18yMDEy',
            uniquePatientKey: 'VTA0NDpjaG9sX251c18yMDEy',
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            copyNumberSegmentPresent: false,
            sampleId: 'U044',
            patientId: 'U044',
            studyId: 'chol_nus_2012',
        },
        {
            uniqueSampleKey: 'VzAxMjpjaG9sX251c18yMDEy',
            uniquePatientKey: 'VzAxMjpjaG9sX251c18yMDEy',
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            copyNumberSegmentPresent: false,
            sampleId: 'W012',
            patientId: 'W012',
            studyId: 'chol_nus_2012',
        },
        {
            uniqueSampleKey: 'VzAzOTpjaG9sX251c18yMDEy',
            uniquePatientKey: 'VzAzOTpjaG9sX251c18yMDEy',
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            copyNumberSegmentPresent: false,
            sampleId: 'W039',
            patientId: 'W039',
            studyId: 'chol_nus_2012',
        },
        {
            uniqueSampleKey: 'VzA0MDpjaG9sX251c18yMDEy',
            uniquePatientKey: 'VzA0MDpjaG9sX251c18yMDEy',
            sampleType: 'Primary Solid Tumor',
            sequenced: true,
            copyNumberSegmentPresent: false,
            sampleId: 'W040',
            patientId: 'W040',
            studyId: 'chol_nus_2012',
        },
    ] as unknown) as Sample[];

    const oqlQuery = '["RAS" KRAS NRAS]\n[SMAD4 RAN]\nSMAD4: MUT\nKRAS';

    const coverageInformation = {
        samples: {
            QjA4NTpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'QjA4NTpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'QjA4NTpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'B085',
                        patientId: 'B085',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            QjA5OTpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'QjA5OTpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'QjA5OTpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'B099',
                        patientId: 'B099',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            UjEwNDpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'UjEwNDpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'UjEwNDpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'R104',
                        patientId: 'R104',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VDAyNjpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VDAyNjpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VDAyNjpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'T026',
                        patientId: 'T026',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VTA0NDpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VTA0NDpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VTA0NDpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'U044',
                        patientId: 'U044',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VzAxMjpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VzAxMjpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VzAxMjpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'W012',
                        patientId: 'W012',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VzAzOTpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VzAzOTpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VzAzOTpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'W039',
                        patientId: 'W039',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VzA0MDpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VzA0MDpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VzA0MDpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'W040',
                        patientId: 'W040',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
        },
        patients: {
            QjA4NTpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'QjA4NTpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'QjA4NTpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'B085',
                        patientId: 'B085',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            QjA5OTpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'QjA5OTpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'QjA5OTpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'B099',
                        patientId: 'B099',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            UjEwNDpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'UjEwNDpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'UjEwNDpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'R104',
                        patientId: 'R104',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VDAyNjpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VDAyNjpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VDAyNjpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'T026',
                        patientId: 'T026',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VTA0NDpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VTA0NDpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VTA0NDpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'U044',
                        patientId: 'U044',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VzAxMjpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VzAxMjpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VzAxMjpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'W012',
                        patientId: 'W012',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VzAzOTpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VzAzOTpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VzAzOTpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'W039',
                        patientId: 'W039',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VzA0MDpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VzA0MDpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VzA0MDpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'W040',
                        patientId: 'W040',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
        },
    };

    const coverageInformationWithUnprofiledSamples = {
        samples: {
            QjA4NTpjaG9sX251c18yMDEy: {
                byGene: {
                    NRAS: [
                        {
                            uniqueSampleKey: 'QjA4NTpjaG9sX251c18yMDEy',
                            uniquePatientKey: 'QjA4NTpjaG9sX251c18yMDEy',
                            molecularProfileId: 'chol_nus_2012_mutations',
                            sampleId: 'B085',
                            patientId: 'B085',
                            genePanelId: 'test',
                            studyId: 'chol_nus_2012',
                            profiled: true,
                        },
                    ],
                },
                allGenes: [],
                notProfiledByGene: {
                    KRAS: [
                        {
                            uniqueSampleKey: 'QjA4NTpjaG9sX251c18yMDEy',
                            uniquePatientKey: 'QjA4NTpjaG9sX251c18yMDEy',
                            molecularProfileId: 'chol_nus_2012_mutations',
                            sampleId: 'B085',
                            patientId: 'B085',
                            genePanelId: 'test',
                            studyId: 'chol_nus_2012',
                            profiled: true,
                        },
                    ],
                    SMAD4: [
                        {
                            uniqueSampleKey: 'QjA4NTpjaG9sX251c18yMDEy',
                            uniquePatientKey: 'QjA4NTpjaG9sX251c18yMDEy',
                            molecularProfileId: 'chol_nus_2012_mutations',
                            sampleId: 'B085',
                            patientId: 'B085',
                            genePanelId: 'test',
                            studyId: 'chol_nus_2012',
                            profiled: true,
                        },
                    ],
                    RAN: [
                        {
                            uniqueSampleKey: 'QjA4NTpjaG9sX251c18yMDEy',
                            uniquePatientKey: 'QjA4NTpjaG9sX251c18yMDEy',
                            molecularProfileId: 'chol_nus_2012_mutations',
                            sampleId: 'B085',
                            patientId: 'B085',
                            genePanelId: 'test',
                            studyId: 'chol_nus_2012',
                            profiled: true,
                        },
                    ],
                },
                notProfiledAllGenes: [],
            },
            QjA5OTpjaG9sX251c18yMDEy: {
                byGene: {
                    NRAS: [
                        {
                            uniqueSampleKey: 'QjA5OTpjaG9sX251c18yMDEy',
                            uniquePatientKey: 'QjA5OTpjaG9sX251c18yMDEy',
                            molecularProfileId: 'chol_nus_2012_mutations',
                            sampleId: 'B099',
                            patientId: 'B099',
                            genePanelId: 'test',
                            studyId: 'chol_nus_2012',
                            profiled: true,
                        },
                    ],
                    SMAD4: [
                        {
                            uniqueSampleKey: 'QjA5OTpjaG9sX251c18yMDEy',
                            uniquePatientKey: 'QjA5OTpjaG9sX251c18yMDEy',
                            molecularProfileId: 'chol_nus_2012_mutations',
                            sampleId: 'B099',
                            patientId: 'B099',
                            genePanelId: 'test',
                            studyId: 'chol_nus_2012',
                            profiled: true,
                        },
                    ],
                    RAN: [
                        {
                            uniqueSampleKey: 'QjA5OTpjaG9sX251c18yMDEy',
                            uniquePatientKey: 'QjA5OTpjaG9sX251c18yMDEy',
                            molecularProfileId: 'chol_nus_2012_mutations',
                            sampleId: 'B099',
                            patientId: 'B099',
                            genePanelId: 'test',
                            studyId: 'chol_nus_2012',
                            profiled: true,
                        },
                    ],
                },
                allGenes: [],
                notProfiledByGene: {
                    KRAS: [
                        {
                            uniqueSampleKey: 'QjA5OTpjaG9sX251c18yMDEy',
                            uniquePatientKey: 'QjA5OTpjaG9sX251c18yMDEy',
                            molecularProfileId: 'chol_nus_2012_mutations',
                            sampleId: 'B099',
                            patientId: 'B099',
                            genePanelId: 'test',
                            studyId: 'chol_nus_2012',
                            profiled: true,
                        },
                    ],
                },
                notProfiledAllGenes: [],
            },
            UjEwNDpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'UjEwNDpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'UjEwNDpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'R104',
                        patientId: 'R104',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VDAyNjpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VDAyNjpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VDAyNjpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'T026',
                        patientId: 'T026',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VTA0NDpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VTA0NDpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VTA0NDpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'U044',
                        patientId: 'U044',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VzAxMjpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VzAxMjpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VzAxMjpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'W012',
                        patientId: 'W012',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VzAzOTpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VzAzOTpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VzAzOTpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'W039',
                        patientId: 'W039',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VzA0MDpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VzA0MDpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VzA0MDpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'W040',
                        patientId: 'W040',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
        },
        patients: {
            QjA4NTpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'QjA4NTpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'QjA4NTpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'B085',
                        patientId: 'B085',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            QjA5OTpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'QjA5OTpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'QjA5OTpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'B099',
                        patientId: 'B099',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            UjEwNDpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'UjEwNDpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'UjEwNDpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'R104',
                        patientId: 'R104',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VDAyNjpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VDAyNjpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VDAyNjpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'T026',
                        patientId: 'T026',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VTA0NDpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VTA0NDpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VTA0NDpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'U044',
                        patientId: 'U044',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VzAxMjpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VzAxMjpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VzAxMjpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'W012',
                        patientId: 'W012',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VzAzOTpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VzAzOTpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VzAzOTpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'W039',
                        patientId: 'W039',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
            VzA0MDpjaG9sX251c18yMDEy: {
                byGene: {},
                allGenes: [
                    {
                        uniqueSampleKey: 'VzA0MDpjaG9sX251c18yMDEy',
                        uniquePatientKey: 'VzA0MDpjaG9sX251c18yMDEy',
                        molecularProfileId: 'chol_nus_2012_mutations',
                        sampleId: 'W040',
                        patientId: 'W040',
                        studyId: 'chol_nus_2012',
                        profiled: true,
                    },
                ],
                notProfiledByGene: {},
                notProfiledAllGenes: [],
            },
        },
    };

    const molecularProfileIds = ['chol_nus_2012_mutations'];
    const unprofiledMolecularProfileIds = [
        'chol_nus_2012_mutations',
        'chol_nus_2012_cna',
    ];
    const studyToMolecularProfiles = {
        chol_nus_2012: [
            {
                molecularProfileId: 'chol_nus_2012_mutations',
            } as MolecularProfile,
            { molecularProfileId: 'chol_nus_2012_cna' } as MolecularProfile,
        ],
    };

    it('should handle all profiled samples correctly', () => {
        const ret = getSampleAlteredMap(
            filteredAlterationData,
            samples,
            oqlQuery,
            coverageInformation,
            molecularProfileIds,
            studyToMolecularProfiles,
            defaultOqlAlterations
        );
        const expectedResult = {
            RAS: [
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.UNALTERED,
            ],
            'SMAD4 / RAN': [
                AlteredStatus.UNALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.UNALTERED,
            ],
            'SMAD4: MUT': [
                AlteredStatus.UNALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.UNALTERED,
            ],
            KRAS: [
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.UNALTERED,
            ],
        };
        assert.deepEqual(
            ret['KRAS'],
            expectedResult['KRAS'],
            'single gene track'
        );
        assert.deepEqual(
            ret['SMAD4: MUT'],
            expectedResult['SMAD4: MUT'],
            'single gene track(with alteration)'
        );
        assert.deepEqual(
            ret['SMAD4 / RAN'],
            expectedResult['SMAD4 / RAN'],
            'merged gene track'
        );
        assert.deepEqual(
            ret['RAS'],
            expectedResult['RAS'],
            'merged gene track(with group name)'
        );
    });

    it('should set undefined for the not profiled samples', () => {
        const ret = getSampleAlteredMap(
            filteredAlterationData,
            samples,
            oqlQuery,
            coverageInformationWithUnprofiledSamples,
            molecularProfileIds,
            studyToMolecularProfiles,
            defaultOqlAlterations
        );
        const expectedResult = {
            RAS: [
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.UNALTERED,
            ],
            'SMAD4 / RAN': [
                AlteredStatus.UNPROFILED,
                AlteredStatus.ALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.UNALTERED,
            ],
            'SMAD4: MUT': [
                AlteredStatus.UNALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.UNALTERED,
            ],
            KRAS: [
                AlteredStatus.UNPROFILED,
                AlteredStatus.UNPROFILED,
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.ALTERED,
                AlteredStatus.UNALTERED,
                AlteredStatus.UNALTERED,
            ],
        };
        assert.deepEqual(
            ret['KRAS'],
            expectedResult['KRAS'],
            'single gene track with unprofiled samples'
        );
        assert.deepEqual(
            ret['RAS'],
            expectedResult['RAS'],
            'merged gene track with unprofiled samples in one gene'
        );
        assert.deepEqual(
            ret['SMAD4 / RAN'],
            expectedResult['SMAD4 / RAN'],
            'merged gene track with unprofiled samples in all genes'
        );
    });

    it('should search in all molecularProfile ids', () => {
        const ret = getSampleAlteredMap(
            filteredAlterationData,
            samples,
            oqlQuery,
            coverageInformationWithUnprofiledSamples,
            unprofiledMolecularProfileIds,
            studyToMolecularProfiles,
            defaultOqlAlterations
        );
        const expectedResult = {
            RAS: [
                AlteredStatus.UNPROFILED,
                AlteredStatus.UNPROFILED,
                AlteredStatus.UNPROFILED,
                AlteredStatus.UNPROFILED,
                AlteredStatus.UNPROFILED,
                AlteredStatus.UNPROFILED,
                AlteredStatus.UNPROFILED,
                AlteredStatus.UNPROFILED,
            ],
        };
        assert.deepEqual(
            ret['RAS'],
            expectedResult['RAS'],
            'should return an list contains only undefined value'
        );
    });
});

describe('getSingleGeneResultKey', () => {
    it('handles gene with alteration', () => {
        let arg0 = 2;
        let arg1 = '["RAS" KRAS NRAS]\n[SMAD4 RAN]\nSMAD4: MUT\nKRAS';
        let arg2 = {
            gene: 'SMAD4',
            parsed_oql_line: oql_parser.parse(
                'SMAD4: MUT;'
            )![0] as SingleGeneQuery,
            oql_line: 'SMAD4: MUT;',
            data: [],
        } as OQLLineFilterOutput<AnnotatedExtendedAlteration>;
        const ret = getSingleGeneResultKey(arg0, arg1, arg2, false);
        const expectedResult = 'SMAD4: MUT';

        assert.equal(
            ret,
            expectedResult,
            'get single gene result key(with alteration)'
        );
    });

    it('handles gene without mutation', () => {
        let arg0 = 3;
        let arg1 = '["RAS" KRAS NRAS]\n[SMAD4 RAN]\nSMAD4: MUT\nKRAS';
        let arg2 = {
            gene: 'KRAS',
            parsed_oql_line: oql_parser.parse(
                'KRAS: MUT FUSION;'
            )![0] as SingleGeneQuery,
            oql_line: 'KRAS: MUT FUSION;',
            data: [],
        } as OQLLineFilterOutput<AnnotatedExtendedAlteration>;
        const ret = getSingleGeneResultKey(
            arg0,
            arg1,
            arg2,
            defaultOqlAlterations
        );
        const expectedResult = 'KRAS';

        assert.equal(
            ret,
            expectedResult,
            'get single gene result key(without alteration)'
        );
    });
});

describe('getMultipleGeneResultKey', () => {
    it('handles gene group with name', () => {
        let arg0 = {
            label: 'RAS',
            list: [
                {
                    gene: 'KRAS',
                    parsed_oql_line: oql_parser.parse('KRAS: MUT FUSION')![0],
                    oql_line: 'KRAS: MUT FUSION;',
                    data: [],
                },
                {
                    gene: 'NRAS',
                    parsed_oql_line: oql_parser.parse('NRAS: MUT FUSION')![0],
                    oql_line: 'NRAS: MUT FUSION;',
                    data: [],
                },
            ],
        } as MergedTrackLineFilterOutput<AnnotatedExtendedAlteration>;
        const ret = getMultipleGeneResultKey(arg0);
        const expectedResult = 'RAS';

        assert.equal(
            ret,
            expectedResult,
            'get gene group result key(with name)'
        );
    });

    it('handles gene group without name', () => {
        let arg0 = {
            list: [
                {
                    gene: 'SMAD4',
                    parsed_oql_line: oql_parser.parse('SMAD: MUT FUSION')![0],
                    oql_line: 'SMAD4: MUT FUSION;',
                    data: [],
                },
                {
                    gene: 'RAN',
                    parsed_oql_line: oql_parser.parse('RAN: MUT FUSION')![0],
                    oql_line: 'RAN: MUT FUSION;',
                    data: [],
                },
            ],
        } as MergedTrackLineFilterOutput<AnnotatedExtendedAlteration>;
        const ret = getMultipleGeneResultKey(arg0);
        const expectedResult = 'SMAD4 / RAN';

        assert.equal(
            ret,
            expectedResult,
            'get gene group result key(without name)'
        );
    });
});

describe('parseGenericAssayGroups', () => {
    it('return empty result for empty generic assay group', () => {
        const expectedResult = {};
        const emptyGenericAssayGroups: string = '';
        const result = parseGenericAssayGroups(emptyGenericAssayGroups);

        assert.deepEqual(
            result,
            expectedResult,
            'empty result for empty generic assay group'
        );
    });

    it('return result for single correct formatted generic assay group', () => {
        const PROFILE_ID = 'PROFILE_ID';
        const ENTITY_ID_1 = 'ENTITY_ID_1';
        const ENTITY_ID_2 = 'ENTITY_ID_2';
        const VALID_SINGLE_GENERIC_ASSAY_GROUP = `${PROFILE_ID},${ENTITY_ID_1},${ENTITY_ID_2}`;
        const expectedResult = {
            PROFILE_ID: [ENTITY_ID_1, ENTITY_ID_2],
        };
        const result = parseGenericAssayGroups(
            VALID_SINGLE_GENERIC_ASSAY_GROUP
        );

        assert.deepEqual(
            result,
            expectedResult,
            'return result for single correct formatted generic assay group'
        );
    });

    it('return result for multiple correct formatted generic assay groups', () => {
        const PROFILE_ID_1 = 'PROFILE_ID_1';
        const ENTITY_ID_1 = 'ENTITY_ID_1';
        const ENTITY_ID_2 = 'ENTITY_ID_2';
        const PROFILE_ID_2 = 'PROFILE_ID_2';
        const ENTITY_ID_3 = 'ENTITY_ID_3';
        const ENTITY_ID_4 = 'ENTITY_ID_4';
        const VALID_MULTIPLE_GENERIC_ASSAY_GROUP = `${PROFILE_ID_1},${ENTITY_ID_1},${ENTITY_ID_2};${PROFILE_ID_2},${ENTITY_ID_3},${ENTITY_ID_4}`;
        const expectedResult = {
            PROFILE_ID_1: [ENTITY_ID_1, ENTITY_ID_2],
            PROFILE_ID_2: [ENTITY_ID_3, ENTITY_ID_4],
        };
        const result = parseGenericAssayGroups(
            VALID_MULTIPLE_GENERIC_ASSAY_GROUP
        );

        assert.deepEqual(
            result,
            expectedResult,
            'return result for multiple correct formatted generic assay groups'
        );
    });
});

describe('getGeneAndProfileChunksForRequest', () => {
    let genes: Gene[];
    let profileIds: string[];

    beforeAll(() => {
        genes = [
            {
                hugoGeneSymbol: 'EGFR',
            },
            {
                hugoGeneSymbol: 'PTEN',
            },
            {
                hugoGeneSymbol: 'BRCA1',
            },
            {
                hugoGeneSymbol: 'TP53',
            },
        ] as Gene[];

        profileIds = ['profile1', 'profile2', 'profile3', 'profile4'];
    });
    it('gives back trivial chunks when the limit is not reached', () => {
        assert.deepEqual(
            getGeneAndProfileChunksForRequest(10000, 10, genes, profileIds),
            { geneChunks: [genes], profileChunks: [profileIds] }
        );
    });

    it('gives back gene chunks when the limit is reached', () => {
        assert.deepEqual(
            getGeneAndProfileChunksForRequest(10000, 1000, genes, profileIds),
            {
                geneChunks: [
                    [genes[0], genes[1]],
                    [genes[2], genes[3]],
                ],
                profileChunks: [profileIds],
            }
        );
    });
    it('gives back profile chunks when gene chunking isnt enough', () => {
        assert.deepEqual(
            getGeneAndProfileChunksForRequest(10000, 3000, genes, profileIds),
            {
                geneChunks: [[genes[0]], [genes[1]], [genes[2]], [genes[3]]],
                profileChunks: [
                    [profileIds[0], profileIds[1], profileIds[2]],
                    [profileIds[3]],
                ],
            }
        );
    });
});
