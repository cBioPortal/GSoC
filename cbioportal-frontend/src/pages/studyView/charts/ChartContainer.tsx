import * as React from 'react';
import styles from './styles.module.scss';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import _ from 'lodash';
import {
    ChartControls,
    ChartHeader,
} from 'pages/studyView/chartHeader/ChartHeader';
import {
    StudyViewPageStore,
    SurvivalType,
} from 'pages/studyView/StudyViewPageStore';
import { GenePanel, StudyViewFilter } from 'cbioportal-ts-api-client';
import PieChart from 'pages/studyView/charts/pieChart/PieChart';
import classnames from 'classnames';
import ClinicalTable from 'pages/studyView/table/ClinicalTable';
import SurvivalChart, {
    LegendLocation,
} from '../../resultsView/survival/SurvivalChart';

import BarChart from './barChart/BarChart';
import {
    ChartMeta,
    ChartType,
    ClinicalDataCountSummary,
    DataBin,
    getHeightByDimension,
    getRangeFromDataBins,
    getTableHeightByDimension,
    getWidthByDimension,
    MutationCountVsCnaYBinsMin,
    NumericalGroupComparisonType,
} from '../StudyViewUtils';
import { makeSurvivalChartData } from './survival/StudyViewSurvivalUtils';
import StudyViewDensityScatterPlot from './scatterPlot/StudyViewDensityScatterPlot';
import {
    ChartDimension,
    ChartTypeEnum,
    STUDY_VIEW_CONFIG,
} from '../StudyViewConfig';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import {
    DataType,
    DownloadControlsButton,
    MobxPromise,
} from 'cbioportal-frontend-commons';
import MobxPromiseCache from 'shared/lib/MobxPromiseCache';
import WindowStore from 'shared/components/window/WindowStore';
import { ISurvivalDescription } from 'pages/resultsView/survival/SurvivalDescriptionTable';
import {
    MultiSelectionTable,
    MultiSelectionTableColumn,
    MultiSelectionTableColumnKey,
} from 'pages/studyView/table/MultiSelectionTable';
import { FreqColumnTypeEnum } from '../TableUtils';
import {
    SampleTreatmentsTable,
    SampleTreatmentsTableColumnKey,
} from '../table/treatments/SampleTreatmentsTable';
import { TreatmentTableType } from '../table/treatments/treatmentsTableUtil';
import {
    PatientTreatmentsTable,
    PatientTreatmentsTableColumnKey,
} from '../table/treatments/PatientTreatmentsTable';
import { getComparisonParamsForTable } from 'pages/studyView/StudyViewComparisonUtils';
import ComparisonVsIcon from 'shared/components/ComparisonVsIcon';
import {
    SURVIVAL_COMPACT_MODE_THRESHOLD,
    SURVIVAL_PLOT_X_LABEL_WITH_EVENT_TOOLTIP,
    SURVIVAL_PLOT_X_LABEL_WITHOUT_EVENT_TOOLTIP,
    SURVIVAL_PLOT_Y_LABEL_TOOLTIP,
} from 'pages/resultsView/survival/SurvivalUtil';
import StudyViewViolinPlotTable from 'pages/studyView/charts/violinPlotTable/StudyViewViolinPlotTable';
import { PatientSurvival } from 'shared/model/PatientSurvival';
import ClinicalEventTypeCountTable, {
    ClinicalEventTypeCountColumnKey,
} from 'pages/studyView/table/ClinicalEventTypeCountTable';
import {
    StructuralVariantMultiSelectionTable,
    StructVarMultiSelectionTableColumn,
    StructVarMultiSelectionTableColumnKey,
} from 'pages/studyView/table/StructuralVariantMultiSelectionTable';
import { StructVarGenePair } from 'pages/studyView/StructVarUtils';
import { Modal } from 'react-bootstrap';

export interface AbstractChart {
    toSVGDOMNode: () => Element;
}

export type ChartDownloadType = 'TSV' | 'SVG' | 'PDF' | 'PNG';

export interface IChartContainerDownloadProps {
    type: ChartDownloadType;
    initDownload?: () => Promise<string>;
}

const COMPARISON_CHART_TYPES: ChartType[] = [
    ChartTypeEnum.PIE_CHART,
    ChartTypeEnum.TABLE,
    ChartTypeEnum.BAR_CHART,
    ChartTypeEnum.MUTATED_GENES_TABLE,
    ChartTypeEnum.VARIANT_ANNOTATIONS_TABLE,
    ChartTypeEnum.CNA_GENES_TABLE,
    ChartTypeEnum.SAMPLE_TREATMENTS_TABLE,
    ChartTypeEnum.SAMPLE_TREATMENT_GROUPS_TABLE,
    ChartTypeEnum.SAMPLE_TREATMENT_TARGET_TABLE,
    ChartTypeEnum.PATIENT_TREATMENTS_TABLE,
    ChartTypeEnum.PATIENT_TREATMENT_GROUPS_TABLE,
    ChartTypeEnum.PATIENT_TREATMENT_TARGET_TABLE,
    ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE,
    ChartTypeEnum.STRUCTURAL_VARIANTS_TABLE,
];

