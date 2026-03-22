import {
    EventPosition,
    TickIntervalEnum,
    TimelineEvent,
    TimelineTrackSpecification,
    TimelineTrackType,
} from './types';
import { action, computed, observable, makeObservable } from 'mobx';
import {
    flattenTracks,
    getFullTicks,
    getPerc,
    getPointInTrimmedSpace,
    getTrimmedTicks,
    TIMELINE_TRACK_HEIGHT,
} from './lib/helpers';
import _ from 'lodash';

import autobind from 'autobind-decorator';
import * as React from 'react';
import { EventTooltipContent, renderPoint } from './TimelineTrack';

type TooltipModel = {
    track: TimelineTrackSpecification;
    events: TimelineEvent[];

    // if `position` is undefined, then show it at mousePosition.
    position?: { x: number; y: number };
};

export class TimelineStore {
    @observable private _expandedTrims = false;
    @observable.ref _data: TimelineTrackSpecification[];
    private collapsedTracks = observable.map({}, { deep: false });

    public uniqueId = `tl-id-` + _.random(1, 10000);

    constructor(tracks: TimelineTrackSpecification[]) {
        makeObservable<
            TimelineStore,
            '_expandedTrims' | '_lastHoveredTooltipUid'
        >(this);
        this._data = tracks;

        (window as any).timelineStore = this;
    }

    @observable enableCollapseTrack = true;

    @computed get data(): {
        track: TimelineTrackSpecification;
        indent: number;
        height: number;
    }[] {
        // flatten track structure and annotate with important info, and filter out collapsed track children
        return flattenTracks(this._data, this.isTrackCollapsed);
    }

    @action toggleTrackCollapse(trackUid: string) {
        if (this.collapsedTracks.has(trackUid)) {
            this.collapsedTracks.delete(trackUid);
        } else {
            this.collapsedTracks.set(trackUid, true);
        }
    }

    @autobind isTrackCollapsed(trackUid: string) {
        return this.collapsedTracks.has(trackUid);
    }

    @computed get sampleEvents() {
        return this.allItems.filter(event =>
            /^SPECIMEN$|^SAMPLE ACQUISITION$/i.test(event.event!.eventType)
        );
    }

    @computed get sampleIds() {
        const sampleIds: string[] = [];
        this.sampleEvents.forEach((sample, i) => {
            sample.event.attributes.forEach((attribute: any, i: number) => {
                if (attribute.key === 'SAMPLE_ID') {
                    sampleIds.push(attribute.value);
                }
            });
        });

        return sampleIds;
    }

    @computed get expandedTrims() {
        return this._expandedTrims;
    }
    @action.bound
    public toggleExpandedTrims() {
        this._expandedTrims = !this._expandedTrims;
    }

    private tooltipUidCounter = 0;
    // Have to keep tooltip index separate so it can be observable.
    // TooltipModel has recursive nested structure so its not safe to
    //  make it observable in a deep map.
    private tooltipModelsByUid = observable.map<string, TooltipModel>(
        {},
        { deep: false }
    );
    private tooltipIndexByUid = observable.map<string, number>(
        {},
        { deep: false }
    );
    @observable private _lastHoveredTooltipUid: string | null = null;
    @action
    public setHoveredTooltipUid(uid: string | null) {
        this._lastHoveredTooltipUid = uid;
    }
    @computed get hoveredTooltipUid() {
        if (
            this._lastHoveredTooltipUid &&
            this.doesTooltipExist(this._lastHoveredTooltipUid)
        ) {
            return this._lastHoveredTooltipUid;
        } else if (this.tooltipModelsByUid.size === 1) {
            return this.tooltipModelsByUid.keys().next().value; // equivalent of keys()[0] with Iterators
        } else {
            return null;
        }
    }

    @observable mousePosition = { x: 0, y: 0 };

    doesTooltipExist(uid: string) {
        return this.tooltipModelsByUid.has(uid);
    }

    @computed get tooltipModels() {
        return Array.from(this.tooltipModelsByUid.entries()).map(
            entry =>
                [...entry, this.tooltipIndexByUid.get(entry[0])!] as [
                    string,
                    TooltipModel,
                    number
                ]
        );
    }

    @action.bound
    addTooltip(model: Pick<TooltipModel, 'track' | 'events'>) {
        const tooltipUid = (this.tooltipUidCounter++).toString();
        this.tooltipModelsByUid.set(tooltipUid, model);
        this.tooltipIndexByUid.set(tooltipUid, 0);
        return tooltipUid;
    }

