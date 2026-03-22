import * as React from 'react';
import { observer } from 'mobx-react';
import { Button, ButtonGroup } from 'react-bootstrap';
import CustomDropdown from './CustomDropdown';
import ConfirmNgchmModal from './ConfirmNgchmModal';
import ReactSelect from 'react-select1';
import { action, computed, observable, reaction, makeObservable } from 'mobx';
import _ from 'lodash';
import { SortMode } from '../ResultsViewOncoprint';
import {
    Gene,
    MolecularProfile,
    GenericAssayMeta,
} from 'cbioportal-ts-api-client';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import {
    DefaultTooltip,
    DownloadControlOption,
    EditableSpan,
    MobxPromise,
} from 'cbioportal-frontend-commons';
import Slider from 'react-rangeslider';
import 'react-rangeslider/lib/index.css';
import './styles.scss';
import classNames from 'classnames';
import { ResultsViewPageStore } from '../../../../pages/resultsView/ResultsViewPageStore';
import {
    OncoprintAnalysisCaseType,
    ExtendedClinicalAttribute,
} from '../../../../pages/resultsView/ResultsViewPageStoreUtils';
import OQLTextArea, { GeneBoxType } from '../../GeneSelectionBox/OQLTextArea';
import autobind from 'autobind-decorator';
import { SingleGeneQuery } from '../../../lib/oql/oql-parser';
import TracksMenu from 'pages/resultsView/oncoprint/TracksMenu';
import { GenericAssayTrackInfo } from 'pages/studyView/addChartButton/genericAssaySelection/GenericAssaySelection';
import {
    IDriverAnnotationControlsHandlers,
    IDriverAnnotationControlsState,
} from 'shared/alterationFiltering/AnnotationFilteringSettings';
import DriverAnnotationControls from 'shared/components/driverAnnotations/DriverAnnotationControls';
import {
    ClinicalTrackConfig,
    ClinicalTrackConfigMap,
} from 'shared/components/oncoprint/Oncoprint';
import { getServerConfig } from 'config/config';
import { AlterationTypeConstants } from 'shared/constants';

export interface IOncoprintControlsHandlers
    extends IDriverAnnotationControlsHandlers {
    onSelectColumnType?: (type: 'sample' | 'patient') => void;
    onSelectShowUnalteredColumns: (unalteredColumnsShown: boolean) => void;
    onSelectShowWhitespaceBetweenColumns: (showWhitespace: boolean) => void;
    onSelectShowClinicalTrackLegends?: (showLegends: boolean) => void;
    onSelectOnlyShowClinicalLegendForAlteredCases?: (
        showLegends: boolean
    ) => void;
    onSelectShowOqlInLabels?: (show: boolean) => void;
    onSelectShowMinimap: (showMinimap: boolean) => void;
    onSelectDistinguishMutationType: (distinguish: boolean) => void;
    onSelectDistinguishGermlineMutations: (distinguish: boolean) => void;
    onSelectIsWhiteBackgroundForGlyphsEnabled?: (use: boolean) => void;

    onSelectHideVUS: (hide: boolean) => void;
    onSelectHideGermlineMutations: (hide: boolean) => void;

    onSelectSortByMutationType: (sort: boolean) => void;
    onSelectSortByDrivers: (sort: boolean) => void;
    onClickSortByData?: () => void;
    onClickSortAlphabetical?: () => void;
    onClickSortCaseListOrder?: () => void;
    onClickDownload?: (
        type:
            | 'pdf'
            | 'png'
            | 'svg'
            | 'order'
            | 'tabular'
            | 'oncoprinter'
            | 'jupyterNoteBook'
    ) => void;
    onChangeSelectedClinicalTracks?: (
        trackConfigs: ClinicalTrackConfig[]
    ) => void;
    onChangeClinicalTracksPendingSubmission?: (
        trackConfigs: ClinicalTrackConfig[]
    ) => void;
    onClickAddGenesToHeatmap?: () => void;
    onSelectGenericAssayProfile?: (molecularProfileId: string) => void;
    onClickAddGenericAssays?: (info: GenericAssayTrackInfo[]) => void;
    onSelectHeatmapProfile?: (molecularProfileId: string) => void;
    onChangeHeatmapGeneInputValue?: (value: string) => void;
    onClickNGCHM?: () => void;
    onSetHorzZoom: (z: number) => void;
    onClickZoomIn: () => void;
    onClickZoomOut: () => void;
}
export interface IOncoprintControlsState
    extends IDriverAnnotationControlsState {
    showUnalteredColumns: boolean;
    showWhitespaceBetweenColumns: boolean;
    showClinicalTrackLegends?: boolean;
    onlyShowClinicalLegendForAlteredCases?: boolean;
    showOqlInLabels?: boolean;
    isWhiteBackgroundForGlyphsEnabled?: boolean;
    showMinimap: boolean;
    isClinicalTrackConfigDirty: boolean;
    isLoggedIn: boolean;
    isSessionServiceEnabled: boolean;
    distinguishMutationType: boolean;
    distinguishGermlineMutations: boolean;
    sortByMutationType: boolean;
    sortByDrivers: boolean;
    sortByCaseListDisabled: boolean;
    hidePutativePassengers: boolean;
    hideGermlineMutations: boolean;

    sortMode?: SortMode;
    clinicalAttributesPromise?: MobxPromise<ExtendedClinicalAttribute[]>;
    clinicalAttributeSampleCountPromise?: MobxPromise<{
        [clinicalAttributeId: string]: number;
    }>;
    selectedClinicalAttributeSpecInits?: ClinicalTrackConfigMap;
    clinicalTracksPendingSubmission?: ClinicalTrackConfig[];
    heatmapProfilesPromise?: MobxPromise<MolecularProfile[]>;
    genericAssayEntitiesGroupedByGenericAssayTypePromise?: MobxPromise<{
        [genericAssayType: string]: GenericAssayMeta[];
    }>;
    selectedHeatmapProfileId?: string;
    selectedGenericAssayProfile?: MolecularProfile;
    selectedGenericAssayEntityIds?: string[];
    heatmapIsDynamicallyQueried?: boolean;
    heatmapGeneInputValue?: string;
    hideHeatmapMenu?: boolean;
    ngchmButtonActive?: boolean;

    columnMode?: OncoprintAnalysisCaseType;

    horzZoom: number;
}

