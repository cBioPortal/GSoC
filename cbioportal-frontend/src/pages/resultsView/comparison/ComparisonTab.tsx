import * as React from 'react';
import { observer } from 'mobx-react';
import { action, computed, makeObservable, observable } from 'mobx';
import { MakeMobxView } from '../../../shared/components/MobxView';
import { MSKTab, MSKTabs } from '../../../shared/components/MSKTabs/MSKTabs';
import Overlap from '../../groupComparison/Overlap';
import ClinicalData from '../../groupComparison/ClinicalData';
import MRNAEnrichments from '../../groupComparison/MRNAEnrichments';
import ProteinEnrichments from '../../groupComparison/ProteinEnrichments';
import LoadingIndicator from '../../../shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from '../../../shared/components/ErrorMessage';
import { trackEvent } from '../../../shared/lib/tracking';
import ReactSelect from 'react-select';
import ResultsViewURLWrapper from '../ResultsViewURLWrapper';
import { OverlapStrategy } from '../../../shared/lib/comparison/ComparisonStore';
import ResultsViewComparisonStore from './ResultsViewComparisonStore';
import { AppStore } from '../../../AppStore';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import { ResultsViewComparisonSubTab } from '../ResultsViewPageHelpers';
import {
    GENOMIC_ALTERATIONS_TAB_NAME,
    GroupComparisonTab,
} from '../../groupComparison/GroupComparisonTabs';
import Survival from '../../groupComparison/Survival';
import AlterationFilterWarning from '../../../shared/components/banners/AlterationFilterWarning';
import OqlStatusBanner from '../../../shared/components/banners/OqlStatusBanner';
import groupComparisonStyles from '../../../pages/groupComparison/styles.module.scss';
import GroupSelector from '../../groupComparison/groupSelector/GroupSelector';
import CaseFilterWarning from '../../../shared/components/banners/CaseFilterWarning';
import MethylationEnrichments from 'pages/groupComparison/MethylationEnrichments';
import AlterationEnrichments from 'pages/groupComparison/AlterationEnrichments';
import GenericAssayEnrichmentCollections from 'pages/groupComparison/GenericAssayEnrichmentCollections';
import AlterationEnrichmentTypeSelector from 'shared/lib/comparison/AlterationEnrichmentTypeSelector';
import styles from 'pages/resultsView/comparison/styles.module.scss';
import { getServerConfig } from 'config/config';
import { AlterationFilterMenuSection } from 'pages/groupComparison/GroupComparisonUtils';
import { getSortedGenericAssayAllTabSpecs } from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';

export interface IComparisonTabProps {
    urlWrapper: ResultsViewURLWrapper;
    appStore: AppStore;
    store: ResultsViewPageStore;
}

@observer
export default class ComparisonTab extends React.Component<
    IComparisonTabProps,
    {}
