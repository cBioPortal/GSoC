import {
    CancerStudy,
    ClinicalAttribute,
    ClinicalData,
    DiscreteCopyNumberData,
    GenericAssayEnrichment,
    GenericAssayBinaryEnrichment,
    GenericAssayCategoricalEnrichment,
    MolecularProfile,
    Mutation,
    NumericGeneMolecularData,
    PatientFilter,
    PatientIdentifier,
    ReferenceGenomeGene,
    Sample,
    StructuralVariant,
} from 'cbioportal-ts-api-client';

import { action, ObservableMap } from 'mobx';
import AccessorsForOqlFilter, {
    getSimplifiedMutationType,
} from '../../shared/lib/oql/AccessorsForOqlFilter';
import {
    filterCBioPortalWebServiceDataByUnflattenedOQLLine,
    isMergedTrackFilter,
    MergedTrackLineFilterOutput,
    OQLLineFilterOutput,
    UnflattenedOQLLineFilterOutput,
} from '../../shared/lib/oql/oqlfilter';
import { Alteration } from '../../shared/lib/oql/oql-parser';
import { getOncoKbOncogenic, groupBy } from '../../shared/lib/StoreUtils';
import { ResultsViewPageStore } from './ResultsViewPageStore';
import {
    MobxPromise,
    MobxPromise_await,
    remoteData,
} from 'cbioportal-frontend-commons';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import _ from 'lodash';
import client from 'shared/api/cbioportalClientInstance';
import { calculateQValues } from '../../shared/lib/calculation/BenjaminiHochbergFDRCalculator';
import { SpecialAttribute } from '../../shared/cache/ClinicalDataCache';
import { isSampleProfiled } from 'shared/lib/isSampleProfiled';
import { AlteredStatus } from './mutualExclusivity/MutualExclusivityUtil';
import ComplexKeyMap from 'shared/lib/complexKeyDataStructures/ComplexKeyMap';
import { CoverageInformation } from '../../shared/lib/GenePanelUtils';
import { GenericAssayEnrichmentWithQ } from './enrichments/EnrichmentsUtil';
import { IDriverAnnotationReport } from 'shared/alterationFiltering/AnnotationFilteringSettings';
import { Gene } from 'cbioportal-utils';
import {
    CustomChart,
    Group,
    VirtualStudy,
} from 'shared/api/session-service/sessionServiceModels';
import { AlterationTypeConstants } from 'shared/constants';
import {
    AnnotatedMutation,
    AnnotatedStructuralVariant,
} from 'shared/model/AnnotatedMutation';
import { CaseAggregatedData } from 'shared/model/CaseAggregatedData';
import { AnnotatedNumericGeneMolecularData } from 'shared/model/AnnotatedNumericGeneMolecularData';
import { AnnotatedExtendedAlteration } from 'shared/model/AnnotatedExtendedAlteration';
import { CustomDriverNumericGeneMolecularData } from 'shared/model/CustomDriverNumericGeneMolecularData';
import { IQueriedCaseData } from 'shared/model/IQueriedCaseData';
import { IQueriedMergedTrackCaseData } from 'shared/model/IQueriedMergedTrackCaseData';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export type ExtendedClinicalAttribute = Omit<
    ClinicalAttribute,
    'clinicalAttributeId'
> & {
    clinicalAttributeId: string | SpecialAttribute;
    molecularProfileIds?: string[];
    comparisonGroup?: Group;
    data?: ClinicalData[];
};

export type SampleAlteredMap = { [trackOqlKey: string]: AlteredStatus[] };

export function computeCustomDriverAnnotationReport(
    annotations: {
        driverFilter: string;
        driverTiersFilter: string;
    }[]
): IDriverAnnotationReport {
    let hasBinary = false;
    let tiersMap: { [tier: string]: boolean } = {};
    for (const annotation of annotations) {
        hasBinary = hasBinary || !!annotation.driverFilter;
        if (annotation.driverTiersFilter) {
            tiersMap[annotation.driverTiersFilter] = true;
        }
    }
    return {
        hasBinary,
        tiers: Object.keys(tiersMap).sort(),
    };
}

