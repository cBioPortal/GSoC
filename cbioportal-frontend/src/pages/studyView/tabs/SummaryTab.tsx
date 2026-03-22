import * as React from 'react';
import styles from './studySummaryTabStyles.module.scss';
import chartHeaderStyles from '../chartHeader/styles.module.scss';
import {
    ChartContainer,
    IChartContainerProps,
} from 'pages/studyView/charts/ChartContainer';
import { observable, toJS, makeObservable } from 'mobx';
import { StudyViewPageStore } from 'pages/studyView/StudyViewPageStore';
import {
    DataFilterValue,
    GenericAssayDataBin,
    GenomicDataBin,
} from 'cbioportal-ts-api-client';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ReactGridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { observer } from 'mobx-react';
import {
    ChartTypeEnum,
    STUDY_VIEW_CONFIG,
    ChartDimension,
} from '../StudyViewConfig';
import ProgressIndicator, {
    IProgressIndicatorItem,
} from '../../../shared/components/progressIndicator/ProgressIndicator';
import autobind from 'autobind-decorator';
import {
    ChartMeta,
    ChartType,
    RectangleBounds,
    DataBin,
    makeDensityScatterPlotTooltip,
    logScalePossible,
    ChartMetaDataTypeEnum,
    getMutationTypesDownloadData,
    getVariantAnnotationTypesDownloadData,
    getScatterDownloadData,
    getSurvivalDownloadData,
    getMutatedGenesDownloadData,
    getStructuralVariantGenesDownloadData,
    getGenesCNADownloadData,
    getPatientTreatmentDownloadData,
    getSampleTreatmentDownloadData,
} from '../StudyViewUtils';
import { DataType } from 'cbioportal-frontend-commons';
import DelayedRender from 'shared/components/DelayedRender';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';
import { getServerConfig } from 'config/config';

export interface IStudySummaryTabProps {
    store: StudyViewPageStore;
}

// making this an observer (mobx-react) causes this component to re-render any time
// there is a change to any observable value which is referenced in its render method.
// Even if this value is referenced deep within some helper method
@observer
export class StudySummaryTab extends React.Component<
    IStudySummaryTabProps,
    {}
