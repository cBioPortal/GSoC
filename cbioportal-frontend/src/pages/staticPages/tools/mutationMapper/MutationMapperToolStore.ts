import { action, computed, observable, makeObservable } from 'mobx';
import _ from 'lodash';
import {
    annotateMutations,
    getMyVariantInfoAnnotationsFromIndexedVariantAnnotations,
    IHotspotIndex,
    indexHotspotsData,
    IMyVariantInfoIndex,
    resolveDefaultsForMissingValues,
} from 'cbioportal-utils';

import { cached, remoteData } from 'cbioportal-frontend-commons';
import {
    EnsemblTranscript,
    VariantAnnotation,
    GenomeNexusAPI,
    GenomeNexusAPIInternal,
} from 'genome-nexus-ts-api-client';
import { CancerGene } from 'oncokb-ts-api-client';
import { ClinicalData, Gene, Mutation } from 'cbioportal-ts-api-client';

import {
    fetchGenes,
    getCanonicalTranscriptsByHugoSymbol,
    fetchOncoKbCancerGenes,
    fetchVariantAnnotationsIndexedByGenomicLocation,
} from 'shared/lib/StoreUtils';
import {
    getClinicalData,
    getGeneList,
    mutationInputToMutation,
    MutationInput,
} from 'shared/lib/MutationInputParser';
import { updateMissingGeneInfo } from 'shared/lib/MutationUtils';
import { fetchHotspotsData } from 'shared/lib/CancerHotspotsUtils';
import PubMedCache from 'shared/cache/PubMedCache';
import GenomeNexusCache from 'shared/cache/GenomeNexusCache';
import GenomeNexusMutationAssessorCache from 'shared/cache/GenomeNexusMutationAssessorCache';
import PdbHeaderCache from 'shared/cache/PdbHeaderCache';
import MutationMapperStore, {
    IMutationMapperStoreConfig,
} from 'shared/components/mutationMapper/MutationMapperStore';
import { MutationTableDownloadDataFetcher } from 'shared/lib/MutationTableDownloadDataFetcher';
import {
    normalizeMutations,
    createVariantAnnotationsByMutationFetcher,
} from '../../../../shared/components/mutationMapper/MutationMapperUtils';
import defaultGenomeNexusClient from 'shared/api/genomeNexusClientInstance';
import defaultGenomeNexusInternalClient from 'shared/api/genomeNexusInternalClientInstance';
import autobind from 'autobind-decorator';
import { getGenomeNexusHgvsgUrl } from 'shared/api/urls';
import { GENOME_NEXUS_ARG_FIELD_ENUM } from 'shared/constants';
import { getServerConfig } from 'config/config';
import { REFERENCE_GENOME } from 'shared/lib/referenceGenomeUtils';
import eventBus from 'shared/events/eventBus';
import { ErrorMessages } from 'shared/errorMessages';
import { SiteError } from 'shared/model/appMisc';

export default class MutationMapperToolStore {
    @observable mutationData: Partial<MutationInput>[] | undefined;
    @observable criticalErrors: Error[] = [];

    readonly genes = remoteData<Gene[]>(
        {
            await: () => [this.hugoGeneSymbols],
            invoke: () => fetchGenes(this.hugoGeneSymbols.result),
        },
        []
    );

    readonly canonicalTranscriptsByHugoSymbol = remoteData<
        { [hugoGeneSymbol: string]: EnsemblTranscript } | undefined
    >(
        {
            await: () => [this.hugoGeneSymbols],
            invoke: async () => {
                if (this.hugoGeneSymbols.result) {
                    return getCanonicalTranscriptsByHugoSymbol(
                        this.hugoGeneSymbols.result,
                        this.isoformOverrideSource,
                        this.genomeNexusClient
                    );
                } else {
                    return undefined;
                }
            },
            onError: (err: Error) => {
                throw new Error('Failed to get canonical transcript');
            },
        },
        undefined
    );

