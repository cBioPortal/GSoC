import * as React from 'react';
import { ReactNode } from 'react';
import { observer } from 'mobx-react';
import { PatientSurvival } from '../../../shared/model/PatientSurvival';
import { action, computed, observable, makeObservable } from 'mobx';
import Slider from 'react-rangeslider';
import { Popover, Tooltip } from 'react-bootstrap';
import styles from './styles.module.scss';
import Select from 'react-select';
import './styles.scss';
import { sleep } from '../../../shared/lib/TimeUtils';
import _ from 'lodash';
import {
    VictoryChart,
    VictoryLine,
    VictoryAxis,
    VictoryLegend,
    VictoryLabel,
    VictoryScatter,
    VictoryZoomContainer,
} from 'victory';

import {
    getSurvivalSummaries,
    getLineData,
    getScatterData,
    getScatterDataWithOpacity,
    getStats,
    getDownloadContent,
    GroupedScatterData,
    filterScatterData,
    SurvivalPlotFilters,
    SurvivalSummary,
    ScatterData,
    calculateLabelWidth,
} from './SurvivalUtil';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import { getPatientViewUrl } from '../../../shared/api/urls';
import {
    DefaultTooltip,
    DownloadControlOption,
    DownloadControls,
    setArrowLeft,
} from 'cbioportal-frontend-commons';
import autobind from 'autobind-decorator';
import { AnalysisGroup, DataBin } from '../../studyView/StudyViewUtils';
import { AbstractChart } from '../../studyView/charts/ChartContainer';
import { toSvgDomNodeWithLegend } from '../../studyView/StudyViewUtils';
import classnames from 'classnames';
import { ClinicalAttribute } from 'cbioportal-ts-api-client';
import TruncatedTextWithTooltipSVG from '../../../shared/components/TruncatedTextWithTooltipSVG';
import {
    baseLabelStyles,
    CBIOPORTAL_VICTORY_THEME,
    EditableSpan,
    pluralize,
} from 'cbioportal-frontend-commons';
import {
    logRankTest,
    calculatePairWiseHazardRatio,
} from 'pages/resultsView/survival/logRankTest';
import { getServerConfig } from 'config/config';
import LeftTruncationCheckbox from 'shared/components/survival/LeftTruncationCheckbox';
import { scaleLinear } from 'd3-scale';
import ReactSelect from 'react-select1';
import { categoryPlotTypeOptions } from 'pages/groupComparison/ClinicalData';
import SurvivalDescriptionTable from 'pages/resultsView/survival/SurvivalDescriptionTable';
import $ from 'jquery';
import SettingsMenu from 'shared/alterationFiltering/SettingsMenu';
export enum LegendLocation {
    TOOLTIP = 'tooltip',
    CHART = 'chart',
}

export type HazardRatioInformation = {
    hazardInformation: {
        lowerCI: number;
        upperCI: number;
        hazardRatio: number;
    }[];
    name: string;
};

export type HazardInformationLegend = {
    name: string;
    hazardInformation: string;
};

export type RiskPerGroup = {
    groupName: string;
    aliveSamples: number;
    timePoint: number;
};

export interface LandmarkLineValues {
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
}
export interface LandmarkInformation {
    groupName: string;
    aliveSamples: number;
    timePoint: number;
}

export interface ISurvivalChartProps {
    sortedGroupedSurvivals: { [group: string]: PatientSurvival[] };
    patientToAnalysisGroups: { [uniquePatientKey: string]: string[] };
    analysisGroups: ReadonlyArray<AnalysisGroup>; // identified by `value`
    analysisClinicalAttribute?: ClinicalAttribute;
    naPatientsHiddenInSurvival?: boolean;
    toggleSurvivalHideNAPatients?: () => void;
    totalCasesHeader: string;
    statusCasesHeader: string;
    medianMonthsHeader: string;
    title: string;
    xAxisLabel: string;
    yAxisLabel: string;
    yLabelTooltip: string;
    xLabelWithEventTooltip: string;
    xLabelWithoutEventTooltip: string;
    fileName: string;
    showTable?: boolean;
    isLeftTruncationAvailable?: boolean;
    showLeftTruncationCheckbox?: boolean;
    isLeftTruncationChecked?: boolean;
    onToggleSurvivalPlotLeftTruncation?: () => void;
    patientSurvivalsWithoutLeftTruncation?: PatientSurvival[];
    legendLocation?: LegendLocation;
    showNaPatientsHiddenToggle?: boolean;
    pValue?: number | null;
    showDownloadButtons?: boolean;
    showSlider?: boolean;
    styleOpts?: any; // see victory styles, and styleOptsDefaultProps for examples
    className?: string;
    showCurveInTooltip?: boolean;
    legendLabelComponent?: any;
    yAxisTickCount?: number;
    xAxisTickCount?: number;
    // Compact mode will hide censoring dots in the chart and do binning based on configuration
    compactMode?: boolean;
    attributeId?: string;
    onUserSelection?: (dataBins: DataBin[]) => void;
}

const MIN_GROUP_SIZE_FOR_LOGRANK = 10;
// Start to down sampling when there are more than 1000 dots in the plot.
const SURVIVAL_DOWN_SAMPLING_THRESHOLD = 1000;

