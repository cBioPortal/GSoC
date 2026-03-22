import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { MakeMobxView } from '../../shared/components/MobxView';
import EnrichmentsDataSetDropdown from '../resultsView/enrichments/EnrichmentsDataSetDropdown';
import LoadingIndicator from '../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../shared/components/ErrorMessage';
import ExpressionEnrichmentContainer from '../resultsView/enrichments/ExpressionEnrichmentsContainer';
import { MakeEnrichmentsTabUI } from './GroupComparisonUtils';
import _ from 'lodash';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';
import { EnrichmentType } from 'pages/resultsView/enrichments/EnrichmentsUtil';

export interface IMRNAEnrichmentsProps {
    store: ComparisonStore;
    resultsViewMode?: boolean;
}

@observer
export default class MRNAEnrichments extends React.Component<
    IMRNAEnrichmentsProps,
    {}
> {
    @autobind
    private onChangeProfile(profileMap: {
        [studyId: string]: MolecularProfile;
    }) {
        this.props.store.setMRNAEnrichmentProfileMap(profileMap);
    }

    readonly tabUI = MakeEnrichmentsTabUI(
        () => this.props.store,
        () => this.enrichmentsUI,
        'mRNA',
        true,
        true,
        false
    );

    readonly enrichmentsUI = MakeMobxView({
        await: () => [
            this.props.store.mRNAEnrichmentData,
            this.props.store.selectedmRNAEnrichmentProfileMap,
            this.props.store.mrnaEnrichmentAnalysisGroups,
            this.props.store.studies,
            this.props.store.sampleKeyToSample,
            this.props.store.mRNAEnrichmentProfiles,
        ],
        render: () => {
            // since mRNA enrichments tab is enabled only for one study, selectedProteinEnrichmentProfileMap
            // would contain only one key.
            const studyIds = Object.keys(
                this.props.store.selectedmRNAEnrichmentProfileMap.result!
            );
            const selectedProfile = this.props.store
                .selectedmRNAEnrichmentProfileMap.result![studyIds[0]];
            return (
                <div data-test="GroupComparisonMRNAEnrichments">
                    <EnrichmentsDataSetDropdown
                        dataSets={
                            this.props.store.mRNAEnrichmentProfiles.result!
                        }
                        onChange={this.onChangeProfile}
                        selectedProfileByStudyId={
                            this.props.store.selectedmRNAEnrichmentProfileMap
                                .result!
                        }
                        alwaysShow={true}
                        studies={this.props.store.studies.result!}
                        showDescription={true}
                    />
                    <ExpressionEnrichmentContainer
                        data={this.props.store.mRNAEnrichmentData.result!}
                        groups={
                            this.props.store.mrnaEnrichmentAnalysisGroups.result
                        }
                        selectedProfile={selectedProfile}
                        alteredVsUnalteredMode={false}
                        sampleKeyToSample={
                            this.props.store.sampleKeyToSample.result!
                        }
                        isGeneCheckBoxEnabled={this.props.resultsViewMode}
                        enrichmentType={EnrichmentType.MRNA_EXPRESSION}
                    />
                </div>
            );
        },
        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    render() {
        return this.tabUI.component;
    }
}