export interface IOncoprintControlsProps {
    store?: ResultsViewPageStore;
    handlers: IOncoprintControlsHandlers;
    state: IOncoprintControlsState;
    oncoprinterMode?: boolean;
    jupyterNotebookMode?: boolean;
    molecularProfileIdToMolecularProfile?: {
        [molecularProfileId: string]: MolecularProfile;
    };
    selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl?: {
        [genericAssayType: string]: string[];
    };
}

export interface ISelectOption {
    value: string;
    label: string;
}

const EVENT_KEY = {
    columnTypeSample: '0',
    columnTypePatient: '1',
    showUnalteredColumns: '2',
    showWhitespaceBetweenColumns: '3',
    showClinicalTrackLegends: '4',
    onlyShowClinicalLegendForAlteredCases: '4.1',
    showOqlInLabels: '4.2',
    isWhiteBackgroundForGlyphsEnabled: '4.3',
    distinguishMutationType: '5',
    distinguishGermlineMutations: '5.1',
    sortByMutationType: '6',
    sortAlphabetical: '7',
    sortCaseListOrder: '8',
    sortByData: '9',
    sortByDrivers: '10',
    addGenesToHeatmap: '13',
    distinguishDrivers: '15',
    annotateOncoKb: '16',
    annotateHotspots: '17',
    annotateCBioPortal: '18',
    annotateCOSMIC: '19',
    annotateCBioPortalInput: '20',
    annotateCOSMICInput: '21',
    hidePutativePassengers: '22',
    hideGermlineMutations: '22.1',
    customDriverBinaryAnnotation: '23',
    customDriverTierAnnotation: '24',
    downloadPDF: '25',
    downloadPNG: '26',
    downloadSVG: '27',
    downloadOrder: '28',
    downloadTabular: '29',
    downloadOncoprinter: '29.1',
    openJupyterNotebook: '32',
    horzZoomSlider: '30',
    viewNGCHM: '31',
};

@observer
export default class OncoprintControls extends React.Component<
    IOncoprintControlsProps,
    {}