export enum OncoprintAnalysisCaseType {
    SAMPLE = 'sample',
    PATIENT = 'patient',
}

export const DEFAULT_GENOME = 'hg19';

export const initializeCustomDriverAnnotationSettings = action(
    (
        report: IDriverAnnotationReport,
        mutationAnnotationSettings: any,
        enableCustomTiers: boolean,
        enableOncoKb: boolean,
        enableHotspots: boolean
    ) => {
        // initialize keys with all available tiers
        for (const tier of report.tiers) {
            mutationAnnotationSettings.driverTiers.set(tier, enableCustomTiers);
        }

        if (enableOncoKb) {
            mutationAnnotationSettings.oncoKb = true;
        }

        if (enableHotspots) {
            mutationAnnotationSettings.hotspots = true;
        }
    }
);

export function annotateMutationPutativeDriver(
    mutation: Mutation,
    putativeDriverInfo: {
        oncoKb: string;
        hotspots: boolean;
        customDriverBinary: boolean;
        customDriverTier?: string;
    }
): AnnotatedMutation {
    const putativeDriver = !!(
        putativeDriverInfo.oncoKb ||
        putativeDriverInfo.hotspots ||
        putativeDriverInfo.customDriverBinary ||
        putativeDriverInfo.customDriverTier
    );

    return Object.assign(
        {
            putativeDriver,
            isHotspot: putativeDriverInfo.hotspots,
            oncoKbOncogenic: putativeDriverInfo.oncoKb,
            simplifiedMutationType: getSimplifiedMutationType(
                mutation.mutationType
            ),
        },
        mutation
    ) as AnnotatedMutation;
}

export function annotateStructuralVariantPutativeDriver(
    structuralVariant: StructuralVariant,
    putativeDriverInfo: {
        oncoKb: string;
        hotspots: boolean;
        customDriverBinary: boolean;
        customDriverTier?: string;
    }
): AnnotatedStructuralVariant {
    const putativeDriver = !!(
        putativeDriverInfo.oncoKb ||
        putativeDriverInfo.hotspots ||
        putativeDriverInfo.customDriverBinary ||
        putativeDriverInfo.customDriverTier
    );
    return {
        putativeDriver,
        isHotspot: putativeDriverInfo.hotspots,
        oncoKbOncogenic: putativeDriverInfo.oncoKb,
        ...structuralVariant,
    } as AnnotatedStructuralVariant;
}

export function annotateMolecularDatum(
    molecularDatum: NumericGeneMolecularData,
    putativeDriverInfo: {
        oncoKb: string;
        customDriverBinary: boolean;
        customDriverTier?: string;
    },
    discreteCnaProfileIds?: string[]
): AnnotatedNumericGeneMolecularData {
    const isCna =
        !discreteCnaProfileIds ||
        discreteCnaProfileIds.includes(molecularDatum.molecularProfileId);
    const putativeDriver =
        isCna &&
        !!(
            putativeDriverInfo.oncoKb ||
            putativeDriverInfo.customDriverBinary ||
            (putativeDriverInfo.customDriverTier &&
                putativeDriverInfo.customDriverTier !== '')
        );
    return Object.assign(
        {
            putativeDriver,
            oncoKbOncogenic: isCna && putativeDriverInfo.oncoKb,
        },
        molecularDatum
    ) as AnnotatedNumericGeneMolecularData;
}

export type FilteredAndAnnotatedDiscreteCNAReport<
    T extends CustomDriverNumericGeneMolecularData = CustomDriverNumericGeneMolecularData
> = {
    data: T[];
    vus: T[];
};

export type FilteredAndAnnotatedStructuralVariantsReport<
    T extends AnnotatedStructuralVariant = AnnotatedStructuralVariant
> = {
    data: T[];
    vus: T[];
    germline: T[];
    vusAndGermline: T[];
};

