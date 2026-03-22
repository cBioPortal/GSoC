import _ from 'lodash';
import { AlterationTypeConstants } from 'shared/constants';
import { alterationInfoForCaseAggregatedDataByOQLLine } from 'shared/components/oncoprint/OncoprintUtils';
import { makeGeneticTrackData } from 'shared/components/oncoprint/DataUtils';
import { GeneticTrackDatum } from 'shared/components/oncoprint/Oncoprint';
import {
    Sample,
    Gene,
    MolecularProfile,
    GenericAssayData,
    GenericAssayMeta,
    SampleMolecularIdentifier,
    MolecularDataMultipleStudyFilter,
} from 'cbioportal-ts-api-client';
import {
    ICaseAlteration,
    IOqlData,
    ISubAlteration,
} from './CaseAlterationTable';
import { IGeneAlteration } from './GeneAlterationTable';
import {
    getSingleGeneResultKey,
    getMultipleGeneResultKey,
} from '../ResultsViewPageStoreUtils';
import { CoverageInformation } from 'shared/lib/GenePanelUtils';
import {
    OQLLineFilterOutput,
    MergedTrackLineFilterOutput,
} from 'shared/lib/oql/oqlfilter';
import { isNotGermlineMutation } from 'shared/lib/MutationUtils';
import { isSampleProfiled } from 'shared/lib/isSampleProfiled';
import {
    getGenericAssayMetaPropertyOrDefault,
    COMMON_GENERIC_ASSAY_PROPERTY,
    formatGenericAssayCompactLabelByNameAndId,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { Alteration } from 'shared/lib/oql/oql-parser';
import client from 'shared/api/cbioportalClientInstance';
import { REQUEST_ARG_ENUM } from 'shared/constants';
import fileDownload from 'react-file-download';
import { GENERIC_ASSAY_CONFIG } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
import { CaseAggregatedData } from 'shared/model/CaseAggregatedData';
import { AnnotatedExtendedAlteration } from 'shared/model/AnnotatedExtendedAlteration';
import { ExtendedAlteration } from 'shared/model/ExtendedAlteration';
import { IQueriedCaseData } from 'shared/model/IQueriedCaseData';
import { IQueriedMergedTrackCaseData } from 'shared/model/IQueriedMergedTrackCaseData';

export interface IDownloadFileRow {
    studyId: string;
    patientId: string;
    sampleId: string;
    uniqueSampleKey: string;
    alterationData: { [gene: string]: string[] };
}

export function generateOqlData(
    datum: GeneticTrackDatum,
    geneAlterationDataByGene?: { [gene: string]: IGeneAlteration },
    molecularProfileIdToMolecularProfile?: {
        [molecularProfileId: string]: MolecularProfile;
    }
): IOqlData {
    const mutation: IOqlData['mutation'] = [];
    const structuralVariant: string[] = [];
    const cnaAlterations: ISubAlteration[] = [];
    const proteinLevels: ISubAlteration[] = [];
    const mrnaExpressions: ISubAlteration[] = [];
    const alterationTypes: string[] = [];

    // there might be multiple alterations for a single sample
    for (const alteration of datum.data) {
        const molecularAlterationType =
            alteration.molecularProfileAlterationType;
        const alterationSubType = alteration.alterationSubType.toUpperCase();
        switch (molecularAlterationType) {
            case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
                if (alterationSubType.length > 0) {
                    cnaAlterations.push({
                        type: alterationSubType,
                        value: alteration.value,
                        putativeDriver: alteration.putativeDriver,
                    });
                    alterationTypes.push('CNA');
                }
                break;
            case AlterationTypeConstants.MRNA_EXPRESSION:
                if (alterationSubType.length > 0) {
                    mrnaExpressions.push({
                        type: alterationSubType,
                        value: alteration.value,
                    });
                    alterationTypes.push('EXP');
                }
                break;
            case AlterationTypeConstants.PROTEIN_LEVEL:
                if (alterationSubType.length > 0) {
                    proteinLevels.push({
                        type: alterationSubType,
                        value: alteration.value,
                    });
                    alterationTypes.push('PROT');
                }
                break;
            case AlterationTypeConstants.MUTATION_EXTENDED:
                mutation.push({
                    proteinChange: alteration.proteinChange,
                    isGermline: !isNotGermlineMutation(alteration),
                    putativeDriver: alteration.putativeDriver,
                });
                alterationTypes.push('MUT');
                break;
            case AlterationTypeConstants.STRUCTURAL_VARIANT:
                structuralVariant.push(alteration.eventInfo);
                alterationTypes.push('FUSION');
        }
    }

    return {
        // by default assume it is sequenced if the label is not a recognised
        // gene symbol or if no gene alteration data exists for the gene; it
        // should always be a gene symbol as long as the download tab doesn't
        // use multi-gene tracks
        sequenced:
            geneAlterationDataByGene &&
            geneAlterationDataByGene[datum.trackLabel]
                ? geneAlterationDataByGene[datum.trackLabel].sequenced > 0
                : true,
        geneSymbol: datum.trackLabel,
        mutation,
        structuralVariant,
        cna: cnaAlterations,
        mrnaExp: mrnaExpressions,
        proteinLevel: proteinLevels,
        isMutationNotProfiled: false,
        isStructuralVariantNotProfiled: false,
        isCnaNotProfiled: false,
        isMrnaExpNotProfiled: false,
        isProteinLevelNotProfiled: false,
        alterationTypes: alterationTypes,
    };
}

export function updateOqlData(
    datum: GeneticTrackDatum,
    oql: IOqlData,
    molecularProfileIdToMolecularProfile?: {
        [molecularProfileId: string]: MolecularProfile;
    }
): IOqlData {
    let isMutationNotProfiled = true;
    let isStructuralVariantNotProfiled = true;
    let isCnaNotProfiled = true;
    let isMrnaExpNotProfiled = true;
    let isProteinLevelNotProfiled = true;

    //record the profile information
    if (datum.profiled_in) {
        for (const profile of datum.profiled_in) {
            if (molecularProfileIdToMolecularProfile) {
                const molecularAlterationType =
                    molecularProfileIdToMolecularProfile[
                        profile.molecularProfileId
                    ].molecularAlterationType;
                switch (molecularAlterationType) {
                    case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
                        isCnaNotProfiled = false;
                        break;
                    case AlterationTypeConstants.MRNA_EXPRESSION:
                        isMrnaExpNotProfiled = false;
                        break;
                    case AlterationTypeConstants.PROTEIN_LEVEL:
                        isProteinLevelNotProfiled = false;
                        break;
                    case AlterationTypeConstants.MUTATION_EXTENDED:
                        isMutationNotProfiled = false;
                    case AlterationTypeConstants.STRUCTURAL_VARIANT:
                        isStructuralVariantNotProfiled = false;
                        break;
                }
            }
        }
    }
    oql.isMutationNotProfiled = isMutationNotProfiled;
    oql.isStructuralVariantNotProfiled = isStructuralVariantNotProfiled;
    oql.isCnaNotProfiled = isCnaNotProfiled;
    oql.isMrnaExpNotProfiled = isMrnaExpNotProfiled;
    oql.isProteinLevelNotProfiled = isProteinLevelNotProfiled;

    return oql;
}

export function generateGeneAlterationData(
    caseAggregatedDataByOQLLine?: IQueriedCaseData<
        AnnotatedExtendedAlteration
    >[],
    sequencedSampleKeysByGene: { [hugoGeneSymbol: string]: string[] } = {}
): IGeneAlteration[] {
    return caseAggregatedDataByOQLLine && !_.isEmpty(sequencedSampleKeysByGene)
        ? caseAggregatedDataByOQLLine.map(data => {
              const info = alterationInfoForCaseAggregatedDataByOQLLine(
                  true,
                  data,
                  sequencedSampleKeysByGene,
                  {}
              );

              return {
                  gene: data.oql.gene,
                  oqlLine: data.oql.oql_line,
                  altered: info.altered,
                  sequenced: info.sequenced,
                  percentAltered: info.percent,
              };
          })
        : [];
}

export function stringify2DArray(
    data: string[][],
    colDelimiter: string = '\t',
    rowDelimiter: string = '\n'
) {
    return data.map(mutation => mutation.join(colDelimiter)).join(rowDelimiter);
}

export function generateMutationData(
    unfilteredCaseAggregatedData?: CaseAggregatedData<ExtendedAlteration>
): { [key: string]: ExtendedAlteration[] } {
    const sampleFilter = (alteration: ExtendedAlteration) => {
        return (
            alteration.molecularProfileAlterationType ===
                AlterationTypeConstants.MUTATION_EXTENDED ||
            alteration.molecularProfileAlterationType ===
                AlterationTypeConstants.FUSION
        );
    };

    return unfilteredCaseAggregatedData
        ? generateSampleAlterationDataByGene(
              unfilteredCaseAggregatedData,
              sampleFilter
          )
        : {};
}

export function generateMutationDownloadData(
    sampleAlterationDataByGene: { [key: string]: ExtendedAlteration[] },
    samples: Sample[] = [],
    genes: Gene[] = [],
    isSampleProfiledFunc: (
        uniqueSampleKey: string,
        studyId: string,
        hugoGeneSymbol: string
    ) => boolean
): string[][] {
    return sampleAlterationDataByGene
        ? generateDownloadData(
              sampleAlterationDataByGene,
              samples,
              genes,
              isSampleProfiledFunc,
              extractMutationValue,
              undefined,
              'WT',
              'NP'
          )
        : [];
}

export function generateStructuralDownloadData(
    sampleAlterationDataByGene: { [key: string]: ExtendedAlteration[] },
    samples: Sample[] = [],
    genes: Gene[] = [],
    isSampleProfiledFunc: (
        uniqueSampleKey: string,
        studyId: string,
        hugoGeneSymbol: string
    ) => boolean
): string[][] {
    return sampleAlterationDataByGene
        ? generateDownloadData(
              sampleAlterationDataByGene,
              samples,
              genes,
              isSampleProfiledFunc,
              extractStructuralVariantValue
          )
        : [];
}

export function generateMrnaData(
    unfilteredCaseAggregatedData?: CaseAggregatedData<ExtendedAlteration>
): { [key: string]: ExtendedAlteration[] } {
    const sampleFilter = (alteration: ExtendedAlteration) => {
        return (
            alteration.molecularProfileAlterationType ===
            AlterationTypeConstants.MRNA_EXPRESSION
        );
    };

    return unfilteredCaseAggregatedData
        ? generateSampleAlterationDataByGene(
              unfilteredCaseAggregatedData,
              sampleFilter
          )
        : {};
}

export function generateProteinData(
    unfilteredCaseAggregatedData?: CaseAggregatedData<ExtendedAlteration>
): { [key: string]: ExtendedAlteration[] } {
    const sampleFilter = (alteration: ExtendedAlteration) => {
        return (
            alteration.molecularProfileAlterationType ===
            AlterationTypeConstants.PROTEIN_LEVEL
        );
    };

    return unfilteredCaseAggregatedData
        ? generateSampleAlterationDataByGene(
              unfilteredCaseAggregatedData,
              sampleFilter
          )
        : {};
}

export function generateCnaData(
    unfilteredCaseAggregatedData?: CaseAggregatedData<ExtendedAlteration>
): { [key: string]: ExtendedAlteration[] } {
    const sampleFilter = (alteration: ExtendedAlteration) => {
        return (
            alteration.molecularProfileAlterationType ===
            AlterationTypeConstants.COPY_NUMBER_ALTERATION
        );
    };

    return unfilteredCaseAggregatedData
        ? generateSampleAlterationDataByGene(
              unfilteredCaseAggregatedData,
              sampleFilter
          )
        : {};
}

export function generateStructuralVariantData(
    unfilteredCaseAggregatedData?: CaseAggregatedData<ExtendedAlteration>
): { [key: string]: ExtendedAlteration[] } {
    const sampleFilter = (alteration: ExtendedAlteration) => {
        return (
            alteration.molecularProfileAlterationType ===
            AlterationTypeConstants.STRUCTURAL_VARIANT
        );
    };

    return unfilteredCaseAggregatedData
        ? generateSampleAlterationDataByGene(
              unfilteredCaseAggregatedData,
              sampleFilter
          )
        : {};
}

export function generateOtherMolecularProfileData(
    molecularProfileId: string[],
    unfilteredCaseAggregatedData?: CaseAggregatedData<ExtendedAlteration>
): { [key: string]: ExtendedAlteration[] } {
    const sampleFilter = (alteration: ExtendedAlteration) => {
        return molecularProfileId.includes(alteration.molecularProfileId);
    };
    const keyGenerator = (alteration: ExtendedAlteration) => {
        return `${alteration.gene.hugoGeneSymbol}_${alteration.uniqueSampleKey}`;
    };

    return unfilteredCaseAggregatedData
        ? generateSampleAlterationDataByGene(
              unfilteredCaseAggregatedData,
              sampleFilter,
              keyGenerator
          )
        : {};
}

export function generateOtherMolecularProfileDownloadData(
    sampleAlterationDataByGene: { [key: string]: ExtendedAlteration[] },
    samples: Sample[] = [],
    genes: Gene[] = []
): string[][] {
    return sampleAlterationDataByGene
        ? generateDownloadData(
              sampleAlterationDataByGene,
              samples,
              genes,
              () => true // dont deal with labeling not profiled
          )
        : [];
}

export async function downloadOtherMolecularProfileData(
    profileName: string,
    profiles: MolecularProfile[],
    samples: Sample[],
    genes: Gene[],
    transposed: boolean = false
) {
    // STEP 1: fetch data
    let molecularData: any[] = [];
    if (profiles.length && genes != undefined && genes.length) {
        const profilesGroupByStudyId = _.groupBy(
            profiles,
            profile => profile.studyId
        );
        // find samples which share studyId with profile and add identifier
        const sampleIdentifiers: SampleMolecularIdentifier[] = (samples as Sample[]).reduce(
            (acc: SampleMolecularIdentifier[], sample) => {
                if (sample.studyId in profilesGroupByStudyId) {
                    acc.push(
                        ...profilesGroupByStudyId[sample.studyId].map(
                            profile => {
                                return {
                                    molecularProfileId:
                                        profile.molecularProfileId,
                                    sampleId: sample.sampleId,
                                } as SampleMolecularIdentifier;
                            }
                        )
                    );
                }
                return acc;
            },
            []
        );

        if (sampleIdentifiers.length) {
            molecularData = await client.fetchMolecularDataInMultipleMolecularProfilesUsingPOST(
                {
                    projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                    molecularDataMultipleStudyFilter: {
                        entrezGeneIds: _.map(
                            genes,
                            (gene: Gene) => gene.entrezGeneId
                        ),
                        sampleMolecularIdentifiers: sampleIdentifiers,
                    } as MolecularDataMultipleStudyFilter,
                }
            );
        }
    }

    // STEP 2: generate alteration data
    const data = {
        samples: _.groupBy(molecularData, data => data.uniqueSampleKey),
    } as CaseAggregatedData<ExtendedAlteration>;

    const alterationData = generateOtherMolecularProfileData(
        profiles.map(profile => profile.molecularProfileId),
        data
    );

    // STEP 3: generate download data
    const downloadData = generateOtherMolecularProfileDownloadData(
        alterationData,
        samples,
        genes
    );

    // STEP 4: download data
    fileDownload(
        transposed
            ? unzipDownloadData(downloadData)
            : downloadDataText(downloadData),
        `${profileName}.txt`
    );
}

export function generateGenericAssayProfileData(
    molecularProfileIds: string[],
    unfilteredCaseAggregatedData: CaseAggregatedData<GenericAssayData>
): { [key: string]: GenericAssayData[] } {
    const sampleFilter = (data: GenericAssayData) => {
        return molecularProfileIds.includes(data.molecularProfileId);
    };

    // generate GenericAssay profile data by key
    // key => stableId + uniqueSampleKey
    const sampleDataByStableId: { [key: string]: GenericAssayData[] } = {};

    _.values(unfilteredCaseAggregatedData.samples).forEach(alterations => {
        alterations.forEach(alteration => {
            const key = `${alteration.stableId}_${alteration.uniqueSampleKey}`;
            sampleDataByStableId[key] = sampleDataByStableId[key] || [];

            // alteration is filtered out if filter function returns false
            if (sampleFilter(alteration)) {
                sampleDataByStableId[key].push(alteration);
            }
        });
    });
    return sampleDataByStableId;
}

export function generateGenericAssayProfileDownloadData(
    sampleGenericAssayDataByStableId: { [key: string]: GenericAssayData[] },
    samples: Sample[] = [],
    stableIds: string[] = [],
    stableIdToMetaMap: { [genericAssayStableId: string]: GenericAssayMeta },
    profiles: MolecularProfile[]
): string[][] {
    if (_.isEmpty(sampleGenericAssayDataByStableId)) {
        return [];
    } else {
        // we need the sample index for better performance
        const sampleIndex = _.keyBy(samples, sample => sample.uniqueSampleKey);
        // Use the first profile to determine generic assay type
        const genericAssayType = profiles[0].genericAssayType;

        // generate row data (keyed by uniqueSampleKey)
        const rows = generateGenericAssayRowsByUniqueSampleKey(
            sampleGenericAssayDataByStableId,
            stableIds,
            sampleIndex
        );

        const downloadData: string[][] = [];

        // add headers
        // try to use "NAME" in the meta as header of each entity
        // fall back to stableId if "NAME" not available
        downloadData.push(
            ['STUDY_ID', 'SAMPLE_ID'].concat(
                _.map(stableIds, id => {
                    const entityName = getGenericAssayMetaPropertyOrDefault(
                        stableIdToMetaMap[id],
                        COMMON_GENERIC_ASSAY_PROPERTY.NAME,
                        id
                    );
                    return GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
                        genericAssayType
                    ]?.downloadTabConfig?.formatDownloadHeaderUsingCompactLabel
                        ? formatGenericAssayCompactLabelByNameAndId(
                              id,
                              entityName
                          )
                        : entityName;
                })
            )
        );

        // convert row data into a 2D array of strings
        _.keys(sampleIndex).forEach(sampleKey => {
            const rowData = rows[sampleKey];
            const row: string[] = [];

            row.push(rowData.studyId);
            row.push(rowData.sampleId);

            stableIds.forEach(stableId => {
                // format: space delimited join
                // rowData.alterationData[stableId] is generated by us, it will never be undefined
                // rowData.alterationData[stableId] will have a empty list at least
                const formattedValue =
                    rowData.alterationData[stableId].join(' ') || 'NA';
                row.push(formattedValue);
            });

            downloadData.push(row);
        });

        return downloadData;
    }
}

