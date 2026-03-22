import * as React from 'react';
import _ from 'lodash';
import PathwayMapper, { ICBioData } from 'pathway-mapper';

import { ResultsViewPageStore } from '../ResultsViewPageStore';
import { addGenesToQuery } from '../ResultsViewPageHelpers';
import PathwayMapperTable, {
    IPathwayMapperTable,
} from 'shared/lib/pathwayMapper/PathwayMapperTable';
import PathwayMapperMessageBox from 'shared/lib/pathwayMapper/PathwayMapperMessageBox';
import { observer } from 'mobx-react';
import autobind from 'autobind-decorator';
import {
    observable,
    computed,
    action,
    reaction,
    IReactionDisposer,
    makeObservable,
} from 'mobx';
import { Row } from 'react-bootstrap';

import { AppStore } from 'AppStore';
import { remoteData } from 'cbioportal-frontend-commons';
import { fetchGenes } from 'shared/lib/StoreUtils';
import OqlStatusBanner from 'shared/components/banners/OqlStatusBanner';
import { getAlterationData } from 'shared/components/oncoprint/OncoprintUtils';
import { initStore } from '../ResultsViewPage';
import ResultsViewURLWrapper from '../ResultsViewURLWrapper';

import 'pathway-mapper/dist/base.css';
import 'cytoscape-panzoom/cytoscape.js-panzoom.css';
import 'cytoscape-navigator/cytoscape.js-navigator.css';

interface IResultsViewPathwayMapperProps {
    store: ResultsViewPageStore;
    appStore: AppStore;
    urlWrapper: ResultsViewURLWrapper;
}

const LOADING_MESSAGE = 'Loading alteration data...';

@observer
export default class ResultsViewPathwayMapper extends React.Component<
    IResultsViewPathwayMapperProps
