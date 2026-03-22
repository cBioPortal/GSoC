import * as React from 'react';
import { observer } from 'mobx-react';
import {
    VictoryAxis,
    VictoryBar,
    VictoryChart,
    VictoryLabel,
    VictorySelectionContainer,
} from 'victory';
import { computed, observable, makeObservable } from 'mobx';
import _ from 'lodash';
import { DataFilterValue } from 'cbioportal-ts-api-client';
import { AbstractChart } from 'pages/studyView/charts/ChartContainer';
import autobind from 'autobind-decorator';
import BarChartAxisLabel from './BarChartAxisLabel';
import {
    filterCategoryBins,
    filterNumericalBins,
    formatNumericalTickValues,
    generateCategoricalData,
    generateNumericalData,
    needAdditionShiftForLogScaleBarChart,
    DataBin,
    isDataBinSelected,
} from '../../StudyViewUtils';
import { STUDY_VIEW_CONFIG } from '../../StudyViewConfig';
import { DEFAULT_NA_COLOR } from 'shared/lib/Colors';
import BarChartToolTip, { ToolTipModel } from './BarChartToolTip';
import WindowStore from 'shared/components/window/WindowStore';
import ReactDOM from 'react-dom';
import {
    CBIOPORTAL_VICTORY_THEME,
    calcPlotBottomPadding,
} from 'cbioportal-frontend-commons';

export interface IBarChartProps {
    data: DataBin[];
    width: number;
    height: number;
    filters: DataFilterValue[];
    onUserSelection: (dataBins: DataBin[]) => void;
    showNAChecked: boolean;
}

export type BarDatum = {
    x: number;
    y: number;
    dataBin: DataBin;
};

function generateTheme() {
    const theme = _.cloneDeep(CBIOPORTAL_VICTORY_THEME);
    theme.axis.style.tickLabels.fontSize *= 0.85;

    return theme;
}

const VICTORY_THEME = generateTheme();
const TILT_ANGLE = 50;

