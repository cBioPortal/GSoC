import * as React from 'react';
import _ from 'lodash';
import {
    VictoryBar,
    VictoryAxis,
    VictoryLabel,
    VictoryTooltip,
    Bar,
    VictoryZoomContainer,
    VictoryChart,
} from 'victory';
import { action, computed, observable, reaction } from 'mobx';
import { observer } from 'mobx-react';
import { IMutationalCounts } from 'shared/model/MutationalSignature';
import {
    getColorsForSignatures,
    IColorDataBar,
    getLegendEntriesBarChart,
    getxScalePoint,
    DrawRectInfo,
    LabelInfo,
    getLengthLabelEntries,
    createLegendLabelObjects,
    formatLegendObjectsForRectangles,
    getCenterPositionLabelEntries,
    DataToPlot,
    addColorsForReferenceData,
} from './MutationalSignatureBarChartUtils';
import { CBIOPORTAL_VICTORY_THEME } from 'cbioportal-frontend-commons';

export interface IMutationalBarChartProps {
    signature: string;
    height: number;
    width: number;
    refStatus: boolean;
    svgId: string;
    svgRef?: (svgContainer: SVGElement | null) => void;
    data: IMutationalCounts[];
    version: string;
    sample: string;
    label: string;
    selectedScale: string;
    initialReference: string;
    updateReference: boolean;
    domainMaxPercentage: number;
}

const theme = _.cloneDeep(CBIOPORTAL_VICTORY_THEME);
theme.legend.style.data = {
    type: 'square',
    size: 5,
    strokeWidth: 0,
    stroke: 'black',
};
type FrequencyData = { channel: string; frequency: number };

const cosmicReferenceData = require('./cosmic_reference.json');
const offSetYAxis = 45;
const heightYAxis = 300;

const replaceLabels = [
    'Homopolymer length',
    'Homopolymer length',
    'Number of repeat units',
    'Number of repeat units',
    'Microhomology',
];
@observer
export default class MutationalBarChart extends React.Component<
    IMutationalBarChartProps,
    {}
