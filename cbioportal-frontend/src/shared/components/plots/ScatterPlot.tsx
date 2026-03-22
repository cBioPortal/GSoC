import _ from 'lodash';
import * as React from 'react';
import { observer, Observer } from 'mobx-react';
import { computed, makeObservable, observable } from 'mobx';
import {
    VictoryChart,
    VictoryContainer,
    VictorySelectionContainer,
    VictoryAxis,
    VictoryScatter,
    VictoryLegend,
    VictoryLabel,
    VictoryLine,
} from 'victory';
import jStat from 'jStat';
import { tickFormatNumeral } from 'cbioportal-frontend-commons';
import {
    computeCorrelationPValue,
    makeScatterPlotSizeFunction,
    separateScatterDataByAppearance,
    dataPointIsLimited,
    LegendDataWithId,
    getBottomLegendHeight,
    getMaxLegendLabelWidth,
    getLegendItemsPerRow,
} from './PlotUtils';
import { toConditionalPrecision } from '../../lib/NumberUtils';
import {
    getNumberOfNewlines,
    getRegressionComputations,
    makeMultilineAxisLabel,
} from './ScatterPlotUtils';
import { IAxisLogScaleParams, IPlotSampleData } from './PlotsTabUtils';
import ifNotDefined from '../../lib/ifNotDefined';
import {
    CBIOPORTAL_VICTORY_THEME,
    baseLabelStyles,
    ScatterPlotTooltip,
    ScatterPlotTooltipHelper,
    wrapText,
} from 'cbioportal-frontend-commons';
import LegendDataComponent from './LegendDataComponent';
import LegendLabelComponent from './LegendLabelComponent';
import autobind from 'autobind-decorator';

export interface IBaseScatterPlotData {
    x: number;
    y: number;
}

export interface IScatterPlotProps<D extends IBaseScatterPlotData> {
    svgId?: string;
    svgRef?: (elt: SVGElement | null) => void;
    title?: string;
    data: D[];
    chartWidth: number;
    chartHeight: number;
    highlight?: (d: D) => boolean;
    fill?: string | ((d: D) => string);
    stroke?: string | ((d: D) => string);
    size?:
        | number
        | ((d: D, active: boolean, isHighlighted?: boolean) => number);
    fillOpacity?: number | ((d: D) => number);
    strokeOpacity?: number | ((d: D) => number);
    strokeWidth?: number | ((d: D) => number);
    zIndexSortBy?: ((d: D) => any)[]; // second argument to _.sortBy
    symbol?: string | ((d: D) => string); // see http://formidable.com/open-source/victory/docs/victory-scatter/#symbol for options
    tooltip?: (d: D) => JSX.Element;
    legendData?: LegendDataWithId<D>[];
    correlation?: {
        pearson: number;
        spearman: number;
    };
    showRegressionLine?: boolean;
    logX?: IAxisLogScaleParams | undefined;
    logY?: IAxisLogScaleParams | undefined;
    excludeLimitValuesFromCorrelation?: boolean; // if true, data points that are beyond threshold (e.g., '>8', have a `xThresholdType` or `yThresholdType` attribute) are not included in caluculation of the corr. efficient
    useLogSpaceTicks?: boolean; // if log scale for an axis, then this prop determines whether the ticks are shown in post-log coordinate, or original data coordinate space
    axisLabelX?: string;
    axisLabelY?: string;
    fontFamily?: string;
    legendTitle?: string | string[];
    onDataSelection?: (selectedSampleData: D[]) => void;
}
// constants related to the gutter
const GUTTER_TEXT_STYLE = {
    fontFamily: baseLabelStyles.fontFamily,
    fontSize: baseLabelStyles.fontSize,
};
const LEGEND_COLUMN_PADDING = 45;
const CORRELATION_INFO_Y = 100; // experimentally determined
const REGRESSION_STROKE = '#c43a31';
const REGRESSION_STROKE_WIDTH = 2;
const REGRESSION_EQUATION_Y = CORRELATION_INFO_Y + 95; // 95 ~= correlation height
const LEGEND_TEXT_WIDTH = 107; // experimentally determined

const DEFAULT_FONT_FAMILY = 'Verdana,Arial,sans-serif';
const RIGHT_GUTTER = 120; // room for correlation info and legend
const NUM_AXIS_TICKS = 8;
const PLOT_DATA_PADDING_PIXELS = 50;
const BASE_LEFT_PADDING = 25;
const VICTORY_LABEL_TEXT_HEIGHT = 15.02;
const VICTORY_LABEL_CUSTOM_CHAR_LIMIT = 60;

