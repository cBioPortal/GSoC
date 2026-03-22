import * as React from 'react';
import _ from 'lodash';
import $ from 'jquery';
import URL from 'url';
import { inject, observer } from 'mobx-react';
import {
    action,
    computed,
    observable,
    runInAction,
    makeObservable,
    autorun,
} from 'mobx';
import { ResultsViewPageStore } from './ResultsViewPageStore';
import CancerSummaryContainer from 'pages/resultsView/cancerSummary/CancerSummaryContainer';
import Mutations from './mutation/Mutations';
import MutualExclusivityTab from './mutualExclusivity/MutualExclusivityTab';
import DownloadTab from './download/DownloadTab';
import { getServerConfig, ServerConfigHelpers } from 'config/config';
import CNSegments from './cnSegments/CNSegments';
import StructuralVariants from 'pages/resultsView/structuralVariant/StructuralVariants';
import './styles.scss';
import ResultsViewOncoprint from 'shared/components/oncoprint/ResultsViewOncoprint';
import QuerySummary from './querySummary/QuerySummary';
import PlotsTab from 'shared/components/plots/PlotsTab';
import { MSKTab, MSKTabs } from '../../shared/components/MSKTabs/MSKTabs';
import { PageLayout } from '../../shared/components/PageLayout/PageLayout';
import autobind from 'autobind-decorator';
import { ITabConfiguration } from '../../shared/model/ITabConfiguration';
import {
    DownloadControlOption,
    getBrowserWindow,
    remoteData,
} from 'cbioportal-frontend-commons';
import CoExpressionTab from './coExpression/CoExpressionTab';
import Helmet from 'react-helmet';
import {
    parseConfigDisabledTabs,
    ResultsViewTab,
} from './ResultsViewPageHelpers';
import {
    buildResultsViewPageTitle,
    doesQueryHaveCNSegmentData,
} from './ResultsViewPageStoreUtils';
import { AppStore } from '../../AppStore';
import { trackQuery } from '../../shared/lib/tracking';
import QueryAndDownloadTabs from 'shared/components/query/QueryAndDownloadTabs';
import ExtendedRouterStore from 'shared/lib/ExtendedRouterStore';
import GeneSymbolValidationError from 'shared/components/query/GeneSymbolValidationError';
import ResultsViewURLWrapper, {
    USER_SETTINGS_QUERY_PARAM,
} from 'pages/resultsView/ResultsViewURLWrapper';
import setWindowVariable from 'shared/lib/setWindowVariable';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { onMobxPromise } from 'cbioportal-frontend-commons';
import { createQueryStore } from 'shared/lib/createQueryStore';
import {
    handleLegacySubmission,
    handlePostedSubmission,
} from 'shared/lib/redirectHelpers';
import ComparisonTab from './comparison/ComparisonTab';
import OQLTextArea, {
    GeneBoxType,
} from 'shared/components/GeneSelectionBox/OQLTextArea';
import browser from 'bowser';
import { QueryStore } from '../../shared/components/query/QueryStore';
import UserMessager, {
    IUserMessage,
} from 'shared/components/userMessager/UserMessage';
import { HelpWidget } from 'shared/components/HelpWidget/HelpWidget';
import {
    buildCustomTabs,
    prepareCustomTabConfigurations,
} from 'shared/lib/customTabs/customTabHelpers';
import { buildCBioPortalPageUrl } from 'shared/api/urls';
import PathWayMapperContainer from 'pages/resultsView/pathwayMapper/PathWayMapperContainer';

export function initStore(
    appStore: AppStore,
    urlWrapper: ResultsViewURLWrapper
) {
    const resultsViewPageStore = new ResultsViewPageStore(appStore, urlWrapper);

    setWindowVariable('resultsViewPageStore', resultsViewPageStore);

    autorun(() => {
        if (
            resultsViewPageStore.studyIds.isComplete &&
            resultsViewPageStore.oqlText
        ) {
            trackQuery(
                resultsViewPageStore.studyIds.result!,
                resultsViewPageStore.oqlText,
                resultsViewPageStore.hugoGeneSymbols,
                resultsViewPageStore.queriedVirtualStudies.result!.length > 0
            );
        }
    });

    return resultsViewPageStore;
}

function addOnBecomeVisibleListener(callback: () => void) {
    $('#oncoprint-result-tab').click(callback);
}

export interface IResultsViewPageProps {
    params: any; // from react router
}

