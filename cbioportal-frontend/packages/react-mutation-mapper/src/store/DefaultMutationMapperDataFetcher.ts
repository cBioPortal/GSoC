import _ from 'lodash';
import request from 'superagent';
import Response = request.Response;

import {
    AggregatedHotspots,
    EvidenceType,
    getMyVariantInfoAnnotationsFromIndexedVariantAnnotations,
    IOncoKbData,
    Mutation,
    UniprotFeature,
    UniprotFeatureList,
    uniqueGenomicLocations,
} from 'cbioportal-utils';
import {
    generateProteinChangeQuery,
    generateAnnotateStructuralVariantQuery,
    StructuralVariantType,
} from 'oncokb-frontend-commons';
import {
    AnnotateMutationByProteinChangeQuery,
    AnnotateStructuralVariantQuery,
    CancerGene,
    OncoKbAPI,
    OncoKBInfo,
} from 'oncokb-ts-api-client';
import {
    EnsemblFilter,
    EnsemblTranscript,
    GenomeNexusAPI,
    GenomeNexusAPIInternal,
    GenomicLocation,
    Hotspot,
    PfamDomain,
    PostTranslationalModification,
    VariantAnnotation,
    MyVariantInfo,
} from 'genome-nexus-ts-api-client';

import { MutationMapperDataFetcher } from '../model/MutationMapperDataFetcher';
import {
    DEFAULT_MY_GENE_URL_TEMPLATE,
    DEFAULT_UNIPROT_ID_URL_TEMPLATE,
    fetchVariantAnnotationsIndexedByGenomicLocation,
    getUrl,
    initGenomeNexusClient,
    initGenomeNexusInternalClient,
    initOncoKbClient,
    ONCOKB_DEFAULT_DATA,
} from '../util/DataFetcherUtils';
import { CanonicalMutationType } from 'cbioportal-frontend-commons';

export interface MutationMapperDataFetcherConfig {
    myGeneUrlTemplate?: string;
    uniprotIdUrlTemplate?: string;
    mutationAlignerUrlTemplate?: string;
    cachePostMethodsOnClients?: boolean;
    apiCacheLimit?: number;
    genomeNexusUrl?: string;
    oncoKbUrl?: string;
}