> {
    private accumulatedAlterationFrequencyDataForNonQueryGenes: ICBioData[];
    private readonly accumulatedValidGenes: { [gene: string]: boolean };

    @observable
    private selectedPathway = '';

    @observable
    private newGenesFromPathway: string[];

    @observable
    private warningMessage: string | null;

    private readonly validNonQueryGenes = remoteData<string[]>({
        invoke: async () => {
            const genes = await fetchGenes(this.newGenesFromPathway);

            return genes.map(gene => gene.hugoGeneSymbol);
        },
    });

    @observable
    private addGenomicData: (alterationData: ICBioData[]) => void;

    constructor(props: IResultsViewPathwayMapperProps) {
        super(props);
        makeObservable(this);
        this.accumulatedValidGenes = {};
        this.accumulatedAlterationFrequencyDataForNonQueryGenes = [];

        // @ts-ignore
        import(/* webpackChunkName: "pathway-mapper" */ 'pathway-mapper').then(
            (module: any) => {
                this.PathwayMapperComponent = (module as any)
                    .default as PathwayMapper;
            }
        );
    }

    @observable.ref PathwayMapperComponent:
        | PathwayMapper
        | undefined = undefined;

    @computed get alterationFrequencyData(): ICBioData[] {
        return this.alterationFrequencyDataForQueryGenes.concat(
            this.alterationFrequencyDataForNonQueryGenes
        );
    }
    @computed get message(): string {
        if (this.isNewStoreReady && this.warningMessage === LOADING_MESSAGE) {
            return '';
        }

        if (
            !this.isNewStoreReady &&
            this.validNonQueryGenes.isComplete &&
            this.validNonQueryGenes.result.length > 0
        ) {
            return LOADING_MESSAGE;
        }

        if (!this.warningMessage) {
            return '';
        }

        return this.warningMessage;
    }
    @computed get alterationFrequencyDataForQueryGenes() {
        const alterationFrequencyData: ICBioData[] = [];

        this.props.store.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach(
            alterationData => {
                const data = getAlterationData(
                    this.props.store.samples.result,
                    this.props.store.patients.result,
                    this.props.store.coverageInformation.result!,
                    this.props.store.filteredSequencedSampleKeysByGene.result!,
                    this.props.store.filteredSequencedPatientKeysByGene.result!,
                    this.props.store.selectedMolecularProfiles.result!,
                    alterationData,
                    true,
                    this.props.store.genes.result!
                );

                if (data) {
                    alterationFrequencyData.push(data);
                }
            }
        );

        return alterationFrequencyData;
    }

    @computed get alterationFrequencyDataForNonQueryGenes() {
        const alterationFrequencyDataForNewGenes: ICBioData[] = [];

        if (this.isNewStoreReady) {
            this.storeForAllData!.oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.result!.forEach(
                alterationData => {
                    const data = getAlterationData(
                        this.storeForAllData!.samples.result,
                        this.storeForAllData!.patients.result,
                        this.storeForAllData!.coverageInformation.result!,
                        this.storeForAllData!.filteredSequencedSampleKeysByGene
                            .result!,
                        this.storeForAllData!.filteredSequencedPatientKeysByGene
                            .result!,
                        this.storeForAllData!.selectedMolecularProfiles.result!,
                        alterationData,
                        false,
                        this.props.store.genes.result!
                    );

                    if (data) {
                        alterationFrequencyDataForNewGenes.push(data);
                    }
                }
            );
        }

        // on pathway change PathwayMapper returns only the genes that are new (i.e genes for which we haven't
        // calculated the alteration data yet), so we need to accumulate the alteration frequency data after each
        // query
        this.accumulatedAlterationFrequencyDataForNonQueryGenes = this.accumulatedAlterationFrequencyDataForNonQueryGenes.concat(
            alterationFrequencyDataForNewGenes
        );

        return this.accumulatedAlterationFrequencyDataForNonQueryGenes;
    }

    @computed get isNewStoreReady() {
        return (
            this.storeForAllData &&
            this.storeForAllData
                .oqlFilteredCaseAggregatedDataByUnflattenedOQLLine.isComplete &&
            this.storeForAllData.samples.isComplete &&
            this.storeForAllData.patients.isComplete &&
            this.storeForAllData.coverageInformation.isComplete &&
            this.storeForAllData.filteredSequencedSampleKeysByGene.isComplete &&
            this.storeForAllData.filteredSequencedPatientKeysByGene
                .isComplete &&
            this.storeForAllData.selectedMolecularProfiles.isComplete
        );
    }

    public render() {
        // Alteration data of non-query genes are loaded.
        if (this.isNewStoreReady) {
            this.addGenomicData(this.alterationFrequencyData);
        }

        if (!this.PathwayMapperComponent) {
            return null;
        }

        return (
            <div className="pathwayMapper">
                <div
                    data-test="pathwayMapperTabDiv"
                    className="cBioMode"
                    style={{ width: '99%' }}
                >
                    <Row>
                        <React.Fragment>
                            <OqlStatusBanner
                                className="coexp-oql-status-banner"
                                queryContainsOql={
                                    this.props.store.queryContainsOql
                                }
                                tabReflectsOql={true}
                            />
                            {/*
                              // @ts-ignore */}
                            <this.PathwayMapperComponent
                                isCBioPortal={true}
                                isCollaborative={false}
                                genes={this.props.store.genes.result as any}
                                cBioAlterationData={
                                    this.alterationFrequencyData
                                }
                                onAddGenes={this.handleAddGenes}
                                changePathwayHandler={this.handlePathwayChange}
                                addGenomicDataHandler={
                                    this.addGenomicDataHandler
                                }
                                messageBanner={this.renderBanner}
                                tableComponent={this.renderTable}
                                validGenes={this.validGenes}
                                showMessage={this.updateMessage}
                            />
                        </React.Fragment>
                    </Row>
                </div>
            </div>
        );
    }

    /**
     * We need to initialize a separate ResultsViewStore to be able to fetch alteration data for non-query genes.
     */
    @computed get storeForAllData(): ResultsViewPageStore | undefined {
        if (
            this.urlWrapperForAllGenes &&
            (!this.urlWrapperForAllGenes.hasSessionId ||
                !this.urlWrapperForAllGenes.remoteSessionData.isPending)
        ) {
            return initStore(this.props.appStore, this.urlWrapperForAllGenes);
        } else {
            return undefined;
        }
    }

    /**
     * Here we clone the "query" field of the main store's URL Wrapper and enhance the cloned query
     * with additional non-query genes. This new query object is used to fake a new URL Wrapper instance
     * which is required to initialize a separate ResultsViewStore for the non-query genes.
     */
    @computed get urlWrapperForAllGenes(): ResultsViewURLWrapper | undefined {
        let urlWrapper: ResultsViewURLWrapper | undefined;

        if (
            this.validNonQueryGenes.isComplete &&
            this.validNonQueryGenes.result.length > 0
        ) {
            // fake the URL wrapper, we only need the query parameters with additional genes
            const query: { [key: string]: any } = _.cloneDeep(
                this.props.urlWrapper.query
            );
            query.gene_list = this.validNonQueryGenes.result.join(' ');

            // we don't need a proper URL Wrapper here, just assign an object with a valid query field
            urlWrapper = { query } as ResultsViewURLWrapper;
        }

        return urlWrapper;
    }

    /**
     * Valid non-query genes accumulated from currently selected pathway
     * and previously selected pathways in a single query session.
     */
    @computed get validGenes() {
        if (this.validNonQueryGenes.isComplete) {
            // Valid genes are accumulated.
            this.validNonQueryGenes.result.forEach(gene => {
                this.accumulatedValidGenes[gene] = true;
            });
        }
        return this.accumulatedValidGenes;
    }

    /**
     * addGenomicData function is implemented in PathwayMapper component and overlays
     * alteration data onto genes. Through this function callback, the function implemented
     * in PathwayMapper is copied here.
     */
    @action.bound
    private addGenomicDataHandler(
        addGenomicData: (alterationData: ICBioData[]) => void
    ) {
        this.addGenomicData = addGenomicData;
    }

    @action.bound
    private handlePathwayChange(pathwayGenes: string[]) {
        // Pathway genes here are the genes that are in the pathway and valid whose alteration data is not calculated yet.
        // Pathway genes does NOT always include all of the non-query genes
        // Some of the pathway genes may be invalid/unknown gene symbols
        this.newGenesFromPathway = pathwayGenes;
    }

    @action.bound
    private handleAddGenes(selectedGenes: string[]) {
        addGenesToQuery(this.props.urlWrapper, selectedGenes);
    }

    @action.bound
    private updateMessage(message: string) {
        this.warningMessage = message;
    }

    @action.bound
    private clearMessage() {
        this.warningMessage = null;
    }

    @autobind
    private renderBanner() {
        return (
            <PathwayMapperMessageBox
                message={this.message}
                loadingMessage={LOADING_MESSAGE}
                onClearMessage={this.clearMessage}
            />
        );
    }

    @autobind
    private renderTable(
        data: IPathwayMapperTable[],
        selectedPathway: string,
        onPathwaySelect: (pathway: string) => void
    ) {
        return (
            <PathwayMapperTable
                data={data}
                selectedPathway={selectedPathway}
                changePathway={onPathwaySelect}
                onSelectedPathwayChange={this.clearMessage}
            />
        );
    }
}
