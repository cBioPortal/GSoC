import * as React from 'react';
import { observer } from 'mobx-react';
import { MSKTabs, MSKTab } from 'shared/components/MSKTabs/MSKTabs';
import { ResultsViewPageStore } from '../ResultsViewPageStore';
import ResultsViewMutationMapper from './ResultsViewMutationMapper';
import { convertToMutationMapperProps } from 'shared/components/mutationMapper/MutationMapperServerConfig';
import MutationMapperUserSelectionStore from 'shared/components/mutationMapper/MutationMapperUserSelectionStore';
import { computed, action, makeObservable } from 'mobx';
import { getServerConfig } from 'config/config';
import OqlStatusBanner from '../../../shared/components/banners/OqlStatusBanner';
import autobind from 'autobind-decorator';
import { AppStore } from '../../../AppStore';

import '../../../shared/components/mutationMapper/mutations.scss';
import AlterationFilterWarning from '../../../shared/components/banners/AlterationFilterWarning';
import {
    getMutationAlignerUrlTemplate,
    getOncoKbApiUrl,
} from 'shared/api/urls';
import CaseFilterWarning from '../../../shared/components/banners/CaseFilterWarning';
import { Mutation } from 'cbioportal-ts-api-client';
import _ from 'lodash';
import ResultsViewURLWrapper from '../ResultsViewURLWrapper';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import { saveOncoKbIconStyleToLocalStorage } from 'shared/lib/AnnotationColumnUtils';
import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';
import { getProteinImpactType } from 'cbioportal-frontend-commons';
import { isPutativeDriver } from 'shared/lib/MutationUtils';
import { AxisScale } from 'react-mutation-mapper';
import { LollipopTooltipCountInfo } from 'pages/groupComparison/LollipopTooltipCountInfo';

export interface IMutationsPageProps {
    routing?: any;
    store: ResultsViewPageStore;
    appStore: AppStore;
    urlWrapper: ResultsViewURLWrapper;
}

@observer
export default class Mutations extends React.Component<
    IMutationsPageProps,
    {}
