import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import {
    buildDriverAnnotationControlsHandlers,
    buildDriverAnnotationControlsState,
    IAnnotationFilterSettings,
    IDriverAnnotationControlsHandlers,
    IDriverAnnotationControlsState,
} from '../../alterationFiltering/AnnotationFilteringSettings';
import InfoIcon from '../InfoIcon';
import styles from './styles.module.scss';
import classNames from 'classnames';
import DriverTierControls from 'shared/components/driverAnnotations/DriverTierControls';
import { computed, makeObservable, observable } from 'mobx';

enum EVENT_KEY {
    showPutativeDrivers = '0',
    showPutativePassengers = '1',
    showUnknownOncogenicity = '2',
    showGermlineMutations = '3',
    showSomaticMutations = '4',
    showUnknownStatusMutations = '5',
    showUnknownTier = '6',
    toggleAllMutationStatus = '8',
    toggleAllDriverAnnotation = '9',
    toggleAllDriverTiers = '10',
}

export interface SettingsMenuProps {
    store: IAnnotationFilterSettings;
    infoElement?: JSX.Element | undefined;
    disabled?: boolean;
    customDriverSourceName?: string;
    showDriverAnnotationSection?: boolean;
    showTierAnnotationSection?: boolean;
}

@observer
export default class SettingsMenu extends React.Component<
    SettingsMenuProps,
    {}
