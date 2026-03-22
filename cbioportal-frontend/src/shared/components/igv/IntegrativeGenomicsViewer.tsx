import _ from 'lodash';
import * as React from 'react';
import $ from 'jquery';
import igv from 'igv';
import autobind from 'autobind-decorator';

import onNextRenderFrame from 'shared/lib/onNextRenderFrame';
import {
    getModifiedTrackNames,
    keyTracksByName,
    MUTATION_TRACK_TYPE,
    RULER_TRACK_FULL_HEIGHT,
    SEGMENT_TRACK_TYPE,
    SEQUENCE_TRACK_NAME,
    WHOLE_GENOME,
} from 'shared/lib/IGVUtils';

export type TrackProps = any; // TODO add typedef for tracks
export type ReferenceProps = {
    id: string;
    name?: string;
    fastaURL?: string;
    indexURL?: string;
    cytobandURL?: string;
    tracks?: TrackProps[];
};

export type IGVProps = {
    genome?: string;
    reference?: ReferenceProps;
    tracks?: TrackProps[];
    locus?: string | string[];
    onLocusChange?: (str: string) => void;
    disableSearch?: boolean;
    disableContextMenuSort?: boolean;
    showSearch?: boolean;
    showTrackControls?: boolean;
    showControls?: boolean;
    showTrackLabels?: boolean;
    showIdeogram?: boolean;
    showSequenceTrack?: boolean;
    showNavigation?: boolean;
    showAllChromosomes?: boolean;
    showSampleNames?: boolean;
    showChromosomeWidget?: boolean;
    showSVGButton?: boolean;
    showSampleNameButton?: boolean;
    showTrackLabelButton?: boolean;
    showCursorTrackingGuideButton?: boolean;
    showCenterGuideButton?: boolean;
    customButtons?: {
        label: string;
        callback: () => void;
    }[];
    isVisible?: boolean;
    compactRulerTrack?: boolean;
    onRenderingStart?: () => void;
    onRenderingComplete?: () => void;
};

function updateSearch(
    igvDiv: HTMLDivElement,
    showSearch?: boolean,
    disableSearch?: boolean
) {
    const chrDropdown = $(igvDiv).find(
        '.igv-chromosome-select-widget-container select'
    );
    const locusSearchBox = $(igvDiv).find('.igv-search-container input');

    if (disableSearch) {
        locusSearchBox.attr('disabled', 'true');
        chrDropdown.attr('disabled', 'true');
    } else {
        locusSearchBox.attr('disabled', null);
        chrDropdown.attr('disabled', null);
    }

    const searchContainer = $(igvDiv).find('.igv-search-container');

    if (showSearch) {
        searchContainer.show();
    } else {
        searchContainer.hide();
    }
}

function updateTrackControls(
    igvDiv: HTMLDivElement,
    showTrackControls?: boolean
) {
    const scrollBarColumn = $(igvDiv).find('.igv-scrollbar-column');
    const trackDragColumn = $(igvDiv).find('.igv-track-drag-column');
    const gearMenuColumn = $(igvDiv).find('.igv-gear-menu-column');
    const igvAxisColumn = $(igvDiv).find('.igv-axis-column');

    if (showTrackControls) {
        scrollBarColumn.show();
        trackDragColumn.show();
        gearMenuColumn.show();
        igvAxisColumn.show();
    } else {
        scrollBarColumn.hide();
        trackDragColumn.hide();
        gearMenuColumn.hide();
        igvAxisColumn.hide();
    }
}

function updateChromosomeTrack(
    browser: any,
    locus?: string | string[],
    compactRulerTrack?: boolean
) {
    const rulerTrackView = browser.getRulerTrackView();

    if (rulerTrackView) {
        const trackHeight = compactRulerTrack
            ? RULER_TRACK_FULL_HEIGHT / 2
            : RULER_TRACK_FULL_HEIGHT;
        rulerTrackView.setTrackHeight(trackHeight);
        const rulerTrackStyle = rulerTrackView.viewports[0]?.contentDiv?.style;

        if (
            rulerTrackStyle &&
            (locus === WHOLE_GENOME || locus === undefined)
        ) {
            rulerTrackStyle.top = compactRulerTrack
                ? `-${RULER_TRACK_FULL_HEIGHT / 4}px`
                : 0;
        }
    }
}

function hasLocusChanged(
    lastLocusSetWithinBrowser: string | string[] | undefined,
    currentLocus: string | string[] | undefined,
    nextLocus: string | string[] | undefined
) {
    return !_.isEqual(lastLocusSetWithinBrowser || currentLocus, nextLocus);
}

export default class IntegrativeGenomicsViewer extends React.Component<
    IGVProps,
    {}