> {
    private userSelectionStore: MutationMapperUserSelectionStore;

    @computed get selectedGeneSymbol() {
        return this.props.urlWrapper.query.mutations_gene &&
            this.props.store.hugoGeneSymbols.includes(
                this.props.urlWrapper.query.mutations_gene
            )
            ? this.props.urlWrapper.query.mutations_gene
            : this.props.store.hugoGeneSymbols[0];
    }

    @computed get selectedGene() {
        return _.find(
            this.props.store.genes.result,
            gene => gene.hugoGeneSymbol === this.selectedGeneSymbol
        );
    }

    constructor(props: IMutationsPageProps) {
        super(props);
        makeObservable(this);
        this.userSelectionStore = new MutationMapperUserSelectionStore();
    }

    @autobind
    private onToggleOql() {
        this.props.store.mutationsTabFilteringSettings.useOql = !this.props
            .store.mutationsTabFilteringSettings.useOql;
    }

    @autobind
    private onToggleVUS() {
        this.props.store.mutationsTabFilteringSettings.excludeVus = !this.props
            .store.mutationsTabFilteringSettings.excludeVus;
    }

    @autobind
    private onToggleGermline() {
        this.props.store.mutationsTabFilteringSettings.excludeGermline = !this
            .props.store.mutationsTabFilteringSettings.excludeGermline;
    }

    @action
    public setSelectedGeneSymbol(hugoGeneSymbol: string) {
        this.props.urlWrapper.updateURL({
            mutations_gene: hugoGeneSymbol,
        });
    }

    public render() {
        const activeTabId = this.selectedGeneSymbol;

        // this is to trigger genome nexus variant annotation call as soon as the Mutations tab starts rendering
        const triggerForAnEarlierGenomeNexusCall = this.props.store
            .indexedVariantAnnotations.result;

        return (
            <div data-test="mutationsTabDiv">
                {this.props.store.mutationsByGene.isComplete && (
                    <MSKTabs
                        id="mutationsPageTabs"
                        activeTabId={activeTabId}
                        onTabClick={(id: string) => this.handleTabChange(id)}
                        className="pillTabs resultsPageMutationsGeneTabs"
                        arrowStyle={{ 'line-height': 0.8 }}
                        tabButtonStyle="pills"
                        unmountOnHide={true}
                    >
                        {this.generateTabs(
                            this.props.store.hugoGeneSymbols,
                            this.props.store.mutationsByGene.result
                        )}
                    </MSKTabs>
                )}
                {this.props.store.mutationsByGene.isPending && (
                    <LoadingIndicator
                        center={true}
                        size="big"
                        isLoading={true}
                    />
                )}
            </div>
        );
    }

    protected generateTabs(
        genes: string[],
        mutationsByGene: {
            [hugoGeneSymbol: string]: Mutation[];
        }
    ) {
        const tabs: JSX.Element[] = [];

        genes.forEach((gene: string) => {
            if (mutationsByGene[gene]) {
                const tabHasMutations = mutationsByGene[gene].length > 0;
                // gray out tab if no mutations
                const anchorStyle = tabHasMutations
                    ? undefined
                    : { color: '#bbb' };

                tabs.push(
                    <MSKTab
                        key={gene}
                        id={gene}
                        linkText={gene}
                        anchorStyle={anchorStyle}
                    >
                        {this.selectedGeneSymbol === gene &&
                            this.geneTabContent}
                    </MSKTab>
                );
            }
        });

        return tabs;
    }

    @autobind
    protected handleTabChange(id: string) {
        this.setSelectedGeneSymbol(id);
    }

    @action.bound
    protected handleOncoKbIconToggle(mergeIcons: boolean) {
        this.userSelectionStore.mergeOncoKbIcons = mergeIcons;
        saveOncoKbIconStyleToLocalStorage({ mergeIcons });
    }

    @computed get geneTabContent() {
        if (
            this.selectedGene &&
            this.props.store.getMutationMapperStore(this.selectedGene)
        ) {
            const mutationMapperStore = this.props.store.getMutationMapperStore(
                this.selectedGene
            )!;

            return (
                <div>
                    <div className={'tabMessageContainer'}>
                        <OqlStatusBanner
                            className="mutations-oql-status-banner"
                            queryContainsOql={this.props.store.queryContainsOql}
                            tabReflectsOql={
                                this.props.store.mutationsTabFilteringSettings
                                    .useOql
                            }
                            isUnaffected={
                                !this.props.store.queryContainsMutationOql
                            }
                            onToggle={this.onToggleOql}
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
                                this.props.store
                                    .oqlFilteredStructuralVariantsReport
                            }
                            mutationsTabModeSettings={{
                                excludeVUS: this.props.store
                                    .mutationsTabFilteringSettings.excludeVus,
                                excludeGermline: this.props.store
                                    .mutationsTabFilteringSettings
                                    .excludeGermline,
                                toggleExcludeVUS: this.onToggleVUS,
                                toggleExcludeGermline: this.onToggleGermline,
                                hugoGeneSymbol: this.selectedGene
                                    .hugoGeneSymbol,
                            }}
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
                    <ResultsViewMutationMapper
                        {...convertToMutationMapperProps({
                            ...getServerConfig(),
                            // override ensemblLink
                            ensembl_transcript_url: this.props.store
                                .ensemblLink,
                            // only disable oncokb and hotspots track if
                            // non-canonical transcript is selected
                            show_oncokb: mutationMapperStore.isCanonicalTranscript
                                ? getServerConfig().show_oncokb
                                : false,
                            show_hotspot: mutationMapperStore.isCanonicalTranscript
                                ? getServerConfig().show_hotspot
                                : false,
                        })}
                        oncoKbPublicApiUrl={getOncoKbApiUrl()}
                        mergeOncoKbIcons={
                            this.userSelectionStore.mergeOncoKbIcons
                        }
                        onOncoKbIconToggle={this.handleOncoKbIconToggle}
                        store={mutationMapperStore}
                        isPutativeDriver={
                            this.props.store.driverAnnotationSettings
                                .driversAnnotated
                                ? isPutativeDriver
                                : undefined
                        }
                        enableCustomDriver={
                            this.props.store.driverAnnotationSettings
                                .customBinary
                        }
                        trackVisibility={
                            this.userSelectionStore.trackVisibility
                        }
                        columnVisibility={
                            this.userSelectionStore.columnVisibility
                        }
                        storeColumnVisibility={
                            this.userSelectionStore.storeColumnVisibility
                        }
                        discreteCNACache={this.props.store.discreteCNACache}
                        pubMedCache={this.props.store.pubMedCache}
                        cancerTypeCache={this.props.store.cancerTypeCache}
                        mutationCountCache={this.props.store.mutationCountCache}
                        clinicalAttributeCache={
                            this.props.store.clinicalAttributeCache
                        }
                        genomeNexusCache={this.props.store.genomeNexusCache}
                        genomeNexusMutationAssessorCache={
                            this.props.store.genomeNexusMutationAssessorCache
                        }
                        pdbHeaderCache={this.props.store.pdbHeaderCache}
                        userDisplayName={this.props.appStore.userName!}
                        generateGenomeNexusHgvsgUrl={
                            this.props.store.generateGenomeNexusHgvsgUrl
                        }
                        existsSomeMutationWithAscnProperty={
                            this.props.store.existsSomeMutationWithAscnProperty
                        }
                        mutationAlignerUrlTemplate={getMutationAlignerUrlTemplate()}
                        showTranscriptDropDown={
                            getServerConfig().show_transcript_dropdown
                        }
                        onTranscriptChange={this.onTranscriptChange}
                        onClickSettingMenu={this.onClickSettingMenu}
                        compactStyle={true}
                        ptmSources={getServerConfig().ptmSources}
                        plotYAxisLabelFormatter={symbol => {
                            return `${symbol} patients`;
                        }}
                        plotLollipopTooltipCountInfo={
                            this.plotLollipopTooltipCountInfo
                        }
                    />
                </div>
            );
        } else {
            return null;
        }
    }

    @action.bound
    protected onTranscriptChange(transcriptId: string) {
        this.props.urlWrapper.updateURL({
            mutations_transcript_id: transcriptId,
        });
    }

    @action.bound
    protected onClickSettingMenu(visible: boolean) {
        this.props.store.isSettingsMenuVisible = visible;
    }

    @autobind
    protected plotLollipopTooltipCountInfo(
        count: number,
        mutations: Mutation[],
        axisMode: AxisScale
    ) {
        if (this.props.store.filteredPatients.isComplete) {
            return (
                <LollipopTooltipCountInfo
                    count={count}
                    mutations={mutations}
                    axisMode={axisMode}
                    patientCount={
                        this.props.store.filteredPatients.result.length
                    }
                />
            );
        } else {
            return <></>;
        }
    }
}
