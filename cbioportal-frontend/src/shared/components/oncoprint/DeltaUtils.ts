import {
    CLINICAL_TRACK_GROUP_INDEX,
    ClinicalTrackSpec,
    GENETIC_TRACK_GROUP_INDEX,
    GeneticTrackSpec,
    IBaseHeatmapTrackDatum,
    ICategoricalTrackSpec,
    IGenesetHeatmapTrackSpec,
    IHeatmapTrackSpec,
    IOncoprintProps,
} from './Oncoprint';
import {
    OncoprintJS,
    ICategoricalRuleSetParams,
    SortConfig,
    TrackId,
    UserTrackSpec,
} from 'oncoprintjs';
import _ from 'lodash';
import {
    getCategoricalTrackRuleSetParams,
    getClinicalTrackRuleSetParams,
    getGenesetHeatmapTrackRuleSetParams,
    getGeneticTrackRuleSetParams,
    getHeatmapTrackRuleSetParams,
} from './OncoprintUtils';
import {
    getClinicalTrackSortComparator,
    getGeneticTrackSortComparator,
    heatmapTrackSortComparator,
    categoricalTrackSortComparator,
    getClinicalTrackSortDirection,
} from './SortUtils';
import {
    linebreakGenesetId,
    makeCategoricalTrackTooltip,
    makeClinicalTrackTooltip,
    makeHeatmapTrackTooltip,
} from './TooltipUtils';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { AlterationTypeConstants } from 'shared/constants';
import ifNotDefined from '../../lib/ifNotDefined';
import {
    DataUnderMouse,
    makeGeneticTrackTooltip,
} from 'shared/components/oncoprint/makeGeneticTrackTooltip';
import $ from 'jquery';
import getCustomJsFunctions from 'shared/getCustomJsFunctions';

// This file implements functions that call imperative OncoprintJS library
//  methods in order to keep the oncoprint in a state consistent with the
//  specified props. In essence, it's transforming declarative logic into
//  imperative logic by executing "transitions" from the previous props
//  to the new props.

export function transition(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS,
    getTrackSpecKeyToTrackId: () => { [key: string]: TrackId },
    getMolecularProfileMap: () =>
        | { [molecularProfileId: string]: MolecularProfile }
        | undefined
) {
    const notKeepingSorted = shouldNotKeepSortedForTransition(
        nextProps,
        prevProps
    );
    const suppressingRendering = shouldSuppressRenderingForTransition(
        nextProps,
        prevProps
    );
    if (suppressingRendering) {
        doSuppressRendering(nextProps, oncoprint);
    }
    if (notKeepingSorted) {
        oncoprint.keepSorted(false);
    }
    trySuppressRendering(nextProps, prevProps, oncoprint);
    transitionWidth(nextProps, prevProps, oncoprint);
    transitionColumnLabels(nextProps, prevProps, oncoprint);
    transitionWhitespaceBetweenColumns(nextProps, prevProps, oncoprint);
    transitionShowMinimap(nextProps, prevProps, oncoprint);
    transitionOnMinimapCloseCallback(nextProps, prevProps, oncoprint);
    transitionShowTrackLabels(nextProps, prevProps, oncoprint);
    transitionShowSublabels(nextProps, prevProps, oncoprint);
    transitionTrackHeaders(nextProps, prevProps, oncoprint);
    transitionTracks(
        nextProps,
        prevProps,
        oncoprint,
        getTrackSpecKeyToTrackId,
        getMolecularProfileMap
    );
    transitionSortConfig(nextProps, prevProps, oncoprint);
    transitionTrackGroupSortPriority(nextProps, prevProps, oncoprint);
    transitionHiddenIds(nextProps, prevProps, oncoprint);
    transitionHorzZoomToFit(nextProps, prevProps, oncoprint);
    transitionShowClinicalTrackLegends(
        nextProps,
        prevProps,
        oncoprint,
        getTrackSpecKeyToTrackId
    );
    transitionHighlightedIds(nextProps, prevProps, oncoprint);
    transitionHighlightedTracks(
        nextProps,
        prevProps,
        oncoprint,
        getTrackSpecKeyToTrackId
    );
    tryReleaseRendering(nextProps, prevProps, oncoprint);
    tryKeepSorted(nextProps, prevProps, oncoprint);
    if (notKeepingSorted) {
        oncoprint.keepSorted(!!nextProps.keepSorted);
    }
    if (suppressingRendering) {
        doReleaseRendering(nextProps, oncoprint);
    }
}

function transitionTrackHeaders(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS
) {
    if (
        !_.isEqual(
            nextProps.additionalTrackGroupHeaders,
            prevProps.additionalTrackGroupHeaders
        )
    ) {
        const nextHeaders = nextProps.additionalTrackGroupHeaders || {};
        const prevHeaders = prevProps.additionalTrackGroupHeaders || {};

        const nextIndexes = Object.keys(nextHeaders).map(x => parseInt(x, 10));
        const prevIndexes = Object.keys(prevHeaders).map(x => parseInt(x, 10));

        for (const index of nextIndexes) {
            oncoprint.setTrackGroupHeader(index, nextHeaders[index]);
        }
        for (const index of prevIndexes) {
            if (!(index in nextHeaders)) {
                oncoprint.setTrackGroupHeader(index, undefined);
            }
        }
    }
}

function transitionWidth(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS
) {
    if (nextProps.width !== prevProps.width) {
        oncoprint.setWidth(nextProps.width);
    }
}

export function transitionHighlightedIds(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS
) {
    if (nextProps.highlightedIds !== prevProps.highlightedIds) {
        oncoprint.setHighlightedIds(nextProps.highlightedIds || []);
    }
}

export function transitionHighlightedTracks(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS,
    getTrackSpecKeyToTrackId: () => { [key: string]: TrackId }
) {
    if (nextProps.highlightedTracks !== prevProps.highlightedTracks) {
        const highlightedTrackKeys = nextProps.highlightedTracks || [];
        const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
        oncoprint.setHighlightedTracks(
            highlightedTrackKeys.map(key => trackSpecKeyToTrackId[key])
        );
    }
}

export function transitionShowTrackLabels(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS
) {
    if (nextProps.showTrackLabels !== prevProps.showTrackLabels) {
        oncoprint.setShowTrackLabels(!!nextProps.showTrackLabels);
    }
}

export function transitionShowSublabels(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS
) {
    if (nextProps.showSublabels !== prevProps.showSublabels) {
        oncoprint.setShowTrackSublabels(!!nextProps.showSublabels);
    }
}

type TrackSpecsWithDynamicGroups = {
    heatmapTracks: { trackGroupIndex: number }[];
    genesetHeatmapTracks: { trackGroupIndex: number }[];
};

type GenericAssayProfileToTrackIdMap = {
    [molecularProfileId: string]: undefined | TrackId;
};

export function transitionTrackGroupSortPriority(
    nextProps: TrackSpecsWithDynamicGroups,
    prevProps: Partial<TrackSpecsWithDynamicGroups>,
    oncoprint: OncoprintJS
) {
    const prevHeatmapTrackGroups = _.sortBy(
        _.uniq(
            (prevProps.heatmapTracks || [])
                .concat(prevProps.genesetHeatmapTracks || [])
                .map(x => x.trackGroupIndex)
        )
    );
    const nextHeatmapTrackGroups = _.sortBy(
        _.uniq(
            nextProps.heatmapTracks
                .concat(nextProps.genesetHeatmapTracks)
                .map(x => x.trackGroupIndex)
        )
    );
    if (_.xor(nextHeatmapTrackGroups, prevHeatmapTrackGroups).length) {
        // if track groups have changed
        oncoprint.setTrackGroupSortPriority(
            [CLINICAL_TRACK_GROUP_INDEX]
                .concat(nextHeatmapTrackGroups)
                .concat(GENETIC_TRACK_GROUP_INDEX)
        );
    }
}

