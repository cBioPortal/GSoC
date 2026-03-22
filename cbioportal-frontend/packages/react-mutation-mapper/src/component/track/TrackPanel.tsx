import * as React from 'react';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import {
    MobxCache,
    Mutation,
    PTM_SOURCE_URL,
    PtmSource,
} from 'cbioportal-utils';

import MutationMapperStore from '../../model/MutationMapperStore';
import { TrackName, TrackVisibility } from './TrackSelector';
import HotspotTrack from './HotspotTrack';
import OncoKbTrack from './OncoKbTrack';
import ExonTrack from './ExonTrack';
import PtmTrack from './PtmTrack';

import './defaultTrackTooltipTable.scss';
import { PtmAnnotationTableColumnId } from '../ptm/PtmAnnotationTable';
import UniprotTopologyTrack from './UniprotTopologyTrack';

type TrackPanelProps = {
    store: MutationMapperStore<Mutation>;
    pubMedCache?: MobxCache;
    geneWidth: number;
    proteinLength?: number;
    geneXOffset?: number;
    maxHeight?: number;
    trackVisibility?: TrackVisibility;
    tracks?: TrackName[];
    collapsePtmTrack?: boolean;
    collapseUniprotTopologyTrack?: boolean;
};

@observer
export default class TrackPanel extends React.Component<TrackPanelProps, {}> {
    public static defaultProps: Partial<TrackPanelProps> = {
        tracks: [
            TrackName.CancerHotspots,
            TrackName.OncoKB,
            TrackName.dbPTM,
            TrackName.Exon,
            TrackName.UniprotTopology,
        ],
    };

    constructor(props: TrackPanelProps) {
        super(props);
        makeObservable(this);
    }

    @computed get proteinLength() {
        const proteinLength = this.props.proteinLength || 0;
        return Math.max(proteinLength, 1);
    }

    get availableTracks(): { [trackName: string]: JSX.Element | null } {
        return {
            [TrackName.CancerHotspots]:
                !this.props.trackVisibility ||
                this.props.trackVisibility[TrackName.CancerHotspots] ===
                    'visible' ? (
                    <HotspotTrack
                        store={this.props.store}
                        dataStore={this.props.store.dataStore}
                        hotspotIndex={
                            this.props.store.indexedHotspotData.result || {}
                        }
                        width={this.props.geneWidth}
                        xOffset={this.props.geneXOffset}
                        proteinLength={this.proteinLength}
                    />
                ) : null,
            [TrackName.OncoKB]:
                !this.props.trackVisibility ||
                this.props.trackVisibility[TrackName.OncoKB] === 'visible' ? (
                    <OncoKbTrack
                        store={this.props.store}
                        dataStore={this.props.store.dataStore}
                        width={this.props.geneWidth}
                        xOffset={this.props.geneXOffset}
                        proteinLength={this.proteinLength}
                    />
                ) : null,
            [TrackName.dbPTM]: this.getPtmTrack(
                TrackName.dbPTM,
                PtmSource.dbPTM
            ),
            [TrackName.UniprotPTM]: this.getPtmTrack(
                TrackName.UniprotPTM,
                PtmSource.Uniprot
            ),
            [TrackName.Exon]:
                !this.props.trackVisibility ||
                this.props.trackVisibility[TrackName.Exon] === 'visible' ? (
                    <ExonTrack
                        store={this.props.store}
                        dataStore={this.props.store.dataStore}
                        width={this.props.geneWidth}
                        xOffset={this.props.geneXOffset}
                        proteinLength={this.proteinLength}
                    />
                ) : null,
            [TrackName.UniprotTopology]:
                !this.props.trackVisibility ||
                this.props.trackVisibility[TrackName.UniprotTopology] ===
                    'visible' ? (
                    <UniprotTopologyTrack
                        store={this.props.store}
                        dataStore={this.props.store.dataStore}
                        width={this.props.geneWidth}
                        xOffset={this.props.geneXOffset}
                        proteinLength={this.proteinLength}
                        collapsed={this.props.collapseUniprotTopologyTrack}
                    />
                ) : null,
        };
    }

    public render() {
        return (
            <div
                style={{
                    overflowY: 'hidden',
                    maxHeight: this.props.maxHeight,
                    position: 'relative',
                }}
                data-test="AnnotationTracks"
            >
                {this.props
                    .tracks!.map(t => this.availableTracks[t])
                    .filter(e => e !== undefined && e !== null)}
            </div>
        );
    }

    private getPtmTrack(trackName: TrackName, ptmSource: PtmSource) {
        return !this.props.trackVisibility ||
            this.props.trackVisibility[trackName] === 'visible' ? (
            <PtmTrack
                store={this.props.store}
                pubMedCache={this.props.pubMedCache}
                ensemblTranscriptId={this.props.store.activeTranscript?.result}
                dataStore={this.props.store.dataStore}
                width={this.props.geneWidth}
                xOffset={this.props.geneXOffset}
                proteinLength={this.proteinLength}
                dataSource={ptmSource}
                dataSourceUrl={PTM_SOURCE_URL[ptmSource]}
                ptmTooltipColumnOverrides={this.getPtmTooltipColumnOverrides(
                    ptmSource
                )}
                collapsed={this.props.collapsePtmTrack}
            />
        ) : null;
    }

    private getPtmTooltipColumnOverrides(ptmSource: PtmSource) {
        if (ptmSource === PtmSource.dbPTM) {
            // hide description column for dbPTM, we don't have description data.
            return {
                [PtmAnnotationTableColumnId.DESCRIPTION]: {
                    show: false,
                },
            };
        } else {
            return undefined;
        }
    }
}