@observer
export default class ScatterPlot<
    D extends IBaseScatterPlotData
> extends React.Component<IScatterPlotProps<D>, {}> {
    @observable.ref private container: HTMLDivElement;
    private tooltipHelper: ScatterPlotTooltipHelper = new ScatterPlotTooltipHelper();

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @autobind
    private containerRef(container: HTMLDivElement) {
        this.container = container;
    }

    @autobind
    private svgContainerRef(container: HTMLDivElement | null) {
        // containerRef in VictoryContainer gives us the wrapper <div>, not the <svg>.
        // Find the SVG inside and apply the svgId and svgRef props.
        const svgEl = container ? container.querySelector('svg') : null;
        if (svgEl && this.props.svgId) {
            svgEl.setAttribute('id', this.props.svgId);
        }
        if (this.props.svgRef) {
            this.props.svgRef(svgEl as SVGElement | null);
        }
    }

    get mouseEvents() {
        return this.tooltipHelper.mouseEvents;
    }

    get tooltipModel() {
        return this.tooltipHelper.tooltipModel;
    }

    get pointHovered() {
        return this.tooltipHelper.pointHovered;
    }

    @computed get fontFamily() {
        return this.props.fontFamily || DEFAULT_FONT_FAMILY;
    }

    private get title() {
        if (this.props.title) {
            const text = wrapText(
                this.props.title,
                this.props.chartWidth,
                this.fontFamily,
                '14px'
            );
            return (
                <VictoryLabel
                    style={{
                        fontWeight: 'bold',
                        fontFamily: this.fontFamily,
                        textAnchor: 'middle',
                    }}
                    x={this.props.chartWidth / 2 + this.leftPadding}
                    y="1.2em"
                    text={text}
                />
            );
        } else {
            return null;
        }
    }

    @computed get sideLegendX() {
        return this.props.chartWidth - 20;
    }

    @computed get sideLegendY() {
        const correlationInfo = 90;
        const regressionEqation = 45;

        if (this.props.showRegressionLine) {
            return CORRELATION_INFO_Y + correlationInfo + regressionEqation;
        } else {
            return CORRELATION_INFO_Y + correlationInfo;
        }
    }

    @computed get legendLocation() {
        if (this.props.legendData && this.props.legendData.length > 7) {
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
                                onMouseDown: (evt: any) =>
                                    evt.stopPropagation(), // allows click legend item for highlighting
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
                    x={
                        this.legendLocation === 'right'
                            ? this.sideLegendX + this.leftPadding
                            : this.leftPadding
                    }
                    y={
                        this.legendLocation === 'right'
                            ? this.sideLegendY
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

    private get correlationInfo() {
        const x = this.sideLegendX;
        return (
            <g>
                <VictoryLabel
                    x={x + LEGEND_TEXT_WIDTH + this.leftPadding}
                    y={CORRELATION_INFO_Y}
                    textAnchor="end"
                    text={`Spearman: ${this.spearmanCorr.toFixed(2)}`}
                    style={GUTTER_TEXT_STYLE}
                />
                {this.spearmanPval !== null && (
                    <VictoryLabel
                        x={x + LEGEND_TEXT_WIDTH + this.leftPadding}
                        y={CORRELATION_INFO_Y}
                        textAnchor="end"
                        dy="2"
                        text={`(p = ${toConditionalPrecision(
                            this.spearmanPval,
                            3,
                            0.01
                        )})`}
                        style={GUTTER_TEXT_STYLE}
                    />
                )}
                <VictoryLabel
                    x={x + LEGEND_TEXT_WIDTH + this.leftPadding}
                    y={CORRELATION_INFO_Y}
                    textAnchor="end"
                    dy="5"
                    text={`Pearson: ${this.pearsonCorr.toFixed(2)}`}
                    style={GUTTER_TEXT_STYLE}
                />
                {this.pearsonPval !== null && (
                    <VictoryLabel
                        x={x + LEGEND_TEXT_WIDTH + this.leftPadding}
                        y={CORRELATION_INFO_Y}
                        textAnchor="end"
                        dy="7"
                        text={`(p = ${toConditionalPrecision(
                            this.pearsonPval,
                            3,
                            0.01
                        )})`}
                        style={GUTTER_TEXT_STYLE}
                    />
                )}
            </g>
        );
    }

    private get regressionLineEquation(): JSX.Element | null {
        if (!this.props.showRegressionLine) {
            return null;
        }

        const equation = this.regressionLineComputations.string;
        const r2 = `R² = ${this.regressionLineComputations.r2}`;
        const legendPadding = 10;
        const lineLength = 10;
        const linePadding = 7;

        return (
            <g>
                <line
                    stroke={REGRESSION_STROKE}
                    strokeWidth={REGRESSION_STROKE_WIDTH}
                    x1={this.sideLegendX + legendPadding + this.leftPadding}
                    y1={REGRESSION_EQUATION_Y}
                    x2={
                        this.sideLegendX +
                        legendPadding +
                        lineLength +
                        this.leftPadding
                    }
                    y2={REGRESSION_EQUATION_Y}
                    dy="0"
                />
                <VictoryLabel
                    x={
                        this.sideLegendX +
                        legendPadding +
                        lineLength +
                        linePadding +
                        this.leftPadding
                    }
                    y={REGRESSION_EQUATION_Y}
                    dy="0"
                    textAnchor="start"
                    text={equation}
                    style={GUTTER_TEXT_STYLE}
                />
                <VictoryLabel
                    x={
                        this.sideLegendX +
                        legendPadding +
                        lineLength +
                        linePadding +
                        this.leftPadding
                    }
                    y={REGRESSION_EQUATION_Y}
                    dy="2"
                    textAnchor="start"
                    text={r2}
                    style={GUTTER_TEXT_STYLE}
                />
            </g>
        );
    }

    @computed get splitData() {
        // when limit values are shown in the legend, exclude
        // these points from calculations of correlation coefficients
        const data = this.props.excludeLimitValuesFromCorrelation
            ? _.filter(
                  this.props.data,
                  (d: IPlotSampleData) => !dataPointIsLimited(d)
              )
            : this.props.data;

        const x = [];
        const y = [];
        for (const d of data) {
            x.push(d.x);
            y.push(d.y);
        }
        return { x, y };
    }

    @computed get plotDomain() {
        // data extremes
        const max = {
            x: Number.NEGATIVE_INFINITY,
            y: Number.NEGATIVE_INFINITY,
        };
        const min = {
            x: Number.POSITIVE_INFINITY,
            y: Number.POSITIVE_INFINITY,
        };
        for (const d of this.props.data) {
            max.x = Math.max(d.x, max.x);
            max.y = Math.max(d.y, max.y);
            min.x = Math.min(d.x, min.x);
            min.y = Math.min(d.y, min.y);
        }
        if (this.props.logX) {
            min.x = this.props.logX.fLogScale(min.x, 0);
            max.x = this.props.logX.fLogScale(max.x, 0);
        }
        if (this.props.logY) {
            min.y = this.props.logY.fLogScale(min.y, 0);
            max.y = this.props.logY.fLogScale(max.y, 0);
        }
        return {
            x: [min.x, max.x],
            y: [min.y, max.y],
        };
    }

    @computed get pearsonCorr() {
        if (this.props.correlation) {
            return this.props.correlation.pearson;
        } else {
            let x = this.splitData.x;
            let y = this.splitData.y;
            if (this.props.logX) {
                x = x.map(d => this.props.logX!.fLogScale(d, 0));
            }
            if (this.props.logY) {
                y = y.map(d => this.props.logY!.fLogScale(d, 0));
            }
            return Number(jStat.corrcoeff(x, y).toFixed(5));
        }
    }

    @computed get spearmanCorr() {
        if (this.props.correlation) {
            return this.props.correlation.spearman;
        } else {
            // spearman is invariant to monotonic increasing transformations, so we dont need to check about log
            return Number(
                jStat
                    .spearmancoeff(this.splitData.x, this.splitData.y)
                    .toFixed(5)
            );
        }
    }

    @computed get spearmanPval() {
        return computeCorrelationPValue(
            this.spearmanCorr,
            this.splitData.x.length
        );
    }

    @computed get pearsonPval() {
        return computeCorrelationPValue(
            this.pearsonCorr,
            this.splitData.x.length
        );
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

    @computed get leftPadding(): number {
        return BASE_LEFT_PADDING + this.axisLabelYHeight;
    }

    @computed get svgWidth(): number {
        return this.leftPadding + this.props.chartWidth + this.rightPadding;
    }

    @computed get svgHeight(): number {
        return (
            this.props.chartHeight +
            this.bottomLegendHeight +
            this.axisLabelXHeight
        );
    }

    @computed get axisLabelYHeight(): number {
        return VICTORY_LABEL_TEXT_HEIGHT * getNumberOfNewlines(this.axisLabelY);
    }

    @computed get axisLabelXHeight(): number {
        return VICTORY_LABEL_TEXT_HEIGHT * getNumberOfNewlines(this.axisLabelX);
    }

    @computed get axisLabelX(): string {
        const label = makeMultilineAxisLabel(
            this.props.axisLabelX,
            VICTORY_LABEL_CUSTOM_CHAR_LIMIT
        );
        return label;
    }

    @computed get axisLabelY(): string {
        const label = makeMultilineAxisLabel(
            this.props.axisLabelY,
            VICTORY_LABEL_CUSTOM_CHAR_LIMIT
        );
        return label;
    }

    @autobind
    private x(d: D) {
        if (this.props.logX) {
            return this.props.logX!.fLogScale(d.x, 0);
        } else {
            return d.x;
        }
    }

    @autobind
    private y(d: D) {
        if (this.props.logY) {
            return this.props.logY!.fLogScale(d.y, 0);
        } else {
            return d.y;
        }
    }

    @computed get size() {
        const highlight = this.props.highlight;
        const size = this.props.size;
        // need to regenerate this function whenever highlight changes in order to trigger immediate Victory rerender
        return makeScatterPlotSizeFunction(highlight, size);
    }

    private tickFormat(
        t: number,
        ticks: number[],
        logScaleFunc: IAxisLogScaleParams | undefined
    ) {
        if (logScaleFunc && !this.props.useLogSpaceTicks) {
            t = logScaleFunc.fInvLogScale(t);
            ticks = ticks.map(x => logScaleFunc.fInvLogScale(x));
        }
        return tickFormatNumeral(t, ticks);
    }

    @autobind
    private tickFormatX(t: number, i: number, ticks: number[]) {
        return this.tickFormat(t, ticks, this.props.logX);
    }

    @autobind
    private tickFormatY(t: number, i: number, ticks: number[]) {
        return this.tickFormat(t, ticks, this.props.logY);
    }

    @computed get data() {
        return separateScatterDataByAppearance(
            this.props.data,
            ifNotDefined(this.props.fill, '0x000000'),
            ifNotDefined(this.props.stroke, '0x000000'),
            ifNotDefined(this.props.strokeWidth, 0),
            ifNotDefined(this.props.strokeOpacity, 1),
            ifNotDefined(this.props.fillOpacity, 1),
            ifNotDefined(this.props.symbol, 'circle'),
            this.props.zIndexSortBy
        );
    }

    @computed private get regressionLineComputations() {
        const data = this.props.data.map(
            d => [this.x(d), this.y(d)] as [number, number]
        );
        return getRegressionComputations(data);
    }

    private get regressionLine() {
        // when limit values are shown in the legend, exclude
        // these points from calculation of regression line
        const regressionData: D[] = this.props.excludeLimitValuesFromCorrelation
            ? _.filter(
                  this.props.data,
                  (d: IPlotSampleData) => !dataPointIsLimited(d)
              )
            : this.props.data;

        if (this.props.showRegressionLine && regressionData.length >= 2) {
            const regressionLineComputations = this.regressionLineComputations;
            const y = (x: number) => regressionLineComputations.predict(x)[1];
            const labelX = 0.7;
            const xPoints = [
                this.plotDomain.x[0],
                this.plotDomain.x[0] * (1 - labelX) +
                    this.plotDomain.x[1] * labelX,
                this.plotDomain.x[1],
            ];
            const data: any[] = xPoints.map(x => ({ x, y: y(x), label: '' }));
            return [
                <VictoryLine
                    style={{
                        data: {
                            stroke: REGRESSION_STROKE,
                            strokeWidth: REGRESSION_STROKE_WIDTH,
                        },
                        labels: {
                            fontSize: 15,
                            fill: '#000000',
                            stroke: '#ffffff',
                            strokeWidth: 6,
                            fontWeight: 'bold',
                            paintOrder: 'stroke',
                        },
                    }}
                    data={data}
                    labelComponent={<VictoryLabel lineHeight={1.3} />}
                />,
            ];
        } else {
            return null;
        }
    }

    protected handleSelection(points: any, bounds: any, props: any) {
        // we don't want to select non data-points like the regression line
        // so we filter for data with a sampleId
        this.props.onDataSelection &&
            this.props.onDataSelection(
                _.flatMap(points, (p: { data: D }) => p.data).filter(
                    (d: any) => d.sampleId
                )
            );
    }

    @autobind
    private getChart() {
        return (
            <div
                ref={this.containerRef}
                style={{ width: this.svgWidth, height: this.svgHeight }}
            >
                <VictoryChart
                    containerComponent={
                        this.props.onDataSelection ? (
                            <VictorySelectionContainer
                                containerRef={this.svgContainerRef}
                                activateSelectedData={false}
                                onSelection={(
                                    points: any,
                                    bounds: any,
                                    props: any
                                ) =>
                                    this.handleSelection(points, bounds, props)
                                }
                                responsive={true}
                                id={this.props.svgId || ''}
                            />
                        ) : (
                            <VictoryContainer
                                containerRef={this.svgContainerRef}
                                id={this.props.svgId || ''}
                            />
                        )
                    }
                    padding={{
                        left: this.leftPadding + 50,
                        bottom:
                            this.legendLocation === 'right'
                                ? 50 + this.axisLabelXHeight
                                : this.bottomLegendHeight +
                                  50 +
                                  this.axisLabelXHeight,
                        top: 50,
                        right:
                            this.svgWidth -
                            this.props.chartWidth +
                            50 -
                            this.leftPadding,
                    }}
                    theme={CBIOPORTAL_VICTORY_THEME}
                    height={this.svgHeight}
                    width={this.svgWidth}
                    domainPadding={PLOT_DATA_PADDING_PIXELS}
                    singleQuadrantDomainPadding={false}
                >
                    {this.title}
                    {this.legend}
                    <VictoryAxis
                        domain={this.plotDomain.x}
                        orientation="bottom"
                        offsetY={
                            50 + this.bottomLegendHeight + this.axisLabelXHeight
                        }
                        crossAxis={false}
                        tickCount={NUM_AXIS_TICKS}
                        tickFormat={this.tickFormatX}
                        axisLabelComponent={<VictoryLabel dy={25} />}
                        label={this.axisLabelX}
                    />
                    <VictoryAxis
                        domain={this.plotDomain.y}
                        offsetX={50 + this.leftPadding}
                        orientation="left"
                        crossAxis={false}
                        tickCount={NUM_AXIS_TICKS}
                        tickFormat={this.tickFormatY}
                        dependentAxis={true}
                        axisLabelComponent={<VictoryLabel dy={-35} />}
                        label={this.axisLabelY}
                    />
                    {this.data.map(dataWithAppearance => (
                        <VictoryScatter
                            key={`${dataWithAppearance.fill},${dataWithAppearance.stroke},${dataWithAppearance.strokeWidth},${dataWithAppearance.strokeOpacity},${dataWithAppearance.fillOpacity},${dataWithAppearance.symbol}`}
                            style={{
                                data: {
                                    fill: dataWithAppearance.fill,
                                    stroke: dataWithAppearance.stroke,
                                    strokeWidth: dataWithAppearance.strokeWidth,
                                    strokeOpacity:
                                        dataWithAppearance.strokeOpacity,
                                    fillOpacity: dataWithAppearance.fillOpacity,
                                },
                            }}
                            size={this.size}
                            symbol={dataWithAppearance.symbol}
                            data={dataWithAppearance.data}
                            events={this.mouseEvents}
                            x={this.x}
                            y={this.y}
                        />
                    ))}
                    {this.regressionLine}
                    {this.correlationInfo}
                    {this.regressionLineEquation}
                </VictoryChart>
            </div>
        );
    }

    render() {
        if (!this.props.data.length) {
            return <div className={'alert alert-info'}>No data to plot.</div>;
        }
        return (
            <div>
                <Observer>{this.getChart}</Observer>
                {this.container && this.tooltipModel && this.props.tooltip && (
                    <ScatterPlotTooltip
                        container={this.container}
                        targetHovered={this.pointHovered}
                        targetCoords={{
                            x: this.tooltipModel.x,
                            y: this.tooltipModel.y,
                        }}
                        overlay={this.props.tooltip(this.tooltipModel.datum)}
                    />
                )}
            </div>
        );
    }
}