> {
    constructor(props: IMutationalBarChartProps) {
        super(props);
        reaction(
            () => this.props.width,
            newWidth => {
                this.graphWidth = newWidth;
            }
        );
    }
    @observable svgWidth = this.props.width;
    @observable svgHeight: number = 350;
    @observable graphWidth = this.props.width - 50;

    @computed get xTickLabels(): string[] {
        return getColorsForSignatures(
            this.props.data,
            this.props.selectedScale
        ).map(item => item.label);
    }

    // this represents what percentage of the domain to render
    // e.g. if it's 50% and the domain is 0 to 220, we show 0 to 110
    @computed get domainMaxPercentage() {
        let perc = this.props.domainMaxPercentage;

        if (perc < 100 && perc > 80) {
            perc = 80;
        }

        if (perc <= 1) {
            return 1;
        } else {
            // always make sure that the ticks are integers so that
            // we get proper set of ticks
            const ceil = Math.ceil(perc / 20) * 20;

            //return 100;
            return ceil || 100;
        }
    }

    @computed get cosmicYAxisDomain() {
        if (this.props.selectedScale === '%') {
            const ceil = Math.ceil(this.props.domainMaxPercentage / 10) * 10;
            return [ceil * -1, 0];
        } else {
            // this is confusing but if we're in absolute mode
            // this chart is always y=percentage and so we
            // don't want it to respond to scale slider
            return [-100, 0];
        }
    }

    @computed get yAxisDomain(): number[] {
        if (this.props.selectedScale == '%') {
            return [0, this.domainMaxPercentage];
        } else {
            const maxValue = this.props.data.reduce(
                (previous: IMutationalCounts, current: IMutationalCounts) => {
                    return current.value > previous.value ? current : previous;
                }
            );

            if (maxValue.value !== 0) {
                // we need the value to be a multiple of 10 so that we will always have a
                // ticket at the top of the y axis and it can have a label of >=
                // this allows us to accomodate then we are zoomed and bars
                // need to overflow the chart
                return [
                    0,
                    Math.ceil(
                        (maxValue.value * this.domainMaxPercentage) / 100 / 10
                    ) * 10,
                ];
            } else {
                return [0, 10];
            }
        }
    }

    @computed get getGroupedData() {
        if (this.props.data[0].mutationalSignatureLabel != '') {
            return _.groupBy(
                getColorsForSignatures(
                    this.props.data,
                    this.props.selectedScale
                ),
                'group'
            );
        } else {
            return this.props.data;
        }
    }
    @computed get getMutationalSignaturesGroupLabels(): string[] {
        return Object.keys(this.getGroupedData);
    }

    @computed get formatLegendTopAxisPoints() {
        const legendOjbectsToAdd = createLegendLabelObjects(
            this.centerPositionLabelEntries,
            this.getLegendObjects,
            this.getMutationalSignaturesGroupLabels
        );
        const centerOfBoxes = this.colorRectangles;
        const xScale = this.getXScale;
        return legendOjbectsToAdd.map((item, i) => {
            return (
                <VictoryLabel
                    x={
                        this.props.version != 'ID'
                            ? centerOfBoxes[i].props.x +
                              0.5 * centerOfBoxes[i].props.width
                            : xScale(item.value)! + 25
                    }
                    y={8}
                    width={this.graphWidth}
                    text={item.group}
                    style={{
                        fontSize: 14,
                        padding: 5,
                        fontWeight: 'bold',
                        fontFamily: theme.legend.style.labels.fontFamily,
                    }}
                    textAnchor={'middle'}
                />
            );
        });
    }

    @computed get labelObjects() {
        return getColorsForSignatures(
            this.props.data,
            this.props.selectedScale
        ).map(entry => ({
            group: entry.group,
            label: entry.mutationalSignatureLabel,
            color: entry.colorValue,
            subcategory: entry.subcategory,
            value: entry.label,
        }));
    }

    @computed get legendInfo() {
        const centerPositionLabelEntries = getLengthLabelEntries(
            this.getLegendObjects
        );
        return formatLegendObjectsForRectangles(
            centerPositionLabelEntries,
            this.getLegendObjects,
            this.getMutationalSignaturesGroupLabels,
            this.props.version,
            'subcategory'
        );
    }

    @computed get getXScale() {
        return getxScalePoint(this.labelObjects, 65, this.graphWidth - 45);
    }

    @computed get colorRectangles() {
        const legendInfoBoxes = this.legendInfo;
        const legendRectsChart: JSX.Element[] = [];
        const xScale = this.getXScale;
        legendInfoBoxes.forEach((item: DrawRectInfo) => {
            legendRectsChart.push(
                <rect
                    x={xScale(item.start)}
                    y={15}
                    fill={item.color}
                    width={
                        xScale(item.end)! - xScale(item.start)! > 0
                            ? xScale(item.end)! - xScale(item.start)! + 12
                            : 15
                    }
                    height="20"
                />
            );
        });
        return legendRectsChart;
    }

    @computed get uniqueLabelsForRectangles() {
        return this.labelObjects
            .filter(
                (value, index, self) =>
                    index ===
                    self.findIndex(
                        t =>
                            t.group === value.group &&
                            t.subcategory === value.subcategory
                    )
            )
            .map(item => {
                if (
                    item.group === '>1bp deletion' ||
                    item.group === '>1bp insertion' ||
                    item.group === 'Microhomology'
                ) {
                    item.subcategory == '5'
                        ? (item.subcategory = '5+')
                        : item.subcategory;
                }
                return item;
            });
    }

    @computed get getSubLabelsForRectangles() {
        const coloredBoxes = this.colorRectangles;
        const subLabelsForBoxes = formatLegendObjectsForRectangles(
            [this.uniqueLabelsForRectangles.length],
            this.uniqueLabelsForRectangles,
            this.uniqueLabelsForRectangles.map(item => item.subcategory!),
            this.props.version,
            'subcategory'
        );
        const legendLabelsChart: JSX.Element[] = [];
        subLabelsForBoxes.forEach((item: LabelInfo) => {
            legendLabelsChart.push(
                <VictoryLabel
                    x={
                        coloredBoxes.filter(x => x.props.fill === item.color)[0]
                            .props.x +
                        0.5 *
                            coloredBoxes.filter(
                                x => x.props.fill === item.color
                            )[0].props.width
                    }
                    y={25}
                    width={this.graphWidth}
                    text={item.category}
                    style={{ fontSize: 14, fontWeight: 'bold' }}
                    textAnchor={'middle'}
                />
            );
        });
        return legendLabelsChart;
    }

    @computed get getLegendObjects() {
        return getLegendEntriesBarChart(this.labelObjects);
    }

    @computed get centerPositionLabelEntries() {
        return getCenterPositionLabelEntries(this.getLegendObjects);
    }

    @computed get legendObjectsToAdd() {
        return createLegendLabelObjects(
            this.centerPositionLabelEntries,
            this.getLegendObjects,
            this.getMutationalSignaturesGroupLabels
        );
    }

    @computed get xAxisLabelsInDel() {
        const lengthLegendObjects = getCenterPositionLabelEntries(
            this.getLegendObjects
        );
        const legendOjbectsToAdd = createLegendLabelObjects(
            lengthLegendObjects,
            this.getLegendObjects,
            this.getMutationalSignaturesGroupLabels
        );
        const xScale = this.getXScale;
        return legendOjbectsToAdd.map((item, i) => {
            return (
                <VictoryLabel
                    x={xScale(item.value)! + 25}
                    y={310}
                    width={this.graphWidth}
                    text={replaceLabels[i]}
                    style={{ fontSize: 14, padding: 5, fontWeight: 'bold' }}
                    textAnchor={'middle'}
                />
            );
        });
    }

    @computed get formatLabelsCosmicStyle(): string[] {
        const labels = this.getLabels(this.props.data);
        const cosmicLabel: string[] = [];
        if (this.props.version == 'SBS') {
            labels.map(label => {
                const labelSplit = label
                    .split('_')
                    .map((x, i) => {
                        return i == 1 ? x.split('-')[0] : x;
                    })
                    .join('');
                cosmicLabel.push(labelSplit);
            });
        } else if (this.props.version == 'DBS') {
            labels.map(label => {
                cosmicLabel.push(label.split('-')[1]);
            });
        } else if (this.props.version == 'ID') {
            labels.map(label => {
                const labelSplit = label.split('_');
                if (labelSplit.includes('Ins')) {
                    labelSplit[3] == '5'
                        ? cosmicLabel.push('6+')
                        : cosmicLabel.push(
                              (Number(labelSplit[3]) + 1).toString()
                          );
                } else {
                    cosmicLabel.push(labelSplit[3]);
                }
            });
        }
        return cosmicLabel;
    }

    @computed get getReferenceSignatureToPlot() {
        const currentSignature: string =
            typeof this.props.signature !== 'undefined'
                ? this.props.signature.split(' ')[0]
                : this.props.initialReference.split(' ')[0];
        const referenceSignatureToPlot: FrequencyData[] =
            cosmicReferenceData['v3.3']['GRCh37'][this.props.version][
                currentSignature
            ];
        const referenceData: DataToPlot[] = referenceSignatureToPlot.map(
            (sig: FrequencyData) => {
                return {
                    mutationalSignatureLabel: sig.channel,
                    value: -1 * (sig.frequency * 100),
                };
            }
        );
        const referenceSorted = this.sortReferenceSignatures(referenceData);
        return addColorsForReferenceData(referenceSorted);
    }

    @computed get colorBoxXAxis() {
        const legendLabels = getColorsForSignatures(
            this.props.data,
            this.props.selectedScale
        ).map(entry => ({
            group: entry.group,
            label: entry.mutationalSignatureLabel,
            color: entry.colorValue,
            subcategory: entry.subcategory,
        }));
        const xScale = this.getXScale;
        const legendEntries = getLegendEntriesBarChart(legendLabels);
        const lengthLegendObjects = getLengthLabelEntries(legendEntries);
        const legendInfoBoxes = formatLegendObjectsForRectangles(
            lengthLegendObjects,
            legendEntries,
            this.getMutationalSignaturesGroupLabels,
            this.props.version,
            'subcategory'
        );
        const legendRectsChart: JSX.Element[] = [];
        legendInfoBoxes.forEach((item: DrawRectInfo, index: number) => {
            legendRectsChart.push(
                <rect
                    x={xScale(item.start)}
                    y={280}
                    fill={item.color}
                    width={
                        xScale(item.end)! - xScale(item.start)! > 0
                            ? xScale(item.end)! - xScale(item.start)! + 12
                            : 15
                    }
                    height="20"
                />
            );
        });
        return legendRectsChart;
    }

    @action getLabels(data: IMutationalCounts[]): string[] {
        return getColorsForSignatures(data, this.props.selectedScale).map(
            item => item.mutationalSignatureLabel
        );
    }
    @action.bound
    private renderCustomTickLabel = (tickProps: any) => {
        const { x, y, index, text } = tickProps;
        const secondLetter = text.charAt(1);
        const colors: string[] = this.labelObjects.map(item => item.color);
        const coloredText =
            this.props.version === 'SBS' &&
            (secondLetter === 'C' || secondLetter === 'T') ? (
                <tspan fill={colors[index]}>{secondLetter}</tspan>
            ) : (
                <tspan fill="black">{secondLetter}</tspan>
            );

        return (
            <text
                x={x}
                y={y}
                dy={0}
                textAnchor={this.props.version == 'ID' ? 'middle' : 'start'}
                dominantBaseline="middle"
                transform={
                    this.props.version !== 'ID'
                        ? `rotate(270, ${x}, ${y})`
                        : `rotate(0, ${x}, ${y})`
                }
                style={{ fontSize: 12 }}
            >
                {text.charAt(0)}
                {coloredText}
                {text.substring(2)}
            </text>
        );
    };

    @computed get labelOrder() {
        return getColorsForSignatures(
            this.props.data,
            this.props.selectedScale
        ).map(item => item.mutationalSignatureLabel, this.props.selectedScale);
    }

    @action sortReferenceSignatures(referenceData: DataToPlot[]) {
        const labelsOrder = getColorsForSignatures(
            this.props.data,
            this.props.selectedScale
        ).map(item => item.mutationalSignatureLabel, this.props.selectedScale);
        const referenceOrder = referenceData.map(
            (itemReference: any) => itemReference.mutationalSignatureLabel
        );
        if (_.isEqual(labelsOrder, referenceOrder)) {
            return referenceData;
        } else {
            const sorted = referenceData.sort(
                (a: DataToPlot, b: DataToPlot) => {
                    return (
                        labelsOrder.findIndex(
                            p => p === a.mutationalSignatureLabel
                        ) -
                        labelsOrder.findIndex(
                            p => p === b.mutationalSignatureLabel
                        )
                    );
                }
            );
            return sorted;
        }
    }

    @computed get heightReferenceAxis() {
        //Make sure that the height of the table
        if (!this.props.updateReference) {
            return 0;
        } else {
            return heightYAxis;
        }
    }

    @computed get heightSvgElement() {
        if (!this.props.updateReference) {
            return 300;
        } else {
            return 550;
        }
    }

    @computed get referenceAxisLabel() {
        const referenceString = `COSMIC Reference`;
        return this.props.version === 'SBS'
            ? referenceString + '\n' + this.props.signature + ' (%)'
            : this.props.version === 'DBS'
            ? referenceString + '\n' + this.props.signature + ' (%)'
            : referenceString + '\n' + this.props.signature + ' (%)';
    }

    @action getTranslateDistance(defaultValue: number): number {
        return this.props.version == 'SBS'
            ? defaultValue - 10
            : this.props.version == 'DBS'
            ? defaultValue - 15
            : defaultValue - 25;
    }

    public render() {
        return (
            <div
                style={{
                    paddingTop: 20,
                    paddingLeft: 10,
                    paddingRight: 10,
                    width: 1500,
                }}
            >
                <svg
                    height={this.heightSvgElement}
                    width={this.svgWidth}
                    xmlns="http://www.w3.org/2000/svg"
                    ref={this.props.svgRef}
                >
                    {this.formatLegendTopAxisPoints}
                    {this.colorRectangles}
                    {this.props.version == 'ID' &&
                        this.getSubLabelsForRectangles}
                    <g transform={'translate(20,0)'}>
                        <VictoryAxis
                            dependentAxis
                            label={this.props.label}
                            domain={this.yAxisDomain}
                            tickFormat={(...args: any) => {
                                const val = args[0];
                                if (Number.isInteger(val)) {
                                    if (val >= this.yAxisDomain[1]) {
                                        if (
                                            this.props.selectedScale === '%' &&
                                            val === 100
                                        ) {
                                            return val.toFixed(0);
                                        } else {
                                            return `>=${val.toFixed(0)}`;
                                        }
                                    } else {
                                        return val.toFixed(0);
                                    }
                                } else {
                                    return '';
                                }
                            }}
                            height={300}
                            width={this.graphWidth + 45}
                            offsetX={offSetYAxis}
                            style={{
                                paddingTop: 20,
                                paddingLeft: 20,
                                paddingRight: 20,
                                axis: { strokeWidth: 1 },
                                axisLabel: {
                                    fontFamily:
                                        theme.bar.style.labels.fontFamily,
                                    padding: 40,
                                    letterSpacing: 'normal',
                                },
                                ticks: { size: 5, stroke: 'black' },
                                tickLabels: {
                                    fontFamily:
                                        theme.bar.style.labels.fontFamily,
                                    padding: 2,
                                    fontSize: 10,
                                },
                                grid: {
                                    stroke: 'lightgrey',
                                    strokeWidth: 0.3,
                                    strokeDasharray: 10.5,
                                },
                            }}
                            standalone={false}
                        />
                    </g>
                    {this.props.updateReference && (
                        <g
                            transform={
                                'translate(20,' +
                                this.getTranslateDistance(
                                    this.props.version == 'ID' ? 300 : 250
                                ) +
                                ')'
                            }
                        >
                            <VictoryAxis
                                dependentAxis
                                orientation="left"
                                invertAxis
                                label={this.referenceAxisLabel}
                                domain={this.cosmicYAxisDomain}
                                tickFormat={(...args: any) => {
                                    const val = args[0];
                                    if (Number.isInteger(val)) {
                                        if (val <= this.cosmicYAxisDomain[0]) {
                                            // values in this chart cannot be over 100 since they are
                                            // always percentages
                                            const pre =
                                                Math.abs(val) < 100 ? '>=' : '';
                                            return `${pre}${Math.abs(
                                                val.toFixed(0)
                                            )}%`;
                                        } else {
                                            // note that this axis is ALWAYS percent regardless
                                            // of the user selection
                                            return (
                                                Math.abs(val.toFixed(0)) + '%'
                                            );
                                        }
                                    } else {
                                        return '';
                                    }
                                }}
                                offsetX={offSetYAxis}
                                height={this.heightReferenceAxis}
                                width={this.graphWidth}
                                style={{
                                    paddingTop: 20,
                                    paddingLeft: 20,
                                    axis: { strokeWidth: 1 },
                                    axisLabel: {
                                        fontFamily:
                                            theme.bar.style.labels.fontFamily,
                                        padding: 30,
                                        letterSpacing: 'normal',
                                    },
                                    ticks: { size: 5, stroke: 'black' },
                                    tickLabels: {
                                        fontFamily:
                                            theme.bar.style.labels.fontFamily,
                                        padding: 2,
                                        fontSize: 10,
                                    },
                                    grid: {
                                        stroke: 'lightgrey',
                                        strokeWidth: 0.3,
                                        strokeDasharray: 10,
                                    },
                                }}
                                standalone={false}
                            />
                        </g>
                    )}
                    <g
                        transform={
                            'translate(20,' + this.getTranslateDistance(0) + ')'
                        }
                    >
                        <VictoryAxis
                            tickValues={this.formatLabelsCosmicStyle}
                            width={this.graphWidth}
                            style={{
                                paddingTop: 20,
                                paddingLeft: 20,
                                axisLabel: {
                                    fontFamily:
                                        theme.bar.style.labels.fontFamily,
                                    fontSize: 8,
                                    padding: 20,
                                },
                                tickLabels: {
                                    fontFamily:
                                        theme.bar.style.labels.fontFamily,
                                    fontSize: 10,
                                    padding: 40,
                                    angle:
                                        this.props.version === 'ID' ? 0 : 270,
                                    textAnchor:
                                        this.props.version === 'ID'
                                            ? 'middle'
                                            : 'start',
                                    verticalAnchor: 'middle',
                                },
                                axis: { strokeWidth: 0 },
                                grid: { stroke: 0 },
                            }}
                            tickLabelComponent={<this.renderCustomTickLabel />}
                            standalone={false}
                        />
                    </g>
                    <g transform={'translate(20,0)'}>
                        <VictoryBar
                            barRatio={1}
                            barWidth={7}
                            width={this.graphWidth}
                            domain={{ y: this.yAxisDomain }}
                            height={heightYAxis}
                            labels={this.formatLabelsCosmicStyle}
                            labelComponent={
                                <VictoryTooltip
                                    style={{
                                        fontFamily:
                                            theme.tooltip.style.fontFamily,
                                        fontSize: 10,
                                        whiteSpace: 'normal',
                                        wordWrap: 'break-word',
                                    }}
                                    cornerRadius={3}
                                    pointerLength={0}
                                    flyoutStyle={{
                                        stroke: '#bacdd8',
                                        strokeWidth: 1,
                                        fill: 'white',
                                    }}
                                />
                            }
                            alignment="middle"
                            data={getColorsForSignatures(
                                this.props.data,
                                this.props.selectedScale
                            )}
                            x="mutationalSignatureLabel"
                            y={
                                // this determines the height of the bars
                                // if the a bar exceeds the y domain limit, trim it to the limit
                                // so that the bars don't overflow the chart
                                (d: any) => {
                                    if (this.props.selectedScale === '%') {
                                        return d.percentage >=
                                            this.yAxisDomain[1]
                                            ? this.yAxisDomain[1]
                                            : d.percentage;
                                    } else {
                                        return d.value >= this.yAxisDomain[1]
                                            ? this.yAxisDomain[1]
                                            : d.value;
                                    }
                                }
                            }
                            style={{
                                paddingTop: 30,
                                paddingLeft: 30,
                                paddingRight: 30,
                                fontFamily: theme.bar.style.labels.fontFamily,
                                data: {
                                    fill: (d: IColorDataBar) => d.colorValue,
                                },
                            }}
                            standalone={false}
                        ></VictoryBar>
                    </g>
                    {/*{!this.props.updateReference && (*/}
                    {/*    <g*/}
                    {/*        transform={*/}
                    {/*            'translate(' +*/}
                    {/*            this.getTranslateDistance(*/}
                    {/*                (this.graphWidth - 200) / 2*/}
                    {/*            ) +*/}
                    {/*            ',' +*/}
                    {/*            this.getTranslateDistance(350) +*/}
                    {/*            ')'*/}
                    {/*        }*/}
                    {/*    >*/}
                    {/*        <text style={{ border: '2px solid #ccc' }}>*/}
                    {/*            Select a signature from the table to show the*/}
                    {/*            reference signature plot*/}
                    {/*        </text>*/}
                    {/*    </g>*/}
                    {/*)}*/}
                    {this.props.version == 'ID' && this.colorBoxXAxis}
                    {this.props.version == 'ID' && this.xAxisLabelsInDel}
                    {this.props.updateReference && (
                        <g
                            transform={
                                'translate(20,' +
                                this.getTranslateDistance(
                                    this.props.version == 'ID' ? 300 : 250
                                ) +
                                ')'
                            }
                        >
                            <VictoryBar
                                barRatio={1}
                                barWidth={7}
                                width={this.graphWidth}
                                height={this.heightReferenceAxis}
                                domain={{ y: this.cosmicYAxisDomain }}
                                data={this.getReferenceSignatureToPlot}
                                x="label"
                                y={
                                    // this determines the height of the bars
                                    // if the a bar exceeds the y domain limit, trim it to the limit
                                    // so that the bars don't overflow the chart
                                    (d: any) => {
                                        if (
                                            d.value < this.cosmicYAxisDomain[0]
                                        ) {
                                            return this.cosmicYAxisDomain[0];
                                        } else {
                                            return d.value;
                                        }
                                    }
                                }
                                style={{
                                    paddingTop: 20,
                                    paddingLeft: 20,
                                    fontFamily:
                                        theme.bar.style.labels.fontFamily,
                                    data: {
                                        fill: (d: IColorDataBar) =>
                                            d.colorValue,
                                    },
                                }}
                                alignment="middle"
                                labels={this.formatLabelsCosmicStyle}
                                labelComponent={
                                    <VictoryTooltip
                                        style={{ fontSize: 10 }}
                                        cornerRadius={3}
                                        pointerLength={0}
                                        flyoutStyle={{
                                            fontFamily:
                                                theme.tooltip.style.fontFamily,
                                            stroke: '#bacdd8',
                                            strokeWidth: 1,
                                            fill: 'white',
                                        }}
                                        orientation={'bottom'}
                                        text={(d: any) => {
                                            const txt = d?.mutationalSignatureLabel.replace(
                                                /[-_]/g,
                                                ''
                                            );
                                            return `${txt} ${Math.round(
                                                Math.abs(d.value)
                                            )}%`;
                                        }}
                                    />
                                }
                                standalone={false}
                            />
                        </g>
                    )}
                </svg>
            </div>
        );
    }
}