    @action.bound
    removeTooltip(tooltipUid: string) {
        this.tooltipModelsByUid.delete(tooltipUid);
        this.tooltipIndexByUid.delete(tooltipUid);
        if (tooltipUid === this.hoveredTooltipUid) {
            this.setHoveredTooltipUid(null);
        }
    }

    @action.bound
    removeAllTooltips() {
        this.tooltipModelsByUid.clear();
        this.tooltipIndexByUid.clear();
    }

    @action
    removeAllTooltipsExcept(tooltipUid: string) {
        const uids = Array.from(this.tooltipModelsByUid.keys());
        for (const uid of uids) {
            if (uid !== tooltipUid) {
                this.tooltipModelsByUid.delete(uid);
                this.tooltipIndexByUid.delete(uid);
            }
        }
    }

    @action.bound
    togglePinTooltip(tooltipUid: string) {
        const model = this.tooltipModelsByUid.get(tooltipUid)!;
        if (model.position) {
            model.position = undefined;
        } else {
            model.position = { ...this.mousePosition };
        }
    }

    isTooltipPinned(tooltipUid: string) {
        return !!this.tooltipModelsByUid.get(tooltipUid)!.position;
    }

    @action.bound
    nextTooltipEvent() {
        if (!this.hoveredTooltipUid) {
            return false;
        }

        const model = this.tooltipModelsByUid.get(this.hoveredTooltipUid)!;
        const currentIndex = this.tooltipIndexByUid.get(
            this.hoveredTooltipUid
        )!;
        this.tooltipIndexByUid.set(
            this.hoveredTooltipUid,
            (currentIndex + 1) % model.events.length
        );

        return true;
    }

    @action.bound
    prevTooltipEvent() {
        if (!this.hoveredTooltipUid) {
            return false;
        }

        const model = this.tooltipModelsByUid.get(this.hoveredTooltipUid)!;
        const currentIndex = this.tooltipIndexByUid.get(
            this.hoveredTooltipUid
        )!;

        let nextIndex = currentIndex - 1;
        while (nextIndex < 0) {
            nextIndex += model.events.length;
        }
        this.tooltipIndexByUid.set(this.hoveredTooltipUid, nextIndex);

        return true;
    }

