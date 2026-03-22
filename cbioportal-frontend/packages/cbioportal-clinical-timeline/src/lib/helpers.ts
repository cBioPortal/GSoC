import {
    POINT_COLOR,
    SegmentedAttributes,
    TimeLineColorGetter,
    TimelineEvent,
    TimelineEventAttribute,
    TimelineTick,
    TimelineTrackSpecification,
    TimelineTrackType,
} from '../types';
import { intersect } from './intersect';
import _ from 'lodash';
import { COLOR_ATTRIBUTE_KEY } from '../renderHelpers';

export const TIMELINE_TRACK_HEIGHT = 20;
export const TIMELINE_LINE_CHART_TRACK_HEIGHT = 50; // TODO: dynamic?
export const REMOVE_FOR_DOWNLOAD_CLASSNAME = 'tl-remove-for-download';

export function getTrackHeight(track: TimelineTrackSpecification) {
    switch (track.trackType) {
        case TimelineTrackType.LINE_CHART:
            return TIMELINE_LINE_CHART_TRACK_HEIGHT;
        case TimelineTrackType.DEFAULT:
        case undefined:
        default:
            return TIMELINE_TRACK_HEIGHT;
    }
}

export function getAttributeValue(name: string | RegExp, event: TimelineEvent) {
    const att = _.at(event as any, ['event.attributes']);
    const attObj = att[0]
        ? att[0].find((a: any) => {
              if (name instanceof RegExp) {
                  return name.test(a.key);
              } else {
                  return a.key === name;
              }
          })
        : undefined;
    return attObj ? attObj.value : undefined;
}

const TRIM_TICK_THRESHHOLD = 4;

const TICK_OFFSET = 30;

export function getTrimmedTicks(
    ticks: TimelineTick[],
    expandedTrims: boolean
): TimelineTick[] {
    let tickCache: TimelineTick[] = [];
    let offset = 0;

    return ticks.reduce((aggr: TimelineTick[], tick) => {
        if (tick.events!.length === 0) {
            tick.offset = offset;
            tickCache.push(tick);
            // see if we are going to collapse a new trim region
        } else {
            const isTrim =
                !expandedTrims && tickCache.length >= TRIM_TICK_THRESHHOLD;
            if (isTrim) {
                // we want to leave the first trimmed tick as a normal tick
                // because it serves as an end to last tick region
                // otherwise, it will appear as though points are inside the trimmed region

                aggr.push(tickCache[0]);

                const trimmedTicks = tickCache.slice(1, -1);

                aggr.push({
                    isTrim: true,
                    start: trimmedTicks[0].start,
                    end: trimmedTicks[0].end,
                    realEnd: trimmedTicks[trimmedTicks.length - 1].end,
                    offset: offset,
                } as TimelineTick);

                const lastTick = tickCache[tickCache.length - 1];

                offset += _.sumBy(trimmedTicks, t => t.end - t.start + 1);

                lastTick.offset = offset;

                aggr.push(lastTick);

                tickCache = []; // start new cache;
            } else {
                // we don't have enough for trim so just put em in as regular ticks
                aggr.push(...tickCache);
            }

            aggr.push(tick);
            tickCache = []; // start new cache
        }
        tick.offset = offset;
        return aggr;
    }, []);
}

export function getFullTicks(events: TimelineEvent[], tickInterval: number) {
    const ticks = [];

    const lowerBound = Math.min(...events.map(e => e.start));

    const upperBound = Math.max(...events.map(e => e.end));

    const floor = Math.floor(lowerBound / tickInterval) * tickInterval;

    let place = floor;

    const ceiling = Math.ceil(upperBound / tickInterval) * tickInterval;

    let i = 0;

    do {
        const start = place;
        const end = place + tickInterval - 1;
        ticks.push({
            start,
            end,
            events: events.filter(e => {
                return intersect(e.start, e.end, start, end);
            }),
        });
        place += tickInterval;
        i++;
    } while (place < ceiling);

    const BUFFER = 20; // Math.ceil((upperBound - lowerBound) * 0.02);

    let diff = Math.abs(ticks[0].start) - Math.abs(lowerBound);

    if (diff < BUFFER) {
        // need new tick
        ticks.unshift({
            start: ticks[0].start - BUFFER,
            end: ticks[0].start - 1,
            events: [],
        });
    } else {
        ticks[0].start = lowerBound - BUFFER;
    }

    ticks[ticks.length - 1].end = upperBound + BUFFER;

    return ticks;
}

export function getPerc(n: number, l: number) {
    return (n / l) * 100;
}

// this function accpts a raw point and adjust it according to the offsets of trimmed regions that proceed it
// this gives us a point on the timeline minus empty areas (trims) excised to avoid white space
export function getPointInTrimmedSpace(x: number, regions: TimelineTick[]) {
    const region = _.find(regions, r => {
        return r.start <= x && (r.end >= x || r.realEnd! >= x);
    });

    if (region) {
        if (region.isTrim) {
            // this point is in a trimmed region so just return the start of the trimmed region (adjusted for offset)
            return region.start - (region.offset || 0);
        } else {
            return x - (region.offset || 0);
        }
    } else {
        return undefined;
    }
}

