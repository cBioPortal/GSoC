import * as React from 'react';
import { observer, Observer } from 'mobx-react';
import {
    VictoryAxis,
    VictoryBar,
    VictoryChart,
    VictoryLabel,
    VictoryLine,
    VictoryScatter,
    Bar,
} from 'victory';
import { computed, makeObservable, observable } from 'mobx';
import _ from 'lodash';
import {
    CBIOPORTAL_VICTORY_THEME,
    axisTickLabelStyles,
} from 'cbioportal-frontend-commons';
import autobind from 'autobind-decorator';
import { ComparisonGroup } from './GroupComparisonUtils';
import {
    getTextWidth,
    pluralize,
    truncateWithEllipsis,
} from 'cbioportal-frontend-commons';
import { tickFormatNumeral } from 'cbioportal-frontend-commons';
import {
    joinGroupNames,
    regionIsSelected,
    renderGroupNameWithOrdinal,
    toggleRegionSelected,
} from './OverlapUtils';
import { getPlotDomain } from './UpSetUtils';
import * as ReactDOM from 'react-dom';
import { Popover } from 'react-bootstrap';
import classnames from 'classnames';
import styles from '../resultsView/survival/styles.module.scss';
import WindowStore from '../../shared/components/window/WindowStore';
import invertIncreasingFunction from '../../shared/lib/invertIncreasingFunction';
import GroupTickLabelComponent from './labelComponents/GroupTickLabelComponent';

export interface IUpSetProps {
    groups: {
        key: { [uid: string]: boolean };
        value: string[];
    }[];
    uidToGroup: { [uid: string]: ComparisonGroup };
    onChangeSelectedCombinations: (selectedCombinations: string[][]) => void;
    selectedCombinations: string[][]; // we do it like this so that updating it doesn't update all props
    svgId?: string;
    title?: string;
    caseType: 'sample' | 'patient';
}

const PLOT_DATA_PADDING_PIXELS = 20;
const DEFAULT_BOTTOM_PADDING = 10;
const RIGHT_PADDING_FOR_LONG_LABELS = 50;
const BAR_WIDTH = 10;
const DEFAULT_SCATTER_DOT_COLOR = '#efefef';
const MAX_LABEL_WIDTH = 200;

const BarComponent = (props: any) => (
    <Bar
        className={`${props.caseType}_${_.sortBy(props.datum.groups)
            .map(g => encodeURI(g.replace(/ /g, '_')))
            .join('_')}_bar`}
        {...props}
    />
);

@observer
export default class UpSet extends React.Component<IUpSetProps, {}> {
    private container: HTMLDivElement;
    @observable.ref private tooltipModel: any | null = null;
    private mouseEvents: any = this.makeMouseEvents();
    @observable mousePosition = { x: 0, y: 0 };

    constructor(props: IUpSetProps) {
        super(props);
        makeObservable(this);
    }