    constructor(
        mutationData?: Partial<MutationInput>[],
        private mutationMapperStoreConfigOverride?: IMutationMapperStoreConfig
    ) {
        makeObservable(this);
        this.mutationData = mutationData;
    }

    @computed get isoformOverrideSource(): string {
        return getServerConfig().genomenexus_isoform_override_source;
    }

    @computed get genomeNexusClient() {
        let client = defaultGenomeNexusClient;
        if (
            this.mutationMapperStoreConfigOverride?.genomeBuild ===
            REFERENCE_GENOME.grch38.UCSC
        ) {
            client = new GenomeNexusAPI(
                getServerConfig().genomenexus_url_grch38!
            );
        }

        client.addErrorHandler(err => {
            eventBus.emit(
                'error',
                null,
                new SiteError(
                    new Error(ErrorMessages.GENOME_NEXUS_LOAD_ERROR),
                    'alert'
                )
            );
        });

        return client;
    }

    @computed get genomeNexusInternalClient() {
        let client = defaultGenomeNexusInternalClient;
        if (
            this.mutationMapperStoreConfigOverride?.genomeBuild ===
            REFERENCE_GENOME.grch38.UCSC
        ) {
            client = new GenomeNexusAPIInternal(
                getServerConfig().genomenexus_url_grch38!
            );
        }

        client.addErrorHandler(err => {
            eventBus.emit(
                'error',
                null,
                new SiteError(
                    new Error(ErrorMessages.GENOME_NEXUS_LOAD_ERROR),
                    'alert'
                )
            );
        });

        return client;
    }

    readonly hugoGeneSymbols = remoteData(
        {
            await: () => [this.indexedVariantAnnotations],
            invoke: () => Promise.resolve(getGeneList(this.annotatedMutations)),
        },
        []
    );

    readonly oncoKbCancerGenes = remoteData(
        {
            invoke: () => {
                if (getServerConfig().show_oncokb) {
                    return fetchOncoKbCancerGenes();
                } else {
                    return Promise.resolve([]);
                }
            },
        },
        []
    );

    readonly oncoKbAnnotatedGenes = remoteData(
        {
            await: () => [this.oncoKbCancerGenes],
            invoke: () => {
                if (getServerConfig().show_oncokb) {
                    return Promise.resolve(
                        _.reduce(
                            this.oncoKbCancerGenes.result,
                            (
                                map: { [entrezGeneId: number]: boolean },
                                next: CancerGene
                            ) => {
                                if (next.oncokbAnnotated) {
                                    map[next.entrezGeneId] = true;
                                }
                                return map;
                            },
                            {}
                        )
                    );
                } else {
                    return Promise.resolve({});
                }
            },
        },
        {}
    );

    readonly uniqueSampleKeyToTumorType = remoteData<{
        [uniqueSampleKey: string]: string;
    }>({
        await: () => [this.mutations, this.clinicalDataForSamples],
        invoke: () => {
            const map: { [uniqueSampleKey: string]: string } = {};

            if (this.mutations.result) {
                this.mutations.result.forEach(mutation => {
                    const cancerTypeClinicalData:
                        | ClinicalData
                        | undefined = _.find(
                        this.clinicalDataByUniqueSampleKey[
                            mutation.uniqueSampleKey
                        ],
                        { clinicalAttributeId: 'CANCER_TYPE' }
                    );
                    map[mutation.uniqueSampleKey] = cancerTypeClinicalData
                        ? cancerTypeClinicalData.value
                        : 'Unknown';
                });
            }

            return Promise.resolve(map);
        },
    });

    readonly clinicalDataForSamples = remoteData<ClinicalData[]>(
        {
            await: () => [this.mutations],
            invoke: () => Promise.resolve(getClinicalData(this.mutationData)),
        },
        []
    );