export function filterAndAnnotateStructuralVariants(
    structuralVariants: StructuralVariant[],
    getPutativeDriverInfo: (
        structuralVariant: StructuralVariant
    ) => {
        oncoKb: string;
        hotspots: boolean;
        customDriverBinary: boolean;
        customDriverTier?: string;
    }
): FilteredAndAnnotatedStructuralVariantsReport {
    const vus: AnnotatedStructuralVariant[] = [];
    const germline: AnnotatedStructuralVariant[] = [];
    const vusAndGermline: AnnotatedStructuralVariant[] = [];
    const filteredAnnotatedMutations = [];
    for (const structuralVariant of structuralVariants) {
        const annotatedStructuralVariant = annotateStructuralVariantPutativeDriver(
            structuralVariant,
            getPutativeDriverInfo(structuralVariant)
        ); // annotate
        const isGermline = false;
        const isVus = !annotatedStructuralVariant.putativeDriver;
        if (isGermline && isVus) {
            vusAndGermline.push(annotatedStructuralVariant);
        } else if (isGermline) {
            germline.push(annotatedStructuralVariant);
        } else if (isVus) {
            vus.push(annotatedStructuralVariant);
        } else {
            filteredAnnotatedMutations.push(annotatedStructuralVariant);
        }
    }
    return {
        data: filteredAnnotatedMutations,
        vus,
        germline,
        vusAndGermline,
    };
}

export function compileStructuralVariants<
    T extends AnnotatedStructuralVariant = AnnotatedStructuralVariant
>(
    report: FilteredAndAnnotatedStructuralVariantsReport<T>,
    excludeVus: boolean,
    excludeGermline: boolean
) {
    let structuralVariants = report.data;
    if (!excludeVus) {
        structuralVariants = structuralVariants.concat(report.vus);
    }
    if (!excludeGermline) {
        structuralVariants = structuralVariants.concat(report.germline);
    }
    if (!excludeVus && !excludeGermline) {
        structuralVariants = structuralVariants.concat(report.vusAndGermline);
    }
    return structuralVariants;
}

export const ONCOKB_ONCOGENIC_LOWERCASE = [
    'likely oncogenic',
    'oncogenic',
    'resistance',
];

export async function fetchQueriedStudies(
    allPhysicalStudies: { [id: string]: CancerStudy },
    queriedIds: string[],
    queriedVirtualStudies: VirtualStudy[]
): Promise<CancerStudy[]> {
    const queriedStudies: CancerStudy[] = [];
    let unknownIds: { [id: string]: boolean } = {};
    for (const id of queriedIds) {
        if (allPhysicalStudies[id]) {
            queriedStudies.push(allPhysicalStudies[id]);
        } else {
            unknownIds[id] = true;
        }
    }

    if (!_.isEmpty(unknownIds)) {
        queriedVirtualStudies
            .filter((vs: VirtualStudy) => unknownIds[vs.id])
            .forEach(virtualStudy => {
                // tslint:disable-next-line:no-object-literal-type-assertion
                const cancerStudy = {
                    allSampleCount: _.sumBy(
                        virtualStudy.data.studies,
                        study => study.samples.length
                    ),
                    studyId: virtualStudy.id,
                    name: virtualStudy.data.name,
                    description: virtualStudy.data.description,
                    cancerTypeId: 'My Virtual Studies',
                } as CancerStudy;
                queriedStudies.push(cancerStudy);
            });
    }

    return queriedStudies;
}

export function groupDataByCase(
    oqlFilter: UnflattenedOQLLineFilterOutput<AnnotatedExtendedAlteration>,
    samples: { uniqueSampleKey: string }[],
    patients: { uniquePatientKey: string }[]
): CaseAggregatedData<AnnotatedExtendedAlteration> {
    const data: AnnotatedExtendedAlteration[] = isMergedTrackFilter(oqlFilter)
        ? _.flatMap(oqlFilter.list, geneLine => geneLine.data)
        : oqlFilter.data;
    return {
        samples: groupBy(
            data,
            datum => datum.uniqueSampleKey,
            samples.map(sample => sample.uniqueSampleKey)
        ),
        patients: groupBy(
            data,
            datum => datum.uniquePatientKey,
            patients.map(sample => sample.uniquePatientKey)
        ),
    };
}