    @autobind
    private containerRef(container: HTMLDivElement) {
        this.container = container;
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
                                    if (
                                        !props.datum ||
                                        !props.datum.dontShowTooltip
                                    ) {
                                        this.tooltipModel = props;
                                    }
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
                    onClick: () => {
                        return [
                            {
                                target: 'data',
                                mutation: (props: any) => {
                                    let groups;
                                    if (props.datum) {
                                        groups = props.datum.groups;
                                    } else {
                                        groups = props.data[0].groups;
                                    }
                                    if (
                                        !props.datum ||
                                        !props.datum.notClickable
                                    ) {
                                        this.props.onChangeSelectedCombinations(
                                            toggleRegionSelected(
                                                groups,
                                                this.props.selectedCombinations
                                            )
                                        );
                                    }
                                    return null;
                                },
                            },
                        ];
                    },
                },
            },
        ];
    }

    @autobind private resetSelection() {
        this.props.onChangeSelectedCombinations([]);
    }

    @computed get usedGroups() {
        const usedGroupUids = _.chain(this.groupCombinationSets)
            .flatMap(g => g.groups)
            .keyBy()
            .value();

        return _.chain(this.props.uidToGroup)
            .reduce((acc, group, uid) => {
                if (uid in usedGroupUids) {
                    acc.push(group);
                }
                return acc;
            }, [] as ComparisonGroup[])
            .orderBy(group => group.nameWithOrdinal, 'desc')
            .value();
    }

    @computed get groupLabels() {
        return _.map(this.usedGroups, group =>
            truncateWithEllipsis(group.nameWithOrdinal, 100, 'Arial', '13px')
        );
    }

    private barSeparation() {
        return 0.2 * this.barWidth();
    }

    private barWidth() {
        return BAR_WIDTH;
    }

    @computed get chartWidth() {
        return this.barChartExtent;
    }

    private barChartHeight() {
        return 250;
    }

    @computed get scatterChartHeight() {
        return this.scatterChartExtent;
    }

    private domainPadding() {
        return PLOT_DATA_PADDING_PIXELS;
    }

    private categoryAxisDomainPadding() {
        return this.domainPadding();
    }

    private countAxisDomainPadding() {
        return this.domainPadding();
    }

    private chartDomainPadding() {
        return {
            y: this.countAxisDomainPadding(),
            x: this.categoryAxisDomainPadding(),
        };
    }

    private get title() {
        if (this.props.title) {
            return (
                <VictoryLabel
                    style={{
                        fontWeight: 'bold',
                        fontFamily: 'Verdana,Arial,sans-serif',
                        textAnchor: 'middle',
                    }}
                    x={this.svgWidth / 2}
                    y="1.2em"
                    text={this.props.title}
                />
            );
        } else {
            return null;
        }
    }

    @computed get scatterChartExtent() {
        let miscPadding = 100; // specifying chart width in victory doesnt translate directly to the actual graph size
        if (this.usedGroups.length > 0) {
            return (
                this.categoryCoord(this.usedGroups.length - 1) +
                2 * this.categoryAxisDomainPadding() +
                miscPadding
            );
        } else {
            return miscPadding;
        }
    }

    @computed get barChartExtent() {
        let miscPadding = 100; // specifying chart width in victory doesnt translate directly to the actual graph size
        if (this.groupCombinationSets.length > 0) {
            return (
                this.categoryCoord(this.groupCombinationSets.length - 1) +
                2 * this.categoryAxisDomainPadding() +
                miscPadding
            );
        } else {
            return miscPadding;
        }
    }

    @computed get biggestCategoryLabelSize() {
        const rawLabel = Math.max(
            ..._.map(this.usedGroups, group =>
                getTextWidth(
                    group.nameWithOrdinal,
                    axisTickLabelStyles.fontFamily,
                    axisTickLabelStyles.fontSize + 'px'
                )
            )
        );
        return Math.min(rawLabel, MAX_LABEL_WIDTH);
    }

    @computed get svgWidth() {
        return Math.max(
            this.leftPadding + this.chartWidth + this.rightPadding,
            320
        );
    }

    @computed get svgHeight() {
        //subtract 100 as padding added both while calculating barchart height and scatter plot height
        return (
            this.topPadding +
            this.barChartHeight() +
            this.scatterChartHeight +
            this.bottomPadding -
            100
        );
    }

    @computed get leftPadding() {
        return this.biggestCategoryLabelSize;
    }

    @computed get rightPadding() {
        return RIGHT_PADDING_FOR_LONG_LABELS;
    }

    @computed get topPadding() {
        return 0;
    }

    @computed get bottomPadding() {
        return DEFAULT_BOTTOM_PADDING;
    }

    @autobind
    private categoryCoord(index: number) {
        return index * (this.barWidth() + this.barSeparation()); // half box + separation + half box
    }

    @autobind
    private categoryCoordToGroup(coord: number) {
        const index = Math.round(
            invertIncreasingFunction(this.categoryCoord, coord, [
                0,
                this.usedGroups.length,
            ])
        );
        return this.usedGroups[index];
    }

    @computed get groupCombinationSets() {
        return _.orderBy(
            this.props.groups.map(entry => ({
                groups: Object.keys(entry.key).filter(k => entry.key[k]),
                cases: entry.value,
            })),
            group => group.cases.length,
            'desc'
        );
    }

    @computed get scatterData() {
        return _.flatMap(this.groupCombinationSets, (set, index) => {
            return _.map(this.usedGroups, (group, i) => {
                const included = _.includes(set.groups, group.uid);
                return {
                    x: this.categoryCoord(index),
                    y: this.categoryCoord(i),
                    fill: included ? '#000000' : DEFAULT_SCATTER_DOT_COLOR,
                    dontShowTooltip: !included,
                    cursor: included ? 'pointer' : 'default',
                    notClickable: !included,
                    ...set,
                };
            });
        });
    }

    @computed get barPlotData() {
        return _.map(this.groupCombinationSets, (set, index) => ({
            x: this.categoryCoord(index),
            y: set.cases.length,
            ...set,
        }));
    }

    @computed get barPlotHitzoneData() {
        const minY = this.barPlotDomain.y[1] / 15;
        return this.barPlotData.map(d => {
            return Object.assign({}, d, { y: Math.max(d.y, minY) });
        });
    }

    @computed private get getGroupIntersectionLines() {
        const activeUids = _.map(this.usedGroups, g => g.uid);
        return _.flatMap(this.groupCombinationSets, (set, index) => {
            const data = _.map(set.groups, groupUid => {
                const groupIndex = _.indexOf(activeUids, groupUid);
                return {
                    x: this.categoryCoord(index),
                    y: this.categoryCoord(groupIndex),
                    ...set,
                };
            });
            return [
                <VictoryLine
                    style={{
                        data: {
                            stroke: this.lineStroke,
                            strokeWidth: 2,
                            strokeLinecap: 'round',
                        },
                    }}
                    data={data}
                />,
                <VictoryLine
                    style={{
                        data: {
                            strokeOpacity: 0,
                            strokeWidth: this.barWidth(),
                            strokeLinecap: 'round',
                            cursor: 'pointer',
                        },
                    }}
                    data={data}
                    events={this.mouseEvents}
                />,
            ];
        });
    }

    @computed get barPlotDomain() {
        const maxCount =
            _.max(
                _.map(this.groupCombinationSets, datum => datum.cases.length)
            ) || 0;
        return getPlotDomain(
            this.groupCombinationSets.length,
            maxCount,
            this.categoryCoord,
            true,
            false
        );
    }

    @computed get scatterPlotDomain() {
        return getPlotDomain(
            this.groupCombinationSets.length,
            _.keys(this.groupLabels).length,
            this.categoryCoord
        );
    }

    @computed get categoryTickValues() {
        return this.groupCombinationSets.map((x, i) => this.categoryCoord(i));
    }

    @computed get groupTickValues() {
        return _.map(this.groupLabels, (label, index) =>
            this.categoryCoord(index)
        );
    }

    @autobind
    private formatNumericalTick(t: number, i: number, ticks: number[]) {
        return tickFormatNumeral(t, ticks);
    }

    @autobind
    private groupTick(t: number, index: number) {
        return this.groupLabels[index];
    }

    @computed get scatterPlotTopPadding() {
        // subtract 100 to plot scatter p\lot close to bar plot
        return this.barChartHeight() - 100;
    }

    private tooltipFunction(datum: any) {
        const includedGroups = _.map(
            datum.groups as string[],
            uid => this.props.uidToGroup[uid]
        );
        const casesCount = datum.cases.length;

        return (
            <div style={{ width: 300, whiteSpace: 'normal' }}>
                <strong>
                    {casesCount} {pluralize(this.props.caseType, casesCount)}
                </strong>
                <br />
                in only {joinGroupNames(includedGroups, 'and')}.
            </div>
        );
    }

    @computed get tooltipComponent() {
        if (!this.tooltipModel) {
            return null;
        } else {
            const maxWidth = 400;
            let tooltipPlacement =
                this.mousePosition.x > WindowStore.size.width - maxWidth
                    ? 'left'
                    : 'right';
            return (ReactDOM as any).createPortal(
                <Popover
                    arrowOffsetTop={17}
                    className={classnames(
                        'cbioportal-frontend',
                        'cbioTooltip',
                        styles.Tooltip
                    )}
                    positionLeft={
                        this.mousePosition.x +
                        (tooltipPlacement === 'left' ? -8 : 8)
                    }
                    positionTop={this.mousePosition.y - 17}
                    style={{
                        transform:
                            tooltipPlacement === 'left'
                                ? 'translate(-100%,0%)'
                                : undefined,
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

    @autobind private onMouseMove(e: React.MouseEvent<any>) {
        this.mousePosition.x = e.pageX;
        this.mousePosition.y = e.pageY;
    }

    @autobind private lineStroke(datum: any) {
        if (datum.length === 0) {
            return 'black';
        }
        const selected = regionIsSelected(
            datum[0].groups,
            this.props.selectedCombinations
        );
        if (selected) {
            return 'yellow';
        } else {
            return 'black';
        }
    }

    @autobind private fill(datum: any) {
        const selected = regionIsSelected(
            datum.groups,
            this.props.selectedCombinations
        );
        if (selected && !datum.notClickable) {
            return 'yellow';
        } else {
            return datum.fill || 'black';
        }
    }

    @autobind private getChart() {
        if (this.groupCombinationSets.length > 0) {
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
                    >
                        <g>{this.title}</g>
                        <g
                            transform={`translate(${this.leftPadding}, ${this.topPadding})`}
                        >
                            <VictoryChart
                                theme={CBIOPORTAL_VICTORY_THEME}
                                width={this.chartWidth}
                                height={this.barChartHeight()}
                                standalone={false}
                                domainPadding={this.chartDomainPadding()}
                                domain={this.barPlotDomain}
                                singleQuadrantDomainPadding={{
                                    y: true,
                                    x: false,
                                }}
                            >
                                <VictoryAxis
                                    orientation="bottom"
                                    offsetY={50}
                                    crossAxis={false}
                                    tickValues={this.categoryTickValues}
                                    style={{
                                        ticks: { size: 0 },
                                        tickLabels: { fontSize: 0 },
                                        grid: {
                                            stroke: 0,
                                        },
                                    }}
                                />
                                <VictoryAxis
                                    orientation="left"
                                    offsetX={50}
                                    dependentAxis
                                    label={'Overlap count'}
                                    tickFormat={this.formatNumericalTick}
                                    style={{
                                        grid: {
                                            stroke: 0,
                                        },
                                    }}
                                    axisLabelComponent={
                                        <VictoryLabel dy={-40} />
                                    }
                                />
                                <VictoryBar
                                    style={{
                                        data: {
                                            fill: this.fill,
                                            width: this.barWidth(),
                                        },
                                    }}
                                    data={this.barPlotData}
                                />
                                <VictoryBar
                                    style={{
                                        data: {
                                            fillOpacity: 0,
                                            width: this.barWidth(),
                                            cursor: 'pointer',
                                        },
                                    }}
                                    data={this.barPlotHitzoneData}
                                    events={this.mouseEvents}
                                    dataComponent={
                                        <BarComponent
                                            caseType={this.props.caseType}
                                        />
                                    }
                                />
                            </VictoryChart>
                        </g>

                        <g
                            transform={`translate(${this.leftPadding}, ${this.scatterPlotTopPadding})`}
                        >
                            <VictoryChart
                                theme={CBIOPORTAL_VICTORY_THEME}
                                width={this.chartWidth}
                                height={this.scatterChartHeight}
                                standalone={false}
                                domainPadding={this.chartDomainPadding()}
                                domain={this.scatterPlotDomain}
                                singleQuadrantDomainPadding={{
                                    y: true,
                                    x: false,
                                }}
                            >
                                <VictoryAxis
                                    orientation="bottom"
                                    offsetY={50}
                                    crossAxis={false}
                                    tickValues={this.categoryTickValues}
                                    style={{
                                        axis: { strokeWidth: 0 },
                                        ticks: { size: 0, strokeWidth: 0 },
                                        tickLabels: { fill: 'none' },
                                        grid: {
                                            stroke: 0,
                                        },
                                    }}
                                />

                                <VictoryAxis
                                    orientation="left"
                                    offsetX={50}
                                    dependentAxis
                                    crossAxis={false}
                                    tickLabelComponent={
                                        <GroupTickLabelComponent
                                            categoryCoordToGroup={
                                                this.categoryCoordToGroup
                                            }
                                            maxLabelWidth={MAX_LABEL_WIDTH}
                                            dy="0.4em"
                                        />
                                    }
                                    tickValues={this.groupTickValues}
                                    style={{
                                        axis: { strokeWidth: 0 },
                                        ticks: { size: 0, strokeWidth: 0 },
                                        grid: {
                                            stroke: 0,
                                        },
                                    }}
                                />

                                <VictoryScatter
                                    size={this.barWidth() / 2}
                                    style={{
                                        data: {
                                            fill: this.fill,
                                            cursor: (d: any) => d.cursor,
                                        },
                                    }}
                                    data={this.scatterData}
                                    events={this.mouseEvents}
                                />
                                {this.getGroupIntersectionLines}
                            </VictoryChart>
                        </g>
                    </svg>
                </div>
            );
        } else {
            return <span>No data to plot.</span>;
        }
    }

    render() {
        return (
            <div>
                <Observer>{this.getChart}</Observer>
                {this.tooltipComponent}
            </div>
        );
    }
}
