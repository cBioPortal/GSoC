import * as React from 'react';
import { observer, Observer } from 'mobx-react';
import { action, computed, observable, makeObservable, autorun } from 'mobx';
import Oncoprint from '../../../../shared/components/oncoprint/Oncoprint';
import OncoprintControls, {
    IOncoprintControlsHandlers,
    IOncoprintControlsState,
} from 'shared/components/oncoprint/controls/OncoprintControls';
import { percentAltered } from '../../../../shared/components/oncoprint/OncoprintUtils';
import { getServerConfig } from 'config/config';
import { OncoprintJS, RGBAColor } from 'oncoprintjs';
import fileDownload from 'react-file-download';
import { FadeInteraction, svgToPdfDownload } from 'cbioportal-frontend-commons';
import classNames from 'classnames';
import OncoprinterStore from './OncoprinterStore';
import autobind from 'autobind-decorator';
import { onMobxPromise } from 'cbioportal-frontend-commons';
import WindowStore from '../../../../shared/components/window/WindowStore';
import { getGeneticTrackKey } from './OncoprinterGeneticUtils';
import InfoBanner from '../../../../shared/components/banners/InfoBanner';
import '../../../../globalStyles/oncoprintStyles.scss';
import _ from 'lodash';
import {
    MUTATION_SPECTRUM_CATEGORIES,
    MUTATION_SPECTRUM_FILLS,
} from 'shared/cache/ClinicalDataCache';
import {
    hexToRGBA,
    RESERVED_CLINICAL_VALUE_COLORS,
    rgbaToHex,
} from 'shared/lib/Colors';
import {
    getClinicalTrackColor,
    getClinicalTrackValues,
} from 'shared/components/oncoprint/ResultsViewOncoprint';
import { Modal } from 'react-bootstrap';
import ClinicalTrackColorPicker from 'shared/components/oncoprint/ClinicalTrackColorPicker';
import classnames from 'classnames';
import { getDefaultClinicalAttributeColoringForStringDatatype } from './OncoprinterToolUtils';
import { OncoprintColorModal } from 'shared/components/oncoprint/OncoprintColorModal';
import JupyterNoteBookModal from './JupyterNotebookModal';
import { convertToCSV } from 'shared/lib/calculation/JSONtoCSV';

interface IOncoprinterProps {
    divId: string;
    store: OncoprinterStore;
}

const DEFAULT_UNKNOWN_COLOR = [255, 255, 255, 1];
const DEFAULT_MIXED_COLOR = [220, 57, 18, 1];

@observer
export default class Oncoprinter extends React.Component<
    IOncoprinterProps,
    {}