export function filterSubQueryData(
    queryStructure: UnflattenedOQLLineFilterOutput<object>,
    defaultOQLQuery: string,
    data: (
        | AnnotatedMutation
        | NumericGeneMolecularData
        | AnnotatedStructuralVariant
    )[],
    accessorsInstance: AccessorsForOqlFilter,
    samples: { uniqueSampleKey: string }[],
    patients: { uniquePatientKey: string }[]
): IQueriedCaseData<object>[] | undefined {
    function filterDataForLine(oqlLine: string) {
        // assuming that merged track syntax will never allow
        // nesting, each inner OQL line will be one single-gene
        // query
        const alterationsForLine = filterCBioPortalWebServiceDataByUnflattenedOQLLine(
            oqlLine,
            data,
            accessorsInstance,
            defaultOQLQuery
        )[0] as OQLLineFilterOutput<AnnotatedExtendedAlteration>;
        return {
            cases: groupDataByCase(alterationsForLine, samples, patients),
            oql: alterationsForLine,
        };
    }

    if (!isMergedTrackFilter(queryStructure)) {
        return undefined;
    } else {
        return queryStructure.list.map(innerLine =>
            filterDataForLine(innerLine.oql_line)
        );
    }
}

export function isRNASeqProfile(profileId: string): boolean {
    return RegExp(
        `rna_seq_mrna$|rna_seq_v2_mrna$|pan_can_atlas_2018_rna_seq_mrna_median$|pan_can_atlas_2018_rna_seq_v2_mrna_median$`
    ).test(profileId);
}

export function isTCGAPubStudy(studyId: string) {
    return /tcga_pub$/.test(studyId);
}

export function isTCGAProvStudy(studyId: string) {
    return /tcga$/.test(studyId);
}

export function isPanCanStudy(studyId: string) {
    return /tcga_pan_can_atlas/.test(studyId);
}

export function buildResultsViewPageTitle(
    genes: string[],
    studies: CancerStudy[]
) {
    const arr = ['cBioPortal for Cancer Genomics: '];

    if (genes.length) {
        arr.push(genes[0]);
        if (genes.length > 1) {
            arr.push(', ');
            arr.push(genes[1]);
        }
        if (genes.length > 2) {
            arr.push(' and ');
            arr.push((genes.length - 2).toString());
            arr.push(' other ');
            arr.push(genes.length - 2 > 1 ? 'genes' : 'gene');
        }
        if (studies.length) {
            arr.push(' in ');
            arr.push(studies[0].name);
            if (studies.length > 1) {
                arr.push(' and ');
                arr.push((studies.length - 1).toString());
                arr.push(' other ');
                arr.push(studies.length - 1 > 1 ? 'studies' : 'study');
            }
        }
    }
    return arr.join('');
}

export function getMolecularProfiles(query: any) {
    //if there's only one study, we read profiles from query params and filter out undefined
    let molecularProfiles: string[] = [
        query.genetic_profile_ids_PROFILE_MUTATION_EXTENDED,
        query.genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION,
        query.genetic_profile_ids_PROFILE_MRNA_EXPRESSION,
        query.genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION,
        query.genetic_profile_ids_PROFILE_GENESET_SCORE,
        query.genetic_profile_ids_GENERIC_ASSAY,
    ].filter((profile: string | undefined) => !!profile);

    // append 'genetic_profile_ids' which is sometimes in use
    molecularProfiles = molecularProfiles.concat(
        query.genetic_profile_ids || []
    );

    // filter out duplicates
    molecularProfiles = _.uniq(molecularProfiles);

    return molecularProfiles;
}

export function doesQueryHaveCNSegmentData(detailedSamples: Sample[]) {
    if (detailedSamples.length === 0) {
        return false;
    } else if (!('copyNumberSegmentPresent' in detailedSamples[0])) {
        throw 'Passed non-detailed sample projection when detailed expected.';
    } else {
        return _.some(detailedSamples, s => !!s.copyNumberSegmentPresent);
    }
}

