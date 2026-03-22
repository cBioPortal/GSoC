import * as React from 'react';
import * as _ from 'lodash';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';

import { default as Track, TrackProps } from './Track';
import { Collapse } from 'react-collapse';
import { TrackItemSpec } from './TrackItem';
import { MutationMapperStore } from '../../model/MutationMapperStore';
import {
    Mutation,
    UniprotTopology,
    UniprotTopologyTypeToTitle,
    UniprotTopologyTrackToColor,
} from 'cbioportal-utils';

import {
    DefaultTooltip,
    EllipsisTextTooltip,
} from 'cbioportal-frontend-commons';

type UniprotTopologyTrackProps = TrackProps & {
    store: MutationMapperStore<Mutation>;
    subTrackMargin?: number;
    collapsed?: boolean;
};

function topologyRectangleBlockSpec(
    color: string,
    title: string,
    uniprotData: UniprotTopology
) {
    return {
        color: color,
        startCodon: uniprotData.startPosition,
        endCodon: uniprotData.endPosition,
        tooltip: (
            <span>
                <h5>{title}</h5>
                Start: {uniprotData.startPosition}
                <br></br>
                End: {uniprotData.endPosition}
                <br></br>
                Length: {uniprotData.endPosition - uniprotData.startPosition}
                <br></br>
                Description: {uniprotData.description}
            </span>
        ),
    };
}

export const UniprotTopologyTrackDescriptionTooltip: React.FunctionComponent<{
    displayList: string[];
    uniprotId?: string;
}> = props => {
    const dataSourceDiv = props.uniprotId ? (
        <div>
            Data Source:{' '}
            <a
                href={`https://www.uniprot.org/uniprot/${props.uniprotId}`}
                target="_blank"
            >
                UniProt
            </a>
        </div>
    ) : (
        <div>
            Data Source:{' '}
            <a href={'https://www.uniprot.org/'} target="_blank">
                UniProt
            </a>
        </div>
    );
    return (
        <div style={{ maxWidth: 400 }}>
            <p>
                Information of the subcellular location of the mature protein.
            </p>
            {props.displayList.length > 0 && (
                <p>
                    Domains and corresponding color codes are as follows:
                    <ul>
                        {_.map(props.displayList, type => (
                            <li
                                style={{
                                    color: UniprotTopologyTrackToColor[type],
                                }}
                            >
                                <strong>
                                    {UniprotTopologyTypeToTitle[type]}
                                </strong>
                            </li>
                        ))}
                    </ul>
                </p>
            )}
            {dataSourceDiv}
        </div>
    );
};