> {
    @observable horzZoomSliderState: number;
    @observable heatmapGenesReady = false;
    @observable showConfirmNgchmModal: boolean = false;

    constructor(props: IOncoprintControlsProps) {
        super(props);

        makeObservable(this);

        this.horzZoomSliderState = props.state.horzZoom;

        reaction(
            () => this.props.state.horzZoom,
            z => (this.horzZoomSliderState = z)
        ); // when horz zoom changes, set slider state
    }

    @autobind
    private onZoomInClick() {
        this.props.handlers.onClickZoomIn();
    }

    @autobind
    private onZoomOutClick() {
        this.props.handlers.onClickZoomOut();
    }

    @autobind
    private onSetHorzZoomTextInput(val: string) {
        const percentage = parseFloat(val);
        const zoom = percentage / 100;
        this.props.handlers.onSetHorzZoom(zoom);
    }

    @autobind
    private onSelect(eventKey: any) {
        if (eventKey === EVENT_KEY.distinguishMutationType) {
            this.props.handlers.onSelectDistinguishMutationType &&
                this.props.handlers.onSelectDistinguishMutationType(
                    !this.props.state.distinguishMutationType
                );
        }
    }
    @autobind
    private onHeatmapProfileSelect(option: { label: string; value: string }) {
        this.props.handlers.onSelectHeatmapProfile &&
            this.props.handlers.onSelectHeatmapProfile(option.value);
    }

    @autobind
    private toggleShowMinimap() {
        this.props.handlers.onSelectShowMinimap &&
            this.props.handlers.onSelectShowMinimap(
                !this.props.state.showMinimap
            );
    }

    @autobind
    private onInputClick(event: React.MouseEvent<HTMLInputElement>) {
        switch ((event.target as HTMLInputElement).value) {
            case EVENT_KEY.showUnalteredColumns:
                this.props.handlers.onSelectShowUnalteredColumns &&
                    this.props.handlers.onSelectShowUnalteredColumns(
                        !this.props.state.showUnalteredColumns
                    );
                break;
            case EVENT_KEY.showWhitespaceBetweenColumns:
                this.props.handlers.onSelectShowWhitespaceBetweenColumns &&
                    this.props.handlers.onSelectShowWhitespaceBetweenColumns(
                        !this.props.state.showWhitespaceBetweenColumns
                    );
                break;
            case EVENT_KEY.showClinicalTrackLegends:
                this.props.handlers.onSelectShowClinicalTrackLegends &&
                    this.props.handlers.onSelectShowClinicalTrackLegends(
                        !this.props.state.showClinicalTrackLegends
                    );
                break;
            case EVENT_KEY.onlyShowClinicalLegendForAlteredCases:
                this.props.handlers
                    .onSelectOnlyShowClinicalLegendForAlteredCases &&
                    this.props.handlers.onSelectOnlyShowClinicalLegendForAlteredCases(
                        !this.props.state.onlyShowClinicalLegendForAlteredCases
                    );
                break;
            case EVENT_KEY.showOqlInLabels:
                this.props.handlers.onSelectShowOqlInLabels &&
                    this.props.handlers.onSelectShowOqlInLabels(
                        !this.props.state.showOqlInLabels
                    );
                break;
            case EVENT_KEY.isWhiteBackgroundForGlyphsEnabled:
                this.props.handlers.onSelectIsWhiteBackgroundForGlyphsEnabled &&
                    this.props.handlers.onSelectIsWhiteBackgroundForGlyphsEnabled(
                        !this.props.state.isWhiteBackgroundForGlyphsEnabled
                    );
                break;
            case EVENT_KEY.columnTypeSample:
                this.props.handlers.onSelectColumnType &&
                    this.props.handlers.onSelectColumnType('sample');
                break;
            case EVENT_KEY.columnTypePatient:
                this.props.handlers.onSelectColumnType &&
                    this.props.handlers.onSelectColumnType('patient');
                break;
            case EVENT_KEY.sortByData:
                this.props.handlers.onClickSortByData &&
                    this.props.handlers.onClickSortByData();
                break;
            case EVENT_KEY.sortAlphabetical:
                this.props.handlers.onClickSortAlphabetical &&
                    this.props.handlers.onClickSortAlphabetical();
                break;
            case EVENT_KEY.sortCaseListOrder:
                this.props.handlers.onClickSortCaseListOrder &&
                    this.props.handlers.onClickSortCaseListOrder();
                break;
            case EVENT_KEY.sortByMutationType:
                this.props.handlers.onSelectSortByMutationType &&
                    this.props.handlers.onSelectSortByMutationType(
                        !this.props.state.sortByMutationType
                    );
                break;
            case EVENT_KEY.sortByDrivers:
                this.props.handlers.onSelectSortByDrivers &&
                    this.props.handlers.onSelectSortByDrivers(
                        !this.props.state.sortByDrivers
                    );
                break;
            case EVENT_KEY.distinguishDrivers:
                this.props.handlers.onSelectDistinguishDrivers &&
                    this.props.handlers.onSelectDistinguishDrivers(
                        !this.props.state.distinguishDrivers
                    );
                break;
            case EVENT_KEY.distinguishMutationType:
                this.props.handlers.onSelectDistinguishMutationType &&
                    this.props.handlers.onSelectDistinguishMutationType(
                        !this.props.state.distinguishMutationType
                    );
                break;
            case EVENT_KEY.distinguishGermlineMutations:
                this.props.handlers.onSelectDistinguishGermlineMutations(
                    !this.props.state.distinguishGermlineMutations
                );
                break;
            case EVENT_KEY.annotateOncoKb:
                this.props.handlers.onSelectAnnotateOncoKb &&
                    this.props.handlers.onSelectAnnotateOncoKb(
                        !this.props.state.annotateDriversOncoKb
                    );
                break;
            case EVENT_KEY.annotateHotspots:
                this.props.handlers.onSelectAnnotateHotspots &&
                    this.props.handlers.onSelectAnnotateHotspots(
                        !this.props.state.annotateDriversHotspots
                    );
                break;
            case EVENT_KEY.hidePutativePassengers:
                this.props.handlers.onSelectHideVUS &&
                    this.props.handlers.onSelectHideVUS(
                        !this.props.state.hidePutativePassengers
                    );
                break;
            case EVENT_KEY.hideGermlineMutations:
                this.props.handlers.onSelectHideGermlineMutations(
                    !this.props.state.hideGermlineMutations
                );
                break;
            case EVENT_KEY.customDriverBinaryAnnotation:
                this.props.handlers.onSelectCustomDriverAnnotationBinary &&
                    this.props.handlers.onSelectCustomDriverAnnotationBinary(
                        !this.props.state.annotateCustomDriverBinary
                    );
                break;
        }
    }

    @autobind
    private onHorzZoomSliderChange(z: number) {
        this.horzZoomSliderState = z;
    }

    @autobind
    private onHorzZoomSliderSet() {
        this.props.handlers.onSetHorzZoom(this.horzZoomSliderState);
        this.horzZoomSliderState = this.props.state.horzZoom; // set it back in case it doesnt change
    }

    @autobind
    private onCustomDriverTierCheckboxClick(
        event: React.MouseEvent<HTMLInputElement>
    ) {
        const tier = (event.target as HTMLInputElement).value;
        this.props.handlers.onSelectCustomDriverAnnotationTier &&
            this.props.handlers.onSelectCustomDriverAnnotationTier(
                tier,
                !(
                    this.props.state.selectedCustomDriverAnnotationTiers &&
                    this.props.state.selectedCustomDriverAnnotationTiers.get(
                        tier
                    )
                )
            );
    }

    @autobind
    private onButtonClick(event: React.MouseEvent<HTMLButtonElement>) {
        switch ((event.target as HTMLButtonElement).name) {
            case EVENT_KEY.addGenesToHeatmap:
                this.props.handlers.onClickAddGenesToHeatmap &&
                    this.props.handlers.onClickAddGenesToHeatmap();
                break;
            case EVENT_KEY.downloadSVG:
                this.props.handlers.onClickDownload &&
                    this.props.handlers.onClickDownload('svg');
                break;
            case EVENT_KEY.downloadPNG:
                this.props.handlers.onClickDownload &&
                    this.props.handlers.onClickDownload('png');
                break;
            case EVENT_KEY.downloadPDF:
                this.props.handlers.onClickDownload &&
                    this.props.handlers.onClickDownload('pdf');
                break;
            case EVENT_KEY.downloadOrder:
                this.props.handlers.onClickDownload &&
                    this.props.handlers.onClickDownload('order');
                break;
            case EVENT_KEY.downloadTabular:
                this.props.handlers.onClickDownload &&
                    this.props.handlers.onClickDownload('tabular');
                break;
            case EVENT_KEY.downloadOncoprinter:
                this.props.handlers.onClickDownload &&
                    this.props.handlers.onClickDownload('oncoprinter');
                break;
            case EVENT_KEY.openJupyterNotebook:
                this.props.handlers.onClickDownload &&
                    this.props.handlers.onClickDownload('jupyterNoteBook');
                break;
            case EVENT_KEY.viewNGCHM:
                if (
                    this.props.state.ngchmButtonActive &&
                    this.props.handlers.onClickNGCHM
                ) {
                    this.showConfirmNgchmModal = true;
                }
                break;
        }
    }

    @action.bound
    private onChangeHeatmapGeneInput(oql: any, genes: any, queryStr: string) {
        this.props.handlers.onChangeHeatmapGeneInputValue &&
            this.props.handlers.onChangeHeatmapGeneInputValue(queryStr);

        const foundGenes = _.keyBy(genes.found as Gene[], gene =>
            gene.hugoGeneSymbol.toUpperCase()
        );

        this.heatmapGenesReady = _.every(
            oql.query as SingleGeneQuery[],
            query => query.gene.toUpperCase() in foundGenes
        ); // all genes valid
    }

    @computed get heatmapProfileOptions() {
        if (
            this.props.state.heatmapProfilesPromise &&
            this.props.state.heatmapProfilesPromise.result
        ) {
            return _.map(
                this.props.state.heatmapProfilesPromise.result,
                profile => {
                    let label = profile.name;
                    if (
                        profile.molecularAlterationType ===
                        AlterationTypeConstants.MUTATION_EXTENDED
                    ) {
                        label = `Variant Allele Frequency in Selected Mutations Profile`;
                    }

                    return {
                        label,
                        value: profile.molecularProfileId,
                        type: profile.molecularAlterationType,
                    };
                }
            );
        } else {
            return [];
        }
    }

    @observable tabId = 'CLINICAL';

    @action.bound
    private updateTabId(newId: string) {
        this.tabId = newId;
    }

    private tracksMenu = observer(() => {
        if (this.props.store) {
            return (
                <TracksMenu
                    store={this.props.store}
                    heatmapMenu={this.heatmapMenu}
                    handlers={this.props.handlers}
                    state={this.props.state}
                    selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl={
                        this.props
                            .selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl
                    }
                />
            );
        } else {
            return null;
        }
    });

    @computed get heatmapMenu() {
        const showGenesTextArea = this.props.state.heatmapIsDynamicallyQueried;
        if (
            this.props.oncoprinterMode ||
            this.props.state.hideHeatmapMenu ||
            !this.props.state.heatmapProfilesPromise
        ) {
            return null;
        }
        let menu = <LoadingIndicator isLoading={true} />;
        if (this.props.state.heatmapProfilesPromise.isComplete) {
            if (!this.props.state.heatmapProfilesPromise.result!.length) {
                return null;
            } else {
                menu = (
                    <div className="oncoprint__controls__heatmap_menu">
                        <ReactSelect
                            clearable={false}
                            searchable={false}
                            isLoading={
                                this.props.state.heatmapProfilesPromise
                                    .isPending
                            }
                            onChange={this.onHeatmapProfileSelect}
                            value={this.props.state.selectedHeatmapProfileId}
                            options={this.heatmapProfileOptions}
                        />
                        {showGenesTextArea && [
                            <OQLTextArea
                                inputGeneQuery={
                                    this.props.state.heatmapGeneInputValue || ''
                                }
                                callback={this.onChangeHeatmapGeneInput}
                                location={GeneBoxType.ONCOPRINT_HEATMAP}
                            />,
                            <button
                                key="addGenesToHeatmapButton"
                                className="btn btn-sm btn-default"
                                name={EVENT_KEY.addGenesToHeatmap}
                                onClick={this.onButtonClick}
                                disabled={
                                    (
                                        this.props.state
                                            .heatmapGeneInputValue || ''
                                    ).trim().length > 0 &&
                                    !this.heatmapGenesReady
                                }
                            >
                                Add Genes to Heatmap
                            </button>,
                        ]}
                        {this.props.state.ngchmButtonActive && [
                            <hr />,
                            <DefaultTooltip
                                overlay={
                                    <span>
                                        Open a new tab to visualize this study
                                        as Next Generation Clustered Heatmaps
                                        from MD Anderson Cancer Center.
                                    </span>
                                }
                            >
                                <button
                                    className={classNames(
                                        'btn',
                                        'btn-sm',
                                        'btn-default'
                                    )}
                                    name={EVENT_KEY.viewNGCHM}
                                    onClick={this.onButtonClick}
                                >
                                    Whole Study Heatmap (NG-CHM){' '}
                                    <i
                                        className="fa fa-external-link"
                                        aria-hidden="true"
                                    ></i>
                                </button>
                            </DefaultTooltip>,
                        ]}
                    </div>
                );
            }
        } else if (this.props.state.heatmapProfilesPromise.isError) {
            menu = <span>Error loading heatmap profiles.</span>;
        }

        return menu;
    }

    private SortMenuOncoprinter = observer(() => {
        return (
            <CustomDropdown bsStyle="default" title="Sort" id="sortDropdown">
                <div
                    className="oncoprint__controls__sort_menu"
                    data-test="oncoprintSortDropdownMenu"
                >
                    <div className="checkbox">
                        <label>
                            <input
                                type="checkbox"
                                value={EVENT_KEY.sortByMutationType}
                                checked={this.props.state.sortByMutationType}
                                onClick={this.onInputClick}
                                disabled={
                                    !this.props.state.distinguishMutationType
                                }
                            />{' '}
                            Mutation Type
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input
                                type="checkbox"
                                value={EVENT_KEY.sortByDrivers}
                                checked={this.props.state.sortByDrivers}
                                onClick={this.onInputClick}
                                disabled={!this.props.state.distinguishDrivers}
                            />{' '}
                            Driver/Passenger
                        </label>
                    </div>
                </div>
            </CustomDropdown>
        );
    });

    private SortMenuOncoprint = observer(() => {
        return (
            <CustomDropdown bsStyle="default" title="Sort" id="sortDropdown">
                <div
                    className="oncoprint__controls__sort_menu"
                    data-test="oncoprintSortDropdownMenu"
                >
                    <div className="radio">
                        <label>
                            <input
                                data-test="sortByData"
                                type="radio"
                                name="sortBy"
                                value={EVENT_KEY.sortByData}
                                checked={
                                    this.props.state.sortMode!.type === 'data'
                                }
                                onClick={this.onInputClick}
                            />{' '}
                            Sort by data
                        </label>
                    </div>
                    <div style={{ marginLeft: '10px' }}>
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    value={EVENT_KEY.sortByMutationType}
                                    checked={
                                        this.props.state.sortByMutationType
                                    }
                                    onClick={this.onInputClick}
                                    disabled={
                                        this.props.state.sortMode!.type !==
                                            'data' ||
                                        !this.props.state
                                            .distinguishMutationType
                                    }
                                />{' '}
                                Mutation Type
                            </label>
                        </div>
                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    value={EVENT_KEY.sortByDrivers}
                                    checked={this.props.state.sortByDrivers}
                                    onClick={this.onInputClick}
                                    disabled={
                                        this.props.state.sortMode!.type !==
                                            'data' ||
                                        !this.props.state.distinguishDrivers
                                    }
                                />{' '}
                                Driver/Passenger
                            </label>
                        </div>
                    </div>
                    <div className="radio">
                        <label>
                            <input
                                type="radio"
                                name="sortBy"
                                value={EVENT_KEY.sortAlphabetical}
                                checked={
                                    this.props.state.sortMode!.type ===
                                    'alphabetical'
                                }
                                onClick={this.onInputClick}
                            />{' '}
                            Sort by case id (alphabetical)
                        </label>
                    </div>
                    <div className="radio">
                        <label>
                            <input
                                type="radio"
                                name="sortBy"
                                value={EVENT_KEY.sortCaseListOrder}
                                checked={
                                    this.props.state.sortMode!.type ===
                                    'caseList'
                                }
                                onClick={this.onInputClick}
                                data-test="caseList"
                                disabled={
                                    !!this.props.state.sortByCaseListDisabled
                                }
                            />{' '}
                            Sort by case list order
                        </label>
                    </div>
                    {this.props.state.heatmapProfilesPromise &&
                        !(
                            this.props.state.heatmapProfilesPromise
                                .isComplete &&
                            !this.props.state.heatmapProfilesPromise.result!
                                .length
                        ) && (
                            <div className="radio">
                                <label>
                                    <input
                                        data-test="sortByHeatmapClustering"
                                        type="radio"
                                        name="sortBy"
                                        checked={
                                            this.props.state.sortMode!.type ===
                                            'heatmap'
                                        }
                                        disabled
                                    />{' '}
                                    Sorted by heatmap clustering order
                                </label>
                            </div>
                        )}
                </div>
            </CustomDropdown>
        );
    });

    @computed get driverAnnotationSection() {
        if (this.props.oncoprinterMode || !this.props.store) {
            return (
                <>
                    <h5>Annotate</h5>
                    <div style={{ marginLeft: 10 }}>
                        <DriverAnnotationControls
                            state={this.props.state}
                            handlers={Object.assign(
                                {
                                    onCustomDriverTierCheckboxClick: this
                                        .onCustomDriverTierCheckboxClick,
                                } as Partial<IDriverAnnotationControlsHandlers>,
                                this.props.handlers
                            )}
                            showOnckbAnnotationControls={true}
                        />
                    </div>

                    <h5>Filter</h5>
                    <div style={{ marginLeft: 10 }}>
                        <div className="checkbox">
                            <label>
                                <input
                                    data-test="HideVUS"
                                    type="checkbox"
                                    value={EVENT_KEY.hidePutativePassengers}
                                    checked={
                                        this.props.state.hidePutativePassengers
                                    }
                                    onClick={this.onInputClick}
                                    disabled={
                                        !this.props.state.distinguishDrivers
                                    }
                                />{' '}
                                Hide mutations and copy number alterations of
                                unknown significance
                            </label>
                        </div>
                        <div className="checkbox">
                            <label>
                                <input
                                    data-test="HideGermline"
                                    type="checkbox"
                                    value={EVENT_KEY.hideGermlineMutations}
                                    checked={
                                        this.props.state.hideGermlineMutations
                                    }
                                    onClick={this.onInputClick}
                                    disabled={
                                        !this.props.state
                                            .distinguishGermlineMutations
                                    }
                                />{' '}
                                Hide germline mutations
                            </label>
                        </div>
                    </div>
                </>
            );
        } else {
            const store = this.props.store;
            return (
                <>
                    <h5>Annotate and Filter</h5>
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginLeft: 10,
                        }}
                    >
                        Please see the
                        <button
                            style={{
                                marginLeft: 5,
                                marginRight: 5,
                                marginBottom: 0,
                                width: 'auto',
                                padding: '1px 5px 1px 5px',
                            }}
                            className="btn btn-primary"
                            onClick={() => {
                                store.isSettingsMenuVisible = !store.isSettingsMenuVisible;
                            }}
                        >
                            <i className="fa fa-sliders" />
                        </button>
                        menu.
                    </div>
                </>
            );
        }
    }

    private MutationColorMenu = observer(() => {
        return (
            <CustomDropdown
                bsStyle="default"
                title="Mutations"
                id="mutationColorDropdown"
            >
                <div className="oncoprint__controls__mutation_color_menu">
                    <h5>Color by</h5>
                    <div style={{ marginLeft: '10px' }}>
                        <div className="checkbox">
                            <label>
                                <input
                                    data-test="ColorByType"
                                    type="checkbox"
                                    value={EVENT_KEY.distinguishMutationType}
                                    checked={
                                        this.props.state.distinguishMutationType
                                    }
                                    onClick={this.onInputClick}
                                />{' '}
                                Type
                            </label>
                        </div>
                        <div className="checkbox">
                            <label>
                                <input
                                    data-test="ColorByGermline"
                                    type="checkbox"
                                    value={
                                        EVENT_KEY.distinguishGermlineMutations
                                    }
                                    checked={
                                        this.props.state
                                            .distinguishGermlineMutations
                                    }
                                    onClick={this.onInputClick}
                                />{' '}
                                Somatic vs Germline
                            </label>
                        </div>
                    </div>
                    {this.driverAnnotationSection}
                </div>
            </CustomDropdown>
        );
    });

    private ViewMenu = observer(() => {
        if (this.props.oncoprinterMode) {
            return <this.ViewMenuOncoprinter />;
        } else {
            return <this.ViewMenuOncoprint />;
        }
    });

    private ViewMenuOncoprinter = observer(() => {
        return (
            <CustomDropdown
                bsStyle="default"
                title="View"
                id="viewDropdownButton"
            >
                <div className="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            value={EVENT_KEY.showUnalteredColumns}
                            checked={this.props.state.showUnalteredColumns}
                            onClick={this.onInputClick}
                        />{' '}
                        Show unaltered columns
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            value={EVENT_KEY.showWhitespaceBetweenColumns}
                            checked={
                                this.props.state.showWhitespaceBetweenColumns
                            }
                            onClick={this.onInputClick}
                        />{' '}
                        Show whitespace between columns
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            value={EVENT_KEY.showClinicalTrackLegends}
                            checked={this.props.state.showClinicalTrackLegends}
                            onClick={this.onInputClick}
                        />{' '}
                        Show legends for clinical tracks
                    </label>
                </div>
            </CustomDropdown>
        );
    });

    private ViewMenuOncoprint = observer(() => {
        return (
            <CustomDropdown
                bsStyle="default"
                title="View"
                id="viewDropdownButton"
            >
                <strong>Data type:</strong>
                <div className="radio">
                    <label>
                        <input
                            type="radio"
                            name="columnType"
                            value={EVENT_KEY.columnTypeSample}
                            checked={
                                this.props.state.columnMode ===
                                OncoprintAnalysisCaseType.SAMPLE
                            }
                            onClick={this.onInputClick}
                        />{' '}
                        Events per sample
                    </label>
                </div>
                <div className="radio">
                    <label>
                        <input
                            type="radio"
                            name="columnType"
                            value={EVENT_KEY.columnTypePatient}
                            checked={
                                this.props.state.columnMode ===
                                OncoprintAnalysisCaseType.PATIENT
                            }
                            onClick={this.onInputClick}
                        />{' '}
                        Events per patient
                    </label>
                </div>

                <hr />
                <div className="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            value={EVENT_KEY.showUnalteredColumns}
                            checked={this.props.state.showUnalteredColumns}
                            onClick={this.onInputClick}
                        />{' '}
                        Show unaltered columns
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            value={EVENT_KEY.showWhitespaceBetweenColumns}
                            checked={
                                this.props.state.showWhitespaceBetweenColumns
                            }
                            onClick={this.onInputClick}
                        />{' '}
                        Show whitespace between columns
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            value={EVENT_KEY.showClinicalTrackLegends}
                            checked={this.props.state.showClinicalTrackLegends}
                            onClick={this.onInputClick}
                        />{' '}
                        Show legends for clinical tracks
                    </label>
                </div>
                <div
                    className="checkbox"
                    style={{ marginLeft: 20, maxWidth: 220 }}
                >
                    <label>
                        <input
                            data-test="onlyShowClinicalLegendsForAltered"
                            type="checkbox"
                            value={
                                EVENT_KEY.onlyShowClinicalLegendForAlteredCases
                            }
                            checked={
                                this.props.state
                                    .onlyShowClinicalLegendForAlteredCases
                            }
                            onClick={this.onInputClick}
                            disabled={
                                !this.props.state.showClinicalTrackLegends
                            }
                        />{' '}
                        Only show clinical track legends for altered{' '}
                        {this.props.state.columnMode ===
                        OncoprintAnalysisCaseType.PATIENT
                            ? 'patients'
                            : 'samples'}
                        .
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            value={EVENT_KEY.showOqlInLabels}
                            checked={this.props.state.showOqlInLabels}
                            onClick={this.onInputClick}
                        />{' '}
                        Show OQL filters
                    </label>
                </div>
                <div className="checkbox">
                    <label>
                        <input
                            type="checkbox"
                            data-test="toggleWhiteBackgroundForGlyphs"
                            value={EVENT_KEY.isWhiteBackgroundForGlyphsEnabled}
                            checked={
                                this.props.state
                                    .isWhiteBackgroundForGlyphsEnabled
                            }
                            onClick={this.onInputClick}
                        />{' '}
                        Use white background (Caution: profiled and unprofiled
                        samples look identical and germline mutations might be
                        hidden)
                    </label>
                </div>
            </CustomDropdown>
        );
    });

    private DownloadMenu = observer(() => {
        return getServerConfig().skin_hide_download_controls !==
            DownloadControlOption.HIDE_ALL ? (
            <CustomDropdown
                bsStyle="default"
                title="Download"
                id="downloadDropdownButton"
            >
                <button
                    className="btn btn-sm btn-default"
                    name={EVENT_KEY.downloadPDF}
                    onClick={this.onButtonClick}
                >
                    PDF
                </button>
                <button
                    className="btn btn-sm btn-default"
                    name={EVENT_KEY.downloadPNG}
                    onClick={this.onButtonClick}
                >
                    PNG
                </button>
                <button
                    className="btn btn-sm btn-default"
                    name={EVENT_KEY.downloadSVG}
                    onClick={this.onButtonClick}
                >
                    SVG
                </button>
                <button
                    className="btn btn-sm btn-default"
                    name={EVENT_KEY.downloadOrder}
                    onClick={this.onButtonClick}
                >
                    {(this.props.state.columnMode &&
                        this.props.state.columnMode[0].toUpperCase() +
                            this.props.state.columnMode.slice(1)) ||
                        'Sample'}{' '}
                    order
                </button>
                {!this.props.oncoprinterMode &&
                    getServerConfig().skin_hide_download_controls ===
                        DownloadControlOption.SHOW_ALL && (
                        <button
                            className="btn btn-sm btn-default"
                            name={EVENT_KEY.downloadTabular}
                            onClick={this.onButtonClick}
                        >
                            Tabular
                        </button>
                    )}
                {!this.props.oncoprinterMode &&
                    getServerConfig().skin_hide_download_controls ===
                        DownloadControlOption.SHOW_ALL && (
                        <button
                            className="btn btn-sm btn-default"
                            name={EVENT_KEY.downloadOncoprinter}
                            onClick={this.onButtonClick}
                        >
                            Open in Oncoprinter
                        </button>
                    )}

                {!this.props.jupyterNotebookMode &&
                    getServerConfig().skin_hide_download_controls ===
                        DownloadControlOption.SHOW_ALL && (
                        <button
                            className="btn btn-sm btn-default"
                            name={EVENT_KEY.openJupyterNotebook}
                            onClick={this.onButtonClick}
                        >
                            Open in JupyterNoteBook{' '}
                            <strong className={'beta-text'}>Beta!</strong>
                        </button>
                    )}
            </CustomDropdown>
        ) : null;
    });

    private HorzZoomControls = observer(() => {
        return (
            <div className="btn btn-default oncoprint__zoom-controls">
                <DefaultTooltip
                    overlay={<span>Zoom out of oncoprint.</span>}
                    placement="top"
                >
                    <div onClick={this.onZoomOutClick}>
                        <i className="fa fa-search-minus"></i>
                    </div>
                </DefaultTooltip>
                <DefaultTooltip
                    overlay={<span>Zoom in/out of oncoprint.</span>}
                    placement="top"
                >
                    <div style={{ width: '90px' }}>
                        <Slider
                            value={this.horzZoomSliderState}
                            onChange={this.onHorzZoomSliderChange}
                            onChangeComplete={this.onHorzZoomSliderSet}
                            step={0.01}
                            max={1}
                            min={0}
                            tooltip={false}
                        />
                    </div>
                </DefaultTooltip>

                <EditableSpan
                    value={(100 * this.horzZoomSliderState).toFixed()}
                    setValue={this.onSetHorzZoomTextInput}
                    maxChars={3}
                    numericOnly={true}
                    textFieldAppearance={true}
                    style={{
                        background: 'white',
                        minWidth: '30px',
                        fontSize: '14px',
                        fontFamily: 'arial',
                        border: 'none',
                        padding: 0,
                        marginTop: 0,
                        marginBottom: 0,
                        marginRight: 2,
                    }}
                />
                <div>%</div>

                <DefaultTooltip
                    overlay={<span>Zoom in to oncoprint.</span>}
                    placement="top"
                >
                    <div onClick={this.onZoomInClick}>
                        <i className="fa fa-search-plus"></i>
                    </div>
                </DefaultTooltip>
            </div>
        );
    });

    @computed get showMinimap() {
        return this.props.state.showMinimap;
    }

    private get minimapButton() {
        return (
            <div className="btn-group">
                <DefaultTooltip overlay={<span>Toggle minimap panel.</span>}>
                    <Button
                        active={this.showMinimap}
                        onClick={this.toggleShowMinimap}
                    >
                        <img
                            data-test="ShowMinimapButton"
                            src={require('./toggle-minimap.svg')}
                            alt="icon"
                            style={{ width: 15, height: 15 }}
                        />
                    </Button>
                </DefaultTooltip>
            </div>
        );
    }

    private SortMenu = observer(() => {
        if (this.props.oncoprinterMode) {
            return <this.SortMenuOncoprinter />;
        } else {
            return <this.SortMenuOncoprint />;
        }
    });

    render() {
        return (
            <div className="oncoprint__controls">
                <ButtonGroup>
                    <this.tracksMenu />
                    <this.SortMenu />
                    <this.MutationColorMenu />
                    <this.ViewMenu />
                    <this.DownloadMenu />
                    <this.HorzZoomControls />
                    {this.minimapButton}
                    {this.props.handlers.onClickNGCHM && (
                        <ConfirmNgchmModal
                            show={this.showConfirmNgchmModal}
                            onHide={() => (this.showConfirmNgchmModal = false)}
                            openNgchmWindow={this.props.handlers.onClickNGCHM}
                        />
                    )}
                </ButtonGroup>
            </div>
        );
    }
}
