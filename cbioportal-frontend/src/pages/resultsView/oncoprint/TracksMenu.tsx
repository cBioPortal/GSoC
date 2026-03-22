import * as React from 'react';
import { observer } from 'mobx-react';
import { MSKTab, MSKTabs } from '../../../shared/components/MSKTabs/MSKTabs';
import { action, computed, makeObservable, observable } from 'mobx';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import _ from 'lodash';
import OncoprintDropdownCount from './OncoprintDropdownCount';
import CustomDropdown from 'shared/components/oncoprint/controls/CustomDropdown';
import {
    deriveDisplayTextFromGenericAssayType,
    filterGenericAssayEntitiesByGenes,
    makeGenericAssayOption,
} from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';
import GenericAssaySelection, {
    GenericAssayTrackInfo,
} from 'pages/studyView/addChartButton/genericAssaySelection/GenericAssaySelection';
import {
    IOncoprintControlsHandlers,
    IOncoprintControlsState,
} from 'shared/components/oncoprint/controls/OncoprintControls';
import autobind from 'autobind-decorator';
import { getTextWidth, remoteData } from 'cbioportal-frontend-commons';
import {
    clinicalAttributeIsINCOMPARISONGROUP,
    SpecialAttribute,
    clinicalAttributeIsPROFILEDIN,
} from 'shared/cache/ClinicalDataCache';
import { ExtendedClinicalAttribute } from '../ResultsViewPageStoreUtils';
import { ClinicalAttribute, GenericAssayMeta } from 'cbioportal-ts-api-client';
import { GENERIC_ASSAY_CONFIG } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
import { ClinicalTrackConfig } from 'shared/components/oncoprint/Oncoprint';
import SaveClinicalTracksButton from 'pages/resultsView/oncoprint/SaveClinicalTracksButton';
import { toggleIncluded } from 'shared/lib/ArrayUtils';
import AddChartByType from 'pages/studyView/addChartButton/addChartByType/AddChartByType';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { MakeMobxView } from 'shared/components/MobxView';
export interface IAddTrackProps {
    store: ResultsViewPageStore;
    heatmapMenu: JSX.Element | null;
    handlers: IOncoprintControlsHandlers;
    state: IOncoprintControlsState;
    selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl?: {
        [genericAssayType: string]: string[];
    };
    oncoprinterMode?: boolean;
}

enum Tab {
    CLINICAL = 'Clinical',
    HEATMAP = 'Heatmap',
    GROUPS = 'Groups',
    CUSTOM_CHARTS = 'Custom Charts',
}

export const MIN_DROPDOWN_WIDTH = 500;
export const CONTAINER_PADDING_WIDTH = 20;
export const TAB_PADDING_WIDTH = 14;
export const COUNT_PADDING_WIDTH = 17;
@observer
export default class TracksMenu extends React.Component<IAddTrackProps, {}> {
    @observable tabId: Tab | string = Tab.CLINICAL;

    private selectedGenericAssayProfileIdByType = observable.map<
        string,
        string
    >({}, { deep: true });

    private tracksDropdown: CustomDropdown;

    constructor(props: IAddTrackProps) {
        super(props);
        makeObservable(this);
    }

    @autobind
    private tracksDropdownRef(dropdown: CustomDropdown) {
        this.tracksDropdown = dropdown;
    }

    @action.bound
    private updateTabId(newId: Tab) {
        this.tabId = newId;
        // update profile if clicked Generic Assay tab
        // This will update generic assay profile correctly
        // Because if isGenericAssayDataComplete and profilesByGenericAssayType are falsy, tabs will not be shown
        if (!Object.values(Tab).includes(newId)) {
            if (
                this.isGenericAssayDataComplete &&
                this.profilesByGenericAssayType &&
                !_.isEmpty(this.profilesByGenericAssayType[newId]) &&
                this.props.handlers.onSelectGenericAssayProfile
            ) {
                this.props.handlers.onSelectGenericAssayProfile(
                    this.profilesByGenericAssayType[newId][0].molecularProfileId
                );
            }
        }
    }

    // make sure data from generic assay endpoints fetched
    @computed get isGenericAssayDataComplete() {
        return (
            this.props.store &&
            this.props.store.genericAssayProfiles.isComplete &&
            this.props.store.genericAssayEntitiesGroupByMolecularProfileId
                .isComplete
        );
    }