export class DefaultMutationMapperDataFetcher
    implements MutationMapperDataFetcher {
    public oncoKbClient: OncoKbAPI;
    public genomeNexusClient: GenomeNexusAPI;
    public genomeNexusInternalClient: GenomeNexusAPIInternal;

    constructor(
        private config: MutationMapperDataFetcherConfig,
        genomeNexusClient?: Partial<GenomeNexusAPI>,
        genomeNexusInternalClient?: Partial<GenomeNexusAPIInternal>,
        oncoKbClient?: Partial<OncoKbAPI>
    ) {
        this.genomeNexusClient =
            (genomeNexusClient as GenomeNexusAPI) ||
            initGenomeNexusClient(
                config.genomeNexusUrl,
                config.cachePostMethodsOnClients,
                config.apiCacheLimit
            );
        this.genomeNexusInternalClient =
            (genomeNexusInternalClient as GenomeNexusAPIInternal) ||
            initGenomeNexusInternalClient(
                config.genomeNexusUrl,
                config.cachePostMethodsOnClients,
                config.apiCacheLimit
            );
        this.oncoKbClient =
            (oncoKbClient as OncoKbAPI) ||
            initOncoKbClient(
                config.oncoKbUrl,
                config.cachePostMethodsOnClients,
                config.apiCacheLimit
            );
    }

    public async fetchSwissProtAccession(entrezGeneId: number): Promise<any> {
        const myGeneData: Response = await request.get(
            getUrl(
                this.config.myGeneUrlTemplate || DEFAULT_MY_GENE_URL_TEMPLATE,
                { entrezGeneId }
            )
        );
        return JSON.parse(myGeneData.text).uniprot['Swiss-Prot'];
    }

    public async fetchUniprotId(swissProtAccession: string): Promise<string> {
        const uniprotData: Response = await request.get(
            getUrl(
                this.config.uniprotIdUrlTemplate ||
                    DEFAULT_UNIPROT_ID_URL_TEMPLATE,
                { swissProtAccession }
            )
        );
        return uniprotData.text.split('\n')[1];
    }

    public async fetchPfamDomainData(
        pfamAccessions: string[],
        client: GenomeNexusAPI = this.genomeNexusClient
    ): Promise<PfamDomain[]> {
        return await client.fetchPfamDomainsByPfamAccessionPOST({
            pfamAccessions: pfamAccessions,
        });
    }

    public async fetchVariantAnnotationsIndexedByGenomicLocation(
        mutations: Partial<Mutation>[],
        fields: string[] = ['annotation_summary'],
        isoformOverrideSource: string = 'mskcc',
        client: GenomeNexusAPI = this.genomeNexusClient
    ): Promise<{ [genomicLocation: string]: VariantAnnotation }> {
        return await fetchVariantAnnotationsIndexedByGenomicLocation(
            mutations,
            fields,
            isoformOverrideSource,
            client
        );
    }

    public async fetchMyVariantInfoAnnotationsIndexedByGenomicLocation(
        mutations: Partial<Mutation>[],
        isoformOverrideSource: string = 'mskcc',
        client: GenomeNexusAPI = this.genomeNexusClient
    ): Promise<{ [genomicLocation: string]: MyVariantInfo }> {
        const indexedVariantAnnotations = await fetchVariantAnnotationsIndexedByGenomicLocation(
            mutations,
            ['my_variant_info'],
            isoformOverrideSource,
            client
        );
        return getMyVariantInfoAnnotationsFromIndexedVariantAnnotations(
            indexedVariantAnnotations
        );
    }

    /*
     * Gets the canonical transcript. If there is none pick the transcript with max length.
     */
    public async fetchCanonicalTranscriptWithFallback(
        hugoSymbol: string,
        isoformOverrideSource: string,
        allTranscripts: EnsemblTranscript[] | undefined,
        client: GenomeNexusAPI = this.genomeNexusClient
    ): Promise<EnsemblTranscript | undefined> {
        return this.fetchCanonicalTranscript(
            hugoSymbol,
            isoformOverrideSource,
            client
        ).catch(() => {
            // get transcript with max protein length in given list of all transcripts
            const transcript = _.maxBy(
                allTranscripts,
                (t: EnsemblTranscript) => t.proteinLength
            );
            return transcript ? transcript : undefined;
        });
    }

    public async fetchCanonicalTranscript(
        hugoSymbol: string,
        isoformOverrideSource: string,
        client: GenomeNexusAPI = this.genomeNexusClient
    ): Promise<EnsemblTranscript> {
        return await client.fetchCanonicalEnsemblTranscriptByHugoSymbolGET({
            hugoSymbol,
            isoformOverrideSource,
        });
    }

    public async fetchEnsemblTranscriptsByEnsemblFilter(
        ensemblFilter: Partial<EnsemblFilter>,
        client: GenomeNexusAPI = this.genomeNexusClient
    ): Promise<EnsemblTranscript[] | undefined> {
        return await client.fetchEnsemblTranscriptsByEnsemblFilterPOST({
            ensemblFilter: Object.assign(
                // set default to empty array
                {
                    geneIds: [],
                    hugoSymbols: [],
                    proteinIds: [],
                    transcriptIds: [],
                },
                ensemblFilter
            ),
        });
    }

    public fetchPtmData(
        ensemblId: string,
        client: GenomeNexusAPI = this.genomeNexusClient
    ): Promise<PostTranslationalModification[]> {
        if (ensemblId) {
            return client.fetchPostTranslationalModificationsGET({
                ensemblTranscriptId: ensemblId,
            });
        } else {
            return Promise.resolve([]);
        }
    }

    public async fetchUniprotFeatures(
        swissProtId: string,
        category: string[],
        client: GenomeNexusAPI = this.genomeNexusClient
    ): Promise<UniprotFeature[]> {
        if (swissProtId) {
            // TODO for now fetching only PTM and TOPOLOGY features
            const uniprotData: Response = await request.get(
                getUrl(
                    `https://www.ebi.ac.uk/proteins/api/features/<%= uniprotAccession %>?categories=${category.join(
                        ','
                    )}`,
                    { uniprotAccession: swissProtId }
                )
            );

            const featureList: UniprotFeatureList = JSON.parse(
                uniprotData.text
            );
            return featureList.features;
        } else {
            return Promise.resolve([]);
        }
    }

    public fetchCancerHotspotData(
        ensemblId: string,
        client: GenomeNexusAPIInternal = this.genomeNexusInternalClient
    ): Promise<Hotspot[]> {
        if (ensemblId) {
            return client.fetchHotspotAnnotationByTranscriptIdGET({
                transcriptId: ensemblId,
            });
        } else {
            return Promise.resolve([]);
        }
    }

    public fetchAggregatedHotspotsData(
        mutations: Mutation[],
        client: GenomeNexusAPIInternal = this.genomeNexusInternalClient
    ): Promise<AggregatedHotspots[]> {
        // TODO filter out non-hotspot genes

        if (mutations.length === 0) {
            return Promise.resolve([]);
        }

        const genomicLocations: GenomicLocation[] = uniqueGenomicLocations(
            mutations
        );
        return client.fetchHotspotAnnotationByGenomicLocationPOST({
            genomicLocations: genomicLocations,
        });
    }

    public fetchOncoKbCancerGenes(
        client: OncoKbAPI = this.oncoKbClient
    ): Promise<CancerGene[]> {
        return client.utilsCancerGeneListGetUsingGET_1({});
    }

    public fetchOncoKbInfo(
        client: OncoKbAPI = this.oncoKbClient
    ): Promise<OncoKBInfo> {
        return client.infoGetUsingGET_1({});
    }

    public async fetchOncoKbData(
        mutations: Mutation[],
        annotatedGenes: { [entrezGeneId: number]: boolean } | Error,
        getTumorType: (mutation: Mutation) => string,
        getEntrezGeneId: (mutation: Mutation) => number,
        evidenceTypes?: EvidenceType[],
        client: OncoKbAPI = this.oncoKbClient
    ): Promise<IOncoKbData | Error> {
        if (annotatedGenes instanceof Error) {
            return new Error();
        } else if (mutations.length === 0) {
            return ONCOKB_DEFAULT_DATA;
        }

        const mutationsToQuery = _.filter(
            mutations,
            m =>
                (m.mutationType &&
                    m.mutationType.toLowerCase() ===
                        CanonicalMutationType.FUSION) ||
                !!annotatedGenes[getEntrezGeneId(m)]
        );

        return this.queryOncoKbData(
            mutationsToQuery,
            getTumorType,
            getEntrezGeneId,
            client,
            evidenceTypes
        );
    }

    public async queryOncoKbData(
        queryVariants: Mutation[],
        getTumorType: (mutation: Mutation) => string,
        getEntrezGeneId: (mutation: Mutation) => number,
        client: OncoKbAPI = this.oncoKbClient,
        evidenceTypes?: EvidenceType[]
    ) {
        const mutationQueryVariants: AnnotateMutationByProteinChangeQuery[] = _.uniqBy(
            _.map(
                queryVariants.filter(
                    mutation => mutation.mutationType !== 'Fusion'
                ),
                (mutation: Mutation) => {
                    return generateProteinChangeQuery(
                        getEntrezGeneId(mutation),
                        getTumorType(mutation),
                        mutation.proteinChange,
                        mutation.mutationType,
                        mutation.proteinPosStart,
                        mutation.proteinPosEnd,
                        evidenceTypes
                    );
                }
            ),
            'id'
        );

        const structuralQueryVariants: AnnotateStructuralVariantQuery[] = _.uniqBy(
            _.map(
                queryVariants.filter(
                    mutation =>
                        mutation.mutationType?.toUpperCase() ===
                        StructuralVariantType.FUSION
                ),
                (mutation: Mutation) => {
                    return generateAnnotateStructuralVariantQuery(
                        /* @ts-ignore */
                        mutation.structuralVariant,
                        getTumorType(mutation),
                        evidenceTypes
                    );
                }
            ),
            'id'
        );

        const mutationQueryResult =
            mutationQueryVariants.length === 0
                ? []
                : await client.annotateMutationsByProteinChangePostUsingPOST_1({
                      body: mutationQueryVariants,
                  });

        const structuralVariantQueryResult =
            structuralQueryVariants.length === 0
                ? []
                : await client.annotateStructuralVariantsPostUsingPOST_1({
                      body: structuralQueryVariants,
                  });

        return {
            // generateIdToIndicatorMap(oncokbSearch)
            indicatorMap: _.keyBy(
                mutationQueryResult.concat(structuralVariantQueryResult),
                indicator => indicator.query.id
            ),
        };
    }
}

export default DefaultMutationMapperDataFetcher;
