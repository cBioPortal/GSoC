import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable, observable } from 'mobx';
import { bind } from 'bind-decorator';
import {
    VictoryAxis,
    VictoryBoxPlot,
    VictoryChart,
    VictoryLabel,
    VictoryLegend,
    VictoryScatter,
} from 'victory';
import { IStringAxisData, tableCellTextColor } from './PlotsTabUtils';
import { StringListIndexedMap } from '../../lib/ListIndexedMap';
import naturalSort from 'javascript-natural-sort';
import * as d3Scale from 'd3-scale';
import measureText from 'measure-text';
import {
    CBIOPORTAL_VICTORY_THEME,
    stringListToMap,
} from 'cbioportal-frontend-commons';
import { wrapTick } from 'cbioportal-frontend-commons';
import { iterateOverEntries } from './TablePlotUtils';

export interface ITablePlotProps {
    svgRef?: (elt: SVGElement | null) => void;
    horzData: IStringAxisData['data'];
    vertData: IStringAxisData['data'];
    horzCategoryOrder?: string[];
    vertCategoryOrder?: string[];
    minCellWidth: number;
    minCellHeight: number;
    minChartWidth: number;
    minChartHeight: number;
    axisLabelX?: string;
    axisLabelY?: string;
}

interface ITableData {
    horzCategories: string[];
    vertCategories: string[];
    data: {
        horzCategory: string;
        vertCategory: string;
        count: number;
    }[];
}

interface IVictoryTableCellProps {
    x: number;
    y: number;
    label: string;
    scale?: any; // see Victory scale prop
    rectWidth: number; // cant be named width because VictoryChart passes down width prop
    rectHeight: number; // cant be named height because VictoryChart passes down height prop
    textAnchor: string;
    fontFamily: string;
    fontSize: number;
    cellFill: string;
    textColor: string;
}

const HOT_COLOR = 'rgb(0, 102, 204)';
const COLD_COLOR = 'rgb(255,255,255)';
const CATEGORY_LABEL_HORZ_ANGLE = -70;
const LABEL_GUTTER = 150; // room for axis label
const BOTTOM_GUTTER = LABEL_GUTTER;
const LEFT_PADDING = LABEL_GUTTER;

const CELL_LABEL_PROPS = {
    textAnchor: 'middle',
    fontFamily: 'Verdana, Arial, sans-serif',
    fontSize: 12,
};

class VictoryWrappingTick extends React.Component<any, {}> {
    // props are same as VictoryLabel props, plus "maxWidth"
    render() {
        const { maxWidth, style, text, ...props } = this.props;
        const wrapped = wrapTick(text, maxWidth);
        style.fontSize = 12 - 0.5 * (wrapped.length - 1); // deduct half font point for each additional line
        return <VictoryLabel text={wrapped} style={style} {...props} />;
    }
}

class VictoryTableCell extends React.Component<IVictoryTableCellProps, {}> {
    render() {
        if (!this.props.scale) {
            return null;
        }
        const width = this.props.rectWidth;
        const height = this.props.rectHeight;
        const y = this.props.scale.y(this.props.y) - height / 2;
        const x = this.props.scale.x(this.props.x) - width / 2;
        return (
            <g>
                <rect
                    width={width}
                    height={height}
                    x={x}
                    y={y}
                    style={{
                        fill: this.props.cellFill,
                        stroke: 'rgb(208,208,208)',
                    }}
                />
                <text
                    x={x + width / 2}
                    y={y + height / 2}
                    dy="0.3em"
                    textAnchor={this.props.textAnchor}
                    fill={this.props.textColor}
                    fontFamily={this.props.fontFamily}
                    fontSize={this.props.fontSize}
                >
                    {this.props.label}
                </text>
            </g>
        );
    }
}

@observer
export default class TablePlot extends React.Component<ITablePlotProps, {}> {
    @observable.ref private container: HTMLDivElement;

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @bind
    private containerRef(container: HTMLDivElement) {
        this.container = container;
    }

