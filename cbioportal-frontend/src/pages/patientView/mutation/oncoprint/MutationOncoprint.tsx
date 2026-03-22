import * as React from 'react';
import { observer } from 'mobx-react';
import Oncoprint, {
    IOncoprintProps,
} from '../../../../shared/components/oncoprint/Oncoprint';
import { MakeMobxView } from '../../../../shared/components/MobxView';
import { PatientViewPageStore } from '../../clinicalInformation/PatientViewPageStore';
import $ from 'jquery';
import {
    getDownloadData,
    getMutationLabel,
    IMutationOncoprintTrackDatum,
    IMutationOncoprintTrackSpec,
    makeMutationHeatmapData,
    MUTATION_ONCOPRINT_NA_SHAPES,
} from './MutationOncoprintUtils';
import LoadingIndicator from '../../../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../../../shared/components/ErrorMessage';
import { computed, observable, makeObservable } from 'mobx';
import {
    OncoprintJS,
    ColumnId,
    ColumnLabel,
    InitParams,
    TrackId,
} from 'oncoprintjs';
import autobind from 'autobind-decorator';
import {
    DefaultTooltip,
    DownloadControlOption,
    DownloadControls,
    remoteData,
} from 'cbioportal-frontend-commons';
import _ from 'lodash';
import SampleManager from '../../SampleManager';
import WindowStore from '../../../../shared/components/window/WindowStore';
import { generateMutationIdByGeneAndProteinChangeAndEvent } from '../../../../shared/lib/StoreUtils';
import LabeledCheckbox from '../../../../shared/components/labeledCheckbox/LabeledCheckbox';
import { mutationTooltip } from '../PatientViewMutationsTabUtils';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';
import styles from './styles.module.scss';
import PatientViewMutationsDataStore from '../PatientViewMutationsDataStore';
import { Mutation } from 'cbioportal-ts-api-client';
import ReactDOM from 'react-dom';
import PatientViewUrlWrapper from '../../PatientViewUrlWrapper';
import { getVariantAlleleFrequency } from 'shared/lib/MutationUtils';
import { getServerConfig } from 'config/config';

export interface IMutationOncoprintProps {
    store: PatientViewPageStore;
    dataStore: PatientViewMutationsDataStore;
    sampleManager: SampleManager | null;
    urlWrapper: PatientViewUrlWrapper;
}

export enum MutationOncoprintMode {
    MUTATION_TRACKS,
    SAMPLE_TRACKS,
}

const TRACK_GROUP_INDEX = 2;
const INIT_PARAMS: InitParams = {
    init_cell_width: 20,
    init_cell_padding: 1,
    cell_padding_off_cell_width_threshold: 10,
};

@observer
export default class MutationOncoprint extends React.Component<
    IMutationOncoprintProps,
    {}