export function getSampleAlteredMap(
    filteredAlterationData: IQueriedMergedTrackCaseData[],
    samples: Sample[],
    oqlQuery: string,
    coverageInformation: CoverageInformation,
    selectedMolecularProfileIds: string[],
    studyToMolecularProfiles: _.Dictionary<MolecularProfile[]>,
    defaultOQLQueryAlterations: Alteration[] | false
) {
    const result: SampleAlteredMap = {};
    filteredAlterationData.forEach((element, key) => {
        //1: is not group
        if (element.mergedTrackOqlList === undefined) {
            const notGroupedOql = element.oql as OQLLineFilterOutput<
                AnnotatedExtendedAlteration
            >;
            const sampleKeysMap = _.keyBy(
                _.map(notGroupedOql.data, data => data.uniqueSampleKey)
            );
            const unProfiledSampleKeysMap = _.keyBy(
                samples
                    .filter(sample => {
                        const molecularProfileIds = studyToMolecularProfiles[
                            sample.studyId
                        ]
                            ? _.intersection(
                                  studyToMolecularProfiles[sample.studyId].map(
                                      profile => profile.molecularProfileId
                                  ),
                                  selectedMolecularProfileIds
                              )
                            : selectedMolecularProfileIds;
                        // if not profiled in some genes molecular profile, then we think it is not profiled and will exclude this sample
                        return _.some(
                            _.map(molecularProfileIds, molecularProfileId => {
                                return isSampleProfiled(
                                    sample.uniqueSampleKey,
                                    molecularProfileId,
                                    notGroupedOql.gene,
                                    coverageInformation
                                );
                            }),
                            profiled => profiled === false
                        );
                    })
                    .map(sample => sample.uniqueSampleKey)
            );
            result[
                getSingleGeneResultKey(
                    key,
                    oqlQuery,
                    notGroupedOql,
                    defaultOQLQueryAlterations
                )
            ] = samples.map((sample: Sample) => {
                if (sample.uniqueSampleKey in unProfiledSampleKeysMap) {
                    return AlteredStatus.UNPROFILED;
                } else if (sample.uniqueSampleKey in sampleKeysMap) {
                    return AlteredStatus.ALTERED;
                } else {
                    return AlteredStatus.UNALTERED;
                }
            });
        }
        //2: is group
        else {
            const groupedOql = element.oql as MergedTrackLineFilterOutput<
                AnnotatedExtendedAlteration
            >;
            const sampleKeysMap = _.keyBy(
                _.map(
                    _.flatten(_.map(groupedOql.list, list => list.data)),
                    data => data.uniqueSampleKey
                )
            );
            const groupGenes = _.map(groupedOql.list, oql => oql.gene);
            const unProfiledSampleKeysMap = _.keyBy(
                samples
                    .filter(sample => {
                        const molecularProfileIds = studyToMolecularProfiles[
                            sample.studyId
                        ]
                            ? _.intersection(
                                  studyToMolecularProfiles[sample.studyId].map(
                                      profile => profile.molecularProfileId
                                  ),
                                  selectedMolecularProfileIds
                              )
                            : selectedMolecularProfileIds;
                        // if not profiled in some genes molecular profile, then we think it is not profiled and will exclude this sample
                        return _.some(
                            _.map(molecularProfileIds, molecularProfileId => {
                                // if not profiled in every genes, then the sample is not profiled, or we think it is profiled
                                return _.every(
                                    _.map(groupGenes, gene => {
                                        return isSampleProfiled(
                                            sample.uniqueSampleKey,
                                            molecularProfileId,
                                            gene,
                                            coverageInformation
                                        );
                                    }),
                                    profiled => profiled === false
                                );
                            }),
                            notProfiled => notProfiled === true
                        );
                    })
                    .map(sample => sample.uniqueSampleKey)
            );
            result[getMultipleGeneResultKey(groupedOql)] = samples.map(
                (sample: Sample) => {
                    if (sample.uniqueSampleKey in unProfiledSampleKeysMap) {
                        return AlteredStatus.UNPROFILED;
                    } else if (sample.uniqueSampleKey in sampleKeysMap) {
                        return AlteredStatus.ALTERED;
                    } else {
                        return AlteredStatus.UNALTERED;
                    }
                }
            );
        }
    });
    return result;
}