function doSuppressRendering(
    nextProps: IOncoprintProps,
    oncoprint: OncoprintJS
) {
    oncoprint.suppressRendering();
    nextProps.onSuppressRendering && nextProps.onSuppressRendering();
}

function doReleaseRendering(
    nextProps: IOncoprintProps,
    oncoprint: OncoprintJS
) {
    oncoprint.releaseRendering(nextProps.onReleaseRendering);
}

function tryKeepSorted(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS
) {
    if (nextProps.keepSorted && !prevProps.keepSorted) {
        oncoprint.keepSorted(true);
    } else if (!nextProps.keepSorted && prevProps.keepSorted) {
        oncoprint.keepSorted(false);
    }
}

function trySuppressRendering(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS
) {
    if (nextProps.suppressRendering && !prevProps.suppressRendering) {
        doSuppressRendering(nextProps, oncoprint);
    }
}

function tryReleaseRendering(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS
) {
    if (!nextProps.suppressRendering && prevProps.suppressRendering) {
        doReleaseRendering(nextProps, oncoprint);
    }
}

function transitionColumnLabels(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS
) {
    if (!_.isEqual(nextProps.columnLabels, prevProps.columnLabels)) {
        oncoprint.setColumnLabels(nextProps.columnLabels || {});
    }
}

function transitionHorzZoomToFit(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS
) {
    if (!_.isEqual(nextProps.horzZoomToFitIds, prevProps.horzZoomToFitIds)) {
        oncoprint.updateHorzZoomToFitIds(nextProps.horzZoomToFitIds || []);
    }
}

export function numTracksWhoseDataChanged(
    nextTracks: { key: string; data: any }[],
    prevTracks: { key: string; data: any }[]
) {
    let ret = 0;
    const prevTracksMap = _.keyBy(prevTracks, x => x.key);
    const tracksInBothPrevAndNext: { [key: string]: boolean } = {};
    let numTracksAdded = 0;
    let numTracksInBothPrevAndNext = 0;
    let numTracksDataChanged = 0;
    for (const nextTrack of nextTracks) {
        const prevTrack = prevTracksMap[nextTrack.key];
        if (!prevTrack) {
            numTracksAdded += 1;
        } else {
            numTracksInBothPrevAndNext += 1;
            if (prevTrack.data !== nextTrack.data) {
                numTracksDataChanged += 1;
            }
        }
    }
    const numTracksDeleted = prevTracks.length - numTracksInBothPrevAndNext;
    return numTracksAdded + numTracksDeleted + numTracksDataChanged;
}

function differentTracksOrChangedData(
    nextTracks: { key: string; data: any }[],
    prevTracks: { key: string; data: any }[]
) {
    // Check if
    // (1) A track added/removed
    // (2) Track data changed
    let ret = false;
    if (nextTracks.length !== prevTracks.length) {
        ret = true;
    } else {
        ret = numTracksWhoseDataChanged(nextTracks, prevTracks) > 0;
    }
    return ret;
}

function shouldNotKeepSorted_GeneticTracksHelper(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>
) {
    // Check if
    // (1) A track added/removed
    // (2) Track data changed
    if (
        differentTracksOrChangedData(
            nextProps.geneticTracks || [],
            prevProps.geneticTracks || []
        )
    ) {
        return true;
    }
    // (3) Track sort comparator changed
    return (
        sortByMutationType(nextProps) !== sortByMutationType(prevProps) ||
        sortByDrivers(nextProps) !== sortByDrivers(prevProps)
    );
}

function shouldNotKeepSorted_ClinicalTracksHelper(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>
) {
    // Check if
    // (1) A track added/removed
    // (2) Track data changed
    if (
        differentTracksOrChangedData(
            nextProps.clinicalTracks || [],
            prevProps.clinicalTracks || []
        )
    ) {
        return true;
    }
}

function shouldNotKeepSorted_HeatmapTracksHelper(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>
) {
    // Check if
    // (1) A track added/removed
    // (2) Track data changed
    if (
        differentTracksOrChangedData(
            nextProps.heatmapTracks,
            prevProps.heatmapTracks || []
        ) ||
        differentTracksOrChangedData(
            nextProps.genesetHeatmapTracks,
            prevProps.genesetHeatmapTracks || []
        )
    ) {
        return true;
    }
}

function shouldNotKeepSortedForTransition(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>
) {
    // Dont keep sorted during changes if changes will involve resorting. In that case,
    //  we might as well just wait until they're done to resort - that can only make it more efficient
    //  than potentially sorting multiple times.

    return (
        shouldNotKeepSorted_GeneticTracksHelper(nextProps, prevProps) ||
        shouldNotKeepSorted_ClinicalTracksHelper(nextProps, prevProps) ||
        shouldNotKeepSorted_HeatmapTracksHelper(nextProps, prevProps)
    );
}

function allTracks(props: Partial<IOncoprintProps>) {
    return ((props.geneticTracks || []) as any[])
        .concat(props.genesetHeatmapTracks || [])
        .concat(props.clinicalTracks || [])
        .concat(props.heatmapTracks || []);
}

function shouldSuppressRenderingForTransition(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>
) {
    // If cost of rerendering everything less than cost of all the rerenders that would happen in the process
    //  of incrementally changing the oncoprint state.
    return (
        !nextProps.suppressRendering && // dont add suppress if already suppressing
        (hasGeneticTrackRuleSetChanged(nextProps, prevProps) || // will need to rerender all genetic tracks if genetic rule set has changed
            numTracksWhoseDataChanged(
                allTracks(nextProps),
                allTracks(prevProps)
            ) > 1)
    );
}

function sortOrder(
    props: Partial<Pick<IOncoprintProps, 'sortConfig'>>
): string[] | undefined {
    return props.sortConfig && props.sortConfig.order;
}

export function heatmapClusterValueFn(d: IBaseHeatmapTrackDatum) {
    return d.profile_data;
}

function createSortConfig(
    props: Partial<Pick<IOncoprintProps, 'sortConfig'>>
): SortConfig {
    let config = {};
    const newSortOrder = sortOrder(props);
    if (newSortOrder) {
        config = {
            type: 'order',
            order: newSortOrder,
        };
    } else if (
        props.sortConfig &&
        typeof props.sortConfig.clusterHeatmapTrackGroupIndex !== 'undefined'
    ) {
        config = {
            type: 'cluster',
            track_group_index: props.sortConfig.clusterHeatmapTrackGroupIndex,
            clusterValueFn: heatmapClusterValueFn,
        };
    }
    return config;
}
export function transitionSortConfig(
    nextProps: Pick<IOncoprintProps, 'sortConfig'>,
    prevProps: Partial<Pick<IOncoprintProps, 'sortConfig'>>,
    oncoprint: OncoprintJS
) {
    const prevSortConfig = createSortConfig(prevProps);
    const nextSortConfig = createSortConfig(nextProps);

    // do shallow comparison on "order" types, otherwise deep comparison
    // this is because order could potentially be very long and so deep comparison would be too expensive
    if (
        (prevSortConfig.type === 'order' &&
            nextSortConfig.type === 'order' &&
            prevSortConfig.order !== nextSortConfig.order) ||
        !_.isEqual(prevSortConfig, nextSortConfig)
    ) {
        oncoprint.setSortConfig(nextSortConfig);
    }
}

