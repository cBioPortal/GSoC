import * as React from 'react';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';
import styles from './styles.module.scss';
import {
    VictoryChart,
    VictoryContainer,
    VictoryAxis,
    VictoryBar,
    VictoryStack,
    VictoryLabel,
} from 'victory';
import {
    CBIOPORTAL_VICTORY_THEME,
    DefaultTooltip,
} from 'cbioportal-frontend-commons';
import { Popover } from 'react-bootstrap';
import { getBarChartTooltipContent } from 'pages/resultsView/enrichments/EnrichmentsUtil';

export interface IMiniBarChartProps {
    totalAlteredCount: number;
    totalUnalteredCount: number;
    selectedGene: string;
    selectedGeneStats: [number, number, number, number] | null;
}

@observer
export default class MiniBarChart extends React.Component<
    IMiniBarChartProps,
    {}
> {
    constructor(props: IMiniBarChartProps) {
        super(props);
        makeObservable(this);
    }

    @observable tooltipModel: any;

    public render() {
        const totalCount =
            this.props.totalAlteredCount + this.props.totalUnalteredCount;
        const barWidth: number = 21;

        const events = [
            {
                childName: 'all',
                target: 'data',
                eventHandlers: {
                    onMouseOver: () => {
                        return [
                            {
                                target: 'data',
                                mutation: (props: any) => {
                                    if (props.datum.y >= 1) {
                                        this.tooltipModel = props;
                                    }
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
                                },
                            },
                        ];
                    },
                },
            },
        ];

        return (
            <div className="posRelative">
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <div>
                        <div style={{ paddingTop: 35 }}>
                            <DefaultTooltip
                                placement="right"
                                overlay={
                                    <span>Query genes selected by user</span>
                                }
                                destroyTooltipOnHide={true}
                            >
                                <i className="fa fa-info-circle" />
                            </DefaultTooltip>
                        </div>
                        <div style={{ paddingTop: 8 }}>
                            <DefaultTooltip
                                placement="right"
                                overlay={<span>Gene selected in table</span>}
                                destroyTooltipOnHide={true}
                            >
                                <i className="fa fa-info-circle" />
                            </DefaultTooltip>
                        </div>
                    </div>
                    <VictoryChart
                        height={136}
                        width={350}
                        padding={{ top: 30, bottom: 60, left: 86, right: 40 }}
                        theme={CBIOPORTAL_VICTORY_THEME}
                    >
                        <VictoryStack
                            domain={{ x: [0, totalCount], y: [1, 5] }}
                            events={events}
                            colorScale={[
                                'lightgrey',
                                '#58acfa',
                                'lightgrey',
                                '#58acfa',
                                'lightgrey',
                            ]}
                            horizontal={true}
                        >
                            <VictoryBar
                                data={[
                                    { x: 2, y: 0 },
                                    {
                                        x: 4,
                                        y: this.props.selectedGene
                                            ? this.props.selectedGeneStats![0]
                                            : 0,
                                        index: 0,
                                    },
                                ]}
                                style={{ data: { width: barWidth } }}
                            />
                            <VictoryBar
                                data={[
                                    {
                                        x: 2,
                                        y: this.props.totalAlteredCount,
                                        index: 0,
                                    },
                                    {
                                        x: 4,
                                        y: this.props.selectedGene
                                            ? this.props.selectedGeneStats![1]
                                            : 0,
                                        index: 1,
                                    },
                                ]}
                                style={{ data: { width: barWidth } }}
                            />
                            <VictoryBar
                                data={[
                                    { x: 2, y: 0 },
                                    {
                                        x: 4,
                                        y: this.props.selectedGene
                                            ? totalCount * 0.001
                                            : 0,
                                    },
                                ]}
                                style={{ data: { width: barWidth } }}
                            />
                            <VictoryBar
                                data={[
                                    { x: 2, y: 0 },
                                    {
                                        x: 4,
                                        y: this.props.selectedGene
                                            ? this.props.selectedGeneStats![2]
                                            : 0,
                                        index: 2,
                                    },
                                ]}
                                style={{ data: { width: barWidth } }}
                            />
                            <VictoryBar
                                data={[
                                    {
                                        x: 2,
                                        y: this.props.totalUnalteredCount,
                                        index: 1,
                                    },
                                    {
                                        x: 4,
                                        y: this.props.selectedGene
                                            ? this.props.selectedGeneStats![3]
                                            : 0,
                                        index: 3,
                                    },
                                ]}
                                style={{ data: { width: barWidth } }}
                            />
                        </VictoryStack>
                        <VictoryAxis
                            dependentAxis={true}
                            invertAxis={true}
                            tickValues={[
                                '',
                                'Query Genes',
                                null,
                                this.props.selectedGene
                                    ? this.props.selectedGene
                                    : 'None selected',
                                '',
                            ]}
                            style={{
                                ticks: {
                                    size: 5,
                                    stroke: (tick: any) =>
                                        tick != null ? 'black' : 'transparent',
                                },
                                tickLabels: {
                                    padding: 2,
                                    fontSize: 12,
                                    fill: 'black',
                                },
                                grid: { pointerEvents: 'none', stroke: 'none' },
                                axis: { stroke: 'black', strokeWidth: 1 },
                            }}
                        />
                        {!this.props.selectedGene && (
                            <VictoryLabel
                                text="Select gene in table or volcano plot"
                                x={91}
                                y={65}
                                style={{
                                    fontSize: 12,
                                    fontFamily: 'Arial, Helvetica',
                                }}
                            />
                        )}
                    </VictoryChart>
                </div>
                {this.tooltipModel && (
                    <Popover
                        arrowOffsetTop={14}
                        positionLeft={this.tooltipModel.y * 1.06 + 16}
                        positionTop={this.tooltipModel.x - 13}
                        className={styles.BarTooltip}
                    >
                        <div>
                            {getBarChartTooltipContent(
                                this.tooltipModel,
                                this.props.selectedGene
                            )}
                        </div>
                    </Popover>
                )}
            </div>
        );
    }
}