    @computed get showGenericAssayTabs() {
        if (this.isGenericAssayDataComplete) {
            const isSingleStudy =
                _.chain(this.props.store.genericAssayProfiles.result!)
                    .map(profile => profile.studyId)
                    .uniq()
                    .size()
                    .value() == 1;
            // disable for multiple studies query
            if (!_.isEmpty(this.profilesByGenericAssayType) && isSingleStudy) {
                return true;
            }
        } else {
            return false;
        }
    }

    @computed get profilesByGenericAssayType() {
        if (this.isGenericAssayDataComplete) {
            return _.groupBy(
                this.props.store.genericAssayProfiles.result,
                profile => profile.genericAssayType
            );
        } else {
            return {};
        }
    }

    @autobind
    private getSelectedClinicalAttributes(): ClinicalTrackConfig[] {
        let attr = this.props.state.selectedClinicalAttributeSpecInits;
        return attr ? _.values(attr) : [];
    }

    @action.bound
    private onGenericAssaySubmit(info: GenericAssayTrackInfo[]) {
        this.props.handlers.onClickAddGenericAssays &&
            this.props.handlers.onClickAddGenericAssays(info);
    }

    readonly clinicalTrackOptions = remoteData({
        await: () => [
            this.props.store.clinicalAttributes,
            this.clinicalAttributeIdToAvailableFrequency,
            this.props.store.customAttributes,
        ],
        invoke: () => {
            const uniqueAttributes = _.uniqBy(
                this.props.store.clinicalAttributes.result!,
                a => a.clinicalAttributeId
            );
            const availableFrequency = this
                .clinicalAttributeIdToAvailableFrequency.result!;
            const sortedAttributes = {
                clinical: [] as ExtendedClinicalAttribute[],
                groups: [] as ExtendedClinicalAttribute[],
                customCharts: [] as ExtendedClinicalAttribute[],
            };

            const customChartClinicalAttributeIds = _.keyBy(
                this.props.store.customAttributes.result!,
                a => a.clinicalAttributeId
            );

            for (const attr of uniqueAttributes) {
                if (clinicalAttributeIsINCOMPARISONGROUP(attr)) {
                    sortedAttributes.groups.push(attr);
                } else if (
                    attr.clinicalAttributeId in customChartClinicalAttributeIds
                ) {
                    sortedAttributes.customCharts.push(attr);
                } else {
                    sortedAttributes.clinical.push(attr);
                }
            }
            sortedAttributes.clinical = _.sortBy<ExtendedClinicalAttribute>(
                sortedAttributes.clinical,
                [
                    (x: ClinicalAttribute) => {
                        if (
                            x.clinicalAttributeId ===
                            SpecialAttribute.StudyOfOrigin
                        ) {
                            return 0;
                        } else if (
                            x.clinicalAttributeId ===
                            SpecialAttribute.MutationSpectrum
                        ) {
                            return 1;
                        } else if (clinicalAttributeIsPROFILEDIN(x)) {
                            return 2;
                        } else {
                            return 3;
                        }
                    },
                    (x: ClinicalAttribute) => {
                        let freq = availableFrequency[x.clinicalAttributeId];
                        if (freq === undefined) {
                            freq = 0;
                        }
                        return -freq;
                    },
                    (x: ClinicalAttribute) => -x.priority,
                    (x: ClinicalAttribute) => x.displayName.toLowerCase(),
                ]
            );

            sortedAttributes.groups = _.sortBy<ExtendedClinicalAttribute>(
                sortedAttributes.groups,
                x => x.displayName.toLowerCase()
            );

            sortedAttributes.customCharts = _.sortBy<ExtendedClinicalAttribute>(
                sortedAttributes.customCharts,
                x => x.displayName.toLowerCase()
            );

            return Promise.resolve(
                _.mapValues(sortedAttributes, attrs => {
                    return attrs.map(attr => ({
                        label: attr.displayName,
                        key: attr.clinicalAttributeId,
                        selected:
                            // set false by default
                            // manipulate this case by case
                            false,
                    }));
                })
            );
        },
    });