> {
    public static defaultProps = {
        genome: 'hg19',
        locus: 'all',
        disableSearch: false,
        showSearch: true,
        showNavigation: true,
        showAllChromosomes: true,
        showChromosomeWidget: true,
        showSVGButton: true,
        showSampleNameButton: true,
        showTrackLabelButton: true,
        showCursorTrackingGuideButton: true,
        showCenterGuideButton: true,
        showTrackControls: true,
        showControls: true,
        showIdeogram: true,
        showSequenceTrack: true,
        showTrackLabels: true,
        compactRulerTrack: false,
    };

    private igvDiv: HTMLDivElement | undefined;
    private igvBrowser: any;

    private modifiedTrackNames: string[] | undefined;
    private shouldReInit = false;
    private lastRenderedTracks: TrackProps[] | undefined;
    private locus: string | string[] | undefined;

    constructor(props: IGVProps) {
        super(props);
    }

    public render() {
        return <div ref={this.igvDivRefHandler} className="igvContainer" />;
    }

    public get tracksByName(): { [trackName: string]: TrackProps } {
        return keyTracksByName(this.props.tracks);
    }

    public get browserProps() {
        return {
            // ignore genome when there is reference
            genome: this.props.reference ? undefined : this.props.genome,
            reference: this.props.reference,
            locus: this.props.locus,
            showNavigation: this.props.showNavigation,
            showChromosomeWidget: this.props.showChromosomeWidget,
            showSVGButton: this.props.showSVGButton,
            showSampleNameButton: this.props.showSampleNameButton,
            showTrackLabelButton: this.props.showTrackLabelButton,
            showCursorTrackingGuideButton: this.props
                .showCursorTrackingGuideButton,
            showCenterGuideButton: this.props.showCenterGuideButton,
            showAllChromosomes: this.props.showAllChromosomes,
            showControls: this.props.showControls,
            showIdeogram: this.props.showIdeogram,
            showTrackLabels: this.props.showTrackLabels,
            customButtons: this.props.customButtons,
        };
    }

    public initBrowser() {
        if (this.props.onRenderingStart) {
            this.props.onRenderingStart();
        }

        igv.createBrowser(this.igvDiv, this.browserProps).then(
            (browser: any) => {
                this.igvBrowser = browser;

                if (this.igvDiv) {
                    updateSearch(
                        this.igvDiv,
                        this.props.showSearch,
                        this.props.disableSearch
                    );
                    updateTrackControls(
                        this.igvDiv,
                        this.props.showTrackControls
                    );
                }

                // remove sequence track if needed
                if (!this.props.showSequenceTrack) {
                    browser.removeTrackByName(SEQUENCE_TRACK_NAME);
                }

                // deep clone, because loadTrackList method mutates the tracks object
                this.loadTrackList(
                    browser,
                    _.cloneDeep(this.props.tracks),
                    () =>
                        this.updateContextMenuSort(
                            browser,
                            this.props.disableContextMenuSort
                        )
                );

                // we need to store the list of last rendered tracks for a future comparison in the shouldComponentUpdate method,
                // because the component may still receive props when it is not visible
                this.lastRenderedTracks = this.props.tracks;

                if (this.props.onRenderingComplete) {
                    this.props.onRenderingComplete();
                }

                // register onLocusChange event handler
                browser.on('locuschange', (referenceFrameList: any[]) => {
                    const locus = referenceFrameList
                        .map(rf => rf.getLocusString())
                        .join(' ');

                    // keep record of locus changed via the IGV browser itself to prevent unnecessary render cycles
                    this.locus = locus;

                    // do not propagate the locus change event when mouse down (i.e: when panning, dragging, etc.)
                    if (
                        this.props.onLocusChange &&
                        _.isEmpty(browser.vpMouseDown)
                    ) {
                        this.props.onLocusChange(locus);
                        updateChromosomeTrack(
                            browser,
                            locus,
                            this.props.compactRulerTrack
                        );
                    }
                });
            }
        );
    }

    public updateBrowser() {
        // update locus
        if (this.igvBrowser && this.props.locus) {
            this.igvBrowser.search(this.props.locus);
        }

        // update tracks
        if (
            this.igvBrowser &&
            this.modifiedTrackNames &&
            this.modifiedTrackNames.length > 0
        ) {
            this.updateTracks(
                this.igvBrowser,
                this.modifiedTrackNames,
                this.tracksByName,
                // enable/disable context menu
                () =>
                    this.updateContextMenuSort(
                        this.igvBrowser,
                        this.props.disableContextMenuSort
                    )
            );

            this.modifiedTrackNames = undefined;
            // update the list of last rendered tracks after each update
            this.lastRenderedTracks = this.props.tracks;
        }

        if (this.igvDiv) {
            // enable/disable search
            updateSearch(
                this.igvDiv,
                this.props.showSearch,
                this.props.disableSearch
            );

            // show/hide track controls
            updateTrackControls(this.igvDiv, this.props.showTrackControls);
        }
    }

    componentDidMount() {
        this.initBrowser();
    }

    shouldComponentUpdate(nextProps: IGVProps) {
        let shouldUpdate = false;

        if (nextProps.isVisible !== false) {
            // get a list of modified tracks, we are going to update only the modified ones
            const modifiedTrackNames = getModifiedTrackNames(
                this.lastRenderedTracks || [],
                nextProps.tracks || []
            );

            const genomeChanged = this.props.genome !== nextProps.genome;
            const referenceChanged = !_.isEqual(
                this.props.reference,
                nextProps.reference
            );
            const locusChanged = hasLocusChanged(
                this.locus,
                this.props.locus,
                nextProps.locus
            );
            const searchUpdated =
                this.props.disableSearch !== nextProps.disableSearch ||
                this.props.showSearch !== nextProps.showSearch;
            const contextMenuUpdated =
                this.props.disableContextMenuSort !==
                nextProps.disableContextMenuSort;
            const trackControlsUpdated =
                this.props.showTrackControls !== nextProps.showTrackControls;
            const navBarUpdated =
                this.props.showNavigation !== nextProps.showNavigation;
            const sequenceTrackUpdated =
                this.props.showSequenceTrack !== nextProps.showSequenceTrack;
            const rulerTrackUpdated =
                this.props.compactRulerTrack !== nextProps.compactRulerTrack;

            shouldUpdate =
                genomeChanged ||
                referenceChanged ||
                navBarUpdated ||
                modifiedTrackNames.length > 0 ||
                locusChanged ||
                searchUpdated ||
                contextMenuUpdated ||
                sequenceTrackUpdated ||
                trackControlsUpdated ||
                rulerTrackUpdated;

            if (shouldUpdate) {
                // update the class reference, since we need the modified tracks names in the componentDidUpdate method
                this.modifiedTrackNames = modifiedTrackNames;
            }

            if (
                navBarUpdated ||
                genomeChanged ||
                referenceChanged ||
                sequenceTrackUpdated ||
                rulerTrackUpdated
            ) {
                this.shouldReInit = true;
            }
        }

        return shouldUpdate;
    }

    componentDidUpdate() {
        if (this.shouldReInit) {
            this.shouldReInit = false;
            igv.removeAllBrowsers();
            this.initBrowser();
        } else {
            this.updateBrowser();
        }
    }

    private loadTrackList(
        igvBrowser: any,
        tracks: TrackProps[] | undefined,
        callback?: () => void
    ) {
        igvBrowser
            .loadTrackList(tracks)
            .then(() => {
                if (this.props.onRenderingComplete) {
                    this.props.onRenderingComplete();
                }

                if (callback) {
                    callback();
                }
            })
            .catch(() => {
                if (this.props.onRenderingComplete) {
                    this.props.onRenderingComplete();
                }
            });
    }

    private updateTracks(
        igvBrowser: any,
        modifiedTrackNames: string[],
        tracksByName: { [trackName: string]: TrackProps },
        callback?: () => void
    ) {
        // first, remove all tracks to update
        modifiedTrackNames.forEach(name => igvBrowser.removeTrackByName(name));

        const tracksToLoad = modifiedTrackNames
            .map(name => _.cloneDeep(tracksByName[name]))
            .filter(track => track !== undefined);

        // reload each modified track
        if (tracksToLoad.length > 0) {
            if (this.props.onRenderingStart) {
                this.props.onRenderingStart();
            }

            // need to start loading on next render frame to be able to show "rendering" information in the loader
            onNextRenderFrame(() => {
                this.loadTrackList(igvBrowser, tracksToLoad, callback);
            });
        }
    }

    private originalContextMenuItemListFns: {
        [trackName: string]: (clickState: any) => any[];
    } = {};

    private updateContextMenuSort(
        igvBrowser: any,
        disableContextMenuSort?: boolean
    ) {
        const updateContextMenuItemListFn = (t: any, trackName: string) => {
            // save the original function to restore it later if needed
            this.originalContextMenuItemListFns[trackName] =
                this.originalContextMenuItemListFns[trackName] ||
                t.contextMenuItemList;
            // disable/enable sort functionality
            t.contextMenuItemList = disableContextMenuSort
                ? undefined
                : this.originalContextMenuItemListFns[trackName];
        };
        const mutationTracks = igvBrowser.findTracks(
            'type',
            MUTATION_TRACK_TYPE
        );
        const cnaTracks = igvBrowser.findTracks('type', SEGMENT_TRACK_TYPE);
        mutationTracks.forEach((t: any) =>
            updateContextMenuItemListFn(t, MUTATION_TRACK_TYPE)
        );
        cnaTracks.forEach((t: any) =>
            updateContextMenuItemListFn(t, SEGMENT_TRACK_TYPE)
        );
    }

    @autobind
    private igvDivRefHandler(div: HTMLDivElement) {
        this.igvDiv = div;
    }
}
