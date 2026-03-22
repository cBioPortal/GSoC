import * as React from 'react';
import { action, computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';

import { CheckedSelect, Option } from 'cbioportal-frontend-commons';

export type TrackVisibility = { [trackName: string]: 'visible' | 'hidden' };
export type TrackDataStatus = {
    [trackName: string]: 'pending' | 'error' | 'complete' | 'empty';
};

export enum TrackName {
    PDB = 'PDB',
    CancerHotspots = 'CANCER_HOTSPOTS',
    OncoKB = 'ONCO_KB',
    dbPTM = 'DB_PTM',
    UniprotPTM = 'UNIPROT_PTM',
    Exon = 'EXON',
    UniprotTopology = 'UNIPROT_TOPOLOGY',
}

type TrackSelectorProps = {
    tracks?: TrackName[];
    trackVisibility: TrackVisibility;
    trackDataStatus?: TrackDataStatus;
    onChange: (selectedTrackIds: string[]) => void;
    name?: string;
    placeholder?: string;
};

@observer
export default class TrackSelector extends React.Component<
    TrackSelectorProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps: Partial<TrackSelectorProps> = {
        name: 'mutationMapperTrackSelector',
        placeholder: 'Add annotation tracks',
        tracks: [
            TrackName.CancerHotspots,
            TrackName.OncoKB,
            TrackName.dbPTM,
            TrackName.PDB,
            TrackName.Exon,
            TrackName.UniprotTopology,
        ],
    };

    @action.bound
    private onChange(values: { value: string }[]) {
        this.props.onChange(values.map(o => o.value));
    }

    @computed get selectedValues() {
        return Object.keys(this.props.trackVisibility)
            .filter(id => this.props.trackVisibility[id] === 'visible')
            .map(id => ({ value: id }));
    }

    @computed get availableOptions() {
        return {
            [TrackName.CancerHotspots]: {
                label: (
                    <span data-test="CancerHotspots">
                        Cancer Hotspots
                        {this.isPending(TrackName.CancerHotspots) &&
                            this.loaderIcon()}
                    </span>
                ),
                value: TrackName.CancerHotspots,
            },
            [TrackName.OncoKB]: {
                label: (
                    <span>
                        OncoKB™
                        {this.isPending(TrackName.OncoKB) && this.loaderIcon()}
                    </span>
                ),
                value: TrackName.OncoKB,
            },
            [TrackName.dbPTM]: {
                label: (
                    <span>
                        Post Translational Modifications (dbPTM)
                        {this.isPending(TrackName.dbPTM) && this.loaderIcon()}
                    </span>
                ),
                value: TrackName.dbPTM,
            },
            [TrackName.UniprotPTM]: {
                label: (
                    <span>
                        Post Translational Modifications (Uniprot)
                        {this.isPending(TrackName.UniprotPTM) &&
                            this.loaderIcon()}
                    </span>
                ),
                value: TrackName.UniprotPTM,
            },
            [TrackName.PDB]: {
                label: (
                    <span>
                        3D Structure
                        {this.isPending(TrackName.PDB) && this.loaderIcon()}
                    </span>
                ),
                value: TrackName.PDB,
                disabled: this.isDisabled(TrackName.PDB),
            },
            [TrackName.Exon]: {
                label: (
                    <span>
                        Exon
                        {this.isPending(TrackName.Exon) && this.loaderIcon()}
                    </span>
                ),
                value: TrackName.Exon,
            },
            [TrackName.UniprotTopology]: {
                label: (
                    <span>
                        Uniprot Topology
                        {this.isPending(TrackName.UniprotTopology) &&
                            this.loaderIcon()}
                    </span>
                ),
                value: TrackName.UniprotTopology,
            },
        };
    }

    @computed get options(): Option[] {
        return this.props
            .tracks!.filter(t => this.props.trackVisibility[t] !== undefined)
            .map(t => this.availableOptions[t]);
    }

    private isPending(trackName: string) {
        return (
            this.props.trackDataStatus &&
            this.props.trackDataStatus[trackName] === 'pending'
        );
    }

    private isDisabled(trackName: string) {
        return (
            this.props.trackDataStatus &&
            this.props.trackDataStatus[trackName] !== 'complete'
        );
    }

    private loaderIcon() {
        return (
            <span
                style={{
                    display: 'inline-block',
                    verticalAlign: 'bottom',
                    marginLeft: 5,
                }}
            >
                <i className="fa fa-spinner fa-pulse" />
            </span>
        );
    }

    public render() {
        return (
            <CheckedSelect
                name={this.props.name}
                placeholder={this.props.placeholder}
                onChange={this.onChange}
                options={this.options}
                value={this.selectedValues}
            />
        );
    }
}