export interface IChartContainerProps {
    id?: string;
    chartMeta: ChartMeta;
    chartType: ChartType;
    store: StudyViewPageStore;
    dimension: ChartDimension;
    title: string;
    description?: ISurvivalDescription;
    promise: MobxPromise<any>;
    tooltip?: (d: any) => JSX.Element;
    axisLabelX?: string;
    axisLabelY?: string;
    plotDomain?: {
        x?: { min?: number; max?: number };
        y?: { min?: number; max?: number };
    };
    filters: any;
    studyViewFilters: StudyViewFilter;
    setComparisonConfirmationModal: StudyViewPageStore['setComparisonConfirmationModal'];
    onValueSelection?: any;
    onDataBinSelection?: any;
    getData?:
        | ((dataType?: DataType) => Promise<string | null>)
        | ((dataType?: DataType) => string);
    downloadTypes?: DownloadControlsButton[];
    onResetSelection?: any;
    onDeleteChart: (chartMeta: ChartMeta) => void;
    onChangeChartType: (chartMeta: ChartMeta, newChartType: ChartType) => void;
    onToggleLogScale?: (chartMeta: ChartMeta) => void;
    onToggleLogScaleX?: (chartMeta: ChartMeta) => void;
    onToggleLogScaleY?: (chartMeta: ChartMeta) => void;
    onToggleViolinPlot?: (chartMeta: ChartMeta) => void;
    onToggleBoxPlot?: (chartMeta: ChartMeta) => void;
    onToggleNAValue?: (chartMeta: ChartMeta) => void;
    onSwapAxes?: (chartMeta: ChartMeta) => void;
    logScaleChecked?: boolean;
    showLogScaleToggle?: boolean;
    logScaleXChecked?: boolean;
    showLogScaleXToggle?: boolean;
    logScaleYChecked?: boolean;
    showLogScaleYToggle?: boolean;
    showBoxPlotToggle?: boolean;
    boxPlotChecked?: boolean;
    showViolinPlotToggle?: boolean;
    violinPlotChecked?: boolean;
    isShowNAChecked?: boolean;
    showNAToggle?: boolean;
    selectedCategories?: string[];
    selectedGenes?: any;
    cancerGenes: number[];
    onGeneSelect?: any;
    selectedStructuralVariants?: StructVarGenePair[];
    onStructuralVariantSelect?: any;
    isNewlyAdded: (uniqueKey: string) => boolean;
    cancerGeneFilterEnabled: boolean;
    filterByCancerGenes?: boolean;
    alterationFilterEnabled: boolean;
    filterAlterations?: boolean;
    onChangeCancerGeneFilter?: (filtered: boolean) => void;
    analysisGroupsSettings: StudyViewPageStore['analysisGroupsSettings'];
    patientToAnalysisGroup?: MobxPromise<{
        [uniquePatientKey: string]: string;
    }>;
    sampleToAnalysisGroup?: MobxPromise<{ [uniqueSampleKey: string]: string }>;
    genePanelCache: MobxPromiseCache<{ genePanelId: string }, GenePanel>;
    mutationFilterActive?: boolean;
    alterationFilterActive?: boolean;
    isLeftTruncationAvailable?: boolean;
    patientSurvivalsWithoutLeftTruncation?: PatientSurvival[];
    onToggleSurvivalPlotLeftTruncation?: (chartMeta: ChartMeta) => void;
    survivalPlotLeftTruncationChecked?: boolean;
}

@observer
export class ChartContainer extends React.Component<IChartContainerProps, {}> {
    private chartHeaderHeight = 20;

    private handlers: any;
    private plot: AbstractChart;

    private mouseLeaveTimeout: any;

    @observable mouseInChart: boolean = false;
    @observable placement: 'left' | 'right' = 'right';
    @observable chartType: ChartType;

    @observable newlyAdded = false;
    @observable private selectedRowsKeys: string[] = [];

    @observable alertContent: JSX.Element | string | null = null;

    @observable renderPieChartForDownload: boolean = false;

    constructor(props: IChartContainerProps) {
        super(props);

        makeObservable(this);

        this.chartType = this.props.chartType;

        this.handlers = {
            ref: (plot: AbstractChart) => {
                this.plot = plot;
            },
            resetFilters: action(() => {
                // in manual submit mode, we cannot have users REMOVE filters using the chart UI.
                // filters can only be removed by using the filter tokens at the top of the page
                // this limitation is due to shortcut taken to enable manual submit mode
                // which was taken in order to avoid significant refactor
                if (this.props.store.hesitateUpdate) {
                    this.alertContent =
                        'In manual submit mode, you can only clear filters using the filter tokens at the top of the page.';
                } else {
                    this.props.onResetSelection(this.props.chartMeta, []);
                }
            }),
            onValueSelection: action((values: string[]) => {
                // in manual submit mode, we cannot have users REMOVE filters using the chart UI.
                // filters can only be removed by using the filter tokens at the top of the page
                // this limitation is due to shortcut taken to enable manual submit mode
                // which was taken in order to avoid significant refactor
                if (
                    this.props.store.hesitateUpdate &&
                    values.length < this.props.filters.length
                ) {
                    this.alertContent =
                        'In manual submit mode, you can only remove filters using the filter tokens at the top of the page.';
                } else {
                    this.props.onValueSelection(this.props.chartMeta, values);
                }
            }),
            onChangeSelectedRows: action((values: string[]) => {
                this.selectedRowsKeys = values;
            }),
            onDataBinSelection: action((dataBins: DataBin[]) => {
                this.props.onDataBinSelection(this.props.chartMeta, dataBins);
            }),
            onToggleLogScale: action(() => {
                this.props.onToggleLogScale?.(this.props.chartMeta);
            }),
            onToggleLogScaleX: action(() => {
                this.props.onToggleLogScaleX?.(this.props.chartMeta);
            }),
            onToggleLogScaleY: action(() => {
                this.props.onToggleLogScaleY?.(this.props.chartMeta);
            }),
            onToggleBoxPlot: action(() => {
                this.props.onToggleBoxPlot?.(this.props.chartMeta);
            }),
            onToggleViolinPlot: action(() => {
                this.props.onToggleViolinPlot?.(this.props.chartMeta);
            }),
            onToggleNAValue: action(() => {
                this.props.onToggleNAValue?.(this.props.chartMeta);
            }),
            onToggleSurvivalPlotLeftTruncation: action(() => {
                this.props.onToggleSurvivalPlotLeftTruncation?.(
                    this.props.chartMeta
                );
            }),
            onSwapAxes: action(() => {
                this.props.onSwapAxes?.(this.props.chartMeta);
            }),
            onMouseEnterChart: action((event: React.MouseEvent<any>) => {
                if (this.mouseLeaveTimeout) {
                    clearTimeout(this.mouseLeaveTimeout);
                }
                this.placement =
                    event.nativeEvent.x > WindowStore.size.width - 400
                        ? 'left'
                        : 'right';
                this.mouseInChart = true;
            }),
            onMouseLeaveChart: action(() => {
                this.mouseLeaveTimeout = setTimeout(() => {
                    this.placement = 'right';
                    this.mouseInChart = false;
                }, 100);
            }),
            defaultDownload: {
                SVG: () =>
                    Promise.resolve(
                        new XMLSerializer().serializeToString(
                            this.toSVGDOMNode()
                        )
                    ),
                PNG: () => Promise.resolve(this.toSVGDOMNode()),
                PDF: () => Promise.resolve(this.toSVGDOMNode()),
            },
            onChangeChartType: (newChartType: ChartType) => {
                this.mouseInChart = false;
                this.props.onChangeChartType(
                    this.props.chartMeta,
                    newChartType
                );
            },
            onDeleteChart: () => {
                this.props.onDeleteChart(this.props.chartMeta);
            },
        };

        makeObservable(this);
    }

