import React from 'react';
import {
    ITimelineConfig,
    ITrackEventConfig,
    TimelineEvent,
    TimelineTrackSpecification,
} from './types';
import _ from 'lodash';

export const configureTracks = function(
    tracks: TimelineTrackSpecification[],
    timelineConfig: ITimelineConfig,
    parentConf?: ITrackEventConfig
) {
    tracks.forEach(track => {
        const conf = timelineConfig.trackEventRenderers
            ? timelineConfig.trackEventRenderers.find(conf =>
                  conf.trackTypeMatch.test(track.type)
              )
            : undefined;

        // add top level config to each track for later reference
        track.timelineConfig = timelineConfig;

        // if we have a conf, attach it to the track for later use
        // otherwise, attach parentConf //
        if (conf) {
            track.trackConf = conf;
            conf.configureTrack(track);
        } else if (parentConf) {
            track.trackConf = parentConf;
        }

        if (track.tracks && track.tracks.length) {
            configureTracks(track.tracks, timelineConfig, conf || parentConf);
        }
    });
};