export function generateSampleAlterationDataByGene(
    unfilteredCaseAggregatedData: CaseAggregatedData<ExtendedAlteration>,
    sampleFilter?: (alteration: ExtendedAlteration) => boolean,
    keyGenerator?: (alteration: ExtendedAlteration) => string
): { [key: string]: ExtendedAlteration[] } {
    // key => gene + uniqueSampleKey
    const sampleDataByGene: { [key: string]: ExtendedAlteration[] } = {};

    _.values(unfilteredCaseAggregatedData.samples).forEach(alterations => {
        alterations.forEach(alteration => {
            const key = keyGenerator
                ? keyGenerator(alteration)
                : `${alteration.hugoGeneSymbol}_${alteration.uniqueSampleKey}`;
            sampleDataByGene[key] = sampleDataByGene[key] || [];

            // if no filter function provided nothing is filtered out,
            // otherwise alteration is filtered out if filter function returns false
            if (!sampleFilter || sampleFilter(alteration)) {
                sampleDataByGene[key].push(alteration);
            }
        });
    });
    return sampleDataByGene;
}

export function generateDownloadFileRows(
    sampleAlterationDataByGene: { [key: string]: ExtendedAlteration[] },
    geneSymbols: string[],
    sampleIndex: { [sampleKey: string]: Sample },
    sampleKeys: string[],
    extractValue?: (alteration: ExtendedAlteration) => string
): { [sampleKey: string]: IDownloadFileRow } {
    const rows: { [sampleKey: string]: IDownloadFileRow } = {};

    sampleKeys.forEach(sampleKey => {
        const sample = sampleIndex[sampleKey];

        const row: IDownloadFileRow = rows[sampleKey] || {
            studyId: sample.studyId,
            sampleId: sample.sampleId,
            uniqueSampleKey: sample.uniqueSampleKey,
            patientId: sample.patientId,
            alterationData: {},
        };

        rows[sampleKey] = row;

        geneSymbols.forEach(gene => {
            row.alterationData[gene] = row.alterationData[gene] || [];

            const key = `${gene}_${sampleKey}`;

            if (sampleAlterationDataByGene[key]) {
                sampleAlterationDataByGene[key].forEach(alteration => {
                    const value = extractValue
                        ? extractValue(alteration)
                        : String(alteration.value);
                    row.alterationData[gene].push(value);
                });
            }
        });
    });

    return rows;
}