    @computed get tableData(): ITableData {
        // count by categories
        const tableCounts: StringListIndexedMap<number> = new StringListIndexedMap();
        for (const entry of iterateOverEntries(
            this.props.horzData,
            this.props.vertData
        )) {
            if (entry.horz !== undefined && entry.vert !== undefined) {
                tableCounts.set(
                    (tableCounts.get(entry.horz, entry.vert) || 0) + 1,
                    entry.horz,
                    entry.vert
                );
            }
        }

        // produce data and collect categories
        const horzCategoriesMap: { [cat: string]: boolean } = {};
        const vertCategoriesMap: { [cat: string]: boolean } = {};
        const data = tableCounts.entries().map(entry => {
            const horzCategory = entry.key[0];
            const vertCategory = entry.key[1];
            horzCategoriesMap[horzCategory] = true;
            vertCategoriesMap[vertCategory] = true;
            return {
                horzCategory,
                vertCategory,
                count: entry.value,
            };
        });

        // sort categories
        let horzCategories: string[];
        if (this.props.horzCategoryOrder) {
            horzCategories = this.props.horzCategoryOrder.filter(
                c => !!horzCategoriesMap[c]
            );
        } else {
            horzCategories = Object.keys(horzCategoriesMap);
            horzCategories.sort(naturalSort);
        }

        let vertCategories: string[];
        if (this.props.vertCategoryOrder) {
            vertCategories = this.props.vertCategoryOrder.filter(
                c => !!vertCategoriesMap[c]
            );
        } else {
            vertCategories = Object.keys(vertCategoriesMap);
            vertCategories.sort(naturalSort);
        }

        // add missing data
        for (const horzCategory of horzCategories) {
            for (const vertCategory of vertCategories) {
                if (!tableCounts.has(horzCategory, vertCategory)) {
                    data.push({
                        horzCategory,
                        vertCategory,
                        count: 0,
                    });
                }
            }
        }

        return {
            horzCategories,
            vertCategories: vertCategories.reverse(), // reverse vert category order for inverted svg y axis
            data,
        };
    }

    @computed get dataRange(): { min: number; max: number } {
        let min = Number.POSITIVE_INFINITY;
        let max = Number.NEGATIVE_INFINITY;
        for (const d of this.tableData.data) {
            min = Math.min(min, d.count);
            max = Math.max(max, d.count);
        }

        return { min, max };
    }

    @computed get getCellColor(): (val: number) => string {
        if (!this.tableData.data.length) {
            return () => COLD_COLOR;
        }
        return d3Scale
            .scaleLinear<string>()
            .domain([this.dataRange.min, this.dataRange.max])
            .range([COLD_COLOR, HOT_COLOR]);
    }

    @computed get getTextColor(): (val: number) => string {
        if (!this.tableData.data.length) {
            return () => 'rgb(0,0,0)';
        }
        const dataRange = this.dataRange;
        return (val: number) =>
            tableCellTextColor(val, dataRange.min, dataRange.max);
    }

    private getCellCoordinates(horzCategory: string, vertCategory: string) {
        return {
            x: this.horzTickValueMap[horzCategory],
            y: this.vertTickValueMap[vertCategory],
        };
    }

    @computed get chartWidth() {
        return Math.max(
            this.tableData.horzCategories.length * this.cellWidth +
                LEFT_PADDING +
                2 * this.cellWidth,
            this.props.minChartWidth
        );
    }

    @computed get chartHeight() {
        return Math.max(
            this.tableData.vertCategories.length * this.cellHeight +
                BOTTOM_GUTTER +
                2 * this.cellHeight,
            this.props.minChartHeight
        );
    }

    @computed get svgWidth() {
        return LEFT_PADDING + this.chartWidth;
    }

    @computed get svgHeight() {
        return this.chartHeight + BOTTOM_GUTTER;
    }

    @bind
    private formatTickHorz(t: number, index: number) {
        return this.formatTickHelper(true, index);
    }

    @bind
    private formatTickVert(t: number, index: number) {
        return this.formatTickHelper(false, index);
    }

    private formatTickHelper(horzAxis: boolean, index: number) {
        const labels = horzAxis
            ? this.tableData.horzCategories
            : this.tableData.vertCategories;
        return labels[index];
    }