function transitionHiddenIds(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS
) {
    if (nextProps.hiddenIds !== prevProps.hiddenIds) {
        // do it on shallow inequality
        oncoprint.hideIds(nextProps.hiddenIds || [], true);
    }
}

function transitionShowClinicalTrackLegends(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS,
    getTrackSpecKeyToTrackId: () => { [key: string]: TrackId }
) {
    const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
    const clinicalTrackIds = nextProps.clinicalTracks.map(
        track => trackSpecKeyToTrackId[track.key]
    );
    if (
        nextProps.showClinicalTrackLegends &&
        !prevProps.showClinicalTrackLegends
    ) {
        oncoprint.showTrackLegends(clinicalTrackIds);
    } else if (
        !nextProps.showClinicalTrackLegends &&
        prevProps.showClinicalTrackLegends
    ) {
        oncoprint.hideTrackLegends(clinicalTrackIds);
    }
}

function transitionWhitespaceBetweenColumns(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS
) {
    if (
        nextProps.showWhitespaceBetweenColumns !==
        prevProps.showWhitespaceBetweenColumns
    ) {
        oncoprint.setCellPaddingOn(!!nextProps.showWhitespaceBetweenColumns);
    }
}

function transitionShowMinimap(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS
) {
    if (nextProps.showMinimap !== prevProps.showMinimap) {
        oncoprint.setMinimapVisible(!!nextProps.showMinimap);
    }
}

function transitionOnMinimapCloseCallback(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS
) {
    if (
        nextProps.onMinimapClose &&
        nextProps.onMinimapClose !== prevProps.onMinimapClose
    ) {
        oncoprint.onMinimapClose(nextProps.onMinimapClose);
    }
}

function hasGeneticTrackTooltipChanged(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>
) {
    return (
        nextProps.caseLinkOutInTooltips !== prevProps.caseLinkOutInTooltips ||
        nextProps.alterationTypesInQuery !== prevProps.alterationTypesInQuery
    );
}

function hasGeneticTrackRuleSetChanged(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>
) {
    return (
        nextProps.distinguishMutationType !==
            prevProps.distinguishMutationType ||
        nextProps.distinguishDrivers !== prevProps.distinguishDrivers ||
        nextProps.distinguishGermlineMutations !==
            prevProps.distinguishGermlineMutations ||
        nextProps.isWhiteBackgroundForGlyphsEnabled !==
            prevProps.isWhiteBackgroundForGlyphsEnabled
    );
}

