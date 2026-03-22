import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import GroupComparisonStore from './GroupComparisonStore';
import _ from 'lodash';
import {
    MUTATIONS_NOT_ENOUGH_GROUPS_MSG,
    MUTATIONS_TOO_MANY_GROUPS_MSG,
    NO_MUTATIONS_AVAILABLE_MSG,
} from './GroupComparisonUtils';
import { MakeMobxView } from 'shared/components/MobxView';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from 'shared/components/ErrorMessage';
import { LollipopGeneSelector } from './LollipopGeneSelector';
import GroupComparisonMutationMapperWrapper from './GroupComparisonMutationMapperWrapper';
import OverlapExclusionIndicator from './OverlapExclusionIndicator';
import { MSKTab, MSKTabs } from 'shared/components/MSKTabs/MSKTabs';
import GroupComparisonURLWrapper from './GroupComparisonURLWrapper';
import { AxisScale } from 'react-mutation-mapper';
import {
    ANNOTATED_PROTEIN_IMPACT_FILTER_TYPE,
    createAnnotatedProteinImpactTypeFilter,
} from 'shared/lib/MutationUtils';
import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';

interface IGroupComparisonMutationsTabProps {
    store: GroupComparisonStore;
    urlWrapper: GroupComparisonURLWrapper;
}

@observer
export default class GroupComparisonMutationsTab extends React.Component<
    IGroupComparisonMutationsTabProps,
    {}
> {
    constructor(props: IGroupComparisonMutationsTabProps) {
        super(props);
        makeObservable(this);
    }

    @action.bound
    protected handleGeneChange(id: string) {
        this.props.urlWrapper.updateURL({
            selectedGene: id,
        });
    }

    @computed get tabs() {
        return this.props.store.genesSortedByMutationFrequency
            .result!.slice(0, 10)
            .map(g => <MSKTab key={`comp-tab-${g}`} id={g} linkText={g} />);
    }

    @computed get activeTabId(): string | undefined {
        let activeTabId;
        if (this.props.store.activeMutationMapperGene) {
            activeTabId = this.props.store.activeMutationMapperGene
                .hugoGeneSymbol;
        }
        return activeTabId;
    }

    @action.bound
    private onScaleToggle(selectedScale: AxisScale) {
        this.props.urlWrapper.updateURL({
            axisMode: selectedScale,
        });
    }

    @computed get isPutativeDriver() {
        return this.props.store.driverAnnotationSettings.driversAnnotated
            ? (m: AnnotatedMutation) => m.putativeDriver
            : undefined;
    }

    readonly tabUI = MakeMobxView({
        await: () => [
            this.props.store.genes,
            this.props.store.genesWithMutations,
            this.props.store.genesSortedByMutationFrequency,
        ],
        render: () => {
            // We only want 2 groups for our mirrored lollipop plot. Display message if not 2 groups
            if (this.props.store.activeGroups.result!.length < 2) {
                return (
                    <div
                        className="alert alert-info"
                        data-test="NotEnoughGroupsAlert"
                    >
                        {MUTATIONS_NOT_ENOUGH_GROUPS_MSG}
                    </div>
                );
            } else if (this.props.store.activeGroups.result!.length > 2) {
                return (
                    <div
                        className="alert alert-info"
                        data-test="TooManyGroupsAlert"
                    >
                        {MUTATIONS_TOO_MANY_GROUPS_MSG}
                    </div>
                );
            } else if (!this.props.store.activeMutationMapperGene) {
                return (
                    <div
                        className="alert alert-info"
                        data-test="NoMutationsAvailableAlert"
                    >
                        {NO_MUTATIONS_AVAILABLE_MSG}
                    </div>
                );
            } else {
                return (
                    <>
                        {/* {!this.props.store.userSelectedMutationMapperGene ? (
                            <div className="alert alert-info">
                                <div>
                                    Gene with highest frequency is displayed by
                                    default. Gene can be changed in the dropdown
                                    below.
                                </div>
                                <div>
                                    The top 10 genes with highest frequency are
                                    shown below the dropdown and can be selected by
                                    clicking on their respective tabs.
                                </div>
                            </div>
                        ) : (
                            <div className="alert alert-info">
                                The top 10 genes with highest frequency are shown
                                below the dropdown and can be selected by clicking
                                on their respective tabs.
                            </div>
                        )} */}
                        <OverlapExclusionIndicator
                            store={this.props.store}
                            only="sample"
                        />
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <LollipopGeneSelector
                                store={this.props.store}
                                genes={this.props.store.genes.result!}
                                genesWithMutations={
                                    this.props.store.genesWithMutations.result!
                                }
                                handleGeneChange={this.handleGeneChange}
                                key={
                                    'comparisonLollipopGene' +
                                    this.props.store.activeMutationMapperGene
                                        .hugoGeneSymbol
                                }
                            />
                            <div style={{ paddingRight: 5 }}>
                                Highest Frequency:
                            </div>
                            <div>
                                <MSKTabs
                                    activeTabId={this.activeTabId}
                                    onTabClick={(id: string) =>
                                        this.handleGeneChange(id)
                                    }
                                    className="pillTabs comparisonMutationMapperTabs"
                                    tabButtonStyle="pills"
                                    defaultTabId={false}
                                >
                                    {this.tabs}
                                </MSKTabs>
                            </div>
                        </div>
                        <GroupComparisonMutationMapperWrapper
                            store={this.props.store}
                            onScaleToggle={this.onScaleToggle}
                            mutations={_(
                                this.props.store.mutationsByGroup.result!
                            )
                                .values()
                                .flatten()
                                .value()}
                            filters={{
                                groupFilters: _.keys(
                                    this.props.store.mutationsByGroup.result!
                                ).map(group => ({
                                    group: group,
                                    filter: {
                                        type: 'GroupComparisonFilter',
                                        values: [group],
                                    },
                                })),
                                filterAppliersOverride: {
                                    GroupComparisonFilter: this.props.store
                                        .shouldApplySampleIdFilter,
                                    [ANNOTATED_PROTEIN_IMPACT_FILTER_TYPE]: createAnnotatedProteinImpactTypeFilter(
                                        this.isPutativeDriver
                                    ),
                                },
                            }}
                        />
                    </>
                );
            }
        },
        renderPending: () => (
            <LoadingIndicator isLoading={true} center={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    public render() {
        return this.tabUI.component;
    }
}
