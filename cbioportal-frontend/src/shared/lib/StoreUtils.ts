import _ from 'lodash';
import localForage from 'localforage';
import {
    fetchVariantAnnotationsByMutation as fetchDefaultVariantAnnotationsByMutation,
    fetchVariantAnnotationsIndexedByGenomicLocation as fetchDefaultVariantAnnotationsIndexedByGenomicLocation,
} from 'react-mutation-mapper';
import {
    CancerStudy,
    CBioPortalAPI,
    CBioPortalAPIInternal,
    ClinicalAttribute,
    ClinicalData,
    ClinicalDataMultiStudyFilter,
    ClinicalDataSingleStudyFilter,
    CopyNumberCountIdentifier,
    CopyNumberSeg,
    DiscreteCopyNumberData,
    DiscreteCopyNumberFilter,
    Gene,
    GenePanel,
    GenePanelData,
    GenePanelDataFilter,
    Gistic,
    GisticToGene,
    MolecularProfile,
    Mutation,
    MutationFilter,
    MutSig,
    NumericGeneMolecularData,
    ReferenceGenomeGene,
    Sample,
    SampleFilter,
    StructuralVariant,
} from 'cbioportal-ts-api-client';
import { getClient } from 'shared/api/cbioportalClientInstance';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import g2sClient from 'shared/api/g2sClientInstance';
import { MobxPromise, stringListToIndexSet } from 'cbioportal-frontend-commons';
import {
    Alignment,
    Genome2StructureAPI,
    GenomeNexusAPI,
} from 'genome-nexus-ts-api-client';
import oncokbClient from 'shared/api/oncokbClientInstance';
import genomeNexusClient from 'shared/api/genomeNexusClientInstance';
import {
    chunkCalls,
    EvidenceType,
    IHotspotIndex,
    IOncoKbData,
    isLinearClusterHotspot,
} from 'cbioportal-utils';
import {
    generateAnnotateStructuralVariantQuery,
    generateCopyNumberAlterationQuery,
    generateIdToIndicatorMap,
    generateProteinChangeQuery,
    generateQueryVariantId,
    OtherBiomarkersQueryType,
} from 'oncokb-frontend-commons';
import { getAlterationString } from 'shared/lib/CopyNumberUtils';
import { indexPdbAlignments } from 'shared/lib/PdbUtils';
import { IGisticData } from 'shared/model/Gistic';
import { IMutSigData } from 'shared/model/MutSig';
import {
    AlterationTypeConstants,
    CLINICAL_ATTRIBUTE_ID_ENUM,
    DataTypeConstants,
    GENOME_NEXUS_ARG_FIELD_ENUM,
} from 'shared/constants';
import { normalizeMutations } from '../components/mutationMapper/MutationMapperUtils';
import { getServerConfig } from 'config/config';
import {
    AnnotateCopyNumberAlterationQuery,
    AnnotateStructuralVariantQuery,
    CancerGene,
    IndicatorQueryResp,
    OncoKbAPI,
    OncoKBInfo,
} from 'oncokb-ts-api-client';
import { REFERENCE_GENOME } from './referenceGenomeUtils';
import {
    getSurvivalAttributes,
    RESERVED_SURVIVAL_PLOT_PRIORITY,
} from '../../pages/resultsView/survival/SurvivalUtil';
import request from 'superagent';
import { MUTCommand, SingleGeneQuery } from './oql/oql-parser';
import {
    annotateMolecularDatum,
    annotateMutationPutativeDriver,
    FilteredAndAnnotatedDiscreteCNAReport,
    ONCOKB_ONCOGENIC_LOWERCASE,
} from 'pages/resultsView/ResultsViewPageStoreUtils';
import { ASCNAttributes } from 'shared/enums/ASCNEnums';
import {
    hasASCNProperty,
    isNotGermlineMutation,
} from 'shared/lib/MutationUtils';
import { ObservableMap } from 'mobx';

import { ErrorMessages } from 'shared/errorMessages';
import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';
import { FilteredAndAnnotatedMutationsReport } from './comparison/AnalysisStoreUtils';
import {
    CustomDriverFilterEvent,
    DriverInfo,
    DriverInfoWithHotspots,
    HotSpotInfo,
} from 'shared/model/CustomDriverAnnotationInfo';
import { AnnotatedNumericGeneMolecularData } from 'shared/model/AnnotatedNumericGeneMolecularData';
import { EnsemblFilter } from 'genome-nexus-ts-api-client';

export const MolecularAlterationType_filenameSuffix: {
    [K in MolecularProfile['molecularAlterationType']]?: string;
} = {
    MUTATION_EXTENDED: 'mutations',
    COPY_NUMBER_ALTERATION: 'cna',
    MRNA_EXPRESSION: 'mrna',
    METHYLATION: 'methylation',
    METHYLATION_BINARY: 'methylation',
    PROTEIN_LEVEL: 'rppa',
    STRUCTURAL_VARIANT: 'structural_variants',
};

export const ONCOKB_DEFAULT: IOncoKbData = {
    indicatorMap: {},
};

export const GenePanelIdSpecialValue = {
    UNKNOWN: undefined,
    WHOLE_EXOME_SEQ: 'WES',
    WHOLE_GENOME_SEQ: 'WGS',
};

export function noGenePanelUsed(genePanelId: string | undefined): boolean {
    return (
        genePanelId === GenePanelIdSpecialValue.UNKNOWN ||
        genePanelId === GenePanelIdSpecialValue.WHOLE_EXOME_SEQ ||
        genePanelId === GenePanelIdSpecialValue.WHOLE_GENOME_SEQ
    );
}

export type MutationIdGenerator = (mutation: Mutation) => string;

export interface IDataQueryFilter {
    sampleIds?: string[];
    sampleListId?: string;
}

export async function fetchMutationData(
    mutationFilter: MutationFilter,
    molecularProfileId?: string,
    client: CBioPortalAPI = getClient()
) {
    if (molecularProfileId) {
        return await client.fetchMutationsInMolecularProfileUsingPOST({
            molecularProfileId,
            mutationFilter,
            projection: 'DETAILED',
        });
    } else {
        return [];
    }
}

export async function fetchVariantAnnotationsByMutation(
    mutations: Mutation[],
    fields: string[] = [GENOME_NEXUS_ARG_FIELD_ENUM.ANNOTATION_SUMMARY],
    isoformOverrideSource: string = 'mskcc',
    client: GenomeNexusAPI = genomeNexusClient
) {
    return fetchDefaultVariantAnnotationsByMutation(
        normalizeMutations(mutations),
        fields,
        isoformOverrideSource,
        client
    );
}

export async function fetchVariantAnnotationsIndexedByGenomicLocation(
    mutations: Mutation[],
    fields: string[] = [GENOME_NEXUS_ARG_FIELD_ENUM.ANNOTATION_SUMMARY],
    isoformOverrideSource: string = 'mskcc',
    client: GenomeNexusAPI = genomeNexusClient
) {
    return fetchDefaultVariantAnnotationsIndexedByGenomicLocation(
        normalizeMutations(mutations),
        fields,
        isoformOverrideSource,
        client
    );
}

export async function fetchGenes(
    hugoGeneSymbols?: string[],
    client: CBioPortalAPI = getClient()
) {
    if (hugoGeneSymbols && hugoGeneSymbols.length) {
        const order = stringListToIndexSet(hugoGeneSymbols);
        return _.sortBy(
            await client.fetchGenesUsingPOST({
                geneIdType: 'HUGO_GENE_SYMBOL',
                geneIds: hugoGeneSymbols.slice(),
                projection: 'SUMMARY',
            }),
            (gene: Gene) => order[gene.hugoGeneSymbol]
        );
    } else {
        return [];
    }
}

export function getAllGenes(client: CBioPortalAPI = getClient()) {
    return client.getAllGenesUsingGET({
        projection: 'SUMMARY',
    });
}