> {
    @observable distinguishMutationType: boolean = true;
    @observable distinguishGermlineMutations = true;
    @observable sortByMutationType: boolean = true;
    @observable sortByDrivers: boolean = true;

    @observable showWhitespaceBetweenColumns: boolean = true;
    @observable showClinicalTrackLegends: boolean = true;

    @observable showMinimap: boolean = false;

    @observable horzZoom: number = 0.5;

    @observable mouseInsideBounds: boolean = false;

    @observable renderingComplete = true;

    private controlsHandlers: IOncoprintControlsHandlers;
    private controlsState: IOncoprintControlsState;

    @observable.ref public oncoprint: OncoprintJS | undefined = undefined;

    @observable public showJupyterNotebookModal = false;
    @observable private jupyterFileContent = '';
    @observable private jupyterFileName = '';

    @action
    private openJupyterNotebookModal = () => {
        this.showJupyterNotebookModal = true;
    };

    @action
    private closeJupyterNotebookModal = () => {
        this.showJupyterNotebookModal = false;
    };

    constructor(props: IOncoprinterProps) {
        super(props);

        makeObservable(this);

        (window as any).oncoprinter = this;

        const self = this;

        this.controlsHandlers = this.buildControlsHandlers();

        this.controlsState = observable({
            get showUnalteredColumns() {
                return self.props.store.showUnalteredColumns;
            },
            get showWhitespaceBetweenColumns() {
                return self.showWhitespaceBetweenColumns;
            },
            get showClinicalTrackLegends() {
                return self.showClinicalTrackLegends;
            },
            get showMinimap() {
                return self.showMinimap;
            },
            get sortByMutationType() {
                return self.sortByMutationType;
            },
            get sortByCaseListDisabled() {
                return !self.props.store.inputSampleIdOrder;
            },
            get distinguishMutationType() {
                return self.distinguishMutationType;
            },
            get distinguishGermlineMutations() {
                return self.distinguishGermlineMutations;
            },
            get distinguishDrivers() {
                return self.distinguishDrivers;
            },
            get annotateDriversOncoKb() {
                return self.props.store.driverAnnotationSettings.oncoKb;
            },
            get annotateDriversOncoKbDisabled() {
                return !getServerConfig().show_oncokb;
            },
            get annotateDriversOncoKbError() {
                return self.props.store.didOncoKbFail;
            },
            get hidePutativePassengers() {
                return !self.props.store.driverAnnotationSettings.includeVUS;
            },
            get hideGermlineMutations() {
                return self.props.store.hideGermlineMutations;
            },
            get sortByDrivers() {
                return self.sortByDrivers;
            },
            get horzZoom() {
                if (isNaN(self.horzZoom)) {
                    return 1;
                } else {
                    return self.horzZoom;
                }
            },
            get annotateDriversHotspots() {
                return self.props.store.driverAnnotationSettings.hotspots;
            },
            get annotateDriversHotspotsDisabled() {
                return !getServerConfig().show_hotspot;
            },
            get annotateCustomDriverBinary() {
                return self.props.store.driverAnnotationSettings.customBinary;
            },
            get customDriverAnnotationBinaryMenuLabel() {
                if (self.props.store.existCustomDrivers) {
                    return 'User-specified drivers';
                } else {
                    return undefined;
                }
            },
            get isLoggedIn() {
                // do nothing in oncoprinter mode:
                return false;
            },
            get isClinicalTrackConfigDirty() {
                // do nothing in oncoprinter mode:
                return false;
            },
            get isSessionServiceEnabled() {
                // do nothing in oncoprinter mode:
                return false;
            },
        });
    }

    @computed get distinguishDrivers() {
        return this.props.store.driverAnnotationSettings.driversAnnotated;
    }

    @autobind
    onMouseEnter() {
        this.mouseInsideBounds = true;
    }

    @autobind
    onMouseLeave() {
        this.mouseInsideBounds = false;
    }

    private buildControlsHandlers() {
        return {
            onSelectShowUnalteredColumns: (show: boolean) => {
                this.props.store.showUnalteredColumns = show;
            },
            onSelectShowWhitespaceBetweenColumns: (show: boolean) => {
                this.showWhitespaceBetweenColumns = show;
            },
            onSelectShowClinicalTrackLegends: (show: boolean) => {
                this.showClinicalTrackLegends = show;
            },
            onSelectShowMinimap: (show: boolean) => {
                this.showMinimap = show;
            },
            onSelectDistinguishMutationType: (s: boolean) => {
                this.distinguishMutationType = s;
            },
            onSelectDistinguishGermlineMutations: (s: boolean) => {
                this.distinguishGermlineMutations = s;
            },
            onSelectDistinguishDrivers: action((s: boolean) => {
                if (!s) {
                    this.props.store.driverAnnotationSettings.oncoKb = false;
                    this.props.store.driverAnnotationSettings.customBinary = false;
                    this.props.store.driverAnnotationSettings.includeVUS = true;
                } else {
                    if (
                        !this.controlsState.annotateDriversOncoKbDisabled &&
                        !this.controlsState.annotateDriversOncoKbError
                    ) {
                        this.props.store.driverAnnotationSettings.oncoKb = true;
                    }

                    this.props.store.driverAnnotationSettings.customBinary = true;
                }
            }),
            onSelectAnnotateOncoKb: action((s: boolean) => {
                this.props.store.driverAnnotationSettings.oncoKb = s;
            }),
            onSelectCustomDriverAnnotationBinary: action((s: boolean) => {
                this.props.store.driverAnnotationSettings.customBinary = s;
            }),
            onSelectHideVUS: (s: boolean) => {
                this.props.store.driverAnnotationSettings.includeVUS = !s;
            },
            onSelectHideGermlineMutations: (s: boolean) => {
                this.props.store.hideGermlineMutations = s;
            },
            onSelectSortByMutationType: (s: boolean) => {
                this.sortByMutationType = s;
            },
            onSelectSortByDrivers: (sort: boolean) => {
                this.sortByDrivers = sort;
            },
            onClickDownload: (type: string) => {
                switch (type) {
                    case 'pdf':
                        svgToPdfDownload(
                            'oncoprint.pdf',
                            this.oncoprint!.toSVG(false)
                        );
                        // if (!pdfDownload("oncoprint.pdf", this.oncoprint.toSVG(true))) {
                        //     alert("Oncoprint too big to download as PDF - please download as SVG.");
                        // }
                        break;
                    case 'png':
                        const img = this.oncoprint!.toCanvas(
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
                                this.oncoprint!.toSVG(false)
                            ),
                            'oncoprint.svg'
                        );
                        break;
                    case 'order':
                        const capitalizedColumnMode = 'Sample';
                        let file = `${capitalizedColumnMode} order in the Oncoprint is:\n`;
                        const caseIds = this.oncoprint!.getIdOrder();
                        for (const caseId of caseIds) {
                            file += `${caseId}\n`;
                        }
                        fileDownload(file, `OncoPrintSamples.txt`);
                        break;
                    case 'jupyterNoteBook':
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

                        if (
                            this.props.store._mutations &&
                            this.props.store._studyIds
                        ) {
                            const allGenesMutationsCsv = convertToCSV(
                                this.props.store.mutationsDataProps,
                                fieldsToKeep
                            );

                            this.jupyterFileContent = allGenesMutationsCsv;

                            this.jupyterFileName = this.props.store.studyIdProps.join(
                                '&'
                            );

                            this.openJupyterNotebookModal();
                        }

                        break;
                }
            },
            onSetHorzZoom: (z: number) => {
                this.oncoprint!.setHorzZoomCentered(z);
            },
            onClickZoomIn: () => {
                this.oncoprint!.setHorzZoomCentered(
                    this.oncoprint!.getHorzZoom() / 0.7
                );
            },
            onClickZoomOut: () => {
                this.oncoprint!.setHorzZoomCentered(
                    this.oncoprint!.getHorzZoom() * 0.7
                );
            },
            onClickNGCHM: () => {}, // do nothing in oncoprinter mode
        };
    }

    @action
    private initializeOncoprint() {
        onMobxPromise(
            this.props.store.alteredSampleIds,
            (alteredUids: string[]) => {
                this.oncoprint!.setHorzZoomToFit(alteredUids);
            }
        );

        this.oncoprint!.onHorzZoom(z => (this.horzZoom = z));
        this.horzZoom = this.oncoprint!.getHorzZoom();
    }

    @action.bound
    private oncoprintRef(oncoprint: OncoprintJS) {
        this.oncoprint = oncoprint;

        this.initializeOncoprint();
    }

    @action.bound
    private onMinimapClose() {
        this.showMinimap = false;
    }

    @action.bound
    private onSuppressRendering() {
        this.renderingComplete = false;
    }

    @action.bound
    private onReleaseRendering() {
        this.renderingComplete = true;
    }

    @computed get sortConfig() {
        return {
            sortByMutationType: this.sortByMutationType,
            sortByDrivers: this.sortByDrivers,
            order: this.props.store.inputSampleIdOrder,
        };
    }

    @computed get alterationInfo() {
        if (this.props.store.alteredSampleIds.isComplete) {
            const numSamples = this.props.store.sampleIds.length;
            const alteredSamples = this.props.store.alteredSampleIds.result
                .length;
            return (
                <span
                    style={{
                        marginTop: '15px',
                        marginBottom: '15px',
                        display: 'block',
                    }}
                >
                    {`Altered in ${alteredSamples} (${percentAltered(
                        alteredSamples,
                        numSamples
                    )}) of ${numSamples} samples.`}
                </span>
            );
        } else {
            return null;
        }
    }

    @computed get isLoading() {
        // todo: use mobxview
        return (
            this.props.store.geneticTracks.isPending ||
            this.props.store.alteredSampleIds.isPending ||
            this.props.store.unalteredSampleIds.isPending
        );
    }

    @computed get isHidden() {
        return this.isLoading || !this.renderingComplete;
    }

    @autobind
    private getControls() {
        if (this.oncoprint && !this.oncoprint.webgl_unavailable) {
            return (
                <FadeInteraction showByDefault={true} show={true}>
                    <OncoprintControls
                        handlers={this.controlsHandlers}
                        state={this.controlsState}
                        oncoprinterMode={true}
                    />
                </FadeInteraction>
            );
        } else {
            return <span />;
        }
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
            this.props.store.clinicalTracks,
            t => t.key === this.trackKeySelectedForEdit
        );
    }

    @computed get defaultClinicalAttributeColoringForStringDatatype() {
        if (this.selectedClinicalTrack) {
            return _.mapValues(
                getDefaultClinicalAttributeColoringForStringDatatype(
                    this.selectedClinicalTrack.data
                ),
                hexToRGBA
            );
        }
        return _.mapValues(RESERVED_CLINICAL_VALUE_COLORS, hexToRGBA);
    }

    @autobind
    private getSelectedClinicalTrackDefaultColorForValue(
        attributeValue: string
    ) {
        if (!this.selectedClinicalTrack) {
            return DEFAULT_UNKNOWN_COLOR;
        }
        switch (this.selectedClinicalTrack.datatype) {
            case 'counts':
                return MUTATION_SPECTRUM_FILLS[
                    _.indexOf(MUTATION_SPECTRUM_CATEGORIES, attributeValue)
                ];
            case 'string':
                // Mixed refers to when an event has multiple values (i.e. Sample Type for a patient event may have both Primary and Recurrence values)
                if (attributeValue === 'Mixed') {
                    return DEFAULT_MIXED_COLOR;
                } else {
                    return this
                        .defaultClinicalAttributeColoringForStringDatatype[
                        attributeValue
                    ];
                }
            default:
                return DEFAULT_UNKNOWN_COLOR;
        }
    }

    public render() {
        return (
            <div className="posRelative">
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
                    {this.props.store.existCustomDrivers &&
                        !this.props.store.customDriverWarningHidden &&
                        this.props.store.driverAnnotationSettings
                            .customBinary && (
                            <InfoBanner
                                message={`Driver annotations reflect only user-provided data. Use the Mutations menu to modify annotation settings.`}
                                style={{ marginBottom: 10 }}
                                hidden={
                                    this.props.store.customDriverWarningHidden
                                }
                                hide={() => {
                                    this.props.store.customDriverWarningHidden = true;
                                }}
                            />
                        )}
                    <Observer>{this.getControls}</Observer>

                    <div style={{ position: 'relative' }}>
                        <div id="oncoprintDiv">
                            {this.alterationInfo}
                            <Oncoprint
                                key={this.props.store.submitCount}
                                broadcastOncoprintJsRef={this.oncoprintRef}
                                clinicalTracks={this.props.store.clinicalTracks}
                                geneticTracks={
                                    this.props.store.geneticTracks.result
                                }
                                categoricalTracks={[]} // TODO: allow import of generic assay categorical tracks
                                geneticTracksOrder={
                                    this.props.store.geneOrder &&
                                    this.props.store.geneOrder.map(
                                        getGeneticTrackKey
                                    )
                                }
                                genesetHeatmapTracks={[]}
                                heatmapTracks={this.props.store.heatmapTracks}
                                divId={this.props.divId}
                                width={this.width}
                                caseLinkOutInTooltips={false}
                                suppressRendering={this.isLoading}
                                onSuppressRendering={this.onSuppressRendering}
                                onReleaseRendering={this.onReleaseRendering}
                                keepSorted={true}
                                hiddenIds={
                                    this.props.store.hiddenSampleIds.result
                                }
                                showClinicalTrackLegends={
                                    this.showClinicalTrackLegends
                                }
                                horzZoomToFitIds={
                                    this.props.store.alteredSampleIds.result
                                }
                                distinguishMutationType={
                                    this.distinguishMutationType
                                }
                                distinguishGermlineMutations={
                                    this.distinguishGermlineMutations
                                }
                                distinguishDrivers={this.distinguishDrivers}
                                sortConfig={this.sortConfig}
                                showWhitespaceBetweenColumns={
                                    this.showWhitespaceBetweenColumns
                                }
                                showMinimap={this.showMinimap}
                                onMinimapClose={this.onMinimapClose}
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
                <JupyterNoteBookModal
                    show={this.showJupyterNotebookModal}
                    handleClose={this.closeJupyterNotebookModal}
                    fileContent={this.jupyterFileContent}
                    fileName={this.jupyterFileName}
                />
            </div>
        );
    }
}