function transitionTracks(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS,
    getTrackSpecKeyToTrackId: () => { [key: string]: TrackId },
    getMolecularProfileMap: () =>
        | { [molecularProfileId: string]: MolecularProfile }
        | undefined
) {
    // Initialize tracks for rule set sharing
    const trackIdForRuleSetSharing = {
        genetic: undefined as undefined | TrackId,
        genesetHeatmap: undefined as undefined | TrackId,
        heatmap: undefined as undefined | TrackId,
        heatmap01: undefined as undefined | TrackId,
        mutation: undefined as undefined | TrackId,
        genericAssayHeatmap: ({} as any) as GenericAssayProfileToTrackIdMap,
        genericAssayCategorical: ({} as any) as GenericAssayProfileToTrackIdMap,
    };
    const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
    if (
        prevProps.geneticTracks &&
        prevProps.geneticTracks.length &&
        !hasGeneticTrackRuleSetChanged(nextProps, prevProps)
    ) {
        // set rule set to existing track if theres a track and rule set hasnt changed
        trackIdForRuleSetSharing.genetic =
            trackSpecKeyToTrackId[prevProps.geneticTracks[0].key];
    }
    if (
        prevProps.genesetHeatmapTracks &&
        prevProps.genesetHeatmapTracks.length
    ) {
        // set rule set to existing track if there is one
        trackIdForRuleSetSharing.genesetHeatmap =
            trackSpecKeyToTrackId[prevProps.genesetHeatmapTracks[0].key];
    }

    if (prevProps.heatmapTracks && prevProps.heatmapTracks.length) {
        // set rule set to existing track if theres a track
        let heatmap01;
        let heatmap;
        let mutation;
        for (const spec of prevProps.heatmapTracks) {
            if (
                heatmap01 === undefined &&
                spec.molecularAlterationType ===
                    AlterationTypeConstants.METHYLATION
            ) {
                heatmap01 = trackSpecKeyToTrackId[spec.key];
            } else if (
                mutation === undefined &&
                spec.molecularAlterationType ===
                    AlterationTypeConstants.MUTATION_EXTENDED
            ) {
                mutation = trackSpecKeyToTrackId[spec.key];
            } else if (
                heatmap === undefined &&
                spec.molecularAlterationType !==
                    AlterationTypeConstants.METHYLATION &&
                spec.molecularAlterationType !==
                    AlterationTypeConstants.GENERIC_ASSAY &&
                spec.molecularAlterationType !==
                    AlterationTypeConstants.MUTATION_EXTENDED
            ) {
                heatmap = trackSpecKeyToTrackId[spec.key];
            }
            if (
                heatmap01 !== undefined &&
                heatmap !== undefined &&
                mutation !== undefined
            ) {
                break;
            }
        }
        trackIdForRuleSetSharing.heatmap = heatmap;
        trackIdForRuleSetSharing.heatmap01 = heatmap01;
        trackIdForRuleSetSharing.mutation = mutation;
    } else if (prevProps.genesetHeatmapTracks) {
        for (const gsTrack of prevProps.genesetHeatmapTracks) {
            if (
                gsTrack.expansionTrackList &&
                gsTrack.expansionTrackList.length
            ) {
                trackIdForRuleSetSharing.heatmap =
                    trackSpecKeyToTrackId[gsTrack.expansionTrackList[0].key];
                break;
            }
        }
    }

    // collect trackId of last assigned track for each generic assay profile
    // Note: the resolution of `trackIds for ruleset sharing` is different from
    // the section above because different formatting is applied to each generic assay profile (molecularProfileId)
    trackIdForRuleSetSharing.genericAssayHeatmap = _.chain(
        prevProps.heatmapTracks
    )
        .filter(
            (s: IHeatmapTrackSpec) =>
                s.molecularAlterationType ===
                AlterationTypeConstants.GENERIC_ASSAY
        )
        .groupBy((track: IHeatmapTrackSpec) => track.molecularProfileId)
        .mapValues((o: IHeatmapTrackSpec[]) => _.last(o))
        .mapValues((o: IHeatmapTrackSpec) => trackSpecKeyToTrackId[o.key])
        .value();

    trackIdForRuleSetSharing.genericAssayCategorical = _.chain(
        prevProps.categoricalTracks
    )
        .filter(
            (s: ICategoricalTrackSpec) =>
                s.molecularAlterationType ===
                AlterationTypeConstants.GENERIC_ASSAY
        )
        .groupBy((track: ICategoricalTrackSpec) => track.molecularProfileId)
        .mapValues((o: ICategoricalTrackSpec[]) => _.last(o))
        .mapValues((o: ICategoricalTrackSpec) => trackSpecKeyToTrackId[o.key])
        .value();

    const genericAssayProfilesMap = _.chain(nextProps.heatmapTracks)
        .filter(
            (s: IHeatmapTrackSpec) =>
                s.molecularAlterationType ===
                AlterationTypeConstants.GENERIC_ASSAY
        )
        .groupBy((track: IHeatmapTrackSpec) => track.molecularProfileId)
        .mapValues((o: IHeatmapTrackSpec[]) =>
            _(o)
                .flatMap(d => d.data)
                .filter((d: IBaseHeatmapTrackDatum) => !d.category)
                .map(d => d.profile_data)
                .value()
        )
        .value();

    // find the max and min generic assay profile value in the next heatmap track group
    // max and min value is used to create a custom legend for the track group
    const genericAssayProfileMaxValues = _.mapValues(
        genericAssayProfilesMap,
        (profile_data: number[]) => {
            return _.max(profile_data);
        }
    );
    const genericAssayProfileMinValues = _.mapValues(
        genericAssayProfilesMap,
        (profile_data: number[]) => {
            return _.min(profile_data);
        }
    );

    // Transition genetic tracks
    const prevGeneticTracks = _.keyBy(
        prevProps.geneticTracks || [],
        (track: GeneticTrackSpec) => track.key
    );
    for (const track of nextProps.geneticTracks) {
        transitionGeneticTrack(
            track,
            prevGeneticTracks[track.key],
            getTrackSpecKeyToTrackId,
            getMolecularProfileMap,
            oncoprint,
            nextProps,
            prevProps,
            trackIdForRuleSetSharing
        );
        delete prevGeneticTracks[track.key];
    }

    for (const track of prevProps.geneticTracks || []) {
        if (prevGeneticTracks.hasOwnProperty(track.key)) {
            // if its still there, then this track no longer exists, we need to remove it
            transitionGeneticTrack(
                undefined,
                prevGeneticTracks[track.key],
                getTrackSpecKeyToTrackId,
                getMolecularProfileMap,
                oncoprint,
                nextProps,
                prevProps,
                trackIdForRuleSetSharing
            );
        }
    }
    // Oncce tracks have been added and deleted, transition order
    transitionGeneticTrackOrder(
        nextProps,
        prevProps,
        oncoprint,
        getTrackSpecKeyToTrackId
    );

    // Transition clinical tracks
    const prevClinicalTracks = _.keyBy(
        prevProps.clinicalTracks || [],
        (track: ClinicalTrackSpec) => track.key
    );
    for (const track of nextProps.clinicalTracks) {
        transitionClinicalTrack(
            track,
            prevClinicalTracks[track.key],
            getTrackSpecKeyToTrackId,
            oncoprint,
            nextProps
        );
        delete prevClinicalTracks[track.key];
    }
    for (const track of prevProps.clinicalTracks || []) {
        if (prevClinicalTracks.hasOwnProperty(track.key)) {
            // if its still there, then this track no longer exists
            transitionClinicalTrack(
                undefined,
                prevClinicalTracks[track.key],
                getTrackSpecKeyToTrackId,
                oncoprint,
                nextProps
            );
        }
    }

    // Transition gene set heatmap tracks
    const prevGenesetHeatmapTracks = _.keyBy(
        prevProps.genesetHeatmapTracks || [],
        (track: IGenesetHeatmapTrackSpec) => track.key
    );
    for (const track of nextProps.genesetHeatmapTracks) {
        transitionGenesetHeatmapTrack(
            track,
            prevGenesetHeatmapTracks[track.key],
            getTrackSpecKeyToTrackId,
            oncoprint,
            nextProps,
            trackIdForRuleSetSharing
        );
        delete prevGenesetHeatmapTracks[track.key];
    }
    for (const track of prevProps.genesetHeatmapTracks || []) {
        if (prevGenesetHeatmapTracks.hasOwnProperty(track.key)) {
            // if its still there, then this track no longer exists
            transitionGenesetHeatmapTrack(
                undefined,
                prevGenesetHeatmapTracks[track.key],
                getTrackSpecKeyToTrackId,
                oncoprint,
                nextProps,
                trackIdForRuleSetSharing
            );
        }
    }

    // Transition heatmap tracks
    const prevHeatmapTracks = _.keyBy(
        prevProps.heatmapTracks || [],
        (track: IHeatmapTrackSpec) => track.key
    );
    for (let track of nextProps.heatmapTracks) {
        // add generic assay layout/formatting information to the track specs
        track.maxProfileValue =
            genericAssayProfileMaxValues[track.molecularProfileId];
        track.minProfileValue =
            genericAssayProfileMinValues[track.molecularProfileId];

        transitionHeatmapTrack(
            track,
            prevHeatmapTracks[track.key],
            getTrackSpecKeyToTrackId,
            () => undefined,
            oncoprint,
            nextProps,
            {},
            trackIdForRuleSetSharing,
            undefined
        );
        delete prevHeatmapTracks[track.key];
    }

    for (const track of prevProps.heatmapTracks || []) {
        // if its still there, then this track no longer exists
        if (prevHeatmapTracks.hasOwnProperty(track.key)) {
            // add generic assay layout/formatting information to the track specs
            track.maxProfileValue =
                genericAssayProfileMaxValues[track.molecularProfileId];
            track.minProfileValue =
                genericAssayProfileMinValues[track.molecularProfileId];

            transitionHeatmapTrack(
                undefined,
                prevHeatmapTracks[track.key],
                getTrackSpecKeyToTrackId,
                () => undefined,
                oncoprint,
                nextProps,
                {},
                trackIdForRuleSetSharing,
                undefined
            );
        }
    }
    // Oncce tracks have been added and deleted, transition order
    transitionHeatmapTrackOrder(
        nextProps,
        prevProps,
        oncoprint,
        getTrackSpecKeyToTrackId
    );

    // Transition categorical tracks
    const prevCategoricalTracks = _.keyBy(
        prevProps.categoricalTracks,
        (track: ICategoricalTrackSpec) => track.key
    );
    for (const track of nextProps.categoricalTracks) {
        transitionCategoricalTrack(
            track,
            prevCategoricalTracks[track.key],
            getTrackSpecKeyToTrackId,
            oncoprint,
            nextProps,
            trackIdForRuleSetSharing
        );
        delete prevCategoricalTracks[track.key];
    }
    for (const track of prevProps.categoricalTracks || []) {
        if (prevCategoricalTracks.hasOwnProperty(track.key)) {
            // if its still there, then this track no longer exists
            transitionCategoricalTrack(
                undefined,
                prevCategoricalTracks[track.key],
                getTrackSpecKeyToTrackId,
                oncoprint,
                nextProps,
                trackIdForRuleSetSharing
            );
        }
    }
}

function transitionGeneticTrackOrder(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS,
    getTrackSpecKeyToTrackId: () => { [key: string]: TrackId }
) {
    const nextTracksMap = _.keyBy(nextProps.geneticTracks, 'key');
    const prevTracksMap = _.keyBy(prevProps.geneticTracks || [], 'key');
    const nextOrder = (
        nextProps.geneticTracksOrder || nextProps.geneticTracks.map(t => t.key)
    ).filter(key => key in nextTracksMap);
    const prevOrder = (
        prevProps.geneticTracksOrder ||
        (prevProps.geneticTracks || []).map(t => t.key)
    ).filter(key => key in prevTracksMap);

    if (!_.isEqual(nextOrder, prevOrder)) {
        const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
        oncoprint.setTrackGroupOrder(
            GENETIC_TRACK_GROUP_INDEX,
            nextOrder.map(key => trackSpecKeyToTrackId[key])
        );
    }
}

function transitionHeatmapTrackOrder(
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    oncoprint: OncoprintJS,
    getTrackSpecKeyToTrackId: () => { [key: string]: TrackId }
) {
    const nextTracksMap = _.keyBy(nextProps.heatmapTracks, 'key');
    const prevTracksMap = _.keyBy(prevProps.heatmapTracks || [], 'key');

    _.forEach(
        nextProps.heatmapTracksOrder || {},
        (groupOrder: string[], trackGroupIndex: string) => {
            const nextOrder = groupOrder.filter(key => key in nextTracksMap);
            const prevOrder = (
                (prevProps.heatmapTracksOrder || {})[trackGroupIndex as any] ||
                []
            ).filter(key => key in prevTracksMap);

            if (!_.isEqual(nextOrder, prevOrder)) {
                const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
                oncoprint.setTrackGroupOrder(
                    parseInt(trackGroupIndex, 10),
                    nextOrder.map(key => trackSpecKeyToTrackId[key])
                );
            }
        }
    );
}