export function getPointInTrimmedSpaceFromScreenRead(
    val: number,
    ticks: TimelineTick[]
) {
    let rem = val;
    let result = 0;
    _.forEach(ticks, tick => {
        if (!tick.isTrim) {
            if (rem >= tick.end - tick.start) {
                rem = rem - (tick.end - tick.start);
                return true;
            } else {
                result = tick.start + rem;
                return false;
            }
        } else {
            return true;
        }
    });
    return result;
}

export function sortNestedTracks(tracks: TimelineTrackSpecification[]) {
    // sort nested tracks by start date of first item
    return _.sortBy(tracks, t =>
        t.items && t.items.length ? t.items[0].start : 0
    );
}

export function formatDate(dayCount: number) {
    let negative = dayCount < 0;
    dayCount = Math.abs(dayCount);

    let years, months, days;

    years = Math.floor(dayCount / 365);
    months = Math.floor((dayCount - years * 365) / 30);
    days = Math.floor(dayCount - years * 365 - months * 30);

    let arr = [];

    if (years > 0) arr.push(`${years} year${years === 1 ? '' : 's'}`);
    if (months > 0) arr.push(`${months} month${months === 1 ? '' : 's'}`);
    if (dayCount === 0 || days > 0)
        arr.push(`${days} day${days === 1 ? '' : 's'}`);

    const formattedDate = arr.join(', ');
    return `${negative ? '-' : ''}${formattedDate}`;
}

function getAllDescendantData(
    track: TimelineTrackSpecification,
    accumulator: TimelineEvent[]
) {
    // add root items
    accumulator.push(...track.items);
    // recursively add items from nested tracks
    if (track.tracks) {
        for (const nestedTrack of track.tracks) {
            getAllDescendantData(nestedTrack, accumulator);
        }
    }
    return accumulator;
}

function flattenTrack(
    track: TimelineTrackSpecification,
    indent: number,
    isTrackCollapsed: (trackUid: string) => boolean
): { track: TimelineTrackSpecification; indent: number; height: number }[] {
    const ret = [{ track, indent, height: getTrackHeight(track) }];

    if (track.tracks) {
        if (!isTrackCollapsed(track.uid)) {
            // if track is not collapsed, then sort nested tracks and recurse
            const sortedNestedTracks = sortNestedTracks(track.tracks);
            ret.push(
                ..._.flatMap(sortedNestedTracks, t =>
                    flattenTrack(t, indent + 17, isTrackCollapsed)
                )
            );
        } else {
            // otherwise, put all nested data into root track
            ret[0].track = {
                ...track,
                items: getAllDescendantData(track, []),
            };
        }
    }

    return ret;
}

export function flattenTracks(
    tracks: TimelineTrackSpecification[],
    isTrackCollapsed: (trackUid: string) => boolean
) {
    return _.flatMap(tracks, t => flattenTrack(t, 5, isTrackCollapsed));
}

export function isTrackVisible(
    track: TimelineTrackSpecification,
    visibleTracks: string[]
) {
    return visibleTracks.includes(track.type);
}

export function getTrackEventCustomColorGetterFromConfiguration(
    track: TimelineTrackSpecification
) {
    return track.eventColorGetter || track.timelineConfig?.eventColorGetter;
}

export function defaultColorGetter(e: TimelineEvent) {
    return getSpecifiedColorIfExists(e) || POINT_COLOR;
}

export function getSpecifiedColorIfExists(e: TimelineEvent) {
    return getAttributeValue(COLOR_ATTRIBUTE_KEY, e);
}

// event color getter can be configured in a Timeline's baseConfiguration
// we want to allow configuration at that level to defer to the default color getter
// by returning undefined.
// this factory allows to run the custom configured eventColorGetter and if it returns false
// defer to the defaultColorGetter
export const colorGetterFactory = (eventColorGetter?: TimeLineColorGetter) => {
    return (e: TimelineEvent) => {
        if (eventColorGetter) {
            return eventColorGetter(e) || defaultColorGetter(e);
        } else {
            return defaultColorGetter(e);
        }
    };
};

export function segmentAndSortAttributesForTooltip(
    attributes: TimelineEventAttribute[],
    attributeOrder: string[]
) {
    const segmentedAttributes = attributes.reduce(
        (agg: SegmentedAttributes, att) => {
            if (attributeOrder?.includes(att.key)) {
                agg.first.push(att);
            } else {
                agg.rest.push(att);
            }
            return agg;
        },
        { first: [], rest: [] }
    );

    // now we need to sort the first according to the provided attribute configuration
    // make a map keyed by attr key for easy lookup
    const attrMap = _.keyBy(segmentedAttributes.first, att => att.key);
    // iterate through the configuration and get the attr object for
    // each type
    segmentedAttributes.first = _(attributeOrder)
        .map(k => attrMap[k])
        // we need to get rid of undefined if corresponding att is missing (sometimes is)
        .compact()
        .value();

    // now overwrite attributes with first followed by rest list
    return segmentedAttributes.first.concat(segmentedAttributes.rest);
}
