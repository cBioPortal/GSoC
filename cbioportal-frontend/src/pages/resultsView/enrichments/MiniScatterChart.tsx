import * as React from 'react';
import { Observer, observer } from 'mobx-react';
import {
    VictoryChart,
    VictorySelectionContainer,
    VictoryAxis,
    VictoryLabel,
    VictoryScatter,
} from 'victory';
import { observable, action, computed, makeObservable } from 'mobx';
import { Popover } from 'react-bootstrap';
import { formatLogOddsRatio } from 'shared/lib/FormatUtils';
import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import autobind from 'autobind-decorator';
import SelectionComponent from './SelectionComponent';
import HoverablePoint from './HoverablePoint';
import {
    axisLabelStyles,
    CBIOPORTAL_VICTORY_THEME,
    DownloadControls,
    DownloadControlOption,
    getTextWidth,
    truncateWithEllipsis,
} from 'cbioportal-frontend-commons';

import { getServerConfig } from 'config/config';

export interface IMiniScatterChartProps {
    data: any[];
    xAxisLeftLabel: string;
    xAxisRightLabel: string;
    xAxisDomain: number;
    xAxisTickValues: number[] | null;
    // can be hugoGeneSymbols (Gene) or stableIds (Generic Assay)
    onSelection: (selectedIds: string[]) => void;
    onSelectionCleared: () => void;
    selectedSet: { [selectedIds: string]: any };
    // give either onGeneNameClick or onGenericAssayEntityClick
    onGeneNameClick?: (hugoGeneSymbol: string, entrezGeneId: number) => void;
}

@observer
export default class MiniScatterChart<
    P extends IMiniScatterChartProps
> extends React.Component<P, {}> {
    @observable tooltipModel: any = null;
    @observable private svgContainer: any = null;
    private dragging = false;

    constructor(props: any) {
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

    protected handleSelection(points: any, bounds: any, props: any) {
        this.props.onSelection(
            points[0].data.map((d: any) => d.hugoGeneSymbol)
        );
    }

    @autobind protected handleSelectionCleared() {
        if (this.tooltipModel) {
            if (this.props.onGeneNameClick) {
                this.props.onGeneNameClick(
                    this.tooltipModel.hugoGeneSymbol,
                    this.tooltipModel.entrezGeneId
                );
            }
        }
        this.props.onSelectionCleared();
    }

    @action.bound private onPointMouseOver(datum: any, x: number, y: number) {
        this.tooltipModel = datum;
        this.tooltipModel.x = x;
        this.tooltipModel.y = y;
    }

    @action.bound private onPointMouseOut() {
        this.tooltipModel = null;
    }

    protected get tooltipTitle() {
        return `Gene: ${this.tooltipModel.hugoGeneSymbol}`;
    }

    @autobind private getTooltip() {
        if (this.tooltipModel) {
            return (
                <Popover
                    className={'cbioTooltip'}
                    positionLeft={this.tooltipModel.x + 15}
                    positionTop={this.tooltipModel.y - 33}
                >
                    {this.tooltipTitle}
                    <br />
                    Log2 Ratio: {formatLogOddsRatio(this.tooltipModel.logRatio)}
                    <br />
                    p-Value:{' '}
                    {toConditionalPrecision(this.tooltipModel.pValue, 3, 0.01)}
                    <br />
                    q-Value:{' '}
                    {toConditionalPrecision(this.tooltipModel.qValue, 3, 0.01)}
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

    private get totalLabelWidths() {
        return (
            getTextWidth(this.props.xAxisLeftLabel, 'Arial', '13px') +
            getTextWidth(this.props.xAxisRightLabel, 'Arial', '13px')
        );
    }

    @computed get xAxisLeftLabel() {
        if (this.totalLabelWidths > 200) {
            return truncateWithEllipsis(
                this.props.xAxisLeftLabel,
                90,
                'Arial',
                '13px'
            );
        } else {
            return this.props.xAxisLeftLabel;
        }
    }

    @computed get xAxisRightLabel() {
        if (this.totalLabelWidths > 180) {
            return truncateWithEllipsis(
                this.props.xAxisRightLabel,
                90,
                'Arial',
                '13px'
            );
        } else {
            return this.props.xAxisRightLabel;
        }
    }

    protected get scatterFillColorFunction() {
        return (datum: any) => {
            if (datum.hugoGeneSymbol in this.props.selectedSet) {
                return '#FE9929';
            } else if (datum.qValue < 0.05) {
                return '#58ACFA';
            } else {
                return '#D3D3D3';
            }
        };
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
                        containerComponent={
                            <VictorySelectionContainer
                                containerRef={this.svgRef}
                                activateSelectedData={false}
                                onSelection={(
                                    points: any,
                                    bounds: any,
                                    props: any
                                ) =>
                                    this.handleSelection(points, bounds, props)
                                }
                                responsive={false}
                                onSelectionCleared={this.handleSelectionCleared}
                                selectionComponent={
                                    <SelectionComponent
                                        onRender={
                                            this.onSelectionComponentRender
                                        }
                                    />
                                }
                            />
                        }
                        theme={CBIOPORTAL_VICTORY_THEME}
                        domainPadding={{ y: 20 }}
                        height={350}
                        width={350}
                        padding={{ top: 40, bottom: 60, left: 60, right: 40 }}
                        singleQuadrantDomainPadding={false}
                    >
                        <VictoryAxis
                            tickValues={this.props.xAxisTickValues}
                            domain={[
                                -this.props.xAxisDomain,
                                this.props.xAxisDomain,
                            ]}
                            label={'Log2 Ratio'}
                            tickFormat={(t: any) =>
                                t >= 1000 || t <= -1000 ? `${t / 1000}k` : t
                            }
                            style={{
                                tickLabels: { padding: 20 },
                                axisLabel: { padding: 40 },
                                ticks: { size: 0 },
                                grid: {
                                    strokeOpacity: 1,
                                },
                            }}
                            crossAxis={false}
                            orientation="bottom"
                            offsetY={60}
                        />
                        <VictoryAxis
                            label="-log10 p-Value"
                            dependentAxis={true}
                            tickCount={4}
                            style={{
                                tickLabels: { padding: 135 },
                                axisLabel: { padding: 165 },
                                ticks: { size: 0 },
                                grid: {
                                    strokeOpacity: 1,
                                },
                            }}
                        />
                        <VictoryLabel
                            style={axisLabelStyles}
                            text={'← ' + this.xAxisLeftLabel}
                            x={60}
                            y={300}
                        />
                        <VictoryLabel
                            style={axisLabelStyles}
                            text={this.xAxisRightLabel + ' →'}
                            textAnchor="end"
                            x={310}
                            y={300}
                        />
                        <VictoryLabel
                            style={axisLabelStyles}
                            text="Significance →"
                            x={320}
                            y={210}
                            angle={-90}
                        />
                        <VictoryScatter
                            style={{ data: { fillOpacity: 0.4 } }}
                            data={this.props.data}
                            dataComponent={
                                <HoverablePoint
                                    onMouseOver={this.onPointMouseOver}
                                    onMouseOut={this.onPointMouseOut}
                                    fill={this.scatterFillColorFunction}
                                />
                            }
                        />
                    </VictoryChart>
                    <DownloadControls
                        getSvg={() => this.svgContainer}
                        filename="enrichments-volcano"
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
