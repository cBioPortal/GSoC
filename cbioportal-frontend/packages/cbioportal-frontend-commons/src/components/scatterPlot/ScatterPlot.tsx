import _ from 'lodash';
import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import {
    VictoryAxis,
    VictoryChart,
    VictoryLabel,
    VictoryLegend,
    VictoryScatter,
} from 'victory';

import {
    calcPlotBottomPadding,
    calcPlotDiagonalPadding,
    calcPlotLeftPadding,
} from '../../lib/PlotUtils';
import { default as VictorySelectionContainerWithLegend } from '../victory/VictorySelectionContainerWithLegend';
import GradientLegend, {
    TITLE_DX,
    TITLE_DY,
} from '../gradientLegend/GradientLegend';
import LinearGradient from '../gradientLegend/LinearGradient';
import ScatterPlotTooltip from './ScatterPlotTooltip';
import { ScatterPlotTooltipHelper } from './ScatterPlotTooltipHelper';

export interface IScatterPlotDatum {
    x: string;
    y: string;
    datum: any;
}

export interface IScatterPlotProps {
    data: IScatterPlotDatum[];
    width: number;
    height: number;
    domainPadding?: number;
    legendPadding?: number;
    legendFontSize?: number;
    plotPadding?: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
    gradientLegendProps?: {
        colors: string[];
        title: string;
        width: number;
        height: number;
        min: number;
        max: number;
    };
    discreteLegendProps?: {
        title: string | string[];
        data: {
            name: string;
            symbol?: {
                fill?: string;
                type?: string;
                size?: number;
            };
            labels?: {
                fill?: string;
                fontSize?: number;
            };
        }[];
    };
    axisLabelTiltAngle?: number;
    disableSelection?: boolean;
    xCategoriesCompare?: (a: string, b: string) => number;
    yCategoriesCompare?: (a: string, b: string) => number;
    theme: {
        axis: {
            style: {
                tickLabels: {
                    fontFamily: string;
                    fontSize: number;
                };
            };
        };
    };
    tooltip?: (d: IScatterPlotDatum) => JSX.Element;
    plotStyle?: any;
    containerStyle?: React.CSSProperties;
    dataComponentSize?: number | ((d: IScatterPlotDatum) => number);
    dataComponentSymbol?: string | ((d: IScatterPlotDatum) => string);
}

interface IScatterPlotChartProps extends IScatterPlotProps {
    containerRef: (container: HTMLDivElement) => void;
    gradientLegendProps: {
        gradientId: string;
        fontSize?: number;
        colors: string[];
        title: string;
        width: number;
        height: number;
        min: number;
        max: number;
    };
    discreteLegendProps?: {
        x: number;
        y: number;
        titleComponent: JSX.Element;
        centerTitle: boolean;
        orientation: string;
        rowGutter: number;
        symbolSpacer: number;
        title: string | string[];
        data: {
            name: string;
            symbol?: {
                fill?: string;
                type?: string;
                size?: number;
            };
            labels?: {
                fill?: string;
                fontSize?: number;
            };
        }[];
        style: any;
    };
    xCategories: string[];
    yCategories: string[];
    mouseEvents: {
        target: string;
        eventHandlers: any;
    }[];
    padding: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
}

const GRADIENT_ID = 'scatterPlotLinearGradient';

const ScatterPlotChart: React.FunctionComponent<IScatterPlotChartProps> = observer(
    props => {
        return (
            <VictoryChart
                containerComponent={
                    <VictorySelectionContainerWithLegend
                        containerRef={props.containerRef}
                        disable={props.disableSelection}
                        legend={
                            <GradientLegend {...props.gradientLegendProps} />
                        }
                        gradient={
                            <LinearGradient
                                id={props.gradientLegendProps.gradientId}
                                colors={props.gradientLegendProps.colors}
                            />
                        }
                    />
                }
                style={{
                    parent: {
                        ...props.containerStyle,
                        width: props.width,
                        height: props.height,
                    },
                }}
                height={props.height}
                width={props.width}
                theme={props.theme}
                padding={props.padding}
                domainPadding={props.domainPadding}
            >
                {props.discreteLegendProps && (
                    <VictoryLegend {...props.discreteLegendProps} />
                )}
                <VictoryAxis
                    style={{
                        tickLabels: {
                            angle: props.axisLabelTiltAngle,
                            verticalAnchor: 'start',
                            textAnchor: 'start',
                        },
                    }}
                    crossAxis={true}
                />
                <VictoryAxis dependentAxis={true} crossAxis={true} />
                <VictoryScatter
                    events={props.mouseEvents}
                    categories={{
                        x: props.xCategories,
                        y: props.yCategories,
                    }}
                    data={props.data}
                    style={props.plotStyle}
                    size={props.dataComponentSize}
                    symbol={props.dataComponentSymbol}
                />
            </VictoryChart>
        );
    }
);

@observer
export class ScatterPlot extends React.Component<IScatterPlotProps, {}> {
    public static defaultProps: Partial<IScatterPlotProps> = {
        axisLabelTiltAngle: 50,
        disableSelection: true,
        domainPadding: 15,
        legendPadding: 20,
        legendFontSize: 11,
        gradientLegendProps: {
            title: 'Legend',
            colors: ['#000', '#FFF'],
            width: 10,
            height: 200,
            min: 0,
            max: 1,
        },
        // existing padding calculation is not perfect,
        // additional constant padding needed to prevent text truncation
        plotPadding: {
            left: 20,
            right: 40,
            top: 20,
            bottom: 20,
        },
    };