export function generateGenericAssayRowsByUniqueSampleKey(
    sampleGenericAssayDataByStableId: { [key: string]: GenericAssayData[] },
    stableIds: string[],
    sampleIndex: { [sampleKey: string]: Sample },
    extractValue?: (alteration: GenericAssayData) => string
): { [sampleKey: string]: IDownloadFileRow } {
    const rows: { [sampleKey: string]: IDownloadFileRow } = {};

    _.keys(sampleIndex).forEach(sampleKey => {
        const sample = sampleIndex[sampleKey];

        const row: IDownloadFileRow = rows[sampleKey] || {
            studyId: sample.studyId,
            sampleId: sample.sampleId,
            patientId: sample.patientId,
            alterationData: {},
        };

        rows[sampleKey] = row;

        stableIds.forEach(stableId => {
            row.alterationData[stableId] = row.alterationData[stableId] || [];

            const key = `${stableId}_${sampleKey}`;

            if (sampleGenericAssayDataByStableId[key]) {
                sampleGenericAssayDataByStableId[key].forEach(alteration => {
                    const value = extractValue
                        ? extractValue(alteration)
                        : String(alteration.value);
                    row.alterationData[stableId].push(value);
                });
            }
        });
    });

    return rows;
}

export function makeIsSampleProfiledFunction(
    alterationType: string,
    studyIdToMolecularProfilesMap: {
        [studyId: string]: { [altType: string]: MolecularProfile };
    },
    coverageInformation: CoverageInformation
) {
    return (
        uniqueSampleKey: string,
        studyId: string,
        hugoGeneSymbol: string
    ) => {
        const profile = studyIdToMolecularProfilesMap[studyId][alterationType];
        if (profile) {
            return isSampleProfiled(
                uniqueSampleKey,
                profile.molecularProfileId,
                hugoGeneSymbol,
                coverageInformation
            );
        } else {
            return false;
        }
    };
}