    public toSVGDOMNode(): SVGElement {
        if (this.plot) {
            // Get result of plot
            return this.plot.toSVGDOMNode() as SVGElement;
        } else {
            return document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg'
            );
        }
    }

    @computed
    get chartControls(): ChartControls {
        let controls: Partial<ChartControls> = {};
        switch (this.chartType) {
            case ChartTypeEnum.BAR_CHART: {
                controls = {
                    showLogScaleToggle: this.props.showLogScaleToggle,
                    logScaleChecked: this.props.logScaleChecked,
                    isShowNAChecked: this.props.isShowNAChecked,
                    showNAToggle: this.props.showNAToggle,
                };
                break;
            }
            case ChartTypeEnum.SCATTER: {
                controls = {
                    showLogScaleXToggle: this.props.showLogScaleXToggle,
                    logScaleXChecked: this.props.logScaleXChecked,
                    showLogScaleYToggle: this.props.showLogScaleYToggle,
                    logScaleYChecked: this.props.logScaleYChecked,
                    showSwapAxes: !!this.props.onSwapAxes,
                };
                break;
            }
            case ChartTypeEnum.VIOLIN_PLOT_TABLE:
                controls = {
                    showLogScaleToggle: this.props.showLogScaleToggle,
                    logScaleChecked: this.props.logScaleChecked,
                    showViolinPlotToggle: this.props.showViolinPlotToggle,
                    violinPlotChecked: this.props.violinPlotChecked,
                    showBoxPlotToggle: this.props.showBoxPlotToggle,
                    boxPlotChecked: this.props.boxPlotChecked,
                };
                break;
            case ChartTypeEnum.PIE_CHART: {
                controls = { showTableIcon: true };
                break;
            }
            case ChartTypeEnum.TABLE: {
                controls = { showPieIcon: true };
                break;
            }
            case ChartTypeEnum.SURVIVAL: {
                controls = {
                    showSurvivalPlotLeftTruncationToggle: this.props
                        .isLeftTruncationAvailable,
                    survivalPlotLeftTruncationChecked: this.props
                        .survivalPlotLeftTruncationChecked,
                };
            }
        }
        if (this.comparisonPagePossible) {
            controls.showComparisonPageIcon = true;
        }
        return {
            ...controls,
            showResetIcon: this.props.filters && this.props.filters.length > 0,
        } as ChartControls;
    }

    @action.bound
    changeChartType(chartType: ChartType): void {
        this.chartType = chartType;
        this.handlers.onChangeChartType(chartType);
    }

    // toggle function to render pie chart to access its ref for table svg and pdf download options
    @action.bound
    toggleRenderPieChartForDownload(): void {
        this.renderPieChartForDownload = !this.renderPieChartForDownload;
    }

    @computed
    get comparisonPagePossible(): boolean {
        return (
            this.props.promise.isComplete &&
            (this.props.promise.result.treatments ??
                this.props.promise.result.patientTreatments ??
                this.props.promise.result)!.length > 1 &&
            COMPARISON_CHART_TYPES.indexOf(this.props.chartType) > -1
        );
    }

    @action.bound
    openComparisonPage(params?: {
        // for numerical clinical attributes
        categorizationType?: NumericalGroupComparisonType;
        // for mutated genes table and genomic data count chart
        hugoGeneSymbols?: string[];
        // for treatments tables
        treatmentUniqueKeys?: string[];
    }) {
        const foo = this.comparisonPagePossible;
        if (foo) {
            switch (this.props.chartType) {
                case ChartTypeEnum.PIE_CHART:
                case ChartTypeEnum.TABLE:
                    this.props.store.openComparisonPage(this.props.chartMeta, {
                        clinicalAttributeValues: this.props.promise
                            .result! as ClinicalDataCountSummary[],
                    });
                    break;
                default:
                    this.props.store.openComparisonPage(
                        this.props.chartMeta,
                        params || {}
                    );
                    break;
            }
        }
    }

    @computed get survivalChartData() {
        // need to put this in @computed instead of a remoteData, because in a remoteData any changes to props trigger
        //   a rerender with delay
        if (
            this.props.promise.isComplete &&
            this.props.store.survivalPlotDataById.isComplete &&
            this.props.patientToAnalysisGroup &&
            this.props.patientToAnalysisGroup.isComplete
        ) {
            const survival: SurvivalType = _.find(
                this.props.promise.result!,
                survivalPlot => {
                    return survivalPlot.id === this.props.chartMeta.uniqueKey;
                }
            );
            return makeSurvivalChartData(
                this.props.store.survivalPlotDataById.result[
                    this.props.chartMeta.uniqueKey
                ]?.survivalData,
                this.props.analysisGroupsSettings.groups,
                this.props.patientToAnalysisGroup!.result!,
                this.props.chartMeta.uniqueKey
            );
        } else {
            return undefined;
        }
    }

    // Scatter plot has a weird height setting.
    getScatterPlotHeight(height: number) {
        return (
            STUDY_VIEW_CONFIG.layout.grid.h * height -
            this.chartHeaderHeight +
            33
        );
    }

    @computed
    get borderWidth() {
        return this.highlightChart ? 2 : 1;
    }

    @computed
    get showCompactSurvivalChart() {
        // returns true when selected survivals are larger than the threshold
        if (
            !_.isEmpty(this.survivalChartData) &&
            !_.isEmpty(this.survivalChartData!.sortedGroupedSurvivals)
        ) {
            return _.some(
                this.survivalChartData!.sortedGroupedSurvivals!,
                survivals => survivals.length > SURVIVAL_COMPACT_MODE_THRESHOLD
            );
        }
        return false;
    }

    @computed get comparisonButtonForTables() {
        if (this.selectedRowsKeys!.length >= 2 && this.comparisonPagePossible) {
            return {
                content: (
                    <div
                        data-tour="mutated-genes-table-compare-btn"
                        data-test="table-compare-btn"
                        style={{ display: 'flex', alignItems: 'center' }}
                    >
                        <ComparisonVsIcon
                            className={classnames('fa fa-fw')}
                            style={{ marginRight: 4 }}
                        />
                        Compare
                    </div>
                ),
                onClick: () => {
                    this.openComparisonPage(
                        getComparisonParamsForTable(
                            this.selectedRowsKeys,
                            this.chartType
                        )
                    );
                },
                isDisabled: () => this.selectedRowsKeys!.length < 2,
            };
        } else {
            return undefined;
        }
    }

    @computed
    get chart(): (() => JSX.Element) | null {
        switch (this.chartType) {
            case ChartTypeEnum.PIE_CHART: {
                return () => (
                    <PieChart
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        ref={this.handlers.ref}
                        onUserSelection={this.handlers.onValueSelection}
                        openComparisonPage={
                            this.comparisonPagePossible
                                ? this.openComparisonPage
                                : undefined
                        }
                        filters={this.props.filters}
                        data={this.props.promise.result}
                        placement={this.placement}
                        label={this.props.title}
                        labelDescription={this.props.chartMeta.description}
                        patientAttribute={this.props.chartMeta.patientAttribute}
                    />
                );
            }
            case ChartTypeEnum.BAR_CHART: {
                return () => (
                    <BarChart
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        ref={this.handlers.ref}
                        onUserSelection={this.handlers.onDataBinSelection}
                        filters={this.props.filters}
                        data={this.props.promise.result}
                        showNAChecked={this.props.store.isShowNAChecked(
                            this.props.chartMeta.uniqueKey
                        )}
                    />
                );
            }
            case ChartTypeEnum.TABLE: {
                return () => (
                    <>
                        <ClinicalTable
                            data={this.props.promise.result}
                            width={getWidthByDimension(
                                this.props.dimension,
                                this.borderWidth
                            )}
                            height={getTableHeightByDimension(
                                this.props.dimension,
                                this.chartHeaderHeight
                            )}
                            filters={this.props.filters}
                            onUserSelection={this.handlers.onValueSelection}
                            labelDescription={this.props.chartMeta.description}
                            patientAttribute={
                                this.props.chartMeta.patientAttribute
                            }
                            showAddRemoveAllButtons={this.mouseInChart}
                            title={this.props.title}
                        />
                        {this.renderPieChartForDownload && (
                            <div className="hiddenByPosition">
                                <PieChart
                                    width={getWidthByDimension(
                                        this.props.dimension,
                                        this.borderWidth
                                    )}
                                    height={getHeightByDimension(
                                        this.props.dimension,
                                        this.chartHeaderHeight
                                    )}
                                    ref={this.handlers.ref}
                                    onUserSelection={
                                        this.handlers.onValueSelection
                                    }
                                    openComparisonPage={
                                        this.comparisonPagePossible
                                            ? this.openComparisonPage
                                            : undefined
                                    }
                                    filters={this.props.filters}
                                    data={this.props.promise.result}
                                    placement={this.placement}
                                    label={this.props.title}
                                    labelDescription={
                                        this.props.chartMeta.description
                                    }
                                    patientAttribute={
                                        this.props.chartMeta.patientAttribute
                                    }
                                />
                            </div>
                        )}
                    </>
                );
            }
            case ChartTypeEnum.MUTATED_GENES_TABLE: {
                return () => {
                    const numColumn: MultiSelectionTableColumn = {
                        columnKey: MultiSelectionTableColumnKey.NUMBER,
                    };
                    if (this.props.store.isGlobalMutationFilterActive) {
                        numColumn.columnTooltip = (
                            <span data-test="hidden-mutation-alterations">
                                Total number of mutations
                                <br />
                                This table is filtered based on selections in
                                the <i>Alteration Filter</i> menu.
                            </span>
                        );
                    }
                    return (
                        <MultiSelectionTable
                            tableType={FreqColumnTypeEnum.MUTATION}
                            promise={this.props.promise}
                            width={getWidthByDimension(
                                this.props.dimension,
                                this.borderWidth
                            )}
                            height={getTableHeightByDimension(
                                this.props.dimension,
                                this.chartHeaderHeight
                            )}
                            filters={this.props.filters}
                            onSubmitSelection={this.handlers.onValueSelection}
                            onChangeSelectedRows={
                                this.handlers.onChangeSelectedRows
                            }
                            extraButtons={
                                this.comparisonButtonForTables && [
                                    this.comparisonButtonForTables,
                                ]
                            }
                            selectedRowsKeys={this.selectedRowsKeys}
                            onGeneSelect={this.props.onGeneSelect}
                            selectedGenes={this.props.selectedGenes}
                            genePanelCache={this.props.genePanelCache}
                            cancerGeneFilterEnabled={
                                this.props.cancerGeneFilterEnabled
                            }
                            filterByCancerGenes={
                                this.props.filterByCancerGenes!
                            }
                            onChangeCancerGeneFilter={
                                this.props.onChangeCancerGeneFilter!
                            }
                            alterationFilterEnabled={
                                this.props.alterationFilterEnabled
                            }
                            filterAlterations={this.props.filterAlterations}
                            columns={[
                                {
                                    columnKey:
                                        MultiSelectionTableColumnKey.GENE,
                                },
                                {
                                    columnKey:
                                        MultiSelectionTableColumnKey.NUMBER_MUTATIONS,
                                },
                                numColumn,
                                {
                                    columnKey:
                                        MultiSelectionTableColumnKey.FREQ,
                                },
                            ]}
                            defaultSortBy={MultiSelectionTableColumnKey.FREQ}
                            setOperationsButtonText={
                                this.props.store.hesitateUpdate
                                    ? 'Add Filters '
                                    : 'Select Samples '
                            }
                        />
                    );
                };
            }
            case ChartTypeEnum.MUTATION_TYPE_COUNTS_TABLE: {
                return () => {
                    const numColumn: MultiSelectionTableColumn = {
                        columnKey: MultiSelectionTableColumnKey.NUMBER,
                    };
                    if (this.props.store.isGlobalMutationFilterActive) {
                        numColumn.columnTooltip = (
                            <span data-test="hidden-mutation-alterations">
                                Total number of mutations
                                <br />
                                This table is filtered based on selections in
                                the <i>Alteration Filter</i> menu.
                            </span>
                        );
                    }

                    return (
                        <MultiSelectionTable
                            tableType={FreqColumnTypeEnum.MUTATION}
                            promise={this.props.promise}
                            width={getWidthByDimension(
                                this.props.dimension,
                                this.borderWidth
                            )}
                            height={getTableHeightByDimension(
                                this.props.dimension,
                                this.chartHeaderHeight
                            )}
                            filters={this.props.filters}
                            onSubmitSelection={this.handlers.onValueSelection}
                            onChangeSelectedRows={
                                this.handlers.onChangeSelectedRows
                            }
                            extraButtons={
                                this.comparisonButtonForTables && [
                                    this.comparisonButtonForTables,
                                ]
                            }
                            selectedRowsKeys={this.selectedRowsKeys}
                            onChangeCancerGeneFilter={
                                this.props.onChangeCancerGeneFilter!
                            }
                            columns={[
                                {
                                    columnKey:
                                        MultiSelectionTableColumnKey.MUTATION_TYPE,
                                },
                                {
                                    columnKey:
                                        MultiSelectionTableColumnKey.NUMBER_MUTATIONS,
                                },
                                numColumn,
                                {
                                    columnKey:
                                        MultiSelectionTableColumnKey.FREQ,
                                },
                            ]}
                            defaultSortBy={MultiSelectionTableColumnKey.FREQ}
                            setOperationsButtonText={
                                this.props.store.hesitateUpdate
                                    ? 'Add Filters '
                                    : 'Select Samples '
                            }
                        />
                    );
                };
            }
            case ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE: {
                return () => {
                    const numColumn: MultiSelectionTableColumn = {
                        columnKey: MultiSelectionTableColumnKey.NUMBER,
                    };
                    if (this.props.store.isGlobalMutationFilterActive) {
                        numColumn.columnTooltip = (
                            <span data-test="hidden-fusion-alterations">
                                Total number of fusions
                                <br />
                                This table is filtered based on selections in
                                the <i>Alteration Filter</i> menu.
                            </span>
                        );
                    }
                    return (
                        <MultiSelectionTable
                            tableType={FreqColumnTypeEnum.STRUCTURAL_VARIANT}
                            promise={this.props.promise}
                            width={getWidthByDimension(
                                this.props.dimension,
                                this.borderWidth
                            )}
                            height={getTableHeightByDimension(
                                this.props.dimension,
                                this.chartHeaderHeight
                            )}
                            filters={this.props.filters}
                            onSubmitSelection={this.handlers.onValueSelection}
                            onChangeSelectedRows={
                                this.handlers.onChangeSelectedRows
                            }
                            extraButtons={
                                this.comparisonButtonForTables && [
                                    this.comparisonButtonForTables,
                                ]
                            }
                            selectedRowsKeys={this.selectedRowsKeys}
                            onGeneSelect={this.props.onGeneSelect}
                            selectedGenes={this.props.selectedGenes}
                            genePanelCache={this.props.genePanelCache}
                            cancerGeneFilterEnabled={
                                this.props.cancerGeneFilterEnabled
                            }
                            filterByCancerGenes={
                                this.props.filterByCancerGenes!
                            }
                            onChangeCancerGeneFilter={
                                this.props.onChangeCancerGeneFilter!
                            }
                            alterationFilterEnabled={
                                this.props.alterationFilterEnabled
                            }
                            filterAlterations={this.props.filterAlterations}
                            columns={[
                                {
                                    columnKey:
                                        MultiSelectionTableColumnKey.GENE,
                                },
                                {
                                    columnKey:
                                        MultiSelectionTableColumnKey.NUMBER_STRUCTURAL_VARIANTS,
                                },
                                numColumn,
                                {
                                    columnKey:
                                        MultiSelectionTableColumnKey.FREQ,
                                },
                            ]}
                            defaultSortBy={
                                MultiSelectionTableColumnKey.NUMBER_STRUCTURAL_VARIANTS
                            }
                            setOperationsButtonText={
                                this.props.store.hesitateUpdate
                                    ? 'Add Filters '
                                    : 'Select Samples '
                            }
                        />
                    );
                };
            }
            case ChartTypeEnum.STRUCTURAL_VARIANTS_TABLE: {
                return () => {
                    const numColumn: StructVarMultiSelectionTableColumn = {
                        columnKey: StructVarMultiSelectionTableColumnKey.NUMBER,
                    };
                    if (this.props.store.isGlobalMutationFilterActive) {
                        numColumn.columnTooltip = (
                            <span data-test="hidden-fusion-alterations">
                                Total number of fusions
                                <br />
                                This table is filtered based on selections in
                                the <i>Alteration Filter</i> menu.
                            </span>
                        );
                    }
                    return (
                        <StructuralVariantMultiSelectionTable
                            tableType={
                                FreqColumnTypeEnum.STRUCTURAL_VARIANT_PAIR
                            }
                            promise={this.props.promise}
                            width={getWidthByDimension(
                                this.props.dimension,
                                this.borderWidth
                            )}
                            height={getTableHeightByDimension(
                                this.props.dimension,
                                this.chartHeaderHeight
                            )}
                            filters={this.props.filters}
                            onSubmitSelection={this.handlers.onValueSelection}
                            onChangeSelectedRows={
                                this.handlers.onChangeSelectedRows
                            }
                            extraButtons={
                                this.comparisonButtonForTables && [
                                    this.comparisonButtonForTables,
                                ]
                            }
                            selectedRowsKeys={this.selectedRowsKeys}
                            onStructuralVariantSelect={
                                this.props.onStructuralVariantSelect
                            }
                            selectedStructVars={
                                this.props.selectedStructuralVariants || []
                            }
                            genePanelCache={this.props.genePanelCache}
                            cancerGeneFilterEnabled={
                                this.props.cancerGeneFilterEnabled
                            }
                            filterByCancerGenes={
                                this.props.filterByCancerGenes!
                            }
                            onChangeCancerGeneFilter={
                                this.props.onChangeCancerGeneFilter!
                            }
                            alterationFilterEnabled={
                                this.props.alterationFilterEnabled
                            }
                            filterAlterations={this.props.filterAlterations}
                            columns={[
                                {
                                    columnKey:
                                        StructVarMultiSelectionTableColumnKey.STRUCTVAR_SELECT,
                                },
                                {
                                    columnKey:
                                        StructVarMultiSelectionTableColumnKey.GENE1,
                                },
                                {
                                    columnKey:
                                        StructVarMultiSelectionTableColumnKey.GENE2,
                                },
                                {
                                    columnKey:
                                        StructVarMultiSelectionTableColumnKey.NUMBER_STRUCTURAL_VARIANTS,
                                },
                                numColumn,
                                {
                                    columnKey:
                                        StructVarMultiSelectionTableColumnKey.FREQ,
                                },
                            ]}
                            defaultSortBy={
                                StructVarMultiSelectionTableColumnKey.FREQ
                            }
                            setOperationsButtonText={
                                this.props.store.hesitateUpdate
                                    ? 'Add Filters '
                                    : 'Select Samples '
                            }
                        />
                    );
                };
            }
            case ChartTypeEnum.CNA_GENES_TABLE: {
                return () => {
                    const numColumn: MultiSelectionTableColumn = {
                        columnKey: MultiSelectionTableColumnKey.NUMBER,
                        columnWidthRatio: 0.17,
                    };
                    if (this.props.store.isGlobalAlterationFilterActive) {
                        numColumn.columnTooltip = (
                            <span data-test="hidden-fusion-alterations">
                                Number of samples with one or more copy number
                                alterations
                                <br />
                                This table is filtered based on selections in
                                the <i>Alteration Filter</i> menu.
                            </span>
                        );
                    }
                    return (
                        <MultiSelectionTable
                            tableType={FreqColumnTypeEnum.CNA}
                            promise={this.props.promise}
                            width={getWidthByDimension(
                                this.props.dimension,
                                this.borderWidth
                            )}
                            height={getTableHeightByDimension(
                                this.props.dimension,
                                this.chartHeaderHeight
                            )}
                            filters={this.props.filters}
                            onSubmitSelection={this.handlers.onValueSelection}
                            onChangeSelectedRows={
                                this.handlers.onChangeSelectedRows
                            }
                            extraButtons={
                                this.comparisonButtonForTables && [
                                    this.comparisonButtonForTables,
                                ]
                            }
                            selectedRowsKeys={this.selectedRowsKeys}
                            onGeneSelect={this.props.onGeneSelect}
                            selectedGenes={this.props.selectedGenes}
                            genePanelCache={this.props.genePanelCache}
                            cancerGeneFilterEnabled={
                                this.props.cancerGeneFilterEnabled
                            }
                            filterByCancerGenes={
                                this.props.filterByCancerGenes!
                            }
                            onChangeCancerGeneFilter={
                                this.props.onChangeCancerGeneFilter!
                            }
                            alterationFilterEnabled={
                                this.props.alterationFilterEnabled
                            }
                            filterAlterations={this.props.filterAlterations}
                            columns={[
                                {
                                    columnKey:
                                        MultiSelectionTableColumnKey.GENE,
                                    columnWidthRatio: 0.24,
                                },
                                {
                                    columnKey:
                                        MultiSelectionTableColumnKey.CYTOBAND,
                                    columnWidthRatio: 0.24,
                                },
                                {
                                    columnKey: MultiSelectionTableColumnKey.CNA,
                                    columnWidthRatio: 0.18,
                                },
                                numColumn,
                                {
                                    columnKey:
                                        MultiSelectionTableColumnKey.FREQ,
                                    columnWidthRatio: 0.17,
                                },
                            ]}
                            defaultSortBy={MultiSelectionTableColumnKey.FREQ}
                            setOperationsButtonText={
                                this.props.store.hesitateUpdate
                                    ? 'Add Filters '
                                    : 'Select Samples '
                            }
                        />
                    );
                };
            }
            case ChartTypeEnum.VARIANT_ANNOTATIONS_TABLE: {
                return () => (
                    <MultiSelectionTable
                        tableType={FreqColumnTypeEnum.VA}
                        promise={this.props.promise}
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getTableHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        filters={this.props.filters}
                        onSubmitSelection={this.handlers.onValueSelection}
                        onChangeSelectedRows={
                            this.handlers.onChangeSelectedRows
                        }
                        extraButtons={
                            this.comparisonButtonForTables && [
                                this.comparisonButtonForTables,
                            ]
                        }
                        selectedRowsKeys={this.selectedRowsKeys}
                        cancerGeneFilterEnabled={
                            this.props.cancerGeneFilterEnabled
                        }
                        filterByCancerGenes={this.props.filterByCancerGenes!}
                        onChangeCancerGeneFilter={
                            this.props.onChangeCancerGeneFilter!
                        }
                        columns={[
                            {
                                columnKey:
                                    MultiSelectionTableColumnKey.ANNOTATION,
                            },
                            {
                                columnKey:
                                    MultiSelectionTableColumnKey.NUMBER_VARIANT_ANNOTATIONS,
                            },
                            {
                                columnKey: MultiSelectionTableColumnKey.NUMBER,
                            },
                            {
                                columnKey: MultiSelectionTableColumnKey.FREQ,
                            },
                        ]}
                        defaultSortBy={MultiSelectionTableColumnKey.FREQ}
                        setOperationsButtonText={
                            this.props.store.hesitateUpdate
                                ? 'Add Filters '
                                : 'Select Samples '
                        }
                    />
                );
            }
            case ChartTypeEnum.GENOMIC_PROFILES_TABLE: {
                return () => (
                    <MultiSelectionTable
                        tableType={FreqColumnTypeEnum.DATA}
                        promise={this.props.promise}
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getTableHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        filters={this.props.filters}
                        onSubmitSelection={this.handlers.onValueSelection}
                        onChangeSelectedRows={
                            this.handlers.onChangeSelectedRows
                        }
                        selectedRowsKeys={this.selectedRowsKeys}
                        onGeneSelect={this.props.onGeneSelect}
                        selectedGenes={this.props.selectedGenes}
                        genePanelCache={this.props.genePanelCache}
                        cancerGeneFilterEnabled={
                            this.props.cancerGeneFilterEnabled
                        }
                        filterByCancerGenes={this.props.filterByCancerGenes!}
                        onChangeCancerGeneFilter={
                            this.props.onChangeCancerGeneFilter!
                        }
                        columns={[
                            {
                                columnKey:
                                    MultiSelectionTableColumnKey.MOLECULAR_PROFILE,
                            },
                            {
                                columnKey: MultiSelectionTableColumnKey.NUMBER,
                            },
                            {
                                columnKey: MultiSelectionTableColumnKey.FREQ,
                            },
                        ]}
                        defaultSortBy={MultiSelectionTableColumnKey.FREQ}
                        setOperationsButtonText={
                            this.props.store.hesitateUpdate
                                ? 'Add Filters '
                                : 'Select Samples '
                        }
                    />
                );
            }
            case ChartTypeEnum.CASE_LIST_TABLE: {
                return () => (
                    <MultiSelectionTable
                        tableType={FreqColumnTypeEnum.DATA}
                        promise={this.props.promise}
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getTableHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        filters={this.props.filters}
                        onSubmitSelection={this.handlers.onValueSelection}
                        onChangeSelectedRows={
                            this.handlers.onChangeSelectedRows
                        }
                        selectedRowsKeys={this.selectedRowsKeys}
                        onGeneSelect={this.props.onGeneSelect}
                        selectedGenes={this.props.selectedGenes}
                        genePanelCache={this.props.genePanelCache}
                        cancerGeneFilterEnabled={
                            this.props.cancerGeneFilterEnabled
                        }
                        filterByCancerGenes={this.props.filterByCancerGenes!}
                        onChangeCancerGeneFilter={
                            this.props.onChangeCancerGeneFilter!
                        }
                        columns={[
                            {
                                columnKey:
                                    MultiSelectionTableColumnKey.CASE_LIST,
                            },
                            {
                                columnKey: MultiSelectionTableColumnKey.NUMBER,
                            },
                            {
                                columnKey: MultiSelectionTableColumnKey.FREQ,
                            },
                        ]}
                        defaultSortBy={MultiSelectionTableColumnKey.FREQ}
                        setOperationsButtonText={
                            this.props.store.hesitateUpdate
                                ? 'Add Filters '
                                : 'Select Samples '
                        }
                    />
                );
            }
            case ChartTypeEnum.SURVIVAL: {
                if (this.survivalChartData) {
                    const data = this.survivalChartData;
                    return () => (
                        <SurvivalChart
                            ref={this.handlers.ref}
                            sortedGroupedSurvivals={data.sortedGroupedSurvivals}
                            patientSurvivalsWithoutLeftTruncation={
                                this.props.patientSurvivalsWithoutLeftTruncation
                            }
                            patientToAnalysisGroups={
                                data.patientToAnalysisGroups
                            }
                            pValue={data.pValue}
                            analysisGroups={data.analysisGroups}
                            legendLocation={LegendLocation.TOOLTIP}
                            title={this.props.title}
                            totalCasesHeader="Number of Cases, Total"
                            statusCasesHeader="Number of Events"
                            medianMonthsHeader="Median Months Survival"
                            yLabelTooltip={SURVIVAL_PLOT_Y_LABEL_TOOLTIP}
                            xLabelWithEventTooltip={
                                SURVIVAL_PLOT_X_LABEL_WITH_EVENT_TOOLTIP
                            }
                            xLabelWithoutEventTooltip={
                                SURVIVAL_PLOT_X_LABEL_WITHOUT_EVENT_TOOLTIP
                            }
                            showDownloadButtons={false}
                            showSlider={false}
                            showTable={false}
                            isLeftTruncationAvailable={
                                this.props.isLeftTruncationAvailable
                            }
                            showLeftTruncationCheckbox={
                                this.props.isLeftTruncationAvailable
                            }
                            isLeftTruncationChecked={
                                this.props.survivalPlotLeftTruncationChecked
                            }
                            onToggleSurvivalPlotLeftTruncation={() =>
                                this.props.onToggleSurvivalPlotLeftTruncation!(
                                    this.props.chartMeta
                                )
                            }
                            styleOpts={{
                                padding: {
                                    top: 15,
                                    bottom: 30,
                                    left: 45,
                                    right: 20,
                                },
                                width: getWidthByDimension(
                                    this.props.dimension,
                                    this.borderWidth
                                ),
                                height:
                                    getHeightByDimension(
                                        this.props.dimension,
                                        this.chartHeaderHeight
                                    ) -
                                    (this.props.isLeftTruncationAvailable
                                        ? 35
                                        : 0),
                                tooltipXOffset: 10,
                                tooltipYOffset: -58,
                                pValue: {
                                    x:
                                        getWidthByDimension(
                                            this.props.dimension,
                                            this.borderWidth
                                        ) - 10,
                                    y: 30,
                                    textAnchor: 'end',
                                },
                                axis: {
                                    y: {
                                        axisLabel: {
                                            padding: 40,
                                        },
                                    },
                                },
                            }}
                            fileName={this.props.title.replace(' ', '_')}
                            // scatter the tick to avoid text overlaping on study view survival plots
                            yAxisTickCount={2}
                            xAxisTickCount={4}
                            compactMode={this.showCompactSurvivalChart}
                            attributeId={data.attributeId}
                            onUserSelection={this.handlers.onDataBinSelection}
                        />
                    );
                } else {
                    return null;
                }
            }
            case ChartTypeEnum.SAMPLE_TREATMENT_TARGET_TABLE:
            case ChartTypeEnum.SAMPLE_TREATMENT_GROUPS_TABLE:
            case ChartTypeEnum.SAMPLE_TREATMENTS_TABLE: {
                return () => (
                    <SampleTreatmentsTable
                        tableType={TreatmentTableType.SAMPLE}
                        promise={this.props.promise}
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getTableHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        filters={this.props.filters}
                        onSubmitSelection={this.handlers.onValueSelection}
                        onChangeSelectedRows={
                            this.handlers.onChangeSelectedRows
                        }
                        extraButtons={
                            this.comparisonButtonForTables && [
                                this.comparisonButtonForTables,
                            ]
                        }
                        selectedRowsKeys={this.selectedRowsKeys}
                        columns={[
                            {
                                columnKey:
                                    SampleTreatmentsTableColumnKey.TREATMENT,
                            },
                            { columnKey: SampleTreatmentsTableColumnKey.TIME },
                            { columnKey: SampleTreatmentsTableColumnKey.COUNT },
                        ]}
                        defaultSortBy={SampleTreatmentsTableColumnKey.COUNT}
                        selectedTreatments={[]}
                        setOperationsButtonText={
                            this.props.store.hesitateUpdate
                                ? 'Add Filters '
                                : 'Select Samples '
                        }
                    />
                );
            }
            case ChartTypeEnum.PATIENT_TREATMENT_TARGET_TABLE:
            case ChartTypeEnum.PATIENT_TREATMENT_GROUPS_TABLE:
            case ChartTypeEnum.PATIENT_TREATMENTS_TABLE: {
                return () => (
                    <PatientTreatmentsTable
                        tableType={TreatmentTableType.PATIENT}
                        promise={this.props.promise}
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getTableHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        filters={this.props.filters}
                        onSubmitSelection={this.handlers.onValueSelection}
                        onChangeSelectedRows={
                            this.handlers.onChangeSelectedRows
                        }
                        extraButtons={
                            this.comparisonButtonForTables && [
                                this.comparisonButtonForTables,
                            ]
                        }
                        selectedRowsKeys={this.selectedRowsKeys}
                        columns={[
                            {
                                columnKey:
                                    PatientTreatmentsTableColumnKey.TREATMENT,
                            },
                            {
                                columnKey:
                                    PatientTreatmentsTableColumnKey.COUNT,
                            },
                        ]}
                        defaultSortBy={PatientTreatmentsTableColumnKey.COUNT}
                        selectedTreatments={[]}
                        setOperationsButtonText={
                            this.props.store.hesitateUpdate
                                ? 'Add Filters '
                                : 'Select Samples '
                        }
                    />
                );
            }
            case ChartTypeEnum.CLINICAL_EVENT_TYPE_COUNTS_TABLE: {
                return () => (
                    <ClinicalEventTypeCountTable
                        promise={this.props.promise}
                        width={getWidthByDimension(
                            this.props.dimension,
                            this.borderWidth
                        )}
                        height={getTableHeightByDimension(
                            this.props.dimension,
                            this.chartHeaderHeight
                        )}
                        filters={this.props.filters}
                        onSubmitSelection={this.handlers.onValueSelection}
                        onChangeSelectedRows={
                            this.handlers.onChangeSelectedRows
                        }
                        selectedRowsKeys={this.selectedRowsKeys}
                        columns={[
                            {
                                columnKey:
                                    ClinicalEventTypeCountColumnKey.CLINICAL_EVENT_TYPE,
                            },
                            {
                                columnKey:
                                    ClinicalEventTypeCountColumnKey.COUNT,
                            },
                            {
                                columnKey: ClinicalEventTypeCountColumnKey.FREQ,
                            },
                        ]}
                        selectedPatientsKeyPromise={
                            this.props.store.selectedPatientKeys
                        }
                        defaultSortBy={ClinicalEventTypeCountColumnKey.COUNT}
                        setOperationsButtonText={
                            this.props.store.hesitateUpdate
                                ? 'Add Filters '
                                : 'Select Samples '
                        }
                    />
                );
            }
            case ChartTypeEnum.SCATTER: {
                return () => (
                    <div
                        style={{
                            overflow: 'hidden',
                            height: getHeightByDimension(
                                this.props.dimension,
                                this.chartHeaderHeight
                            ),
                        }}
                    >
                        {/* have to do all this weird positioning to decrease gap btwn chart and title, bc I cant do it from within Victory */}
                        {/* overflow: "hidden" because otherwise the large SVG (I have to make it larger to make the plot large enough to
                            decrease the gap) will cover the header controls and make them unclickable */}
                        <div style={{ marginTop: -33 }}>
                            <StudyViewDensityScatterPlot
                                ref={this.handlers.ref}
                                width={getWidthByDimension(
                                    this.props.dimension,
                                    this.borderWidth
                                )}
                                height={this.getScatterPlotHeight(
                                    this.props.dimension.h
                                )}
                                spearmanCorr={
                                    this.props.promise.result.spearmanCorr
                                }
                                pearsonCorr={
                                    this.props.promise.result.pearsonCorr
                                }
                                plotDomain={this.props.plotDomain}
                                yBinsMin={MutationCountVsCnaYBinsMin}
                                onSelection={this.props.onValueSelection}
                                selectionBounds={
                                    this.props.filters &&
                                    this.props.filters.length > 0
                                        ? this.props.filters[0]
                                        : undefined
                                }
                                data={this.props.promise.result.bins}
                                xBinSize={this.props.promise.result.xBinSize}
                                yBinSize={this.props.promise.result.yBinSize}
                                isLoading={this.props.promise.isPending}
                                axisLabelX={this.props.axisLabelX!}
                                axisLabelY={this.props.axisLabelY!}
                                tooltip={this.props.tooltip}
                            />
                        </div>
                    </div>
                );
            }
            case ChartTypeEnum.VIOLIN_PLOT_TABLE:
                const chartSettings = this.props.store.getXvsYChartSettings(
                    this.props.chartMeta!.uniqueKey
                )!;
                const chartInfo = this.props.store.getXvsYViolinChartInfo(
                    this.props.chartMeta!.uniqueKey
                )!;
                const violinFilter = (
                    this.props.store.filters.clinicalDataFilters || []
                ).find(
                    x =>
                        x.attributeId ===
                        chartInfo.numericalAttr.clinicalAttributeId
                );
                return () => {
                    const isLoading =
                        (this.props.store.clinicalDataBinPromises[
                            chartInfo.numericalAttr.clinicalAttributeId
                        ] &&
                            this.props.store.clinicalDataBinPromises[
                                chartInfo.numericalAttr.clinicalAttributeId
                            ].isPending) ||
                        this.props.promise.isPending;
                    return (
                        <StudyViewViolinPlotTable
                            dimension={this.props.dimension}
                            width={getWidthByDimension(
                                this.props.dimension,
                                this.borderWidth
                            )}
                            height={getTableHeightByDimension(
                                this.props.dimension,
                                this.chartHeaderHeight
                            )}
                            categoryColumnName={this.props.axisLabelX!}
                            violinColumnName={this.props.axisLabelY!}
                            violinBounds={{
                                min: this.props.promise.result.data.axisStart,
                                max: this.props.promise.result.data.axisEnd,
                            }}
                            violinFilterRange={
                                violinFilter &&
                                getRangeFromDataBins(violinFilter.values)
                            }
                            rows={this.props.promise.result.data.rows || []}
                            showViolin={this.props.violinPlotChecked!}
                            showBox={this.props.boxPlotChecked!}
                            logScale={this.props.promise.result.violinLogScale}
                            setFilters={this.props.onValueSelection}
                            selectedCategories={this.props.selectedCategories!}
                            isLoading={isLoading}
                        />
                    );
                };
                break;
            default:
                return null;
        }
    }

    @computed
    get highlightChart() {
        return this.newlyAdded;
    }

    @action.bound
    clearAlertContent() {
        this.alertContent = null;
    }

    componentDidMount() {
        if (this.props.isNewlyAdded(this.props.chartMeta.uniqueKey)) {
            this.newlyAdded = true;
            setTimeout(
                () => (this.newlyAdded = false),
                STUDY_VIEW_CONFIG.thresholds.chartHighlight
            );
        }
    }

    componentWillReceiveProps(
        nextProps: Readonly<IChartContainerProps>,
        nextContext: any
    ): void {
        if (nextProps.chartType !== this.chartType) {
            this.chartType = nextProps.chartType;
        }
    }

    public render() {
        return (
            <>
                {this.alertContent && (
                    <Modal show={true} onHide={this.clearAlertContent}>
                        <Modal.Header closeButton>
                            <Modal.Title>Alert</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>{this.alertContent}</Modal.Body>
                    </Modal>
                )}
                <div
                    className={classnames(styles.chart, {
                        [styles.highlight]: this.highlightChart,
                    })}
                    data-test={`chart-container-${this.props.chartMeta.uniqueKey}`}
                    onMouseEnter={this.handlers.onMouseEnterChart}
                    onMouseLeave={this.handlers.onMouseLeaveChart}
                >
                    <ChartHeader
                        height={this.chartHeaderHeight}
                        chartMeta={this.props.chartMeta}
                        chartType={this.props.chartType}
                        store={this.props.store}
                        title={this.props.title}
                        active={this.mouseInChart}
                        resetChart={this.handlers.resetFilters}
                        deleteChart={this.handlers.onDeleteChart}
                        selectedRowsKeys={this.selectedRowsKeys}
                        toggleLogScale={this.handlers.onToggleLogScale}
                        toggleLogScaleX={this.handlers.onToggleLogScaleX}
                        toggleLogScaleY={this.handlers.onToggleLogScaleY}
                        toggleBoxPlot={this.handlers.onToggleBoxPlot}
                        toggleViolinPlot={this.handlers.onToggleViolinPlot}
                        toggleSurvivalPlotLeftTruncation={
                            this.handlers.onToggleSurvivalPlotLeftTruncation
                        }
                        isLeftTruncationAvailable={
                            this.props.isLeftTruncationAvailable
                        }
                        swapAxes={this.handlers.onSwapAxes}
                        toggleNAValue={this.handlers.onToggleNAValue}
                        chartControls={this.chartControls}
                        changeChartType={this.changeChartType}
                        toggleRenderPieChartForDownload={
                            this.toggleRenderPieChartForDownload
                        }
                        getSVG={() => Promise.resolve(this.toSVGDOMNode())}
                        getData={this.props.getData}
                        downloadTypes={this.props.downloadTypes}
                        openComparisonPage={this.openComparisonPage}
                        placement={this.placement}
                        description={this.props.description}
                        isCompactSurvivalChart={this.showCompactSurvivalChart}
                    />
                    <div className={styles.chartInnerWrapper}>
                        {this.props.promise.isPending && (
                            <LoadingIndicator
                                isLoading={true}
                                className={styles.chartLoader}
                            />
                        )}
                        {this.props.promise.isError && (
                            <div className={styles.chartError}>
                                <i
                                    className="fa fa-warning"
                                    aria-hidden="true"
                                ></i>{' '}
                                Error when loading data.
                            </div>
                        )}

                        {(!this.props.chartMeta.renderWhenDataChange ||
                            this.props.promise.isComplete) && (
                            <div
                                style={{
                                    visibility: this.props.promise.isPending
                                        ? 'hidden'
                                        : 'visible',
                                    display: 'flex',
                                }}
                            >
                                {this.chart && this.chart()}
                            </div>
                        )}
                    </div>
                </div>
            </>
        );
    }
}