    readonly clinicalAttributeIdToAvailableFrequency = remoteData({
        await: () => [
            this.props.store.clinicalAttributeIdToAvailableSampleCount,
            this.props.store.samples,
        ],
        invoke: () => {
            const numSamples = this.props.store.samples.result!.length;
            return Promise.resolve(
                _.mapValues(
                    this.props.store.clinicalAttributeIdToAvailableSampleCount
                        .result!,
                    count => (100 * count) / numSamples
                )
            );
        },
    });

    @computed get clinicalTracksMenu() {
        // TODO: put onFocus handler on CheckedSelect when possible
        // TODO: pass unmodified string array as value prop when possible
        // TODO: remove labelKey specification, leave to default prop, when possible
        if (
            this.props.store &&
            this.props.state.selectedClinicalAttributeSpecInits &&
            this.props.handlers.onChangeSelectedClinicalTracks
        ) {
            return (
                <>
                    {this.props.oncoprinterMode}
                    {this.props.state.isSessionServiceEnabled && (
                        <SaveClinicalTracksButton
                            store={this.props.store}
                            isDirty={
                                this.props.state.isClinicalTrackConfigDirty
                            }
                            isLoggedIn={this.props.state.isLoggedIn}
                        />
                    )}
                    <div className="oncoprintAddClinicalTracks">
                        {this.addClinicalTracksMenu.component}
                    </div>
                </>
            );
        } else {
            return null;
        }
    }

    @action.bound
    private addAll(clinicalAttributeIds: string[]) {
        this.props.handlers.onChangeSelectedClinicalTracks!(
            _.union(
                this.getSelectedClinicalAttributes(),
                clinicalAttributeIds.map(id => new ClinicalTrackConfig(id))
            )
        );
        this.props.handlers.onChangeClinicalTracksPendingSubmission!(
            this.getSelectedClinicalAttributes()
        );
    }

    @action.bound
    private clear(clinicalAttributeIds: string[]) {
        this.props.handlers.onChangeSelectedClinicalTracks!(
            _.differenceBy(
                this.getSelectedClinicalAttributes(),
                clinicalAttributeIds.map(id => new ClinicalTrackConfig(id)),
                'stableId'
            )
        );
        this.props.handlers.onChangeClinicalTracksPendingSubmission!(
            this.getSelectedClinicalAttributes()
        );
    }

    @action.bound
    private submit() {
        this.props.handlers.onChangeSelectedClinicalTracks!(
            this.props.state.clinicalTracksPendingSubmission!
        );
        this.tracksDropdown.hide();
    }

    @action.bound
    private toggleClinicalTrack(clinicalAttributeId: string) {
        this.props.handlers.onChangeClinicalTracksPendingSubmission!(
            toggleIncluded(
                new ClinicalTrackConfig(clinicalAttributeId),
                this.props.state.clinicalTracksPendingSubmission!,
                track => track.stableId === clinicalAttributeId
            )
        );
    }

    @computed get showSubmit() {
        return (
            _.xorBy(
                this.getSelectedClinicalAttributes(),
                this.props.state.clinicalTracksPendingSubmission!,
                'stableId'
            ).length !== 0
        );
    }

    readonly addClinicalTracksMenu = MakeMobxView({
        await: () => [this.trackOptionsByType],
        render: () => (
            <>
                <AddChartByType
                    options={this.trackOptionsByType.result!.clinical}
                    freqPromise={this.clinicalAttributeIdToAvailableFrequency}
                    onAddAll={this.addAll}
                    onClearAll={this.clear}
                    onToggleOption={this.toggleClinicalTrack}
                    optionsGivenInSortedOrder={true}
                    width={this.dropdownWidth}
                />
                {this.showSubmit && (
                    <button
                        className="btn btn-primary btn-sm"
                        data-test="update-tracks"
                        style={{ marginTop: '10px', marginBottom: '0px' }}
                        onClick={this.submit}
                    >
                        {'Update tracks'}
                    </button>
                )}
            </>
        ),
        renderPending: () => <LoadingIndicator isLoading={true} small={true} />,
        showLastRenderWhenPending: true,
    });

