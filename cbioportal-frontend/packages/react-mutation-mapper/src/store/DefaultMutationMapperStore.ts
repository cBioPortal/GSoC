import autobind from 'autobind-decorator';
import { cached, MobxPromise, remoteData } from 'cbioportal-frontend-commons';
import {
    AggregatedHotspots,
    convertDbPtmToPtm,
    convertUniprotFeatureToPtm,
    defaultHotspotFilter,
    genomicLocationString,
    groupCancerHotspotDataByPosition,
    groupHotspotsByMutations,
    getMutationsByTranscriptId,
    groupMutationsByProteinStartPos,
    groupPtmDataByPosition,
    groupPtmDataByTypeAndPosition,
    indexHotspotsData,
    ICivicGeneIndex,
    ICivicVariantIndex,
    IHotspotIndex,
    IOncoKbData,
    fetchCivicGenes,
    fetchCivicVariants,
    PostTranslationalModification,
    PtmSource,
    UniprotFeature,
    uniqueGenomicLocations,
    UniprotCategory,
    convertUniprotFeatureToUniprotTopology,
    UniprotTopology,
} from 'cbioportal-utils';
import { Gene, Mutation, IMyVariantInfoIndex } from 'cbioportal-utils';
import memoize from 'memoize-weak-decorator';

import {
    CancerGene,
    IndicatorQueryResp,
    OncoKBInfo,
} from 'oncokb-ts-api-client';
import {
    EnsemblTranscript,
    GenomicLocation,
    Hotspot,
    PfamDomain,
    PfamDomainRange,
    PostTranslationalModification as DbPtm,
    // TODO UniprotFeature, UniprotFeatureList
    VariantAnnotation,
} from 'genome-nexus-ts-api-client';
import _ from 'lodash';
import { computed, observable, makeObservable } from 'mobx';

import { DataFilter, DataFilterType } from '../model/DataFilter';
import DataStore from '../model/DataStore';
import { ApplyFilterFn, FilterApplier } from '../model/FilterApplier';
import { MutationMapperDataFetcher } from '../model/MutationMapperDataFetcher';
import { MutationMapperStore } from '../model/MutationMapperStore';
import {
    ONCOKB_DEFAULT_DATA,
    ONCOKB_DEFAULT_INFO,
    USE_DEFAULT_PUBLIC_INSTANCE_FOR_ONCOKB,
} from '../util/DataFetcherUtils';
import {
    applyDataFilters,
    groupDataByProteinImpactType,
} from '../util/FilterUtils';
import {
    defaultOncoKbIndicatorFilter,
    groupOncoKbIndicatorDataByMutations,
} from 'oncokb-frontend-commons';
import { DefaultMutationMapperDataStore } from './DefaultMutationMapperDataStore';
import { DefaultMutationMapperDataFetcher } from './DefaultMutationMapperDataFetcher';
import { DefaultMutationMapperFilterApplier } from './DefaultMutationMapperFilterApplier';
import { get } from 'superagent';

interface DefaultMutationMapperStoreConfig {
    annotationFields?: string[];
    isoformOverrideSource?: string;
    ptmSources?: string[];
    filterMutationsBySelectedTranscript?: boolean;
    genomeNexusUrl?: string;
    oncoKbUrl?: string;
    enableCivic?: boolean;
    enableOncoKb?: boolean;
    enableRevue?: boolean;
    cachePostMethodsOnClients?: boolean;
    apiCacheLimit?: number;
    getMutationCount?: (mutation: Partial<Mutation>) => number;
    getTumorType?: (mutation: Partial<Mutation>) => string;
    filterApplier?: FilterApplier;
    filterAppliersOverride?: {
        [filterType: string]: ApplyFilterFn;
    };
    dataFetcher?: MutationMapperDataFetcher;
    dataFilters?: DataFilter[];
    selectionFilters?: DataFilter[];
    highlightFilters?: DataFilter[];
    groupFilters?: { group: string; filter: DataFilter }[];
    genomeBuild?: string;
}