export function getSingleGeneResultKey(
    key: number,
    oqlQuery: string,
    notGroupedOql: OQLLineFilterOutput<AnnotatedExtendedAlteration>,
    defaultOQLQueryAlterations: Alteration[] | false
) {
    // if oql for gene is the same as the default OQL, it means probably
    //  no oql was specified, so just show the gene
    if (
        _.isEqual(
            notGroupedOql.parsed_oql_line.alterations,
            defaultOQLQueryAlterations
        )
    ) {
        return notGroupedOql.gene;
    }
    //gene with alteration type
    else {
        return notGroupedOql.oql_line.slice(0, -1);
    }
}

export function getMultipleGeneResultKey(
    groupedOql: MergedTrackLineFilterOutput<AnnotatedExtendedAlteration>
) {
    return groupedOql.label
        ? groupedOql.label
        : _.map(groupedOql.list, data => data.gene).join(' / ');
}

export function calculateQValuesAndSortEnrichmentData<
    T extends { pValue: number; qValue?: number }
>(data: T[], sortFunction: (data: any[]) => any[]): any[] {
    const dataWithpValue: T[] = [];
    const dataWithoutpValue: T[] = [];
    data.forEach(datum => {
        if (datum.pValue === undefined) {
            dataWithoutpValue.push(datum);
        } else {
            dataWithpValue.push(datum);
        }
    });

    const sortedByPValue = _.sortBy(dataWithpValue, c => c.pValue);
    const qValues = calculateQValues(sortedByPValue.map(c => c.pValue));

    qValues.forEach((qValue, index) => {
        sortedByPValue[index].qValue = qValue;
    });

    return sortFunction([...sortedByPValue, ...dataWithoutpValue]);
}

export function makeEnrichmentDataPromise<
    T extends {
        cytoband?: string;
        hugoGeneSymbol: string;
        pValue: number;
        qValue?: number;
    }
>(params: {
    resultsViewPageStore?: ResultsViewPageStore;
    await: MobxPromise_await;
    referenceGenesPromise: MobxPromise<{
        [hugoGeneSymbol: string]: ReferenceGenomeGene;
    }>;
    getSelectedProfileMaps: () => { [studyId: string]: MolecularProfile }[];
    fetchData: () => Promise<T[]>;
}): MobxPromise<(T & { qValue: number })[]> {
    return remoteData({
        await: () => {
            const ret = params.await();
            if (params.resultsViewPageStore) {
                ret.push(params.resultsViewPageStore.selectedMolecularProfiles);
            }
            ret.push(params.referenceGenesPromise);
            return ret;
        },
        invoke: async () => {
            const profileMaps = params.getSelectedProfileMaps();
            if (profileMaps) {
                let data = await params.fetchData();
                // filter out query genes, if looking at a queried profile
                // its important that we filter out *before* calculating Q values
                const doFilterQueryGenes =
                    params.resultsViewPageStore &&
                    _.some(
                        params.resultsViewPageStore.selectedMolecularProfiles
                            .result!,
                        selectedMolProfile =>
                            _.some(
                                profileMaps,
                                profileMap =>
                                    profileMap[selectedMolProfile.studyId] !==
                                    undefined
                            )
                    );
                if (doFilterQueryGenes) {
                    const queryGenes = _.keyBy(
                        params.resultsViewPageStore!.hugoGeneSymbols,
                        x => x.toUpperCase()
                    );
                    data = data.filter(
                        d => !(d.hugoGeneSymbol.toUpperCase() in queryGenes)
                    );
                }

                let referenceGenes = params.referenceGenesPromise.result!;
                // add cytoband from reference gene
                for (const d of data) {
                    const refGene = referenceGenes[d.hugoGeneSymbol];

                    if (refGene) d.cytoband = refGene.cytoband;
                }

                return calculateQValuesAndSortEnrichmentData(
                    data,
                    sortEnrichmentData
                );
            } else {
                return [];
            }
        },
    });
}

function sortEnrichmentData(data: any[]): any[] {
    return _.sortBy(data, ['pValue', 'hugoGeneSymbol']);
}

