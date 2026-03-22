import * as React from 'react';
import { observer, Observer } from 'mobx-react';
import { computed, observable, action, makeObservable } from 'mobx';
import { bind } from 'bind-decorator';
import ifNotDefined from '../../lib/ifNotDefined';
import { calculateBoxPlotModel } from '../../lib/boxPlotUtils';
import {
    VictoryBoxPlot,
    VictoryChart,
    VictoryAxis,
    VictoryScatter,
    VictoryLegend,
    VictoryLabel,
    VictoryLine,
    LineSegment,
} from 'victory';
import { IBaseScatterPlotData } from './ScatterPlot';
import {
    getBottomLegendHeight,
    getDeterministicRandomNumber,
    getLegendItemsPerRow,
    getMaxLegendLabelWidth,
    LegendDataWithId,
    separateScatterDataByAppearance,
} from './PlotUtils';
import { logicalAnd } from '../../lib/LogicUtils';
import { tickFormatNumeral } from 'cbioportal-frontend-commons';
import { makeScatterPlotSizeFunction } from './PlotUtils';
import {
    CBIOPORTAL_VICTORY_THEME,
    axisTickLabelStyles,
    getTextWidth,
    ScatterPlotTooltip,
    ScatterPlotTooltipHelper,
    truncateWithEllipsis,
    wrapText,
} from 'cbioportal-frontend-commons';
import autobind from 'autobind-decorator';
import { dataPointIsLimited } from 'shared/components/plots/PlotUtils';
import _ from 'lodash';
import { IAxisLogScaleParams, IBoxScatterPlotPoint } from './PlotsTabUtils';
import { Popover } from 'react-bootstrap';
import * as ReactDOM from 'react-dom';
import classnames from 'classnames';
import WindowStore from '../window/WindowStore';
import LegendDataComponent from './LegendDataComponent';
import LegendLabelComponent from './LegendLabelComponent';
import { PQValueLabel } from 'shared/components/plots/MultipleCategoryBarPlot';
import { SampleIdsForPatientIds } from './PlotsTab';

export interface IBaseBoxScatterPlotPoint {
    value: number;
    jitter?: number; // between -1 and 1
    sampleId: string;
}

export interface IBoxScatterPlotData<D extends IBaseBoxScatterPlotPoint> {
    label: string;
    median: number;
    data: D[];
}

export type CoordinatesForLinePlot = {
    x: number;
    y: number;
};

export interface IBoxScatterPlotProps<D extends IBaseBoxScatterPlotPoint> {
    svgId?: string;
    title?: string;
    data: IBoxScatterPlotData<D>[];
    chartBase: number;
    startDataAxisAtZero?: boolean;
    domainPadding?: number; // see https://formidable.com/open-source/victory/docs/victory-chart/#domainpadding
    highlight?: (d: D) => boolean;
    size?:
        | number
        | ((
              d: D,
              active: boolean,
              isHighlighted?: boolean,
              isHovered?: boolean
          ) => number);
    fill?: string | ((d: D) => string);
    stroke?: string | ((d: D) => string);
    fillOpacity?: number | ((d: D) => number);
    strokeOpacity?: number | ((d: D) => number);
    strokeWidth?: number | ((d: D) => number);
    zIndexSortBy?: ((d: D) => any)[]; // second argument to _.sortBy
    symbol?: string | ((d: D) => string); // see http://formidable.com/open-source/victory/docs/victory-scatter/#symbol for options
    scatterPlotTooltip?: (d: D) => JSX.Element;
    boxPlotTooltip?: (stats: BoxModel[], labels: string[]) => JSX.Element;
    legendData?: LegendDataWithId<D>[];
    logScale?: IAxisLogScaleParams | undefined; // log scale along the point data axis
    excludeLimitValuesFromBoxPlot?: boolean;
    axisLabelX?: string;
    axisLabelY?: string;
    horizontal?: boolean; // whether the box plot is horizontal
    useLogSpaceTicks?: boolean; // if log scale for an axis, then this prop determines whether the ticks are shown in post-log coordinate, or original data coordinate space
    boxWidth?: number;
    legendLocationWidthThreshold?: number; // chart width after which we start putting the legend at the bottom of the plot
    boxCalculationFilter?: (d: D) => boolean; // determines which points are used for calculating the box
    svgRef?: (svgContainer: SVGElement | null) => void;
    compressXAxis?: boolean;
    legendTitle?: string | string[];
    pValue?: number | null;
    qValue?: number | null;
    renderLinePlot?: boolean;
    samplesForPatients?: SampleIdsForPatientIds[] | [];
}

export type BoxModel = {
    min: number;
    max: number;
    median: number;
    q1: number;
    q3: number;
    x?: number;
    y?: number;
    eventkey?: number;
    sortedVector: number[];
};

