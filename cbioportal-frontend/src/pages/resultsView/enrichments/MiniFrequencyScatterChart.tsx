import * as React from 'react';
import { Observer, observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import autobind from 'autobind-decorator';
import {
    VictoryAxis,
    VictoryChart,
    VictoryLabel,
    VictoryScatter,
    VictorySelectionContainer,
    VictoryLine,
} from 'victory';
import { Popover } from 'react-bootstrap';
import { formatLogOddsRatio } from '../../../shared/lib/FormatUtils';
import { toConditionalPrecision } from '../../../shared/lib/NumberUtils';
import SelectionComponent from './SelectionComponent';
import HoverablePoint from './HoverablePoint';
import {
    axisLabelStyles,
    CBIOPORTAL_VICTORY_THEME,
    DownloadControlOption,
    DownloadControls,
    getTextWidth,
    truncateWithEllipsis,
} from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';

export interface IMiniFrequencyScatterChartData {
    x: number;
    y: number;
    pValue: number;
    qValue: number;
    hugoGeneSymbol: string;
    logRatio: number;
}

export interface IMiniFrequencyScatterChartProps {
    data: IMiniFrequencyScatterChartData[]; // x means percent in x group, y means percent in y group
    xGroupName: string;
    yGroupName: string;
    onGeneNameClick: (hugoGeneSymbol: string, entrezGeneId: number) => void;
    onSelection: (hugoGeneSymbols: string[]) => void;
    onSelectionCleared: () => void;
    selectedGenesSet: { [hugoGeneSymbol: string]: any };
    yAxisLablePrefix?: string;
}

const MAX_DOT_SIZE = 10;

@observer
export default class MiniFrequencyScatterChart extends React.Component<
    IMiniFrequencyScatterChartProps,
    {}
> {
    @observable tooltipModel: any;
    @observable private svgContainer: any;
    private dragging = false;

    constructor(props: IMiniFrequencyScatterChartProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    private svgRef(svgContainer: SVGElement | null) {
        this.svgContainer =
            svgContainer && svgContainer.children
                ? svgContainer.children[0]
                : null;
    }

    private handleSelection(points: any, bounds: any, props: any) {
        this.props.onSelection(
            points[0].data.map((d: any) => d.hugoGeneSymbol)
        );
    }

    private handleSelectionCleared() {
        if (this.tooltipModel) {
            this.props.onGeneNameClick(
                this.tooltipModel.datum.hugoGeneSymbol,
                this.tooltipModel.datum.entrezGeneId
            );
        }
        this.props.onSelectionCleared();
    }

    @computed get maxLabelWidth() {
        const totalLabelWidths =
            getTextWidth(this.props.xGroupName, 'Arial', '13px') +
            getTextWidth(this.props.yGroupName, 'Arial', '13px');

        if (totalLabelWidths > 150) {
            return 75;
        } else {
            return 90;
        }
    }

    @computed get xLabel() {
        return `Altered Frequency in ${truncateWithEllipsis(
            this.props.xGroupName,
            this.maxLabelWidth,
            'Arial',
            '13px'
        )} (%)`;
    }

    @computed get yLabel() {
        const prefix = this.props.yAxisLablePrefix || 'Altered Frequency';
        return `${prefix} in ${truncateWithEllipsis(
            this.props.yGroupName,
            this.maxLabelWidth,
            'Arial',
            '13px'
        )} (%)`;
    }

    /*@computed get size() {
        const leastSignificantQ = 0.2;
        const leastSignificantSize = 1;
        const mostSignificantSize = 5;
        const mostSignificantQ = 0.01;

        // coefficients derived to fit f(x) = ae^bx so that f(least significant Q) = least significant size, f(most significant Q) = most significant size
        const a = leastSignificantSize;
        const b = (Math.log(mostSignificantSize) - Math.log(leastSignificantSize)) / (mostSignificantQ - leastSignificantQ);

        return (d:IMiniFrequencyScatterChartData)=>{
            // first clamp the input
            let q = d.qValue;
            if (q > leastSignificantQ) {
                q = leastSignificantQ;
            } else if (q < mostSignificantQ) {
                q = mostSignificantQ;
            }

            return a * Math.exp(b * (q - leastSignificantQ));
        };
    }*/

    @computed get splitData() {
        const significant = [];
        const insignificant = [];
        for (const d of this.props.data) {
            if (d.qValue < 0.05) {
                significant.push(d);
            } else {
                insignificant.push(d);
            }
        }
        return { significant, insignificant };
    }

    @computed get plotDomainMax() {
        let maxX = 0;
        let maxY = 0;
        for (const d of this.props.data) {
            maxX = Math.max(maxX, d.x);
            maxY = Math.max(maxY, d.y);
        }
        return Math.max(maxX, maxY);
    }

    private get containerComponent() {
        return (
            <VictorySelectionContainer
                containerRef={this.svgRef}
                onSelection={(points: any, bounds: any, props: any) => {
                    return this.handleSelection(points, bounds, props);
                }}
                responsive={false}
                onSelectionCleared={this.handleSelectionCleared}
                activateSelectedData={false}
                selectionComponent={
                    <SelectionComponent
                        onRender={this.onSelectionComponentRender}
                    />
                }
            />
        );
    }

    @action.bound private onMouseOver(datum: any, x: number, y: number) {
        this.tooltipModel = {
            datum,
            x,
            y,
        };
    }

    @action.bound private onMouseOut() {
        this.tooltipModel = null;
    }

    @autobind private getTooltip() {
        if (this.tooltipModel) {
            return (
                <Popover
                    className={'cbioTooltip'}
                    positionLeft={this.tooltipModel.x + 15}
                    positionTop={this.tooltipModel.y - 44}
                >
                    Gene: {this.tooltipModel.datum.hugoGeneSymbol}
                    <br />
                    Log Ratio:{' '}
                    {formatLogOddsRatio(this.tooltipModel.datum.logRatio)}
                    <br />
                    Alteration Frequency in {this.props.xGroupName}:{' '}
                    {this.tooltipModel.datum.x.toFixed()}%<br />
                    Alteration Frequency in {this.props.yGroupName}:{' '}
                    {this.tooltipModel.datum.y.toFixed()}%<br />
                    p-Value:{' '}
                    {toConditionalPrecision(
                        this.tooltipModel.datum.pValue,
                        3,
                        0.01
                    )}
                    <br />
                    q-Value:{' '}
                    {toConditionalPrecision(
                        this.tooltipModel.datum.qValue,
                        3,
                        0.01
                    )}
                </Popover>
            );
        } else {
            return <span />;
        }
    }

    @autobind private onClick() {
        if (!this.dragging) {
            this.handleSelectionCleared();
        }
        this.dragging = false;
    }

    @autobind private onSelectionComponentRender() {
        this.dragging = true;
    }

    @computed get tickProps() {
        if (this.plotDomainMax > 40) {
            return {
                tickValues: [0, 25, 50, 75],
            };
        } else if (this.plotDomainMax > 20) {
            return {
                tickValues: [0, 10, 20, 30, 40],
            };
        } else if (this.plotDomainMax > 10) {
            return {
                tickValues: [0, 5, 10, 15, 20],
            };
        } else {
            return {
                tickCount: 4,
            };
        }
    }

    public render() {
        return (
            <div className="posRelative">
                <div
                    className="borderedChart inlineBlock"
                    style={{ position: 'relative' }}
                    onClick={this.onClick}
                >
                    <VictoryChart
                        containerComponent={this.containerComponent}
                        theme={CBIOPORTAL_VICTORY_THEME}
                        domainPadding={{ x: [0, 20], y: [0, 20] }}
                        height={350}
                        width={350}
                        padding={{ top: 40, bottom: 60, left: 60, right: 40 }}
                    >
                        <VictoryAxis
                            domain={[0, this.plotDomainMax]}
                            label={this.xLabel}
                            style={{
                                tickLabels: { padding: 5 },
                                axisLabel: { padding: 27 },
                                ticks: { size: 3 },
                                grid: {
                                    strokeOpacity: 1,
                                },
                            }}
                            crossAxis={false}
                            orientation="bottom"
                            offsetY={45}
                            {...this.tickProps}
                        />
                        <VictoryAxis
                            domain={[0, this.plotDomainMax]}
                            dependentAxis={true}
                            label={this.yLabel}
                            style={{
                                tickLabels: { padding: 5 },
                                axisLabel: { padding: 32 },
                                ticks: { size: 3 },
                                grid: {
                                    strokeOpacity: 1,
                                },
                            }}
                            crossAxis={false}
                            orientation="left"
                            offsetX={45}
                            {...this.tickProps}
                        />
                        <VictoryLine
                            style={{
                                data: {
                                    stroke: '#cccccc',
                                    strokeWidth: 1,
                                    strokeDasharray: '10,5',
                                },
                            }}
                            data={[
                                { x: 0, y: 0 },
                                {
                                    x: this.plotDomainMax,
                                    y: this.plotDomainMax,
                                },
                            ]}
                        />
                        <VictoryScatter
                            style={{
                                data: {
                                    fillOpacity: 0.4,
                                },
                            }}
                            data={this.splitData.insignificant}
                            dataComponent={
                                <HoverablePoint
                                    onMouseOver={this.onMouseOver}
                                    onMouseOut={this.onMouseOut}
                                    fill={(datum: any) => {
                                        if (
                                            datum.hugoGeneSymbol in
                                            this.props.selectedGenesSet
                                        ) {
                                            return '#FE9929';
                                        } else {
                                            return '#D3D3D3';
                                        }
                                    }}
                                />
                            }
                            symbol="circle"
                            size={3}
                        />
                        <VictoryScatter
                            style={{
                                data: {
                                    fillOpacity: 0.6,
                                },
                            }}
                            data={this.splitData.significant}
                            dataComponent={
                                <HoverablePoint
                                    onMouseOver={this.onMouseOver}
                                    onMouseOut={this.onMouseOut}
                                    fill={(datum: any) => {
                                        if (
                                            datum.hugoGeneSymbol in
                                            this.props.selectedGenesSet
                                        ) {
                                            return '#FE9929';
                                        } else {
                                            return '#58ACFA';
                                        }
                                    }}
                                />
                            }
                        />
                    </VictoryChart>
                    <DownloadControls
                        getSvg={() => this.svgContainer}
                        filename="enrichments-frequency-scatter"
                        dontFade={true}
                        type="button"
                        style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            zIndex: 0,
                        }}
                        showDownload={
                            getServerConfig().skin_hide_download_controls ===
                            DownloadControlOption.SHOW_ALL
                        }
                    />
                </div>
                <Observer>{this.getTooltip}</Observer>
            </div>
        );
    }
}
