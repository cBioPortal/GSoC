import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { MakeMobxView } from '../../shared/components/MobxView';
import Loader from '../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../shared/components/ErrorMessage';
import { MakeEnrichmentsTabUI } from './GroupComparisonUtils';
import _ from 'lodash';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';
import GenericAssayBinaryEnrichmentsContainer from 'pages/resultsView/enrichments/GenericAssayBinaryEnrichmentsContainer';
import EnrichmentsDataSetDropdown from 'pages/resultsView/enrichments/EnrichmentsDataSetDropdown';
import { makeObservable, observable } from 'mobx';
import GenericAssayEnrichmentsContainer from 'pages/resultsView/enrichments/GenericAssayEnrichmentsContainer';
import GenericAssayCategoricalEnrichmentsContainer from 'pages/resultsView/enrichments/GenericAssayCategoricalEnrichmentsContainer';

export interface IGenericAssayEnrichmentCollectionsProps {
    store: ComparisonStore;
    genericAssayType: string;
    resultsViewMode?: boolean;
}

@observer
export default class GenericAssayEnrichmentCollections extends React.Component<
    IGenericAssayEnrichmentCollectionsProps,
    {}
> {
    constructor(props: IGenericAssayEnrichmentCollectionsProps) {
        super(props);
        makeObservable(this);
    }

    @observable isBinary: boolean | undefined = false;
    @observable isCategorical: boolean | undefined = false;
    @observable isNumerical: boolean | undefined = false;

    @autobind
    private onChangeProfile(profileMap: {
        [studyId: string]: MolecularProfile;
    }) {
        const type = Object.values(profileMap)[0].datatype;
        this.props.store.setAllGenericAssayEnrichmentProfileMap(
            profileMap,
            this.props.genericAssayType
        );
        if (type === 'BINARY') {
            this.isBinary = true;
            this.isCategorical = false;
            this.isNumerical = false;
        } else if (type === 'CATEGORICAL') {
            this.isBinary = false;
            this.isCategorical = true;
            this.isNumerical = false;
        } else {
            this.isBinary = false;
            this.isCategorical = false;
            this.isNumerical = true;
        }
    }

    readonly tabUI = MakeEnrichmentsTabUI(
        () => this.props.store,
        () => this.enrichmentsUI,
        this.props.genericAssayType,
        true,
        true,
        false
    );

    readonly enrichmentsUI = MakeMobxView({
        await: () => {
            const ret: any[] = [
                this.props.store.gaBinaryEnrichmentDataByAssayType,
                this.props.store
                    .selectedAllGenericAssayEnrichmentProfileMapGroupedByGenericAssayType,
                this.props.store.gaBinaryEnrichmentGroupsByAssayType,
                this.props.store.gaCategoricalEnrichmentDataByAssayType,
                this.props.store.gaCategoricalEnrichmentGroupsByAssayType,
                this.props.store.gaEnrichmentDataByAssayType,
                this.props.store.gaEnrichmentGroupsByAssayType,
                this.props.store.studies,
            ];
            if (
                this.props.store.gaBinaryEnrichmentDataByAssayType.isComplete &&
                this.props.store.gaBinaryEnrichmentDataByAssayType.result![
                    this.props.genericAssayType
                ]
            ) {
                ret.push(
                    this.props.store.gaBinaryEnrichmentDataByAssayType.result![
                        this.props.genericAssayType
                    ]
                );
            }

            if (
                this.props.store.gaCategoricalEnrichmentDataByAssayType
                    .isComplete &&
                this.props.store.gaCategoricalEnrichmentDataByAssayType.result![
                    this.props.genericAssayType
                ]
            ) {
                ret.push(
                    this.props.store.gaCategoricalEnrichmentDataByAssayType
                        .result![this.props.genericAssayType]
                );
            }
            if (
                this.props.store.gaEnrichmentDataByAssayType.isComplete &&
                this.props.store.gaEnrichmentDataByAssayType.result![
                    this.props.genericAssayType
                ]
            ) {
                ret.push(
                    this.props.store.gaEnrichmentDataByAssayType.result![
                        this.props.genericAssayType
                    ]
                );
            }
            return ret;
        },
        render: () => {
            // since generic assay enrichments tab is enabled only for one study, selectedGenericAssayEnrichmentProfileMap
            // would contain only one key.
            const studyId = Object.keys(
                this.props.store
                    .selectedAllGenericAssayEnrichmentProfileMapGroupedByGenericAssayType
                    .result![this.props.genericAssayType]
            )[0];

            // select the first found profile in the study as the default selection for selected genericAssayType
            const selectedProfile = this.props.store
                .selectedAllGenericAssayEnrichmentProfileMapGroupedByGenericAssayType
                .result![this.props.genericAssayType][studyId];

            let profileList: MolecularProfile[] = [];
            const genericAssayBinaryEnrichmentProfiles = this.props.store
                .genericAssayBinaryEnrichmentProfilesGroupedByGenericAssayType
                .result![this.props.genericAssayType];
            const genericAssayCategoricalEnrichmentProfiles = this.props.store
                .genericAssayCategoricalEnrichmentProfilesGroupedByGenericAssayType
                .result![this.props.genericAssayType];
            const genericAssayEnrichmentProfiles = this.props.store
                .genericAssayEnrichmentProfilesGroupedByGenericAssayType
                .result![this.props.genericAssayType];

            if (genericAssayBinaryEnrichmentProfiles !== undefined) {
                profileList = profileList.concat(
                    genericAssayBinaryEnrichmentProfiles
                );
            }
            if (genericAssayCategoricalEnrichmentProfiles !== undefined) {
                profileList = profileList.concat(
                    genericAssayCategoricalEnrichmentProfiles
                );
            }
            if (genericAssayEnrichmentProfiles !== undefined) {
                profileList = profileList.concat(
                    genericAssayEnrichmentProfiles
                );
            }

            if (selectedProfile.datatype == 'BINARY') {
                this.isBinary = true;
                this.isCategorical = false;
                this.isNumerical = false;
            } else if (selectedProfile.datatype == 'CATEGORICAL') {
                this.isBinary = false;
                this.isCategorical = true;
                this.isNumerical = false;
            } else {
                this.isBinary = false;
                this.isCategorical = false;
                this.isNumerical = true;
            }

            return (
                <div data-test="GroupComparisonGenericAssayEnrichments">
                    <EnrichmentsDataSetDropdown
                        dataSets={profileList}
                        onChange={this.onChangeProfile}
                        selectedProfileByStudyId={
                            this.props.store
                                .selectedAllGenericAssayEnrichmentProfileMapGroupedByGenericAssayType
                                .result![this.props.genericAssayType]
                        }
                        alwaysShow={true}
                        studies={this.props.store.studies.result!}
                        showDescription={true}
                    />
                    {this.isBinary && (
                        <GenericAssayBinaryEnrichmentsContainer
                            data={
                                this.props.store
                                    .gaBinaryEnrichmentDataByAssayType.result![
                                    this.props.genericAssayType
                                ].result
                            }
                            groups={
                                this.props.store
                                    .gaBinaryEnrichmentGroupsByAssayType
                                    .result![this.props.genericAssayType]
                            }
                            selectedProfile={selectedProfile}
                            alteredVsUnalteredMode={false}
                            sampleKeyToSample={
                                this.props.store.sampleKeyToSample.result!
                            }
                            genericAssayType={this.props.genericAssayType}
                        />
                    )}
                    {this.isCategorical && (
                        <GenericAssayCategoricalEnrichmentsContainer
                            data={
                                this.props.store
                                    .gaCategoricalEnrichmentDataByAssayType
                                    .result![this.props.genericAssayType].result
                            }
                            groups={
                                this.props.store
                                    .gaCategoricalEnrichmentGroupsByAssayType
                                    .result![this.props.genericAssayType]
                            }
                            selectedProfile={selectedProfile}
                            alteredVsUnalteredMode={false}
                            sampleKeyToSample={
                                this.props.store.sampleKeyToSample.result!
                            }
                            genericAssayType={this.props.genericAssayType}
                            dataStore={this.props.store}
                        />
                    )}
                    {this.isNumerical && (
                        <GenericAssayEnrichmentsContainer
                            data={
                                this.props.store.gaEnrichmentDataByAssayType
                                    .result![this.props.genericAssayType].result
                            }
                            groups={
                                this.props.store.gaEnrichmentGroupsByAssayType
                                    .result![this.props.genericAssayType]
                            }
                            selectedProfile={selectedProfile}
                            alteredVsUnalteredMode={false}
                            sampleKeyToSample={
                                this.props.store.sampleKeyToSample.result!
                            }
                            genericAssayType={this.props.genericAssayType}
                        />
                    )}
                </div>
            );
        },
        renderPending: () => (
            <Loader center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    render() {
        return this.tabUI.component;
    }
}