function tryRemoveTrack(
    nextSpec: { key: string } | undefined,
    prevSpec: { key: string } | undefined,
    trackSpecKeyToTrackId: { [key: string]: TrackId },
    oncoprint: OncoprintJS
) {
    if (!nextSpec && prevSpec) {
        // remove track, if OncoprintJS hasn't already removed it and told a
        // removeCallback to forget its track ID
        const trackId = trackSpecKeyToTrackId[prevSpec.key];
        if (typeof trackId !== 'undefined') {
            if (oncoprint.getTracks().includes(trackId)) {
                oncoprint.removeTrack(trackId);
            }
            delete trackSpecKeyToTrackId[prevSpec.key];
        }
        return true;
    } else {
        return false;
    }
}

function sortByMutationType(nextProps: Partial<IOncoprintProps>) {
    return (
        nextProps.distinguishMutationType &&
        nextProps.sortConfig &&
        nextProps.sortConfig.sortByMutationType
    );
}

function sortByDrivers(nextProps: Partial<IOncoprintProps>) {
    return (
        nextProps.distinguishDrivers &&
        nextProps.sortConfig &&
        nextProps.sortConfig.sortByDrivers
    );
}

function updateExpansionTracks<
    TrackSpecType extends { key: string },
    RuleSetRepMap
>(
    nextParentSpec:
        | { key: string; expansionTrackList?: TrackSpecType[] }
        | undefined,
    prevParentSpec:
        | { key: string; expansionTrackList?: TrackSpecType[] }
        | undefined,
    getTrackSpecKeyToTrackId: () => { [key: string]: TrackId },
    getMolecularProfileMap: () =>
        | { [molecularProfileId: string]: MolecularProfile }
        | undefined,
    oncoprint: OncoprintJS,
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    trackIdForRuleSetSharing: RuleSetRepMap,
    transitionFunction: (
        expansionTrackSpec: TrackSpecType | undefined,
        prevExpansionTrackSpec: TrackSpecType,
        getTrackSpecKeyToTrackId: () => { [key: string]: TrackId },
        getMolecularProfileMap: () =>
            | { [molecularProfileId: string]: MolecularProfile }
            | undefined,
        oncoprint: OncoprintJS,
        nextProps: IOncoprintProps,
        prevProps: Partial<IOncoprintProps>,
        trackIdForRuleSetSharing: RuleSetRepMap,
        expansionParentKey?: string
    ) => void
) {
    const expansionTrackList =
        prevParentSpec && prevParentSpec.expansionTrackList
            ? prevParentSpec.expansionTrackList
            : [];
    const nextExpansionTracks =
        nextParentSpec && nextParentSpec.expansionTrackList
            ? nextParentSpec.expansionTrackList
            : [];
    const prevExpansionTracks = _.keyBy(
        expansionTrackList,
        (track: TrackSpecType) => track.key
    );
    for (const track of nextExpansionTracks) {
        // nextParentSpec cannot be undefined, or we wouldn't have entered
        // this loop
        transitionFunction(
            track,
            prevExpansionTracks[track.key],
            getTrackSpecKeyToTrackId,
            getMolecularProfileMap,
            oncoprint,
            nextProps,
            prevProps,
            trackIdForRuleSetSharing,
            nextParentSpec!.key
        );
        delete prevExpansionTracks[track.key];
    }
    for (const track of expansionTrackList) {
        if (prevExpansionTracks.hasOwnProperty(track.key)) {
            // if its still there, then this track no longer exists
            transitionFunction(
                undefined,
                prevExpansionTracks[track.key],
                getTrackSpecKeyToTrackId,
                getMolecularProfileMap,
                oncoprint,
                nextProps,
                prevProps,
                trackIdForRuleSetSharing
            );
        }
    }
}

