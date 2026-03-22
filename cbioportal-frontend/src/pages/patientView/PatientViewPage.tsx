import * as React from 'react';
import _ from 'lodash';
import { DiscreteCopyNumberData, ResourceData } from 'cbioportal-ts-api-client';
import { PaginationControls } from '../../shared/components/paginationControls/PaginationControls';
import { IColumnVisibilityDef } from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
import {
    DefaultTooltip,
    toggleColumnVisibility,
} from 'cbioportal-frontend-commons';
import {
    PatientViewPageStore,
    buildCohortIdsFromNavCaseIds,
} from './clinicalInformation/PatientViewPageStore';
import { inject, observer } from 'mobx-react';
import { action, computed, observable, makeObservable, toJS } from 'mobx';
import { default as PatientViewMutationTable } from './mutation/PatientViewMutationTable';
import { MSKTab } from '../../shared/components/MSKTabs/MSKTabs';
import ValidationAlert from 'shared/components/ValidationAlert';
import PatientViewMutationsDataStore from './mutation/PatientViewMutationsDataStore';
import PatientViewCnaDataStore from './copyNumberAlterations/PatientViewCnaDataStore';

import './patient.scss';

import {
    buildCBioPortalPageUrl,
    getPatientViewUrl,
    getWholeSlideViewerUrl,
} from '../../shared/api/urls';
import { PageLayout } from '../../shared/components/PageLayout/PageLayout';
import Helmet from 'react-helmet';
import { getServerConfig } from '../../config/config';
import autobind from 'autobind-decorator';
import { showCustomTab } from '../../shared/lib/customTabs';
import { StudyLink } from '../../shared/components/StudyLink/StudyLink';
import { QueryParams } from 'url';
import { AppStore } from '../../AppStore';
import request from 'superagent';
import { remoteData, getBrowserWindow } from 'cbioportal-frontend-commons';
import 'react-mutation-mapper/dist/styles.css';
import 'react-table/react-table.css';
import PatientViewUrlWrapper from './PatientViewUrlWrapper';
import { GeneFilterOption } from './mutation/GeneFilterMenu';
import { checkNonProfiledGenesExist } from './PatientViewPageUtils';
import PatientViewGenePanelModal from './PatientViewGenePanelModal/PatientViewGenePanelModal';
import {
    extractResourceIdFromTabId,
    getPatientViewResourceTabId,
    PatientViewPageTabs,
    patientViewTabs,
} from './PatientViewPageTabs';
import { MakeMobxView } from '../../shared/components/MobxView';
import ResourceTab from '../../shared/components/resources/ResourceTab';
import { isFusion } from '../../shared/lib/MutationUtils';
import { Mutation } from 'cbioportal-ts-api-client';
import {
    getOncoKbIconStyleFromLocalStorage,
    saveOncoKbIconStyleToLocalStorage,
} from 'shared/lib/AnnotationColumnUtils';
import { ExtendedMutationTableColumnType } from 'shared/components/mutationTable/MutationTable';
import { extractColumnNames } from 'shared/components/mutationMapper/MutationMapperUtils';
import { prepareCustomTabConfigurations } from 'shared/lib/customTabs/customTabHelpers';
import setWindowVariable from 'shared/lib/setWindowVariable';
import { getNavCaseIdsCache } from 'shared/lib/handleLongUrls';
import PatientViewPageHeader from 'pages/patientView/PatientViewPageHeader';
import { MAX_URL_LENGTH } from 'pages/studyView/studyPageHeader/ActionButtons';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';

export interface IPatientViewPageProps {
    routing: any;
    appStore: AppStore;
    cohortIds?: string[];
    onCohortIdsUpdate: (ids: string[]) => void;
}

export interface IGenePanelModal {
    genePanelId: string;
    isOpen: boolean;
}

export interface PatientViewUrlParams extends QueryParams {
    studyId: string;
    caseId?: string;
    sampleId?: string;
}

/*
 * The wrapper and the inner component were instituted so that
 * because we needed a component to remount (and create a new patient view store)
 * whenever params changed
 * There was a bug when user navigated between cases in a cohort
 * Safest/easiest solution under cicumstances is just to reinstantiate everything
 */

@inject('routing', 'appStore')
@observer
export default class PatientViewPage extends React.Component<
    IPatientViewPageProps,
    {}