    public getTooltipContent(
        uid: string,
        tooltipModel: TooltipModel,
        tooltipIndex: number
    ) {
        const activeItem = tooltipModel.events[tooltipIndex];
        let content = null;
        if (tooltipModel.track.renderTooltip) {
            content = tooltipModel.track.renderTooltip(activeItem);
        }

        if (content === null) {
            // Show default tooltip if there's no custom track tooltip renderer,
            //  or if the track renderer returns `null`
            content = (
                <EventTooltipContent
                    trackConfig={tooltipModel.track.trackConf}
                    event={activeItem}
                />
            );
        }

        const multipleItems = tooltipModel.events.length > 1;
        let point = null;
        if (multipleItems) {
            const colorGetter =
                tooltipModel.track.timelineConfig &&
                tooltipModel.track.timelineConfig.eventColorGetter;

            point = (
                <svg
                    width={TIMELINE_TRACK_HEIGHT}
                    height={TIMELINE_TRACK_HEIGHT}
                    style={{ marginRight: 5 }}
                >
                    <g transform={`translate(${TIMELINE_TRACK_HEIGHT / 2} 0)`}>
                        {renderPoint(
                            [activeItem],
                            TIMELINE_TRACK_HEIGHT / 2,
                            colorGetter
                        )}
                    </g>
                </svg>
            );
        }

        return (
            <div
                onMouseEnter={() => this.setHoveredTooltipUid(uid)}
                onMouseMove={() => this.setHoveredTooltipUid(uid)}
                onClick={() => this.removeAllTooltipsExcept(uid)}
            >
                {multipleItems && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            borderBottom: '1px dashed white',
                            paddingBottom: 3,
                            marginBottom: 3,
                        }}
                    >
                        {point}
                        {uid === this.hoveredTooltipUid && (
                            <span className="btn-group">
                                <button
                                    className="btn btn-default btn-xs"
                                    onClick={() => this.prevTooltipEvent()}
                                >
                                    &lt;
                                </button>
                                <span className="btn btn-default btn-xs">
                                    {tooltipIndex + 1} of{' '}
                                    {tooltipModel.events.length} events
                                </span>
                                <button
                                    className="btn btn-default btn-xs"
                                    onClick={() => this.nextTooltipEvent()}
                                >
                                    &gt;
                                </button>
                            </span>
                        )}
                    </div>
                )}
                {tooltipModel.track.trackType ===
                    TimelineTrackType.LINE_CHART &&
                    tooltipModel.events.length > 1 && (
                        <div>
                            <i>
                                Plotted y value is the max of simultaneous
                                events.
                            </i>
                        </div>
                    )}
                <div>{content}</div>
            </div>
        );
    }

    @action.bound
    setMousePosition(p: { x: number; y: number }) {
        this.mousePosition.x = p.x;
        this.mousePosition.y = p.y;
    }

    @computed get limit() {
        return this.lastTick.end;
    }

    @computed get tickInterval() {
        return TickIntervalEnum.YEAR;
    }

    @observable.ref zoomBounds: { start: number; end: number } | undefined;

    dragging:
        | { start: number | null; end: number | null }
        | undefined = undefined;

    @observable viewPortWidth: number = 0;
    @observable headersWidth: number = 0;

    setZoomBounds(start?: number, end?: number) {
        if (start && end) {
            this.zoomBounds = { start, end };
        } else {
            this.zoomBounds = undefined;
        }
        //setTimeout(this.setScroll.bind(this), 10);
    }

    @autobind
    getPosition(item: any): EventPosition | undefined {
        const start = getPointInTrimmedSpace(item.start, this.ticks);
        const end = getPointInTrimmedSpace(item.end || item.start, this.ticks);

        if (start === undefined || end === undefined) {
            return undefined;
        }

        // this shifts them over so that we start at zero instead of negative
        const normalizedStart = start - this.firstTick.start;
        const normalizedEnd = end - this.firstTick.start;

        const widthPerc = getPerc(
            normalizedEnd - normalizedStart,
            this.absoluteWidth
        );

        return {
            left: getPerc(normalizedStart, this.absoluteWidth) + '%',
            width: widthPerc + '%',
            pixelLeft:
                (getPerc(normalizedStart, this.absoluteWidth) / 100) *
                this.pixelWidth,
            pixelWidth: (widthPerc / 100) * this.pixelWidth,
        };
    }

    @computed get trimmedLimit() {
        return this.lastTick.end + Math.abs(this.firstTick.start);
    }

    @computed get allItems(): TimelineEvent[] {
        function getItems(track: TimelineTrackSpecification): TimelineEvent[] {
            if (track.tracks && track.tracks.length > 0) {
                return _.flatten(track.tracks.map(t => getItems(t)));
            } else {
                return track.items;
            }
        }

        const events = _.flattenDeep(this.data.map(t => getItems(t.track)));

        return _.sortBy(events, e => e.start);
    }

    @computed get ticks() {
        const fullTicks = getFullTicks(this.allItems, TickIntervalEnum.YEAR);

        return getTrimmedTicks(fullTicks, this.expandedTrims);
    }

    @computed get lastTick() {
        return this.ticks[this.ticks.length - 1];
    }

    @computed get firstTick() {
        return this.ticks[0];
    }

    @computed get absoluteWidth() {
        const start = this.firstTick.start + Math.abs(this.firstTick.start);
        const end =
            getPointInTrimmedSpace(this.lastTick.end, this.ticks)! +
            Math.abs(this.firstTick.start);
        return end - start;
    }

    @computed get zoomedWidth() {
        if (this.zoomRange) {
            return this.zoomRange.end - this.zoomRange.start;
        } else {
            return undefined;
        }
    }

    @computed get tickPixelWidth() {
        // pixel width equals total pixel width / number of ticks (trims are zero width, so discard them)
        return (
            (this.viewPortWidth * this.zoomLevel) /
            this.ticks.filter(t => !t.isTrim).length
        );
    }

    @computed get pixelWidth() {
        return this.viewPortWidth !== undefined
            ? this.viewPortWidth * this.zoomLevel
            : 0;
    }

    @computed get zoomRange() {
        if (this.zoomBounds) {
            return {
                start: getPointInTrimmedSpace(
                    this.zoomBounds.start,
                    this.ticks
                )!,
                end: getPointInTrimmedSpace(this.zoomBounds.end, this.ticks)!,
            };
        } else {
            return undefined;
        }
    }

    @computed get zoomLevel() {
        return !this.zoomedWidth ? 1 : this.absoluteWidth / this.zoomedWidth!;
    }

    @observable hoveredTrackIndex: number | undefined;
}
