import * as React from 'react';
import { observer, Observer } from 'mobx-react';
import { observable, computed, action, makeObservable } from 'mobx';
import {
    MolecularProfile,
    Sample,
    GenericAssayCategoricalEnrichment,
} from 'cbioportal-ts-api-client';
import client from 'shared/api/cbioportalClientInstance';
import {
    getGenericAssayCategoricalEnrichmentRowData,
    getGenericAssayCategoricalEnrichmentColumns,
    getFilteredCategoricalData,
} from 'pages/resultsView/enrichments/EnrichmentsUtil';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ReactSelect from 'react-select1';
import _ from 'lodash';
import autobind from 'autobind-decorator';
import ScrollBar from 'shared/components/Scrollbar/ScrollBar';
import {
    Option,
    DownloadControls,
    remoteData,
    DownloadControlOption,
} from 'cbioportal-frontend-commons';
import GenericAssayCategoricalEnrichmentsTable, {
    GenericAssayCategoricalEnrichmentTableColumnType,
} from './GenericAssayCategoricalEnrichmentsTable';
import { GenericAssayCategoricalEnrichmentsTableDataStore } from './GenericAssayCategoricalEnrichmentsTableDataStore';
import { GenericAssayCategoricalEnrichmentRow } from 'shared/model/EnrichmentRow';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';
import { EnrichmentAnalysisComparisonGroup } from 'pages/groupComparison/GroupComparisonUtils';
import {
    IAxisData,
    IAxisLogScaleParams,
    IStringAxisData,
} from 'shared/components/plots/PlotsTabUtils';
import CategoryPlot, {
    CategoryPlotType,
} from 'pages/groupComparison/CategoryPlot';
import { OncoprintJS } from 'oncoprintjs';
import ComparisonStore, {
    OverlapStrategy,
} from 'shared/lib/comparison/ComparisonStore';
import { RESERVED_CLINICAL_VALUE_COLORS } from 'shared/lib/Colors';
import {
    filterSampleList,
    getComparisonCategoricalNaValue,
} from 'pages/groupComparison/ClinicalDataUtils';
import { getServerConfig } from 'config/config';

export interface IGenericAssayCategoricalEnrichmentsContainerProps {
    data: GenericAssayCategoricalEnrichment[];
    selectedProfile: MolecularProfile;
    groups: EnrichmentAnalysisComparisonGroup[];
    sampleKeyToSample: {
        [uniqueSampleKey: string]: Sample;
    };
    genericAssayType: string;
    alteredVsUnalteredMode?: boolean;
    patientLevelEnrichments: boolean;
    onSetPatientLevelEnrichments: (patientLevel: boolean) => void;
    dataStore: ComparisonStore;
}
export enum CategoricalNumericalVisualisationType {
    Plot = 'Plot',
    Table = 'Table',
}
export const categoryPlotTypeOptions = [
    { value: CategoryPlotType.Bar, label: 'Bar chart' },
    { value: CategoryPlotType.StackedBar, label: 'Stacked bar chart' },
    {
        value: CategoryPlotType.PercentageStackedBar,
        label: '100% stacked bar chart',
    },
    { value: CategoryPlotType.Heatmap, label: 'Heatmap' },
];

const SVG_ID = 'categorical-plot-svg';
function isNumerical(datatype?: string) {
    return datatype && datatype.toLowerCase() === 'number';
}

export const numericalVisualisationTypeOptions = [
    { value: CategoricalNumericalVisualisationType.Plot, label: 'Plot' },
    { value: CategoricalNumericalVisualisationType.Table, label: 'Table' },
];

@observer
export default class GenericAssayCategoricalEnrichmentsContainer extends React.Component<
    IGenericAssayCategoricalEnrichmentsContainerProps,
    {}
