import * as React from 'react';
import { observer } from 'mobx-react';
import AlterationEnrichmentContainer from '../resultsView/enrichments/AlterationEnrichmentsContainer';
import { MakeMobxView } from '../../shared/components/MobxView';
import LoadingIndicator from '../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../shared/components/ErrorMessage';
import { MakeEnrichmentsTabUI } from './GroupComparisonUtils';
import ComparisonStore from '../../shared/lib/comparison/ComparisonStore';
import { ResultsViewPageStore } from '../resultsView/ResultsViewPageStore';
import { GENOMIC_ALTERATIONS_TAB_NAME } from 'pages/groupComparison/GroupComparisonTabs';
import { getServerConfig } from 'config/config';

export interface IAlterationEnrichmentsProps {
    store: ComparisonStore;
    resultsViewStore?: ResultsViewPageStore;
}

@observer
export default class AlterationEnrichments extends React.Component<
    IAlterationEnrichmentsProps,
    {}
> {
    constructor(props: IAlterationEnrichmentsProps) {
        super(props);
    }

    readonly tabUI = MakeEnrichmentsTabUI(
        () => this.props.store,
        () => this.enrichmentsUI,
        'alterations',
        true,
        true,
        true
    );

    private useInlineTypeSelectorMenu = !getServerConfig()
        .skin_show_settings_menu;

    readonly enrichmentsUI = MakeMobxView({
        await: () => [
            this.props.store.alterationEnrichmentRowData,
            this.props.store.alterationsEnrichmentData,
            this.props.store.alterationsEnrichmentAnalysisGroups,
            this.props.store.selectedStudyMutationEnrichmentProfileMap,
            this.props.store.selectedStudyCopyNumberEnrichmentProfileMap,
            this.props.store.selectedStudyStructuralVariantEnrichmentProfileMap,
            this.props.store.studies,
        ],
        render: () => {
            let headerName = GENOMIC_ALTERATIONS_TAB_NAME;
            return (
                <div data-test="GroupComparisonAlterationEnrichments">
                    <AlterationEnrichmentContainer
                        data={
                            this.props.store.alterationsEnrichmentData.result!
                        }
                        groups={
                            this.props.store.alterationsEnrichmentAnalysisGroups
                                .result
                        }
                        alteredVsUnalteredMode={false}
                        headerName={headerName}
                        patientLevelEnrichments={
                            this.props.store.usePatientLevelEnrichments
                        }
                        onSetPatientLevelEnrichments={
                            this.props.store.setUsePatientLevelEnrichments
                        }
                        store={this.props.resultsViewStore}
                        comparisonStore={this.props.store}
                        dashToRight={this.useInlineTypeSelectorMenu}
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
