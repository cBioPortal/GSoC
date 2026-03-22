import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';

import { OncoKbFilterValue } from '../../filter/OncoKbFilter';
import { DataFilterType } from '../../model/DataFilter';
import MutationMapperStore from '../../model/MutationMapperStore';
import { OncoKbTrackTooltip } from './OncoKbTrackTooltip';
import { default as Track, TrackProps } from './Track';
import { TrackItemSpec } from './TrackItem';
import { Mutation } from 'cbioportal-utils';

import oncoKbImg from 'oncokb-styles/dist/images/oncogenic.svg';

type OncoKbTrackProps = TrackProps & {
    store: MutationMapperStore<Mutation>;
};

export function getOncoKbImage() {
    return <img src={oncoKbImg} alt="OncoKB Oncogenic Symbol" />;
}

@observer
export default class OncoKbTrack extends React.Component<OncoKbTrackProps, {}> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }

    @computed get oncoKbSpecs(): TrackItemSpec[] {
        const filteredOncoKbDataByProteinPosStart = this.props.store
            .oncoKbDataByPosition;

        if (!_.isEmpty(filteredOncoKbDataByProteinPosStart)) {
            return _.keys(filteredOncoKbDataByProteinPosStart)
                .filter(position => Number(position) >= 0)
                .map(position => ({
                    startCodon: Number(position),
                    color: '#007FFF',
                    tooltip: (
                        <OncoKbTrackTooltip
                            usingPublicOncoKbInstance={
                                this.props.store.usingPublicOncoKbInstance
                            }
                            mutations={
                                this.props.store.mutationsByPosition[
                                    Number(position)
                                ]
                            }
                            indicatorData={
                                filteredOncoKbDataByProteinPosStart[
                                    Number(position)
                                ]
                            }
                            hugoGeneSymbol={
                                this.props.store.gene.hugoGeneSymbol
                            }
                        />
                    ),
                }));
        } else {
            return [];
        }
    }

    @computed get trackTitle() {
        return (
            <span>
                <span style={{ marginRight: 2 }}>{getOncoKbImage()}</span>
                OncoKB™
            </span>
        );
    }

    public render() {
        return (
            <Track
                dataStore={this.props.dataStore}
                defaultFilters={[
                    {
                        type: DataFilterType.ONCOKB,
                        values: [OncoKbFilterValue.Oncogenic],
                    },
                ]}
                width={this.props.width}
                xOffset={this.props.xOffset}
                proteinLength={this.props.proteinLength}
                trackTitle={this.trackTitle}
                trackItems={this.oncoKbSpecs}
                idClassPrefix={'onco-kb-'}
            />
        );
    }
}
