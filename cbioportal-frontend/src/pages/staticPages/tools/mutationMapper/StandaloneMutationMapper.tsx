import * as React from 'react';
import { observer } from 'mobx-react';
import StandaloneMutationTable from './StandaloneMutationTable';
import {
    IMutationMapperProps,
    default as MutationMapper,
} from 'shared/components/mutationMapper/MutationMapper';
import { MutationTableDownloadDataFetcher } from 'shared/lib/MutationTableDownloadDataFetcher';
import MutationMapperDataStore from 'shared/components/mutationMapper/MutationMapperDataStore';
import { computed } from 'mobx';
import { ExtendedMutationTableColumnType } from 'shared/components/mutationTable/MutationTable';
import _ from 'lodash';
import { extractColumnNames } from 'shared/components/mutationMapper/MutationMapperUtils';
import ResultsViewMutationTable from 'pages/resultsView/mutation/ResultsViewMutationTable';
import { getServerConfig } from 'config/config';

export interface IStandaloneMutationMapperProps extends IMutationMapperProps {
    // add standalone view specific props here if needed
    downloadDataFetcher?: MutationTableDownloadDataFetcher;
    generateGenomeNexusHgvsgUrl: (hgvsg: string) => string;
}
@observer
export default class StandaloneMutationMapper extends MutationMapper<
    IStandaloneMutationMapperProps
> {
    constructor(props: IMutationMapperProps) {
        super(props);
    }

    protected get mutationTableComponent(): JSX.Element | null {
        return (
            <StandaloneMutationTable
                uniqueSampleKeyToTumorType={
                    this.props.store.uniqueSampleKeyToTumorType
                }
                oncoKbCancerGenes={this.props.store.oncoKbCancerGenes}
                usingPublicOncoKbInstance={
                    getServerConfig().show_oncokb &&
                    this.props.store.usingPublicOncoKbInstance
                }
                mergeOncoKbIcons={this.props.mergeOncoKbIcons}
                onOncoKbIconToggle={this.props.onOncoKbIconToggle}
                indexedVariantAnnotations={
                    this.props.store.indexedVariantAnnotations
                }
                indexedMyVariantInfoAnnotations={
                    this.props.store.indexedMyVariantInfoAnnotations
                }
                genomeNexusCache={this.props.genomeNexusCache}
                genomeNexusMutationAssessorCache={
                    this.props.genomeNexusMutationAssessorCache
                }
                pubMedCache={this.props.pubMedCache}
                dataStore={
                    this.props.store.dataStore as MutationMapperDataStore
                }
                itemsLabelPlural={this.itemsLabelPlural}
                downloadDataFetcher={this.props.downloadDataFetcher}
                hotspotData={this.props.store.indexedHotspotData}
                oncoKbData={this.props.store.oncoKbData}
                civicVariants={this.props.store.civicVariants}
                civicGenes={this.props.store.civicGenes}
                enableOncoKb={this.props.enableOncoKb}
                enableFunctionalImpact={this.props.enableGenomeNexus}
                enableHotspot={this.props.enableHotspot}
                enableCivic={this.props.enableCivic}
                generateGenomeNexusHgvsgUrl={
                    this.props.generateGenomeNexusHgvsgUrl
                }
                selectedTranscriptId={this.props.store.activeTranscript.result}
                namespaceColumns={this.props.store.namespaceColumnConfig}
                columns={this.columns}
            />
        );
    }

    @computed get columns(): ExtendedMutationTableColumnType[] {
        const namespaceColumnNames = extractColumnNames(
            this.props.store.namespaceColumnConfig
        );
        return _.concat(
            StandaloneMutationTable.defaultProps.columns,
            namespaceColumnNames
        );
    }

    protected get isMutationTableDataLoading() {
        return this.props.store.activeTranscript.isPending;
    }

    protected get mutationTable(): JSX.Element | null {
        return (
            <span>
                {!this.isMutationTableDataLoading &&
                    this.mutationTableComponent}
            </span>
        );
    }
}