export async function fetchReferenceGenomeGenes(
    genomeName: string,
    hugoGeneSymbols?: string[],
    client: CBioPortalAPIInternal = internalClient
) {
    if (hugoGeneSymbols && hugoGeneSymbols.length) {
        const order = stringListToIndexSet(hugoGeneSymbols);
        return _.sortBy(
            await client.fetchReferenceGenomeGenesUsingPOST({
                genomeName: genomeName,
                geneIds: hugoGeneSymbols.slice(),
            }),
            (gene: ReferenceGenomeGene) => order[gene.hugoGeneSymbol]
        );
    } else {
        return [];
    }
}

export async function fetchAllReferenceGenomeGenes(
    genomeName: string,
    client: CBioPortalAPIInternal = internalClient
) {
    const doCaching = /\.cbioportal\.org|netlify\.app/.test(
        window.location.hostname
    );

    // allows us to clear cache when data changes
    const referenceGenomeKey = `referenceGenome-${
        getServerConfig().referenceGenomeVersion
    }`;

    const hg19cached = doCaching
        ? await localForage.getItem(referenceGenomeKey)
        : false;

    if (doCaching) {
        if (hg19cached) {
            console.info('using locally cached reference genome data');
            return hg19cached as ReferenceGenomeGene[];
        } else {
            return await client
                .getAllReferenceGenomeGenesUsingGET({
                    genomeName: genomeName,
                })
                .then(d => {
                    // this is async, but we can fire and forget
                    localForage.setItem(referenceGenomeKey, d);
                    return d;
                });
        }
    } else {
        if (genomeName) {
            return await client.getAllReferenceGenomeGenesUsingGET({
                genomeName: genomeName,
            });
        } else {
            return [];
        }
    }
}