    readonly mutations = remoteData<Mutation[]>(
        {
            await: () => [this.indexedVariantAnnotations, this.genes],
            invoke: () => {
                let mutations: Partial<Mutation>[] = [];

                if (this.annotatedMutations) {
                    mutations = normalizeMutations(
                        this.annotatedMutations as Pick<Mutation, 'chr'>[]
                    ) as Partial<Mutation>[];
                    resolveDefaultsForMissingValues(mutations);
                    updateMissingGeneInfo(mutations, this.genesByHugoSymbol);
                }

                return Promise.resolve(mutations as Mutation[]);
            },
        },
        []
    );

    readonly indexedVariantAnnotations = remoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >(
        {
            invoke: async () =>
                await fetchVariantAnnotationsIndexedByGenomicLocation(
                    this.rawMutations,
                    [
                        GENOME_NEXUS_ARG_FIELD_ENUM.ANNOTATION_SUMMARY,
                        GENOME_NEXUS_ARG_FIELD_ENUM.HOTSPOTS,
                        GENOME_NEXUS_ARG_FIELD_ENUM.CLINVAR,
                        getServerConfig().show_signal
                            ? GENOME_NEXUS_ARG_FIELD_ENUM.SIGNAL
                            : '',
                    ].filter(f => f),
                    getServerConfig().genomenexus_isoform_override_source,
                    this.genomeNexusClient
                ),
            onError: (err: Error) => {
                this.criticalErrors.push(err);
            },
        },
        undefined
    );

    readonly indexedMyVariantInfoAnnotations = remoteData<
        IMyVariantInfoIndex | undefined
    >(
        {
            invoke: async () => {
                const indexedVariantAnnotations = await fetchVariantAnnotationsIndexedByGenomicLocation(
                    this.rawMutations,
                    ['my_variant_info'],
                    getServerConfig().genomenexus_isoform_override_source,
                    this.genomeNexusClient
                );

                return getMyVariantInfoAnnotationsFromIndexedVariantAnnotations(
                    indexedVariantAnnotations
                );
            },
            onError: (err: Error) => {
                this.criticalErrors.push(err);
            },
        },
        undefined
    );

    readonly hotspotData = remoteData({
        await: () => [this.mutations],
        invoke: () => {
            return fetchHotspotsData(
                this.mutations,
                undefined,
                this.genomeNexusInternalClient
            );
        },
    });

    readonly indexedHotspotData = remoteData<IHotspotIndex | undefined>({
        await: () => [this.hotspotData],
        invoke: () => Promise.resolve(indexHotspotsData(this.hotspotData)),
    });

    readonly mutationMapperStores = remoteData<{
        [hugoGeneSymbol: string]: MutationMapperStore;
    }>(
        {
            await: () => [
                this.genes,
                this.mutations,
                this.uniqueSampleKeyToTumorType,
                this.indexedVariantAnnotations,
                this.canonicalTranscriptsByHugoSymbol,
            ],
            invoke: () => {
                if (this.genes.result) {
                    // we have to use _.reduce, otherwise this.genes.result (Immutable, due to remoteData) will return
                    //  an Immutable as the result of reduce, and MutationMapperStore when it is made immutable all the
                    //  mobx machinery going on in the readonly remoteDatas and observables somehow gets messed up.
                    return Promise.resolve(
                        _.reduce(
                            this.genes.result,
                            (
                                map: {
                                    [hugoGeneSymbol: string]: MutationMapperStore;
                                },
                                gene: Gene
                            ) => {
                                const getMutations = () => {
                                    return this.mutationsByGene[
                                        gene.hugoGeneSymbol
                                    ];
                                };
                                map[
                                    gene.hugoGeneSymbol
                                ] = new MutationMapperStore(
                                    getServerConfig(),
                                    {
                                        filterMutationsBySelectedTranscript: !this
                                            .hasInputWithProteinChanges,
                                        genomeBuild:
                                            this
                                                .mutationMapperStoreConfigOverride
                                                ?.genomeBuild ||
                                            REFERENCE_GENOME.grch37.UCSC,
                                        ...this
                                            .mutationMapperStoreConfigOverride,
                                    },
                                    gene,
                                    getMutations,
                                    this.indexedHotspotData,
                                    this.indexedVariantAnnotations,
                                    this.oncoKbCancerGenes,
                                    this.uniqueSampleKeyToTumorType.result ||
                                        {},
                                    this.genomeNexusClient,
                                    this.genomeNexusInternalClient
                                );
                                return map;
                            },
                            {}
                        )
                    );
                } else {
                    return Promise.resolve({});
                }
            },
        },
        {}
    );