> {
    private oncoprintJs: OncoprintJS | null = null;
    private oncoprint: Oncoprint | null = null;

    private get showMutationLabels() {
        const urlValue = this.props.urlWrapper.query.genomicEvolutionSettings
            .showMutationLabelsInHeatmap;
        return !urlValue || urlValue === 'true'; // default true
    }
    private set showMutationLabels(o: boolean) {
        this.props.urlWrapper.updateURL(currentParams => {
            currentParams.genomicEvolutionSettings.showMutationLabelsInHeatmap = o.toString();
            return currentParams;
        });
    }

    private get clustered(): boolean {
        const urlValue = this.props.urlWrapper.query.genomicEvolutionSettings
            .clusterHeatmap;
        if (urlValue) {
            return urlValue === 'true';
        }
        return getServerConfig().oncoprint_clustered_default;
    }

    private set clustered(o: boolean) {
        this.props.urlWrapper.updateURL(currentParams => {
            currentParams.genomicEvolutionSettings.clusterHeatmap = o.toString();
            return currentParams;
        });
    }

    private get mode(): MutationOncoprintMode {
        const transposed =
            this.props.urlWrapper.query.genomicEvolutionSettings
                .transposeHeatmap === 'true';
        return transposed
            ? MutationOncoprintMode.MUTATION_TRACKS
            : MutationOncoprintMode.SAMPLE_TRACKS;
    }
    private set mode(m: MutationOncoprintMode) {
        this.props.urlWrapper.updateURL(currentParams => {
            currentParams.genomicEvolutionSettings.transposeHeatmap = (
                m === MutationOncoprintMode.MUTATION_TRACKS
            ).toString();
            return currentParams;
        });
    }

    @observable private horzZoomSliderState = 100;
    @observable minZoom = 0;

    private minZoomUpdater: any;

    constructor(props: IMutationOncoprintProps) {
        super(props);

        makeObservable(this);

        (window as any).mutationOncoprint = this;
        this.minZoomUpdater = setInterval(() => {
            if (this.oncoprintJs) {
                this.minZoom = this.oncoprintJs.model.getMinHorzZoom();
            }
        }, 500);
    }

    componentWillUnmount() {
        clearInterval(this.minZoomUpdater);
    }

    @autobind
    private oncoprintRef(oncoprint: Oncoprint | null) {
        this.oncoprint = oncoprint;
    }

    @autobind
    private oncoprintJsRef(oncoprintJs: OncoprintJS) {
        this.oncoprintJs = oncoprintJs;
        this.oncoprintJs.onHorzZoom(z => (this.horzZoomSliderState = z));
        this.horzZoomSliderState = this.oncoprintJs.getHorzZoom();
        this.oncoprintJs.onCellMouseOver(
            (uid: string | null, track_id?: TrackId) => {
                if (
                    this.mode === MutationOncoprintMode.SAMPLE_TRACKS &&
                    uid !== null
                ) {
                    const mutation = this.mutationKeyToMutation[uid];
                    if (mutation) {
                        this.props.dataStore.setMouseOverMutation(mutation);
                    }
                } else if (
                    this.mode === MutationOncoprintMode.MUTATION_TRACKS &&
                    track_id !== undefined
                ) {
                    // set mouseover mutation based on track
                    if (this.oncoprint) {
                        const key = this.oncoprint.getTrackSpecKey(track_id);
                        const mutation = key && this.mutationKeyToMutation[key];
                        if (mutation) {
                            this.props.dataStore.setMouseOverMutation(mutation);
                        }
                    }
                } else {
                    this.props.dataStore.setMouseOverMutation(null);
                }
            }
        );
        this.oncoprintJs.onCellClick(
            (uid: ColumnId | null, track_id?: TrackId) => {
                if (
                    this.mode === MutationOncoprintMode.SAMPLE_TRACKS &&
                    uid !== null
                ) {
                    const mutation = this.mutationKeyToMutation[uid];
                    if (mutation) {
                        this.props.dataStore.toggleSelectedMutation(mutation);
                    }
                } else if (
                    this.mode === MutationOncoprintMode.MUTATION_TRACKS &&
                    track_id !== undefined
                ) {
                    if (this.oncoprint) {
                        // toggle highlighted mutation based on track
                        const key = this.oncoprint.getTrackSpecKey(track_id);
                        const mutation = key && this.mutationKeyToMutation[key];
                        if (mutation) {
                            this.props.dataStore.toggleSelectedMutation(
                                mutation
                            );
                        }
                    }
                } else {
                    this.props.dataStore.setSelectedMutations([]);
                }
            }
        );
    }

    @computed get mutations() {
        return _.flatten(this.props.dataStore.allData);
    }

    readonly sortConfig = remoteData<IOncoprintProps['sortConfig']>({
        await: () => [this.sampleIdOrder],
        invoke: () => {
            if (this.clustered) {
                return Promise.resolve({
                    clusterHeatmapTrackGroupIndex: TRACK_GROUP_INDEX,
                });
            } else if (this.mode === MutationOncoprintMode.MUTATION_TRACKS) {
                return Promise.resolve({
                    order: this.sampleIdOrder.result!,
                });
            } else {
                return Promise.resolve({});
            }
        },
    });

    // TODO: be able to highlight a track in mutation track mode
    @computed get highlightedMutationIds() {
        const mutation = this.props.dataStore.mouseOverMutation;
        const highlighted = this.props.dataStore.selectedMutations.slice();
        if (mutation) {
            highlighted.push(mutation);
        }
        return highlighted.map(
            generateMutationIdByGeneAndProteinChangeAndEvent
        );
    }

    @computed get highlightedIds() {
        if (this.mode === MutationOncoprintMode.SAMPLE_TRACKS) {
            return this.highlightedMutationIds;
        } else {
            return undefined;
        }
    }

    @computed get highlightedTracks() {
        if (this.mode === MutationOncoprintMode.MUTATION_TRACKS) {
            return this.highlightedMutationIds;
        } else {
            return undefined;
        }
    }

    readonly sampleIdOrder = remoteData({
        await: () => [this.props.store.samples],
        invoke: () => {
            if (this.props.sampleManager) {
                return Promise.resolve(
                    this.props.sampleManager.getSampleIdsInOrder()
                );
            } else {
                return Promise.resolve(
                    this.props.store.samples.result!.map(s => s.sampleId)
                );
            }
        },
    });

    readonly mutationWithIdOrder = remoteData({
        invoke: () => {
            // TODO: any specific order?
            const mutations: { mutation: Mutation; id: string }[] = [];
            for (const d of this.mutations) {
                mutations.push({
                    mutation: d,
                    id: generateMutationIdByGeneAndProteinChangeAndEvent(d),
                });
            }
            return Promise.resolve(
                _.chain(mutations)
                    .uniqBy(m => m.id)
                    .sortBy(m => getMutationLabel(m.mutation))
                    .value()
            );
        },
    });

    @autobind
    private updateOncoprintHorzZoom() {
        this.oncoprintJs &&
            this.oncoprintJs.setHorzZoom(this.horzZoomSliderState);
    }

    @autobind
    private onClickZoomIn() {
        this.oncoprintJs &&
            this.oncoprintJs.setHorzZoom(this.oncoprintJs.getHorzZoom() / 0.7);
    }

    @autobind
    private onClickZoomOut() {
        this.oncoprintJs &&
            this.oncoprintJs.setHorzZoom(this.oncoprintJs.getHorzZoom() * 0.7);
    }

    @computed get mutationKeyToMutation() {
        return _.keyBy(
            this.mutations,
            generateMutationIdByGeneAndProteinChangeAndEvent
        );
    }

    // Members that change based on the mode

    //      Column labels
    private readonly mutationModeColumnLabels = remoteData({
        await: () => [this.sampleIdOrder],
        invoke: () => {
            return Promise.resolve(
                this.sampleIdOrder.result!.reduce((labels, sampleId, index) => {
                    const labelNumber = index + 1;
                    labels[sampleId] = {
                        text: labelNumber.toString(),
                        angle_in_degrees: 0,
                        text_color: '#ffffff',
                        circle_color: this.props.sampleManager!.getColorForSample(
                            sampleId
                        ),
                        left_padding_percent: labelNumber < 10 ? -15 : -34, // label padding depending on how many digits in number
                    };
                    return labels;
                }, {} as { [sampleId: string]: ColumnLabel })
            );
        },
    });

    private readonly sampleModeColumnLabels = remoteData({
        invoke: () => {
            const ret: { [uid: string]: ColumnLabel } = {};
            if (this.showMutationLabels) {
                for (const mutation of this.mutations) {
                    ret[
                        generateMutationIdByGeneAndProteinChangeAndEvent(
                            mutation
                        )
                    ] = {
                        text: getMutationLabel(mutation),
                    };
                }
            }
            return Promise.resolve(ret);
        },
    });

    @computed get columnLabels() {
        switch (this.mode) {
            case MutationOncoprintMode.MUTATION_TRACKS:
                return this.mutationModeColumnLabels;
            case MutationOncoprintMode.SAMPLE_TRACKS:
            default:
                return this.sampleModeColumnLabels;
        }
    }

    //      Heatmap tracks order
    readonly sampleModeHeatmapTracksOrder = remoteData({
        await: () => [this.sampleIdOrder],
        invoke: () => {
            if (this.clustered) {
                return Promise.resolve(undefined);
            } else {
                return Promise.resolve({
                    [TRACK_GROUP_INDEX]: this.sampleIdOrder.result!,
                });
            }
        },
    });

    readonly mutationModeHeatmapTracksOrder = remoteData({
        await: () => [this.mutationWithIdOrder],
        invoke: () => {
            if (this.clustered) {
                return Promise.resolve(undefined);
            } else {
                return Promise.resolve({
                    [TRACK_GROUP_INDEX]: this.mutationWithIdOrder.result!.map(
                        m => m.id
                    ),
                });
            }
        },
    });

    @computed get heatmapTracksOrder() {
        switch (this.mode) {
            case MutationOncoprintMode.MUTATION_TRACKS:
                return this.mutationModeHeatmapTracksOrder;
            case MutationOncoprintMode.SAMPLE_TRACKS:
            default:
                return this.sampleModeHeatmapTracksOrder;
        }
    }

    //      Heatmap tracks
    private readonly sampleModeHeatmapTracks = remoteData<
        IMutationOncoprintTrackSpec[]
    >({
        await: () => [
            this.props.store.samples,
            this.sampleIdOrder,
            this.props.store.mutationMolecularProfile,
            this.props.store.coverageInformation,
        ],
        invoke: () => {
            if (this.mutations.length === 0) {
                return Promise.resolve([]);
            }
            const profile = this.props.store.mutationMolecularProfile.result!;
            const trackData = makeMutationHeatmapData(
                this.props.store.samples.result!,
                this.mutations,
                this.props.store.coverageInformation.result!,
                MutationOncoprintMode.SAMPLE_TRACKS
            );
            const tracks: IMutationOncoprintTrackSpec[] = [];
            this.sampleIdOrder.result!.forEach((sampleId, index) => {
                const data = trackData[sampleId];
                if (!data || !data.length) {
                    return;
                }
                const circleColor = this.props.sampleManager
                    ? this.props.sampleManager.getColorForSample(sampleId)
                    : undefined;
                const labelNumber = index + 1;
                tracks.push({
                    key: sampleId,
                    label: `${labelNumber}`,
                    description: `${sampleId} data from ${profile.molecularProfileId}`,
                    molecularProfileId: profile.molecularProfileId,
                    molecularAlterationType: profile.molecularAlterationType,
                    datatype: profile.datatype,
                    data,
                    trackGroupIndex: TRACK_GROUP_INDEX,
                    naLegendLabel: 'Not sequenced',
                    labelColor: circleColor ? 'white' : 'black',
                    labelCircleColor: circleColor,
                    labelFontWeight: 'normal',
                    labelLeftPadding: labelNumber < 10 ? 21 : 17, // label padding depending on how many digits in number
                    hasColumnSpacing: true,
                    tooltip: (data: IMutationOncoprintTrackDatum[]) => {
                        const d = data[0];
                        const vafReport = getVariantAlleleFrequency(d.mutation);
                        const tooltipJSX = mutationTooltip(d.mutation, {
                            sampleId: d.sample!,
                            mutationStatus: d.mutationStatus,
                            vafReport,
                        });
                        // convert JSX into HTML string by rendering to dummy element then using innerHTML
                        const dummyElt = document.createElement('div');
                        ReactDOM.render(tooltipJSX, dummyElt);
                        const html = dummyElt.innerHTML;
                        return $(html);
                    },
                    sortDirectionChangeable: false,
                    initSortDirection: -1 as -1,
                    movable: false,
                    customNaShapes: MUTATION_ONCOPRINT_NA_SHAPES,
                });
            });
            return Promise.resolve(tracks);
        },
    });

    private readonly mutationModeHeatmapTracks = remoteData<
        IMutationOncoprintTrackSpec[]
    >({
        await: () => [
            this.props.store.samples,
            this.mutationWithIdOrder,
            this.props.store.mutationMolecularProfile,
            this.props.store.coverageInformation,
        ],
        invoke: () => {
            if (this.mutations.length === 0) {
                return Promise.resolve([]);
            }
            const profile = this.props.store.mutationMolecularProfile.result!;
            const trackData = makeMutationHeatmapData(
                this.props.store.samples.result!,
                this.mutations,
                this.props.store.coverageInformation.result!,
                MutationOncoprintMode.MUTATION_TRACKS
            );
            const tracks: IMutationOncoprintTrackSpec[] = [];
            this.mutationWithIdOrder.result!.forEach(mutationWithId => {
                const data = trackData[mutationWithId.id];
                if (!data || !data.length) {
                    return;
                }
                tracks.push({
                    key: mutationWithId.id,
                    label: getMutationLabel(mutationWithId.mutation),
                    description: `${getMutationLabel(
                        mutationWithId.mutation
                    )} data from ${profile.molecularProfileId}`,
                    molecularProfileId: profile.molecularProfileId,
                    molecularAlterationType: profile.molecularAlterationType,
                    datatype: profile.datatype,
                    data,
                    trackGroupIndex: TRACK_GROUP_INDEX,
                    naLegendLabel: 'Not sequenced',
                    labelFontWeight: 'normal',
                    hasColumnSpacing: true,
                    tooltip: (data: IMutationOncoprintTrackDatum[]) => {
                        const d = data[0];
                        const vafReport = getVariantAlleleFrequency(d.mutation);
                        const tooltipJSX = mutationTooltip(d.mutation, {
                            sampleId: d.sample!,
                            mutationStatus: d.mutationStatus,
                            vafReport,
                        });
                        // convert JSX into HTML string by rendering to dummy element then using innerHTML
                        const dummyElt = document.createElement('div');
                        ReactDOM.render(tooltipJSX, dummyElt);
                        const html = dummyElt.innerHTML;
                        return $(html);
                    },
                    sortDirectionChangeable: false,
                    initSortDirection: -1 as -1,
                    movable: false,
                    customNaShapes: MUTATION_ONCOPRINT_NA_SHAPES,
                });
            });
            return Promise.resolve(tracks);
        },
    });

    @computed get heatmapTracks() {
        switch (this.mode) {
            case MutationOncoprintMode.MUTATION_TRACKS:
                return this.mutationModeHeatmapTracks; // TODO
            case MutationOncoprintMode.SAMPLE_TRACKS:
            default:
                return this.sampleModeHeatmapTracks;
        }
    }

    // View elements

    @computed get zoomControls() {
        return (
            <div className={styles.zoomControls}>
                <DefaultTooltip
                    overlay={<span>Zoom out of heatmap</span>}
                    placement="top"
                >
                    <div
                        onClick={this.onClickZoomOut}
                        className={styles.zoomButton}
                    >
                        <i className="fa fa-search-minus"></i>
                    </div>
                </DefaultTooltip>
                <DefaultTooltip
                    overlay={<span>Zoom in/out of heatmap</span>}
                    placement="top"
                >
                    <div style={{ width: '90px' }}>
                        <Slider
                            value={this.horzZoomSliderState}
                            onChange={(z: number) =>
                                (this.horzZoomSliderState = z)
                            }
                            onChangeComplete={this.updateOncoprintHorzZoom}
                            step={0.01}
                            max={1}
                            min={this.minZoom}
                            tooltip={false}
                        />
                    </div>
                </DefaultTooltip>
                <DefaultTooltip
                    overlay={<span>Zoom in to heatmap</span>}
                    placement="top"
                >
                    <div
                        className={styles.zoomButton}
                        onClick={this.onClickZoomIn}
                    >
                        <i className="fa fa-search-plus"></i>
                    </div>
                </DefaultTooltip>
            </div>
        );
    }

    @computed get header() {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 5,
                }}
            >
                <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <LabeledCheckbox
                        checked={this.clustered}
                        onChange={() => {
                            this.clustered = !this.clustered;
                        }}
                        labelProps={{ style: { marginRight: 10 } }}
                        inputProps={{ 'data-test': 'HeatmapCluster' }}
                    >
                        <span style={{ marginTop: -3 }}>Cluster</span>
                    </LabeledCheckbox>
                    <LabeledCheckbox
                        checked={
                            this.mode === MutationOncoprintMode.MUTATION_TRACKS
                        }
                        onChange={() => {
                            this.mode =
                                this.mode ===
                                MutationOncoprintMode.MUTATION_TRACKS
                                    ? MutationOncoprintMode.SAMPLE_TRACKS
                                    : MutationOncoprintMode.MUTATION_TRACKS;
                        }}
                        labelProps={{ style: { marginRight: 10 } }}
                        inputProps={{ 'data-test': 'HeatmapTranspose' }}
                    >
                        <span style={{ marginTop: -3 }}>Transpose</span>
                    </LabeledCheckbox>
                    <LabeledCheckbox
                        checked={this.showMutationLabels}
                        onChange={() => {
                            this.showMutationLabels = !this.showMutationLabels;
                        }}
                        labelProps={{ style: { marginRight: 10 } }}
                        inputProps={{ 'data-test': 'HeatmapMutationLabels' }}
                    >
                        <span style={{ marginTop: -3 }}>
                            Show mutation labels
                        </span>
                    </LabeledCheckbox>
                    {this.zoomControls}
                </div>
                <DownloadControls
                    filename="vafHeatmap"
                    getSvg={() =>
                        this.oncoprintJs ? this.oncoprintJs.toSVG(true) : null
                    }
                    getData={() => {
                        const data = _.flatMap(
                            this.heatmapTracks.result!,
                            track => track.data
                        );
                        return getDownloadData(data);
                    }}
                    buttons={['SVG', 'PNG', 'Data']}
                    type="button"
                    dontFade
                    style={{
                        marginLeft: 10,
                    }}
                    showDownload={
                        getServerConfig().skin_hide_download_controls ===
                        DownloadControlOption.SHOW_ALL
                    }
                />
            </div>
        );
    }

    private readonly oncoprintUI = MakeMobxView({
        await: () => [
            this.heatmapTracks,
            this.heatmapTracksOrder,
            this.columnLabels,
            this.sortConfig,
        ],
        render: () => {
            if (this.heatmapTracks.result!.length === 0) {
                return null;
            } else {
                return (
                    <div
                        className="borderedChart"
                        style={{ display: 'inline-block' }}
                    >
                        {this.header}
                        <Oncoprint
                            key="MutationOncoprint"
                            ref={this.oncoprintRef}
                            broadcastOncoprintJsRef={this.oncoprintJsRef}
                            highlightedIds={this.highlightedIds}
                            highlightedTracks={this.highlightedTracks}
                            initParams={INIT_PARAMS}
                            keepSorted={true}
                            showTrackLabels={
                                !(
                                    this.mode ===
                                        MutationOncoprintMode.MUTATION_TRACKS &&
                                    !this.showMutationLabels
                                )
                            }
                            columnLabels={this.columnLabels.result!}
                            clinicalTracks={[]}
                            geneticTracks={[]}
                            genesetHeatmapTracks={[]}
                            categoricalTracks={[]}
                            heatmapTracks={this.heatmapTracks.result!}
                            heatmapTracksOrder={this.heatmapTracksOrder.result}
                            divId="MutationHeatmap"
                            width={WindowStore.size.width - 100}
                            caseLinkOutInTooltips={false}
                            sortConfig={this.sortConfig.result!}
                        />
                    </div>
                );
            }
        },
        renderPending: () => <LoadingIndicator isLoading={true} />,
        renderError: () => <ErrorMessage />,
        showLastRenderWhenPending: true,
    });

    render() {
        return this.oncoprintUI.component;
    }
}
