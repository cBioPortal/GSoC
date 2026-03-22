import * as React from 'react';
import { Observer, observer } from 'mobx-react';
import { computed, makeObservable, observable } from 'mobx';
import { bind } from 'bind-decorator';
import {
    axisTickLabelStyles,
    baseLabelStyles,
    CBIOPORTAL_VICTORY_THEME,
    getTextWidth,
    stringListToIndexSet,
} from 'cbioportal-frontend-commons';
import autobind from 'autobind-decorator';
import _ from 'lodash';
import {
    VictoryAxis,
    VictoryBar,
    VictoryChart,
    VictoryLabel,
    VictoryStack,
    VictoryLegend,
    VictoryGroup,
} from 'victory';
import { tickFormatNumeral } from 'cbioportal-frontend-commons';
import { makeUniqueColorGetter } from './PlotUtils';
import {
    makePlotData,
    makeBarSpecs,
    sortDataByCategory,
    getSortedMajorCategories,
} from './MultipleCategoryBarPlotUtils';
import * as ReactDOM from 'react-dom';
import { Popover } from 'react-bootstrap';
import classnames from 'classnames';
import { toConditionalPrecisionWithMinimum } from 'shared/lib/FormatUtils';
import { IStringAxisData } from 'shared/components/plots/PlotsTabUtils';
import WindowStore from 'shared/components/window/WindowStore';
import { SortByOptions } from 'shared/components/plots/PlotsTab';
export interface IMultipleCategoryBarPlotProps {
    svgId?: string;
    domainPadding?: number;
    horzData?: IStringAxisData['data'];
    vertData?: IStringAxisData['data'];
    plotData?: IMultipleCategoryBarPlotData[];
    categoryToColor?: { [cat: string]: string };
    barWidth: number;
    chartBase: number;
    horizontalBars?: boolean;
    horzCategoryOrder?: string[];
    vertCategoryOrder?: string[];
    axisLabelX?: string;
    axisLabelY?: string;
    legendLocationWidthThreshold?: number;
    percentage?: boolean;
    stacked?: boolean;
    ticksCount?: number;
    axisStyle?: any;
    countAxisLabel?: string;
    tooltip?: (datum: any) => JSX.Element;
    svgRef?: (svgContainer: SVGElement | null) => void;
    pValue: number | null;
    qValue: number | null;
    sortByDropDownOptions?: { value: string; label: string }[];
    updateDropDownOptions?: (
        option: { value: string; label: string }[]
    ) => void;
    sortByOption?: string;
}

export interface IMultipleCategoryBarPlotData {
    minorCategory: string;
    counts: { majorCategory: string; count: number; percentage: number }[];
}

const RIGHT_GUTTER = 120; // room for legend
const NUM_AXIS_TICKS = 8;
const PLOT_DATA_PADDING_PIXELS = 100;
const CATEGORY_LABEL_HORZ_ANGLE = 50;
const DEFAULT_LEFT_PADDING = 25;
const DEFAULT_BOTTOM_PADDING = 10;
const LEGEND_ITEMS_PER_ROW = 4;
const BOTTOM_LEGEND_PADDING = 15;
const RIGHT_PADDING_FOR_LONG_LABELS = 50;

