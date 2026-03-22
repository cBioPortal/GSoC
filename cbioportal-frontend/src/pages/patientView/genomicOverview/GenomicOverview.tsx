import classnames from 'classnames';
import * as React from 'react';
import _ from 'lodash';
import { CopyNumberSeg, Mutation, Sample } from 'cbioportal-ts-api-client';
import { DefaultTooltip } from 'cbioportal-frontend-commons';
import SampleManager from '../SampleManager';
import GenePanelManager from '../GenePanelManager';

import { action, computed, makeObservable, observable } from 'mobx';
import { observer } from 'mobx-react';
import {
    IKeyedIconData,
    IGV_TRACK_SAMPLE_EXPAND_HEIGHT,
} from './GenomicOverviewUtils';
import {
    calcIgvTrackHeight,
    CNA_TRACK_NAME,
    defaultGrch37ReferenceProps,
    defaultGrch38ReferenceProps,
    defaultMutationTrackProps,
    defaultSegmentTrackProps,
    generateMutationFeatures,
    generateSegmentFeatures,
    MUTATION_TRACK_NAME,
    MutationTrackFeatures,
    SegmentTrackFeatures,
    WHOLE_GENOME,
} from 'shared/lib/IGVUtils';
import { isGrch38 } from 'shared/lib/referenceGenomeUtils';
import IntegrativeGenomicsViewer from 'shared/components/igv/IntegrativeGenomicsViewer';
import CnaTrackSampleSummary from './CnaTrackSampleSummary';
import CustomIgvColumn from './CustomIgvColumn';
import GenePanelIcon from './GenePanelIcon';
import MutationTrackSampleSummary from './MutationTrackSampleSummary';

import styles from './styles.module.scss';

interface IGenomicOverviewProps {
    mergedMutations: Mutation[][];
    cnaSegments: CopyNumberSeg[];
    samples: Sample[];
    sampleOrder: { [s: string]: number };
    sampleLabels: { [s: string]: string };
    sampleColors: { [s: string]: string };
    sampleManager: SampleManager;
    containerWidth: number;
    sampleIdToMutationGenePanelId?: { [sampleId: string]: string };
    sampleIdToCopyNumberGenePanelId?: { [sampleId: string]: string };
    onSelectGenePanel?: (name: string) => void;
    disableTooltip?: boolean;
    store?: IGenomicOverviewStore;
    onResetView: () => void;
    genome?: string;
}

interface IGenomicOverviewStore {
    activeLocus: string | undefined;
}

class DefaultGenomicOverviewStore implements IGenomicOverviewStore {
    @observable
    public activeLocus: string | undefined;
}

function getCnaTrackSampleSummariesForIgvTrack(
    features: SegmentTrackFeatures[] = []
) {
    return _.entries(_.groupBy(features, f => f.sample)).map(
        ([sample, featuresGroupedBySample]) => (
            <div
                style={{ height: IGV_TRACK_SAMPLE_EXPAND_HEIGHT }}
                key={sample}
            >
                <CnaTrackSampleSummary data={featuresGroupedBySample} />
            </div>
        )
    );
}

function getMutationTrackSampleSummariesForIgvTrack(
    features: MutationTrackFeatures[] = []
) {
    return _.entries(_.groupBy(features, f => f.sample)).map(
        ([sample, featuresGroupedBySample]) => (
            <div
                style={{ height: IGV_TRACK_SAMPLE_EXPAND_HEIGHT }}
                key={sample}
            >
                <MutationTrackSampleSummary data={featuresGroupedBySample} />
            </div>
        )
    );
}

function getGenePanelInfoForIgvTrack(
    features: { sample: string }[] = [],
    genePanelIconData: IKeyedIconData,
    dataTextPrefix: string = 'genepanel-icon'
) {
    return _.entries(_.groupBy(features, f => f.sample)).map(
        ([sample, featuresGroupedBySample], index) => (
            <div
                style={{ height: IGV_TRACK_SAMPLE_EXPAND_HEIGHT }}
                key={sample}
                data-test={`${dataTextPrefix}-${index}`}
            >
                <GenePanelIcon
                    sampleId={sample}
                    genePanelIconData={genePanelIconData}
                />
            </div>
        )
    );
}

function getSampleIds(sortedSamples: { sampleId: string }[]) {
    return _.uniq(sortedSamples.map(s => s.sampleId));
}

