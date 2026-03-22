import * as React from 'react';
import { SyntheticEvent } from 'react';
import $ from 'jquery';
import autobind from 'autobind-decorator';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { action, computed, makeObservable } from 'mobx';

import {
    getComponentIndex,
    SVGAxis,
    Tick,
    unhoverAllComponents,
} from 'cbioportal-frontend-commons';

import { LollipopPlacement, LollipopSpec } from '../../model/LollipopSpec';
import { DomainSpec } from '../../model/DomainSpec';
import {
    updatePositionHighlightFilters,
    updatePositionSelectionFilters,
} from '../../util/FilterUtils';
import Sequence from './Sequence';
import Lollipop from './Lollipop';
import Domain from './Domain';
import { LollipopPlotProps } from './LollipopPlot';

export type LollipopPlotNoTooltipProps = LollipopPlotProps & {
    setHitZone?: (
        hitRect: { x: number; y: number; width: number; height: number },
        tooltipContent?: JSX.Element,
        mirrorHitRect?: { x: number; y: number; width: number; height: number },
        mirrorTooltipContent?: JSX.Element,
        onMouseOver?: () => void,
        onClick?: () => void,
        onMouseOut?: () => void,
        cursor?: string,
        tooltipPlacement?: string
    ) => void;
    onMouseLeave?: () => void;
    onBackgroundMouseMove?: () => void;
};

const DELETE_FOR_DOWNLOAD_CLASS = 'delete-for-download';
const LOLLIPOP_ID_CLASS_PREFIX = 'lollipop-';
const DOMAIN_ID_CLASS_PREFIX = 'domain-';
const SEQUENCE_ID_CLASS_PREFIX = 'sequence-';

@observer
export default class LollipopPlotNoTooltip extends React.Component<
    LollipopPlotNoTooltipProps,
    {}