@observer
export default class MultipleCategoryBarPlot extends React.Component<
    IMultipleCategoryBarPlotProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    static defaultProps: Partial<IMultipleCategoryBarPlotProps> = {
        countAxisLabel: '# samples',
    };

    @observable.ref tooltipModel: any | null = null;
    private mouseEvents: any = this.makeMouseEvents();
    private legendClassName: string = `stacked-bar-plot-legend-${Math.random()}`;
    @observable computedLegendWidth = 0;
    @observable mousePosition = { x: 0, y: 0 };

    @observable.ref private container: HTMLDivElement;

    @bind
    private containerRef(container: HTMLDivElement) {
        this.container = container;
        this.updateLegendWidth();
    }

    @computed get getColor() {
        const uniqueColorGetter = makeUniqueColorGetter(
            _.values(this.props.categoryToColor)
        );
        const categoryToColor: { [category: string]: string } = {};
        _.forEach(this.props.categoryToColor, (color, category) => {
            categoryToColor[category.toLowerCase()] = color;
        });
        return function(category: string) {
            category = category.toLowerCase();
            if (!(category in categoryToColor)) {
                categoryToColor[category] = uniqueColorGetter();
            }
            return categoryToColor[category];
        };
    }

    private makeMouseEvents() {
        return [
            {
                target: 'data',
                eventHandlers: {
                    onMouseOver: () => {
                        return [
                            {
                                target: 'data',
                                mutation: (props: any) => {
                                    this.tooltipModel = props;
                                    return null;
                                },
                            },
                        ];
                    },
                    onMouseOut: () => {
                        return [
                            {
                                target: 'data',
                                mutation: () => {
                                    this.tooltipModel = null;
                                    return null;
                                },
                            },
                        ];
                    },
                },
            },
        ];
    }

    @computed get chartWidth() {
        let specifiedWidth: number;
        if (this.props.horizontalBars) {
            specifiedWidth = this.props.chartBase;
        } else {
            specifiedWidth = this.chartExtent;
        }

        return Math.max(
            specifiedWidth,
            getTextWidth(
                this.props.axisLabelX || '',
                baseLabelStyles.fontFamily,
                baseLabelStyles.fontSize + 'px'
            )
        ); // make sure theres enough room for the x-axis label
    }

    @computed get chartHeight() {
        let specifiedWidth: number;
        if (this.props.horizontalBars) {
            specifiedWidth = this.chartExtent;
        } else {
            specifiedWidth = this.props.chartBase;
        }

        return Math.max(
            specifiedWidth,
            getTextWidth(
                this.props.axisLabelY || '',
                baseLabelStyles.fontFamily,
                baseLabelStyles.fontSize + 'px'
            )
        ); // make sure theres enough room for the y-axis label
    }

    @computed get sideLegendX() {
        return this.chartWidth - 20;
    }

    @computed get legendLocation() {
        if (
            (this.props.legendLocationWidthThreshold !== undefined &&
                this.chartWidth > this.props.legendLocationWidthThreshold) || // move to bottom if chart width is too large, leaving no room for legend on the side
            this.legendData.length > 15 // move to bottom if legend is too long, making it run off the screen
        ) {
            return 'bottom';
        } else {
            return 'right';
        }
    }

    @computed get bottomLegendHeight() {
        //height of legend in case its on bottom
        if (this.legendData.length === 0) {
            return 0;
        } else {
            const numRows = Math.ceil(
                this.legendData.length / LEGEND_ITEMS_PER_ROW
            );
            return 23.7 * numRows;
        }
    }

    @computed get legendData() {
        return sortDataByCategory(
            this.data,
            d => d.minorCategory,
            this.minorCategoryOrder
        ).map(obj => ({
            name: obj.minorCategory,
            symbol: {
                type: 'square',
                fill: this.getColor(obj.minorCategory),
                strokeOpacity: 0,
                size: 5,
            },
        }));
    }

    private get legend() {
        if (this.legendData.length > 0) {
            return (
                <VictoryLegend
                    orientation={
                        this.legendLocation === 'right'
                            ? 'vertical'
                            : 'horizontal'
                    }
                    itemsPerRow={
                        this.legendLocation === 'right'
                            ? undefined
                            : LEGEND_ITEMS_PER_ROW
                    }
                    rowGutter={this.legendLocation === 'right' ? undefined : -5}
                    gutter={30}
                    data={this.legendData}
                    x={this.legendLocation === 'right' ? this.sideLegendX : 0}
                    y={
                        this.legendLocation === 'right'
                            ? 100
                            : this.svgHeight - this.bottomLegendHeight
                    }
                    groupComponent={<g className={this.legendClassName} />}
                />
            );
        } else {
            return null;
        }
    }

    @computed get data(): IMultipleCategoryBarPlotData[] {
        let data: IMultipleCategoryBarPlotData[] = [];
        if (this.props.horzData && this.props.vertData) {
            data = makePlotData(
                this.props.horzData,
                this.props.vertData,
                !!this.props.horizontalBars
            );
        } else if (this.props.plotData) {
            data = this.props.plotData;
        }
        return data;
    }

    @computed get maxMajorCount() {
        if (this.props.percentage) {
            return 100;
        }
        const majorCategoryCounts: { [major: string]: number } = {};
        for (const d of this.data) {
            for (const c of d.counts) {
                majorCategoryCounts[c.majorCategory] =
                    majorCategoryCounts[c.majorCategory] || 0;
                if (this.props.stacked) {
                    majorCategoryCounts[c.majorCategory] += c.count;
                } else {
                    majorCategoryCounts[c.majorCategory] = Math.max(
                        c.count,
                        majorCategoryCounts[c.majorCategory]
                    );
                }
            }
        }
        return _.chain(majorCategoryCounts)
            .values()
            .max()
            .value() as number;
    }

    @computed get plotDomain() {
        // data domain is 0 to max num samples
        let x: number[], y: number[];
        const countDomain: number[] = [0, this.maxMajorCount];
        let categoryDomain: number[];
        if (this.data.length > 0) {
            categoryDomain = [
                this.categoryCoord(0),
                this.categoryCoord(Math.max(1, this.data[0].counts.length - 1)),
            ];
        } else {
            categoryDomain = [0, 0];
        }
        if (this.props.horizontalBars) {
            x = countDomain;
            y = categoryDomain;
        } else {
            x = categoryDomain;
            y = countDomain;
        }
        return { x, y };
    }

    @computed get offset() {
        return this.barWidth;
    }

    @computed get categoryAxisDomainPadding() {
        return this.domainPadding;
    }

    @computed get countAxisDomainPadding() {
        return this.domainPadding;
    }

    @computed get domainPadding() {
        if (this.props.domainPadding === undefined) {
            return PLOT_DATA_PADDING_PIXELS;
        } else {
            return this.props.domainPadding;
        }
    }

    @computed get countAxis(): 'x' | 'y' {
        if (this.props.horizontalBars) {
            return 'x';
        } else {
            return 'y';
        }
    }

    @computed get categoryAxis(): 'x' | 'y' {
        if (this.props.horizontalBars) {
            return 'y';
        } else {
            return 'x';
        }
    }

    @computed get chartDomainPadding() {
        return {
            [this.countAxis]: this.props.percentage
                ? 0
                : this.countAxisDomainPadding,
            [this.categoryAxis]:
                this.categoryAxisDomainPadding + this.additionalPadding,
        };
    }

    @computed get additionalPadding() {
        //if not stacked add padding to move the bars right
        //and add minorCategories count to fix padding issue when there are lot of categories
        return this.props.stacked
            ? 0
            : this.categoryCoord(this.data.length / 2) + this.data.length;
    }

    @computed get chartExtent() {
        let miscPadding = 100; // specifying chart width in victory doesnt translate directly to the actual graph size
        if (this.data.length > 0) {
            let numBars = 0;
            if (this.props.stacked) {
                numBars = this.data[0].counts.length;
            } else {
                //majorCategories*minorCategories
                numBars = this.data[0].counts.length * this.data.length;
                //add space between majorCategories
                miscPadding += this.categoryCoord(this.data[0].counts.length);
            }
            return (
                this.categoryCoord(numBars - 1) +
                2 * this.categoryAxisDomainPadding +
                miscPadding
            );
        } else {
            return miscPadding;
        }
    }

    @computed get svgWidth() {
        return this.leftPadding + this.chartWidth + this.rightPadding;
    }

    @computed get svgHeight() {
        return this.topPadding + this.chartHeight + this.bottomPadding;
    }

    @computed get barSeparation() {
        return this.props.stacked ? 0.2 * this.barWidth : 0;
    }

    @computed get barWidth() {
        let barWidth = this.props.barWidth || 10;
        //for grouped bar chart, if number of minorCategories greater than 10 then reduce the width by half
        if (this.props.stacked || this.data.length <= 10) {
            return barWidth;
        } else {
            return barWidth / 2;
        }
    }

    @computed get labels() {
        if (this.data.length > 0) {
            if (
                this.props.sortByOption === SortByOptions.SortByTotalSum ||
                (this.props.sortByOption &&
                    this.props.sortByOption !== '' &&
                    this.props.sortByOption !== SortByOptions.Alphabetically)
            ) {
                return getSortedMajorCategories(
                    this.data,
                    this.props.sortByOption,
                    !!this.props.percentage
                );
            }
            return sortDataByCategory(
                this.data[0].counts.map(c => c.majorCategory),
                x => x,
                this.majorCategoryOrder
            );
        } else {
            return [];
        }
    }

    private setInitialSelectedOption = () => {
        if (this.props.updateDropDownOptions) {
            const minorCategoriesArray = this.data.map(item => ({
                value: item.minorCategory,
                label: item.minorCategory,
            }));
            this.props.updateDropDownOptions(minorCategoriesArray);
        }
    };
    componentDidMount() {
        this.setInitialSelectedOption();
    }
    @bind
    private formatCategoryTick(t: number, index: number) {
        //return wrapTick(this.labels[index], MAXIMUM_CATEGORY_LABEL_SIZE);
        return this.labels[index];
    }

    @bind
    private formatNumericalTick(t: number, i: number, ticks: number[]) {
        return tickFormatNumeral(t, ticks);
    }

    @computed get numberOfTicks() {
        return this.props.ticksCount !== undefined
            ? this.props.ticksCount
            : NUM_AXIS_TICKS;
    }

    @computed get zeroCountOffset() {
        let addOffset = false;
        for (const d of this.data) {
            for (const c of d.counts) {
                if (c.count === 0) {
                    addOffset = true;
                    break;
                }
            }
            if (addOffset) break;
        }
        //add a small offset when its not a stacked bar to show empty bar
        if (this.props.stacked) {
            return 0;
        } else {
            return addOffset
                ? 0.01 * (this.maxMajorCount / this.numberOfTicks)
                : 0;
        }
    }

    @computed get axisStyle() {
        return this.props.stacked
            ? this.props.axisStyle || {}
            : { axis: { stroke: '#b3b3b3' } };
    }

    @computed get categoryAxisStyle() {
        let style = this.axisStyle;
        if (!this.props.stacked) {
            let width =
                this.categoryCoord(this.data.length) -
                this.data.length * this.barSeparation;
            style = {
                ...this.axisStyle,
                ...{ axis: { strokeWidth: 0 } },
                ...{
                    ticks: {
                        stroke: 'black',
                        size: 1,
                        strokeLinecap: 'butt',
                        strokeLinejoin: 'butt',
                        strokeWidth: width,
                    },
                },
            };
        }
        return style;
    }

    @computed get horzAxis() {
        // several props below are undefined in horizontal mode, thats because in horizontal mode
        //  this axis is for numbers, not categories
        const label = [this.props.axisLabelX];
        if (this.props.horizontalBars) {
            label.unshift(
                `${this.props.countAxisLabel}${
                    this.props.percentage ? ' (%)' : ''
                }`
            );
        }
        const style = this.props.horizontalBars
            ? this.axisStyle
            : this.categoryAxisStyle;
        return (
            <VictoryAxis
                orientation="bottom"
                offsetY={50}
                crossAxis={false}
                label={label}
                tickValues={
                    this.props.horizontalBars
                        ? undefined
                        : this.categoryTickValues
                }
                tickCount={
                    this.props.horizontalBars ? this.numberOfTicks : undefined
                }
                tickFormat={
                    this.props.horizontalBars
                        ? this.formatNumericalTick
                        : this.formatCategoryTick
                }
                tickLabelComponent={
                    <VictoryLabel
                        angle={
                            this.props.horizontalBars
                                ? undefined
                                : CATEGORY_LABEL_HORZ_ANGLE
                        }
                        verticalAnchor={
                            this.props.horizontalBars ? undefined : 'start'
                        }
                        textAnchor={
                            this.props.horizontalBars ? undefined : 'start'
                        }
                    />
                }
                axisLabelComponent={
                    <VictoryLabel
                        dy={
                            this.props.horizontalBars
                                ? 35
                                : this.biggestCategoryLabelSize + 24
                        }
                    />
                }
                style={style}
            />
        );
    }

    @computed get vertAxis() {
        const label: string[] = [];
        if (this.props.axisLabelY) {
            label.push(this.props.axisLabelY);
        }
        if (!this.props.horizontalBars) {
            label.push(
                `${this.props.countAxisLabel}${
                    this.props.percentage ? ' (%)' : ''
                }`
            );
        }
        const style = !this.props.horizontalBars
            ? this.axisStyle
            : this.categoryAxisStyle;
        return (
            <VictoryAxis
                orientation="left"
                offsetX={50}
                crossAxis={false}
                label={label}
                dependentAxis={true}
                tickValues={
                    this.props.horizontalBars
                        ? this.categoryTickValues
                        : undefined
                }
                tickCount={
                    this.props.horizontalBars ? undefined : this.numberOfTicks
                }
                tickFormat={
                    this.props.horizontalBars
                        ? this.formatCategoryTick
                        : this.formatNumericalTick
                }
                axisLabelComponent={
                    <VictoryLabel
                        dy={
                            this.props.horizontalBars
                                ? -1 * this.biggestCategoryLabelSize - 24
                                : -40
                        }
                    />
                }
                style={style}
            />
        );
    }

    @computed get leftPadding() {
        // more left padding if horizontal, to make room for labels
        if (this.props.horizontalBars) {
            return this.biggestCategoryLabelSize;
        } else {
            return DEFAULT_LEFT_PADDING;
        }
    }

    @computed get topPadding() {
        return 0;
    }

    @computed get rightPadding() {
        if (this.legendData.length > 0 && this.legendLocation === 'right') {
            // make room for legend
            return this.biggestLegendLabelWidth + 20;
        } else {
            // make room for legend at bottom
            return Math.max(
                RIGHT_PADDING_FOR_LONG_LABELS,
                this.computedLegendWidth - this.chartWidth
            );
        }
    }

    @computed get bottomPadding() {
        let paddingForLabels = DEFAULT_BOTTOM_PADDING;
        let paddingForLegend = 0;

        if (!this.props.horizontalBars) {
            // more padding if vertical, because category labels extend to bottom
            paddingForLabels = this.biggestCategoryLabelSize;
        }
        if (this.legendLocation === 'bottom') {
            // more padding if legend location is "bottom", to make room for legend
            paddingForLegend = this.bottomLegendHeight + BOTTOM_LEGEND_PADDING;
        }

        return paddingForLabels + paddingForLegend;
    }

    @computed get biggestLegendLabelWidth() {
        return Math.max(
            ...this.legendData.map(x =>
                getTextWidth(
                    x.name,
                    baseLabelStyles.fontFamily,
                    baseLabelStyles.fontSize + 'px'
                )
            )
        );
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
        if (this.props.horizontalBars) {
            // if horizontal mode, its label width
            return maxSize;
        } else {
            // if vertical mode, its label height when rotated
            return (
                maxSize *
                Math.abs(Math.sin((Math.PI / 180) * CATEGORY_LABEL_HORZ_ANGLE))
            );
        }
    }

    @computed get minorCategoryOrder() {
        let order;
        if (this.props.horizontalBars) {
            order = this.props.horzCategoryOrder;
        } else {
            order = this.props.vertCategoryOrder;
        }
        if (order) {
            return stringListToIndexSet(order);
        } else {
            return undefined;
        }
    }

    @computed get majorCategoryOrder() {
        let order;
        if (this.props.horizontalBars) {
            order = this.props.vertCategoryOrder;
        } else {
            order = this.props.horzCategoryOrder;
        }
        if (order) {
            return stringListToIndexSet(order);
        } else {
            return undefined;
        }
    }

    @autobind
    private categoryCoord(index: number) {
        return index * (this.barWidth + this.barSeparation); // half box + separation + half box
    }

    @computed get categoryTickValues() {
        if (this.data.length > 0) {
            return this.data[0].counts.map((x, i) => this.categoryCoord(i));
        } else {
            return [];
        }
    }

    private get bars() {
        const barSpecs = makeBarSpecs(
            this.data,
            this.minorCategoryOrder,
            this.majorCategoryOrder,
            this.getColor,
            this.categoryCoord,
            !!this.props.horizontalBars,
            !!this.props.stacked,
            !!this.props.percentage,
            this.props.sortByOption
        );
        return barSpecs.map(spec => (
            <VictoryBar
                style={{ data: { fill: spec.fill, width: this.barWidth } }}
                data={_.map(spec.data, datum => ({
                    ...datum,
                    y: datum.y + this.zeroCountOffset,
                }))}
                events={this.mouseEvents}
            />
        ));
    }

    private tooltipFunction(datum: any) {
        if (this.props.tooltip) {
            return this.props.tooltip(datum);
        }
        return (
            <div>
                <span>{datum.majorCategory}</span>
                <br />
                <strong>
                    {datum.minorCategory}:&nbsp;{datum.count}&nbsp;sample
                    {datum.count === 1 ? '' : 's'}&nbsp;({datum.percentage}%)
                </strong>
            </div>
        );
    }

    @computed get tooltipComponent() {
        if (!this.tooltipModel) {
            return null;
        } else {
            const maxWidth = 400;
            let tooltipPlacement = '';
            let dx = 0;
            let dy = 0;
            let transform = '';
            if (this.props.horizontalBars) {
                tooltipPlacement = 'bottom';
                dy = 10;
                transform = 'translate(-50%,0%)';
            } else {
                dy = -17;

                if (this.mousePosition.x > WindowStore.size.width - maxWidth) {
                    tooltipPlacement = 'left';
                    dx = -8;
                    transform = 'translate(-100%,0%)';
                } else {
                    tooltipPlacement = 'right';
                    dx = 8;
                }
            }

            return (ReactDOM as any).createPortal(
                <Popover
                    arrowOffsetTop={-dy}
                    className={classnames('cbioportal-frontend', 'cbioTooltip')}
                    positionLeft={this.mousePosition.x + dx}
                    positionTop={this.mousePosition.y + dy}
                    style={{
                        transform,
                        maxWidth,
                    }}
                    placement={tooltipPlacement}
                >
                    {this.tooltipFunction(
                        this.tooltipModel.datum || this.tooltipModel.data[0]
                    )}
                </Popover>,
                document.body
            );
        }
    }

    @computed get chartEtl() {
        if (this.props.stacked) {
            return (
                <VictoryStack horizontal={this.props.horizontalBars}>
                    {this.bars}
                </VictoryStack>
            );
        }
        return (
            <VictoryGroup
                offset={this.offset}
                horizontal={this.props.horizontalBars}
            >
                {this.bars}
            </VictoryGroup>
        );
    }

    @autobind
    private getChart() {
        if (this.data.length > 0) {
            return (
                <div
                    ref={this.containerRef}
                    style={{ width: this.svgWidth, height: this.svgHeight }}
                >
                    <svg
                        id={this.props.svgId || ''}
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
                        ref={ref => {
                            if (this.props.svgRef) {
                                this.props.svgRef(ref);
                            }
                        }}
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
                                domain={this.plotDomain}
                                singleQuadrantDomainPadding={{
                                    [this.countAxis]: true,
                                    [this.categoryAxis]: false,
                                }}
                            >
                                {this.legend}

                                <PQValueLabel
                                    x={this.chartWidth - 40}
                                    y={50}
                                    pValue={this.props.pValue}
                                    qValue={this.props.qValue}
                                />

                                {this.horzAxis}
                                {this.vertAxis}
                                {this.chartEtl}
                            </VictoryChart>
                        </g>
                    </svg>
                </div>
            );
        } else {
            return <span>No data to plot.</span>;
        }
    }

    @autobind private onMouseMove(e: React.MouseEvent<any>) {
        this.mousePosition.x = e.pageX;
        this.mousePosition.y = e.pageY;
    }

    private updateLegendWidth() {
        if (this.container) {
            const legend = this.container
                .getElementsByClassName(this.legendClassName)
                .item(0);
            if (legend) {
                this.computedLegendWidth = legend.getBoundingClientRect().width;
            }
        }
    }

    componentDidUpdate() {
        this.updateLegendWidth();
    }

    render() {
        if (!this.data.length) {
            return <div className={'alert alert-info'}>No data to plot.</div>;
        }
        return (
            <div>
                <Observer>{this.getChart}</Observer>
                {this.tooltipComponent}
            </div>
        );
    }
}

type PQValueLabelProps = {
    x: number;
    y: number;
    pValue: number | null;
    qValue: number | null;
};

export const PQValueLabel: React.FunctionComponent<PQValueLabelProps> = props => {
    const pFormatted = formatLabel('p', props.pValue);
    const qFormatted = formatLabel('q', props.qValue);
    return (
        <foreignObject
            x={props.x}
            y={props.y}
            width="100%"
            height="3em"
            style={{ fontSize: '0.8em' }}
        >
            <g
                x={props.x}
                y={props.y}
                style={{ position: 'absolute' }}
                xmlns="http://www.w3.org/1999/xhtml"
            >
                <div className="p-value-label">{pFormatted}</div>
                <div className="q-value-label">{qFormatted}</div>
            </g>
        </foreignObject>
    );

    function formatLabel(name: string, value: number | null) {
        if (value != null) {
            return (
                <>
                    {name}{' '}
                    {toConditionalPrecisionWithMinimum(
                        value,
                        3,
                        0.01,
                        -10,
                        true
                    )}
                </>
            );
        }
        return '';
    }
};
