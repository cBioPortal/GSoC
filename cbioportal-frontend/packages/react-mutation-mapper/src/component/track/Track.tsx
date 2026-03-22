import * as React from 'react';
import $ from 'jquery';
import { observer } from 'mobx-react';
import { SyntheticEvent } from 'react';
import { action, computed, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import classnames from 'classnames';

import {
    defaultHitzoneConfig,
    DefaultTooltip,
    getComponentIndex,
    HitZoneConfig,
    initHitZoneFromConfig,
    unhoverAllComponents,
} from 'cbioportal-frontend-commons';

import { DataFilter } from '../../model/DataFilter';
import DataStore from '../../model/DataStore';
import {
    updatePositionSelectionFilters,
    updatePositionRangeHighlightFilters,
} from '../../util/FilterUtils';
import TrackItem, { TrackItemSpec, TrackItemType } from './TrackItem';
import styles from './trackStyles.module.scss';

const DEFAULT_ID_CLASS_PREFIX = 'track-circle-';
const DEFAULT_HEIGHT = 15; // height of rectangle element

export type TrackProps = {
    dataStore: DataStore;
    width: number;
    proteinLength: number;
    trackItems?: TrackItemSpec[];
    trackTitle?: JSX.Element;
    hideBaseline?: boolean;
    xOffset?: number;
    defaultFilters?: DataFilter[];
    idClassPrefix?: string;
    isSubTrack?: boolean;
};

@observer
export default class Track extends React.Component<TrackProps, {}> {
    @observable private hitZoneConfig: HitZoneConfig = defaultHitzoneConfig();
    @observable private shiftPressed = false;
    private tooltipActive = false;

    private shapes: { [index: string]: TrackItem };

    constructor(props: TrackProps) {
        super(props);
        makeObservable<
            Track,
            | 'hitZoneConfig'
            | 'shiftPressed'
            | 'unhoverAllComponents'
            | 'tooltipVisible'
            | 'hitZone'
        >(this);
    }

    @autobind
    setHitZone(
        hitRect: { x: number; y: number; width: number; height: number },
        content?: JSX.Element,
        onMouseOver?: () => void,
        onClick?: () => void,
        onMouseOut?: () => void,
        cursor: string = 'pointer',
        tooltipPlacement: string = 'top'
    ) {
        this.hitZoneConfig = {
            hitRect,
            content,
            onMouseOver,
            onClick,
            onMouseOut,
            cursor,
            tooltipPlacement,
        };
    }

    @autobind
    getOverlay() {
        return this.hitZoneConfig.content;
    }

    @autobind
    getOverlayPlacement() {
        return this.hitZoneConfig.tooltipPlacement;
    }

    @action.bound
    onMouseLeave() {
        if (this.hitZoneConfig.onMouseOut) {
            this.hitZoneConfig.onMouseOut();
        }
    }

    @autobind
    onBackgroundMouseMove() {
        if (this.hitZoneConfig.onMouseOut) {
            this.hitZoneConfig.onMouseOut();
        }
    }

    @action.bound
    onBackgroundClick() {
        this.props.dataStore.clearSelectionFilters();
    }

    @action.bound
    onTrackItemClick(shapeComponent: TrackItem) {
        if (shapeComponent.props.spec.itemType === TrackItemType.CIRCLE) {
            updatePositionSelectionFilters(
                this.props.dataStore,
                shapeComponent.props.spec.startCodon,
                this.shiftPressed,
                this.props.defaultFilters
            );
        }
    }

    @action.bound
    onTrackItemHover(shapeComponent: TrackItem) {
        const endCodon: number = shapeComponent.props.spec.endCodon
            ? Math.trunc(shapeComponent.props.spec.endCodon)
            : Math.trunc(shapeComponent.props.spec.startCodon);

        updatePositionRangeHighlightFilters(
            this.props.dataStore,
            Math.trunc(shapeComponent.props.spec.startCodon),
            endCodon,
            this.props.defaultFilters
        );
        shapeComponent.isHovered = true;
    }

    @action.bound
    onKeyDown(e: JQueryKeyEventObject) {
        if (e.which === 16) {
            this.shiftPressed = true;
        }
    }

    @action.bound
    onKeyUp(e: JQueryKeyEventObject) {
        if (e.which === 16) {
            this.shiftPressed = false;
        }
    }

    @action.bound
    onMouseOver(e: SyntheticEvent<any>) {
        // No matter what, unhover all components - if we're hovering one, we'll set it later in this method
        this.unhoverAllComponents();

        const target = e.target as SVGElement;
        const className = target.getAttribute('class') || '';
        const componentIndex: number | null = this.getComponentIndex(className);

        if (componentIndex !== null) {
            const shapeComponent = this.shapes[componentIndex];
            if (shapeComponent) {
                this.setHitZone(
                    shapeComponent.hitRectangle,
                    shapeComponent.props.spec.tooltip,
                    action(() => this.onTrackItemHover(shapeComponent)),
                    action(() => this.onTrackItemClick(shapeComponent)),
                    this.onHitzoneMouseOut,
                    'pointer',
                    'bottom'
                );
            }
        }
    }

    @action.bound
    onSVGMouseLeave(e: SyntheticEvent<any>) {
        const target = e.target as Element;
        if (target.tagName.toLowerCase() === 'svg') {
            this.onMouseLeave();
        }
    }

    @action.bound
    onTooltipVisibleChange(visible: boolean) {
        this.tooltipActive = visible;

        if (!visible) {
            this.unhoverAllComponents();
        }
    }

    @action.bound
    onHitzoneMouseOut() {
        if (!this.tooltipActive) {
            this.unhoverAllComponents();
        }
    }

    get svgHeight() {
        return 10; // height of baseline element
    }

    get items() {
        this.shapes = {};

        return (this.props.trackItems || []).map((spec, index) => {
            let dim1;
            let dim2;
            let hoverdim1;
            let specFeats;
            let y;
            if (spec.endCodon !== undefined) {
                dim1 =
                    ((spec.endCodon! - spec.startCodon) /
                        this.props.proteinLength) *
                    this.props.width;
                dim2 = spec.height || DEFAULT_HEIGHT;
                hoverdim1 = dim1;
                y = (this.svgHeight - dim2) / 2; // y is the vertical start position of rectangle, half of baseline element height = half of element height + y
                specFeats = {
                    ...spec,
                    endCodon: spec.endCodon!,
                    itemType: TrackItemType.RECTANGLE,
                };
            } else {
                dim1 =
                    this.props.dataStore.isPositionSelected(spec.startCodon) ||
                    this.props.dataStore.isPositionHighlighted(spec.startCodon)
                        ? 5
                        : 2.8;
                hoverdim1 = 5;
                y = this.svgHeight / 2;
                dim2 = dim1;
                specFeats = { ...spec, itemType: TrackItemType.CIRCLE };
            }
            return (
                <TrackItem
                    ref={(item: TrackItem) => {
                        if (item !== null) {
                            this.shapes[index] = item;
                        }
                    }}
                    key={spec.startCodon}
                    hitZoneClassName={`${this.props.idClassPrefix}${index}`}
                    hitZoneXOffset={this.props.xOffset}
                    x={
                        (spec.startCodon / this.props.proteinLength) *
                        this.props.width
                    }
                    y={y}
                    dim1={dim1}
                    dim2={dim2}
                    spec={specFeats}
                />
            );
        });
    }

    @action
    private unhoverAllComponents() {
        unhoverAllComponents(this.shapes);
        this.props.dataStore.clearHighlightFilters();
    }

    private getComponentIndex(classes: string): number | null {
        return getComponentIndex(
            classes,
            this.props.idClassPrefix || DEFAULT_ID_CLASS_PREFIX
        );
    }

    @computed private get tooltipVisible() {
        return !!this.hitZoneConfig.content;
    }

    @computed private get hitZone() {
        return initHitZoneFromConfig(this.hitZoneConfig);
    }

    get tooltipVisibleProps() {
        const tooltipVisibleProps: any = {};

        if (!this.tooltipVisible) {
            tooltipVisibleProps.visible = false;
        }

        return tooltipVisibleProps;
    }

    public componentDidMount() {
        // Make it so that if you hold down shift, you can select more than one item at once
        $(document).on('keydown', this.onKeyDown);
        $(document).on('keyup', this.onKeyUp);
    }

    componentWillUnmount() {
        $(document).off('keydown', this.onKeyDown as any);
        $(document).off('keyup', this.onKeyUp as any);
    }

    public render() {
        return (
            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                }}
            >
                <span
                    className={classnames(
                        styles.trackTitle,
                        'small',
                        `${this.props.isSubTrack ? 'subtrack-' : ''}trackTitle`
                    )}
                >
                    {this.props.trackTitle}
                </span>
                <span>
                    <DefaultTooltip
                        placement={this.getOverlayPlacement()}
                        overlay={this.getOverlay}
                        onVisibleChange={this.onTooltipVisibleChange}
                        destroyTooltipOnHide={true}
                        {...this.tooltipVisibleProps}
                    >
                        {this.hitZone}
                    </DefaultTooltip>
                    <span
                        style={{ marginLeft: this.props.xOffset }}
                        onMouseOver={this.onMouseOver}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width={this.props.width}
                            height={this.svgHeight}
                            className="track-svgnode"
                            onMouseLeave={this.onSVGMouseLeave}
                            style={{ overflow: 'visible' }}
                        >
                            <rect
                                fill="#FFFFFF"
                                x={0}
                                y={0}
                                width={this.props.width}
                                height={this.svgHeight}
                                onClick={action(this.onBackgroundClick)}
                                onMouseMove={this.onBackgroundMouseMove}
                            />
                            {!this.props.hideBaseline && (
                                <line
                                    stroke="#666666"
                                    strokeWidth="0.5"
                                    x1={0}
                                    x2={this.props.width}
                                    y1={this.svgHeight / 2}
                                    y2={this.svgHeight / 2}
                                />
                            )}
                            {this.items}
                        </svg>
                    </span>
                </span>
            </div>
        );
    }
}