export function makeGenericAssayEnrichmentDataPromise(params: {
    resultViewPageStore?: ResultsViewPageStore;
    await: MobxPromise_await;
    getSelectedProfileMap: () => { [studyId: string]: MolecularProfile };
    fetchData: () => Promise<GenericAssayEnrichment[]>;
}): MobxPromise<GenericAssayEnrichmentWithQ[]> {
    return remoteData({
        await: () => {
            const ret = params.await();
            if (params.resultViewPageStore) {
                ret.push(params.resultViewPageStore.selectedMolecularProfiles);
            }
            return ret;
        },
        invoke: async () => {
            const profileMap = params.getSelectedProfileMap();
            if (profileMap) {
                let data = await params.fetchData();
                return calculateQValuesAndSortEnrichmentData(
                    data,
                    sortGenericAssayEnrichmentData
                );
            } else {
                return [];
            }
        },
    });
}

export function makeGenericAssayBinaryEnrichmentDataPromise(params: {
    resultViewPageStore?: ResultsViewPageStore;
    await: MobxPromise_await;
    getSelectedProfileMap: () => { [studyId: string]: MolecularProfile };
    fetchData: () => Promise<GenericAssayBinaryEnrichment[]>;
}): MobxPromise<GenericAssayBinaryEnrichment[]> {
    return remoteData({
        await: () => {
            const ret = params.await();
            if (params.resultViewPageStore) {
                ret.push(params.resultViewPageStore.selectedMolecularProfiles);
            }
            return ret;
        },
        invoke: async () => {
            const profileMap = params.getSelectedProfileMap();
            if (profileMap) {
                let data = await params.fetchData();
                return calculateQValuesAndSortEnrichmentData(
                    data,
                    sortGenericAssayEnrichmentData
                );
            } else {
                return [];
            }
        },
    });
}

export function makeGenericAssayCategoricalEnrichmentDataPromise(params: {
    resultViewPageStore?: ResultsViewPageStore;
    await: MobxPromise_await;
    getSelectedProfileMap: () => { [studyId: string]: MolecularProfile };
    fetchData: () => Promise<GenericAssayCategoricalEnrichment[]>;
}): MobxPromise<GenericAssayCategoricalEnrichment[]> {
    return remoteData({
        await: () => {
            const ret = params.await();
            if (params.resultViewPageStore) {
                ret.push(params.resultViewPageStore.selectedMolecularProfiles);
            }
            return ret;
        },
        invoke: async () => {
            const profileMap = params.getSelectedProfileMap();
            if (profileMap) {
                let data = await params.fetchData();
                return data;
            } else {
                return [];
            }
        },
    });
}

function sortGenericAssayEnrichmentData(
    data: GenericAssayEnrichmentWithQ[]
): GenericAssayEnrichmentWithQ[] {
    return _.sortBy(data, ['pValue', 'stableId']);
}

export function fetchPatients(samples: Sample[]) {
    let patientKeyToPatientIdentifier: {
        [uniquePatientKey: string]: PatientIdentifier;
    } = {};
    for (const sample of samples) {
        patientKeyToPatientIdentifier[sample.uniquePatientKey] = {
            patientId: sample.patientId,
            studyId: sample.studyId,
        };
    }
    const patientFilter = {
        uniquePatientKeys: _.uniq(
            samples.map((sample: Sample) => sample.uniquePatientKey)
        ),
    } as PatientFilter;

    return client.fetchPatientsUsingPOST({
        patientFilter,
    });
}

// special profiles includes mutation genetic profiles and structural variant profiles and generic assay profiles
export function excludeSpecialMolecularProfiles(
    molecularprofiles: MolecularProfile[]
): MolecularProfile[] {
    const mutationAlterationTypes = [
        AlterationTypeConstants.MUTATION_EXTENDED,
        AlterationTypeConstants.MUTATION_UNCALLED,
        AlterationTypeConstants.FUSION,
        AlterationTypeConstants.STRUCTURAL_VARIANT,
        AlterationTypeConstants.GENERIC_ASSAY,
    ];
    return molecularprofiles.filter(
        profile =>
            !mutationAlterationTypes.includes(profile.molecularAlterationType)
    );
}

