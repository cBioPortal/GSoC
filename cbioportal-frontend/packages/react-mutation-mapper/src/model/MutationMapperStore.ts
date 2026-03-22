import {
    Gene,
    ICivicGeneIndex,
    ICivicVariantIndex,
    IHotspotIndex,
    IOncoKbData,
    Mutation,
    PostTranslationalModification,
    RemoteData,
    UniprotTopology,
} from 'cbioportal-utils';
import {
    EnsemblTranscript,
    Hotspot,
    MyVariantInfo,
    PfamDomain,
    VariantAnnotation,
} from 'genome-nexus-ts-api-client';
import {
    CancerGene,
    IndicatorQueryResp,
    OncoKBInfo,
} from 'oncokb-ts-api-client';
import DataStore from './DataStore';

export interface MutationMapperStore<T extends Mutation> {
    gene: Gene;
    dataStore: DataStore;
    uniprotId: RemoteData<string | undefined>;
    activeTranscript?: RemoteData<string | undefined>;
    canonicalTranscript: RemoteData<EnsemblTranscript | undefined>;
    mutationData: RemoteData<Partial<T>[] | undefined>;
    pfamDomainData: RemoteData<PfamDomain[] | undefined>;
    allTranscripts: RemoteData<EnsemblTranscript[] | undefined>;
    transcriptsByTranscriptId: { [transcriptId: string]: EnsemblTranscript };
    mutationsByPosition: { [pos: number]: T[] };
    groupedMutationsByPosition: {
        group: string;
        mutations: { [pos: number]: T[] };
    }[];
    mutationCountsByProteinImpactType: { [proteinImpactType: string]: number };
    uniqueMutationCountsByPosition: { [pos: number]: number };
    uniqueGroupedMutationCountsByPosition: {
        group: string;
        counts: { [pos: number]: number };
    }[];
    ptmData: RemoteData<PostTranslationalModification[] | undefined>;
    ptmDataByProteinPosStart: RemoteData<
        { [pos: number]: PostTranslationalModification[] } | undefined
    >;
    ptmDataByTypeAndProteinPosStart: RemoteData<
        | {
              [type: string]: {
                  [position: number]: PostTranslationalModification[];
              };
          }
        | undefined
    >;
    uniprotTopologyData: RemoteData<UniprotTopology[] | undefined>;
    indexedHotspotData: RemoteData<IHotspotIndex | undefined>;
    hotspotsByPosition: { [pos: number]: Hotspot[] };
    oncoKbCancerGenes: RemoteData<CancerGene[] | Error | undefined>;
    oncoKbData: RemoteData<IOncoKbData | Error | undefined>;
    oncoKbDataByPosition: { [pos: number]: IndicatorQueryResp[] };
    oncoKbInfo: RemoteData<OncoKBInfo | undefined>;
    usingPublicOncoKbInstance: boolean;
    civicGenes?: RemoteData<ICivicGeneIndex | undefined>;
    civicVariants?: RemoteData<ICivicVariantIndex | undefined>;
    indexedVariantAnnotations: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >;
    indexedMyVariantInfoAnnotations?: RemoteData<
        { [genomicLocation: string]: MyVariantInfo } | undefined
    >;
    transcriptsWithAnnotations: RemoteData<string[] | undefined>;
    transcriptsWithProteinLength: RemoteData<string[] | undefined>;
    mutationsByTranscriptId: { [transcriptId: string]: T[] };
    ensemblTranscriptLookUp: RemoteData<any | Error | undefined>;
    genomeBuild: string;
    setSelectedTranscript?: (id: string | undefined) => void;
    getTranscriptId?: () => string | undefined;
    selectedTranscript?: string | undefined;
    ptmSources?: string[];
}

export default MutationMapperStore;