function transitionGeneticTrack(
    nextSpec: GeneticTrackSpec | undefined,
    prevSpec: GeneticTrackSpec | undefined,
    getTrackSpecKeyToTrackId: () => { [key: string]: TrackId },
    getMolecularProfileMap: () =>
        | { [molecularProfileId: string]: MolecularProfile }
        | undefined,
    oncoprint: OncoprintJS,
    nextProps: IOncoprintProps,
    prevProps: Partial<IOncoprintProps>,
    trackIdForRuleSetSharing: { genetic?: TrackId },
    expansionParentKey?: string
) {
    const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
    if (tryRemoveTrack(nextSpec, prevSpec, trackSpecKeyToTrackId, oncoprint)) {
        // Remove track
        return;
    } else if (nextSpec && !prevSpec) {
        // Add track
        const createCustomOncoprintTooltip = getCustomJsFunctions()
            .createCustomOncoprintTooltip;
        let tooltipFn;
        if (createCustomOncoprintTooltip) {
            tooltipFn = (dataUnderMouse: DataUnderMouse) =>
                createCustomOncoprintTooltip(nextProps, dataUnderMouse);
        } else {
            tooltipFn = makeGeneticTrackTooltip(
                nextProps.caseLinkOutInTooltips,
                getMolecularProfileMap,
                nextProps.alterationTypesInQuery
            );
        }
        const geneticTrackParams: UserTrackSpec<any> = {
            rule_set_params: getGeneticTrackRuleSetParams(
                nextProps.distinguishMutationType,
                nextProps.distinguishDrivers,
                nextProps.distinguishGermlineMutations,
                nextProps.isWhiteBackgroundForGlyphsEnabled
            ),
            label: nextSpec.label,
            sublabel: nextSpec.sublabel,
            track_label_color: nextSpec.labelColor || undefined,
            target_group: GENETIC_TRACK_GROUP_INDEX,
            sortCmpFn: getGeneticTrackSortComparator(
                sortByMutationType(nextProps),
                sortByDrivers(nextProps)
            ),
            description: nextSpec.oql,
            data_id_key: 'uid',
            data: nextSpec.data,
            tooltipFn,
            track_info: nextSpec.info,
            $track_info_tooltip_elt: nextSpec.infoTooltip
                ? $('<div>' + nextSpec.infoTooltip + '</div>')
                : undefined,
            removable: nextProps.geneticTracks.length > 1 ? true : false,
            removeCallback: () => {
                delete getTrackSpecKeyToTrackId()[nextSpec.key];
                if (nextSpec.removeCallback) nextSpec.removeCallback();
            },
            onClickRemoveInTrackMenu: () => {
                const oql = nextSpec.oql;
                const sublabel = nextSpec.sublabel;
                if (oql) {
                    const geneLabelsRegex = /[A-Z0-9]+(?=:)/g;
                    const geneLabels = oql.match(geneLabelsRegex);
                    if (geneLabels) {
                        const geneLabelsString = geneLabels.join(' ');
                        nextProps.onDeleteGeneticTrack &&
                            nextProps.onDeleteGeneticTrack(
                                geneLabelsString,
                                sublabel || ''
                            );
                    }
                }
            },
            expandCallback: nextSpec.expansionCallback || undefined,
            expandButtonTextGetter: () => 'Expand',
            expansion_of: expansionParentKey
                ? trackSpecKeyToTrackId[expansionParentKey]
                : undefined,
            custom_track_options: nextSpec.customOptions,
        };
        const newTrackId = oncoprint.addTracks([geneticTrackParams])[0];
        trackSpecKeyToTrackId[nextSpec.key] = newTrackId;

        if (typeof trackIdForRuleSetSharing.genetic !== 'undefined') {
            oncoprint.shareRuleSet(
                trackIdForRuleSetSharing.genetic,
                newTrackId
            );
        }
        trackIdForRuleSetSharing.genetic = newTrackId;
    } else if (nextSpec && prevSpec) {
        // Transition track
        const trackId = trackSpecKeyToTrackId[nextSpec.key];
        const nextSortByMutationType = sortByMutationType(nextProps);
        const nextSortByDrivers = sortByDrivers(nextProps);
        if (
            nextSortByMutationType !== sortByMutationType(prevProps) ||
            nextSortByDrivers !== sortByDrivers(prevProps)
        ) {
            oncoprint.setTrackSortComparator(
                trackId,
                getGeneticTrackSortComparator(
                    nextSortByMutationType,
                    nextSortByDrivers
                )
            );
        }
        if (nextSpec.data !== prevSpec.data) {
            // shallow equality check
            oncoprint.setTrackData(trackId, nextSpec.data, 'uid');
        }

        if (hasGeneticTrackTooltipChanged(nextProps, prevProps)) {
            oncoprint.setTrackTooltipFn(
                trackId,
                makeGeneticTrackTooltip(
                    nextProps.caseLinkOutInTooltips,
                    getMolecularProfileMap,
                    nextProps.alterationTypesInQuery
                )
            );
        }

        if (nextSpec.info !== prevSpec.info) {
            oncoprint.setTrackInfo(trackId, nextSpec.info);
        }
        if (nextSpec.infoTooltip !== prevSpec.infoTooltip) {
            oncoprint.setTrackInfoTooltip(
                trackId,
                nextSpec.infoTooltip
                    ? $('<div>' + nextSpec.infoTooltip + '</div>')
                    : undefined
            );
        }

        // update ruleset if its changed
        if (hasGeneticTrackRuleSetChanged(nextProps, prevProps)) {
            if (typeof trackIdForRuleSetSharing.genetic !== 'undefined') {
                // if theres a track to share, share its ruleset
                oncoprint.shareRuleSet(
                    trackIdForRuleSetSharing.genetic,
                    trackId
                );
            } else {
                // otherwise, update ruleset
                oncoprint.setRuleSet(
                    trackId,
                    getGeneticTrackRuleSetParams(
                        nextProps.distinguishMutationType,
                        nextProps.distinguishDrivers,
                        nextProps.distinguishGermlineMutations,
                        nextProps.isWhiteBackgroundForGlyphsEnabled
                    )
                );
            }
        }
        // either way, use this one now
        trackIdForRuleSetSharing.genetic = trackId;

        // keep the expansion option on or off as appropriate;
        // the menu re-renders if tracks are added or removed below
        if (
            nextSpec.expansionTrackList &&
            nextSpec.expansionTrackList.length > 0
        ) {
            oncoprint.disableTrackExpansion(trackId);
        } else if (nextSpec.expansionCallback) {
            oncoprint.enableTrackExpansion(trackId);
        }
        updateExpansionTracks<GeneticTrackSpec, { genetic?: number }>(
            nextSpec,
            prevSpec,
            getTrackSpecKeyToTrackId,
            getMolecularProfileMap,
            oncoprint,
            nextProps,
            prevProps,
            trackIdForRuleSetSharing,
            transitionGeneticTrack
        );
    }
}

