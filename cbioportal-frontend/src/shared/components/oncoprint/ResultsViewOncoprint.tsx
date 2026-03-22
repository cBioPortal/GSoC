import * as React from 'react';
import { Observer, observer } from 'mobx-react';
import {
    action,
    computed,
    IReactionDisposer,
    observable,
    makeObservable,
} from 'mobx';
import {
    capitalize,
    FadeInteraction,
    getBrowserWindow,
    mobxPromiseResolve,
    remoteData,
    svgToPdfDownload,
} from 'cbioportal-frontend-commons';
import { getRemoteDataGroupStatus, Mutation } from 'cbioportal-utils';
import Oncoprint, {
    ClinicalTrackSpec,
    ClinicalTrackConfig,
    ClinicalTrackConfigMap,
    GENETIC_TRACK_GROUP_INDEX,
    GeneticTrackSpec,
    IGenesetHeatmapTrackSpec,
    IHeatmapTrackSpec,
    ClinicalTrackConfigChange,
    GeneticTrackConfigMap,
    GeneticTrackConfig,
} from './Oncoprint';
import OncoprintControls, {
    IOncoprintControlsHandlers,
    IOncoprintControlsState,
} from 'shared/components/oncoprint/controls/OncoprintControls';
import {
    ClinicalAttribute,
    Gene,
    GenericAssayMeta,
    MolecularProfile,
    Patient,
    Sample,
} from 'cbioportal-ts-api-client';
import { AlterationTypeConstants } from 'shared/constants';
import { ResultsViewPageStore } from '../../../pages/resultsView/ResultsViewPageStore';
import {
    getAlteredUids,
    getUnalteredUids,
    makeClinicalTracksMobxPromise,
    makeGenericAssayProfileCategoricalTracksMobxPromise,
    makeGenericAssayProfileHeatmapTracksMobxPromise,
    makeGenesetHeatmapExpansionsMobxPromise,
    makeGenesetHeatmapTracksMobxPromise,
    makeGeneticTracksMobxPromise,
    makeHeatmapTracksMobxPromise,
} from './OncoprintUtils';
import _ from 'lodash';
import { onMobxPromise, toPromise } from 'cbioportal-frontend-commons';
import { getServerConfig } from 'config/config';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { OncoprintJS, RGBAColor, TrackGroupIndex, TrackId } from 'oncoprintjs';
import fileDownload from 'react-file-download';
import tabularDownload, { getTabularDownloadData } from './tabularDownload';
import classNames from 'classnames';
import {
    clinicalAttributeIsLocallyComputed,
    MUTATION_SPECTRUM_CATEGORIES,
    MUTATION_SPECTRUM_FILLS,
    SpecialAttribute,
} from '../../cache/ClinicalDataCache';
import OqlStatusBanner from '../banners/OqlStatusBanner';
import {
    getAnnotatingProgressMessage,
    isGenericAssayCategoricalProfile,
    isGenericAssayHeatmapProfile,
    makeTrackGroupHeaders,
} from './ResultsViewOncoprintUtils';
import ProgressIndicator, {
    IProgressIndicatorItem,
} from '../progressIndicator/ProgressIndicator';
import autobind from 'autobind-decorator';
import { parseOQLQuery } from '../../lib/oql/oqlfilter';
import AlterationFilterWarning from '../banners/AlterationFilterWarning';
import WindowStore from '../window/WindowStore';
import { OncoprintAnalysisCaseType } from '../../../pages/resultsView/ResultsViewPageStoreUtils';
import ResultsViewURLWrapper from 'pages/resultsView/ResultsViewURLWrapper';
import CaseFilterWarning from '../banners/CaseFilterWarning';
import {
    getOncoprinterClinicalInput,
    getOncoprinterGeneticInput,
    getOncoprinterHeatmapInput,
} from '../../../pages/staticPages/tools/oncoprinter/OncoprinterImportUtils';
import { buildCBioPortalPageUrl } from '../../api/urls';
import '../../../globalStyles/oncoprintStyles.scss';
import { GenericAssayTrackInfo } from 'pages/studyView/addChartButton/genericAssaySelection/GenericAssaySelection';
import { toDirectionString } from './SortUtils';
import { RestoreClinicalTracksMenu } from 'pages/resultsView/oncoprint/RestoreClinicalTracksMenu';
import { Modal } from 'react-bootstrap';
import ClinicalTrackColorPicker from './ClinicalTrackColorPicker';
import { hexToRGBA, rgbaToHex } from 'shared/lib/Colors';
import classnames from 'classnames';
import { OncoprintColorModal } from './OncoprintColorModal';
import JupyterNoteBookModal from 'pages/staticPages/tools/oncoprinter/JupyterNotebookModal';
import { convertToCSV } from 'shared/lib/calculation/JSONtoCSV';
import { GAP_MODE_ENUM } from 'oncoprintjs';

interface IResultsViewOncoprintProps {
    divId: string;
    store: ResultsViewPageStore;
    urlWrapper: ResultsViewURLWrapper;
    addOnBecomeVisibleListener?: (callback: () => void) => void;
}

const DEFAULT_UNKNOWN_COLOR = [255, 255, 255, 1];
const DEFAULT_MIXED_COLOR = [48, 97, 194, 1];

export enum SortByUrlParamValue {
    CASE_ID = 'case_id',
    CASE_LIST = 'case_list',
    NONE = '',
}

export type SortMode =
    | {
          type: 'data' | 'alphabetical' | 'caseList';
          clusteredHeatmapProfile?: undefined;
      }
    | { type: 'heatmap'; clusteredHeatmapProfile: string };

export interface IGenesetExpansionRecord {
    entrezGeneId: number;
    hugoGeneSymbol: string;
    molecularProfileId: string;
    correlationValue: number;
}

const CLINICAL_TRACK_KEY_PREFIX = 'CLINICALTRACK_';

/*  Each additional track group can hold tracks of a single entity type.
    Implemented entity types are genes and generic assay entites. In the
    AdditionalTrackGroupRecord type the `entities` member refers to
    hugo_gene_symbols (for genes) or to entity_id's (for generic assay entities). */
export type AdditionalTrackGroupRecord = {
    trackGroupIndex: number;
    molecularAlterationType: string;
    entities: { [entity: string]: boolean }; // map of hugo_gene_symbols or entity_id's
    molecularProfileId: string;
    molecularProfile: MolecularProfile;
};

export function getClinicalTrackValues(track: ClinicalTrackSpec): any[] {
    // if the datatype is "counts", the values are under countsCategoryLabels
    // else if the datatype is "string", get values from the track data
    if (track.datatype === 'counts') {
        return track.countsCategoryLabels;
    } else if (track.datatype === 'string') {
        const values = _(track.data)
            .map(d => d.attr_val)
            .uniq()
            .without(undefined, '')
            .value();
        return values.sort((a: string, b: string) =>
            a < b ? -1 : a > b ? 1 : 0
        );
    }
    return [];
}

export function getClinicalTrackColor(
    track: ClinicalTrackSpec,
    value: string
): RGBAColor {
    if (track.datatype === 'counts') {
        // get index of value that corresponds with its color
        let valueIndex = _.indexOf(track.countsCategoryLabels, value);
        return track.countsCategoryFills[valueIndex];
    } else if (track.datatype === 'string' && track.category_to_color) {
        if (value === 'Mixed') {
            return track.category_to_color[value] || DEFAULT_MIXED_COLOR;
        }
        return track.category_to_color[value];
    } else {
        return DEFAULT_UNKNOWN_COLOR as RGBAColor;
    }
}

/* fields and methods in the class below are ordered based on roughly
/* chronological setup concerns, rather than on encapsulation and public API */
/* tslint:disable: member-ordering */
@observer
export default class ResultsViewOncoprint extends React.Component<
    IResultsViewOncoprintProps,
    {}