export async function fetchEnsemblTranscriptsByEnsemblFilter(
    ensemblFilter: Partial<EnsemblFilter>,
    client: GenomeNexusAPI = genomeNexusClient
) {
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

export async function fetchPdbAlignmentData(
    ensemblId: string,
    client: Genome2StructureAPI = g2sClient
) {
    if (ensemblId) {
        return await client.getAlignmentUsingGET({
            idType: 'ensembl',
            id: ensemblId,
        });
    } else {
        return [];
    }
}

export async function fetchCanonicalTranscripts(
    hugoSymbols: string[],
    isoformOverrideSource: string,
    client: GenomeNexusAPI = genomeNexusClient
) {
    return await client.fetchCanonicalEnsemblTranscriptsByHugoSymbolsPOST({
        hugoSymbols,
        isoformOverrideSource,
    });
}

export async function getCanonicalTranscriptsByHugoSymbol(
    hugoSymbols: string[],
    isoformOverrideSource: string,
    client: GenomeNexusAPI = genomeNexusClient
) {
    const transcripts = await fetchCanonicalTranscripts(
        hugoSymbols,
        isoformOverrideSource,
        client
    );
    return transcripts ? _.zipObject(hugoSymbols, transcripts) : undefined;
}

export async function fetchCanonicalEnsemblGeneIds(
    hugoSymbols: string[],
    isoformOverrideSource: string,
    client: GenomeNexusAPI = genomeNexusClient
) {
    // TODO: this endpoint should accept isoformOverrideSource
    return await client.fetchCanonicalEnsemblGeneIdByHugoSymbolsPOST({
        hugoSymbols,
    });
}

export async function fetchClinicalData(
    clinicalDataMultiStudyFilter: ClinicalDataMultiStudyFilter,
    client: CBioPortalAPI = getClient()
) {
    if (clinicalDataMultiStudyFilter) {
        return await client.fetchClinicalDataUsingPOST({
            clinicalDataType: 'SAMPLE',
            clinicalDataMultiStudyFilter: clinicalDataMultiStudyFilter,
            projection: 'DETAILED',
        });
    } else {
        return [];
    }
}

export async function fetchClinicalDataInStudy(
    studyId: string,
    clinicalDataSingleStudyFilter: ClinicalDataSingleStudyFilter,
    clinicalDataType: 'SAMPLE' | 'PATIENT',
    client: CBioPortalAPI = getClient()
) {
    if (clinicalDataSingleStudyFilter) {
        return await client.fetchAllClinicalDataInStudyUsingPOST({
            studyId: studyId,
            clinicalDataType: clinicalDataType,
            clinicalDataSingleStudyFilter: clinicalDataSingleStudyFilter,
            projection: 'SUMMARY',
        });
    } else {
        return [];
    }
}

export async function fetchClinicalDataForPatient(
    studyId: string,
    patientId: string,
    client: CBioPortalAPI = getClient()
) {
    if (studyId && patientId) {
        return await client.getAllClinicalDataOfPatientInStudyUsingGET({
            projection: 'DETAILED',
            studyId,
            patientId,
        });
    } else {
        return [];
    }
}

export async function fetchCopyNumberSegments(
    studyId: string,
    sampleIds: string[],
    client: CBioPortalAPI = getClient()
) {
    if (studyId && sampleIds.length > 0) {
        return await client.fetchCopyNumberSegmentsUsingPOST({
            sampleIdentifiers: sampleIds.map((sampleId: string) => ({
                sampleId,
                studyId,
            })),
            projection: 'DETAILED',
        });
    } else {
        return [];
    }
}

export function fetchCopyNumberSegmentsForSamples(
    samples: Sample[],
    chromosome?: string,
    client: CBioPortalAPI = getClient()
): Promise<CopyNumberSeg[]> {
    if (samples.length > 0) {
        return client.fetchCopyNumberSegmentsUsingPOST({
            sampleIdentifiers: samples.map(sample => ({
                sampleId: sample.sampleId,
                studyId: sample.studyId,
            })),
            chromosome,
            projection: 'DETAILED',
        });
    } else {
        return Promise.resolve([]);
    }
}

export async function fetchSamplesForPatient(
    studyId: string,
    patientId?: string,
    sampleId?: string,
    client: CBioPortalAPI = getClient()
) {
    if (studyId && patientId) {
        return await client.getAllSamplesOfPatientInStudyUsingGET({
            studyId,
            patientId,
            projection: 'DETAILED',
        });
    } else if (studyId && sampleId) {
        return await client
            .getSampleInStudyUsingGET({
                studyId,
                sampleId,
            })
            .then((data: Sample) => [data]);
    } else {
        return [];
    }
}

export async function fetchSamples(
    sampleIds: MobxPromise<string[]>,
    studyId: string,
    client: CBioPortalAPI = getClient()
) {
    if (sampleIds.result && sampleIds.result.length > 0 && studyId) {
        const sampleIdentifiers = sampleIds.result.map((sampleId: string) => ({
            sampleId,
            studyId,
        }));

        return await client.fetchSamplesUsingPOST({
            sampleFilter: {
                sampleIdentifiers,
            } as SampleFilter,
        });
    } else {
        return [];
    }
}

export async function fetchGermlineConsentedSamples(
    studyIds: MobxPromise<string[]>,
    studiesWithGermlineConsentedSamples?: string[],
    client: CBioPortalAPI = getClient()
) {
    // no valid config param => feature disabled
    if (!studiesWithGermlineConsentedSamples || !studyIds.result) {
        return [];
    }

    // query API only for the studies provided with the config param

    const studies: string[] = studyIds.result.filter(studyId =>
        _.find(
            studiesWithGermlineConsentedSamples,
            element => element === studyId
        )
    );

    if (studies.length > 0) {
        const ids: string[][] = await Promise.all(
            studies.map(studyId => {
                return client.getAllSampleIdsInSampleListUsingGET({
                    sampleListId: getGermlineSampleListId(studyId),
                });
            })
        );

        return _.flatten(
            ids.map((sampleIds: string[], index: number) => {
                const studyId = studies[index];
                return sampleIds.map(sampleId => ({ sampleId, studyId }));
            })
        );
    } else {
        return [];
    }
}

export function getGermlineSampleListId(studyId: string): string {
    return `${studyId}_germline`;
}

export function findSampleIdsWithCancerTypeClinicalData(
    clinicalDataForSamples: MobxPromise<ClinicalData[]>
): { [uniqueSampleKey: string]: boolean } {
    const samplesWithClinicalData: { [sampleId: string]: boolean } = {};

    if (clinicalDataForSamples.result) {
        _.each(clinicalDataForSamples.result, (clinicalData: ClinicalData) => {
            if (
                clinicalData.clinicalAttributeId === 'CANCER_TYPE_DETAILED' ||
                clinicalData.clinicalAttributeId === 'CANCER_TYPE'
            ) {
                samplesWithClinicalData[clinicalData.uniqueSampleKey] = true;
            }
        });
    }

    return samplesWithClinicalData;
}

export function findSamplesWithoutCancerTypeClinicalData(
    samples: MobxPromise<Sample[]>,
    clinicalDataForSamples: MobxPromise<ClinicalData[]>
): Sample[] {
    if (
        samples.result &&
        samples.result.length > 0 &&
        clinicalDataForSamples.result
    ) {
        const samplesWithClinicalData = findSampleIdsWithCancerTypeClinicalData(
            clinicalDataForSamples
        );

        return _.filter(samples.result, (sample: Sample) => {
            return samplesWithClinicalData[sample.uniqueSampleKey] !== true;
        });
    } else {
        return [];
    }
}

export async function fetchSamplesWithoutCancerTypeClinicalData(
    sampleIds: MobxPromise<string[]>,
    studyId: string,
    clinicalDataForSamples: MobxPromise<ClinicalData[]>,
    client: CBioPortalAPI = getClient()
) {
    let samples: Sample[] = [];

    if (
        sampleIds.result &&
        sampleIds.result.length > 0 &&
        clinicalDataForSamples.result
    ) {
        const samplesWithClinicalData = findSampleIdsWithCancerTypeClinicalData(
            clinicalDataForSamples
        );

        const sampleIdsWithoutClinicalData = _.filter(
            sampleIds.result,
            (sampleId: string) => {
                return samplesWithClinicalData[sampleId] !== true;
            }
        );

        const sampleIdentifierForSamplesWithoutClinicalData = sampleIdsWithoutClinicalData.map(
            sampleId => ({ sampleId, studyId })
        );

        if (sampleIdentifierForSamplesWithoutClinicalData.length > 0) {
            samples = await client.fetchSamplesUsingPOST({
                sampleFilter: {
                    sampleIdentifiers: sampleIdentifierForSamplesWithoutClinicalData,
                } as SampleFilter,
            });
        }
    }

    return samples;
}

export async function fetchStudiesForSamplesWithoutCancerTypeClinicalData(
    samplesWithoutClinicalData: MobxPromise<Sample[]>,
    client: CBioPortalAPI = getClient()
) {
    let studies: CancerStudy[] = [];

    if (
        samplesWithoutClinicalData.result &&
        samplesWithoutClinicalData.result.length > 0
    ) {
        const studyIdsForSamplesWithoutClinicalData = _.uniq(
            samplesWithoutClinicalData.result.map(
                (sample: Sample) => sample.studyId
            )
        );

        studies = await client.fetchStudiesUsingPOST({
            studyIds: studyIdsForSamplesWithoutClinicalData,
            projection: 'DETAILED',
        });
    }

    return studies;
}

export async function fetchMutSigData(
    studyId: string,
    client: CBioPortalAPIInternal = internalClient
) {
    const mutSigdata = await client.getSignificantlyMutatedGenesUsingGET({
        studyId,
    });

    const byEntrezGeneId: IMutSigData = mutSigdata.reduce(
        (map: IMutSigData, next: MutSig) => {
            map[next.entrezGeneId] = { qValue: next.qValue };
            return map;
        },
        {}
    );

    return byEntrezGeneId;
}

export async function fetchGisticData(
    studyId: string,
    client: CBioPortalAPIInternal = internalClient
) {
    if (studyId) {
        const gisticData = await client.getSignificantCopyNumberRegionsUsingGET(
            { studyId }
        );

        // generate a map of <entrezGeneId, IGisticSummary[]> pairs
        return gisticData.reduce((map: IGisticData, gistic: Gistic) => {
            gistic.genes.forEach((gene: GisticToGene) => {
                if (map[gene.entrezGeneId] === undefined) {
                    map[gene.entrezGeneId] = [];
                }

                // we may have more than one entry for a gene, so using array
                map[gene.entrezGeneId].push({
                    amp: gistic.amp,
                    qValue: gistic.qValue,
                    peakGeneCount: gistic.genes.length,
                });
            });

            return map;
        }, {});
    } else {
        return {};
    }
}

export async function fetchCopyNumberData(
    discreteCNAData: MobxPromise<DiscreteCopyNumberData[]>,
    molecularProfileIdDiscrete: MobxPromise<string>,
    client: CBioPortalAPIInternal = internalClient
) {
    const copyNumberCountIdentifiers: CopyNumberCountIdentifier[] = discreteCNAData.result
        ? discreteCNAData.result.map((cnData: DiscreteCopyNumberData) => {
              return {
                  alteration: cnData.alteration,
                  entrezGeneId: cnData.entrezGeneId,
              };
          })
        : [];

    if (
        molecularProfileIdDiscrete.result &&
        copyNumberCountIdentifiers.length > 0
    ) {
        return await client.fetchCopyNumberCountsUsingPOST({
            molecularProfileId: molecularProfileIdDiscrete.result,
            copyNumberCountIdentifiers,
        });
    } else {
        return [];
    }
}

export async function fetchGenePanelData(
    molecularProfileId: string,
    sampleIds: string[] = [],
    sampleListId: string = ''
): Promise<{ [sampleId: string]: GenePanelData }> {
    const filter: any = {};
    if (sampleIds.length > 0) {
        filter.sampleIds = sampleIds;
    }
    if (sampleListId.length > 0) {
        filter.sampleListId = sampleListId;
    }
    const remoteData = await getClient().getGenePanelDataUsingPOST({
        molecularProfileId,
        genePanelDataFilter: filter as GenePanelDataFilter,
    });
    return _.keyBy(remoteData, genePanelData => genePanelData.sampleId);
}

export async function fetchGenePanel(
    genePanelIds: string[]
): Promise<{ [genePanelId: string]: GenePanel }> {
    const genePanels: { [genePanelId: string]: GenePanel } = {};
    const uniquePanelIds = _.uniq(genePanelIds);
    const remoteData = await Promise.all(
        _.map(
            uniquePanelIds,
            async genePanelId =>
                await getClient().getGenePanelUsingGET({ genePanelId })
        )
    );
    return _.keyBy(remoteData, genePanel => genePanel.genePanelId);
}

export async function fetchOncoKbCancerGenes(
    client: OncoKbAPI = oncokbClient
): Promise<CancerGene[]> {
    return await client.utilsCancerGeneListGetUsingGET_1({}).catch(d => {
        return d;
    });
}

export async function fetchOncoKbInfo(
    client: OncoKbAPI = oncokbClient
): Promise<OncoKBInfo> {
    return await client.infoGetUsingGET_1({}).catch(d => {
        return d;
    });
}

export async function fetchOncoKbData(
    uniqueSampleKeyToTumorType: { [uniqueSampleKey: string]: string },
    annotatedGenes: { [entrezGeneId: number]: boolean } | Error,
    mutationData: MobxPromise<Mutation[]>,
    evidenceTypes?: string,
    uncalledMutationData?: MobxPromise<Mutation[]>,
    client: OncoKbAPI = oncokbClient
) {
    const mutationDataResult = concatMutationData(
        mutationData,
        uncalledMutationData
    );

    if (annotatedGenes instanceof Error) {
        return new Error();
    } else if (mutationDataResult.length === 0) {
        return ONCOKB_DEFAULT;
    }

    const mutationsToQuery = _.filter(
        mutationDataResult,
        m =>
            m.mutationType === fusionMutationType ||
            !!annotatedGenes[m.entrezGeneId]
    );

    return queryOncoKbData(
        mutationsToQuery.map(mutation => {
            return {
                entrezGeneId: mutation.entrezGeneId,
                alteration: mutation.proteinChange,
                proteinPosStart: mutation.proteinPosStart,
                proteinPosEnd: mutation.proteinPosEnd,
                mutationType: mutation.mutationType,
                tumorType: cancerTypeForOncoKb(
                    mutation.uniqueSampleKey,
                    uniqueSampleKeyToTumorType
                ),
            };
        }),
        client
    );
}

export async function fetchCnaOncoKbData(
    uniqueSampleKeyToTumorType: { [uniqueSampleKey: string]: string },
    annotatedGenes: { [entrezGeneId: number]: boolean },
    discreteCNAData: MobxPromise<DiscreteCopyNumberData[]>,
    client: OncoKbAPI = oncokbClient
) {
    if (!discreteCNAData.result || discreteCNAData.result.length === 0) {
        return ONCOKB_DEFAULT;
    } else {
        const alterationsToQuery = _.filter(
            discreteCNAData.result,
            d => !!annotatedGenes[d.gene.entrezGeneId]
        );
        const queryVariants = _.uniqBy(
            _.map(
                alterationsToQuery,
                (copyNumberData: DiscreteCopyNumberData) => {
                    return generateCopyNumberAlterationQuery(
                        copyNumberData.gene.entrezGeneId,
                        cancerTypeForOncoKb(
                            copyNumberData.uniqueSampleKey,
                            uniqueSampleKeyToTumorType
                        ),
                        getAlterationString(copyNumberData.alteration)
                    );
                }
            ).filter(query => query.copyNameAlterationType),
            'id'
        );
        return queryOncoKbCopyNumberAlterationData(queryVariants, client);
    }
}

export async function fetchStructuralVariantOncoKbData(
    uniqueSampleKeyToTumorType: { [uniqueSampleKey: string]: string },
    annotatedGenes: { [entrezGeneId: number]: boolean },
    structuralVariantData: MobxPromise<StructuralVariant[]>,
    client: OncoKbAPI = oncokbClient
) {
    if (
        !structuralVariantData.result ||
        structuralVariantData.result.length === 0
    ) {
        return ONCOKB_DEFAULT;
    } else {
        const alterationsToQuery = _.filter(
            structuralVariantData.result,
            d =>
                (d.site1EntrezGeneId || d.site2EntrezGeneId) &&
                (!!annotatedGenes[d.site1EntrezGeneId] ||
                    !!annotatedGenes[d.site2EntrezGeneId])
        );
        const queryVariants = _.uniqBy(
            _.map(alterationsToQuery, datum => {
                return generateAnnotateStructuralVariantQuery(
                    datum,
                    cancerTypeForOncoKb(
                        datum.uniqueSampleKey,
                        uniqueSampleKeyToTumorType
                    )
                );
            }),
            datum => datum.id
        );
        return fetchOncoKbStructuralVariantData(queryVariants, client);
    }
}

export async function fetchCnaOncoKbDataWithNumericGeneMolecularData(
    uniqueSampleKeyToTumorType: { [uniqueSampleKey: string]: string },
    annotatedGenes: { [entrezGeneId: number]: boolean },
    cnaMolecularData: MobxPromise<NumericGeneMolecularData[]>,
    evidenceTypes?: string,
    client: OncoKbAPI = oncokbClient
) {
    if (!cnaMolecularData.result || cnaMolecularData.result.length === 0) {
        return ONCOKB_DEFAULT;
    } else {
        const queryVariants = _.uniqBy(
            _.map(
                cnaMolecularData.result!,
                (datum: NumericGeneMolecularData) => {
                    return generateCopyNumberAlterationQuery(
                        datum.entrezGeneId,
                        cancerTypeForOncoKb(
                            datum.uniqueSampleKey,
                            uniqueSampleKeyToTumorType
                        ),
                        getAlterationString(datum.value)
                    );
                }
            ).filter(query => query.copyNameAlterationType),
            (query: AnnotateCopyNumberAlterationQuery) => query.id
        );
        return queryOncoKbCopyNumberAlterationData(queryVariants, client);
    }
}

export function cancerTypeForOncoKb(
    uniqueSampleKey: string,
    uniqueSampleKeyToTumorType: { [uniqueSampleKey: string]: string }
): string | null {
    // first priority is sampleIdToTumorType map (derived either from the clinical data or from the study cancer type).
    // if it is not valid, then we return an empty string and let OncoKB API figure out what to do
    return uniqueSampleKeyToTumorType[uniqueSampleKey] || null;
}

export type OncoKbAnnotationQuery = {
    entrezGeneId: number;
    mutationType?: string;
    alteration: string;
    proteinPosStart?: number;
    proteinPosEnd?: number;
    tumorType: string | null;
};

const fusionMutationType = 'Fusion';
export async function queryOncoKbData(
    annotationQueries: OncoKbAnnotationQuery[],
    client: OncoKbAPI = oncokbClient,
    evidenceTypes?: EvidenceType[]
) {
    const mutationQueryVariants = _.uniqBy(
        _.map(
            annotationQueries.filter(
                mutation => mutation.mutationType !== fusionMutationType
            ),
            (mutation: OncoKbAnnotationQuery) => {
                return generateProteinChangeQuery(
                    mutation.entrezGeneId,
                    mutation.tumorType,
                    mutation.alteration,
                    mutation.mutationType,
                    mutation.proteinPosStart,
                    mutation.proteinPosEnd,
                    evidenceTypes
                );
            }
        ),
        'id'
    );

    const mutationQueryResult: IndicatorQueryResp[] = await chunkCalls(
        chunk =>
            client.annotateMutationsByProteinChangePostUsingPOST_1({
                body: chunk,
            }),
        mutationQueryVariants,
        250
    );

    const oncoKbData: IOncoKbData = {
        indicatorMap: generateIdToIndicatorMap(mutationQueryResult),
    };

    return oncoKbData;
}

export async function queryOncoKbCopyNumberAlterationData(
    queryVariants: AnnotateCopyNumberAlterationQuery[],
    client: OncoKbAPI = oncokbClient
) {
    const oncokbSearch =
        queryVariants.length === 0
            ? []
            : await client.annotateCopyNumberAlterationsPostUsingPOST_1({
                  body: queryVariants,
              });

    return toOncoKbData(oncokbSearch);
}

export async function fetchOncoKbStructuralVariantData(
    queryVariants: AnnotateStructuralVariantQuery[],
    client: OncoKbAPI = oncokbClient
) {
    const oncokbSearch =
        queryVariants.length === 0
            ? []
            : await client.annotateStructuralVariantsPostUsingPOST_1({
                  body: queryVariants,
              });

    return toOncoKbData(oncokbSearch);
}

function toOncoKbData(indicatorQueryResps: IndicatorQueryResp[]): IOncoKbData {
    return {
        indicatorMap: generateIdToIndicatorMap(indicatorQueryResps),
    };
}

export async function fetchDiscreteCNAData(
    discreteCopyNumberFilter: DiscreteCopyNumberFilter,
    molecularProfileIdDiscrete: MobxPromise<string>,
    client: CBioPortalAPI = getClient()
) {
    if (
        molecularProfileIdDiscrete.isComplete &&
        molecularProfileIdDiscrete.result
    ) {
        return await client.fetchDiscreteCopyNumbersInMolecularProfileUsingPOST(
            {
                projection: 'DETAILED',
                discreteCopyNumberFilter,
                molecularProfileId: molecularProfileIdDiscrete.result,
            }
        );
    } else {
        return [];
    }
}

export function findDiscreteMolecularProfile(
    molecularProfilesInStudy: MobxPromise<MolecularProfile[]>
) {
    if (!molecularProfilesInStudy.result) {
        return undefined;
    }

    return molecularProfilesInStudy.result.find((p: MolecularProfile) => {
        return p.datatype === DataTypeConstants.DISCRETE;
    });
}

export function findMolecularProfileIdDiscrete(
    molecularProfilesInStudy: MobxPromise<MolecularProfile[]>
) {
    const profile = findDiscreteMolecularProfile(molecularProfilesInStudy);

    return profile ? profile.molecularProfileId : undefined;
}

export function isMutationProfile(profile: MolecularProfile): boolean {
    return profile.molecularAlterationType === 'MUTATION_EXTENDED';
}

export function findMutationMolecularProfile(
    molecularProfilesInStudy: MobxPromise<MolecularProfile[]>,
    studyId: string,
    type: string
) {
    if (!molecularProfilesInStudy.result) {
        return undefined;
    }

    const profile = molecularProfilesInStudy.result!.find(
        (profile: MolecularProfile) => profile.molecularAlterationType === type
    );

    return profile;
}

export function findUncalledMutationMolecularProfileId(
    molecularProfilesInStudy: MobxPromise<MolecularProfile[]>,
    studyId: string
) {
    const profile = findMutationMolecularProfile(
        molecularProfilesInStudy,
        studyId,
        AlterationTypeConstants.MUTATION_UNCALLED
    );
    if (profile) {
        return profile.molecularProfileId;
    } else {
        return undefined;
    }
}

export function findMrnaRankMolecularProfileId(
    molecularProfilesInStudy: string[]
) {
    const regex1 = /^.+rna_seq.*_zscores$/i; // We prefer profiles that look like this
    const preferredProfileId:
        | string
        | undefined = molecularProfilesInStudy.find(profileId =>
        regex1.test(profileId)
    );

    return preferredProfileId || null;
}

export function generateUniqueSampleKeyToTumorTypeMap(
    clinicalDataForSamples: MobxPromise<ClinicalData[]>,
    studies?: MobxPromise<CancerStudy[]>,
    samples?: MobxPromise<Sample[]>,
    useCancerTypeAttribute?: boolean
): { [sampleId: string]: string } {
    const map: { [sampleId: string]: string } = {};

    if (clinicalDataForSamples.result) {
        // if useCancerTypeAttribute is true, use CANCER_TYPE in clinical data
        // else, use CANCER_TYPE_DETAILED in clinical data
        if (useCancerTypeAttribute) {
            _.each(
                clinicalDataForSamples.result,
                (clinicalData: ClinicalData) => {
                    if (clinicalData.clinicalAttributeId === 'CANCER_TYPE') {
                        map[clinicalData.uniqueSampleKey] = clinicalData.value;
                    }
                }
            );
        } else {
            _.each(
                clinicalDataForSamples.result,
                (clinicalData: ClinicalData) => {
                    if (
                        clinicalData.clinicalAttributeId ===
                        'CANCER_TYPE_DETAILED'
                    ) {
                        map[clinicalData.uniqueSampleKey] = clinicalData.value;
                    }
                }
            );
        }
    }

    // last resort: fall back to the study cancer type
    if (studies && studies.result && samples && samples.result) {
        const studyIdToCancerType = makeStudyToCancerTypeMap(studies.result);

        _.each(samples.result, (sample: Sample) => {
            if (map[sample.uniqueSampleKey] === undefined) {
                map[sample.uniqueSampleKey] =
                    studyIdToCancerType[sample.studyId];
            }
        });
    }

    return map;
}

export function mergeDiscreteCNAData(
    discreteCNAData: MobxPromise<DiscreteCopyNumberData[]>
) {
    const idToCNAs: { [key: string]: DiscreteCopyNumberData[] } = {};

    if (discreteCNAData.result) {
        for (const d of discreteCNAData.result) {
            const cnaId: string = `${d.entrezGeneId}_${d.alteration}`;
            idToCNAs[cnaId] = idToCNAs[cnaId] || [];
            idToCNAs[cnaId].push(d);
        }
    }

    return Object.keys(idToCNAs).map((id: string) => idToCNAs[id]);
}

export function mergeMutations(
    mutationData: Mutation[],
    generateMutationId: MutationIdGenerator = generateMutationIdByGeneAndProteinChangeAndEvent
) {
    const idToMutations: { [key: string]: Mutation[] } = {};

    updateIdToMutationsMap(
        idToMutations,
        mutationData,
        generateMutationId,
        false
    );

    return Object.keys(idToMutations).map((id: string) => idToMutations[id]);
}

export function indexPdbAlignmentData(alignmentData: MobxPromise<Alignment[]>) {
    return indexPdbAlignments(alignmentData.result || []);
}

export function mergeMutationsIncludingUncalled(
    mutationData: MobxPromise<Mutation[]>,
    uncalledMutationData: MobxPromise<Mutation[]>,
    generateMutationId: MutationIdGenerator = generateMutationIdByGeneAndProteinChangeAndEvent
) {
    const idToMutations: { [key: string]: Mutation[] } = {};

    updateIdToMutationsMap(
        idToMutations,
        mutationData.result,
        generateMutationId,
        false
    );
    updateIdToMutationsMap(
        idToMutations,
        uncalledMutationData.result,
        generateMutationId,
        true
    );

    return Object.keys(idToMutations).map((id: string) => idToMutations[id]);
}

function updateIdToMutationsMap(
    idToMutations: { [key: string]: Mutation[] },
    mutationData: Mutation[] | undefined,
    generateMutationId: MutationIdGenerator = generateMutationIdByGeneAndProteinChangeAndEvent,
    onlyUpdateExistingIds: boolean
) {
    if (mutationData) {
        for (const mutation of mutationData) {
            const mutationId = generateMutationId(mutation);
            if (!onlyUpdateExistingIds || mutationId in idToMutations) {
                idToMutations[mutationId] = idToMutations[mutationId] || [];
                idToMutations[mutationId].push(mutation);
            }
        }
    }
}

export function concatMutationData(
    mutationData?: MobxPromise<Mutation[]>,
    uncalledMutationData?: MobxPromise<Mutation[]>
): Mutation[] {
    const mutationDataResult: Mutation[] =
        mutationData && mutationData.result ? mutationData.result : [];

    const uncalledMutationDataResult: Mutation[] =
        uncalledMutationData && uncalledMutationData.result
            ? uncalledMutationData.result
            : [];

    return mutationDataResult.concat(uncalledMutationDataResult);
}

function mutationEventFields(m: Mutation) {
    return [
        m.chr,
        m.startPosition,
        m.endPosition,
        m.referenceAllele,
        m.variantAllele,
    ];
}

export function generateMutationIdByEvent(m: Mutation): string {
    return mutationEventFields(m).join('_');
}

export function generateStructuralVariantId(s: StructuralVariant): string {
    // NOTE: We need to sort because
    // data contains inconsistent ordering of
    // site1 and site2
    // we want to treat either ordering as the same variant
    return [
        s.site1HugoSymbol,
        s.site2HugoSymbol,
        s.site1Position,
        s.site2Position,
        s.site1Chromosome,
        s.site2Chromosome,
        s.variantClass,
    ]
        .sort()
        .join('_');
}

export function generateMutationIdByGeneAndProteinChange(m: Mutation): string {
    return `${m.gene.hugoGeneSymbol}_${m.proteinChange}`;
}

export function generateMutationIdByGeneAndProteinChangeAndEvent(
    m: Mutation
): string {
    return [
        m.gene.hugoGeneSymbol,
        m.proteinChange,
        ...mutationEventFields(m),
    ].join('_');
}

export function generateMutationIdByGeneAndProteinChangeSampleIdAndEvent(
    m: Mutation
): string {
    return [
        m.gene.hugoGeneSymbol,
        m.proteinChange,
        m.sampleId,
        ...mutationEventFields(m),
    ].join('_');
}

/** scan a collection of Mutations to see if any contain values for ASCN fields/properties
 *
 * all mutations (whether passed as a simple array or as an array of array)
 * are scanned (once per known ASCN field/property) to see whether any mutation can be found
 * which has a (non-empty) value defined for the field. A map from field name to boolean
 * result is returned.
 *
 * @param mutations - a union type (either array of Mutation or array of array of Mutation)
 * @returns Object/Dictionary with key from {ASCN_field_names} and boolean value per key
 */
export function existsSomeMutationWithAscnPropertyInCollection(
    mutations: Mutation[] | Mutation[][]
): {
    [property: string]: boolean;
} {
    const existsSomeMutationWithAscnPropertyMap: {
        [property: string]: boolean;
    } = {};
    for (let p of Object.values(ASCNAttributes)) {
        if (mutations.length == 0) {
            existsSomeMutationWithAscnPropertyMap[p] = false;
            continue;
        }
        existsSomeMutationWithAscnPropertyMap[p] = _.some(
            mutations,
            mutationElement => {
                if (mutationElement.hasOwnProperty('variantAllele')) {
                    // element is a single mutation
                    return hasASCNProperty(mutationElement as Mutation, p);
                } else {
                    // element is a mutation array
                    return _.some(mutationElement as Mutation[], m => {
                        return hasASCNProperty(m, p);
                    });
                }
            }
        );
    }
    return existsSomeMutationWithAscnPropertyMap;
}

export function generateDataQueryFilter(
    sampleListId: string | undefined,
    sampleIds: string[] | undefined
): IDataQueryFilter {
    let filter: IDataQueryFilter = {};

    if (sampleListId) {
        filter = {
            sampleListId,
        };
    } else if (sampleIds) {
        filter = {
            sampleIds,
        };
    }

    return filter;
}

export function makeStudyToCancerTypeMap(
    studies: CancerStudy[]
): { [studyId: string]: string } {
    return studies.reduce(
        (map: { [studyId: string]: string }, next: CancerStudy) => {
            map[next.studyId] = next.cancerType.name;
            return map;
        },
        {}
    );
}

export function groupBySampleId(
    sampleIds: Array<string>,
    clinicalDataArray: Array<ClinicalData>
) {
    return _.map(sampleIds, (k: string) => ({
        id: k,
        clinicalData: clinicalDataArray.filter(
            (cd: ClinicalData) => cd.sampleId === k
        ),
    }));
}

export function mapSampleIdToClinicalData(
    clinicalDataGroupedBySampleId: Array<{
        id: string;
        clinicalData: ClinicalData[];
    }>
) {
    const sampleIdToClinicalDataMap = _.chain(clinicalDataGroupedBySampleId)
        .keyBy('id')
        .mapValues(o => o.clinicalData)
        .value();
    return sampleIdToClinicalDataMap;
}

export function groupBy<T>(
    data: T[],
    keyFn: (d: T) => string,
    defaultKeys: string[] = []
): { [key: string]: T[] } {
    const ret: { [key: string]: T[] } = {};
    for (const key of defaultKeys) {
        ret[key] = [];
    }
    for (const datum of data) {
        const key = keyFn(datum);
        ret[key] = ret[key] || [];
        ret[key].push(datum);
    }
    return ret;
}

export async function getHierarchyData(
    geneticProfileId: string,
    percentile: number,
    scoreThreshold: number,
    pvalueThreshold: number,
    sampleListId: string | undefined,
    client: CBioPortalAPIInternal = internalClient
) {
    return await client.fetchGenesetHierarchyInfoUsingPOST({
        geneticProfileId,
        percentile,
        scoreThreshold,
        pvalueThreshold,
        sampleListId,
    });
}

export function getGenomeBuildFromStudies(studies: CancerStudy[]) {
    // default reference genome is hg19(GRCh37)
    // if the all studies are based on hg38, return hg38(GRCh38)
    if (studies) {
        if (
            _.every(
                studies,
                study =>
                    new RegExp(REFERENCE_GENOME.grch38.NCBI, 'i').test(
                        study.referenceGenome
                    ) ||
                    new RegExp(REFERENCE_GENOME.grch38.UCSC, 'i').test(
                        study.referenceGenome
                    )
            )
        ) {
            return REFERENCE_GENOME.grch38.UCSC;
        }
    }
    return REFERENCE_GENOME.grch37.UCSC;
}

export function getGenomeNexusUrl(studies: CancerStudy[]) {
    // default reference genome is GRCh37
    // if the study is based on GRCh38, return GRCh38 genome nexus url
    const genomeBuild = getGenomeBuildFromStudies(studies);
    if (genomeBuild === REFERENCE_GENOME.grch38.UCSC) {
        return getServerConfig().genomenexus_url_grch38!;
    }
    return getServerConfig().genomenexus_url!;
}

export function getSurvivalClinicalAttributesPrefix(
    clinicalAttributes: ClinicalAttribute[]
) {
    const attributes = getSurvivalAttributes(clinicalAttributes);
    // get paired attributes
    const attributePrefixes = _.reduce(
        attributes,
        (attributePrefixes, attribute) => {
            let prefix = attribute.substring(0, attribute.indexOf('_STATUS'));
            if (!attributePrefixes.includes(prefix)) {
                if (attributes.includes(`${prefix}_MONTHS`)) {
                    attributePrefixes.push(prefix);
                }
            }
            return attributePrefixes;
        },
        [] as string[]
    );
    // change prefix order based on priority
    // determine priority by using survival status priority
    const statusAttributes = _.filter(clinicalAttributes, attribute =>
        /_STATUS$/i.test(attribute.clinicalAttributeId)
    );
    const priorityByPrefix = _.chain(statusAttributes)
        .keyBy(attribute =>
            attribute.clinicalAttributeId.substring(
                0,
                attribute.clinicalAttributeId.indexOf('_STATUS')
            )
        )
        .mapValues(attribute => Number(attribute.priority))
        .value();

    // return attribute prefixes by desc order based on priority
    return attributePrefixes.sort((attr1, attr2) => {
        const attr1Priority =
            RESERVED_SURVIVAL_PLOT_PRIORITY[attr1] || priorityByPrefix[attr1];
        const attr2Priority =
            RESERVED_SURVIVAL_PLOT_PRIORITY[attr2] || priorityByPrefix[attr2];
        return attr2Priority - attr1Priority;
    });
}

export async function fetchSurvivalDataExists(
    samples: Sample[],
    survivalClinicalAttributesPrefix: string[]
) {
    if (samples.length === 0) {
        return false;
    }
    const attributeNames = _.reduce(
        survivalClinicalAttributesPrefix,
        (attributeNames, prefix: string) => {
            attributeNames.push(prefix + '_STATUS');
            attributeNames.push(prefix + '_MONTHS');
            return attributeNames;
        },
        [] as string[]
    );
    if (attributeNames.length === 0) {
        return false;
    }
    const filter: ClinicalDataMultiStudyFilter = {
        attributeIds: attributeNames,
        identifiers: samples.map((s: any) => ({
            entityId: s.patientId,
            studyId: s.studyId,
        })),
    };
    const count = await getClient()
        .fetchClinicalDataUsingPOSTWithHttpInfo({
            clinicalDataType: 'PATIENT',
            clinicalDataMultiStudyFilter: filter,
            projection: 'META',
        })
        .then(function(response: request.Response) {
            return parseInt(response.header['total-count'], 10);
        });
    return count > 0;
}

export function getAlterationTypesInOql(parsedQueryLines: SingleGeneQuery[]) {
    let haveMutInQuery = false;
    let haveStructuralVariantInQuery = false;
    let haveCnaInQuery = false;
    let haveMrnaInQuery = false;
    let haveProtInQuery = false;

    for (const queryLine of parsedQueryLines) {
        for (const alteration of queryLine.alterations || []) {
            haveMutInQuery =
                haveMutInQuery || alteration.alteration_type === 'mut';
            haveStructuralVariantInQuery =
                haveStructuralVariantInQuery ||
                alteration.alteration_type === 'fusion';
            haveCnaInQuery =
                haveCnaInQuery || alteration.alteration_type === 'cna';
            haveMrnaInQuery =
                haveMrnaInQuery || alteration.alteration_type === 'exp';
            haveProtInQuery =
                haveProtInQuery || alteration.alteration_type === 'prot';
        }
    }
    return {
        haveMutInQuery,
        haveStructuralVariantInQuery,
        haveCnaInQuery,
        haveMrnaInQuery,
        haveProtInQuery,
    };
}

export function getOqlMessages(parsedLines: SingleGeneQuery[]) {
    const unrecognizedMutations = _.flatten(
        parsedLines.map(result => {
            return (result.alterations || []).filter(
                alt =>
                    alt.alteration_type === 'mut' &&
                    (alt.info as any).unrecognized
            ) as MUTCommand<any>[];
        })
    );
    return unrecognizedMutations.map(mutCommand => {
        return `Unrecognized input "${
            (mutCommand as any).constr_val
        }" is interpreted as a mutation code.`;
    });
}

export function getDefaultProfilesForOql(profiles: MolecularProfile[]) {
    return _.mapValues(
        _.keyBy([
            AlterationTypeConstants.MUTATION_EXTENDED,
            AlterationTypeConstants.STRUCTURAL_VARIANT,
            AlterationTypeConstants.COPY_NUMBER_ALTERATION,
            AlterationTypeConstants.MRNA_EXPRESSION,
            AlterationTypeConstants.PROTEIN_LEVEL,
        ]),
        alterationType =>
            profiles.find(profile => {
                return (
                    profile.showProfileInAnalysisTab &&
                    profile.molecularAlterationType === alterationType
                );
            })
    );
}

export function makeIsHotspotForOncoprint(
    remoteData: MobxPromise<IHotspotIndex | undefined>
): Promise<((m: Mutation) => boolean) | Error> {
    // have to do it like this so that an error doesnt cause chain reaction of errors and app crash
    if (remoteData.isComplete) {
        const indexedHotspotData = remoteData.result;
        if (indexedHotspotData) {
            return Promise.resolve((mutation: Mutation) => {
                return isLinearClusterHotspot(mutation, indexedHotspotData);
            });
        } else {
            return Promise.resolve(
                ((mutation: Mutation) => false) as (m: Mutation) => boolean
            );
        }
    } else if (remoteData.isError) {
        return Promise.resolve(new Error());
    } else {
        // pending: return endless promise to keep isHotspotForOncoprint pending
        return new Promise(() => {});
    }
}

export async function fetchOncoKbDataForOncoprint(
    oncoKbAnnotatedGenes: MobxPromise<
        { [entrezGeneId: number]: boolean } | Error
    >,
    mutations: MobxPromise<Mutation[]>
) {
    if (getServerConfig().show_oncokb) {
        let result;
        try {
            result = await fetchOncoKbData(
                {},
                oncoKbAnnotatedGenes.result!,
                mutations,
                'ONCOGENIC'
            );
        } catch (e) {
            result = new Error(ErrorMessages.ONCOKB_LOAD_ERROR);
        }
        return result;
    } else {
        return ONCOKB_DEFAULT;
    }
}

export async function fetchCnaOncoKbDataForOncoprint(
    oncoKbAnnotatedGenes: MobxPromise<{ [entrezGeneId: number]: boolean }>,
    cnaMolecularData: MobxPromise<NumericGeneMolecularData[]>
) {
    if (getServerConfig().show_oncokb) {
        let result;
        try {
            result = await fetchCnaOncoKbDataWithNumericGeneMolecularData(
                {},
                oncoKbAnnotatedGenes.result!,
                cnaMolecularData,
                'ONCOGENIC'
            );
        } catch (e) {
            result = new Error();
        }
        return result;
    } else {
        return ONCOKB_DEFAULT;
    }
}

export function makeGetOncoKbMutationAnnotationForOncoprint(
    remoteData: MobxPromise<IOncoKbData | Error>
) {
    const oncoKbDataForOncoprint = remoteData.result!;
    if (oncoKbDataForOncoprint instanceof Error) {
        return Promise.resolve(new Error());
    } else {
        return Promise.resolve((mutation: Mutation) => {
            const uniqueSampleKeyToTumorType = {};
            const id = generateQueryVariantId(
                mutation.entrezGeneId,
                cancerTypeForOncoKb(
                    mutation.uniqueSampleKey,
                    uniqueSampleKeyToTumorType
                ),
                mutation.proteinChange,
                mutation.mutationType
            );
            return oncoKbDataForOncoprint.indicatorMap![id];
        });
    }
}

export function makeGetOncoKbCnaAnnotationForOncoprint(
    remoteData: MobxPromise<IOncoKbData | Error>,
    oncoKb: boolean
) {
    const cnaOncoKbDataForOncoprint = remoteData.result!;
    if (cnaOncoKbDataForOncoprint instanceof Error) {
        return Promise.resolve(new Error());
    } else {
        return Promise.resolve((data: NumericGeneMolecularData) => {
            if (oncoKb) {
                const uniqueSampleKeyToTumorType = {};
                const id = generateQueryVariantId(
                    data.entrezGeneId,
                    cancerTypeForOncoKb(
                        data.uniqueSampleKey,
                        uniqueSampleKeyToTumorType
                    ),
                    getAlterationString(data.value)
                );
                return cnaOncoKbDataForOncoprint.indicatorMap![id];
            } else {
                return undefined;
            }
        });
    }
}

export function getSampleClinicalDataMapByThreshold(
    clinicalData: ClinicalData[],
    clinicalAttributeId: string,
    threshold: number
) {
    return _.reduce(
        clinicalData,
        (acc, next) => {
            if (next.clinicalAttributeId === clinicalAttributeId) {
                const value = getNumericalClinicalDataValue(next);
                if (value && value >= threshold) {
                    acc[next.sampleId] = next;
                }
            }
            return acc;
        },
        {} as { [key: string]: ClinicalData }
    );
}

export function getSampleClinicalDataMapByKeywords(
    clinicalData: ClinicalData[],
    clinicalAttributeId: string,
    keywords: string[]
) {
    return _.reduce(
        clinicalData,
        (acc: { [key: string]: ClinicalData }, next) => {
            if (next.clinicalAttributeId === clinicalAttributeId) {
                if (keywords.includes(next.value)) {
                    acc[next.sampleId] = next;
                }
            }
            return acc;
        },
        {}
    );
}

export function getNumericalClinicalDataValue(
    clinicalData: ClinicalData
): number | undefined {
    if (Number.isNaN(clinicalData.value)) {
        return undefined;
    } else {
        return Number(clinicalData.value);
    }
}

export function getSampleNumericalClinicalDataValue(
    clinicalData: ClinicalData[],
    sampleId: string,
    clinicalAttributeId: string
): number | undefined {
    const sampleMsiData = clinicalData.find(
        clinical =>
            clinical.clinicalAttributeId === clinicalAttributeId &&
            clinical.sampleId === sampleId
    );
    if (sampleMsiData) {
        return getNumericalClinicalDataValue(sampleMsiData);
    }
    return undefined;
}

export type SampleCancerTypeMap = {
    cancerType: string | undefined;
    cancerTypeDetailed: string | undefined;
    studyCancerType: string | undefined;
};

export type OtherBiomarkerQueryId = {
    sampleId: string;
    type: OtherBiomarkersQueryType;
};

export const OTHER_BIOMARKERS_CLINICAL_ATTR: {
    [key in OtherBiomarkersQueryType]: string;
} = {
    [OtherBiomarkersQueryType.MSIH]: CLINICAL_ATTRIBUTE_ID_ENUM.MSI_SCORE,
    [OtherBiomarkersQueryType.TMBH]: CLINICAL_ATTRIBUTE_ID_ENUM.TMB_SCORE,
};

export const OTHER_BIOMARKERS_QUERY_ID_SEPARATOR = '-&-';

export function getOtherBiomarkersQueryId(query: OtherBiomarkerQueryId) {
    return query.sampleId + OTHER_BIOMARKERS_QUERY_ID_SEPARATOR + query.type;
}

// Follow the format from method getOtherBiomarkersQueryId
export function parseOtherBiomarkerQueryId(
    queryId: string
): OtherBiomarkerQueryId {
    const queryIdParts = queryId.split(OTHER_BIOMARKERS_QUERY_ID_SEPARATOR);
    return {
        sampleId: queryIdParts[0],
        type: queryIdParts[1],
    } as OtherBiomarkerQueryId;
}

export function getSampleTumorTypeMap(
    sampleClinicalData: ClinicalData[],
    studyCancerType: string | undefined
): SampleCancerTypeMap {
    const cancerType = sampleClinicalData.find(
        attr =>
            attr.clinicalAttributeId === CLINICAL_ATTRIBUTE_ID_ENUM.CANCER_TYPE
    );
    const cancerTypeDetailed = sampleClinicalData.find(
        attr =>
            attr.clinicalAttributeId ===
            CLINICAL_ATTRIBUTE_ID_ENUM.CANCER_TYPE_DETAILED
    );
    return {
        cancerType: cancerType?.value,
        cancerTypeDetailed: cancerTypeDetailed?.value,
        studyCancerType,
    };
}

export function tumorTypeResolver(cancerTypeMap: SampleCancerTypeMap) {
    return (
        cancerTypeMap?.cancerTypeDetailed ||
        cancerTypeMap?.cancerType ||
        cancerTypeMap?.studyCancerType
    );
}

export const PUTATIVE_DRIVER = 'Putative_Driver';
export const PUTATIVE_PASSENGER = 'Putative_Passenger';

export const DriverFilterOrder = {
    PUTATIVE_DRIVER: 3,
    PUTATIVE_PASSENGER: 2,
    UNKNOWN: 1,
    NA: 0,
};

export function getOncoKbOncogenic(response: IndicatorQueryResp): string {
    if (
        ONCOKB_ONCOGENIC_LOWERCASE.indexOf(
            (response.oncogenic || '').toLowerCase()
        ) > -1
    ) {
        return response.oncogenic;
    } else {
        return '';
    }
}

export function evaluatePutativeDriverInfoWithHotspots(
    event: CustomDriverFilterEvent,
    oncoKbDatum: IndicatorQueryResp | undefined | null | false,
    customDriverAnnotationsActive: boolean,
    customDriverTierSelection: ObservableMap<string, boolean> | undefined,
    hotspotInfo: HotSpotInfo
): DriverInfoWithHotspots {
    const hotspots =
        hotspotInfo.hotspotAnnotationsActive && hotspotInfo.hotspotDriver;
    return {
        ...evaluatePutativeDriverInfo(
            event,
            oncoKbDatum,
            customDriverAnnotationsActive,
            customDriverTierSelection
        ),
        hotspots,
    };
}

export function evaluatePutativeDriverInfo(
    event: CustomDriverFilterEvent,
    oncoKbDatum: IndicatorQueryResp | undefined | null | false,
    customDriverAnnotationsActive: boolean,
    customDriverTierSelection: ObservableMap<string, boolean> | undefined
): DriverInfo {
    const oncoKb = oncoKbDatum ? getOncoKbOncogenic(oncoKbDatum) : '';

    // Set driverFilter to true when:
    // (1) custom drivers active in settings menu
    // (2) the datum has a custom driver annotation
    const customDriverBinary: boolean =
        (customDriverAnnotationsActive &&
            event.driverFilter === PUTATIVE_DRIVER) ||
        false;

    // Set tier information to the tier name when the tiers checkbox
    // is selected for the corresponding tier of the datum in settings menu.
    // This forces the Mutation to be counted as a driver mutation.
    const customDriverTier: string | undefined =
        event.driverTiersFilter &&
        customDriverTierSelection &&
        customDriverTierSelection.get(event.driverTiersFilter)
            ? event.driverTiersFilter
            : undefined;

    return {
        oncoKb,
        customDriverBinary,
        customDriverTier,
    } as DriverInfo;
}

export function filterAndAnnotateMolecularData(
    molecularData: NumericGeneMolecularData[],
    getPutativeDriverInfo: (
        cnaDatum: NumericGeneMolecularData
    ) => {
        oncoKb: string;
        customDriverBinary: boolean;
        customDriverTier?: string | undefined;
    },
    entrezGeneIdToGene: { [entrezGeneId: number]: Gene },
    discreteCnaProfileIds?: string[]
): FilteredAndAnnotatedDiscreteCNAReport<AnnotatedNumericGeneMolecularData> {
    const vus: AnnotatedNumericGeneMolecularData[] = [];
    const filteredAnnotatedCnaData = [];
    // will it work not to filter for molecular profile here?
    for (const datum of molecularData) {
        const annotatedDatum = annotateMolecularDatum(
            datum,
            getPutativeDriverInfo(datum),
            discreteCnaProfileIds
        );
        annotatedDatum.hugoGeneSymbol = (
            entrezGeneIdToGene[datum.entrezGeneId] || datum.gene
        ).hugoGeneSymbol;
        const isVus = !annotatedDatum.putativeDriver;
        if (isVus) {
            vus.push(annotatedDatum);
        } else {
            filteredAnnotatedCnaData.push(annotatedDatum);
        }
    }
    return {
        data: filteredAnnotatedCnaData,
        vus,
    };
}

export function filterAndAnnotateMutations(
    mutations: Mutation[],
    getPutativeDriverInfo: (
        mutation: Mutation
    ) => {
        oncoKb: string;
        hotspots: boolean;
        customDriverBinary: boolean;
        customDriverTier?: string;
    },
    entrezGeneIdToGene: {
        [entrezGeneId: number]: {
            hugoGeneSymbol: string;
            entrezGeneId: number;
        };
    }
): FilteredAndAnnotatedMutationsReport<AnnotatedMutation> {
    const vus: AnnotatedMutation[] = [];
    const germline: AnnotatedMutation[] = [];
    const vusAndGermline: AnnotatedMutation[] = [];
    const filteredAnnotatedMutations = [];
    for (const mutation of mutations) {
        const annotatedMutation = annotateMutationPutativeDriver(
            mutation,
            getPutativeDriverInfo(mutation)
        ); // annotate
        annotatedMutation.hugoGeneSymbol = (
            entrezGeneIdToGene[mutation.entrezGeneId] || mutation.gene
        ).hugoGeneSymbol;
        const isGermline = !isNotGermlineMutation(mutation);
        const isVus = !annotatedMutation.putativeDriver;
        if (isGermline && isVus) {
            vusAndGermline.push(annotatedMutation);
        } else if (isGermline) {
            germline.push(annotatedMutation);
        } else if (isVus) {
            vus.push(annotatedMutation);
        } else {
            filteredAnnotatedMutations.push(annotatedMutation);
        }
    }
    return {
        data: filteredAnnotatedMutations,
        vus,
        germline,
        vusAndGermline,
    };
}

export function buildProteinChange(sv: StructuralVariant) {
    const genes: string[] = [];

    if (sv.site1HugoSymbol) {
        genes.push(sv.site1HugoSymbol);
    }

    if (sv.site2HugoSymbol && sv.site1HugoSymbol !== sv.site2HugoSymbol) {
        genes.push(sv.site2HugoSymbol);
    }

    if (genes.length === 2) {
        return `${genes[0]}-${genes[1]} Fusion`;
    } else {
        return `${genes[0]} intragenic`;
    }
}