const RIGHT_GUTTER = 130; // room for legend
const LEGEND_COLUMN_PADDING = 45;
const NUM_AXIS_TICKS = 8;
const PLOT_DATA_PADDING_PIXELS = 100;
const CATEGORY_LABEL_HORZ_ANGLE = 50;
const DEFAULT_LEFT_PADDING = 25;
const DEFAULT_BOTTOM_PADDING = 10;
const BOTTOM_LEGEND_PADDING = 15;
const HORIZONTAL_OFFSET = 8;
const VERTICAL_OFFSET = 17;
const UTILITIES_MENU_HEIGHT = 20;

/*
    This component exists to provide a mouseover target for tooltips
    when the box plot is vertically compressed
 */
const CustomMedianComponent = (props: any) => {
    const { x1, x2, y1, y2 } = props;

    // we want the target for tooltips to extend from the max value to min value
    // irrespective of boxplot outlier status.
    // i.e. whatever is that ACTUAL max and min
    const end = props.scale.y(props.datum.sortedVector[0]);
    const start = props.scale.y(
        props.datum.sortedVector[props.datum.sortedVector.length - 1]
    );
    const height = end - start;

    return (
        <g>
            <LineSegment {...props} />
            <rect
                x={Math.min(x1, x2)}
                y={start}
                width={Math.abs(x2 - x1)}
                height={height}
                fill={'transparent'}
                onMouseEnter={() => {
                    props.onMouseEnter(props);
                }}
                onMouseLeave={() => {
                    props.onMouseLeave(props);
                }}
            />
        </g>
    );
};

const BOX_STYLES = {
    min: { stroke: '#999999' },
    max: { stroke: '#999999' },
    q1: { fill: '#eeeeee' },
    q3: { fill: '#eeeeee' },
    median: { stroke: '#999999', strokeWidth: 1 },
};

@observer
export default class BoxScatterPlot<
    D extends IBaseBoxScatterPlotPoint
