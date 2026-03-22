import { DownloadControls, EditableSpan } from 'cbioportal-frontend-commons';
import { numberOfLeadingDecimalZeros } from 'cbioportal-utils';
import classnames from 'classnames';
import _ from 'lodash';
import * as React from 'react';
import Slider from 'react-rangeslider';
import { computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';

import { calcYMaxInput } from '../../util/LollipopPlotUtils';
import TrackSelector, {
    TrackDataStatus,
    TrackName,
    TrackVisibility,
} from '../track/TrackSelector';

import 'react-rangeslider/lib/index.css';
import styles from './lollipopMutationPlot.module.scss';
import { AxisScale } from './AxisScaleSwitch';
import { PercentToggle } from './PercentToggle';

type LollipopMutationPlotControlsProps = {
    showControls: boolean;
    hugoGeneSymbol: string;
    countRange: [number, number];
    bottomCountRange?: [number, number];
    onYAxisMaxSliderChange: (event: any) => void;
    onYAxisMaxChange: (inputValue: string) => void;
    onBottomYAxisMaxSliderChange?: (event: any) => void;
    onBottomYAxisMaxChange?: (inputValue: string) => void;
    onYMaxInputFocused: () => void;
    onYMaxInputBlurred: () => void;
    onToggleLegend: () => void;
    yMaxSlider: number;
    yMaxSliderStep: number;
    yMaxSliderWidth: number;
    yMaxInput: number;
    yAxisSameScale?: boolean;
    bottomYMaxSlider?: number;
    bottomYMaxSliderStep: number;
    bottomYMaxInput?: number;
    customControls?: JSX.Element;
    filterResetPanel?: JSX.Element;
    tracks?: TrackName[];
    trackVisibility?: TrackVisibility;
    trackDataStatus?: TrackDataStatus;
    showTrackSelector?: boolean;
    showYMaxSlider?: boolean;
    showLegendToggle?: boolean;
    showDownloadControls?: boolean;
    onTrackVisibilityChange?: (selectedTrackIds: string[]) => void;
    getSVG: () => SVGElement;
    axisMode?: AxisScale;
    onScaleToggle?: (selectedScale: AxisScale) => void;
    showPercentToggle?: boolean;
};

function formatInputValue(value: number, step: number = 1) {
    const decimalZeros = numberOfLeadingDecimalZeros(step);
    const fixed = decimalZeros < 0 ? 0 : decimalZeros + 1;

    return value.toFixed(fixed);
}

@observer
export default class LollipopMutationPlotControls extends React.Component<
    LollipopMutationPlotControlsProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps: Partial<LollipopMutationPlotControlsProps> = {
        showTrackSelector: true,
        showYMaxSlider: true,
        showLegendToggle: true,
        showDownloadControls: true,
        yMaxSliderWidth: 110,
    };

    @computed
    get showBottomYAxisSlider() {
        return (
            this.props.bottomCountRange &&
            _.compact(this.props.bottomCountRange).length > 0 &&
            this.props.onBottomYAxisMaxSliderChange &&
            this.props.onBottomYAxisMaxChange &&
            this.props.bottomYMaxSlider &&
            this.props.bottomYMaxInput
        );
    }

    protected maxValueSlider(
        countRange: [number, number],
        oppositeCountRange: [number, number],
        onYAxisMaxSliderChange: (event: any) => void,
        onYAxisMaxChange: (inputValue: string) => void,
        yMaxSlider: number,
        yMaxInput: number,
        yAxisSameScale: boolean = false,
        label: string = 'Y-Axis Max',
        width: number = 100,
        yMaxSliderStep: number = 1
    ) {
        return (
            <div
                className="small"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginLeft: 10,
                }}
            >
                <div
                    style={{
                        width: width,
                        marginLeft: 10,
                        marginRight: 10,
                    }}
                >
                    <div style={{ textAlign: 'center' }}>{label}:</div>
                    <Slider
                        min={yMaxSliderStep}
                        max={calcYMaxInput(
                            undefined,
                            yMaxSliderStep,
                            countRange,
                            oppositeCountRange,
                            yAxisSameScale
                        )}
                        tooltip={false}
                        step={yMaxSliderStep}
                        onChange={onYAxisMaxSliderChange}
                        value={yMaxSlider}
                    />
                </div>
                <EditableSpan
                    className={styles['ymax-number-input']}
                    value={formatInputValue(yMaxInput, yMaxSliderStep)}
                    setValue={onYAxisMaxChange}
                    numericOnly={yMaxSliderStep >= 1}
                    onFocus={this.props.onYMaxInputFocused}
                    onBlur={this.props.onYMaxInputBlurred}
                />
            </div>
        );
    }

    protected get yMaxSlider() {
        return this.maxValueSlider(
            this.props.countRange,
            this.props.bottomCountRange!,
            this.props.onYAxisMaxSliderChange,
            this.props.onYAxisMaxChange,
            this.props.yMaxSlider,
            this.props.yMaxInput,
            this.props.yAxisSameScale,
            this.showBottomYAxisSlider ? 'Top Y-Axis Max' : 'Y-Axis Max',
            this.props.yMaxSliderWidth,
            this.props.yMaxSliderStep
        );
    }

    protected get bottomYMaxSlider() {
        if (this.showBottomYAxisSlider) {
            return this.maxValueSlider(
                this.props.bottomCountRange!,
                this.props.countRange,
                this.props.onBottomYAxisMaxSliderChange!,
                this.props.onBottomYAxisMaxChange!,
                this.props.bottomYMaxSlider!,
                this.props.bottomYMaxInput!,
                this.props.yAxisSameScale,
                'Bottom Y-Axis Max',
                this.props.yMaxSliderWidth,
                this.props.bottomYMaxSliderStep
            );
        } else {
            return null;
        }
    }

    protected get trackSelector() {
        return (
            <div
                className={classnames('annotation-track-selector', 'small')}
                style={{ width: 180, marginRight: 7 }}
            >
                <TrackSelector
                    tracks={this.props.tracks}
                    trackVisibility={this.props.trackVisibility}
                    trackDataStatus={this.props.trackDataStatus}
                    onChange={this.props.onTrackVisibilityChange}
                />
            </div>
        );
    }

    protected get legendToggle() {
        return (
            <button
                className="btn btn-default btn-xs"
                onClick={this.props.onToggleLegend}
                style={{ marginRight: 7 }}
            >
                Legend <i className="fa fa-eye" aria-hidden="true" />
            </button>
        );
    }

    protected get downloadControls() {
        return (
            <DownloadControls
                getSvg={this.props.getSVG}
                filename={`${this.props.hugoGeneSymbol}_lollipop`}
                dontFade={true}
                type="button"
            />
        );
    }

    @computed
    protected get percentToggle() {
        return (
            <PercentToggle
                axisMode={this.props.axisMode}
                onScaleToggle={this.props.onScaleToggle}
            />
        );
    }

    public render() {
        return (
            <div
                className={classnames(
                    'lollipop_mutation_plot__controls',
                    this.props.showControls
                        ? styles['fade-in']
                        : styles['fade-out']
                )}
            >
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {this.props.trackVisibility &&
                        this.props.onTrackVisibilityChange &&
                        this.props.showTrackSelector &&
                        this.trackSelector}
                    {this.props.showYMaxSlider && this.yMaxSlider}
                    {this.props.showYMaxSlider && this.bottomYMaxSlider}
                    {this.props.showPercentToggle && this.percentToggle}
                    {this.props.filterResetPanel}
                    {this.props.customControls}
                    <div style={{ display: 'flex', marginLeft: 'auto' }}>
                        {this.props.showLegendToggle && this.legendToggle}
                        {this.props.showDownloadControls &&
                            this.downloadControls}
                    </div>
                </div>
                {'  '}
            </div>
        );
    }
}
