import * as React from 'react';
import {
    OncoprintJS,
    TrackId,
    CustomTrackOption,
    TrackGroupHeader,
    TrackSortDirection,
    InitParams,
    ColumnLabel,
} from 'oncoprintjs';
import { GenePanelData, MolecularProfile } from 'cbioportal-ts-api-client';
import { observer } from 'mobx-react';
import { computed, makeObservable } from 'mobx';
import { transition } from './DeltaUtils';
import _ from 'lodash';
import './styles.scss';
import { ShapeParams } from 'oncoprintjs/dist/js/oncoprintshape';
import { SpecialAttribute } from 'shared/cache/ClinicalDataCache';
import {
    AnnotatedMutation,
    AnnotatedStructuralVariant,
} from 'shared/model/AnnotatedMutation';
import { CustomDriverNumericGeneMolecularData } from 'shared/model/CustomDriverNumericGeneMolecularData';
import { ExtendedAlteration } from 'shared/model/ExtendedAlteration';
import { GAP_MODE_ENUM } from 'oncoprintjs';

export type CategoricalTrackDatum = {
    entity: string;
    profile_name: string;
    study_id?: string;
    sample?: string;
    patient: string;
    uid: string;
    attr_val_counts: { [val: string]: number };
    attr_val?: string | number | CategoricalTrackDatum['attr_val_counts'];
    na?: boolean;
};

export type ClinicalTrackDatum = {
    attr_id: string;
    study_id?: string;
    sample?: string;
    patient?: string;
    uid: string;
    attr_val_counts: { [val: string]: number };
    attr_val?: string | number | ClinicalTrackDatum['attr_val_counts'];
    na?: boolean;
};

export type ClinicalTrackSpec = {
    key: string; // for efficient diffing, just like in React. must be unique
    attributeId: string;
    label: string;
    description: string;
    data: ClinicalTrackDatum[];
    altered_uids?: string[];
    na_legend_label?: string;
    na_tooltip_value?: string; // If given, then show a tooltip over NA columns that has this value
    custom_options?: CustomTrackOption[];
    sortOrder?: string;
    gapOn?: boolean;
} & (
    | {
          datatype: 'counts';
          countsCategoryLabels: string[];
          countsCategoryFills: [number, number, number, number][];
      }
    | {
          datatype: 'number';
          numberRange: [number, number];
          numberLogScale?: boolean;
      }
    | {
          datatype: 'string';
          category_to_color?: {
              [category: string]: [number, number, number, number];
          };
          universal_rule_categories?: { [category: string]: any };
      }
);

export class ClinicalTrackConfig {
    constructor(stableId: string | SpecialAttribute) {
        this.stableId = stableId;
    }
    public stableId: string | SpecialAttribute;
    public sortOrder: string | null = null;
    public gapOn: boolean | null = null;
}

export type ClinicalTrackConfigChange = {
    stableId?: string;
    sortOrder?: string;
    gapMode?: GAP_MODE_ENUM;
};

export type ClinicalTrackConfigMap = {
    [clinicalAttribute: string]: ClinicalTrackConfig;
};

export interface IBaseHeatmapTrackDatum {
    profile_data: number | null;
    sample?: string;
    patient: string;
    study_id: string;
    uid: string;
    na?: boolean;
    category?: string;
    thresholdType?: '>' | '<';
}
export interface IGeneHeatmapTrackDatum extends IBaseHeatmapTrackDatum {
    hugo_gene_symbol: string;
}
export interface IGenesetHeatmapTrackDatum extends IBaseHeatmapTrackDatum {
    geneset_id: string;
}
export interface IGenericAssayHeatmapTrackDatum extends IBaseHeatmapTrackDatum {
    entityId: string;
}

export type GeneticTrackDatum_Data = Pick<
    ExtendedAlteration &
        AnnotatedMutation &
        AnnotatedStructuralVariant &
        CustomDriverNumericGeneMolecularData,
    | 'hugoGeneSymbol'
    | 'molecularProfileAlterationType'
    | 'proteinChange'
    | 'driverFilter'
    | 'driverFilterAnnotation'
    | 'driverTiersFilter'
    | 'driverTiersFilterAnnotation'
    | 'oncoKbOncogenic'
    | 'alterationSubType'
    | 'alterationType'
    | 'value'
    | 'mutationType'
    | 'isHotspot'
    | 'entrezGeneId'
    | 'putativeDriver'
    | 'mutationStatus'
    | 'eventInfo'
    | 'site1HugoSymbol'
    | 'site2HugoSymbol'
>;

export type GeneticTrackDatum_ProfiledIn = {
    genePanelId?: string;
    molecularProfileId: string;
};