// TODO see if it is possible to pass custom components for "customButtons"
const ResetZoomButton: React.FunctionComponent<{
    handleResetZoom?: () => void;
    className?: string;
}> = props => (
    <DefaultTooltip placement="topRight" overlay="Reset Zoom">
        <div
            className={classnames('igv-navbar-button', props.className)}
            onClick={props.handleResetZoom}
        >
            <i className="fa fa-home" />
        </div>
    </DefaultTooltip>
);

// TODO see if it is possible to pass custom components for "customButtons"
const ToggleButton: React.FunctionComponent<{
    handleSwitchView?: () => void;
    compactIgvView?: boolean;
    className?: string;
}> = props => (
    <DefaultTooltip
        placement="topRight"
        overlay={`Switch to the ${
            props.compactIgvView ? 'advanced' : 'compact'
        } view`}
    >
        <div
            className={classnames('igv-navbar-button', props.className, {
                'igv-navbar-button-clicked': !props.compactIgvView,
            })}
            onClick={props.handleSwitchView}
        >
            Advanced
        </div>
    </DefaultTooltip>
);

@observer
export default class GenomicOverview extends React.Component<
    IGenomicOverviewProps
> {
    @observable compactIgvView = true;

    private store: IGenomicOverviewStore;
    private genePanelManager: GenePanelManager;

    constructor(props: IGenomicOverviewProps) {
        super(props);
        makeObservable(this);
        this.store = props.store || new DefaultGenomicOverviewStore();
        this.genePanelManager = new GenePanelManager(
            props.sampleIdToMutationGenePanelId,
            props.sampleIdToCopyNumberGenePanelId
        );
    }

    public get tracks() {
        const tracks: any[] = [];

        const compareFn = (a: { sampleId: string }, b: { sampleId: string }) =>
            this.props.sampleOrder[a.sampleId] -
            this.props.sampleOrder[b.sampleId];

        if (this.props.mergedMutations.length > 0) {
            const sortedMutations = _.flatten(this.props.mergedMutations).sort(
                compareFn
            );
            const mutFeatures = generateMutationFeatures(sortedMutations);
            const mutHeight = calcIgvTrackHeight(
                mutFeatures,
                600,
                25,
                IGV_TRACK_SAMPLE_EXPAND_HEIGHT
            );

            tracks.push({
                ...defaultMutationTrackProps(),
                displayMode: 'EXPAND',
                sampleExpandHeight: IGV_TRACK_SAMPLE_EXPAND_HEIGHT,
                height: mutHeight,
                features: mutFeatures,
                samples: getSampleIds(sortedMutations),
            });
        }

        if (this.props.cnaSegments.length > 0) {
            // sort segments by sample order
            const sortedSegments = this.props.cnaSegments
                .slice()
                .sort(compareFn);
            const segFeatures = generateSegmentFeatures(sortedSegments);
            const segHeight = calcIgvTrackHeight(
                segFeatures,
                600,
                25,
                IGV_TRACK_SAMPLE_EXPAND_HEIGHT
            );

            tracks.push({
                ...defaultSegmentTrackProps(),
                displayMode: 'EXPAND',
                sampleExpandHeight: IGV_TRACK_SAMPLE_EXPAND_HEIGHT,
                height: segHeight,
                features: segFeatures,
                samples: getSampleIds(sortedSegments),
            });
        }

        return tracks;
    }

    @computed get igvProps() {
        const coreProps = {
            locus: this.store.activeLocus,
            onLocusChange: this.handleLocusChange,
            tracks: this.tracks,
            showTrackLabels: false,
            showAllChromosomes: false,
            showTrackControls: false,
            disableContextMenuSort: true,
            customButtons: [
                // {
                //     label: this.compactIgvView ? 'Advanced' : 'Compact',
                //     callback: this.handleSwitchView,
                // },
                {
                    label: 'Reset View',
                    callback: this.handleResetView,
                },
            ],
        };

        if (this.compactIgvView) {
            return {
                ...coreProps,
                showNavigation: false,
                showSearch: false,
                showSampleNameButton: false,
                showChromosomeWidget: false,
                showIdeogram: false,
                showSVGButton: false,
                showTrackLabelButton: false,
                showCursorTrackingGuideButton: false,
                showCenterGuideButton: false,
                showSequenceTrack: false,
                compactRulerTrack: true,
                reference: {
                    ...(isGrch38(this.props.genome || '')
                        ? defaultGrch38ReferenceProps()
                        : defaultGrch37ReferenceProps()),
                    tracks: [], // do not include RefSeq track
                },
            };
        } else {
            return {
                ...coreProps,
                genome: isGrch38(this.props.genome || '') ? 'hg38' : 'hg19',
                showNavigation: true,
                showSearch: true,
                showSampleNameButton: true,
                showChromosomeWidget: true,
                showSVGButton: true,
                showTrackLabelButton: true,
                showCursorTrackingGuideButton: true,
                showCenterGuideButton: true,
                showIdeogram: true,
                showSequenceTrack: true,
                compactRulerTrack: false,
            };
        }
    }

    @computed get shouldShowGenePanelIcons() {
        return (
            !_.isEmpty(
                this.genePanelManager.sampleIdToMutationGenePanelIconData
            ) ||
            !_.isEmpty(
                this.genePanelManager.sampleIdToCopyNumberGenePanelIconData
            )
        );
    }

    private getSampleIconsForIgvTrack(features: { sample: string }[] = []) {
        return _.uniq(features.map(f => f.sample)).map(sampleId => (
            <div
                style={{ height: IGV_TRACK_SAMPLE_EXPAND_HEIGHT }}
                key={sampleId}
            >
                {this.props.sampleManager.getComponentForSample(
                    sampleId,
                    1,
                    '',
                    null,
                    this.props.onSelectGenePanel
                )}
            </div>
        ));
    }

    public render() {
        const tracks = this.tracks;
        const mutationTrack = tracks.find(t => t.name === MUTATION_TRACK_NAME);
        const cnaTrack = tracks.find(t => t.name === CNA_TRACK_NAME);

        return (
            <div className="genomicOverviewTracksContainer">
                <div style={{ display: 'flex' }}>
                    <CustomIgvColumn
                        classname={styles.compactIgvColumn}
                        compactView={this.compactIgvView}
                        mutationTrack={this.getSampleIconsForIgvTrack(
                            mutationTrack?.features
                        )}
                        mutationTrackHeight={mutationTrack?.height}
                        cnaTrack={this.getSampleIconsForIgvTrack(
                            cnaTrack?.features
                        )}
                        cnaTrackHeight={cnaTrack?.height}
                    />
                    <div
                        className={styles.igvContainer}
                        style={{ width: this.tracksWidth }}
                    >
                        <IntegrativeGenomicsViewer {...this.igvProps} />
                    </div>
                    <CustomIgvColumn
                        classname={classnames(
                            styles.rightAlignedIgvColumn,
                            styles.rightEmbeddedIgvColumn
                        )}
                        compactView={this.compactIgvView}
                        mutationTrack={getMutationTrackSampleSummariesForIgvTrack(
                            mutationTrack?.features
                        )}
                        mutationTrackHeight={mutationTrack?.height}
                        cnaTrack={getCnaTrackSampleSummariesForIgvTrack(
                            cnaTrack?.features
                        )}
                        cnaTrackHeight={cnaTrack?.height}
                    />
                    {this.shouldShowGenePanelIcons && (
                        <CustomIgvColumn
                            classname={styles.centerAlignedIgvColumn}
                            compactView={this.compactIgvView}
                            mutationTrack={getGenePanelInfoForIgvTrack(
                                mutationTrack?.features,
                                this.genePanelManager
                                    .sampleIdToMutationGenePanelIconData,
                                'mut-track-genepanel-icon-'
                            )}
                            mutationTrackHeight={mutationTrack?.height}
                            cnaTrack={getGenePanelInfoForIgvTrack(
                                cnaTrack?.features,
                                this.genePanelManager
                                    .sampleIdToCopyNumberGenePanelIconData,
                                'cna-track-genepanel-icon-'
                            )}
                            cnaTrackHeight={cnaTrack?.height}
                        />
                    )}
                </div>
            </div>
        );
    }

    private get tracksWidth(): number {
        return this.props.containerWidth - 40;
    }

    @action.bound
    private handleLocusChange(locus: string) {
        // update the observable locus only if it is different than the current one
        // no need to update (and re-render) if it is same as the current one
        if (this.store.activeLocus !== locus) {
            this.store.activeLocus = locus;
        }

        // switch to advanced view if locus is updated to anything other than whole genome
        if (this.store.activeLocus !== WHOLE_GENOME) {
            this.compactIgvView = false;
        }
    }

    @action.bound
    private handleResetZoom() {
        // reset the observable locus to whole genome if it is not set to whole genome already
        // no need to reset (and re-render) if it is already set to whole genome
        if (this.store.activeLocus !== WHOLE_GENOME) {
            this.handleLocusChange(WHOLE_GENOME);
        }
    }

    @action.bound
    private handleResetView() {
        // reset to default view
        this.compactIgvView = true;
        this.handleResetZoom();
        this.props.onResetView();
    }

    @action.bound
    private handleSwitchView() {
        this.compactIgvView = !this.compactIgvView;
    }
}