@observer
export default class SurvivalChartExtended
    extends React.Component<ISurvivalChartProps, {}>
    implements AbstractChart {
    @observable.ref tooltipModel: any;
    @observable scatterFilter: SurvivalPlotFilters;
    @observable highlightedCurve = '';
    @observable public sliderValue = this.getInitialSliderValue();

    // The denominator should be determined based on the plot width and height.
    private isTooltipHovered: boolean = false;
    private tooltipCounter: number = 0;
    private svgContainer: any;
    private styleOptsDefaultProps: any = {
        width: 1200,
        height: 500,
        padding: { top: 20, bottom: 25, left: 160, right: 20 },
        tooltipXOffset: 20,
        tooltipYOffset: -47,
        axis: {
            x: {
                axisLabel: {
                    padding: 35,
                },
                grid: { opacity: 0 },
            },
            y: {
                axisLabel: {
                    padding: 45,
                    fill: 'black',
                },
                grid: { opacity: 0 },
            },
        },
        pValue: {
            x: 910,
            y: 30,
            textAnchor: 'start',
        },
        legend: {
            x: 600,
            y: 50,
        },
        groupAxis: {
            x: 0,
            y: 0,
        },
    };

    private getInitialSliderValue() {
        if (getServerConfig().survival_initial_x_axis_limit) {
            return Math.min(
                getServerConfig().survival_initial_x_axis_limit,
                this.maximumDataMonthValue
            );
        } else {
            return this.maximumDataMonthValue;
        }
    }

    private events = [
        {
            target: 'data',
            eventHandlers: {
                onMouseOver: () => {
                    return [
                        {
                            target: 'data',
                            mutation: (props: any) => {
                                this.tooltipModel = props;
                                this.tooltipCounter++;
                                return { active: true };
                            },
                        },
                    ];
                },
                onMouseOut: () => {
                    return [
                        {
                            target: 'data',
                            mutation: async () => {
                                await sleep(100);
                                if (
                                    !this.isTooltipHovered &&
                                    this.tooltipCounter === 1
                                ) {
                                    this.tooltipModel = null;
                                }
                                this.tooltipCounter--;
                                return { active: false };
                            },
                        },
                    ];
                },
            },
        },
    ];

    public toSVGDOMNode(): SVGElement {
        return toSvgDomNodeWithLegend(this.svgContainer.firstChild, {
            legendGroupSelector: '.survivalChartDownloadLegend',
            selectorToHide: '.survivalChartLegendHideForDownload',
        });
    }

    @computed
    get styleOpts() {
        let configurableOpts: any = _.merge(
            {},
            this.styleOptsDefaultProps,
            this.props.styleOpts
        );
        configurableOpts.padding.right =
            this.props.legendLocation === LegendLocation.CHART
                ? 300
                : configurableOpts.padding.right;
        if (
            !this.props.styleOpts ||
            !this.props.styleOpts.legend ||
            this.props.styleOpts.legend.x === undefined
        ) {
            // only set legend x if its not passed in
            configurableOpts.legend.x =
                configurableOpts.width - configurableOpts.padding.right;
        }
        if (this.lengthLabelNames > 20) {
            configurableOpts.padding.left =
                configurableOpts.padding.left + this.lengthLabelNames * 4;
        } else if (this.lengthLabelNames > 15 && this.lengthLabelNames < 20) {
            configurableOpts.padding.left + this.lengthLabelNames * 2;
        } else {
            configurableOpts.padding.left = configurableOpts.padding.left;
        }
        if (Object.keys(this.props.sortedGroupedSurvivals).length > 4) {
            this.victoryChartHeight =
                600 +
                20 * Object.keys(this.props.sortedGroupedSurvivals).length;
        } else {
            this.victoryChartHeight = 650;
        }
        if (this.showLandmarkLine) {
            if (Object.keys(this.props.sortedGroupedSurvivals).length > 4) {
                this.victoryChartHeight =
                    this.victoryChartHeight +
                    20 * Object.keys(this.props.sortedGroupedSurvivals).length;
            } else {
                this.victoryChartHeight =
                    this.victoryChartHeight +
                    20 * Object.keys(this.props.sortedGroupedSurvivals).length;
            }
        }
        return configurableOpts;
    }

    @computed get lengthLabelNames() {
        return _.max(
            this.props.analysisGroups.map((item: any) => item.name.length)
        );
    }

    @computed
    get downSamplingDenominators() {
        return {
            x:
                this.styleOpts.width -
                this.styleOpts.padding.left -
                this.styleOpts.padding.right,
            y:
                this.styleOpts.height -
                this.styleOpts.padding.top -
                this.styleOpts.padding.bottom,
        };
    }

    @computed get survivalSummaries(): {
        [groupValue: string]: SurvivalSummary[];
    } {
        return _.mapValues(this.props.sortedGroupedSurvivals, survivals =>
            getSurvivalSummaries(survivals)
        );
    }

    @computed
    get unfilteredScatterData(): GroupedScatterData {
        // map through groups and generate plot data for each
        return _.mapValues(
            this.props.sortedGroupedSurvivals,
            (survivals, group) => {
                const survivalSummaries = this.survivalSummaries[group];

                const groupName = this.analysisGroupsMap[group].name;
                return {
                    numOfCases: survivals.length,
                    line: getLineData(survivals, survivalSummaries),
                    scatterWithOpacity: getScatterDataWithOpacity(
                        survivals,
                        survivalSummaries,
                        groupName
                    ),
                    scatter: getScatterData(
                        survivals,
                        survivalSummaries,
                        groupName
                    ),
                };
            }
        );
    }

    // Only recalculate the scatter data based on the plot filter.
    // The filter is only available when user zooms in the plot.
    @computed
    get scatterData(): GroupedScatterData {
        if (this.props.compactMode) {
            return filterScatterData(
                this.unfilteredScatterData,
                this.scatterFilter,
                {
                    xDenominator: this.downSamplingDenominators.x,
                    yDenominator: this.downSamplingDenominators.y,
                    threshold: SURVIVAL_DOWN_SAMPLING_THRESHOLD,
                    enableCensoringCross: false,
                    floorTimeToMonth: true,
                }
            );
        } else {
            return filterScatterData(
                this.unfilteredScatterData,
                this.scatterFilter,
                {
                    xDenominator: this.downSamplingDenominators.x,
                    yDenominator: this.downSamplingDenominators.y,
                    threshold: SURVIVAL_DOWN_SAMPLING_THRESHOLD,
                    enableCensoringCross: true,
                }
            );
        }
    }

    public static defaultProps: Partial<ISurvivalChartProps> = {
        showTable: true,
        showSlider: true,
        legendLocation: LegendLocation.CHART,
        showNaPatientsHiddenToggle: false,
        showDownloadButtons: true,
        yAxisTickCount: 11,
    };

    constructor(props: ISurvivalChartProps) {
        super(props);
        makeObservable(this);
        this.tooltipMouseEnter = this.tooltipMouseEnter.bind(this);
        this.tooltipMouseLeave = this.tooltipMouseLeave.bind(this);
        this.landmarkLinesChecked = this.landmarkLinesChecked.bind(this);
        this.updateLandmarkValues = this.updateLandmarkValues.bind(this);
        this.openHooverBox = this.openHooverBox.bind(this);
        this.closeHooverBox = this.closeHooverBox.bind(this);
        this.calculateHazardRatio = this.calculateHazardRatio.bind(this);
        this.changeControlGroup = this.changeControlGroup.bind(this);
    }

    @observable landmarkBelowMaxDate: boolean = false;

    @computed get analysisGroupsMap() {
        return _.keyBy(this.props.analysisGroups, g => g.value);
    }

    @computed get logRankTestPVal(): number | null {
        if (
            this.analysisGroupsWithData.length > 1 &&
            _.every(
                this.analysisGroupsWithData,
                group =>
                    this.props.sortedGroupedSurvivals[group.value].length >
                    MIN_GROUP_SIZE_FOR_LOGRANK
            )
        ) {
            return logRankTest(
                ...this.analysisGroupsWithData.map(group => {
                    return this.props.sortedGroupedSurvivals[group.value];
                })
            );
        } else {
            return null;
        }
    }

    @computed get getOrderGroups() {
        const selectedGroup = this.analysisGroupsWithData.filter(
            item => item.legendText == this._controlGroup!.value
        );
        const unSelectedGroup = this.analysisGroupsWithData.filter(
            item => item.legendText !== this._controlGroup!.value
        );
        return [...selectedGroup, ...unSelectedGroup];
    }

    @computed get hazardRatioGroups(): HazardRatioInformation[] | null {
        if (
            this.analysisGroupsWithData.length > 1 &&
            _.every(
                this.analysisGroupsWithData,
                group =>
                    this.props.sortedGroupedSurvivals[group.value].length >
                    MIN_GROUP_SIZE_FOR_LOGRANK
            )
        ) {
            return calculatePairWiseHazardRatio(
                this._controlGroup.value,
                ...this.analysisGroupsWithData.map(group => {
                    return this.props.sortedGroupedSurvivals[group.value];
                })
            );
        } else {
            if (this.analysisGroupsWithData.length > 1) {
                // remove the groups with too low sample size
                const reorderedGroup = this.getOrderGroups;
                const groupsMeetingSampleSize = reorderedGroup
                    .map(item => {
                        if (
                            this.props.sortedGroupedSurvivals[item.value]
                                .length > MIN_GROUP_SIZE_FOR_LOGRANK
                        ) {
                            return item;
                        }
                    })
                    .filter(group => group !== undefined);

                return calculatePairWiseHazardRatio(
                    this._controlGroup.value,
                    ...groupsMeetingSampleSize.map(group => {
                        return this.props.sortedGroupedSurvivals[group!.value];
                    })
                );
            } else {
                return null;
            }
        }
    }

    @action logRankAtLandmarkPVal(threshold: number[]): number | null {
        const landmarkGroups: any = [];
        const survivalData = this.props.sortedGroupedSurvivals;
        threshold.forEach(thd => {
            Object.keys(this.props.sortedGroupedSurvivals).forEach(item => {
                const samples = survivalData[item].filter(obj => {
                    return obj.months >= thd;
                });
                landmarkGroups.push(samples);
            });
        });
        if (
            landmarkGroups.length > 1 &&
            _.every(
                landmarkGroups,
                grp => grp.length > MIN_GROUP_SIZE_FOR_LOGRANK
            )
        ) {
            return logRankTest(...landmarkGroups);
        } else {
            return null;
        }
    }

    @action hazardRatioAtLandmark(threshold: number[]) {
        const landmarkGroups: any = [];
        const survivalData = this.props.sortedGroupedSurvivals;
        threshold.forEach(thd => {
            Object.keys(this.props.sortedGroupedSurvivals).forEach(item => {
                const samples = survivalData[item].filter(obj => {
                    return obj.months >= thd;
                });
                landmarkGroups.push(samples);
            });
        });
        if (
            landmarkGroups.length > 1 &&
            _.every(
                landmarkGroups,
                grp => grp.length > MIN_GROUP_SIZE_FOR_LOGRANK
            )
        ) {
            return calculatePairWiseHazardRatio(
                this._controlGroup.value,
                ...landmarkGroups
            );
        } else {
            return null;
        }
    }

    @computed get victoryLegendData() {
        const data: any = [];
        if (this.props.legendLocation === LegendLocation.CHART) {
            for (const grp of this.getOrderGroups) {
                data.push({
                    name: grp.name || grp.legendText || grp.value,
                    symbol: {
                        fill: grp.color,
                        strokeOpacity: 0,
                        type: 'square',
                        size: 6,
                    },
                });
            }
        }
        return data;
    }

    private get showPValueText() {
        // p value is not null or undefined
        return !_.isNil(this.props.pValue);
    }

    private get pValue() {
        // show NA if any group has least than 10 cases
        const showNA = _.some(this.props.analysisGroups, group => {
            return (
                !this.props.sortedGroupedSurvivals[group.value] ||
                this.props.sortedGroupedSurvivals[group.value].length < 10
            );
        });

        // TODO: Temporarily use the show_p_q_values parameter to hide p value
        // for GENIE. We can make a more general config class in the future once
        // we have a better idea of how to handle p/q values in small groups for
        // the public portal
        if (
            !getServerConfig()
                .survival_show_p_q_values_in_survival_type_table &&
            showNA
        ) {
            return 'N/A (<10 cases in a group)';
        } else {
            return toConditionalPrecision(this.props.pValue!, 3, 0.01);
        }
    }

    private get pValueText() {
        return (
            <VictoryLabel
                x={this.styleOpts.pValue.x}
                y={this.styleOpts.pValue.y}
                style={baseLabelStyles}
                textAnchor={this.styleOpts.pValue.textAnchor}
                text={`Logrank Test P-Value: ${this.pValue}`}
            />
        );
    }

    @computed get legendDataForDownload() {
        const data: any = this.analysisGroupsWithData.map(grp => ({
            name: !!grp.name ? grp.name : grp.value,
            symbol: {
                fill: grp.color,
                strokeOpacity: 0,
                type: 'square',
                size: 6,
            },
        }));

        // add an indicator in case NA is excluded
        if (this.props.naPatientsHiddenInSurvival) {
            data.push({
                name:
                    '* Patients with NA for any of the selected attributes are excluded',
                symbol: { opacity: 0 },
            });
        }

        return data;
    }

    private tooltipMouseEnter(): void {
        this.isTooltipHovered = true;
    }

    private tooltipMouseLeave(): void {
        this.isTooltipHovered = false;
        this.tooltipModel = null;
    }

    @autobind
    private getSvg() {
        return this.toSVGDOMNode();
    }

    @autobind
    private getData() {
        const data = [];
        for (const group of this.analysisGroupsWithData) {
            data.push({
                scatterData: getScatterData(
                    this.props.sortedGroupedSurvivals[group.value],
                    this.survivalSummaries[group.value],
                    group.value
                ),
                title: group.name !== undefined ? group.name : group.value,
            });
        }
        return getDownloadContent(data, this.props.title);
    }

    @autobind
    private hoverCircleFillOpacity(datum: any, active: any) {
        if (
            active ||
            (this.isTooltipHovered &&
                this.tooltipModel &&
                this.tooltipModel.datum.studyId === datum.studyId &&
                this.tooltipModel.datum.patientId === datum.patientId)
        ) {
            return 0.3;
        } else {
            return 0;
        }
    }

    @computed get analysisGroupsWithData() {
        let analysisGroups = this.props.analysisGroups;
        // filter out groups with no data
        analysisGroups = analysisGroups.filter(
            grp =>
                grp.value in this.scatterData &&
                this.scatterData[grp.value].numOfCases > 0
        );
        return analysisGroups;
    }

    @computed get scattersAndLines() {
        // sort highlighted group to the end to show its elements on top
        let analysisGroupsWithData = this.analysisGroupsWithData;
        analysisGroupsWithData = _.sortBy(analysisGroupsWithData, grp =>
            this.highlightedCurve === grp.value ? 1 : 0
        );
        const lineElements = analysisGroupsWithData.map(grp => (
            <VictoryLine
                key={grp.value}
                interpolation="stepAfter"
                data={this.scatterData[grp.value].line}
                style={{
                    data: {
                        stroke: grp.color,
                        strokeWidth:
                            this.highlightedCurve === grp.value ? 4 : 1,
                        fill: '#000000',
                        fillOpacity: 0,
                    },
                }}
            />
        ));
        const scatterWithOpacityElements = analysisGroupsWithData.map(grp => (
            <VictoryScatter
                key={grp.value}
                data={this.scatterData[grp.value].scatterWithOpacity}
                symbol="plus"
                style={{
                    data: { fill: grp.color, opacity: (d: any) => d.opacity },
                }}
                size={3}
            />
        ));
        const scatterElements = analysisGroupsWithData.map(grp => (
            <VictoryScatter
                key={grp.value}
                data={this.scatterData[grp.value].scatter}
                symbol="circle"
                style={{
                    data: {
                        fill: grp.color,
                        fillOpacity: this.hoverCircleFillOpacity,
                    },
                }}
                size={10}
                events={this.events}
            />
        ));
        return lineElements
            .concat(scatterWithOpacityElements)
            .concat(scatterElements);
    }

    @computed get landmarkLines() {
        const landmarkValues = this.landmarkPoint;
        const lines = landmarkValues.map(item => (
            <VictoryLine
                style={{
                    data: {
                        stroke: 'black',
                        strokeDasharray: '3',
                        strokeWidth: 1,
                    },
                    parent: { border: '1px solid #ccc' },
                }}
                data={[
                    { x: item.xStart, y: item.yStart },
                    { x: item.xEnd, y: item.yEnd },
                ]}
            />
        ));

        return lines;
    }

    @computed get groupLandMarkLine() {
        const landmarkLineLegend = this.analysisGroupsWithData.map(
            (item: any) => item.name
        );
        landmarkLineLegend.unshift('Landmark');
        const groups = landmarkLineLegend.map((x: string[], i: number) => (
            <VictoryLabel
                text={x}
                x={0}
                y={
                    this.styleOptsDefaultProps.height -
                    this.styleOpts.padding.bottom +
                    this.labelOffset +
                    i * 20
                }
                textAnchor="start"
                style={{
                    fontWeight: i == 0 ? 'bold' : 'normal',
                    fontFamily:
                        CBIOPORTAL_VICTORY_THEME.legend.style.labels.fontFamily,
                }}
            />
        ));
        return groups;
    }

    @computed get groupSurvivalPlot() {
        const landmarkLineLegend = this.analysisGroupsWithData.map(
            (item: any) => item.name
        );
        landmarkLineLegend.unshift('Number at risk (n)');
        const groups = landmarkLineLegend.map((x: string[], i: number) => (
            <VictoryLabel
                text={x}
                x={0}
                y={
                    this.styleOptsDefaultProps.height -
                    this.styleOpts.padding.bottom +
                    60 +
                    i * 20
                }
                textAnchor="start"
                style={{
                    fontWeight: i == 0 ? 'bold' : 'normal',
                    fontFamily:
                        CBIOPORTAL_VICTORY_THEME.legend.style.labels.fontFamily,
                }}
            />
        ));
        return groups;
    }

    @computed get landmarkInformation() {
        // Calculate group size at time point 0
        const initialGroupSampleSize = this.calculateGroupSize([0]);
        // get the order of the groups
        const orderOfLabels = this.analysisGroupsWithData.map(
            item => item.value
        );

        const groupSizeAtTimePoint = this.calculateGroupSize(
            this.landmarkPoint.map(item => item.xStart)
        ).sort(
            (a, b) =>
                orderOfLabels.indexOf(a.groupName) -
                orderOfLabels.indexOf(b.groupName)
        );
        const landmarkPointInformation = _.groupBy(
            groupSizeAtTimePoint,
            'timePoint'
        );

        const point = Object.keys(landmarkPointInformation).map(key =>
            landmarkPointInformation[key].map((value, i) => {
                if (
                    landmarkPointInformation[key][i].timePoint <=
                    this.sliderValue
                ) {
                    this.landmarkBelowMaxDate = true;
                    return (
                        <VictoryLabel
                            text={
                                (
                                    (landmarkPointInformation[key][i]
                                        .aliveSamples /
                                        initialGroupSampleSize.filter(
                                            x =>
                                                x.groupName ==
                                                landmarkPointInformation[key][i]
                                                    .groupName
                                        )[0].aliveSamples) *
                                    100
                                ).toFixed(1) + '%'
                            }
                            x={
                                landmarkPointInformation[key][i].timePoint *
                                    this.scaleFactor +
                                this.styleOpts.padding.left
                            }
                            y={
                                this.styleOptsDefaultProps.height -
                                this.styleOpts.padding.bottom +
                                this.labelOffset +
                                20 +
                                i * 20
                            }
                            style={{
                                fontFamily:
                                    CBIOPORTAL_VICTORY_THEME.legend.style.labels
                                        .fontFamily,
                            }}
                            textAnchor="middle"
                        />
                    );
                } else {
                    this.landmarkBelowMaxDate =
                        Math.min(
                            ...Object.keys(landmarkPointInformation).map(Number)
                        ) < this.sliderValue;
                }
            })
        );
        return point;
    }

    @computed get timePointsForNumberAtRiskLabels() {
        return scaleLinear()
            .domain([0, this.sliderValue])
            .ticks(18);
    }

    @computed get numberOfSamplesAtRisk(): ReactNode[] {
        const orderOfLabels = this.analysisGroupsWithData.map(
            item => item.value
        );
        const timePoints: number[] = scaleLinear()
            .domain([0, this.sliderValue])
            .ticks(18);
        const numberAtRisk = _.groupBy(
            this.calculateGroupSize(timePoints).sort(
                (a, b) =>
                    orderOfLabels.indexOf(a.groupName) -
                    orderOfLabels.indexOf(b.groupName)
            ),
            'timePoint'
        );
        const labelComponents: ReactNode[] = [];
        let someTimePointsOverlap: boolean = false;

        // Hide overlapping labels of necessary -> start with time point at index 0 and check
        // if time point (index 0) and the second time point (index 1) overlap.
        // If yes -> remove all labels at index 1,3,5, and so on
        const checkOverlap = (
            labelX: number,
            labelWidth: number,
            existingLabel: ReactNode
        ): boolean => {
            const existingLabelX: number = (existingLabel as any).props.x; // Assuming VictoryLabel has an x attribute
            const existingLabelWidth: number = calculateLabelWidth(
                (existingLabel as any).props.text,
                CBIOPORTAL_VICTORY_THEME.legend.style.labels.fontFamily,
                CBIOPORTAL_VICTORY_THEME.legend.style.labels.fontSize
            );

            return !(
                labelX + labelWidth < existingLabelX ||
                labelX > existingLabelX + existingLabelWidth
            );
        };

        const addLabelsForTimePoint = (
            timePoint: number,
            index: number
        ): void => {
            const rowLabels: ReactNode[] = numberAtRisk[timePoint].map(
                (grp, i) => {
                    const labelX: number =
                        grp.timePoint * this.scaleFactor +
                        this.styleOpts.padding.left;

                    const labelY: number =
                        this.styleOptsDefaultProps.height -
                        this.styleOpts.padding.bottom +
                        80 +
                        i * 20;

                    const labelWidth: number = calculateLabelWidth(
                        numberAtRisk[timePoint][i].aliveSamples,
                        CBIOPORTAL_VICTORY_THEME.legend.style.labels.fontFamily,
                        CBIOPORTAL_VICTORY_THEME.legend.style.labels.fontSize
                    );

                    const labelComponent: ReactNode = (
                        <VictoryLabel
                            key={`${timePoint}-${i}`}
                            text={numberAtRisk[timePoint][i].aliveSamples}
                            x={labelX}
                            y={labelY}
                            style={{
                                fontFamily:
                                    CBIOPORTAL_VICTORY_THEME.legend.style.labels
                                        .fontFamily,
                            }}
                            textAnchor="middle"
                        />
                    );

                    labelComponents.push(labelComponent);
                    return labelComponent;
                }
            );
        };
        timePoints.forEach((timePoint, index) => {
            const timePointOverlap: boolean = numberAtRisk[timePoint].some(
                (grp, i) => {
                    const labelX: number =
                        grp.timePoint * this.scaleFactor +
                        this.styleOpts.padding.left;

                    const labelWidth: number = calculateLabelWidth(
                        numberAtRisk[timePoint][i].aliveSamples,
                        CBIOPORTAL_VICTORY_THEME.legend.style.labels.fontFamily,
                        CBIOPORTAL_VICTORY_THEME.legend.style.labels.fontSize
                    );

                    return labelComponents.some(existingLabel =>
                        checkOverlap(labelX, labelWidth, existingLabel)
                    );
                }
            );

            if (!timePointOverlap) {
                if (
                    !someTimePointsOverlap ||
                    (index % 2 === 0 && index + 1 !== timePoints.length - 1) ||
                    index === timePoints.length - 1
                ) {
                    addLabelsForTimePoint(timePoint, index);
                }
            } else {
                someTimePointsOverlap = true;
            }
        });

        return labelComponents;
    }

    @observable _latestLandMarkPoint: number = 0;

    @action updateLatestLandMarkPoint(value: number) {
        this._latestLandMarkPoint = value;
    }

    @computed get legendWithHazardRatio() {
        if (this.hazardRatioGroups !== null) {
            const conGroupIndex = this.availableGroups
                .map(item => item.label)
                .indexOf(this._controlGroup.value);
            const hazardRatio = this.hazardRatioGroups.map(
                (hr, i) =>
                    ({
                        name: this.props.analysisGroups.map(item => item.name)[
                            i
                        ],
                        hazardInformation:
                            '\n' +
                            'HR: ' +
                            hr.hazardInformation[
                                conGroupIndex
                            ].hazardRatio.toFixed(3) +
                            ' ( 95% CI: ' +
                            hr.hazardInformation[conGroupIndex].lowerCI.toFixed(
                                3
                            ) +
                            ' - ' +
                            hr.hazardInformation[conGroupIndex].upperCI.toFixed(
                                3
                            ) +
                            ' )',
                    } as HazardInformationLegend)
            );
            const legendInfoName = this.victoryLegendData.map(
                (grp: any) => grp.name
            );
            const hazardRatioSorted = _.orderBy(hazardRatio, [
                hazardRatio => legendInfoName.indexOf(hazardRatio.name),
            ]);
            const information = _.merge(
                _.keyBy(this.victoryLegendData, 'name'),
                _.keyBy(hazardRatioSorted, 'name')
            );

            const legendWithHR = Object.keys(information).map(
                (item: string, i: number) => {
                    return {
                        name:
                            i == 0
                                ? information[item].name + '\nControl'
                                : information[item].hazardInformation !==
                                  undefined
                                ? information[item].name +
                                  information[item].hazardInformation
                                : information[item].name + '\nNA',
                        subName: 'Hazard ratio group',
                        symbol: information[item].symbol,
                    };
                }
            );
            return legendWithHR;
        }
    }

    @computed
    get xAxisTickCount() {
        return (
            this.props.xAxisTickCount ||
            this.getAxisTickCount(
                this.showLegend ? this.styleOpts.legend.x : this.styleOpts.width
            )
        );
    }

    getAxisTickCount(size: number) {
        return Math.ceil(size / 200) * 5;
    }

    @computed
    get showLegend() {
        return this.victoryLegendData.length > 0;
    }

    @computed get maximumDataMonthValue() {
        return _.chain(this.props.sortedGroupedSurvivals)
            .map(survivals => survivals[survivals.length - 1].months)
            .max()
            .ceil()
            .value();
    }

    @action.bound
    onSliderChange(value: number) {
        this.sliderValue = value;
        this.scaleFactor =
            (this.styleOpts.width -
                this.styleOpts.padding.left -
                this.styleOpts.padding.right) /
            value;
    }

    @observable _inputFieldVisible: boolean = false;
    @observable _calculateHazardRatio: boolean = false;
    @observable landmarkPoint: LandmarkLineValues[];
    @observable showLandmarkLine: boolean = false;
    @observable hooverBoxVisible: boolean = false;
    @observable showHazardRatio: boolean = false;
    @observable victoryChartHeight: number;
    @observable scaleFactor: number =
        (this.styleOpts.width -
            this.styleOpts.padding.left -
            this.styleOpts.padding.right) /
        this.sliderValue;
    @observable showNormalLegend = true;
    @observable hazardRatio: HazardRatioInformation[];
    @observable labelOffset: number =
        65 + (Object.keys(this.props.sortedGroupedSurvivals).length + 1) * 20;

    @action openHooverBox() {
        return (this.hooverBoxVisible = true);
    }

    @action closeHooverBox() {
        return (this.hooverBoxVisible = false);
    }

    @action landmarkLinesChecked() {
        if (!this._inputFieldVisible) {
            return (this._inputFieldVisible = true);
        } else {
            return (
                (this._inputFieldVisible = false),
                (this.showLandmarkLine = false),
                $('input[data-test=landmarkValues]').val('')
            );
        }
    }

    @action calculateGroupSize(thresholdValues: number[]) {
        const landmarkInformationData: LandmarkInformation[] = [];
        const survivalData = this.props.sortedGroupedSurvivals;
        const groupInformation = Object.keys(this.props.sortedGroupedSurvivals);
        thresholdValues.forEach(threshold => {
            groupInformation.forEach(item => {
                const samples = survivalData[item].filter(obj => {
                    return obj.months >= threshold;
                }).length;
                const information = {
                    groupName: item,
                    aliveSamples: samples,
                    timePoint: threshold,
                };
                landmarkInformationData.push(information);
            });
        });
        return landmarkInformationData;
    }

    @action updateLandmarkValues(event: any): LandmarkLineValues[] {
        const landmarkValues: [] =
            event.target.value.split(',').length == 1
                ? event.target.value.split(' ')
                : event.target.value.split(',');
        const landmarkArray = landmarkValues.map(
            item =>
                ({
                    xStart: Number(item),
                    xEnd: Number(item),
                    yStart: 0,
                    yEnd: 103,
                } as LandmarkLineValues)
        );
        this.updateLatestLandMarkPoint(landmarkArray[0].xStart);
        this.updateVisibilityLandmarkLines();
        this.calculateGroupSize(landmarkArray.map(obj => obj.xStart));
        return (this.landmarkPoint = landmarkArray);
    }

    @action calculateHazardRatio() {
        if (!this.showHazardRatio) {
            this.showNormalLegend = false;
            this.showHazardRatio = true;
        } else {
            this.showNormalLegend = true;
            this.showHazardRatio = false;
        }
    }

    @computed get defaultLegend() {
        const theme = _.cloneDeep(CBIOPORTAL_VICTORY_THEME);
        theme.legend.style.data = {
            type: 'square',
            size: 5,
            strokeWidth: 0,
            stroke: 'black',
        };
        return (
            <VictoryLegend
                x={this.styleOpts.legend.x}
                y={this.styleOpts.legend.y}
                data={this.victoryLegendData}
                labels={this.victoryLegendData.map((grp: any) => grp.name)}
                style={{
                    ...theme.legend.style,
                    title: { fontWeight: 'bold' },
                }}
                labelComponent={<VictoryLabel />}
                groupComponent={<g className="survivalChartDownloadLegend" />}
            />
        );
    }

    @action updateVisibilityLandmarkLines() {
        return (this.showLandmarkLine = true);
    }

    @action.bound
    onSliderTextChange(text: string) {
        this.sliderValue = Number.parseFloat(text);
        this.scaleFactor =
            (this.styleOpts.width -
                this.styleOpts.padding.left -
                this.styleOpts.padding.right) /
            Number.parseFloat(text);
    }

    @observable _controlGroup: { label: string; value: string } = {
        label: this.availableGroups[0].label,
        value: this.availableGroups[0].value,
    };

    @computed get selectedControlGroup() {
        return this._controlGroup;
    }

    @computed get availableGroups() {
        if (Object.keys(this.props.sortedGroupedSurvivals).length > 1) {
            const filteredObjects = Object.keys(
                this.props.sortedGroupedSurvivals
            )
                .filter(
                    item =>
                        this.props.sortedGroupedSurvivals[item].length >
                        MIN_GROUP_SIZE_FOR_LOGRANK
                )
                .map(item => ({
                    label: item,
                    value: item,
                }));
            return filteredObjects.length > 0
                ? filteredObjects
                : [
                      {
                          label: 'Group sizes too small',
                          value: 'Group sizes too small',
                      },
                  ];
        } else {
            return [
                {
                    label: 'Group sizes too small',
                    value: 'Group sizes too small',
                },
            ];
        }
    }

    @action.bound changeControlGroup(groupValue: {
        label: string;
        value: string;
    }) {
        this._controlGroup = groupValue;
    }
    @computed get xAxisForPlot() {
        const xAxis = (
            <VictoryAxis
                style={this.styleOpts.axis.x}
                crossAxis={false}
                tickCount={18}
                label={this.props.xAxisLabel}
                orientation={'bottom'}
                domain={[0, 100]}
            />
        );
        return xAxis;
    }
    @computed get xAxisForSummaryViewPlot() {
        const xAxis = (
            <VictoryAxis
                style={this.styleOpts.axis.x}
                crossAxis={false}
                tickCount={this.xAxisTickCount}
                label={this.props.xAxisLabel}
                orientation={'bottom'}
            />
        );
        return xAxis;
    }
    @computed
    get chart() {
        return (
            <div className={this.props.className} data-test={'SurvivalChart'}>
                {this.props.showLeftTruncationCheckbox && (
                    <LeftTruncationCheckbox
                        className={styles.paddingLeftTruncationCheckbox}
                        onToggleSurvivalPlotLeftTruncation={
                            this.props.onToggleSurvivalPlotLeftTruncation
                        }
                        isLeftTruncationChecked={
                            this.props.isLeftTruncationChecked
                        }
                        patientSurvivalsWithoutLeftTruncation={
                            this.props.patientSurvivalsWithoutLeftTruncation
                        }
                        patientToAnalysisGroups={
                            this.props.patientToAnalysisGroups
                        }
                        sortedGroupedSurvivals={
                            this.props.sortedGroupedSurvivals
                        }
                    />
                )}
                {this.props.showDownloadButtons && (
                    <DownloadControls
                        dontFade={true}
                        filename={this.props.fileName}
                        buttons={['SVG', 'PNG', 'PDF', 'Data']}
                        getSvg={this.getSvg}
                        getData={this.getData}
                        style={{ position: 'absolute', zIndex: 10, right: 10 }}
                        type="button"
                        showDownload={
                            getServerConfig().skin_hide_download_controls ===
                            DownloadControlOption.SHOW_ALL
                        }
                    />
                )}
                <div>
                    {this.props.showSlider && (
                        <div
                            className="form-check "
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginLeft: 30,
                            }}
                        >
                            <label className={'checkbox-inline'}>
                                <input
                                    type="checkbox"
                                    data-test={'hazardRatioCheckbox'}
                                    onChange={this.calculateHazardRatio}
                                    disabled={
                                        Object.keys(
                                            this.props.sortedGroupedSurvivals
                                        ).length == 1
                                    }
                                />{' '}
                                Calculate hazard ratios
                            </label>
                            <React.Fragment>
                                <div
                                    style={{
                                        marginLeft: '5px',
                                        width: 300,
                                        height: 35,
                                    }}
                                >
                                    <ReactSelect
                                        value={this.selectedControlGroup}
                                        options={this.availableGroups}
                                        onChange={this.changeControlGroup}
                                        searchable={false}
                                        clearable={false}
                                        placeholder={'Select control group'}
                                        disabled={!this.showHazardRatio}
                                    />
                                </div>
                                <DefaultTooltip
                                    placement="top"
                                    overlay={
                                        <span>
                                            Option to set the control group.
                                        </span>
                                    }
                                    destroyTooltipOnHide={true}
                                >
                                    <i
                                        className="fa fa-lg fa-question-circle"
                                        style={{
                                            padding: 10,
                                            alignItems: 'center',
                                        }}
                                    ></i>
                                </DefaultTooltip>
                            </React.Fragment>
                            <label className={'checkbox-inline'}>
                                <input
                                    type="checkbox"
                                    data-test={'landmarkLines'}
                                    onChange={this.landmarkLinesChecked.bind(
                                        this
                                    )}
                                />{' '}
                                Add landmarks
                            </label>
                            <React.Fragment>
                                <div>
                                    <input
                                        type="text"
                                        data-test="landmarkValues"
                                        placeholder={'Add landmark values'}
                                        className="form-control"
                                        disabled={!this._inputFieldVisible}
                                        name="landmarkValues"
                                        style={{
                                            marginLeft: '10px',
                                            height: 35,
                                            width: 200,
                                            float: 'left',
                                        }}
                                        onChange={this.updateLandmarkValues.bind(
                                            this
                                        )}
                                    />
                                </div>
                                <DefaultTooltip
                                    placement="right"
                                    overlay={
                                        <span>
                                            Enter numeric landmark(s) (comma or
                                            whitespace separated)
                                        </span>
                                    }
                                    destroyTooltipOnHide={true}
                                >
                                    <i
                                        className="fa fa-lg fa-question-circle"
                                        style={{
                                            padding: 10,
                                            alignItems: 'center',
                                        }}
                                    ></i>
                                </DefaultTooltip>
                            </React.Fragment>
                        </div>
                    )}
                    {this.props.showSlider && (
                        <div
                            className="small"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginLeft: 200,
                                marginTop: 15,
                            }}
                        >
                            <span>X-Axis Max:</span>
                            <div
                                className={'RangeSliderContainer'}
                                style={{
                                    width: 300,
                                    marginLeft: 10,
                                    marginRight: 10,
                                    paddingTop: 10,
                                    paddingBottom: 10,
                                }}
                            >
                                <Slider
                                    min={0}
                                    max={this.maximumDataMonthValue}
                                    value={this.sliderValue}
                                    onChange={this.onSliderChange}
                                    tooltip={false}
                                    step={1}
                                />
                            </div>
                            <EditableSpan
                                className={styles['XmaxNumberInput']}
                                value={this.sliderValue.toString()}
                                setValue={this.onSliderTextChange}
                                numericOnly={true}
                            />
                            <span>
                                {pluralize('Month', this.sliderValue)} Survival
                            </span>
                        </div>
                    )}
                </div>

                <div>
                    <VictoryChart
                        containerComponent={
                            <VictoryZoomContainer
                                responsive={false}
                                disable={true}
                                zoomDomain={
                                    this.props.showSlider
                                        ? { x: [0, this.sliderValue] }
                                        : undefined
                                }
                                onZoomDomainChange={_.debounce(
                                    (domain: any) => {
                                        this.scatterFilter = domain as SurvivalPlotFilters;
                                    },
                                    1000
                                )}
                                containerRef={(ref: any) =>
                                    (this.svgContainer = ref)
                                }
                                height={this.victoryChartHeight}
                            />
                        }
                        height={this.styleOpts.height}
                        width={this.styleOpts.width}
                        padding={this.styleOpts.padding}
                        theme={CBIOPORTAL_VICTORY_THEME}
                        domainPadding={{ x: [10, 50], y: [20, 20] }}
                    >
                        <VictoryAxis
                            label={this.props.yAxisLabel}
                            dependentAxis={true}
                            tickFormat={(t: any) => `${t}%`}
                            tickCount={this.props.yAxisTickCount}
                            style={this.styleOpts.axis.y}
                            domain={[0, 100]}
                            crossAxis={false}
                        />
                        {this.showPValueText && this.pValueText}
                        {this.showLegend && this.xAxisForPlot}
                        {!this.showLegend && this.xAxisForSummaryViewPlot}
                        {this.scattersAndLines}
                        {this.showLegend && this.showHazardRatio}
                        {this.showNormalLegend && this.defaultLegend}
                        {this.showHazardRatio && (
                            <VictoryLegend
                                x={this.styleOpts.legend.x}
                                y={this.styleOpts.legend.y}
                                data={this.legendWithHazardRatio}
                                labels={(data: any) => [
                                    data.name,
                                    data.subName || '',
                                ]}
                                labelComponent={
                                    <VictoryLabel
                                        style={[
                                            {
                                                fontFamily:
                                                    CBIOPORTAL_VICTORY_THEME
                                                        .legend.style.labels
                                                        .fontFamily,
                                                fontSize:
                                                    CBIOPORTAL_VICTORY_THEME
                                                        .legend.style.labels
                                                        .fontSize,
                                                fontWeight: 'normal',
                                            },
                                            {
                                                fontFamily:
                                                    CBIOPORTAL_VICTORY_THEME
                                                        .legend.style.labels
                                                        .fontFamily,
                                                fontWeight: 'normal',
                                                fontSize: '12',
                                            },
                                        ]}
                                        dy={6.5}
                                    />
                                }
                                groupComponent={
                                    <g className="survivalChartDownloadLegend" />
                                }
                            />
                        )}
                        {this.showLegend && this.groupSurvivalPlot}
                        {this.showLegend && this.numberOfSamplesAtRisk}
                        {this.showLandmarkLine && this.landmarkLines}
                        {this.showLandmarkLine &&
                            this.landmarkBelowMaxDate &&
                            this.groupLandMarkLine}
                        {this.showLandmarkLine && this.landmarkInformation}
                    </VictoryChart>
                </div>
            </div>
        );
    }

    @computed get chartTooltip() {
        return (
            <div style={{ maxWidth: 250 }}>
                {this.analysisGroupsWithData.map(group => (
                    <span
                        key={group.value}
                        style={{
                            display: 'inline-block',
                            marginRight: 12,
                            marginBottom: 20,
                            fontWeight:
                                this.highlightedCurve === group.value
                                    ? 'bold'
                                    : 'initial',
                            cursor: 'pointer',
                        }}
                        onClick={() => {
                            this.highlightedCurve =
                                this.highlightedCurve === group.value
                                    ? ''
                                    : group.value;
                        }}
                    >
                        <div
                            style={{
                                width: 10,
                                height: 10,
                                display: 'inline-block',
                                backgroundColor: group.color,
                                marginRight: 5,
                            }}
                        />
                        {!!group.name ? group.name : group.value}
                    </span>
                ))}
                {this.props.showNaPatientsHiddenToggle && (
                    <div className="checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={this.props.naPatientsHiddenInSurvival}
                                onClick={
                                    this.props.toggleSurvivalHideNAPatients
                                }
                            />{' '}
                            Exclude patients with NA for any of the selected
                            attributes.
                        </label>
                    </div>
                )}
            </div>
        );
    }

    @computed get tableRows() {
        return this.props.analysisGroups.map(grp => (
            <tr>
                <td>{!!grp.name ? grp.name : grp.value}</td>
                {getStats(
                    this.props.sortedGroupedSurvivals[grp.value],
                    this.survivalSummaries[grp.value]
                ).map(stat => (
                    <td>
                        <b>{stat}</b>
                    </td>
                ))}
            </tr>
        ));
    }

    @computed get tableRowsHazardRatio() {
        if (this.hazardRatioGroups !== null) {
            return (
                <table
                    className={'table table-striped'}
                    style={{ marginTop: 1, width: '100%' }}
                >
                    <tbody>
                        <tr>
                            <td>
                                <i style={{ fontSize: 12, color: 'grey' }}>
                                    hazard ratio ( {<span>&#177;</span>}95%
                                    confidence interval)
                                </i>{' '}
                            </td>
                            {this.hazardRatioGroups!.map((grp, i) => (
                                <td>{this.props.analysisGroups[i].name}</td>
                            ))}
                        </tr>
                        {this.hazardRatioGroups!.map((grp, i) => (
                            <tr>
                                <td>{this.props.analysisGroups[i].name}</td>
                                {this.hazardRatioGroups!.map((subgrp, k) => (
                                    <td>
                                        <b>
                                            {subgrp.hazardInformation[
                                                i
                                            ].hazardRatio.toFixed(3)}{' '}
                                            (
                                            {subgrp.hazardInformation[
                                                i
                                            ].lowerCI.toFixed(3)}
                                            -
                                            {subgrp.hazardInformation[
                                                i
                                            ].upperCI.toFixed(3)}
                                            )
                                        </b>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        } else {
            return (
                <table>
                    <tbody>
                        <tr>
                            <td>
                                <b>Hazard ratio calculation failed</b>: Not
                                enough groups / group size too small
                            </td>
                        </tr>
                    </tbody>
                </table>
            );
        }
    }

    public render() {
        if (
            _.flatten(_.values(this.props.sortedGroupedSurvivals)).length === 0
        ) {
            return <div className={'alert alert-info'}>No data to plot.</div>;
        } else {
            return (
                <div style={{ position: 'relative' }}>
                    {this.props.legendLocation === LegendLocation.TOOLTIP ? (
                        <DefaultTooltip
                            mouseLeaveDelay={0.2}
                            placement="rightBottom"
                            overlay={this.chartTooltip}
                        >
                            {this.chart}
                        </DefaultTooltip>
                    ) : (
                        this.chart
                    )}
                    {this.tooltipModel && (
                        <Popover
                            arrowOffsetTop={56}
                            className={classnames(
                                'cbioportal-frontend',
                                'cbioTooltip',
                                styles.Tooltip
                            )}
                            positionLeft={
                                this.tooltipModel.x +
                                this.styleOpts.tooltipXOffset
                            }
                            {...{ container: this }}
                            positionTop={
                                this.tooltipModel.y +
                                this.styleOpts.tooltipYOffset
                            }
                            onMouseEnter={this.tooltipMouseEnter}
                            onMouseLeave={this.tooltipMouseLeave}
                        >
                            <div>
                                Patient ID:{' '}
                                <a
                                    href={getPatientViewUrl(
                                        this.tooltipModel.datum.studyId,
                                        this.tooltipModel.datum.patientId
                                    )}
                                    target="_blank"
                                >
                                    {this.tooltipModel.datum.patientId}
                                </a>
                                <br />
                                {!!this.props.showCurveInTooltip && [
                                    `Curve: ${this.tooltipModel.datum.group}`,
                                    <br />,
                                ]}
                                {this.props.yLabelTooltip}:{' '}
                                {this.tooltipModel.datum.y.toFixed(2)}%<br />
                                {this.tooltipModel.datum.status
                                    ? this.props.xLabelWithEventTooltip
                                    : this.props.xLabelWithoutEventTooltip}
                                : {this.tooltipModel.datum.x.toFixed(2)} months{' '}
                                {this.tooltipModel.datum.status
                                    ? ''
                                    : '(censored)'}
                                <br />
                                {this.props.analysisClinicalAttribute && (
                                    <span>
                                        {
                                            this.props.analysisClinicalAttribute
                                                .displayName
                                        }
                                        :{' '}
                                        {
                                            this.props.patientToAnalysisGroups[
                                                this.tooltipModel.datum
                                                    .uniquePatientKey
                                            ]
                                        }
                                    </span>
                                )}
                                <br />
                                Number of patients at risk:{' '}
                                {this.tooltipModel.datum.atRisk}
                            </div>
                        </Popover>
                    )}
                    {this.showHazardRatio && (
                        <div>
                            <h4 className="forceHeaderStyle h4">
                                Hazard ratio
                            </h4>
                        </div>
                    )}

                    {this.showHazardRatio && this.tableRowsHazardRatio}

                    {this.props.showTable && (
                        <div style={{ marginTop: 20, width: '100%' }}>
                            <h4 className="forceHeaderStyle h4">
                                Survival plot summary
                            </h4>
                            <table
                                className="table table-striped"
                                style={{ marginTop: 5, width: '100%' }}
                            >
                                <tbody>
                                    <tr>
                                        <td />
                                        <td>{this.props.totalCasesHeader}</td>
                                        <td>{this.props.statusCasesHeader}</td>
                                        <td>{this.props.medianMonthsHeader}</td>
                                    </tr>
                                    {this.tableRows}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            );
        }
    }
}
export function generateFilterDataBin(
    scatterPoints: Array<ScatterData>,
    getAttributeId: () => string
): DataBin {
    const minX = scatterPoints[0].x;
    const maxX = scatterPoints[scatterPoints.length - 1].x;
    return {
        id: getAttributeId(),
        start: minX,
        end: maxX,
    } as DataBin;
}