export function generateDownloadData(
    sampleAlterationDataByGene: { [key: string]: ExtendedAlteration[] },
    samples: Sample[] = [],
    genes: Gene[] = [],
    isSampleProfiledFunc: (
        uniqueSampleKey: string,
        studyId: string,
        hugoGeneSymbol: string
    ) => boolean,
    extractValue?: (alteration: ExtendedAlteration) => string,
    formatData?: (data: string[]) => string,
    notAlteredString = 'NA',
    notProfiledString = 'NP'
) {
    const geneSymbols = genes.map(gene => gene.hugoGeneSymbol);

    // we need the sample index for better performance
    const sampleIndex = _.keyBy(samples, 'uniqueSampleKey');
    const sampleKeys = samples.map(sample => sample.uniqueSampleKey);

    // generate row data (keyed by uniqueSampleKey)
    const rows = generateDownloadFileRows(
        sampleAlterationDataByGene,
        geneSymbols,
        sampleIndex,
        sampleKeys,
        extractValue
    );

    const downloadData: string[][] = [];

    // add headers
    downloadData.push(['STUDY_ID', 'SAMPLE_ID'].concat(geneSymbols));

    // convert row data into a 2D array of strings
    sampleKeys.forEach(sampleKey => {
        const rowData = rows[sampleKey];
        const row: string[] = [];

        row.push(rowData.studyId);
        row.push(rowData.sampleId);

        geneSymbols.forEach(gene => {
            let formattedValue: string;
            if (
                !isSampleProfiledFunc(
                    rowData.uniqueSampleKey,
                    rowData.studyId,
                    gene
                )
            ) {
                formattedValue = notProfiledString;
            } else {
                if (formatData) {
                    formattedValue = formatData(rowData.alterationData[gene]); // if provided format with the custom data formatter
                } else {
                    formattedValue = rowData.alterationData[gene].join(' ');
                }
                formattedValue = formattedValue || notAlteredString; // else, default format: space delimited join
            }
            row.push(formattedValue);
        });

        downloadData.push(row);
    });

    return downloadData;
}

