import {
    CancerStudy,
    ClinicalAttribute,
    ClinicalAttributeCount,
    ClinicalAttributeCountFilter,
    ClinicalData,
    CopyNumberSeg,
    DiscreteCopyNumberData,
    DiscreteCopyNumberFilter,
    Gene,
    GenePanelData,
    GenePanelDataMultipleStudyFilter,
    GenericAssayData,
    GenericAssayDataMultipleStudyFilter,
    GenericAssayMeta,
    Geneset,
    GenesetDataFilterCriteria,
    GenesetMolecularData,
    MolecularDataFilter,
    MolecularDataMultipleStudyFilter,
    MolecularProfile,
    MolecularProfileFilter,
    Mutation,
    MutationFilter,
    MutationMultipleStudyFilter,
    NumericGeneMolecularData,
    ReferenceGenomeGene,
    Sample,
    SampleFilter,
    SampleIdentifier,
    SampleList,
    SampleMolecularIdentifier,
    StructuralVariant,
    StructuralVariantFilter,
} from 'cbioportal-ts-api-client';

import { getClient } from 'shared/api/cbioportalClientInstance';
import {
    cached,
    CanonicalMutationType,
    MobxPromise,
    remoteData,
    stringListToSet,
} from 'cbioportal-frontend-commons';
import {
    action,
    computed,
    IReactionDisposer,
    makeObservable,
    observable,
    reaction,
} from 'mobx';
import { IOncoKbData } from 'cbioportal-utils';
import {
    deriveStructuralVariantType,
    generateQueryStructuralVariantId,
} from 'oncokb-frontend-commons';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import { IndicatorQueryResp } from 'oncokb-ts-api-client';
import GenomeNexusCache from 'shared/cache/GenomeNexusCache';
import GenomeNexusMutationAssessorCache from 'shared/cache/GenomeNexusMutationAssessorCache';
import CancerTypeCache from 'shared/cache/CancerTypeCache';
import MutationCountCache from 'shared/cache/MutationCountCache';
import ClinicalAttributeCache from 'shared/cache/ClinicalAttributeCache';
import DiscreteCNACache from 'shared/cache/DiscreteCNACache';
import PdbHeaderCache from 'shared/cache/PdbHeaderCache';
import {
    buildProteinChange,
    cancerTypeForOncoKb,
    evaluatePutativeDriverInfo,
    existsSomeMutationWithAscnPropertyInCollection,
    fetchAllReferenceGenomeGenes,
    fetchCnaOncoKbDataForOncoprint,
    fetchCopyNumberSegmentsForSamples,
    fetchGenes,
    fetchGermlineConsentedSamples,
    fetchStructuralVariantOncoKbData,
    fetchVariantAnnotationsIndexedByGenomicLocation,
    filterAndAnnotateMolecularData,
    filterAndAnnotateMutations,
    generateDataQueryFilter,
    getAllGenes,
    getGenomeBuildFromStudies,
    getSurvivalClinicalAttributesPrefix,
    groupBy,
    groupBySampleId,
    IDataQueryFilter,
    makeGetOncoKbCnaAnnotationForOncoprint,
    mapSampleIdToClinicalData,
    ONCOKB_DEFAULT,
    fetchOncoKbInfo,
} from 'shared/lib/StoreUtils';
import {
    CoverageInformation,
    getCoverageInformation,
} from 'shared/lib/GenePanelUtils';
import ResultsViewMutationMapperStore from './mutation/ResultsViewMutationMapperStore';
import { getServerConfig, ServerConfigHelpers } from 'config/config';
import _ from 'lodash';
import MutationDataCache from '../../shared/cache/MutationDataCache';
import AccessorsForOqlFilter from '../../shared/lib/oql/AccessorsForOqlFilter';
import {
    createStructuralVariantQuery,
    doesQueryContainMutationOQL,
    doesQueryContainOQL,
    filterCBioPortalWebServiceData,
    filterCBioPortalWebServiceDataByOQLLine,
    filterCBioPortalWebServiceDataByUnflattenedOQLLine,
    getFirstGene,
    getSecondGene,
    nonStructuralVariantsOQLQuery,
    OQLLineFilterOutput,
    structuralVariantsInOQLQuery,
    structVarOQLSpecialValues,
    UnflattenedOQLLineFilterOutput,
    uniqueGenesInOQLQuery,
} from '../../shared/lib/oql/oqlfilter';
import GeneMolecularDataCache from '../../shared/cache/GeneMolecularDataCache';
import GenesetMolecularDataCache from '../../shared/cache/GenesetMolecularDataCache';
import GenesetCorrelatedGeneCache from '../../shared/cache/GenesetCorrelatedGeneCache';
import GenericAssayMolecularDataCache from '../../shared/cache/GenericAssayMolecularDataCache';
import GenesetCache from '../../shared/cache/GenesetCache';
import internalClient from '../../shared/api/cbioportalInternalClientInstance';
import memoize from 'memoize-weak-decorator';
import request from 'superagent';
import { CancerStudyQueryUrlParams } from 'shared/components/query/QueryStore';
import {
    compileStructuralVariants,
    computeCustomDriverAnnotationReport,
    createDiscreteCopyNumberDataKey,
    DEFAULT_GENOME,
    excludeSpecialMolecularProfiles,
    ExtendedClinicalAttribute,
    fetchPatients,
    fetchQueriedStudies,
    filterAndAnnotateStructuralVariants,
    FilteredAndAnnotatedStructuralVariantsReport,
    filterSubQueryData,
    getExtendsClinicalAttributesFromCustomData,
    getGeneAndProfileChunksForRequest,
    getMolecularProfiles,
    getSampleAlteredMap,
    groupDataByCase,
    initializeCustomDriverAnnotationSettings,
    isRNASeqProfile,
    OncoprintAnalysisCaseType,
    parseGenericAssayGroups,
} from './ResultsViewPageStoreUtils';
import MobxPromiseCache from '../../shared/lib/MobxPromiseCache';
import { isSampleProfiledInMultiple } from '../../shared/lib/isSampleProfiled';
import ClinicalDataCache, {
    clinicalAttributeIsINCOMPARISONGROUP,
    SpecialAttribute,
} from '../../shared/cache/ClinicalDataCache';
import { getDefaultMolecularProfiles } from '../../shared/lib/getDefaultMolecularProfiles';
import {
    parseSamplesSpecifications,
    populateSampleSpecificationsFromVirtualStudies,
    ResultsViewTab,
    substitutePhysicalStudiesForVirtualStudies,
} from './ResultsViewPageHelpers';
import {
    filterAndSortProfiles,
    getGenesetProfiles,
    sortRnaSeqProfilesToTop,
} from './coExpression/CoExpressionTabUtils';
import { generateDownloadFilenamePrefixByStudies } from 'shared/lib/FilenameUtils';
import {
    convertComparisonGroupClinicalAttribute,
    makeComparisonGroupClinicalAttributes,
    makeProfiledInClinicalAttributes,
} from '../../shared/components/oncoprint/ResultsViewOncoprintUtils';
import { annotateAlterationTypes } from '../../shared/lib/oql/annotateAlterationTypes';
import sessionServiceClient from '../../shared/api/sessionServiceInstance';
import comparisonClient from '../../shared/api/comparisonGroupClientInstance';
import { AppStore } from '../../AppStore';
import { getNumSamples } from '../groupComparison/GroupComparisonUtils';
import {
    ChartMeta,
    ChartMetaDataTypeEnum,
    FGA_VS_MUTATION_COUNT_KEY,
    getChartMetaDataType,
    getDefaultPriorityByUniqueKey,
    getFilteredMolecularProfilesByAlterationType,
    getFilteredStudiesWithSamples,
    getPriorityByClinicalAttribute,
    getUniqueKey,
    getUniqueKeyFromMolecularProfileIds,
    SpecialChartsUniqueKeyEnum,
    StudyWithSamples,
} from 'pages/studyView/StudyViewUtils';
import { IVirtualStudyProps } from 'pages/studyView/virtualStudy/VirtualStudy';
import { decideMolecularProfileSortingOrder } from './download/DownloadUtils';
import ResultsViewURLWrapper from 'pages/resultsView/ResultsViewURLWrapper';
import { ChartTypeEnum } from 'pages/studyView/StudyViewConfig';
import {
    COMMON_GENERIC_ASSAY_PROPERTY,
    fetchGenericAssayMetaByMolecularProfileIdsGroupByMolecularProfileId,
    fetchGenericAssayMetaByMolecularProfileIdsGroupedByGenericAssayType,
    getGenericAssayMetaPropertyOrDefault,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { createVariantAnnotationsByMutationFetcher } from 'shared/components/mutationMapper/MutationMapperUtils';
import { isMixedReferenceGenome } from 'shared/lib/referenceGenomeUtils';
import {
    ALTERED_COLOR,
    completeSessionGroups,
    getAlteredByOncoprintTrackGroups,
    getAlteredVsUnalteredGroups,
    ResultsViewComparisonGroup,
    UNALTERED_COLOR,
} from './comparison/ResultsViewComparisonUtils';
import { makeUniqueColorGetter } from '../../shared/components/plots/PlotUtils';
import ComplexKeyMap from '../../shared/lib/complexKeyDataStructures/ComplexKeyMap';
import { getSuffixOfMolecularProfile } from 'shared/lib/molecularProfileUtils';
import {
    AlterationTypeConstants,
    CLINICAL_ATTRIBUTE_FIELD_ENUM,
    CLINICAL_ATTRIBUTE_ID_ENUM,
    DataTypeConstants,
    GENETIC_PROFILE_FIELD_ENUM,
    GENOME_NEXUS_ARG_FIELD_ENUM,
    REQUEST_ARG_ENUM,
    SAMPLE_CANCER_TYPE_UNKNOWN,
} from 'shared/constants';
import {
    buildDriverAnnotationSettings,
    IAnnotationFilterSettings,
    IDriverAnnotationReport,
} from '../../shared/alterationFiltering/AnnotationFilteringSettings';
import { ISettingsMenuButtonVisible } from 'shared/components/driverAnnotations/SettingsMenuButton';
import oql_parser, {
    Alteration,
    SingleGeneQuery,
} from 'shared/lib/oql/oql-parser';
import {
    ANNOTATED_PROTEIN_IMPACT_FILTER_TYPE,
    createAnnotatedProteinImpactTypeFilter,
    createCategoricalFilter,
    createNumericalFilter,
} from 'shared/lib/MutationUtils';
import SampleSet from 'shared/lib/sampleDataStructures/SampleSet';
import {
    getTextForDataField,
    MutationTableColumnType,
} from 'shared/components/mutationTable/MutationTable';
import { getClonalValue } from 'shared/components/mutationTable/column/clonal/ClonalColumnFormatter';
import { getCancerCellFractionValue } from 'shared/components/mutationTable/column/cancerCellFraction/CancerCellFractionColumnFormatter';
import { getExpectedAltCopiesValue } from 'shared/components/mutationTable/column/expectedAltCopies/ExpectedAltCopiesColumnFormatter';
import TumorAlleleFreqColumnFormatter from 'shared/components/mutationTable/column/TumorAlleleFreqColumnFormatter';
import NormalAlleleFreqColumnFormatter from 'shared/components/mutationTable/column/NormalAlleleFreqColumnFormatter';
import ChromosomeColumnFormatter from 'shared/components/mutationTable/column/ChromosomeColumnFormatter';
import { getASCNMethodValue } from 'shared/components/mutationTable/column/ascnMethod/ASCNMethodColumnFormatter';
import SampleColumnFormatter from 'shared/components/mutationTable/column/SampleColumnFormatter';
import GeneColumnFormatter from 'shared/components/mutationTable/column/GeneColumnFormatter';
import ProteinChangeColumnFormatter from 'shared/components/mutationTable/column/ProteinChangeColumnFormatter';
import MutationTypeColumnFormatter from 'shared/components/mutationTable/column/MutationTypeColumnFormatter';
import VariantTypeColumnFormatter from 'shared/components/mutationTable/column/VariantTypeColumnFormatter';
import HgvsgColumnFormatter from 'shared/components/mutationTable/column/HgvsgColumnFormatter';
import ClinvarColumnFormatter from 'shared/components/mutationTable/column/ClinvarColumnFormatter';
import SignalColumnFormatter from 'shared/components/mutationTable/column/SignalColumnFormatter';
import {
    ComparisonSession,
    Group,
    ResultPageSettings,
    SessionGroupData,
    VirtualStudy,
} from 'shared/api/session-service/sessionServiceModels';
import { ICBioData } from 'pathway-mapper';
import { getAlterationData } from 'shared/components/oncoprint/OncoprintUtils';
import { PageUserSession } from 'shared/userSession/PageUserSession';
import { PageType } from 'shared/userSession/PageType';
import { ClinicalTrackConfig } from 'shared/components/oncoprint/Oncoprint';
import eventBus from 'shared/events/eventBus';
import { ErrorMessages } from 'shared/errorMessages';
import AnalysisStore from 'shared/lib/comparison/AnalysisStore';
import {
    compileMutations,
    FilteredAndAnnotatedMutationsReport,
} from 'shared/lib/comparison/AnalysisStoreUtils';
import {
    AnnotatedMutation,
    AnnotatedStructuralVariant,
} from 'shared/model/AnnotatedMutation';
import { SiteError } from 'shared/model/appMisc';
import { allowExpressionCrossStudy } from 'shared/lib/allowExpressionCrossStudy';
import { CaseAggregatedData } from 'shared/model/CaseAggregatedData';
import { AnnotatedNumericGeneMolecularData } from 'shared/model/AnnotatedNumericGeneMolecularData';
import { AnnotatedExtendedAlteration } from 'shared/model/AnnotatedExtendedAlteration';
import { ExtendedSample } from 'shared/model/ExtendedSample';
import { CustomDriverNumericGeneMolecularData } from 'shared/model/CustomDriverNumericGeneMolecularData';
import { ExtendedAlteration } from 'shared/model/ExtendedAlteration';
import { IQueriedCaseData } from 'shared/model/IQueriedCaseData';
import { GeneticEntity } from 'shared/model/GeneticEntity';
import { IQueriedMergedTrackCaseData } from 'shared/model/IQueriedMergedTrackCaseData';
import { ResultsViewStructuralVariantMapperStore } from 'pages/resultsView/structuralVariant/ResultsViewStructuralVariantMapperStore';
import {
    ONCOKB_DEFAULT_INFO,
    USE_DEFAULT_PUBLIC_INSTANCE_FOR_ONCOKB,
} from 'react-mutation-mapper';
import { RGBAColor } from 'oncoprintjs';

type Optional<T> =
    | { isApplicable: true; value: T }
    | { isApplicable: false; value?: undefined };

const DEFAULT_RPPA_THRESHOLD = 2;
const DEFAULT_Z_SCORE_THRESHOLD = 2;

export enum SampleListCategoryType {
    'w_mut' = 'w_mut',
    'w_cna' = 'w_cna',
    'w_mut_cna' = 'w_mut_cna',
}

export enum GeneticEntityType {
    'GENE' = 'GENE',
    'GENESET' = 'GENESET',
    'GENERIC_ASSAY' = 'GENERIC_ASSAY',
    'PHOSPHOPROTEIN' = 'PHOSPHOPROTEIN',
}

export const SampleListCategoryTypeToFullId = {
    [SampleListCategoryType.w_mut]: 'all_cases_with_mutation_data',
    [SampleListCategoryType.w_cna]: 'all_cases_with_cna_data',
    [SampleListCategoryType.w_mut_cna]: 'all_cases_with_mutation_and_cna_data',
};

export type SamplesSpecificationElement =
    | { studyId: string; sampleId: string; sampleListId: undefined }
    | { studyId: string; sampleId: undefined; sampleListId: string };

export function buildDefaultOQLProfile(
    profilesTypes: string[],
    zScoreThreshold: number,
    rppaScoreThreshold: number
) {
    var default_oql_uniq: any = {};
    for (var i = 0; i < profilesTypes.length; i++) {
        var type = profilesTypes[i];
        switch (type) {
            case AlterationTypeConstants.MUTATION_EXTENDED:
                default_oql_uniq['MUT'] = true;
                break;
            case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
                default_oql_uniq['AMP'] = true;
                default_oql_uniq['HOMDEL'] = true;
                break;
            case AlterationTypeConstants.MRNA_EXPRESSION:
                default_oql_uniq['EXP>=' + zScoreThreshold] = true;
                default_oql_uniq['EXP<=-' + zScoreThreshold] = true;
                break;
            case AlterationTypeConstants.PROTEIN_LEVEL:
                default_oql_uniq['PROT>=' + rppaScoreThreshold] = true;
                default_oql_uniq['PROT<=-' + rppaScoreThreshold] = true;
                break;
            case AlterationTypeConstants.STRUCTURAL_VARIANT:
                default_oql_uniq['FUSION'] = true;
                break;
        }
    }
    return Object.keys(default_oql_uniq).join(' ');
}

export function extendSamplesWithCancerType(
    samples: Sample[],
    clinicalDataForSamples: ClinicalData[],
    studies: CancerStudy[]
) {
    const clinicalDataGroupedBySampleId = _.groupBy(
        clinicalDataForSamples,
        (clinicalData: ClinicalData) => clinicalData.uniqueSampleKey
    );
    // note that this table is actually mutating underlying sample.  it's not worth it to clone samples just
    // for purity
    const extendedSamples = samples.map((sample: ExtendedSample) => {
        const clinicalData =
            clinicalDataGroupedBySampleId[sample.uniqueSampleKey];
        if (clinicalData) {
            clinicalData.forEach((clinicalDatum: ClinicalData) => {
                switch (clinicalDatum.clinicalAttributeId) {
                    case CLINICAL_ATTRIBUTE_ID_ENUM.CANCER_TYPE_DETAILED:
                        sample.cancerTypeDetailed = clinicalDatum.value;
                        break;
                    case CLINICAL_ATTRIBUTE_ID_ENUM.CANCER_TYPE:
                        sample.cancerType = clinicalDatum.value;
                        break;
                    default:
                        break;
                }
            });
        }
        return sample;
    });

    //make a map by studyId for easy access in following loop
    const studyMap = _.keyBy(studies, (study: CancerStudy) => study.studyId);

    // now we need to fix any samples which do not have both cancerType and cancerTypeDetailed
    extendedSamples.forEach((sample: ExtendedSample) => {
        //if we have no cancer subtype, then make the subtype the parent type
        if (!sample.cancerType) {
            // we need to fall back to studies cancerType
            const study = studyMap[sample.studyId];
            if (study) {
                sample.cancerType = study.cancerType.name;
            } else {
                sample.cancerType = SAMPLE_CANCER_TYPE_UNKNOWN;
            }
        }
        if (sample.cancerType && !sample.cancerTypeDetailed) {
            sample.cancerTypeDetailed = sample.cancerType;
        }
    });

    return extendedSamples;
}

export type ModifyQueryParams = {
    selectedSampleListId: string;
    selectedSampleIds: string[];
    caseIdsMode: 'sample' | 'patient';
};

interface IResultsViewExclusionSettings {
    setExcludeGermlineMutations: (value: boolean) => void;
    setHideUnprofiledSamples: (
        value: IAnnotationFilterSettings['hideUnprofiledSamples']
    ) => void;
}

const ONCOPRINT_COLOR_CONFIG = 'clinicalTracksColorConfig';

/* fields and methods in the class below are ordered based on roughly
/* chronological setup concerns, rather than on encapsulation and public API */
/* tslint:disable: member-ordering */
export class ResultsViewPageStore extends AnalysisStore
    implements
        IAnnotationFilterSettings,
        IResultsViewExclusionSettings,
        ISettingsMenuButtonVisible {
    private reactionDisposers: IReactionDisposer[] = [];

    public pageUserSession: PageUserSession<ResultPageSettings>;

    constructor(
        protected appStore: AppStore,
        public urlWrapper: ResultsViewURLWrapper
    ) {
        super();
        makeObservable(this);
        this.getURL();

        const store = this;

        this.driverAnnotationSettings = buildDriverAnnotationSettings(
            () => store.didHotspotFailInOncoprint
        );

        this.pageUserSession = new PageUserSession<ResultPageSettings>(
            appStore,
            ServerConfigHelpers.sessionServiceIsEnabled()
        );

        this.pageUserSession.id = {
            page: PageType.RESULTS_VIEW,
            origin: this.cancerStudyIds,
        };

        this.reactionDisposers.push(
            reaction(
                () => this.urlWrapper.query.cancer_study_list,
                () => {
                    this.driverAnnotationSettings = buildDriverAnnotationSettings(
                        () => store.didHotspotFailInOncoprint
                    );
                },
                { fireImmediately: true }
            )
        );

        this.reactionDisposers.push(
            reaction(
                () => [this.cancerStudyIds],
                () => {
                    this.pageUserSession.id = {
                        page: PageType.RESULTS_VIEW,
                        origin: this.cancerStudyIds,
                    };
                }
            )
        );

        const clinicalTracksColorConfig = localStorage.getItem(
            ONCOPRINT_COLOR_CONFIG
        );
        if (clinicalTracksColorConfig !== null) {
            this._userSelectedStudiesToClinicalTracksColors = JSON.parse(
                clinicalTracksColorConfig
            );
        }
    }

    destroy() {
        this.reactionDisposers.forEach(disposer => disposer());
    }

    // Use gene + driver as key, e.g. TP53_DRIVER or TP53_NO_DRIVER

    private mutationMapperStoreByGeneWithDriverKey: {
        [hugoGeneSymbolWithDriver: string]: ResultsViewMutationMapperStore;
    } = {};
    @computed get oqlText() {
        return this.urlWrapper.query.gene_list;
    }

    @computed get genesetIds() {
        return this.urlWrapper.query.geneset_list &&
            this.urlWrapper.query.geneset_list.trim().length
            ? this.urlWrapper.query.geneset_list.trim().split(/\s+/)
            : [];
    }

    @computed get selectedGenericAssayEntitiesGroupByMolecularProfileId() {
        return parseGenericAssayGroups(
            this.urlWrapper.query.generic_assay_groups
        );
    }

    @computed
    get cancerStudyIds() {
        return this.urlWrapper.query.cancer_study_list.split(',');
    }
    @computed
    get cancerStudyListSorted() {
        return this.cancerStudyIds.sort().join(',');
    }

    @computed
    get rppaScoreThreshold() {
        return this.urlWrapper.query.RPPA_SCORE_THRESHOLD
            ? parseFloat(this.urlWrapper.query.RPPA_SCORE_THRESHOLD)
            : DEFAULT_RPPA_THRESHOLD;
    }

    @computed
    get zScoreThreshold() {
        return this.urlWrapper.query.Z_SCORE_THRESHOLD
            ? parseFloat(this.urlWrapper.query.Z_SCORE_THRESHOLD)
            : DEFAULT_Z_SCORE_THRESHOLD;
    }

    @computed
    get selectedMolecularProfileIds() {
        //use profileFilter when both profileFilter and MolecularProfileIds are present in query
        if (isNaN(parseInt(this.urlWrapper.query.profileFilter, 10))) {
            return [];
        }
        return getMolecularProfiles(this.urlWrapper.query);
    }

    public handleTabChange(id: string, replace?: boolean) {
        this.urlWrapper.updateURL({}, `results/${id}`, false, replace);
    }

    @computed get tabId() {
        return this.urlWrapper.tabId || ResultsViewTab.ONCOPRINT;
    }

    @observable public isSettingsMenuVisible = false;

    @observable public checkingVirtualStudies = false;

    @observable public urlValidationError: string | null = null;

    @computed get profileFilter() {
        return this.urlWrapper.query.profileFilter || '0';
    }

    @observable ajaxErrors: Error[] = [];

    @observable public sessionIdURL = '';

    @observable queryFormVisible: boolean = false;

    @observable _userSelectedStudiesToClinicalTracksColors: {
        [studies: string]: {
            [trackLabel: string]: {
                [attributeValue: string]: RGBAColor;
            };
        };
    } = { global: {} };

    @computed get doNonSelectedDownloadableMolecularProfilesExist() {
        return (
            this.nonSelectedDownloadableMolecularProfilesGroupByName.result &&
            _.keys(
                this.nonSelectedDownloadableMolecularProfilesGroupByName.result
            ).length > 0
        );
    }

    @observable public modifyQueryParams:
        | ModifyQueryParams
        | undefined = undefined;

    @action.bound
    public setUserSelectedClinicalTrackColor(
        label: string,
        value: string,
        color: RGBAColor | undefined
    ) {
        // if color is undefined, delete color from userSelectedClinicalAttributeColors if exists
        // else, set the color in userSelectedClinicalAttributeColors
        if (
            !color &&
            this._userSelectedStudiesToClinicalTracksColors['global'][label] &&
            this._userSelectedStudiesToClinicalTracksColors['global'][label][
                value
            ]
        ) {
            delete this._userSelectedStudiesToClinicalTracksColors['global'][
                label
            ][value];
        } else if (color) {
            if (
                !this._userSelectedStudiesToClinicalTracksColors['global'][
                    label
                ]
            ) {
                this._userSelectedStudiesToClinicalTracksColors['global'][
                    label
                ] = {};
            }
            this._userSelectedStudiesToClinicalTracksColors['global'][label][
                value
            ] = color;
        }
        localStorage.setItem(
            ONCOPRINT_COLOR_CONFIG,
            JSON.stringify(this._userSelectedStudiesToClinicalTracksColors)
        );
    }

    @computed get userSelectedStudiesToClinicalTracksColors() {
        return this._userSelectedStudiesToClinicalTracksColors;
    }

    @action.bound
    public setOncoprintAnalysisCaseType(e: OncoprintAnalysisCaseType) {
        this.urlWrapper.updateURL({
            show_samples: (e === OncoprintAnalysisCaseType.SAMPLE).toString(),
        } as Partial<CancerStudyQueryUrlParams>);
    }

    @computed
    public get includeGermlineMutations() {
        return this.urlWrapper.query.exclude_germline_mutations !== 'true';
    }

    @action.bound
    public setExcludeGermlineMutations(e: boolean) {
        this.urlWrapper.updateURL({
            exclude_germline_mutations: e.toString(),
        });
    }

    public set includeGermlineMutations(include: boolean) {
        this.setExcludeGermlineMutations(!include);
    }

    // Somatic mutation filtering is not supported for Results View atm.
    public get includeSomaticMutations() {
        return true;
    }

    // Unknown status mutation filtering is not supported for Results View atm.
    public get includeUnknownStatusMutations() {
        return true;
    }

    @computed
    public get usePatientLevelEnrichments() {
        return this.urlWrapper.query.patient_enrichments === 'true';
    }

    @action.bound
    public setUsePatientLevelEnrichments(e: boolean) {
        this.urlWrapper.updateURL({ patient_enrichments: e.toString() });
    }

    @computed
    public get hideUnprofiledSamples() {
        const value = this.urlWrapper.query.hide_unprofiled_samples;
        if (value === 'any' || value === 'totally') {
            return value;
        } else {
            return false;
        }
    }

    @action.bound
    public setHideUnprofiledSamples(
        e: IAnnotationFilterSettings['hideUnprofiledSamples']
    ) {
        this.urlWrapper.updateURL({
            hide_unprofiled_samples: (e || false).toString(),
        });
    }

    public set hideUnprofiledSamples(include: 'any' | 'totally' | false) {
        this.setHideUnprofiledSamples(include);
    }

    /**
     * All genes found in all 'single' and 'fusion' queries
     */
    @computed get hugoGeneSymbols() {
        if (this.urlWrapper.query?.gene_list?.length) {
            return uniqueGenesInOQLQuery(this.urlWrapper.query.gene_list);
        } else {
            return [];
        }
    }

    /**
     * Genes of 'single gene' queries
     * (i.e. non-fusion queries, without an upstream or downstream gene)
     */
    @computed get singleHugoGeneSymbols() {
        if (this.urlWrapper.query?.gene_list.length) {
            return nonStructuralVariantsOQLQuery(
                this.urlWrapper.query.gene_list
            );
        } else {
            return [];
        }
    }

    @computed get structVarQueries(): SingleGeneQuery[] {
        if (this.urlWrapper.query?.gene_list.length) {
            return structuralVariantsInOQLQuery(
                this.urlWrapper.query.gene_list
            );
        } else {
            return [];
        }
    }

    /**
     * All genes ($.gene and $.alterations.gene) of fusion queries
     * (i.e. queries with an upstream or downstream gene or special value)
     */
    @computed get structVarHugoGeneSymbols(): string[] {
        return _(this.structVarQueries)
            .flatMap(query => [getFirstGene(query), getSecondGene(query)])
            .compact()
            .uniq()
            .value();
    }

    @computed get structuralVariantIdentifiers() {
        if (
            this.urlWrapper.query.gene_list &&
            this.urlWrapper.query.gene_list.length > 0
        ) {
            return structuralVariantsInOQLQuery(
                this.urlWrapper.query.gene_list
            );
        } else {
            return [];
        }
    }

    @computed get queryContainsOql() {
        return doesQueryContainOQL(this.urlWrapper.query.gene_list);
    }

    @computed get queryContainsMutationOql() {
        return doesQueryContainMutationOQL(this.urlWrapper.query.gene_list);
    }

    @computed get sampleListCategory(): SampleListCategoryType | undefined {
        if (
            this.urlWrapper.query.case_set_id &&
            [
                SampleListCategoryType.w_mut,
                SampleListCategoryType.w_cna,
                SampleListCategoryType.w_mut_cna,
            ].includes(this.urlWrapper.query.case_set_id as any)
        ) {
            return this.urlWrapper.query.case_set_id as SampleListCategoryType;
        } else {
            return undefined;
        }
    }

    private makeMutationsTabFilteringSettings() {
        const self = this;
        let _excludeVus = observable.box<boolean | undefined>(undefined);
        let _excludeGermline = observable.box<boolean | undefined>(undefined);
        return observable({
            useOql: true,
            get excludeVus() {
                if (_excludeVus.get() === undefined) {
                    return !self.driverAnnotationSettings.includeVUS;
                } else {
                    return _excludeVus.get()!;
                }
            },
            get excludeGermline() {
                if (_excludeGermline.get() === undefined) {
                    return !self.includeGermlineMutations;
                } else {
                    return _excludeGermline.get()!;
                }
            },
            set excludeVus(s: boolean) {
                _excludeVus.set(s);
            },
            set excludeGermline(s: boolean) {
                _excludeGermline.set(s);
            },
        });
    }

    private getURL() {
        const shareURL = window.location.href;

        if (!shareURL.includes('session_id')) return;

        const showSamples = shareURL.indexOf('&show');
        if (showSamples > -1) {
            this.sessionIdURL = shareURL.slice(0, showSamples);
        }
    }

    readonly selectedMolecularProfiles = remoteData<MolecularProfile[]>({
        await: () => [
            this.studyToMolecularProfiles,
            this.studies,
            this.molecularProfileIdToMolecularProfile,
        ],
        invoke: () => {
            // if there are multiple studies or if there are no selected molecular profiles in query
            // derive default profiles based on profileFilter (refers to old data priority)
            if (
                this.studies.result.length > 1 ||
                this.selectedMolecularProfileIds.length === 0
            ) {
                return Promise.resolve(
                    getDefaultMolecularProfiles(
                        this.studyToMolecularProfiles.result!,
                        this.profileFilter
                    )
                );
            } else {
                // if we have only one study, then consult the selectedMolecularProfileIds because
                // user can directly select set
                const idLookupMap = _.keyBy(
                    this.selectedMolecularProfileIds,
                    (id: string) => id
                ); // optimization

                const hasMutationProfileInQuery = _.some(
                    this.selectedMolecularProfileIds,
                    molecularProfileId => {
                        const molecularProfile = this
                            .molecularProfileIdToMolecularProfile.result[
                            molecularProfileId
                        ];
                        return (
                            molecularProfile !== undefined &&
                            molecularProfile.molecularAlterationType ===
                                AlterationTypeConstants.MUTATION_EXTENDED
                        );
                    }
                );

                if (hasMutationProfileInQuery) {
                    const structuralVariantProfile = _.find(
                        this.molecularProfilesInStudies.result!,
                        molecularProfile => {
                            return (
                                molecularProfile.molecularAlterationType ===
                                AlterationTypeConstants.STRUCTURAL_VARIANT
                            );
                        }
                    );
                    if (structuralVariantProfile) {
                        idLookupMap[
                            structuralVariantProfile.molecularProfileId
                        ] = structuralVariantProfile.molecularProfileId;
                    }
                }
                return Promise.resolve(
                    this.molecularProfilesInStudies.result!.filter(
                        (profile: MolecularProfile) =>
                            profile.molecularProfileId in idLookupMap
                    )
                );
            }
        },
    });

    readonly clinicalAttributes_profiledIn = remoteData<
        (ClinicalAttribute & { molecularProfileIds: string[] })[]
    >({
        await: () => [
            this.coverageInformation,
            this.molecularProfileIdToMolecularProfile,
            this.selectedMolecularProfiles,
            this.studyIds,
        ],
        invoke: () => {
            return Promise.resolve(
                makeProfiledInClinicalAttributes(
                    this.coverageInformation.result!.samples,
                    this.molecularProfileIdToMolecularProfile.result!,
                    this.selectedMolecularProfiles.result!,
                    this.studyIds.result!.length === 1
                )
            );
        },
    });

    /**
     * The oncoprint can have tracks which indicate comparison group membership per sample.
     *  We want to know which comparison groups are referenced in these tracks, if any
     *  are currently visible.
     */
    @computed.struct get comparisonGroupsReferencedInURL() {
        // Get selected clinical attribute tracks:
        const tracks = this.pageUserSession.userSettings?.clinicallist;
        const inComparisonGroupTracks =
            tracks &&
            tracks.filter((track: ClinicalTrackConfig) =>
                clinicalAttributeIsINCOMPARISONGROUP({
                    clinicalAttributeId: track.stableId,
                })
            );

        if (inComparisonGroupTracks) {
            return inComparisonGroupTracks.map((track: ClinicalTrackConfig) =>
                convertComparisonGroupClinicalAttribute(track.stableId, false)
            );
        } else {
            return [];
        }
    }

    readonly savedComparisonGroupsForStudies = remoteData<Group[]>({
        await: () => [this.queriedStudies],
        invoke: async () => {
            let ret: Group[] = [];
            if (this.appStore.isLoggedIn) {
                try {
                    const queriedStudyIds = this.queriedStudies.result!.map(
                        x => x.studyId
                    );
                    const groups = await comparisonClient.getGroupsForStudies(
                        queriedStudyIds
                    );
                    ret = ret.concat(groups);
                } catch (e) {
                    // fail silently
                }
            }
            // add any groups that are referenced in URL
            for (const id of this.comparisonGroupsReferencedInURL) {
                try {
                    ret.push(await comparisonClient.getGroup(id));
                } catch (e) {
                    // ignore any errors with group ids that don't exist
                }
            }
            return ret;
        },
    });

    readonly queryDerivedGroups = remoteData<SessionGroupData[]>({
        await: () => [
            this.studyIds,
            this.filteredAlteredSamples,
            this.filteredUnalteredAndProfiledSamples,
            this.totallyUnprofiledSamples,
            this.filteredSamples,
            this.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
            this.defaultOQLQuery,
        ],
        invoke: () => {
            const groups: SessionGroupData[] = [];

            // altered/unaltered groups
            groups.push(
                ...getAlteredVsUnalteredGroups(
                    this.usePatientLevelEnrichments,
                    this.studyIds.result!,
                    this.filteredAlteredSamples.result!,
                    this.filteredUnalteredAndProfiledSamples.result!,
                    this.totallyUnprofiledSamples.result!,
                    this.queryContainsOql,
                    this.hideUnprofiledSamples
                )
            );

            // altered per oncoprint track groups
            groups.push(
                ...getAlteredByOncoprintTrackGroups(
                    this.usePatientLevelEnrichments,
                    this.studyIds.result!,
                    this.filteredSamples.result!,
                    this.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine
                        .result!,
                    this.defaultOQLQuery.result!
                )
            );
            return Promise.resolve(groups);
        },
    });

    readonly comparisonTabComparisonSession = remoteData<ComparisonSession>({
        await: () => [this.studyIds],
        invoke: () => {
            const sessionId = this.urlWrapper.query
                .comparison_createdGroupsSessionId;

            if (sessionId) {
                // if theres a session holding onto user-created groups, add groups from there
                return comparisonClient.getComparisonSession(sessionId);
            } else {
                return Promise.resolve({
                    id: '',
                    groups: [],
                    origin: this.studyIds.result!,
                });
            }
        },
    });
    readonly comparisonTabGroups = remoteData<ResultsViewComparisonGroup[]>({
        await: () => [
            this.queryDerivedGroups,
            this.comparisonTabComparisonSession,
            this.sampleMap,
        ],
        invoke: () => {
            const uniqueColorGetter = makeUniqueColorGetter([
                ALTERED_COLOR,
                UNALTERED_COLOR,
            ]);
            const groups = this.queryDerivedGroups.result!.concat(
                this.comparisonTabComparisonSession.result!.groups
            );
            const defaultOrderGroups = completeSessionGroups(
                this.usePatientLevelEnrichments,
                groups,
                this.sampleMap.result!,
                uniqueColorGetter
            );
            return Promise.resolve(defaultOrderGroups);
        },
    });

    readonly clinicalAttributes_comparisonGroupMembership = remoteData<
        (ClinicalAttribute & { comparisonGroup: Group })[]
    >({
        await: () => [this.savedComparisonGroupsForStudies],
        invoke: () =>
            Promise.resolve(
                makeComparisonGroupClinicalAttributes(
                    this.savedComparisonGroupsForStudies.result!
                )
            ),
    });

    readonly selectedMolecularProfileIdsByAlterationType = remoteData<{
        [alterationType: string]: MolecularProfile[];
    }>({
        await: () => [this.selectedMolecularProfiles],
        invoke: () => {
            const profiles: MolecularProfile[] = this.selectedMolecularProfiles
                .result!;
            return Promise.resolve(
                _.groupBy(
                    profiles,
                    GENETIC_PROFILE_FIELD_ENUM.MOLECULAR_ALTERATION_TYPE
                )
            );
        },
    });

    readonly clinicalAttributes = remoteData<ExtendedClinicalAttribute[]>({
        await: () => [
            this.studyIds,
            this.clinicalAttributes_profiledIn,
            this.clinicalAttributes_comparisonGroupMembership,
            this.customAttributes,
            this.samples,
            this.patients,
        ],
        invoke: async () => {
            const serverAttributes = await getClient().fetchClinicalAttributesUsingPOST(
                {
                    studyIds: this.studyIds.result!,
                }
            );
            const specialAttributes = [
                {
                    clinicalAttributeId: SpecialAttribute.MutationSpectrum,
                    datatype: CLINICAL_ATTRIBUTE_FIELD_ENUM.DATATYPE_COUNTS_MAP,
                    description:
                        'Number of point mutations in the sample counted by different types of nucleotide changes.',
                    displayName: 'Mutation spectrum',
                    patientAttribute: false,
                    studyId: '',
                    priority: '0', // TODO: change?
                } as ClinicalAttribute,
            ];
            if (this.studyIds.result!.length > 1) {
                // if more than one study, add "Study of Origin" attribute
                specialAttributes.push({
                    clinicalAttributeId: SpecialAttribute.StudyOfOrigin,
                    datatype: CLINICAL_ATTRIBUTE_FIELD_ENUM.DATATYPE_STRING,
                    description: 'Study which the sample is a part of.',
                    displayName: 'Study of origin',
                    patientAttribute: false,
                    studyId: '',
                    priority: '0', // TODO: change?
                } as ClinicalAttribute);
            }
            if (this.samples.result!.length !== this.patients.result!.length) {
                // if different number of samples and patients, add "Num Samples of Patient" attribute
                specialAttributes.push({
                    clinicalAttributeId: SpecialAttribute.NumSamplesPerPatient,
                    datatype: CLINICAL_ATTRIBUTE_FIELD_ENUM.DATATYPE_NUMBER,
                    description: 'Number of queried samples for each patient.',
                    displayName: '# Samples per Patient',
                    patientAttribute: true,
                } as ClinicalAttribute);
            }
            return [
                ...serverAttributes,
                ...specialAttributes,
                ...this.clinicalAttributes_profiledIn.result!,
                ...this.clinicalAttributes_comparisonGroupMembership.result!,
                ...this.customAttributes.result!,
            ];
        },
    });

    // TODO: Should include all clinical attributes, not just server attributes
    readonly mutationsTabClinicalAttributes = remoteData<ClinicalAttribute[]>({
        await: () => [this.studyIds],
        invoke: async () => {
            const clinicalAttributes = await getClient().fetchClinicalAttributesUsingPOST(
                {
                    studyIds: this.studyIds.result!,
                }
            );
            const excludeList = ['CANCER_TYPE_DETAILED', 'MUTATION_COUNT'];

            return _.uniqBy(
                clinicalAttributes.filter(
                    x => !excludeList.includes(x.clinicalAttributeId)
                ),
                x => x.clinicalAttributeId
            );
        },
    });

    readonly clinicalAttributeIdToClinicalAttribute = remoteData({
        await: () => [this.clinicalAttributes],
        invoke: () =>
            Promise.resolve(
                _.keyBy(
                    this.clinicalAttributes.result!,
                    CLINICAL_ATTRIBUTE_FIELD_ENUM.ID
                )
            ),
    });

    readonly clinicalAttributeIdToAvailableSampleCount = remoteData({
        await: () => [
            this.samples,
            this.sampleMap,
            this.studies,
            this.clinicalAttributes,
            this.studyToDataQueryFilter,
            this.clinicalAttributes_profiledIn,
            this.clinicalAttributes_comparisonGroupMembership,
            this.customAttributes,
        ],
        invoke: async () => {
            let clinicalAttributeCountFilter: ClinicalAttributeCountFilter;
            if (this.studies.result.length === 1) {
                // try using sample list id
                const studyId = this.studies.result![0].studyId;
                const dqf = this.studyToDataQueryFilter.result[studyId];
                if (dqf.sampleListId) {
                    clinicalAttributeCountFilter = {
                        sampleListId: dqf.sampleListId,
                    } as ClinicalAttributeCountFilter;
                } else {
                    clinicalAttributeCountFilter = {
                        sampleIdentifiers: dqf.sampleIds!.map(sampleId => ({
                            sampleId,
                            studyId,
                        })),
                    } as ClinicalAttributeCountFilter;
                }
            } else {
                // use sample identifiers
                clinicalAttributeCountFilter = {
                    sampleIdentifiers: this.samples.result!.map(sample => ({
                        sampleId: sample.sampleId,
                        studyId: sample.studyId,
                    })),
                } as ClinicalAttributeCountFilter;
            }

            const result = await internalClient.getClinicalAttributeCountsUsingPOST(
                {
                    clinicalAttributeCountFilter,
                }
            );
            // build map
            const ret: { [clinicalAttributeId: string]: number } = _.reduce(
                result,
                (
                    map: { [clinicalAttributeId: string]: number },
                    next: ClinicalAttributeCount
                ) => {
                    map[next.clinicalAttributeId] =
                        map[next.clinicalAttributeId] || 0;
                    map[next.clinicalAttributeId] += next.count;
                    return map;
                },
                {}
            );
            // add count = 0 for any remaining clinical attributes, since service doesnt return count 0
            for (const clinicalAttribute of this.clinicalAttributes.result!) {
                if (!(clinicalAttribute.clinicalAttributeId in ret)) {
                    ret[clinicalAttribute.clinicalAttributeId] = 0;
                }
            }
            // add counts for "special" clinical attributes
            ret[
                SpecialAttribute.NumSamplesPerPatient
            ] = this.samples.result!.length;
            ret[SpecialAttribute.StudyOfOrigin] = this.samples.result!.length;
            let samplesWithMutationData = 0,
                samplesWithCNAData = 0;
            for (const sample of this.samples.result!) {
                samplesWithMutationData += +!!sample.sequenced;
                samplesWithCNAData += +!!sample.copyNumberSegmentPresent;
            }
            ret[SpecialAttribute.MutationSpectrum] = samplesWithMutationData;
            // add counts for "ProfiledIn" clinical attributes
            for (const attr of this.clinicalAttributes_profiledIn.result!) {
                ret[attr.clinicalAttributeId] = this.samples.result!.length;
            }
            // add counts for "ComparisonGroup" clinical attributes
            const sampleMap = this.sampleMap.result!;
            for (const attr of this.clinicalAttributes_comparisonGroupMembership
                .result!) {
                ret[attr.clinicalAttributeId] = getNumSamples(
                    attr.comparisonGroup!.data,
                    (studyId, sampleId) => {
                        return sampleMap.has({ studyId, sampleId });
                    }
                );
            }
            // add counts for custom chart clinical attributes
            for (const attr of this.customAttributes.result!) {
                ret[attr.clinicalAttributeId] = attr.data!.filter(
                    d => d.value !== 'NA'
                ).length;
            }
            return ret;
        },
    });

    readonly clinicalAttributeIdToAvailableFrequency = remoteData({
        await: () => [
            this.clinicalAttributeIdToAvailableSampleCount,
            this.samples,
        ],
        invoke: () => {
            const numSamples = this.samples.result!.length;
            return Promise.resolve(
                _.mapValues(
                    this.clinicalAttributeIdToAvailableSampleCount.result!,
                    count => (100 * count) / numSamples
                )
            );
        },
    });

    readonly cnSegments = remoteData<CopyNumberSeg[]>(
        {
            await: () => [this.filteredSamples],
            invoke: () =>
                fetchCopyNumberSegmentsForSamples(this.filteredSamples.result!),
        },
        []
    );

    readonly cnSegmentsByChromosome = remoteData<{
        [chromosome: string]: MobxPromise<CopyNumberSeg[]>;
    }>(
        {
            await: () => [
                this.genes,
                this.filteredSamples,
                this.referenceGenes,
            ],
            invoke: () => {
                const uniqueReferenceGeneChromosomes = _.uniq(
                    this.referenceGenes.result!.map(g => g.chromosome)
                );
                return Promise.resolve(
                    uniqueReferenceGeneChromosomes.reduce(
                        (
                            map: {
                                [chromosome: string]: MobxPromise<
                                    CopyNumberSeg[]
                                >;
                            },
                            chromosome: string
                        ) => {
                            map[chromosome] = remoteData<CopyNumberSeg[]>({
                                invoke: () =>
                                    fetchCopyNumberSegmentsForSamples(
                                        this.filteredSamples.result!,
                                        chromosome
                                    ),
                            });
                            return map;
                        },
                        {}
                    )
                );
            },
        },
        {}
    );

    /**
     * All molecular data that is 'special', i.e. not a:
     * - structural variant
     * - mutation
     * - generic essay
     * See also {@link excludeSpecialMolecularProfiles}
     */
    readonly molecularData = remoteData<NumericGeneMolecularData[]>({
        await: () => [
            this.sampleKeyToSample,
            this.molecularData_preload,
            this.genes,
            this.selectedMolecularProfiles,
            this.samples,
        ],
        invoke: () => {
            const sampleKeys = this.sampleKeyToSample.result!;
            return Promise.resolve(
                this.molecularData_preload.result.filter(
                    m => m.uniqueSampleKey in sampleKeys
                )
            );
        },
    });

    // loading molecular data based on profileId (instead of individual samples) provides
    // two optimizations.
    // 1. we can load this data before we know samples
    // 2. backend can cache based on finite set of profiles
    // we then have to filter this using samples, which can be loaded concurrently instead of serially
    readonly molecularData_preload = remoteData<NumericGeneMolecularData[]>({
        await: () => [this.genes, this.studies, this.selectedMolecularProfiles],
        invoke: async () => {
            // we get mutations with mutations endpoint, structural variants and fusions with structural variant endpoint, generic assay with generic assay endpoint.
            // filter out mutation genetic profile and structural variant profiles and generic assay profiles
            const profilesWithoutMutationProfile = excludeSpecialMolecularProfiles(
                this.selectedMolecularProfiles.result!
            );
            const genes = this.genes.result;

            if (
                profilesWithoutMutationProfile.length &&
                genes != undefined &&
                genes.length
            ) {
                const molecularProfileIds = profilesWithoutMutationProfile.map(
                    p => p.molecularProfileId
                );
                const numSamples = _.sumBy(
                    this.studies.result!,
                    s => s.allSampleCount
                );

                // if size of response is too big (around 1.6 million), the request seems to fail. This is a conservative limit
                const maximumDataPointsPerRequest = 1500000;

                const {
                    geneChunks,
                    profileChunks,
                } = getGeneAndProfileChunksForRequest(
                    maximumDataPointsPerRequest,
                    numSamples,
                    genes,
                    molecularProfileIds
                );

                const dataPromises: Promise<NumericGeneMolecularData[]>[] = [];

                geneChunks.forEach(geneChunk => {
                    profileChunks.forEach(profileChunk => {
                        const molecularDataMultipleStudyFilter = {
                            entrezGeneIds: geneChunk.map(g => g.entrezGeneId),
                            molecularProfileIds: profileChunk,
                        } as MolecularDataMultipleStudyFilter;

                        dataPromises.push(
                            getClient().fetchMolecularDataInMultipleMolecularProfilesUsingPOST(
                                {
                                    projection:
                                        REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                                    molecularDataMultipleStudyFilter,
                                }
                            )
                        );
                    });
                });

                const allData = await Promise.all(dataPromises);
                return _.flatten(allData);
            }

            return [];
        },
        default: [],
    });

    // Isolate discrete CNA data from other NumericMolecularData
    // and add the custom driver annotations to data points
    readonly discreteCNAMolecularData = remoteData<
        CustomDriverNumericGeneMolecularData[]
    >({
        await: () => [this.discreteCopyNumberAlterations, this.molecularData],
        invoke: () => {
            const cnaData = _.filter(
                this.molecularData.result as any,
                (d: any) => {
                    return _.includes(
                        this.cnaMolecularProfileIds,
                        d.molecularProfileId
                    );
                }
            );
            _.forEach(cnaData, (d: any) => {
                // Lookup the DiscreteCopyNumberData datum that
                // holds the custom driver annotation.
                const discreteCopyNumberDatumKey = createDiscreteCopyNumberDataKey(
                    d
                );
                const discreteCopyNumberDatum =
                    discreteCopyNumberDatumKey in
                    this.sampleIdAndEntrezIdToDiscreteCopyNumberData
                        ? this.sampleIdAndEntrezIdToDiscreteCopyNumberData[
                              discreteCopyNumberDatumKey
                          ]
                        : undefined;

                d.driverFilter = discreteCopyNumberDatum
                    ? discreteCopyNumberDatum.driverFilter
                    : '';
                d.driverFilterAnnotation = discreteCopyNumberDatum
                    ? discreteCopyNumberDatum.driverFilterAnnotation
                    : '';
                d.driverTiersFilter = discreteCopyNumberDatum
                    ? discreteCopyNumberDatum.driverTiersFilter
                    : '';
                d.driverTiersFilterAnnotation = discreteCopyNumberDatum
                    ? discreteCopyNumberDatum.driverTiersFilterAnnotation
                    : '';
            });
            return Promise.resolve(
                cnaData as CustomDriverNumericGeneMolecularData[]
            );
        },
    });

    // other molecular profiles data download needs the data from non queried molecular profiles
    readonly nonSelectedDownloadableMolecularData = remoteData<
        NumericGeneMolecularData[]
    >({
        await: () => [
            this.genes,
            this.nonSelectedDownloadableMolecularProfiles,
            this.samples,
        ],
        invoke: () => {
            // we get mutations with mutations endpoint, structural variants and fusions with structural variant endpoint.
            // filter out mutation genetic profile and structural variant profiles
            const profilesWithoutMutationProfile = excludeSpecialMolecularProfiles(
                this.nonSelectedDownloadableMolecularProfiles.result
            );
            const genes = this.genes.result;

            if (
                profilesWithoutMutationProfile.length &&
                genes != undefined &&
                genes.length
            ) {
                const profilesWithoutMutationProfileGroupByStudyId = _.groupBy(
                    profilesWithoutMutationProfile,
                    profile => profile.studyId
                );
                // find samples which share studyId with profile and add identifier
                const sampleIdentifiers: SampleMolecularIdentifier[] = this.samples.result
                    .filter(
                        sample =>
                            sample.studyId in
                            profilesWithoutMutationProfileGroupByStudyId
                    )
                    .reduce((acc: SampleMolecularIdentifier[], sample) => {
                        acc = acc.concat(
                            profilesWithoutMutationProfileGroupByStudyId[
                                sample.studyId
                            ].map(profile => {
                                return {
                                    molecularProfileId:
                                        profile.molecularProfileId,
                                    sampleId: sample.sampleId,
                                } as SampleMolecularIdentifier;
                            })
                        );
                        return acc;
                    }, []);

                if (sampleIdentifiers.length) {
                    return getClient().fetchMolecularDataInMultipleMolecularProfilesUsingPOST(
                        {
                            projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                            molecularDataMultipleStudyFilter: {
                                entrezGeneIds: _.map(
                                    this.genes.result,
                                    (gene: Gene) => gene.entrezGeneId
                                ),
                                sampleMolecularIdentifiers: sampleIdentifiers,
                            } as MolecularDataMultipleStudyFilter,
                        }
                    );
                }
            }

            return Promise.resolve([]);
        },
    });

    readonly coexpressionTabMolecularProfiles = remoteData<MolecularProfile[]>({
        await: () => [this.molecularProfilesInStudies],
        invoke: () =>
            Promise.resolve(
                sortRnaSeqProfilesToTop(
                    filterAndSortProfiles(
                        this.molecularProfilesInStudies.result!
                    ).concat(
                        getGenesetProfiles(
                            this.molecularProfilesInStudies.result!
                        )
                    )
                )
            ),
    });

    readonly isThereDataForCoExpressionTab = remoteData<boolean>({
        await: () => [
            this.molecularProfilesInStudies,
            this.genes,
            this.samples,
        ],
        invoke: () => {
            const coExpressionProfiles = filterAndSortProfiles(
                this.molecularProfilesInStudies.result!
            );
            const studyToProfiles = _.groupBy(
                coExpressionProfiles,
                GENETIC_PROFILE_FIELD_ENUM.STUDY_ID
            );
            // we know these are all mrna and protein profiles
            const sampleMolecularIdentifiers = _.flatten(
                this.samples.result!.map(s => {
                    const profiles = studyToProfiles[s.studyId];
                    if (profiles) {
                        return profiles.map(p => ({
                            molecularProfileId: p.molecularProfileId,
                            sampleId: s.sampleId,
                        }));
                    } else {
                        return [];
                    }
                })
            );
            const entrezGeneIds = this.genes.result!.map(g => g.entrezGeneId);
            if (
                sampleMolecularIdentifiers.length > 0 &&
                entrezGeneIds.length > 0
            ) {
                return getClient()
                    .fetchMolecularDataInMultipleMolecularProfilesUsingPOSTWithHttpInfo(
                        {
                            molecularDataMultipleStudyFilter: {
                                entrezGeneIds,
                                sampleMolecularIdentifiers,
                            } as MolecularDataMultipleStudyFilter,
                            projection: REQUEST_ARG_ENUM.PROJECTION_META,
                        }
                    )
                    .then(function(response: request.Response) {
                        const count = parseInt(
                            response.header['total-count'],
                            10
                        );
                        return count > 0;
                    });
            } else {
                return Promise.resolve(false);
            }
        },
    });

    // remoteNdexUrl queries Ndex's iquery. The result is either the full URL to
    // query, or an empty string.
    readonly remoteNdexUrl = remoteData<string>({
        await: () => [
            this.studyIds,
            this.genes,
            this.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
        ],
        invoke: async () => {
            var result = '';
            const alterationData = this.alterationFrequencyDataForQueryGenes;

            if (
                this.studyIds.result!.length > 0 &&
                this.genes.result!.length > 0 &&
                this.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!
                    .length > 0
            ) {
                const postData = {
                    // this might be necessary at some point
                    // studyid: this.studyIds.result![0],
                    geneList: this.genes.result!.map(g => g.hugoGeneSymbol),
                    sourceList: ['enrichment'],
                    alterationData,
                    /* TODO: disable alteration services for now, until we have
                     * https://github.com/cBioPortal/cbioportal/issues/9305
                    geneAnnotationServices: {
                        mutation: "https://iquery-cbio-dev.ucsd.edu/integratedsearch/v1/mutationfrequency",
                        alteration: "http://localhost"
                    }
                    */
                };

                var urlResponse;

                try {
                    urlResponse = (await request
                        .post(
                            'https://iquery-cbio.ucsd.edu/integratedsearch/v1/'
                        )
                        .send(postData)
                        .set('Accept', 'application/json')
                        .timeout(30000)) as any;
                } catch (err) {
                    // Just eat the exception. Result will be empty string.
                }

                if (
                    urlResponse &&
                    urlResponse.body &&
                    urlResponse.body.webURL &&
                    urlResponse.body.webURL.startsWith('https://')
                ) {
                    result = urlResponse.body.webURL;
                }
            }

            return Promise.resolve(result);
        },
    });

    // remoteNgchmUrl queries mdanderson.org to test if there are NGCHMs for one selected
    // study.  The result is either the full URL to a portal page, or an empty string.
    readonly remoteNgchmUrl = remoteData<string>({
        await: () => [this.studyIds],
        invoke: async () => {
            var result = '';

            if (this.studyIds.result!.length === 1) {
                const queryData = {
                    studyid: this.studyIds.result![0],
                    format: 'json',
                };

                var urlResponse;

                try {
                    urlResponse = (await request
                        .get('https://bioinformatics.mdanderson.org/study2url')
                        .timeout(30000)
                        .query(queryData)) as any;
                } catch (err) {
                    // Just eat the exception. Result will be empty string.
                }

                if (urlResponse && urlResponse.body.fileContent) {
                    const parsedUrlResponse = JSON.parse(
                        urlResponse.body.fileContent.trimEnd()
                    ) as any;

                    if (parsedUrlResponse.length >= 1) {
                        // This is faked out for now.  study2url needs mods to include site url
                        result =
                            'https://bioinformatics.mdanderson.org/TCGA/NGCHMPortal?' +
                            parsedUrlResponse[0];
                    }
                }
            }

            return Promise.resolve(result);
        },
    });

    readonly molecularProfilesWithData = remoteData<MolecularProfile[]>({
        await: () => [
            this.molecularProfilesInStudies,
            this.studyToDataQueryFilter,
            this.genes,
            this.genesets,
        ],
        invoke: async () => {
            const ret: MolecularProfile[] = [];
            const promises = [];
            const studyToDataQueryFilter = this.studyToDataQueryFilter.result!;
            for (const profile of this.molecularProfilesInStudies.result!) {
                const dataQueryFilter = studyToDataQueryFilter[profile.studyId];

                // there could be no samples if a study doesn't have a sample list matching a specified category (e.g. cna only)
                // skip when sampleIds is an empty list
                if (
                    !dataQueryFilter ||
                    (_.isEmpty(dataQueryFilter.sampleIds) &&
                        !dataQueryFilter.sampleListId)
                ) {
                    continue;
                }

                const molecularProfileId = profile.molecularProfileId;
                const projection = REQUEST_ARG_ENUM.PROJECTION_META;
                const dataFilter = {
                    entrezGeneIds: this.genes.result!.map(g => g.entrezGeneId),
                    ...dataQueryFilter,
                } as MolecularDataFilter & MutationFilter;

                if (
                    profile.molecularAlterationType ===
                    AlterationTypeConstants.MUTATION_EXTENDED
                ) {
                    // handle mutation profile
                    promises.push(
                        getClient()
                            .fetchMutationsInMolecularProfileUsingPOSTWithHttpInfo(
                                {
                                    molecularProfileId,
                                    mutationFilter: dataFilter,
                                    projection,
                                }
                            )
                            .then(function(response: request.Response) {
                                const count = parseInt(
                                    response.header['sample-count'],
                                    10
                                );
                                if (count > 0) {
                                    // theres data for at least one of the query genes
                                    ret.push(profile);
                                }
                            })
                    );
                } else if (
                    profile.molecularAlterationType ===
                    AlterationTypeConstants.MUTATION_UNCALLED
                ) {
                    // exclude the MUTATION_UNCALLED profile, this profile should only be used in patient view
                } else if (
                    profile.molecularAlterationType ===
                        AlterationTypeConstants.GENESET_SCORE ||
                    profile.molecularAlterationType ===
                        AlterationTypeConstants.GENERIC_ASSAY ||
                    profile.molecularAlterationType ===
                        AlterationTypeConstants.STRUCTURAL_VARIANT
                ) {
                    // geneset profile, we dont have the META projection for geneset data, so just add it
                    /*promises.push(internalClient.fetchGeneticDataItemsUsingPOST({
                        geneticProfileId: molecularProfileId,
                        genesetDataFilterCriteria: {
                            genesetIds: this.genesets.result!.map(g=>g.genesetId),
                            ...dataQueryFilter
                        } as GenesetDataFilterCriteria,
                        projection
                    }).then(function(response: request.Response) {
                        const count = parseInt(response.header["total-count"], 10);
                        if (count > 0) {
                            // theres data for at least one of the query genes
                            ret.push(profile);
                        }
                    }));*/
                    ret.push(profile);
                } else {
                    // handle non-mutation profile
                    promises.push(
                        getClient()
                            .fetchAllMolecularDataInMolecularProfileUsingPOSTWithHttpInfo(
                                {
                                    molecularProfileId,
                                    molecularDataFilter: dataFilter,
                                    projection,
                                }
                            )
                            .then(function(response: request.Response) {
                                const count = parseInt(
                                    response.header['total-count'],
                                    10
                                );
                                if (count > 0) {
                                    // theres data for at least one of the query genes
                                    ret.push(profile);
                                }
                            })
                    );
                }
            }
            await Promise.all(promises);
            return ret;
        },
    });

    // TODO: there is some duplication here with the same function in
    // PathwayMapper. Moved it out for re-use in NDEx.
    readonly nonOqlFilteredAlterations = remoteData<ExtendedAlteration[]>({
        await: () => [
            this.filteredAndAnnotatedMutations,
            this.filteredAndAnnotatedCnaData,
            this.filteredAndAnnotatedStructuralVariants,
            this.filteredAndAnnotatedNonGenomicData,
            this.selectedMolecularProfiles,
            this.entrezGeneIdToGene,
        ],
        invoke: () => {
            const accessors = new AccessorsForOqlFilter(
                this.selectedMolecularProfiles.result!
            );
            const entrezGeneIdToGene = this.entrezGeneIdToGene.result!;
            let result = [
                ...this.filteredAndAnnotatedMutations.result!,
                ...this.filteredAndAnnotatedCnaData.result!,
                ...this.filteredAndAnnotatedStructuralVariants.result!,
                ...this.filteredAndAnnotatedNonGenomicData.result!,
            ];
            return Promise.resolve(
                result.map(d => {
                    const extendedD: ExtendedAlteration = annotateAlterationTypes(
                        d,
                        accessors
                    );

                    // we are folding structural variants into the alterations collect
                    // and thus need to provide them with hugoGeneGeneSymbol
                    // this is a problem with intermingling SVs (which have two genes)
                    // with all other alterations, which have only one
                    if (
                        extendedD.molecularProfileAlterationType ===
                        'STRUCTURAL_VARIANT'
                    ) {
                        extendedD.hugoGeneSymbol =
                            entrezGeneIdToGene[extendedD.site1EntrezGeneId]
                                ?.hugoGeneSymbol ||
                            entrezGeneIdToGene[extendedD.site2EntrezGeneId]
                                ?.hugoGeneSymbol;
                    } else {
                        extendedD.hugoGeneSymbol =
                            entrezGeneIdToGene[d.entrezGeneId].hugoGeneSymbol;
                    }

                    extendedD.molecularProfileAlterationType = accessors.molecularAlterationType(
                        d.molecularProfileId
                    );
                    return extendedD;
                })
            );
        },
    });

    readonly oqlFilteredMutationsReport = remoteData({
        await: () => [
            this._filteredAndAnnotatedMutationsReport,
            this.selectedMolecularProfiles,
            this.defaultOQLQuery,
        ],
        invoke: () => {
            return Promise.resolve(
                _.mapValues(
                    this._filteredAndAnnotatedMutationsReport.result!,
                    data =>
                        filterCBioPortalWebServiceData(
                            this.oqlText,
                            data,
                            new AccessorsForOqlFilter(
                                this.selectedMolecularProfiles.result!
                            ),
                            this.defaultOQLQuery.result!
                        )
                )
            );
        },
    });

    readonly oqlFilteredStructuralVariantsReport = remoteData({
        await: () => [
            this._filteredAndAnnotatedStructuralVariantsReport,
            this.selectedMolecularProfiles,
            this.defaultOQLQuery,
        ],
        invoke: () => {
            return Promise.resolve(
                _.mapValues(
                    this._filteredAndAnnotatedStructuralVariantsReport.result!,
                    data =>
                        filterCBioPortalWebServiceData(
                            this.oqlText,
                            data,
                            new AccessorsForOqlFilter(
                                this.selectedMolecularProfiles.result!
                            ),
                            this.defaultOQLQuery.result!
                        )
                )
            );
        },
    });

    readonly oqlFilteredMolecularDataReport = remoteData({
        await: () => [
            this._filteredAndAnnotatedMolecularDataReport,
            this.selectedMolecularProfiles,
            this.defaultOQLQuery,
        ],
        invoke: () => {
            return Promise.resolve(
                _.mapValues(
                    this._filteredAndAnnotatedMolecularDataReport.result!,
                    data =>
                        filterCBioPortalWebServiceData(
                            this.oqlText,
                            data,
                            new AccessorsForOqlFilter(
                                this.selectedMolecularProfiles.result!
                            ),
                            this.defaultOQLQuery.result!
                        )
                )
            );
        },
    });

    readonly oqlFilteredAlterations = remoteData<ExtendedAlteration[]>({
        await: () => [
            this.filteredAndAnnotatedMutations,
            this.filteredAndAnnotatedNonGenomicData,
            this.filteredAndAnnotatedCnaData,
            this.filteredAndAnnotatedStructuralVariants,
            this.selectedMolecularProfiles,
            this.defaultOQLQuery,
        ],
        invoke: () => {
            if (this.oqlText.trim() != '') {
                return Promise.resolve(
                    filterCBioPortalWebServiceData(
                        this.oqlText,
                        [
                            ...this.filteredAndAnnotatedMutations.result!,
                            ...this.filteredAndAnnotatedCnaData.result!,
                            ...this.filteredAndAnnotatedStructuralVariants
                                .result!,
                            ...this.filteredAndAnnotatedNonGenomicData.result!,
                        ],
                        new AccessorsForOqlFilter(
                            this.selectedMolecularProfiles.result!
                        ),
                        this.defaultOQLQuery.result!
                    )
                );
            } else {
                return Promise.resolve([]);
            }
        },
    });

    readonly oqlFilteredCaseAggregatedData = remoteData<
        CaseAggregatedData<ExtendedAlteration>
    >({
        await: () => [this.oqlFilteredAlterations, this.samples, this.patients],
        invoke: () => {
            return Promise.resolve({
                samples: groupBy(
                    this.oqlFilteredAlterations.result!,
                    alteration => alteration.uniqueSampleKey,
                    this.samples.result!.map(sample => sample.uniqueSampleKey)
                ),
                patients: groupBy(
                    this.oqlFilteredAlterations.result!,
                    alteration => alteration.uniquePatientKey,
                    this.patients.result!.map(sample => sample.uniquePatientKey)
                ),
            });
        },
    });

    readonly nonOqlFilteredCaseAggregatedData = remoteData<
        CaseAggregatedData<ExtendedAlteration>
    >({
        await: () => [
            this.nonOqlFilteredAlterations,
            this.samples,
            this.patients,
        ],
        invoke: () => {
            return Promise.resolve({
                samples: groupBy(
                    this.nonOqlFilteredAlterations.result!,
                    alteration => alteration.uniqueSampleKey,
                    this.samples.result!.map(sample => sample.uniqueSampleKey)
                ),
                patients: groupBy(
                    this.nonOqlFilteredAlterations.result!,
                    alteration => alteration.uniquePatientKey,
                    this.patients.result!.map(sample => sample.uniquePatientKey)
                ),
            });
        },
    });

    readonly oqlFilteredCaseAggregatedDataByUnflattenedOQLLine = remoteData<
        IQueriedMergedTrackCaseData[]
    >({
        await: () => [
            this.filteredAndAnnotatedMutations,
            this.filteredAndAnnotatedCnaData,
            this.filteredAndAnnotatedStructuralVariants,
            this.filteredAndAnnotatedNonGenomicData,
            this.selectedMolecularProfiles,
            this.defaultOQLQuery,
            this.samples,
            this.patients,
        ],
        invoke: () => {
            const data = [
                ...this.filteredAndAnnotatedMutations.result!,
                ...this.filteredAndAnnotatedCnaData.result!,
                ...this.filteredAndAnnotatedStructuralVariants.result!,
                ...this.filteredAndAnnotatedNonGenomicData.result!,
            ];
            const accessorsInstance = new AccessorsForOqlFilter(
                this.selectedMolecularProfiles.result!
            );
            const defaultOQLQuery = this.defaultOQLQuery.result!;
            const samples = this.samples.result!;
            const patients = this.patients.result!;

            if (this.oqlText.trim() === '') {
                return Promise.resolve([]);
            } else {
                const filteredAlterationsByOQLLine: UnflattenedOQLLineFilterOutput<
                    AnnotatedExtendedAlteration
                >[] = filterCBioPortalWebServiceDataByUnflattenedOQLLine(
                    this.oqlText,
                    data,
                    accessorsInstance,
                    defaultOQLQuery
                );

                return Promise.resolve(
                    filteredAlterationsByOQLLine.map(oqlLine => ({
                        cases: groupDataByCase(oqlLine, samples, patients),
                        oql: oqlLine,
                        mergedTrackOqlList: filterSubQueryData(
                            oqlLine,
                            defaultOQLQuery,
                            data,
                            accessorsInstance,
                            samples,
                            patients
                        ),
                    }))
                );
            }
        },
    });

    @computed get alterationFrequencyDataForQueryGenes() {
        const alterationFrequencyData: ICBioData[] = [];

        this.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach(
            alterationData => {
                const data = getAlterationData(
                    this.samples.result,
                    this.patients.result,
                    this.coverageInformation.result!,
                    this.filteredSequencedSampleKeysByGene.result!,
                    this.filteredSequencedPatientKeysByGene.result!,
                    this.selectedMolecularProfiles.result!,
                    alterationData,
                    true,
                    this.genes.result!
                );

                if (data) {
                    alterationFrequencyData.push(data);
                }
            }
        );

        return alterationFrequencyData;
    }

    readonly isSampleAlteredMap = remoteData({
        await: () => [
            this.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine,
            this.filteredSamples,
            this.coverageInformation,
            this.selectedMolecularProfiles,
            this.studyToMolecularProfiles,
            this.defaultOQLQueryAlterations,
        ],
        invoke: async () => {
            return getSampleAlteredMap(
                this.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!,
                this.filteredSamples.result!,
                this.oqlText,
                this.coverageInformation.result!,
                this.selectedMolecularProfiles.result!.map(
                    profile => profile.molecularProfileId
                ),
                this.studyToMolecularProfiles.result!,
                this.defaultOQLQueryAlterations.result!
            );
        },
    });

    readonly oqlFilteredCaseAggregatedDataByOQLLine = remoteData<
        IQueriedCaseData<AnnotatedExtendedAlteration>[]
    >({
        await: () => [
            this.filteredAndAnnotatedMutations,
            this.filteredAndAnnotatedCnaData,
            this.filteredAndAnnotatedStructuralVariants,
            this.filteredAndAnnotatedNonGenomicData,
            this.selectedMolecularProfiles,
            this.defaultOQLQuery,
            this.samples,
            this.patients,
        ],
        invoke: () => {
            if (this.oqlText.trim() === '') {
                return Promise.resolve([]);
            } else {
                const filteredAlterationsByOQLLine: OQLLineFilterOutput<
                    AnnotatedExtendedAlteration
                >[] = filterCBioPortalWebServiceDataByOQLLine(
                    this.oqlText,
                    [
                        ...this.filteredAndAnnotatedMutations.result!,
                        ...this.filteredAndAnnotatedCnaData.result!,
                        ...this.filteredAndAnnotatedStructuralVariants.result!,
                        ...this.filteredAndAnnotatedNonGenomicData.result!,
                    ],
                    new AccessorsForOqlFilter(
                        this.selectedMolecularProfiles.result!
                    ),
                    this.defaultOQLQuery.result!
                );

                return Promise.resolve(
                    filteredAlterationsByOQLLine.map(oql => ({
                        cases: groupDataByCase(
                            oql,
                            this.samples.result!,
                            this.patients.result!
                        ),
                        oql,
                    }))
                );
            }
        },
    });

    readonly studyToMolecularProfiles = remoteData({
        await: () => [this.molecularProfilesInStudies],
        invoke: () => {
            return Promise.resolve(
                _.groupBy(
                    this.molecularProfilesInStudies.result!,
                    profile => profile.studyId
                )
            );
        },
    });

    readonly genePanelDataForAllProfiles = remoteData<GenePanelData[]>({
        // fetch all gene panel data for profiles
        // We do it this way - fetch all data for profiles, then filter based on samples -
        //  because
        //  (1) this means sending less data as parameters
        //  (2) this means the requests can be cached on the server based on the molecular profile id
        //  (3) We can initiate the gene panel data call before the samples call completes, thus
        //      putting more response waiting time in parallel
        await: () => [this.molecularProfilesInStudies],
        invoke: () =>
            getClient().fetchGenePanelDataInMultipleMolecularProfilesUsingPOST({
                genePanelDataMultipleStudyFilter: {
                    molecularProfileIds: this.molecularProfilesInStudies.result.map(
                        p => p.molecularProfileId
                    ),
                } as GenePanelDataMultipleStudyFilter,
            }),
    });

    readonly coverageInformation = remoteData<CoverageInformation>({
        await: () => [
            this.genePanelDataForAllProfiles,
            this.sampleKeyToSample,
            this.patients,
            this.genes,
        ],
        invoke: () =>
            getCoverageInformation(
                this.genePanelDataForAllProfiles.result!,
                this.sampleKeyToSample.result!,
                this.patients.result!,
                this.genes.result!
            ),
    });

    readonly filteredSequencedSampleKeysByGene = remoteData<{
        [hugoGeneSymbol: string]: string[];
    }>({
        await: () => [
            this.filteredSamples,
            this.genes,
            this.coverageInformation,
            this.selectedMolecularProfiles,
        ],
        invoke: () => {
            const genePanelInformation = this.coverageInformation.result!;
            const profileIds = this.selectedMolecularProfiles.result!.map(
                p => p.molecularProfileId
            );
            return Promise.resolve(
                this.genes.result!.reduce(
                    (
                        map: { [hugoGeneSymbol: string]: string[] },
                        next: Gene
                    ) => {
                        map[next.hugoGeneSymbol] = this.filteredSamples
                            .result!.map(s => s.uniqueSampleKey)
                            .filter(k => {
                                return _.some(
                                    isSampleProfiledInMultiple(
                                        k,
                                        profileIds,
                                        genePanelInformation,
                                        next.hugoGeneSymbol
                                    )
                                );
                            });
                        return map;
                    },
                    {}
                )
            );
        },
    });

    readonly filteredSequencedPatientKeysByGene = remoteData<{
        [hugoGeneSymbol: string]: string[];
    }>({
        await: () => [
            this.sampleKeyToSample,
            this.filteredSequencedSampleKeysByGene,
        ],
        invoke: async () => {
            const sampleKeyToSample = this.sampleKeyToSample.result!;
            return _.mapValues(
                this.filteredSequencedSampleKeysByGene.result!,
                sampleKeys => {
                    return _.chain(sampleKeys)
                        .map(k => sampleKeyToSample[k].uniquePatientKey)
                        .uniq()
                        .value();
                }
            );
        },
    });

    readonly filteredAlteredSampleKeys = remoteData({
        await: () => [this.filteredSamples, this.oqlFilteredCaseAggregatedData],
        invoke: () => {
            const caseAggregatedData = this.oqlFilteredCaseAggregatedData
                .result!.samples;
            return Promise.resolve(
                this.filteredSamples
                    .result!.map(s => s.uniqueSampleKey)
                    .filter(sampleKey => {
                        return caseAggregatedData[sampleKey].length > 0;
                    })
            );
        },
    });

    readonly filteredAlteredSamples = remoteData<Sample[]>(
        {
            await: () => [
                this.sampleKeyToSample,
                this.filteredAlteredSampleKeys,
            ],
            invoke: () => {
                return Promise.resolve(
                    this.filteredAlteredSampleKeys.result!.map(
                        a => this.sampleKeyToSample.result![a]
                    )
                );
            },
        },
        []
    );

    readonly filteredAlteredPatients = remoteData({
        await: () => [
            this.filteredPatients,
            this.oqlFilteredCaseAggregatedData,
        ],
        invoke: () => {
            const caseAggregatedData = this.oqlFilteredCaseAggregatedData
                .result!;
            return Promise.resolve(
                this.filteredPatients.result!.filter(
                    patient =>
                        !!caseAggregatedData.patients[patient.uniquePatientKey]
                            .length
                )
            );
        },
    });

    readonly filteredAlteredPatientKeys = remoteData({
        await: () => [this.filteredAlteredPatients],
        invoke: () =>
            Promise.resolve(
                this.filteredAlteredPatients.result!.map(
                    p => p.uniquePatientKey
                )
            ),
    });

    readonly filteredUnalteredAndProfiledSamples = remoteData({
        await: () => [
            this.filteredSamples,
            this.oqlFilteredCaseAggregatedData,
            this.totallyUnprofiledSamples,
        ],
        invoke: () => {
            const caseAggregatedData = this.oqlFilteredCaseAggregatedData
                .result!;
            const unprofiledSamples = _.keyBy(
                this.totallyUnprofiledSamples.result!,
                s => s.uniqueSampleKey
            );
            return Promise.resolve(
                this.filteredSamples.result!.filter(
                    sample =>
                        !caseAggregatedData.samples[sample.uniqueSampleKey]
                            .length &&
                        !(sample.uniqueSampleKey in unprofiledSamples)
                )
            );
        },
    });

    readonly oqlFilteredAlterationsByGene = remoteData<{
        [hugoGeneSymbol: string]: ExtendedAlteration[];
    }>({
        await: () => [this.genes, this.oqlFilteredAlterations],
        invoke: () => {
            // first group them by gene symbol
            const groupedGenesMap = this.oqlFilteredAlterations.result!.reduce(
                (
                    agg: { [getHugoGeneSymbol: string]: ExtendedAlteration[] },
                    alt
                ) => {
                    // a structural variant can apply to two genes, so we have account for the alteration twice
                    if (
                        alt.alterationType ===
                        AlterationTypeConstants.STRUCTURAL_VARIANT
                    ) {
                        if (alt.site1HugoSymbol) {
                            agg[alt.site1HugoSymbol]
                                ? agg[alt.site1HugoSymbol].push(alt)
                                : (agg[alt.site1HugoSymbol] = [alt]);
                        }
                        if (alt.site1HugoSymbol) {
                            agg[alt.site2HugoSymbol]
                                ? agg[alt.site2HugoSymbol].push(alt)
                                : (agg[alt.site2HugoSymbol] = [alt]);
                        }
                    } else {
                        agg[alt.hugoGeneSymbol]
                            ? agg[alt.hugoGeneSymbol].push(alt)
                            : (agg[alt.hugoGeneSymbol] = [alt]);
                    }
                    return agg;
                },
                {}
            );

            // kind of ugly but this fixes a bug where sort order of genes not respected
            // yes we are relying on add order of js map. in theory not guaranteed, in practice guaranteed
            const ret = this.genes.result!.reduce(
                (
                    memo: { [hugoGeneSymbol: string]: ExtendedAlteration[] },
                    gene: Gene
                ) => {
                    memo[gene.hugoGeneSymbol] =
                        groupedGenesMap[gene.hugoGeneSymbol];
                    return memo;
                },
                {}
            );

            return Promise.resolve(ret);
        },
    });

    readonly defaultOQLQuery = remoteData({
        await: () => [this.selectedMolecularProfiles],
        invoke: () => {
            const profileTypes = _.uniq(
                _.map(
                    this.selectedMolecularProfiles.result,
                    profile => profile.molecularAlterationType
                )
            );
            return Promise.resolve(
                buildDefaultOQLProfile(
                    profileTypes,
                    this.zScoreThreshold,
                    this.rppaScoreThreshold
                )
            );
        },
    });

    readonly defaultOQLQueryAlterations = remoteData<Alteration[] | false>({
        await: () => [this.defaultOQLQuery],
        invoke: () => {
            if (this.defaultOQLQuery.result) {
                return Promise.resolve(
                    (oql_parser.parse(
                        `DUMMYGENE: ${this.defaultOQLQuery.result!}`
                    )![0] as SingleGeneQuery).alterations
                );
            } else {
                return Promise.resolve(false);
            }
        },
    });

    readonly survivalClinicalAttributesPrefix = remoteData({
        await: () => [this.clinicalAttributes],
        invoke: () => {
            return Promise.resolve(
                getSurvivalClinicalAttributesPrefix(
                    this.clinicalAttributes.result!
                )
            );
        },
    });

    readonly survivalClinicalDataExists = remoteData<boolean>({
        await: () => [
            this.clinicalAttributeIdToAvailableSampleCount,
            this.survivalClinicalAttributesPrefix,
        ],
        invoke: async () => {
            const attributeNames = _.reduce(
                this.survivalClinicalAttributesPrefix.result,
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

            const clinicalAttributeIdToAvailableSampleCount =
                this.clinicalAttributeIdToAvailableSampleCount.result || {};

            return _.some(
                attributeNames,
                attributeName =>
                    clinicalAttributeIdToAvailableSampleCount[attributeName] !==
                        undefined &&
                    clinicalAttributeIdToAvailableSampleCount[attributeName] > 0
            );
        },
    });

    readonly filteredSamplesByDetailedCancerType = remoteData<{
        [cancerType: string]: Sample[];
    }>({
        await: () => [this.filteredSamples, this.clinicalDataForSamples],
        invoke: () => {
            let groupedSamples = this.groupSamplesByCancerType(
                this.clinicalDataForSamples.result,
                this.filteredSamples.result!,
                'CANCER_TYPE'
            );
            if (_.size(groupedSamples) === 1) {
                groupedSamples = this.groupSamplesByCancerType(
                    this.clinicalDataForSamples.result,
                    this.filteredSamples.result!,
                    'CANCER_TYPE_DETAILED'
                );
            }
            return Promise.resolve(groupedSamples);
        },
    });

    readonly filteredSamplesExtendedWithClinicalData = remoteData<
        ExtendedSample[]
    >({
        await: () => [
            this.filteredSamples,
            this.clinicalDataForSamples,
            this.studies,
        ],
        invoke: () => {
            return Promise.resolve(
                extendSamplesWithCancerType(
                    this.filteredSamples.result!,
                    this.clinicalDataForSamples.result,
                    this.studies.result
                )
            );
        },
    });

    public groupSamplesByCancerType(
        clinicalDataForSamples: ClinicalData[],
        samples: Sample[],
        cancerTypeLevel: 'CANCER_TYPE' | 'CANCER_TYPE_DETAILED'
    ) {
        // first generate map of sampleId to it's cancer type
        const sampleKeyToCancerTypeClinicalDataMap = _.reduce(
            clinicalDataForSamples,
            (memo, clinicalData: ClinicalData) => {
                if (clinicalData.clinicalAttributeId === cancerTypeLevel) {
                    memo[clinicalData.uniqueSampleKey] = clinicalData.value;
                }

                // if we were told CANCER_TYPE and we find CANCER_TYPE_DETAILED, then fall back on it. if we encounter
                // a CANCER_TYPE later, it will override this.
                if (cancerTypeLevel === 'CANCER_TYPE') {
                    if (
                        !memo[clinicalData.uniqueSampleKey] &&
                        clinicalData.clinicalAttributeId ===
                            'CANCER_TYPE_DETAILED'
                    ) {
                        memo[clinicalData.uniqueSampleKey] = clinicalData.value;
                    }
                }

                return memo;
            },
            {} as { [uniqueSampleId: string]: string }
        );

        // now group samples by cancer type
        let samplesGroupedByCancerType = _.reduce(
            samples,
            (memo: { [cancerType: string]: Sample[] }, sample: Sample) => {
                // if it appears in map, then we have a cancer type
                if (
                    sample.uniqueSampleKey in
                    sampleKeyToCancerTypeClinicalDataMap
                ) {
                    memo[
                        sampleKeyToCancerTypeClinicalDataMap[
                            sample.uniqueSampleKey
                        ]
                    ] =
                        memo[
                            sampleKeyToCancerTypeClinicalDataMap[
                                sample.uniqueSampleKey
                            ]
                        ] || [];
                    memo[
                        sampleKeyToCancerTypeClinicalDataMap[
                            sample.uniqueSampleKey
                        ]
                    ].push(sample);
                } else {
                    // TODO: we need to fall back to study cancer type
                }
                return memo;
            },
            {} as { [cancerType: string]: Sample[] }
        );

        return samplesGroupedByCancerType;
        //
    }

    readonly oqlFilteredAlterationsByGeneBySampleKey = remoteData<{
        [hugoGeneSymbol: string]: {
            [uniquSampleKey: string]: ExtendedAlteration[];
        };
    }>({
        await: () => [this.oqlFilteredAlterationsByGene, this.samples],
        invoke: async () => {
            return _.mapValues(
                this.oqlFilteredAlterationsByGene.result,
                (alterations: ExtendedAlteration[]) => {
                    return _.groupBy(
                        alterations,
                        (alteration: ExtendedAlteration) =>
                            alteration.uniqueSampleKey
                    );
                }
            );
        },
    });

    //contains all the physical studies for the current selected cohort ids
    //selected cohort ids can be any combination of physical_study_id and virtual_study_id(shared or saved ones)
    public get physicalStudySet(): { [studyId: string]: CancerStudy } {
        return _.keyBy(
            this.studies.result,
            (study: CancerStudy) => study.studyId
        );
    }

    // used in building virtual study
    readonly studyWithSamples = remoteData<StudyWithSamples[]>({
        await: () => [
            this.samples,
            this.queriedStudies,
            this.queriedVirtualStudies,
        ],
        invoke: () => {
            return Promise.resolve(
                getFilteredStudiesWithSamples(
                    this.samples.result,
                    this.queriedStudies.result,
                    this.queriedVirtualStudies.result
                )
            );
        },
        onError: error => {},
        default: [],
    });

    readonly mutationProfiles = remoteData({
        await: () => [this.selectedMolecularProfiles],
        invoke: async () => {
            return this.selectedMolecularProfiles.result!.filter(
                profile =>
                    profile.molecularAlterationType ===
                    AlterationTypeConstants.MUTATION_EXTENDED
            );
        },
        onError: error => {},
        default: [],
    });

    readonly cnaProfiles = remoteData({
        await: () => [this.selectedMolecularProfiles],
        invoke: async () => {
            return this.selectedMolecularProfiles.result!.filter(
                profile =>
                    profile.molecularAlterationType ===
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION &&
                    profile.datatype === DataTypeConstants.DISCRETE
            );
        },
        onError: error => {},
        default: [],
    });

    readonly structuralVariantProfiles = remoteData({
        await: () => [this.selectedMolecularProfiles],
        invoke: async () => {
            return this.selectedMolecularProfiles.result!.filter(
                profile =>
                    profile.molecularAlterationType ===
                    AlterationTypeConstants.STRUCTURAL_VARIANT
            );
        },
        onError: error => {},
        default: [],
    });

    readonly plotClinicalAttributes = remoteData<ExtendedClinicalAttribute[]>({
        await: () => [this.clinicalAttributes, this.customAttributes],
        invoke: async () => {
            return _.filter(
                this.clinicalAttributes.result!,
                attr => !this.customAttributes.result!.includes(attr)
            );
        },
    });

    readonly customAttributes = remoteData({
        await: () => [this.sampleMap],
        invoke: async () => {
            let ret: ExtendedClinicalAttribute[] = [];
            if (this.appStore.isLoggedIn) {
                try {
                    //Add custom data from user profile
                    const customChartSessions = await sessionServiceClient.getCustomDataForStudies(
                        this.cancerStudyIds
                    );

                    ret = getExtendsClinicalAttributesFromCustomData(
                        customChartSessions,
                        this.sampleMap.result!
                    );
                } catch (e) {}
            }
            return ret;
        },
    });

    @computed get cnaMolecularProfileIds() {
        const profiles = this.cnaProfiles.isComplete
            ? this.cnaProfiles.result
            : [];
        const profileIds = _.map(
            profiles,
            (p: MolecularProfile) => p.molecularProfileId
        );
        return profileIds;
    }

    @computed
    get chartMetaSet(): { [id: string]: ChartMeta } {
        let _chartMetaSet: { [id: string]: ChartMeta } = {} as {
            [id: string]: ChartMeta;
        };

        // Add meta information for each of the clinical attribute
        // Convert to a Set for easy access and to update attribute meta information(would be useful while adding new features)
        _.reduce(
            this.clinicalAttributes.result,
            (acc: { [id: string]: ChartMeta }, attribute) => {
                const uniqueKey = getUniqueKey(attribute);
                acc[uniqueKey] = {
                    displayName: attribute.displayName,
                    uniqueKey: uniqueKey,
                    dataType: getChartMetaDataType(uniqueKey),
                    patientAttribute: attribute.patientAttribute,
                    description: attribute.description,
                    priority: getPriorityByClinicalAttribute(attribute),
                    renderWhenDataChange: false,
                    clinicalAttribute: attribute,
                };
                return acc;
            },
            _chartMetaSet
        );

        if (!_.isEmpty(this.mutationProfiles.result!)) {
            const uniqueKey = getUniqueKeyFromMolecularProfileIds(
                this.mutationProfiles.result.map(
                    profile => profile.molecularProfileId
                )
            );
            _chartMetaSet[uniqueKey] = {
                uniqueKey: uniqueKey,
                dataType: ChartMetaDataTypeEnum.GENOMIC,
                patientAttribute: false,
                displayName: 'Mutated Genes',
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.MUTATED_GENES_TABLE
                ),
                renderWhenDataChange: false,
                description: '',
            };
        }

        if (!_.isEmpty(this.cnaProfiles.result)) {
            const uniqueKey = getUniqueKeyFromMolecularProfileIds(
                this.cnaProfiles.result.map(
                    profile => profile.molecularProfileId
                )
            );
            _chartMetaSet[uniqueKey] = {
                uniqueKey: uniqueKey,
                dataType: ChartMetaDataTypeEnum.GENOMIC,
                patientAttribute: false,
                displayName: 'CNA Genes',
                renderWhenDataChange: false,
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.CNA_GENES_TABLE
                ),
                description: '',
            };
        }

        const scatterRequiredParams = _.reduce(
            this.clinicalAttributes.result,
            (acc, next) => {
                if (
                    SpecialChartsUniqueKeyEnum.MUTATION_COUNT ===
                    next.clinicalAttributeId
                ) {
                    acc[SpecialChartsUniqueKeyEnum.MUTATION_COUNT] = true;
                }
                if (
                    SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED ===
                    next.clinicalAttributeId
                ) {
                    acc[
                        SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED
                    ] = true;
                }
                return acc;
            },
            {
                [SpecialChartsUniqueKeyEnum.MUTATION_COUNT]: false,
                [SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED]: false,
            }
        );

        if (
            scatterRequiredParams[SpecialChartsUniqueKeyEnum.MUTATION_COUNT] &&
            scatterRequiredParams[
                SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED
            ]
        ) {
            _chartMetaSet[FGA_VS_MUTATION_COUNT_KEY] = {
                dataType: ChartMetaDataTypeEnum.GENOMIC,
                patientAttribute: false,
                uniqueKey: FGA_VS_MUTATION_COUNT_KEY,
                displayName: 'Mutation Count vs Fraction of Genome Altered',
                priority: getDefaultPriorityByUniqueKey(
                    FGA_VS_MUTATION_COUNT_KEY
                ),
                renderWhenDataChange: false,
                description: '',
            };
        }
        return _chartMetaSet;
    }

    readonly virtualStudyParams = remoteData<IVirtualStudyProps>({
        await: () => [
            this.samples,
            this.studyIds,
            this.studyWithSamples,
            this.queriedVirtualStudies,
        ],
        invoke: () =>
            Promise.resolve({
                user: this.appStore.userName,
                name:
                    this.queriedVirtualStudies.result.length === 1
                        ? this.queriedVirtualStudies.result[0].data.name
                        : undefined,
                description:
                    this.queriedVirtualStudies.result.length === 1
                        ? this.queriedVirtualStudies.result[0].data.description
                        : undefined,
                studyWithSamples: this.studyWithSamples.result,
                selectedSamples: this.samples.result,
                filter: { studyIds: this.studyIds.result },
                attributesMetaSet: this.chartMetaSet,
            } as IVirtualStudyProps),
    });

    readonly givenSampleOrder = remoteData<Sample[]>({
        await: () => [this.samples, this.samplesSpecification],
        invoke: async () => {
            // for now, just assume we won't mix sample lists and samples in the specification
            if (this.samplesSpecification.result!.find(x => !x.sampleId)) {
                // for now, if theres any sample list id specification, then there is no given sample order
                return [];
            }
            // at this point, we know samplesSpecification is a list of samples
            const studyToSampleToIndex: {
                [studyId: string]: { [sampleId: string]: number };
            } = _.reduce(
                this.samplesSpecification.result,
                (
                    map: { [studyId: string]: { [sampleId: string]: number } },
                    next: SamplesSpecificationElement,
                    index: number
                ) => {
                    map[next.studyId] = map[next.studyId] || {};
                    map[next.studyId][next.sampleId!] = index; // we know sampleId defined otherwise we would have returned from function already
                    return map;
                },
                {}
            );
            return _.sortBy(
                this.samples.result,
                sample => studyToSampleToIndex[sample.studyId][sample.sampleId]
            );
        },
    });

    readonly studyToCustomSampleList = remoteData<{
        [studyId: string]: string[];
    }>(
        {
            await: () => [this.samplesSpecification],
            invoke: () => {
                const ret: {
                    [studyId: string]: string[];
                } = {};
                for (const sampleSpec of this.samplesSpecification.result!) {
                    if (sampleSpec.sampleId) {
                        // add sample id to study
                        ret[sampleSpec.studyId] = ret[sampleSpec.studyId] || [];
                        ret[sampleSpec.studyId].push(sampleSpec.sampleId);
                    }
                }
                return Promise.resolve(ret);
            },
        },
        {}
    );

    readonly studyToSampleListId = remoteData<{ [studyId: string]: string }>({
        await: () => [this.samplesSpecification],
        invoke: async () => {
            return this.samplesSpecification.result!.reduce((map, next) => {
                if (next.sampleListId) {
                    map[next.studyId] = next.sampleListId;
                }
                return map;
            }, {} as { [studyId: string]: string });
        },
    });

    @computed get samplesSpecificationParams() {
        return parseSamplesSpecifications(
            this.urlWrapper.query.case_ids,
            this.urlWrapper.query.sample_list_ids,
            this.urlWrapper.query.case_set_id,
            this.cancerStudyIds
        );
    }

    readonly samplesSpecification = remoteData({
        await: () => [this.queriedVirtualStudies],
        invoke: async () => {
            // is this a sample list category query?
            // if YES, we need to derive the sample lists by:
            // 1. looking up all sample lists in selected studies
            // 2. using those with matching category
            if (!this.sampleListCategory) {
                if (this.queriedVirtualStudies.result!.length > 0) {
                    return populateSampleSpecificationsFromVirtualStudies(
                        this.samplesSpecificationParams,
                        this.queriedVirtualStudies.result!
                    );
                } else {
                    return this.samplesSpecificationParams;
                }
            } else {
                // would be nice to have an endpoint that would return multiple sample lists
                // but this will only ever happen one for each study selected (and in queries where a sample list is specified)
                let samplesSpecifications = [];
                // get sample specifications from physical studies if we are querying virtual study
                if (this.queriedVirtualStudies.result!.length > 0) {
                    samplesSpecifications = populateSampleSpecificationsFromVirtualStudies(
                        this.samplesSpecificationParams,
                        this.queriedVirtualStudies.result!
                    );
                } else {
                    samplesSpecifications = this.samplesSpecificationParams;
                }
                // get unique study ids to reduce the API requests
                const uniqueStudyIds = _.chain(samplesSpecifications)
                    .map(specification => specification.studyId)
                    .uniq()
                    .value();
                const allSampleLists = await Promise.all(
                    uniqueStudyIds.map(studyId => {
                        return getClient().getAllSampleListsInStudyUsingGET({
                            studyId: studyId,
                            projection: REQUEST_ARG_ENUM.PROJECTION_SUMMARY,
                        });
                    })
                );

                const category =
                    SampleListCategoryTypeToFullId[this.sampleListCategory!];
                const specs = allSampleLists.reduce(
                    (
                        aggregator: SamplesSpecificationElement[],
                        sampleLists
                    ) => {
                        //find the sample list matching the selected category using the map from shortname to full category name :(
                        const matchingList = _.find(
                            sampleLists,
                            list => list.category === category
                        );
                        if (matchingList) {
                            aggregator.push({
                                studyId: matchingList.studyId,
                                sampleListId: matchingList.sampleListId,
                                sampleId: undefined,
                            } as SamplesSpecificationElement);
                        }
                        return aggregator;
                    },
                    []
                );

                return specs;
            }
        },
    });

    readonly studyToMutationMolecularProfile = remoteData<{
        [studyId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.mutationProfiles],
            invoke: () => {
                return Promise.resolve(
                    _.keyBy(
                        this.mutationProfiles.result,
                        (profile: MolecularProfile) => profile.studyId
                    )
                );
            },
        },
        {}
    );

    readonly allStudies = remoteData(
        {
            invoke: async () =>
                await getClient().getAllStudiesUsingGET({
                    projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                }),
        },
        []
    );

    readonly everyStudyIdToStudy = remoteData({
        await: () => [this.allStudies],
        invoke: () =>
            Promise.resolve(_.keyBy(this.allStudies.result!, s => s.studyId)),
    });

    readonly queriedVirtualStudies = remoteData(
        {
            await: () => [this.allStudies],
            invoke: async () => {
                const allCancerStudies = this.allStudies.result;
                const cancerStudyIds = this.cancerStudyIds;

                const missingFromCancerStudies = _.differenceWith(
                    cancerStudyIds,
                    allCancerStudies,
                    (id: string, study: CancerStudy) => id === study.studyId
                );
                let ret: VirtualStudy[] = [];

                for (const missingId of missingFromCancerStudies) {
                    try {
                        const vs = await sessionServiceClient.getVirtualStudy(
                            missingId
                        );
                        ret = ret.concat(vs);
                    } catch (error) {
                        // ignore missing studies
                        continue;
                    }
                }
                return Promise.resolve(ret);
            },
            onError: () => {
                // fail silently when an error occurs with the virtual studies
            },
            // just return empty array if session service is disabled
        },
        []
    );

    readonly studyIds = remoteData(
        {
            await: () => [this.queriedVirtualStudies],
            invoke: () => {
                let physicalStudies: string[];
                if (this.queriedVirtualStudies.result!.length > 0) {
                    // we want to replace virtual studies with their underlying physical studies
                    physicalStudies = substitutePhysicalStudiesForVirtualStudies(
                        this.cancerStudyIds,
                        this.queriedVirtualStudies.result!
                    );
                } else {
                    physicalStudies = this.cancerStudyIds.slice();
                }
                return Promise.resolve(physicalStudies);
            },
        },
        []
    );

    // this is less than desirable way of validating studyIds
    // if studyId does not appear in list of all physical studies
    // we assume it's a virtual study and try to retrieve it as such
    // if there's no corresponding virtual study
    // we assume it's an invalid studyId
    readonly invalidStudyIds = remoteData(
        {
            await: () => [this.allStudies, this.queriedVirtualStudies],
            invoke: () => {
                const allCancerStudies = this.allStudies.result;
                const cancerStudyIds = this.cancerStudyIds;

                const missingFromCancerStudies = _.differenceWith(
                    cancerStudyIds,
                    allCancerStudies,
                    (id: string, study: CancerStudy) => id === study.studyId
                );

                if (
                    missingFromCancerStudies.length &&
                    this.queriedVirtualStudies.result.length === 0
                ) {
                    return Promise.resolve(missingFromCancerStudies);
                } else {
                    return Promise.resolve([]);
                }
            },
        },
        []
    );

    @computed get downloadFilenamePrefix() {
        return generateDownloadFilenamePrefixByStudies(this.studies.result);
    }

    // TODO: refactor b/c we already have sample lists summary so
    readonly sampleLists = remoteData<SampleList[]>({
        await: () => [this.studyToSampleListId],
        invoke: () => {
            const sampleListIds = _.values(this.studyToSampleListId.result!);
            if (sampleListIds.length > 0) {
                return getClient().fetchSampleListsUsingPOST({ sampleListIds });
            } else {
                return Promise.resolve([]);
            }
        },
    });

    readonly studyToSelectedMolecularProfilesMap = remoteData<{
        [studyId: string]: {
            [molecularAlterationType: string]: MolecularProfile;
        };
    }>({
        await: () => [this.selectedMolecularProfiles],
        invoke: () => {
            return Promise.resolve(
                _.mapValues(
                    _.groupBy(
                        this.selectedMolecularProfiles.result!,
                        p => p.studyId
                    ),
                    profiles =>
                        _.keyBy(profiles, p => p.molecularAlterationType)
                )
            );
        },
    });

    // we want to load dcna using sample list id (instead of list of samples)
    // and then filter down to those contained in actually queried samples
    // this is an optimization that allows us to fire these calls earlier
    // and to make cache items finite (by "all" sample list id)
    readonly discreteCopyNumberAlterations_preload = remoteData<
        DiscreteCopyNumberData[]
    >({
        await: () => [this.genes, this.studyToMolecularProfileDiscreteCna],
        invoke: async () => {
            if (this.cnaMolecularProfileIds.length == 0) {
                return [];
            }

            const entrezGeneIds = _.map(
                this.genes.result,
                (gene: Gene) => gene.entrezGeneId
            );

            const promises = _.map(
                this.studyToMolecularProfileDiscreteCna.result,
                (cnaMolecularProfile, studyId) => {
                    return getClient().fetchDiscreteCopyNumbersInMolecularProfileUsingPOST(
                        {
                            discreteCopyNumberEventType: 'HOMDEL_AND_AMP',
                            discreteCopyNumberFilter: {
                                entrezGeneIds,
                                sampleListId: `${studyId}_all`,
                            } as DiscreteCopyNumberFilter,
                            molecularProfileId:
                                cnaMolecularProfile.molecularProfileId,
                            projection: 'DETAILED',
                        }
                    );
                }
            );
            return Promise.all(promises).then((cnaData: any[]) =>
                _.flattenDeep(cnaData)
            );
        },
    });

    readonly discreteCopyNumberAlterations = remoteData<
        DiscreteCopyNumberData[]
    >({
        await: () => [
            this.discreteCopyNumberAlterations_preload,
            this.sampleKeyToSample,
        ],
        invoke: async () => {
            if (
                this.discreteCopyNumberAlterations_preload.result!.length == 0
            ) {
                return [];
            }

            return Promise.resolve(
                this.discreteCopyNumberAlterations_preload.result!.filter(
                    dcna => {
                        return (
                            dcna.uniqueSampleKey in
                            this.sampleKeyToSample.result!
                        );
                    }
                )
            );
        },
    });

    @computed get sampleIdAndEntrezIdToDiscreteCopyNumberData() {
        return _.keyBy(
            this.discreteCopyNumberAlterations.result,
            (d: DiscreteCopyNumberData) => createDiscreteCopyNumberDataKey(d)
        );
    }

    readonly mutations_preload = remoteData<Mutation[]>({
        // fetch all mutation data for profiles
        // We do it this way - fetch all data for profiles, then filter based on samples -
        //  because
        //  (1) this means sending less data as parameters
        //  (2) this means the requests can be cached on the server based on the molecular profile id
        //  (3) We can initiate the mutations call before the samples call completes, thus
        //      putting more response waiting time in parallel
        await: () => [this.genes, this.mutationProfiles],
        invoke: () => {
            if (
                this.genes.result!.length === 0 ||
                this.mutationProfiles.result!.length === 0
            ) {
                return Promise.resolve([]);
            }

            return getClient().fetchMutationsInMultipleMolecularProfilesUsingPOST(
                {
                    projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                    mutationMultipleStudyFilter: {
                        entrezGeneIds: this.genes.result!.map(
                            g => g.entrezGeneId
                        ),
                        molecularProfileIds: this.mutationProfiles.result!.map(
                            p => p.molecularProfileId
                        ),
                    } as MutationMultipleStudyFilter,
                }
            );
        },
    });

    readonly mutations = remoteData<Mutation[]>({
        await: () => [this.mutations_preload, this.sampleKeyToSample],
        invoke: () => {
            const sampleKeys = this.sampleKeyToSample.result!;
            return Promise.resolve(
                this.mutations_preload.result!.filter(
                    m => m.uniqueSampleKey in sampleKeys
                )
            );
        },
    });

    readonly studyToStructuralVariantMolecularProfile = remoteData<{
        [studyId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.structuralVariantProfiles],
            invoke: () => {
                return Promise.resolve(
                    _.keyBy(
                        this.structuralVariantProfiles.result,
                        (profile: MolecularProfile) => profile.studyId
                    )
                );
            },
        },
        {}
    );

    readonly structuralVariants = remoteData<StructuralVariant[]>({
        await: () => [
            this.genes,
            this.samples,
            this.studyToStructuralVariantMolecularProfile,
            this.entrezGeneIdToGene,
        ],
        invoke: async () => {
            if (
                _.isEmpty(
                    this.studyToStructuralVariantMolecularProfile.result
                ) ||
                _.isEmpty(this.genes.result)
            ) {
                return [];
            }
            const studyIdToProfileMap = this
                .studyToStructuralVariantMolecularProfile.result;
            const genes: Gene[] = this.genes.result!;

            const sampleMolecularIdentifiers = this.samples.result.reduce(
                (memo, sample: Sample) => {
                    if (sample.studyId in studyIdToProfileMap) {
                        memo.push({
                            molecularProfileId:
                                studyIdToProfileMap[sample.studyId]
                                    .molecularProfileId,
                            sampleId: sample.sampleId,
                        });
                    }
                    return memo;
                },
                [] as StructuralVariantFilter['sampleMolecularIdentifiers']
            );

            // Filters can be an empty list. When all selected samples are coming from studies that do not have
            // structural variant profile in this case, we should not fetch structural variant data.
            if (_.isEmpty(sampleMolecularIdentifiers)) {
                return [];
            } else {
                // Set all SVs that are queried at the gene level.
                // The gene1::gene2 orientation does not come into play here.
                const entrezGeneIds = _.map(
                    this.genes.result,
                    (gene: Gene) => gene.entrezGeneId
                );
                // Set all SVs that are queried at the gene1::gene2 orientation level.
                const structuralVariantQueries = this.structVarQueries.map(sv =>
                    createStructuralVariantQuery(sv, this.genes.result!)
                );

                return await internalClient.fetchStructuralVariantsUsingPOST({
                    structuralVariantFilter: {
                        entrezGeneIds,
                        structuralVariantQueries,
                        sampleMolecularIdentifiers,
                        molecularProfileIds: [],
                    },
                });
            }
        },
    });

    @computed get existsSomeMutationWithAscnProperty(): {
        [property: string]: boolean;
    } {
        if (this.mutations.result === undefined) {
            return existsSomeMutationWithAscnPropertyInCollection(
                [] as Mutation[]
            );
        } else {
            return existsSomeMutationWithAscnPropertyInCollection(
                this.mutations.result
            );
        }
    }

    public mutationsTabFilteringSettings = this.makeMutationsTabFilteringSettings();

    readonly mutationsReportByGene = remoteData<{
        [hugeGeneSymbol: string]: FilteredAndAnnotatedMutationsReport;
    }>({
        await: () => [this._filteredAndAnnotatedMutationsReport, this.genes],
        invoke: () => {
            let mutationGroups: FilteredAndAnnotatedMutationsReport = this
                ._filteredAndAnnotatedMutationsReport.result!;
            const ret: {
                [hugoGeneSymbol: string]: FilteredAndAnnotatedMutationsReport;
            } = {};
            for (const gene of this.genes.result!) {
                ret[gene.hugoGeneSymbol] = {
                    data: [],
                    vus: [],
                    germline: [],
                    vusAndGermline: [],
                };
            }
            for (const mutation of mutationGroups.data) {
                ret[mutation.gene.hugoGeneSymbol].data.push(mutation);
            }
            for (const mutation of mutationGroups.vus) {
                ret[mutation.gene.hugoGeneSymbol].vus.push(mutation);
            }
            for (const mutation of mutationGroups.germline) {
                ret[mutation.gene.hugoGeneSymbol].germline.push(mutation);
            }
            for (const mutation of mutationGroups.vusAndGermline) {
                ret[mutation.gene.hugoGeneSymbol].vusAndGermline.push(mutation);
            }
            return Promise.resolve(ret);
        },
    });

    readonly structuralVariantsByEntrezGeneId = remoteData({
        await: () => [this.structuralVariants],
        invoke: async () => {
            const svByGene: Record<number, StructuralVariant[]> = {};
            this.structuralVariants.result!.forEach(sv => {
                if (sv.site1EntrezGeneId) {
                    svByGene[sv.site1EntrezGeneId] =
                        svByGene[sv.site1EntrezGeneId] || [];
                    svByGene[sv.site1EntrezGeneId].push(sv);
                }

                if (sv.site2EntrezGeneId) {
                    if (
                        !sv.site1EntrezGeneId ||
                        sv.site2EntrezGeneId !== sv.site1EntrezGeneId
                    ) {
                        svByGene[sv.site2EntrezGeneId] =
                            svByGene[sv.site2EntrezGeneId] || [];
                        svByGene[sv.site2EntrezGeneId].push(sv);
                    }
                }
            });
            return svByGene;
        },
    });

    readonly structuralVariantsReportByGene = remoteData<{
        [hugeGeneSymbol: string]: FilteredAndAnnotatedStructuralVariantsReport;
    }>({
        await: () => [
            this._filteredAndAnnotatedStructuralVariantsReport,
            this.genes,
        ],
        invoke: () => {
            let structuralVariantsGroups = this
                ._filteredAndAnnotatedStructuralVariantsReport.result!;
            const ret: {
                [hugoGeneSymbol: string]: FilteredAndAnnotatedStructuralVariantsReport;
            } = {};
            for (const gene of this.genes.result!) {
                ret[gene.hugoGeneSymbol] = {
                    data: [],
                    vus: [],
                    germline: [],
                    vusAndGermline: [],
                };
            }
            // we need to add structural variante to gene collection for BOTH site1 and site2 genes
            // so that features will see the structural variant in either gene context (e.g mutations tab gene pages)
            for (const structuralVariant of structuralVariantsGroups.data) {
                ret[structuralVariant.site1HugoSymbol]?.data.push(
                    structuralVariant
                );
                if (structuralVariant.site2HugoSymbol) {
                    if (
                        !structuralVariant.site1HugoSymbol ||
                        structuralVariant.site2HugoSymbol !==
                            structuralVariant.site1HugoSymbol
                    ) {
                        ret[structuralVariant.site2HugoSymbol]?.data.push(
                            structuralVariant
                        );
                    }
                }
            }
            for (const structuralVariant of structuralVariantsGroups.vus) {
                ret[structuralVariant.site1HugoSymbol]?.vus.push(
                    structuralVariant
                );
                if (structuralVariant.site2HugoSymbol) {
                    if (
                        !structuralVariant.site1HugoSymbol ||
                        structuralVariant.site2HugoSymbol !==
                            structuralVariant.site1HugoSymbol
                    ) {
                        ret[structuralVariant.site2HugoSymbol]?.vus.push(
                            structuralVariant
                        );
                    }
                }
            }
            for (const structuralVariant of structuralVariantsGroups.germline) {
                ret[structuralVariant.site1HugoSymbol]?.germline.push(
                    structuralVariant
                );
                if (structuralVariant.site2HugoSymbol) {
                    if (
                        !structuralVariant.site1HugoSymbol ||
                        structuralVariant.site2HugoSymbol !==
                            structuralVariant.site1HugoSymbol
                    ) {
                        ret[structuralVariant.site2HugoSymbol]?.germline.push(
                            structuralVariant
                        );
                    }
                }
            }
            for (const structuralVariant of structuralVariantsGroups.vusAndGermline) {
                ret[structuralVariant.site1HugoSymbol]?.vusAndGermline.push(
                    structuralVariant
                );
                if (structuralVariant.site2HugoSymbol) {
                    if (
                        !structuralVariant.site1HugoSymbol ||
                        structuralVariant.site2HugoSymbol !==
                            structuralVariant.site1HugoSymbol
                    ) {
                        ret[
                            structuralVariant.site2HugoSymbol
                        ]?.vusAndGermline.push(structuralVariant);
                    }
                }
            }
            return Promise.resolve(ret);
        },
    });

    readonly mutationsByGene = remoteData<{
        [hugoGeneSymbol: string]: Mutation[];
    }>({
        await: () => {
            const promises: MobxPromise<any>[] = [
                this.selectedMolecularProfiles,
                this.defaultOQLQuery,
                this.mutationsReportByGene,
                this.structuralVariantsReportByGene,
            ];
            if (this.hideUnprofiledSamples) {
                promises.push(this.filteredSampleKeyToSample);
            }
            return promises;
        },
        invoke: () => {
            const mutationsByGene = _.mapValues(
                this.mutationsReportByGene.result!,
                (mutationGroups: FilteredAndAnnotatedMutationsReport) => {
                    if (
                        this.mutationsTabFilteringSettings.useOql &&
                        this.queryContainsMutationOql
                    ) {
                        // use oql filtering in mutations tab only if query contains mutation oql
                        mutationGroups = _.mapValues(
                            mutationGroups,
                            mutations =>
                                filterCBioPortalWebServiceData(
                                    this.oqlText,
                                    mutations,
                                    new AccessorsForOqlFilter(
                                        this.selectedMolecularProfiles.result!
                                    ),
                                    this.defaultOQLQuery.result!
                                )
                        );
                    }
                    const filteredMutations = compileMutations(
                        mutationGroups,
                        this.mutationsTabFilteringSettings.excludeVus,
                        this.mutationsTabFilteringSettings.excludeGermline
                    );
                    if (this.hideUnprofiledSamples) {
                        // filter unprofiled samples
                        const sampleMap = this.filteredSampleKeyToSample
                            .result!;
                        return filteredMutations.filter(
                            m => m.uniqueSampleKey in sampleMap
                        );
                    } else {
                        return filteredMutations;
                    }
                }
            );

            //TODO: remove once SV/Fusion tab is merged
            _.forEach(
                this.structuralVariantsReportByGene.result,
                (structuralVariantsGroups, hugoGeneSymbol) => {
                    if (mutationsByGene[hugoGeneSymbol] === undefined) {
                        mutationsByGene[hugoGeneSymbol] = [];
                    }

                    if (
                        this.mutationsTabFilteringSettings.useOql &&
                        this.queryContainsMutationOql
                    ) {
                        // use oql filtering in mutations tab only if query contains mutation oql
                        structuralVariantsGroups = _.mapValues(
                            structuralVariantsGroups,
                            structuralVariants =>
                                filterCBioPortalWebServiceData(
                                    this.oqlText,
                                    structuralVariants,
                                    new AccessorsForOqlFilter(
                                        this.selectedMolecularProfiles.result!
                                    ),
                                    this.defaultOQLQuery.result!
                                )
                        );
                    }

                    let filteredStructuralVariants = compileStructuralVariants(
                        structuralVariantsGroups,
                        this.mutationsTabFilteringSettings.excludeVus,
                        this.mutationsTabFilteringSettings.excludeGermline
                    );
                    if (this.hideUnprofiledSamples) {
                        // filter unprofiled samples
                        const sampleMap = this.filteredSampleKeyToSample
                            .result!;
                        filteredStructuralVariants = filteredStructuralVariants.filter(
                            m => m.uniqueSampleKey in sampleMap
                        );
                    }

                    filteredStructuralVariants.forEach(structuralVariant => {
                        const mutation = {
                            center: 'N/A',
                            chr: structuralVariant.site1Chromosome,
                            entrezGeneId: structuralVariant.site1EntrezGeneId,
                            keyword: structuralVariant.comments,
                            molecularProfileId:
                                structuralVariant.molecularProfileId,
                            mutationType: CanonicalMutationType.FUSION,
                            ncbiBuild: structuralVariant.ncbiBuild,
                            patientId: structuralVariant.patientId,
                            proteinChange: buildProteinChange(
                                structuralVariant
                            ),
                            sampleId: structuralVariant.sampleId,
                            startPosition: structuralVariant.site1Position,
                            studyId: structuralVariant.studyId,
                            uniquePatientKey:
                                structuralVariant.uniquePatientKey,
                            uniqueSampleKey: structuralVariant.uniqueSampleKey,
                            variantType: structuralVariant.variantClass,
                            mutationStatus: structuralVariant.svStatus,
                            gene: {
                                entrezGeneId:
                                    structuralVariant.site1EntrezGeneId,
                                hugoGeneSymbol:
                                    structuralVariant.site1HugoSymbol,
                            },
                            hugoGeneSymbol: structuralVariant.site1HugoSymbol,
                            putativeDriver: structuralVariant.putativeDriver,
                            oncoKbOncogenic: structuralVariant.oncoKbOncogenic,
                            isHotspot: structuralVariant.isHotspot,
                            simplifiedMutationType:
                                CanonicalMutationType.FUSION,
                            structuralVariant,
                        } as AnnotatedMutation;

                        mutationsByGene[hugoGeneSymbol].push(mutation);
                    });
                }
            );
            //TODO: remove once SV/Fusion tab is merged

            return Promise.resolve(mutationsByGene);
        },
    });

    @computed get customDataFilterAppliers() {
        return {
            [ANNOTATED_PROTEIN_IMPACT_FILTER_TYPE]: createAnnotatedProteinImpactTypeFilter(
                this.isPutativeDriver
            ),
            [MutationTableColumnType.CLONAL]: createNumericalFilter(
                (d: Mutation) => {
                    const val = getClonalValue(d);
                    return val ? +val : null;
                }
            ),
            [MutationTableColumnType.CANCER_CELL_FRACTION]: createNumericalFilter(
                (d: Mutation) => {
                    const val = getCancerCellFractionValue(d);
                    return val ? +val : null;
                }
            ),
            [MutationTableColumnType.EXPECTED_ALT_COPIES]: createNumericalFilter(
                (d: Mutation) => {
                    const val = getExpectedAltCopiesValue(d);
                    return val ? +val : null;
                }
            ),
            [MutationTableColumnType.TUMOR_ALLELE_FREQ]: createNumericalFilter(
                (d: Mutation) =>
                    TumorAlleleFreqColumnFormatter.getSortValue([d])
            ),
            [MutationTableColumnType.NORMAL_ALLELE_FREQ]: createNumericalFilter(
                (d: Mutation) =>
                    NormalAlleleFreqColumnFormatter.getSortValue([d])
            ),
            [MutationTableColumnType.REF_READS_N]: createNumericalFilter(
                (d: Mutation) => d.normalRefCount
            ),
            [MutationTableColumnType.VAR_READS_N]: createNumericalFilter(
                (d: Mutation) => d.normalAltCount
            ),
            [MutationTableColumnType.REF_READS]: createNumericalFilter(
                (d: Mutation) => d.tumorRefCount
            ),
            [MutationTableColumnType.VAR_READS]: createNumericalFilter(
                (d: Mutation) => d.tumorAltCount
            ),
            [MutationTableColumnType.START_POS]: createNumericalFilter(
                (d: Mutation) => {
                    const val = getTextForDataField([d], 'startPosition');
                    return val ? +val : null;
                }
            ),
            [MutationTableColumnType.END_POS]: createNumericalFilter(
                (d: Mutation) => {
                    const val = getTextForDataField([d], 'endPosition');
                    return val ? +val : null;
                }
            ),
            [MutationTableColumnType.SAMPLE_ID]: createCategoricalFilter(
                (d: Mutation) => SampleColumnFormatter.getTextValue([d])
            ),
            [MutationTableColumnType.GENE]: createCategoricalFilter(
                (d: Mutation) => GeneColumnFormatter.getTextValue([d])
            ),
            [MutationTableColumnType.PROTEIN_CHANGE]: createCategoricalFilter(
                (d: Mutation) => ProteinChangeColumnFormatter.getTextValue([d])
            ),
            [MutationTableColumnType.CHROMOSOME]: createCategoricalFilter(
                (d: Mutation) => ChromosomeColumnFormatter.getData([d]) || ''
            ),
            [MutationTableColumnType.REF_ALLELE]: createCategoricalFilter(
                (d: Mutation) => getTextForDataField([d], 'referenceAllele')
            ),
            [MutationTableColumnType.VAR_ALLELE]: createCategoricalFilter(
                (d: Mutation) => getTextForDataField([d], 'variantAllele')
            ),
            [MutationTableColumnType.MUTATION_TYPE]: createCategoricalFilter(
                (d: Mutation) =>
                    MutationTypeColumnFormatter.getDisplayValue([d])
            ),
            [MutationTableColumnType.VARIANT_TYPE]: createCategoricalFilter(
                (d: Mutation) => VariantTypeColumnFormatter.getTextValue([d])
            ),
            [MutationTableColumnType.CENTER]: createCategoricalFilter(
                (d: Mutation) => getTextForDataField([d], 'center')
            ),
            [MutationTableColumnType.HGVSG]: createCategoricalFilter(
                (d: Mutation) => HgvsgColumnFormatter.download([d])
            ),
            [MutationTableColumnType.ASCN_METHOD]: createCategoricalFilter(
                (d: Mutation) => getASCNMethodValue(d)
            ),
            [MutationTableColumnType.CLINVAR]: createCategoricalFilter(
                (d: Mutation) =>
                    ClinvarColumnFormatter.download(
                        [d],
                        this.indexedVariantAnnotations
                    )
            ),
            [MutationTableColumnType.SIGNAL]: createCategoricalFilter(
                (d: Mutation) =>
                    SignalColumnFormatter.download(
                        [d],
                        this.indexedVariantAnnotations
                    )
            ),
        };
    }

    public createMutationMapperStoreForSelectedGene(gene: Gene) {
        const store = new ResultsViewMutationMapperStore(
            getServerConfig(),
            {
                filterMutationsBySelectedTranscript: true,
                filterAppliersOverride: this.customDataFilterAppliers,
                genomeBuild: this.genomeBuild,
            },
            gene,
            this.filteredSamples,
            this.oncoKbCancerGenes,
            () => this.mutationsByGene.result![gene.hugoGeneSymbol] || [],
            () => this.mutationCountCache,
            () => this.clinicalAttributeCache,
            () => this.genomeNexusCache,
            () => this.genomeNexusMutationAssessorCache,
            () => this.discreteCNACache,
            this.studyToMolecularProfileDiscreteCna.result!,
            this.studyIdToStudy,
            this.queriedStudies,
            this.molecularProfileIdToMolecularProfile,
            this.clinicalDataForSamples,
            this.studiesForSamplesWithoutCancerTypeClinicalData,
            this.germlineConsentedSamples,
            this.indexedHotspotData,
            this.indexedVariantAnnotations,
            this.uniqueSampleKeyToTumorType.result!,
            this.generateGenomeNexusHgvsgUrl,
            this.clinicalDataGroupedBySampleMap,
            this.mutationsTabClinicalAttributes,
            this.clinicalAttributeIdToAvailableFrequency,
            this.genomeNexusClient,
            this.genomeNexusInternalClient,
            () => this.urlWrapper.query.mutations_transcript_id
        );
        this.mutationMapperStoreByGeneWithDriverKey[
            this.getGeneWithDriverKey(gene)
        ] = store;
        return store;
    }

    public getMutationMapperStore(
        gene: Gene
    ): ResultsViewMutationMapperStore | undefined {
        if (
            this.genes.isComplete &&
            this.oncoKbCancerGenes.isComplete &&
            this.uniqueSampleKeyToTumorType.isComplete &&
            this.mutations.isComplete &&
            this.mutationsByGene.isComplete
        ) {
            return (
                this.mutationMapperStoreByGeneWithDriverKey[
                    this.getGeneWithDriverKey(gene)
                ] || this.createMutationMapperStoreForSelectedGene(gene)
            );
        }
        return undefined;
    }

    // Need to add "DRIVER" into key because mutation mapper store is cached
    // if we don't do this, starting with no driver then switch to driver will get wrong filter results
    private getGeneWithDriverKey(gene: Gene) {
        return `${gene.hugoGeneSymbol}_${
            this.isPutativeDriver ? 'DRIVER' : 'NO_DRIVER'
        }`;
    }

    readonly ascnClinicalDataForSamples = remoteData<ClinicalData[]>(
        {
            await: () => [this.studies, this.samples],
            invoke: () =>
                this.getClinicalData(
                    REQUEST_ARG_ENUM.CLINICAL_DATA_TYPE_SAMPLE,
                    this.studies.result!,
                    this.samples.result,
                    [
                        CLINICAL_ATTRIBUTE_ID_ENUM.ASCN_WGD,
                        CLINICAL_ATTRIBUTE_ID_ENUM.ASCN_PURITY,
                    ]
                ),
        },
        []
    );

    @computed get sampleIds(): string[] {
        if (this.samples.result) {
            return this.samples.result.map(sample => sample.sampleId);
        }
        return [];
    }

    readonly ascnClinicalDataGroupedBySample = remoteData(
        {
            await: () => [this.ascnClinicalDataForSamples],
            invoke: async () =>
                groupBySampleId(
                    this.sampleIds,
                    this.ascnClinicalDataForSamples.result
                ),
        },
        []
    );

    readonly clinicalDataGroupedBySampleMap = remoteData(
        {
            await: () => [this.ascnClinicalDataGroupedBySample],
            invoke: async () =>
                mapSampleIdToClinicalData(
                    this.ascnClinicalDataGroupedBySample.result
                ),
        },
        {}
    );

    readonly germlineConsentedSamples = remoteData<SampleIdentifier[]>(
        {
            await: () => [this.studyIds, this.sampleMap],
            invoke: async () => {
                const germlineConsentedSamples: SampleIdentifier[] = await fetchGermlineConsentedSamples(
                    this.studyIds,
                    getServerConfig().studiesWithGermlineConsentedSamples
                );

                // do not simply return all germline consented samples,
                // only include the ones matching current sample selection
                const sampleMap = this.sampleMap.result!;
                return germlineConsentedSamples.filter(s =>
                    sampleMap.has(s, ['sampleId', 'studyId'])
                );
            },
            onError: () => {
                // fail silently
            },
        },
        []
    );

    readonly samples = remoteData(
        {
            await: () => [this.studyToDataQueryFilter],
            invoke: async () => {
                const customSampleListIds = new SampleSet();
                const customSampleListStudyIds: string[] = [];
                const sampleListIds: string[] = [];
                _.each(
                    this.studyToDataQueryFilter.result,
                    (dataQueryFilter: IDataQueryFilter, studyId: string) => {
                        if (dataQueryFilter.sampleIds) {
                            customSampleListIds.add(
                                studyId,
                                dataQueryFilter.sampleIds
                            );
                            customSampleListStudyIds.push(studyId);
                        } else if (dataQueryFilter.sampleListId) {
                            sampleListIds.push(dataQueryFilter.sampleListId);
                        }
                    }
                );

                const promises: Promise<Sample[]>[] = [];

                if (customSampleListStudyIds.length > 0) {
                    promises.push(
                        getClient()
                            .fetchSamplesUsingPOST({
                                sampleFilter: {
                                    sampleListIds: customSampleListStudyIds.map(
                                        studyId => `${studyId}_all`
                                    ),
                                } as SampleFilter,
                                projection:
                                    REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                            })
                            .then(samples => {
                                return samples.filter(s =>
                                    customSampleListIds.has(s)
                                );
                            })
                    );
                }
                if (sampleListIds.length) {
                    promises.push(
                        getClient().fetchSamplesUsingPOST({
                            sampleFilter: {
                                sampleListIds,
                            } as SampleFilter,
                            projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                        })
                    );
                }
                return _.flatten(await Promise.all(promises));
            },
            onError: e => {
                eventBus.emit('error', null, new SiteError(e));
            },
        },
        []
    );

    readonly sampleMap = remoteData({
        await: () => [this.samples],
        invoke: () => {
            return Promise.resolve(
                ComplexKeyMap.from(this.samples.result!, s => ({
                    studyId: s.studyId,
                    sampleId: s.sampleId,
                }))
            );
        },
    });

    readonly filteredSamples = remoteData({
        await: () => [
            this.samples,
            this.unprofiledSampleKeyToSample,
            this.totallyUnprofiledSamples,
        ],
        invoke: () => {
            if (this.hideUnprofiledSamples) {
                let unprofiledSampleKeys: { [key: string]: Sample };
                if (this.hideUnprofiledSamples === 'any') {
                    unprofiledSampleKeys = this.unprofiledSampleKeyToSample
                        .result!;
                } else if (this.hideUnprofiledSamples === 'totally') {
                    unprofiledSampleKeys = _.keyBy(
                        this.totallyUnprofiledSamples.result!,
                        s => s.uniqueSampleKey
                    );
                }
                return Promise.resolve(
                    this.samples.result!.filter(
                        s => !(s.uniqueSampleKey in unprofiledSampleKeys)
                    )
                );
            } else {
                return Promise.resolve(this.samples.result!);
            }
        },
    });

    readonly unprofiledSamples = remoteData({
        await: () => [
            this.samples,
            this.coverageInformation,
            this.genes,
            this.selectedMolecularProfiles,
        ],
        invoke: () => {
            // Samples that are unprofiled for at least one (gene, profile)
            const genes = this.genes.result!;
            const coverageInfo = this.coverageInformation.result!;
            const studyToSelectedMolecularProfileIds = _.mapValues(
                _.groupBy(
                    this.selectedMolecularProfiles.result!,
                    p => p.studyId
                ),
                profiles => profiles.map(p => p.molecularProfileId)
            );

            return Promise.resolve(
                this.samples.result!.filter(sample => {
                    // Only look at profiles for this sample's study - doesn't
                    //  make sense to look at profiles for other studies, which
                    //  the sample certainly is not part of.
                    const profileIds =
                        studyToSelectedMolecularProfileIds[sample.studyId];

                    // Sample that is unprofiled for some gene
                    return _.some(genes, gene => {
                        // for some profile
                        return !_.every(
                            isSampleProfiledInMultiple(
                                sample.uniqueSampleKey,
                                profileIds,
                                coverageInfo,
                                gene.hugoGeneSymbol
                            )
                        );
                    });
                })
            );
        },
    });

    readonly totallyUnprofiledSamples = remoteData({
        await: () => [
            this.unprofiledSamples,
            this.coverageInformation,
            this.genes,
            this.selectedMolecularProfiles,
        ],
        invoke: () => {
            const genes = this.genes.result!;
            const coverageInfo = this.coverageInformation.result!;
            const studyToSelectedMolecularProfileIds = _.mapValues(
                _.groupBy(
                    this.selectedMolecularProfiles.result!,
                    p => p.studyId
                ),
                profiles => profiles.map(p => p.molecularProfileId)
            );

            return Promise.resolve(
                this.unprofiledSamples.result!.filter(sample => {
                    // Only look at profiles for this sample's study - doesn't
                    //  make sense to look at profiles for other studies, which
                    //  the sample certainly is not part of.
                    const profileIds =
                        studyToSelectedMolecularProfileIds[sample.studyId];

                    // Among unprofiled samples, pick out samples that are unprofiled for EVERY gene ...(gene x profile)
                    return _.every(genes, gene => {
                        // for EVERY profile
                        return !_.some(
                            isSampleProfiledInMultiple(
                                sample.uniqueSampleKey,
                                profileIds,
                                coverageInfo,
                                gene.hugoGeneSymbol
                            )
                        );
                    });
                })
            );
        },
    });

    readonly unprofiledSampleKeyToSample = remoteData({
        await: () => [this.unprofiledSamples],
        invoke: () =>
            Promise.resolve(
                _.keyBy(this.unprofiledSamples.result!, s => s.uniqueSampleKey)
            ),
    });

    readonly filteredSampleKeyToSample = remoteData({
        await: () => [this.filteredSamples],
        invoke: () =>
            Promise.resolve(
                _.keyBy(this.filteredSamples.result!, s => s.uniqueSampleKey)
            ),
    });

    readonly filteredAndAnnotatedMutations = remoteData<AnnotatedMutation[]>({
        await: () => [
            this._filteredAndAnnotatedMutationsReport,
            this.filteredSampleKeyToSample,
        ],
        invoke: () => {
            const filteredMutations = compileMutations(
                this._filteredAndAnnotatedMutationsReport.result!,
                !this.driverAnnotationSettings.includeVUS,
                !this.includeGermlineMutations
            );
            const filteredSampleKeyToSample = this.filteredSampleKeyToSample
                .result!;
            return Promise.resolve(
                filteredMutations.filter(
                    m => m.uniqueSampleKey in filteredSampleKeyToSample
                )
            );
        },
    });

    readonly filteredPatients = remoteData({
        await: () => [
            this.filteredSamples,
            this.patients,
            this.patientKeyToPatient,
        ],
        invoke: () => {
            if (this.hideUnprofiledSamples) {
                const patientKeyToPatient = this.patientKeyToPatient.result!;
                return Promise.resolve(
                    _.uniqBy(
                        this.filteredSamples.result!.map(
                            s => patientKeyToPatient[s.uniquePatientKey]
                        ),
                        patient => patient.uniquePatientKey
                    )
                );
            } else {
                return Promise.resolve(this.patients.result!);
            }
        },
    });

    readonly filteredPatientKeyToPatient = remoteData({
        await: () => [this.filteredPatients],
        invoke: () =>
            Promise.resolve(
                _.keyBy(this.filteredPatients.result!, p => p.uniquePatientKey)
            ),
    });

    readonly sampleKeyToSample = remoteData({
        await: () => [this.samples],
        invoke: () => {
            return Promise.resolve(
                _.keyBy(this.samples.result!, sample => sample.uniqueSampleKey)
            );
        },
    });

    readonly patientKeyToPatient = remoteData({
        await: () => [this.patients],
        invoke: () => {
            return Promise.resolve(
                _.keyBy(
                    this.patients.result!,
                    patient => patient.uniquePatientKey
                )
            );
        },
    });

    readonly patientKeyToFilteredSamples = remoteData({
        await: () => [this.filteredSamples],
        invoke: () => {
            return Promise.resolve(
                _.groupBy(
                    this.filteredSamples.result!,
                    sample => sample.uniquePatientKey
                )
            );
        },
    });

    readonly patients = remoteData({
        await: () => [this.samples],
        invoke: () => fetchPatients(this.samples.result!),
        default: [],
    });

    readonly studies = remoteData(
        {
            await: () => [this.studyIds],
            invoke: async () => {
                // we do this because get all studies (detailed projection) will be in cache
                // for all users since it is the same for everyone
                const allStudies = await getClient().getAllStudiesUsingGET({
                    projection: REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                });
                return allStudies.filter(study =>
                    this.studyIds.result!.includes(study.studyId)
                );
            },
        },
        []
    );

    @computed get genomeBuild() {
        if (!this.studies.isComplete) {
            throw new Error('Failed to get studies');
        }
        return getGenomeBuildFromStudies(this.studies.result);
    }

    //this is only required to show study name and description on the results page
    //CancerStudy objects for all the cohortIds
    readonly queriedStudies = remoteData({
        await: () => [this.everyStudyIdToStudy, this.queriedVirtualStudies],
        invoke: async () => {
            if (!_.isEmpty(this.cancerStudyIds)) {
                return fetchQueriedStudies(
                    this.everyStudyIdToStudy.result!,
                    this.cancerStudyIds,
                    this.queriedVirtualStudies.result
                        ? this.queriedVirtualStudies.result
                        : []
                );
            } else {
                return [];
            }
        },
        default: [],
    });

    readonly studyIdToStudy = remoteData(
        {
            await: () => [this.studies],
            invoke: () =>
                Promise.resolve(_.keyBy(this.studies.result, x => x.studyId)),
        },
        {}
    );

    readonly molecularProfilesInStudies = remoteData<MolecularProfile[]>(
        {
            await: () => [this.studyIds],
            invoke: async () => {
                let profiles = await getClient().fetchMolecularProfilesUsingPOST(
                    {
                        molecularProfileFilter: {
                            studyIds: this.studyIds.result!,
                        } as MolecularProfileFilter,
                    }
                );

                // expression profiles are not allowed
                // under some circumstances
                if (
                    allowExpressionCrossStudy(
                        this.studies.result,
                        getServerConfig().enable_cross_study_expression,
                        false
                    )
                ) {
                    return profiles;
                } else {
                    return profiles.filter(
                        p =>
                            ![
                                AlterationTypeConstants.MRNA_EXPRESSION,
                                AlterationTypeConstants.MICRO_RNA_EXPRESSION,
                                AlterationTypeConstants.PROTEIN_LEVEL,
                                AlterationTypeConstants.RNA_EXPRESSION,
                                AlterationTypeConstants.MICRO_RNA_EXPRESSION,
                            ].includes(p.molecularAlterationType)
                    );
                }
            },
        },
        []
    );

    // need to support fusion data later
    readonly nonSelectedDownloadableMolecularProfiles = remoteData<
        MolecularProfile[]
    >(
        {
            await: () => [
                this.molecularProfilesInStudies,
                this.selectedMolecularProfiles,
            ],
            invoke: () => {
                return Promise.resolve(
                    excludeSpecialMolecularProfiles(
                        _.difference(
                            this.molecularProfilesInStudies.result!,
                            this.selectedMolecularProfiles.result!
                        )
                    )
                );
            },
        },
        []
    );

    readonly molecularProfileIdToMolecularProfile = remoteData<{
        [molecularProfileId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.molecularProfilesInStudies],
            invoke: () => {
                return Promise.resolve(
                    this.molecularProfilesInStudies.result.reduce(
                        (
                            map: {
                                [molecularProfileId: string]: MolecularProfile;
                            },
                            next: MolecularProfile
                        ) => {
                            map[next.molecularProfileId] = next;
                            return map;
                        },
                        {}
                    )
                );
            },
        },
        {}
    );

    readonly molecularProfileIdSuffixToMolecularProfiles = remoteData<{
        [molecularProfileIdSuffix: string]: MolecularProfile[];
    }>(
        {
            await: () => [this.molecularProfilesInStudies],
            invoke: () => {
                return Promise.resolve(
                    _.groupBy(
                        this.molecularProfilesInStudies.result,
                        molecularProfile =>
                            getSuffixOfMolecularProfile(molecularProfile)
                    )
                );
            },
        },
        {}
    );

    // If we have same profile accros multiple studies, they should have the same name, so we can group them by name to get all related molecular profiles in multiple studies.
    readonly nonSelectedDownloadableMolecularProfilesGroupByName = remoteData<{
        [profileName: string]: MolecularProfile[];
    }>(
        {
            await: () => [this.nonSelectedDownloadableMolecularProfiles],
            invoke: () => {
                const sortedProfiles = _.sortBy(
                    this.nonSelectedDownloadableMolecularProfiles.result,
                    profile =>
                        decideMolecularProfileSortingOrder(
                            profile.molecularAlterationType
                        )
                );
                return Promise.resolve(
                    _.groupBy(sortedProfiles, profile => profile.name)
                );
            },
        },
        {}
    );

    readonly studyToMolecularProfileDiscreteCna = remoteData<{
        [studyId: string]: MolecularProfile;
    }>(
        {
            await: () => [this.molecularProfilesInStudies],
            invoke: async () => {
                const ret: { [studyId: string]: MolecularProfile } = {};
                for (const molecularProfile of this.molecularProfilesInStudies
                    .result) {
                    if (
                        molecularProfile.datatype ===
                            DataTypeConstants.DISCRETE &&
                        molecularProfile.molecularAlterationType ===
                            AlterationTypeConstants.COPY_NUMBER_ALTERATION
                    ) {
                        ret[molecularProfile.studyId] = molecularProfile;
                    }
                }
                return ret;
            },
        },
        {}
    );

    readonly heatmapMolecularProfiles = remoteData<MolecularProfile[]>({
        await: () => [
            this.molecularProfilesInStudies,
            this.selectedMolecularProfiles,
            this.genesetMolecularProfile,
            this.hasVAFData,
        ],
        invoke: () => {
            const MRNA_EXPRESSION = AlterationTypeConstants.MRNA_EXPRESSION;
            const PROTEIN_LEVEL = AlterationTypeConstants.PROTEIN_LEVEL;
            const METHYLATION = AlterationTypeConstants.METHYLATION;
            const MUTATION_EXTENDED = AlterationTypeConstants.MUTATION_EXTENDED;
            const selectedMolecularProfileIds = stringListToSet(
                this.selectedMolecularProfiles.result!.map(
                    profile => profile.molecularProfileId
                )
            );
            const hasVAF = this.hasVAFData.result;

            const expressionHeatmaps = _.sortBy(
                _.filter(this.molecularProfilesInStudies.result!, profile => {
                    return (
                        // Select mrna and protein profiles only if showProfileInAnalysisTab is true
                        // Select all methylation profiles
                        ((profile.molecularAlterationType === MRNA_EXPRESSION ||
                            profile.molecularAlterationType ===
                                PROTEIN_LEVEL) &&
                            profile.showProfileInAnalysisTab) ||
                        profile.molecularAlterationType === METHYLATION ||
                        (profile.molecularAlterationType ===
                            MUTATION_EXTENDED &&
                            hasVAF)
                    );
                }),
                profile => {
                    // Sort order: selected and [mrna, protein, methylation], unselected and [mrna, protein, methylation]
                    if (
                        profile.molecularProfileId in
                        selectedMolecularProfileIds
                    ) {
                        switch (profile.molecularAlterationType) {
                            case MRNA_EXPRESSION:
                                return 0;
                            case PROTEIN_LEVEL:
                                return 1;
                            case METHYLATION:
                                return 2;
                            case MUTATION_EXTENDED:
                                return 3;
                        }
                    } else {
                        switch (profile.molecularAlterationType) {
                            case MRNA_EXPRESSION:
                                return 4;
                            case PROTEIN_LEVEL:
                                return 5;
                            case METHYLATION:
                                return 6;
                            case MUTATION_EXTENDED:
                                return 7;
                        }
                    }
                }
            );
            const genesetMolecularProfile = this.genesetMolecularProfile
                .result!;
            const genesetHeatmaps = genesetMolecularProfile.isApplicable
                ? [genesetMolecularProfile.value]
                : [];
            return Promise.resolve(expressionHeatmaps.concat(genesetHeatmaps));
        },
    });

    readonly hasVAFData = remoteData<boolean>({
        await: () => [this.mutations],
        invoke: () => {
            const hasVAF = this.mutations.result!.some(
                m => _.isFinite(m.tumorAltCount) && _.isFinite(m.tumorRefCount)
            );

            return Promise.resolve(hasVAF);
        },
        default: false,
    });

    readonly genesetMolecularProfile = remoteData<Optional<MolecularProfile>>({
        await: () => [this.selectedMolecularProfiles],
        invoke: () => {
            const applicableProfiles = _.filter(
                this.selectedMolecularProfiles.result!,
                profile =>
                    profile.molecularAlterationType ===
                        AlterationTypeConstants.GENESET_SCORE &&
                    profile.showProfileInAnalysisTab
            );
            if (applicableProfiles.length > 1) {
                return Promise.reject(
                    new Error('Queried more than one gene set score profile')
                );
            }
            const genesetProfile = applicableProfiles.pop();
            const value: Optional<MolecularProfile> = genesetProfile
                ? { isApplicable: true, value: genesetProfile }
                : { isApplicable: false };
            return Promise.resolve(value);
        },
    });

    readonly studyToDataQueryFilter = remoteData<{
        [studyId: string]: IDataQueryFilter;
    }>(
        {
            await: () => [
                this.studyToCustomSampleList,
                this.studyIds,
                this.studyToSampleListId,
            ],
            invoke: () => {
                const studies = this.studyIds.result!;
                const ret: { [studyId: string]: IDataQueryFilter } = {};
                for (const studyId of studies) {
                    ret[studyId] = generateDataQueryFilter(
                        this.studyToSampleListId.result![studyId],
                        this.studyToCustomSampleList.result![studyId]
                    );
                }
                return Promise.resolve(ret);
            },
        },
        {}
    );

    readonly molecularProfileIdToDataQueryFilter = remoteData<{
        [molecularProfileId: string]: IDataQueryFilter;
    }>({
        await: () => [
            this.molecularProfilesInStudies,
            this.studyToDataQueryFilter,
        ],
        invoke: () => {
            const ret: { [molecularProfileId: string]: IDataQueryFilter } = {};
            for (const molecularProfile of this.molecularProfilesInStudies
                .result!) {
                ret[
                    molecularProfile.molecularProfileId
                ] = this.studyToDataQueryFilter.result![
                    molecularProfile.studyId
                ];
            }
            return Promise.resolve(ret);
        },
        default: {},
    });

    readonly genes = remoteData<Gene[]>({
        invoke: async () => {
            const genes = await fetchGenes(this.hugoGeneSymbols);

            // Check that the same genes are in the OQL query as in the API response (order doesnt matter).
            // This ensures that all the genes in OQL are valid. If not, we throw an error.
            if (
                _.isEqual(
                    _.uniq(
                        this.hugoGeneSymbols
                            .filter(h => !structVarOQLSpecialValues.includes(h))
                            .sort()
                    ),
                    _.uniq(genes.map(gene => gene.hugoGeneSymbol).sort())
                )
            ) {
                return genes;
            } else {
                throw new Error(ErrorMessages.INVALID_GENES);
            }
        },
        onResult: (genes: Gene[]) => {
            this.geneCache.addData(genes);
        },
        onError: err => {
            // throwing this allows sentry to report it
            throw err;
        },
    });

    @computed
    get hugoGeneSymbolToGene(): { [hugoGeneSymbol: string]: Gene } {
        return _.keyBy(this.genes.result!, gene => gene.hugoGeneSymbol);
    }

    readonly referenceGenes = remoteData<ReferenceGenomeGene[]>({
        await: () => [this.studies],
        invoke: () => {
            if (this.studies.result!.length > 0) {
                return fetchAllReferenceGenomeGenes(
                    this.studies.result[0].referenceGenome
                );
            } else {
                return Promise.resolve([]);
            }
        },
    });

    readonly allGenes = remoteData<Gene[]>({
        invoke: () => {
            return getAllGenes();
        },
    });

    readonly hugoGeneSymbolToReferenceGene = remoteData<{
        [hugoSymbol: string]: ReferenceGenomeGene;
    }>({
        await: () => [this.referenceGenes],
        invoke: () => {
            // build reference gene map
            return Promise.resolve(
                _.keyBy(this.referenceGenes.result!, g => g.hugoGeneSymbol)
            );
        },
    });

    readonly entrezGeneIdToReferenceGene = remoteData<{
        [entrezGeneId: string]: ReferenceGenomeGene;
    }>({
        await: () => [this.referenceGenes],
        invoke: () => {
            // build reference gene map
            return Promise.resolve(
                _.keyBy(this.referenceGenes.result!, g => g.entrezGeneId)
            );
        },
    });

    readonly entrezGeneIdToGeneAll = remoteData<{
        [entrezGeneId: string]: Gene;
    }>({
        await: () => [this.allGenes],
        invoke: () => {
            // build reference gene map
            return Promise.resolve(
                _.keyBy(this.allGenes.result!, g => g.entrezGeneId)
            );
        },
    });

    @computed get referenceGenome() {
        const study = this.studies.result ? this.studies.result[0] : undefined;
        return study ? study.referenceGenome : DEFAULT_GENOME;
    }

    @computed get genesInvalid() {
        return this.genes.isError;
    }

    @computed get queryExceedsLimit() {
        return (
            this.hugoGeneSymbols.length * this.samples.result.length >
            getServerConfig().query_product_limit
        );
    }

    @computed get geneLimit(): number {
        return Math.floor(
            getServerConfig().query_product_limit / this.samples.result.length
        );
    }

    readonly genesets = remoteData<Geneset[]>({
        invoke: () => {
            if (this.genesetIds && this.genesetIds.length > 0) {
                return internalClient.fetchGenesetsUsingPOST({
                    genesetIds: this.genesetIds.slice(),
                });
            } else {
                return Promise.resolve([]);
            }
        },
        onResult: (genesets: Geneset[]) => {
            this.genesetCache.addData(genesets);
        },
    });

    readonly geneticEntities = remoteData<GeneticEntity[]>({
        await: () => [
            this.genes,
            this.genesets,
            this.hugoGeneSymbolToReferenceGene,
        ],
        invoke: () => {
            const res: GeneticEntity[] = [];
            for (const gene of this.genes.result!) {
                // handle case where a gene doesn't appear in reference genome data
                const refGene = this.hugoGeneSymbolToReferenceGene.result![
                    gene.hugoGeneSymbol
                ];

                let cytoband = '';

                if (refGene && refGene.cytoband) {
                    cytoband = refGene.cytoband;
                }

                res.push({
                    geneticEntityName: gene.hugoGeneSymbol,
                    geneticEntityType: GeneticEntityType.GENE,
                    geneticEntityId: gene.entrezGeneId,
                    cytoband: cytoband,
                    geneticEntityData: gene,
                });
            }
            for (const geneset of this.genesets.result!) {
                res.push({
                    geneticEntityName: geneset.name,
                    geneticEntityType: GeneticEntityType.GENESET,
                    geneticEntityId: geneset.genesetId,
                    cytoband: '-',
                    geneticEntityData: geneset,
                });
            }
            return Promise.resolve(res);
        },
    });

    readonly genericAssayEntitiesGroupedByGenericAssayType = remoteData<{
        [genericAssayType: string]: GenericAssayMeta[];
    }>(
        {
            await: () => [this.molecularProfilesInStudies],
            invoke: async () => {
                return await fetchGenericAssayMetaByMolecularProfileIdsGroupedByGenericAssayType(
                    this.molecularProfilesInStudies.result
                );
            },
        },
        {}
    );

    readonly genericAssayEntitiesGroupByMolecularProfileId = remoteData<{
        [profileId: string]: GenericAssayMeta[];
    }>({
        await: () => [this.molecularProfilesInStudies],
        invoke: async () => {
            return await fetchGenericAssayMetaByMolecularProfileIdsGroupByMolecularProfileId(
                this.molecularProfilesInStudies.result
            );
        },
    });

    readonly selectedGenericAssayEntitiesGroupedByGenericAssayType = remoteData<{
        [genericAssayType: string]: GenericAssayMeta[];
    }>({
        await: () => [this.genericAssayEntitiesGroupedByGenericAssayType],
        invoke: () => {
            return Promise.resolve(
                _.mapValues(
                    this.genericAssayEntitiesGroupedByGenericAssayType.result,
                    (value, profileId) => {
                        const selectedEntityIds = this
                            .selectedGenericAssayEntitiesGroupByMolecularProfileId[
                            profileId
                        ];
                        return value.filter(entity =>
                            selectedEntityIds.includes(entity.stableId)
                        );
                    }
                )
            );
        },
    });

    readonly genesetLinkMap = remoteData<{ [genesetId: string]: string }>({
        invoke: async () => {
            if (this.genesetIds && this.genesetIds.length) {
                const genesets = await internalClient.fetchGenesetsUsingPOST({
                    genesetIds: this.genesetIds.slice(),
                });
                const linkMap: { [genesetId: string]: string } = {};
                genesets.forEach(({ genesetId, refLink }) => {
                    linkMap[genesetId] = refLink;
                });
                return linkMap;
            } else {
                return {};
            }
        },
    });

    readonly genericAssayEntitiesGroupedByGenericAssayTypeLinkMap = remoteData<{
        [genericAssayType: string]: { [stableId: string]: string };
    }>({
        await: () => [this.genericAssayEntitiesGroupedByGenericAssayType],
        invoke: async () => {
            if (
                !_.isEmpty(
                    this.genericAssayEntitiesGroupedByGenericAssayType.result
                )
            ) {
                return _.mapValues(
                    this.genericAssayEntitiesGroupedByGenericAssayType.result,
                    genericAssayEntities => {
                        const linkMap: { [stableId: string]: string } = {};
                        genericAssayEntities.forEach(entity => {
                            // if entity meta contains reference url, add the link into map
                            linkMap[
                                entity.stableId
                            ] = getGenericAssayMetaPropertyOrDefault(
                                entity,
                                COMMON_GENERIC_ASSAY_PROPERTY.URL,
                                ''
                            );
                        });
                        return linkMap;
                    }
                );
            } else {
                return {};
            }
        },
    });

    readonly genericAssayStableIdToMeta = remoteData<{
        [genericAssayStableId: string]: GenericAssayMeta;
    }>({
        await: () => [this.genericAssayEntitiesGroupByMolecularProfileId],
        invoke: () => {
            return Promise.resolve(
                _.chain(
                    this.genericAssayEntitiesGroupByMolecularProfileId.result
                )
                    .values()
                    .flatten()
                    .uniqBy(meta => meta.stableId)
                    .keyBy(meta => meta.stableId)
                    .value()
            );
        },
    });

    readonly genericAssayProfiles = remoteData<MolecularProfile[]>({
        await: () => [this.molecularProfilesInStudies],
        invoke: () => {
            return Promise.resolve(
                this.molecularProfilesInStudies.result.filter(
                    profile =>
                        profile.molecularAlterationType ===
                        AlterationTypeConstants.GENERIC_ASSAY
                )
            );
        },
    });

    readonly genericAssayProfilesGroupByProfileIdSuffix = remoteData<{
        [profileIdSuffix: string]: MolecularProfile[];
    }>({
        await: () => [this.genericAssayProfiles],
        invoke: () => {
            return Promise.resolve(
                _.groupBy(this.genericAssayProfiles.result, molecularProfile =>
                    molecularProfile.molecularProfileId.replace(
                        molecularProfile.studyId + '_',
                        ''
                    )
                )
            );
        },
    });

    readonly genericAssayEntityStableIdsGroupByProfileIdSuffix = remoteData<{
        [profileIdSuffix: string]: string[];
    }>({
        await: () => [this.genericAssayProfilesGroupByProfileIdSuffix],
        invoke: () => {
            return Promise.resolve(
                _.mapValues(
                    this.genericAssayProfilesGroupByProfileIdSuffix.result,
                    profiles => {
                        return _.chain(profiles)
                            .map(
                                profile =>
                                    this
                                        .selectedGenericAssayEntitiesGroupByMolecularProfileId[
                                        profile.molecularProfileId
                                    ]
                            )
                            .flatten()
                            .uniq()
                            .compact()
                            .value();
                    }
                )
            );
        },
    });

    readonly genericAssayDataGroupByProfileIdSuffix = remoteData<{
        [profileIdSuffix: string]: GenericAssayData[];
    }>({
        await: () => [
            this.samples,
            this.genericAssayProfilesGroupByProfileIdSuffix,
            this.genericAssayEntityStableIdsGroupByProfileIdSuffix,
        ],
        invoke: async () => {
            const genericAssayDataGroupByProfileIdSuffix: {
                [profileIdSuffix: string]: GenericAssayData[];
            } = {};

            await Promise.all(
                _.map(
                    this.genericAssayProfilesGroupByProfileIdSuffix.result,
                    (profiles, profileIdSuffix) => {
                        const molecularIds = profiles.map(
                            profile => profile.molecularProfileId
                        );
                        const stableIds = this
                            .genericAssayEntityStableIdsGroupByProfileIdSuffix
                            .result![profileIdSuffix];

                        const sampleMolecularIdentifiers = _.flatMap(
                            molecularIds,
                            molecularId =>
                                _.map(this.samples.result, sample => {
                                    return {
                                        molecularProfileId: molecularId,
                                        sampleId: sample.sampleId,
                                    } as SampleMolecularIdentifier;
                                })
                        );

                        if (
                            !_.isEmpty(stableIds) &&
                            !_.isEmpty(sampleMolecularIdentifiers)
                        ) {
                            return getClient()
                                .fetchGenericAssayDataInMultipleMolecularProfilesUsingPOST(
                                    {
                                        genericAssayDataMultipleStudyFilter: {
                                            genericAssayStableIds: stableIds,
                                            sampleMolecularIdentifiers,
                                        } as GenericAssayDataMultipleStudyFilter,
                                    } as any
                                )
                                .then(genericAssayData => {
                                    genericAssayDataGroupByProfileIdSuffix[
                                        profileIdSuffix
                                    ] = genericAssayData;
                                });
                        }
                    }
                )
            );

            return genericAssayDataGroupByProfileIdSuffix;
        },
    });

    readonly customDriverAnnotationReport = remoteData<IDriverAnnotationReport>(
        {
            await: () => [
                this.mutations,
                this.discreteCNAMolecularData,
                this.structuralVariants,
            ],
            invoke: () => {
                return Promise.resolve(
                    computeCustomDriverAnnotationReport([
                        ...this.mutations.result!,
                        ...this.discreteCNAMolecularData.result!,
                        ...this.structuralVariants.result!,
                    ])
                );
            },
            onResult: result => {
                initializeCustomDriverAnnotationSettings(
                    result!,
                    this.driverAnnotationSettings,
                    this.driverAnnotationSettings.customTiersDefault,
                    this.driverAnnotationSettings.oncoKb,
                    this.driverAnnotationSettings.hotspots
                );
            },
        }
    );

    readonly _filteredAndAnnotatedStructuralVariantsReport = remoteData({
        await: () => [
            this.structuralVariants,
            this.getStructuralVariantPutativeDriverInfo,
        ],
        invoke: () => {
            return Promise.resolve(
                filterAndAnnotateStructuralVariants(
                    this.structuralVariants.result!,
                    this.getStructuralVariantPutativeDriverInfo.result!
                )
            );
        },
    });

    readonly structuralVariantMapperStores = remoteData<{
        [hugoGeneSymbol: string]: ResultsViewStructuralVariantMapperStore;
    }>(
        {
            await: () => [
                this.genes,
                this.structuralVariantsByEntrezGeneId,
                this.studyIdToStudy,
                this.molecularProfileIdToMolecularProfile,
                this.samples,
                this.uniqueSampleKeyToTumorType,
            ],
            invoke: () => {
                if (
                    this.genes.result &&
                    this.structuralVariantsByEntrezGeneId.result
                ) {
                    return Promise.resolve(
                        this.genes.result.reduce(
                            (
                                map: {
                                    [hugoGeneSymbol: string]: ResultsViewStructuralVariantMapperStore;
                                },
                                gene: Gene
                            ) => {
                                map[
                                    gene.hugoGeneSymbol
                                ] = new ResultsViewStructuralVariantMapperStore(
                                    gene,
                                    this.studyIdToStudy,
                                    this.molecularProfileIdToMolecularProfile,
                                    this.structuralVariantsByEntrezGeneId
                                        .result![gene.entrezGeneId] || [],
                                    this.uniqueSampleKeyToTumorType.result!,
                                    this.structuralVariantOncoKbData,
                                    this.oncoKbCancerGenes,
                                    this.usingPublicOncoKbInstance,
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

    readonly filteredAndAnnotatedStructuralVariants = remoteData<
        AnnotatedStructuralVariant[]
    >({
        await: () => [this._filteredAndAnnotatedStructuralVariantsReport],
        invoke: () =>
            Promise.resolve(
                compileStructuralVariants(
                    this._filteredAndAnnotatedStructuralVariantsReport.result!,
                    !this.driverAnnotationSettings.includeVUS,
                    !this.includeGermlineMutations
                )
            ),
    });

    public annotatedMutationCache = new MobxPromiseCache<
        { entrezGeneId: number },
        AnnotatedMutation[]
    >(q => ({
        await: () => [
            this.mutationCache.get(q),
            this.getMutationPutativeDriverInfo,
            this.entrezGeneIdToGene,
        ],
        invoke: () => {
            const filteredAndAnnotatedReport = filterAndAnnotateMutations(
                this.mutationCache.get(q).result!,
                this.getMutationPutativeDriverInfo.result!,
                this.entrezGeneIdToGene.result!
            );
            const data = filteredAndAnnotatedReport.data
                .concat(filteredAndAnnotatedReport.vus)
                .concat(filteredAndAnnotatedReport.germline);

            return Promise.resolve(data);
        },
    }));

    readonly _filteredAndAnnotatedMolecularDataReport = remoteData({
        await: () => [
            this.molecularData,
            this.entrezGeneIdToGene,
            this.getDiscreteCNAPutativeDriverInfo,
        ],
        invoke: () =>
            Promise.resolve(
                filterAndAnnotateMolecularData(
                    this.molecularData.result!,
                    this.getDiscreteCNAPutativeDriverInfo.result!,
                    this.entrezGeneIdToGene.result!,
                    this.cnaMolecularProfileIds
                )
            ),
    });

    /**
     * All molecular data that is no
     * - mutation
     * - structural variant
     * - copy number alteration
     * - generic assay
     *
     * For example mRNA and Proteomic data
     */
    readonly filteredAndAnnotatedNonGenomicData = remoteData<
        AnnotatedNumericGeneMolecularData[]
    >({
        await: () => [
            this._filteredAndAnnotatedMolecularDataReport,
            this.filteredSampleKeyToSample,
        ],
        invoke: () => {
            const data = this._filteredAndAnnotatedMolecularDataReport.result!.data.concat(
                this._filteredAndAnnotatedMolecularDataReport.result!.vus
            );
            const filteredSampleKeyToSample = this.filteredSampleKeyToSample
                .result!;
            const cnaProfiles = this.selectedMolecularProfiles
                .result!.filter(
                    v =>
                        v.molecularAlterationType ===
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION
                )
                .map(p => p.molecularProfileId);
            const filteredData = data.filter(
                d =>
                    d.uniqueSampleKey in filteredSampleKeyToSample &&
                    !cnaProfiles.includes(d.molecularProfileId)
            );
            return Promise.resolve(filteredData);
        },
    });

    readonly filteredAndAnnotatedCnaData = remoteData<
        AnnotatedNumericGeneMolecularData[]
    >({
        await: () => [
            this._filteredAndAnnotatedMolecularDataReport,
            this.filteredSampleKeyToSample,
            this.selectedMolecularProfiles,
        ],
        invoke: () => {
            const cnaProfiles = this.selectedMolecularProfiles
                .result!.filter(
                    v =>
                        v.molecularAlterationType ===
                        AlterationTypeConstants.COPY_NUMBER_ALTERATION
                )
                .map(p => p.molecularProfileId);
            let data = this._filteredAndAnnotatedMolecularDataReport.result!
                .data;
            if (this.driverAnnotationSettings.includeVUS) {
                data = data.concat(
                    this._filteredAndAnnotatedMolecularDataReport.result!.vus
                );
            }
            const filteredSampleKeyToSample = this.filteredSampleKeyToSample
                .result!;
            const filteredData = data.filter(
                d =>
                    d.uniqueSampleKey in filteredSampleKeyToSample &&
                    cnaProfiles.includes(d.molecularProfileId)
            );
            return Promise.resolve(filteredData);
        },
    });

    public annotatedCnaCache = new MobxPromiseCache<
        { entrezGeneId: number },
        CustomDriverNumericGeneMolecularData[]
    >(q => ({
        await: () =>
            this.numericGeneMolecularDataCache.await(
                [
                    this.studyToMolecularProfileDiscreteCna,
                    this.getDiscreteCNAPutativeDriverInfo,
                    this.entrezGeneIdToGene,
                ],
                studyToMolecularProfileDiscrete => {
                    return _.values(studyToMolecularProfileDiscrete).map(p => ({
                        entrezGeneId: q.entrezGeneId,
                        molecularProfileId: p.molecularProfileId,
                    }));
                }
            ),
        invoke: () => {
            const cnaData = _.flatten(
                this.numericGeneMolecularDataCache
                    .getAll(
                        _.values(
                            this.studyToMolecularProfileDiscreteCna.result!
                        ).map(p => ({
                            entrezGeneId: q.entrezGeneId,
                            molecularProfileId: p.molecularProfileId,
                        }))
                    )
                    .map(p => p.result!)
            ) as CustomDriverNumericGeneMolecularData[];
            const filteredAndAnnotatedReport = filterAndAnnotateMolecularData(
                cnaData,
                this.getDiscreteCNAPutativeDriverInfo.result!,
                this.entrezGeneIdToGene.result!
            );
            const data = filteredAndAnnotatedReport.data.concat(
                filteredAndAnnotatedReport.vus
            );

            return Promise.resolve(
                filteredAndAnnotatedReport.data.concat(
                    filteredAndAnnotatedReport.vus
                )
            );
        },
    }));

    readonly getStructuralVariantPutativeDriverInfo = remoteData({
        await: () => {
            const toAwait = [];
            if (this.driverAnnotationSettings.oncoKb) {
                toAwait.push(
                    this.oncoKbStructuralVariantAnnotationForOncoprint
                );
            }
            return toAwait;
        },
        invoke: () => {
            return Promise.resolve((structuralVariant: StructuralVariant): {
                oncoKb: string;
                hotspots: boolean;
                customDriverBinary: boolean;
                customDriverTier?: string;
            } => {
                const getOncoKbStructuralVariantAnnotationForOncoprint = this
                    .oncoKbStructuralVariantAnnotationForOncoprint.result!;
                const oncoKbDatum:
                    | IndicatorQueryResp
                    | undefined
                    | null
                    | false =
                    this.driverAnnotationSettings.oncoKb &&
                    getOncoKbStructuralVariantAnnotationForOncoprint &&
                    !(
                        getOncoKbStructuralVariantAnnotationForOncoprint instanceof
                        Error
                    ) &&
                    getOncoKbStructuralVariantAnnotationForOncoprint(
                        structuralVariant
                    );

                // Note: custom driver annotations are part of the incoming datum
                return {
                    ...evaluatePutativeDriverInfo(
                        structuralVariant,
                        oncoKbDatum,
                        this.driverAnnotationSettings.customBinary,
                        this.driverAnnotationSettings.driverTiers
                    ),
                    hotspots: false,
                };
            });
        },
    });

    readonly getDiscreteCNAPutativeDriverInfo = remoteData({
        await: () => {
            const toAwait = [];
            if (this.driverAnnotationSettings.oncoKb) {
                toAwait.push(this.getOncoKbCnaAnnotationForOncoprint);
            }
            return toAwait;
        },
        invoke: () => {
            return Promise.resolve(
                (
                    cnaDatum: CustomDriverNumericGeneMolecularData
                ): {
                    oncoKb: string;
                    customDriverBinary: boolean;
                    customDriverTier?: string | undefined;
                } => {
                    const getOncoKBAnnotationFunc = this
                        .getOncoKbCnaAnnotationForOncoprint.result!;
                    const oncoKbDatum:
                        | IndicatorQueryResp
                        | undefined
                        | null
                        | false =
                        this.driverAnnotationSettings.oncoKb &&
                        getOncoKBAnnotationFunc &&
                        !(getOncoKBAnnotationFunc instanceof Error) &&
                        getOncoKBAnnotationFunc(cnaDatum);

                    // Note: custom driver annotations are part of the incoming datum
                    return evaluatePutativeDriverInfo(
                        cnaDatum,
                        oncoKbDatum,
                        this.driverAnnotationSettings.customBinary,
                        this.driverAnnotationSettings.driverTiers
                    );
                }
            );
        },
    });

    // Mutation annotation
    // genome nexus
    readonly indexedVariantAnnotations = remoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >(
        {
            await: () => [this.mutations],
            invoke: async () =>
                getServerConfig().show_transcript_dropdown &&
                this.mutations.result
                    ? await fetchVariantAnnotationsIndexedByGenomicLocation(
                          this.mutations.result,
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
                      )
                    : undefined,
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        undefined
    );

    readonly structuralVariantOncoKbDataForOncoprint = remoteData<
        IOncoKbData | Error
    >(
        {
            await: () => [this.structuralVariants, this.oncoKbAnnotatedGenes],
            invoke: async () => {
                if (getServerConfig().show_oncokb) {
                    let result;
                    try {
                        result = await fetchStructuralVariantOncoKbData(
                            {},
                            this.oncoKbAnnotatedGenes.result!,
                            this.structuralVariants
                        );
                    } catch (e) {
                        result = new Error();
                    }
                    return result;
                } else {
                    return ONCOKB_DEFAULT;
                }
            },
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        ONCOKB_DEFAULT
    );

    //we need seperate oncokb data because oncoprint requires onkb queries across cancertype
    //mutations tab the opposite
    readonly cnaOncoKbDataForOncoprint = remoteData<IOncoKbData | Error>(
        {
            await: () => [
                this.oncoKbAnnotatedGenes,
                this.discreteCNAMolecularData,
            ],
            invoke: async () =>
                fetchCnaOncoKbDataForOncoprint(
                    this.oncoKbAnnotatedGenes,
                    this.discreteCNAMolecularData
                ),
        },
        ONCOKB_DEFAULT
    );

    @computed get didOncoKbFailInOncoprint() {
        // check in this order so that we don't trigger invoke
        return (
            this.oncoKbMutationAnnotationForOncoprint.peekStatus ===
                'complete' &&
            this.oncoKbMutationAnnotationForOncoprint.result instanceof Error
        );
    }

    @computed get didHotspotFailInOncoprint() {
        // check in this order so that we don't trigger invoke
        return (
            this.isHotspotForOncoprint.peekStatus === 'complete' &&
            this.isHotspotForOncoprint.result instanceof Error
        );
    }

    readonly oncoKbStructuralVariantAnnotationForOncoprint = remoteData<
        | Error
        | ((
              structuralVariant: StructuralVariant
          ) => IndicatorQueryResp | undefined)
    >({
        await: () => [this.structuralVariantOncoKbDataForOncoprint],
        invoke: () => {
            const structuralVariantOncoKbDataForOncoprint = this
                .structuralVariantOncoKbDataForOncoprint.result!;
            if (structuralVariantOncoKbDataForOncoprint instanceof Error) {
                return Promise.resolve(new Error());
            } else {
                return Promise.resolve(
                    (structuralVariant: StructuralVariant) => {
                        const id = generateQueryStructuralVariantId(
                            structuralVariant.site1EntrezGeneId,
                            structuralVariant.site2EntrezGeneId,
                            cancerTypeForOncoKb(
                                structuralVariant.uniqueSampleKey,
                                {}
                            ),
                            deriveStructuralVariantType(structuralVariant)
                        );
                        return structuralVariantOncoKbDataForOncoprint.indicatorMap![
                            id
                        ];
                    }
                );
            }
        },
    });

    readonly getOncoKbCnaAnnotationForOncoprint = remoteData<
        | Error
        | ((data: NumericGeneMolecularData) => IndicatorQueryResp | undefined)
    >({
        await: () => [this.cnaOncoKbDataForOncoprint],
        invoke: () =>
            makeGetOncoKbCnaAnnotationForOncoprint(
                this.cnaOncoKbDataForOncoprint,
                this.driverAnnotationSettings.oncoKb
            ),
    });

    readonly molecularProfileIdToProfiledFilteredSamples = remoteData({
        await: () => [
            this.filteredSamples,
            this.coverageInformation,
            this.molecularProfilesInStudies,
        ],
        invoke: () => {
            const ret: { [molecularProfileId: string]: Sample[] } = {};
            const profileIds = this.molecularProfilesInStudies.result.map(
                x => x.molecularProfileId
            );
            const coverageInformation = this.coverageInformation.result!;
            for (const profileId of profileIds) {
                ret[profileId] = [];
            }
            let profiledReport: boolean[] = [];
            for (const sample of this.filteredSamples.result!) {
                profiledReport = isSampleProfiledInMultiple(
                    sample.uniqueSampleKey,
                    profileIds,
                    coverageInformation
                );
                for (let i = 0; i < profileIds.length; i++) {
                    if (profiledReport[i]) {
                        ret[profileIds[i]].push(sample);
                    }
                }
            }
            return Promise.resolve(ret);
        },
    });

    /*
     * For annotations of Genome Nexus we want to fetch lazily
     */
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

    @cached @computed get discreteCNACache() {
        return new DiscreteCNACache(
            this.studyToMolecularProfileDiscreteCna.result
        );
    }

    @cached @computed get cancerTypeCache() {
        return new CancerTypeCache();
    }

    @cached @computed get mutationCountCache() {
        return new MutationCountCache();
    }

    @cached @computed get clinicalAttributeCache() {
        return new ClinicalAttributeCache();
    }

    @cached @computed get pdbHeaderCache() {
        return new PdbHeaderCache();
    }

    @cached @computed get mutationDataCache() {
        return new MutationDataCache(
            this.studyToMutationMolecularProfile.result,
            this.studyToDataQueryFilter.result
        );
    }

    readonly geneMolecularDataCache = remoteData({
        await: () => [this.molecularProfileIdToDataQueryFilter],
        invoke: () => {
            return Promise.resolve(
                new GeneMolecularDataCache(
                    this.molecularProfileIdToDataQueryFilter.result
                )
            );
        },
    });

    readonly expressionProfiles = remoteData(
        {
            await: () => [this.molecularProfilesInStudies],
            invoke: () => {
                return Promise.resolve(
                    this.molecularProfilesInStudies.result.filter(
                        (profile: MolecularProfile) =>
                            isRNASeqProfile(profile.molecularProfileId)
                    )
                );
            },
        },
        []
    );

    @memoize sortRnaSeqMolecularDataByStudy(seqData: {
        [profileId: string]: NumericGeneMolecularData[];
    }) {
        return _.keyBy(seqData, (data: NumericGeneMolecularData[]) => {
            return data[0].studyId;
        });
    }

    readonly genesetMolecularDataCache = remoteData({
        await: () => [this.molecularProfileIdToDataQueryFilter],
        invoke: () =>
            Promise.resolve(
                new GenesetMolecularDataCache(
                    this.molecularProfileIdToDataQueryFilter.result!
                )
            ),
    });

    public numericGenesetMolecularDataCache = new MobxPromiseCache<
        { genesetId: string; molecularProfileId: string },
        GenesetMolecularData[]
    >(q => ({
        await: () => [this.molecularProfileIdToDataQueryFilter],
        invoke: () => {
            const dqf = this.molecularProfileIdToDataQueryFilter.result![
                q.molecularProfileId
            ];
            if (dqf) {
                return internalClient.fetchGeneticDataItemsUsingPOST({
                    geneticProfileId: q.molecularProfileId,
                    genesetDataFilterCriteria: {
                        genesetIds: [q.genesetId],
                        ...dqf,
                    } as GenesetDataFilterCriteria,
                });
            } else {
                return Promise.resolve([]);
            }
        },
    }));

    readonly genesetCorrelatedGeneCache = remoteData({
        await: () => [this.molecularProfileIdToDataQueryFilter],
        invoke: () =>
            Promise.resolve(
                new GenesetCorrelatedGeneCache(
                    this.molecularProfileIdToDataQueryFilter.result!
                )
            ),
    });

    readonly genericAssayMolecularDataCache = remoteData({
        await: () => [this.molecularProfileIdToDataQueryFilter],
        invoke: () =>
            Promise.resolve(
                new GenericAssayMolecularDataCache(
                    this.molecularProfileIdToDataQueryFilter.result!
                )
            ),
    });

    readonly genesetCache = new GenesetCache();

    private _numericGeneMolecularDataCache = new MobxPromiseCache<
        { entrezGeneId: number; molecularProfileId: string },
        NumericGeneMolecularData[]
    >(q => ({
        await: () => [this.molecularProfileIdToDataQueryFilter],
        invoke: () => {
            const dqf = this.molecularProfileIdToDataQueryFilter.result![
                q.molecularProfileId
            ];
            // it's possible that sampleIds is empty for a given profile
            const hasSampleSpec =
                dqf &&
                ((dqf.sampleIds && dqf.sampleIds.length) || dqf.sampleListId);
            if (hasSampleSpec) {
                return getClient().fetchAllMolecularDataInMolecularProfileUsingPOST(
                    {
                        molecularProfileId: q.molecularProfileId,
                        molecularDataFilter: {
                            entrezGeneIds: [q.entrezGeneId],
                            ...dqf,
                        } as MolecularDataFilter,
                    }
                );
            } else {
                return Promise.resolve([]);
            }
        },
    }));
    public numericGeneMolecularDataCache = new MobxPromiseCache<
        { entrezGeneId: number; molecularProfileId: string },
        NumericGeneMolecularData[]
    >(q => ({
        await: () => [
            this._numericGeneMolecularDataCache.get(q),
            this.filteredSampleKeyToSample,
        ],
        invoke: () => {
            const data = this._numericGeneMolecularDataCache.get(q).result!;
            const sampleMap = this.filteredSampleKeyToSample.result!;
            return Promise.resolve(
                data.filter(d => d.uniqueSampleKey in sampleMap)
            );
        },
    }));

    public clinicalDataCache = new ClinicalDataCache(
        this.samples,
        this.patients,
        this.studyToMutationMolecularProfile,
        this.studyIdToStudy,
        this.coverageInformation,
        this.filteredSampleKeyToSample,
        this.filteredPatientKeyToPatient,
        this.customAttributes
    );

    public mutationCache = new MobxPromiseCache<
        { entrezGeneId: number },
        Mutation[]
    >(q => ({
        await: () => [
            this.studyToMutationMolecularProfile,
            this.studyToDataQueryFilter,
        ],
        invoke: async () => {
            return _.flatten(
                await Promise.all(
                    Object.keys(
                        this.studyToMutationMolecularProfile.result!
                    ).map(studyId => {
                        const molecularProfileId = this
                            .studyToMutationMolecularProfile.result![studyId]
                            .molecularProfileId;
                        const dataQueryFilter = this.studyToDataQueryFilter
                            .result![studyId];

                        if (
                            !dataQueryFilter ||
                            (_.isEmpty(dataQueryFilter.sampleIds) &&
                                !dataQueryFilter.sampleListId)
                        ) {
                            return Promise.resolve([]);
                        }

                        if (molecularProfileId) {
                            return getClient().fetchMutationsInMolecularProfileUsingPOST(
                                {
                                    molecularProfileId,
                                    mutationFilter: {
                                        entrezGeneIds: [q.entrezGeneId],
                                        ...dataQueryFilter,
                                    } as MutationFilter,
                                    projection:
                                        REQUEST_ARG_ENUM.PROJECTION_DETAILED,
                                }
                            );
                        } else {
                            return Promise.resolve([]);
                        }
                    })
                )
            );
        },
    }));

    public structuralVariantCache = new MobxPromiseCache<
        { entrezGeneId: number },
        StructuralVariant[]
    >(q => ({
        await: () => [
            this.studyToStructuralVariantMolecularProfile,
            this.studyToDataQueryFilter,
        ],
        invoke: async () => {
            const studyIdToProfileMap = this
                .studyToStructuralVariantMolecularProfile.result!;

            if (_.isEmpty(studyIdToProfileMap)) {
                return Promise.resolve([]);
            }

            const filters = this.samples.result.reduce(
                (memo, sample: Sample) => {
                    if (sample.studyId in studyIdToProfileMap) {
                        memo.push({
                            molecularProfileId:
                                studyIdToProfileMap[sample.studyId]
                                    .molecularProfileId,
                            sampleId: sample.sampleId,
                        });
                    }
                    return memo;
                },
                [] as StructuralVariantFilter['sampleMolecularIdentifiers']
            );

            if (_.isEmpty(filters)) {
                return [];
            } else {
                return internalClient.fetchStructuralVariantsUsingPOST({
                    structuralVariantFilter: {
                        entrezGeneIds: [q.entrezGeneId],
                        sampleMolecularIdentifiers: filters,
                    } as StructuralVariantFilter,
                });
            }
        },
    }));

    @action clearErrors() {
        this.ajaxErrors = [];
    }

    @computed get isMixedReferenceGenome() {
        if (this.studies.result) {
            return isMixedReferenceGenome(this.studies.result);
        }
    }

    @computed get isPutativeDriver() {
        return this.driverAnnotationSettings.driversAnnotated
            ? (m: AnnotatedMutation) => m.putativeDriver
            : undefined;
    }

    readonly structuralVariantProfile = remoteData({
        await: () => [this.studyToMolecularProfiles],
        invoke: async () => {
            const structuralVariantProfiles = getFilteredMolecularProfilesByAlterationType(
                this.studyToMolecularProfiles.result!,
                AlterationTypeConstants.STRUCTURAL_VARIANT,
                [DataTypeConstants.FUSION, DataTypeConstants.SV]
            );
            if (structuralVariantProfiles.length > 0) {
                return structuralVariantProfiles[0];
            }
            return undefined;
        },
    });

    readonly structuralVariantData = remoteData({
        await: () => [this.samples, this.structuralVariantProfile],
        invoke: async () => {
            if (this.structuralVariantProfile.result) {
                const structuralVariantFilter = {
                    sampleMolecularIdentifiers: this.sampleIds.map(sampleId => {
                        return {
                            molecularProfileId: this.structuralVariantProfile
                                .result!.molecularProfileId,
                            sampleId,
                        };
                    }),
                } as StructuralVariantFilter;

                return internalClient.fetchStructuralVariantsUsingPOST({
                    structuralVariantFilter,
                });
            }
            return [];
        },
        default: [],
    });

    readonly oncoKbAnnotatedGenesForStructuralVariants = remoteData<{
        [entrezGeneId: number]: boolean;
    }>({
        await: () => [
            this.oncoKbAnnotatedGenes,
            this.structuralVariantsByEntrezGeneId,
        ],
        invoke: async () => {
            const entrezGeneIds = Object.keys(
                this.structuralVariantsByEntrezGeneId.result!
            ).map(Number);
            return _.pick(this.oncoKbAnnotatedGenes.result, entrezGeneIds);
        },
    });

    readonly structuralVariantOncoKbData = remoteData<IOncoKbData>(
        {
            await: () => [
                this.oncoKbAnnotatedGenesForStructuralVariants,
                this.structuralVariantData,
                this.clinicalDataForSamples,
                this.studies,
                this.uniqueSampleKeyToTumorType,
            ],
            invoke: async () => {
                if (getServerConfig().show_oncokb) {
                    return fetchStructuralVariantOncoKbData(
                        this.uniqueSampleKeyToTumorType.result!,
                        this.oncoKbAnnotatedGenesForStructuralVariants.result ||
                            {},
                        this.structuralVariantData
                    );
                } else {
                    return ONCOKB_DEFAULT;
                }
            },
            onError: (err: Error) => {
                // fail silently, leave the error handling responsibility to the data consumer
            },
        },
        ONCOKB_DEFAULT
    );

    readonly oncoKbInfo = remoteData(
        {
            invoke: () => {
                if (getServerConfig().show_oncokb) {
                    return fetchOncoKbInfo();
                } else {
                    return Promise.resolve(ONCOKB_DEFAULT_INFO);
                }
            },
        },
        ONCOKB_DEFAULT_INFO
    );

    @computed get usingPublicOncoKbInstance() {
        return this.oncoKbInfo.result
            ? this.oncoKbInfo.result.publicInstance
            : USE_DEFAULT_PUBLIC_INSTANCE_FOR_ONCOKB;
    }
}
