import * as React from 'react';
import $ from 'jquery';
import { AlleleFreqPlotMulti } from './legacyVAFCode.js';
import { IKeyedIconData } from '../genomicOverview/GenomicOverviewUtils.js';
import _ from 'lodash';

export type MutationFrequencies = number[];

export type MutationFrequenciesBySample = {
    [sampleId: string]: MutationFrequencies;
};

export type IVAFPlotProps = {
    data?: MutationFrequenciesBySample;
    order?: { [s: string]: number };
    colors?: { [s: string]: string };
    labels?: { [s: string]: string };
    width?: number;
    height?: number;
    margin_left?: number;
    margin_right?: number;
    margin_top?: number;
    margin_bottom?: number;
    xticks?: number;
    yticks?: number;
    label_font_size?: string;
    nolegend?: boolean;
    init_show_histogram?: boolean;
    init_show_curve?: boolean;
    show_controls?: boolean;
    genepanel_icon_data?: IKeyedIconData;
};

export type IVAFPlotState = {
    show_histogram?: boolean;
    show_curve?: boolean;
    options?: any;
};

export class VAFPlot extends React.Component<IVAFPlotProps, IVAFPlotState> {
    public static defaultProps = {
        data: {},
        order: {},
        colors: {},
        labels: {},
        width: 200,
        height: undefined,
        margin_left: 50,
        margin_top: 20,
        margin_right: 30,
        margin_bottom: undefined,
        xticks: 3,
        yticks: 8,
        label_font_size: '11.5px',
        nolegend: false,
        init_show_histogram: true,
        init_show_curve: true,
        show_controls: false,
    };

    private histogramCheckbox: HTMLInputElement;
    private curveCheckbox: HTMLInputElement;
    private div: HTMLDivElement;

    private refHandlers = {
        histogramCheckbox: (input: HTMLInputElement) => {
            this.histogramCheckbox = input;
        },
        curveCheckbox: (input: HTMLInputElement) => {
            this.curveCheckbox = input;
        },
        div: (div: HTMLDivElement) => {
            this.div = div;
        },
    };

    constructor(props: IVAFPlotProps) {
        super(props);

        // Compute contingent default params
        let label_dist_to_axis = this.props.xticks === 0 ? 13 : 30;

        let options = {
            label_font_size: this.props.label_font_size,
            xticks: this.props.xticks,
            yticks: this.props.yticks,
            nolegend: this.props.nolegend,
            margin: {
                top: this.props.margin_top,
                left: this.props.margin_left,
                right: this.props.margin_right,
                bottom: this.props.margin_bottom,
            },
            width: this.props.width,
            height: this.props.height,
        };
        // margin bottom must be computed before height because height computation makes use of it
        if (options.margin.bottom === undefined)
            options.margin.bottom = 30 + label_dist_to_axis / 2;
        if (options.height === undefined && options.margin.top !== undefined)
            options.height =
                (500 + label_dist_to_axis) / 2 -
                options.margin.top -
                options.margin.bottom;
        this.state = {
            show_histogram: !!this.props.init_show_histogram,
            show_curve: !!this.props.init_show_curve,
            options,
        };

        this.toggleShowHistogram = this.toggleShowHistogram.bind(this);
        this.toggleShowCurve = this.toggleShowCurve.bind(this);
    }

    componentDidMount() {
        AlleleFreqPlotMulti(
            this,
            this.props.data,
            this.state.options,
            this.props.order,
            this.props.colors,
            this.props.labels,
            this.props.genepanel_icon_data
        );
    }

    componentDidUpdate() {
        $(this.div)
            .find('svg')
            .remove(); // remove svg element prior to rerendering
        AlleleFreqPlotMulti(
            this,
            this.props.data,
            this.state.options,
            this.props.order,
            this.props.colors,
            this.props.labels,
            this.props.genepanel_icon_data
        );
    }

    shouldComponentUpdate(nextProps: IVAFPlotProps, nextState: IVAFPlotState) {
        // Hack around React for manually-handled DOM elements: handle updating here
        if (this.histogramCheckbox) {
            if (nextState.show_histogram) {
                $(this.div)
                    .find('.viz_hist')
                    .show();
            } else {
                $(this.div)
                    .find('.viz_hist')
                    .hide();
            }
        }
        if (this.curveCheckbox) {
            if (nextState.show_curve) {
                $(this.div)
                    .find('.viz_curve')
                    .show();
            } else {
                $(this.div)
                    .find('.viz_curve')
                    .hide();
            }
        }

        return (
            nextState.show_histogram !== this.state.show_histogram ||
            nextState.show_curve !== this.state.show_curve ||
            !_.isEqual(this.props.data, nextProps.data)
        );
    }

    toggleShowHistogram() {
        const new_show_histogram = !this.state.show_histogram;
        this.setState({ show_histogram: new_show_histogram });
    }
    toggleShowCurve() {
        const new_show_curve = !this.state.show_curve;
        this.setState({ show_curve: new_show_curve });
    }

    render() {
        const histogramCheckbox = (
            <label key="histogram-toggle" style={{ marginRight: 10 }}>
                <input
                    ref={this.refHandlers.histogramCheckbox}
                    type="checkbox"
                    checked={this.state.show_histogram}
                    onChange={this.toggleShowHistogram}
                    style={{ marginRight: 3 }}
                />
                histogram
            </label>
        );

        const curveCheckbox = (
            <label key="curve-toggle">
                <input
                    ref={this.refHandlers.curveCheckbox}
                    type="checkbox"
                    checked={this.state.show_curve}
                    onChange={this.toggleShowCurve}
                    style={{ marginRight: 3 }}
                />
                density estimation
            </label>
        );

        const controls = [histogramCheckbox, curveCheckbox];

        return (
            <div style={{ display: 'inline' }} ref={this.refHandlers.div}>
                {this.props.show_controls ? controls : []}
                {this.props.show_controls ? <br /> : []}
            </div>
        );
    }
}
// To pass in: colors: window.caseMetaData.color
//              labels: window.caseMetaData.label