export type GeneticTrackDatum = {
    trackLabel: string;
    sample?: string;
    patient: string;
    study_id: string;
    uid: string;
    data: GeneticTrackDatum_Data[];
    profiled_in?: GeneticTrackDatum_ProfiledIn[];
    not_profiled_in?: GeneticTrackDatum_ProfiledIn[];
    na?: boolean;
    disp_mut?: string;
    disp_cna?: string;
    disp_mrna?: string;
    disp_prot?: string;
    disp_structuralVariant?: string;
    disp_germ?: boolean;
};

export type GeneticTrackSpec = {
    key: string; // for efficient diffing, just like in React. must be unique
    label: string;
    sublabel?: string;
    oql?: string; // OQL corresponding to the track
    info: string;
    infoTooltip?: string;
    data: GeneticTrackDatum[];
    expansionCallback?: () => void;
    removeCallback?: () => void;
    expansionTrackList?: GeneticTrackSpec[];
    labelColor?: string;
    customOptions?: CustomTrackOption[];
};

export class GeneticTrackConfig {
    constructor(stableId: string) {
        this.stableId = stableId;
    }
    public stableId: string;
}

export type GeneticTrackConfigChange = {
    stableId?: string;
};

export type GeneticTrackConfigMap = {
    [geneticAttribute: string]: GeneticTrackConfig;
};

export interface IBaseHeatmapTrackSpec {
    key: string; // for efficient diffing, just like in React. must be unique
    label: string;
    legendLabel?: string;
    tooltipValueLabel?: string;
    molecularProfileId: string; // source
    molecularAlterationType: MolecularProfile['molecularAlterationType'];
    datatype: MolecularProfile['datatype'];
    data: IBaseHeatmapTrackDatum[];
    description?: string;
    trackGroupIndex: number;
    hasColumnSpacing?: boolean;
}
export interface IHeatmapTrackSpec extends IBaseHeatmapTrackSpec {
    data: IBaseHeatmapTrackDatum[]; // can be IGeneHeatmapTrackDatum or IGenericAssayHeatmapTrackDatum
    naLegendLabel?: string;
    info?: string;
    labelColor?: string;
    labelCircleColor?: string;
    labelFontWeight?: string;
    labelLeftPadding?: number;
    tooltip?: (dataUnderMouse: IGeneHeatmapTrackDatum[]) => JQuery;
    initSortDirection?: TrackSortDirection;
    movable?: boolean;
    sortDirectionChangeable?: boolean; // never updated
    trackLinkUrl?: string | undefined;
    onRemove?: () => void;
    onClickRemoveInTrackMenu?: () => void;
    molecularProfileName?: string;
    genericAssayType?: string;
    pivotThreshold?: number;
    sortOrder?: string;
    maxProfileValue?: number;
    minProfileValue?: number;
    customNaShapes?: ShapeParams[];
}
export interface IGenesetHeatmapTrackSpec extends IBaseHeatmapTrackSpec {
    data: IGenesetHeatmapTrackDatum[];
    trackLinkUrl: string | undefined;
    expansionTrackList: IHeatmapTrackSpec[];
    expansionCallback: () => void;
}

export interface ICategoricalTrackSpec {
    key: string;
    label: string;
    molecularProfileId: string;
    molecularProfileName: string;
    molecularAlterationType: MolecularProfile['molecularAlterationType'];
    genericAssayType: string;
    datatype: MolecularProfile['datatype'];
    data: CategoricalTrackDatum[];
    trackGroupIndex: number;
    trackLinkUrl: string | undefined;
    onRemove?: () => void;
    onClickRemoveInTrackMenu?: () => void;
    naLegendLabel?: string;
    description?: string;
    info?: string;
}

export const GENETIC_TRACK_GROUP_INDEX = 1;
export const CLINICAL_TRACK_GROUP_INDEX = 0;

export interface IOncoprintProps {
    broadcastOncoprintJsRef?: (oncoprint: OncoprintJS) => void;

    clinicalTracks: ClinicalTrackSpec[];
    geneticTracks: GeneticTrackSpec[];
    geneticTracksOrder?: string[]; // track keys
    genesetHeatmapTracks: IGenesetHeatmapTrackSpec[];
    heatmapTracks: IHeatmapTrackSpec[];
    heatmapTracksOrder?: { [trackGroupIndex: number]: string[] }; // track keys
    categoricalTracks: ICategoricalTrackSpec[];
    additionalTrackGroupHeaders?: {
        [trackGroupIndex: number]: TrackGroupHeader;
    };
    divId: string;
    width: number;
    initParams?: InitParams;
    caseLinkOutInTooltips: boolean;