> {
    @computed get columnMode() {
        return this.urlWrapper.query.show_samples === 'true'
            ? 'sample'
            : 'patient';
    }

    @computed get sortMode() {
        let mode: SortMode;
        switch (this.urlWrapper.query.oncoprint_sortby) {
            case 'case_id':
                mode = { type: 'alphabetical' };
                break;
            case 'case_list':
                mode = { type: 'caseList' };
                break;
            case 'cluster':
                mode = {
                    type: 'heatmap',
                    clusteredHeatmapProfile: this.urlWrapper.query
                        .oncoprint_cluster_profile,
                };
                break;
            case '':
            default:
                mode = { type: 'data' };
        }

        return mode;
    }

    @computed get sortByMutationType() {
        return (
            !this.urlWrapper.query.oncoprint_sort_by_mutation_type || // on by default
            this.urlWrapper.query.oncoprint_sort_by_mutation_type === 'true'
        );
    }

    @computed get sortByDrivers() {
        return (
            !this.urlWrapper.query.oncoprint_sort_by_drivers || // on by default
            this.urlWrapper.query.oncoprint_sort_by_drivers === 'true'
        );
    }

    @computed get isWhiteBackgroundForGlyphsEnabled() {
        return (
            this.urlWrapper.query.enable_white_background_for_glyphs === 'true'
        );
    }

    @computed get genericAssayPromises() {
        if (this.props.store.studyIds.result.length === 1) {
            // we only support generic assay in oncoprint for single study,
            // and don't want to make unnecessary references->unnecessary
            // API calls for multiple studies (or for pending when studyIds.length == 0)
            return this.props.store;
        } else {
            return {
                genericAssayEntitiesGroupedByGenericAssayType: mobxPromiseResolve<{
                    [genericAssayType: string]: GenericAssayMeta[];
                }>({}),
                genericAssayEntitiesGroupedByGenericAssayTypeLinkMap: mobxPromiseResolve<{
                    [genericAssayType: string]: { [stableId: string]: string };
                }>({}),
            };
        }
    }

    @computed
    get selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl() {
        const result = _.reduce(
            this.props.store
                .selectedGenericAssayEntitiesGroupByMolecularProfileId,
            (acc, entityId, profileId) => {
                if (
                    this.props.store.molecularProfileIdToMolecularProfile
                        .result[profileId]
                ) {
                    const type = this.props.store
                        .molecularProfileIdToMolecularProfile.result[profileId]
                        .genericAssayType;
                    acc[type] = acc[type]
                        ? _.union(entityId, acc[type])
                        : entityId;
                }
                return acc;
            },
            {} as { [genericAssayType: string]: string[] }
        );
        return result;
    }

    @observable distinguishGermlineMutations: boolean = true;
    @observable distinguishMutationType: boolean = true;
    @observable showUnalteredColumns: boolean = true;
    @observable showWhitespaceBetweenColumns: boolean = true;
    @observable showClinicalTrackLegends: boolean = true;
    @observable _onlyShowClinicalLegendForAlteredCases = false;
    @observable showOqlInLabels = false;
    @observable useOqlFilteringForVafHeatmap: boolean = true;

    @computed get onlyShowClinicalLegendForAlteredCases() {
        return (
            this.showClinicalTrackLegends &&
            this._onlyShowClinicalLegendForAlteredCases
        );
    }

    @observable showMinimap: boolean = false;

    @observable selectedHeatmapProfileId = '';
    @observable heatmapGeneInputValue = '';

    @observable selectedGenericAssayProfileId: string | null = null;

    @observable horzZoom: number = 0.5;

    @observable mouseInsideBounds: boolean = false;

    @observable renderingComplete = false;

    // clinical tracks selected in the tracks menu that are pending submission
    @observable clinicalTracksPendingSubmission: ClinicalTrackConfig[];

    private heatmapGeneInputValueUpdater: IReactionDisposer;

    private molecularProfileIdToTrackGroupIndex: {
        [molecularProfileId: string]: number;
    } = {};

    @computed get selectedClinicalTrackConfig(): ClinicalTrackConfigMap {
        let clinicalTracks: ClinicalTrackConfig[] | undefined = this.props.store
            .pageUserSession.userSettings?.clinicallist;
        if (clinicalTracks) {
            const userSettingsTracksMap = {} as ClinicalTrackConfigMap;
            clinicalTracks.forEach(
                cl => (userSettingsTracksMap[cl.stableId] = cl)
            );
            return userSettingsTracksMap;
        }

        clinicalTracks = [];

        // when there is no user selection in URL, we want to
        // have some default tracks based on certain conditions
        if (
            this.props.store.studyIds.result &&
            this.props.store.studyIds.result.length > 1
        ) {
            clinicalTracks.push(
                new ClinicalTrackConfig(SpecialAttribute.StudyOfOrigin)
            );
        }

        if (
            this.props.store.filteredSamples.result &&
            this.props.store.filteredPatients.result &&
            this.props.store.filteredSamples.result.length >
                this.props.store.filteredPatients.result.length
        ) {
            clinicalTracks.push(
                new ClinicalTrackConfig(SpecialAttribute.NumSamplesPerPatient)
            );
        }

        _.forEach(
            this.props.store.clinicalAttributes_profiledIn.result,
            attr => {
                clinicalTracks!.push(
                    new ClinicalTrackConfig(attr.clinicalAttributeId)
                );
            }
        );
        return _.keyBy(
            clinicalTracks,
            a => a.stableId
        ) as ClinicalTrackConfigMap;
    }

    @computed get selectedGeneticTrackConfig(): GeneticTrackConfigMap {
        let geneticTracks: GeneticTrackConfig[] | undefined = this.props.store
            .pageUserSession.userSettings?.geneticlist;
        if (geneticTracks) {
            const userSettingsTrackMap = geneticTracks.reduce((acc, track) => {
                acc[track.stableId] = track;
                return acc;
            }, {} as GeneticTrackConfigMap);
            return userSettingsTrackMap;
        }

        geneticTracks = (this.props.store.genes.result || []).map(
            attr => new GeneticTrackConfig(attr.hugoGeneSymbol)
        );

        return geneticTracks
            .map(track => ({
                [track.stableId]: track,
            }))
            .reduce((acc, obj) => {
                Object.assign(acc, obj);
                return acc;
            }, {} as GeneticTrackConfigMap);
    }

    public expansionsByGeneticTrackKey = observable.map<string, number[]>();
    public expansionsByGenesetHeatmapTrackKey = observable.map<
        string,
        IGenesetExpansionRecord[]
    >();

    @computed get molecularProfileIdToAdditionalTracks() {
        // start with heatmap tracks param
        const groups = this.urlWrapper.query.heatmap_track_groups
            ? this.urlWrapper.query.heatmap_track_groups
                  .split(';')
                  .map((x: string) => x.split(','))
            : [];

        if (this.urlWrapper.query.generic_assay_groups) {
            // add generic assay tracks
            groups.push(
                ...this.urlWrapper.query.generic_assay_groups
                    .split(';')
                    .map((x: string) => x.split(','))
            );
        }

        const parsedGroups = groups.reduce(
            (acc: { [molecularProfileId: string]: string[] }, group) => {
                acc[group[0] as string] = group.slice(1);
                return acc;
            },
            {}
        );

        const map: {
            [molecularProfileId: string]: AdditionalTrackGroupRecord;
        } = {};

        let nextTrackGroupIndex: number;
        // start next track group index based on existing track groups
        if (_.isEmpty(this.molecularProfileIdToTrackGroupIndex)) {
            nextTrackGroupIndex = 2;
        } else {
            nextTrackGroupIndex =
                Math.max(
                    ..._.values(this.molecularProfileIdToTrackGroupIndex)
                ) + 1;
        }
        _.forEach(parsedGroups, (entities: string[], molecularProfileId) => {
            const profile: MolecularProfile = this.props.store
                .molecularProfileIdToMolecularProfile.result[
                molecularProfileId
            ];
            if (profile && entities && entities.length) {
                if (
                    !(
                        profile.molecularProfileId in
                        this.molecularProfileIdToTrackGroupIndex
                    )
                ) {
                    // set track group index if doesnt yet exist
                    this.molecularProfileIdToTrackGroupIndex[
                        profile.molecularProfileId
                    ] = nextTrackGroupIndex;
                    nextTrackGroupIndex += 1;
                }
                const trackGroup: AdditionalTrackGroupRecord = {
                    trackGroupIndex: this.molecularProfileIdToTrackGroupIndex[
                        profile.molecularProfileId
                    ],
                    molecularProfile: profile,
                    molecularProfileId: profile.molecularProfileId,
                    molecularAlterationType: profile.molecularAlterationType,
                    entities: {},
                };
                entities.forEach(
                    (entity: string) => (trackGroup.entities[entity] = true)
                );
                map[molecularProfileId] = trackGroup;
            }
        });
        return map;
    }

    public controlsHandlers: IOncoprintControlsHandlers;
    private controlsState: IOncoprintControlsState;

    @observable.ref private oncoprint: Oncoprint | null;
    @observable.ref private oncoprintJs: OncoprintJS;

    @autobind
    private oncoprintRef(oncoprint: Oncoprint | null) {
        this.oncoprint = oncoprint;
    }

    private urlParamsReaction: IReactionDisposer;

    constructor(props: IResultsViewOncoprintProps) {
        super(props);

        makeObservable(this);
        this.showOqlInLabels = props.store.queryContainsOql;
        (window as any).resultsViewOncoprint = this;

        const self = this;
        this.setSessionClinicalTracks = this.setSessionClinicalTracks.bind(
            this
        );
        this.onDeleteClinicalTrack = this.onDeleteClinicalTrack.bind(this);
        this.onDeleteGeneticTrack = this.onDeleteGeneticTrack.bind(this);
        this.onMinimapClose = this.onMinimapClose.bind(this);
        this.oncoprintRef = this.oncoprintRef.bind(this);
        this.oncoprintJsRef = this.oncoprintJsRef.bind(this);
        this.toggleColumnMode = this.toggleColumnMode.bind(this);
        this.onTrackSortDirectionChange = this.onTrackSortDirectionChange.bind(
            this
        );
        this.onSuppressRendering = this.onSuppressRendering.bind(this);
        this.onReleaseRendering = this.onReleaseRendering.bind(this);

        onMobxPromise(
            this.props.store.heatmapMolecularProfiles,
            (profiles: MolecularProfile[]) => {
                // select first initially
                if (profiles.length) {
                    this.selectedHeatmapProfileId =
                        profiles[0].molecularProfileId;
                }
            }
        );

        this.heatmapGeneInputValueUpdater = onMobxPromise(
            this.props.store.genes,
            (genes: Gene[]) => {
                this.heatmapGeneInputValue = genes
                    .map(g => g.hugoGeneSymbol)
                    .join(' ');
            },
            Number.POSITIVE_INFINITY
        );

        this.onMouseEnter = this.onMouseEnter.bind(this);
        this.onMouseLeave = this.onMouseLeave.bind(this);

        this.controlsHandlers = this.buildControlsHandlers();

        this.controlsState = observable({
            get selectedClinicalAttributeSpecInits(): ClinicalTrackConfigMap {
                return self.selectedClinicalTrackConfig;
            },
            get clinicalTracksPendingSubmission(): ClinicalTrackConfig[] {
                if (!self.clinicalTracksPendingSubmission) {
                    return _.values(self.selectedClinicalTrackConfig);
                } else {
                    return self.clinicalTracksPendingSubmission;
                }
            },
            get selectedColumnType() {
                return self.oncoprintAnalysisCaseType;
            },
            get showUnalteredColumns() {
                return self.showUnalteredColumns;
            },
            get showWhitespaceBetweenColumns() {
                return self.showWhitespaceBetweenColumns;
            },
            get showClinicalTrackLegends() {
                return self.showClinicalTrackLegends;
            },
            get onlyShowClinicalLegendForAlteredCases() {
                return self.onlyShowClinicalLegendForAlteredCases;
            },
            get showOqlInLabels() {
                return self.showOqlInLabels;
            },
            get isWhiteBackgroundForGlyphsEnabled() {
                return self.isWhiteBackgroundForGlyphsEnabled;
            },
            get showMinimap() {
                return self.showMinimap;
            },
            get hideHeatmapMenu() {
                return self.props.store.studies.result.length > 1;
            },
            get sortByMutationType() {
                return self.sortByMutationType;
            },
            get sortByCaseListDisabled() {
                return !self.caseListSortPossible;
            },
            get distinguishMutationType() {
                return self.distinguishMutationType;
            },
            get distinguishDrivers() {
                return self.distinguishDrivers;
            },
            get distinguishGermlineMutations() {
                return self.distinguishGermlineMutations;
            },
            get annotateDriversOncoKb() {
                return self.props.store.driverAnnotationSettings.oncoKb;
            },
            get annotateDriversOncoKbDisabled() {
                return !getServerConfig().show_oncokb;
            },
            get annotateDriversOncoKbError() {
                return self.props.store.didOncoKbFailInOncoprint;
            },
            get annotateDriversHotspots() {
                return self.props.store.driverAnnotationSettings.hotspots;
            },
            get annotateDriversHotspotsDisabled() {
                return !getServerConfig().show_hotspot;
            },
            get annotateDriversHotspotsError() {
                return self.props.store.didHotspotFailInOncoprint;
            },
            get hidePutativePassengers() {
                return !self.props.store.driverAnnotationSettings.includeVUS;
            },
            get hideGermlineMutations() {
                return !self.props.store.includeGermlineMutations;
            },
            get sortMode() {
                return self.sortMode;
            },
            get sortByDrivers() {
                return self.sortByDrivers;
            },
            get heatmapProfilesPromise() {
                return self.props.store.heatmapMolecularProfiles;
            },
            get genericAssayEntitiesGroupedByGenericAssayTypePromise() {
                return this.genericAssayPromises
                    .genericAssayEntitiesGroupedByGenericAssayType;
            },
            get selectedHeatmapProfileId() {
                return self.selectedHeatmapProfileId;
            },
            get heatmapIsDynamicallyQueried() {
                return self.heatmapIsDynamicallyQueried;
            },
            get ngchmButtonActive() {
                return getServerConfig().show_mdacc_heatmap &&
                    self.props.store.remoteNgchmUrl.result &&
                    self.props.store.remoteNgchmUrl.result != ''
                    ? true
                    : false;
            },
            get heatmapGeneInputValue() {
                return self.heatmapGeneInputValue;
            },
            get customDriverAnnotationBinaryMenuLabel() {
                const label = getServerConfig()
                    .oncoprint_custom_driver_annotation_binary_menu_label;
                const customDriverReport =
                    self.props.store.customDriverAnnotationReport.result;
                if (
                    label &&
                    customDriverReport &&
                    customDriverReport.hasBinary
                ) {
                    return label;
                } else {
                    return undefined;
                }
            },
            get customDriverAnnotationTiersMenuLabel() {
                const label = getServerConfig()
                    .oncoprint_custom_driver_annotation_tiers_menu_label;
                const customDriverReport =
                    self.props.store.customDriverAnnotationReport.result;
                if (
                    label &&
                    customDriverReport &&
                    customDriverReport.tiers.length
                ) {
                    return label;
                } else {
                    return undefined;
                }
            },
            get customDriverAnnotationTiers() {
                const customDriverReport =
                    self.props.store.customDriverAnnotationReport.result;
                if (customDriverReport && customDriverReport.tiers.length) {
                    return customDriverReport.tiers;
                } else {
                    return undefined;
                }
            },
            get annotateCustomDriverBinary() {
                return self.props.store.driverAnnotationSettings.customBinary;
            },
            get selectedCustomDriverAnnotationTiers() {
                return self.props.store.driverAnnotationSettings.driverTiers;
            },
            get columnMode() {
                return self.oncoprintAnalysisCaseType;
            },
            get horzZoom() {
                if (isNaN(self.horzZoom)) {
                    return 1;
                } else {
                    return self.horzZoom;
                }
            },
            get isClinicalTrackConfigDirty() {
                return self.props.store.pageUserSession.isDirty;
            },
            get isLoggedIn() {
                return self.props.store.pageUserSession.isLoggedIn;
            },
            get isSessionServiceEnabled() {
                return self.props.store.pageUserSession.isSessionServiceEnabled;
            },
        });

        this.configureClinicalTracks();
    }

    private configureClinicalTracks() {
        const sessionConfig = this.props.store.pageUserSession.userSettings
            ?.clinicallist;
        const urlConfig = this.urlWrapper.oncoprintSelectedClinicalTracks;

        if (!urlConfig && !sessionConfig) {
            this.initializeClinicalTracksFromServerConfig();
        } else if (!urlConfig && sessionConfig) {
            // do not update deprecated clinicallist url param
        } else if (urlConfig) {
            this.setSessionClinicalTracks(
                this.urlWrapper.oncoprintSelectedClinicalTracks!
            );
        }
    }

    /**
     * Configures the default oncoprint clinical tracks
     * from a JSON file configured on the server
     */
    private initializeClinicalTracksFromServerConfig(): void {
        const clinicalTracksConfig = getServerConfig()
            .oncoprint_clinical_tracks_config_json;
        if (!clinicalTracksConfig) {
            return;
        }
        const clinicalTracks = JSON.parse(
            clinicalTracksConfig
        ) as ClinicalTrackConfig[];
        this.setSessionClinicalTracks(clinicalTracks);
    }

    private setSessionClinicalTracks(clinicalTracks: ClinicalTrackConfig[]) {
        let pageUserSession = this.props.store.pageUserSession;
        pageUserSession.userSettings = {
            ...pageUserSession.userSettings,
            clinicallist: clinicalTracks,
        };
    }

    get urlWrapper() {
        return this.props.urlWrapper;
    }

    @computed get caseListSortPossible(): boolean {
        return !!(
            this.props.store.givenSampleOrder.isComplete &&
            this.props.store.givenSampleOrder.result.length
        );
    }

    @computed get distinguishDrivers() {
        return this.props.store.driverAnnotationSettings.driversAnnotated;
    }

    onMouseEnter() {
        this.mouseInsideBounds = true;
    }

    onMouseLeave() {
        this.mouseInsideBounds = false;
    }

    // jupyternotebook modal handling:

    @observable public showJupyterNotebookModal = false;
    @observable private jupyterFileContent: string | undefined = '';
    @observable private jupyterFileName: string | undefined = '';

    @action
    private openJupyterNotebookModal = () => {
        this.showJupyterNotebookModal = true;
    };

    @action
    private closeJupyterNotebookModal = () => {
        this.showJupyterNotebookModal = false;
        this.jupyterFileContent = undefined;
        this.jupyterFileName = undefined;
    };

    private buildControlsHandlers() {
        return {
            onSelectColumnType: (type: OncoprintAnalysisCaseType) => {
                this.props.store.setOncoprintAnalysisCaseType(type);
            },
            onSelectShowUnalteredColumns: (show: boolean) => {
                this.showUnalteredColumns = show;
            },
            onSelectShowWhitespaceBetweenColumns: (show: boolean) => {
                this.showWhitespaceBetweenColumns = show;
            },
            onSelectShowClinicalTrackLegends: (show: boolean) => {
                this.showClinicalTrackLegends = show;
            },
            onSelectOnlyShowClinicalLegendForAlteredCases: (show: boolean) => {
                this._onlyShowClinicalLegendForAlteredCases = show;
            },
            onSelectShowOqlInLabels: (show: boolean) => {
                this.showOqlInLabels = show;
            },
            onSelectIsWhiteBackgroundForGlyphsEnabled: (s: boolean) => {
                this.urlWrapper.updateURL({
                    enable_white_background_for_glyphs: s.toString(),
                });
            },
            onSelectShowMinimap: (show: boolean) => {
                this.showMinimap = show;
            },
            onSelectDistinguishMutationType: (s: boolean) => {
                this.distinguishMutationType = s;
            },
            onSelectDistinguishDrivers: action((s: boolean) => {
                if (!s) {
                    this.props.store.driverAnnotationSettings.oncoKb = false;
                    this.props.store.driverAnnotationSettings.hotspots = false;
                    this.props.store.driverAnnotationSettings.customBinary = false;
                    this.props.store.driverAnnotationSettings.driverTiers.forEach(
                        (value, key) => {
                            this.props.store.driverAnnotationSettings.driverTiers.set(
                                key,
                                false
                            );
                        }
                    );
                    this.props.store.driverAnnotationSettings.includeVUS = true;
                } else {
                    if (
                        !this.controlsState.annotateDriversOncoKbDisabled &&
                        !this.controlsState.annotateDriversOncoKbError
                    )
                        this.props.store.driverAnnotationSettings.oncoKb = true;

                    if (
                        !this.controlsState.annotateDriversHotspotsDisabled &&
                        !this.controlsState.annotateDriversHotspotsError
                    )
                        this.props.store.driverAnnotationSettings.hotspots = true;

                    this.props.store.driverAnnotationSettings.customBinary = true;
                    this.props.store.driverAnnotationSettings.driverTiers.forEach(
                        (value, key) => {
                            this.props.store.driverAnnotationSettings.driverTiers.set(
                                key,
                                true
                            );
                        }
                    );
                }
            }),
            onSelectDistinguishGermlineMutations: (s: boolean) => {
                this.distinguishGermlineMutations = s;
            },
            onSelectAnnotateOncoKb: action((s: boolean) => {
                this.props.store.driverAnnotationSettings.oncoKb = s;
            }),
            onSelectAnnotateHotspots: action((s: boolean) => {
                this.props.store.driverAnnotationSettings.hotspots = s;
            }),
            onSelectCustomDriverAnnotationBinary: action((s: boolean) => {
                this.props.store.driverAnnotationSettings.customBinary = s;
            }),
            onSelectCustomDriverAnnotationTier: action(
                (value: string, checked: boolean) => {
                    this.props.store.driverAnnotationSettings.driverTiers.set(
                        value,
                        checked
                    );
                }
            ),
            onSelectHideVUS: (s: boolean) => {
                this.props.store.driverAnnotationSettings.includeVUS = !s;
            },
            onSelectHideGermlineMutations: (s: boolean) => {
                this.props.store.setExcludeGermlineMutations(s);
            },
            onSelectSortByMutationType: (s: boolean) => {
                this.urlWrapper.updateURL({
                    oncoprint_sort_by_mutation_type: s.toString(),
                });
            },
            onClickSortAlphabetical: () => {
                this.urlWrapper.updateURL({
                    oncoprint_sortby: 'case_id',
                    oncoprint_cluster_profile: '',
                });
            },
            onClickSortCaseListOrder: () => {
                this.urlWrapper.updateURL({
                    oncoprint_sortby: 'case_list',
                    oncoprint_cluster_profile: '',
                });
            },
            onSelectSortByDrivers: (sort: boolean) => {
                this.urlWrapper.updateURL({
                    oncoprint_sort_by_drivers: sort.toString(),
                });
            },
            onClickSortByData: () => {
                this.urlWrapper.updateURL({
                    oncoprint_sortby: '',
                    oncoprint_cluster_profile: '',
                });
            },
            onChangeSelectedClinicalTracks: this.setSessionClinicalTracks,
            onChangeClinicalTracksPendingSubmission: (
                clinicalTracks: ClinicalTrackConfig[]
            ) => {
                this.clinicalTracksPendingSubmission = clinicalTracks;
            },
            onChangeHeatmapGeneInputValue: action((s: string) => {
                this.heatmapGeneInputValue = s;
                this.heatmapGeneInputValueUpdater(); // stop updating heatmap input if user has typed
            }),
            onSelectHeatmapProfile: (id: string) => {
                this.selectedHeatmapProfileId = id;
            },
            onClickAddGenesToHeatmap: () => {
                const genes = parseOQLQuery(
                    this.heatmapGeneInputValue.toUpperCase().trim()
                ).map(q => q.gene);
                this.setHeatmapTracks(this.selectedHeatmapProfileId, genes);
            },
            onSelectGenericAssayProfile: (id: string) => {
                // there is a duplicated state. this should be passed into the
                // track selection component
                this.selectedGenericAssayProfileId = id;
            },
            onClickAddGenericAssays: (info: GenericAssayTrackInfo[]) => {
                // you can't select entities from multiple profiles
                // at the same time, so just use first one
                // (should be refactored)
                this.setGenericAssayTracks(
                    info[0].profileId,
                    info.map(d => d.genericAssayEntityId)
                );
            },
            onClickNGCHM: () => {
                window.open(this.props.store.remoteNgchmUrl.result, '_blank');
            },
            onClickDownload: (type: string) => {
                switch (type) {
                    case 'pdf':
                        svgToPdfDownload(
                            'oncoprint.pdf',
                            this.oncoprintJs.toSVG(false)
                        );
                        // if (!pdfDownload("oncoprint.pdf", this.oncoprint.toSVG(true))) {
                        //     alert("Oncoprint too big to download as PDF - please download as SVG.");
                        // }
                        break;
                    case 'png':
                        const img = this.oncoprintJs.toCanvas(
                            (canvas, truncated) => {
                                canvas.toBlob(blob => {
                                    if (truncated) {
                                        alert(
                                            `Oncoprint too large - PNG truncated to ${canvas.getAttribute(
                                                'width'
                                            )}x${canvas.getAttribute('height')}`
                                        );
                                    }
                                    fileDownload(blob, 'oncoprint.png');
                                });
                            },
                            2
                        );
                        break;
                    case 'svg':
                        fileDownload(
                            new XMLSerializer().serializeToString(
                                this.oncoprintJs.toSVG(false)
                            ),
                            'oncoprint.svg'
                        );
                        break;
                    case 'order':
                        const capitalizedColumnMode = capitalize(
                            this.oncoprintAnalysisCaseType
                        );
                        onMobxPromise(
                            [
                                this.props.store.sampleKeyToSample,
                                this.props.store.patientKeyToPatient,
                            ],
                            (
                                sampleKeyToSample: {
                                    [sampleKey: string]: Sample;
                                },
                                patientKeyToPatient: any
                            ) => {
                                let file = `${capitalizedColumnMode} order in the Oncoprint is:\n`;
                                const keyToCase =
                                    this.oncoprintAnalysisCaseType ===
                                    OncoprintAnalysisCaseType.SAMPLE
                                        ? sampleKeyToSample
                                        : patientKeyToPatient;
                                const caseIds = this.oncoprintJs
                                    .getIdOrder()
                                    .map(
                                        this.oncoprintAnalysisCaseType ===
                                            OncoprintAnalysisCaseType.SAMPLE
                                            ? (id: string) =>
                                                  sampleKeyToSample[id].sampleId
                                            : (id: string) =>
                                                  patientKeyToPatient[id]
                                                      .patientId
                                    );
                                for (const caseId of caseIds) {
                                    file += `${caseId}\n`;
                                }
                                fileDownload(
                                    file,
                                    `OncoPrint${capitalizedColumnMode}s.txt`
                                );
                            }
                        );
                        break;
                    case 'tabular':
                        onMobxPromise(
                            [
                                this.props.store.sampleKeyToSample,
                                this.props.store.patientKeyToPatient,
                            ],
                            (
                                sampleKeyToSample: {
                                    [sampleKey: string]: Sample;
                                },
                                patientKeyToPatient: any
                            ) => {
                                tabularDownload(
                                    this.geneticTracks.result,
                                    this.clinicalTracks.result,
                                    this.heatmapTracks.result,
                                    this.genericAssayHeatmapTracks.result,
                                    this.genesetHeatmapTracks.result,
                                    this.oncoprintJs.getIdOrder(),
                                    this.oncoprintAnalysisCaseType ===
                                        OncoprintAnalysisCaseType.SAMPLE
                                        ? (key: string) =>
                                              sampleKeyToSample[key].sampleId
                                        : (key: string) =>
                                              patientKeyToPatient[key]
                                                  .patientId,
                                    this.oncoprintAnalysisCaseType,
                                    this.distinguishDrivers
                                );
                            }
                        );
                        break;
                    case 'oncoprinter':
                        onMobxPromise(
                            [
                                this.props.store.samples,
                                this.props.store.patients,
                                this.geneticTracks,
                                this.clinicalTracks,
                                this.heatmapTracks,
                                this.genesetHeatmapTracks,
                                this.props.store
                                    .clinicalAttributeIdToClinicalAttribute,
                                this.props.store.mutationsByGene,
                                this.props.store.studyIds,
                            ],
                            (
                                samples: Sample[],
                                patients: Patient[],
                                geneticTracks: GeneticTrackSpec[],
                                clinicalTracks: ClinicalTrackSpec[],
                                heatmapTracks: IHeatmapTrackSpec[],
                                genesetHeatmapTracks: IGenesetHeatmapTrackSpec[],
                                attributeIdToAttribute: {
                                    [attributeId: string]: ClinicalAttribute;
                                },
                                mutationsByGenes: {
                                    [gene: string]: Mutation[];
                                },
                                studyIds: string[]
                            ) => {
                                const caseIds =
                                    this.oncoprintAnalysisCaseType ===
                                    OncoprintAnalysisCaseType.SAMPLE
                                        ? samples.map(s => s.sampleId)
                                        : patients.map(p => p.patientId);

                                let geneticInput = '';
                                if (geneticTracks.length > 0) {
                                    geneticInput = getOncoprinterGeneticInput(
                                        geneticTracks,
                                        caseIds,
                                        this.oncoprintAnalysisCaseType
                                    );
                                }

                                let clinicalInput = '';
                                if (clinicalTracks.length > 0) {
                                    const oncoprintClinicalData = _.flatMap(
                                        clinicalTracks,
                                        (track: ClinicalTrackSpec) => track.data
                                    );
                                    clinicalInput = getOncoprinterClinicalInput(
                                        oncoprintClinicalData,
                                        caseIds,
                                        clinicalTracks.map(
                                            track => track.attributeId
                                        ),
                                        attributeIdToAttribute,
                                        this.oncoprintAnalysisCaseType
                                    );
                                }

                                let heatmapInput = '';
                                if (heatmapTracks.length > 0) {
                                    heatmapInput = getOncoprinterHeatmapInput(
                                        heatmapTracks,
                                        caseIds,
                                        this.oncoprintAnalysisCaseType
                                    );
                                }

                                if (genesetHeatmapTracks.length > 0) {
                                    alert(
                                        'Oncoprinter does not support geneset heatmaps - all other tracks will still be exported.'
                                    );
                                }

                                const oncoprinterWindow = window.open(
                                    buildCBioPortalPageUrl('/oncoprinter')
                                ) as any;

                                // extra data that needs to be send for jupyter-notebook
                                const allMutations = Object.values(
                                    mutationsByGenes
                                ).reduce(
                                    (acc, geneArray) => [...acc, ...geneArray],
                                    []
                                );

                                oncoprinterWindow.clientPostedData = {
                                    genetic: geneticInput,
                                    clinical: clinicalInput,
                                    heatmap: heatmapInput,
                                    mutations: JSON.stringify(allMutations),
                                    studyIds: JSON.stringify(studyIds),
                                };
                            }
                        );
                        break;
                    case 'jupyterNoteBook':
                        onMobxPromise(
                            [
                                this.props.store.sampleKeyToSample,
                                this.props.store.patientKeyToPatient,
                                this.props.store.mutationsByGene,
                                this.props.store.studyIds,
                            ],
                            (
                                sampleKeyToSample: {
                                    [sampleKey: string]: Sample;
                                },
                                patientKeyToPatient: any,
                                mutationsByGenes: {
                                    [gene: string]: Mutation[];
                                },
                                studyIds: string[]
                            ) => {
                                const allGenesMutations = Object.values(
                                    mutationsByGenes
                                ).reduce(
                                    (acc, geneArray) => [...acc, ...geneArray],
                                    []
                                );

                                const fieldsToKeep = [
                                    'hugoGeneSymbol',
                                    'alterationType',
                                    'chr',
                                    'startPosition',
                                    'endPosition',
                                    'referenceAllele',
                                    'variantAllele',
                                    'proteinChange',
                                    'proteinPosStart',
                                    'proteinPosEnd',
                                    'mutationType',
                                    'oncoKbOncogenic',
                                    'patientId',
                                    'sampleId',
                                    'isHotspot',
                                ];

                                const allGenesMutationsCsv = convertToCSV(
                                    allGenesMutations,
                                    fieldsToKeep
                                );

                                this.jupyterFileContent = allGenesMutationsCsv;

                                this.jupyterFileName = studyIds.join('&');

                                // sending content to the modal
                                this.openJupyterNotebookModal();
                            }
                        );
                        break;
                }
            },
            onSetHorzZoom: (z: number) => {
                this.oncoprintJs.setHorzZoomCentered(z);
            },
            onClickZoomIn: () => {
                this.oncoprintJs.setHorzZoomCentered(
                    this.oncoprintJs.getHorzZoom() / 0.7
                );
            },
            onClickZoomOut: () => {
                this.oncoprintJs.setHorzZoomCentered(
                    this.oncoprintJs.getHorzZoom() * 0.7
                );
            },
        };
    }

    /**
     * Indicates whether dynamic heatmap querying controls are relevant.
     *
     * They are if a non-geneset heatmap profile is currently selected; gene set
     * heatmaps are queried from the query page.
     */
    @computed get heatmapIsDynamicallyQueried(): boolean {
        const profileMap = this.props.store.molecularProfileIdToMolecularProfile
            .result;
        return (
            profileMap.hasOwnProperty(this.selectedHeatmapProfileId) &&
            profileMap[this.selectedHeatmapProfileId]
                .molecularAlterationType !==
                AlterationTypeConstants.GENESET_SCORE
        );
    }

    @action public sortByData() {
        this.urlWrapper.updateURL({
            oncoprint_sortby: '',
            oncoprint_cluster_profile: '',
        });
    }

    @computed get clinicalTracksUrlParam() {
        return _(this.selectedClinicalTrackConfig)
            .values()
            .clone();
    }

    private readonly unalteredKeys = remoteData({
        await: () => [this.geneticTracks],
        invoke: async () => getUnalteredUids(this.geneticTracks.result!),
    });

    public setGenericAssayTracks(
        molecularProfileId: string,
        entities: string[]
    ) {
        const groups = this.urlWrapper.query.generic_assay_groups
            ? this.urlWrapper.query.generic_assay_groups
                  .split(';')
                  .map((x: string) => x.split(','))
            : [];

        const targetGroup = groups.find(g => g[0] === molecularProfileId);

        if (targetGroup) {
            // if theres already a group for this profile, update entities
            targetGroup.splice(1, targetGroup.length); // remove existing entities
            targetGroup.push(...entities); // add new entities
        } else {
            // if not, add a group
            groups.push([molecularProfileId, ...entities]);
        }

        const generic_assay_groups = groups
            .filter(group => group.length > 1) // a group of length 1 only contains the molecularProfileId and no entities
            .map(group => group.join(','))
            .join(';');

        this.urlWrapper.updateURL({
            generic_assay_groups,
        });
    }

    public async setHeatmapTracks(
        molecularProfileId: string,
        entities: string[]
    ) {
        const tracksMap = _.cloneDeep(
            this.molecularProfileIdToAdditionalTracks
        ) as {
            [molecularProfileId: string]: Pick<
                AdditionalTrackGroupRecord,
                'entities' | 'molecularProfileId' | 'molecularAlterationType'
            >;
        };

        const entitiesMap = _.chain(entities)
            .keyBy(entity => entity)
            .mapValues(() => true)
            .value();

        // first delete any existing track for this profileId
        delete tracksMap[molecularProfileId];

        const molecularAlterationType = this.props.store
            .molecularProfileIdToMolecularProfile.result[molecularProfileId]
            .molecularAlterationType!;

        if (entities && entities.length) {
            tracksMap[molecularProfileId] = {
                entities: entitiesMap,
                molecularAlterationType,
                molecularProfileId,
            };
        } else {
            delete tracksMap[molecularProfileId];
        }

        const profileIdToProfile = await toPromise(
            this.props.store.molecularProfileIdToMolecularProfile
        );

        const heatmap_track_groups: string[] = [];

        _.forEach(tracksMap, (track, molecularProfileId) => {
            const profile = profileIdToProfile[molecularProfileId];
            let shouldAdd = true;
            if (
                profile.molecularAlterationType ===
                AlterationTypeConstants.GENERIC_ASSAY
            ) {
                shouldAdd = isGenericAssayHeatmapProfile(profile);
            }

            if (shouldAdd) {
                heatmap_track_groups.push(
                    `${molecularProfileId},${_.keys(track.entities).join(',')}`
                );
            }
        });

        this.urlWrapper.updateURL({
            heatmap_track_groups: heatmap_track_groups.join(';'),
        });
    }

    private toggleColumnMode() {
        switch (this.oncoprintAnalysisCaseType) {
            case OncoprintAnalysisCaseType.SAMPLE:
                this.controlsHandlers.onSelectColumnType &&
                    this.controlsHandlers.onSelectColumnType(
                        OncoprintAnalysisCaseType.PATIENT
                    );
                break;
            case OncoprintAnalysisCaseType.PATIENT:
                this.controlsHandlers.onSelectColumnType &&
                    this.controlsHandlers.onSelectColumnType(
                        OncoprintAnalysisCaseType.SAMPLE
                    );
                break;
        }
    }

    private oncoprintJsRef(oncoprintJs: OncoprintJS) {
        this.oncoprintJs = oncoprintJs;
        if (this.props.addOnBecomeVisibleListener) {
            this.props.addOnBecomeVisibleListener(() =>
                this.oncoprintJs.triggerPendingResizeAndOrganize(
                    this.onReleaseRendering
                )
            );
        }

        this.oncoprintJs.onHorzZoom(z => (this.horzZoom = z));
        this.horzZoom = this.oncoprintJs.getHorzZoom();
        onMobxPromise(this.alteredKeys, (alteredUids: string[]) => {
            this.oncoprintJs.setHorzZoomToFit(alteredUids);
        });
    }

    private setColumnMode(type: OncoprintAnalysisCaseType) {
        this.urlWrapper.updateURL({
            show_samples:
                type === OncoprintAnalysisCaseType.SAMPLE ? 'true' : 'false',
        });
    }

    readonly alteredKeys = remoteData({
        await: () => [this.geneticTracks],
        invoke: async () => getAlteredUids(this.geneticTracks.result!),
        default: [],
    });

    @action private onMinimapClose() {
        this.showMinimap = false;
    }

    @action private onSuppressRendering() {
        this.renderingComplete = false;
    }

    @action private onReleaseRendering() {
        this.renderingComplete = true;
    }

    public clinicalTrackKeyToAttributeId(clinicalTrackKey: string) {
        return clinicalTrackKey.substr(CLINICAL_TRACK_KEY_PREFIX.length);
    }

    public clinicalAttributeIdToTrackKey(
        clinicalAttributeId: string | SpecialAttribute
    ) {
        return `${CLINICAL_TRACK_KEY_PREFIX}${clinicalAttributeId}`;
    }

    private onDeleteClinicalTrack(clinicalTrackKey: string): void {
        // ignore tracks being deleted due to rendering process reasons
        if (!this.isHidden) {
            let json: ClinicalTrackConfigMap = _.clone(
                this.selectedClinicalTrackConfig
            );
            json = _.omitBy(
                json,
                entry =>
                    entry.stableId ===
                    this.clinicalTrackKeyToAttributeId(clinicalTrackKey)
            ) as ClinicalTrackConfigMap;
            const session = this.props.store.pageUserSession;
            session.userSettings = {
                ...session.userSettings,
                clinicallist: _.values(json),
            };
            this.controlsHandlers.onChangeClinicalTracksPendingSubmission &&
                this.controlsHandlers.onChangeClinicalTracksPendingSubmission(
                    _.values(json)
                );
        }
    }

    private onDeleteGeneticTrack(
        geneticTrackKey: string,
        geneticSublabel: string
    ): void {
        if (!this.isHidden) {
            let json: GeneticTrackConfigMap = _.clone(
                this.selectedGeneticTrackConfig
            );
            const genesToDelete = geneticTrackKey.split(' ');
            json = _.omitBy(json, entry =>
                genesToDelete.some(gene => entry.stableId.includes(gene.trim()))
            ) as GeneticTrackConfigMap;
            const session = this.props.store.pageUserSession;
            session.userSettings = {
                ...session.userSettings,
                geneticlist: _.values(json),
            };
            const remainingGeneAfterDeletion = Object.keys(json).join(' ');
            const updatedGeneList = this.calculateUpdatedGeneList(
                remainingGeneAfterDeletion,
                geneticSublabel,
                geneticTrackKey
            );
            this.urlWrapper.updateURL({
                gene_list: updatedGeneList.join(' '),
            });
        }
    }

    private calculateUpdatedGeneList(
        remainingGeneAfterDeletion: string,
        geneticSublabel: string,
        GeneticTrackToBeDeleted: string
    ): string[] {
        const urlParams = new URLSearchParams(window.location.search);
        const geneListFromURL = urlParams.get('gene_list') || '';
        let geneListArrayFromURL: string[];

        if (geneListFromURL.includes('%25')) {
            geneListArrayFromURL = geneListFromURL
                .split('%25')
                .map(param => decodeURIComponent(param));
        } else {
            geneListArrayFromURL = geneListFromURL
                .split('%20')
                .map(param => decodeURIComponent(param));
        }
        let tempArray: string[] = [];
        for (const item of geneListArrayFromURL) {
            tempArray = tempArray.concat(item.split('\n'));
        }
        geneListArrayFromURL = tempArray.filter(item => item.trim() !== '');
        let updatedGeneList: string[] = [];
        const remainingGeneAfterDeletionString = remainingGeneAfterDeletion.split(
            ' '
        );

        //Datatypes genetrack logic
        if (geneListArrayFromURL.includes('DATATYPES:')) {
            updatedGeneList.push(
                'DATATYPES' +
                    geneticSublabel +
                    ' ; ' +
                    remainingGeneAfterDeletion
            );
        } else if (geneticSublabel) {
            //OQL Queries logic
            const isSublabelInURL = this.isSublabelInURL(
                geneListArrayFromURL,
                geneticSublabel
            );
            if (isSublabelInURL) {
                const newList = this.sliceURLBasedOnSublabel(
                    geneListArrayFromURL,
                    geneticSublabel,
                    GeneticTrackToBeDeleted
                );
                if (newList !== null) {
                    updatedGeneList.push(...newList);
                }
            } else {
                geneListArrayFromURL = geneListArrayFromURL.filter(
                    item => item !== GeneticTrackToBeDeleted
                );
                const testRemainingArray = remainingGeneAfterDeletionString; // Split testRemaining into an array
                let startIdx = 0;

                for (let i = 1; i < testRemainingArray.length; i++) {
                    const currentGene = testRemainingArray[i];
                    const currentIndex = geneListArrayFromURL.indexOf(
                        currentGene
                    );
                    const genesToAdd = geneListArrayFromURL.slice(
                        startIdx,
                        currentIndex
                    );
                    updatedGeneList.push(...genesToAdd);
                    updatedGeneList.push('\n');
                    startIdx = currentIndex;
                }
                const genesToAdd = geneListArrayFromURL.slice(
                    startIdx,
                    geneListArrayFromURL.length + 1
                );
                updatedGeneList.push(...genesToAdd);
            }
        } else {
            //Merged gene track updation logic
            let insideSquareBrackets = false;
            let withinQuotes = false;
            let startIdx = geneListArrayFromURL.indexOf('[');
            let endIdx = geneListArrayFromURL.lastIndexOf(']');
            let desiredArray = geneListArrayFromURL.slice(startIdx, endIdx + 1);
            const containsBracketGenes = remainingGeneAfterDeletionString.some(
                gene => desiredArray.includes(gene)
            );
            if (containsBracketGenes) {
                for (const gene of geneListArrayFromURL) {
                    if (gene === '[') {
                        insideSquareBrackets = true;
                        updatedGeneList.push(gene);
                        withinQuotes = false;
                    } else if (gene === ']') {
                        insideSquareBrackets = false;
                        updatedGeneList.push(gene);
                        withinQuotes = false;
                    } else if (
                        insideSquareBrackets &&
                        gene.startsWith('"') &&
                        !withinQuotes
                    ) {
                        updatedGeneList.push(gene);
                        withinQuotes = true;
                    } else if (remainingGeneAfterDeletion.includes(gene)) {
                        updatedGeneList.push(gene);
                    }
                }
            } else {
                updatedGeneList = [remainingGeneAfterDeletion];
            }
        }
        return updatedGeneList;
    }

    private isSublabelInURL(
        geneListArrayFromURL: string[],
        geneticSublabel: string
    ): boolean {
        const sublabelWords = geneticSublabel.split(/[ :=]/).filter(Boolean);
        let currentIndex = 0;

        for (const word of sublabelWords) {
            const index = geneListArrayFromURL.indexOf(word, currentIndex);
            if (index === -1) {
                return false;
            }
            currentIndex = index + 1;
        }

        return true;
    }

    private sliceURLBasedOnSublabel(
        geneListArrayFromURL: string[],
        geneticSublabel: string,
        geneticTrackToBeDeleted: string
    ): string[] | null {
        const sublabelWords = geneticSublabel.split(/[ :=]/).filter(Boolean);
        let currentIndex = 0;

        for (const word of sublabelWords) {
            const index = geneListArrayFromURL.indexOf(word, currentIndex);
            if (index === -1) {
                return null;
            }
            currentIndex = index + 1;
        }

        const startIndex = geneListArrayFromURL.indexOf(sublabelWords[0]);
        const endIndex = geneListArrayFromURL.indexOf(
            sublabelWords[sublabelWords.length - 1]
        );
        const trackWithoutColon = geneListArrayFromURL[startIndex - 1].endsWith(
            ':'
        )
            ? geneListArrayFromURL[startIndex - 1].slice(0, -1) // Remove ':' if it's the last character
            : geneListArrayFromURL[startIndex - 1];
        if (trackWithoutColon === geneticTrackToBeDeleted) {
            const slicedURL = [
                ...geneListArrayFromURL.slice(0, startIndex - 1),
                ...geneListArrayFromURL.slice(endIndex + 1),
            ];
            return slicedURL;
        }
        return null;
    }

    /**
     * Called when a clinical or heatmap track is sorted a-Z or Z-a, selected from within oncoprintjs UI
     */
    private onTrackSortDirectionChange(trackId: TrackId, dir: number) {
        const change = { sortOrder: toDirectionString(dir) };
        this.handleClinicalTrackChange(trackId, change);

        if (dir === 1 || dir === -1) {
            this.sortByData();
        }
    }

    /**
     * Update clinical track gapOn config in url query param
     * Called when a track gap is added from within oncoprintjs UI
     */
    @action.bound
    private onTrackGapChange(trackId: TrackId, mode: GAP_MODE_ENUM) {
        this.handleClinicalTrackChange(trackId, { gapMode: mode });
    }

    private handleClinicalTrackChange(
        trackId: number,
        change: ClinicalTrackConfigChange
    ) {
        if (!this.oncoprint || !this.oncoprintJs) {
            return;
        }
        const clinicalTracks = _.clone(this.selectedClinicalTrackConfig);
        const stableId = this.clinicalTrackKeyToAttributeId(
            this.oncoprint.getTrackSpecKey(trackId) || ''
        );
        const isClinicalTrack =
            stableId && _.keys(clinicalTracks).some(ctg => ctg === stableId);
        if (!isClinicalTrack) {
            return;
        }
        Object.assign(clinicalTracks[stableId], change);

        const session = this.props.store.pageUserSession;
        session.userSettings = {
            ...session.userSettings,
            clinicallist: _.values(clinicalTracks),
        };
    }

    @action.bound
    public clearSortDirectionsAndSortByData() {
        if (this.oncoprintJs) {
            this.oncoprintJs.resetSortableTracksSortDirection();
            this.sortByData();
        }
    }

    // @computed
    public get oncoprintAnalysisCaseType() {
        if (this.urlWrapper.query.show_samples == undefined) {
            return getServerConfig().oncoprint_defaultview === 'patient'
                ? OncoprintAnalysisCaseType.PATIENT
                : OncoprintAnalysisCaseType.SAMPLE;
        } else {
            return this.urlWrapper.query.show_samples === 'true'
                ? OncoprintAnalysisCaseType.SAMPLE
                : OncoprintAnalysisCaseType.PATIENT;
        }
    }

    @computed get sortOrder() {
        if (this.sortMode.type === 'alphabetical') {
            return this.oncoprintAnalysisCaseType ===
                OncoprintAnalysisCaseType.SAMPLE
                ? this.alphabeticalSampleOrder
                : this.alphabeticalPatientOrder;
        } else if (this.sortMode.type === 'caseList') {
            if (
                this.oncoprintAnalysisCaseType ===
                    OncoprintAnalysisCaseType.SAMPLE &&
                this.props.store.givenSampleOrder.isComplete
            ) {
                return this.props.store.givenSampleOrder.result.map(
                    x => x.uniqueSampleKey
                );
            } else if (
                this.oncoprintAnalysisCaseType ===
                    OncoprintAnalysisCaseType.PATIENT &&
                this.props.store.givenSampleOrder.isComplete
            ) {
                return _.uniq(
                    this.props.store.givenSampleOrder.result.map(
                        x => x.uniquePatientKey
                    )
                );
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }

    @computed get alphabeticalSampleOrder() {
        if (this.props.store.filteredSamples.isComplete) {
            return _.sortBy(
                this.props.store.filteredSamples.result!,
                sample => sample.sampleId
            ).map(sample => sample.uniqueSampleKey);
        } else {
            return undefined;
        }
    }

    @computed get alphabeticalPatientOrder() {
        if (this.props.store.filteredPatients.isComplete) {
            return _.sortBy(
                this.props.store.filteredPatients.result!,
                patient => patient.patientId
            ).map(patient => patient.uniquePatientKey);
        } else {
            return undefined;
        }
    }

    readonly sampleGeneticTracks = makeGeneticTracksMobxPromise(this, true);
    readonly patientGeneticTracks = makeGeneticTracksMobxPromise(this, false);
    @computed get geneticTracks() {
        return this.oncoprintAnalysisCaseType ===
            OncoprintAnalysisCaseType.SAMPLE
            ? this.sampleGeneticTracks
            : this.patientGeneticTracks;
    }

    readonly sampleClinicalTracks = makeClinicalTracksMobxPromise(this, true);
    readonly patientClinicalTracks = makeClinicalTracksMobxPromise(this, false);

    @computed get clinicalTracks() {
        return this.oncoprintAnalysisCaseType ===
            OncoprintAnalysisCaseType.SAMPLE
            ? this.sampleClinicalTracks
            : this.patientClinicalTracks;
    }

    readonly sampleHeatmapTracks = makeHeatmapTracksMobxPromise(this, true);
    readonly patientHeatmapTracks = makeHeatmapTracksMobxPromise(this, false);

    private applyOqlFilterToHeatmapTracks(
        tracks: IHeatmapTrackSpec[]
    ): IHeatmapTrackSpec[] {
        if (
            !this.useOqlFilteringForVafHeatmap ||
            !this.props.store.oqlFilteredAlterations.isComplete
        ) {
            return tracks;
        }

        const oqlFilteredAlterations = this.props.store.oqlFilteredAlterations
            .result!;
        const isSampleMode =
            this.oncoprintAnalysisCaseType === OncoprintAnalysisCaseType.SAMPLE;

        const queriedGenes = this.props.store.genes.result || [];
        const queriedGeneSymbols = new Set(
            queriedGenes.map(g => g.hugoGeneSymbol.toUpperCase())
        );

        return tracks.map(track => {
            if (
                track.molecularAlterationType !==
                AlterationTypeConstants.MUTATION_EXTENDED
            ) {
                return track;
            }

            const geneSymbol = track.label.toUpperCase();

            if (!queriedGeneSymbols.has(geneSymbol)) {
                return track;
            }

            const oqlMatchingCaseKeys = new Set<string>();
            oqlFilteredAlterations.forEach((alt: any) => {
                if (
                    alt.hugoGeneSymbol &&
                    alt.hugoGeneSymbol.toUpperCase() === geneSymbol &&
                    alt.molecularProfileAlterationType === 'MUTATION_EXTENDED'
                ) {
                    if (isSampleMode) {
                        oqlMatchingCaseKeys.add(alt.uniqueSampleKey);
                    } else {
                        oqlMatchingCaseKeys.add(alt.uniquePatientKey);
                    }
                }
            });

            const filteredData = track.data.map(datum => {
                const caseKey = datum.uid;
                if (oqlMatchingCaseKeys.has(caseKey)) {
                    return datum;
                } else {
                    return {
                        ...datum,
                        profile_data: null,
                        na: datum.profile_data === null ? datum.na : false,
                    };
                }
            });

            return {
                ...track,
                data: filteredData,
            };
        });
    }

    @computed get heatmapTracks() {
        const basePromise =
            this.oncoprintAnalysisCaseType === OncoprintAnalysisCaseType.SAMPLE
                ? this.sampleHeatmapTracks
                : this.patientHeatmapTracks;

        if (!basePromise.isComplete || !this.useOqlFilteringForVafHeatmap) {
            return basePromise;
        }

        const filteredTracks = this.applyOqlFilterToHeatmapTracks(
            basePromise.result!
        );

        return {
            ...basePromise,
            result: filteredTracks,
        };
    }

    readonly samplegGenericAssayHeatmapTracks = makeGenericAssayProfileHeatmapTracksMobxPromise(
        this,
        true
    );
    readonly patientGenericAssayHeatmapTracks = makeGenericAssayProfileHeatmapTracksMobxPromise(
        this,
        false
    );
    @computed get genericAssayHeatmapTracks() {
        return this.oncoprintAnalysisCaseType ===
            OncoprintAnalysisCaseType.SAMPLE
            ? this.samplegGenericAssayHeatmapTracks
            : this.patientGenericAssayHeatmapTracks;
    }

    readonly sampleGenericAssayCategoricalTracks = makeGenericAssayProfileCategoricalTracksMobxPromise(
        this,
        true
    );
    readonly patientGenericAssayCategoricalTracks = makeGenericAssayProfileCategoricalTracksMobxPromise(
        this,
        false
    );
    @computed get genericAssayCategoricalTracks() {
        return this.oncoprintAnalysisCaseType ===
            OncoprintAnalysisCaseType.SAMPLE
            ? this.sampleGenericAssayCategoricalTracks
            : this.patientGenericAssayCategoricalTracks;
    }

    @computed get genesetHeatmapTrackGroupIndex(): TrackGroupIndex | undefined {
        // check whether oncoprint should show a geneset trackgroup
        if (this.props.store.genesetIds.length > 0) {
            return (
                1 +
                Math.max(
                    GENETIC_TRACK_GROUP_INDEX,
                    // observe the heatmap tracks to render in the very next group
                    ...this.heatmapTracks.result.map(
                        hmTrack => hmTrack.trackGroupIndex
                    ),
                    ...this.genericAssayHeatmapTracks.result.map(
                        hmTrack => hmTrack.trackGroupIndex
                    ),
                    ...this.genericAssayCategoricalTracks.result.map(
                        track => track.trackGroupIndex
                    )
                )
            );
        } else {
            return undefined;
        }
    }

    readonly sampleGenesetHeatmapTracks = makeGenesetHeatmapTracksMobxPromise(
        this,
        true,
        makeGenesetHeatmapExpansionsMobxPromise(this, true)
    );
    readonly patientGenesetHeatmapTracks = makeGenesetHeatmapTracksMobxPromise(
        this,
        false,
        makeGenesetHeatmapExpansionsMobxPromise(this, false)
    );
    @computed get genesetHeatmapTracks() {
        return this.oncoprintAnalysisCaseType ===
            OncoprintAnalysisCaseType.SAMPLE
            ? this.sampleGenesetHeatmapTracks
            : this.patientGenesetHeatmapTracks;
    }

    @computed get clusteredHeatmapTrackGroupIndex() {
        if (this.sortMode.type === 'heatmap') {
            const clusteredHeatmapProfile: string = this.sortMode
                .clusteredHeatmapProfile;

            const genesetHeatmapProfile: string | undefined =
                this.props.store.genesetMolecularProfile.result &&
                this.props.store.genesetMolecularProfile.result.value &&
                this.props.store.genesetMolecularProfile.result.value
                    .molecularProfileId;

            if (clusteredHeatmapProfile === genesetHeatmapProfile) {
                return this.genesetHeatmapTrackGroupIndex;
            } else {
                const heatmapGroup = this.molecularProfileIdToAdditionalTracks[
                    clusteredHeatmapProfile
                ];
                return heatmapGroup && heatmapGroup.trackGroupIndex;
            }
        }
        return undefined;
    }

    @computed get oncoprintLibrarySortConfig() {
        return {
            sortByMutationType: this.sortByMutationType,
            sortByDrivers: this.sortByDrivers,
            order: this.sortOrder,
            clusterHeatmapTrackGroupIndex: this.clusteredHeatmapTrackGroupIndex,
        };
    }

    @action.bound
    private clusterHeatmapByIndex(index: TrackGroupIndex) {
        if (this.oncoprintJs) {
            this.oncoprintJs.resetSortableTracksSortDirection();
        }

        let molecularProfileId: string | undefined;
        if (index === this.genesetHeatmapTrackGroupIndex) {
            molecularProfileId =
                this.props.store.genesetMolecularProfile.result &&
                this.props.store.genesetMolecularProfile.result.value &&
                this.props.store.genesetMolecularProfile.result.value
                    .molecularProfileId;
        } else {
            const heatmapTrackGroup = _.values(
                this.molecularProfileIdToAdditionalTracks
            ).find(trackGroup => trackGroup.trackGroupIndex === index);
            molecularProfileId = heatmapTrackGroup
                ? heatmapTrackGroup.molecularProfileId
                : undefined;
        }

        if (molecularProfileId) {
            this.urlWrapper.updateURL({
                oncoprint_sortby: 'cluster',
                oncoprint_cluster_profile: molecularProfileId,
            });
        }
    }

    @action.bound
    private removeAdditionalTrackSection(index: TrackGroupIndex) {
        const groupEntry = _.values(
            this.molecularProfileIdToAdditionalTracks
        ).find(group => group.trackGroupIndex === index);
        if (groupEntry) {
            if (
                isGenericAssayHeatmapProfile(groupEntry.molecularProfile) ||
                isGenericAssayCategoricalProfile(groupEntry.molecularProfile)
            ) {
                this.removeGenericAssayTracksByMolecularProfileId(
                    groupEntry.molecularProfileId
                );
            } else {
                this.removeHeatmapTracksByMolecularProfileId(
                    groupEntry.molecularProfileId
                );
            }
        }
    }

    @action.bound
    public removeGenericAssayTracksByMolecularProfileId(
        molecularProfileId: string
    ) {
        delete this.molecularProfileIdToTrackGroupIndex[molecularProfileId];
        this.setGenericAssayTracks(molecularProfileId, []);
    }

    @action.bound
    public removeHeatmapTracksByMolecularProfileId(molecularProfileId: string) {
        delete this.molecularProfileIdToTrackGroupIndex[molecularProfileId];
        this.setHeatmapTracks(molecularProfileId, []);
    }

    @action.bound
    public toggleVafHeatmapOqlFiltering() {
        this.useOqlFilteringForVafHeatmap = !this.useOqlFilteringForVafHeatmap;
    }

    readonly additionalTrackGroupHeaders = remoteData({
        await: () => [this.props.store.molecularProfileIdToMolecularProfile],
        invoke: () => {
            return Promise.resolve(
                makeTrackGroupHeaders(
                    this.props.store.molecularProfileIdToMolecularProfile
                        .result!,
                    this.molecularProfileIdToAdditionalTracks,
                    this.genesetHeatmapTrackGroupIndex,
                    () => this.clusteredHeatmapTrackGroupIndex,
                    this.clusterHeatmapByIndex,
                    () => this.sortByData(),
                    this.removeAdditionalTrackSection,
                    this.props.store.queryContainsOql,
                    this.useOqlFilteringForVafHeatmap,
                    this.toggleVafHeatmapOqlFiltering
                )
            );
        },
        default: {},
    });

    /* commenting this out because I predict it could make a comeback
    @computed get headerColumnModeButton() {
        if (!this.props.store.samples.isComplete ||
            !this.props.store.patients.isComplete ||
            (this.props.store.samples.result.length === this.props.store.patients.result.length)) {
            return null;
        }
        let text, tooltip;
        if (this.columnMode === "sample") {
            text = "Show only one column per patient.";
            tooltip = "Each sample for each patient is in a separate column. Click to show only one column per patient";
        } else {
            text = "Show all samples";
            tooltip = "All samples from a patient are merged into one column. Click to split samples into multiple columns.";
        }
        return (
            <DefaultTooltip
                overlay={<div style={{maxWidth:"400px"}}>{tooltip}</div>}
                placement="top"
            >
                <Button
                    bsSize="xs"
                    bsStyle="primary"
                    style={{
                        fontSize:"11px",
                        display:"inline-block",
                        color:"white",
                        marginLeft:"5px"
                    }}
                    onClick={this.toggleColumnMode}
                >{text}
                </Button>
            </DefaultTooltip>
        );
    }*/

    @computed get isLoading() {
        return (
            getRemoteDataGroupStatus(
                this.clinicalTracks,
                this.geneticTracks,
                this.genesetHeatmapTracks,
                this.genericAssayCategoricalTracks,
                this.genericAssayHeatmapTracks,
                this.heatmapTracks,
                this.props.store.molecularProfileIdToMolecularProfile,
                this.alterationTypesInQuery,
                this.alteredKeys,
                this.additionalTrackGroupHeaders
            ) === 'pending'
        );
    }

    @computed get isHidden() {
        return this.isLoading || !this.renderingComplete;
    }

    private get loadingIndicatorHeight() {
        return 300;
    }

    @computed get loadingIndicatorMessage() {
        if (this.isLoading) return 'Downloading Oncoprint data...';
        else if (!this.renderingComplete)
            return 'Data downloaded. Rendering Oncoprint..';
        // Otherwise, isHidden is false, so no message shown at all..
        // Putting this here just for Typescript
        return '';
    }

    readonly alterationTypesInQuery = remoteData({
        await: () => [this.props.store.selectedMolecularProfiles],
        invoke: () =>
            Promise.resolve(
                _.uniq(
                    this.props.store.selectedMolecularProfiles.result!.map(
                        x => x.molecularAlterationType
                    )
                )
            ),
    });

    @autobind
    private getControls() {
        if (
            this.oncoprintJs &&
            !this.oncoprintJs.webgl_unavailable &&
            this.props.store.molecularProfileIdToMolecularProfile.result
        ) {
            return (
                <FadeInteraction showByDefault={true} show={true}>
                    <OncoprintControls
                        handlers={this.controlsHandlers}
                        state={this.controlsState}
                        store={this.props.store}
                        molecularProfileIdToMolecularProfile={
                            this.props.store
                                .molecularProfileIdToMolecularProfile.result
                        }
                        selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl={
                            this
                                .selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl
                        }
                    />
                </FadeInteraction>
            );
        } else {
            return <span />;
        }
    }

    private loadingGeneticDataDuringCurrentLoad = false;
    private loadingClinicalDataDuringCurrentLoad = false;
    @autobind
    private getProgressItems(elapsedSecs: number): IProgressIndicatorItem[] {
        if (elapsedSecs === 0) {
            this.loadingGeneticDataDuringCurrentLoad = false;
            this.loadingClinicalDataDuringCurrentLoad = false;
        }

        const areNonLocalClinicalAttributesSelected = _.some(
            _.values(this.selectedClinicalTrackConfig),
            selected =>
                !clinicalAttributeIsLocallyComputed({
                    clinicalAttributeId: selected.stableId,
                })
        );

        if (this.geneticTracks.isPending) {
            this.loadingGeneticDataDuringCurrentLoad = true;
        }
        if (
            areNonLocalClinicalAttributesSelected &&
            this.clinicalTracks.isPending
        ) {
            this.loadingClinicalDataDuringCurrentLoad = true;
        }

        const ret: IProgressIndicatorItem[] = [];

        let queryingLabel: string;
        if (
            this.props.store.genes.isComplete &&
            this.props.store.filteredSamples.isComplete
        ) {
            const numGenes = this.props.store.genes.result!.length;
            const numSamples = this.props.store.filteredSamples.result!.length;
            queryingLabel = `Querying ${numGenes} genes in ${numSamples} samples`;
        } else {
            queryingLabel = 'Querying ... genes in ... samples';
        }

        let waitingLabel: string = '';
        if (elapsedSecs > 2) {
            waitingLabel = ' - this can take several seconds';
        }

        ret.push({
            label: `${queryingLabel}${waitingLabel}`,
            promises: [], // empty promises means insta-complete
            hideIcon: true, // dont show any icon, this is just a message
            style: { fontWeight: 'bold' },
        });

        const dataLoadingNames = [];
        if (this.loadingGeneticDataDuringCurrentLoad) {
            dataLoadingNames.push('genetic');
        }
        if (this.loadingClinicalDataDuringCurrentLoad) {
            dataLoadingNames.push('clinical');
        }

        ret.push({
            label: `Loading ${dataLoadingNames.join(' and ')} data`,
            promises: [
                this.props.store.molecularData,
                this.props.store.mutations,
                ...(areNonLocalClinicalAttributesSelected
                    ? [this.clinicalTracks]
                    : []),
            ],
        });

        const usingOncokb = this.props.store.driverAnnotationSettings.oncoKb;
        const usingHotspot = this.props.store.driverAnnotationSettings.hotspots;
        ret.push({
            label: getAnnotatingProgressMessage(usingOncokb, usingHotspot),
            promises: [
                this.props.store.filteredAndAnnotatedNonGenomicData,
                this.props.store.filteredAndAnnotatedCnaData,
                this.props.store.filteredAndAnnotatedMutations,
                this.props.store.filteredAndAnnotatedStructuralVariants,
            ],
        });

        ret.push({
            label: 'Rendering',
        });

        return ret as IProgressIndicatorItem[];
    }

    @computed get width() {
        return WindowStore.size.width - 75;
    }

    @action.bound
    public handleSelectedClinicalTrackColorChange(
        value: string,
        color: RGBAColor | undefined
    ) {
        if (this.selectedClinicalTrack) {
            this.props.store.setUserSelectedClinicalTrackColor(
                this.selectedClinicalTrack.label,
                value,
                color
            );
        }
    }

    @observable trackKeySelectedForEdit: string | null = null;

    @action.bound
    setTrackKeySelectedForEdit(key: string | null) {
        this.trackKeySelectedForEdit = key;
    }

    // if trackKeySelectedForEdit is null ('Edit Colors' has not been selected in an individual track menu),
    // selectedClinicalTrack will be undefined
    @computed get selectedClinicalTrack() {
        return _.find(
            this.clinicalTracks.result,
            t => t.key === this.trackKeySelectedForEdit
        );
    }

    @autobind
    private getSelectedClinicalTrackDefaultColorForValue(
        attributeValue: string
    ) {
        if (!this.selectedClinicalTrack) {
            return DEFAULT_UNKNOWN_COLOR;
        }
        if (this.selectedClinicalTrack.datatype === 'counts') {
            return MUTATION_SPECTRUM_FILLS[
                _.indexOf(MUTATION_SPECTRUM_CATEGORIES, attributeValue)
            ];
        } else if (this.selectedClinicalTrack.datatype === 'string') {
            // Mixed refers to when an event has multiple values (i.e. Sample Type for a patient event may have both Primary and Recurrence values)
            if (attributeValue === 'Mixed') {
                return DEFAULT_MIXED_COLOR;
            } else {
                return hexToRGBA(
                    this.props.store.clinicalDataCache.get(
                        this.props.store.clinicalAttributeIdToClinicalAttribute
                            .result![this.selectedClinicalTrack!.attributeId]
                    ).result!.categoryToColor![attributeValue]
                );
            }
        }
        return DEFAULT_UNKNOWN_COLOR;
    }

    public render() {
        getBrowserWindow().donk = this;
        return (
            <div style={{ position: 'relative' }}>
                <LoadingIndicator
                    isLoading={this.isHidden}
                    size={'big'}
                    centerRelativeToContainer={false}
                    center={true}
                    className="oncoprintLoadingIndicator"
                    noFade={true}
                >
                    <div>
                        <ProgressIndicator
                            getItems={this.getProgressItems}
                            show={this.isHidden}
                            sequential={true}
                        />
                    </div>
                </LoadingIndicator>

                <div className={'tabMessageContainer'}>
                    <OqlStatusBanner
                        className="oncoprint-oql-status-banner"
                        queryContainsOql={this.props.store.queryContainsOql}
                        tabReflectsOql={true}
                    />
                    <AlterationFilterWarning
                        driverAnnotationSettings={
                            this.props.store.driverAnnotationSettings
                        }
                        includeGermlineMutations={
                            this.props.store.includeGermlineMutations
                        }
                        mutationsReportByGene={
                            this.props.store.mutationsReportByGene
                        }
                        oqlFilteredMutationsReport={
                            this.props.store.oqlFilteredMutationsReport
                        }
                        oqlFilteredMolecularDataReport={
                            this.props.store.oqlFilteredMolecularDataReport
                        }
                        oqlFilteredStructuralVariantsReport={
                            this.props.store.oqlFilteredStructuralVariantsReport
                        }
                    />
                    <CaseFilterWarning
                        samples={this.props.store.samples}
                        filteredSamples={this.props.store.filteredSamples}
                        patients={this.props.store.patients}
                        filteredPatients={this.props.store.filteredPatients}
                        hideUnprofiledSamples={
                            this.props.store.hideUnprofiledSamples
                        }
                        isPatientMode={
                            this.oncoprintAnalysisCaseType ===
                            OncoprintAnalysisCaseType.PATIENT
                        }
                    />
                </div>

                {this.selectedClinicalTrack && (
                    <OncoprintColorModal
                        setTrackKeySelectedForEdit={
                            this.setTrackKeySelectedForEdit
                        }
                        selectedClinicalTrack={this.selectedClinicalTrack}
                        handleSelectedClinicalTrackColorChange={
                            this.handleSelectedClinicalTrackColorChange
                        }
                        getSelectedClinicalTrackDefaultColorForValue={
                            this.getSelectedClinicalTrackDefaultColorForValue
                        }
                    />
                )}

                <div
                    className={classNames('oncoprintContainer', {
                        fadeIn: !this.isHidden,
                    })}
                    onMouseEnter={this.onMouseEnter}
                    onMouseLeave={this.onMouseLeave}
                >
                    {this.props.store.pageUserSession.hasSavedConfig &&
                        this.props.store.pageUserSession
                            .hasUnsavedChangesFromBeforeLogin && (
                            <RestoreClinicalTracksMenu
                                pageUserSession={
                                    this.props.store.pageUserSession
                                }
                            />
                        )}
                    <Observer>{this.getControls}</Observer>

                    <div style={{ position: 'relative', marginTop: 15 }}>
                        <div>
                            <Oncoprint
                                ref={this.oncoprintRef}
                                broadcastOncoprintJsRef={this.oncoprintJsRef}
                                clinicalTracks={this.clinicalTracks.result}
                                geneticTracks={this.geneticTracks.result}
                                genesetHeatmapTracks={
                                    this.genesetHeatmapTracks.result
                                }
                                heatmapTracks={([] as IHeatmapTrackSpec[])
                                    .concat(
                                        this.genericAssayHeatmapTracks.result
                                    )
                                    .concat(this.heatmapTracks.result)}
                                categoricalTracks={
                                    this.genericAssayCategoricalTracks.result
                                }
                                divId={this.props.divId}
                                width={this.width}
                                caseLinkOutInTooltips={true}
                                suppressRendering={this.isLoading}
                                keepSorted={!this.isLoading}
                                onSuppressRendering={this.onSuppressRendering}
                                onReleaseRendering={this.onReleaseRendering}
                                hiddenIds={
                                    !this.showUnalteredColumns
                                        ? this.unalteredKeys.result
                                        : undefined
                                }
                                molecularProfileIdToMolecularProfile={
                                    this.props.store
                                        .molecularProfileIdToMolecularProfile
                                        .result
                                }
                                alterationTypesInQuery={
                                    this.alterationTypesInQuery.result
                                }
                                showSublabels={this.showOqlInLabels}
                                additionalTrackGroupHeaders={
                                    this.additionalTrackGroupHeaders.result!
                                }
                                horzZoomToFitIds={this.alteredKeys.result}
                                distinguishMutationType={
                                    this.distinguishMutationType
                                }
                                distinguishDrivers={this.distinguishDrivers}
                                distinguishGermlineMutations={
                                    this.distinguishGermlineMutations
                                }
                                sortConfig={this.oncoprintLibrarySortConfig}
                                showClinicalTrackLegends={
                                    this.showClinicalTrackLegends
                                }
                                showWhitespaceBetweenColumns={
                                    this.showWhitespaceBetweenColumns
                                }
                                isWhiteBackgroundForGlyphsEnabled={
                                    this.isWhiteBackgroundForGlyphsEnabled
                                }
                                showMinimap={this.showMinimap}
                                onMinimapClose={this.onMinimapClose}
                                onDeleteClinicalTrack={
                                    this.onDeleteClinicalTrack
                                }
                                onDeleteGeneticTrack={this.onDeleteGeneticTrack}
                                onTrackSortDirectionChange={
                                    this.onTrackSortDirectionChange
                                }
                                onTrackGapChange={this.onTrackGapChange}
                                initParams={{
                                    max_height: Number.POSITIVE_INFINITY,
                                }}
                                trackKeySelectedForEdit={
                                    this.trackKeySelectedForEdit
                                }
                                setTrackKeySelectedForEdit={
                                    this.setTrackKeySelectedForEdit
                                }
                            />
                        </div>
                    </div>
                </div>

                {this.jupyterFileContent && this.jupyterFileName && (
                    <JupyterNoteBookModal
                        show={this.showJupyterNotebookModal}
                        handleClose={this.closeJupyterNotebookModal}
                        fileContent={this.jupyterFileContent}
                        fileName={this.jupyterFileName}
                    />
                )}
            </div>
        );
    }
}