    @observable.ref private container: HTMLDivElement;
    private tooltipHelper: ScatterPlotTooltipHelper = new ScatterPlotTooltipHelper();

    constructor(props: IScatterPlotProps) {
        super(props);
        makeObservable(this);
    }

    get mouseEvents() {
        return this.tooltipHelper.mouseEvents;
    }

    get tooltipModel() {
        return this.tooltipHelper.tooltipModel;
    }

    get pointHovered() {
        return this.tooltipHelper.pointHovered;
    }

    @computed
    get xCategories(): string[] {
        return _.uniq(this.props.data.map(d => d.x)).sort(
            this.props.xCategoriesCompare
        );
    }

    @computed
    get yCategories(): string[] {
        return _.uniq(this.props.data.map(d => d.y)).sort(
            this.props.yCategoriesCompare
        );
    }

    @computed
    get bottomPadding(): number {
        return (
            calcPlotBottomPadding(
                this.props.theme.axis.style.tickLabels.fontFamily,
                this.props.theme.axis.style.tickLabels.fontSize,
                this.xCategories,
                this.props.axisLabelTiltAngle
            ) + this.props.plotPadding!.bottom
        );
    }

    @computed
    get leftPadding(): number {
        return (
            calcPlotLeftPadding(
                this.props.theme.axis.style.tickLabels.fontFamily,
                this.props.theme.axis.style.tickLabels.fontSize,
                this.yCategories
            ) + this.props.plotPadding!.left
        );
    }

    @computed
    get rightPadding(): number {
        return (
            calcPlotDiagonalPadding(
                _.last(this.xCategories) || '',
                this.props.theme.axis.style.tickLabels.fontFamily,
                this.props.theme.axis.style.tickLabels.fontSize,
                this.props.axisLabelTiltAngle
                    ? 90 - this.props.axisLabelTiltAngle
                    : undefined
            ) + this.props.plotPadding!.right
        );
    }

    @computed
    get padding() {
        return {
            left: this.leftPadding,
            right: this.rightPadding,
            top: this.props.plotPadding!.top,
            bottom: this.bottomPadding,
        };
    }

    @computed
    get gradientLegendProps() {
        const {
            colors,
            title,
            width,
            height,
            min,
            max,
        } = this.props.gradientLegendProps!;

        const x =
            this.props.width - this.padding.right + this.props.legendPadding!;
        const y = this.padding.top;

        return {
            gradientId: GRADIENT_ID,
            fontSize: this.props.legendFontSize,
            colors,
            x,
            y,
            title,
            width,
            height,
            min,
            max,
        };
    }

    @computed
    get discreteLegendProps() {
        const x =
            this.props.width - this.padding.right + this.props.legendPadding!;
        const y =
            this.padding.top +
            this.props.gradientLegendProps!.height +
            this.props.legendPadding! -
            TITLE_DY;

        return this.props.discreteLegendProps
            ? {
                  x,
                  y,
                  titleComponent: <VictoryLabel dx={TITLE_DX} />,
                  centerTitle: true,
                  orientation: 'vertical',
                  rowGutter: -5,
                  symbolSpacer: 5,
                  title: this.props.discreteLegendProps.title,
                  style: {
                      title: {
                          fontSize: this.props.legendFontSize,
                          padding: 0,
                      },
                  },
                  data: this.props.discreteLegendProps.data.map(d => {
                      // set default legend font size if not provided
                      const labels = d.labels || {};
                      const fontSize =
                          labels.fontSize || this.props.legendFontSize;

                      return {
                          ...d,
                          labels: {
                              ...labels,
                              fontSize,
                          },
                      };
                  }),
              }
            : undefined;
    }

    get dataWithTooltip() {
        return this.props.tooltip
            ? this.props.data.map(d => ({
                  ...d,
                  label: this.props.tooltip!(d),
              }))
            : this.props.data;
        // return this.props.tooltip ? this.props.data.map(d => ({...d, label: d.datum})): this.props.data;
        // return this.props.tooltip ? this.props.data.map(d => ({...d, label: "d.datum"})): this.props.data;
    }

    public render() {
        return (
            <>
                <ScatterPlotChart
                    {...this.props}
                    containerRef={this.containerRef}
                    discreteLegendProps={this.discreteLegendProps}
                    gradientLegendProps={this.gradientLegendProps}
                    xCategories={this.xCategories}
                    yCategories={this.yCategories}
                    mouseEvents={this.mouseEvents}
                    padding={this.padding}
                />
                {this.container && this.tooltipModel && this.props.tooltip && (
                    <ScatterPlotTooltip
                        container={this.container}
                        targetHovered={this.pointHovered}
                        targetCoords={{
                            x: this.tooltipModel.x,
                            y: this.tooltipModel.y,
                        }}
                        overlay={this.props.tooltip(this.tooltipModel.datum)}
                    />
                )}
            </>
        );
    }

    @action.bound
    private containerRef(container: HTMLDivElement) {
        this.container = container;
    }
}

export default ScatterPlot;
