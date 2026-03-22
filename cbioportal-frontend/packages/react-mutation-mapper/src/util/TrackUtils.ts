import { TrackName, TrackVisibility } from '../component/track/TrackSelector';

export function initDefaultTrackVisibility(): TrackVisibility {
    return {
        [TrackName.OncoKB]: 'hidden',
        [TrackName.CancerHotspots]: 'hidden',
        [TrackName.dbPTM]: 'hidden',
        [TrackName.UniprotPTM]: 'hidden',
        [TrackName.PDB]: 'hidden',
        [TrackName.Exon]: 'hidden',
        [TrackName.UniprotTopology]: 'hidden',
    };
}