export function generateCaseAlterationData(
    oqlQuery: string,
    defaultOQLQueryAlterations: Alteration[] | false,
    selectedMolecularProfiles: MolecularProfile[],
    caseAggregatedDataByOQLLine?: IQueriedCaseData<
        AnnotatedExtendedAlteration
    >[],
    caseAggregatedDataByUnflattenedOQLLine?: IQueriedMergedTrackCaseData[],
    genePanelInformation?: CoverageInformation,
    samples: Sample[] = [],
    geneAlterationDataByGene?: { [gene: string]: IGeneAlteration },
    molecularProfileIdToMolecularProfile?: {
        [molecularProfileId: string]: MolecularProfile;
    }
): ICaseAlteration[] {
    const caseAlterationData: { [studyCaseId: string]: ICaseAlteration } = {};

    // put gene data into oqlDataByGene
    if (caseAggregatedDataByOQLLine && genePanelInformation) {
        // we need the sample index for better performance
        const sampleIndex = _.keyBy(samples, 'uniqueSampleKey');

        caseAggregatedDataByOQLLine.forEach(data => {
            const geneticTrackData = makeGeneticTrackData(
                data.cases.samples,
                data.oql.gene,
                samples,
                genePanelInformation,
                selectedMolecularProfiles
            );

            geneticTrackData.forEach(datum => {
                const key = datum.study_id + ':' + datum.uid;
                initializeCaseAlterationData(
                    caseAlterationData,
                    datum,
                    sampleIndex
                );
                // for each gene the oql data is different
                // that's why we need a map here
                const generatedOqlData = generateOqlData(
                    datum,
                    geneAlterationDataByGene,
                    molecularProfileIdToMolecularProfile
                );
                //generate and update oqlDataByGene in caseAlterationData
                if (
                    caseAlterationData[key].oqlDataByGene[data.oql.gene] !==
                    undefined
                ) {
                    caseAlterationData[key].oqlDataByGene[
                        data.oql.gene
                    ] = _.merge(
                        generatedOqlData,
                        caseAlterationData[key].oqlDataByGene[data.oql.gene]
                    );
                } else {
                    caseAlterationData[key].oqlDataByGene[
                        data.oql.gene
                    ] = generatedOqlData;
                }
                updateOqlData(
                    datum,
                    caseAlterationData[key].oqlDataByGene[data.oql.gene],
                    molecularProfileIdToMolecularProfile
                );
            });
        });
    }

    // put track data into oqlData
    if (caseAggregatedDataByUnflattenedOQLLine && genePanelInformation) {
        // we need the sample index for better performance
        const sampleIndex = _.keyBy(samples, 'uniqueSampleKey');

        caseAggregatedDataByUnflattenedOQLLine.forEach((data, index) => {
            let genes;
            let trackName: string;
            // get genes and track mames
            if (data.mergedTrackOqlList === undefined) {
                genes = (data.oql as OQLLineFilterOutput<
                    AnnotatedExtendedAlteration
                >).gene;
                trackName = getSingleGeneResultKey(
                    index,
                    oqlQuery,
                    data.oql as OQLLineFilterOutput<
                        AnnotatedExtendedAlteration
                    >,
                    defaultOQLQueryAlterations
                );
            } else {
                genes = (data.oql as MergedTrackLineFilterOutput<
                    AnnotatedExtendedAlteration
                >).list.map(oql => oql.gene);
                trackName = getMultipleGeneResultKey(
                    data.oql as MergedTrackLineFilterOutput<
                        AnnotatedExtendedAlteration
                    >
                );
            }
            const geneticTrackData = makeGeneticTrackData(
                data.cases.samples,
                genes,
                samples,
                genePanelInformation,
                selectedMolecularProfiles
            );

            geneticTrackData.forEach(datum => {
                const key = datum.study_id + ':' + datum.uid;
                initializeCaseAlterationData(
                    caseAlterationData,
                    datum,
                    sampleIndex
                );
                // for each track (for each oql line/gene) the oql data is different
                // that's why we need a map here
                const generatedOqlData = generateOqlData(
                    datum,
                    geneAlterationDataByGene,
                    molecularProfileIdToMolecularProfile
                );
                //generate and update oqlData in caseAlterationData
                caseAlterationData[key].oqlData[trackName] = generatedOqlData;
                updateOqlData(
                    datum,
                    caseAlterationData[key].oqlData[trackName],
                    molecularProfileIdToMolecularProfile
                );
            });
        });
    }
    return _.values(caseAlterationData);
}

