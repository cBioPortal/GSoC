import * as React from 'react';
import { observer } from 'mobx-react';
import { makeObservable, observable } from 'mobx';
import { ClinicalData, Mutation } from 'cbioportal-ts-api-client';
import { MobxPromise } from 'cbioportal-frontend-commons';
import { IColumnVisibilityControlsProps } from 'shared/components/columnVisibilityControls/ColumnVisibilityControls';
import SampleManager from '../SampleManager';
import PubMedCache from 'shared/cache/PubMedCache';
import MrnaExprRankCache from 'shared/cache/MrnaExprRankCache';
import { GeneFilterOption } from '../mutation/GeneFilterMenu';
import {
    ICivicGeneIndex,
    ICivicVariantIndex,
    IHotspotIndex,
    IOncoKbData,
    RemoteData,
} from 'cbioportal-utils';
import { CancerGene } from 'oncokb-ts-api-client';
import { DEFAULT_ONCOKB_CONTENT_WIDTH } from 'shared/lib/AnnotationColumnUtils';
import { ILazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import PatientViewMutationTable from './PatientViewMutationTable';
import { getServerConfig, ServerConfigHelpers } from 'config/config';
import DiscreteCNACache from 'shared/cache/DiscreteCNACache';
import GenomeNexusCache from 'shared/cache/GenomeNexusCache';
import GenomeNexusMutationAssessorCache from 'shared/cache/GenomeNexusMutationAssessorCache';
import { IMutSigData } from 'shared/model/MutSig';

import FeatureInstruction from 'shared/FeatureInstruction/FeatureInstruction';
import { getSamplesProfiledStatus } from 'pages/patientView/PatientViewPageUtils';
import { MakeMobxView } from 'shared/components/MobxView';
import LoadingIndicator from 'shared/components/loadingIndicator/LoadingIndicator';
import ErrorMessage from 'shared/components/ErrorMessage';
import { PatientViewPageStore } from 'pages/patientView/clinicalInformation/PatientViewPageStore';
import SampleNotProfiledAlert from 'shared/components/SampleNotProfiledAlert';
import { NamespaceColumnConfig } from 'shared/components/namespaceColumns/NamespaceColumnConfig';

export const TABLE_FEATURE_INSTRUCTION =
    'Click on an mutation to zoom in on the gene in the IGV browser above';

type IMutationTableWrapperProps = {
    patientViewPageStore: PatientViewPageStore;
    dataStore?: ILazyMobXTableApplicationDataStore<Mutation[]>;
    sampleManager: SampleManager | null;
    sampleIds: string[];
    discreteCNACache?: DiscreteCNACache;
    mrnaExprRankCache?: MrnaExprRankCache;
    pubMedCache?: PubMedCache;
    genomeNexusCache?: GenomeNexusCache;
    genomeNexusMutationAssessorCache?: GenomeNexusMutationAssessorCache;
    mrnaExprRankMolecularProfileId?: string;
    discreteCNAMolecularProfileId?: string;
    mutSigData?: IMutSigData;
    hotspotData?: RemoteData<IHotspotIndex | undefined>;
    oncoKbData?: RemoteData<IOncoKbData | Error>;
    oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>;
    mergeOncoKbIcons?: boolean;
    onOncoKbIconToggle: (mergeIcons: boolean) => void;
    civicGenes?: RemoteData<ICivicGeneIndex | undefined>;
    civicVariants?: RemoteData<ICivicVariantIndex | undefined>;
    userDisplayName?: string | undefined;
    enableOncoKb?: boolean;
    enableCivic?: boolean;
    columnVisibility?: { [columnId: string]: boolean };
    showGeneFilterMenu?: boolean;
    onFilterGenes?: (option: GeneFilterOption) => void;
    columnVisibilityProps?: IColumnVisibilityControlsProps;
    onSelectGenePanel?: (name: string) => void;
    disableTooltip?: boolean;
    onRowClick?: (d: Mutation[]) => void;
    onRowMouseEnter?: (d: Mutation[]) => void;
    onRowMouseLeave?: (d: Mutation[]) => void;
    sampleIdToClinicalDataMap?: MobxPromise<{ [x: string]: ClinicalData[] }>;
    namespaceColumns: NamespaceColumnConfig;
    columns: string[];
    alleleFreqHeaderRender?: ((name: string) => JSX.Element) | undefined;
    pageMode?: 'sample' | 'patient';
};

const ANNOTATION_ELEMENT_ID = 'mutation-annotation';

@observer
export default class MutationTableWrapper extends React.Component<
    IMutationTableWrapperProps,
    {}
> {
    @observable oncokbWidth = DEFAULT_ONCOKB_CONTENT_WIDTH;

    private oncokbInterval: any;

    constructor(props: IMutationTableWrapperProps) {
        super(props);
        makeObservable(this);

        // here we wait for the oncokb icons to fully finish rendering
        // then update the oncokb width in order to align annotation column header icons with the cell content
        // this.oncokbInterval = calculateOncoKbContentWidthWithInterval(
        //     ANNOTATION_ELEMENT_ID,
        //     oncoKbContentWidth => {
        //         (this.oncokbWidth = oncoKbContentWidth)
        //     }
        // );
    }

    public destroy() {
        clearInterval(this.oncokbInterval);
    }

    public static defaultProps = {
        enableOncoKb: true,
        enableCivic: false,
        showGeneFilterMenu: true,
    };

    public get pageStore() {
        return this.props.patientViewPageStore;
    }

    tableUI = MakeMobxView({
        await: () => [
            this.pageStore.mutationData,
            this.pageStore.uncalledMutationData,
            this.pageStore.oncoKbAnnotatedGenes,
            this.pageStore.sampleToDiscreteGenePanelId,
            this.pageStore.mutationMolecularProfile,
            this.pageStore.mutationMolecularProfile,
            this.pageStore.genePanelDataByMolecularProfileIdAndSampleId,
            this.pageStore.sampleManager,
            this.pageStore.studyIdToStudy,
            this.pageStore.sampleToMutationGenePanelId,
            this.pageStore.genePanelIdToEntrezGeneIds,
            this.pageStore.molecularProfileIdToMolecularProfile,
            this.pageStore.mrnaRankMolecularProfileId,
            this.pageStore.molecularProfileIdDiscrete,
            this.pageStore.mutSigData,
            this.pageStore.mutationTableShowGeneFilterMenu,
        ],

        render: () => {
            if (!this.pageStore.mutationMolecularProfile.result) {
                return (
                    <div className="alert alert-info" role="alert">
                        Study is not profiled for mutations.
                    </div>
                );
            }

            const { someProfiled } = getSamplesProfiledStatus(
                this.props.sampleIds,
                this.pageStore.genePanelDataByMolecularProfileIdAndSampleId
                    .result,
                this.pageStore.mutationMolecularProfile.result
                    .molecularProfileId
            );

            return (
                <>
                    <SampleNotProfiledAlert
                        sampleManager={this.props.sampleManager!}
                        genePanelDataByMolecularProfileIdAndSampleId={
                            this.pageStore
                                .genePanelDataByMolecularProfileIdAndSampleId
                                .result
                        }
                        molecularProfiles={[
                            this.pageStore.mutationMolecularProfile.result!,
                        ]}
                    />
                    {someProfiled && (
                        <FeatureInstruction content={TABLE_FEATURE_INSTRUCTION}>
                            <PatientViewMutationTable
                                dataStore={this.props.dataStore}
                                studyIdToStudy={
                                    this.pageStore.studyIdToStudy.result
                                }
                                sampleManager={
                                    this.pageStore.sampleManager.result!
                                }
                                sampleToGenePanelId={
                                    this.pageStore.sampleToMutationGenePanelId
                                        .result
                                }
                                genePanelIdToEntrezGeneIds={
                                    this.pageStore.genePanelIdToEntrezGeneIds
                                        .result
                                }
                                sampleIds={this.props.sampleIds}
                                uniqueSampleKeyToTumorType={
                                    this.pageStore.uniqueSampleKeyToTumorType
                                }
                                molecularProfileIdToMolecularProfile={
                                    this.pageStore
                                        .molecularProfileIdToMolecularProfile
                                        .result
                                }
                                variantCountCache={
                                    this.pageStore.variantCountCache
                                }
                                indexedVariantAnnotations={
                                    this.pageStore.indexedVariantAnnotations
                                }
                                indexedMyVariantInfoAnnotations={
                                    this.pageStore
                                        .indexedMyVariantInfoAnnotations
                                }
                                discreteCNACache={
                                    this.pageStore.discreteCNACache
                                }
                                mrnaExprRankCache={
                                    this.pageStore.mrnaExprRankCache
                                }
                                pubMedCache={this.pageStore.pubMedCache}
                                genomeNexusCache={
                                    this.pageStore.genomeNexusCache
                                }
                                genomeNexusMutationAssessorCache={
                                    this.pageStore
                                        .genomeNexusMutationAssessorCache
                                }
                                mrnaExprRankMolecularProfileId={
                                    this.pageStore.mrnaRankMolecularProfileId
                                        .result || undefined
                                }
                                discreteCNAMolecularProfileId={
                                    this.pageStore.molecularProfileIdDiscrete
                                        .result
                                }
                                data={
                                    this.pageStore
                                        .mergedMutationDataIncludingUncalledFilteredByGene
                                }
                                downloadDataFetcher={
                                    this.pageStore.downloadDataFetcher
                                }
                                mutSigData={this.pageStore.mutSigData.result}
                                hotspotData={this.pageStore.indexedHotspotData}
                                oncoKbData={this.pageStore.oncoKbData}
                                oncoKbCancerGenes={
                                    this.pageStore.oncoKbCancerGenes
                                }
                                usingPublicOncoKbInstance={
                                    this.pageStore.usingPublicOncoKbInstance
                                }
                                mergeOncoKbIcons={this.props.mergeOncoKbIcons}
                                onOncoKbIconToggle={
                                    this.props.onOncoKbIconToggle
                                }
                                civicGenes={this.pageStore.civicGenes}
                                civicVariants={this.pageStore.civicVariants}
                                userDisplayName={ServerConfigHelpers.getUserDisplayName()}
                                enableOncoKb={getServerConfig().show_oncokb}
                                enableFunctionalImpact={
                                    getServerConfig().show_genomenexus
                                }
                                enableHotspot={getServerConfig().show_hotspot}
                                enableCivic={getServerConfig().show_civic}
                                enableRevue={getServerConfig().show_revue}
                                columnVisibility={this.props.columnVisibility}
                                showGeneFilterMenu={
                                    this.pageStore
                                        .mutationTableShowGeneFilterMenu.result
                                }
                                currentGeneFilter={
                                    this.pageStore.mutationTableGeneFilterOption
                                }
                                onFilterGenes={this.props.onFilterGenes}
                                columnVisibilityProps={
                                    this.props.columnVisibilityProps
                                }
                                onSelectGenePanel={this.props.onSelectGenePanel}
                                disableTooltip={this.props.disableTooltip}
                                generateGenomeNexusHgvsgUrl={
                                    this.pageStore.generateGenomeNexusHgvsgUrl
                                }
                                onRowClick={this.props.onRowClick}
                                onRowMouseEnter={this.props.onRowMouseEnter}
                                onRowMouseLeave={this.props.onRowMouseLeave}
                                sampleIdToClinicalDataMap={
                                    this.pageStore
                                        .clinicalDataGroupedBySampleMap
                                }
                                existsSomeMutationWithAscnProperty={
                                    this.pageStore
                                        .existsSomeMutationWithAscnProperty
                                }
                                namespaceColumns={this.props.namespaceColumns}
                                columns={this.props.columns}
                                alleleFreqHeaderRender={
                                    this.props.alleleFreqHeaderRender
                                }
                                initialSortColumn={
                                    getServerConfig()
                                        .skin_patient_view_tables_default_sort_column
                                }
                                customDriverName={
                                    getServerConfig()
                                        .oncoprint_custom_driver_annotation_binary_menu_label!
                                }
                                customDriverDescription={
                                    getServerConfig()
                                        .oncoprint_custom_driver_annotation_binary_menu_description!
                                }
                                customDriverTiersName={
                                    getServerConfig()
                                        .oncoprint_custom_driver_annotation_tiers_menu_label!
                                }
                                customDriverTiersDescription={
                                    getServerConfig()
                                        .oncoprint_custom_driver_annotation_tiers_menu_description!
                                }
                            />
                        </FeatureInstruction>
                    )}
                </>
            );
        },

        renderPending: () => <LoadingIndicator isLoading={true} />,
        renderError: () => <ErrorMessage />,
    });

    public render() {
        return this.tableUI.component;
    }
}
