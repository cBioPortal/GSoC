import * as React from 'react';
import { observer, Observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    action,
    autorun,
    computed,
    IReactionDisposer,
    makeObservable,
    observable,
} from 'mobx';
import { SimpleGetterLazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import ClinicalDataEnrichmentsTable from './ClinicalDataEnrichmentsTable';
import _ from 'lodash';
import {
    DownloadControlOption,
    DownloadControls,
    remoteData,
} from 'cbioportal-frontend-commons';
import { getRemoteDataGroupStatus } from 'cbioportal-utils';
import client from 'shared/api/cbioportalClientInstance';
import {
    basicAppearance,
    boxPlotTooltip,
    IAxisData,
    IAxisLogScaleParams,
    IBoxScatterPlotPoint,
    INumberAxisData,
    isNumberData,
    isStringData,
    IStringAxisData,
    makeBoxScatterPlotData,
} from 'shared/components/plots/PlotsTabUtils';
import ScrollBar from 'shared/components/Scrollbar/ScrollBar';
import { IBoxScatterPlotData } from 'shared/components/plots/BoxScatterPlot';
import { scatterPlotSize } from 'shared/components/plots/PlotUtils';
import {
    CLINICAL_TAB_NOT_ENOUGH_GROUPS_MSG,
    ClinicalDataEnrichmentWithQ,
    GetStatisticalCautionInfo,
} from './GroupComparisonUtils';
import ReactSelect from 'react-select1';
import { MakeMobxView } from 'shared/components/MobxView';
import OverlapExclusionIndicator from './OverlapExclusionIndicator';
import { RESERVED_CLINICAL_VALUE_COLORS } from '../../shared/lib/Colors';
import ErrorMessage from '../../shared/components/ErrorMessage';
import ComplexKeyMap from 'shared/lib/complexKeyDataStructures/ComplexKeyMap';
import { Sample } from 'cbioportal-ts-api-client';
import ComparisonStore, {
    OverlapStrategy,
} from '../../shared/lib/comparison/ComparisonStore';
import { createSurvivalAttributeIdsDict } from 'pages/resultsView/survival/SurvivalUtil';
import {
    filterSampleList,
    getComparisonCategoricalNaValue,
} from './ClinicalDataUtils';
import {
    ClinicalNumericalDataVisualisation,
    ClinicalNumericalVisualisationType,
} from 'pages/groupComparison/ClinicalNumericalDataVisualisation';
import { SummaryStatisticsTable } from './SummaryStatisticsTable';
import CategoryPlot, {
    CategoryPlotType,
} from 'pages/groupComparison/CategoryPlot';
import { OncoprintJS } from 'oncoprintjs';
import { getServerConfig } from 'config/config';

export interface IClinicalDataProps {
    store: ComparisonStore;
}

const SVG_ID = 'clinical-plot-svg';

export const numericalVisualisationTypeOptions = [
    { value: ClinicalNumericalVisualisationType.Plot, label: 'Plot' },
    { value: ClinicalNumericalVisualisationType.Table, label: 'Table' },
];

export class ClinicalDataEnrichmentStore extends SimpleGetterLazyMobXTableApplicationDataStore<
    ClinicalDataEnrichmentWithQ
> {
    private reactionDisposer: IReactionDisposer;

    constructor(
        getData: () => ClinicalDataEnrichmentWithQ[],
        getHighlighted: () => ClinicalDataEnrichmentWithQ | undefined,
        public setHighlighted: (c: ClinicalDataEnrichmentWithQ) => void
    ) {
        super(getData);
        this.dataHighlighter = (d: ClinicalDataEnrichmentWithQ) => {
            const highlighted = getHighlighted();
            return !!(
                highlighted &&
                d.clinicalAttribute.clinicalAttributeId ===
                    highlighted.clinicalAttribute.clinicalAttributeId
            );
        };

        this.reactionDisposer = autorun(() => {
            if (
                this.sortMetric &&
                this.sortedFilteredData.length > 0 &&
                !getHighlighted()
            ) {
                this.setHighlighted(this.sortedFilteredData[0]);
            }
        });
    }

    public destroy() {
        this.reactionDisposer();
    }
}

export const categoryPlotTypeOptions = [
    { value: CategoryPlotType.Bar, label: 'Bar chart' },
    { value: CategoryPlotType.StackedBar, label: 'Stacked bar chart' },
    {
        value: CategoryPlotType.PercentageStackedBar,
        label: '100% stacked bar chart',
    },
    { value: CategoryPlotType.Heatmap, label: 'Heatmap' },
    { value: CategoryPlotType.Table, label: 'Table' },
];

function isNumerical(datatype?: string) {
    return datatype && datatype.toLowerCase() === 'number';
}

@observer
export default class ClinicalData extends React.Component<
    IClinicalDataProps,
    {}
> {
    constructor(props: IClinicalDataProps) {
        super(props);
        makeObservable(this);
    }

    @observable.ref highlightedRow: ClinicalDataEnrichmentWithQ | undefined;

    private scrollPane: HTMLDivElement;

    private oncoprintJs: OncoprintJS | null = null;

    @autobind
    private oncoprintJsRef(oncoprint: OncoprintJS) {
        this.oncoprintJs = oncoprint;
    }

    readonly tabUI = MakeMobxView({
        await: () => {
            const ret: any[] = [
                this.props.store.activeGroups,
                this.props.store._activeGroupsNotOverlapRemoved,
            ];
            if (
                this.props.store.activeGroups.isComplete &&
                this.props.store.activeGroups.result.length < 2
            ) {
                // dont bother loading data for and computing clinical tab if not enough groups for it
            } else {
                ret.push(this.overlapUI);
            }
            return ret;
        },
        render: () => {
            let content: any = [];
            if (this.props.store.activeGroups.result!.length < 2) {
                content.push(
                    <span>
                        {CLINICAL_TAB_NOT_ENOUGH_GROUPS_MSG(
                            this.props.store._activeGroupsNotOverlapRemoved
                                .result!.length
                        )}
                    </span>
                );
            } else {
                content.push(
                    <div className={'tabMessageContainer'}>
                        <GetStatisticalCautionInfo />
                        <OverlapExclusionIndicator store={this.props.store} />
                    </div>
                );
                content.push(this.overlapUI.component);
            }
            return (
                <div data-test="ComparisonPageClinicalTabDiv">{content}</div>
            );
        },
        renderPending: () => (
            <LoadingIndicator isLoading={true} center={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    readonly overlapUI = MakeMobxView({
        await: () => [this.props.store.clinicalDataEnrichmentsWithQValues],
        render: () => {
            return (
                <div className="clearfix" style={{ display: 'flex' }}>
                    <div style={{ width: '600px' }}>
                        <ClinicalDataEnrichmentsTable
                            dataStore={this.tableDataStore}
                        />
                    </div>
                    <div style={{ marginLeft: '10px' }}>
                        {this.getUtilitiesMenu}
                        {this.plot}
                    </div>
                </div>
            );
        },
        renderPending: () => (
            <LoadingIndicator
                isLoading={true}
                centerRelativeToContainer={true}
                size="big"
            />
        ),
        renderError: () => <ErrorMessage />,
    });

    @autobind
    private getScrollPane() {
        return this.scrollPane;
    }

    private tableDataStore = new ClinicalDataEnrichmentStore(
        () => {
            // ClinicalData is only used in Group Comparison Page and Group Comparison Tab
            // And survival related attributes are used to create KM plots in survival tab
            // We are doing the proper statistical tests in the survival tab and the used tests for the clinical tab are not appropriate for that type of data
            // There is no need to still keep them in clinical tab
            // So, exclude them from the data store
            const survivalAttributeIdsDict = createSurvivalAttributeIdsDict(
                this.props.store.survivalClinicalAttributesPrefix.result || []
            );
            // In addition remove a few more attributes from the comparison page
            // for GENIE BPC related to years. In the future we might want to
            // have a more elegant way to exclude clinical attributes from
            // comparison. See also
            // https://github.com/cBioPortal/cbioportal/issues/8445
            const excludeGenieHardcodedAttributeIds = {
                AGE_LAST_FU_YEARS: 'AGE_LAST_FU_YEARS',
                BIRTH_YEAR: 'BIRTH_YEAR',
            };
            return this.props.store.clinicalDataEnrichmentsWithQValues.result.filter(
                d =>
                    !(
                        d.clinicalAttribute.clinicalAttributeId in
                        survivalAttributeIdsDict
                    ) &&
                    !(
                        d.clinicalAttribute.clinicalAttributeId in
                        excludeGenieHardcodedAttributeIds
                    )
            );
        },
        () => {
            return this.highlightedRow;
        },
        (c: ClinicalDataEnrichmentWithQ) => {
            this.highlightedRow = c;
            this.swapAxes = false;
            this.logScale = false;
        }
    );

    @computed get isNumericalPlot() {
        return isNumerical(this.highlightedRow!.clinicalAttribute.datatype);
    }

    @computed get showLogScaleControls() {
        return this.isNumericalPlot;
    }

    @computed get showPAndQControls() {
        return !this.isTable && !this.isHeatmap;
    }

    @computed get showHorizontalBarControls() {
        return (
            !this.showLogScaleControls &&
            !this.isHeatmap &&
            !(
                !this.isNumericalPlot &&
                this.categoryPlotType === CategoryPlotType.Table
            )
        );
    }

    @computed get showSwapAxisControls() {
        return !this.isTable;
    }

    @computed get isTable() {
        return (
            (this.isNumericalPlot &&
                this.numericalVisualisationType ===
                    ClinicalNumericalVisualisationType.Table) ||
            (!this.isNumericalPlot &&
                this.categoryPlotType === CategoryPlotType.Table)
        );
    }

    @computed get isHeatmap() {
        return (
            !this.isNumericalPlot &&
            this.categoryPlotType === CategoryPlotType.Heatmap
        );
    }

    @observable private logScale = false;
    @observable logScaleFunction: IAxisLogScaleParams | undefined;
    @observable swapAxes = false;
    @observable showPAndQ = false;
    @observable horizontalBars = false;
    @observable showNA = true;

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

    private readonly clinicalDataPromiseFiltered = remoteData({
        await: () => [this.clinicalDataPromise, this.props.store.samples],
        invoke: () => {
            const axisData = this.clinicalDataPromise.result!;
            // for string like values include NA values if requested
            // TODO: implement for numbers
            // Compare clinical data(axisData) samples with sample list, assign NA to difference
            // If include overlapped patients and samples, keep all sample in sample list
            // If exclude overlapped patients and samples, remove overlapped samples from sample list
            const sampleList: Sample[] =
                this.props.store.overlapStrategy === OverlapStrategy.EXCLUDE
                    ? filterSampleList(
                          this.props.store.samples.result!,
                          this.props.store._activeGroupsNotOverlapRemoved
                              .result!
                      )
                    : this.props.store.samples.result!;
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

    private readonly clinicalDataPromise = remoteData({
        await: () => [
            this.props.store.patientKeyToSamples,
            this.props.store.activeGroups,
        ],
        invoke: async () => {
            const axisData: IAxisData = { data: [], datatype: 'string' };
            if (this.highlightedRow) {
                let attribute = this.highlightedRow!.clinicalAttribute;
                let patientKeyToSamples = this.props.store.patientKeyToSamples
                    .result!;

                let sampleIdentifiers = _.flatMap(
                    this.props.store.activeGroups.result,
                    group =>
                        _.flatMap(group.studies, study => {
                            return study.samples.map(sample => ({
                                studyId: study.id,
                                entityId: sample,
                            }));
                        })
                );

                let patientidentifiers = _.flatMap(
                    this.props.store.activeGroups.result,
                    group =>
                        _.flatMap(group.studies, study => {
                            return study.patients.map(patient => ({
                                studyId: study.id,
                                entityId: patient,
                            }));
                        })
                );

                let clinicalData = await client.fetchClinicalDataUsingPOST({
                    clinicalDataType: attribute.patientAttribute
                        ? 'PATIENT'
                        : 'SAMPLE',
                    clinicalDataMultiStudyFilter: {
                        attributeIds: [attribute.clinicalAttributeId],
                        identifiers: attribute.patientAttribute
                            ? patientidentifiers
                            : sampleIdentifiers,
                    },
                });

                let normalizedCategory: { [id: string]: string } = {};
                for (const d of clinicalData) {
                    const lowerCaseValue = d.value.toLowerCase();
                    if (normalizedCategory[lowerCaseValue] === undefined) {
                        //consider first value as category value
                        normalizedCategory[lowerCaseValue] = d.value;
                    }
                }

                axisData.datatype = attribute.datatype.toLowerCase();
                const axisData_Data = axisData.data;
                if (attribute.patientAttribute) {
                    // produce sample data from patient clinical data
                    for (const d of clinicalData) {
                        const samples = patientKeyToSamples[d.uniquePatientKey];
                        for (const sample of samples) {
                            axisData_Data.push({
                                uniqueSampleKey: sample.uniqueSampleKey,
                                value:
                                    normalizedCategory[d.value.toLowerCase()],
                            });
                        }
                    }
                } else {
                    // produce sample data from sample clinical data
                    for (const d of clinicalData) {
                        axisData_Data.push({
                            uniqueSampleKey: d.uniqueSampleKey,
                            value: normalizedCategory[d.value.toLowerCase()],
                        });
                    }
                }
                if (isNumerical(attribute.datatype)) {
                    for (const d of axisData_Data) {
                        d.value = parseFloat(d.value as string); // we know its a string bc all clinical data comes back as string
                    }
                }
            }
            return Promise.resolve(axisData);
        },
    });

    private readonly groupMembershipAxisData = remoteData({
        await: () => [
            this.props.store.sampleMap,
            this.props.store.activeGroups,
        ],
        invoke: async () => {
            const categoryOrder = _.map(
                this.props.store.activeGroups.result!,
                group => group.nameWithOrdinal
            );
            const axisData = {
                data: [],
                datatype: 'string',
                categoryOrder,
            } as IStringAxisData;
            const sampleSet =
                this.props.store.sampleMap.result ||
                new ComplexKeyMap<Sample>();

            const sampleKeyToGroupSampleData = _.reduce(
                this.props.store.activeGroups.result,
                (acc, group) => {
                    group.studies.forEach(studyEntry => {
                        studyEntry.samples.forEach(sampleId => {
                            if (
                                sampleSet.has({
                                    studyId: studyEntry.id,
                                    sampleId,
                                })
                            ) {
                                const uniqueSampleKey = sampleSet.get({
                                    studyId: studyEntry.id,
                                    sampleId,
                                })!.uniqueSampleKey;
                                if (acc[uniqueSampleKey] === undefined) {
                                    acc[uniqueSampleKey] = {
                                        uniqueSampleKey,
                                        value: [],
                                    };
                                }
                                acc[uniqueSampleKey].value.push(
                                    group.nameWithOrdinal
                                );
                            }
                        });
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

    @computed get vertAxisDataPromise() {
        return this.swapAxes
            ? this.groupMembershipAxisData
            : this.clinicalDataPromiseFiltered;
    }

    @computed get horzAxisDataPromise() {
        return this.swapAxes
            ? this.clinicalDataPromiseFiltered
            : this.groupMembershipAxisData;
    }

    @computed get horzLabel() {
        return this.swapAxes
            ? `${this.highlightedRow!.clinicalAttribute.displayName}${
                  this.logScale ? ' (log2)' : ''
              }`
            : `Group`;
    }

    @computed get vertLabel() {
        return this.swapAxes
            ? 'Group'
            : `${this.highlightedRow!.clinicalAttribute.displayName}${
                  this.logScale ? ' (log2)' : ''
              }`;
    }

    @autobind
    private getSvg() {
        if (this.categoryPlotType === CategoryPlotType.Heatmap) {
            return this.oncoprintJs && this.oncoprintJs.toSVG(true);
        }
        return document.getElementById(SVG_ID) as SVGElement | null;
    }

    @autobind
    private assignScrollPaneRef(el: HTMLDivElement) {
        this.scrollPane = el;
    }

    private readonly boxPlotData = remoteData<{
        horizontal: boolean;
        data: IBoxScatterPlotData<IBoxScatterPlotPoint>[];
    }>({
        await: () => [
            this.horzAxisDataPromise,
            this.vertAxisDataPromise,
            this.props.store.sampleKeyToSample,
        ],
        invoke: () => {
            const horzAxisData = this.horzAxisDataPromise.result;
            const vertAxisData = this.vertAxisDataPromise.result;
            if (!horzAxisData || !vertAxisData) {
                return new Promise<any>(() => 0); // dont resolve
            } else {
                let categoryData: IStringAxisData;
                let numberData: INumberAxisData;
                let horizontal: boolean;
                if (isNumberData(horzAxisData) && isStringData(vertAxisData)) {
                    categoryData = vertAxisData;
                    numberData = horzAxisData;
                    horizontal = true;
                } else if (
                    isStringData(horzAxisData) &&
                    isNumberData(vertAxisData)
                ) {
                    categoryData = horzAxisData;
                    numberData = vertAxisData;
                    horizontal = false;
                } else {
                    return Promise.resolve({ horizontal: false, data: [] });
                }
                return Promise.resolve({
                    horizontal,
                    data: makeBoxScatterPlotData(
                        categoryData,
                        numberData,
                        this.props.store.sampleKeyToSample.result!,
                        {},
                        undefined,
                        undefined
                    ),
                });
            }
        },
    });

    @computed get scatterPlotTooltip() {
        return (d: IBoxScatterPlotPoint) => {
            let content = <span></span>;
            if (this.boxPlotData.isComplete) {
                content = boxPlotTooltip(
                    d,
                    this.props.store.activeStudyIdToStudy.result!,
                    this.boxPlotData.result.horizontal
                );
            }
            return content;
        };
    }

    @computed get boxPlotTooltip() {
        return (data: any[], labels: string[]) => (
            <SummaryStatisticsTable data={data} labels={labels} />
        );
    }

    @computed get categoryToColor() {
        //add group colors and reserved category colors
        return _.reduce(
            this.props.store.uidToGroup.result!,
            (acc, next) => {
                acc[next.nameWithOrdinal] = next.color;
                return acc;
            },
            RESERVED_CLINICAL_VALUE_COLORS
        );
    }

    @computed get groupToColor() {
        let groups = this.props.store?.activeGroups?.result;
        if (!groups) {
            return {};
        }
        return groups.reduce((result, ag) => {
            result[ag.nameWithOrdinal as string] = ag.color;
            return result;
        }, {} as any);
    }

    @observable categoryPlotType: CategoryPlotType =
        CategoryPlotType.PercentageStackedBar;

    @observable numericalVisualisationType: ClinicalNumericalVisualisationType =
        ClinicalNumericalVisualisationType.Plot;

    @action.bound
    private onPlotTypeSelect(option: any) {
        this.categoryPlotType = option.value;
    }

    @action.bound
    private onNumericalVisualisationTypeSelect(option: any) {
        this.numericalVisualisationType = option.value;
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
                    {this.clinicalDataPromise.result &&
                        this.clinicalDataPromise.result.datatype ===
                            'string' && (
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

    @computed get plot() {
        if (this.tableDataStore.allData.length === 0 || !this.highlightedRow) {
            return <span></span>;
        }
        const promises = [
            this.horzAxisDataPromise,
            this.vertAxisDataPromise,
            this.props.store.uidToGroup,
        ];
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
                if (
                    !this.horzAxisDataPromise.result ||
                    !this.vertAxisDataPromise.result
                ) {
                    return <span>Error loading plot data.</span>;
                }

                let plotElt: any = null;
                if (this.isNumericalPlot) {
                    if (this.boxPlotData.isComplete) {
                        plotElt = (
                            <ClinicalNumericalDataVisualisation
                                type={this.numericalVisualisationType}
                                svgId={SVG_ID}
                                domainPadding={75}
                                boxWidth={
                                    this.boxPlotData.result.data.length > 7
                                        ? 30
                                        : 60
                                }
                                axisLabelX={this.horzLabel}
                                axisLabelY={this.vertLabel}
                                data={this.boxPlotData.result.data}
                                chartBase={500}
                                scatterPlotTooltip={this.scatterPlotTooltip}
                                boxPlotTooltip={this.boxPlotTooltip}
                                horizontal={this.boxPlotData.result.horizontal}
                                logScale={this.logScaleFunction}
                                size={scatterPlotSize}
                                fill={basicAppearance.fill}
                                stroke={basicAppearance.stroke}
                                strokeOpacity={basicAppearance.strokeOpacity}
                                symbol="circle"
                                useLogSpaceTicks={true}
                                legendLocationWidthThreshold={550}
                                pValue={
                                    this.showPAndQ
                                        ? this.highlightedRow.pValue
                                        : null
                                }
                                qValue={
                                    this.showPAndQ
                                        ? this.highlightedRow.qValue
                                        : null
                                }
                            />
                        );
                    } else if (this.boxPlotData.isError) {
                        return <span>Error loading plot data.</span>;
                    } else {
                        return (
                            <LoadingIndicator
                                center={true}
                                isLoading={true}
                                size={'big'}
                            />
                        );
                    }
                } else {
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
                                this.showPAndQ
                                    ? this.highlightedRow.pValue
                                    : null
                            }
                            qValue={
                                this.showPAndQ
                                    ? this.highlightedRow.qValue
                                    : null
                            }
                        />
                    );
                }

                return (
                    <div
                        data-test="ClinicalTabPlotDiv"
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

    componentWillUnmount() {
        this.tableDataStore.destroy();
    }

    public render() {
        return this.tabUI.component;
    }
}