> extends React.Component<IBoxScatterPlotProps<D>, {}> {
    @observable.ref private container: HTMLDivElement;
    @observable.ref private boxPlotTooltipModel: any | null;
    @observable private mousePosition = { x: 0, y: 0 };
    @observable.ref private axisLabelTooltipModel: any | null;
    @observable visibleLines = new Map();
    @observable removingLines: boolean = false;
    // observable marks a class property as observable state, which means that Mobx will automatically track changes to it and re-render the components that depend on it when it changes.
    // initiates it as an empty array of strings
    @observable samplesInLineHover: string[] = [];

    private scatterPlotTooltipHelper: ScatterPlotTooltipHelper = new ScatterPlotTooltipHelper();

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @bind
    private containerRef(container: HTMLDivElement) {
        this.container = container;
    }

    get mouseEvents() {
        return this.scatterPlotTooltipHelper.mouseEvents;
    }

    get scatterPlotTooltipModel() {
        return this.scatterPlotTooltipHelper.tooltipModel;
    }

    get pointHovered() {
        return this.scatterPlotTooltipHelper.pointHovered;
    }

    private get boxPlotEvents() {
        if (this.props.boxPlotTooltip) {
            const self = this;
            return [
                {
                    target: ['min', 'max', 'media', 'q1', 'q3'],
                    eventHandlers: {
                        onMouseEnter: () => {
                            return [
                                {
                                    mutation: (props: any) => {
                                        self.boxPlotTooltipModel = props;
                                    },
                                },
                            ];
                        },
                        onMouseLeave: () => {
                            return [
                                {
                                    mutation: () => {
                                        self.boxPlotTooltipModel = null;
                                    },
                                },
                            ];
                        },
                    },
                },
            ];
        }
        return [];
    }
    private get axisLabelEvents() {
        if (this.props.boxPlotTooltip) {
            const self = this;
            return [
                {
                    target: 'tickLabels',
                    eventHandlers: {
                        onMouseEnter: (event: any, props: any) => {
                            const groupIndex = props.index;
                            if (
                                groupIndex !== undefined &&
                                self.boxPlotData[groupIndex]
                            ) {
                                self.axisLabelTooltipModel = {
                                    datum: self.boxPlotData[groupIndex],
                                    eventkey: groupIndex,
                                };
                                self.mousePosition = {
                                    x: event.pageX,
                                    y: event.pageY,
                                };
                            }
                            return [];
                        },

                        onMouseLeave: () => {
                            self.axisLabelTooltipModel = null;
                            return [];
                        },
                    },
                },
            ];
        }
        return [];
    }

    private get title() {
        if (this.props.title) {
            const text = wrapText(
                this.props.title,
                this.chartWidth,
                axisTickLabelStyles.fontFamily,
                `${axisTickLabelStyles.fontSize}px`
            );
            return (
                <VictoryLabel
                    style={{
                        fontWeight: 'bold',
                        fontFamily: axisTickLabelStyles.fontFamily,
                        textAnchor: 'middle',
                    }}
                    x={this.chartWidth / 2}
                    y="1.2em"
                    text={text}
                />
            );
        } else {
            return null;
        }
    }

    @computed get chartWidth() {
        if (this.props.horizontal) {
            return this.props.chartBase;
        } else {
            return this.chartExtent;
        }
    }

    @computed get chartHeight() {
        if (this.props.horizontal) {
            return this.chartExtent;
        } else {
            return this.props.chartBase;
        }
    }

    @computed get sideLegendX() {
        return this.chartWidth - 20;
    }

    @computed get legendLocation() {
        if (
            (this.props.legendLocationWidthThreshold !== undefined && // if chart meets width threshold
                this.chartWidth > this.props.legendLocationWidthThreshold) ||
            (this.props.legendData && this.props.legendData.length > 7) // too many legend data
        ) {
            return 'bottom';
        } else {
            return 'right';
        }
    }

    @computed get bottomLegendHeight() {
        if (
            !this.props.legendData ||
            !this.props.legendData.length ||
            this.legendLocation !== 'bottom'
        ) {
            return 0;
        } else {
            return getBottomLegendHeight(
                this.legendItemsPerRow,
                this.props.legendData,
                this.props.legendTitle
            );
        }
    }

    @computed get maxLegendLabelWidth() {
        if (this.props.legendData) {
            return getMaxLegendLabelWidth(this.props.legendData);
        }

        return 0;
    }

    @computed get legendItemsPerRow() {
        return getLegendItemsPerRow(
            this.maxLegendLabelWidth,
            this.svgWidth,
            LEGEND_COLUMN_PADDING,
            this.props.legendTitle
        );
    }

    private get legend() {
        if (this.props.legendData && this.props.legendData.length) {
            let legendData = this.props.legendData;
            if (this.legendLocation === 'bottom') {
                // if legend is at bottom then flatten labels
                legendData = legendData.map(x => {
                    let { name, ...rest } = x;
                    if (Array.isArray(name)) {
                        name = (name as string[]).join(' '); // flatten labels by joining with space
                    }
                    return {
                        name,
                        ...rest,
                    };
                });
            }
            const orientation =
                this.legendLocation === 'right' ? 'vertical' : 'horizontal';

            return (
                <VictoryLegend
                    dataComponent={
                        <LegendDataComponent orientation={orientation} />
                    }
                    labelComponent={
                        <LegendLabelComponent orientation={orientation} />
                    }
                    events={[
                        {
                            childName: 'all',
                            target: ['data', 'labels'],
                            eventHandlers: {
                                onClick: () => [
                                    {
                                        target: 'data',
                                        mutation: (props: any) => {
                                            const datum: LegendDataWithId<D> =
                                                props.data[props.index];
                                            if (datum.highlighting) {
                                                datum.highlighting.onClick(
                                                    datum
                                                );
                                            }
                                        },
                                    },
                                ],
                            },
                        },
                    ]}
                    orientation={orientation}
                    itemsPerRow={
                        this.legendLocation === 'right'
                            ? undefined
                            : this.legendItemsPerRow
                    }
                    rowGutter={this.legendLocation === 'right' ? undefined : -5}
                    gutter={
                        this.legendLocation === 'right'
                            ? undefined
                            : LEGEND_COLUMN_PADDING
                    }
                    data={legendData}
                    x={this.legendLocation === 'right' ? this.sideLegendX : 0}
                    y={
                        this.legendLocation === 'right'
                            ? 100
                            : this.svgHeight - this.bottomLegendHeight
                    }
                    title={this.props.legendTitle}
                    titleOrientation={
                        this.legendLocation === 'right' ? 'top' : 'left'
                    }
                    style={{
                        title: {
                            fontSize: 15,
                            fontWeight: 'bold',
                        },
                    }}
                    titleComponent={
                        <VictoryLabel
                            dx={this.legendLocation === 'right' ? 0 : -10}
                        />
                    }
                />
            );
        } else {
            return null;
        }
    }

    @computed get plotDomain() {
        // data extremes
        let max = Number.NEGATIVE_INFINITY;
        let min = Number.POSITIVE_INFINITY;

        for (const d of this.props.data) {
            for (const d2 of d.data) {
                max = Math.max(d2.value, max);
                min = Math.min(d2.value, min);
            }
        }
        if (this.props.logScale) {
            min = this.props.logScale.fLogScale(min, 0);
            max = this.props.logScale.fLogScale(max, 0);
        }
        if (this.props.startDataAxisAtZero) {
            min = Math.min(0, min);
        }
        let x: number[], y: number[];
        const dataDomain = [min, max];
        const categoryDomain = [
            this.categoryCoord(0),
            this.categoryCoord(Math.max(1, this.props.data.length - 1)),
        ];
        if (this.props.horizontal) {
            x = dataDomain;
            y = categoryDomain;
        } else {
            x = categoryDomain;
            y = dataDomain;
        }
        return { x, y };
    }

    @computed get categoryAxisDomainPadding() {
        // padding needs to be at least half a box width plus a bit
        return Math.max(this.boxWidth / 2 + 30, this.domainPadding);
    }

    @computed get dataAxisDomainPadding() {
        return this.domainPadding;
    }

    @computed get domainPadding() {
        if (this.props.domainPadding === undefined) {
            return PLOT_DATA_PADDING_PIXELS;
        } else {
            return this.props.domainPadding;
        }
    }

    @computed get dataAxis(): 'x' | 'y' {
        if (this.props.horizontal) {
            return 'x';
        } else {
            return 'y';
        }
    }

    @computed get categoryAxis(): 'x' | 'y' {
        if (this.props.horizontal) {
            return 'y';
        } else {
            return 'x';
        }
    }

    @computed get chartDomainPadding() {
        return {
            [this.dataAxis]: this.dataAxisDomainPadding,
            [this.categoryAxis]: this.categoryAxisDomainPadding,
        };
    }

    @computed get chartExtent() {
        const miscPadding = 100; // specifying chart width in victory doesnt translate directly to the actual graph size
        const numBoxes = this.props.data.length;
        return (
            this.categoryCoord(numBoxes - 1) +
            2 * this.categoryAxisDomainPadding +
            miscPadding
        );
        //return 2*this.domainPadding + numBoxes*this.boxWidth + (numBoxes-1)*this.boxSeparation;
        //const ret = Math.max(computedExtent, this.props.chartBase);
        //return ret;
    }

    @computed get svgWidth() {
        return this.leftPadding + this.chartWidth + this.rightPadding;
    }

    @computed get svgHeight() {
        return this.topPadding + this.chartHeight + this.bottomPadding;
    }

    @computed get boxSeparation() {
        return 0.5 * this.boxWidth;
    }

    @computed get boxWidth() {
        return this.props.boxWidth || 10;
    }

    private jitter(d: D, randomNumber: number) {
        // randomNumber: between -1 and 1
        return 0.2 * this.boxWidth * randomNumber;
    }

    @bind
    private scatterPlotX(d: IBaseScatterPlotData & D) {
        if (this.props.logScale && this.props.horizontal) {
            return this.props.logScale.fLogScale(d.x, 0);
        } else {
            let jitter = 0;
            if (!this.props.horizontal) {
                let jitterRandomNumber = d.jitter;
                if (jitterRandomNumber === undefined) {
                    jitterRandomNumber = getDeterministicRandomNumber(d.y, [
                        -1,
                        1,
                    ]);
                }
                jitter = this.jitter(d, jitterRandomNumber);
            }
            return d.x + jitter;
        }
    }

    @bind
    private scatterPlotY(d: IBaseScatterPlotData & D) {
        if (this.props.logScale && !this.props.horizontal) {
            return this.props.logScale.fLogScale(d.y, 0);
        } else {
            let jitter = 0;
            if (this.props.horizontal) {
                let jitterRandomNumber = d.jitter;
                if (jitterRandomNumber === undefined) {
                    jitterRandomNumber = getDeterministicRandomNumber(d.x, [
                        -1,
                        1,
                    ]);
                }
                jitter = this.jitter(d, jitterRandomNumber);
            }
            return d.y + jitter;
        }
    }

    @action.bound
    setSamplesInLineHover(data: any, hovered: boolean) {
        if (hovered) {
            this.samplesInLineHover = data.map(
                (dataEntries: any) => dataEntries.sampleId
            );
        } else {
            this.samplesInLineHover = [];
        }
        console.log(this.samplesInLineHover);
    }

    @computed get lineHovered() {
        const lineSamples = this.samplesInLineHover;
        return (d: any) => {
            return _.some(lineSamples, sampleId => sampleId === d.sampleId);
        };
    }

    @computed get scatterPlotSize() {
        const highlight = this.props.highlight;
        const size = this.props.size;
        const hovered = this.lineHovered;
        // need to regenerate this function whenever highlight changes in order to trigger immediate Victory rerender
        return makeScatterPlotSizeFunction(highlight, size, hovered);
    }

    @computed get labels() {
        return this.props.data.map(d => {
            if (!!this.props.compressXAxis) {
                return truncateWithEllipsis(
                    d.label,
                    50,
                    axisTickLabelStyles.fontFamily,
                    axisTickLabelStyles.fontSize + 'px'
                );
            }
            return d.label;
        });
    }

    @bind
    private formatCategoryTick(t: number, index: number) {
        //return lowerCaseAndCapitalizeString(this.labels[index]);
        return this.labels[index];
    }

    @bind
    private formatNumericalTick(t: number, i: number, ticks: number[]) {
        return tickFormatNumeral(
            t,
            ticks,
            this.props.logScale && !this.props.useLogSpaceTicks
                ? this.props.logScale.fInvLogScale
                : undefined
        );
    }

    @computed get horzAxis() {
        // several props below are undefined in horizontal mode, thats because in horizontal mode
        //  this axis is for numbers, not categories
        return (
            <VictoryAxis
                style={{
                    grid: { strokeOpacity: 1 },
                }}
                orientation="bottom"
                offsetY={50}
                domain={this.plotDomain.x}
                crossAxis={false}
                label={this.props.axisLabelX}
                tickValues={
                    this.props.horizontal ? undefined : this.categoryTickValues
                }
                tickCount={this.props.horizontal ? NUM_AXIS_TICKS : undefined}
                tickFormat={
                    this.props.horizontal
                        ? this.formatNumericalTick
                        : this.formatCategoryTick
                }
                tickLabelComponent={
                    <VictoryLabel
                        angle={
                            !!this.props.compressXAxis || this.props.horizontal
                                ? undefined
                                : CATEGORY_LABEL_HORZ_ANGLE
                        }
                        verticalAnchor={
                            !!this.props.compressXAxis || this.props.horizontal
                                ? undefined
                                : 'start'
                        }
                        textAnchor={
                            !!this.props.compressXAxis || this.props.horizontal
                                ? undefined
                                : 'start'
                        }
                    />
                }
                axisLabelComponent={
                    <VictoryLabel
                        dy={
                            !!this.props.compressXAxis || this.props.horizontal
                                ? 35
                                : this.biggestCategoryLabelSize + 24
                        }
                    />
                }
                events={this.axisLabelEvents}
            />
        );
    }

    @computed get yAxisLabel(): string[] {
        if (this.props.axisLabelY) {
            return wrapText(
                this.props.axisLabelY,
                this.chartHeight - UTILITIES_MENU_HEIGHT,
                axisTickLabelStyles.fontFamily,
                `${axisTickLabelStyles.fontSize}px`
            );
        }
        return [];
    }

    @computed get yAxisLabelVertOffset(): number {
        if (this.props.horizontal) {
            return -1 * this.biggestCategoryLabelSize - 24;
        } else if (this.yAxisLabel.length > 1) {
            return -30;
        }
        return -50;
    }

    @computed get vertAxis() {
        return (
            <VictoryAxis
                orientation="left"
                offsetX={50}
                domain={this.plotDomain.y}
                crossAxis={false}
                label={this.yAxisLabel}
                dependentAxis={true}
                tickValues={
                    this.props.horizontal ? this.categoryTickValues : undefined
                }
                tickCount={this.props.horizontal ? undefined : NUM_AXIS_TICKS}
                tickFormat={
                    this.props.horizontal
                        ? this.formatCategoryTick
                        : this.formatNumericalTick
                }
                axisLabelComponent={
                    <VictoryLabel dy={this.yAxisLabelVertOffset} />
                }
                events={this.axisLabelEvents}
            />
        );
    }

    @computed get scatterPlotData() {
        let dataAxis: 'x' | 'y' = this.props.horizontal ? 'x' : 'y';
        let categoryAxis: 'x' | 'y' = this.props.horizontal ? 'y' : 'x';
        const data: (D & { x: number; y: number })[] = [];
        for (let i = 0; i < this.props.data.length; i++) {
            const categoryCoord = this.categoryCoord(i);
            for (const d of this.props.data[i].data) {
                data.push(
                    Object.assign({}, d, {
                        [dataAxis]: d.value,
                        [categoryAxis]: categoryCoord,
                    } as { x: number; y: number })
                );
            }
        }
        return separateScatterDataByAppearance<D>(
            data,
            ifNotDefined(this.props.fill, '0x000000'),
            ifNotDefined(this.props.stroke, '0x000000'),
            ifNotDefined(this.props.strokeWidth, 0),
            ifNotDefined(this.props.strokeOpacity, 1),
            ifNotDefined(this.props.fillOpacity, 1),
            ifNotDefined(this.props.symbol, 'circle'),
            this.props.zIndexSortBy
        );
    }

    @computed get leftPadding() {
        // more left padding if horizontal, to make room for labels
        if (this.props.horizontal) {
            return this.biggestCategoryLabelSize;
        } else {
            return DEFAULT_LEFT_PADDING;
        }
    }

    @computed get topPadding() {
        return 0;
    }

    @computed get rightPadding() {
        if (
            this.props.legendData &&
            this.props.legendData.length > 0 &&
            this.legendLocation === 'right'
        ) {
            // make room for legend
            return Math.max(RIGHT_GUTTER, this.maxLegendLabelWidth + 50); // + 50 makes room for circle and padding
        } else {
            return RIGHT_GUTTER;
        }
    }

    @computed get bottomPadding() {
        let paddingForLabels = DEFAULT_BOTTOM_PADDING;
        let paddingForLegend = 0;

        if (!this.props.horizontal) {
            // more padding if vertical, because category labels extend to bottom
            // more padding if axis is not compressed
            paddingForLabels = !!this.props.compressXAxis
                ? 20
                : this.biggestCategoryLabelSize;
        }
        if (this.legendLocation === 'bottom') {
            // more padding if legend location is "bottom", to make room for legend
            paddingForLegend = this.bottomLegendHeight + BOTTOM_LEGEND_PADDING;
        }

        return paddingForLabels + paddingForLegend;
    }

    @computed get biggestCategoryLabelSize() {
        const maxSize = Math.max(
            ...this.labels.map(x =>
                getTextWidth(
                    x,
                    axisTickLabelStyles.fontFamily,
                    axisTickLabelStyles.fontSize + 'px'
                )
            )
        );
        if (!!this.props.compressXAxis || this.props.horizontal) {
            // if horizontal mode or if axis is compressed( i.e, tick labels are horizontal), its label width
            return maxSize;
        } else {
            // if vertical mode, its label height when rotated
            return (
                maxSize *
                Math.abs(Math.sin((Math.PI / 180) * CATEGORY_LABEL_HORZ_ANGLE))
            );
        }
    }

    private categoryCoord(index: number) {
        return index * (this.boxWidth + this.boxSeparation); // half box + separation + half box
    }

    @computed get categoryTickValues() {
        return this.props.data.map((x, i) => this.categoryCoord(i));
    }

    @computed get boxPlotData(): BoxModel[] {
        const calcBoxSizes = (box: any, i: number) => {
            if (this.props.horizontal) {
                box.y = this.categoryCoord(i);
            } else {
                box.x = this.categoryCoord(i);
            }
            box.eventkey = i;
        };

        return toBoxPlotData(
            this.props.data,
            this.props.boxCalculationFilter,
            this.props.excludeLimitValuesFromBoxPlot,
            this.props.logScale,
            calcBoxSizes
        );
    }

    @action.bound
    private onMouseMove(e: React.MouseEvent<any>) {
        if (this.boxPlotTooltipModel !== null) {
            this.mousePosition.x = e.pageX;
            this.mousePosition.y = e.pageY;
        }
    }

    @computed get patientLinePlotData() {
        const patientDataForLinePlot: { [patientId: string]: any[] } = {};

        if (this.props.renderLinePlot && this.props.samplesForPatients) {
            this.props.samplesForPatients.forEach(patientObject => {
                Object.keys(patientObject).forEach(patientId => {
                    const sampleIds: string[] = patientObject[patientId];
                    patientDataForLinePlot[patientId] = [];

                    this.scatterPlotData.forEach(dataWithAppearance => {
                        dataWithAppearance.data.forEach(sampleArray => {
                            if (sampleIds.includes(sampleArray.sampleId)) {
                                patientDataForLinePlot[patientId].push(
                                    sampleArray
                                );
                            }
                        });
                    });
                });
            });
        }
        return patientDataForLinePlot;
    }

    // to populate the very first time (or everytime the page refreshes)
    @bind
    private initLineVisibility() {
        this.updateRemovingLines;
        if (this.patientLinePlotData && this.props.renderLinePlot) {
            Object.keys(this.patientLinePlotData).forEach(patientId => {
                if (!this.visibleLines.has(patientId)) {
                    this.visibleLines.set(patientId, true);
                }
                // on re-checking the checkbox, all patientIds should be set to true
                if (this.visibleLines.has(patientId) && !this.removingLines) {
                    this.visibleLines.set(patientId, true);
                }
            });
        }
    }

    @action.bound
    private toggleLineVisibility(patientId: string) {
        this.removingLines = true;
        this.visibleLines.set(patientId, false);
    }

    @computed get updateRemovingLines() {
        if (!this.props.renderLinePlot) {
            this.removingLines = false;
        }
        return null;
    }

    @autobind
    private getChart() {
        const self = this;
        this.initLineVisibility();
        return (
            <div
                ref={this.containerRef}
                style={{ width: this.svgWidth, height: this.svgHeight }}
            >
                <svg
                    id={this.props.svgId || ''}
                    aria-label={this.props.svgId || 'Box Scatter Plot'}
                    style={{
                        width: this.svgWidth,
                        height: this.svgHeight,
                        pointerEvents: 'all',
                    }}
                    height={this.svgHeight}
                    width={this.svgWidth}
                    role="img"
                    viewBox={`0 0 ${this.svgWidth} ${this.svgHeight}`}
                    onMouseMove={this.onMouseMove}
                    ref={this.props.svgRef}
                >
                    <g
                        transform={`translate(${this.leftPadding}, ${this.topPadding})`}
                    >
                        <VictoryChart
                            theme={CBIOPORTAL_VICTORY_THEME}
                            width={this.chartWidth}
                            height={this.chartHeight}
                            standalone={false}
                            domainPadding={this.chartDomainPadding}
                            singleQuadrantDomainPadding={{
                                [this.dataAxis]: !!this.props
                                    .startDataAxisAtZero,
                                [this.categoryAxis]: false,
                            }}
                        >
                            {this.title}
                            {this.legend}
                            <PQValueLabel
                                x={this.chartWidth - 40}
                                y={50}
                                pValue={this.props.pValue || null}
                                qValue={this.props.qValue || null}
                            />
                            {this.horzAxis}
                            {this.vertAxis}
                            <VictoryBoxPlot
                                boxWidth={this.boxWidth}
                                style={BOX_STYLES}
                                data={this.boxPlotData}
                                horizontal={this.props.horizontal}
                                events={this.boxPlotEvents}
                                medianComponent={
                                    <CustomMedianComponent
                                        onMouseEnter={(model: any) => {
                                            self.boxPlotTooltipModel = model;
                                        }}
                                        onMouseLeave={(model: any) => {
                                            self.boxPlotTooltipModel = null;
                                        }}
                                    />
                                }
                            />
                            {this.props.renderLinePlot &&
                                Object.keys(this.patientLinePlotData!).map(
                                    patientId =>
                                        this.visibleLines.get(patientId) && (
                                            <VictoryLine
                                                key={patientId}
                                                data={
                                                    this.patientLinePlotData![
                                                        patientId
                                                    ]
                                                }
                                                x={this.scatterPlotX}
                                                y={this.scatterPlotY}
                                                style={{
                                                    data: {
                                                        stroke: 'grey',
                                                        strokeWidth: 2,
                                                        cursor: 'pointer',
                                                        pointerEvents: 'all',
                                                    },
                                                }}
                                                events={[
                                                    {
                                                        target: 'data',
                                                        eventHandlers: {
                                                            onMouseOver: () => {
                                                                return [
                                                                    {
                                                                        target:
                                                                            'data',
                                                                        mutation: () => {
                                                                            this.setSamplesInLineHover(
                                                                                this
                                                                                    .patientLinePlotData![
                                                                                    patientId
                                                                                ],
                                                                                true
                                                                            );
                                                                            return {
                                                                                style: {
                                                                                    stroke:
                                                                                        'black',
                                                                                    strokeWidth: 3,
                                                                                },
                                                                            };
                                                                        },
                                                                    },
                                                                ];
                                                            },
                                                            onMouseOut: () => {
                                                                return [
                                                                    {
                                                                        target:
                                                                            'data',
                                                                        mutation: () => {
                                                                            this.setSamplesInLineHover(
                                                                                this
                                                                                    .patientLinePlotData![
                                                                                    patientId
                                                                                ],
                                                                                false
                                                                            );
                                                                            return {
                                                                                style: {
                                                                                    stroke:
                                                                                        'grey',
                                                                                    strokeWidth: 2,
                                                                                },
                                                                            };
                                                                        },
                                                                    },
                                                                ];
                                                            },
                                                            onClick: () => {
                                                                this.toggleLineVisibility(
                                                                    patientId
                                                                );
                                                                return [];
                                                            },
                                                        },
                                                    },
                                                ]}
                                            />
                                        )
                                )}
                            {this.scatterPlotData.map(dataWithAppearance => (
                                <VictoryScatter
                                    key={`${dataWithAppearance.fill},${dataWithAppearance.stroke},${dataWithAppearance.strokeWidth},${dataWithAppearance.strokeOpacity},${dataWithAppearance.fillOpacity},${dataWithAppearance.symbol}`}
                                    style={{
                                        data: {
                                            fill: dataWithAppearance.fill,
                                            stroke: dataWithAppearance.stroke,
                                            strokeWidth:
                                                dataWithAppearance.strokeWidth,
                                            strokeOpacity:
                                                dataWithAppearance.strokeOpacity,
                                            fillOpacity:
                                                dataWithAppearance.fillOpacity,
                                        },
                                    }}
                                    size={this.scatterPlotSize}
                                    symbol={dataWithAppearance.symbol}
                                    data={dataWithAppearance.data}
                                    events={this.mouseEvents}
                                    x={this.scatterPlotX}
                                    y={this.scatterPlotY}
                                />
                            ))}
                        </VictoryChart>
                    </g>
                </svg>
            </div>
        );
    }

    @autobind
    private getScatterPlotTooltip() {
        if (
            this.container &&
            this.scatterPlotTooltipModel &&
            this.props.scatterPlotTooltip
        ) {
            return (
                <ScatterPlotTooltip
                    placement={this.props.horizontal ? 'bottom' : 'right'}
                    container={this.container}
                    targetHovered={this.pointHovered}
                    targetCoords={{
                        x: this.scatterPlotTooltipModel.x + this.leftPadding,
                        y: this.scatterPlotTooltipModel.y + this.topPadding,
                    }}
                    overlay={this.props.scatterPlotTooltip(
                        this.scatterPlotTooltipModel.datum
                    )}
                />
            );
        } else {
            return <span />;
        }
    }

    @autobind
    private getTooltipComponent(
        tooltipModel: any,
        verticalOffsetAdjustment: number
    ) {
        if (this.container && tooltipModel && this.props.boxPlotTooltip) {
            const maxWidth = 400;
            const eventKey =
                tooltipModel.datum.eventKey ?? tooltipModel.datum.eventkey;
            let tooltipPlacement =
                this.mousePosition.x > WindowStore.size.width - maxWidth
                    ? 'left'
                    : 'right';
            return (ReactDOM as any).createPortal(
                <Popover
                    arrowOffsetTop={VERTICAL_OFFSET}
                    className={classnames('cbioportal-frontend', 'cbioTooltip')}
                    positionLeft={
                        this.mousePosition.x +
                        (tooltipPlacement === 'left'
                            ? -HORIZONTAL_OFFSET
                            : HORIZONTAL_OFFSET)
                    }
                    positionTop={
                        this.mousePosition.y + verticalOffsetAdjustment
                    }
                    style={{
                        transform:
                            tooltipPlacement === 'left'
                                ? 'translate(-100%,0%)'
                                : undefined,
                        maxWidth,
                    }}
                    placement={tooltipPlacement}
                >
                    <div>
                        {this.props.boxPlotTooltip(
                            [tooltipModel.datum],
                            [this.props.data[eventKey]?.label]
                        )}
                    </div>
                </Popover>,
                document.body
            );
        } else {
            return null;
        }
    }

    @autobind
    private getBoxPlotTooltipComponent() {
        return this.getTooltipComponent(
            this.boxPlotTooltipModel,
            -VERTICAL_OFFSET
        );
    }

    @autobind
    private getAxisLabelTooltipComponent() {
        return this.getTooltipComponent(
            this.axisLabelTooltipModel,
            VERTICAL_OFFSET
        );
    }

    render() {
        if (!this.props.data.length) {
            return <div className={'alert alert-info'}>No data to plot.</div>;
        }
        return (
            <div>
                <Observer>{this.getChart}</Observer>
                <Observer>{this.getScatterPlotTooltip}</Observer>
                <Observer>{this.getBoxPlotTooltipComponent}</Observer>
                <Observer>{this.getAxisLabelTooltipComponent}</Observer>
            </div>
        );
    }
}

