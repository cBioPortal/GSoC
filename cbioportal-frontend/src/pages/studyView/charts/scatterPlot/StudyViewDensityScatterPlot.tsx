import { observer } from 'mobx-react';
import * as React from 'react';
import {
    VictoryAxis,
    VictoryChart,
    VictoryLabel,
    VictoryScatter,
    Point,
} from 'victory';
import {
    CBIOPORTAL_VICTORY_THEME,
    ScatterPlotTooltip,
    makeTooltipMouseEvents,
    VictorySelectionContainerWithLegend,
} from 'cbioportal-frontend-commons';
import { computed, makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';
import { tickFormatNumeral } from 'cbioportal-frontend-commons';
import _ from 'lodash';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { AbstractChart } from '../ChartContainer';
import { interpolatePlasma } from 'd3-scale-chromatic';
import { DensityPlotBin } from 'cbioportal-ts-api-client';
import { RectangleBounds } from 'pages/studyView/StudyViewUtils';
import { computeCorrelationPValue } from 'shared/components/plots/PlotUtils';

class DensityPoint extends React.Component<any, any> {
    render() {
        const { x, y, size, ...rest } = this.props;
        // since our points actually represent histogram bins/ranges,
        //  we want their placement to align properly with their ranges,
        //  but the default is to place them centered. This component
        //  adjusts for that
        return <Point x={x + size} y={y - size} size={size} {...rest} />;
    }
}

export function getActualPlotAxisLength(length: number) {
    // Empirically determined, would probably change
    // if anything changes
    return length - 130;
}

export type IStudyViewDensityScatterPlotDatum = DensityPlotBin & {
    x: number;
    y: number;
};

export interface IStudyViewDensityScatterPlotProps {
    width: number;
    height: number;
    yBinsMin: number;
    data: DensityPlotBin[];
    pearsonCorr: number;
    spearmanCorr: number;
    plotDomain?: {
        x?: { min?: number; max?: number };
        y?: { min?: number; max?: number };
    };
    xBinSize: number;
    yBinSize: number;
    onSelection: (bounds: RectangleBounds) => void;
    selectionBounds?: RectangleBounds;

    isLoading?: boolean;
    svgRef?: (svg: SVGElement | null) => void;
    tooltip?: (d: DensityPlotBin) => JSX.Element;
    axisLabelX?: string;
    axisLabelY?: string;
    title?: string;
}

const NUM_AXIS_TICKS = 8;
const DOMAIN_PADDING = 15;

@observer
export default class StudyViewDensityScatterPlot
    extends React.Component<IStudyViewDensityScatterPlotProps, {}>
    implements AbstractChart {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @observable tooltipModel: any | null = null;
    @observable pointHovered: boolean = false;
    @observable mouseIsDown: boolean = false;
    public mouseEvents: any = makeTooltipMouseEvents(this);

    private xAxis: any | null = null;
    private yAxis: any | null = null;

    @observable.ref private container: HTMLDivElement;
    private svg: SVGElement | null;

    @autobind
    private containerRef(container: HTMLDivElement) {
        this.container = container;
    }

    @autobind
    private svgRef(svg: SVGElement | null) {
        this.svg = svg;
        if (this.props.svgRef) {
            this.props.svgRef(this.svg);
        }
    }

    public toSVGDOMNode(): Element {
        return this.svg!;
    }

    private get title() {
        if (this.props.title) {
            return (
                <VictoryLabel
                    style={{
                        fontWeight: 'bold',
                        textAnchor: 'middle',
                    }}
                    x={this.props.width / 2}
                    y="1.2em"
                    text={this.props.title}
                />
            );
        } else {
            return null;
        }
    }

    @computed get plotDomain() {
        // plotDomain is the axis limits of the plot. It can be
        //  specified by the user (e.g. fraction genome altered always
        //  is 0 to 1) or just pegged to the maximum and minimum of the data
        const x = [
            this.props.plotDomain?.x?.min,
            this.props.plotDomain?.x?.max,
        ];
        const y = [
            this.props.plotDomain?.y?.min,
            this.props.plotDomain?.y?.max,
        ];
        if (x[0] === undefined) {
            x[0] = this.dataDomain.x[0];
        }

        if (x[1] === undefined) {
            x[1] = this.dataDomain.x[1];
        }

        if (y[0] === undefined) {
            y[0] = this.dataDomain.y[0];
        }

        if (y[1] === undefined) {
            y[1] = this.dataDomain.y[1];
        }

        return {
            x,
            y,
        };
    }

    @computed get dataDomain() {
        // get data extremes
        const max = {
            x: Number.NEGATIVE_INFINITY,
            y: Number.NEGATIVE_INFINITY,
        };
        const min = {
            x: Number.POSITIVE_INFINITY,
            y: Number.POSITIVE_INFINITY,
        };
        for (const d of this.data) {
            max.x = Math.max(d.x + this.props.xBinSize, max.x);
            max.y = Math.max(d.y + this.props.yBinSize, max.y);
            min.x = Math.min(d.x, min.x);
            min.y = Math.min(d.y, min.y);
        }
        return {
            x: [min.x, max.x] as [number, number],
            y: [min.y, max.y] as [number, number],
        };
    }

    @autobind
    private tickFormat(t: number, index: number, ticks: number[]) {
        return tickFormatNumeral(t, ticks);
    }

    @autobind
    private onMouseDown() {
        this.mouseIsDown = true;
    }

    @autobind
    private onMouseUp() {
        this.mouseIsDown = false;
    }

    @autobind
    private onSelection(scatters: any, bounds: any) {
        if (this.xAxis && this.yAxis) {
            let xStart = Number.POSITIVE_INFINITY;
            let yStart = Number.POSITIVE_INFINITY;
            let xEnd = Number.NEGATIVE_INFINITY;
            let yEnd = Number.NEGATIVE_INFINITY;
            for (const scatter of scatters) {
                for (const p of scatter.data) {
                    xStart = Math.min(xStart, p.x);
                    yStart = Math.min(yStart, p.y);
                    xEnd = Math.max(xEnd, p.x);
                    yEnd = Math.max(yEnd, p.y);
                }
            }
            // add bin size to get proper bound
            xEnd += this.props.xBinSize;
            yEnd += this.props.yBinSize;

            if (Math.abs(yEnd - this.dataDomain.y[1]) < 0.00005) {
                // if yEnd === dataDomain.y[1], then bump it up by 1. This is because of how the mutationCountVsCNA filter
                //  works, in conjunction with how the clinical data density plot API works. The clinical data density plot API,
                //  if you don't pass in an explicit bin range, will make bins based on the min/max of the data. We don't pass in
                //  a max mutation count, so that's what happens for mutation count: the endpoint of the binning range is the max
                //  mutation count value in the query.
                // Now, the mutationCountVsCNA filter works with *right-open-ended* intervals: beginning <= value < end. So if
                //  we select only the topmost bin, we're going to get a selection of all samples with values which are >= the
                //  bottom of the bin, and STRICTLY LESS THAN the top of the bin. The trouble is that because of how we establish the bins, this
                //  topmost dot could possibly only contain a sample with a value EQUAL to the end of the bin. Thus, selecting
                //  the dot leads to an empty selection.
                // To fix this, we bump up yEnd by 1 in this case, to include this last sample.

                yEnd += 1;
            }
            if (Math.abs(xEnd - 1) < 0.00005) {
                // same reasoning as above, in case a sample has 1.0 FGA
                // but we don't have to check the data because we know the bin range ends at 1

                xEnd += 1;
            }

            xStart = +xStart.toFixed(2);
            xEnd = +xEnd.toFixed(2);
            yStart = +yStart.toFixed(2);
            yEnd = +yEnd.toFixed(2);
            this.props.onSelection({ xStart, xEnd, yStart, yEnd });
        }
    }

    @computed get data(): IStudyViewDensityScatterPlotDatum[] {
        return this.props.data.map(d =>
            Object.assign({}, d, { x: d.binX, y: d.binY })
        );
    }

    /*private isSelected(d: IStudyViewDensityScatterPlotDatum) {
        if (!this.props.selectionBounds) {
            return true;
        } else {
            const bounds = this.props.selectionBounds;
            let xFiltered = true;
            let yFiltered = true;

            if (bounds.xStart !== undefined && bounds.xEnd !== undefined) {
                xFiltered = d.binX >= bounds.xStart && d.binX < bounds.xEnd;
            } else if (bounds.xEnd !== undefined) {
                xFiltered = d.binX < bounds.xEnd;
            } else if (bounds.xStart !== undefined) {
                xFiltered = d.binX >= bounds.xStart;
            }

            if (bounds.yStart !== undefined && bounds.yEnd !== undefined) {
                yFiltered = d.binY >= bounds.yStart && d.binY < bounds.yEnd;
            } else if (bounds.yEnd !== undefined) {
                yFiltered = d.binY < bounds.yEnd;
            } else if (bounds.yStart !== undefined) {
                yFiltered = d.binY >= bounds.yStart;
            }

            return xFiltered && yFiltered;
        }
    }*/

    @computed get plotComputations() {
        let max = Number.NEGATIVE_INFINITY;
        let min = Number.POSITIVE_INFINITY;
        // group data, and collect max and min at same time
        // grouping data by count (aka by color) to make different scatter for each color,
        //  this gives significant speed up over passing in a fill function
        /*const selectedData = [];
        const unselectedData = [];
        for (const d of this.data) {
            if (this.isSelected(d)) {
                selectedData.push(d);
            } else {
                unselectedData.push(d);
            }
        }*/
        const selectedData = this.data;

        const selectedDataByAreaCount = _.groupBy(selectedData, d => {
            const areaCount = d.count;
            max = Math.max(areaCount, max);
            min = Math.min(areaCount, min);
            return areaCount;
        });
        /*const unselectedDataByAreaCount = _.groupBy(unselectedData, d => {
            const areaCount = d.count;
            max = Math.max(areaCount, max);
            min = Math.min(areaCount, min);
            return areaCount;
        });*/
        const unselectedDataByAreaCount = {};

        // use log scale because its usually a very long tail distribution
        // we dont need to worry about log(0) because areas wont have data points to them if theres 0 data there,
        //  so these arguments to log will never be 0.

        // if min == max, then set min = 1
        if (min === max) {
            min = 1;
        }
        const logMax = Math.log(max);
        const logMin = Math.log(min);

        let countToColorCoord: (count: number) => number;
        let colorCoordToCount: ((colorCoord: number) => number) | null;
        let colorCoordToColor: (colorCoord: number) => string;
        const colorCoordMax = 0.75;
        if (min === max) {
            // this means min = max = 1;
            countToColorCoord = () => 0;
            colorCoordToColor = () => interpolatePlasma(0);
            colorCoordToCount = null;
        } else {
            // scale between 0 and some limit, to avoid lighter colors on top which are not visible against white bg
            countToColorCoord = count =>
                (Math.log(count) - logMin) / (logMax - logMin);
            colorCoordToCount = coord =>
                Math.exp((coord * (logMax - logMin)) / colorCoordMax + logMin);
            colorCoordToColor = coord =>
                interpolatePlasma(colorCoordMax * coord);
        }

        return {
            selectedDataByAreaCount,
            unselectedDataByAreaCount,
            colorCoordToCount,
            colorCoordMax,
            countToSelectedColor: (count: number) =>
                colorCoordToColor(countToColorCoord(count)),
            countToUnselectedColor: (count: number) => {
                return 'rgb(200,200,200)';
                /*const val = Math.round(countToColorCoord(count)*255);
                return `rgba(${val},${val},${val},0.3)`;&*/
            },
            colorCoordToColor,
            countMax: max,
            countMin: min,
        };
    }

    @computed get numSamples() {
        return _.sumBy(this.data, d => d.count);
    }

    @computed get pearsonPValue() {
        return computeCorrelationPValue(
            this.props.pearsonCorr,
            this.numSamples
        );
    }
    @computed get spearmanPValue() {
        return computeCorrelationPValue(
            this.props.spearmanCorr,
            this.numSamples
        );
    }

    @computed get scatters() {
        if (this.data.length === 0) {
            return [];
        }

        const scatters: JSX.Element[] = [];
        const scatterCategories = [
            {
                dataByAreaCount: this.plotComputations.selectedDataByAreaCount,
                countToColor: this.plotComputations.countToSelectedColor,
                size: 3,
            },
            {
                dataByAreaCount: this.plotComputations
                    .unselectedDataByAreaCount,
                countToColor: this.plotComputations.countToUnselectedColor,
                size: 2.5,
            },
        ];
        for (const scatterCategory of scatterCategories) {
            _.forEach(scatterCategory.dataByAreaCount, (data, areaCount) => {
                const color = scatterCategory.countToColor(
                    parseInt(areaCount, 10)
                );
                scatters.push(
                    <VictoryScatter
                        key={`${areaCount}`}
                        style={{
                            data: {
                                fill: color,
                                stroke: 'black',
                                strokeWidth: 1,
                                strokeOpacity: 0,
                            },
                        }}
                        size={scatterCategory.size}
                        symbol="circle"
                        data={data}
                        events={this.mouseEvents}
                        dataComponent={<DensityPoint />}
                    />
                );
            });
        }
        return scatters;
    }

    @computed get legend() {
        const colorCoordToCount = this.plotComputations.colorCoordToCount;
        if (!colorCoordToCount) {
            return null;
        } else {
            const gradientId = 'legendGradient';
            const GRADIENTMESH = 30;
            const gradientStopPoints = [];
            for (let i = 0; i < GRADIENTMESH; i++) {
                gradientStopPoints.push(
                    <stop
                        offset={`${((i / GRADIENTMESH) * 100).toFixed(0)}%`}
                        stopColor={this.plotComputations.colorCoordToColor(
                            i / GRADIENTMESH
                        )}
                    />
                );
            }
            const gradientElt = (
                <linearGradient
                    id={gradientId}
                    key={gradientId}
                    x1="0"
                    y1="1"
                    x2="0"
                    y2="0"
                >
                    {gradientStopPoints}
                </linearGradient>
            );

            const rectX = this.props.width - 45;
            const rectY = 70;
            const rectWidth = 10;
            const largeRange =
                this.plotComputations.countMax -
                    this.plotComputations.countMin >=
                2;
            const rectHeight = largeRange ? 68 : 38;

            const rect = (
                <rect
                    fill={`url(#${gradientId})`}
                    x={rectX}
                    y={rectY}
                    width={rectWidth}
                    height={rectHeight}
                />
            );

            const labels = [
                <text
                    fontSize={11}
                    x={rectX + rectWidth + 4}
                    y={rectY}
                    dy="1em"
                >
                    {this.plotComputations.countMax.toLocaleString()}
                </text>,
                <text
                    fontSize={11}
                    x={rectX + rectWidth + 4}
                    y={rectY + rectHeight}
                    dy="-0.3em"
                >
                    {this.plotComputations.countMin.toLocaleString()}
                </text>,
            ];
            let correlationLabels;

            const pearson = _.isNumber(this.props.pearsonCorr)
                ? this.props.pearsonCorr.toFixed(4)
                : this.props.pearsonCorr;
            const spearman = _.isNumber(this.props.spearmanCorr)
                ? this.props.spearmanCorr.toFixed(4)
                : this.props.spearmanCorr;

            if (this.numSamples > 2) {
                // otherwise p-values are null

                correlationLabels = [
                    // pearson
                    <text
                        fontSize={10}
                        x={rectX - 5}
                        y={rectY + rectHeight + 40}
                        dy={'-0.3em'}
                    >
                        Pearson:
                    </text>,
                    <text
                        fontSize={10.5}
                        x={rectX - 5}
                        y={rectY + rectHeight + 55}
                        dy={'-0.3em'}
                    >
                        {pearson}
                    </text>,
                    <text
                        fontSize={10.5}
                        x={rectX - 5}
                        y={rectY + rectHeight + 70}
                        dy={'-0.3em'}
                    >
                        p={this.pearsonPValue!.toFixed(2)}
                    </text>,

                    // spearman
                    <text
                        fontSize={10}
                        x={rectX - 5}
                        y={rectY + rectHeight + 100}
                        dy={'-0.3em'}
                    >
                        Spearman:
                    </text>,
                    <text
                        fontSize={10.5}
                        x={rectX - 5}
                        y={rectY + rectHeight + 115}
                        dy={'-0.3em'}
                    >
                        {spearman}
                    </text>,
                    <text
                        fontSize={10.5}
                        x={rectX - 5}
                        y={rectY + rectHeight + 130}
                        dy={'-0.3em'}
                    >
                        p={this.spearmanPValue!.toFixed(2)}
                    </text>,
                ];
            }
            if (largeRange) {
                // only add a middle label if theres room for another whole number in between
                labels.push(
                    <text
                        fontSize={11}
                        x={rectX + rectWidth + 4}
                        y={rectY + rectHeight / 2}
                        dy="0.3em"
                    >
                        {Math.round(colorCoordToCount(0.5)).toLocaleString()}
                    </text>
                );
            }

            const title = (
                <text fontSize={11} x={rectX} y={rectY} dy="-0.5em" dx="-12px">
                    # samples
                </text>
            );

            return {
                gradient: gradientElt,
                legend: (
                    <g>
                        {title}
                        {rect}
                        {labels}
                        {correlationLabels}
                    </g>
                ),
            };
        }
    }

    @autobind
    private xAxisRef(axis: any | null) {
        this.xAxis = axis;
    }

    @autobind
    private yAxisRef(axis: any | null) {
        this.yAxis = axis;
    }

    render() {
        //console.log(this.plotDomain);
        return (
            <div>
                {this.data.length > 0 && (
                    <div
                        style={{
                            width: this.props.width,
                            height: this.props.height,
                            position: 'relative',
                        }}
                        ref={this.containerRef}
                        onMouseDown={this.onMouseDown}
                        onMouseUp={this.onMouseUp}
                    >
                        <VictoryChart
                            theme={CBIOPORTAL_VICTORY_THEME}
                            containerComponent={
                                <VictorySelectionContainerWithLegend
                                    onSelection={this.onSelection}
                                    containerRef={(ref: any) => {
                                        if (ref) {
                                            this.svgRef(ref.firstChild);
                                        }
                                    }}
                                    legend={this.legend && this.legend.legend}
                                    gradient={
                                        this.legend && this.legend.gradient
                                    }
                                />
                            }
                            width={this.props.width}
                            height={this.props.height}
                            standalone={true}
                            domainPadding={DOMAIN_PADDING}
                            singleQuadrantDomainPadding={false}
                        >
                            {this.title}
                            <VictoryAxis
                                ref={this.xAxisRef}
                                domain={this.plotDomain.x}
                                orientation="bottom"
                                offsetY={50}
                                crossAxis={false}
                                tickCount={NUM_AXIS_TICKS}
                                tickFormat={this.tickFormat}
                                axisLabelComponent={
                                    <VictoryLabel
                                        dy={20}
                                        style={[
                                            {
                                                fontSize: 12,
                                                fontFamily: 'Arial',
                                            },
                                        ]}
                                    />
                                }
                                label={this.props.axisLabelX}
                            />
                            <VictoryAxis
                                ref={this.yAxisRef}
                                domain={this.plotDomain.y}
                                orientation="left"
                                offsetX={50}
                                crossAxis={false}
                                tickCount={NUM_AXIS_TICKS}
                                tickFormat={this.tickFormat}
                                dependentAxis={true}
                                axisLabelComponent={
                                    <VictoryLabel
                                        dy={-27}
                                        style={[
                                            {
                                                fontSize: 12,
                                                fontFamily: 'Arial',
                                            },
                                        ]}
                                    />
                                }
                                label={this.props.axisLabelY}
                            />
                            {this.scatters}
                        </VictoryChart>
                        <span
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%',
                                backgroundColor: 'rgba(255,255,255,0.8)',
                                display: this.props.isLoading
                                    ? 'block'
                                    : 'none',
                            }}
                        />
                    </div>
                )}
                {!this.props.isLoading && this.data.length === 0 && (
                    <div
                        className={'alert alert-info'}
                        style={{ marginTop: 175 }}
                    >
                        No data to plot.
                    </div>
                )}
                <LoadingIndicator
                    isLoading={!!this.props.isLoading}
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        marginLeft: -10,
                    }}
                />
                {this.tooltipModel && this.props.tooltip && !this.mouseIsDown && (
                    <ScatterPlotTooltip
                        container={this.container}
                        targetHovered={this.pointHovered}
                        targetCoords={{
                            x: this.tooltipModel.x,
                            y: this.tooltipModel.y - 3, // counter to the offset in DensityPoint
                        }}
                        overlay={this.props.tooltip(this.tooltipModel.datum)}
                    />
                )}
            </div>
        );
    }
}
