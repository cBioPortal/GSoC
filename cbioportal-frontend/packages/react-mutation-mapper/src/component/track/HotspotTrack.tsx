import {
    defaultHotspotFilter,
    filter3dHotspotsByMutations,
    filterLinearClusterHotspotsByMutations,
    IHotspotIndex,
    isHotspot,
    Mutation,
} from 'cbioportal-utils';
import { Hotspot } from 'genome-nexus-ts-api-client';
import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';

import { HotspotFilterValue } from '../../filter/HotspotFilter';
import { DataFilterType } from '../../model/DataFilter';
import MutationMapperStore from '../../model/MutationMapperStore';
import { HotspotInfo } from '../hotspot/HotspotInfo';
import Track, { TrackProps } from './Track';
import { TrackItemSpec } from './TrackItem';

import hotspotImg from '../../images/cancer-hotspots.svg';

type HotspotTrackProps = TrackProps & {
    store: MutationMapperStore<Mutation>;
    hotspotIndex: IHotspotIndex;
};

export function hotspotTooltip(
    mutations: Mutation[],
    hotspotIndex: IHotspotIndex,
    hotspots: Hotspot[]
) {
    const hotspotsLinearCluster = filterLinearClusterHotspotsByMutations(
        mutations,
        hotspotIndex
    );

    const hotspots3d = filter3dHotspotsByMutations(mutations, hotspotIndex);

    const hotspotCount = mutations.filter(mutation =>
        isHotspot(mutation, hotspotIndex, defaultHotspotFilter)
    ).length;

    // generate custom info
    const residues = _.uniq(hotspots.map(hotspot => hotspot.residue));
    const residuesText = <b>{`${residues.join(', ')}`}</b>;
    const pluralSuffix = residues.length > 1 ? 's' : undefined;
    const residueInfo = (
        <span>
            on residue{pluralSuffix} {residuesText}
        </span>
    );

    return (
        <HotspotInfo
            isHotspot={hotspotsLinearCluster.length > 0}
            is3dHotspot={hotspots3d.length > 0}
            count={hotspotCount}
            customInfo={residueInfo}
        />
    );
}

export function getHotspotImage() {
    return <img src={hotspotImg} alt="Recurrent Hotspot Symbol" />;
}

@observer
export default class HotspotTrack extends React.Component<
    HotspotTrackProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    @computed get hotspotSpecs(): TrackItemSpec[] {
        const filteredHotspotsByProteinPosStart = this.props.store
            .hotspotsByPosition;

        if (!_.isEmpty(filteredHotspotsByProteinPosStart)) {
            return _.keys(filteredHotspotsByProteinPosStart)
                .filter(position => Number(position) >= 0)
                .map(position => ({
                    startCodon: Number(position),
                    color: '#FF9900',
                    tooltip: hotspotTooltip(
                        this.props.store.mutationsByPosition[Number(position)],
                        this.props.store.indexedHotspotData.result || {},
                        filteredHotspotsByProteinPosStart[Number(position)]
                    ),
                }));
        } else {
            return [];
        }
    }

    @computed get trackTitle() {
        return (
            <span>
                <span style={{ marginRight: 2 }}>{getHotspotImage()}</span>
                Cancer Hotspots
            </span>
        );
    }

    public render() {
        return (
            <Track
                dataStore={this.props.dataStore}
                defaultFilters={[
                    {
                        type: DataFilterType.HOTSPOT,
                        values: [HotspotFilterValue.DefaultHotspot],
                    },
                ]}
                width={this.props.width}
                xOffset={this.props.xOffset}
                proteinLength={this.props.proteinLength}
                trackTitle={this.trackTitle}
                trackItems={this.hotspotSpecs}
                idClassPrefix={'cancer-hotspot-'}
            />
        );
    }
}