export function parseGenericAssayGroups(
    generic_assay_groups: string
): {
    [molecularProfileId: string]: string[];
} {
    const groups = generic_assay_groups
        ? generic_assay_groups.split(';').map((x: string) => x.split(','))
        : [];

    const parsedGroups = groups.reduce(
        (acc: { [molecularProfileId: string]: string[] }, group) => {
            acc[group[0] as string] = group.slice(1);
            return acc;
        },
        {}
    );
    return parsedGroups;
}

export function createDiscreteCopyNumberDataKey(
    d: NumericGeneMolecularData | DiscreteCopyNumberData
) {
    return d.sampleId + '_' + d.molecularProfileId + '_' + d.entrezGeneId;
}

export function evaluateMutationPutativeDriverInfo(
    mutation: Mutation,
    oncoKbDatum: IndicatorQueryResp | undefined | null | false,
    hotspotAnnotationsActive: boolean,
    hotspotDriver: boolean,
    customDriverAnnotationsActive: boolean,
    customDriverTierSelection: ObservableMap<string, boolean> | undefined
) {
    const oncoKb = oncoKbDatum ? getOncoKbOncogenic(oncoKbDatum) : '';
    const hotspots = hotspotAnnotationsActive && hotspotDriver;

    // Set driverFilter to true when:
    // (1) custom drivers active in settings menu
    // (2) the datum has a custom driver annotation
    const customDriverBinary: boolean = !!(
        customDriverAnnotationsActive &&
        mutation.driverFilter === 'Putative_Driver'
    );

    // Set tier information to the tier name when the tiers checkbox
    // is selected for the corresponding tier of the datum in settings menu.
    // This forces the Mutation to be counted as a driver mutation.
    const customDriverTier: string | undefined =
        mutation.driverTiersFilter &&
        customDriverTierSelection &&
        customDriverTierSelection.get(mutation.driverTiersFilter)
            ? mutation.driverTiersFilter
            : undefined;

    return {
        oncoKb,
        hotspots,
        customDriverBinary,
        customDriverTier,
    };
}

export function getExtendsClinicalAttributesFromCustomData(
    customChartSessions: CustomChart[],
    sampleMap: ComplexKeyMap<Sample>
): ExtendedClinicalAttribute[] {
    return customChartSessions.map(customChartSession => {
        const attr: ExtendedClinicalAttribute = {
            datatype: customChartSession.data.datatype,
            description: customChartSession.data.description || '',
            displayName: customChartSession.data.displayName || '',
            patientAttribute: customChartSession.data.patientAttribute,
            clinicalAttributeId: customChartSession.id,
            studyId: '',
            priority: customChartSession.data.priority.toString(),
        };

        attr.data = _.reduce(
            customChartSession.data.data,
            (acc: ClinicalData[], datum) => {
                const sample = sampleMap.get(datum, ['sampleId', 'studyId']);
                if (sample) {
                    acc.push({
                        ...datum,
                        clinicalAttribute: attr as ClinicalAttribute,
                        clinicalAttributeId: attr.clinicalAttributeId,
                        uniquePatientKey: sample.uniquePatientKey,
                        uniqueSampleKey: sample.uniqueSampleKey,
                        patientAttribute: attr.patientAttribute,
                    });
                }

                return acc;
            },
            []
        );

        return attr;
    });
}

export function getGeneAndProfileChunksForRequest(
    maximumDataPointsPerRequest: number,
    numSamples: number,
    genes: Gene[],
    profileIds: string[]
) {
    // Assumes that the number of data points for a request is approximately profiles * genes * samples
    // Splits genes and profiles into chunks for requests so that no individual request is too large

    const genesPerChunk = Math.max(
        // this creates chunks which approximately will have the maximum data points per request
        Math.floor(
            maximumDataPointsPerRequest / (profileIds.length * numSamples)
        ),

        // but we can't have less than 1 gene per chunk
        1
    );

    const profilesPerChunk = Math.max(
        // this creates chunks that will make sure the responses are small enough given the
        //  selected gene chunk size (in case genesPerChunk goes to 1 and it's still not
        //  small enough)
        Math.floor(maximumDataPointsPerRequest / (genesPerChunk * numSamples)),
        1
    );

    return {
        geneChunks: _.chunk(genes, genesPerChunk),
        profileChunks: _.chunk(profileIds, profilesPerChunk),
    };
}