> {
    public driverSettingsState: IDriverAnnotationControlsState;
    public driverSettingsHandlers: IDriverAnnotationControlsHandlers;
    @observable _driverAnnotationsCheckboxToggle = true;
    @observable _driverTiersCheckboxToggle = false;

    constructor(props: SettingsMenuProps) {
        super(props);
        makeObservable(this, {
            driverSettingsState: observable,
            driverSettingsHandlers: observable,
        });
        this.driverSettingsState = buildDriverAnnotationControlsState(
            props.store.driverAnnotationSettings,
            props.store.customDriverAnnotationReport.result,
            props.store.didOncoKbFailInOncoprint,
            props.store.didHotspotFailInOncoprint
        );
        this.driverSettingsHandlers = buildDriverAnnotationControlsHandlers(
            props.store.driverAnnotationSettings,
            this.driverSettingsState
        );
    }

    @autobind
    private onInputClick(event: React.MouseEvent<HTMLInputElement>) {
        let value: boolean;
        switch ((event.target as HTMLInputElement).value) {
            case EVENT_KEY.showPutativeDrivers:
                this.props.store.driverAnnotationSettings.includeDriver = !this
                    .props.store.driverAnnotationSettings.includeDriver;
                break;
            case EVENT_KEY.showPutativePassengers:
                this.props.store.driverAnnotationSettings.includeVUS = !this
                    .props.store.driverAnnotationSettings.includeVUS;
                break;
            case EVENT_KEY.showUnknownOncogenicity:
                this.props.store.driverAnnotationSettings.includeUnknownOncogenicity = !this
                    .props.store.driverAnnotationSettings
                    .includeUnknownOncogenicity;
                break;
            case EVENT_KEY.showGermlineMutations:
                this.props.store.includeGermlineMutations = !this.props.store
                    .includeGermlineMutations;
                break;
            case EVENT_KEY.showSomaticMutations:
                this.props.store.includeSomaticMutations = !this.props.store
                    .includeSomaticMutations;
                break;
            case EVENT_KEY.showUnknownStatusMutations:
                this.props.store.includeUnknownStatusMutations = !this.props
                    .store.includeUnknownStatusMutations;
                break;
            case EVENT_KEY.toggleAllMutationStatus:
                value = !this.isAnyMutationStatusOptionSelected;
                this.props.store.includeGermlineMutations = value;
                this.props.store.includeSomaticMutations = value;
                this.props.store.includeUnknownStatusMutations = value;
                break;
            case EVENT_KEY.toggleAllDriverAnnotation:
                value = !this.isAnyDriverAnnotationOptionSelected;
                this.props.store.driverAnnotationSettings.includeDriver = value;
                this.props.store.driverAnnotationSettings.includeVUS = value;
                this.props.store.driverAnnotationSettings.includeUnknownOncogenicity = value;
                break;
            case EVENT_KEY.toggleAllDriverTiers:
                if (this.driverSettingsState.customDriverAnnotationTiers) {
                    value = !(
                        this.driverSettingsState
                            .anyCustomDriverAnnotationTiersSelected &&
                        this.props.store.driverAnnotationSettings
                            .includeUnknownTier
                    );
                    this.driverSettingsState.customDriverAnnotationTiers.forEach(
                        t =>
                            this.driverSettingsHandlers
                                .onSelectCustomDriverAnnotationTier &&
                            this.driverSettingsHandlers.onSelectCustomDriverAnnotationTier(
                                t,
                                value
                            )
                    );
                    this.props.store.driverAnnotationSettings.includeUnknownTier = value;
                }
                break;
            case EVENT_KEY.showUnknownTier:
                if (this.driverSettingsState.customDriverAnnotationTiers) {
                    this.props.store.driverAnnotationSettings.includeUnknownTier = !this
                        .props.store.driverAnnotationSettings
                        .includeUnknownTier;
                }
                break;
        }
    }

    @computed get isAnyMutationStatusOptionSelected() {
        return (
            this.props.store.includeSomaticMutations ||
            this.props.store.includeGermlineMutations ||
            this.props.store.includeUnknownStatusMutations
        );
    }

    @computed get isAnyDriverAnnotationOptionSelected() {
        return (
            this.props.store.driverAnnotationSettings.includeDriver ||
            this.props.store.driverAnnotationSettings.includeVUS ||
            this.props.store.driverAnnotationSettings.includeUnknownOncogenicity
        );
    }

    @computed get isAnyTierOptionSelected() {
        return !!(
            this.driverSettingsState.anyCustomDriverAnnotationTiersSelected ||
            this.props.store.driverAnnotationSettings.includeUnknownTier
        );
    }

    render() {
        if (this.props.disabled) {
            return (
                <div data-test={'GlobalSettingsButtonHint'}>
                    <div>
                        Filtering based on annotations is not available for this
                        study.
                    </div>
                    <div>
                        Load custom driver annotations for the selected study to
                        enable filtering.
                    </div>
                </div>
            );
        }
        return (
            <div
                data-test="GlobalSettingsDropdown"
                className={classNames(
                    'cbioportal-frontend',
                    styles.annotationFilterDropdown
                )}
                style={{ padding: 5 }}
            >
                {!!this.props.infoElement && this.props.infoElement}
                <div className={styles.headerSection}>
                    <input
                        className={styles.categoryCheckbox}
                        data-test="ToggleAllMutationStatus"
                        type="checkbox"
                        value={EVENT_KEY.toggleAllMutationStatus}
                        checked={this.isAnyMutationStatusOptionSelected}
                        onClick={this.onInputClick}
                    />
                    Germline/Somatic status (mutations only)
                    <InfoIcon
                        divStyle={{ display: 'inline-block', marginLeft: 6 }}
                        style={{ color: 'rgb(54, 134, 194)' }}
                        tooltip={
                            <span>
                                Germline/somatic annotations are based on data
                                provided during study load.
                                <br />
                                For most studies <i>Unknown</i> status refers to
                                somatic mutations.
                            </span>
                        }
                    />
                </div>
                <div style={{ marginLeft: 20 }}>
                    <div className="checkbox">
                        <label>
                            <input
                                data-test="ShowGermline"
                                type="checkbox"
                                value={EVENT_KEY.showGermlineMutations}
                                checked={
                                    this.props.store.includeGermlineMutations
                                }
                                onClick={this.onInputClick}
                            />{' '}
                            Germline
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input
                                data-test="HideSomatic"
                                type="checkbox"
                                value={EVENT_KEY.showSomaticMutations}
                                checked={
                                    this.props.store.includeSomaticMutations
                                }
                                onClick={this.onInputClick}
                            />{' '}
                            Somatic
                        </label>
                    </div>
                    <div className="checkbox">
                        <label>
                            <input
                                data-test="ShowUnknown"
                                type="checkbox"
                                value={EVENT_KEY.showUnknownStatusMutations}
                                checked={
                                    this.props.store
                                        .includeUnknownStatusMutations
                                }
                                onClick={this.onInputClick}
                            />{' '}
                            Unknown
                        </label>
                    </div>
                </div>
                {this.props.showDriverAnnotationSection && (
                    <div>
                        <div className={styles.headerSection}>
                            <input
                                className={styles.categoryCheckbox}
                                data-test="ToggleAllDriverAnnotation"
                                type="checkbox"
                                value={EVENT_KEY.toggleAllDriverAnnotation}
                                checked={
                                    this.isAnyDriverAnnotationOptionSelected
                                }
                                onClick={this.onInputClick}
                            />
                            Driver Annotation
                            <InfoIcon
                                divStyle={{
                                    display: 'inline-block',
                                    marginLeft: 6,
                                }}
                                style={{ color: 'rgb(54, 134, 194)' }}
                                tooltip={
                                    <span>
                                        Driver/passenger annotations are based
                                        on
                                        <b>
                                            {' ' +
                                                this.props
                                                    .customDriverSourceName ||
                                                '' + ' '}
                                        </b>
                                        data.
                                    </span>
                                }
                            />
                        </div>
                        <div style={{ marginLeft: 20 }}>
                            <div className="checkbox">
                                <label>
                                    <input
                                        data-test="ShowDriver"
                                        type="checkbox"
                                        value={EVENT_KEY.showPutativeDrivers}
                                        checked={
                                            this.props.store
                                                .driverAnnotationSettings
                                                .includeDriver
                                        }
                                        onClick={this.onInputClick}
                                        disabled={
                                            !this.driverSettingsState
                                                .distinguishDrivers
                                        }
                                    />{' '}
                                    Putative drivers
                                </label>
                            </div>
                            <div className="checkbox">
                                <label>
                                    <input
                                        data-test="ShowVUS"
                                        type="checkbox"
                                        value={EVENT_KEY.showPutativePassengers}
                                        checked={
                                            this.props.store
                                                .driverAnnotationSettings
                                                .includeVUS
                                        }
                                        onClick={this.onInputClick}
                                        disabled={
                                            !this.driverSettingsState
                                                .distinguishDrivers
                                        }
                                    />{' '}
                                    Putative passengers
                                </label>
                            </div>
                            <div className="checkbox">
                                <label>
                                    <input
                                        data-test="ShowUnknownOncogenicity"
                                        type="checkbox"
                                        value={
                                            EVENT_KEY.showUnknownOncogenicity
                                        }
                                        checked={
                                            this.props.store
                                                .driverAnnotationSettings
                                                .includeUnknownOncogenicity
                                        }
                                        onClick={this.onInputClick}
                                        disabled={
                                            !this.driverSettingsState
                                                .distinguishDrivers
                                        }
                                    />{' '}
                                    Unknown
                                </label>
                            </div>
                        </div>
                    </div>
                )}
                {this.props.showTierAnnotationSection && (
                    <div>
                        <div className={styles.headerSection}>
                            <input
                                className={styles.categoryCheckbox}
                                data-test="ToggleAllDriverTiers"
                                type="checkbox"
                                value={EVENT_KEY.toggleAllDriverTiers}
                                checked={this.isAnyTierOptionSelected}
                                onClick={this.onInputClick}
                            />
                            Categorical Annotation
                            <InfoIcon
                                divStyle={{
                                    display: 'inline-block',
                                    marginLeft: 6,
                                }}
                                style={{ color: 'rgb(54, 134, 194)' }}
                                tooltip={
                                    <span>
                                        Alteration categories are based on
                                        <b>
                                            {' ' +
                                                this.props
                                                    .customDriverSourceName ||
                                                '' + ' '}
                                        </b>
                                        tier annotations.
                                    </span>
                                }
                            />
                        </div>
                        <div style={{ marginLeft: 20 }}>
                            <DriverTierControls
                                state={this.driverSettingsState}
                                handlers={this.driverSettingsHandlers}
                            />
                            <div
                                className="checkbox"
                                style={{ marginTop: '-5px' }}
                            >
                                <label>
                                    <input
                                        type="checkbox"
                                        value={EVENT_KEY.showUnknownTier}
                                        data-test="ShowUnknownTier"
                                        checked={
                                            this.props.store
                                                .driverAnnotationSettings
                                                .includeUnknownTier
                                        }
                                        onClick={this.onInputClick}
                                    />{' '}
                                    Unknown
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