@observer
export default class UniprotTopologyTrack extends React.Component<
    UniprotTopologyTrackProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps = {
        subTrackMargin: 25,
    };

    @observable
    private expanded = !this.props.collapsed;

    @computed get subTrackMargin() {
        return (
            this.props.subTrackMargin ||
            UniprotTopologyTrack.defaultProps.subTrackMargin
        );
    }

    @computed get subTrackTitleWidth() {
        return this.props.xOffset
            ? this.props.xOffset - this.subTrackMargin
            : 0;
    }

    @computed get uniprotTopologySpecs(): TrackItemSpec[] {
        const uniprotData = this.props.store.uniprotTopologyData.result;
        if (uniprotData && !_.isEmpty(uniprotData)) {
            return _.reduce(
                uniprotData,
                this.uniprotDataToTrackItemSpecsReducer,
                []
            );
        } else {
            return [];
        }
    }

    @computed get expander(): JSX.Element | null {
        const className = this.hasSubTracks
            ? this.mainTrackHidden
                ? 'fa fa-caret-down'
                : 'fa fa-caret-right'
            : null;

        if (className) {
            return (
                <i className={className} style={{ width: 10, marginLeft: 2 }} />
            );
        }
        return null;
    }

    @computed get mainTrackTitle() {
        return (
            <span style={{ cursor: 'pointer' }}>
                <span onClick={this.handleToggleExpand}>{this.expander}</span>
                <DefaultTooltip
                    placement="right"
                    overlay={
                        <UniprotTopologyTrackDescriptionTooltip
                            displayList={this.uniprotTopologyTypes}
                            uniprotId={this.props.store.uniprotId.result}
                        />
                    }
                    destroyTooltipOnHide={true}
                >
                    <span
                        style={{ marginLeft: 4 }}
                        onClick={this.handleToggleExpand}
                    >
                        Topology <i className="fa fa-info-circle" />
                    </span>
                </DefaultTooltip>
            </span>
        );
    }

    @computed get uniprotTopologyTypes(): string[] {
        const uniprotData = this.props.store.uniprotTopologyData.result;
        const uniprotDataByType = _.uniq(_.map(uniprotData, data => data.type));
        return uniprotDataByType || [];
    }

    @computed get uniprotTopologySubSpecs(): {
        title: string;
        specs: TrackItemSpec[];
    }[] {
        const uniprotData = this.props.store.uniprotTopologyData.result;
        const uniprotDataByType = _.groupBy(uniprotData, data => data.type);
        return _.keys(uniprotDataByType)
            .map(type => ({
                title: UniprotTopologyTypeToTitle[type],
                specs: _.reduce(
                    uniprotDataByType[type],
                    this.uniprotDataToTrackItemSpecsReducer,
                    []
                ),
            }))
            .filter(s => !_.isEmpty(s.specs));
    }

    private uniprotDataToTrackItemSpecsReducer = (
        acc: TrackItemSpec[],
        uniprotData: UniprotTopology
    ): TrackItemSpec[] => {
        const trackColor = UniprotTopologyTrackToColor[uniprotData.type];
        const trackTitle = UniprotTopologyTypeToTitle[uniprotData.type];

        if (trackTitle && trackColor) {
            acc.push(
                topologyRectangleBlockSpec(trackColor, trackTitle, uniprotData)
            );
        }
        return acc;
    };

    @computed get mainTrackHidden() {
        return this.expanded && this.hasSubTracks;
    }

    @computed get hasSubTracks() {
        return this.uniprotTopologySubSpecs.length > 0;
    }

    @computed get subTracks() {
        return this.hasSubTracks
            ? this.uniprotTopologySubSpecs.map((item, index) => (
                  <Track
                      key={item.title}
                      dataStore={this.props.dataStore}
                      xOffset={this.props.xOffset}
                      trackTitle={
                          <span
                              style={{
                                  marginLeft: this.subTrackMargin,
                                  width: this.subTrackTitleWidth,
                                  display: 'flex',
                              }}
                          >
                              <EllipsisTextTooltip
                                  text={item.title}
                                  style={{
                                      overflow: 'hidden',
                                      whiteSpace: 'nowrap',
                                      textOverflow: 'ellipsis',
                                  }}
                              />
                          </span>
                      }
                      width={this.props.width}
                      proteinLength={this.props.proteinLength}
                      trackItems={item.specs}
                      idClassPrefix={`uniprot-topology-${index}-`}
                      isSubTrack={true}
                  />
              ))
            : null;
    }

    public render() {
        return (
            <span>
                <Track
                    dataStore={this.props.dataStore}
                    width={this.props.width}
                    xOffset={this.props.xOffset}
                    proteinLength={this.props.proteinLength}
                    trackTitle={this.mainTrackTitle}
                    trackItems={
                        this.mainTrackHidden ? [] : this.uniprotTopologySpecs
                    }
                    hideBaseline={this.mainTrackHidden}
                    idClassPrefix={'uniprot-topology-track-'}
                />
                <Collapse isOpened={this.mainTrackHidden}>
                    <span>{this.subTracks}</span>
                </Collapse>
            </span>
        );
    }

    @action.bound
    private handleToggleExpand() {
        this.expanded = !this.expanded;
    }
}