export function toBoxPlotData<D extends IBaseBoxScatterPlotPoint>(
    data: IBoxScatterPlotData<D>[],
    boxCalculationFilter?: (d: D) => boolean,
    excludeLimitValuesFromBoxPlot?: any,
    logScale?: IAxisLogScaleParams,
    calcBoxSizes?: (box: BoxModel, i: number) => void
) {
    // when limit values are shown in the legend, exclude
    // these points from influencing the shape of the box plots
    let boxData = _.clone(data);

    if (excludeLimitValuesFromBoxPlot) {
        _.each(boxData, (o: IBoxScatterPlotData<D>) => {
            o.data = _.filter(
                o.data,
                (p: IBoxScatterPlotPoint) => !dataPointIsLimited(p)
            );
        });
    }

    return boxData
        .map(d =>
            calculateBoxPlotModel(
                d.data.reduce((data, next) => {
                    if (
                        !boxCalculationFilter ||
                        (boxCalculationFilter && boxCalculationFilter(next))
                    ) {
                        // filter out values in calculating boxes, if a filter is specified ^^
                        if (logScale) {
                            data.push(logScale.fLogScale(next.value, 0));
                        } else {
                            data.push(next.value);
                        }
                    }
                    return data;
                }, [] as number[])
            )
        )
        .map((model, i) => {
            // create boxes, importantly we dont filter at this step because
            //  we need the indexes to be intact and correpond to the index in the input data,
            //  in order to properly determine the x/y coordinates
            const box: BoxModel = {
                min: model.whiskerLower,
                max: model.whiskerUpper,
                median: model.median,
                q1: model.q1,
                q3: model.q3,
                sortedVector: model.sortedVector,
            };
            calcBoxSizes && calcBoxSizes(box, i);
            return box;
        })
        .filter(box => {
            // filter out not well-defined boxes
            return logicalAnd(
                ['min', 'max', 'median', 'q1', 'q3'].map(key => {
                    return !isNaN((box as any)[key]);
                })
            );
        });
}