> {
    @observable cohortIds: string[] | undefined;

    constructor(props: IPatientViewPageProps) {
        super(props);
        makeObservable(this);
        const postData = getBrowserWindow().clientPostedData;

        const urlData = getNavCaseIdsCache();
        if (postData && postData.navCaseIds) {
            this.cohortIds = buildCohortIdsFromNavCaseIds(postData.navCaseIds);
            getBrowserWindow().clientPostedData = null;
        } else if (urlData) {
            this.cohortIds = urlData;
        }
    }

    @action.bound
    updateCohortIds(newCohortIds: string[]) {
        this.cohortIds = newCohortIds;
    }

    render() {
        return (
            <PatientViewPageInner
                key={`${this.props.routing.query.caseId}-${this.props.routing.query.studyId}-${this.props.routing.query.sampleId}`}
                {...this.props}
                cohortIds={this.cohortIds}
                onCohortIdsUpdate={this.updateCohortIds}
            />
        );
    }
}
@inject('routing', 'appStore')
@observer
export class PatientViewPageInner extends React.Component<
    IPatientViewPageProps,
    {}
> {
    @observable mutationTableColumnVisibility:
        | { [columnId: string]: boolean }
        | undefined;
    @observable cnaTableColumnVisibility:
        | { [columnId: string]: boolean }
        | undefined;
    @observable genePanelModal: IGenePanelModal = {
        genePanelId: '',
        isOpen: false,
    };
    @observable mergeMutationTableOncoKbIcons;
    // use this wrapper rather than interacting with the url directly
    @observable
    public urlWrapper: PatientViewUrlWrapper;
    public patientViewMutationDataStore: PatientViewMutationsDataStore;
    public patientViewCnaDataStore: PatientViewCnaDataStore;

    public patientViewPageStore: PatientViewPageStore;

    constructor(props: IPatientViewPageProps) {
        super(props);
        makeObservable(this);

        this.urlWrapper = new PatientViewUrlWrapper(props.routing);
        setWindowVariable('urlWrapper', this.urlWrapper);

        this.patientViewPageStore = new PatientViewPageStore(
            this.props.appStore,
            this.urlWrapper.query.studyId!,
            this.urlWrapper.query.caseId!,
            this.urlWrapper.query.sampleId,
            props.cohortIds
        );

        // views  don't fire the getData callback (first arg) until it's known that
        // mutation data is loaded
        // this is not a good pattern. awaits should be explicit
        this.patientViewMutationDataStore = new PatientViewMutationsDataStore(
            () => {
                return this.pageStore.mergedMutationDataIncludingUncalledFilteredByGene.filter(
                    mutationArray => {
                        return !isFusion(mutationArray[0]);
                    }
                );
            },
            this.urlWrapper
        );

        this.patientViewCnaDataStore = new PatientViewCnaDataStore(() => {
            return this.pageStore.mergedDiscreteCNADataFilteredByGene;
        }, this.urlWrapper);

        getBrowserWindow().patientViewPageStore = this.pageStore;

        this.setOpenResourceTabs();

        this.mergeMutationTableOncoKbIcons = getOncoKbIconStyleFromLocalStorage().mergeIcons;
    }

    setOpenResourceTabs() {
        const openResourceId =
            this.urlWrapper.activeTabId &&
            extractResourceIdFromTabId(this.urlWrapper.activeTabId);
        if (openResourceId) {
            this.pageStore.setResourceTabOpen(openResourceId, true);
        }
    }

    @action.bound
    public handleSampleClick(
        id: string,
        e: React.MouseEvent<HTMLAnchorElement>
    ) {
        if (!e.shiftKey && !e.altKey && !e.metaKey) {
            e.preventDefault();
            this.urlWrapper.updateURL({ caseId: undefined, sampleId: id });
        }
        // otherwise do nothing, we want default behavior of link
        // namely that href will open in a new window/tab
    }

    @action.bound
    public handleLocusChange(locus: string) {
        if (this.pageStore.activeLocus !== locus) {
            this.pageStore.activeLocus = locus;
        }
    }

    @action.bound
    handlePatientClick(id: string) {
        let values = id.split(':');
        if (values.length == 2) {
            this.urlWrapper.updateURL({
                studyId: values[0],
                caseId: values[1],
                sampleId: undefined,
            });
        } else {
            this.urlWrapper.updateURL({ caseId: id, sampleId: undefined });
        }
    }

    @action.bound
    handleOncoKbIconToggle(mergeIcons: boolean) {
        this.mergeMutationTableOncoKbIcons = mergeIcons;
        saveOncoKbIconStyleToLocalStorage({ mergeIcons });
    }

    @computed get showWholeSlideViewerTab() {
        return (
            this.pageStore.clinicalDataForSamples.isComplete &&
            _.some(this.pageStore.clinicalDataForSamples.result, s => {
                return s.clinicalAttributeId === 'MSK_SLIDE_ID';
            })
        );
    }

    @action.bound
    onCnaTableColumnVisibilityToggled(
        columnId: string,
        columnVisibility?: IColumnVisibilityDef[]
    ) {
        this.cnaTableColumnVisibility = toggleColumnVisibility(
            this.cnaTableColumnVisibility,
            columnId,
            columnVisibility
        );
    }

    @action.bound
    onMutationTableColumnVisibilityToggled(
        columnId: string,
        columnVisibility?: IColumnVisibilityDef[]
    ) {
        this.mutationTableColumnVisibility = toggleColumnVisibility(
            this.mutationTableColumnVisibility,
            columnId,
            columnVisibility
        );
    }

    @computed
    get shouldShowResources(): boolean {
        const tabId: string = this.urlWrapper.activeTabId;
        if (tabId === 'filesAndLinks') {
            return true;
        }

        if (this.pageStore.resourceIdToResourceData.isComplete) {
            return _.some(
                this.pageStore.resourceIdToResourceData.result,
                data => data.length > 0
            );
        } else {
            return false;
        }
    }

    @computed
    get shouldShowPathologyReport(): boolean {
        return (
            this.pageStore.pathologyReport.isComplete &&
            this.pageStore.pathologyReport.result.length > 0
        );
    }

    @computed
    get hideTissueImageTab() {
        return (
            this.pageStore.hasTissueImageIFrameUrl.isPending ||
            this.pageStore.hasTissueImageIFrameUrl.isError ||
            (this.pageStore.hasTissueImageIFrameUrl.isComplete &&
                !this.pageStore.hasTissueImageIFrameUrl.result)
        );
    }

    @computed
    public get shouldShowTrialMatch(): boolean {
        return (
            getBrowserWindow().localStorage.trialmatch === 'true' &&
            this.pageStore.detailedTrialMatches.isComplete &&
            this.pageStore.detailedTrialMatches.result.length > 0
        );
    }

    @autobind
    customTabMountCallback(div: HTMLDivElement, tab: any) {
        showCustomTab(div, tab, this.props.routing.location, this.pageStore);
    }

    wholeSlideViewerUrl = remoteData<string | undefined>({
        await: () => [this.pageStore.getWholeSlideViewerIds],
        invoke: async () => {
            if (!_.isEmpty(this.pageStore.getWholeSlideViewerIds.result)) {
                const url = getWholeSlideViewerUrl(
                    this.pageStore.getWholeSlideViewerIds.result!,
                    this.props.appStore.userName!
                );
                //if request succeeds then we return the url because we know request works.
                try {
                    await request.get(url);
                    return url;
                } catch (er) {
                    //but if request fails, we will return undefined.
                    return undefined;
                }
            }
            return undefined;
        },
    });

    @autobind
    onFilterGenesMutationTable(option: GeneFilterOption): void {
        this.pageStore.mutationTableGeneFilterOption = option;
    }

    @autobind
    onFilterGenesCopyNumberTable(option: GeneFilterOption): void {
        this.pageStore.copyNumberTableGeneFilterOption = option;
    }

    mutationTableShowGeneFilterMenu(sampleIds: string[]): boolean {
        const entrezGeneIds: number[] = _.uniq(
            _.map(
                this.pageStore.mergedMutationDataIncludingUncalled,
                mutations => mutations[0].entrezGeneId
            )
        );
        return (
            sampleIds.length > 1 &&
            checkNonProfiledGenesExist(
                sampleIds,
                entrezGeneIds,
                this.pageStore.sampleToMutationGenePanelId.result,
                this.pageStore.genePanelIdToEntrezGeneIds.result
            )
        );
    }

    cnaTableShowGeneFilterMenu(sampleIds: string[]): boolean {
        const entrezGeneIds: number[] = _.uniq(
            _.map(
                this.pageStore.mergedDiscreteCNAData,
                alterations => alterations[0].entrezGeneId
            )
        );
        return (
            sampleIds.length > 1 &&
            checkNonProfiledGenesExist(
                sampleIds,
                entrezGeneIds,
                this.pageStore.sampleToDiscreteGenePanelId.result,
                this.pageStore.genePanelIdToEntrezGeneIds.result
            )
        );
    }

    @action.bound
    toggleGenePanelModal(genePanelId?: string | undefined) {
        this.genePanelModal = {
            isOpen: !this.genePanelModal.isOpen,
            genePanelId: genePanelId || '',
        };
    }

    @computed get modalSelectedGenePanel() {
        return this.pageStore.genePanelIdToPanel.result[
            this.genePanelModal.genePanelId
        ];
    }

    @autobind
    onMutationTableRowClick(d: Mutation[]) {
        // select mutation and toggle off previous selected
        if (d.length) {
            this.patientViewMutationDataStore.setSelectedMutations([d[0]]);
            if (this.patientViewCnaDataStore.selectedCna.length > 0) {
                this.patientViewCnaDataStore.toggleSelectedCna(
                    this.patientViewCnaDataStore.selectedCna[0]
                );
            }
            this.handleLocusChange(d[0].gene.hugoGeneSymbol);
        }
    }

    @autobind
    onMutationTableRowMouseEnter(d: Mutation[]) {
        if (d.length) {
            this.patientViewMutationDataStore.setMouseOverMutation(d[0]);
        }
    }

    @autobind
    onMutationTableRowMouseLeave() {
        this.patientViewMutationDataStore.setMouseOverMutation(null);
    }

    @action.bound
    onCnaTableRowClick(d: DiscreteCopyNumberData[]) {
        // select cna and toggle off previous selected
        if (d.length) {
            this.patientViewCnaDataStore.setSelectedCna([d[0]]);
            if (
                this.patientViewMutationDataStore.selectedMutations.length > 0
            ) {
                this.patientViewMutationDataStore.toggleSelectedMutation(
                    this.patientViewMutationDataStore.selectedMutations[0]
                );
            }
            this.handleLocusChange(d[0].gene.hugoGeneSymbol);
        }
    }

    @action.bound
    onResetViewClick() {
        // toggle off selected cna/mutation row
        if (this.patientViewCnaDataStore.selectedCna.length > 0) {
            this.patientViewCnaDataStore.toggleSelectedCna(
                this.patientViewCnaDataStore.selectedCna[0]
            );
        } else if (
            this.patientViewMutationDataStore.selectedMutations.length > 0
        ) {
            this.patientViewMutationDataStore.toggleSelectedMutation(
                this.patientViewMutationDataStore.selectedMutations[0]
            );
        }
    }

    readonly resourceTabs = MakeMobxView({
        await: () => [
            this.pageStore.resourceDefinitions,
            this.pageStore.resourceIdToResourceData,
        ],
        render: () => {
            const openDefinitions = this.pageStore.resourceDefinitions.result!.filter(
                d => this.pageStore.isResourceTabOpen(d.resourceId)
            );
            const sorted = _.sortBy(openDefinitions, d => d.priority);
            const resourceDataById = this.pageStore.resourceIdToResourceData
                .result!;

            const tabs: JSX.Element[] = sorted.reduce((list, def) => {
                const data = resourceDataById[def.resourceId];
                if (data && data.length > 0) {
                    list.push(
                        <MSKTab
                            key={getPatientViewResourceTabId(def.resourceId)}
                            id={getPatientViewResourceTabId(def.resourceId)}
                            linkText={def.displayName}
                            onClickClose={this.closeResourceTab}
                        >
                            <ResourceTab
                                resourceData={resourceDataById[def.resourceId]}
                                urlWrapper={this.urlWrapper}
                            />
                        </MSKTab>
                    );
                }
                return list;
            }, [] as JSX.Element[]);
            return tabs;
        },
    });

    @action.bound
    openResource(resource: ResourceData) {
        // first we make the resource tab visible
        this.pageStore.setResourceTabOpen(resource.resourceId, true);
        // next, navigate to that tab
        this.urlWrapper.setActiveTab(
            getPatientViewResourceTabId(resource.resourceId)
        );
        // finally, within that tab, navigate to the specific target link, e.g. if there are multiple for the same resource
        this.urlWrapper.setResourceUrl(resource.url);
    }

    @action.bound
    closeResourceTab(tabId: string) {
        const resourceId = extractResourceIdFromTabId(tabId);
        if (resourceId) {
            // hide the resource tab
            this.pageStore.setResourceTabOpen(resourceId, false);

            // then, if we were currently on that tab..
            if (
                this.urlWrapper.activeTabId ===
                getPatientViewResourceTabId(resourceId)
            ) {
                // ..navigate to the files & links tab
                this.urlWrapper.setActiveTab(PatientViewPageTabs.FilesAndLinks);
            }
        }
    }

    @action.bound
    onMutationalSignatureVersionChange(version: string) {
        this.pageStore.setMutationalSignaturesVersion(version);
    }
    @action.bound
    onSampleIdChange(sample: string) {
        this.pageStore.setSampleMutationalSignatureData(sample);
    }

    @computed get columns(): ExtendedMutationTableColumnType[] {
        const namespaceColumnNames = extractColumnNames(
            this.patientViewMutationDataStore.namespaceColumnConfig
        );
        return _.concat(
            PatientViewMutationTable.defaultProps.columns,
            namespaceColumnNames
        );
    }

    @computed get customTabs() {
        // we want this to regenerate when
        // hash changes
        //const hash = this.urlWrapper.hash;

        return prepareCustomTabConfigurations(
            getServerConfig().custom_tabs,
            'PATIENT_PAGE'
        );
    }

    public get pageStore() {
        return this.patientViewPageStore;
    }

    @action.bound
    private handleReturnToStudyView() {
        const patientIdentifiers = this.pageStore.patientIdsInCohort.map(p => {
            const patientIdParts = p.split(':');
            return {
                patientId: patientIdParts[1],
                studyId: patientIdParts[0],
            };
        });
        const queriedStudies: Set<string> = new Set(
            patientIdentifiers.map(p => p.studyId)
        );

        // We need to do this because of url length limits. We post the data to the new window once it is opened.
        const studyPage = window.open(
            buildCBioPortalPageUrl(`study`, {
                id: Array.from(queriedStudies).join(','),
            }),
            '_blank'
        );
        if (patientIdentifiers.length > 0) {
            (studyPage as any).studyPageFilter = `filterJson=${JSON.stringify({
                patientIdentifiers,
            })}`;
        }
    }

    @action.bound
    private handleDeletePatient(deleteAtIndex: number) {
        var newCohortIdList = toJS(this.pageStore.patientIdsInCohort);
        newCohortIdList.splice(deleteAtIndex, 1);
        let currentIndex =
            deleteAtIndex > newCohortIdList.length - 1
                ? deleteAtIndex - 1
                : deleteAtIndex;

        let navCaseIds = newCohortIdList.map(p => {
            const patientIdParts = p.split(':');
            return {
                patientId: patientIdParts[1],
                studyId: patientIdParts[0],
            };
        });
        const url = getPatientViewUrl(
            navCaseIds[currentIndex].studyId,
            navCaseIds[currentIndex].patientId,
            navCaseIds
        );

        // Because of url length limits, we can only maintain the list in the url hash for small sets of ids.
        // TODO: adapt updateURL to allow for hash mutation so that we don't have manipulate window.location.hash directly
        this.props.onCohortIdsUpdate(newCohortIdList);
        if (url.length <= MAX_URL_LENGTH) {
            getBrowserWindow().location.hash = url.substring(
                url.indexOf('#') + 1
            );
        }
        this.urlWrapper.updateURL({
            studyId: navCaseIds[currentIndex].studyId,
            caseId: navCaseIds[currentIndex].patientId,
            sampleId: undefined,
        });
    }

    @computed
    public get cohortNav() {
        if (
            this.pageStore.patientIdsInCohort &&
            this.pageStore.patientIdsInCohort.length > 0
        ) {
            const indexInCohort = this.pageStore.patientIdsInCohort.indexOf(
                this.pageStore.studyId + ':' + this.pageStore.patientId
            );
            return (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                    }}
                >
                    <PaginationControls
                        currentPage={indexInCohort + 1}
                        showMoreButton={false}
                        showItemsPerPageSelector={false}
                        showFirstPage={true}
                        showLastPage={true}
                        textBetweenButtons={
                            <>
                                <span> of </span>
                                <DefaultTooltip
                                    placement="bottom"
                                    overlay="Open all patients in study view"
                                >
                                    <a
                                        onClick={this.handleReturnToStudyView}
                                        target={'_blank'}
                                    >
                                        {`${this.pageStore.patientIdsInCohort.length} patients`}
                                    </a>
                                </DefaultTooltip>
                            </>
                        }
                        firstPageDisabled={indexInCohort === 0}
                        previousPageDisabled={indexInCohort === 0}
                        nextPageDisabled={
                            indexInCohort ===
                            this.pageStore.patientIdsInCohort.length - 1
                        }
                        lastPageDisabled={
                            indexInCohort ===
                            this.pageStore.patientIdsInCohort.length - 1
                        }
                        onFirstPageClick={() =>
                            this.handlePatientClick(
                                this.pageStore.patientIdsInCohort[0]
                            )
                        }
                        onPreviousPageClick={() =>
                            this.handlePatientClick(
                                this.pageStore.patientIdsInCohort[
                                    indexInCohort - 1
                                ]
                            )
                        }
                        onNextPageClick={() =>
                            this.handlePatientClick(
                                this.pageStore.patientIdsInCohort[
                                    indexInCohort + 1
                                ]
                            )
                        }
                        onLastPageClick={() =>
                            this.handlePatientClick(
                                this.pageStore.patientIdsInCohort[
                                    this.pageStore.patientIdsInCohort.length - 1
                                ]
                            )
                        }
                        onChangeCurrentPage={newPage => {
                            if (
                                newPage > 0 &&
                                newPage <=
                                    this.pageStore.patientIdsInCohort.length
                            ) {
                                this.handlePatientClick(
                                    this.pageStore.patientIdsInCohort[
                                        newPage - 1
                                    ]
                                );
                            }
                        }}
                        pageNumberEditable={true}
                        className="cohortNav"
                    />
                    <DefaultTooltip
                        placement="bottom"
                        overlay="Exclude the current patient"
                    >
                        <span
                            style={{
                                marginLeft: '5px',
                                display: 'inline-block',
                                cursor: 'pointer',
                            }}
                            onClick={() =>
                                this.handleDeletePatient(indexInCohort)
                            }
                        >
                            <i className={'fa fa-minus-circle'} />
                        </span>
                    </DefaultTooltip>
                </div>
            );
        }
    }

    public render() {
        if (this.pageStore.urlValidationError) {
            return (
                <ValidationAlert
                    urlValidationError={this.pageStore.urlValidationError}
                />
            );
        }

        return (
            <PageLayout noMargin={true} hideFooter={true}>
                {this.pageStore.patientViewData.isComplete &&
                    this.pageStore.studyMetaData.isComplete && (
                        <Helmet>
                            <title>{this.pageStore.pageTitle}</title>
                            <meta
                                name="description"
                                content={this.pageStore.metaDescription}
                            />
                        </Helmet>
                    )}
                <div className="patientViewPage">
                    {this.genePanelModal.isOpen && (
                        <PatientViewGenePanelModal
                            genePanel={this.modalSelectedGenePanel}
                            show={this.genePanelModal.isOpen}
                            onHide={this.toggleGenePanelModal}
                            columns={3}
                        />
                    )}

                    {this.pageContent.component}
                </div>
            </PageLayout>
        );
    }

    readonly pageContent = MakeMobxView({
        await: () => [
            this.pageStore.patientViewData,
            this.pageStore.sampleManager,
            this.pageStore.studyMetaData,
        ],

        renderPending: () => (
            <LoadingIndicator isLoading={true} center={true} size={'big'} />
        ),
        render: () => {
            return (
                <>
                    <div className="headBlock">
                        <div className="patientPageHeader">
                            <i
                                className="fa fa-user-circle-o patientIcon"
                                aria-hidden="true"
                            ></i>
                            <PatientViewPageHeader
                                pageStore={this.pageStore}
                                handleSampleClick={this.handleSampleClick}
                                handlePatientClick={this.handlePatientClick}
                                toggleGenePanelModal={this.toggleGenePanelModal}
                                genePanelModal={this.genePanelModal}
                            />
                            <div className="studyMetaBar">
                                <StudyLink
                                    className={'nowrap'}
                                    studyId={
                                        this.pageStore.studyMetaData.result!
                                            .studyId
                                    }
                                >
                                    {this.pageStore.studyMetaData.result!.name}
                                </StudyLink>{' '}
                                {this.cohortNav && this.cohortNav}
                            </div>
                        </div>
                    </div>
                    {patientViewTabs(
                        this,
                        this.urlWrapper,
                        this.pageStore.sampleManager.result!
                    )}
                </>
            );
        },
    });
}
