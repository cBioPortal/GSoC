import * as React from 'react';
import _ from 'lodash';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import { Collapse } from 'react-collapse';
import { Column } from 'react-table';
import {
    DefaultTooltip,
    EllipsisTextTooltip,
} from 'cbioportal-frontend-commons';
import {
    compareByPtmTypePriority,
    ptmColor,
    MobxCache,
    Mutation,
    PostTranslationalModification,
} from 'cbioportal-utils';

import MutationMapperStore from '../../model/MutationMapperStore';
import PtmAnnotationTable from '../ptm/PtmAnnotationTable';
import { default as Track, TrackProps } from './Track';
import { TrackItemSpec } from './TrackItem';

import styles from './ptmTrackStyles.module.scss';

type PtmTrackProps = TrackProps & {
    store: MutationMapperStore<Mutation>;
    pubMedCache?: MobxCache;
    ensemblTranscriptId?: string;
    subTrackMargin?: number;
    dataSource?: string;
    dataSourceUrl?: string;
    ptmTooltipColumnOverrides?: { [id: string]: Partial<Column> };
    collapsed?: boolean;
};

export const PtmTooltip: React.FunctionComponent<{
    ptms: PostTranslationalModification[];
    pubMedCache?: MobxCache;
    columnOverrides?: { [id: string]: Partial<Column> };
}> = props => {
    return (
        <PtmAnnotationTable
            data={props.ptms}
            pubMedCache={props.pubMedCache}
            columnOverrides={props.columnOverrides}
        />
    );
};

export function ptmInfoTooltip(
    transcriptId?: string,
    dataSource?: string,
    dataSourceUrl?: string
) {
    let dataSourceDiv = null;

    if (dataSource) {
        dataSourceDiv = (
            <div>
                Data Source:{' '}
                {dataSourceUrl ? (
                    <a href={dataSourceUrl} target="_blank">
                        {dataSource}
                    </a>
                ) : (
                    dataSource
                )}
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 400 }}>
            <p>
                Displays all Post Translational Modifications (PTMs) available
                {transcriptId && (
                    <span> for the Ensembl transcript {transcriptId}</span>
                )}
                .
            </p>
            <p className={styles.ptmLegend}>
                PTM types and corresponding color codes are as follows:
                <ul>
                    <li className={styles.Phosphorylation}>
                        <strong>Phosphorylation</strong>
                    </li>
                    <li className={styles.Acetylation}>
                        <strong>Acetylation</strong>
                    </li>
                    <li className={styles.Ubiquitination}>
                        <strong>Ubiquitination</strong>
                    </li>
                    <li className={styles.Methylation}>
                        <strong>Methylation</strong>
                    </li>
                    <li className={styles.multiType}>
                        <strong>Multiple Type</strong>: Sites with more than one
                        PTM type
                    </li>
                    <li className={styles.default}>
                        <strong>Other</strong>: All other PTM types
                    </li>
                </ul>
            </p>
            {dataSourceDiv}
        </div>
    );
}

function filterPtmsBySource(
    ptms: PostTranslationalModification[],
    source?: string
): PostTranslationalModification[] {
    return source ? ptms.filter(ptm => ptm.source === source) : ptms;
}

@observer
export default class PtmTrack extends React.Component<PtmTrackProps, {}> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps = {
        subTrackMargin: 25,
    };

    @observable
    private expanded = !this.props.collapsed;

    @computed get ptmSpecs(): TrackItemSpec[] {
        const ptmDataByProteinPosStart = this.props.store
            .ptmDataByProteinPosStart.result;

        if (ptmDataByProteinPosStart && !_.isEmpty(ptmDataByProteinPosStart)) {
            return _.reduce(
                ptmDataByProteinPosStart,
                this.ptmDataToTrackItemSpecsReducer,
                []
            );
        } else {
            return [];
        }
    }

    @computed get ptmSubSpecs(): { title: string; specs: TrackItemSpec[] }[] {
        const ptmDataByTypeAndProteinPosStart = this.props.store
            .ptmDataByTypeAndProteinPosStart.result;

        if (
            ptmDataByTypeAndProteinPosStart &&
            !_.isEmpty(ptmDataByTypeAndProteinPosStart)
        ) {
            return _.keys(ptmDataByTypeAndProteinPosStart)
                .sort(compareByPtmTypePriority)
                .map(type => ({
                    title: type,
                    specs: _.reduce(
                        ptmDataByTypeAndProteinPosStart[type],
                        this.ptmDataToTrackItemSpecsReducer,
                        []
                    ),
                }))
                .filter(s => !_.isEmpty(s.specs));
        } else {
            return [];
        }
    }

    @computed get mainTrackTitle() {
        return (
            <span style={{ cursor: 'pointer' }}>
                <span onClick={this.handleToggleExpand}>{this.expander}</span>
                <DefaultTooltip
                    placement="left"
                    overlay={() =>
                        ptmInfoTooltip(
                            this.props.ensemblTranscriptId,
                            this.props.dataSource,
                            this.props.dataSourceUrl
                        )
                    }
                    destroyTooltipOnHide={true}
                >
                    <span
                        style={{ marginLeft: 4 }}
                        onClick={this.handleToggleExpand}
                    >
                        PTM{' '}
                        {this.props.dataSource
                            ? `(${this.props.dataSource})`
                            : 'Sites'}{' '}
                        <i className="fa fa-info-circle" />
                    </span>
                </DefaultTooltip>
            </span>
        );
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

    @computed get subTrackMargin() {
        return (
            this.props.subTrackMargin || PtmTrack.defaultProps.subTrackMargin
        );
    }

    @computed get subTrackTitleWidth() {
        return this.props.xOffset
            ? this.props.xOffset - this.subTrackMargin
            : 0;
    }

    @computed get subTracks() {
        return this.hasSubTracks
            ? this.ptmSubSpecs.map((item, index) => (
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
                      idClassPrefix={`ptm-${index}-`}
                      isSubTrack={true}
                  />
              ))
            : null;
    }

    @computed get mainTrackHidden() {
        return this.expanded && this.hasSubTracks;
    }

    @computed get hasSubTracks() {
        return this.ptmSubSpecs.length > 0;
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
                    trackItems={this.mainTrackHidden ? [] : this.ptmSpecs}
                    hideBaseline={this.mainTrackHidden}
                    idClassPrefix={'ptm-'}
                />
                <Collapse isOpened={this.mainTrackHidden}>
                    <span>{this.subTracks}</span>
                </Collapse>
            </span>
        );
    }

    private ptmDataToTrackItemSpecsReducer = (
        acc: TrackItemSpec[],
        ptmData: PostTranslationalModification[],
        position: string
    ): TrackItemSpec[] => {
        const ptms =
            Number(position) >= 0
                ? filterPtmsBySource(ptmData, this.props.dataSource)
                : [];

        if (!_.isEmpty(ptms)) {
            acc.push({
                startCodon: Number(position),
                color: ptmColor(ptms),
                tooltip: (
                    <PtmTooltip
                        ptms={ptms}
                        pubMedCache={this.props.pubMedCache}
                        columnOverrides={this.props.ptmTooltipColumnOverrides}
                    />
                ),
            });
        }

        return acc;
    };

    @action.bound
    private handleToggleExpand() {
        this.expanded = !this.expanded;
    }
}
