import * as React from 'react';
import {
    toJS,
    action,
    computed,
    observable,
    runInAction,
    makeObservable,
} from 'mobx';
import { Observer, observer } from 'mobx-react';
import './styles.scss';
import { AlterationTypeConstants, DataTypeConstants } from 'shared/constants';
import { Button, FormControl } from 'react-bootstrap';
import ReactSelect from 'react-select1';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import _ from 'lodash';
import {
    axisHasNegativeNumbers,
    boxPlotTooltip,
    CUSTOM_ATTR_DATA_TYPE,
    CLIN_ATTR_DATA_TYPE,
    CNA_STROKE_WIDTH,
    dataTypeDisplayOrder,
    dataTypeToDisplayType,
    GENESET_DATA_TYPE,
    getAxisLabel,
    getBoxPlotDownloadData,
    getLimitValues,
    getScatterPlotDownloadData,
    getWaterfallPlotDownloadData,
    IAxisLogScaleParams,
    IBoxScatterPlotPoint,
    INumberAxisData,
    IPlotSampleData,
    IScatterPlotData,
    isNumberData,
    isStringData,
    IStringAxisData,
    IWaterfallPlotData,
    logScalePossible,
    makeAxisDataPromise,
    makeAxisLogScaleFunction,
    makeBoxScatterPlotData,
    makeClinicalAttributeOptions,
    makeScatterPlotData,
    makeScatterPlotPointAppearance,
    makeWaterfallPlotData,
    PLOT_SIDELENGTH,
    scatterPlotLegendData,
    scatterPlotTooltip,
    scatterPlotZIndexSortBy,
    sortMolecularProfilesForDisplay,
    WATERFALLPLOT_BASE_SIDELENGTH,
    WATERFALLPLOT_SIDELENGTH,
    WATERFALLPLOT_SIDELENGTH_SAMPLE_MULTIPLICATION_FACTOR,
    bothAxesNoMolecularProfile,
    waterfallPlotTooltip,
    getColoringMenuOptionValue,
    basicAppearance,
    getAxisDataOverlapSampleCount,
    isAlterationTypePresent,
    getCacheQueries,
    getCategoryOptions,
    maybeSetLogScale,
    logScalePossibleForProfile,
    isGenericAssaySelected,
    showWaterfallPlot,
    getOption,
} from './PlotsTabUtils';
import {
    ClinicalAttribute,
    GenericAssayMeta,
    Gene,
    ClinicalData,
    CancerStudy,
    MolecularProfile,
    Sample,
    Geneset,
    StructuralVariant,
    NumericGeneMolecularData,
    GenePanelData,
    Patient,
} from 'cbioportal-ts-api-client';
import ScatterPlot from 'shared/components/plots/ScatterPlot';
import WaterfallPlot from 'shared/components/plots/WaterfallPlot';
import TablePlot from 'shared/components/plots/TablePlot';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import InfoIcon from '../../../shared/components/InfoIcon';
import {
    CBIOPORTAL_VICTORY_THEME,
    DownloadControls,
    MobxPromise,
    MobxPromiseUnionType,
    MobxPromiseUnionTypeWithDefault,
    remoteData,
    wrapText,
} from 'cbioportal-frontend-commons';
import { getRemoteDataGroupStatus, Mutation } from 'cbioportal-utils';
import BoxScatterPlot, {
    IBoxScatterPlotData,
} from '../../../shared/components/plots/BoxScatterPlot';
import autobind from 'autobind-decorator';
import fileDownload from 'react-file-download';
import {
    dataPointIsLimited,
    LegendDataWithId,
    scatterPlotSize,
} from '../../../shared/components/plots/PlotUtils';
import { getTablePlotDownloadData } from '../../../shared/components/plots/TablePlotUtils';
import MultipleCategoryBarPlot from 'shared/components/plots/MultipleCategoryBarPlot';
import { RESERVED_CLINICAL_VALUE_COLORS } from 'shared/lib/Colors';
import {
    DownloadControlOption,
    onMobxPromise,
} from 'cbioportal-frontend-commons';
import Pluralize from 'pluralize';
import LastPlotsTabSelectionForDatatype from './LastPlotsTabSelectionForDatatype';
import { generateQuickPlots } from './QuickPlots';
import ResultsViewURLWrapper, {
    PlotsSelectionParam,
    ResultsViewURLQuery,
} from 'pages/resultsView/ResultsViewURLWrapper';
import ClinicalDataCache, {
    SpecialAttribute,
} from '../../../shared/cache/ClinicalDataCache';
import { createCancerStudyAttribute } from 'shared/lib/ClinicalAttributeUtils';
import LabeledCheckbox from '../../../shared/components/labeledCheckbox/LabeledCheckbox';
import { getSuffixOfMolecularProfile } from 'shared/lib/molecularProfileUtils';
import {
    COMMON_GENERIC_ASSAY_PROPERTY,
    getGenericAssayMetaPropertyOrDefault,
    filterGenericAssayOptionsByGenes,
    deriveDisplayTextFromGenericAssayType,
    makeGenericAssayPlotsTabOption,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import { getBoxWidth } from 'shared/lib/boxPlotUtils';
import ScrollWrapper from 'pages/resultsView/cancerSummary/ScrollWrapper';
import {
    DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING,
    MenuList,
    MenuListHeader,
} from 'pages/studyView/addChartButton/genericAssaySelection/GenericAssaySelection';
import { doesOptionMatchSearchText } from 'shared/lib/GenericAssayUtils/GenericAssaySelectionUtils';
import { GENERIC_ASSAY_CONFIG } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
import { getServerConfig } from 'config/config';
import { ExtendedClinicalAttribute } from 'pages/resultsView/ResultsViewPageStoreUtils';
import MobxPromiseCache from 'shared/lib/MobxPromiseCache';
import { CustomDriverNumericGeneMolecularData } from 'shared/model/CustomDriverNumericGeneMolecularData';
import {
    AnnotatedMutation,
    AnnotatedStructuralVariant,
} from 'shared/model/AnnotatedMutation';
import {
    CoverageInformation,
    getCoverageInformation,
} from 'shared/lib/GenePanelUtils';
import GenesetMolecularDataCache from 'shared/cache/GenesetMolecularDataCache';
import GenericAssayMolecularDataCache from 'shared/cache/GenericAssayMolecularDataCache';
import { DriverAnnotationSettings } from 'shared/alterationFiltering/AnnotationFilteringSettings';
import StudyViewURLWrapper from 'pages/studyView/StudyViewURLWrapper';
import { StudyViewURLQuery } from 'pages/studyView/StudyViewPageStore';
import { fetchGenes } from 'shared/lib/StoreUtils';
import { Else, If, Then } from 'react-if';
import { allowExpressionCrossStudy } from 'shared/lib/allowExpressionCrossStudy';
import OqlStatusBanner from '../banners/OqlStatusBanner';
import AlterationFilterWarning from '../banners/AlterationFilterWarning';
import { FilteredAndAnnotatedMutationsReport } from 'shared/lib/comparison/AnalysisStoreUtils';
import { AnnotatedNumericGeneMolecularData } from 'shared/model/AnnotatedNumericGeneMolecularData';
import { ExtendedAlteration } from 'shared/model/ExtendedAlteration';
import CaseFilterWarning from '../banners/CaseFilterWarning';
import { SelectedDataAlert } from './SelectedDataAlert';

enum EventKey {
    horz_logScale,
    vert_logScale,
    utilities_horizontalBars,
    utilities_showRegressionLine,
    utilities_viewLimitValues,
    utilities_connectSamples,
    sortByMedian,
}

export enum ColoringType {
    ClinicalData,
    MutationType,
    CopyNumber,
    LimitVal,
    StructuralVariant,
    None,
}

export enum PotentialColoringType {
    GenomicData,
    None,
    LimitValGenomicData,
    LimitVal,
}

export type SelectedColoringTypes = Partial<{ [c in ColoringType]: any }>;

export enum PlotType {
    ScatterPlot,
    WaterfallPlot,
    BoxPlot,
    DiscreteVsDiscrete,
}

export enum DiscreteVsDiscretePlotType {
    Bar = 'Bar',
    StackedBar = 'StackedBar',
    PercentageStackedBar = 'PercentageStackedBar',
    Table = 'Table',
}

export enum SortByOptions {
    Alphabetically = 'alphabetically',
    SortByTotalSum = 'SortByTotalSum',
}

export enum MutationCountBy {
    MutationType = 'MutationType',
    MutatedVsWildType = 'MutatedVsWildType',
    DriverVsVUS = 'DriverVsVUS',
    VariantAlleleFrequency = 'VariantAlleleFrequency',
}

export enum StructuralVariantCountBy {
    VariantType = 'VariantType',
    MutatedVsWildType = 'MutatedVsWildType',
}

export type AxisMenuSelection = {
    entrezGeneId?: number;
    genesetId?: string;
    genericAssayEntityId?: string;
    selectedGeneOption?: PlotsTabGeneOption;
    selectedDataSourceOption?: PlotsTabOption;
    selectedGenesetOption?: PlotsTabOption;
    selectedGenericAssayOption?: PlotsTabOption;
    genericAssayDataType?: string; // LIMIT-VALUE, CATEGORICAL, BINARY
    selectedCategories: any[];
    dataType?: string; // Generic Assay saves genericAssayType as dataType
    dataSourceId?: string;
    mutationCountBy: MutationCountBy;
    structuralVariantCountBy: StructuralVariantCountBy;
    logScale: boolean;
};

export type ColoringMenuOmnibarOption = {
    label: string;
    value: string;
    info: {
        entrezGeneId?: number;
        clinicalAttribute?: ClinicalAttribute;
    };
};

export type ColoringMenuOmnibarGroup = {
    label: string;
    options: ColoringMenuOmnibarOption[];
};

export type ColoringMenuSelection = {
    selectedOption: ColoringMenuOmnibarOption | undefined;
    logScale?: boolean;
    readonly colorByMutationType: boolean;
    readonly colorByCopyNumber: boolean;
    readonly colorByStructuralVariant: boolean;
    default: {
        entrezGeneId?: number;
    };
};

export interface IPlotsTabProps {
    filteredSamplesByDetailedCancerType: MobxPromise<{
        [cancerType: string]: Sample[];
    }>;
    mutations: MobxPromiseUnionType<Mutation[]>;
    studies: MobxPromiseUnionTypeWithDefault<CancerStudy[]>;
    molecularProfileIdSuffixToMolecularProfiles: MobxPromiseUnionTypeWithDefault<{
        [molecularProfileIdSuffix: string]: MolecularProfile[];
    }>;
    entrezGeneIdToGene: MobxPromise<{
        [entrezGeneId: number]: Gene;
    }>;
    sampleKeyToSample: MobxPromise<_.Dictionary<Sample>>;
    genes: MobxPromise<Gene[]>;
    clinicalAttributes: MobxPromise<ExtendedClinicalAttribute[]>;
    customAttributes: MobxPromise<ExtendedClinicalAttribute[]>;
    genesets: MobxPromise<Geneset[]>;
    genericAssayEntitiesGroupByMolecularProfileId: MobxPromise<{
        [profileId: string]: GenericAssayMeta[];
    }>;
    studyIds: MobxPromise<string[]>;
    molecularProfilesWithData: MobxPromise<MolecularProfile[]>;
    molecularProfilesInStudies: MobxPromiseUnionTypeWithDefault<
        MolecularProfile[]
    >;
    annotatedCnaCache: MobxPromiseCache<
        {
            entrezGeneId: number;
        },
        CustomDriverNumericGeneMolecularData[]
    >;
    annotatedMutationCache: MobxPromiseCache<
        {
            entrezGeneId: number;
        },
        AnnotatedMutation[]
    >;
    structuralVariantCache: MobxPromiseCache<
        {
            entrezGeneId: number;
        },
        StructuralVariant[]
    >;
    studyToMutationMolecularProfile: MobxPromise<{
        [studyId: string]: MolecularProfile;
    }>;
    studyToMolecularProfileDiscreteCna: MobxPromise<{
        [studyId: string]: MolecularProfile;
    }>;
    clinicalDataCache: ClinicalDataCache;
    patientKeyToFilteredSamples: MobxPromise<_.Dictionary<Sample[]>>;
    numericGeneMolecularDataCache: MobxPromiseCache<
        {
            entrezGeneId: number;
            molecularProfileId: string;
        },
        NumericGeneMolecularData[]
    >;
    coverageInformation: MobxPromise<CoverageInformation>;
    genesetMolecularDataCache: MobxPromise<GenesetMolecularDataCache>;
    genericAssayMolecularDataCache: MobxPromise<GenericAssayMolecularDataCache>;
    studyToStructuralVariantMolecularProfile: MobxPromise<{
        [studyId: string]: MolecularProfile;
    }>;
    driverAnnotationSettings: DriverAnnotationSettings;
    studyIdToStudy?: _.Dictionary<CancerStudy>;
    structuralVariants?: StructuralVariant[];
    hugoGeneSymbols: string[];
    selectedGenericAssayEntitiesGroupByMolecularProfileId: {
        [molecularProfileId: string]: string[];
    };
    molecularProfileIdToMolecularProfile: MobxPromiseUnionTypeWithDefault<{
        [molecularProfileId: string]: MolecularProfile;
    }>;
    urlWrapper: ResultsViewURLWrapper | StudyViewURLWrapper;
    hasNoQueriedGenes?: boolean;
    genePanelDataForAllProfiles?: GenePanelData[];
    queryContainsOql?: boolean;
    includeGermlineMutations?: boolean;
    mutationsReportByGene?: MobxPromise<{
        [hugeGeneSymbol: string]: FilteredAndAnnotatedMutationsReport<
            AnnotatedMutation
        >;
    }>;
    oqlFilteredMutationsReport?: MobxPromise<{
        data: (AnnotatedMutation & ExtendedAlteration)[];
        vus: (AnnotatedMutation & ExtendedAlteration)[];
        germline: (AnnotatedMutation & ExtendedAlteration)[];
        vusAndGermline: (AnnotatedMutation & ExtendedAlteration)[];
    }>;
    oqlFilteredMolecularDataReport?: MobxPromise<{
        data: (AnnotatedNumericGeneMolecularData & ExtendedAlteration)[];
        vus: (AnnotatedNumericGeneMolecularData & ExtendedAlteration)[];
    }>;
    oqlFilteredStructuralVariantsReport?: MobxPromise<{
        data: (AnnotatedStructuralVariant & ExtendedAlteration)[];
        vus: (AnnotatedStructuralVariant & ExtendedAlteration)[];
        germline: (AnnotatedStructuralVariant & ExtendedAlteration)[];
        vusAndGermline: (AnnotatedStructuralVariant & ExtendedAlteration)[];
    }>;
    samples?: MobxPromise<Sample[]>;
    filteredSamples: MobxPromise<Sample[]>;
    patients: MobxPromise<Patient[]>;
    filteredPatients?: MobxPromise<Patient[]>;
    hideUnprofiledSamples?: false | 'any' | 'totally';
}

export type PlotsTabDataSource = {
    [dataType: string]: { value: string; label: string }[];
};

export type PlotsTabOption = {
    value: string;
    label: string;
    plotAxisLabel?: string;
    genericAssayDataType?: string;
};

export type PlotsTabGeneOption = {
    value: number; // entrez id
    label: string; // hugo symbol
};

export type SampleIdsForPatientIds = {
    [patientId: string]: string[];
};

const searchInputTimeoutMs = 600;

class PlotsTabScatterPlot extends ScatterPlot<IScatterPlotData> {}
class PlotsTabBoxPlot extends BoxScatterPlot<IBoxScatterPlotPoint> {}
class PlotsTabWaterfallPlot extends WaterfallPlot<IWaterfallPlotData> {}

const SVG_ID = 'plots-tab-plot-svg';

export const NONE_SELECTED_OPTION_STRING_VALUE = 'none';
export const NONE_SELECTED_OPTION_NUMERICAL_VALUE = -10000;
export const NONE_SELECTED_OPTION_LABEL = 'Ordered samples';
export const ALL_SELECTED_OPTION_NUMERICAL_VALUE = -30000;
export const SAME_SELECTED_OPTION_STRING_VALUE = 'same';
export const SAME_SELECTED_OPTION_NUMERICAL_VALUE = -20000;
const LEGEND_TO_BOTTOM_WIDTH_THRESHOLD = 550; // when plot is wider than this value, the legend moves from right to bottom of screen
const DISCRETE_CATEGORY_LIMIT = 150; // when a discrete variable has more categories, the discrete plot will not be rendered.

const mutationCountByOptions = [
    { value: MutationCountBy.MutationType, label: 'Mutation Type' },
    { value: MutationCountBy.MutatedVsWildType, label: 'Mutated vs Wild-type' },
    { value: MutationCountBy.DriverVsVUS, label: 'Driver vs VUS' },
    {
        value: MutationCountBy.VariantAlleleFrequency,
        label: 'Variant Allele Freqency',
    },
];
const structuralVariantCountByOptions = [
    {
        value: StructuralVariantCountBy.MutatedVsWildType,
        label: 'Variant vs No Variant',
    },
    { value: StructuralVariantCountBy.VariantType, label: 'Variant Type' },
];

const discreteVsDiscretePlotTypeOptions = [
    { value: DiscreteVsDiscretePlotType.Bar, label: 'Bar chart' },
    {
        value: DiscreteVsDiscretePlotType.StackedBar,
        label: 'Stacked bar chart',
    },
    {
        value: DiscreteVsDiscretePlotType.PercentageStackedBar,
        label: '100% stacked bar chart',
    },
    { value: DiscreteVsDiscretePlotType.Table, label: 'Table' },
];

@observer
export default class PlotsTab extends React.Component<IPlotsTabProps, {}> {
    @observable.ref private plotSvg: SVGElement | null = null;

    private horzSelection: AxisMenuSelection;
    private vertSelection: AxisMenuSelection;
    private selectionHistory = new LastPlotsTabSelectionForDatatype();
    private coloringMenuSelection: ColoringMenuSelection;

    private scrollPane: HTMLDivElement;
    private dummyScrollPane: HTMLDivElement;
    private scrollingDummyPane = false;
    @observable plotElementWidth = 0;
    @observable sortByDropDownOptions: { value: string; label: string }[] = [];
    @observable sortByOption: string = SortByOptions.Alphabetically;
    @observable boxPlotSortByMedian = false;
    @observable.ref searchCaseInput: string;
    @observable.ref searchMutationInput: string;
    @observable showRegressionLine = false;
    // discrete vs discrete settings
    @observable discreteVsDiscretePlotType: DiscreteVsDiscretePlotType =
        DiscreteVsDiscretePlotType.StackedBar;
    @observable horizontalBars = false;
    @observable percentageBar = false;
    @observable stackedBar = false;
    @observable viewLimitValues: boolean = true;
    @observable connectSamples: boolean = false;
    @observable _waterfallPlotSortOrder: string | undefined = undefined;

    @observable searchCase: string = '';
    @observable searchMutation: string = '';
    @observable.ref selectedData: IPlotSampleData[] = [];
    @observable highlightedLegendItems = observable.map<
        string,
        LegendDataWithId
    >({}, { deep: false });
    @observable _horzGenericAssaySearchText: string = '';
    @observable _vertGenericAssaySearchText: string = '';

    private defaultOptions = [
        { value: SortByOptions.Alphabetically, label: 'Alphabetically' },
        { value: SortByOptions.SortByTotalSum, label: 'Number of samples' },
    ];

    @action.bound
    private updateDropDownOptions(option: { value: string; label: string }[]) {
        this.sortByDropDownOptions = [...this.defaultOptions, ...option];
    }

    @action.bound
    private onClickLegendItem(ld: LegendDataWithId<any>) {
        if (this.highlightedLegendItems.has(ld.highlighting!.uid)) {
            this.highlightedLegendItems.delete(ld.highlighting!.uid);
        } else {
            this.highlightedLegendItems.set(ld.highlighting!.uid, ld);
        }
    }

    @action.bound
    private onDataSelection(data: IPlotSampleData[]) {
        this.selectedData = data;
    }

    @action.bound
    private onDataSelectionCleared() {
        this.selectedData = [];
    }

    @action.bound
    private onClickColorByCopyNumber() {
        if (this.plotType.result === PlotType.WaterfallPlot) {
            // waterfall plot has radio buttons
            this.setColorByMutationType(false);
            this.setColorByStructuralVariant(false);
            this.setColorByCopyNumber(true);
        } else {
            this.setColorByCopyNumber(
                !this.coloringMenuSelection.colorByCopyNumber
            );
        }
    }

    @action.bound
    private onClickColorByMutationType() {
        if (this.plotType.result === PlotType.WaterfallPlot) {
            // waterfall plot has radio buttons
            this.setColorByCopyNumber(false);
            this.setColorByStructuralVariant(false);
            this.setColorByMutationType(true);
        } else {
            this.setColorByMutationType(
                !this.coloringMenuSelection.colorByMutationType
            );
        }
    }

    @action.bound
    private onClickColorByStructuralVariant() {
        if (this.plotType.result === PlotType.WaterfallPlot) {
            // waterfall plot has radio buttons
            this.setColorByCopyNumber(false);
            this.setColorByMutationType(false);
            this.setColorByStructuralVariant(true);
        } else {
            this.setColorByStructuralVariant(
                !this.coloringMenuSelection.colorByStructuralVariant
            );
        }
    }

    @computed get patientIdsInBoxPlot(): string[] {
        let patientIds: string[] = [];

        if (this.boxPlotData.isComplete && this.boxPlotData.result) {
            const uniqueSampleKeys = _.flatten(
                _.map(this.boxPlotData.result.data, dataPoint =>
                    _.map(dataPoint.data, point => point.uniqueSampleKey)
                )
            );

            patientIds = _.uniq(
                uniqueSampleKeys
                    .map(
                        sampleKey =>
                            this.props.sampleKeyToSample.result![sampleKey]
                                ?.patientId
                    )
                    .filter(Boolean)
            );
        }
        return patientIds;
    }

    @computed get samplesForEachPatient(): SampleIdsForPatientIds[] {
        const samplesForPatients: SampleIdsForPatientIds[] = [];

        if (this.patientIdsInBoxPlot && this.patientIdsInBoxPlot.length > 0) {
            this.patientIdsInBoxPlot.forEach(patientId => {
                const sampleIdsForPatient: SampleIdsForPatientIds = {
                    [patientId]: [],
                };

                this.boxPlotData.result?.data.forEach(dataPoint => {
                    dataPoint.data.forEach(point => {
                        const sample = this.props.sampleKeyToSample.result![
                            point.uniqueSampleKey
                        ];
                        if (sample && sample.patientId === patientId) {
                            sampleIdsForPatient[patientId].push(point.sampleId);
                        }
                    });
                });
                samplesForPatients.push(sampleIdsForPatient);
            });
        }

        // if atleast one patient has multiple samples, return the array of sample IDs for each patient, otherwise []
        const hasPatientWithMultipleSamples = samplesForPatients.some(
            patientObject =>
                patientObject[Object.keys(patientObject)[0]].length > 1
        );

        return hasPatientWithMultipleSamples ? samplesForPatients : [];
    }

    // determine whether formatting for points in the scatter plot (based on
    // mutations type, CNA, ...) will actually be shown in the plot (depends
    // on user choice via check boxes).
    @computed get coloringTypes(): SelectedColoringTypes {
        if (
            this.coloringMenuSelection.selectedOption &&
            this.coloringMenuSelection.selectedOption.info.clinicalAttribute
        ) {
            return { [ColoringType.ClinicalData]: true };
        }

        let ret: SelectedColoringTypes = {};
        const colorByMutationType = this.coloringMenuSelection
            .colorByMutationType;
        const colorByCopyNumber = this.coloringMenuSelection.colorByCopyNumber;
        const colorByStructuralVariant = this.coloringMenuSelection
            .colorByStructuralVariant;

        if (
            this.potentialColoringType === PotentialColoringType.GenomicData ||
            this.potentialColoringType ===
                PotentialColoringType.LimitValGenomicData
        ) {
            if (colorByMutationType && this.canColorByMutationData) {
                ret[ColoringType.MutationType] = true;
            }
            if (colorByCopyNumber && this.canColorByCnaData) {
                ret[ColoringType.CopyNumber] = true;
            }
            if (colorByStructuralVariant && this.canColorBySVData) {
                ret[ColoringType.StructuralVariant] = true;
            }
        }

        if (
            this.potentialColoringType === PotentialColoringType.LimitVal ||
            this.potentialColoringType ===
                PotentialColoringType.LimitValGenomicData
        ) {
            if (this.viewLimitValues) {
                ret[ColoringType.LimitVal] = true;
            }
        }

        return ret;
    }

    @computed get quickPlotButtons(): JSX.Element {
        if (
            !this.dataTypeOptions.isComplete ||
            !this.dataTypeToDataSourceOptions.isComplete ||
            !this.props.filteredSamplesByDetailedCancerType.isComplete ||
            !this.props.mutations.isComplete
        ) {
            return <LoadingIndicator isLoading={true} size={'small'} />;
        }

        const cancerTypes = Object.keys(
            this.props.filteredSamplesByDetailedCancerType
        );
        const mutationCount = this.props.mutations.result.length;
        const horizontalSource = this.horzSelection.selectedDataSourceOption
            ? this.horzSelection.selectedDataSourceOption.value
            : undefined;
        const verticalSource = this.vertSelection.selectedDataSourceOption
            ? this.vertSelection.selectedDataSourceOption.value
            : undefined;

        const plots = generateQuickPlots(
            this.dataTypeOptions.result,
            this.dataTypeToDataSourceOptions.result,
            cancerTypes,
            mutationCount,
            { type: this.horzSelection.dataType, source: horizontalSource },
            { type: this.vertSelection.dataType, source: verticalSource }
        );

        return (
            <div className="pillTabs">
                <ul className="nav nav-pills">
                    {plots.map(pill => (
                        <li
                            className={
                                'plots-tab-pills ' +
                                (pill.selected ? 'active' : '')
                            }
                            onClick={action(() => {
                                if (pill.plotModel.horizontal.dataType) {
                                    this.onHorizontalAxisDataTypeSelect(
                                        pill.plotModel.horizontal.dataType
                                    );
                                }
                                if (pill.plotModel.horizontal.dataSource) {
                                    this.onHorizontalAxisDataSourceSelect(
                                        pill.plotModel.horizontal.dataSource
                                    );
                                }
                                if (pill.plotModel.vertical.dataType) {
                                    this.onVerticalAxisDataTypeSelect(
                                        pill.plotModel.vertical.dataType
                                    );
                                }
                                if (pill.plotModel.vertical.dataSource) {
                                    this.onVerticalAxisDataSourceSelect(
                                        pill.plotModel.vertical.dataSource
                                    );
                                }
                                maybeSetLogScale(this.horzSelection);
                                maybeSetLogScale(this.vertSelection);
                                if (pill.plotModel.vertical.useSameGene) {
                                    this.selectSameGeneOptionForVerticalAxis();
                                }
                            })}
                        >
                            <a>{pill.display}</a>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    @computed get showPlot(): boolean {
        return this.plotDataExistsForTwoAxes || this.waterfallPlotIsShown;
    }

    @computed get dataAvailability(): JSX.Element[] {
        let components: JSX.Element[] = [];

        // data await in plot(), this.horzAxisDataPromise.result and this.vertAxisDataPromise.result is ready
        const horzAxisDataSampleCount = this.horzAxisDataPromise.result!.data
            .length;
        const vertAxisDataSampleCount = this.vertAxisDataPromise.result!.data
            .length;
        const axisOverlapSampleCount = getAxisDataOverlapSampleCount(
            this.horzAxisDataPromise.result!,
            this.vertAxisDataPromise.result!
        );
        let horzAxisStudies: CancerStudy[] = [];
        let vertAxisStudies: CancerStudy[] = [];
        let isHorzAxisNoneOptionSelected = false;
        let isVertAxisNoneOptionSelected = false;
        components.push(
            <div>
                <div>Data availability per profile/axis:</div>
            </div>
        );

        // add information for Horizontal Axis
        switch (this.horzSelection.dataType) {
            case undefined:
                break;
            // when no datatype is selected (`None`)
            case NONE_SELECTED_OPTION_STRING_VALUE:
                isHorzAxisNoneOptionSelected = true;
                break;
            case CLIN_ATTR_DATA_TYPE:
                if (
                    this.horzSelection.dataSourceId !== undefined &&
                    this.clinicalAttributesGroupByclinicalAttributeId.isComplete
                ) {
                    const attributes = this
                        .clinicalAttributesGroupByclinicalAttributeId.result![
                        this.horzSelection.dataSourceId
                    ];
                    const studyIds = attributes.map(
                        attribute => attribute.studyId
                    );
                    horzAxisStudies = this.props.studies.result.filter(study =>
                        studyIds.includes(study.studyId)
                    );
                    components.push(
                        <div>
                            <strong>Horizontal Axis: </strong>
                            {`${horzAxisDataSampleCount} samples from ${
                                horzAxisStudies.length
                            } ${Pluralize('study', horzAxisStudies.length)}`}
                        </div>
                    );
                }
                break;
            case CUSTOM_ATTR_DATA_TYPE:
                if (
                    this.horzSelection.dataSourceId !== undefined &&
                    this.customAttributesGroupByclinicalAttributeId.isComplete
                ) {
                    const attributes = this
                        .customAttributesGroupByclinicalAttributeId.result![
                        this.horzSelection.dataSourceId
                    ];
                    const studyIds = attributes.map(
                        attribute => attribute.studyId
                    );
                    horzAxisStudies = this.props.studies.result.filter(study =>
                        studyIds.includes(study.studyId)
                    );
                    components.push(
                        <div>
                            <strong>Horizontal Axis: </strong>
                            {`${horzAxisDataSampleCount} samples from ${
                                horzAxisStudies.length
                            } ${Pluralize('study', horzAxisStudies.length)}`}
                        </div>
                    );
                }
                break;
            default:
                // molecular profile
                if (
                    this.horzSelection.dataSourceId !== undefined &&
                    this.props.molecularProfileIdSuffixToMolecularProfiles
                        .isComplete
                ) {
                    const studyIds = _.uniq(
                        this.props.molecularProfileIdSuffixToMolecularProfiles.result[
                            this.horzSelection.dataSourceId
                        ].map(profile => profile.studyId)
                    );
                    horzAxisStudies = this.props.studies.result.filter(study =>
                        studyIds.includes(study.studyId)
                    );
                    components.push(
                        <div>
                            <strong>Horizontal Axis: </strong>
                            {`${horzAxisDataSampleCount} samples from ${
                                horzAxisStudies.length
                            } ${Pluralize('study', horzAxisStudies.length)}`}
                        </div>
                    );
                }
                break;
        }

        // add information for Vertical Axis
        switch (this.vertSelection.dataType) {
            case undefined:
                break;
            // when no datatype is selected (`None`)
            case NONE_SELECTED_OPTION_STRING_VALUE:
                isVertAxisNoneOptionSelected = true;
                break;
            case CUSTOM_ATTR_DATA_TYPE:
                if (
                    this.vertSelection.dataSourceId !== undefined &&
                    this.customAttributesGroupByclinicalAttributeId.isComplete
                ) {
                    const attributes = this
                        .customAttributesGroupByclinicalAttributeId.result![
                        this.vertSelection.dataSourceId
                    ];
                    const studyIds = attributes.map(
                        attribute => attribute.studyId
                    );
                    vertAxisStudies = this.props.studies.result.filter(study =>
                        studyIds.includes(study.studyId)
                    );
                    components.push(
                        <div>
                            <strong>Vertical Axis: </strong>
                            {`${vertAxisDataSampleCount} samples from ${
                                vertAxisStudies.length
                            } ${Pluralize('study', vertAxisStudies.length)}`}
                        </div>
                    );
                }
                break;
            case CLIN_ATTR_DATA_TYPE:
                if (
                    this.vertSelection.dataSourceId !== undefined &&
                    this.clinicalAttributesGroupByclinicalAttributeId.isComplete
                ) {
                    const attributes = this
                        .clinicalAttributesGroupByclinicalAttributeId.result![
                        this.vertSelection.dataSourceId
                    ];
                    const studyIds = attributes.map(
                        attribute => attribute.studyId
                    );
                    vertAxisStudies = this.props.studies.result.filter(study =>
                        studyIds.includes(study.studyId)
                    );
                    components.push(
                        <div>
                            <strong>Vertical Axis: </strong>
                            {`${vertAxisDataSampleCount} samples from ${
                                vertAxisStudies.length
                            } ${Pluralize('study', vertAxisStudies.length)}`}
                        </div>
                    );
                }
                break;
            default:
                // molecular profile
                if (
                    this.vertSelection.dataSourceId !== undefined &&
                    this.props.molecularProfileIdSuffixToMolecularProfiles
                        .isComplete
                ) {
                    const studyIds = _.uniq(
                        this.props.molecularProfileIdSuffixToMolecularProfiles.result[
                            this.vertSelection.dataSourceId
                        ].map(profile => profile.studyId)
                    );
                    vertAxisStudies = this.props.studies.result.filter(study =>
                        studyIds.includes(study.studyId)
                    );
                    components.push(
                        <div>
                            <strong>Vertical Axis: </strong>
                            {`${vertAxisDataSampleCount} samples from ${
                                vertAxisStudies.length
                            } ${Pluralize('study', vertAxisStudies.length)}`}
                        </div>
                    );
                }
                break;
        }

        // add intersection info
        const intersectionStudiesOfTwoAxis = isHorzAxisNoneOptionSelected
            ? vertAxisStudies
            : isVertAxisNoneOptionSelected
            ? horzAxisStudies
            : _.intersection(horzAxisStudies, vertAxisStudies);
        components.push(
            <div>
                <strong>Intersection of the two axes: </strong>
                {`${axisOverlapSampleCount} samples from ${
                    intersectionStudiesOfTwoAxis.length
                } ${Pluralize('study', intersectionStudiesOfTwoAxis.length)}`}
            </div>
        );

        const isHorzAxisVAF =
            this.horzSelection.dataType ===
                AlterationTypeConstants.MUTATION_EXTENDED &&
            this.horzSelection.mutationCountBy ===
                MutationCountBy.VariantAlleleFrequency;

        const isVertAxisVAF =
            this.vertSelection.dataType ===
                AlterationTypeConstants.MUTATION_EXTENDED &&
            this.vertSelection.mutationCountBy ===
                MutationCountBy.VariantAlleleFrequency;

        let mainMessage = `Showing ${axisOverlapSampleCount} samples with data in both profiles (axes)`;
        if (isHorzAxisVAF || isVertAxisVAF) {
            mainMessage +=
                '. Samples without mutations or Variant Allele Frequency data are excluded from the plot';
        }

        components = [
            <div className="alert alert-info dataAvailabilityAlert">
                {mainMessage}
                <div data-test="dataAvailabilityAlertInfoIcon">
                    <InfoIcon tooltip={<div>{components}</div>} />
                </div>
            </div>,
        ];

        return components;
    }

    // Determine whether the selected DataTypes support formatting options.
    // Any plot with scatters can show any data type.
    // Limit values are only supported for generic assay outcome profiles
    @computed get potentialColoringType(): PotentialColoringType {
        if (this.plotType.result === PlotType.DiscreteVsDiscrete) {
            // cant show either in table
            return PotentialColoringType.None;
        }

        if (this.limitValuesCanBeShown && this.coloringByGene) {
            return PotentialColoringType.LimitValGenomicData;
        } else if (this.limitValuesCanBeShown) {
            return PotentialColoringType.LimitVal;
        } else if (this.coloringByGene) {
            return PotentialColoringType.GenomicData;
        } else {
            return PotentialColoringType.None;
        }
    }

    @computed get bothAxesNoMolecularProfile() {
        return bothAxesNoMolecularProfile(
            this.horzSelection,
            this.vertSelection
        );
    }

    private searchCaseTimeout: any;
    private searchMutationTimeout: any;

    constructor(props: IPlotsTabProps) {
        super(props);

        makeObservable(this);

        this.horzSelection = this.initAxisMenuSelection(false);
        this.vertSelection = this.initAxisMenuSelection(true);
        this.coloringMenuSelection = this.initColoringMenuSelection();

        this.searchCaseInput = '';
        this.searchMutationInput = '';

        (window as any).resultsViewPlotsTab = this;
    }

    @autobind
    private getSvg() {
        return this.plotSvg;
    }

    private downloadFilename = 'plot'; // todo: more specific?

    private initAxisMenuSelection(vertical: boolean): AxisMenuSelection {
        const self = this;

        return observable({
            get entrezGeneId() {
                if (
                    self.showGeneSelectBox(
                        this.dataType,
                        isGenericAssaySelected(this)
                    ) &&
                    this.selectedGeneOption
                ) {
                    if (
                        vertical &&
                        this.selectedGeneOption.value ===
                            SAME_SELECTED_OPTION_NUMERICAL_VALUE
                    ) {
                        return self.horzSelection.entrezGeneId;
                    } else {
                        return this.selectedGeneOption.value;
                    }
                } else {
                    return undefined;
                }
            },
            get selectedGeneOption() {
                const geneOptions =
                    (vertical
                        ? self.vertGeneOptions.result
                        : self.horzGeneOptions.result) || [];
                if (
                    this._selectedGeneOption === undefined &&
                    geneOptions.length
                ) {
                    // if no queried genes, default is undefined, else default is first gene option
                    if (self.props.hasNoQueriedGenes) {
                        return undefined;
                    } else {
                        return getOption(
                            geneOptions[0],
                            self.isGeneProfiled(geneOptions[0].label)
                        );
                    }
                } else if (
                    vertical &&
                    this._selectedGeneOption &&
                    this._selectedGeneOption.value ===
                        SAME_SELECTED_OPTION_NUMERICAL_VALUE &&
                    self.horzSelection.dataType &&
                    !self.showGeneSelectBox(
                        self.horzSelection.dataType,
                        isGenericAssaySelected(self.horzSelection)
                    )
                ) {
                    // if vertical gene option is "same as horizontal", and horizontal is clinical, then use the actual
                    //      gene option value instead of "Same gene" option value, because that would be slightly weird UX
                    const selectedGeneOption =
                        self.horzSelection.selectedGeneOption;
                    if (selectedGeneOption) {
                        return getOption(
                            selectedGeneOption,
                            self.isGeneProfiled(selectedGeneOption.label)
                        );
                    }
                    return selectedGeneOption;
                } else {
                    // otherwise, return stored value for this variable
                    if (this._selectedGeneOption) {
                        return getOption(
                            this._selectedGeneOption,
                            self.isGeneProfiled(this._selectedGeneOption.label)
                        );
                    }
                    return this._selectedGeneOption;
                }
            },
            set selectedGeneOption(o: any) {
                this._selectedGeneOption = o;
            },
            get dataType() {
                const dataTypeOptionsPromise = self.dataTypeOptions;
                if (!dataTypeOptionsPromise.isComplete) {
                    // if there are no options to select a default from, then return the stored value for this variable
                    return this._dataType;
                }
                // otherwise, pick the default based on available options
                const dataTypeOptions = dataTypeOptionsPromise.result!;

                // due to legacy urls, it's possible that selections can be made which
                // are no longer avaiable.  this handles that case
                const selectedDataTypeDoesNotExist = !_.some(
                    dataTypeOptions,
                    o =>
                        this._dataType === NONE_SELECTED_OPTION_STRING_VALUE ||
                        o.value === this._dataType
                );

                if (
                    (this._dataType === undefined && dataTypeOptions.length) ||
                    selectedDataTypeDoesNotExist
                ) {
                    // if no queried genes, default is undefined
                    if (self.props.hasNoQueriedGenes) {
                        return undefined;
                    }
                    // return computed default if _dataType is undefined and if there are options to select a default value from
                    if (
                        isAlterationTypePresent(
                            dataTypeOptions,
                            vertical,
                            AlterationTypeConstants.MRNA_EXPRESSION
                        )
                    ) {
                        // default for the vertical axis is mrna, if one is available
                        return AlterationTypeConstants.MRNA_EXPRESSION;
                    } else if (
                        isAlterationTypePresent(
                            dataTypeOptions,
                            !vertical,
                            AlterationTypeConstants.COPY_NUMBER_ALTERATION
                        )
                    ) {
                        // default for the horizontal axis is CNA, if one is available
                        return AlterationTypeConstants.COPY_NUMBER_ALTERATION;
                    } else if (
                        isAlterationTypePresent(
                            dataTypeOptions,
                            !vertical,
                            AlterationTypeConstants.STRUCTURAL_VARIANT
                        )
                    ) {
                        // default for the horizontal axis is Structural variant, if one is available
                        return AlterationTypeConstants.STRUCTURAL_VARIANT;
                    } else {
                        // otherwise, just return the first option
                        return dataTypeOptions[0].value;
                    }
                } else if (
                    this._dataType === NONE_SELECTED_OPTION_STRING_VALUE &&
                    ((vertical && self.vertDatatypeOptions.result) ||
                        (!vertical && self.horzDatatypeOptions.result))
                ) {
                    // when a `none` option was selected in the datatype menu
                    // and was removed (no generic assay data selected on other axis)
                    // just return the first option.
                    const firstDataTypeOption = vertical
                        ? self.vertDatatypeOptions.result![0]
                        : self.horzDatatypeOptions.result![0];
                    const returnType =
                        firstDataTypeOption.value ===
                        NONE_SELECTED_OPTION_STRING_VALUE
                            ? this._dataType
                            : dataTypeOptions[0].value;
                    return returnType;
                } else {
                    // otherwise, _dataType is defined, or there are no default options to choose from, so return _dataType
                    return this._dataType;
                }
            },
            set dataType(t: string | undefined) {
                if (this._dataType !== t) {
                    this._selectedDataSourceOption = undefined;
                }
                this._dataType = t;
            },
            get selectedDataSourceOption() {
                if (!self.dataTypeToDataSourceOptions.isComplete) {
                    // if there are no options to select a default from, then return the stored value for this variable
                    return this._selectedDataSourceOption;
                }
                // otherwise, pick the default based on the current selected data type, and available sources
                const dataSourceOptionsByType = self.dataTypeToDataSourceOptions
                    .result!;
                if (
                    this._selectedDataSourceOption === undefined &&
                    this.dataType &&
                    dataSourceOptionsByType[this.dataType] &&
                    dataSourceOptionsByType[this.dataType].length
                ) {
                    // return computed default if _selectedDataSourceOption is undefined
                    return dataSourceOptionsByType[this.dataType][0];
                } else {
                    // otherwise, _selectedDataSourceOption is defined, or there are no default options to choose from, so return _dataType
                    return this._selectedDataSourceOption;
                }
            },
            set selectedDataSourceOption(option: {
                value: string;
                label: string;
            }) {
                this._selectedDataSourceOption = option;
            },
            get dataSourceId() {
                if (this.selectedDataSourceOption) {
                    return this.selectedDataSourceOption.value;
                }
                return undefined;
            },
            get mutationCountBy() {
                if (this._mutationCountBy === undefined) {
                    // default
                    return MutationCountBy.MutationType;
                } else {
                    return this._mutationCountBy;
                }
            },
            set mutationCountBy(m: MutationCountBy) {
                this._mutationCountBy = m;
            },
            get structuralVariantCountBy() {
                if (this._structuralVariantCountBy === undefined) {
                    // default
                    return StructuralVariantCountBy.MutatedVsWildType;
                } else {
                    return this._structuralVariantCountBy;
                }
            },
            set structuralVariantCountBy(s: StructuralVariantCountBy) {
                this._structuralVariantCountBy = s;
            },
            get logScale() {
                const axisData = vertical
                    ? self.vertAxisDataPromise.result
                    : self.horzAxisDataPromise.result;
                return this._logScale && logScalePossible(this, axisData);
            },
            set logScale(v: boolean) {
                this._logScale = v;
            },
            get genesetId() {
                if (this.selectedGenesetOption) {
                    if (
                        this.selectedGenesetOption.value ===
                        SAME_SELECTED_OPTION_STRING_VALUE
                    ) {
                        return self.horzSelection.genesetId;
                    } else {
                        return this.selectedGenesetOption.value;
                    }
                } else {
                    return undefined;
                }
            },
            get selectedGenesetOption() {
                const genesetOptions =
                    (vertical
                        ? self.vertGenesetOptions.result
                        : self.horzGenesetOptions.result) || [];
                if (
                    this._selectedGenesetOption === undefined &&
                    genesetOptions.length
                ) {
                    // select default if _selectedGenesetOption is undefined and theres defaults to choose from
                    return genesetOptions[0];
                } else if (
                    vertical &&
                    this._selectedGenesetOption &&
                    this._selectedGenesetOption.value ===
                        SAME_SELECTED_OPTION_STRING_VALUE &&
                    (self.horzSelection.dataType === CLIN_ATTR_DATA_TYPE ||
                        self.horzSelection.dataType === CUSTOM_ATTR_DATA_TYPE)
                ) {
                    // if vertical gene set option is "same as horizontal", and horizontal is clinical or custom, then use the actual
                    //      gene set option value instead of "Same gene" option value, because that would be slightly weird UX
                    return self.horzSelection.selectedGenesetOption;
                } else {
                    // otherwise, return stored value for this variable
                    return this._selectedGenesetOption;
                }
            },
            set selectedGenesetOption(o: any) {
                this._selectedGenesetOption = o;
            },
            get genericAssayEntityId() {
                if (
                    self.showGenericAssaySelectBox(
                        this.dataType,
                        isGenericAssaySelected(this)
                    ) &&
                    this.selectedGenericAssayOption
                ) {
                    if (
                        this.selectedGenericAssayOption.value ===
                        SAME_SELECTED_OPTION_STRING_VALUE
                    ) {
                        return self.horzSelection.genericAssayEntityId;
                    } else {
                        return this.selectedGenericAssayOption.value;
                    }
                } else {
                    return undefined;
                }
            },
            get selectedGenericAssayOption() {
                const genericAssayOptions =
                    (vertical
                        ? self.vertGenericAssayOptions.result
                        : self.horzGenericAssayOptions.result) || [];
                const selectedHugoGeneSymbolInTheOtherAxis = vertical
                    ? self.horzSelection.selectedGeneOption?.label
                    : self.vertSelection.selectedGeneOption?.label;
                if (
                    this._selectedGenericAssayOption === undefined &&
                    genericAssayOptions.length
                ) {
                    // select default if _selectedGenericAssayOption is undefined and there are generic assay options to choose from
                    // if there is a gene selected in the other axis, select the first related option in this axis
                    // this will not override the option recorded in the url
                    // 1. get genericAssayType based on selection
                    const genericAssayType = vertical
                        ? self.vertSelection.dataType
                        : self.horzSelection.dataType;
                    // 2. If this genericAssayType is gene-related && one gene is selected in the other axis
                    // Then find gene-related options
                    const selectedGeneRelatedOptions =
                        genericAssayType &&
                        GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
                            genericAssayType
                        ]?.globalConfig?.geneRelatedGenericAssayType &&
                        selectedHugoGeneSymbolInTheOtherAxis
                            ? filterGenericAssayOptionsByGenes(
                                  genericAssayOptions,
                                  [selectedHugoGeneSymbolInTheOtherAxis]
                              )
                            : [];
                    // 3. return first gene-related option or the detault option
                    return !_.isEmpty(selectedGeneRelatedOptions)
                        ? selectedGeneRelatedOptions[0]
                        : genericAssayOptions[0];
                } else if (
                    vertical &&
                    this._selectedGenericAssayOption &&
                    this._selectedGenericAssayOption.value ===
                        SAME_SELECTED_OPTION_STRING_VALUE &&
                    (self.horzSelection.dataType === CLIN_ATTR_DATA_TYPE ||
                        self.horzSelection.dataType === CUSTOM_ATTR_DATA_TYPE)
                ) {
                    // if vertical gene set option is "same as horizontal", and horizontal is clinical or custom, then use the actual
                    //      gene set option value instead of "Same gene" option value, because that would be slightly weird UX
                    return self.horzSelection.selectedGenericAssayOption;
                } else {
                    // otherwise, return stored value for this variable
                    return this._selectedGenericAssayOption;
                }
            },
            set selectedGenericAssayOption(o: any) {
                this._selectedGenericAssayOption = o;
            },
            get genericAssayDataType() {
                if (!self.dataTypeOptions.isComplete) {
                    // if there are no options to select a default from, then return the stored value for this variable
                    return this._genericAssayDataType;
                }
                // otherwise, pick the default based on selected dataType
                const dataTypeOptions = self.dataTypeOptions.result!;
                if (vertical && self.vertSelection.dataType) {
                    const vertOption = _.find(
                        dataTypeOptions,
                        option => option.value === self.vertSelection.dataType
                    );
                    return vertOption?.genericAssayDataType;
                } else if (!vertical && self.horzSelection.dataType) {
                    const horzOption = _.find(
                        dataTypeOptions,
                        option => option.value === self.horzSelection.dataType
                    );
                    return horzOption?.genericAssayDataType;
                }
                return this._genericAssayDataType;
            },
            set genericAssayDataType(type: any) {
                this._genericAssayDataType = type;
            },

            get _selectedGeneOption() {
                const urlSelection =
                    (vertical
                        ? self.props.urlWrapper.query.plots_vert_selection
                        : self.props.urlWrapper.query.plots_horz_selection) ||
                    {};
                const param = urlSelection.selectedGeneOption;

                if (!param) {
                    return undefined;
                } else {
                    const val = parseFloat(param);
                    const geneOptions =
                        (vertical
                            ? self.vertGeneOptions.result
                            : self.horzGeneOptions.result) || [];

                    return geneOptions.find(o => o.value === val);
                }
            },
            set _selectedGeneOption(o: any) {
                self.props.urlWrapper.updateURL(
                    (
                        currentParams: ResultsViewURLQuery | StudyViewURLQuery
                    ) => {
                        if (vertical) {
                            currentParams.plots_vert_selection!.selectedGeneOption =
                                o && o.value;
                        } else {
                            currentParams.plots_horz_selection!.selectedGeneOption =
                                o && o.value;
                        }
                        return currentParams;
                    }
                );
            },

            get _selectedGenesetOption() {
                const urlSelection =
                    (vertical
                        ? self.props.urlWrapper.query.plots_vert_selection
                        : self.props.urlWrapper.query.plots_horz_selection) ||
                    {};
                const optionVal = urlSelection.selectedGenesetOption;

                if (!optionVal) {
                    return undefined;
                } else {
                    const genesetOptions =
                        (vertical
                            ? self.vertGenesetOptions.result
                            : self.horzGenesetOptions.result) || [];

                    return genesetOptions.find(o => o.value === optionVal);
                }
            },
            set _selectedGenesetOption(o: any) {
                self.props.urlWrapper.updateURL(
                    (
                        currentParams: ResultsViewURLQuery | StudyViewURLQuery
                    ) => {
                        if (vertical) {
                            currentParams.plots_vert_selection!.selectedGenesetOption =
                                o && o.value;
                        } else {
                            currentParams.plots_horz_selection!.selectedGenesetOption =
                                o && o.value;
                        }
                        return currentParams;
                    }
                );
            },

            get _selectedGenericAssayOption() {
                const urlSelection =
                    (vertical
                        ? self.props.urlWrapper.query.plots_vert_selection
                        : self.props.urlWrapper.query.plots_horz_selection) ||
                    {};
                const optionVal = urlSelection.selectedGenericAssayOption;

                if (!optionVal) {
                    return undefined;
                } else {
                    const treatmentOptions =
                        (vertical
                            ? self.vertGenericAssayOptions.result
                            : self.horzGenericAssayOptions.result) || [];

                    return treatmentOptions.find(o => o.value === optionVal);
                }
            },
            set _selectedGenericAssayOption(o: any) {
                self.props.urlWrapper.updateURL(
                    (
                        currentParams: ResultsViewURLQuery | StudyViewURLQuery
                    ) => {
                        if (vertical) {
                            currentParams.plots_vert_selection!.selectedGenericAssayOption =
                                o && o.value;
                        } else {
                            currentParams.plots_horz_selection!.selectedGenericAssayOption =
                                o && o.value;
                        }
                        return currentParams;
                    }
                );
            },

            get _selectedDataSourceOption() {
                const urlSelection =
                    (vertical
                        ? self.props.urlWrapper.query.plots_vert_selection
                        : self.props.urlWrapper.query.plots_horz_selection) ||
                    {};
                const optionVal = urlSelection.selectedDataSourceOption;

                if (!optionVal) {
                    return undefined;
                } else {
                    const dataSourceOptionsByType = self
                        .dataTypeToDataSourceOptions.result!;
                    if (
                        this.dataType &&
                        dataSourceOptionsByType &&
                        dataSourceOptionsByType[this.dataType] &&
                        dataSourceOptionsByType[this.dataType].length
                    ) {
                        // return computed default if _selectedDataSourceOption is undefined
                        return dataSourceOptionsByType[this.dataType].find(
                            o => o.value === optionVal
                        );
                    } else {
                        return undefined;
                    }
                }
            },
            set _selectedDataSourceOption(o: any) {
                self.props.urlWrapper.updateURL(
                    (
                        currentParams: ResultsViewURLQuery | StudyViewURLQuery
                    ) => {
                        if (vertical) {
                            currentParams.plots_vert_selection!.selectedDataSourceOption =
                                o && o.value;
                        } else {
                            currentParams.plots_horz_selection!.selectedDataSourceOption =
                                o && o.value;
                        }
                        return currentParams;
                    }
                );
            },

            get _dataType() {
                const urlSelection =
                    (vertical
                        ? self.props.urlWrapper.query.plots_vert_selection
                        : self.props.urlWrapper.query.plots_horz_selection) ||
                    {};
                return urlSelection.dataType;
            },
            set _dataType(d: string | undefined) {
                self.props.urlWrapper.updateURL(
                    (
                        currentParams: ResultsViewURLQuery | StudyViewURLQuery
                    ) => {
                        if (vertical) {
                            (currentParams.plots_vert_selection as Partial<
                                PlotsSelectionParam
                            >).dataType = d;
                        } else {
                            (currentParams.plots_horz_selection as Partial<
                                PlotsSelectionParam
                            >).dataType = d;
                        }
                        return currentParams;
                    }
                );
            },

            get _mutationCountBy() {
                const urlSelection =
                    (vertical
                        ? self.props.urlWrapper.query.plots_vert_selection
                        : self.props.urlWrapper.query.plots_horz_selection) ||
                    {};
                return urlSelection.mutationCountBy as MutationCountBy;
            },
            set _mutationCountBy(c: MutationCountBy) {
                self.props.urlWrapper.updateURL(
                    (
                        currentParams: ResultsViewURLQuery | StudyViewURLQuery
                    ) => {
                        if (vertical) {
                            currentParams.plots_vert_selection!.mutationCountBy = c;
                        } else {
                            currentParams.plots_horz_selection!.mutationCountBy = c;
                        }
                        return currentParams;
                    }
                );
            },

            get _structuralVariantCountBy() {
                const urlSelection =
                    (vertical
                        ? self.props.urlWrapper.query.plots_vert_selection
                        : self.props.urlWrapper.query.plots_horz_selection) ||
                    {};
                return urlSelection.structuralVariantCountBy as StructuralVariantCountBy;
            },
            set _structuralVariantCountBy(c: StructuralVariantCountBy) {
                self.props.urlWrapper.updateURL(
                    (
                        currentParams: ResultsViewURLQuery | StudyViewURLQuery
                    ) => {
                        if (vertical) {
                            currentParams.plots_vert_selection!.structuralVariantCountBy = c;
                        } else {
                            currentParams.plots_horz_selection!.structuralVariantCountBy = c;
                        }
                        return currentParams;
                    }
                );
            },

            get _logScale() {
                const urlSelection =
                    (vertical
                        ? self.props.urlWrapper.query.plots_vert_selection
                        : self.props.urlWrapper.query.plots_horz_selection) ||
                    {};
                const ret = urlSelection.logScale === 'true';
                return ret;
            },
            set _logScale(l: boolean) {
                self.props.urlWrapper.updateURL(
                    (
                        currentParams: ResultsViewURLQuery | StudyViewURLQuery
                    ) => {
                        if (vertical) {
                            currentParams.plots_vert_selection!.logScale = l.toString();
                        } else {
                            currentParams.plots_horz_selection!.logScale = l.toString();
                        }
                        return currentParams;
                    }
                );
            },
            _genericAssayDataType: undefined,
            selectedCategories: [],
        });
    }

    private initColoringMenuSelection(): ColoringMenuSelection {
        const self = this;
        return observable({
            get selectedOption() {
                const options = self.coloringMenuOmnibarOptions.isComplete
                    ? (_.flatMap(
                          self.coloringMenuOmnibarOptions.result,
                          groupOrSingle => {
                              if ((groupOrSingle as any).options) {
                                  return (groupOrSingle as ColoringMenuOmnibarGroup)
                                      .options;
                              } else {
                                  return groupOrSingle as ColoringMenuOmnibarOption;
                              }
                          }
                      ) as ColoringMenuOmnibarOption[])
                    : [];
                if (this._selectedOptionValue === undefined && options.length) {
                    // If no option selected,
                    let option:
                        | ColoringMenuOmnibarOption
                        | undefined = undefined;

                    // Look for a gene option that has the default gene
                    option = options.find(option => {
                        return (
                            option.info.entrezGeneId !== undefined &&
                            option.info.entrezGeneId !==
                                NONE_SELECTED_OPTION_NUMERICAL_VALUE &&
                            option.info.entrezGeneId ===
                                this.default.entrezGeneId
                        );
                    });

                    if (!option) {
                        // if no queried genes, set color option to gene on the horz/vert axis if exists, else none
                        if (self.props.hasNoQueriedGenes) {
                            if (self.horzSelection.selectedGeneOption) {
                                option = options.find(
                                    o =>
                                        o.info.entrezGeneId !== undefined &&
                                        o.info.entrezGeneId !==
                                            NONE_SELECTED_OPTION_NUMERICAL_VALUE &&
                                        o.info.entrezGeneId ===
                                            self.horzSelection
                                                .selectedGeneOption!.value
                                );
                            } else if (self.vertSelection.selectedGeneOption) {
                                option = options.find(
                                    o =>
                                        o.info.entrezGeneId !== undefined &&
                                        o.info.entrezGeneId !==
                                            NONE_SELECTED_OPTION_NUMERICAL_VALUE &&
                                        o.info.entrezGeneId ===
                                            self.vertSelection
                                                .selectedGeneOption!.value
                                );
                            } else {
                                option = options.find(
                                    o =>
                                        o.info.entrezGeneId ===
                                        NONE_SELECTED_OPTION_NUMERICAL_VALUE
                                );
                            }
                        } else {
                            option = options.find(
                                o =>
                                    o.info.entrezGeneId !== undefined &&
                                    o.info.entrezGeneId !==
                                        NONE_SELECTED_OPTION_NUMERICAL_VALUE
                            );
                        }
                    }
                    return option;
                } else {
                    // otherwise, return stored value for this variable
                    return options.find(
                        o => o.value === this._selectedOptionValue
                    );
                }
            },
            set selectedOption(o: ColoringMenuOmnibarOption | undefined) {
                this._selectedOptionValue = o && o.value;
            },
            get _selectedOptionValue() {
                return self.props.urlWrapper.query.plots_coloring_selection!
                    .selectedOption;
            },
            set _selectedOptionValue(v: string | undefined) {
                runInAction(() => {
                    self.props.urlWrapper.updateURL(
                        (
                            currentQuery:
                                | ResultsViewURLQuery
                                | StudyViewURLQuery
                        ) => {
                            currentQuery.plots_coloring_selection!.selectedOption = v;
                            return currentQuery;
                        }
                    );
                    // reset highlights
                    self.highlightedLegendItems.clear();
                });
            },
            get logScale() {
                // default false
                return (
                    self.props.urlWrapper.query.plots_coloring_selection!
                        .logScale === 'true'
                );
            },
            set logScale(s: boolean) {
                self.props.urlWrapper.updateURL(
                    (currentQuery: ResultsViewURLQuery | StudyViewURLQuery) => {
                        currentQuery.plots_coloring_selection!.logScale = s.toString();
                        return currentQuery;
                    }
                );
            },
            get colorByMutationType() {
                // default true
                return (
                    self.props.urlWrapper.query.plots_coloring_selection!
                        .colorByMutationType !== 'false'
                );
            },
            get colorByCopyNumber() {
                // radio buttons in waterfall plot
                if (self.plotType.result === PlotType.WaterfallPlot) {
                    return (
                        this.colorByCopyNumberFromUrl &&
                        !this.colorByMutationType
                    );
                } else {
                    return this.colorByCopyNumberFromUrl;
                }
            },
            get colorByCopyNumberFromUrl() {
                // default true
                return (
                    self.props.urlWrapper.query.plots_coloring_selection!
                        .colorByCopyNumber !== 'false'
                );
            },
            get colorByStructuralVariant() {
                // radio buttons in waterfall plot
                if (self.plotType.result === PlotType.WaterfallPlot) {
                    return (
                        this.colorByStructuralVariantFromUrl &&
                        !this.colorByCopyNumberFromUrl &&
                        !this.colorByMutationType
                    );
                } else {
                    return this.colorByStructuralVariantFromUrl;
                }
            },
            get colorByStructuralVariantFromUrl() {
                // default true
                return (
                    self.props.urlWrapper.query.plots_coloring_selection!
                        .colorBySv !== 'false'
                );
            },
            default: {
                entrezGeneId: undefined,
            },
        });
    }

    @action
    setColorByMutationType(s: boolean) {
        this.props.urlWrapper.updateURL(
            (currentQuery: ResultsViewURLQuery | StudyViewURLQuery) => {
                currentQuery.plots_coloring_selection!.colorByMutationType = s.toString();
                return currentQuery;
            }
        );
        // reset highlights
        this.highlightedLegendItems.clear();
    }
    @action
    setColorByCopyNumber(s: boolean) {
        this.props.urlWrapper.updateURL(
            (currentQuery: ResultsViewURLQuery | StudyViewURLQuery) => {
                currentQuery.plots_coloring_selection!.colorByCopyNumber = s.toString();
                return currentQuery;
            }
        );
        // reset highlights
        this.highlightedLegendItems.clear();
    }
    @action
    setColorByStructuralVariant(s: boolean) {
        this.props.urlWrapper.updateURL(
            (currentQuery: ResultsViewURLQuery | StudyViewURLQuery) => {
                currentQuery.plots_coloring_selection!.colorBySv = s.toString();
                return currentQuery;
            }
        );
        // reset highlights
        this.highlightedLegendItems.clear();
    }
    @action.bound
    private updateColoringMenuGene(entrezGeneId: number) {
        this.coloringMenuSelection.selectedOption = undefined;
        this.coloringMenuSelection.default.entrezGeneId = entrezGeneId;
    }

    @action.bound
    private onInputClick(event: React.MouseEvent<HTMLInputElement>) {
        const plotType = this.plotType.result!;
        switch (parseInt((event.target as HTMLInputElement).value, 10)) {
            case EventKey.horz_logScale:
                this.horzSelection.logScale = !this.horzSelection.logScale;
                break;
            case EventKey.vert_logScale:
                this.vertSelection.logScale = !this.vertSelection.logScale;
                break;
            case EventKey.utilities_showRegressionLine:
                this.showRegressionLine = !this.showRegressionLine;
                break;
            case EventKey.utilities_horizontalBars:
                this.horizontalBars = !this.horizontalBars;
                this.handleSortByChange({
                    value: SortByOptions.Alphabetically,
                    label: 'Alphabetically',
                });
                break;
            case EventKey.utilities_viewLimitValues:
                this.viewLimitValues = !this.viewLimitValues;
                break;
            case EventKey.utilities_connectSamples:
                this.connectSamples = !this.connectSamples;
                break;
            case EventKey.sortByMedian:
                this.boxPlotSortByMedian = !this.boxPlotSortByMedian;
                break;
        }
    }

    @autobind
    private downloadData() {
        onMobxPromise<any>(
            [
                this.props.entrezGeneIdToGene,
                this.props.sampleKeyToSample,
                this.horzLabel,
                this.vertLabel,
            ],
            (entrezGeneIdToGene, sampleKeyToSample, horzLabel, vertLabel) => {
                const filename = `${this.downloadFilename}.txt`;
                switch (this.plotType.result) {
                    case PlotType.ScatterPlot:
                        fileDownload(
                            getScatterPlotDownloadData(
                                this.scatterPlotData.result!,
                                horzLabel,
                                vertLabel,
                                entrezGeneIdToGene,
                                this.coloringMenuSelection.colorByMutationType,
                                this.coloringMenuSelection.colorByCopyNumber,
                                this.coloringMenuSelection.selectedOption &&
                                    this.coloringMenuSelection.selectedOption
                                        .info.clinicalAttribute
                            ),
                            filename
                        );
                        break;
                    case PlotType.WaterfallPlot:
                        fileDownload(
                            getWaterfallPlotDownloadData(
                                this.waterfallPlotData.result!.data,
                                this.waterfallPlotSortOrder,
                                this.waterfallPlotPivotThreshold,
                                this.waterfallLabel.result!,
                                entrezGeneIdToGene,
                                this.coloringMenuSelection.colorByMutationType,
                                this.coloringMenuSelection.colorByCopyNumber,
                                this.coloringMenuSelection.selectedOption &&
                                    this.coloringMenuSelection.selectedOption
                                        .info.clinicalAttribute
                            ),
                            filename
                        );
                        break;
                    case PlotType.BoxPlot:
                        const categoryLabel = this.boxPlotData.result!
                            .horizontal
                            ? vertLabel
                            : horzLabel;
                        const valueLabel = this.boxPlotData.result!.horizontal
                            ? horzLabel
                            : vertLabel;
                        fileDownload(
                            getBoxPlotDownloadData(
                                this.boxPlotData.result!.data,
                                categoryLabel,
                                valueLabel,
                                entrezGeneIdToGene,
                                this.coloringMenuSelection.colorByMutationType,
                                this.coloringMenuSelection.colorByCopyNumber,
                                this.coloringMenuSelection.selectedOption &&
                                    this.coloringMenuSelection.selectedOption
                                        .info.clinicalAttribute
                            ),
                            filename
                        );
                        break;
                    case PlotType.DiscreteVsDiscrete:
                        fileDownload(
                            getTablePlotDownloadData(
                                (this.horzAxisDataPromise
                                    .result! as IStringAxisData).data,
                                (this.vertAxisDataPromise
                                    .result! as IStringAxisData).data,
                                sampleKeyToSample,
                                horzLabel,
                                vertLabel
                            ),
                            filename
                        );
                        break;
                }
            }
        );
    }

    @action.bound
    private setSearchCaseInput(e: any) {
        this.searchCaseInput = e.target.value;
        clearTimeout(this.searchCaseTimeout);
        this.searchCaseTimeout = setTimeout(
            () => this.executeSearchCase(this.searchCaseInput),
            searchInputTimeoutMs
        );
    }

    @action.bound
    private setSearchMutationInput(e: any) {
        this.searchMutationInput = e.target.value;
        clearTimeout(this.searchMutationTimeout);
        this.searchMutationTimeout = setTimeout(
            () => this.executeSearchMutation(this.searchMutationInput),
            searchInputTimeoutMs
        );
    }

    @action.bound
    public executeSearchCase(caseId: string) {
        this.searchCase = caseId;
    }

    @action.bound
    public executeSearchMutation(proteinChange: string) {
        this.searchMutation = proteinChange;
    }

    @autobind
    private getHorizontalAxisMenu() {
        if (
            !this.dataTypeOptions.isComplete ||
            !this.dataTypeToDataSourceOptions.isComplete ||
            !this.props.coverageInformation.isComplete
        ) {
            return <span></span>;
        } else {
            return this.getAxisMenu(
                false,
                this.dataTypeToDataSourceOptions.result
            );
        }
    }

    @autobind
    private getVerticalAxisMenu() {
        if (
            !this.dataTypeOptions.isComplete ||
            !this.dataTypeToDataSourceOptions.isComplete ||
            !this.props.coverageInformation.isComplete
        ) {
            return <span></span>;
        } else {
            return this.getAxisMenu(
                true,
                this.dataTypeToDataSourceOptions.result
            );
        }
    }

    @action.bound
    private onVerticalAxisGeneSelect(option: any) {
        this.vertSelection.selectedGeneOption = option;
        this.viewLimitValues = true;
        this.selectionHistory.updateVerticalFromSelection(this.vertSelection);
        this.autoChooseColoringMenuGene();
    }

    @action.bound
    private onHorizontalAxisGeneSelect(option: any) {
        this.horzSelection.selectedGeneOption = option;
        this.viewLimitValues = true;
        this.selectionHistory.updateHorizontalFromSelection(this.horzSelection);
        this.autoChooseColoringMenuGene();
    }

    @action.bound
    private selectSameGeneOptionForVerticalAxis() {
        if (!this.vertGeneOptions.result) {
            return;
        }

        const option = this.vertGeneOptions.result!.find(
            o => o.value === SAME_SELECTED_OPTION_NUMERICAL_VALUE
        );

        if (option) {
            this.onVerticalAxisGeneSelect(option);
        }
    }

    @action.bound
    private onVerticalAxisGenesetSelect(option: any) {
        this.vertSelection.selectedGenesetOption = option;
        this.viewLimitValues = true;
        this.selectionHistory.updateVerticalFromSelection(this.vertSelection);
    }

    @action.bound
    private onHorizontalAxisGenesetSelect(option: any) {
        this.horzSelection.selectedGenesetOption = option;
        this.viewLimitValues = true;
        this.selectionHistory.updateHorizontalFromSelection(this.horzSelection);
    }

    @action.bound
    private onVerticalAxisGenericAssaySelect(option: any) {
        this.vertSelection.selectedGenericAssayOption = option;
        this.viewLimitValues = true;
        this.selectionHistory.updateVerticalFromSelection(this.vertSelection);
    }

    @action.bound
    private onHorizontalAxisGenericAssaySelect(option: any) {
        this.horzSelection.selectedGenericAssayOption = option;
        this.viewLimitValues = true;
        this.selectionHistory.updateHorizontalFromSelection(this.horzSelection);
    }

    @action.bound
    private onColoringMenuOptionSelect(option: any) {
        this.coloringMenuSelection.selectedOption = option;
    }

    public test__selectGeneOption(vertical: boolean, optionValue: any) {
        // for end to end testing
        // optionValue is either entrez id or the code for same gene
        let options;
        if (vertical) {
            options = this.vertGeneOptions.result || [];
        } else {
            options = this.horzGeneOptions.result || [];
        }
        const option = options.find(x => x.value === optionValue);
        if (!option) {
            throw 'Option not found';
        }
        if (vertical) {
            this.onVerticalAxisGeneSelect(option);
        } else {
            this.onHorizontalAxisGeneSelect(option);
        }
    }

    readonly horzDatatypeOptions = remoteData({
        await: () => [this.dataTypeOptions],
        invoke: () => {
            let noneDatatypeOption = undefined;
            // listen to updates of `dataTypeOptions` and on the selected data type for the vertical axis
            if (
                this.dataTypeOptions.result &&
                isGenericAssaySelected(this.vertSelection) &&
                this.vertSelection.genericAssayDataType ===
                    DataTypeConstants.LIMITVALUE
            ) {
                noneDatatypeOption = [
                    {
                        value: NONE_SELECTED_OPTION_STRING_VALUE,
                        label: NONE_SELECTED_OPTION_LABEL,
                    },
                ];
            }
            const options = (noneDatatypeOption || []).concat(
                (this.dataTypeOptions.result || []) as any[]
            );
            return Promise.resolve(options);
        },
    });

    readonly vertDatatypeOptions = remoteData({
        await: () => [this.dataTypeOptions],
        invoke: () => {
            let noneDatatypeOption = undefined;
            // listen to updates of `dataTypeOptions` and on the selected data type for the horzontal axis
            if (
                this.dataTypeOptions.result &&
                isGenericAssaySelected(this.horzSelection) &&
                this.horzSelection.genericAssayDataType ===
                    DataTypeConstants.LIMITVALUE
            ) {
                noneDatatypeOption = [
                    {
                        value: NONE_SELECTED_OPTION_STRING_VALUE,
                        label: NONE_SELECTED_OPTION_LABEL,
                    },
                ];
            }
            return Promise.resolve(
                (noneDatatypeOption || []).concat(
                    (this.dataTypeOptions.result || []) as any[]
                )
            );
        },
    });

    readonly horzGeneOptions = remoteData<{ value: number; label: string }[]>({
        await: () => [this.props.genes],
        invoke: () => {
            if (this.props.hasNoQueriedGenes) {
                return Promise.resolve(
                    this.props.genes
                        .result!.map(gene => ({
                            value: gene.entrezGeneId,
                            label: gene.hugoGeneSymbol,
                        }))
                        .sort((a, b) => {
                            return a.label < b.label ? -1 : 1;
                        })
                );
            } else {
                return Promise.resolve(
                    this.props.genes.result!.map(gene => ({
                        value: gene.entrezGeneId,
                        label: gene.hugoGeneSymbol,
                    }))
                );
            }
        },
    });

    readonly vertGeneOptions = remoteData<{ value: number; label: string }[]>({
        await: () => [this.horzGeneOptions],
        invoke: () => {
            let sameGeneOption = undefined;
            // // listen to updates of `horzGeneOptions` or the selected data type for the horzontal axis
            // when the data type on the horizontal axis is a gene  profile
            // add an option to select the same gene
            if (
                this.horzSelection.dataType &&
                this.showGeneSelectBox(
                    this.horzSelection.dataType,
                    isGenericAssaySelected(this.horzSelection)
                ) &&
                this.horzSelection.selectedGeneOption &&
                this.horzSelection.selectedGeneOption.value !==
                    NONE_SELECTED_OPTION_NUMERICAL_VALUE
            ) {
                sameGeneOption = [
                    {
                        value: SAME_SELECTED_OPTION_NUMERICAL_VALUE,
                        label: `Same gene (${this.horzSelection.selectedGeneOption.label})`,
                    },
                ];
            }
            return Promise.resolve(
                (sameGeneOption || []).concat(
                    (this.horzGeneOptions.result || []) as any[]
                )
            );
        },
    });

    readonly clinicalAndCustomAttributes = remoteData<
        ExtendedClinicalAttribute[]
    >({
        await: () => [
            this.props.clinicalAttributes,
            this.props.customAttributes,
        ],
        invoke: () => {
            return Promise.resolve([
                ...this.props.clinicalAttributes.result!,
                ...this.props.customAttributes.result!,
            ]);
        },
    });

    readonly clinicalAttributeOptions = remoteData({
        await: () => [this.props.clinicalAttributes],
        invoke: () =>
            Promise.resolve(
                makeClinicalAttributeOptions(
                    this.props.clinicalAttributes.result!
                )
            ),
    });

    readonly customAttributeOptions = remoteData({
        await: () => [this.props.customAttributes],
        invoke: () =>
            Promise.resolve(
                makeClinicalAttributeOptions(
                    this.props.customAttributes.result!
                )
            ),
    });

    readonly coloringMenuOmnibarOptions = remoteData<
        (ColoringMenuOmnibarOption | ColoringMenuOmnibarGroup)[]
    >({
        await: () => [this.props.genes, this.clinicalAndCustomAttributes],
        invoke: () => {
            const allOptions: (
                | Omit<ColoringMenuOmnibarOption, 'value'>
                | (Omit<ColoringMenuOmnibarGroup, 'options'> & {
                      options: Omit<ColoringMenuOmnibarOption, 'value'>[];
                  })
            )[] = [];

            // add gene options
            allOptions.push({
                label: 'Genes',
                options: this.props.genes.result!.map(gene => ({
                    label: gene.hugoGeneSymbol,
                    info: {
                        entrezGeneId: gene.entrezGeneId,
                    },
                })),
            });

            // Add Cancer Study as a special attribute at the beginning
            const clinicalAttrsWithCancerStudy = [
                createCancerStudyAttribute(),
                ...this.clinicalAndCustomAttributes.result!,
            ];

            allOptions.push({
                label: 'Clinical Attributes',
                options: clinicalAttrsWithCancerStudy
                    .filter(a => {
                        return (
                            a.clinicalAttributeId !==
                            SpecialAttribute.MutationSpectrum
                        );
                    })
                    .map(clinicalAttribute => {
                        return {
                            label: clinicalAttribute.displayName,
                            info: {
                                clinicalAttribute,
                            },
                        };
                    }),
            });
            if (allOptions.length > 0) {
                // add 'None' option to the top of the list to allow removing coloring of samples
                allOptions.unshift({
                    label: 'None',
                    info: {
                        entrezGeneId: NONE_SELECTED_OPTION_NUMERICAL_VALUE,
                    },
                });
            }

            // add derived `value` to options so they can be tracked correctly in ReactSelect
            allOptions.forEach(groupOrSingle => {
                if ((groupOrSingle as any).options) {
                    (groupOrSingle as ColoringMenuOmnibarGroup).options.forEach(
                        (option: any) => {
                            option.value = getColoringMenuOptionValue(option);
                        }
                    );
                } else {
                    (groupOrSingle as ColoringMenuOmnibarOption).value = getColoringMenuOptionValue(
                        groupOrSingle as ColoringMenuOmnibarOption
                    );
                }
            });
            return Promise.resolve(
                allOptions as (
                    | ColoringMenuOmnibarOption
                    | ColoringMenuOmnibarGroup
                )[]
            );
        },
    });

    readonly horzGenesetOptions = remoteData({
        await: () => [this.props.genesets],
        invoke: () => {
            return Promise.resolve(
                this.props.genesets.result!.map(geneset => ({
                    value: geneset.genesetId,
                    label: geneset.name,
                }))
            );
        },
    });

    readonly vertGenesetOptions = remoteData({
        await: () => [this.horzGenesetOptions],
        invoke: () => {
            let sameGenesetOption = undefined;
            // listen to updates of `horzGenesetOptions` or the selected data type for the horzontal axis
            if (this.horzGenesetOptions || this.horzSelection.dataType) {
                // when the data type on the horizontal axis is a gene  profile
                // add an option to select the same gene
                if (
                    this.horzSelection.dataType &&
                    this.showGenesetSelectBox(this.horzSelection.dataType) &&
                    this.horzSelection.selectedGenesetOption &&
                    this.horzSelection.selectedGenesetOption.value !==
                        NONE_SELECTED_OPTION_STRING_VALUE
                ) {
                    sameGenesetOption = [
                        {
                            value: SAME_SELECTED_OPTION_STRING_VALUE,
                            label: `Same gene set (${this.horzSelection.selectedGenesetOption.label})`,
                        },
                    ];
                }
            }
            return Promise.resolve(
                (sameGenesetOption || []).concat(
                    (this.horzGenesetOptions.result || []) as any[]
                )
            );
        },
    });

    // group entites by stableId, each stableId should only have on
    readonly genericEntitiesGroupByEntityId = remoteData<{
        [entityId: string]: GenericAssayMeta;
    }>({
        await: () => [this.props.genericAssayEntitiesGroupByMolecularProfileId],
        invoke: () => {
            const result: { [entityId: string]: GenericAssayMeta } = _.chain(
                this.props.genericAssayEntitiesGroupByMolecularProfileId.result
            )
                .values()
                .flatten()
                .groupBy(entity => entity.stableId)
                .mapValues(entites => entites[0])
                .value();
            return Promise.resolve(result);
        },
    });

    readonly horzGenericAssayOptions = remoteData({
        await: () => [
            this.props.genericAssayEntitiesGroupByMolecularProfileId,
            this.props.molecularProfileIdSuffixToMolecularProfiles,
        ],
        invoke: () => {
            // different generic assay profile can holds different entities, use entites in selected profile
            if (
                this.horzSelection.dataSourceId &&
                this.props.molecularProfileIdSuffixToMolecularProfiles.result &&
                this.props.molecularProfileIdSuffixToMolecularProfiles.result[
                    this.horzSelection.dataSourceId
                ]
            ) {
                return Promise.resolve(
                    _.chain(
                        this.props.molecularProfileIdSuffixToMolecularProfiles
                            .result[this.horzSelection.dataSourceId!]
                    )
                        .reduce((acc, profile) => {
                            if (
                                this.props
                                    .genericAssayEntitiesGroupByMolecularProfileId
                                    .result &&
                                this.props
                                    .genericAssayEntitiesGroupByMolecularProfileId
                                    .result[profile.molecularProfileId]
                            ) {
                                this.props.genericAssayEntitiesGroupByMolecularProfileId.result[
                                    profile.molecularProfileId
                                ].forEach(meta => {
                                    acc[meta.stableId] = { meta, profile };
                                });
                                return acc;
                            }
                        }, {} as { [stableId: string]: { meta: GenericAssayMeta; profile: MolecularProfile } })
                        .map(metaProfilePair =>
                            makeGenericAssayPlotsTabOption(
                                metaProfilePair.meta,
                                GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
                                    metaProfilePair.profile.genericAssayType
                                ]?.plotsTabConfig?.plotsTabUsecompactLabel
                            )
                        )
                        .value()
                );
            }
            return Promise.resolve([] as any[]);
        },
    });

    readonly vertGenericAssayOptions = remoteData({
        await: () => [
            this.props.genericAssayEntitiesGroupByMolecularProfileId,
            this.props.molecularProfileIdSuffixToMolecularProfiles,
        ],
        invoke: () => {
            let sameGenericAssayOption = undefined;
            let verticalOptions = undefined;
            if (
                this.vertSelection.dataType &&
                this.showGenericAssaySelectBox(
                    this.vertSelection.dataType,
                    isGenericAssaySelected(this.vertSelection)
                )
            ) {
                // different generic assay profile can hold different entities, use entites in selected profile
                if (
                    this.vertSelection.dataSourceId &&
                    this.props.molecularProfileIdSuffixToMolecularProfiles
                        .result &&
                    this.props.molecularProfileIdSuffixToMolecularProfiles
                        .result[this.vertSelection.dataSourceId]
                ) {
                    verticalOptions = _.chain(
                        this.props.molecularProfileIdSuffixToMolecularProfiles
                            .result[this.vertSelection.dataSourceId!]
                    )
                        .reduce((acc, profile) => {
                            if (
                                this.props
                                    .genericAssayEntitiesGroupByMolecularProfileId
                                    .result &&
                                this.props
                                    .genericAssayEntitiesGroupByMolecularProfileId
                                    .result[profile.molecularProfileId]
                            ) {
                                this.props.genericAssayEntitiesGroupByMolecularProfileId.result[
                                    profile.molecularProfileId
                                ].forEach(meta => {
                                    acc[meta.stableId] = { meta, profile };
                                });
                                return acc;
                            }
                        }, {} as { [stableId: string]: { meta: GenericAssayMeta; profile: MolecularProfile } })
                        .map(metaProfilePair =>
                            makeGenericAssayPlotsTabOption(
                                metaProfilePair.meta,
                                GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
                                    metaProfilePair.profile.genericAssayType
                                ]?.plotsTabConfig?.plotsTabUsecompactLabel
                            )
                        )
                        .value();
                }
                // if horzSelection has the same dataType selected, add a SAME_SELECTED_OPTION option
                if (
                    this.horzSelection.dataType &&
                    this.horzSelection.dataType ===
                        this.vertSelection.dataType &&
                    this.horzSelection.dataSourceId &&
                    this.showGenericAssaySelectBox(
                        this.horzSelection.dataType,
                        isGenericAssaySelected(this.horzSelection)
                    ) &&
                    this.horzSelection.selectedGenericAssayOption &&
                    this.horzSelection.selectedGenericAssayOption.value !==
                        NONE_SELECTED_OPTION_STRING_VALUE &&
                    this.props.molecularProfileIdSuffixToMolecularProfiles
                        .result &&
                    this.props.molecularProfileIdSuffixToMolecularProfiles
                        .result[this.horzSelection.dataSourceId]
                ) {
                    const firstProfile = this.props
                        .molecularProfileIdSuffixToMolecularProfiles.result[
                        this.horzSelection.dataSourceId!
                    ][0];
                    sameGenericAssayOption = [
                        {
                            value: SAME_SELECTED_OPTION_STRING_VALUE,
                            label: `Same ${deriveDisplayTextFromGenericAssayType(
                                firstProfile.genericAssayType
                            )} (${
                                this.horzSelection.selectedGenericAssayOption
                                    .label
                            })`,
                            plotAxisLabel: `Same ${deriveDisplayTextFromGenericAssayType(
                                firstProfile.genericAssayType
                            )} (${
                                this.horzSelection.selectedGenericAssayOption
                                    .plotAxisLabel
                            })`,
                        },
                    ];
                }
            }
            return Promise.resolve(
                (sameGenericAssayOption || []).concat(
                    (verticalOptions || []) as {
                        value: string;
                        label: string;
                        plotAxisLabel: string;
                    }[]
                )
            );
        },
    });

    private showGeneSelectBox(
        dataType: string,
        isGenericAssaySelected: boolean
    ): boolean {
        return (
            dataType !== NONE_SELECTED_OPTION_STRING_VALUE &&
            dataType !== GENESET_DATA_TYPE &&
            dataType !== CLIN_ATTR_DATA_TYPE &&
            dataType !== CUSTOM_ATTR_DATA_TYPE &&
            !isGenericAssaySelected
        );
    }

    private showGenesetSelectBox(dataType: string): boolean {
        return (
            dataType !== NONE_SELECTED_OPTION_STRING_VALUE &&
            dataType === GENESET_DATA_TYPE
        );
    }

    private showGenericAssaySelectBox(
        dataType: string,
        isGenericAssaySelected: boolean
    ): boolean {
        return (
            dataType !== NONE_SELECTED_OPTION_STRING_VALUE &&
            isGenericAssaySelected
        );
    }

    private showDatasourceBox(dataType: string): boolean {
        return dataType !== NONE_SELECTED_OPTION_STRING_VALUE;
    }

    private showSortOrderButton(onVerticalAxis: boolean): boolean {
        if (this.waterfallPlotIsShown) {
            if (onVerticalAxis) {
                return !this.isHorizontalWaterfallPlot;
            } else {
                return this.isHorizontalWaterfallPlot;
            }
        }
        return false;
    }

    @computed get waterfallPlotIsShown(): boolean {
        return showWaterfallPlot(this.horzSelection, this.vertSelection);
    }

    readonly clinicalAttributeIdToClinicalAttribute = remoteData<{
        [clinicalAttributeId: string]: ClinicalAttribute;
    }>({
        await: () => [this.props.studyIds, this.props.clinicalAttributes],
        invoke: () => {
            let _map: {
                [clinicalAttributeId: string]: ClinicalAttribute;
            } = _.keyBy(
                this.props.clinicalAttributes.result!,
                c => c.clinicalAttributeId
            );
            return Promise.resolve(_map);
        },
    });

    readonly customAttributeIdToClinicalAttribute = remoteData<{
        [clinicalAttributeId: string]: ClinicalAttribute;
    }>({
        await: () => [this.props.studyIds, this.props.customAttributes],
        invoke: () => {
            let _map: {
                [clinicalAttributeId: string]: ClinicalAttribute;
            } = _.keyBy(
                this.props.customAttributes.result!,
                c => c.clinicalAttributeId
            );
            return Promise.resolve(_map);
        },
    });

    readonly clinicalAttributesGroupByclinicalAttributeId = remoteData<{
        [clinicalAttributeId: string]: ClinicalAttribute[];
    }>({
        await: () => [this.props.clinicalAttributes],
        invoke: () => {
            return Promise.resolve(
                _.groupBy(
                    this.props.clinicalAttributes.result!,
                    c => c.clinicalAttributeId
                )
            );
        },
    });

    readonly customAttributesGroupByclinicalAttributeId = remoteData<{
        [clinicalAttributeId: string]: ClinicalAttribute[];
    }>({
        await: () => [this.props.customAttributes],
        invoke: () => {
            return Promise.resolve(
                _.groupBy(
                    this.props.customAttributes.result!,
                    c => c.clinicalAttributeId
                )
            );
        },
    });

    readonly dataTypeOptions = remoteData<PlotsTabOption[]>({
        await: () => [
            this.props.molecularProfilesWithData,
            this.clinicalAttributeOptions,
            this.props.molecularProfilesInStudies,
            this.props.genesets,
            this.customAttributeOptions,
        ],
        invoke: () => {
            const profiles = this.props.molecularProfilesWithData.result!;

            // show only data types we have profiles for
            const dataTypeIds: string[] = _.uniq(
                profiles.map(profile => {
                    return profile.molecularAlterationType;
                })
            ).filter(type => !!dataTypeToDisplayType[type]); // only show profiles of the type we want to show

            // if no gene sets are queried, remove gene set profile from dataTypeIds
            if (
                this.props.genesets.result!.length === 0 &&
                dataTypeIds.includes(AlterationTypeConstants.GENESET_SCORE)
            ) {
                _.remove(dataTypeIds, function(n) {
                    return n === AlterationTypeConstants.GENESET_SCORE;
                });
            }

            if (this.clinicalAttributeOptions.result!.length) {
                // add "clinical attribute" to list if we have any clinical attribute options
                dataTypeIds.push(CLIN_ATTR_DATA_TYPE);
            }

            if (!_.isEmpty(this.customAttributeOptions.result)) {
                dataTypeIds.push(CUSTOM_ATTR_DATA_TYPE);
            }

            if (
                this.props.molecularProfilesInStudies.result!.length &&
                this.horzGenesetOptions.result &&
                this.horzGenesetOptions.result!.length > 0
            ) {
                // add geneset profile to list if the study contains it and the query contains gene sets
                this.props.molecularProfilesInStudies.result.filter(p => {
                    if (
                        p.molecularAlterationType ===
                        AlterationTypeConstants[GENESET_DATA_TYPE]
                    ) {
                        if (dataTypeIds.indexOf(GENESET_DATA_TYPE) === -1) {
                            dataTypeIds.push(GENESET_DATA_TYPE);
                        }
                    }
                });
            }

            // add generic assay data type options
            const genericAssayOptions = _.chain(profiles)
                .filter(
                    profile =>
                        profile.molecularAlterationType ===
                        AlterationTypeConstants.GENERIC_ASSAY
                )
                .uniqBy(profile => profile.genericAssayType)
                .map(profile => ({
                    value: profile.genericAssayType,
                    label: deriveDisplayTextFromGenericAssayType(
                        profile.genericAssayType
                    ),
                    genericAssayDataType: profile.datatype,
                }))
                .value();

            return Promise.resolve(
                _.concat(
                    _.sortBy(
                        dataTypeIds, // sort them into display order
                        type => dataTypeDisplayOrder.indexOf(type)
                    ).map(type => ({
                        value: type,
                        label: dataTypeToDisplayType[type],
                    })), // output options
                    genericAssayOptions // add generic assay options
                )
            );
        },
    });

    readonly dataTypeToDataSourceOptions = remoteData<{
        [dataType: string]: { value: string; label: string }[];
    }>({
        await: () => [
            this.props.molecularProfilesInStudies,
            this.clinicalAttributeOptions,
            this.customAttributeOptions,
        ],
        invoke: () => {
            const profiles = this.props.molecularProfilesInStudies.result!;
            // filter out generic assay profile which showProfileInAnalysisTab is not TRUE
            const filteredProfiles = _.filter(profiles, profile => {
                return (
                    profile.molecularAlterationType !==
                        AlterationTypeConstants.GENERIC_ASSAY ||
                    (profile.molecularAlterationType ===
                        AlterationTypeConstants.GENERIC_ASSAY &&
                        profile.showProfileInAnalysisTab)
                );
            });
            const map = _.mapValues(
                _.groupBy(filteredProfiles, profile => {
                    if (
                        profile.molecularAlterationType ===
                        AlterationTypeConstants.GENERIC_ASSAY
                    ) {
                        return profile.genericAssayType;
                    } else return profile.molecularAlterationType;
                }), // create a map from profile type to list of profiles of that type
                profilesOfType =>
                    // create options out of those profiles
                    _.reduce(
                        sortMolecularProfilesForDisplay(profilesOfType),
                        (uniqueOptions, profile) => {
                            const profileSuffix = getSuffixOfMolecularProfile(
                                profile
                            );
                            // use unique suffix of molecular profile id as the dataSource
                            return uniqueOptions
                                .map(option => option.value)
                                .includes(profileSuffix)
                                ? uniqueOptions
                                : [
                                      ...uniqueOptions,
                                      {
                                          value: profileSuffix,
                                          label: profile.name,
                                      },
                                  ];
                        },
                        [] as { value: string; label: string }[]
                    )
            );
            if (this.clinicalAttributeOptions.result!.length) {
                // add clinical attributes
                map[
                    CLIN_ATTR_DATA_TYPE
                ] = this.clinicalAttributeOptions.result!;
            }

            if (!_.isEmpty(this.customAttributeOptions.result)) {
                // add custom attributes
                map[
                    CUSTOM_ATTR_DATA_TYPE
                ] = this.customAttributeOptions.result!;
            }
            return Promise.resolve(map);
        },
    });

    @action.bound
    private onVerticalAxisDataTypeSelect(option: PlotsTabOption) {
        const oldVerticalGene = this.vertSelection.selectedGeneOption;
        const oldHorizontalGene = this.horzSelection.selectedGeneOption;
        this.vertSelection.dataType = option.value;
        if (option.genericAssayDataType) {
            this.vertSelection.genericAssayDataType =
                option.genericAssayDataType;
        }

        this.viewLimitValues = true;
        this.selectionHistory.runVerticalUpdaters(
            option.value,
            this.onVerticalAxisGeneSelect,
            this.onVerticalAxisGenesetSelect,
            this.onVerticalAxisDataSourceSelect,
            this.onVerticalAxisGenericAssaySelect
        );

        if (
            this.vertSelection.dataType &&
            !this.showGeneSelectBox(
                this.vertSelection.dataType,
                isGenericAssaySelected(this.vertSelection)
            ) &&
            oldHorizontalGene &&
            oldHorizontalGene.value == SAME_SELECTED_OPTION_NUMERICAL_VALUE
        ) {
            this.onHorizontalAxisGeneSelect(oldVerticalGene);
        }

        this.vertSelection.selectedCategories = [];

        this.autoChooseColoringMenuGene();
    }

    @action.bound
    public onHorizontalAxisDataTypeSelect(option: PlotsTabOption) {
        const oldHorizontalGene = this.horzSelection.selectedGeneOption;
        const oldVerticalGene = this.vertSelection.selectedGeneOption;

        this.horzSelection.dataType = option.value;
        if (option.genericAssayDataType) {
            this.horzSelection.genericAssayDataType =
                option.genericAssayDataType;
        }

        this.viewLimitValues = true;
        this.selectionHistory.runHorizontalUpdaters(
            option.value,
            this.onHorizontalAxisGeneSelect,
            this.onHorizontalAxisGenesetSelect,
            this.onHorizontalAxisDataSourceSelect,
            this.onHorizontalAxisGenericAssaySelect
        );

        if (
            this.horzSelection.dataType &&
            !this.showGeneSelectBox(
                this.horzSelection.dataType,
                isGenericAssaySelected(this.horzSelection)
            ) &&
            oldVerticalGene &&
            oldVerticalGene.value == SAME_SELECTED_OPTION_NUMERICAL_VALUE
        ) {
            this.onVerticalAxisGeneSelect(oldHorizontalGene);
        }

        this.horzSelection.selectedCategories = [];

        this.autoChooseColoringMenuGene();
    }

    @action.bound
    public onVerticalAxisDataSourceSelect(option: PlotsTabOption) {
        this.vertSelection.selectedDataSourceOption = option;
        this.vertSelection.selectedGenericAssayOption = undefined;
        this.vertSelection.selectedCategories = [];
        this.viewLimitValues = true;
        this.selectionHistory.updateVerticalFromSelection(this.vertSelection);
        maybeSetLogScale(this.vertSelection);
        this.autoChooseColoringMenuGene();
    }

    @action.bound
    public onHorizontalAxisDataSourceSelect(option: PlotsTabOption) {
        this.horzSelection.selectedDataSourceOption = option;
        this.horzSelection.selectedGenericAssayOption = undefined;
        this.horzSelection.selectedCategories = [];
        this.viewLimitValues = true;
        this.selectionHistory.updateHorizontalFromSelection(this.horzSelection);
        maybeSetLogScale(this.horzSelection);
        this.autoChooseColoringMenuGene();
    }

    @computed get hasMolecularProfile() {
        return (dataType: string | undefined) =>
            dataType !== CLIN_ATTR_DATA_TYPE &&
            dataType !== CUSTOM_ATTR_DATA_TYPE &&
            dataType !== AlterationTypeConstants.GENERIC_ASSAY;
    }

    @action.bound
    autoChooseColoringMenuGene() {
        const currentSelectedGeneId = this.coloringMenuSelection.selectedOption
            ? this.coloringMenuSelection.selectedOption.info.entrezGeneId
            : undefined;
        if (this.oneAxisMolecularProfile) {
            // for one gene, switch the new gene for coloring
            const selectedGene = this.hasMolecularProfile(
                this.horzSelection.dataType
            )
                ? this.horzSelection.selectedGeneOption
                : this.vertSelection.selectedGeneOption;
            selectedGene && this.updateColoringMenuGene(selectedGene.value);

            // for two genes, if the current gene for coloring is not selected in either axis, switch to gene selection on x-axis
        } else if (
            this.bothAxesMolecularProfile &&
            this.horzSelection.selectedGeneOption &&
            currentSelectedGeneId !==
                this.horzSelection.selectedGeneOption.value &&
            this.vertSelection.selectedGeneOption &&
            currentSelectedGeneId !==
                this.vertSelection.selectedGeneOption.value
        ) {
            this.updateColoringMenuGene(
                this.horzSelection.selectedGeneOption.value
            );
        }

        // if selected gene for styling is switched fron 'None' to a new gene,
        // turn on coloring samples by 'Mutations'
        if (
            this.coloringMenuSelection.selectedOption &&
            this.coloringMenuSelection.selectedOption.info.entrezGeneId !==
                NONE_SELECTED_OPTION_NUMERICAL_VALUE &&
            !this.coloringMenuSelection.colorByCopyNumber &&
            !this.coloringMenuSelection.colorByMutationType
        ) {
            this.setColorByMutationType(true);
            this.setColorByCopyNumber(true);
        }
    }

    @action.bound
    public onVerticalAxisMutationCountBySelect(option: any) {
        this.vertSelection.mutationCountBy = option.value;
        this.viewLimitValues = true;
        this.autoChooseColoringMenuGene();
    }

    @action.bound
    public onHorizontalAxisMutationCountBySelect(option: any) {
        this.horzSelection.mutationCountBy = option.value;
        this.viewLimitValues = true;
        this.autoChooseColoringMenuGene();
    }

    @action.bound
    public onVerticalAxisStructuralVariantCountBySelect(option: any) {
        this.vertSelection.structuralVariantCountBy = option.value;
        this.viewLimitValues = true;
        this.autoChooseColoringMenuGene();
    }

    @action.bound
    public onHorizontalAxisStructuralVariantCountBySelect(option: any) {
        this.horzSelection.structuralVariantCountBy = option.value;
        this.viewLimitValues = true;
        this.autoChooseColoringMenuGene();
    }

    @action.bound
    private onDiscreteVsDiscretePlotTypeSelect(option: any) {
        this.discreteVsDiscretePlotType = option.value;
    }

    @action.bound
    private handleSortByChange(option: any) {
        this.sortByOption = option.value;
    }

    @action.bound
    private onSortOrderButtonPressed() {
        this._waterfallPlotSortOrder =
            this.waterfallPlotSortOrder === 'ASC' ? 'DESC' : 'ASC';
    }

    @action.bound
    private swapHorzVertSelections() {
        const keysToSwap: (keyof AxisMenuSelection)[] = [
            'dataType',
            'selectedDataSourceOption',
            'logScale',
            'mutationCountBy',
            'selectedCategories',
        ];

        // only swap genes if vertSelection is not set to "Same gene"
        if (
            !this.vertSelection.selectedGeneOption ||
            this.vertSelection.selectedGeneOption.value !==
                SAME_SELECTED_OPTION_NUMERICAL_VALUE
        ) {
            keysToSwap.push('selectedGeneOption');
        }

        // only swap gene sets if vertSelection is not set to "Same gene set"
        if (
            !this.vertSelection.selectedGenesetOption ||
            this.vertSelection.selectedGenesetOption.value !==
                SAME_SELECTED_OPTION_STRING_VALUE
        ) {
            keysToSwap.push('selectedGenesetOption');
        }

        // only swap generic assay if vertSelection is not set to "Same generic assay"
        if (
            !this.vertSelection.selectedGenericAssayOption ||
            this.vertSelection.selectedGenericAssayOption.value !==
                SAME_SELECTED_OPTION_STRING_VALUE
        ) {
            keysToSwap.push('selectedGenericAssayOption');
        }

        // have to store all values for swap because values depend on each other in derived data way so the copy can mess up if you do it one by one
        const horz = keysToSwap.map(k => this.horzSelection[k]);
        const vert = keysToSwap.map(k => this.vertSelection[k]);
        for (let i = 0; i < keysToSwap.length; i++) {
            (this.horzSelection as any)[keysToSwap[i]] = vert[i];
            (this.vertSelection as any)[keysToSwap[i]] = horz[i];
        }
    }

    private isAxisMolecularProfile(selection: AxisMenuSelection) {
        return (
            selection.dataType !== undefined &&
            selection.dataType !== NONE_SELECTED_OPTION_STRING_VALUE &&
            selection.dataType !== CLIN_ATTR_DATA_TYPE &&
            selection.dataType !== CUSTOM_ATTR_DATA_TYPE &&
            selection.dataType !== GENESET_DATA_TYPE &&
            !isGenericAssaySelected(selection)
        );
    }

    @computed get bothAxesMolecularProfile() {
        return (
            this.isAxisMolecularProfile(this.horzSelection) &&
            this.isAxisMolecularProfile(this.vertSelection)
        );
    }

    @computed get oneAxisMolecularProfile() {
        return (
            this.isAxisMolecularProfile(this.horzSelection) !==
            this.isAxisMolecularProfile(this.vertSelection)
        ); // XOR
    }

    @computed get sameGeneInBothAxes() {
        return (
            this.bothAxesMolecularProfile &&
            this.horzSelection.entrezGeneId === this.vertSelection.entrezGeneId
        );
    }

    @computed get canColorByCnaData() {
        return !!(
            this.cnaDataExists.result &&
            (this.potentialColoringType === PotentialColoringType.GenomicData ||
                this.potentialColoringType ===
                    PotentialColoringType.LimitValGenomicData)
        );
    }

    @computed get canColorBySVData() {
        return !!(
            this.svDataExists.result &&
            (this.potentialColoringType === PotentialColoringType.GenomicData ||
                this.potentialColoringType ===
                    PotentialColoringType.LimitValGenomicData)
        );
    }

    @computed get limitValuesCanBeShown(): boolean {
        return this.limitValueTypes.length > 0;
    }

    @computed get limitValueTypes(): string[] {
        return _.uniq(
            this.horzLimitValueTypes.concat(this.vertLimitValueTypes)
        );
    }

    @computed get horzLimitValueTypes(): string[] {
        if (
            this.horzAxisDataPromise.result &&
            this.horzSelection.dataType &&
            isGenericAssaySelected(this.horzSelection) &&
            this.horzSelection.genericAssayDataType ===
                DataTypeConstants.LIMITVALUE
        ) {
            return getLimitValues(this.horzAxisDataPromise.result.data);
        }
        return [] as string[];
    }

    @computed get horzLimitValuesCanBeShown(): boolean {
        return this.horzLimitValueTypes.length > 0;
    }

    @computed get vertLimitValueTypes(): string[] {
        if (
            this.vertAxisDataPromise.result &&
            this.vertSelection.dataType &&
            isGenericAssaySelected(this.vertSelection) &&
            this.vertSelection.genericAssayDataType ===
                DataTypeConstants.LIMITVALUE
        ) {
            return getLimitValues(this.vertAxisDataPromise.result.data);
        }
        return [] as string[];
    }

    @computed get vertLimitValuesCanBeShown(): boolean {
        return this.vertLimitValueTypes.length > 0;
    }

    @computed get legendLimitValueLabel() {
        return `value ${this.limitValueTypes.join(' or ')}${
            !this.isWaterfallPlot ? ' **' : ''
        }`;
    }

    @computed get vertMenuLimitValueLabel() {
        return `Value ${this.vertLimitValueTypes.join(' or ')} Labels${
            !this.isWaterfallPlot ? ' **' : ''
        }`;
    }

    @computed get horzMenuLimitValueLabel() {
        return `Value ${this.horzLimitValueTypes.join(' or ')} Labels${
            !this.isWaterfallPlot ? ' **' : ''
        }`;
    }

    readonly cnaPromiseForColoring = remoteData({
        await: () =>
            this.props.annotatedCnaCache.getAll(
                getCacheQueries(this.coloringMenuSelection)
            ),
        invoke: () => {
            const queries = getCacheQueries(this.coloringMenuSelection);
            if (queries.length > 0) {
                return Promise.resolve(
                    _.flatten(
                        this.props.annotatedCnaCache
                            .getAll(queries)
                            .map(p => p.result!)
                    )
                );
            } else {
                return Promise.resolve([]);
            }
        },
    });

    @computed get canColorByMutationData() {
        return !!(
            this.mutationDataExists.result &&
            this.potentialColoringType !== PotentialColoringType.None &&
            this.potentialColoringType !== PotentialColoringType.LimitVal
        );
    }

    readonly mutationPromiseForColoring = remoteData({
        await: () =>
            this.props.annotatedMutationCache.getAll(
                getCacheQueries(this.coloringMenuSelection)
            ),
        invoke: () => {
            return Promise.resolve(
                _.flatten(
                    this.props.annotatedMutationCache
                        .getAll(getCacheQueries(this.coloringMenuSelection))
                        .map(p => p.result!)
                ).filter(x => !!x)
            );
        },
    });

    readonly structuralVariantPromise = remoteData({
        await: () =>
            this.props.structuralVariantCache.getAll(
                getCacheQueries(this.coloringMenuSelection)
            ),
        invoke: () => {
            return Promise.resolve(
                _.flatten(
                    this.props.structuralVariantCache
                        .getAll(getCacheQueries(this.coloringMenuSelection))
                        .map(p => p.result!)
                ).filter(x => !!x)
            );
        },
    });

    @computed get mutationDataForColoring() {
        if (this.mutationDataExists.result) {
            return {
                molecularProfileIds: _.values(
                    this.props.studyToMutationMolecularProfile.result!
                ).map(p => p.molecularProfileId),
                data: this.mutationPromiseForColoring.result!,
            };
        } else {
            return undefined;
        }
    }

    @computed get cnaDataForColoring() {
        if (this.cnaDataExists.result) {
            return {
                molecularProfileIds: _.values(
                    this.props.studyToMolecularProfileDiscreteCna.result!
                ).map(p => p.molecularProfileId),
                data: this.cnaPromiseForColoring.result!,
            };
        } else {
            return undefined;
        }
    }

    @computed get clinicalDataForColoring() {
        let clinicalData;
        if (
            this.coloringMenuSelection.selectedOption &&
            this.coloringMenuSelection.selectedOption.info.clinicalAttribute
        ) {
            const promise = this.props.clinicalDataCache.get(
                this.coloringMenuSelection.selectedOption.info.clinicalAttribute
            );
            clinicalData = promise.result!.data as ClinicalData[];
        }
        return (
            clinicalData && {
                clinicalAttribute: this.coloringMenuSelection.selectedOption!
                    .info.clinicalAttribute!,
                data: clinicalData,
            }
        );
    }

    @computed get plotDataExistsForTwoAxes() {
        return (
            this.horzAxisDataPromise.isComplete &&
            this.horzAxisDataPromise.result!.data.length > 0 &&
            this.vertAxisDataPromise.isComplete &&
            this.vertAxisDataPromise.result!.data.length > 0
        );
    }

    @computed get horzAxisDataPromise() {
        return makeAxisDataPromise(
            this.horzSelection,
            this.clinicalAttributeIdToClinicalAttribute,
            this.customAttributeIdToClinicalAttribute,
            this.props.molecularProfileIdSuffixToMolecularProfiles,
            this.props.patientKeyToFilteredSamples,
            this.props.entrezGeneIdToGene,
            this.props.clinicalDataCache,
            this.props.annotatedMutationCache,
            this.props.structuralVariantCache,
            this.props.numericGeneMolecularDataCache,
            this.props.coverageInformation,
            this.props.filteredSamples,
            this.props.genesetMolecularDataCache,
            this.props.genericAssayMolecularDataCache
        );
    }

    readonly horzAxisCategories = remoteData({
        await: () => [this.horzAxisDataPromise],
        invoke: () => {
            return Promise.resolve(
                getCategoryOptions(this.horzAxisDataPromise.result!)
            );
        },
    });

    @computed get vertAxisDataPromise() {
        return makeAxisDataPromise(
            this.vertSelection,
            this.clinicalAttributeIdToClinicalAttribute,
            this.customAttributeIdToClinicalAttribute,
            this.props.molecularProfileIdSuffixToMolecularProfiles,
            this.props.patientKeyToFilteredSamples,
            this.props.entrezGeneIdToGene,
            this.props.clinicalDataCache,
            this.props.annotatedMutationCache,
            this.props.structuralVariantCache,
            this.props.numericGeneMolecularDataCache,
            this.props.coverageInformation,
            this.props.filteredSamples,
            this.props.genesetMolecularDataCache,
            this.props.genericAssayMolecularDataCache
        );
    }

    readonly vertAxisCategories = remoteData({
        await: () => [this.vertAxisDataPromise],
        invoke: () => {
            return Promise.resolve(
                getCategoryOptions(this.vertAxisDataPromise.result!)
            );
        },
    });

    @computed get vertAxisDataHasNegativeNumbers(): boolean {
        if (
            this.vertAxisDataPromise.isComplete &&
            this.vertAxisDataPromise.result
        ) {
            return axisHasNegativeNumbers(this.vertAxisDataPromise.result);
        }
        return false;
    }

    @computed get horzAxisDataHasNegativeNumbers(): boolean {
        if (
            this.horzAxisDataPromise.isComplete &&
            this.horzAxisDataPromise.result
        ) {
            return axisHasNegativeNumbers(this.horzAxisDataPromise.result);
        }
        return false;
    }

    readonly mutationDataExists = remoteData({
        await: () => [this.props.studyToMutationMolecularProfile],
        invoke: () => {
            return Promise.resolve(
                _.values(this.props.studyToMutationMolecularProfile.result)
                    .length > 0
            );
        },
    });

    readonly cnaDataExists = remoteData({
        await: () => [this.props.studyToMolecularProfileDiscreteCna],
        invoke: () => {
            return Promise.resolve(
                _.values(this.props.studyToMolecularProfileDiscreteCna.result)
                    .length > 0
            );
        },
    });

    readonly svDataExists = remoteData({
        await: () => [this.props.studyToStructuralVariantMolecularProfile],
        invoke: () => {
            return Promise.resolve(
                _.values(
                    this.props.studyToStructuralVariantMolecularProfile.result
                ).length > 0
            );
        },
    });

    readonly horzLabel = remoteData({
        await: () => [
            this.props.molecularProfileIdSuffixToMolecularProfiles,
            this.props.entrezGeneIdToGene,
            this.clinicalAttributeIdToClinicalAttribute,
            this.customAttributeIdToClinicalAttribute,
            this.plotType,
        ],
        invoke: () => {
            return Promise.resolve(
                getAxisLabel(
                    this.horzSelection,
                    this.props.molecularProfileIdSuffixToMolecularProfiles
                        .result!,
                    this.props.entrezGeneIdToGene.result!,
                    this.clinicalAttributeIdToClinicalAttribute.result!,
                    this.customAttributeIdToClinicalAttribute.result!,
                    this.horzLogScaleFunction
                )
            );
        },
    });

    readonly vertLabel = remoteData({
        await: () => [
            this.props.molecularProfileIdSuffixToMolecularProfiles,
            this.props.entrezGeneIdToGene,
            this.clinicalAttributeIdToClinicalAttribute,
            this.customAttributeIdToClinicalAttribute,
        ],
        invoke: () => {
            return Promise.resolve(
                getAxisLabel(
                    this.vertSelection,
                    this.props.molecularProfileIdSuffixToMolecularProfiles
                        .result!,
                    this.props.entrezGeneIdToGene.result!,
                    this.clinicalAttributeIdToClinicalAttribute.result!,
                    this.customAttributeIdToClinicalAttribute.result!,
                    this.vertLogScaleFunction
                )
            );
        },
    });

    readonly waterfallLabel = remoteData({
        await: () => [
            this.props.molecularProfileIdSuffixToMolecularProfiles,
            this.props.entrezGeneIdToGene,
            this.clinicalAttributeIdToClinicalAttribute,
            this.customAttributeIdToClinicalAttribute,
            this.plotType,
        ],
        invoke: () => {
            const selection = this.isHorizontalWaterfallPlot
                ? this.horzSelection
                : this.vertSelection;
            const logScaleFunc = this.isHorizontalWaterfallPlot
                ? this.horzLogScaleFunction
                : this.vertLogScaleFunction;

            return Promise.resolve(
                getAxisLabel(
                    selection,
                    this.props.molecularProfileIdSuffixToMolecularProfiles
                        .result!,
                    this.props.entrezGeneIdToGene.result!,
                    this.clinicalAttributeIdToClinicalAttribute.result!,
                    this.customAttributeIdToClinicalAttribute.result!,
                    logScaleFunc
                )
            );
        },
    });

    @computed get waterfallPlotWidth(): number {
        const noSamples = this.waterfallPlotData.isComplete
            ? this.waterfallPlotData.result.data.length
            : 0;
        if (this.isHorizontalWaterfallPlot) {
            return WATERFALLPLOT_SIDELENGTH;
        }
        return (
            WATERFALLPLOT_BASE_SIDELENGTH +
            Math.round(
                noSamples *
                    WATERFALLPLOT_SIDELENGTH_SAMPLE_MULTIPLICATION_FACTOR
            )
        );
    }

    @computed get waterfallPlotHeigth(): number {
        const noSamples = this.waterfallPlotData.isComplete
            ? this.waterfallPlotData.result.data.length
            : 0;
        if (this.isHorizontalWaterfallPlot) {
            return (
                WATERFALLPLOT_BASE_SIDELENGTH +
                Math.round(
                    noSamples *
                        WATERFALLPLOT_SIDELENGTH_SAMPLE_MULTIPLICATION_FACTOR
                )
            );
        }
        return WATERFALLPLOT_SIDELENGTH;
    }

    @computed get scatterPlotAppearance() {
        return makeScatterPlotPointAppearance(
            this.coloringTypes,
            this.mutationDataExists.result!,
            this.cnaDataExists.result!,
            this.svDataExists.result!,
            this.props.driverAnnotationSettings.driversAnnotated,
            this.coloringMenuSelection.selectedOption,
            this.props.clinicalDataCache,
            this.coloringLogScale
        );
    }

    @computed get scatterPlotFill() {
        if (
            ColoringType.MutationType in this.coloringTypes ||
            ColoringType.ClinicalData in this.coloringTypes
        ) {
            return (d: IPlotSampleData) => this.scatterPlotAppearance(d).fill!;
        } else if (ColoringType.CopyNumber in this.coloringTypes) {
            return '#000';
        } else {
            return basicAppearance.fill;
        }
    }

    @computed get scatterPlotFillOpacity() {
        if (
            ColoringType.MutationType in this.coloringTypes ||
            ColoringType.ClinicalData in this.coloringTypes ||
            _.isEmpty(this.coloringTypes)
        ) {
            return 1;
        } else {
            return 0;
        }
    }

    @autobind
    private scatterPlotStroke(d: IPlotSampleData) {
        return this.scatterPlotAppearance(d).stroke;
    }

    @computed get scatterPlotStrokeWidth() {
        if (
            ColoringType.CopyNumber in this.coloringTypes ||
            ColoringType.StructuralVariant in this.coloringTypes
        ) {
            return CNA_STROKE_WIDTH;
        } else {
            return 1;
        }
    }

    @autobind
    private scatterPlotStrokeOpacity(d: IPlotSampleData) {
        return this.scatterPlotAppearance(d).strokeOpacity;
    }

    @autobind
    private scatterPlotSymbol(d: IPlotSampleData) {
        return this.scatterPlotAppearance(d).symbol || 'circle';
    }

    @autobind
    private waterfallPlotColor(d: IPlotSampleData) {
        // With the waterfall plot genomic coloring is mutually exclusive. Therefore,
        // combined viewTypes do not exist for this plot type and are not evaluated.
        if (
            ColoringType.CopyNumber in this.coloringTypes ||
            ColoringType.StructuralVariant in this.coloringTypes
        ) {
            return this.scatterPlotStroke(d);
        } else if (
            ColoringType.MutationType in this.coloringTypes ||
            ColoringType.ClinicalData in this.coloringTypes
        ) {
            return this.scatterPlotAppearance(d).fill!;
        } else {
            return basicAppearance.fill;
        }
    }

    @autobind
    private waterfallPlotLimitValueSymbolVisibility(d: IPlotSampleData) {
        if (ColoringType.LimitVal in this.coloringTypes) {
            return dataPointIsLimited(d);
        } else {
            return false;
        }
    }

    @autobind
    private scatterPlotTooltip(d: IScatterPlotData) {
        return scatterPlotTooltip(
            d,
            this.props.studyIdToStudy || {},
            this.horzLogScaleFunction,
            this.vertLogScaleFunction,
            this.coloringMenuSelection.selectedOption &&
                this.coloringMenuSelection.selectedOption.info.clinicalAttribute
        );
    }

    @autobind
    private waterfallPlotTooltip(d: IWaterfallPlotData) {
        return waterfallPlotTooltip(
            d,
            this.props.studyIdToStudy || {},
            this.coloringMenuSelection.selectedOption &&
                this.coloringMenuSelection.selectedOption.info.clinicalAttribute
        );
    }

    @computed get boxPlotTooltip() {
        return (d: IBoxScatterPlotPoint) => {
            let content;
            if (this.boxPlotData.isComplete) {
                content = boxPlotTooltip(
                    d,
                    this.props.studyIdToStudy || {},
                    this.boxPlotData.result.horizontal,
                    this.boxPlotData.result.horizontal
                        ? this.horzLogScaleFunction
                        : this.vertLogScaleFunction,
                    this.coloringMenuSelection.selectedOption &&
                        this.coloringMenuSelection.selectedOption.info
                            .clinicalAttribute
                );
            } else {
                content = (
                    <span>
                        Loading... (this shouldnt appear because the box plot
                        shouldnt be visible)
                    </span>
                );
            }
            return content;
        };
    }

    @computed get searchMutationWords() {
        return this.searchMutation
            .trim()
            .split(/\s+/g)
            .filter((m: string) => !!m.length);
    }

    @computed get scatterPlotHighlight() {
        // need to regenerate the function whenever these change in order to trigger immediate Victory rerender
        const searchCaseWords = this.searchCase.trim().split(/\s+/g);
        const searchMutationWords = this.searchMutationWords;
        const searchHighlight = (d: IPlotSampleData) => {
            let caseMatch = false;
            for (const word of searchCaseWords) {
                caseMatch =
                    caseMatch ||
                    (!!word.length && d.sampleId.indexOf(word) > -1);
                if (caseMatch) {
                    break;
                }
            }
            let mutationMatch = false;
            for (const word of searchMutationWords) {
                mutationMatch =
                    mutationMatch || this.fDatumHasMutation(d, word);
                if (mutationMatch) {
                    break;
                }
            }
            return caseMatch || mutationMatch;
        };
        const selectedSampleIdsSet = new Set(
            this.selectedData.map(d => d.uniqueSampleKey)
        );
        const dataSelectionHighlight = (d: IPlotSampleData) => {
            return selectedSampleIdsSet.has(d.uniqueSampleKey);
        };
        const highlightFunctions = [
            searchHighlight,
            dataSelectionHighlight,
            ...Array.from(this.highlightedLegendItems.values()).map(
                x => x.highlighting!.isDatumHighlighted
            ),
        ];
        return (d: IPlotSampleData) => {
            return _.some(highlightFunctions, f => f(d));
        };
    }

    private fDatumHasMutation = (d: IPlotSampleData, word: string) => {
        const searchWordRegex = new RegExp(word, 'i');
        return (
            !!word &&
            !!d.mutations.find(
                m =>
                    !!(m.proteinChange && searchWordRegex.test(m.proteinChange))
            )
        );
    };

    @computed get showMutationNotFoundMessage(): boolean {
        let showMessage = false;
        if (
            this.searchMutationWords.length > 0 &&
            this.waterfallPlotIsShown &&
            this.waterfallPlotData.isComplete
        ) {
            showMessage = true;
            _.each(this.searchMutationWords, (word: string) => {
                const dataPoints = this.waterfallPlotData.result!.data;
                if (
                    _.some(dataPoints, (d: any) =>
                        this.fDatumHasMutation(d, word)
                    )
                ) {
                    showMessage = false;
                }
            });
        }
        return showMessage;
    }

    isDisabledAxisLogCheckbox(vertical: boolean): boolean {
        const axisSelection = vertical
            ? this.vertSelection
            : this.horzSelection;

        // dont disable the log box for rna_seq even if there are
        //  negative values
        const isValidMrnaProfile =
            axisSelection.dataType ===
                AlterationTypeConstants.MRNA_EXPRESSION &&
            axisSelection.dataSourceId &&
            logScalePossibleForProfile(axisSelection.dataSourceId);

        const hasNegativeNumbers = vertical
            ? this.vertAxisDataHasNegativeNumbers
            : this.horzAxisDataHasNegativeNumbers;

        return !isValidMrnaProfile && hasNegativeNumbers;
    }

    private isGeneProfiled(
        gene: string,
        coverageInformation?: CoverageInformation
    ) {
        const samples =
            coverageInformation?.samples ||
            this.props.coverageInformation.result?.samples;
        if (samples) {
            return Object.values(samples).some(
                s => !_.isEmpty(s.allGenes) || !!s.byGene[gene]
            );
        }
        return false;
    }

    private getAxisMenu(
        vertical: boolean,
        dataSourceOptionsByType: {
            [type: string]: { value: string; label: string }[];
        }
    ) {
        const axisSelection = vertical
            ? this.vertSelection
            : this.horzSelection;
        if (
            (axisSelection.dataType === CLIN_ATTR_DATA_TYPE &&
                !this.clinicalAttributeIdToClinicalAttribute.isComplete) ||
            (axisSelection.dataType !== CLIN_ATTR_DATA_TYPE &&
                axisSelection.dataType !==
                    AlterationTypeConstants.MUTATION_EXTENDED &&
                !this.props.molecularProfileIdSuffixToMolecularProfiles
                    .isComplete) ||
            (axisSelection.dataType &&
                isGenericAssaySelected(axisSelection) &&
                !this.horzGenericAssayOptions.isComplete)
        ) {
            return <LoadingIndicator isLoading={true} />;
        }

        const dataTestWhichAxis = vertical ? 'Vertical' : 'Horizontal';

        let dataSourceLabel = 'Profile';
        let dataSourceValue = axisSelection.dataSourceId;
        let dataSourceOptions =
            (axisSelection.dataType
                ? dataSourceOptionsByType[axisSelection.dataType]
                : []) || [];
        let onDataSourceChange = vertical
            ? this.onVerticalAxisDataSourceSelect
            : this.onHorizontalAxisDataSourceSelect;

        const isBoxPlotWithMoreThanOneCategory =
            this.plotType.isComplete && // boxplot
            this.plotType.result === PlotType.BoxPlot &&
            this.defaultSortedBoxPlotData.isComplete && // [note: use defaultSorted so that the checkbox doesnt flicker while resorting boxPlotData]
            this.defaultSortedBoxPlotData.result.data.length > 1; // with more than one category
        const axisDataPromise = vertical
            ? this.vertAxisDataPromise
            : this.horzAxisDataPromise;
        const axisIsStringData =
            axisDataPromise.isComplete && isStringData(axisDataPromise.result!);

        // some structural variant data lacks variantClass data.  if none of the SV data has variantClass, then we
        // we don't want to allow the data to be viewed by variantClass (Variant Type in UI) so remove
        // that from the options
        const filterStructuralVariantOptions = _.every(
            this.props.structuralVariants,
            sv => {
                return !sv.variantClass || sv.variantClass === 'NA';
            }
        )
            ? structuralVariantCountByOptions.filter(
                  option =>
                      option.value !== StructuralVariantCountBy.VariantType
              )
            : structuralVariantCountByOptions;

        switch (axisSelection.dataType) {
            case CUSTOM_ATTR_DATA_TYPE:
                dataSourceLabel = 'Custom Attribute';
                break;
            case CLIN_ATTR_DATA_TYPE:
                dataSourceLabel = 'Clinical Attribute';
                break;
            case AlterationTypeConstants.MUTATION_EXTENDED:
                dataSourceLabel = 'Plot Mutations by';
                dataSourceValue = axisSelection.mutationCountBy;
                dataSourceOptions = mutationCountByOptions;
                onDataSourceChange = vertical
                    ? this.onVerticalAxisMutationCountBySelect
                    : this.onHorizontalAxisMutationCountBySelect;
                break;
            case AlterationTypeConstants.STRUCTURAL_VARIANT:
                dataSourceLabel = 'Plot Structural variants by';
                dataSourceValue = axisSelection.structuralVariantCountBy;
                dataSourceOptions = filterStructuralVariantOptions;
                onDataSourceChange = vertical
                    ? this.onVerticalAxisStructuralVariantCountBySelect
                    : this.onHorizontalAxisStructuralVariantCountBySelect;
                break;
            case undefined:
                break;
            default:
                dataSourceLabel = `${
                    isGenericAssaySelected(axisSelection)
                        ? deriveDisplayTextFromGenericAssayType(
                              axisSelection.dataType!
                          )
                        : dataTypeToDisplayType[axisSelection.dataType!]
                } Profile`;
                break;
        }

        let dataSourceDescription: string = '';
        if (
            dataSourceValue &&
            axisSelection.dataType !==
                AlterationTypeConstants.MUTATION_EXTENDED &&
            axisSelection.dataType !==
                AlterationTypeConstants.STRUCTURAL_VARIANT
        ) {
            if (axisSelection.dataType === CLIN_ATTR_DATA_TYPE) {
                dataSourceDescription = this
                    .clinicalAttributeIdToClinicalAttribute.result![
                    dataSourceValue
                ].description;
            } else if (axisSelection.dataType === CUSTOM_ATTR_DATA_TYPE) {
                dataSourceDescription = this
                    .customAttributeIdToClinicalAttribute.result![
                    dataSourceValue
                ].description;
            } else {
                dataSourceDescription = this.props
                    .molecularProfileIdSuffixToMolecularProfiles.result![
                    dataSourceValue
                ][0].description;
            }
        }

        let dataTypeDescription: string = '';
        if (axisSelection.dataType === NONE_SELECTED_OPTION_STRING_VALUE) {
            const otherDataSourceId = vertical
                ? this.horzSelection.dataSourceId
                : this.vertSelection.dataSourceId;
            const otherProfileName = this.props
                .molecularProfileIdSuffixToMolecularProfiles.result![
                otherDataSourceId!
            ][0].name;
            dataTypeDescription = `Sample order determined by values on the '${otherProfileName}' axis`;
        }

        // generic assay description
        let genericAssayDescription: string = '';
        let genericAssayUrl: string = '';
        const selectedGenericAssayEntityId = vertical
            ? this.vertSelection.genericAssayEntityId
            : this.horzSelection.genericAssayEntityId;
        if (
            axisSelection.dataType &&
            isGenericAssaySelected(axisSelection) &&
            selectedGenericAssayEntityId &&
            this.genericEntitiesGroupByEntityId.isComplete
        ) {
            const entity = this.genericEntitiesGroupByEntityId.result![
                selectedGenericAssayEntityId
            ];
            genericAssayDescription = getGenericAssayMetaPropertyOrDefault(
                entity,
                COMMON_GENERIC_ASSAY_PROPERTY.DESCRIPTION,
                ''
            );
            genericAssayUrl = getGenericAssayMetaPropertyOrDefault(
                entity,
                COMMON_GENERIC_ASSAY_PROPERTY.URL,
                ''
            );
        }

        // generic assay options
        let genericAssayOptions: any[] = [];
        let selectedEntities: string[] = [];
        if (
            axisSelection.dataType &&
            this.selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl &&
            this.selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl[
                axisSelection.dataType
            ]
        ) {
            selectedEntities = this
                .selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl[
                axisSelection.dataType
            ];
        }
        let genericAssayOptionsCount: number = 0;
        let filteredGenericAssayOptionsCount: number = 0;
        if (vertical && this.vertGenericAssayOptions.result) {
            genericAssayOptions =
                this.makeGenericAssayGroupOptions(
                    this.vertGenericAssayOptions.result,
                    selectedEntities,
                    this._vertGenericAssaySearchText,
                    this.props.hugoGeneSymbols,
                    this.horzSelection.selectedGeneOption?.label,
                    GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
                        axisSelection.dataType!
                    ]?.globalConfig?.geneRelatedGenericAssayType
                ) || [];
            // generate statistics for options
            genericAssayOptionsCount = this.vertGenericAssayOptions.result
                .length;
            const selectedOptions = this.vertGenericAssayOptions.result.filter(
                option => selectedEntities.includes(option.value)
            );
            const otherEntities = _.difference(
                this.vertGenericAssayOptions.result,
                selectedOptions
            );
            filteredGenericAssayOptionsCount = otherEntities.filter(option =>
                doesOptionMatchSearchText(
                    this._vertGenericAssaySearchText,
                    option
                )
            ).length;
        } else if (!vertical && this.horzGenericAssayOptions.result) {
            genericAssayOptions =
                this.makeGenericAssayGroupOptions(
                    this.horzGenericAssayOptions.result,
                    selectedEntities,
                    this._horzGenericAssaySearchText,
                    this.props.hugoGeneSymbols,
                    this.vertSelection.selectedGeneOption?.label,
                    GENERIC_ASSAY_CONFIG.genericAssayConfigByType[
                        axisSelection.dataType!
                    ]?.globalConfig?.geneRelatedGenericAssayType
                ) || [];
            // generate statistics for options
            genericAssayOptionsCount = this.horzGenericAssayOptions.result
                .length;
            const selectedOptions = this.horzGenericAssayOptions.result.filter(
                option => selectedEntities.includes(option.value)
            );
            const otherEntities = _.difference(
                this.horzGenericAssayOptions.result,
                selectedOptions
            );
            filteredGenericAssayOptionsCount = otherEntities.filter(option =>
                doesOptionMatchSearchText(
                    this._horzGenericAssaySearchText,
                    option
                )
            ).length;
        }

        const axisCategoriesPromise = vertical
            ? this.vertAxisCategories
            : this.horzAxisCategories;

        let optionsWithProfiledStatus, loadOptions;
        if (this.props.hasNoQueriedGenes) {
            loadOptions = async (inputText: string, callback: any) => {
                if (!inputText) {
                    callback([]);
                }
                const stringCompare = (item: any) =>
                    item.label.startsWith(inputText.toUpperCase());
                let options =
                    (vertical
                        ? this.vertGeneOptions.result
                        : this.horzGeneOptions.result) || [];
                options = options.filter(stringCompare).slice(0, 10);
                const genes = await fetchGenes(options.map(o => o.label));
                const coverageInformationPromise = getCoverageInformation(
                    this.props.genePanelDataForAllProfiles!,
                    this.props.sampleKeyToSample.result!,
                    this.props.patients.result!,
                    genes
                );
                const coverageInformation = await coverageInformationPromise.then(
                    (coverageInformation: CoverageInformation) => {
                        return coverageInformation;
                    }
                );
                options = options.map(g =>
                    getOption(
                        g,
                        this.isGeneProfiled(g.label, coverageInformation)
                    )
                );
                callback(options);
            };
        } else {
            let options =
                (vertical
                    ? this.vertGeneOptions.result
                    : this.horzGeneOptions.result) || [];
            optionsWithProfiledStatus = options.map(g =>
                getOption(g, this.isGeneProfiled(g.label))
            );
        }

        return (
            <form className="main-form">
                <h4 className="tab-title">
                    {vertical ? 'Vertical' : 'Horizontal'} Axis
                </h4>
                <div>
                    <div style={{ marginBottom: '5px' }} className="form-group">
                        <label className="label-text">Data Type</label>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <ReactSelect
                                aria-label="Data Type Dropdown"
                                name={`${
                                    vertical ? 'v' : 'h'
                                }-profile-type-selector`}
                                value={axisSelection.dataType}
                                onChange={
                                    vertical
                                        ? this.onVerticalAxisDataTypeSelect
                                        : this.onHorizontalAxisDataTypeSelect
                                }
                                options={
                                    (vertical
                                        ? this.vertDatatypeOptions.result
                                        : this.horzDatatypeOptions.result) || []
                                }
                                clearable={false}
                                searchable={false}
                            />
                            {dataTypeDescription && (
                                <InfoIcon
                                    tooltip={<span>{dataTypeDescription}</span>}
                                    tooltipPlacement="right"
                                    style={{ marginLeft: 7 }}
                                />
                            )}
                        </div>
                    </div>
                    {this.showSortOrderButton(!vertical) && (
                        <div className="checkbox">
                            <label>
                                <Button
                                    className="btn btn-default sort-order"
                                    data-test="changeSortOrderButton"
                                    type="button"
                                    onClick={this.onSortOrderButtonPressed}
                                >
                                    <i
                                        className={this.sortOrderImageClassName}
                                    />
                                </Button>
                                Sort Order
                            </label>
                        </div>
                    )}
                    {axisSelection.dataType &&
                        this.showDatasourceBox(axisSelection.dataType) && (
                            <div
                                style={{ marginBottom: '5px' }}
                                className="form-group"
                            >
                                <label className="label-text">
                                    {dataSourceLabel}
                                </label>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <ReactSelect
                                        aria-label={`${dataSourceLabel} Dropdown`}
                                        className="data-source-id"
                                        name={`${
                                            vertical ? 'v' : 'h'
                                        }-profile-name-selector`}
                                        value={dataSourceValue}
                                        onChange={onDataSourceChange}
                                        options={dataSourceOptions}
                                        clearable={false}
                                        searchable={true}
                                    />
                                    {dataSourceDescription && (
                                        <InfoIcon
                                            tooltip={
                                                <span>
                                                    {dataSourceDescription}
                                                </span>
                                            }
                                            tooltipPlacement="right"
                                            style={{ marginLeft: 7 }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    {logScalePossible(
                        axisSelection,
                        axisDataPromise.result
                    ) && (
                        <div className="checkbox">
                            <label>
                                <input
                                    data-test={`${dataTestWhichAxis}LogCheckbox`}
                                    type="checkbox"
                                    name={
                                        vertical
                                            ? 'vert_logScale'
                                            : 'horz_logScale'
                                    }
                                    value={
                                        vertical
                                            ? EventKey.vert_logScale
                                            : EventKey.horz_logScale
                                    }
                                    checked={
                                        axisSelection.logScale &&
                                        !this.isDisabledAxisLogCheckbox(
                                            vertical
                                        )
                                    }
                                    disabled={this.isDisabledAxisLogCheckbox(
                                        vertical
                                    )}
                                    onClick={this.onInputClick}
                                />
                                Log Scale
                            </label>
                        </div>
                    )}
                    {((vertical && this.vertLimitValuesCanBeShown) ||
                        (!vertical && this.horzLimitValuesCanBeShown)) && (
                        <div className="checkbox color-samples-toolbar-elt">
                            <label className="limit-value-label">
                                <input
                                    data-test="ViewLimitValues"
                                    type="checkbox"
                                    name="utilities_viewLimitValues"
                                    value={EventKey.utilities_viewLimitValues}
                                    checked={this.viewLimitValues}
                                    onClick={this.onInputClick}
                                    disabled={
                                        (vertical &&
                                            !this.vertLimitValuesCanBeShown) ||
                                        (!vertical &&
                                            !this.horzLimitValuesCanBeShown)
                                    }
                                />
                                {vertical
                                    ? this.vertMenuLimitValueLabel
                                    : this.horzMenuLimitValueLabel}
                            </label>
                        </div>
                    )}
                    {axisSelection.dataType &&
                        this.showGeneSelectBox(
                            axisSelection.dataType,
                            isGenericAssaySelected(axisSelection)
                        ) && (
                            <div
                                className="form-group"
                                style={{
                                    display:
                                        axisSelection.dataType ===
                                            CLIN_ATTR_DATA_TYPE ||
                                        axisSelection.dataType ===
                                            CUSTOM_ATTR_DATA_TYPE
                                            ? 'none'
                                            : 'block',
                                }}
                            >
                                <label>Gene</label>
                                <div className="Select">
                                    <If
                                        condition={this.props.hasNoQueriedGenes}
                                    >
                                        <Then>
                                            <AsyncSelect
                                                aria-label="Gene Search Dropdown"
                                                name={`${
                                                    vertical ? 'v' : 'h'
                                                }-gene-selector`}
                                                value={
                                                    axisSelection.selectedGeneOption
                                                        ? axisSelection.selectedGeneOption
                                                        : undefined
                                                }
                                                onChange={
                                                    vertical
                                                        ? this
                                                              .onVerticalAxisGeneSelect
                                                        : this
                                                              .onHorizontalAxisGeneSelect
                                                }
                                                isLoading={
                                                    this.horzGeneOptions
                                                        .isPending
                                                }
                                                noOptionsMessage={() =>
                                                    'Search for gene'
                                                }
                                                clearable={false}
                                                searchable={false}
                                                disabled={
                                                    axisSelection.dataType ===
                                                        CLIN_ATTR_DATA_TYPE ||
                                                    axisSelection.dataType ===
                                                        GENESET_DATA_TYPE ||
                                                    axisSelection.dataType ===
                                                        CUSTOM_ATTR_DATA_TYPE
                                                }
                                                loadOptions={loadOptions}
                                                cacheOptions={true}
                                            />
                                        </Then>
                                        <Else>
                                            <ReactSelect
                                                name={`${
                                                    vertical ? 'v' : 'h'
                                                }-gene-selector`}
                                                value={
                                                    axisSelection.selectedGeneOption
                                                        ? axisSelection
                                                              .selectedGeneOption
                                                              .value
                                                        : undefined
                                                }
                                                onChange={
                                                    vertical
                                                        ? this
                                                              .onVerticalAxisGeneSelect
                                                        : this
                                                              .onHorizontalAxisGeneSelect
                                                }
                                                isLoading={
                                                    this.horzGeneOptions
                                                        .isPending
                                                }
                                                options={
                                                    optionsWithProfiledStatus
                                                }
                                                clearable={false}
                                                searchable={false}
                                                disabled={
                                                    axisSelection.dataType ===
                                                        CLIN_ATTR_DATA_TYPE ||
                                                    axisSelection.dataType ===
                                                        GENESET_DATA_TYPE ||
                                                    axisSelection.dataType ===
                                                        CUSTOM_ATTR_DATA_TYPE
                                                }
                                            />
                                        </Else>
                                    </If>
                                </div>
                            </div>
                        )}
                    {axisSelection.dataType &&
                        this.showGenesetSelectBox(axisSelection.dataType) && (
                            <div className="form-group" style={{ opacity: 1 }}>
                                <label>Gene Set</label>
                                <div style={{ display: 'flex' }}>
                                    <ReactSelect
                                        name={`${
                                            vertical ? 'v' : 'h'
                                        }-geneset-selector`}
                                        value={
                                            axisSelection.selectedGenesetOption
                                                ? axisSelection
                                                      .selectedGenesetOption
                                                      .value
                                                : undefined
                                        }
                                        onChange={
                                            vertical
                                                ? this
                                                      .onVerticalAxisGenesetSelect
                                                : this
                                                      .onHorizontalAxisGenesetSelect
                                        }
                                        isLoading={
                                            this.horzGenesetOptions.isPending
                                        }
                                        options={
                                            (vertical
                                                ? this.vertGenesetOptions.result
                                                : this.horzGenesetOptions
                                                      .result) || []
                                        }
                                        clearable={false}
                                        searchable={false}
                                        disabled={
                                            axisSelection.dataType !==
                                            GENESET_DATA_TYPE
                                        }
                                    />
                                </div>
                            </div>
                        )}
                    {axisSelection.dataType &&
                        this.showGenericAssaySelectBox(
                            axisSelection.dataType,
                            isGenericAssaySelected(axisSelection)
                        ) && (
                            <div className="form-group" style={{ opacity: 1 }}>
                                <label>
                                    {deriveDisplayTextFromGenericAssayType(
                                        axisSelection.dataType,
                                        true
                                    )}
                                </label>
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <Select
                                        name={`${
                                            vertical ? 'v' : 'h'
                                        }-generic-assay-selector`}
                                        className="genericAssaySelectBox"
                                        value={
                                            axisSelection.selectedGenericAssayOption
                                                ? axisSelection.selectedGenericAssayOption
                                                : undefined
                                        }
                                        onChange={
                                            vertical
                                                ? this
                                                      .onVerticalAxisGenericAssaySelect
                                                : this
                                                      .onHorizontalAxisGenericAssaySelect
                                        }
                                        isLoading={
                                            this.horzGenericAssayOptions
                                                .isPending ||
                                            this.props
                                                .genericAssayEntitiesGroupByMolecularProfileId
                                                .isPending
                                        }
                                        options={genericAssayOptions}
                                        formatGroupLabel={(data: any) => {
                                            return (
                                                <div>
                                                    <span>{data.label}</span>
                                                </div>
                                            );
                                        }}
                                        blurInputOnSelect={true}
                                        clearable={false}
                                        searchable={true}
                                        disabled={
                                            axisSelection.dataType ===
                                                undefined ||
                                            axisSelection.dataType ===
                                                CLIN_ATTR_DATA_TYPE ||
                                            axisSelection.dataType ===
                                                CUSTOM_ATTR_DATA_TYPE ||
                                            !isGenericAssaySelected(
                                                axisSelection
                                            )
                                        }
                                        onInputChange={
                                            vertical
                                                ? this
                                                      .onVerticalAxisGenericAssayInputChange
                                                : this
                                                      .onHorizontalAxisGenericAssayInputChange
                                        }
                                        components={{
                                            MenuList: MenuList,
                                            MenuListHeader: (
                                                <MenuListHeader
                                                    current={
                                                        filteredGenericAssayOptionsCount
                                                    }
                                                    total={
                                                        genericAssayOptionsCount
                                                    }
                                                />
                                            ),
                                        }}
                                    />
                                    {genericAssayDescription && (
                                        <div data-test="generic-assay-info-icon">
                                            <InfoIcon
                                                tooltip={
                                                    <div>
                                                        {genericAssayUrl &&
                                                            axisSelection.selectedGenericAssayOption && (
                                                                <a
                                                                    target="_blank"
                                                                    href={
                                                                        genericAssayUrl
                                                                    }
                                                                >
                                                                    <b>
                                                                        {
                                                                            axisSelection
                                                                                .selectedGenericAssayOption
                                                                                .value
                                                                        }
                                                                    </b>
                                                                </a>
                                                            )}
                                                        <div>
                                                            {
                                                                genericAssayDescription
                                                            }
                                                        </div>
                                                    </div>
                                                }
                                                tooltipPlacement="right"
                                                style={{ marginLeft: 7 }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    {axisCategoriesPromise.isComplete &&
                        axisCategoriesPromise.result.length > 0 &&
                        this.plotType.isComplete &&
                        this.plotType.result === PlotType.BoxPlot && (
                            <div
                                style={{ marginBottom: '5px' }}
                                className="form-group"
                            >
                                <label className="label-text">
                                    Filter categories
                                </label>
                                <Select
                                    aria-label="Categories Filter Dropdown"
                                    className="Select"
                                    isClearable={true}
                                    isSearchable={true}
                                    value={toJS(
                                        axisSelection.selectedCategories
                                    )}
                                    isMulti
                                    options={axisCategoriesPromise.result}
                                    onChange={(options: any[] | null) => {
                                        axisSelection.selectedCategories =
                                            options || [];
                                    }}
                                />
                            </div>
                        )}
                    {isBoxPlotWithMoreThanOneCategory && axisIsStringData && (
                        <div className="checkbox">
                            <label>
                                <input
                                    data-test="SortByMedian"
                                    type="checkbox"
                                    name="utilities_sortByMedian"
                                    value={EventKey.sortByMedian}
                                    checked={this.boxPlotSortByMedian}
                                    onClick={this.onInputClick}
                                />{' '}
                                Sort Categories by Median
                            </label>
                        </div>
                    )}
                </div>
            </form>
        );
    }

    @computed
    get selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl() {
        const result = _.reduce(
            this.props.selectedGenericAssayEntitiesGroupByMolecularProfileId,
            (acc, entityId, profileId) => {
                if (
                    this.props.molecularProfileIdToMolecularProfile.result[
                        profileId
                    ]
                ) {
                    const type = this.props.molecularProfileIdToMolecularProfile
                        .result[profileId].genericAssayType;
                    acc[type] = acc[type]
                        ? _.union(entityId, acc[type])
                        : entityId;
                }
                return acc;
            },
            {} as { [genericAssayType: string]: string[] }
        );
        return result;
    }

    private makeGenericAssayGroupOptions(
        alloptions: {
            value: string;
            label: string;
        }[],
        selectedEntities: string[],
        serchText: string,
        queriedHugoGeneSymbols: string[],
        selectedHugoGeneSymbolInTheOtherAxis?: string,
        isGeneRelatedOptions?: boolean
    ) {
        if (alloptions) {
            const entities = alloptions.filter(option =>
                selectedEntities.includes(option.value)
            );
            const otherEntities = _.difference(alloptions, entities);
            let filteredOtherOptions = otherEntities.filter(option =>
                doesOptionMatchSearchText(serchText, option)
            );
            // bring gene related options to the front
            // If there is a gene selected in the other axis, bring related options to that gene to first
            // Then bring all queried genes related options after those
            // Last, put all remaining options
            const selectedGeneRelatedOptions =
                isGeneRelatedOptions && selectedHugoGeneSymbolInTheOtherAxis
                    ? filterGenericAssayOptionsByGenes(filteredOtherOptions, [
                          selectedHugoGeneSymbolInTheOtherAxis,
                      ])
                    : [];
            const queriedGeneRelatedOptions = isGeneRelatedOptions
                ? this.props.hasNoQueriedGenes
                    ? filteredOtherOptions
                    : filterGenericAssayOptionsByGenes(
                          filteredOtherOptions,
                          queriedHugoGeneSymbols
                      )
                : [];
            filteredOtherOptions = [
                ...selectedGeneRelatedOptions,
                ..._.difference(
                    queriedGeneRelatedOptions,
                    selectedGeneRelatedOptions
                ),
                ..._.difference(
                    filteredOtherOptions,
                    selectedGeneRelatedOptions,
                    queriedGeneRelatedOptions
                ),
            ];
            if (
                filteredOtherOptions.length >
                DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING
            ) {
                filteredOtherOptions = filteredOtherOptions.slice(
                    0,
                    DEFAULT_GENERIC_ASSAY_OPTIONS_SHOWING
                );
            }
            if (entities.length === 0) {
                return filteredOtherOptions;
            } else {
                return [
                    {
                        label: 'Selected entities',
                        options: entities,
                    },
                    {
                        label: 'Other entities',
                        options: filteredOtherOptions,
                    },
                ];
            }
        } else {
            return undefined;
        }
    }

    @action.bound
    private onVerticalAxisGenericAssayInputChange(
        input: string,
        inputInfo: any
    ) {
        if (inputInfo.action === 'input-change') {
            this._vertGenericAssaySearchText = input;
        } else if (inputInfo.action !== 'set-value') {
            this._vertGenericAssaySearchText = '';
        }
    }

    @action.bound
    private onHorizontalAxisGenericAssayInputChange(
        input: string,
        inputInfo: any
    ) {
        if (inputInfo.action === 'input-change') {
            this._horzGenericAssaySearchText = input;
        } else if (inputInfo.action !== 'set-value') {
            this._horzGenericAssaySearchText = '';
        }
    }

    @autobind
    private getUtilitiesMenu() {
        const showSearchOptions =
            this.plotType.isComplete &&
            this.plotType.result !== PlotType.DiscreteVsDiscrete;
        const showDiscreteVsDiscreteOption =
            this.plotType.isComplete &&
            this.plotType.result === PlotType.DiscreteVsDiscrete;
        const showStackedBarHorizontalOption =
            showDiscreteVsDiscreteOption &&
            this.discreteVsDiscretePlotType !==
                DiscreteVsDiscretePlotType.Table;
        const showSampleColoringOptions =
            this.canColorByMutationData || this.canColorByCnaData;
        const showRegression =
            this.plotType.isComplete &&
            this.plotType.result === PlotType.ScatterPlot;
        const showConnectSamples =
            this.plotType.isComplete &&
            this.plotType.result === PlotType.BoxPlot &&
            this.samplesForEachPatient.length > 0;
        if (
            !showSearchOptions &&
            !showSampleColoringOptions &&
            !showDiscreteVsDiscreteOption &&
            !showStackedBarHorizontalOption &&
            !showRegression
        ) {
            return <span></span>;
        }
        return (
            <div style={{ marginTop: 10 }}>
                <div>
                    {showSearchOptions && (
                        <div>
                            <div className="form-group">
                                <label>Search Case(s)</label>
                                <FormControl
                                    type="text"
                                    value={this.searchCaseInput}
                                    onChange={this.setSearchCaseInput}
                                    placeholder="Case ID.."
                                />
                            </div>
                            {this.canColorByMutationData && (
                                <div className="form-group">
                                    <label>Search Mutation(s)</label>
                                    <FormControl
                                        type="text"
                                        value={this.searchMutationInput}
                                        onChange={this.setSearchMutationInput}
                                        placeholder="Protein Change.."
                                    />
                                    {this.showMutationNotFoundMessage && (
                                        <span className="mutation-message">
                                            Mutation not found for selected gene
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    {showConnectSamples && (
                        <div className="checkbox" style={{ marginTop: 14 }}>
                            <label>
                                <input
                                    type="checkbox"
                                    name="utilities_connectSamples"
                                    value={EventKey.utilities_connectSamples}
                                    checked={this.connectSamples}
                                    onClick={this.onInputClick}
                                />{' '}
                                Connect samples from the same patient
                            </label>
                        </div>
                    )}
                    {showDiscreteVsDiscreteOption && (
                        <div className="form-group">
                            <label>Plot Type</label>
                            <div style={{ display: 'flex' }}>
                                <ReactSelect
                                    name="discrete-vs-discrete-plot-type"
                                    value={this.discreteVsDiscretePlotType}
                                    onChange={
                                        this.onDiscreteVsDiscretePlotTypeSelect
                                    }
                                    options={discreteVsDiscretePlotTypeOptions}
                                    clearable={false}
                                    searchable={true}
                                />
                            </div>
                        </div>
                    )}
                    {showStackedBarHorizontalOption && (
                        <>
                            <div className="form-group">
                                <label>Sort By</label>
                                <div style={{ display: 'flex' }}>
                                    <ReactSelect
                                        name="Sort By"
                                        value={this.sortByOption}
                                        onChange={this.handleSortByChange}
                                        options={this.sortByDropDownOptions}
                                        clearable={false}
                                        searchable={true}
                                        placeholder="Sort by..."
                                    />
                                </div>
                            </div>
                            <div className="checkbox">
                                <label>
                                    <input
                                        data-test="horizontalBars"
                                        type="checkbox"
                                        name="utilities_horizontalBars"
                                        value={
                                            EventKey.utilities_horizontalBars
                                        }
                                        checked={this.horizontalBars}
                                        onClick={this.onInputClick}
                                    />{' '}
                                    Horizontal Bars
                                </label>
                            </div>
                        </>
                    )}
                    {showRegression && (
                        <div className="checkbox" style={{ marginTop: 14 }}>
                            <label>
                                <input
                                    data-test="ShowRegressionline"
                                    type="checkbox"
                                    name="utilities_showRegressionLine"
                                    value={
                                        EventKey.utilities_showRegressionLine
                                    }
                                    checked={this.showRegressionLine}
                                    onClick={this.onInputClick}
                                />{' '}
                                Show Regression Line
                            </label>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    @autobind
    private assignScrollPaneRef(el: HTMLDivElement) {
        this.scrollPane = el;
        if (el) {
            this.synchronizeScrollPanes();
            $(el).scroll(this.synchronizeScrollPanes);
        }
    }
    @autobind
    private assignDummyScrollPaneRef(el: HTMLDivElement) {
        this.dummyScrollPane = el;
        if (el) {
            this.synchronizeScrollPanes();

            $(el).scroll(this.synchronizeScrollPanes);

            $(el).on('mousedown', () => {
                this.scrollingDummyPane = true;
            });
            $(el).on('mouseup', () => {
                this.scrollingDummyPane = false;
            });
        }
    }
    @autobind
    private assignPlotSvgRef(el: SVGElement | null) {
        this.plotSvg = el;
        if (el) {
            this.plotElementWidth = el.scrollWidth;
        } else {
            this.plotElementWidth = 0;
        }
    }
    @autobind
    private synchronizeScrollPanes() {
        if (!this.scrollPane || !this.dummyScrollPane) {
            // Can't do anything if both panes don't exist yet
            return;
        }
        if (this.scrollingDummyPane) {
            // prevent infinite loop by only updating in one direction
            //  based on whether user is clicking in the dummy pane
            this.scrollPane.scrollLeft = this.dummyScrollPane.scrollLeft;
        } else {
            this.dummyScrollPane.scrollLeft = this.scrollPane.scrollLeft;
        }
    }

    @autobind
    private controls() {
        return (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="axisBlock">
                    <Observer>{this.getHorizontalAxisMenu}</Observer>
                </div>
                <div className={'swapAxes'}>
                    <button
                        className="btn btn-link btn-xs"
                        data-test="swapHorzVertButton"
                        onClick={this.swapHorzVertSelections}
                    >
                        <i className="fa fa-arrow-up"></i> Swap Axes{' '}
                        <i className="fa fa-arrow-down"></i>
                    </button>
                </div>
                <div className="axisBlock">
                    <Observer>{this.getVerticalAxisMenu}</Observer>
                </div>
                <div>
                    <Observer>{this.getUtilitiesMenu}</Observer>
                </div>
            </div>
        );
    }

    readonly plotType = remoteData({
        await: () => [this.horzAxisDataPromise, this.vertAxisDataPromise],
        invoke: () => {
            const horzAxisData = this.horzAxisDataPromise.result;
            const vertAxisData = this.vertAxisDataPromise.result;
            const horzAxisNoneSelected =
                this.horzSelection.dataType ===
                NONE_SELECTED_OPTION_STRING_VALUE;
            const vertAxisNoneSelected =
                this.vertSelection.dataType ===
                NONE_SELECTED_OPTION_STRING_VALUE;

            if (!horzAxisData || !vertAxisData) {
                return new Promise<PlotType>(() => 0); // dont resolve
            }

            if (
                (vertAxisNoneSelected && horzAxisData) ||
                (horzAxisNoneSelected && vertAxisData)
            ) {
                return Promise.resolve(PlotType.WaterfallPlot);
            } else {
                if (isStringData(horzAxisData) && isStringData(vertAxisData)) {
                    return Promise.resolve(PlotType.DiscreteVsDiscrete);
                } else if (
                    isNumberData(horzAxisData) &&
                    isNumberData(vertAxisData)
                ) {
                    return Promise.resolve(PlotType.ScatterPlot);
                } else {
                    return Promise.resolve(PlotType.BoxPlot);
                }
            }
        },
    });

    // In case we want to handle samples differently
    /*readonly mutationProfileDuplicateSamplesReport = remoteData({
        await:()=>[
            this.horzAxisDataPromise,
            this.vertAxisDataPromise
        ],
        invoke:()=>{
            return Promise.resolve(getMutationProfileDuplicateSamplesReport(
                this.horzAxisDataPromise.result!,
                this.vertAxisDataPromise.result!,
                this.horzSelection,
                this.vertSelection
            ));
        }
    });*/

    @computed get selectedGeneForStyling(): Gene | undefined {
        if (
            !this.noGeneSelectedForStyling &&
            this.coloringMenuSelection.selectedOption
        ) {
            let entrezGeneId = this.coloringMenuSelection.selectedOption.info
                .entrezGeneId;
            if (entrezGeneId === undefined) {
                entrezGeneId = NONE_SELECTED_OPTION_NUMERICAL_VALUE;
            }
            return this.props.entrezGeneIdToGene.result![entrezGeneId];
        }
        return undefined;
    }

    @computed get legendTitle(): string | string[] {
        if (this.selectedGeneForStyling) {
            // coloring by gene
            return this.selectedGeneForStyling.hugoGeneSymbol;
        } else if (
            this.coloringMenuSelection.selectedOption &&
            this.coloringMenuSelection.selectedOption.info.clinicalAttribute
        ) {
            // coloring by clinical attribute
            return wrapText(
                this.coloringMenuSelection.selectedOption.info.clinicalAttribute
                    .displayName,
                100,
                CBIOPORTAL_VICTORY_THEME.legend.style.title.fontFamily,
                CBIOPORTAL_VICTORY_THEME.legend.style.title.fontSize + 'px'
            );
        }
        // neither
        return '';
    }

    readonly scatterPlotData = remoteData<IScatterPlotData[]>({
        await: () => {
            const ret: MobxPromise<any>[] = [
                this.horzAxisDataPromise,
                this.vertAxisDataPromise,
                this.props.sampleKeyToSample,
                this.props.coverageInformation,
                this.mutationDataExists,
                this.cnaDataExists,
                this.structuralVariantPromise,
                this.svDataExists,
                this.props.studyToMutationMolecularProfile,
                this.mutationPromiseForColoring,
                this.cnaPromiseForColoring,
                this.props.studyToMolecularProfileDiscreteCna,
                this.props.studyToStructuralVariantMolecularProfile,
            ];
            if (
                this.coloringMenuSelection.selectedOption &&
                this.coloringMenuSelection.selectedOption.info.clinicalAttribute
            ) {
                ret.push(
                    this.props.clinicalDataCache.get(
                        this.coloringMenuSelection.selectedOption.info
                            .clinicalAttribute
                    )
                );
            }
            return ret;
        },
        invoke: () => {
            let clinicalData;
            if (
                this.coloringMenuSelection.selectedOption &&
                this.coloringMenuSelection.selectedOption.info.clinicalAttribute
            ) {
                const promise = this.props.clinicalDataCache.get(
                    this.coloringMenuSelection.selectedOption.info
                        .clinicalAttribute
                );
                clinicalData = promise.result!.data as ClinicalData[];
            }
            const horzAxisData = this.horzAxisDataPromise.result;
            const vertAxisData = this.vertAxisDataPromise.result;
            if (!horzAxisData || !vertAxisData) {
                return new Promise<IScatterPlotData[]>(() => 0); // dont resolve
            } else {
                if (isNumberData(horzAxisData) && isNumberData(vertAxisData)) {
                    return Promise.resolve(
                        makeScatterPlotData(
                            horzAxisData,
                            vertAxisData,
                            this.props.sampleKeyToSample.result!,
                            this.props.coverageInformation.result!.samples,
                            this.mutationDataExists.result
                                ? {
                                      molecularProfileIds: _.values(
                                          this.props
                                              .studyToMutationMolecularProfile
                                              .result!
                                      ).map(p => p.molecularProfileId),
                                      data: this.mutationPromiseForColoring
                                          .result!,
                                  }
                                : undefined,
                            this.cnaDataExists.result
                                ? {
                                      molecularProfileIds: _.values(
                                          this.props
                                              .studyToMolecularProfileDiscreteCna
                                              .result!
                                      ).map(p => p.molecularProfileId),
                                      data: this.cnaPromiseForColoring.result!,
                                  }
                                : undefined,
                            this.svDataExists.result
                                ? {
                                      molecularProfileIds: _.values(
                                          this.props
                                              .studyToStructuralVariantMolecularProfile
                                              .result!
                                      ).map(p => p.molecularProfileId),
                                      data: this.structuralVariantPromise
                                          .result!,
                                  }
                                : undefined,
                            this.selectedGeneForStyling,
                            this.clinicalDataForColoring
                        )
                    );
                } else {
                    return Promise.resolve([]);
                }
            }
        },
    });

    readonly waterfallPlotData = remoteData<{ data: IWaterfallPlotData[] }>({
        await: () => {
            const ret: MobxPromise<any>[] = [
                this.horzAxisDataPromise,
                this.vertAxisDataPromise,
                this.props.sampleKeyToSample,
                this.props.coverageInformation,
                this.mutationDataExists,
                this.cnaDataExists,
                this.structuralVariantPromise,
                this.svDataExists,
                this.props.studyToMutationMolecularProfile,
                this.mutationPromiseForColoring,
                this.cnaPromiseForColoring,
                this.props.studyToMolecularProfileDiscreteCna,
            ];
            if (
                this.coloringMenuSelection.selectedOption &&
                this.coloringMenuSelection.selectedOption.info.clinicalAttribute
            ) {
                ret.push(
                    this.props.clinicalDataCache.get(
                        this.coloringMenuSelection.selectedOption.info
                            .clinicalAttribute
                    )
                );
            }
            return ret;
        },
        invoke: () => {
            let clinicalData;
            if (
                this.coloringMenuSelection.selectedOption &&
                this.coloringMenuSelection.selectedOption.info.clinicalAttribute
            ) {
                const promise = this.props.clinicalDataCache.get(
                    this.coloringMenuSelection.selectedOption.info
                        .clinicalAttribute
                );
                clinicalData = promise.result!.data as ClinicalData[];
            }
            const horzAxisData = this.horzAxisDataPromise.result;
            const vertAxisData = this.vertAxisDataPromise.result;

            if (!horzAxisData && !vertAxisData) {
                return new Promise<{
                    horizontal: boolean;
                    data: IWaterfallPlotData[];
                }>(() => 0); // dont resolve
            } else {
                const axisData = this.isHorizontalWaterfallPlot
                    ? horzAxisData
                    : vertAxisData;

                // Note: for generic assay profiles the identity of the selected gene is not
                // naturally embedded in the genetic profile. Instead, the user selects
                // the gene of interest from a select box in the Utilities menu.
                const entrezGeneId = this.coloringMenuSelection.selectedOption
                    ? this.coloringMenuSelection.selectedOption.info
                          .entrezGeneId
                    : null;
                const selectedGene = entrezGeneId
                    ? this.props.entrezGeneIdToGene.result![entrezGeneId]
                    : null;

                if (isNumberData(axisData!)) {
                    return Promise.resolve({
                        data: makeWaterfallPlotData(
                            axisData as INumberAxisData,
                            this.props.sampleKeyToSample.result!,
                            this.props.coverageInformation.result!.samples,
                            selectedGene,
                            this.mutationDataExists.result
                                ? {
                                      molecularProfileIds: _.values(
                                          this.props
                                              .studyToMutationMolecularProfile
                                              .result!
                                      ).map(p => p.molecularProfileId),
                                      data: this.mutationPromiseForColoring
                                          .result!,
                                  }
                                : undefined,
                            this.cnaDataExists.result
                                ? {
                                      molecularProfileIds: _.values(
                                          this.props
                                              .studyToMolecularProfileDiscreteCna
                                              .result!
                                      ).map(p => p.molecularProfileId),
                                      data: this.cnaPromiseForColoring.result!,
                                  }
                                : undefined,
                            this.svDataExists.result
                                ? {
                                      molecularProfileIds: _.values(
                                          this.props
                                              .studyToStructuralVariantMolecularProfile
                                              .result!
                                      ).map(p => p.molecularProfileId),
                                      data: this.structuralVariantPromise
                                          .result!,
                                  }
                                : undefined,
                            clinicalData && {
                                clinicalAttribute: this.coloringMenuSelection
                                    .selectedOption!.info.clinicalAttribute!,
                                data: clinicalData,
                            }
                        ),
                    });
                } else {
                    return Promise.resolve({ data: [] });
                }
            }
        },
    });

    @computed get waterfallPlotPivotThreshold(): number {
        const dataSourceId: string | undefined = this.isHorizontalWaterfallPlot
            ? this.horzSelection.dataSourceId!
            : this.vertSelection.dataSourceId!;
        const profile = this.props.molecularProfileIdSuffixToMolecularProfiles
            .result![dataSourceId][0];
        return profile.pivotThreshold;
    }

    @computed get waterfallPlotSortOrder(): string {
        if (
            this._waterfallPlotSortOrder === undefined &&
            this.isWaterfallPlot
        ) {
            const dataSourceId =
                this.horzSelection.dataSourceId ||
                this.vertSelection.dataSourceId;
            return this.props.molecularProfileIdSuffixToMolecularProfiles
                .result![dataSourceId!][0].sortOrder;
        }
        return this._waterfallPlotSortOrder!;
    }

    @computed get isHorizontalWaterfallPlot(): boolean {
        return (
            this.isWaterfallPlot &&
            !!this.vertAxisDataPromise.result &&
            this.vertAxisDataPromise.result['datatype'] ===
                NONE_SELECTED_OPTION_STRING_VALUE
        );
    }

    @computed get isWaterfallPlot(): boolean {
        return (
            !!this.plotType.result &&
            this.plotType.result === PlotType.WaterfallPlot
        );
    }

    @computed get sortOrderImageClassName(): string {
        const baseClass = 'fa fa-signal';
        const axisClass = this.isHorizontalWaterfallPlot ? 'horz' : 'vert';
        const sortClass =
            (!this.isHorizontalWaterfallPlot &&
                this.waterfallPlotSortOrder === 'ASC') ||
            (this.isHorizontalWaterfallPlot &&
                this.waterfallPlotSortOrder === 'DESC')
                ? 'ascending'
                : 'descending';
        return `${baseClass} ${axisClass}-${sortClass}`;
    }

    readonly defaultSortedBoxPlotData = remoteData<{
        horizontal: boolean;
        data: IBoxScatterPlotData<IBoxScatterPlotPoint>[];
    }>({
        await: () => {
            const ret: MobxPromise<any>[] = [
                this.horzAxisDataPromise,
                this.vertAxisDataPromise,
                this.props.sampleKeyToSample,
                this.props.coverageInformation,
                this.mutationDataExists,
                this.cnaDataExists,
                this.structuralVariantPromise,
                this.svDataExists,
                this.props.studyToMutationMolecularProfile,
                this.mutationPromiseForColoring,
                this.cnaPromiseForColoring,
                this.props.studyToMolecularProfileDiscreteCna,
            ];
            if (
                this.coloringMenuSelection.selectedOption &&
                this.coloringMenuSelection.selectedOption.info.clinicalAttribute
            ) {
                ret.push(
                    this.props.clinicalDataCache.get(
                        this.coloringMenuSelection.selectedOption.info
                            .clinicalAttribute
                    )
                );
            }
            return ret;
        },
        invoke: () => {
            const horzAxisData = this.horzAxisDataPromise.result;
            const vertAxisData = this.vertAxisDataPromise.result;
            if (!horzAxisData || !vertAxisData) {
                return new Promise<any>(() => 0); // dont resolve
            } else {
                let categoryData: IStringAxisData;
                let numberData: INumberAxisData;
                let horizontal: boolean;
                let selectedCategories: { [category: string]: any } = {};
                if (isNumberData(horzAxisData) && isStringData(vertAxisData)) {
                    selectedCategories = _.keyBy(
                        this.vertSelection.selectedCategories,
                        c => c.value
                    );
                    categoryData = vertAxisData;
                    numberData = horzAxisData;
                    horizontal = true;
                } else if (
                    isStringData(horzAxisData) &&
                    isNumberData(vertAxisData)
                ) {
                    selectedCategories = _.keyBy(
                        this.horzSelection.selectedCategories,
                        c => c.value
                    );
                    categoryData = horzAxisData;
                    numberData = vertAxisData;
                    horizontal = false;
                } else {
                    return Promise.resolve({ horizontal: false, data: [] });
                }

                let clinicalData;
                if (
                    this.coloringMenuSelection.selectedOption &&
                    this.coloringMenuSelection.selectedOption.info
                        .clinicalAttribute
                ) {
                    const promise = this.props.clinicalDataCache.get(
                        this.coloringMenuSelection.selectedOption.info
                            .clinicalAttribute
                    );
                    clinicalData = promise.result!.data as ClinicalData[];
                }

                let data = makeBoxScatterPlotData(
                    categoryData,
                    numberData,
                    this.props.sampleKeyToSample.result!,
                    this.props.coverageInformation.result!.samples,
                    this.mutationDataExists.result
                        ? {
                              molecularProfileIds: _.values(
                                  this.props.studyToMutationMolecularProfile
                                      .result!
                              ).map(p => p.molecularProfileId),
                              data: this.mutationPromiseForColoring.result!,
                          }
                        : undefined,
                    this.cnaDataExists.result
                        ? {
                              molecularProfileIds: _.values(
                                  this.props.studyToMolecularProfileDiscreteCna
                                      .result!
                              ).map(p => p.molecularProfileId),
                              data: this.cnaPromiseForColoring.result!,
                          }
                        : undefined,
                    this.svDataExists.result
                        ? {
                              molecularProfileIds: _.values(
                                  this.props
                                      .studyToStructuralVariantMolecularProfile
                                      .result!
                              ).map(p => p.molecularProfileId),
                              data: this.structuralVariantPromise.result!,
                          }
                        : undefined,
                    this.selectedGeneForStyling,
                    clinicalData && {
                        clinicalAttribute: this.coloringMenuSelection
                            .selectedOption!.info.clinicalAttribute!,
                        data: clinicalData,
                    }
                );
                if (selectedCategories && !_.isEmpty(selectedCategories)) {
                    data = data.filter(d => d.label in selectedCategories);
                }
                return Promise.resolve({
                    horizontal,
                    data,
                });
            }
        },
    });

    readonly boxPlotData = remoteData<{
        horizontal: boolean;
        data: IBoxScatterPlotData<IBoxScatterPlotPoint>[];
    }>({
        await: () => [this.defaultSortedBoxPlotData],
        invoke: () => {
            if (this.boxPlotSortByMedian) {
                return Promise.resolve({
                    horizontal: this.defaultSortedBoxPlotData.result!
                        .horizontal,
                    data: _.sortBy(
                        this.defaultSortedBoxPlotData.result!.data,
                        d => d.median
                    ),
                });
            } else {
                return Promise.resolve(this.defaultSortedBoxPlotData.result!);
            }
        },
    });

    @computed get zIndexSortBy() {
        return scatterPlotZIndexSortBy<IPlotSampleData>(
            this.coloringTypes,
            this.scatterPlotHighlight
        );
    }

    @computed get boxPlotBoxWidth() {
        if (this.boxPlotData.isComplete) {
            return getBoxWidth(
                this.boxPlotData.result.data.length,
                this.boxPlotData.result.horizontal ? 400 : 600 // squish boxes more into vertical area
            );
        } else {
            // irrelevant - nothing should be plotted anyway
            return 10;
        }
    }

    @computed get horzLogScaleFunction(): IAxisLogScaleParams | undefined {
        return makeAxisLogScaleFunction(this.horzSelection);
    }

    @computed get vertLogScaleFunction(): IAxisLogScaleParams | undefined {
        return makeAxisLogScaleFunction(this.vertSelection);
    }

    @computed get showNoGenericAssaySelectedWarning() {
        return (
            (this.vertSelection.dataType &&
                isGenericAssaySelected(this.vertSelection) &&
                this.vertGenericAssayOptions.isComplete &&
                this.vertGenericAssayOptions.result!.length === 0) ||
            (this.horzSelection.dataType &&
                isGenericAssaySelected(this.horzSelection) &&
                this.horzGenericAssayOptions.isComplete &&
                this.horzGenericAssayOptions.result!.length === 0)
        );
    }

    @computed get shouldShowNoDataTypesSelectedWarning() {
        return (
            this.dataTypeOptions.isComplete &&
            this.dataTypeToDataSourceOptions.isComplete &&
            (!this.horzSelection.dataType || !this.vertSelection.dataType)
        );
    }

    @computed get shouldShowNoGenesSelectedWarning() {
        return (
            this.dataTypeOptions.isComplete &&
            this.dataTypeToDataSourceOptions.isComplete &&
            ((this.horzSelection.dataType &&
                this.showGeneSelectBox(
                    this.horzSelection.dataType,
                    isGenericAssaySelected(this.horzSelection)
                ) &&
                !this.horzSelection.selectedGeneOption) ||
                (this.vertSelection.dataType &&
                    this.showGeneSelectBox(
                        this.vertSelection.dataType,
                        isGenericAssaySelected(this.vertSelection)
                    ) &&
                    !this.vertSelection.selectedGeneOption))
        );
    }

    @computed get showUtilitiesMenu() {
        return (
            this.plotType.isComplete &&
            this.plotType.result !== PlotType.DiscreteVsDiscrete &&
            (this.plotDataExistsForTwoAxes || this.waterfallPlotIsShown)
        );
    }

    @computed get noGeneSelectedForStyling(): boolean {
        return (
            !!this.coloringMenuSelection.selectedOption &&
            this.coloringMenuSelection.selectedOption.info.entrezGeneId ===
                NONE_SELECTED_OPTION_NUMERICAL_VALUE
        );
    }

    @computed get coloringClinicalDataPromise() {
        if (
            this.coloringMenuSelection.selectedOption &&
            this.coloringMenuSelection.selectedOption.info.clinicalAttribute
        ) {
            return this.props.clinicalDataCache.get(
                this.coloringMenuSelection.selectedOption.info.clinicalAttribute
            );
        } else {
            return undefined;
        }
    }

    @computed get coloringLogScalePossible() {
        // coloring log scale possible if:
        return !!(
            this.coloringClinicalDataPromise && // using clinical data coloring
            this.coloringClinicalDataPromise.isComplete && // clinical data loaded
            this.coloringClinicalDataPromise.result!
                .logScaleNumericalValueToColor
        ); // log scale available
    }

    @computed get coloringLogScale() {
        // color log scale if:
        return !!(
            this.coloringLogScalePossible && this.coloringMenuSelection.logScale
        ); // log scale selected
    }

    @computed get tooManyDiscreteVariables() {
        return (
            this.plotType.result &&
            this.horzAxisCategories.result &&
            this.vertAxisCategories.result &&
            this.plotType.result === PlotType.DiscreteVsDiscrete &&
            this.discreteVsDiscretePlotType !==
                DiscreteVsDiscretePlotType.Table &&
            (this.horzAxisCategories.result!.length > DISCRETE_CATEGORY_LIMIT ||
                this.vertAxisCategories.result!.length >
                    DISCRETE_CATEGORY_LIMIT)
        );
    }

    @computed get coloringByGene() {
        return !!(
            this.coloringMenuSelection.selectedOption &&
            this.coloringMenuSelection.selectedOption.info.entrezGeneId !==
                undefined &&
            this.coloringMenuSelection.selectedOption.info.entrezGeneId !==
                NONE_SELECTED_OPTION_NUMERICAL_VALUE
        );
    }

    @computed get showDownload() {
        return (
            getServerConfig().skin_hide_download_controls ===
            DownloadControlOption.SHOW_ALL
        );
    }

    @computed get plot() {
        const promises: MobxPromise<any>[] = [
            this.plotType,
            this.horzAxisDataPromise,
            this.vertAxisDataPromise,
            this.horzLabel,
            this.vertLabel,
            this.genericEntitiesGroupByEntityId,
            this.horzGenericAssayOptions,
            this.props.studies,
        ];
        if (this.coloringClinicalDataPromise) {
            promises.push(this.coloringClinicalDataPromise);
        }
        const groupStatus = getRemoteDataGroupStatus(...promises);
        const isPercentage =
            this.discreteVsDiscretePlotType ===
            DiscreteVsDiscretePlotType.PercentageStackedBar;
        const isStacked =
            isPercentage ||
            this.discreteVsDiscretePlotType ===
                DiscreteVsDiscretePlotType.StackedBar;

        if (this.showNoGenericAssaySelectedWarning) {
            return (
                <div>
                    <i className="fa fa-exclamation-triangle text-danger" />
                    &nbsp;
                    <span>
                        To visualize selected generic assay data, you must
                        ensure you have already imported related data and select
                        an entity.
                    </span>
                </div>
            );
        }

        if (this.shouldShowNoDataTypesSelectedWarning) {
            return (
                <div className={'alert alert-info'}>
                    Please select datatype(s).
                </div>
            );
        }
        if (this.shouldShowNoGenesSelectedWarning) {
            return (
                <div className={'alert alert-info'}>Please select gene(s).</div>
            );
        }

        // options for coloring ***
        const defaultOptions = this.coloringMenuOmnibarOptions.result
            ? this.coloringMenuOmnibarOptions.result.map(o => {
                  if ((o as any).label === 'Genes') {
                      let filteredOption = Object.assign(
                          {},
                          o as ColoringMenuOmnibarGroup
                      );
                      filteredOption.options = (o as ColoringMenuOmnibarGroup).options.slice(
                          0,
                          20
                      );
                      return filteredOption;
                  }
                  return o;
              })
            : [];

        const loadColoringOptions = (inputText: string, callback: any) => {
            if (!inputText) {
                callback([]);
            }
            const stringCompare = (item: any) =>
                item.label.toUpperCase().includes(inputText.toUpperCase());
            const noneCheck = (item: any) =>
                item.label !== 'None' ||
                item.label.toUpperCase().includes(inputText.toUpperCase());
            const options = this.coloringMenuOmnibarOptions.result
                ? this.coloringMenuOmnibarOptions.result.map(o => {
                      if ((o as any).options) {
                          let filteredOption = Object.assign(
                              {},
                              o as ColoringMenuOmnibarGroup
                          );
                          filteredOption.options = (o as ColoringMenuOmnibarGroup).options
                              .filter(stringCompare)
                              .slice(0, 20);
                          return filteredOption;
                      }
                      return o;
                  })
                : [];
            callback(options.filter(noneCheck));
        };

        switch (groupStatus) {
            case 'pending':
                return (
                    <LoadingIndicator
                        isLoading={true}
                        center={true}
                        size={'big'}
                    />
                );
            case 'error':
                return <span>Error loading plot data.</span>;
            default:
                if (!this.showPlot) {
                    return (
                        <div
                            data-test="PlotsTabNoDataDiv"
                            className={'alert alert-info'}
                        >
                            No data to plot.
                        </div>
                    );
                }
                if (this.tooManyDiscreteVariables) {
                    return (
                        <div
                            data-test="PlotsTabNoDataDiv"
                            className={'alert alert-info'}
                        >
                            There are too many unique categories in the data
                            selected for the horizontal or vertical axis. The
                            current threshold is set at
                            {DISCRETE_CATEGORY_LIMIT} categories to prevent the
                            browser from freezing. Please update you selection
                            to a variable with less categories.
                        </div>
                    );
                }
                const plotType = this.plotType.result!;
                let plotElt: any = null;
                switch (plotType) {
                    case PlotType.DiscreteVsDiscrete:
                        if (
                            this.discreteVsDiscretePlotType ===
                            DiscreteVsDiscretePlotType.Table
                        ) {
                            plotElt = (
                                <TablePlot
                                    svgRef={this.assignPlotSvgRef}
                                    horzData={
                                        (this.horzAxisDataPromise
                                            .result! as IStringAxisData).data
                                    }
                                    vertData={
                                        (this.vertAxisDataPromise
                                            .result! as IStringAxisData).data
                                    }
                                    horzCategoryOrder={
                                        (this.horzAxisDataPromise
                                            .result! as IStringAxisData)
                                            .categoryOrder
                                    }
                                    vertCategoryOrder={
                                        (this.vertAxisDataPromise
                                            .result! as IStringAxisData)
                                            .categoryOrder
                                    }
                                    minCellWidth={35}
                                    minCellHeight={35}
                                    minChartWidth={PLOT_SIDELENGTH}
                                    minChartHeight={PLOT_SIDELENGTH}
                                    axisLabelX={this.horzLabel.result!}
                                    axisLabelY={this.vertLabel.result!}
                                />
                            );
                        } else {
                            plotElt = (
                                <MultipleCategoryBarPlot
                                    svgId={SVG_ID}
                                    svgRef={this.assignPlotSvgRef}
                                    horzData={
                                        (this.horzAxisDataPromise
                                            .result! as IStringAxisData).data
                                    }
                                    vertData={
                                        (this.vertAxisDataPromise
                                            .result! as IStringAxisData).data
                                    }
                                    categoryToColor={
                                        RESERVED_CLINICAL_VALUE_COLORS
                                    }
                                    horzCategoryOrder={
                                        (this.horzAxisDataPromise
                                            .result! as IStringAxisData)
                                            .categoryOrder
                                    }
                                    vertCategoryOrder={
                                        (this.vertAxisDataPromise
                                            .result! as IStringAxisData)
                                            .categoryOrder
                                    }
                                    barWidth={20}
                                    domainPadding={20}
                                    chartBase={PLOT_SIDELENGTH}
                                    axisLabelX={this.horzLabel.result!}
                                    axisLabelY={this.vertLabel.result!}
                                    legendLocationWidthThreshold={
                                        LEGEND_TO_BOTTOM_WIDTH_THRESHOLD
                                    }
                                    horizontalBars={this.horizontalBars}
                                    percentage={isPercentage}
                                    stacked={isStacked}
                                    sortByDropDownOptions={
                                        this.sortByDropDownOptions
                                    }
                                    updateDropDownOptions={
                                        this.updateDropDownOptions
                                    }
                                    sortByOption={this.sortByOption}
                                    key={`categoryPlot-${
                                        this.horizontalBars
                                            ? 'horizontal'
                                            : 'vertical'
                                    }`}
                                />
                            );
                        }
                        break;
                    case PlotType.ScatterPlot:
                        if (this.scatterPlotData.isComplete) {
                            plotElt = (
                                <PlotsTabScatterPlot
                                    svgId={SVG_ID}
                                    svgRef={this.assignPlotSvgRef}
                                    axisLabelX={this.horzLabel.result!}
                                    axisLabelY={this.vertLabel.result!}
                                    data={this.scatterPlotData.result}
                                    size={scatterPlotSize}
                                    chartWidth={PLOT_SIDELENGTH}
                                    chartHeight={PLOT_SIDELENGTH}
                                    tooltip={this.scatterPlotTooltip}
                                    highlight={this.scatterPlotHighlight}
                                    showRegressionLine={this.showRegressionLine}
                                    logX={this.horzLogScaleFunction}
                                    logY={this.vertLogScaleFunction}
                                    fill={this.scatterPlotFill}
                                    stroke={this.scatterPlotStroke}
                                    strokeOpacity={
                                        this.scatterPlotStrokeOpacity
                                    }
                                    zIndexSortBy={this.zIndexSortBy}
                                    symbol={this.scatterPlotSymbol}
                                    fillOpacity={this.scatterPlotFillOpacity}
                                    strokeWidth={this.scatterPlotStrokeWidth}
                                    useLogSpaceTicks={true}
                                    excludeLimitValuesFromCorrelation={
                                        this.limitValuesCanBeShown &&
                                        this.viewLimitValues
                                    }
                                    legendData={scatterPlotLegendData(
                                        this.scatterPlotData.result,
                                        this.coloringTypes,
                                        PlotType.ScatterPlot,
                                        this.props.driverAnnotationSettings
                                            .driversAnnotated,
                                        this.limitValueTypes,
                                        this.highlightedLegendItems,
                                        this.scatterPlotHighlight,
                                        this.coloringClinicalDataPromise &&
                                            this.coloringClinicalDataPromise
                                                .result!,
                                        this.coloringLogScale,
                                        this.onClickLegendItem
                                    )}
                                    legendTitle={this.legendTitle}
                                    onDataSelection={this.onDataSelection}
                                />
                            );
                            break;
                        } else if (this.scatterPlotData.isError) {
                            return <span>Error loading plot data.</span>;
                        } else {
                            return (
                                <LoadingIndicator
                                    isLoading={true}
                                    center={true}
                                    size={'big'}
                                />
                            );
                        }
                    case PlotType.WaterfallPlot:
                        if (this.waterfallPlotData.isComplete) {
                            const horizontal = this.isHorizontalWaterfallPlot;
                            plotElt = (
                                <PlotsTabWaterfallPlot
                                    svgId={SVG_ID}
                                    svgRef={this.assignPlotSvgRef}
                                    axisLabel={this.waterfallLabel.result!}
                                    data={this.waterfallPlotData.result.data}
                                    size={scatterPlotSize}
                                    chartWidth={this.waterfallPlotWidth}
                                    chartHeight={this.waterfallPlotHeigth}
                                    tooltip={this.waterfallPlotTooltip}
                                    highlight={this.scatterPlotHighlight}
                                    log={
                                        horizontal
                                            ? this.horzLogScaleFunction
                                            : this.vertLogScaleFunction
                                    }
                                    horizontal={horizontal}
                                    fill={this.waterfallPlotColor}
                                    fillOpacity={1}
                                    stroke={this.waterfallPlotColor}
                                    strokeOpacity={1}
                                    strokeWidth={this.scatterPlotStrokeWidth}
                                    symbol={this.scatterPlotSymbol}
                                    labelVisibility={
                                        this
                                            .waterfallPlotLimitValueSymbolVisibility
                                    }
                                    zIndexSortBy={this.zIndexSortBy}
                                    useLogSpaceTicks={true}
                                    legendLocationWidthThreshold={
                                        LEGEND_TO_BOTTOM_WIDTH_THRESHOLD
                                    }
                                    sortOrder={this.waterfallPlotSortOrder}
                                    pivotThreshold={
                                        this.waterfallPlotPivotThreshold
                                    }
                                    legendData={scatterPlotLegendData(
                                        this.waterfallPlotData.result.data,
                                        this.coloringTypes,
                                        PlotType.WaterfallPlot,
                                        this.props.driverAnnotationSettings
                                            .driversAnnotated,
                                        this.limitValueTypes,
                                        this.highlightedLegendItems,
                                        this.scatterPlotHighlight,
                                        this.coloringClinicalDataPromise &&
                                            this.coloringClinicalDataPromise
                                                .result!,
                                        this.coloringLogScale,
                                        this.onClickLegendItem
                                    )}
                                    legendTitle={this.legendTitle}
                                />
                            );
                            break;
                        } else if (this.waterfallPlotData.isError) {
                            return <span>Error loading plot data.</span>;
                        } else {
                            return (
                                <LoadingIndicator
                                    isLoading={true}
                                    center={true}
                                    size={'big'}
                                />
                            );
                        }
                    case PlotType.BoxPlot:
                        if (this.boxPlotData.isComplete) {
                            const horizontal = this.boxPlotData.result
                                .horizontal;
                            plotElt = (
                                <PlotsTabBoxPlot
                                    svgId={SVG_ID}
                                    svgRef={this.assignPlotSvgRef}
                                    domainPadding={50}
                                    boxWidth={this.boxPlotBoxWidth}
                                    axisLabelX={this.horzLabel.result!}
                                    axisLabelY={this.vertLabel.result!}
                                    data={this.boxPlotData.result.data}
                                    chartBase={550}
                                    scatterPlotTooltip={this.boxPlotTooltip}
                                    highlight={this.scatterPlotHighlight}
                                    horizontal={horizontal}
                                    logScale={
                                        horizontal
                                            ? this.horzLogScaleFunction
                                            : this.vertLogScaleFunction
                                    }
                                    size={scatterPlotSize}
                                    fill={this.scatterPlotFill}
                                    stroke={this.scatterPlotStroke}
                                    strokeOpacity={
                                        this.scatterPlotStrokeOpacity
                                    }
                                    zIndexSortBy={this.zIndexSortBy}
                                    symbol={this.scatterPlotSymbol}
                                    fillOpacity={this.scatterPlotFillOpacity}
                                    strokeWidth={this.scatterPlotStrokeWidth}
                                    useLogSpaceTicks={true}
                                    excludeLimitValuesFromBoxPlot={
                                        this.limitValuesCanBeShown &&
                                        this.viewLimitValues
                                    }
                                    legendData={scatterPlotLegendData(
                                        _.flatten(
                                            this.boxPlotData.result.data.map(
                                                d => d.data
                                            )
                                        ),
                                        this.coloringTypes,
                                        PlotType.BoxPlot,
                                        this.props.driverAnnotationSettings
                                            .driversAnnotated,
                                        this.limitValueTypes,
                                        this.highlightedLegendItems,
                                        this.scatterPlotHighlight,
                                        this.coloringClinicalDataPromise &&
                                            this.coloringClinicalDataPromise
                                                .result!,
                                        this.coloringLogScale,
                                        this.onClickLegendItem
                                    )}
                                    legendLocationWidthThreshold={
                                        LEGEND_TO_BOTTOM_WIDTH_THRESHOLD
                                    }
                                    legendTitle={this.legendTitle}
                                    renderLinePlot={this.connectSamples}
                                    samplesForPatients={
                                        this.samplesForEachPatient
                                    }
                                />
                            );
                            break;
                        } else if (this.boxPlotData.isError) {
                            return <span>Error loading plot data.</span>;
                        } else {
                            return (
                                <LoadingIndicator
                                    isLoading={true}
                                    center={true}
                                    size={'big'}
                                />
                            );
                        }
                    default:
                        return <span>Not implemented yet</span>;
                }
                return (
                    <div>
                        {this.dataAvailability}
                        <div
                            data-test="PlotsTabPlotDiv"
                            className="borderedChart posRelative"
                        >
                            {this.showUtilitiesMenu && (
                                <div
                                    style={{
                                        textAlign: 'left',
                                        position: 'relative',
                                        zIndex: 2,
                                        marginTop: '-6px',
                                        marginBottom: this.isWaterfallPlot
                                            ? '9px'
                                            : '-16px',
                                        minWidth:
                                            this.canColorByMutationData &&
                                            this.canColorByCnaData
                                                ? 600
                                                : 0,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'inline-flex',
                                            position: 'relative',
                                            alignItems: 'center',
                                        }}
                                        data-test={'GeneColoringMenu'}
                                        className="coloring-menu"
                                    >
                                        <label className="legend-label">
                                            Color samples by:
                                        </label>
                                        &nbsp;
                                        <div
                                            style={{
                                                display: 'inline-block',
                                            }}
                                            className="gene-select-background"
                                        >
                                            <div className="checkbox gene-select-container">
                                                <If
                                                    condition={
                                                        this.props
                                                            .hasNoQueriedGenes
                                                    }
                                                >
                                                    <Then>
                                                        <AsyncSelect
                                                            aria-label="Gene or Clinical Attribute Search Dropdown"
                                                            className={
                                                                'color-samples-toolbar-elt gene-select'
                                                            }
                                                            name={`utilities_geneSelectionBox`}
                                                            value={
                                                                this
                                                                    .coloringMenuSelection
                                                                    .selectedOption
                                                            }
                                                            onChange={
                                                                this
                                                                    .onColoringMenuOptionSelect
                                                            }
                                                            isLoading={
                                                                this
                                                                    .horzGeneOptions
                                                                    .isPending
                                                            }
                                                            noOptionsMessage={() =>
                                                                'Search for gene or clinical attribute'
                                                            }
                                                            clearable={false}
                                                            searchable={true}
                                                            disabled={
                                                                !this
                                                                    .coloringMenuOmnibarOptions
                                                                    .isComplete
                                                            }
                                                            loadOptions={
                                                                loadColoringOptions
                                                            }
                                                            cacheOptions={true}
                                                        />
                                                    </Then>
                                                    <Else>
                                                        <Select
                                                            className={
                                                                'color-samples-toolbar-elt gene-select'
                                                            }
                                                            name={`utilities_geneSelectionBox`}
                                                            value={
                                                                this
                                                                    .coloringMenuSelection
                                                                    .selectedOption
                                                            }
                                                            onChange={
                                                                this
                                                                    .onColoringMenuOptionSelect
                                                            }
                                                            isLoading={
                                                                this
                                                                    .horzGeneOptions
                                                                    .isPending
                                                            }
                                                            options={
                                                                this
                                                                    .coloringMenuOmnibarOptions
                                                                    .result
                                                            }
                                                            clearable={false}
                                                            searchable={true}
                                                            disabled={
                                                                !this
                                                                    .coloringMenuOmnibarOptions
                                                                    .isComplete
                                                            }
                                                        />
                                                    </Else>
                                                </If>
                                            </div>
                                        </div>
                                        {this.coloringLogScalePossible && (
                                            <LabeledCheckbox
                                                checked={
                                                    this.coloringMenuSelection
                                                        .logScale
                                                }
                                                onChange={() =>
                                                    (this.coloringMenuSelection.logScale = !this
                                                        .coloringMenuSelection
                                                        .logScale)
                                                }
                                                inputProps={{
                                                    style: { marginTop: 4 },
                                                    className:
                                                        'coloringLogScale',
                                                }}
                                            >
                                                Log Scale
                                            </LabeledCheckbox>
                                        )}
                                        {this.coloringByGene &&
                                            this.canColorByMutationData && (
                                                <LabeledCheckbox
                                                    checked={
                                                        this
                                                            .coloringMenuSelection
                                                            .colorByMutationType
                                                    }
                                                    onChange={
                                                        this
                                                            .onClickColorByMutationType
                                                    }
                                                    inputProps={{
                                                        type: this
                                                            .waterfallPlotIsShown
                                                            ? 'radio'
                                                            : 'checkbox',
                                                        style: { marginTop: 4 },
                                                        'data-test':
                                                            'ViewMutationType',
                                                    }}
                                                >
                                                    Mutation Type *
                                                </LabeledCheckbox>
                                            )}
                                        {this.coloringByGene &&
                                            this.canColorBySVData && (
                                                <LabeledCheckbox
                                                    checked={
                                                        this
                                                            .coloringMenuSelection
                                                            .colorByStructuralVariant
                                                    }
                                                    onChange={
                                                        this
                                                            .onClickColorByStructuralVariant
                                                    }
                                                    inputProps={{
                                                        type: this
                                                            .waterfallPlotIsShown
                                                            ? 'radio'
                                                            : 'checkbox',
                                                        style: { marginTop: 4 },
                                                        'data-test':
                                                            'ViewStructuralVariant',
                                                    }}
                                                >
                                                    Structural Variant{`\u00B9`}
                                                </LabeledCheckbox>
                                            )}
                                        {this.coloringByGene &&
                                            this.canColorByCnaData && (
                                                <LabeledCheckbox
                                                    checked={
                                                        this
                                                            .coloringMenuSelection
                                                            .colorByCopyNumber
                                                    }
                                                    onChange={
                                                        this
                                                            .onClickColorByCopyNumber
                                                    }
                                                    inputProps={{
                                                        type: this
                                                            .waterfallPlotIsShown
                                                            ? 'radio'
                                                            : 'checkbox',
                                                        style: { marginTop: 4 },
                                                        'data-test':
                                                            'ViewCopyNumber',
                                                    }}
                                                >
                                                    Copy Number
                                                </LabeledCheckbox>
                                            )}
                                        {this.coloringByGene &&
                                        this.waterfallPlotIsShown && // Show a "None" radio button only on waterfall plots
                                            (this.canColorByMutationData ||
                                                this.canColorByCnaData) && (
                                                <LabeledCheckbox
                                                    checked={
                                                        !this
                                                            .coloringMenuSelection
                                                            .colorByCopyNumber &&
                                                        !this
                                                            .coloringMenuSelection
                                                            .colorByMutationType &&
                                                        !this
                                                            .coloringMenuSelection
                                                            .colorByStructuralVariant
                                                    }
                                                    onChange={action(() => {
                                                        this.setColorByMutationType(
                                                            false
                                                        );
                                                        this.setColorByCopyNumber(
                                                            false
                                                        );
                                                        this.setColorByStructuralVariant(
                                                            false
                                                        );
                                                    })}
                                                    inputProps={{
                                                        type: 'radio',
                                                        style: { marginTop: 4 },
                                                    }}
                                                >
                                                    None
                                                </LabeledCheckbox>
                                            )}
                                    </div>
                                </div>
                            )}
                            <Observer>
                                {() => {
                                    if (this.plotExists) {
                                        return (
                                            <DownloadControls
                                                getSvg={this.getSvg}
                                                filename={this.downloadFilename}
                                                additionalRightButtons={
                                                    this.showDownload
                                                        ? [
                                                              {
                                                                  key: 'Data',
                                                                  content: (
                                                                      <span>
                                                                          Data{' '}
                                                                          <i
                                                                              className="fa fa-cloud-download"
                                                                              aria-hidden="true"
                                                                          />
                                                                      </span>
                                                                  ),
                                                                  onClick: this
                                                                      .downloadData,
                                                                  disabled: !this
                                                                      .props
                                                                      .entrezGeneIdToGene
                                                                      .isComplete,
                                                              },
                                                          ]
                                                        : undefined
                                                }
                                                dontFade={true}
                                                style={{
                                                    position: 'absolute',
                                                    right: 10,
                                                    top: 10,
                                                }}
                                                type="button"
                                                showDownload={this.showDownload}
                                            />
                                        );
                                    } else {
                                        return <span />;
                                    }
                                }}
                            </Observer>

                            {this.selectedData.length > 0 &&
                                this.scatterPlotData.isComplete &&
                                this.scatterPlotData.result && (
                                    <SelectedDataAlert
                                        selectedData={this.selectedData}
                                        scatterPlotData={
                                            this.scatterPlotData.result
                                        }
                                        plotElementWidth={this.plotElementWidth}
                                        onDataSelectionCleared={
                                            this.onDataSelectionCleared
                                        }
                                    />
                                )}

                            <ScrollWrapper
                                plotElementWidth={this.plotElementWidth}
                                assignDummyScrollPaneRef={
                                    this.assignDummyScrollPaneRef
                                }
                                scrollPane={this.scrollPane}
                            >
                                <Observer>
                                    {() => (
                                        <div
                                            style={{
                                                position: 'relative',
                                                display: 'inline-block',
                                                width: '100%',
                                                overflow: 'scroll',
                                                marginTop: -13,
                                            }}
                                            className="hideScrollbar"
                                            tabIndex={0}
                                            ref={this.assignScrollPaneRef}
                                        >
                                            {plotElt}
                                        </div>
                                    )}
                                </Observer>
                            </ScrollWrapper>
                        </div>
                        {this.canColorByMutationData && (
                            <div style={{ marginTop: 5 }}>
                                * Driver annotation settings are located in the
                                settings menu{' '}
                                <i className="fa fa-sliders fa-sm" /> at the top
                                of the page.
                            </div>
                        )}
                        {this.canColorBySVData && (
                            <div style={{ marginTop: 5 }}>
                                {`\u00B9 `}Structural variants are shown instead
                                of copy number alterations when a sample has
                                both.
                            </div>
                        )}
                        {this.limitValuesCanBeShown &&
                            this.plotType.result === PlotType.ScatterPlot && (
                                <div style={{ marginTop: 5 }}>
                                    <div>
                                        ** Labeling of threshold values (e.g.
                                        {'>'}8.00) excludes threshold values
                                        from correlation coefficient
                                        calculation.
                                    </div>
                                </div>
                            )}
                        {this.limitValuesCanBeShown &&
                            this.plotType.result === PlotType.BoxPlot && (
                                <div style={{ marginTop: 5 }}>
                                    <div>
                                        ** Labeling of threshold values (e.g.
                                        {'>'}8.00) excludes threshold values
                                        from box plot calculation.
                                    </div>
                                </div>
                            )}
                        {/*this.mutationProfileDuplicateSamplesReport.isComplete && this.mutationProfileDuplicateSamplesReport.result.showMessage && (
                            <div className="alert alert-info" style={{marginTop:5, padding: 7}}>
                                Notice: With Mutation profiles, there is one data point per mutation type, per sample. In
                                this plot, there are {this.mutationProfileDuplicateSamplesReport.result.numSamples} samples with more than
                                one type of mutation, leading to {this.mutationProfileDuplicateSamplesReport.result.numSurplusPoints} extra
                                data points.
                            </div>
                        )*/}
                    </div>
                );
        }
    }

    @computed get plotExists() {
        return !!this.getSvg();
    }

    public render() {
        return (
            <div data-test="PlotsTabEntireDiv">
                <div className={'tabMessageContainer'}>
                    {!this.props.hasNoQueriedGenes && (
                        <OqlStatusBanner
                            className="plots-oql-status-banner"
                            queryContainsOql={!!this.props.queryContainsOql}
                            tabReflectsOql={false}
                        />
                    )}

                    {// we have always allowed expression data to be compared
                    // across study in the plots tab
                    // in portals other than our own.
                    // only in our own portals have we imposed the rule
                    // that all studies must be pan_can
                    // so default to true
                    !allowExpressionCrossStudy(
                        this.props.studies.result,
                        getServerConfig().enable_cross_study_expression,
                        false
                    ) && (
                        <div className={'alert alert-info'}>
                            Expression data cannot be compared across the
                            selected studies.
                        </div>
                    )}

                    {!this.props.hasNoQueriedGenes && (
                        <>
                            <AlterationFilterWarning
                                driverAnnotationSettings={
                                    this.props.driverAnnotationSettings
                                }
                                includeGermlineMutations={
                                    !!this.props.includeGermlineMutations
                                }
                                mutationsReportByGene={
                                    this.props.mutationsReportByGene!
                                }
                                oqlFilteredMutationsReport={
                                    this.props.oqlFilteredMutationsReport!
                                }
                                oqlFilteredMolecularDataReport={
                                    this.props.oqlFilteredMolecularDataReport!
                                }
                                oqlFilteredStructuralVariantsReport={
                                    this.props
                                        .oqlFilteredStructuralVariantsReport!
                                }
                                isUnaffected={true}
                            />
                            <CaseFilterWarning
                                samples={this.props.samples!}
                                filteredSamples={this.props.filteredSamples!}
                                patients={this.props.patients!}
                                filteredPatients={this.props.filteredPatients!}
                                hideUnprofiledSamples={
                                    this.props.hideUnprofiledSamples!
                                }
                            />
                        </>
                    )}
                </div>
                <div className={'plotsTab'}>
                    <div className="quickPlotsContainer">
                        <strong className="quickPlotsTitle">Examples: </strong>
                        {this.quickPlotButtons}
                    </div>
                    <div style={{ display: 'flex' }}>
                        <div className="leftColumn">
                            {this.dataTypeOptions.isComplete &&
                            this.dataTypeToDataSourceOptions.isComplete &&
                            this.props.coverageInformation.isComplete ? (
                                <Observer>{this.controls}</Observer>
                            ) : (
                                <LoadingIndicator
                                    isLoading={true}
                                    center={true}
                                    size={'big'}
                                />
                            )}
                        </div>
                        <div className="chartWrapper">{this.plot}</div>
                    </div>
                </div>
            </div>
        );
    }
}