function transitionClinicalTrack(
    nextSpec: ClinicalTrackSpec | undefined,
    prevSpec: ClinicalTrackSpec | undefined,
    getTrackSpecKeyToTrackId: () => { [key: string]: TrackId },
    oncoprint: OncoprintJS,
    nextProps: IOncoprintProps
) {
    const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
    if (tryRemoveTrack(nextSpec, prevSpec, trackSpecKeyToTrackId, oncoprint)) {
        return;
    } else if (nextSpec && !prevSpec) {
        // Add track
        const rule_set_params: any = getClinicalTrackRuleSetParams(nextSpec);
        rule_set_params.legend_label = nextSpec.label;
        rule_set_params.exclude_from_legend = !nextProps.showClinicalTrackLegends;
        rule_set_params.na_legend_label = nextSpec.na_legend_label;

        const clinicalTrackParams: UserTrackSpec<any> = {
            rule_set_params,
            data: nextSpec.data,
            data_id_key: 'uid',
            label: nextSpec.label,
            description:
                (nextSpec.label || '').trim() ===
                (nextSpec.description || '').trim()
                    ? undefined
                    : nextSpec.description,
            removable: true,
            removeCallback: () => {
                delete getTrackSpecKeyToTrackId()[nextSpec.key];
            },
            onClickRemoveInTrackMenu: () => {
                nextProps.onDeleteClinicalTrack &&
                    nextProps.onDeleteClinicalTrack(nextSpec.key);
            },
            sort_direction_changeable: true,
            tooltipFn: makeClinicalTrackTooltip(
                nextSpec,
                nextProps.caseLinkOutInTooltips
            ),
            important_ids: nextSpec.altered_uids, // only show clinical track legends for altered cases. e.g. if only altered cases are female for the SEX clinical track, then only show 'female' in the SEX legend
            //track_info: "\u23f3",
            sortCmpFn: getClinicalTrackSortComparator(nextSpec),
            init_sort_direction: getClinicalTrackSortDirection(nextSpec),
            target_group: CLINICAL_TRACK_GROUP_INDEX,
            onSortDirectionChange: nextProps.onTrackSortDirectionChange,
            onGapChange: nextProps.onTrackGapChange,
            custom_track_options:
                (nextSpec.datatype === 'string' ||
                    nextSpec.datatype === 'counts') &&
                nextProps.setTrackKeySelectedForEdit
                    ? // add edit color option that opens color config modal to custom options
                      [
                          {
                              label: 'Edit Colors',
                              onClick: () =>
                                  nextProps.setTrackKeySelectedForEdit!(
                                      nextSpec.key
                                  ),
                          },
                          ...(nextSpec.custom_options || []),
                      ]
                    : nextSpec.custom_options,
            track_can_show_gaps: nextSpec.datatype === 'string',
            show_gaps_on_init: nextSpec.gapOn,
        };
        trackSpecKeyToTrackId[nextSpec.key] = oncoprint.addTracks([
            clinicalTrackParams,
        ])[0];
    } else if (nextSpec && prevSpec) {
        // Transition track
        const trackId = trackSpecKeyToTrackId[nextSpec.key];
        if (nextSpec.data !== prevSpec.data) {
            // shallow equality check
            oncoprint.setTrackData(trackId, nextSpec.data, 'uid');
        }
        if (nextSpec.altered_uids !== prevSpec.altered_uids) {
            // shallow equality check
            oncoprint.setTrackImportantIds(trackId, nextSpec.altered_uids);
        }
        // set tooltip, its cheap
        oncoprint.setTrackTooltipFn(
            trackId,
            makeClinicalTrackTooltip(nextSpec, nextProps.caseLinkOutInTooltips)
        );
        // set custom track options if they've shallow changed - its cheap
        if (prevSpec.custom_options !== nextSpec.custom_options) {
            oncoprint.setTrackCustomOptions(trackId, nextSpec.custom_options);
        }

        // update ruleset if color has changed for selected track
        if (
            nextProps.trackKeySelectedForEdit &&
            getTrackSpecKeyToTrackId()[nextProps.trackKeySelectedForEdit] ===
                trackId
        ) {
            let rule_set_params = getClinicalTrackRuleSetParams(nextSpec);
            rule_set_params.legend_label = nextSpec.label;
            rule_set_params.exclude_from_legend = !nextProps.showClinicalTrackLegends;
            rule_set_params.na_legend_label = nextSpec.na_legend_label;
            oncoprint.setRuleSet(trackId, rule_set_params);
        }
    }
}
function transitionGenesetHeatmapTrack(
    nextSpec: IGenesetHeatmapTrackSpec | undefined,
    prevSpec: IGenesetHeatmapTrackSpec | undefined,
    getTrackSpecKeyToTrackId: () => { [key: string]: TrackId },
    oncoprint: OncoprintJS,
    nextProps: IOncoprintProps,
    trackIdForRuleSetSharing: { genesetHeatmap?: TrackId; heatmap?: TrackId }
) {
    const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
    if (tryRemoveTrack(nextSpec, prevSpec, trackSpecKeyToTrackId, oncoprint)) {
        updateExpansionTracks<IHeatmapTrackSpec, { heatmap?: TrackId }>(
            undefined,
            prevSpec,
            getTrackSpecKeyToTrackId,
            () => undefined,
            oncoprint,
            nextProps,
            {},
            trackIdForRuleSetSharing,
            transitionHeatmapTrack
        );
        return;
    } else if (nextSpec && !prevSpec) {
        // Add track
        const heatmapTrackParams = {
            rule_set_params: getGenesetHeatmapTrackRuleSetParams(),
            data: nextSpec.data,
            data_id_key: 'uid',
            has_column_spacing: false,
            track_padding: 0,
            label: nextSpec.label,
            html_label: linebreakGenesetId(nextSpec.label),
            target_group: nextSpec.trackGroupIndex,
            sort_direction_changeable: true,
            sortCmpFn: heatmapTrackSortComparator,
            init_sort_direction: 0 as 0,
            description: `Gene set scores from ${nextSpec.molecularProfileId}`,
            link_url: nextSpec.trackLinkUrl,
            tooltipFn: makeHeatmapTrackTooltip(
                nextSpec,
                nextProps.caseLinkOutInTooltips
            ),
            onSortDirectionChange: nextProps.onTrackSortDirectionChange,
            expandCallback: nextSpec.expansionCallback,
            expandButtonTextGetter: (is_expanded: boolean) =>
                `${is_expanded ? 'More' : 'Show'}  genes`,
        };
        const newTrackId = oncoprint.addTracks([heatmapTrackParams])[0];
        trackSpecKeyToTrackId[nextSpec.key] = newTrackId;

        if (typeof trackIdForRuleSetSharing.genesetHeatmap !== 'undefined') {
            oncoprint.shareRuleSet(
                trackIdForRuleSetSharing.genesetHeatmap,
                newTrackId
            );
        }
        trackIdForRuleSetSharing.genesetHeatmap = newTrackId;
        updateExpansionTracks<IHeatmapTrackSpec, { heatmap?: TrackId }>(
            nextSpec,
            undefined,
            getTrackSpecKeyToTrackId,
            () => undefined,
            oncoprint,
            nextProps,
            {},
            trackIdForRuleSetSharing,
            transitionHeatmapTrack
        );
    } else if (nextSpec && prevSpec) {
        // Transition track
        const trackId = trackSpecKeyToTrackId[nextSpec.key];
        if (nextSpec.data !== prevSpec.data) {
            // shallow equality check
            oncoprint.setTrackData(trackId, nextSpec.data, 'uid');
        }
        // set tooltip, its cheap
        oncoprint.setTrackTooltipFn(
            trackId,
            makeHeatmapTrackTooltip(nextSpec, nextProps.caseLinkOutInTooltips)
        );
        updateExpansionTracks<IHeatmapTrackSpec, { heatmap?: TrackId }>(
            nextSpec,
            prevSpec,
            getTrackSpecKeyToTrackId,
            () => undefined,
            oncoprint,
            nextProps,
            {},
            trackIdForRuleSetSharing,
            transitionHeatmapTrack
        );
    }
}