    readonly addGroupTracksMenu = MakeMobxView({
        await: () => [this.trackOptionsByType],
        render: () => (
            <>
                {this.props.state.isSessionServiceEnabled && (
                    <SaveClinicalTracksButton
                        store={this.props.store}
                        isDirty={this.props.state.isClinicalTrackConfigDirty}
                        isLoggedIn={this.props.state.isLoggedIn}
                    />
                )}
                <AddChartByType
                    options={this.trackOptionsByType.result!.groups}
                    freqPromise={this.clinicalAttributeIdToAvailableFrequency}
                    onAddAll={this.addAll}
                    onClearAll={this.clear}
                    onToggleOption={this.toggleClinicalTrack}
                    optionsGivenInSortedOrder={true}
                    frequencyHeaderTooltip="% samples in group"
                    width={this.dropdownWidth}
                />
                {this.showSubmit && (
                    <button
                        className="btn btn-primary btn-sm"
                        data-test="update-tracks"
                        style={{ marginTop: '10px', marginBottom: '0px' }}
                        onClick={this.submit}
                    >
                        {'Update tracks'}
                    </button>
                )}
            </>
        ),
        renderPending: () => <LoadingIndicator isLoading={true} small={true} />,
        showLastRenderWhenPending: true,
    });

    readonly addChartTracksMenu = MakeMobxView({
        await: () => [this.trackOptionsByType],
        render: () => (
            <>
                {this.props.state.isSessionServiceEnabled && (
                    <SaveClinicalTracksButton
                        store={this.props.store}
                        isDirty={this.props.state.isClinicalTrackConfigDirty}
                        isLoggedIn={this.props.state.isLoggedIn}
                    />
                )}
                <AddChartByType
                    options={this.trackOptionsByType.result!.customCharts}
                    freqPromise={this.clinicalAttributeIdToAvailableFrequency}
                    onAddAll={this.addAll}
                    onClearAll={this.clear}
                    onToggleOption={this.toggleClinicalTrack}
                    optionsGivenInSortedOrder={true}
                    frequencyHeaderTooltip="% samples in group"
                    width={this.dropdownWidth}
                />
                {this.showSubmit && (
                    <button
                        className="btn btn-primary btn-sm"
                        data-test="update-tracks"
                        style={{ marginTop: '10px', marginBottom: '0px' }}
                        onClick={this.submit}
                    >
                        {'Update tracks'}
                    </button>
                )}
            </>
        ),
        renderPending: () => <LoadingIndicator isLoading={true} small={true} />,
        showLastRenderWhenPending: true,
    });

    readonly trackOptionsByType = remoteData({
        await: () => [this.clinicalTrackOptions],
        invoke: () => {
            return Promise.resolve(
                _.mapValues(this.clinicalTrackOptions.result, options => {
                    return options.map(option => ({
                        ...option,
                        selected:
                            option.key in
                            _.keyBy(
                                this.props.state.clinicalTracksPendingSubmission!.map(
                                    a => a.stableId
                                )
                            ),
                    }));
                })
            );
        },
    });

    @action.bound
    private onSelectGenericAssayProfileByType(
        genericAssayType: string,
        profileId: string
    ) {
        this.selectedGenericAssayProfileIdByType.set(
            genericAssayType,
            profileId
        );
    }