    molecularProfileIdToMolecularProfile?: {
        [molecularProfileId: string]: MolecularProfile;
    };

    horzZoomToFitIds?: string[];

    hiddenIds?: string[];
    columnLabels?: { [uid: string]: ColumnLabel };
    highlightedIds?: string[];
    highlightedTracks?: string[]; // track keys

    alterationTypesInQuery?: string[];

    distinguishMutationType?: boolean;
    distinguishDrivers?: boolean;
    distinguishGermlineMutations?: boolean;

    showTrackLabels?: boolean;
    showSublabels?: boolean;

    sortConfig?: {
        order?: string[]; // overrides below options if present

        clusterHeatmapTrackGroupIndex?: number; // overrides below options if present

        sortByMutationType?: boolean;
        sortByDrivers?: boolean;
    };
    showClinicalTrackLegends?: boolean;
    showWhitespaceBetweenColumns?: boolean;
    isWhiteBackgroundForGlyphsEnabled?: boolean;
    showMinimap?: boolean;

    onMinimapClose?: () => void;
    onDeleteClinicalTrack?: (key: string) => void;
    onDeleteGeneticTrack?: (key: string, sublabel: string) => void;
    onTrackSortDirectionChange?: (trackId: TrackId, dir: number) => void;
    onTrackGapChange?: (trackId: TrackId, gap: GAP_MODE_ENUM) => void;

    trackKeySelectedForEdit?: string | null;
    setTrackKeySelectedForEdit?: (key: string | null) => void;

    suppressRendering?: boolean;
    onSuppressRendering?: () => void;
    onReleaseRendering?: () => void;

    keepSorted?: boolean;
}

@observer
export default class Oncoprint extends React.Component<IOncoprintProps, {}> {
    public oncoprint: OncoprintJS | undefined;

    private div: HTMLDivElement;
    public oncoprintJs: OncoprintJS | undefined;
    private trackSpecKeyToTrackId: { [key: string]: TrackId };
    private lastTransitionProps: IOncoprintProps;

    constructor(props: IOncoprintProps) {
        super(props);

        makeObservable(this);

        this.trackSpecKeyToTrackId = {};
        this.divRefHandler = this.divRefHandler.bind(this);
        this.refreshOncoprint = _.debounce(this.refreshOncoprint.bind(this), 0);
    }

    private divRefHandler(div: HTMLDivElement) {
        this.div = div;
    }

    public getTrackSpecKey(targetTrackId: TrackId) {
        let ret: string | null = null;

        _.forEach(
            this.trackSpecKeyToTrackId,
            (trackId: TrackId, key: string) => {
                if (trackId === targetTrackId) {
                    ret = key;
                    return false;
                }
            }
        );

        return ret;
    }

    @computed get sortByMutationType() {
        return (
            this.props.distinguishMutationType &&
            this.props.sortConfig &&
            this.props.sortConfig.sortByMutationType
        );
    }

    @computed get sortByDrivers() {
        return (
            this.props.distinguishDrivers &&
            this.props.sortConfig &&
            this.props.sortConfig.sortByDrivers
        );
    }

    private refreshOncoprint(props: IOncoprintProps) {
        const start = performance.now();
        if (!this.oncoprintJs) {
            // instantiate new one
            this.oncoprintJs = new OncoprintJS(
                `#${props.divId}`,
                props.width,
                props.initParams
            );
            this.oncoprintJs.setTrackGroupLegendOrder([
                GENETIC_TRACK_GROUP_INDEX,
                CLINICAL_TRACK_GROUP_INDEX,
            ]);
            (window as any).frontendOnc = this.oncoprintJs;
            if (props.broadcastOncoprintJsRef) {
                props.broadcastOncoprintJsRef(this.oncoprintJs);
            }
        }
        if (!this.oncoprintJs.webgl_unavailable) {
            transition(
                props,
                this.lastTransitionProps || {},
                this.oncoprintJs,
                () => this.trackSpecKeyToTrackId,
                () => {
                    return this.props.molecularProfileIdToMolecularProfile;
                }
            );
            this.lastTransitionProps = _.clone(props);
        }
        console.log('oncoprint render time: ', performance.now() - start);
    }

    componentWillReceiveProps(nextProps: IOncoprintProps) {
        this.refreshOncoprint(nextProps);
    }

    componentDidMount() {
        this.refreshOncoprint(this.props);
    }

    componentWillUnmount() {
        if (this.oncoprintJs) {
            this.oncoprintJs.destroy();
            this.oncoprintJs = undefined;
        }
    }

    render() {
        return <div id={this.props.divId} ref={this.divRefHandler} />;
    }
}
