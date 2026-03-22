import * as React from 'react';
import { observer } from 'mobx-react';
import {
    Slice,
    VictoryContainer,
    VictoryLabel,
    VictoryLegend,
    VictoryPie,
} from 'victory';
import { action, computed, observable, toJS, makeObservable } from 'mobx';
import _ from 'lodash';
import {
    getFrequencyStr,
    toSvgDomNodeWithLegend,
} from 'pages/studyView/StudyViewUtils';
import { AbstractChart } from 'pages/studyView/charts/ChartContainer';
import autobind from 'autobind-decorator';
import { ClinicalDataCountSummary } from 'pages/studyView/StudyViewUtils';
import ClinicalTable from 'pages/studyView/table/ClinicalTable';
import { STUDY_VIEW_CONFIG } from '../../StudyViewConfig';
import {
    CBIOPORTAL_VICTORY_THEME,
    DefaultTooltip,
    getTextWidth,
} from 'cbioportal-frontend-commons';
import { DEFAULT_NA_COLOR } from 'shared/lib/Colors';
import ifNotDefined from '../../../../shared/lib/ifNotDefined';
import { getTextColor } from 'pages/groupComparison/OverlapUtils';
import numeral from 'numeral';

export function formatPieChartNumber(n: number) {
    // capitalize k and m number abbreviations
    return numeral(n)
        .format('0.[0]a')
        .replace(/([km])$/, m => m.toUpperCase());
}

export interface IPieChartProps {
    width: number;
    height: number;
    data: ClinicalDataCountSummary[];
    filters: string[];
    openComparisonPage?: () => void;
    onUserSelection: (values: string[]) => void;
    placement: 'left' | 'right';
    patientAttribute: boolean;
    label?: string;
    labelDescription?: string;
}

