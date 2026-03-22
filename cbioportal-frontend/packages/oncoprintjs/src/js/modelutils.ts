import OncoprintModel, { TrackGroupProp, TrackProp } from './oncoprintmodel';

export function calculateTrackTops(model: OncoprintModel, zoomed: boolean) {
    return calculateTrackAndHeaderTops(model, zoomed).trackTops;
}

export function calculateHeaderTops(model: OncoprintModel, zoomed: boolean) {
    return calculateTrackAndHeaderTops(model, zoomed).headerTops;
}

export function calculateTrackAndHeaderTops(
    model: OncoprintModel,
    zoomed: boolean
) {
    const trackTops: TrackProp<number> = {};
    const headerTops: TrackGroupProp<number> = {};
    const groups = model.getTrackGroups();
    let y = 0;
    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        if (group.header) {
            headerTops[i] = y;
        }
        if (group.tracks.length > 0) {
            // space at top for header
            y += model.getTrackGroupHeaderHeight(group);
        }
        for (let j = 0; j < group.tracks.length; j++) {
            const track_id = group.tracks[j];
            trackTops[track_id] = y;
            y += model.getTrackHeight(track_id, !zoomed);
        }
        if (group.tracks.length > 0) {
            // space at bottom for padding
            y += model.getTrackGroupPadding(!zoomed);
        }
    }
    return { trackTops, headerTops };
}