> {
    constructor(props: IGenericAssayCategoricalEnrichmentsContainerProps) {
        super(props);
        makeObservable(this);
    }

    static defaultProps: Partial<
        IGenericAssayCategoricalEnrichmentsContainerProps
    > = {
        alteredVsUnalteredMode: true,
    };
    // TODO: modify judgement
    @computed get isNumericalPlot() {
        return isNumerical(this.highlightedRow!.attributeType);
    }

    @computed get showLogScaleControls() {
        return this.isNumericalPlot;
    }

    @computed get showPAndQControls() {
        return !this.isTable && !this.isHeatmap;
    }

    @computed get showHorizontalBarControls() {
        return !this.showLogScaleControls && !this.isHeatmap;
    }

    @computed get showSwapAxisControls() {
        return !this.isTable;
    }

    @computed get isTable() {
        return (
            this.isNumericalPlot &&
            this.numericalVisualisationType ===
                CategoricalNumericalVisualisationType.Table
        );
    }

    @computed get isHeatmap() {
        return (
            !this.isNumericalPlot &&
            this.categoryPlotType === CategoryPlotType.Heatmap
        );
    }
    @computed get horzLabel() {
        return this.swapAxes
            ? `${this.highlightedRow!.attributeType}${
                  this.logScale ? ' (log2)' : ''
              }`
            : `Group`;
    }

    @computed get vertLabel() {
        return this.swapAxes
            ? 'Group'
            : `${this.highlightedRow!.attributeType}${
                  this.logScale ? ' (log2)' : ''
              }`;
    }
    @observable significanceFilter: boolean = false;
    @observable.ref clickedEntityStableId: string;
    @observable.ref selectedStableIds: string[] | null;
    @observable.ref highlightedRow:
        | GenericAssayCategoricalEnrichmentRow
        | undefined;
    @observable.ref _enrichedGroups: string[] = this.props.groups.map(
        group => group.name
    );
    @observable private logScale = false;
    @observable logScaleFunction: IAxisLogScaleParams | undefined;
    @observable swapAxes = false;
    @observable showPAndQ = false;
    @observable horizontalBars = false;
    @observable showNA = true;

    private scrollPane: HTMLDivElement;

    private oncoprintJs: OncoprintJS | null = null;
    @autobind
    private oncoprintJsRef(oncoprint: OncoprintJS) {
        this.oncoprintJs = oncoprint;
    }

    @observable categoryPlotType: CategoryPlotType =
        CategoryPlotType.PercentageStackedBar;

    @observable
    numericalVisualisationType: CategoricalNumericalVisualisationType =
        CategoricalNumericalVisualisationType.Plot;

    @action.bound
    private onPlotTypeSelect(option: any) {
        this.categoryPlotType = option.value;
    }

    @action.bound
    private onNumericalVisualisationTypeSelect(option: any) {
        this.numericalVisualisationType = option.value;
    }

    @action.bound
    private onClickLogScale() {
        this.logScale = !this.logScale;
        if (this.logScale) {
            const MIN_LOG_ARGUMENT = 0.01;
            this.logScaleFunction = {
                label: 'log2',
                fLogScale: (x: number, offset: number) =>
                    Math.log2(Math.max(x, MIN_LOG_ARGUMENT)),
                fInvLogScale: (x: number) => Math.pow(2, x),
            };
        } else {
            this.logScaleFunction = undefined;
        }
    }

    @action.bound
    private onClickSwapAxes() {
        this.swapAxes = !this.swapAxes;
    }

    @action.bound
    private onClickTogglePAndQ() {
        this.showPAndQ = !this.showPAndQ;
    }

    @action.bound
    private onClickHorizontalBars() {
        this.horizontalBars = !this.horizontalBars;
    }

    @action.bound
    private onClickShowNA() {
        this.showNA = !this.showNA;
    }

    @autobind
    private getSvg() {
        if (this.categoryPlotType === CategoryPlotType.Heatmap) {
            return this.oncoprintJs && this.oncoprintJs.toSVG(true);
        }
        return document.getElementById(SVG_ID) as SVGElement | null;
    }

    @autobind
    private toolbar() {
        if (this.isTable) {
            return <></>;
        }
        return (
            <div style={{ textAlign: 'center', position: 'relative' }}>
                <DownloadControls
                    getSvg={this.getSvg}
                    filename={SVG_ID}
                    dontFade={true}
                    type="button"
                    style={{ position: 'absolute', right: 0, top: 0 }}
                    showDownload={
                        getServerConfig().skin_hide_download_controls ===
                        DownloadControlOption.SHOW_ALL
                    }
                />
            </div>
        );
    }

    @autobind
    private assignScrollPaneRef(el: HTMLDivElement) {
        this.scrollPane = el;
    }

    @computed get data(): GenericAssayCategoricalEnrichmentRow[] {
        return getGenericAssayCategoricalEnrichmentRowData(
            this.props.data,
            this.props.groups
        );
    }

    @computed get filteredData(): GenericAssayCategoricalEnrichmentRow[] {
        return getFilteredCategoricalData(this.data, this.filterByStableId);
    }

    public readonly groupMembershipAxisData = remoteData({
        await: () => [],
        invoke: async () => {
            const categoryOrder = _.map(this.props.groups, group => group.name);
            const axisData = {
                data: [],
                datatype: 'string',
                categoryOrder,
            } as IStringAxisData;

            const sampleKeyToGroupSampleData = _.reduce(
                this.props.groups,
                (acc, group) => {
                    group.samples.forEach(sample => {
                        const uniqueSampleKey = sample.uniqueSampleKey;
                        if (acc[uniqueSampleKey] === undefined) {
                            acc[uniqueSampleKey] = {
                                uniqueSampleKey,
                                value: [],
                            };
                        }
                        acc[uniqueSampleKey].value.push(group.name);
                    });
                    return acc;
                },
                {} as {
                    [uniqueSampleKey: string]: {
                        uniqueSampleKey: string;
                        value: string[];
                    };
                }
            );

            axisData.data = _.values(sampleKeyToGroupSampleData);
            return Promise.resolve(axisData);
        },
    });

    readonly gaCategoricalAxisData = remoteData({
        invoke: async () => {
            const axisData: IAxisData = { data: [], datatype: 'string' };
            let normalizedCategory: { [id: string]: string } = {};
            if (this.highlightedRow !== undefined) {
                const molecularData = await client.fetchGenericAssayDataInMolecularProfileUsingPOST(
                    {
                        molecularProfileId: this.props.selectedProfile
                            .molecularProfileId,
                        genericAssayFilter: {
                            genericAssayStableIds: [
                                (this
                                    .highlightedRow as GenericAssayCategoricalEnrichmentRow)
                                    .stableId,
                            ],
                            sampleIds: _.map(
                                this.props.sampleKeyToSample,
                                sample => sample.sampleId
                            ),
                        } as any,
                    }
                );
                for (const d of molecularData) {
                    const lowerCaseValue = d.value.toLowerCase();
                    if (normalizedCategory[lowerCaseValue] === undefined) {
                        //consider first value as category value
                        normalizedCategory[lowerCaseValue] = d.value;
                    }
                }

                const axisData_Data = axisData.data;

                for (const d of molecularData) {
                    const value = d.value;
                    axisData_Data.push({
                        uniqueSampleKey: d.uniqueSampleKey,
                        value: normalizedCategory[d.value.toLowerCase()],
                    });
                }
            }
            return Promise.resolve(axisData);
        },
    });

    private readonly gaCategoricalAxisDataFiltered = remoteData({
        await: () => [this.gaCategoricalAxisData, this.props.dataStore.samples],
        invoke: () => {
            const axisData = this.gaCategoricalAxisData.result!;
            const sampleList: Sample[] =
                this.props.dataStore.overlapStrategy === OverlapStrategy.EXCLUDE
                    ? filterSampleList(
                          this.props.dataStore.samples.result!,
                          this.props.dataStore._activeGroupsNotOverlapRemoved
                              .result!
                      )
                    : this.props.dataStore.samples.result!;
            if (
                this.showNA &&
                axisData.datatype === 'string' &&
                sampleList.length > 0
            ) {
                const naSamples = _.difference(
                    _.uniq(sampleList.map(x => x.uniqueSampleKey)),
                    _.uniq(axisData.data.map(x => x.uniqueSampleKey))
                );
                return Promise.resolve({
                    ...axisData,
                    data: axisData.data.concat(
                        naSamples.map(x => ({
                            uniqueSampleKey: x,
                            value: 'NA',
                        }))
                    ),
                });
            } else {
                // filter out NA-like values (e.g. unknown)
                return Promise.resolve({
                    ...axisData,
                    data: axisData.data.filter(
                        x =>
                            typeof x.value !== 'string' ||
                            _.every(
                                getComparisonCategoricalNaValue(),
                                naValue =>
                                    naValue.toLowerCase() !==
                                    (x.value as string).toLowerCase()
                            )
                    ),
                });
            }
        },
    });
    @autobind
    private getScrollPane() {
        return this.scrollPane;
    }

    @computed private get getUtilitiesMenu() {
        if (!this.highlightedRow) {
            return <span></span>;
        }
        return (
            <div style={{ marginBottom: '10px' }}>
                {this.isNumericalPlot && (
                    <>
                        <div
                            className="form-group"
                            style={{ display: 'flex', alignItems: 'center' }}
                        >
                            <label>Visualisation type</label>
                            <div
                                style={{ width: 240, marginLeft: 5 }}
                                data-test="numericalVisualisationTypeSelector"
                            >
                                <ReactSelect
                                    name="numerical-visualisation-type"
                                    value={this.numericalVisualisationType}
                                    onChange={
                                        this.onNumericalVisualisationTypeSelect
                                    }
                                    options={numericalVisualisationTypeOptions}
                                    clearable={false}
                                    searchable={true}
                                />
                            </div>
                        </div>
                    </>
                )}
                {!this.showLogScaleControls && (
                    <div
                        className="form-group"
                        style={{ display: 'flex', alignItems: 'center' }}
                    >
                        <label>Plot Type</label>
                        <div
                            style={{ width: 240, marginLeft: 5 }}
                            data-test="plotTypeSelector"
                        >
                            <ReactSelect
                                name="discrete-vs-discrete-plot-type"
                                value={this.categoryPlotType}
                                onChange={this.onPlotTypeSelect}
                                options={categoryPlotTypeOptions}
                                clearable={false}
                                searchable={true}
                            />
                        </div>
                    </div>
                )}
                <div>
                    {this.showSwapAxisControls && (
                        <label className="checkbox-inline">
                            <input
                                type="checkbox"
                                checked={this.swapAxes}
                                onClick={this.onClickSwapAxes}
                                data-test="SwapAxes"
                            />
                            Swap Axes
                        </label>
                    )}
                    {this.showHorizontalBarControls && (
                        <label className="checkbox-inline">
                            <input
                                type="checkbox"
                                name="horizontalBars"
                                checked={this.horizontalBars}
                                onClick={this.onClickHorizontalBars}
                                data-test="HorizontalBars"
                            />
                            Horizontal Bars
                        </label>
                    )}
                    {this.showLogScaleControls && (
                        <label className="checkbox-inline">
                            <input
                                type="checkbox"
                                checked={this.logScale}
                                onClick={this.onClickLogScale}
                                data-test="logScale"
                            />
                            Log Scale
                        </label>
                    )}
                    {this.gaCategoricalAxisData && (
                        <label className="checkbox-inline">
                            <input
                                type="checkbox"
                                checked={this.showNA}
                                onClick={this.onClickShowNA}
                                data-test="showNA"
                            />
                            Show NA
                        </label>
                    )}
                    {this.showPAndQControls && (
                        <label className="checkbox-inline">
                            <input
                                type="checkbox"
                                checked={this.showPAndQ}
                                onClick={this.onClickTogglePAndQ}
                                data-test="ShowPAndQ"
                            />
                            Show p and q
                        </label>
                    )}
                </div>
            </div>
        );
    }

    @computed get vertAxisDataPromise() {
        return this.swapAxes
            ? this.groupMembershipAxisData
            : this.gaCategoricalAxisDataFiltered;
    }

    @computed get horzAxisDataPromise() {
        return this.swapAxes
            ? this.gaCategoricalAxisDataFiltered
            : this.groupMembershipAxisData;
    }

    @computed get categoryToColor() {
        //add group colors and reserved category colors
        return _.reduce(
            this.props.dataStore.uidToGroup.result!,
            (acc, next) => {
                acc[next.nameWithOrdinal] = next.color;
                return acc;
            },
            RESERVED_CLINICAL_VALUE_COLORS
        );
    }

    @computed get groupToColor() {
        let groups = this.props.groups;
        if (!groups) {
            return {};
        }
        return groups.reduce((result, ag) => {
            result[ag.name as string] = ag.color;
            return result;
        }, {} as any);
    }

    @computed get plot() {
        if (!this.highlightedRow) {
            this.highlightedRow = this.filteredData[0];
        }
        if (this.filteredData.length === 0 || !this.highlightedRow) {
            return <span></span>;
        }
        const promises = [this.horzAxisDataPromise, this.vertAxisDataPromise];
        const groupStatus = getRemoteDataGroupStatus(...promises);
        const isPercentage =
            this.categoryPlotType === CategoryPlotType.PercentageStackedBar;
        const isStacked =
            isPercentage ||
            this.categoryPlotType === CategoryPlotType.StackedBar;
        switch (groupStatus) {
            case 'pending':
                return (
                    <LoadingIndicator
                        center={true}
                        isLoading={true}
                        size={'big'}
                    />
                );
            case 'error':
                return <span>Error loading plot data.</span>;
            default: {
                if (!this.horzAxisDataPromise || !this.vertAxisDataPromise) {
                    return <span>Error loading plot data.</span>;
                }

                let plotElt: any = null;
                plotElt = (
                    <CategoryPlot
                        broadcastOncoprintJsRef={this.oncoprintJsRef}
                        type={this.categoryPlotType}
                        svgId={SVG_ID}
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
                                .result! as IStringAxisData).categoryOrder
                        }
                        vertCategoryOrder={
                            (this.vertAxisDataPromise
                                .result! as IStringAxisData).categoryOrder
                        }
                        categoryToColor={this.categoryToColor}
                        groupToColor={this.groupToColor}
                        barWidth={20}
                        domainPadding={20}
                        chartBase={500}
                        axisLabelX={this.horzLabel}
                        axisLabelY={this.vertLabel}
                        legendLocationWidthThreshold={450}
                        ticksCount={6}
                        horizontalBars={this.horizontalBars}
                        percentage={isPercentage}
                        stacked={isStacked}
                        pValue={
                            this.showPAndQ ? this.highlightedRow.pValue : null
                        }
                        qValue={
                            this.showPAndQ ? this.highlightedRow.qValue : null
                        }
                    />
                );

                return (
                    <div
                        data-test="CategoricalTabPlotDiv"
                        className="borderedChart posRelative"
                        style={{ marginBottom: 10 }}
                    >
                        <ScrollBar
                            style={{ position: 'relative', top: -5 }}
                            getScrollEl={this.getScrollPane}
                        />
                        <Observer>{this.toolbar}</Observer>
                        <div
                            ref={this.assignScrollPaneRef}
                            style={{
                                position: 'relative',
                                display: 'inline-block',
                            }}
                        >
                            {plotElt}
                        </div>
                    </div>
                );
            }
        }
    }

    @autobind
    private filterByStableId(stableId: string) {
        if (this.selectedStableIds) {
            return this.selectedStableIds.includes(stableId);
        } else {
            // no need to filter the data since there is no selection
            return true;
        }
    }

    @autobind
    private onEntityClick(stableId: string) {
        this.clickedEntityStableId = stableId;
    }

    @autobind
    private onSelection(stableIds: string[]) {
        this.selectedStableIds = stableIds;
    }

    @autobind
    private onSelectionCleared() {
        this.selectedStableIds = null;
    }

    private tableDataStore = new GenericAssayCategoricalEnrichmentsTableDataStore(
        () => {
            return this.filteredData;
        },
        () => {
            return this.highlightedRow;
        },
        (c: GenericAssayCategoricalEnrichmentRow) => {
            this.highlightedRow = c;
        }
    );

    //used in 2 groups analysis
    @computed get group1() {
        return this.props.groups[0];
    }

    //used in 2 groups analysis
    @computed get group2() {
        return this.props.groups[1];
    }

    @computed get selectedEntitiesSet() {
        return _.keyBy(this.selectedStableIds || []);
    }

    @computed get isTwoGroupAnalysis(): boolean {
        return this.props.groups.length == 2;
    }

    @computed get customColumns() {
        return getGenericAssayCategoricalEnrichmentColumns(
            this.props.groups,
            this.props.alteredVsUnalteredMode
        );
    }
    @computed get visibleOrderedColumnNames() {
        const columns = [];
        columns.push(
            GenericAssayCategoricalEnrichmentTableColumnType.ENTITY_ID
        );

        columns.push(
            GenericAssayCategoricalEnrichmentTableColumnType.ATTRIBUTE_TYPE,
            GenericAssayCategoricalEnrichmentTableColumnType.STATISTICAL_TEST_NAME,
            GenericAssayCategoricalEnrichmentTableColumnType.P_VALUE,
            GenericAssayCategoricalEnrichmentTableColumnType.Q_VALUE
        );

        return columns;
    }

    @action.bound
    onChange(values: { value: string }[]) {
        this._enrichedGroups = _.map(values, datum => datum.value);
    }

    @computed get selectedValues() {
        return this._enrichedGroups.map(id => ({ value: id }));
    }

    @computed get options(): Option[] {
        return _.map(this.props.groups, group => {
            return {
                label: group.nameOfEnrichmentDirection
                    ? group.nameOfEnrichmentDirection
                    : group.name,
                value: group.name,
            };
        });
    }

    @computed get selectedRow() {
        if (this.clickedEntityStableId) {
            return this.props.data.filter(
                d => d.stableId === this.clickedEntityStableId
            )[0];
        }
        return undefined;
    }

    public render() {
        if (this.props.data.length === 0) {
            return (
                <div className={'alert alert-info'}>
                    No data/result available
                </div>
            );
        }

        return (
            <div className="clearfix" style={{ display: 'flex' }}>
                <div style={{ width: '900px' }}>
                    <GenericAssayCategoricalEnrichmentsTable
                        data={this.data}
                        onEntityClick={this.onEntityClick}
                        dataStore={this.tableDataStore}
                        mutexTendency={this.props.alteredVsUnalteredMode}
                        visibleOrderedColumnNames={
                            this.visibleOrderedColumnNames
                        }
                        customColumns={_.keyBy(
                            this.customColumns,
                            column => column.name
                        )}
                        genericAssayType={this.props.genericAssayType}
                        groupSize={this.props.groups.length}
                    />
                </div>
                <div style={{ marginLeft: '10px' }}>
                    {this.getUtilitiesMenu}
                    {this.plot}
                </div>
            </div>
        );
    }
}