> {
    private store: StudyViewPageStore;
    private handlers: any;
    private chartTypeConfig: any;

    @observable showErrorMessage = true;

    constructor(props: IStudySummaryTabProps) {
        super(props);
        makeObservable(this);
        this.store = props.store;

        this.handlers = {
            onValueSelection: (chartMeta: ChartMeta, values: string[]) => {
                this.store.updateClinicalDataFilterByValues(
                    chartMeta.uniqueKey,
                    values.map(value => ({ value } as DataFilterValue))
                );
            },
            onDataBinSelection: (chartMeta: ChartMeta, dataBins: DataBin[]) => {
                this.store.updateClinicalDataIntervalFilters(
                    chartMeta.uniqueKey,
                    dataBins
                );
            },
            onCustomChartDataBinSelection: (
                chartMeta: ChartMeta,
                dataBins: DataBin[]
            ) => {
                this.store.updateCustomDataIntervalFilters(
                    chartMeta.uniqueKey,
                    dataBins
                );
            },

            onToggleLogScale: (chartMeta: ChartMeta) => {
                this.store.toggleLogScale(chartMeta.uniqueKey);
            },
            onToggleSurvivalPlotLeftTruncation: (chartMeta: ChartMeta) => {
                this.store.toggleSurvivalPlotLeftTruncation(
                    chartMeta.uniqueKey
                );
            },
            onToggleNAValue: (chartMeta: ChartMeta) => {
                this.store.toggleNAValue(chartMeta.uniqueKey);
            },
            onDeleteChart: (chartMeta: ChartMeta) => {
                this.store.resetFilterAndChangeChartVisibility(
                    chartMeta.uniqueKey,
                    false
                );
            },
            onChangeChartType: (
                chartMeta: ChartMeta,
                newChartType: ChartType
            ) => {
                this.store.changeChartType(chartMeta, newChartType);
            },
            isNewlyAdded: (uniqueKey: string) => {
                return this.store.isNewlyAdded(uniqueKey);
            },
            setCustomChartCategoricalFilters: (
                chartMeta: ChartMeta,
                values: string[]
            ) => {
                this.store.setCustomChartCategoricalFilters(
                    chartMeta.uniqueKey,
                    values
                );
            },
            onLayoutChange: (layout: ReactGridLayout.Layout[]) => {
                this.store.updateCurrentGridLayout(layout);
                this.onResize(layout);
            },
            resetGeneFilter: (chartMeta: ChartMeta) => {
                this.store.resetGeneFilter(chartMeta.uniqueKey);
            },
            onGenomicDataBinSelection: (
                chartMeta: ChartMeta,
                dataBins: GenomicDataBin[]
            ) => {
                this.store.updateGenomicDataIntervalFilters(
                    chartMeta.uniqueKey,
                    dataBins
                );
            },
            onGenomicDataCategoricalValueSelection: (
                chartMeta: ChartMeta,
                values: string[]
            ) => {
                this.store.updateCategoricalGenomicDataFilters(
                    chartMeta.uniqueKey,
                    values
                );
            },
            onSetMutationDataValues: (
                chartMeta: ChartMeta,
                values: string[][]
            ) => {
                this.store.updateMutationDataFilters(
                    chartMeta.uniqueKey,
                    values
                );
            },
            onAddMutationDataValues: (
                chartMeta: ChartMeta,
                values: string[][]
            ) => {
                this.store.addMutationDataFilters(chartMeta.uniqueKey, values);
            },
            onSetNamespaceDataValues: (
                chartMeta: ChartMeta,
                values: string[][]
            ) => {
                this.store.updateNamespaceDataFilters(
                    chartMeta.uniqueKey,
                    values
                );
            },
            onAddNamespaceDataValues: (
                chartMeta: ChartMeta,
                values: string[][]
            ) => {
                this.store.addNamespaceDataFilters(chartMeta.uniqueKey, values);
            },
            onGenericAssayDataBinSelection: (
                chartMeta: ChartMeta,
                dataBins: GenericAssayDataBin[]
            ) => {
                this.store.updateGenericAssayDataFilters(
                    chartMeta.uniqueKey,
                    dataBins
                );
            },
            onRemoveNamespaceDataFilters: (chartMeta: ChartMeta) => {
                this.store.updateNamespaceDataFilters(chartMeta.uniqueKey, []);
            },
            onGenericAssayCategoricalValueSelection: (
                chartMeta: ChartMeta,
                values: string[]
            ) => {
                this.store.updateCategoricalGenericAssayDataFilters(
                    chartMeta.uniqueKey,
                    values
                );
            },
        };

        this.chartTypeConfig = (
            chartMeta: ChartMeta,
            props: Partial<IChartContainerProps>
        ) => ({
            [ChartTypeEnum.PIE_CHART]: () => ({
                commonProps: {
                    onChangeChartType: this.handlers.onChangeChartType,
                    getData: (dataType?: DataType) =>
                        this.store.getChartDownloadableData(
                            chartMeta,
                            dataType
                        ),
                    downloadTypes: ['Summary Data', 'Full Data', 'SVG', 'PDF'],
                },
                [ChartMetaDataTypeEnum.CUSTOM_DATA]: () => ({
                    filters: this.store
                        .getCustomDataFiltersByUniqueKey(chartMeta.uniqueKey)
                        .map(
                            clinicalDataFilterValue =>
                                clinicalDataFilterValue.value
                        ),
                    onValueSelection: this.handlers
                        .setCustomChartCategoricalFilters,
                    onResetSelection: this.handlers
                        .setCustomChartCategoricalFilters,
                    promise: this.store.getCustomDataCount(chartMeta),
                }),
                [ChartMetaDataTypeEnum.GENERIC_ASSAY]: () => ({
                    filters: this.store
                        .getGenericAssayDataFiltersByUniqueKey(
                            chartMeta.uniqueKey
                        )
                        .map(
                            genericAssayDataFilter =>
                                genericAssayDataFilter.value
                        ),
                    onValueSelection: this.handlers
                        .onGenericAssayCategoricalValueSelection,
                    onResetSelection: this.handlers
                        .onGenericAssayCategoricalValueSelection,
                    promise: this.store.getGenericAssayChartDataCount(
                        chartMeta
                    ),
                }),
                [ChartMetaDataTypeEnum.GENE_SPECIFIC]: () => ({
                    promise: this.store.getGenomicChartDataCount(chartMeta),
                    filters: chartMeta.mutationOptionType
                        ? this.store.getMutationDataFiltersByUniqueKey(
                              chartMeta.uniqueKey
                          ).length > 0
                            ? this.store.getMutationDataFiltersByUniqueKey(
                                  chartMeta.uniqueKey
                              )[0]
                            : []
                        : this.store
                              .getGenomicDataFiltersByUniqueKey(
                                  chartMeta.uniqueKey
                              )
                              .map(
                                  genomicDataFilterValue =>
                                      genomicDataFilterValue.value
                              ),
                    onValueSelection: this.handlers
                        .onGenomicDataCategoricalValueSelection,
                    onResetSelection: this.handlers
                        .onGenomicDataCategoricalValueSelection,
                }),
                [ChartMetaDataTypeEnum.CLINICAL]: () => ({
                    promise: this.store.getClinicalDataCount(chartMeta),
                    filters: this.store
                        .getClinicalDataFiltersByUniqueKey(chartMeta.uniqueKey)
                        .map(
                            clinicalDataFilterValue =>
                                clinicalDataFilterValue.value
                        ),
                    onValueSelection: this.handlers.onValueSelection,
                    onResetSelection: this.handlers.onValueSelection,
                }),
            }),
            [ChartTypeEnum.BAR_CHART]: () => ({
                commonProps: {
                    onToggleNAValue: this.handlers.onToggleNAValue,
                    logScaleChecked: this.store.isLogScaleChecked(
                        chartMeta.uniqueKey
                    ),
                    isShowNAChecked: this.store.isShowNAChecked(
                        chartMeta.uniqueKey
                    ),
                    downloadTypes: ['Data', 'SVG', 'PDF'],
                },
                [ChartMetaDataTypeEnum.GENE_SPECIFIC]: () => ({
                    promise: this.store.getGenomicChartDataBin(chartMeta),
                    filters: this.store.getGenomicDataFiltersByUniqueKey(
                        chartMeta.uniqueKey
                    ),
                    onDataBinSelection: this.handlers.onGenomicDataBinSelection,
                    onResetSelection: this.handlers.onGenomicDataBinSelection,
                    getData: () =>
                        this.store.getChartDownloadableData(chartMeta),
                    showLogScaleToggle: this.store.isLogScaleToggleVisible(
                        chartMeta.uniqueKey,
                        this.store.getGenomicChartDataBin(chartMeta).result
                    ),
                    showNAToggle: this.store.isShowNAToggleVisible(
                        this.store.getGenomicChartDataBin(chartMeta).result!
                    ),
                }),
                [ChartMetaDataTypeEnum.GENERIC_ASSAY]: () => ({
                    promise: this.store.getGenericAssayChartDataBin(chartMeta),
                    filters: this.store.getGenericAssayDataFiltersByUniqueKey(
                        chartMeta.uniqueKey
                    ),
                    onDataBinSelection: this.handlers
                        .onGenericAssayDataBinSelection,
                    onResetSelection: this.handlers
                        .onGenericAssayDataBinSelection,
                    getData: () =>
                        this.store.getChartDownloadableData(chartMeta),
                    showLogScaleToggle: this.store.isLogScaleToggleVisible(
                        chartMeta.uniqueKey,
                        this.store.getGenericAssayChartDataBin(chartMeta).result
                    ),
                    showNAToggle: this.store.isShowNAToggleVisible(
                        this.store.getGenericAssayChartDataBin(chartMeta)
                            .result!
                    ),
                }),
                [ChartMetaDataTypeEnum.CUSTOM_DATA]: () => ({
                    promise: this.store.getCustomDataNumerical(chartMeta),
                    onDataBinSelection: this.handlers
                        .onCustomChartDataBinSelection,
                    filters: this.store.getCustomDataFiltersByUniqueKey(
                        chartMeta.uniqueKey
                    ),
                    onResetSelection: this.handlers.onDataBinSelection,
                    getData: () =>
                        this.store.getChartDownloadableData(chartMeta),
                    showLogScaleToggle: this.store.isLogScaleToggleVisible(
                        chartMeta.uniqueKey,
                        this.store.getCustomDataNumerical(chartMeta).result
                    ),
                    showNAToggle: this.store.isShowNAToggleVisible(
                        this.store.getCustomDataNumerical(chartMeta).result!
                    ),
                }),
                [ChartMetaDataTypeEnum.CLINICAL]: () => ({
                    promise: this.store.getClinicalDataBin(chartMeta),
                    onDataBinSelection: this.handlers.onDataBinSelection,
                    filters: this.store.getClinicalDataFiltersByUniqueKey(
                        chartMeta.uniqueKey
                    ),
                    onResetSelection: this.handlers.onDataBinSelection,
                    getData: () =>
                        this.store.getChartDownloadableData(chartMeta),
                    showLogScaleToggle: this.store.isLogScaleToggleVisible(
                        chartMeta.uniqueKey,
                        this.store.getClinicalDataBin(chartMeta).result
                    ),
                    showNAToggle: this.store.isShowNAToggleVisible(
                        this.store.getClinicalDataBin(chartMeta).result!
                    ),
                }),
            }),
            [ChartTypeEnum.TABLE]: () => ({
                commonProps: {
                    onChangeChartType: this.handlers.onChangeChartType,
                    getData: (dataType?: DataType) =>
                        this.store.getChartDownloadableData(
                            chartMeta,
                            dataType
                        ),
                    downloadTypes: ['Summary Data', 'Full Data', 'SVG', 'PDF'],
                },
                [ChartMetaDataTypeEnum.CUSTOM_DATA]: () => ({
                    filters: this.store
                        .getCustomDataFiltersByUniqueKey(chartMeta.uniqueKey)
                        .map(
                            clinicalDataFilterValue =>
                                clinicalDataFilterValue.value
                        ),
                    onValueSelection: this.handlers
                        .setCustomChartCategoricalFilters,
                    onResetSelection: this.handlers
                        .setCustomChartCategoricalFilters,
                    promise: this.store.getCustomDataCount(chartMeta),
                }),
                [ChartMetaDataTypeEnum.GENERIC_ASSAY]: () => ({
                    filters: this.store
                        .getGenericAssayDataFiltersByUniqueKey(
                            chartMeta.uniqueKey
                        )
                        .map(
                            genericAssayDataFilter =>
                                genericAssayDataFilter.value
                        ),
                    onValueSelection: this.handlers
                        .onGenericAssayCategoricalValueSelection,
                    onResetSelection: this.handlers
                        .onGenericAssayCategoricalValueSelection,
                    promise: this.store.getGenericAssayChartDataCount(
                        chartMeta
                    ),
                }),
                [ChartMetaDataTypeEnum.GENE_SPECIFIC]: () => ({
                    promise: this.store.getGenomicChartDataCount(chartMeta),
                    filters: chartMeta.mutationOptionType
                        ? this.store.getMutationDataFiltersByUniqueKey(
                              chartMeta.uniqueKey
                          ).length > 0
                            ? this.store.getMutationDataFiltersByUniqueKey(
                                  chartMeta.uniqueKey
                              )[0]
                            : []
                        : this.store
                              .getGenomicDataFiltersByUniqueKey(
                                  chartMeta.uniqueKey
                              )
                              .map(
                                  genomicDataFilterValue =>
                                      genomicDataFilterValue.value
                              ),
                    onValueSelection: this.handlers
                        .onGenomicDataCategoricalValueSelection,
                    onResetSelection: this.handlers
                        .onGenomicDataCategoricalValueSelection,
                }),
                [ChartMetaDataTypeEnum.CLINICAL]: () => ({
                    filters: this.store
                        .getClinicalDataFiltersByUniqueKey(chartMeta.uniqueKey)
                        .map(
                            clinicalDataFilterValue =>
                                clinicalDataFilterValue.value
                        ),
                    promise: this.store.getClinicalDataCount(chartMeta),
                    onValueSelection: this.handlers.onValueSelection,
                    onResetSelection: this.handlers.onValueSelection,
                }),
            }),
            [ChartTypeEnum.MUTATED_GENES_TABLE]: () => ({
                filters: this.store.getGeneFiltersByUniqueKey(
                    chartMeta.uniqueKey
                ),
                promise: this.store.mutatedGeneTableRowData,
                onValueSelection: this.store.addGeneFilters,
                onResetSelection: () =>
                    this.store.resetGeneFilter(chartMeta.uniqueKey),
                selectedGenes: this.store.selectedGenes,
                onGeneSelect: this.store.onCheckGene,
                id: 'mutated-genes-table',
                title: this.store.getChartTitle(
                    ChartTypeEnum.MUTATED_GENES_TABLE,
                    props.title
                ),
                getData: () =>
                    getMutatedGenesDownloadData(
                        this.store.mutatedGeneTableRowData,
                        this.store.oncokbCancerGeneFilterEnabled
                    ),
                genePanelCache: this.store.genePanelCache,
                downloadTypes: ['Data'],
                filterByCancerGenes: this.store
                    .filterMutatedGenesTableByCancerGenes,
                onChangeCancerGeneFilter: this.store
                    .updateMutatedGenesTableByCancerGenesFilter,
                alterationFilterEnabled: getServerConfig()
                    .skin_show_settings_menu,
                filterAlterations: this.store.isGlobalMutationFilterActive,
            }),
            [ChartTypeEnum.VARIANT_ANNOTATIONS_TABLE]: () => ({
                filters: this.store.getNamespaceDataFiltersByUniqueKey(
                    chartMeta.uniqueKey
                ),
                promise: this.store.getVariantAnnotationChartData(chartMeta),
                onValueSelection: this.handlers.onAddNamespaceDataValues,
                onResetSelection: this.handlers.onSetNamespaceDataValues,
                id: 'variant-annotations-table',
                title: chartMeta.displayName,
                getData: () =>
                    getVariantAnnotationTypesDownloadData(
                        this.store.getVariantAnnotationChartData(chartMeta)
                    ),
                downloadTypes: ['Data'],
            }),
            [ChartTypeEnum.MUTATION_TYPE_COUNTS_TABLE]: () => ({
                filters: this.store.getMutationDataFiltersByUniqueKey(
                    chartMeta.uniqueKey
                ),
                promise: this.store.getMutationTypeChartDataCount(chartMeta),
                onValueSelection: this.handlers.onAddMutationDataValues,
                onResetSelection: this.handlers.onSetMutationDataValues,
                id: 'mutation-type-counts-table',
                title: this.store.getChartTitle(
                    ChartTypeEnum.MUTATION_TYPE_COUNTS_TABLE,
                    props.title
                ),
                getData: () =>
                    getMutationTypesDownloadData(
                        this.store.getMutationTypeChartDataCount(chartMeta)
                    ),
                downloadTypes: ['Data'],
                onChangeCancerGeneFilter: this.store
                    .updateMutatedGenesTableByCancerGenesFilter,
            }),
            [ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE]: () => ({
                filters: this.store.getGeneFiltersByUniqueKey(
                    chartMeta.uniqueKey
                ),
                promise: this.store.structuralVariantGeneTableRowData,
                onValueSelection: this.store.addGeneFilters,
                onResetSelection: () =>
                    this.store.resetGeneFilter(chartMeta.uniqueKey),
                selectedGenes: this.store.selectedGenes,
                onGeneSelect: this.store.onCheckGene,
                title: this.store.getChartTitle(
                    ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE,
                    props.title
                ),
                getData: () =>
                    getStructuralVariantGenesDownloadData(
                        this.store.structuralVariantGeneTableRowData,
                        this.store.oncokbCancerGeneFilterEnabled
                    ),
                genePanelCache: this.store.genePanelCache,
                downloadTypes: ['Data'],
                filterByCancerGenes: this.store.filterSVGenesTableByCancerGenes,
                onChangeCancerGeneFilter: this.store
                    .updateSVGenesTableByCancerGenesFilter,
                alterationFilterEnabled: getServerConfig()
                    .skin_show_settings_menu,
                filterAlterations: this.store.isGlobalMutationFilterActive,
            }),
            [ChartTypeEnum.STRUCTURAL_VARIANTS_TABLE]: () => ({
                filters: this.store.getGeneFiltersByUniqueKey(
                    chartMeta.uniqueKey
                ),
                promise: this.store.structuralVariantTableRowData,
                onValueSelection: this.store.addStructVarFilters,
                onResetSelection: () =>
                    this.store.resetGeneFilter(chartMeta.uniqueKey),
                selectedStructuralVariants: this.store
                    .selectedStructuralVariants,
                onStructuralVariantSelect: this.store.onCheckStructuralVariant,
                title: this.store.getChartTitle(
                    ChartTypeEnum.STRUCTURAL_VARIANTS_TABLE,
                    props.title
                ),
                getData: () =>
                    getStructuralVariantGenesDownloadData(
                        this.store.structuralVariantTableRowData,
                        this.store.oncokbCancerGeneFilterEnabled
                    ),
                genePanelCache: this.store.genePanelCache,
                downloadTypes: ['Data'],
                filterByCancerGenes: this.store
                    .filterStructVarsTableByCancerGenes,
                onChangeCancerGeneFilter: this.store
                    .updateStructVarsTableByCancerGenesFilter,
                alterationFilterEnabled: getServerConfig()
                    .skin_show_settings_menu,
                filterAlterations: this.store.isGlobalMutationFilterActive,
            }),
            [ChartTypeEnum.CNA_GENES_TABLE]: () => ({
                filters: this.store.getGeneFiltersByUniqueKey(
                    chartMeta.uniqueKey
                ),
                promise: this.store.cnaGeneTableRowData,
                onValueSelection: this.store.addGeneFilters,
                onResetSelection: () =>
                    this.store.resetGeneFilter(chartMeta.uniqueKey),
                selectedGenes: this.store.selectedGenes,
                onGeneSelect: this.store.onCheckGene,
                title: this.store.getChartTitle(
                    ChartTypeEnum.CNA_GENES_TABLE,
                    props.title
                ),
                getData: () =>
                    getGenesCNADownloadData(
                        this.store.cnaGeneTableRowData,
                        this.store.oncokbCancerGeneFilterEnabled
                    ),
                genePanelCache: this.store.genePanelCache,
                downloadTypes: ['Data'],
                filterByCancerGenes: this.store
                    .filterCNAGenesTableByCancerGenes,
                onChangeCancerGeneFilter: this.store
                    .updateCNAGenesTableByCancerGenesFilter,
                alterationFilterEnabled: getServerConfig()
                    .skin_show_settings_menu,
                filterAlterations: this.store.isGlobalAlterationFilterActive,
            }),
            [ChartTypeEnum.GENOMIC_PROFILES_TABLE]: () => ({
                filters: toJS(this.store.genomicProfilesFilter),
                promise: this.store.molecularProfileSampleCounts,
                onValueSelection: this.store.addGenomicProfilesFilter,
                onResetSelection: () => {
                    this.store.setGenomicProfilesFilter([]);
                },
            }),
            [ChartTypeEnum.CASE_LIST_TABLE]: () => ({
                filters: toJS(this.store.caseListsFilter),
                promise: this.store.caseListSampleCounts,
                onValueSelection: this.store.addCaseListsFilter,
                onResetSelection: () => {
                    this.store.setCaseListsFilter([]);
                },
            }),
            [ChartTypeEnum.SURVIVAL]: () => {
                const props: Partial<IChartContainerProps> = {
                    promise: this.store.survivalPlots,
                    getData: () =>
                        getSurvivalDownloadData(
                            chartMeta,
                            this.store.survivalPlots.result,
                            this.store.survivalData.result,
                            this.store.selectedPatients,
                            this.store.selectedPatientKeys.result
                        ),
                    patientToAnalysisGroup: this.store.patientToAnalysisGroup,
                    downloadTypes: ['Data', 'SVG', 'PDF'],
                    description: this.store.survivalDescriptions.result
                        ? this.store.survivalDescriptions.result[
                              chartMeta.uniqueKey.substring(
                                  0,
                                  chartMeta.uniqueKey.lastIndexOf('_SURVIVAL')
                              )
                          ][0]
                        : undefined,
                    onToggleSurvivalPlotLeftTruncation: this.handlers
                        .onToggleSurvivalPlotLeftTruncation,
                    survivalPlotLeftTruncationChecked: this.store.survivalPlotLeftTruncationToggleMap?.get(
                        chartMeta.uniqueKey
                    ),
                    onDataBinSelection: this.handlers.onDataBinSelection,
                };

                if (
                    this.store.isLeftTruncationAvailable.result &&
                    new RegExp('OS_SURVIVAL').test(chartMeta.uniqueKey)
                ) {
                    props.isLeftTruncationAvailable = true;
                    props.patientSurvivalsWithoutLeftTruncation = this.store.survivalPlotDataById.result[
                        'OS_SURVIVAL'
                    ]?.survivalDataWithoutLeftTruncation;
                }

                return props;
            },
            [ChartTypeEnum.VIOLIN_PLOT_TABLE]: () => {
                const chartInfo = this.store.getXvsYViolinChartInfo(
                    chartMeta.uniqueKey
                )!;
                const settings = this.store.getXvsYChartSettings(
                    chartMeta.uniqueKey
                )!;
                const props: Partial<IChartContainerProps> = {
                    filters: [
                        ...this.store.getClinicalDataFiltersByUniqueKey(
                            chartInfo.categoricalAttr.clinicalAttributeId
                        ),
                        ...this.store.getClinicalDataFiltersByUniqueKey(
                            chartInfo.numericalAttr.clinicalAttributeId
                        ),
                    ],
                    title: `${chartInfo.numericalAttr.displayName}${
                        settings.violinLogScale ? ' (log)' : ''
                    } vs ${chartInfo.categoricalAttr.displayName}`,
                    promise: this.store.clinicalViolinDataCache.get({
                        chartInfo,
                        violinLogScale: !!settings.violinLogScale,
                    }),
                    axisLabelX: chartInfo.categoricalAttr.displayName,
                    axisLabelY: chartInfo.numericalAttr.displayName,
                    showLogScaleToggle: logScalePossible(
                        chartInfo.numericalAttr.clinicalAttributeId
                    ),
                    logScaleChecked: settings.violinLogScale,
                    onToggleLogScale: () => {
                        const settings = this.store.getXvsYChartSettings(
                            chartMeta.uniqueKey
                        )!;
                        settings.violinLogScale = !settings.violinLogScale;
                    },
                    showViolinPlotToggle: true,
                    violinPlotChecked: settings.showViolin,
                    onToggleViolinPlot: () => {
                        const settings = this.store.getXvsYChartSettings(
                            chartMeta.uniqueKey
                        )!;
                        settings.showViolin = !settings.showViolin;
                    },
                    showBoxPlotToggle: true,
                    boxPlotChecked: settings.showBox,
                    onToggleBoxPlot: () => {
                        const settings = this.store.getXvsYChartSettings(
                            chartMeta.uniqueKey
                        )!;
                        settings.showBox = !settings.showBox;
                    },
                    onValueSelection: (
                        type: 'categorical' | 'numerical',
                        values: string[] | { start: number; end: number }
                    ) => {
                        switch (type) {
                            case 'categorical':
                                this.store.updateClinicalAttributeFilterByValues(
                                    chartInfo.categoricalAttr
                                        .clinicalAttributeId,
                                    (values as string[]).map(
                                        value => ({ value } as DataFilterValue)
                                    )
                                );
                                break;
                            case 'numerical':
                                this.store.updateClinicalDataCustomIntervalFilter(
                                    chartInfo.numericalAttr.clinicalAttributeId,
                                    values as { start: number; end: number }
                                );
                                break;
                        }
                    },
                    selectedCategories: this.store
                        .getClinicalDataFiltersByUniqueKey(
                            chartInfo.categoricalAttr.clinicalAttributeId
                        )
                        .map(x => x.value),
                    onResetSelection: () => {
                        this.store.updateClinicalAttributeFilterByValues(
                            chartInfo.categoricalAttr.clinicalAttributeId,
                            []
                        );
                        this.store.updateClinicalAttributeFilterByValues(
                            chartInfo.numericalAttr.clinicalAttributeId,
                            []
                        );
                    },
                };
                return props;
            },
            [ChartTypeEnum.SCATTER]: () => {
                const chartInfo = this.store.getXvsYScatterChartInfo(
                    chartMeta.uniqueKey
                )!;
                const settings = this.store.getXvsYChartSettings(
                    chartMeta.uniqueKey
                )!;
                const props: Partial<IChartContainerProps> = {
                    filters: this.store.getScatterPlotFiltersByUniqueKey(
                        chartMeta.uniqueKey
                    ),
                    title: chartMeta.displayName,
                    promise: this.store.clinicalDataDensityCache.get({
                        chartInfo,
                        xAxisLogScale: !!settings.xLogScale,
                        yAxisLogScale: !!settings.yLogScale,
                    }),
                    showLogScaleXToggle: logScalePossible(
                        chartInfo.xAttr.clinicalAttributeId
                    ),
                    showLogScaleYToggle: logScalePossible(
                        chartInfo.yAttr.clinicalAttributeId
                    ),
                    logScaleXChecked: settings.xLogScale,
                    logScaleYChecked: settings.yLogScale,
                    onToggleLogScaleX: () => {
                        const settings = this.store.getXvsYChartSettings(
                            chartMeta.uniqueKey
                        )!;
                        settings.xLogScale = !settings.xLogScale;
                    },
                    onToggleLogScaleY: () => {
                        const settings = this.store.getXvsYChartSettings(
                            chartMeta.uniqueKey
                        )!;
                        settings.yLogScale = !settings.yLogScale;
                    },
                    onSwapAxes: () => {
                        this.store.swapXvsYChartAxes(chartMeta.uniqueKey);
                    },
                    plotDomain: chartInfo.plotDomain,
                    axisLabelX: `${chartInfo.xAttr.displayName}${
                        settings.xLogScale ? ' (log)' : ''
                    }`,
                    axisLabelY: `${chartInfo.yAttr.displayName}${
                        settings.yLogScale ? ' (log)' : ''
                    }`,
                    tooltip: makeDensityScatterPlotTooltip(chartInfo, settings),
                    onValueSelection: (bounds: RectangleBounds) => {
                        this.store.updateScatterPlotFilterByValues(
                            chartMeta.uniqueKey,
                            bounds
                        );
                    },
                    onResetSelection: () => {
                        this.store.updateScatterPlotFilterByValues(
                            chartMeta.uniqueKey
                        );
                    },
                    sampleToAnalysisGroup: this.store.sampleToAnalysisGroup,
                    getData: () =>
                        getScatterDownloadData(
                            chartInfo,
                            this.store.selectedSamples
                        ),
                    downloadTypes: ['Data', 'SVG', 'PDF'],
                };
                return props;
            },
            [ChartTypeEnum.SAMPLE_TREATMENTS_TABLE]: () => ({
                filters: this.store.sampleTreatmentFiltersAsStrings,
                promise: this.store.sampleTreatments,
                onValueSelection: this.store.onTreatmentSelection,
                getData: () =>
                    getSampleTreatmentDownloadData(this.store.sampleTreatments),
                downloadTypes: ['Data'],
                onResetSelection: () => {
                    this.store.clearSampleTreatmentFilters();
                },
            }),
            [ChartTypeEnum.SAMPLE_TREATMENT_GROUPS_TABLE]: () => ({
                filters: this.store.sampleTreatmentGroupFiltersAsStrings,
                promise: this.store.sampleTreatmentGroups,
                onValueSelection: this.store.onTreatmentSelection,
                onResetSelection: () => {
                    this.store.clearSampleTreatmentGroupFilters();
                },
            }),
            [ChartTypeEnum.SAMPLE_TREATMENT_TARGET_TABLE]: () => ({
                filters: this.store.sampleTreatmentTargetFiltersAsStrings,
                promise: this.store.sampleTreatmentTarget,
                onValueSelection: this.store.onTreatmentSelection,
                onResetSelection: () => {
                    this.store.clearSampleTreatmentTargetFilters();
                },
            }),
            [ChartTypeEnum.PATIENT_TREATMENTS_TABLE]: () => ({
                filters: this.store.patientTreatmentFiltersAsStrings,
                promise: this.store.patientTreatments,
                onValueSelection: this.store.onTreatmentSelection,
                getData: () =>
                    getPatientTreatmentDownloadData(
                        this.store.patientTreatments
                    ),
                downloadTypes: ['Data'],
                onResetSelection: () => {
                    this.store.clearPatientTreatmentFilters();
                },
            }),
            [ChartTypeEnum.PATIENT_TREATMENT_GROUPS_TABLE]: () => ({
                filters: this.store.patientTreatmentGroupFiltersAsStrings,
                promise: this.store.patientTreatmentGroups,
                onValueSelection: this.store.onTreatmentSelection,
                onResetSelection: () => {
                    this.store.clearPatientTreatmentGroupFilters();
                },
            }),
            [ChartTypeEnum.PATIENT_TREATMENT_TARGET_TABLE]: () => ({
                filters: this.store.patientTreatmentTargetFiltersAsStrings,
                promise: this.store.patientTreatmentTarget,
                onValueSelection: this.store.onTreatmentSelection,
                onResetSelection: () => {
                    this.store.clearPatientTreatmentTargetFilters();
                },
            }),
            [ChartTypeEnum.CLINICAL_EVENT_TYPE_COUNTS_TABLE]: () => ({
                filters: this.store.clinicalEventTypeFiltersRawStrings,
                promise: this.store.clinicalEventTypeCounts,
                onValueSelection: this.store.addClinicalEventTypeFilter,
                onResetSelection: () => {
                    this.store.resetClinicalEventTypeFilter();
                },
            }),
        });
    }

    renderAttributeChart = (chartMeta: ChartMeta) => {
        let props: Partial<IChartContainerProps> = {
            chartMeta: chartMeta,
            chartType: this.props.store.chartsType.get(chartMeta.uniqueKey),
            store: this.props.store,
            dimension: this.store.chartsDimension.get(chartMeta.uniqueKey),
            title: chartMeta.displayName,
            filters: [],
            onDeleteChart: this.handlers.onDeleteChart,
            isNewlyAdded: this.handlers.isNewlyAdded,
            studyViewFilters: this.store.filters,
            analysisGroupsSettings: this.store.analysisGroupsSettings,
            cancerGeneFilterEnabled: this.store.oncokbCancerGeneFilterEnabled,
            setComparisonConfirmationModal: this.store
                .setComparisonConfirmationModal,
        };

        const chartType = this.store.chartsType.get(chartMeta.uniqueKey)!;
        const subTypeProps = this.chartTypeConfig(chartMeta, props)[
            chartType
        ]();

        if (subTypeProps.commonProps) {
            // charts that have sub types
            const subProps = subTypeProps[
                this.store.getChartMetaDataType(chartMeta.uniqueKey)
            ]();
            props = { ...props, ...subProps, ...subTypeProps.commonProps };
        } else {
            props = { ...props, ...subTypeProps };
        }

        // Using custom component inside of the GridLayout creates too many chaos as mentioned here
        // https://github.com/STRML/react-grid-layout/issues/299
        // Option 1:    Always create div wrapper out of your custom component, but this solves all the issues.
        // Option 2:    Expose style, className in your component and apply all the properties in your component
        //              first division tag. And remember, you component has to use div as first child.
        //              This solution only works with grid layout, not resizing.
        // Decided to go with option 1 due to following reasons:
        // 1.   The ChartContainer will be used to include all charts in the study view.
        //      Then across the study page, there should be only one place to include ChartContainer component.
        // 2.   The maintainer of RGL repo currently not actively accepts pull requests. So we don't know when the
        //      issue will be solved.
        return (
            <div key={chartMeta.uniqueKey} data-tour={props.id}>
                <DelayedRender>
                    {/* Delay the render after a setTimeout, because synchronous rendering would jam UI updates
                    and make things laggy */}
                    <ChartContainer
                        key={chartMeta.uniqueKey}
                        {...(props as any)}
                    />
                </DelayedRender>
            </div>
        );
    };

    @autobind
    onResize(newLayout: Layout[]) {
        newLayout
            .filter(l => {
                const layout = this.store.chartsDimension.get(l.i as string);
                return layout && (layout.h !== l.h || layout.w !== l.w);
            })
            .forEach(l => {
                const key = l.i as string;
                const toUpdate = this.store.chartsDimension.get(
                    key
                ) as ChartDimension;

                toUpdate.h = l.h;
                toUpdate.w = l.w;
                this.store.chartsDimension.set(key, toUpdate);
            });
    }

    @autobind
    getProgressItems(elapsedSecs: number): IProgressIndicatorItem[] {
        const clinicalDataPromises = [
            this.store.initialVisibleAttributesClinicalDataBinCountData,
            this.store.initialVisibleAttributesClinicalDataCountData,
        ];

        const sampleDataPromises = [
            this.store.caseListSampleCounts,
            this.store.selectedSamples,
        ];

        // do not display "this can take several seconds" if the corresponding data group has already been loaded
        const isClinicalDataTakingLong =
            elapsedSecs > 2 &&
            getRemoteDataGroupStatus(...clinicalDataPromises) === 'pending';
        const isSampleDataTakingLong =
            elapsedSecs > 2 &&
            getRemoteDataGroupStatus(...sampleDataPromises) === 'pending';

        return [
            {
                label: 'Loading meta information',
                promises: [
                    this.store.defaultVisibleAttributes,
                    this.store.mutationProfiles,
                    this.store.cnaProfiles,
                ],
            },
            {
                label:
                    'Loading clinical data' +
                    (isClinicalDataTakingLong
                        ? ' - this can take several seconds'
                        : ''),
                promises: clinicalDataPromises,
            },
            {
                label:
                    'Loading sample data' +
                    (isSampleDataTakingLong
                        ? ' - this can take several seconds'
                        : ''),
                promises: sampleDataPromises,
            },
            {
                label: 'Rendering',
            },
        ];
    }

    render() {
        return (
            <div>
                <LoadingIndicator
                    isLoading={this.store.loadingInitialDataForSummaryTab}
                    size={'big'}
                    center={true}
                >
                    <ProgressIndicator
                        getItems={this.getProgressItems}
                        show={this.store.loadingInitialDataForSummaryTab}
                        sequential={true}
                    />
                </LoadingIndicator>
                {this.store.invalidSampleIds.result.length > 0 &&
                    this.showErrorMessage && (
                        <div>
                            <div className="alert alert-danger">
                                <button
                                    type="button"
                                    className="close"
                                    onClick={() =>
                                        (this.showErrorMessage = false)
                                    }
                                >
                                    &times;
                                </button>
                                The following sample(s) might have been
                                deleted/updated with the recent data updates
                                <br />
                                <ul
                                    style={{
                                        listStyle: 'none',
                                        padding: '10px',
                                        maxHeight: '300px',
                                        overflowY: 'scroll',
                                    }}
                                >
                                    {this.store.invalidSampleIds.result.map(
                                        sample => (
                                            <li>
                                                {sample.studyId +
                                                    ':' +
                                                    sample.sampleId}
                                            </li>
                                        )
                                    )}
                                </ul>
                            </div>
                        </div>
                    )}
                {this.store.showSettingRestoreMsg && (
                    <div>
                        <div className="alert alert-info">
                            <button
                                type="button"
                                className="close"
                                onClick={() => {
                                    this.store.hideRestoreSettingsMsg = true;
                                }}
                            >
                                &times;
                            </button>
                            Your previously saved layout preferences have been
                            applied.
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                    this.store.hideRestoreSettingsMsg = true;
                                }}
                                style={{ marginLeft: '10px' }}
                            >
                                Keep Saved Layout
                            </button>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                    this.store.hideRestoreSettingsMsg = true;
                                    this.store.undoUserChartSettings();
                                }}
                                style={{ marginLeft: '10px' }}
                            >
                                Revert to Previous Layout
                            </button>
                        </div>
                    </div>
                )}

                {!this.store.loadingInitialDataForSummaryTab &&
                    !this.store.blockLoading && (
                        <div data-test="summary-tab-content">
                            <div className={styles.studyViewFlexContainer}>
                                {this.store.defaultVisibleAttributes
                                    .isComplete && (
                                    <ReactGridLayout
                                        className="layout"
                                        style={{
                                            width: this.store.containerWidth,
                                        }}
                                        width={this.store.containerWidth}
                                        cols={
                                            this.store.studyViewPageLayoutProps
                                                .cols
                                        }
                                        rowHeight={
                                            this.store.studyViewPageLayoutProps
                                                .grid.h
                                        }
                                        layout={
                                            this.store.studyViewPageLayoutProps
                                                .layout
                                        }
                                        margin={[
                                            STUDY_VIEW_CONFIG.layout.gridMargin
                                                .x,
                                            STUDY_VIEW_CONFIG.layout.gridMargin
                                                .y,
                                        ]}
                                        useCSSTransforms={false}
                                        draggableHandle={`.${chartHeaderStyles.draggable}`}
                                        onLayoutChange={
                                            this.handlers.onLayoutChange
                                        }
                                        onResizeStop={this.onResize}
                                    >
                                        {this.store.visibleAttributesForSummary.map(
                                            this.renderAttributeChart
                                        )}
                                    </ReactGridLayout>
                                )}
                            </div>
                        </div>
                    )}
                {this.props.store.selectedSamples.isComplete &&
                    this.props.store.selectedSamples.result.length === 0 && (
                        <div className={styles.studyViewNoSamples}>
                            <div className={styles.studyViewNoSamplesInner}>
                                <p>
                                    The filters you have selected have filtered
                                    out all the samples in this study; because
                                    of this, no data visualizations are shown.
                                </p>
                                <p>
                                    You can remove filters in the header of this
                                    page to widen your search criteria and add
                                    samples back to your results.
                                </p>
                            </div>
                        </div>
                    )}
            </div>
        );
    }
}
