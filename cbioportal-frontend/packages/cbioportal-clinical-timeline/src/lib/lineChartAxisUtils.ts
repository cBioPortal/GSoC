import { TimelineEvent, TimelineTrackSpecification } from '../types';
import { getTrackHeight } from './helpers';
import { tickFormatNumeral } from 'cbioportal-frontend-commons';
import _ from 'lodash';

export function getTicksForLineChartAxis(track: TimelineTrackSpecification) {
    const range = getTrackValueRange(track);
    const trackHeight = getTrackHeight(track);
    const rawTickValues = [range.min, (range.min + range.max) / 2, range.max];
    return rawTickValues.map(v => ({
        label: tickFormatNumeral(v, rawTickValues),
        offset: getLineChartYCoordinateForValue(v, track, trackHeight, range),
    }));
}

export function getTrackValueRange(track: TimelineTrackSpecification) {
    // We are assuming this is a line chart track

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    let value: number | null;
    for (const event of track.items) {
        value = track.getLineChartValue!(event);
        if (value === null) {
            continue;
        }
        min = Math.min(value, min);
        max = Math.max(value, max);
    }
    if (max === min) {
        // prevent divide-by-zero and scaling issues
        max = min + 1;
    }

    return { min, max };
}

export function getLineChartYCoordinateForValue(
    value: number,
    track: TimelineTrackSpecification,
    trackHeight: number,
    trackValueRange: { min: number; max: number }
) {
    const padding = Math.min(trackHeight / 7, 15); // pad proportionally but no more padding than 15
    const plottingHeight = trackHeight - 2 * padding;
    const plottingProportion =
        (value - trackValueRange.min) /
        (trackValueRange.max - trackValueRange.min);

    return padding + (1 - plottingProportion) * plottingHeight; // 1-p because SVG y axis points down
}

export function getLineChartYCoordinateForEvents(
    events: TimelineEvent[],
    track: TimelineTrackSpecification,
    trackHeight: number,
    trackValueRange: { min: number; max: number }
) {
    let values = events.map(track.getLineChartValue!).filter(x => x !== null);
    if (values.length === 0) {
        return null;
    }

    return getLineChartYCoordinateForValue(
        _.max(values) || 0,
        track,
        trackHeight,
        trackValueRange
    );
}