    @computed
    private get genericAssayTabs() {
        let tabs = [];
        if (this.isGenericAssayDataComplete && this.showGenericAssayTabs) {
            const genericAssayEntitiesGroupByMolecularProfileId = this.props
                .store.genericAssayEntitiesGroupByMolecularProfileId.result;
            // create one tab for each generic assay type
            tabs = _.map(this.profilesByGenericAssayType, (profiles, type) => {
                const profileOptions = _.map(profiles, profile => {
                    return {
                        value: profile.molecularProfileId,
                        label: profile.name,
                    };
                });

                let selectedProfileId = this.selectedGenericAssayProfileIdByType.get(
                    type
                );
                // Add the first type if there is no selected Generic Assay Profile (on init)
                selectedProfileId =
                    typeof selectedProfileId === 'undefined'
                        ? profileOptions[0].value
                        : selectedProfileId;

                let genericEntitiesOfSelectedProfile: GenericAssayMeta[] = [];
                if (
                    genericAssayEntitiesGroupByMolecularProfileId &&
                    selectedProfileId
                ) {
                    genericEntitiesOfSelectedProfile =
                        genericAssayEntitiesGroupByMolecularProfileId[
                            selectedProfileId
                        ];
                }

                // bring gene related options to the front
                let entities;
                const filteredEntities = GENERIC_ASSAY_CONFIG
                    .genericAssayConfigByType[type]?.globalConfig
                    ?.geneRelatedGenericAssayType
                    ? filterGenericAssayEntitiesByGenes(
                          genericEntitiesOfSelectedProfile,
                          this.props.store.hugoGeneSymbols
                      )
                    : [];
                entities = [
                    ...filteredEntities,
                    ..._.difference(
                        genericEntitiesOfSelectedProfile,
                        filteredEntities
                    ),
                ];
                const entityOptions = _.map(entities, makeGenericAssayOption);
                const linkText = (
                    <div>
                        {deriveDisplayTextFromGenericAssayType(type)}
                        <span style={{ paddingLeft: 5 }}>
                            <OncoprintDropdownCount count={profiles.length} />
                        </span>
                    </div>
                );

                return (
                    <MSKTab
                        key={type}
                        id={type}
                        className="oncoprintGenericAssayTab"
                        linkText={linkText}
                    >
                        <GenericAssaySelection
                            molecularProfileOptions={profileOptions}
                            submitButtonText={'Add Track'}
                            genericAssayType={type}
                            genericAssayEntityOptions={entityOptions}
                            initialGenericAssayEntityIds={
                                this.props
                                    .selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl &&
                                this.props
                                    .selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl[
                                    type
                                ]
                                    ? this.props
                                          .selectedGenericAssayEntitiesGroupedByGenericAssayTypeFromUrl[
                                          type
                                      ]
                                    : []
                            }
                            onSelectGenericAssayProfile={profileId =>
                                this.onSelectGenericAssayProfileByType(
                                    type,
                                    profileId
                                )
                            }
                            onTrackSubmit={this.onGenericAssaySubmit}
                            allowEmptySubmission={true}
                        />
                    </MSKTab>
                );
            });
            return tabs;
        } else {
            return null;
        }
    }

    @computed get clinicalTabText() {
        if (
            this.clinicalTrackOptions.result &&
            !_.isEmpty(this.clinicalTrackOptions.result.clinical)
        ) {
            return (
                <div>
                    {Tab.CLINICAL}
                    <span style={{ paddingLeft: 5 }}>
                        <OncoprintDropdownCount
                            count={
                                this.clinicalTrackOptions.result.clinical.length
                            }
                        />
                    </span>
                </div>
            );
        } else {
            return Tab.CLINICAL;
        }
    }

    @computed get heatmapTabText() {
        if (!_.isEmpty(this.props.store.heatmapMolecularProfiles.result)) {
            return (
                <div>
                    {Tab.HEATMAP}
                    <span style={{ paddingLeft: 5 }}>
                        <OncoprintDropdownCount
                            count={
                                this.props.store.heatmapMolecularProfiles
                                    .result!.length
                            }
                        />
                    </span>
                </div>
            );
        } else {
            return Tab.HEATMAP;
        }
    }

    @computed get groupTabText() {
        if (
            this.trackOptionsByType.result &&
            !_.isEmpty(this.trackOptionsByType.result.groups)
        ) {
            return (
                <div>
                    {Tab.GROUPS}
                    <span style={{ paddingLeft: 5 }}>
                        <OncoprintDropdownCount
                            count={this.trackOptionsByType.result.groups.length}
                        />
                    </span>
                </div>
            );
        } else {
            return Tab.GROUPS;
        }
    }

    @computed get customChartTabText() {
        if (
            this.trackOptionsByType.result &&
            !_.isEmpty(this.trackOptionsByType.result.customCharts)
        ) {
            return (
                <div>
                    {Tab.CUSTOM_CHARTS}
                    <span style={{ paddingLeft: 5 }}>
                        <OncoprintDropdownCount
                            count={
                                this.trackOptionsByType.result.customCharts
                                    .length
                            }
                        />
                    </span>
                </div>
            );
        } else {
            return Tab.CUSTOM_CHARTS;
        }
    }

    private getTextPixel(text: string, fontSize: string) {
        // This is a very specified function to calculate the text length in Add Tracks dropdown
        const FRONT_FAMILY = 'Helvetica Neue';
        return Math.floor(getTextWidth(text, FRONT_FAMILY, fontSize));
    }