export function initializeCaseAlterationData(
    caseAlterationData: { [studyCaseId: string]: ICaseAlteration },
    datum: GeneticTrackDatum,
    sampleIndex: _.Dictionary<Sample>
) {
    const studyId = datum.study_id;
    const sampleId =
        datum.sample ||
        (sampleIndex[datum.uid] ? sampleIndex[datum.uid].sampleId : '');
    const key = studyId + ':' + datum.uid;

    // initialize the row data
    caseAlterationData[key] = caseAlterationData[key] || {
        studyId,
        sampleId,
        patientId: sampleIndex[datum.uid]
            ? sampleIndex[datum.uid].patientId
            : '',
        altered: false,
        oqlData: {},
        oqlDataByGene: {},
    };

    // update altered: a single alteration in any track means altered
    caseAlterationData[key].altered =
        caseAlterationData[key].altered || datum.data.length > 0;
}

export function hasValidData(
    sampleAlterationDataByGene: { [key: string]: ExtendedAlteration[] },
    extractValue?: (alteration: ExtendedAlteration) => string
): boolean {
    for (const alterations of _.values(sampleAlterationDataByGene)) {
        for (const alteration of alterations) {
            const value = extractValue
                ? extractValue(alteration)
                : alteration.value;

            // at least one valid value means, there is valid data
            // TODO also filter out values like "NA", "N/A", etc. ?
            if (value && String(value).length > 0) {
                return true;
            }
        }
    }

    // if no valid value is found, then there is no valid data
    return false;
}