export function toDataDescriptive<D extends IBaseBoxScatterPlotPoint>(
    data: IBoxScatterPlotData<D>[],
    logScale?: IAxisLogScaleParams
) {
    return data.map(d => {
        const scatterValues = d.data.map(x =>
            logScale ? logScale.fLogScale(x.value, 0) : x.value
        );
        const count = scatterValues.length;
        // Calculate minimum and maximum
        const minimum = Math.min(...scatterValues);
        const maximum = Math.max(...scatterValues);
        const mean = _.mean(scatterValues);

        // Calculate standard deviation
        const squaredDifferences = scatterValues.map((val: number) => {
            const difference = val - mean;
            return difference * difference;
        });
        const variance =
            squaredDifferences.reduce(
                (sum: number, val: number) => sum + val,
                0
            ) / scatterValues.length;
        const stdDeviation = Math.sqrt(variance);

        // Calculate median
        const scatterValuesSorted = scatterValues
            .slice()
            .sort((a: number, b: number) => a - b);
        const mid = Math.floor(scatterValuesSorted.length / 2);
        const median =
            scatterValuesSorted.length % 2 !== 0
                ? scatterValuesSorted[mid]
                : (scatterValuesSorted[mid - 1] + scatterValuesSorted[mid]) / 2;

        // Calculate median absolute deviation (MAD)
        const absoluteDeviations = scatterValues.map(val =>
            Math.abs(val - median)
        );
        const absoluteDeviationsSorted = absoluteDeviations
            .slice()
            .sort((a, b) => a - b);
        const madMid = Math.floor(absoluteDeviationsSorted.length / 2);
        const mad =
            absoluteDeviationsSorted.length % 2 !== 0
                ? absoluteDeviationsSorted[madMid]
                : (absoluteDeviationsSorted[madMid - 1] +
                      absoluteDeviationsSorted[madMid]) /
                  2;

        // Return an object with the descriptive statistics
        return {
            count,
            minimum,
            maximum,
            mean,
            stdDeviation,
            median,
            mad,
        };
    });
}