@observer
export default class BarChart extends React.Component<IBarChartProps, {}>
    implements AbstractChart {
    private svgContainer: any;

    @observable.ref
    private mousePosition = { x: 0, y: 0 };

    @observable
    private currentBarIndex = -1;

    @observable
    private toolTipModel: ToolTipModel | null = null;

    constructor(props: IBarChartProps) {
        super(props);
        makeObservable(this);
    }

    @autobind
    private onSelection(bars: { data: BarDatum[] }[]): void {
        const dataBins = _.flatten(
            bars.map(bar => bar.data.map(barDatum => barDatum.dataBin))
        );
        this.props.onUserSelection(dataBins);
    }

    public toSVGDOMNode(): Element {
        return this.svgContainer.firstChild;
    }

    @computed
    get numericalBins(): DataBin[] {
        return filterNumericalBins(this.props.data);
    }

    @computed
    get categoryBins(): DataBin[] {
        return filterCategoryBins(this.props.data);
    }

    @computed
    get numericalData(): BarDatum[] {
        return generateNumericalData(this.numericalBins);
    }

    @computed
    get categoricalData(): BarDatum[] {
        return generateCategoricalData(
            this.categoryBins,
            this.numericalTickFormat.length
        );
    }

    @computed
    get numericalTickFormat(): (string | string[])[] {
        const formatted = formatNumericalTickValues(this.numericalBins);
        // if the value contains ^ we need to return an array of values, instead of a single value
        // to be compatible with BarChartAxisLabel
        return formatted.map(value =>
            value.includes('^') ? value.split('^') : value
        );
    }

    @computed
    get barData(): BarDatum[] {
        return [...this.numericalData, ...this.categoricalData];
    }

    @computed
    get barDataBasedOnNA(): BarDatum[] {
        return this.props.showNAChecked
            ? this.barData
            : this.barData.filter(doesNotContainNA);
    }

    @computed
    get categories(): string[] {
        return this.categoryBins.map(dataBin =>
            dataBin.specialValue === undefined
                ? `${dataBin.start}`
                : dataBin.specialValue
        );
    }

    @computed
    get tickValues(): number[] {
        const values = [];
        for (
            let i = 1;
            i <= this.numericalTickFormat.length + this.categories.length;
            i++
        ) {
            values.push(i);
        }
        return values;
    }

    @computed
    get barDataWithNA(): BarDatum[] {
        return this.barData.filter(onlyContainsNA);
    }

    @computed
    get numberOfNA(): number {
        return this.barDataWithNA.length;
    }

    @computed
    get tickValuesBasedOnNA(): number[] {
        if (this.props.showNAChecked || !this.numberOfNA) {
            return this.tickValues;
        }
        const tickValuesWithoutNA = this.tickValues.slice(0, -this.numberOfNA);
        return tickValuesWithoutNA;
    }

    @computed
    get tickFormat(): (string | string[])[] {
        // copy non-numerical categories as is
        return [...this.numericalTickFormat, ...this.categories];
    }

    @computed
    get bottomPadding(): number {
        return calcPlotBottomPadding(
            VICTORY_THEME.axis.style.tickLabels.fontFamily,
            VICTORY_THEME.axis.style.tickLabels.fontSize,
            this.tickFormat,
            TILT_ANGLE,
            40,
            10
        );
    }

    @computed
    get barRatio(): number {
        // In log scale bar chart, when the first bin is .5 exponential, the bars will be shifted to the right
        // for one bar. We need to adjust the bar ratio since it's calculated based on the range / # of bars
        const additionRatio = needAdditionShiftForLogScaleBarChart(
            this.numericalBins
        )
            ? this.barDataBasedOnNA.length / (this.barDataBasedOnNA.length + 1)
            : 1;
        return additionRatio * STUDY_VIEW_CONFIG.thresholds.barRatio;
    }

    @autobind
    private onMouseMove(event: React.MouseEvent<any>): void {
        this.mousePosition = { x: event.pageX, y: event.pageY };
    }

    /*
     * Supplies the BarPlot with the event handlers needed to record when the mouse enters
     * or leaves a bar on the plot.
     */
    private get barPlotEvents() {
        const self = this;
        return [
            {
                target: 'data',
                eventHandlers: {
                    onMouseEnter: () => {
                        return [
                            {
                                target: 'data',
                                mutation: (event: any) => {
                                    self.currentBarIndex = event.datum.eventKey;
                                    self.toolTipModel = {
                                        start:
                                            self.barData[self.currentBarIndex]
                                                .dataBin.start,
                                        end:
                                            self.barData[self.currentBarIndex]
                                                .dataBin.end,
                                        special:
                                            self.barData[self.currentBarIndex]
                                                .dataBin.specialValue,
                                        sampleCount: event.datum.y,
                                    };
                                },
                            },
                        ];
                    },
                    onMouseLeave: () => {
                        return [
                            {
                                target: 'data',
                                mutation: () => {
                                    self.toolTipModel = null;
                                },
                            },
                        ];
                    },
                },
            },
        ];
    }

    @computed
    get maximumX(): number {
        return (
            this.tickValuesBasedOnNA[this.tickValuesBasedOnNA.length - 1] + 1
        );
    }

    @computed
    get maximumY(): number {
        const barDataWithoutNA = this.barData.filter(doesNotContainNA);
        return Math.max(
            ...barDataWithoutNA.map((element: BarDatum) => element.y)
        );
    }

    @computed
    get labelShowingNA(): JSX.Element | null {
        if (!this.props.showNAChecked && this.numberOfNA) {
            const labelNA = this.barDataWithNA
                .map((element: BarDatum) => element.dataBin.count)
                .join(', ');
            if (labelNA !== '0') {
                return (
                    <VictoryLabel
                        text={`NA: ${labelNA}`}
                        textAnchor="end"
                        datum={{ x: this.maximumX, y: this.maximumY }}
                        style={{
                            fontFamily:
                                VICTORY_THEME.axis.style.tickLabels.fontFamily,
                            fontSize:
                                VICTORY_THEME.axis.style.tickLabels.fontSize,
                        }}
                    />
                );
            }
        }
        return null;
    }

    public render() {
        return (
            <div onMouseMove={this.onMouseMove}>
                {this.barData.length > 0 && (
                    <VictoryChart
                        containerComponent={
                            <VictorySelectionContainer
                                containerRef={(ref: any) =>
                                    (this.svgContainer = ref)
                                }
                                selectionDimension="x"
                                onSelection={this.onSelection}
                            />
                        }
                        style={{
                            parent: {
                                width: this.props.width,
                                height: this.props.height,
                            },
                        }}
                        height={this.props.height - this.bottomPadding}
                        width={this.props.width}
                        padding={{
                            left: 40,
                            right: 20,
                            top: 10,
                            bottom: this.bottomPadding,
                        }}
                        theme={VICTORY_THEME}
                    >
                        <VictoryAxis
                            tickValues={this.tickValuesBasedOnNA}
                            tickFormat={(t: number) => this.tickFormat[t - 1]}
                            domain={[0, this.maximumX]}
                            tickLabelComponent={<BarChartAxisLabel />}
                            style={{
                                tickLabels: {
                                    angle: TILT_ANGLE,
                                    verticalAnchor: 'start',
                                    textAnchor: 'start',
                                },
                            }}
                        />
                        <VictoryAxis
                            dependentAxis={true}
                            tickFormat={(t: number) =>
                                Number.isInteger(t) ? t.toFixed(0) : ''
                            }
                        />
                        <VictoryBar
                            barRatio={this.barRatio}
                            style={{
                                data: {
                                    fill: (d: BarDatum) =>
                                        isDataBinSelected(
                                            d.dataBin,
                                            this.props.filters
                                        ) || this.props.filters.length === 0
                                            ? STUDY_VIEW_CONFIG.colors.theme
                                                  .primary
                                            : DEFAULT_NA_COLOR,
                                },
                            }}
                            data={this.barDataBasedOnNA}
                            events={this.barPlotEvents}
                        />
                        {this.labelShowingNA}
                    </VictoryChart>
                )}
                {ReactDOM.createPortal(
                    <BarChartToolTip
                        mousePosition={this.mousePosition}
                        windowWidth={WindowStore.size.width}
                        model={this.toolTipModel}
                        totalBars={this.barData.length}
                        currentBarIndex={this.currentBarIndex}
                    />,
                    document.body
                )}
            </div>
        );
    }
}

const onlyContainsNA = (element: BarDatum): boolean => {
    return element.dataBin.specialValue === 'NA';
};

const doesNotContainNA = (element: BarDatum): boolean => {
    return !onlyContainsNA(element);
};