> {
    private lollipopComponents: { [lollipopIndex: string]: Lollipop } = {};
    private domainComponents: { [domainIndex: string]: Domain } = {};
    private sequenceComponents: Sequence[] = [];

    private svg: SVGElement | undefined;
    private shiftPressed: boolean = false;

    private lollipopLabelPadding = 20;
    private domainPadding = 5;
    private xAxisCandidateTickIntervals = [
        50,
        100,
        200,
        250,
        500,
        1000,
        2500,
        5000,
        10000,
        25000,
    ];
    private yAxisCandidateTickIntervals = [1, 2, 5, 10, 20, 50, 100, 200, 500];
    private xAxisHeight = 30;
    private yAxisWidth = 50;
    private yAxisPadding = 10;
    private geneHeight = 14;
    private domainHeight = 24;

    public static defaultProps: Partial<LollipopPlotNoTooltipProps> = {
        showYAxis: true,
    };

    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @autobind
    protected ref(svg: SVGElement) {
        this.svg = svg;
    }

    @action.bound
    protected onBackgroundClick() {
        if (this.props.dataStore) {
            this.props.dataStore.clearSelectionFilters();
        }
    }

    @action.bound
    protected onBackgroundMouseMove() {
        this.props.onBackgroundMouseMove && this.props.onBackgroundMouseMove();
        // unhover all of the lollipops if mouse hits background
        this.unhoverAllLollipops();
    }

    @action.bound
    protected onLollipopClick(codon: number) {
        if (this.props.dataStore) {
            updatePositionSelectionFilters(
                this.props.dataStore,
                codon,
                this.shiftPressed
            );
        }
    }

    @action.bound
    protected onKeyDown(e: JQueryKeyEventObject) {
        if (e.which === 16) {
            this.shiftPressed = true;
        }
    }

    @action.bound
    protected onKeyUp(e: JQueryKeyEventObject) {
        if (e.which === 16) {
            this.shiftPressed = false;
        }
    }

    @action.bound
    protected onMouseOver(e: SyntheticEvent<any>) {
        // No matter what, unhover all lollipops - if we're hovering one, we'll set it later in this method
        this.unhoverAllLollipops();

        const target = e.target as SVGElement;
        const className = target.getAttribute('class') || '';
        const lollipopIndex: number | null = this.getLollipopIndex(className);
        let domainIndex: number | null = null;
        let sequenceIndex: number | null = null;

        if (lollipopIndex !== null) {
            const lollipopComponent = this.lollipopComponents[lollipopIndex];
            if (lollipopComponent) {
                // mirrorLollipopComponent refers to the lollipop component, if it exists, in the other group at the same lollipopIndex
                // this is needed to show tooltips of both lollipop components at same index
                const mirrorLollipopComponent = _.find(
                    this.lollipopComponents,
                    l =>
                        l.props.spec.codon ===
                            lollipopComponent.props.spec.codon &&
                        l !== lollipopComponent
                );
                lollipopComponent.isHovered = true;
                if (this.props.setHitZone) {
                    this.props.setHitZone(
                        lollipopComponent.circleHitRect,
                        lollipopComponent.props.spec.tooltip,
                        mirrorLollipopComponent?.circleHitRect,
                        mirrorLollipopComponent?.props.spec.tooltip,
                        action(() => {
                            if (this.props.dataStore) {
                                updatePositionHighlightFilters(
                                    this.props.dataStore,
                                    [lollipopComponent.props.spec.codon]
                                );
                            }
                            lollipopComponent.isHovered = true;
                        }),
                        action(() =>
                            this.onLollipopClick(
                                lollipopComponent.props.spec.codon
                            )
                        ),
                        undefined,
                        'pointer',
                        lollipopComponent.circleHitRect.y >
                            lollipopComponent.props.stickBaseY
                            ? 'bottom'
                            : 'top'
                    );
                }
            }
        } else {
            domainIndex = this.getDomainIndex(className);
        }

        if (domainIndex !== null) {
            const domainComponent = this.domainComponents[domainIndex];
            if (domainComponent) {
                if (this.props.setHitZone) {
                    this.props.setHitZone(
                        domainComponent.hitRect,
                        domainComponent.props.spec.tooltip,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        'auto'
                    );
                }
            }
        } else {
            sequenceIndex = this.getSequenceIndex(className);
        }

        if (sequenceIndex !== null) {
            const sequenceComponent = this.sequenceComponents[sequenceIndex];
            if (sequenceComponent) {
                if (this.props.setHitZone) {
                    this.props.setHitZone(
                        sequenceComponent.hitRect,
                        sequenceComponent.props.spec
                            ? sequenceComponent.props.spec.tooltip
                            : undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        'auto'
                    );
                }
            }
        }
    }

    @action.bound
    protected onSVGMouseLeave(e: SyntheticEvent<any>) {
        const target = e.target as Element;

        if (target.tagName.toLowerCase() === 'svg') {
            this.props.onMouseLeave && this.props.onMouseLeave();
        }
    }

    private unhoverAllLollipops() {
        unhoverAllComponents(this.lollipopComponents);

        if (this.props.dataStore) {
            this.props.dataStore.clearHighlightFilters();
        }
    }

    componentDidMount() {
        // Make it so that if you hold down shift, you can select more than one lollipop at once
        $(document).on('keydown', this.onKeyDown);
        $(document).on('keyup', this.onKeyUp);
        this.props.onXAxisOffset && this.props.onXAxisOffset(this.geneX);
    }

    componentWillUnmount() {
        $(document).off('keydown', this.onKeyDown as any);
        $(document).off('keyup', this.onKeyUp as any);
    }

    componentDidUpdate() {
        this.props.onXAxisOffset && this.props.onXAxisOffset(this.geneX);
    }

    private codonToX(codon: number) {
        return (codon / this.props.xMax) * this.props.vizWidth;
    }

    private countToHeight(count: number, yMax: number, zeroHeight: number = 0) {
        return zeroHeight + Math.min(1, count / yMax) * this.yAxisHeight;
    }

    private calculateTickInterval(
        candidates: number[],
        rangeSize: number,
        maxTickCount: number
    ) {
        let ret: number;
        const tickInterval = candidates.find(
            c => rangeSize / c < maxTickCount - 1
        );
        if (!tickInterval) {
            ret = 10;
            while (rangeSize / ret > maxTickCount - 1) {
                ret *= 10;
            }
        } else {
            ret = tickInterval;
        }
        return ret;
    }

    private calculateTicks(
        tickInterval: number,
        rangeSize: number,
        labelEvenTicks: boolean
    ) {
        const ret: { position: number; label: string | undefined }[] = [];
        let nextTick = tickInterval;
        while (nextTick < rangeSize) {
            let label: string | undefined = undefined;

            // add label only for the even ticks
            // but do not add label if it is too close to the end value
            if (
                labelEvenTicks &&
                rangeSize - nextTick > (2 * tickInterval) / 3 &&
                nextTick % (2 * tickInterval) === 0
            ) {
                label = nextTick + '';
            }
            ret.push({
                position: nextTick,
                label,
            });
            nextTick += tickInterval;
        }
        return ret;
    }

    @computed private get xAxisTickInterval() {
        return this.calculateTickInterval(
            this.xAxisCandidateTickIntervals,
            this.props.xMax,
            16
        );
    }

    @computed private get yAxisTickInterval() {
        return this.calculateTickInterval(
            this.yAxisCandidateTickIntervals,
            this.yMax,
            10
        );
    }

    @computed private get bottomYAxisTickInterval() {
        return this.calculateTickInterval(
            this.yAxisCandidateTickIntervals,
            this.bottomYMax,
            10
        );
    }

    @computed private get xTicks() {
        let ret: Tick[] = [];
        // Start and end, always there
        ret.push({
            position: 0,
            label: '0',
        });
        ret.push({
            position: this.props.xMax,
            label: this.props.xMax + 'aa',
        });
        // Intermediate ticks, every other one labeled
        ret = ret.concat(
            this.calculateTicks(this.xAxisTickInterval, this.props.xMax, true)
        );
        return ret;
    }

    @computed private get yTicks() {
        return this.axisTicks(
            this.yMax,
            this.yMaxLabel,
            this.yAxisTickInterval
        );
    }

    @computed private get bottomYTicks() {
        return this.axisTicks(
            this.bottomYMax,
            this.bottomYMaxLabel,
            this.bottomYAxisTickInterval
        );
    }

    @computed private get yMax() {
        return (
            this.props.yMax ||
            this.props.lollipops
                .filter(l => l.placement !== LollipopPlacement.BOTTOM)
                .reduce(
                    (max: number, next: LollipopSpec) =>
                        Math.max(max, next.count),
                    1
                )
        );
    }

    @computed private get yMaxDisplay() {
        return this.props.yMaxFractionDigits
            ? Number(this.yMax.toFixed(this.props.yMaxFractionDigits))
            : this.yMax;
    }

    @computed private get yMaxPostfix() {
        return this.props.yMaxLabelPostfix ? this.props.yMaxLabelPostfix : '';
    }

    @computed private get bottomYMax() {
        return (
            this.props.bottomYMax ||
            this.props.lollipops
                .filter(l => l.placement === LollipopPlacement.BOTTOM)
                .reduce(
                    (max: number, next: LollipopSpec) =>
                        Math.max(max, next.count),
                    1
                )
        );
    }

    @computed private get bottomYMaxDisplay() {
        return this.props.yMaxFractionDigits
            ? Number(this.bottomYMax.toFixed(this.props.yMaxFractionDigits))
            : this.bottomYMax;
    }

    @computed private get yMaxLabel() {
        return (
            (this.props.lollipops
                .filter(l => l.placement !== LollipopPlacement.BOTTOM)
                .find(lollipop => lollipop.count > this.yMax)
                ? '>= '
                : '') +
            this.yMaxDisplay +
            this.yMaxPostfix
        );
    }

    @computed private get bottomYMaxLabel() {
        return (
            (this.props.lollipops
                .filter(l => l.placement === LollipopPlacement.BOTTOM)
                .find(lollipop => lollipop.count > this.bottomYMax)
                ? '>= '
                : '') +
            this.bottomYMaxDisplay +
            this.yMaxPostfix
        );
    }

    @computed private get needBottomPlacement() {
        return this.props.groups && this.props.groups.length > 1;
    }

    @computed private get xAxisOnTop() {
        return this.props.xAxisOnTop || this.needBottomPlacement;
    }

    @computed private get xAxisOnBottom() {
        return this.props.xAxisOnBottom || !this.needBottomPlacement;
    }

    @computed private get topGroupName() {
        return this.props.groups ? this.props.groups[0] : undefined;
    }

    @computed private get topGroupSymbol() {
        return this.props.topYAxisSymbol || '#';
    }

    @computed private get bottomGroupName() {
        return this.props.groups ? this.props.groups[1] : undefined;
    }

    @computed private get bottomGroupSymbol() {
        return this.props.bottomYAxisSymbol || '#';
    }

    @computed private get combinedXAxisHeight() {
        // number of visible x-axes depends on the props
        return (
            ((this.xAxisOnTop ? 1 : 0) + (this.xAxisOnBottom ? 1 : 0)) *
            this.xAxisHeight
        );
    }

    @computed private get yAxisHeight() {
        if (this.needBottomPlacement) {
            return (
                (2 * this.props.vizHeight -
                    (2 * this.lollipopLabelPadding +
                        this.combinedXAxisHeight +
                        2 * this.domainPadding +
                        this.domainHeight)) /
                2
            );
        } else {
            return (
                this.props.vizHeight -
                (this.lollipopLabelPadding +
                    this.combinedXAxisHeight +
                    2 * this.domainPadding +
                    this.domainHeight)
            );
        }
    }

    @computed private get xAxisY() {
        const base = this.domainY + this.domainHeight + this.domainPadding;

        if (this.needBottomPlacement) {
            return base + this.yAxisHeight + this.lollipopLabelPadding;
        } else {
            return base;
        }
    }

    @computed private get geneCenterY() {
        return this.geneY + this.geneHeight / 2;
    }

    @computed private get yAxisY() {
        return (
            this.geneCenterY -
            this.plotAreaDistanceToGeneCenter -
            this.yAxisHeight
        );
    }

    @computed private get bottomYAxisY() {
        return this.geneCenterY + this.plotAreaDistanceToGeneCenter;
    }

    @computed private get plotAreaDistanceToGeneCenter() {
        return this.domainPadding + this.domainHeight / 2;
    }

    @computed private get geneX() {
        // TODO make + 75 customizable
        return this.yAxisWidth + 75;
    }

    @computed private get geneY() {
        return (
            this.lollipopLabelPadding +
            this.yAxisHeight +
            this.domainPadding +
            (this.domainHeight - this.geneHeight) / 2 +
            (this.xAxisOnTop ? this.xAxisHeight : 0)
        );
    }

    @computed private get domainY() {
        return this.geneY - (this.domainHeight - this.geneHeight) / 2;
    }

    // we need to create segments for the sequence rectangle for better handling of the tooltip hit zone
    @computed get sequenceSegments() {
        const sequenceComponents: JSX.Element[] = [];

        let start = 0;

        let segments = _.map(this.props.domains, (domain: DomainSpec) => {
            const segment = {
                start,
                end: this.codonToX(domain.startCodon), // segment ends at the start of the current domain
            };

            // next segment starts at the end of the current domain
            start = this.codonToX(domain.endCodon);

            return segment;
        });

        // last segment after the last domain
        const end = this.props.vizWidth;
        segments.push({ start, end });

        // sort segments by start position
        segments.sort(
            (
                a: { start: number; end: number },
                b: { start: number; end: number }
            ) => {
                return a.start - b.start;
            }
        );

        segments.forEach(
            (segment: { start: number; end: number }, index: number) => {
                sequenceComponents.push(
                    <Sequence
                        ref={sequenceComponent => {
                            if (sequenceComponent !== null) {
                                this.sequenceComponents[
                                    index
                                ] = sequenceComponent;
                            }
                        }}
                        color="#BABDB6"
                        x={this.geneX + segment.start}
                        y={this.geneY}
                        height={this.geneHeight}
                        width={segment.end - segment.start}
                        spec={this.props.sequence}
                        hitzoneClassName={[
                            DELETE_FOR_DOWNLOAD_CLASS,
                            this.makeSequenceIndexClass(index),
                        ].join(' ')}
                    />
                );
            }
        );

        return sequenceComponents;
    }

    @computed private get zeroHeight() {
        // we need to add a non-zero value if the stick needs to start from the gene center
        return this.props.zeroStickBaseY
            ? 0
            : this.domainPadding + this.domainHeight / 2;
    }

    @computed private get lollipops() {
        this.lollipopComponents = {};
        const hoverHeadRadius = 5;
        return this.props.lollipops.map((lollipop: LollipopSpec, i: number) => {
            const stickHeight =
                lollipop.placement === LollipopPlacement.BOTTOM
                    ? -this.countToHeight(
                          lollipop.count,
                          this.bottomYMax,
                          this.zeroHeight
                      )
                    : this.countToHeight(
                          lollipop.count,
                          this.yMax,
                          this.zeroHeight
                      );

            const stickBaseY = this.calcStickBaseY(lollipop.placement);

            return (
                <Lollipop
                    key={`${lollipop.codon}_${
                        lollipop.placement === LollipopPlacement.BOTTOM
                            ? 'bottom'
                            : 'top'
                    }`}
                    ref={(lollipopComponent: Lollipop) => {
                        if (lollipopComponent !== null) {
                            this.lollipopComponents[i] = lollipopComponent;
                        }
                    }}
                    x={this.geneX + this.codonToX(lollipop.codon)}
                    stickBaseY={stickBaseY}
                    stickHeight={stickHeight}
                    headRadius={
                        this.props.dataStore &&
                        (this.props.dataStore.isPositionSelected(
                            lollipop.codon
                        ) ||
                            this.props.dataStore.isPositionHighlighted(
                                lollipop.codon
                            ))
                            ? 5
                            : 2.8
                    }
                    hoverHeadRadius={hoverHeadRadius}
                    label={lollipop.label}
                    headColor={lollipop.color}
                    hitzoneClassName={[
                        DELETE_FOR_DOWNLOAD_CLASS,
                        this.makeLollipopIndexClass(i),
                    ].join(' ')}
                    spec={lollipop}
                />
            );
        });
    }

    @computed private get domains() {
        this.domainComponents = {};
        return this.props.domains.map((domain: DomainSpec, index: number) => {
            const x = this.codonToX(domain.startCodon);
            const width = this.codonToX(domain.endCodon) - x;
            return (
                <Domain
                    key={index}
                    ref={(domainComponent: Domain) => {
                        if (domainComponent !== null) {
                            this.domainComponents[index] = domainComponent;
                        }
                    }}
                    x={this.geneX + x}
                    y={this.domainY}
                    width={width}
                    height={this.domainHeight}
                    color={domain.color}
                    label={domain.label}
                    labelColor={domain.labelColor}
                    hitzoneClassName={[
                        DELETE_FOR_DOWNLOAD_CLASS,
                        this.makeDomainIndexClass(index),
                    ].join(' ')}
                    spec={domain}
                />
            );
        });
    }

    private yAxis(
        y: number,
        yMax: number,
        ticks: Tick[],
        placement?: LollipopPlacement,
        groupName?: string,
        symbol: string = '#'
    ) {
        let label;
        if (this.props.yAxisLabelFormatter) {
            label = this.props.yAxisLabelFormatter(symbol, groupName);
        } else {
            label = groupName
                ? `${symbol} ${this.props.hugoGeneSymbol ||
                      ''} ${groupName} Mutations`
                : `${symbol} ${this.props.hugoGeneSymbol || ''} Mutations`;
        }
        const placeOnBottom = placement === LollipopPlacement.BOTTOM;

        return (
            <SVGAxis
                key={`lollipopPlotYAxis_${placeOnBottom ? 'bottom' : 'top'}`}
                x={this.geneX - this.yAxisPadding}
                y={y}
                length={this.yAxisHeight}
                tickLength={7}
                rangeLower={0}
                rangeUpper={yMax}
                ticks={ticks}
                vertical={true}
                verticalLabelPadding={this.props.yAxisLabelPadding}
                reverse={placeOnBottom}
                label={label}
            />
        );
    }

    private xAxis(y: number, placement?: LollipopPlacement) {
        const placeOnTop = placement === LollipopPlacement.TOP;

        return (
            <SVGAxis
                key={`lollipopPlotXAxis_${placeOnTop ? 'top' : 'bottom'}`}
                x={this.geneX}
                y={y + (placeOnTop ? this.xAxisHeight : 0)}
                length={this.props.vizWidth}
                tickLength={7}
                rangeLower={0}
                rangeUpper={this.props.xMax}
                ticks={this.xTicks}
                invertTicks={placeOnTop}
            />
        );
    }

    private axisTicks(max: number, maxLabel: string, tickInterval: number) {
        let ticks: Tick[] = [];

        // Start and end, always there
        ticks.push({
            position: 0,
            label: '0',
        });
        ticks.push({
            position: max,
            label: maxLabel,
        });
        // Intermediate ticks, unlabeled
        ticks = ticks.concat(this.calculateTicks(tickInterval, max, false));

        return ticks;
    }

    @computed public get svgWidth() {
        return this.props.vizWidth + this.geneX + 30;
    }

    @computed public get svgHeight() {
        return this.needBottomPlacement
            ? 2 * this.props.vizHeight
            : this.props.vizHeight;
    }

    private calcStickBaseY(placement?: LollipopPlacement) {
        // by default start from the center of the plot
        let stickBaseY = this.geneCenterY;

        // calculation needed when the stick starts from the axis zero (above domains)
        if (this.props.zeroStickBaseY) {
            stickBaseY =
                placement === LollipopPlacement.BOTTOM
                    ? this.bottomYAxisY
                    : this.yAxisY + this.yAxisHeight;
        }

        return stickBaseY;
    }

    private makeDomainIndexClass(index: number) {
        return `${DOMAIN_ID_CLASS_PREFIX}${index}`;
    }

    private makeLollipopIndexClass(index: number) {
        return `${LOLLIPOP_ID_CLASS_PREFIX}${index}`;
    }

    private makeSequenceIndexClass(index: number) {
        return `${SEQUENCE_ID_CLASS_PREFIX}${index}`;
    }

    private getDomainIndex(classes: string): number | null {
        return getComponentIndex(classes, DOMAIN_ID_CLASS_PREFIX);
    }

    private getLollipopIndex(classes: string): number | null {
        return getComponentIndex(classes, LOLLIPOP_ID_CLASS_PREFIX);
    }

    private getSequenceIndex(classes: string): number | null {
        return getComponentIndex(classes, SEQUENCE_ID_CLASS_PREFIX);
    }

    public toSVGDOMNode(): Element {
        if (this.svg) {
            // Clone node
            const svg = this.svg.cloneNode(true) as Element;
            $(svg)
                .find('.' + DELETE_FOR_DOWNLOAD_CLASS)
                .remove();
            return svg;
        } else {
            return document.createElementNS(
                'http://www.w3.org/2000/svg',
                'svg'
            );
        }
    }

    render() {
        return (
            <div onMouseOver={this.onMouseOver}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    ref={this.ref as any}
                    width={this.svgWidth}
                    height={this.svgHeight}
                    className="lollipop-svgnode"
                    onMouseLeave={this.onSVGMouseLeave}
                >
                    <rect
                        fill="#FFFFFF"
                        x={0}
                        y={0}
                        width={this.svgWidth}
                        height={this.svgHeight}
                        onClick={this.onBackgroundClick}
                        onMouseMove={this.onBackgroundMouseMove}
                    />
                    {
                        // Originally this had tooltips by having separate segments
                        // with hit zones. We disabled those separate segments with
                        // tooltips (this.sequenceSegments) and instead just draw
                        // one rectangle
                        // this.sequenceSegments
                    }
                    <rect
                        fill="#BABDB6"
                        x={this.geneX}
                        y={this.geneY}
                        height={this.geneHeight}
                        width={
                            // the x-axis start from 0, so the rectangle size should be (width + 1)
                            this.props.vizWidth + 1
                        }
                    />
                    {this.lollipops}
                    {this.domains}
                    {this.xAxisOnTop && this.xAxis(0, LollipopPlacement.TOP)}
                    {this.xAxisOnBottom &&
                        this.xAxis(this.xAxisY, LollipopPlacement.BOTTOM)}
                    {this.props.showYAxis &&
                        this.yAxis(
                            this.yAxisY,
                            this.yMax,
                            this.yTicks,
                            LollipopPlacement.TOP,
                            this.topGroupName,
                            this.topGroupSymbol
                        )}
                    {this.props.showYAxis &&
                        this.needBottomPlacement &&
                        this.yAxis(
                            this.bottomYAxisY,
                            this.bottomYMax,
                            this.bottomYTicks,
                            LollipopPlacement.BOTTOM,
                            this.bottomGroupName,
                            this.bottomGroupSymbol
                        )}
                </svg>
            </div>
        );
    }
}