> {
    @observable.ref private store: ResultsViewComparisonStore;

    constructor(props: IComparisonTabProps) {
        super(props);
        makeObservable(this);
        (window as any).comparisonTab = this;
        this.store = new ResultsViewComparisonStore(
            this.props.appStore,
            this.props.urlWrapper,
            this.props.store
        );
    }

    componentWillUnmount() {
        this.store && this.store.destroy();
    }

    readonly overlapStrategySelector = MakeMobxView({
        await: () => [this.store.overlapComputations],
        render: () => {
            if (
                !this.store.overlapComputations.result!.totalSampleOverlap &&
                !this.store.overlapComputations.result!.totalPatientOverlap
            ) {
                return null;
            } else {
                const includeLabel = 'Include overlapping samples and patients';
                const excludeLabel = 'Exclude overlapping samples and patients';
                return (
                    <div style={{ minWidth: 355, width: 355, zIndex: 20 }}>
                        <ReactSelect
                            aria-label="Overlap Strategy Selection"
                            name="select overlap strategy"
                            onChange={(option: any | null) => {
                                if (option) {
                                    this.onOverlapStrategySelect(option);
                                }
                            }}
                            options={[
                                {
                                    label: includeLabel,
                                    value: OverlapStrategy.INCLUDE,
                                },
                                {
                                    label: excludeLabel,
                                    value: OverlapStrategy.EXCLUDE,
                                },
                            ]}
                            clearable={false}
                            searchable={false}
                            value={{
                                label:
                                    this.store.overlapStrategy ===
                                    OverlapStrategy.EXCLUDE
                                        ? excludeLabel
                                        : includeLabel,
                                value: this.store.overlapStrategy,
                            }}
                        />
                    </div>
                );
            }
        },
    });

    @computed get alterationEnrichmentTabName() {
        return GENOMIC_ALTERATIONS_TAB_NAME;
    }

    @action.bound
    public onOverlapStrategySelect(option: any) {
        trackEvent({
            category: 'resultsView',
            action: 'setComparisonTabOverlapStrategy',
            label: option.value,
        });
        this.store.updateOverlapStrategy(option.value as OverlapStrategy);
    }

    readonly tabs = MakeMobxView({
        await: () => [],
        render: () => {
            return (
                <MSKTabs
                    unmountOnHide={false}
                    activeTabId={this.props.urlWrapper.subTab}
                    onTabClick={this.props.urlWrapper.setSubTab}
                    className="secondaryNavigation comparisonTabSubTabs"
                >
                    <MSKTab id={GroupComparisonTab.OVERLAP} linkText="Overlap">
                        <Overlap store={this.store} />
                    </MSKTab>
                    <MSKTab
                        id={GroupComparisonTab.SURVIVAL}
                        linkText="Survival"
                        anchorClassName={
                            !this.store.showSurvivalTab ||
                            this.store.survivalTabUnavailable
                                ? 'hidden'
                                : ''
                        }
                        pending={
                            this.store.survivalClinicalDataExists.isPending
                        }
                    >
                        <Survival
                            store={this.store}
                            key={`gc-survival-${this.store.overlapStrategy}`}
                        />
                    </MSKTab>
                    <MSKTab
                        id={GroupComparisonTab.CLINICAL}
                        pending={this.store.activeGroups.isPending}
                        linkText="Clinical"
                        anchorClassName={
                            this.store.clinicalTabUnavailable ? 'greyedOut' : ''
                        }
                    >
                        <ClinicalData
                            store={this.store}
                            key={`gc-clinical-data-${this.store.overlapStrategy}`}
                        />
                    </MSKTab>
                    <MSKTab
                        id={ResultsViewComparisonSubTab.ALTERATIONS}
                        pending={this.store.activeGroups.isPending}
                        linkText={this.alterationEnrichmentTabName}
                        anchorClassName={
                            !this.store.showAlterationsTab ||
                            this.store.alterationsTabUnavailable
                                ? 'hidden'
                                : ''
                        }
                    >
                        {(this.store.activeGroups.isComplete &&
                            this.store.activeGroups.result!.length > 1 &&
                            getServerConfig().skin_show_settings_menu && (
                                <AlterationFilterMenuSection
                                    store={this.store}
                                    updateSelectedEnrichmentEventTypes={
                                        this.store
                                            .updateSelectedEnrichmentEventTypes
                                    }
                                />
                            )) || (
                            <AlterationEnrichmentTypeSelector
                                classNames={
                                    styles.inlineAlterationTypeSelectorMenu
                                }
                                store={this.store}
                                updateSelectedEnrichmentEventTypes={
                                    this.store
                                        .updateSelectedEnrichmentEventTypes
                                }
                                showMutations={
                                    this.store.hasMutationEnrichmentData
                                }
                                showCnas={this.store.hasCnaEnrichmentData}
                                showStructuralVariants={
                                    this.store.hasStructuralVariantData
                                }
                            />
                        )}
                        <AlterationEnrichments
                            store={this.store}
                            resultsViewStore={this.props.store}
                        />
                    </MSKTab>
                    <MSKTab
                        id={GroupComparisonTab.MRNA}
                        pending={this.store.mRNAEnrichmentProfiles.isPending}
                        linkText="mRNA"
                        anchorClassName={
                            !this.store.showMRNATab ||
                            this.store.mRNATabUnavailable
                                ? 'hidden'
                                : ''
                        }
                    >
                        <MRNAEnrichments
                            store={this.store}
                            resultsViewMode={true}
                        />
                    </MSKTab>
                    <MSKTab
                        id={GroupComparisonTab.PROTEIN}
                        pending={this.store.proteinEnrichmentProfiles.isPending}
                        linkText="Protein"
                        anchorClassName={
                            !this.store.showProteinTab ||
                            this.store.proteinTabUnavailable
                                ? 'hidden'
                                : ''
                        }
                    >
                        <ProteinEnrichments
                            store={this.store}
                            resultsViewMode={true}
                        />
                    </MSKTab>
                    <MSKTab
                        id={GroupComparisonTab.DNAMETHYLATION}
                        pending={
                            this.store.methylationEnrichmentProfiles.isPending
                        }
                        linkText="DNA Methylation"
                        anchorClassName={
                            !this.store.showMethylationTab ||
                            this.store.methylationTabUnavailable
                                ? 'hidden'
                                : ''
                        }
                    >
                        <MethylationEnrichments
                            store={this.store}
                            resultsViewMode={true}
                        />
                    </MSKTab>
                    {(this.store.showGenericAssayCategoricalTab ||
                        this.store.showGenericAssayBinaryTab ||
                        this.store.showGenericAssayTab) &&
                        getSortedGenericAssayAllTabSpecs(
                            this.store
                                .genericAssayAllEnrichmentProfilesGroupedByGenericAssayType
                                .result
                        ).map(genericAssayAllTabSpecs => {
                            return (
                                <MSKTab
                                    id={`${
                                        GroupComparisonTab.GENERIC_ASSAY_PREFIX
                                    }_${genericAssayAllTabSpecs.genericAssayType.toLowerCase()}`}
                                    linkText={genericAssayAllTabSpecs.linkText}
                                    anchorClassName={
                                        this.store
                                            .genericAssayCategoricalTabUnavailable &&
                                        this.store
                                            .genericAssayBinaryTabUnavailable &&
                                        this.store.genericAssayTabUnavailable
                                            ? 'hidden'
                                            : ''
                                    }
                                >
                                    <GenericAssayEnrichmentCollections
                                        store={this.store}
                                        genericAssayType={
                                            genericAssayAllTabSpecs.genericAssayType
                                        }
                                        resultsViewMode={true}
                                    />
                                </MSKTab>
                            );
                        })}
                </MSKTabs>
            );
        },
        renderPending: () => (
            <LoadingIndicator center={true} isLoading={true} size={'big'} />
        ),
        renderError: () => <ErrorMessage />,
    });

    render() {
        if (!this.store) {
            return null;
        }

        return (
            <div data-test="ComparisonTabDiv">
                <LoadingIndicator
                    center={true}
                    isLoading={this.store.newSessionPending}
                    size={'big'}
                />
                <div
                    className={'tabMessageContainer'}
                    style={{ marginBottom: 10 }}
                >
                    <OqlStatusBanner
                        className="comparison-oql-status-banner"
                        queryContainsOql={this.props.store.queryContainsOql}
                        tabReflectsOql={true}
                    />
                    <AlterationFilterWarning
                        driverAnnotationSettings={
                            this.props.store.driverAnnotationSettings
                        }
                        includeGermlineMutations={
                            this.props.store.includeGermlineMutations
                        }
                        mutationsReportByGene={
                            this.props.store.mutationsReportByGene
                        }
                        oqlFilteredMutationsReport={
                            this.props.store.oqlFilteredMutationsReport
                        }
                        oqlFilteredMolecularDataReport={
                            this.props.store.oqlFilteredMolecularDataReport
                        }
                        oqlFilteredStructuralVariantsReport={
                            this.props.store.oqlFilteredStructuralVariantsReport
                        }
                    />
                    <CaseFilterWarning
                        samples={this.props.store.samples}
                        filteredSamples={this.props.store.filteredSamples}
                        patients={this.props.store.patients}
                        filteredPatients={this.props.store.filteredPatients}
                        hideUnprofiledSamples={
                            this.props.store.hideUnprofiledSamples
                        }
                    />
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingBottom: 25,
                    }}
                >
                    <div className={groupComparisonStyles.headerControls}>
                        <GroupSelector
                            store={this.store}
                            groupCollapseThreshold={40}
                            isGroupDeletable={this.store.isGroupDeletable}
                        />
                    </div>
                    <div>{this.overlapStrategySelector.component}</div>
                </div>
                {this.tabs.component}
            </div>
        );
    }
}
