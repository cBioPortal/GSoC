import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';

import { CopyNumberSeg } from 'cbioportal-ts-api-client';
import IntegrativeGenomicsViewer from 'shared/components/igv/IntegrativeGenomicsViewer';
import {
    calcIgvTrackHeight,
    defaultSegmentTrackProps,
    generateSegmentFeatures,
} from 'shared/lib/IGVUtils';
import { DEFAULT_GENOME } from '../../resultsView/ResultsViewPageStoreUtils';
import ProgressIndicator, {
    IProgressIndicatorItem,
} from 'shared/components/progressIndicator/ProgressIndicator';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import CNSegmentsDownloader from 'shared/components/cnSegments/CNSegmentsDownloader';
import WindowStore from 'shared/components/window/WindowStore';

import { StudyViewPageTabKeyEnum } from 'pages/studyView/StudyViewPageTabs';
import { StudyViewPageStore } from '../StudyViewPageStore';
import { DownloadControlOption } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';

@observer
export default class CNSegments extends React.Component<
    { store: StudyViewPageStore; sampleThreshold?: number },
    {}
> {
    @observable renderingComplete = false;
    @observable.ref segmentTrackMaxHeight: number | undefined = undefined;
    private lastSelectedLocus: string | undefined = undefined;

    public static defaultProps = {
        sampleThreshold: 20000,
    };

    constructor(props: { store: StudyViewPageStore }) {
        super(props);
        makeObservable(this);
        this.segmentTrackMaxHeight = WindowStore.size.height * 0.7;
    }

    @autobind
    private updateLastSelectedLocus(str: string) {
        this.lastSelectedLocus = str;
    }

    @computed get segmentTrackHeight() {
        return calcIgvTrackHeight(this.features, this.segmentTrackMaxHeight);
    }

    @computed get features() {
        const segments: CopyNumberSeg[] = this.activePromise
            ? this.activePromise.result || []
            : [];

        return generateSegmentFeatures(segments);
    }

    @computed get filename() {
        return `${this.props.store.downloadFilenamePrefix}segments.seg`;
    }

    @computed get isHidden() {
        return this.isLoading || !this.renderingComplete;
    }

    @computed get isLoading() {
        if (!this.isSampleCountWithinThreshold) {
            return false;
        } else {
            return this.activePromise ? this.activePromise.isPending : true;
        }
    }

    @computed get isSampleCountWithinThreshold() {
        return (
            !this.props.store.selectedSamples.result ||
            !this.props.sampleThreshold ||
            this.props.store.selectedSamples.result.length <=
                this.props.sampleThreshold
        );
    }

    @computed get activePromise() {
        return this.props.store.selectedSamples.result &&
            this.isSampleCountWithinThreshold
            ? this.props.store.cnSegments
            : undefined;
    }

    @computed get progressItems(): IProgressIndicatorItem[] {
        return this.activePromise
            ? [
                  {
                      label: 'Loading copy number segments data...',
                      promises: [this.activePromise],
                  },
                  {
                      label: 'Rendering',
                  },
              ]
            : [];
    }

    @computed get hasNoSegmentData() {
        return (
            this.activePromise?.isComplete &&
            (!this.activePromise.result ||
                this.activePromise.result.length === 0)
        );
    }

    @computed get genome() {
        const study = this.props.store.queriedPhysicalStudies.result
            ? this.props.store.queriedPhysicalStudies.result[0]
            : undefined;
        return study ? study.referenceGenome : DEFAULT_GENOME;
    }

    get selectionInfo() {
        if (!this.isSampleCountWithinThreshold) {
            return `Too many samples (>${this.props.sampleThreshold}) for copy number segmentation view, make a selection on Summary tab first.`;
        } else {
            const segmentInfo = this.hasNoSegmentData
                ? 'No segmented'
                : 'Segmented';
            const sampleCount = this.props.store.selectedSamples.result
                ? `${this.props.store.selectedSamples.result.length} `
                : '';
            const samples =
                this.props.store.selectedSamples.result?.length === 1
                    ? 'sample'
                    : 'samples';

            return `${segmentInfo} copy-number data for the selected ${sampleCount}${samples}.`;
        }
    }

    public render() {
        return (
            <div>
                <LoadingIndicator
                    isLoading={
                        this.isSampleCountWithinThreshold && this.isHidden
                    }
                    size={'big'}
                    center={true}
                >
                    <ProgressIndicator
                        getItems={() => this.progressItems}
                        show={
                            this.isSampleCountWithinThreshold && this.isHidden
                        }
                        sequential={true}
                    />
                </LoadingIndicator>
                <div style={{ marginBottom: 15, marginLeft: 15 }}>
                    <span>{this.selectionInfo}</span>
                    {!this.hasNoSegmentData && (
                        <CNSegmentsDownloader
                            promise={this.activePromise!}
                            filename={this.filename}
                            showDownload={
                                getServerConfig()
                                    .skin_hide_download_controls ===
                                DownloadControlOption.SHOW_ALL
                            }
                        />
                    )}
                </div>
                <div
                    style={
                        this.isHidden ||
                        this.hasNoSegmentData ||
                        !this.isSampleCountWithinThreshold
                            ? { opacity: 0 }
                            : undefined
                    }
                >
                    <IntegrativeGenomicsViewer
                        tracks={[
                            {
                                ...defaultSegmentTrackProps(),
                                height: this.segmentTrackHeight,
                                features: this.features,
                            },
                        ]}
                        genome={this.genome}
                        locus={this.lastSelectedLocus}
                        onLocusChange={this.updateLastSelectedLocus}
                        onRenderingStart={this.onIgvRenderingStart}
                        onRenderingComplete={this.onIgvRenderingComplete}
                        isVisible={
                            this.props.store.currentTab ===
                                StudyViewPageTabKeyEnum.CN_SEGMENTS &&
                            !this.isHidden
                        }
                    />
                </div>
            </div>
        );
    }

    @action.bound
    private onIgvRenderingStart() {
        this.renderingComplete = false;
    }

    @action.bound
    private onIgvRenderingComplete() {
        this.renderingComplete = true;
    }
}
