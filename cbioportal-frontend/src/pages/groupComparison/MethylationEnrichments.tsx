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

export interface IMethylationEnrichmentsProps {
    store: ComparisonStore;
    resultsViewMode?: boolean;
}

@observer
export default class MethylationEnrichments extends React.Component<
    IMethylationEnrichmentsProps,
    {}
> {
    @autobind
    private onChangeProfile(profileMap: {
        [studyId: string]: MolecularProfile;
    }) {
        this.props.store.setMethylationEnrichmentProfileMap(profileMap);
    }

    readonly tabUI = MakeEnrichmentsTabUI(
        () => this.props.store,
        () => this.enrichmentsUI,
        'methylation',
        true,
        true,
        false
    );

    readonly enrichmentsUI = MakeMobxView({
        await: () => [
            this.props.store.methylationEnrichmentData,
            this.props.store.selectedMethylationEnrichmentProfileMap,
            this.props.store.methylationEnrichmentAnalysisGroups,
            this.props.store.studies,
            this.props.store.methylationEnrichmentProfiles,
        ],
        render: () => {
            // since methylation enrichments tab is enabled only for one study, selectedMethylationEnrichmentProfileMap
            // would contain only one key.
            const studyIds = Object.keys(
                this.props.store.selectedMethylationEnrichmentProfileMap.result!
            );
            const selectedProfile = this.props.store
                .selectedMethylationEnrichmentProfileMap.result![studyIds[0]];
            return (
                <div data-test="GroupComparisonMethylationEnrichments">
                    <EnrichmentsDataSetDropdown
                        dataSets={
                            this.props.store.methylationEnrichmentProfiles
                                .result!
                        }
                        onChange={this.onChangeProfile}
                        selectedProfileByStudyId={
                            this.props.store
                                .selectedMethylationEnrichmentProfileMap.result!
                        }
                        alwaysShow={true}
                        studies={this.props.store.studies.result!}
                        showDescription={true}
                    />
                    <ExpressionEnrichmentContainer
                        data={
                            this.props.store.methylationEnrichmentData.result!
                        }
                        groups={
                            this.props.store.methylationEnrichmentAnalysisGroups
                                .result
                        }
                        selectedProfile={selectedProfile}
                        alteredVsUnalteredMode={false}
                        sampleKeyToSample={
                            this.props.store.sampleKeyToSample.result!
                        }
                        isGeneCheckBoxEnabled={this.props.resultsViewMode}
                        enrichmentType={EnrichmentType.DNA_METHYLATION}
                        groupsSelectorPlaceholder={'High methylation in ...'}
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