@observer
export default class ResultsViewPage extends React.Component<
    IResultsViewPageProps,
    {}
> {
    private resultsViewPageStore: ResultsViewPageStore;

    private urlWrapper: ResultsViewURLWrapper;

    @observable.ref quickOQLQueryStore: QueryStore | null = null;

    @observable showTabs = true;

    constructor(props: IResultsViewPageProps) {
        super(props);

        makeObservable(this);

        this.urlWrapper = new ResultsViewURLWrapper(this.routing);

        handleLegacySubmission(this.urlWrapper);

        handlePostedSubmission(this.urlWrapper);

        setWindowVariable('urlWrapper', this.urlWrapper);

        if (this.urlWrapper.hasSessionId) {
            onMobxPromise(this.urlWrapper.remoteSessionData, () => {
                this.resultsViewPageStore = initStore(
                    this.appStore,
                    this.urlWrapper
                );
            });
        } else {
            this.resultsViewPageStore = initStore(
                this.appStore,
                this.urlWrapper
            );
        }
    }

    // this is temporary to allow us to
    // get rid of @inject, which is conflicting
    // with react context
    // ultimately should be replaced with react context
    private get appStore(): AppStore {
        return getBrowserWindow().globalStores.appStore as AppStore;
    }

    private get routing(): ExtendedRouterStore {
        return getBrowserWindow().globalStores.routing as ExtendedRouterStore;
    }

    componentDidMount() {
        // Remove bookmark user settings query param after initialization
        const newParams = _.clone(this.routing.query);
        newParams[USER_SETTINGS_QUERY_PARAM] = undefined;
        this.routing.updateRoute(newParams);
    }

    componentWillUnmount() {
        this.resultsViewPageStore.destroy();
        this.urlWrapper.destroy();
    }

    @computed
    private get tabs() {
        const store = this.resultsViewPageStore;

        const tabMap: ITabConfiguration[] = [
            {
                id: ResultsViewTab.ONCOPRINT,
                getTab: () => {
                    return (
                        <MSKTab
                            key={0}
                            id={ResultsViewTab.ONCOPRINT}
                            linkText="OncoPrint"
                        >
                            <ResultsViewOncoprint
                                divId={'oncoprintDiv'}
                                store={store}
                                urlWrapper={store.urlWrapper}
                                key={store.hugoGeneSymbols.join(',')}
                                addOnBecomeVisibleListener={
                                    addOnBecomeVisibleListener
                                }
                            />
                        </MSKTab>
                    );
                },
            },

            {
                id: ResultsViewTab.CANCER_TYPES_SUMMARY,
                getTab: () => {
                    return (
                        <MSKTab
                            key={1}
                            id={ResultsViewTab.CANCER_TYPES_SUMMARY}
                            linkText="Cancer Types Summary"
                        >
                            <CancerSummaryContainer store={store} />
                        </MSKTab>
                    );
                },
            },

            {
                id: ResultsViewTab.MUTUAL_EXCLUSIVITY,
                getTab: () => {
                    return (
                        <MSKTab
                            key={5}
                            id={ResultsViewTab.MUTUAL_EXCLUSIVITY}
                            linkText="Mutual Exclusivity"
                        >
                            <MutualExclusivityTab
                                store={store}
                                isSampleAlteredMap={store.isSampleAlteredMap}
                            />
                        </MSKTab>
                    );
                },
                hide: () => {
                    // we are using the size of isSampleAlteredMap as a proxy for the number of things we have to compare
                    return (
                        !this.resultsViewPageStore.isSampleAlteredMap
                            .isComplete ||
                        _.size(
                            this.resultsViewPageStore.isSampleAlteredMap.result
                        ) < 2
                    );
                },
            },

            {
                id: ResultsViewTab.PLOTS,
                getTab: () => {
                    return (
                        <MSKTab
                            key={12}
                            id={ResultsViewTab.PLOTS}
                            linkText={'Plots'}
                        >
                            <PlotsTab
                                filteredSamplesByDetailedCancerType={
                                    store.filteredSamplesByDetailedCancerType
                                }
                                mutations={store.mutations}
                                studies={store.studies}
                                molecularProfileIdSuffixToMolecularProfiles={
                                    store.molecularProfileIdSuffixToMolecularProfiles
                                }
                                entrezGeneIdToGene={store.entrezGeneIdToGene}
                                sampleKeyToSample={store.sampleKeyToSample}
                                genes={store.genes}
                                clinicalAttributes={
                                    store.plotClinicalAttributes
                                }
                                customAttributes={store.customAttributes}
                                genesets={store.genesets}
                                genericAssayEntitiesGroupByMolecularProfileId={
                                    store.genericAssayEntitiesGroupByMolecularProfileId
                                }
                                studyIds={store.studyIds}
                                molecularProfilesWithData={
                                    store.molecularProfilesWithData
                                }
                                molecularProfilesInStudies={
                                    store.molecularProfilesInStudies
                                }
                                annotatedCnaCache={store.annotatedCnaCache}
                                annotatedMutationCache={
                                    store.annotatedMutationCache
                                }
                                structuralVariantCache={
                                    store.structuralVariantCache
                                }
                                studyToMutationMolecularProfile={
                                    store.studyToMutationMolecularProfile
                                }
                                studyToMolecularProfileDiscreteCna={
                                    store.studyToMolecularProfileDiscreteCna
                                }
                                clinicalDataCache={store.clinicalDataCache}
                                patientKeyToFilteredSamples={
                                    store.patientKeyToFilteredSamples
                                }
                                numericGeneMolecularDataCache={
                                    store.numericGeneMolecularDataCache
                                }
                                coverageInformation={store.coverageInformation}
                                genesetMolecularDataCache={
                                    store.genesetMolecularDataCache
                                }
                                genericAssayMolecularDataCache={
                                    store.genericAssayMolecularDataCache
                                }
                                studyToStructuralVariantMolecularProfile={
                                    store.studyToStructuralVariantMolecularProfile
                                }
                                driverAnnotationSettings={
                                    store.driverAnnotationSettings
                                }
                                studyIdToStudy={store.studyIdToStudy.result}
                                structuralVariants={
                                    store.structuralVariants.result
                                }
                                hugoGeneSymbols={store.hugoGeneSymbols}
                                selectedGenericAssayEntitiesGroupByMolecularProfileId={
                                    store.selectedGenericAssayEntitiesGroupByMolecularProfileId
                                }
                                molecularProfileIdToMolecularProfile={
                                    store.molecularProfileIdToMolecularProfile
                                }
                                urlWrapper={this.urlWrapper}
                                queryContainsOql={store.queryContainsOql}
                                includeGermlineMutations={
                                    store.includeGermlineMutations
                                }
                                mutationsReportByGene={
                                    store.mutationsReportByGene
                                }
                                oqlFilteredMutationsReport={
                                    store.oqlFilteredMutationsReport
                                }
                                oqlFilteredMolecularDataReport={
                                    store.oqlFilteredMolecularDataReport
                                }
                                oqlFilteredStructuralVariantsReport={
                                    store.oqlFilteredStructuralVariantsReport
                                }
                                samples={store.samples}
                                filteredSamples={store.filteredSamples}
                                patients={store.patients}
                                filteredPatients={store.filteredPatients}
                                hideUnprofiledSamples={
                                    store.hideUnprofiledSamples
                                }
                            />
                        </MSKTab>
                    );
                },
            },

            {
                id: ResultsViewTab.MUTATIONS,
                getTab: () => {
                    return (
                        <MSKTab
                            key={3}
                            id={ResultsViewTab.MUTATIONS}
                            linkText="Mutations"
                        >
                            <Mutations
                                store={store}
                                appStore={this.appStore}
                                urlWrapper={this.urlWrapper}
                            />
                        </MSKTab>
                    );
                },
            },
            {
                id: ResultsViewTab.STRUCTURALVARIANTS,
                hide: () => {
                    return (
                        !this.resultsViewPageStore.structuralVariants
                            .isComplete ||
                        this.resultsViewPageStore.structuralVariants.result
                            .length === 0
                    );
                },
                getTab: () => {
                    return (
                        <MSKTab
                            key={13}
                            id={ResultsViewTab.STRUCTURALVARIANTS}
                            linkText={
                                <>
                                    Structural Variants&nbsp;
                                    <strong className={'beta-text'}>
                                        Beta!
                                    </strong>
                                </>
                            }
                        >
                            <StructuralVariants
                                store={store}
                                urlWrapper={this.urlWrapper}
                            />
                        </MSKTab>
                    );
                },
            },
            {
                id: ResultsViewTab.COEXPRESSION,
                hide: () => {
                    if (
                        !this.resultsViewPageStore.isThereDataForCoExpressionTab
                            .isComplete ||
                        !this.resultsViewPageStore.studies.isComplete
                    ) {
                        return true;
                    } else {
                        const tooManyStudies =
                            this.resultsViewPageStore.studies.result!.length >
                            1;
                        const noData = !this.resultsViewPageStore
                            .isThereDataForCoExpressionTab.result;
                        return tooManyStudies || noData;
                    }
                },
                getTab: () => {
                    return (
                        <MSKTab
                            key={7}
                            id={ResultsViewTab.COEXPRESSION}
                            linkText={'Co-expression'}
                        >
                            <CoExpressionTab store={store} />
                        </MSKTab>
                    );
                },
            },

            {
                id: ResultsViewTab.COMPARISON,
                hide: () => {
                    return this.resultsViewPageStore.survivalClinicalDataExists
                        .isPending;
                },
                getTab: () => {
                    const text = this.resultsViewPageStore
                        .survivalClinicalDataExists.result
                        ? 'Comparison/Survival'
                        : 'Comparison';
                    return (
                        <MSKTab
                            key={10}
                            id={ResultsViewTab.COMPARISON}
                            linkText={text}
                        >
                            <ComparisonTab
                                urlWrapper={this.urlWrapper}
                                appStore={this.appStore}
                                store={this.resultsViewPageStore}
                            />
                        </MSKTab>
                    );
                },
            },
            {
                id: ResultsViewTab.CN_SEGMENTS,
                hide: () => {
                    return (
                        !this.resultsViewPageStore.studies.isComplete ||
                        !this.resultsViewPageStore.genes.isComplete ||
                        !this.resultsViewPageStore.referenceGenes.isComplete ||
                        !doesQueryHaveCNSegmentData(
                            this.resultsViewPageStore.samples.result
                        )
                    );
                },
                getTab: () => {
                    return (
                        <MSKTab
                            key={6}
                            id={ResultsViewTab.CN_SEGMENTS}
                            linkText="CN Segments"
                            className="cnSegmentsMSKTab"
                        >
                            <CNSegments store={store} />
                        </MSKTab>
                    );
                },
            },

            {
                id: ResultsViewTab.NETWORK,
                hide: () => {
                    return true;
                },
                getTab: () => {
                    return (
                        <MSKTab
                            key={9}
                            id={ResultsViewTab.NETWORK}
                            linkText={'Network'}
                        >
                            <div className="alert alert-info">
                                The Network tab has been retired. For similar
                                functionality, please visit{' '}
                                <a
                                    href="http://www.pathwaycommons.org/pcviz/"
                                    target="_blank"
                                >
                                    http://www.pathwaycommons.org/pcviz/
                                </a>
                            </div>
                        </MSKTab>
                    );
                },
            },
            {
                id: ResultsViewTab.PATHWAYS,
                hide: () =>
                    browser.name === 'Internet Explorer' ||
                    (!getServerConfig().show_pathway_mapper &&
                        !getServerConfig().show_ndex) ||
                    !this.resultsViewPageStore.studies.isComplete,
                getTab: () => {
                    const showPathwaysTab =
                        store.filteredSequencedSampleKeysByGene.isComplete &&
                        store.oqlFilteredCaseAggregatedDataByOQLLine
                            .isComplete &&
                        store.genes.isComplete &&
                        store.samples.isComplete &&
                        store.patients.isComplete &&
                        store.coverageInformation.isComplete &&
                        store.filteredSequencedSampleKeysByGene.isComplete &&
                        store.filteredSequencedPatientKeysByGene.isComplete &&
                        store.selectedMolecularProfiles.isComplete &&
                        store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine
                            .isComplete;

                    return (
                        <MSKTab
                            key={13}
                            id={ResultsViewTab.PATHWAYS}
                            linkText={'Pathways'}
                        >
                            {showPathwaysTab ? (
                                <PathWayMapperContainer
                                    resultsViewPageStore={store}
                                    appStore={this.appStore}
                                    urlWrapper={this.urlWrapper}
                                />
                            ) : (
                                <LoadingIndicator
                                    isLoading={true}
                                    size={'big'}
                                    center={true}
                                />
                            )}
                        </MSKTab>
                    );
                },
            },
        ];

        if (
            getServerConfig().skin_hide_download_controls !==
            DownloadControlOption.HIDE_ALL
        ) {
            tabMap.push({
                id: ResultsViewTab.DOWNLOAD,
                getTab: () => {
                    return (
                        <MSKTab
                            key={11}
                            id={ResultsViewTab.DOWNLOAD}
                            linkText={'Download'}
                        >
                            <DownloadTab store={store} />
                        </MSKTab>
                    );
                },
            });
        }

        let filteredTabs = tabMap
            .filter(this.evaluateTabInclusion)
            .map(tab => tab.getTab());

        filteredTabs.push(...buildCustomTabs(this.customTabs));

        return filteredTabs;
    }

    @computed get customTabs() {
        return prepareCustomTabConfigurations(
            getServerConfig().custom_tabs,
            'RESULTS_PAGE'
        );
    }

    @autobind
    public evaluateTabInclusion(tab: ITabConfiguration) {
        const excludedTabs = getServerConfig().disabled_tabs || '';
        const isExcludedInList = parseConfigDisabledTabs(excludedTabs).includes(
            tab.id
        );
        const isRoutedTo = this.resultsViewPageStore.tabId === tab.id;
        const isExcluded = tab.hide ? tab.hide() : false;

        // we show no matter what if its routed to
        return isRoutedTo || (!isExcludedInList && !isExcluded);
    }

    @computed get quickOQLSubmitButton() {
        if (this.quickOQLQueryStore) {
            return (
                <>
                    <button
                        className={'btn btn-primary btn-sm'}
                        data-test="oqlQuickEditSubmitButton"
                        style={{ marginLeft: 10 }}
                        onClick={this.handleQuickOQLSubmission}
                        disabled={!this.quickOQLQueryStore!.submitEnabled}
                    >
                        Submit Query
                    </button>
                    &nbsp;
                    <button
                        className={'btn btn-link btn-sm'}
                        onClick={this.toggleOQLEditor}
                    >
                        Cancel
                    </button>
                </>
            );
        }
    }

    @computed get showOQLEditor() {
        return !!this.quickOQLQueryStore;
    }
    set showOQLEditor(s: boolean) {
        if (s) {
            this.quickOQLQueryStore = createQueryStore(
                this.urlWrapper.query,
                this.urlWrapper,
                false
            );
        } else {
            this.quickOQLQueryStore = null;
        }
    }

    @action.bound
    handleQuickOQLSubmission() {
        const targetTab = Object.values(ResultsViewTab).includes(
            this.urlWrapper.tabId as ResultsViewTab
        )
            ? this.urlWrapper.tabId
            : '';
        this.quickOQLQueryStore!.submit(targetTab as ResultsViewTab);
        this.showOQLEditor = false;
    }

    @action.bound
    toggleOQLEditor() {
        this.showOQLEditor = !this.showOQLEditor;
    }

    @autobind
    private getTabHref(tabId: string) {
        return URL.format({
            pathname: buildCBioPortalPageUrl(`./results/${tabId}`),
            query: this.routing.query,
            hash: this.routing.location.hash,
        });
    }

    readonly userMessages = remoteData<IUserMessage[]>({
        await: () => [
            this.resultsViewPageStore.expressionProfiles,
            this.resultsViewPageStore.studies,
        ],
        invoke: () => {
            // TODO: make this configurable from outside app
            return Promise.resolve([]);
        },
    });

    @computed get pageContent() {
        if (
            this.resultsViewPageStore.hugoGeneSymbols.length === 0 ||
            this.resultsViewPageStore.invalidStudyIds.result.length > 0
        ) {
            return (
                <div>
                    <div className={'headBlock'}></div>
                    <QueryAndDownloadTabs
                        forkedMode={false}
                        showQuickSearchTab={false}
                        showDownloadTab={false}
                        showAlerts={true}
                        getQueryStore={() =>
                            createQueryStore(
                                this.urlWrapper.query,
                                this.urlWrapper
                            )
                        }
                    />
                </div>
            );
        } else {
            // we don't show the result tabs if we don't have valid query
            const tabsReady =
                this.showTabs &&
                !this.resultsViewPageStore.genesInvalid &&
                !this.resultsViewPageStore.queryExceedsLimit &&
                this.resultsViewPageStore.customDriverAnnotationReport
                    .isComplete;
            return (
                <>
                    {// if query invalid(we only check gene count * sample count < 1,000,000 for now), return error page
                    this.resultsViewPageStore.queryExceedsLimit && (
                        <div
                            className="alert alert-danger queryInvalid"
                            style={{ marginBottom: '40px' }}
                            role="alert"
                        >
                            <GeneSymbolValidationError
                                sampleCount={
                                    this.resultsViewPageStore.samples.result
                                        .length
                                }
                                queryProductLimit={
                                    getServerConfig().query_product_limit
                                }
                                email={getServerConfig().skin_email_contact}
                            />
                        </div>
                    )}

                    {this.userMessages.isComplete &&
                        this.userMessages.result.length > 0 && (
                            <UserMessager messages={this.userMessages.result} />
                        )}

                    {(this.resultsViewPageStore.studies.isPending ||
                        (!tabsReady &&
                            !this.resultsViewPageStore.queryFormVisible)) && (
                        <LoadingIndicator
                            isLoading={true}
                            center={true}
                            noFade={true}
                            size={'big'}
                        ></LoadingIndicator>
                    )}
                    {this.resultsViewPageStore.studies.isComplete && (
                        <>
                            <Helmet>
                                <title>
                                    {buildResultsViewPageTitle(
                                        this.resultsViewPageStore
                                            .hugoGeneSymbols,
                                        this.resultsViewPageStore.studies.result
                                    )}
                                </title>
                            </Helmet>
                            <div>
                                <div className={'headBlock'}>
                                    <QuerySummary
                                        routingStore={this.routing}
                                        store={this.resultsViewPageStore}
                                        onToggleQueryFormVisibility={visible => {
                                            runInAction(() => {
                                                this.showTabs = visible;
                                                this.showOQLEditor = false;
                                            });
                                        }}
                                        onToggleOQLEditUIVisibility={
                                            this.toggleOQLEditor
                                        }
                                    />

                                    {this.showOQLEditor && (
                                        <div className={'quick_oql_edit'}>
                                            <OQLTextArea
                                                validateInputGeneQuery={true}
                                                inputGeneQuery={
                                                    this.quickOQLQueryStore!
                                                        .geneQuery
                                                }
                                                callback={(...args) => {
                                                    this.quickOQLQueryStore!.geneQuery =
                                                        args[2];
                                                }}
                                                location={GeneBoxType.DEFAULT}
                                                submitButton={
                                                    this.quickOQLSubmitButton
                                                }
                                                error={
                                                    this.quickOQLQueryStore!
                                                        .submitError
                                                }
                                                messages={
                                                    this.quickOQLQueryStore!
                                                        .oqlMessages
                                                }
                                            />
                                        </div>
                                    )}
                                </div>
                                {tabsReady && (
                                    <MSKTabs
                                        // When important parts of the query change (included in the hash), we
                                        //  want to remount the tabs so that we rerun any initialization code
                                        //  that depends on the query.
                                        key={this.urlWrapper.hash}
                                        activeTabId={
                                            this.resultsViewPageStore.tabId
                                        }
                                        unmountOnHide={false}
                                        onTabClick={(id: string) =>
                                            this.resultsViewPageStore.handleTabChange(
                                                id
                                            )
                                        }
                                        className="mainTabs"
                                        hrefRoot={buildCBioPortalPageUrl(
                                            'results'
                                        )}
                                        contentWindowExtra={
                                            <HelpWidget
                                                path={
                                                    this.routing.location
                                                        .pathname
                                                }
                                            />
                                        }
                                    >
                                        {this.tabs}
                                    </MSKTabs>
                                )}
                            </div>
                        </>
                    )}
                </>
            );
        }
    }

    public render() {
        if (
            this.urlWrapper.isTemporarySessionPendingSave ||
            this.urlWrapper.isLoadingSession ||
            !this.resultsViewPageStore.studies.isComplete
        ) {
            return (
                <LoadingIndicator
                    isLoading={true}
                    center={true}
                    noFade={true}
                    size={'big'}
                />
            );
        }

        // if we don't have a tabId, we need figure out
        // which tab should be default based upon
        // characteristics of study (handled in tabId getter)
        if (
            this.resultsViewPageStore.studies.isComplete &&
            !this.resultsViewPageStore.tabId
        ) {
            // we have to use timeout in order to
            // circumvent restriction on updating state
            // inside of render
            setTimeout(() => {
                this.resultsViewPageStore.handleTabChange(
                    this.resultsViewPageStore.tabId,
                    true
                );
            });
            return null;
        } else {
            return (
                <PageLayout
                    noMargin={true}
                    hideFooter={true}
                    className={'subhead-dark'}
                >
                    {this.pageContent}
                </PageLayout>
            );
        }
    }
}