@observer
export default class PieChart extends React.Component<IPieChartProps, {}>
    implements AbstractChart {
    private svg: SVGElement;

    constructor(props: IPieChartProps) {
        super(props);
        makeObservable(this);
    }

    @computed
    get filters() {
        const mappedValueSet = _.reduce(
            this.props.data,
            (acc, datum) => {
                acc[datum.value.toLowerCase()] = datum.value;
                return acc;
            },
            {} as { [id: string]: string }
        );
        return this.props.filters.map(
            filter => mappedValueSet[filter.toLowerCase()] || filter
        );
    }

    @autobind
    private onUserSelection(filter: string) {
        let filters = toJS(this.filters);
        if (_.includes(filters, filter)) {
            filters = _.filter(filters, obj => obj !== filter);
        } else {
            filters.push(filter);
        }
        this.props.onUserSelection(filters);
    }

    private get userEvents() {
        const self = this;
        return [
            {
                target: 'data',
                eventHandlers: this.pieSliceOnClickEventHandlers,
            },
            {
                target: 'labels',
                eventHandlers: this.pieSliceOnClickEventHandlers,
            },
        ];
    }

    private get pieSliceOnClickEventHandlers() {
        return {
            onClick: () => {
                return [
                    {
                        target: 'data',
                        mutation: (props: any) => {
                            this.onUserSelection(props.datum.value);
                        },
                    },
                ];
            },
        };
    }

    @observable isTooltipHovered: boolean = false;
    @observable tooltipHighlightedRow: string | undefined = undefined;

    @action.bound
    private highlightedRow(value: string): void {
        this.tooltipHighlightedRow = value;
    }

    public downloadData() {
        return this.props.data
            .map(obj => obj.value + '\t' + obj.count)
            .join('\n');
    }

    public toSVGDOMNode(): Element {
        return toSvgDomNodeWithLegend(this.svg, {
            legendGroupSelector: '.studyViewPieChartLegend',
            chartGroupSelector: '.studyViewPieChartGroup',
            centerLegend: true,
        });
    }

    @computed
    get totalCount() {
        return _.sumBy(this.props.data, obj => obj.count);
    }

    @autobind
    fill(d: ClinicalDataCountSummary) {
        if (!_.isEmpty(this.filters) && !_.includes(this.filters, d.value)) {
            return DEFAULT_NA_COLOR;
        }
        return d.color;
    }

    @autobind
    stroke(d: ClinicalDataCountSummary) {
        if (!_.isEmpty(this.filters) && _.includes(this.filters, d.value)) {
            return '#cccccc';
        }
        return null;
    }

    @autobind
    strokeWidth(d: ClinicalDataCountSummary) {
        if (!_.isEmpty(this.filters) && _.includes(this.filters, d.value)) {
            return 3;
        }
        return 0;
    }

    @autobind
    fillOpacity(d: ClinicalDataCountSummary) {
        if (!_.isEmpty(this.filters) && !_.includes(this.filters, d.value)) {
            return '0.5';
        }
        return 1;
    }

    @autobind
    private x(d: ClinicalDataCountSummary) {
        return d.value;
    }

    @autobind
    private y(d: ClinicalDataCountSummary) {
        return d.count;
    }

    @autobind
    private label(d: ClinicalDataCountSummary) {
        // Always show label when ratio of pie is larger than 0.25
        // If ratio of pie is less than 0.25, do check the max length we can show the text and the text length
        // to decide if we should show the label or not
        return d.count / this.totalCount > 0.25
            ? formatPieChartNumber(d.count)
            : this.maxLength(
                  d.count / this.totalCount,
                  this.pieSliceRadius / 5
              ) <
              getTextWidth(
                  formatPieChartNumber(d.count),
                  CBIOPORTAL_VICTORY_THEME.axis.style.tickLabels.fontFamily,
                  `${CBIOPORTAL_VICTORY_THEME.axis.style.tickLabels.fontSize}px`
              )
            ? ''
            : formatPieChartNumber(d.count);
    }

    @autobind
    labelColor(d: ClinicalDataCountSummary) {
        return getTextColor(this.fill(d));
    }

    // Pie charts should be circular, and thus should have a square container.
    // In instances where the pie chart is not in a square container, just
    // make the largest square you can in the container.
    @computed
    get chartSize() {
        return Math.min(this.props.width, this.props.height);
    }

    @computed
    get pieSliceRadius(): number {
        const chartWidth =
            this.props.width > this.props.height
                ? this.props.height
                : this.props.width;
        return chartWidth / 2 - STUDY_VIEW_CONFIG.thresholds.piePadding;
    }

    @computed
    get victoryPie() {
        return (
            <VictoryPie
                standalone={false}
                theme={CBIOPORTAL_VICTORY_THEME}
                containerComponent={<VictoryContainer responsive={false} />}
                groupComponent={
                    <g
                        className="studyViewPieChartGroup"
                        transform="translate(0, -12)"
                    />
                }
                width={this.props.width}
                height={this.chartSize}
                labelRadius={this.pieSliceRadius / 5}
                radius={this.pieSliceRadius}
                labels={this.label}
                data={this.props.data}
                dataComponent={<CustomSlice />}
                labelComponent={<VictoryLabel />}
                events={this.userEvents}
                style={{
                    data: {
                        fill: ifNotDefined(this.fill, '#cccccc'),
                        stroke: ifNotDefined(this.stroke, '0x000000'),
                        strokeWidth: ifNotDefined(this.strokeWidth, 0),
                        fillOpacity: ifNotDefined(this.fillOpacity, 1),
                        cursor: 'pointer',
                    },
                    labels: {
                        fill: ifNotDefined(this.labelColor, '#000000'),
                        cursor: 'pointer',
                    },
                }}
                x={this.x}
                y={this.y}
            />
        );
    }

    @computed
    get victoryLegend() {
        const legendData = this.props.data.map(data => ({
            name: `${data.value}: ${data.count} (${getFrequencyStr(
                (100 * data.count) / this.totalCount
            )})`,
        }));
        const colorScale = this.props.data.map(data => data.color);

        // override the legend style without mutating the actual theme object
        const theme = _.cloneDeep(CBIOPORTAL_VICTORY_THEME);
        theme.legend.style.data = {
            type: 'square',
            size: 5,
            strokeWidth: 0,
            stroke: 'black',
        };

        return (
            <VictoryLegend
                standalone={false}
                theme={theme}
                colorScale={colorScale}
                x={0}
                y={this.props.height + 1}
                rowGutter={-10}
                title={this.props.label || 'Legend'}
                centerTitle={true}
                style={{ title: { fontWeight: 'bold' } }}
                data={legendData}
                groupComponent={<g className="studyViewPieChartLegend" />}
            />
        );
    }

    private maxLength(ratioOfPie: number, radius: number) {
        return Math.abs(Math.tan((Math.PI * ratioOfPie) / 2)) * radius * 2;
    }

    public render() {
        return (
            <DefaultTooltip
                placement={this.props.placement}
                overlay={
                    <ClinicalTable
                        width={300}
                        height={150}
                        openComparisonPage={this.props.openComparisonPage}
                        data={this.props.data}
                        label={this.props.label}
                        labelDescription={this.props.labelDescription}
                        patientAttribute={this.props.patientAttribute}
                        showAddRemoveAllButtons={true}
                        filters={this.filters}
                        highlightedRow={this.highlightedRow}
                        onUserSelection={this.props.onUserSelection}
                    />
                }
                destroyTooltipOnHide={true}
                trigger={['hover']}
            >
                <svg
                    width={this.props.width}
                    height={this.props.height}
                    ref={(ref: any) => (this.svg = ref)}
                >
                    {this.victoryPie}
                    {this.victoryLegend}
                </svg>
            </DefaultTooltip>
        );
    }
}

class CustomSlice extends React.Component<{}, {}> {
    render() {
        const d: any = this.props;
        return (
            <g>
                <Slice {...this.props} />
                <title>{`${d.datum.displayedValue || d.datum.value}:${
                    d.datum.count
                }`}</title>
            </g>
        );
    }
}