    public getMutationMapperStore(
        hugoGeneSymbol: string
    ): MutationMapperStore | undefined {
        return this.mutationMapperStores.result[hugoGeneSymbol];
    }

    @computed get hasInputWithProteinChanges(): boolean {
        return _.some(
            this.mutationData,
            m => m.proteinChange && m.proteinChange.length > 0
        );
    }

    @computed get rawMutations(): Mutation[] {
        return (mutationInputToMutation(this.mutationData) as Mutation[]) || [];
    }

    @computed get annotatedMutations(): Partial<Mutation>[] {
        return this.indexedVariantAnnotations.result
            ? (annotateMutations(
                  normalizeMutations(this.rawMutations),
                  this.indexedVariantAnnotations.result
              ) as Partial<Mutation>[])
            : [];
    }
    @computed get mutationsNotAnnotated(): {
        lineNumber: number;
        mutationInput: Partial<MutationInput>;
    }[] {
        return _.compact(
            this.mutations.result.map((mutation: Mutation, index: number) => {
                if (
                    !mutation ||
                    !mutation.gene ||
                    !mutation.gene.hugoGeneSymbol
                ) {
                    return (
                        this.mutationData && {
                            lineNumber: index + 2,
                            mutationInput: this.mutationData[index],
                        }
                    );
                } else {
                    return null;
                }
            })
        );
    }
    @computed get mutationsByGene(): { [hugoGeneSymbol: string]: Mutation[] } {
        return _.groupBy(
            this.mutations.result,
            (mutation: Mutation) => mutation.gene.hugoGeneSymbol
        );
    }

    @computed get genesByHugoSymbol(): { [hugoGeneSymbol: string]: Gene } {
        return _.keyBy(this.genes.result, (gene: Gene) => gene.hugoGeneSymbol);
    }

    @computed get clinicalDataByUniqueSampleKey(): {
        [uniqueSampleKey: string]: ClinicalData[];
    } {
        return _.groupBy(
            this.clinicalDataForSamples.result,
            (clinicalData: ClinicalData) => clinicalData.uniqueSampleKey
        );
    }

    @autobind
    generateGenomeNexusHgvsgUrl(hgvsg: string) {
        return getGenomeNexusHgvsgUrl(
            hgvsg,
            this.genomeNexusClient.getDomain()
        );
    }

    @cached @computed get pubMedCache() {
        return new PubMedCache();
    }

    @cached @computed get genomeNexusCache() {
        return new GenomeNexusCache(
            createVariantAnnotationsByMutationFetcher(
                [GENOME_NEXUS_ARG_FIELD_ENUM.ANNOTATION_SUMMARY],
                this.genomeNexusClient
            )
        );
    }

    @cached @computed get genomeNexusMutationAssessorCache() {
        return new GenomeNexusMutationAssessorCache(
            createVariantAnnotationsByMutationFetcher(
                [
                    GENOME_NEXUS_ARG_FIELD_ENUM.ANNOTATION_SUMMARY,
                    GENOME_NEXUS_ARG_FIELD_ENUM.MUTATION_ASSESSOR,
                ],
                this.genomeNexusClient
            )
        );
    }

    @cached @computed get pdbHeaderCache() {
        return new PdbHeaderCache();
    }

    @cached @computed get downloadDataFetcher() {
        return new MutationTableDownloadDataFetcher(
            this.mutations,
            undefined,
            undefined,
            () => this.genomeNexusCache,
            () => this.genomeNexusMutationAssessorCache
        );
    }

    @action public clearCriticalErrors() {
        this.criticalErrors = [];
    }
}