    @computed get dropdownWidth() {
        let width = 2 * CONTAINER_PADDING_WIDTH;
        const HEADER_FONT_SIZE = '14px';
        const COUNT_FONT_SIZE = '11px';
        if (
            this.clinicalTrackOptions.result &&
            !_.isEmpty(this.clinicalTrackOptions.result.clinical)
        ) {
            const textWidth =
                this.getTextPixel(Tab.CLINICAL, HEADER_FONT_SIZE) +
                TAB_PADDING_WIDTH;
            const countTextWidth =
                this.getTextPixel(
                    this.clinicalTrackOptions.result.clinical.length.toString(),
                    COUNT_FONT_SIZE
                ) + COUNT_PADDING_WIDTH;
            width += textWidth + countTextWidth;
        }
        if (
            this.props.heatmapMenu &&
            !_.isEmpty(this.props.store.heatmapMolecularProfiles.result)
        ) {
            const textWidth =
                this.getTextPixel(Tab.HEATMAP, HEADER_FONT_SIZE) +
                TAB_PADDING_WIDTH;
            const countTextWidth =
                this.getTextPixel(
                    this.props.store.heatmapMolecularProfiles.result!.length.toString(),
                    COUNT_FONT_SIZE
                ) + COUNT_PADDING_WIDTH;
            width += textWidth + countTextWidth;
        }
        if (this.showGenericAssayTabs) {
            // showGenericAssayTabs is true means we have more than one generic assay tabs are showing
            // and we know this.profilesByGenericAssayType is loaded completely
            const genericAssayText = this.genericAssayTabs!.map(tab =>
                deriveDisplayTextFromGenericAssayType(tab.key as string)
            ).join();
            const genericAssayTabsCount = this.genericAssayTabs!.length;
            const genericAssayCountTextWidth = _.reduce(
                this.profilesByGenericAssayType,
                (width, profiles) => {
                    return (width +=
                        this.getTextPixel(
                            profiles.length.toString(),
                            COUNT_FONT_SIZE
                        ) + COUNT_PADDING_WIDTH);
                },
                0
            );
            const genericAssayTabsWidth =
                this.getTextPixel(genericAssayText, HEADER_FONT_SIZE) +
                genericAssayTabsCount * TAB_PADDING_WIDTH +
                genericAssayCountTextWidth;
            width += genericAssayTabsWidth;
        }

        return Math.max(width, MIN_DROPDOWN_WIDTH);
    }

    render() {
        return (
            <CustomDropdown
                bsStyle="default"
                title="Tracks"
                id="addTracksDropdown"
                className="oncoprintAddTracksDropdown"
                styles={{ minWidth: MIN_DROPDOWN_WIDTH, width: 'auto' }}
                ref={this.tracksDropdownRef}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <MSKTabs
                        activeTabId={this.tabId}
                        onTabClick={this.updateTabId}
                        unmountOnHide={false}
                        className="menuTabs oncoprintAddTracks"
                    >
                        <MSKTab
                            key={0}
                            id={Tab.CLINICAL}
                            linkText={this.clinicalTabText}
                            hide={!this.clinicalTracksMenu}
                        >
                            {this.clinicalTracksMenu}
                        </MSKTab>
                        <MSKTab
                            key={1}
                            id={Tab.HEATMAP}
                            linkText={this.heatmapTabText}
                            hide={!this.props.heatmapMenu}
                        >
                            {this.props.heatmapMenu}
                        </MSKTab>
                        <MSKTab
                            key={2}
                            id={Tab.GROUPS}
                            linkText={this.groupTabText}
                            hide={
                                !this.trackOptionsByType.isComplete ||
                                this.trackOptionsByType.result!.groups
                                    .length === 0
                            }
                        >
                            {this.addGroupTracksMenu.component}
                        </MSKTab>
                        <MSKTab
                            key={3}
                            id={Tab.CUSTOM_CHARTS}
                            linkText={this.customChartTabText}
                            hide={
                                !this.trackOptionsByType.isComplete ||
                                this.trackOptionsByType.result!.customCharts
                                    .length === 0
                            }
                        >
                            {this.addChartTracksMenu.component}
                        </MSKTab>
                        {this.genericAssayTabs}
                    </MSKTabs>
                </div>
            </CustomDropdown>
        );
    }
}