    @computed get horzAxis() {
        return (
            <VictoryAxis
                orientation="bottom"
                offsetY={50}
                crossAxis={false}
                label={this.props.axisLabelX}
                tickValues={this.horzTickValues}
                tickFormat={this.formatTickHorz}
                tickLabelComponent={
                    <VictoryWrappingTick
                        angle={CATEGORY_LABEL_HORZ_ANGLE}
                        verticalAnchor={'middle'}
                        textAnchor={'end'}
                        maxWidth={LABEL_GUTTER - 30}
                    />
                }
                axisLabelComponent={
                    <VictoryLabel
                        dy={BOTTOM_GUTTER - 20 /* leave more room for labels */}
                    />
                }
            />
        );
    }

    @computed get vertAxis() {
        return (
            <VictoryAxis
                orientation="left"
                offsetX={50}
                crossAxis={false}
                label={this.props.axisLabelY}
                dependentAxis={true}
                tickValues={this.vertTickValues}
                tickFormat={this.formatTickVert}
                tickLabelComponent={
                    <VictoryWrappingTick maxWidth={LABEL_GUTTER - 30} />
                }
                axisLabelComponent={
                    <VictoryLabel
                        dy={-1 * LEFT_PADDING /* leave more room for labels */}
                    />
                }
            />
        );
    }

    @computed get horzTickValueMap() {
        return stringListToMap(this.tableData.horzCategories, (c, i) => i + 1);
    }
    @computed get vertTickValueMap() {
        return stringListToMap(this.tableData.vertCategories, (c, i) => i + 1);
    }
    @computed get horzTickValues() {
        return this.tableData.horzCategories.map(x => this.horzTickValueMap[x]);
    }
    @computed get vertTickValues() {
        return this.tableData.vertCategories.map(x => this.vertTickValueMap[x]);
    }

    @computed get cellHeight() {
        return Math.max(20, this.props.minCellHeight);
    }

    @computed get cellWidth() {
        const padding = 10;
        const computedWidth =
            measureText({
                text: this.dataRange.max + '',
                fontFamily: CELL_LABEL_PROPS.fontFamily,
                fontSize: CELL_LABEL_PROPS.fontSize,
                lineHeight: 1,
            }).width.value +
            2 * padding;
        return Math.max(computedWidth, this.props.minCellWidth);
    }

    @computed get domain() {
        return {
            x: [0, this.tableData.horzCategories.length + 1],
            y: [0, this.tableData.vertCategories.length + 1],
        };
    }

    render() {
        if (!this.tableData.data.length) {
            return <div className={'alert alert-info'}>No data to plot.</div>;
        }
        const cellElements = this.tableData.data.map(d => {
            const { horzCategory, vertCategory, count } = d;
            const coords = this.getCellCoordinates(horzCategory, vertCategory);
            return (
                <VictoryTableCell
                    key={`${horzCategory},${vertCategory},rect`}
                    rectWidth={this.cellWidth}
                    rectHeight={this.cellHeight}
                    x={coords.x}
                    y={coords.y}
                    label={`${count}`}
                    cellFill={this.getCellColor(count)}
                    textColor={this.getTextColor(count)}
                    textAnchor={CELL_LABEL_PROPS.textAnchor}
                    fontFamily={CELL_LABEL_PROPS.fontFamily}
                    fontSize={CELL_LABEL_PROPS.fontSize}
                />
            );
        });
        return (
            <div>
                <div
                    ref={this.containerRef}
                    style={{ width: this.svgWidth, height: this.svgHeight }}
                >
                    <svg
                        ref={this.props.svgRef}
                        style={{
                            width: this.svgWidth,
                            height: this.svgHeight,
                            pointerEvents: 'all',
                        }}
                        height={this.svgHeight}
                        width={this.svgWidth}
                        role="img"
                        viewBox={`0 0 ${this.svgWidth} ${this.svgHeight}`}
                    >
                        <g transform={`translate(${LEFT_PADDING}, 0)`}>
                            <VictoryChart
                                theme={CBIOPORTAL_VICTORY_THEME}
                                width={this.chartWidth}
                                height={this.chartHeight}
                                standalone={false}
                                domain={this.domain}
                                domainPadding={{
                                    x: this.cellWidth,
                                    y: this.cellHeight,
                                }}
                            >
                                {this.horzAxis}
                                {this.vertAxis}
                                {cellElements}
                            </VictoryChart>
                        </g>
                    </svg>
                </div>
            </div>
        );
    }
}