class DefaultMutationMapperStore<T extends Mutation>
    implements MutationMapperStore<T> {
    protected getDataFetcher?: () => MutationMapperDataFetcher;

    @observable
    private _selectedTranscript: string | undefined = undefined;

    // this allows us to keep selected transcript state in one of two places
    // external (e.g. url)
    // internal (_selectedTranscript)
    // we default to external
    @computed get selectedTranscript(): string | undefined {
        if (this.getTranscriptId) {
            return this.getTranscriptId();
        } else {
            return this._selectedTranscript;
        }
    }

    constructor(
        public gene: Gene,
        protected config: DefaultMutationMapperStoreConfig,
        protected getMutations: () => T[],
        public getTranscriptId?: () => string | undefined
    ) {
        makeObservable<
            DefaultMutationMapperStore<T>,
            '_selectedTranscript' | 'mutationsGroupedByProteinImpactType'
        >(this);
    }

    readonly activeTranscript: MobxPromise<string | undefined> = remoteData(
        {
            await: () => [
                this.allTranscripts,
                this.canonicalTranscript,
                this.transcriptsWithAnnotations,
            ],
            invoke: async () => {
                let activeTranscript;
                const canonicalTranscriptId = this.canonicalTranscript.result
                    ? this.canonicalTranscript.result.transcriptId
                    : undefined;
                const selectedTranscript =
                    this.selectedTranscript &&
                    this.allTranscripts.result &&
                    this.allTranscripts.result.find(
                        transcript =>
                            transcript.transcriptId === this.selectedTranscript
                    )
                        ? this.selectedTranscript
                        : undefined;

                if (selectedTranscript) {
                    activeTranscript = selectedTranscript;
                } else if (this.config.filterMutationsBySelectedTranscript) {
                    if (
                        this.transcriptsWithAnnotations.result &&
                        this.transcriptsWithAnnotations.result.length > 0 &&
                        canonicalTranscriptId &&
                        !this.transcriptsWithAnnotations.result.includes(
                            canonicalTranscriptId
                        )
                    ) {
                        activeTranscript = this.transcriptsWithAnnotations
                            .result[0];
                    } else {
                        activeTranscript = canonicalTranscriptId;
                    }
                } else {
                    activeTranscript = canonicalTranscriptId;
                }

                return activeTranscript;
            },
        },
        undefined
    );

    public setSelectedTranscript(transcript: string | undefined) {
        this._selectedTranscript = transcript;
    }

    @computed
    public get isoformOverrideSource(): string {
        return this.config.isoformOverrideSource || 'mskcc';
    }

    @computed
    public get ptmSources(): string[] {
        return this.config.ptmSources || [PtmSource.dbPTM];
    }

    @computed
    public get annotationFields(): string[] {
        return _.uniq(
            ['annotation_summary', 'hotspots'].concat(
                this.config.annotationFields || []
            )
        );
    }

    protected getDataStore?: () => DataStore;

    @cached
    @computed
    public get dataStore(): DataStore {
        if (this.getDataStore) {
            return this.getDataStore();
        }
        return new DefaultMutationMapperDataStore(
            this.mutations,
            this.filterApplier,
            this.config.dataFilters,
            this.config.selectionFilters,
            this.config.highlightFilters,
            this.config.groupFilters
        );
    }

    @computed
    public get mutations(): T[] {
        if (
            this.canonicalTranscript.isPending ||
            (this.config.filterMutationsBySelectedTranscript &&
                (this.transcriptsWithAnnotations.isPending ||
                    this.indexedVariantAnnotations.isPending) &&
                this.canonicalTranscript.isPending)
        ) {
            return [];
        } else if (
            this.config.filterMutationsBySelectedTranscript &&
            this.activeTranscript.result &&
            this.indexedVariantAnnotations.result &&
            !_.isEmpty(this.indexedVariantAnnotations.result)
        ) {
            return this.getAnnotatedMutations(this.activeTranscript.result);
        } else {
            return this.getMutations();
        }
    }

    @memoize
    protected getAnnotatedMutationsByTranscriptId(
        mutations: T[],
        transcriptId: string,
        indexedVariantAnnotations: {
            [genomicLocation: string]: VariantAnnotation;
        }
    ): T[] {
        // by default annotate every mutation, no check for canonical transcript
        return getMutationsByTranscriptId(
            mutations,
            transcriptId,
            indexedVariantAnnotations
        );
    }

    public getAnnotatedMutations(transcriptId: string): T[] {
        // in case we don't have any annotation for the given set of mutations or the annotation fails due to an error
        // (external service error, etc.) we just return the input set of mutations as is. Ideally this function
        // should not be invoked when this.indexedVariantAnnotations.result is undefined
        if (this.indexedVariantAnnotations.result) {
            return this.getAnnotatedMutationsByTranscriptId(
                this.getMutations(),
                transcriptId,
                this.indexedVariantAnnotations.result
            );
        } else {
            return this.getMutations();
        }
    }

    @computed
    public get filterApplier() {
        return (
            this.config.filterApplier ||
            new DefaultMutationMapperFilterApplier(
                this.indexedHotspotData,
                this.oncoKbData,
                this.getDefaultTumorType,
                this.getDefaultEntrezGeneId,
                this.config.filterAppliersOverride
            )
        );
    }

    @computed
    public get dataFetcher(): MutationMapperDataFetcher {
        return (
            this.config.dataFetcher ||
            (this.getDataFetcher && this.getDataFetcher()) ||
            new DefaultMutationMapperDataFetcher({
                genomeNexusUrl: this.config.genomeNexusUrl,
                oncoKbUrl: this.config.oncoKbUrl,
                cachePostMethodsOnClients: this.config
                    .cachePostMethodsOnClients,
                apiCacheLimit: this.config.apiCacheLimit,
            })
        );
    }

    @computed
    public get mutationsByPosition(): { [pos: number]: T[] } {
        return groupMutationsByProteinStartPos(
            _.flatten(this.dataStore.sortedFilteredData)
        );
    }

    @computed
    public get groupedMutationsByPosition(): {
        group: string;
        mutations: { [pos: number]: T[] };
    }[] {
        return this.dataStore.sortedFilteredGroupedData.map(groupedData => ({
            group: groupedData.group,
            mutations: groupMutationsByProteinStartPos(
                _.flatten(groupedData.data)
            ),
        }));
    }

    protected getMutationsGroupedByProteinImpactType?: () => {
        [type: string]: { group: string; data: any[] };
    };

    @computed
    protected get mutationsGroupedByProteinImpactType() {
        if (this.getMutationsGroupedByProteinImpactType) {
            return this.getMutationsGroupedByProteinImpactType();
        }
        const filtersWithoutProteinImpactTypeFilter = this.dataStore.dataFilters.filter(
            f => f.type !== DataFilterType.PROTEIN_IMPACT_TYPE
        );

        // apply filters excluding the protein impact type filters
        // this prevents number of unchecked protein impact types from being counted as zero
        const sortedFilteredData = applyDataFilters(
            this.dataStore.allData,
            filtersWithoutProteinImpactTypeFilter,
            this.dataStore.applyFilter
        );

        return groupDataByProteinImpactType(sortedFilteredData);
    }

    @computed
    public get mutationCountsByProteinImpactType(): {
        [proteinImpactType: string]: number;
    } {
        const map: { [proteinImpactType: string]: number } = {};

        Object.keys(this.mutationsGroupedByProteinImpactType).forEach(
            proteinImpactType => {
                const g = this.mutationsGroupedByProteinImpactType[
                    proteinImpactType
                ];
                map[g.group] = g.data.length;
            }
        );

        return map;
    }

    @computed
    public get uniqueMutationCountsByPosition(): { [pos: number]: number } {
        return this.countUniqueMutationsByPosition(this.mutationsByPosition);
    }

    @computed
    public get uniqueGroupedMutationCountsByPosition(): {
        group: string;
        counts: { [pos: number]: number };
    }[] {
        return this.groupedMutationsByPosition.map(groupedMutations => ({
            group: groupedMutations.group,
            counts: this.countUniqueMutationsByPosition(
                groupedMutations.mutations,
                groupedMutations.group
            ),
        }));
    }

    @computed
    public get transcriptsByTranscriptId(): {
        [transcriptId: string]: EnsemblTranscript;
    } {
        return _.keyBy(
            this.allTranscripts.result,
            (transcript: EnsemblTranscript) => transcript.transcriptId
        );
    }

    public countUniqueMutationsByPosition(
        mutationsByPosition: {
            [pos: number]: T[];
        },
        group?: string
    ): { [pos: number]: number } {
        const map: { [pos: number]: number } = {};

        Object.keys(mutationsByPosition).forEach(pos => {
            const position = parseInt(pos, 10);
            // for each position multiple mutations for the same patient is counted only once
            const mutations = mutationsByPosition[position];
            if (mutations) {
                map[position] = this.countUniqueMutations(mutations, group);
            }
        });

        return map;
    }

    public countUniqueMutations(mutations: T[], group?: string): number {
        // assume by default all mutations are unique
        // child classes need to override this method to have a custom way of counting unique mutations
        return this.config.getMutationCount
            ? this.getMutationCount(mutations, this.config.getMutationCount)
            : mutations.length;
    }

    protected getMutationCount(
        mutations: T[],
        getMutationCount: (mutation: Partial<T>) => number
    ) {
        return mutations
            .map(m => getMutationCount(m))
            .reduce((sum, count) => sum + count);
    }

    readonly mutationData: MobxPromise<Partial<T>[] | undefined> = remoteData(
        {
            await: () => {
                if (this.config.filterMutationsBySelectedTranscript) {
                    return [
                        this.canonicalTranscript,
                        this.indexedVariantAnnotations,
                    ];
                } else {
                    return [this.canonicalTranscript];
                }
            },
            invoke: async () => {
                return this.mutations;
            },
        },
        []
    );

    readonly swissProtId: MobxPromise<string> = remoteData(
        {
            invoke: async () => {
                // do not try fetching swissprot data for invalid entrez gene ids,
                // just return the default value
                if (!this.gene.entrezGeneId || this.gene.entrezGeneId < 1) {
                    return '';
                }

                const accession:
                    | string
                    | string[] = await this.dataFetcher.fetchSwissProtAccession(
                    this.gene.entrezGeneId
                );

                if (_.isArray(accession)) {
                    return accession[0];
                } else {
                    return accession;
                }
            },
            onError: () => {
                // fail silently
            },
        },
        ''
    );

    readonly uniprotId: MobxPromise<string | undefined> = remoteData(
        {
            await: () => [this.swissProtId],
            invoke: async () => {
                if (this.swissProtId.result) {
                    return this.dataFetcher.fetchUniprotId(
                        this.swissProtId.result
                    );
                } else {
                    return '';
                }
            },
            onError: () => {
                // fail silently
            },
        },
        ''
    );

    readonly pfamDomainData: MobxPromise<PfamDomain[] | undefined> = remoteData(
        {
            await: () => [
                this.canonicalTranscript,
                this.transcriptsWithProteinLength,
            ],
            invoke: async () => {
                if (
                    this.canonicalTranscript.result &&
                    this.canonicalTranscript.result.pfamDomains &&
                    this.canonicalTranscript.result.pfamDomains.length > 0
                ) {
                    let domainRanges = this.canonicalTranscript.result
                        .pfamDomains;
                    if (
                        this.config.filterMutationsBySelectedTranscript &&
                        this.transcriptsWithProteinLength.result &&
                        this.transcriptsWithProteinLength.result.length > 0
                    ) {
                        // add domain ranges for all transcripts to this call
                        domainRanges = [].concat.apply(
                            [domainRanges],
                            _.compact(
                                this.transcriptsWithProteinLength.result.map(
                                    (transcriptId: string) =>
                                        this.transcriptsByTranscriptId[
                                            transcriptId
                                        ].pfamDomains
                                )
                            )
                        );
                    }
                    return this.dataFetcher.fetchPfamDomainData(
                        domainRanges.map((x: PfamDomainRange) => x.pfamDomainId)
                    );
                } else {
                    return undefined;
                }
            },
            onError: () => {
                // allow client level handler to work
            },
        },
        undefined
    );

    readonly canonicalTranscript: MobxPromise<
        EnsemblTranscript | undefined
    > = remoteData(
        {
            await: () => [this.transcriptsByHugoSymbol],
            invoke: async () => {
                if (this.gene) {
                    return this.dataFetcher.fetchCanonicalTranscriptWithFallback(
                        this.gene.hugoGeneSymbol,
                        this.isoformOverrideSource,
                        this.transcriptsByHugoSymbol.result
                    );
                } else {
                    return undefined;
                }
            },
            onError: () => {
                throw new Error('Failed to get canonical transcript');
            },
        },
        undefined
    );

    readonly allTranscripts: MobxPromise<
        EnsemblTranscript[] | undefined
    > = remoteData(
        {
            await: () => [
                this.transcriptsByHugoSymbol,
                this.canonicalTranscript,
            ],
            invoke: async () => {
                return _.compact(
                    _.unionBy(
                        this.transcriptsByHugoSymbol.result,
                        [this.canonicalTranscript.result],
                        t => t && t.transcriptId
                    )
                );
            },
            onError: () => {
                throw new Error('Failed to get all transcripts');
            },
        },
        undefined
    );

    readonly transcriptsByHugoSymbol: MobxPromise<
        EnsemblTranscript[] | undefined
    > = remoteData(
        {
            invoke: async () => {
                if (this.gene) {
                    return this.dataFetcher.fetchEnsemblTranscriptsByEnsemblFilter(
                        { hugoSymbols: [this.gene.hugoGeneSymbol] }
                    );
                } else {
                    return undefined;
                }
            },
            onError: () => {
                throw new Error('Failed to fetch all transcripts');
            },
        },
        undefined
    );

    readonly transcriptsWithProteinLength: MobxPromise<
        string[] | undefined
    > = remoteData(
        {
            await: () => [this.allTranscripts, this.canonicalTranscript],
            invoke: async () => {
                if (
                    this.allTranscripts.result &&
                    this.canonicalTranscript.result
                ) {
                    // ignore transcripts without protein length
                    // TODO: better solution is to hide lollipop plot for those transcripts
                    return _.compact(
                        this.allTranscripts.result.map(
                            (et: EnsemblTranscript) =>
                                et.proteinLength && et.transcriptId
                        )
                    );
                } else {
                    return [];
                }
            },
            onError: () => {
                throw new Error('Failed to get transcriptsWithProteinLength');
            },
        },
        undefined
    );

    readonly transcriptsWithAnnotations: MobxPromise<
        string[] | undefined
    > = remoteData(
        {
            await: () => [
                this.indexedVariantAnnotations,
                this.allTranscripts,
                this.transcriptsWithProteinLength,
                this.canonicalTranscript,
            ],
            invoke: async () => {
                if (
                    this.indexedVariantAnnotations.result &&
                    this.allTranscripts.result &&
                    this.transcriptsWithProteinLength.result &&
                    this.transcriptsWithProteinLength.result.length > 0
                ) {
                    // ignore transcripts without protein length
                    // TODO: better solution is to show only mutations table, not lollipop plot for those transcripts
                    const transcripts: string[] = _.uniq(
                        [].concat.apply(
                            [],
                            uniqueGenomicLocations(this.getMutations()).map(
                                (gl: GenomicLocation) => {
                                    const variantAnnotation = this
                                        .indexedVariantAnnotations.result
                                        ? this.indexedVariantAnnotations.result[
                                              genomicLocationString(gl)
                                          ]
                                        : undefined;

                                    if (
                                        variantAnnotation &&
                                        !_.isEmpty(
                                            variantAnnotation.transcript_consequences
                                        )
                                    ) {
                                        return variantAnnotation.transcript_consequences
                                            .map(tc => tc.transcript_id)
                                            .filter((transcriptId: string) =>
                                                this.transcriptsWithProteinLength.result!.includes(
                                                    transcriptId
                                                )
                                            );
                                    } else {
                                        return [];
                                    }
                                }
                            )
                        )
                    );
                    // makes sure the annotations are actually of the form we are displaying (e.g. nonsynonymous)
                    return transcripts.filter(
                        t => this.getAnnotatedMutations(t).length > 0
                    );
                } else {
                    return [];
                }
            },
            onError: () => {
                throw new Error('Failed to get transcriptsWithAnnotations');
            },
        },
        undefined
    );

    readonly ptmData: MobxPromise<PostTranslationalModification[]> = remoteData(
        {
            await: () => {
                const waitList = [];

                if (this.ptmSources.includes(PtmSource.Uniprot)) {
                    waitList.push(this.uniprotPtmData);
                }
                if (this.ptmSources.includes(PtmSource.dbPTM)) {
                    waitList.push(this.dbPtmData);
                }

                return waitList;
            },
            invoke: () => {
                const data: PostTranslationalModification[] = [];

                if (
                    this.ptmSources.includes(PtmSource.Uniprot) &&
                    this.uniprotPtmData.result
                ) {
                    data.push(
                        ...this.uniprotPtmData.result.map(
                            convertUniprotFeatureToPtm
                        )
                    );
                }

                if (
                    this.ptmSources.includes(PtmSource.dbPTM) &&
                    this.dbPtmData.result
                ) {
                    data.push(...this.dbPtmData.result.map(convertDbPtmToPtm));
                }

                return Promise.resolve(data);
            },
            onError: () => {
                // fail silently
            },
        }
    );

    readonly uniprotPtmData: MobxPromise<UniprotFeature[]> = remoteData(
        {
            await: () => [
                this.mutationData,
                this.activeTranscript,
                this.allTranscripts,
            ],
            invoke: async () => {
                let uniprotId: string | undefined;

                if (this.activeTranscript.result) {
                    const transcript = this.transcriptsByTranscriptId[
                        this.activeTranscript.result
                    ];
                    uniprotId = transcript?.uniprotId;
                }

                if (uniprotId) {
                    // TODO we need to update genome nexus for this one to work,
                    //  for now we are getting the data directly from uniprot API
                    // return this.dataFetcher.fetchPtmData(
                    //     this.activeTranscript.result
                    // );
                    return this.dataFetcher.fetchUniprotFeatures(uniprotId, [
                        UniprotCategory.PTM,
                    ]);
                } else {
                    return [];
                }
            },
            onError: () => {
                // fail silently
            },
        },
        []
    );

    readonly uniprotTopologyData: MobxPromise<UniprotTopology[]> = remoteData(
        {
            await: () => [
                this.mutationData,
                this.activeTranscript,
                this.allTranscripts,
            ],
            invoke: async () => {
                let uniprotId: string | undefined;
                const data: UniprotTopology[] = [];

                if (this.activeTranscript.result) {
                    const transcript = this.transcriptsByTranscriptId[
                        this.activeTranscript.result
                    ];
                    uniprotId = transcript?.uniprotId;
                }

                if (uniprotId) {
                    // TODO we need to update genome nexus for this one to work,
                    //  for now we are getting the data directly from uniprot API
                    const uniprotFeatures = await this.dataFetcher.fetchUniprotFeatures(
                        uniprotId,
                        [UniprotCategory.TOPOLOGY]
                    );
                    uniprotFeatures.forEach(uniprotFeature => {
                        let uniprotTopology = convertUniprotFeatureToUniprotTopology(
                            uniprotFeature
                        );
                        if (uniprotTopology) {
                            data.push(uniprotTopology);
                        }
                    });
                    return data;
                } else {
                    return [];
                }
            },
            onError: () => {
                // fail silently
            },
        },
        []
    );

    readonly dbPtmData: MobxPromise<DbPtm[]> = remoteData(
        {
            await: () => [this.mutationData, this.activeTranscript],
            invoke: async () => {
                if (this.activeTranscript.result) {
                    return this.dataFetcher.fetchPtmData(
                        this.activeTranscript.result
                    );
                } else {
                    return [];
                }
            },
            onError: () => {
                // fail silently
            },
        },
        []
    );

    readonly ptmDataByProteinPosStart: MobxPromise<
        { [pos: number]: PostTranslationalModification[] } | undefined
    > = remoteData(
        {
            await: () => [this.ptmData],
            invoke: async () =>
                this.ptmData.result
                    ? groupPtmDataByPosition(this.ptmData.result)
                    : {},
        },
        {}
    );

    readonly ptmDataByTypeAndProteinPosStart: MobxPromise<
        | {
              [type: string]: {
                  [position: number]: PostTranslationalModification[];
              };
          }
        | undefined
    > = remoteData(
        {
            await: () => [this.ptmData],
            invoke: async () =>
                this.ptmData.result
                    ? groupPtmDataByTypeAndPosition(this.ptmData.result)
                    : {},
        },
        {}
    );

    readonly cancerHotspotsData: MobxPromise<Hotspot[]> = remoteData(
        {
            await: () => [this.mutationData, this.activeTranscript],
            invoke: async () => {
                if (this.activeTranscript.result) {
                    // TODO resolve protein start pos if missing
                    return this.dataFetcher.fetchCancerHotspotData(
                        this.activeTranscript.result
                    );
                } else {
                    return [];
                }
            },
            onError: () => {
                // fail silently
            },
        },
        []
    );

    readonly cancerHotspotsDataByProteinPosStart: MobxPromise<{
        [pos: number]: Hotspot[];
    }> = remoteData(
        {
            await: () => [this.cancerHotspotsData],
            invoke: async () =>
                this.cancerHotspotsData.result
                    ? groupCancerHotspotDataByPosition(
                          this.cancerHotspotsData.result
                      )
                    : {},
        },
        {}
    );

    // Hotspots
    readonly hotspotData: MobxPromise<AggregatedHotspots[]> = remoteData({
        await: () => [this.mutationData],
        invoke: () => {
            return this.dataFetcher.fetchAggregatedHotspotsData(this.mutations);
        },
    });

    readonly indexedHotspotData: MobxPromise<
        IHotspotIndex | undefined
    > = remoteData({
        await: () => [this.hotspotData],
        invoke: () => Promise.resolve(indexHotspotsData(this.hotspotData)),
    });

    @computed
    get hotspotsByPosition(): { [pos: number]: Hotspot[] } {
        if (this.indexedHotspotData.result) {
            return groupHotspotsByMutations(
                this.mutationsByPosition,
                this.indexedHotspotData.result,
                defaultHotspotFilter
            );
        } else {
            return {};
        }
    }

    readonly oncoKbCancerGenes: MobxPromise<CancerGene[] | Error> = remoteData(
        {
            invoke: () => this.dataFetcher.fetchOncoKbCancerGenes(),
        },
        []
    );

    readonly oncoKbInfo: MobxPromise<OncoKBInfo> = remoteData(
        {
            invoke: () => this.dataFetcher.fetchOncoKbInfo(),
            onError: () => ONCOKB_DEFAULT_INFO,
        },
        ONCOKB_DEFAULT_INFO
    );

    @computed
    get usingPublicOncoKbInstance() {
        return this.oncoKbInfo.result
            ? this.oncoKbInfo.result.publicInstance
            : USE_DEFAULT_PUBLIC_INSTANCE_FOR_ONCOKB;
    }

    readonly oncoKbAnnotatedGenes: MobxPromise<{
        [entrezGeneId: number]: boolean;
    }> = remoteData(
        {
            await: () => [this.oncoKbCancerGenes],
            invoke: () =>
                Promise.resolve(
                    _.reduce(
                        this.oncoKbCancerGenes.result,
                        (
                            map: { [entrezGeneId: number]: boolean },
                            next: CancerGene
                        ) => {
                            if (next && next.oncokbAnnotated) {
                                map[next.entrezGeneId] = true;
                            }
                            return map;
                        },
                        {}
                    )
                ),
        },
        {}
    );

    readonly oncoKbData: MobxPromise<IOncoKbData | Error> = remoteData(
        {
            await: () => [this.mutationData, this.oncoKbAnnotatedGenes],
            invoke: () =>
                this.config.enableOncoKb
                    ? this.dataFetcher.fetchOncoKbData(
                          this.mutations,
                          this.oncoKbAnnotatedGenes.result!,
                          this.getDefaultTumorType,
                          this.getDefaultEntrezGeneId
                      )
                    : Promise.resolve(ONCOKB_DEFAULT_DATA),
            onError: () => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        ONCOKB_DEFAULT_DATA
    );

    @computed
    get oncoKbDataByPosition(): { [pos: number]: IndicatorQueryResp[] } {
        if (
            this.oncoKbData.result &&
            !(this.oncoKbData.result instanceof Error)
        ) {
            return groupOncoKbIndicatorDataByMutations(
                this.mutationsByPosition,
                this.oncoKbData.result,
                this.getDefaultTumorType,
                this.getDefaultEntrezGeneId,
                defaultOncoKbIndicatorFilter
            );
        } else {
            return {};
        }
    }

    readonly civicGenes: MobxPromise<ICivicGeneIndex | undefined> = remoteData({
        await: () => [this.mutationData],
        invoke: async () =>
            this.config.enableCivic
                ? fetchCivicGenes(this.mutationData.result || [])
                : {},
        onError: () => {
            // fail silently
        },
    });

    readonly civicVariants = remoteData<ICivicVariantIndex | undefined>({
        await: () => [this.civicGenes, this.mutationData],
        invoke: async () => {
            if (this.config.enableCivic && this.civicGenes.result) {
                return fetchCivicVariants(
                    this.civicGenes.result as ICivicGeneIndex,
                    this.mutationData.result || []
                );
            } else {
                return {};
            }
        },
        onError: () => {
            // fail silently
        },
    });

    readonly indexedVariantAnnotations: MobxPromise<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    > = remoteData({
        invoke: async () =>
            !_.isEmpty(this.getMutations())
                ? await this.dataFetcher.fetchVariantAnnotationsIndexedByGenomicLocation(
                      this.getMutations(),
                      this.annotationFields,
                      this.isoformOverrideSource
                  )
                : undefined,
        onError: () => {
            // fail silently, leave the error handling responsibility to the data consumer
        },
    });

    readonly indexedMyVariantInfoAnnotations: MobxPromise<
        IMyVariantInfoIndex | undefined
    > = remoteData({
        await: () => [this.mutationData],
        invoke: async () =>
            !_.isEmpty(this.getMutations())
                ? await this.dataFetcher.fetchMyVariantInfoAnnotationsIndexedByGenomicLocation(
                      this.getMutations(),
                      this.isoformOverrideSource
                  )
                : undefined,
        onError: () => {
            // fail silently, leave the error handling responsibility to the data consumer
        },
    });

    @computed
    get mutationsByTranscriptId(): { [transcriptId: string]: T[] } {
        if (
            this.indexedVariantAnnotations.result &&
            this.transcriptsWithAnnotations.result &&
            this.canonicalTranscript.isComplete
        ) {
            return _.fromPairs(
                this.transcriptsWithAnnotations.result.map((t: string) => [
                    t,
                    this.getAnnotatedMutations(t),
                ])
            );
        } else {
            return {};
        }
    }

    @autobind
    protected getDefaultTumorType(mutation: T): string {
        return this.config.getTumorType
            ? this.config.getTumorType(mutation)
            : '';
    }

    @autobind
    protected getDefaultEntrezGeneId(mutation: T): number {
        // assuming all mutations in this store is for the same gene
        return (
            this.gene.entrezGeneId ||
            (mutation.gene && mutation.gene.entrezGeneId) ||
            0
        );
    }

    readonly ensemblTranscriptLookUp: MobxPromise<any | undefined> = remoteData(
        {
            await: () => [this.activeTranscript],
            invoke: async () => {
                const ensemblTranscriptLookUpLink =
                    this.genomeBuild === 'hg19'
                        ? `https://grch37.rest.ensembl.org/lookup/id/${this.activeTranscript.result}?content-type=application/json`
                        : `https://rest.ensembl.org/lookup/id/${this.activeTranscript.result}?content-type=application/json`;
                return this.activeTranscript.result
                    ? get(ensemblTranscriptLookUpLink)
                    : undefined;
            },
            onError: () => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        }
    );

    @computed
    // Get genome build for exon track
    public get genomeBuild(): string {
        return this.config.genomeBuild || 'hg19';
    }
}

export default DefaultMutationMapperStore;