export function hasValidMutationData(sampleAlterationDataByGene: {
    [key: string]: ExtendedAlteration[];
}): boolean {
    return hasValidData(sampleAlterationDataByGene, extractMutationValue);
}

function extractMutationValue(alteration: ExtendedAlteration) {
    return `${alteration.proteinChange}${
        !isNotGermlineMutation(alteration) ? ' [germline]' : ''
    }`;
}

export function hasValidStructuralVariantData(sampleAlterationDataByGene: {
    [key: string]: ExtendedAlteration[];
}): boolean {
    return hasValidData(
        sampleAlterationDataByGene,
        extractStructuralVariantValue
    );
}

function extractStructuralVariantValue(alteration: ExtendedAlteration) {
    return alteration.eventInfo;
}

export function decideMolecularProfileSortingOrder(
    profileType: MolecularProfile['molecularAlterationType']
) {
    switch (profileType) {
        case 'MUTATION_EXTENDED':
            return 1;
        case 'COPY_NUMBER_ALTERATION':
            return 2;
        case 'GENESET_SCORE':
            return 3;
        case 'MRNA_EXPRESSION':
            return 4;
        case 'METHYLATION':
            return 5;
        case 'METHYLATION_BINARY':
            return 6;
        case 'PROTEIN_LEVEL':
            return 7;
        default:
            return Number.MAX_VALUE;
    }
}

export function unzipDownloadDataGroupByKey(downloadDataGroupByKey: {
    [key: string]: string[][];
}): { [key: string]: string[][] } {
    return _.mapValues(downloadDataGroupByKey, downloadData => {
        return _.unzip(downloadData);
    });
}

export function downloadDataTextGroupByKey(downloadDataGroupByKey: {
    [key: string]: string[][];
}): { [x: string]: string } {
    return _.mapValues(downloadDataGroupByKey, downloadData => {
        return stringify2DArray(downloadData);
    });
}

export function unzipDownloadData(downloadData: string[][]): string[][] {
    return _.unzip(downloadData);
}

export function downloadDataText(downloadData: string[][]): string {
    return stringify2DArray(downloadData);
}