export function transitionHeatmapTrack(
    nextSpec: IHeatmapTrackSpec | undefined,
    prevSpec: IHeatmapTrackSpec | undefined,
    getTrackSpecKeyToTrackId: () => { [key: string]: TrackId },
    getMolecularProfileMap: () => object | undefined,
    oncoprint: OncoprintJS,
    nextProps: IOncoprintProps,
    prevProps: object,
    trackIdForRuleSetSharing: {
        heatmap?: TrackId;
        heatmap01?: TrackId;
        genericAssayHeatmap?: GenericAssayProfileToTrackIdMap;
        // Mutation-specific key to separate VAF from other tracks
        mutation?: TrackId;
    },
    expansionParentKey?: string
) {
    const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
    if (tryRemoveTrack(nextSpec, prevSpec, trackSpecKeyToTrackId, oncoprint)) {
        return;
    } else if (nextSpec && !prevSpec) {
        // Add track
        const heatmapTrackParams = {
            rule_set_params: getHeatmapTrackRuleSetParams(
                nextSpec,
                nextProps.isWhiteBackgroundForGlyphsEnabled
            ),
            data: nextSpec.data,
            data_id_key: 'uid',
            has_column_spacing: ifNotDefined(nextSpec.hasColumnSpacing, false),
            track_padding: 0,
            label: nextSpec.label,
            track_label_color: nextSpec.labelColor,
            track_label_circle_color: nextSpec.labelCircleColor,
            track_label_font_weight: nextSpec.labelFontWeight,
            track_label_left_padding: nextSpec.labelLeftPadding,
            target_group: nextSpec.trackGroupIndex,
            removable:
                !!nextSpec.onRemove || !!nextSpec.onClickRemoveInTrackMenu,
            movable: nextSpec.movable,
            na_legend_label: nextSpec.naLegendLabel,
            removeCallback: () => {
                delete getTrackSpecKeyToTrackId()[nextSpec.key];
                nextSpec.onRemove && nextSpec.onRemove();
            },
            onClickRemoveInTrackMenu: () => {
                nextSpec.onClickRemoveInTrackMenu &&
                    nextSpec.onClickRemoveInTrackMenu();
            },
            sort_direction_changeable: ifNotDefined(
                nextSpec.sortDirectionChangeable,
                true
            ),
            sortCmpFn: heatmapTrackSortComparator,
            init_sort_direction: ifNotDefined(
                nextSpec.initSortDirection,
                0 as 0
            ),
            link_url: nextSpec.trackLinkUrl,
            description: ifNotDefined(
                nextSpec.description,
                `${nextSpec.label} data from ${nextSpec.molecularProfileId}`
            ),
            tooltipFn:
                nextSpec.tooltip ||
                makeHeatmapTrackTooltip(
                    nextSpec,
                    nextProps.caseLinkOutInTooltips
                ),
            track_info: nextSpec.info || '',
            onSortDirectionChange: nextProps.onTrackSortDirectionChange,
            expansion_of: expansionParentKey
                ? trackSpecKeyToTrackId[expansionParentKey]
                : undefined,
        };
        // register new track in oncoprint
        const newTrackId: number = oncoprint.addTracks([heatmapTrackParams])[0];
        // store relation between React heatmap track specs and OncoprintJS trackIds
        trackSpecKeyToTrackId[nextSpec.key] = newTrackId;

        if (
            nextSpec.molecularAlterationType !==
            AlterationTypeConstants.GENERIC_ASSAY
        ) {
            let trackIdForRuleSetSharingKey:
                | 'heatmap'
                | 'heatmap01'
                | 'mutation';

            // Each molecular alteration type gets its own rule set
            if (
                nextSpec.molecularAlterationType ===
                AlterationTypeConstants.MUTATION_EXTENDED
            ) {
                trackIdForRuleSetSharingKey = 'mutation';
            } else if (
                nextSpec.molecularAlterationType ===
                AlterationTypeConstants.METHYLATION
            ) {
                trackIdForRuleSetSharingKey = 'heatmap01';
            } else {
                // Expression and other molecular data tracks
                trackIdForRuleSetSharingKey = 'heatmap';
            }

            // Only share rule set with tracks of the SAME molecular alteration type
            // Prevents VAF tracks (0-1 scale) from sharing rules with mRNA tracks (-3 to 3 scale)
            if (
                typeof trackIdForRuleSetSharing[trackIdForRuleSetSharingKey] !==
                'undefined'
            ) {
                oncoprint.shareRuleSet(
                    trackIdForRuleSetSharing[trackIdForRuleSetSharingKey]!,
                    newTrackId
                );
            }
            // Store this track ID for future tracks of the same type
            trackIdForRuleSetSharing[trackIdForRuleSetSharingKey] = newTrackId;
        } else {
            // if the track is a generic assay profile, add to trackIdForRuleSetSharing under its `molecularProfileId`
            // this makes the trackId available for existing tracks of the same mol.profile for ruleset sharing
            trackIdForRuleSetSharing.genericAssayHeatmap![
                nextSpec.molecularProfileId
            ] = newTrackId;
        }
    } else if (nextSpec && prevSpec) {
        // Transition track
        const trackId = trackSpecKeyToTrackId[nextSpec.key];
        // when the data in the next track differs from the previous
        // register the new data points in oncoprint
        if (nextSpec.data !== prevSpec.data) {
            // shallow equality check
            oncoprint.setTrackData(trackId, nextSpec.data, 'uid');
        }
        if (nextSpec.info !== prevSpec.info && nextSpec.info !== undefined) {
            oncoprint.setTrackInfo(trackId, nextSpec.info);
        }
        if (
            nextSpec.movable !== prevSpec.movable &&
            nextSpec.movable !== undefined
        ) {
            oncoprint.setTrackMovable(trackId, nextSpec.movable);
        }
        // Rule set when white background flag changes for mutation (VAF) heatmap tracks
        if (
            nextSpec.molecularAlterationType ===
                AlterationTypeConstants.MUTATION_EXTENDED &&
            nextProps.isWhiteBackgroundForGlyphsEnabled !==
                (prevProps as Partial<IOncoprintProps>)
                    .isWhiteBackgroundForGlyphsEnabled
        ) {
            if (
                trackIdForRuleSetSharing.mutation !== undefined &&
                trackIdForRuleSetSharing.mutation !== trackId
            ) {
                oncoprint.shareRuleSet(
                    trackIdForRuleSetSharing.mutation,
                    trackId
                );
            } else {
                oncoprint.setRuleSet(
                    trackId,
                    getHeatmapTrackRuleSetParams(
                        nextSpec,
                        nextProps.isWhiteBackgroundForGlyphsEnabled
                    )
                );
            }
            trackIdForRuleSetSharing.mutation = trackId;
        }
        // generic assay profile tracks always are associated with the last added added track id
        if (
            nextSpec.molecularAlterationType ===
                AlterationTypeConstants.GENERIC_ASSAY &&
            trackIdForRuleSetSharing.genericAssayHeatmap![
                nextSpec.molecularProfileId
            ] !== undefined
        ) {
            const rulesetTrackId = trackIdForRuleSetSharing.genericAssayHeatmap![
                nextSpec.molecularProfileId
            ];
            oncoprint.shareRuleSet(rulesetTrackId!, trackId);
        }
        // set tooltip, its cheap
        oncoprint.setTrackTooltipFn(
            trackId,
            nextSpec.tooltip ||
                makeHeatmapTrackTooltip(
                    nextSpec,
                    nextProps.caseLinkOutInTooltips
                )
        );
    }
}

export function transitionCategoricalTrack(
    nextSpec: ICategoricalTrackSpec | undefined,
    prevSpec: ICategoricalTrackSpec | undefined,
    getTrackSpecKeyToTrackId: () => { [key: string]: TrackId },
    oncoprint: OncoprintJS,
    nextProps: IOncoprintProps,
    trackIdForRuleSetSharing: {
        genericAssayCategorical?: GenericAssayProfileToTrackIdMap;
    }
) {
    const trackSpecKeyToTrackId = getTrackSpecKeyToTrackId();
    if (tryRemoveTrack(nextSpec, prevSpec, trackSpecKeyToTrackId, oncoprint)) {
        return;
    } else if (nextSpec && !prevSpec) {
        // Add track
        const rule_set_params: ICategoricalRuleSetParams = getCategoricalTrackRuleSetParams(
            nextSpec
        );
        rule_set_params.na_legend_label = nextSpec.naLegendLabel;
        const trackParams: UserTrackSpec<any> = {
            rule_set_params,
            data: nextSpec.data,
            data_id_key: 'uid',
            label: nextSpec.label,
            target_group: nextSpec.trackGroupIndex,
            removable:
                !!nextSpec.onRemove || !!nextSpec.onClickRemoveInTrackMenu,
            removeCallback: () => {
                delete getTrackSpecKeyToTrackId()[nextSpec.key];
                nextSpec.onRemove && nextSpec.onRemove();
            },
            onClickRemoveInTrackMenu: () => {
                nextSpec.onClickRemoveInTrackMenu &&
                    nextSpec.onClickRemoveInTrackMenu();
            },
            sort_direction_changeable: true,
            sortCmpFn: categoricalTrackSortComparator,
            init_sort_direction: 0 as 0,
            description: ifNotDefined(
                nextSpec.description,
                `${nextSpec.label} data from ${nextSpec.molecularProfileId}`
            ),
            link_url: nextSpec.trackLinkUrl,
            tooltipFn: makeCategoricalTrackTooltip(
                nextSpec,
                nextProps.caseLinkOutInTooltips
            ),
            track_info: nextSpec.info || '',
            onSortDirectionChange: nextProps.onTrackSortDirectionChange,
        };
        const newTrackId = oncoprint.addTracks([trackParams])[0];
        trackSpecKeyToTrackId[nextSpec.key] = newTrackId;
        //  add to trackIdForRuleSetSharing under its `molecularProfileId`
        // this makes the trackId available for existing tracks of the same mol.profile for ruleset sharing
        trackIdForRuleSetSharing.genericAssayCategorical![
            nextSpec.molecularProfileId
        ] = newTrackId;
    } else if (nextSpec && prevSpec) {
        // Transition track
        const trackId = trackSpecKeyToTrackId[nextSpec.key];
        if (nextSpec.data !== prevSpec.data) {
            // shallow equality check
            oncoprint.setTrackData(trackId, nextSpec.data, 'uid');
        }
        // generic assay profile tracks always are associated with the last added added track id
        if (
            trackIdForRuleSetSharing.genericAssayCategorical![
                nextSpec.molecularProfileId
            ] !== undefined
        ) {
            const rulesetTrackId = trackIdForRuleSetSharing.genericAssayCategorical![
                nextSpec.molecularProfileId
            ];
            oncoprint.shareRuleSet(rulesetTrackId!, trackId);
        }
        // set tooltip, its cheap
        oncoprint.setTrackTooltipFn(
            trackId,
            makeCategoricalTrackTooltip(
                nextSpec,
                nextProps.caseLinkOutInTooltips
            )
        );
    }
}
