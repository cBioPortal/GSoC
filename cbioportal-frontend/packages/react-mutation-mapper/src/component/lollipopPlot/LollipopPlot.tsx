import * as React from 'react';
import { observer } from 'mobx-react';
import { observable, computed, makeObservable, action } from 'mobx';
import {
    HitZoneConfig,
    defaultHitzoneConfig,
    initHitZoneFromConfig,
    DefaultTooltip,
} from 'cbioportal-frontend-commons';

import DataStore from '../../model/DataStore';
import { SequenceSpec } from '../../model/SequenceSpec';
import { LollipopSpec } from '../../model/LollipopSpec';
import { DomainSpec } from '../../model/DomainSpec';
import LollipopPlotNoTooltip from './LollipopPlotNoTooltip';

export type LollipopPlotProps = {
    sequence?: SequenceSpec;
    lollipops: LollipopSpec[];
    domains: DomainSpec[];
    vizWidth: number;
    vizHeight: number;
    xMax: number;
    yMax?: number;
    bottomYMax?: number;
    yMaxFractionDigits?: number;
    yMaxLabelPostfix?: string;
    yAxisLabelPadding?: number;
    showYAxis?: boolean;
    xAxisOnTop?: boolean;
    xAxisOnBottom?: boolean;
    groups?: string[];
    topYAxisSymbol?: string;
    bottomYAxisSymbol?: string;
    zeroStickBaseY?: boolean;
    hugoGeneSymbol?: string;
    dataStore?: DataStore;
    onXAxisOffset?: (offset: number) => void;
    yAxisLabelFormatter?: (symbol?: string, groupName?: string) => string;
};

@observer
export default class LollipopPlot extends React.Component<
    LollipopPlotProps,
    {}
> {
    @observable private hitZoneConfig: HitZoneConfig = defaultHitzoneConfig();
    @observable private mirrorVisible: boolean = false; // lollipop and mirror lollipop share tooltip visibility

    private plot: LollipopPlotNoTooltip | undefined;
    private handlers: any;

    public static defaultProps: Partial<LollipopPlotProps> = {
        vizHeight: 200,
    };

    constructor(props: LollipopPlotProps) {
        super(props);

        makeObservable<
            LollipopPlot,
            'hitZoneConfig' | 'tooltipVisible' | 'hitZone' | 'mirrorHitZone'
        >(this);

        this.handlers = {
            ref: (plot: LollipopPlotNoTooltip) => {
                this.plot = plot;
            },
            setHitZone: (
                hitRect: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                },
                content?: JSX.Element,
                mirrorHitRect?: {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                },
                mirrorContent?: JSX.Element,
                onMouseOver?: () => void,
                onClick?: () => void,
                onMouseOut?: () => void,
                cursor: string = 'pointer',
                tooltipPlacement: string = 'top'
            ) => {
                this.hitZoneConfig = {
                    hitRect,
                    content,
                    mirrorHitRect,
                    mirrorContent,
                    onMouseOver,
                    onClick,
                    onMouseOut,
                    cursor,
                    tooltipPlacement,
                };
            },
            getOverlay: () => this.hitZoneConfig.content,
            getOverlayPlacement: () => this.hitZoneConfig.tooltipPlacement,
            getMirrorOverlay: () => this.hitZoneConfig.mirrorContent,
            onMouseLeave: () => {
                this.hitZoneConfig.onMouseOut &&
                    this.hitZoneConfig.onMouseOut();
            },
            onBackgroundMouseMove: () => {
                this.hitZoneConfig.onMouseOut &&
                    this.hitZoneConfig.onMouseOut();
            },
        };
    }

    @computed private get tooltipVisible() {
        return !!this.hitZoneConfig.content;
    }

    @computed private get hitZone() {
        return initHitZoneFromConfig(this.hitZoneConfig);
    }

    // hit zone of mirror lollipop component initialized using config's mirrorHitRect (mirror lollipop location)
    // used to determine where to apply the mirror lollipop tooltip
    @computed private get mirrorHitZone() {
        return initHitZoneFromConfig({
            ...this.hitZoneConfig,
            hitRect: { ...this.hitZoneConfig.mirrorHitRect! },
        });
    }

    // handles lollipop and mirror lollipop component simultaneous tooltip visibility
    // if lollipop tooltip is visible, make mirror lollipop tooltip visible as well
    @action.bound
    private onTooltipVisibleChange(visible: boolean) {
        this.mirrorVisible = visible;
    }

    public toSVGDOMNode(): Element {
        if (this.plot) {
            // Clone node
            return this.plot.toSVGDOMNode();
        } else {
            return document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg'
            );
        }
    }

    render() {
        const tooltipVisibleProps: any = {};
        if (!this.tooltipVisible) {
            tooltipVisibleProps.visible = false;
        }
        return (
            <div
                style={{
                    position: 'relative',
                    display: 'inline-block',
                }}
                data-test="LollipopPlot"
            >
                <DefaultTooltip
                    placement={this.handlers.getOverlayPlacement()}
                    overlay={this.handlers.getOverlay}
                    visible={this.mirrorVisible}
                    onVisibleChange={this.onTooltipVisibleChange}
                    {...tooltipVisibleProps}
                >
                    {this.hitZone}
                </DefaultTooltip>
                {this.hitZoneConfig.mirrorHitRect && (
                    <DefaultTooltip
                        placement={
                            this.handlers.getOverlayPlacement() === 'top'
                                ? 'bottom'
                                : 'top'
                        }
                        overlay={this.handlers.getMirrorOverlay}
                        visible={this.mirrorVisible}
                        onVisibleChange={this.onTooltipVisibleChange}
                        {...tooltipVisibleProps}
                    >
                        {this.mirrorHitZone}
                    </DefaultTooltip>
                )}
                <LollipopPlotNoTooltip
                    ref={this.handlers.ref}
                    setHitZone={this.handlers.setHitZone}
                    onMouseLeave={this.handlers.onMouseLeave}
                    onBackgroundMouseMove={this.handlers.onBackgroundMouseMove}
                    {...this.props}
                />
            </div>
        );
    }
}
