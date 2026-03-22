import * as React from 'react';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { MakeMobxView } from '../../shared/components/MobxView';
import EnrichmentsDataSetDropdown from '../resultsView/enrichments/EnrichmentsDataSetDropdown';
import ExpressionEnrichmentContainer from '../resultsView/enrichments/ExpressionEnrichmentsContainer';
import Loader from '../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../shared/components/ErrorMessage';
import { MakeEnrichmentsTabUI } from './GroupComparisonUtils';
import _ from 'lodash';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';
import { EnrichmentType } from 'pages/resultsView/enrichments/EnrichmentsUtil';

export interface IProteinEnrichmentsProps {
    store: ComparisonStore;
    resultsViewMode?: boolean;
}

@observer
export default class ProteinEnrichments extends React.Component<
    IProteinEnrichmentsProps,
    {}
> {
    @autobind
    private onChangeProfile(profileMap: {
        [studyId: string]: MolecularProfile;
    }) {
        this.props.store.setProteinEnrichmentProfileMap(profileMap);
    }

    readonly tabUI = MakeEnrichmentsTabUI(
        () => this.props.store,
        () => this.enrichmentsUI,
        'protein',
        true,
        true,
        false
    );

    readonly enrichmentsUI = MakeMobxView({
        await: () => [
            this.props.store.proteinEnrichmentData,
            this.props.store.selectedProteinEnrichmentProfileMap,
            this.props.store.proteinEnrichmentAnalysisGroups,
            this.props.store.studies,
            this.props.store.proteinEnrichmentProfiles,
        ],
        render: () => {
            // since protein enrichments tab is enabled only for one study, selectedProteinEnrichmentProfileMap
            // would contain only one key.
            const studyIds = Object.keys(
                this.props.store.selectedProteinEnrichmentProfileMap.result!
            );
            const selectedProfile = this.props.store
                .selectedProteinEnrichmentProfileMap.result![studyIds[0]];
            return (
                <div data-test="GroupComparisonProteinEnrichments">
                    <EnrichmentsDataSetDropdown
                        dataSets={
                            this.props.store.proteinEnrichmentProfiles.result!
                        }
                        onChange={this.onChangeProfile}
                        selectedProfileByStudyId={
                            this.props.store.selectedProteinEnrichmentProfileMap
                                .result!
                        }
                        alwaysShow={true}
                        studies={this.props.store.studies.result!}
                        showDescription={true}
                    />
                    <ExpressionEnrichmentContainer
                        data={this.props.store.proteinEnrichmentData.result!}
                        groups={
                            this.props.store.proteinEnrichmentAnalysisGroups
                                .result
                        }
                        selectedProfile={selectedProfile}
                        alteredVsUnalteredMode={false}
                        sampleKeyToSample={
                            this.props.store.sampleKeyToSample.result!
                        }
                        isGeneCheckBoxEnabled={this.props.resultsViewMode}
                        enrichmentType={EnrichmentType.PROTEIN_EXPRESSION}
                    />
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
