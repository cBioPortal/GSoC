import {
    ICivicGeneIndex,
    ICivicVariantIndex,
    IHotspotIndex,
    IOncoKbData,
    getRemoteDataGroupStatus,
    MobxCache,
    Mutation,
    RemoteData,
    Pathogenicity,
} from 'cbioportal-utils';
import { MyVariantInfo, VariantAnnotation } from 'genome-nexus-ts-api-client';
import { CancerGene } from 'oncokb-ts-api-client';
import _ from 'lodash';
import { action, computed, makeObservable } from 'mobx';
import { observer } from 'mobx-react';
import * as React from 'react';
import { Column } from 'react-table';

import Annotation, { getAnnotationData } from '../column/Annotation';
import ClinvarInterpretation from '../column/ClinvarInterpretation';
import Dbsnp from '../column/Dbsnp';
import Gnomad from '../column/Gnomad';
import Hgvsc from '../column/Hgvsc';
import Hgvsg from '../column/Hgvsg';
import Signal, { getSignalData } from '../column/Signal';
import { getHgvscColumnData, getHgvsgColumnData } from '../column/HgvsHelper';
import { getMyVariantInfoData } from '../column/MyVariantInfoHelper';
import { MutationFilterValue } from '../../filter/MutationFilter';
import { DataFilterType } from '../../model/DataFilter';
import {
    findNonTextInputFilters,
    TEXT_INPUT_FILTER_ID,
} from '../../util/FilterUtils';
import DataTable, {
    DataTableColumn,
    DataTableProps,
} from '../dataTable/DataTable';
import { MutationColumn } from './MutationColumnHelper';

import './defaultMutationTable.scss';
import { getClinvarData } from '../clinvar/ClinvarHelper';

export type DefaultMutationTableProps = {
    hotspotData?: RemoteData<IHotspotIndex | undefined>;
    oncoKbData?: RemoteData<IOncoKbData | Error | undefined>;
    oncoKbCancerGenes?: RemoteData<CancerGene[] | Error | undefined>;
    usingPublicOncoKbInstance: boolean;
    indexedMyVariantInfoAnnotations?: RemoteData<
        { [genomicLocation: string]: MyVariantInfo } | undefined
    >;
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >;
    selectedTranscriptId?: string;
    enableCivic?: boolean;
    enableRevue?: boolean;
    civicGenes?: RemoteData<ICivicGeneIndex | undefined>;
    civicVariants?: RemoteData<ICivicVariantIndex | undefined>;
    pubMedCache?: MobxCache;
    columns: Column<Partial<Mutation>>[];
    appendColumns?: boolean;
} & DataTableProps<Partial<Mutation>>;

@observer
class DefaultMutationTableComponent extends DataTable<Partial<Mutation>> {}

@observer
export default class DefaultMutationTable extends React.Component<
    DefaultMutationTableProps,
    {}
> {
    constructor(props: any) {
        super(props);
        makeObservable(this);
    }
    public static defaultProps = {
        initialSort: [{ column: MutationColumn.ANNOTATION }],
        appendColumns: true,
    };

    @computed
    get annotationColumnData() {
        return [
            this.props.oncoKbCancerGenes,
            this.props.hotspotData,
            this.props.oncoKbData,
            this.props.civicVariants,
        ];
    }

    @computed
    get annotationColumnDataStatus() {
        return getRemoteDataGroupStatus(
            ..._.compact(this.annotationColumnData)
        );
    }

    @computed
    get indexedVariantAnnotationDataStatus() {
        return this.props.indexedVariantAnnotations
            ? this.props.indexedVariantAnnotations.status
            : 'complete';
    }

    @computed
    get myVariantInfoAnnotationsDataStatus() {
        return this.props.indexedMyVariantInfoAnnotations
            ? this.props.indexedMyVariantInfoAnnotations.status
            : 'complete';
    }

    @computed
    get annotationColumnAccessor() {
        return this.annotationColumnDataStatus === 'pending'
            ? () => undefined
            : (mutation: Mutation) =>
                  getAnnotationData(
                      mutation,
                      this.props.oncoKbCancerGenes,
                      this.props.hotspotData,
                      this.props.oncoKbData,
                      this.props.usingPublicOncoKbInstance,
                      this.props.civicGenes,
                      this.props.civicVariants,
                      this.props.indexedVariantAnnotations
                  );
    }

    @computed
    get myVariantInfoAccessor() {
        return this.myVariantInfoAnnotationsDataStatus === 'pending'
            ? () => undefined
            : (mutation: Mutation) =>
                  getMyVariantInfoData(
                      mutation,
                      this.props.indexedMyVariantInfoAnnotations
                  );
    }

    @computed
    get hgvsgAccessor() {
        return this.indexedVariantAnnotationDataStatus === 'pending'
            ? () => undefined
            : (mutation: Mutation) => getHgvsgColumnData(mutation);
    }

    @computed
    get hgvscAccessor() {
        return this.indexedVariantAnnotationDataStatus === 'pending'
            ? () => undefined
            : (mutation: Mutation) =>
                  getHgvscColumnData(
                      mutation,
                      this.props.indexedVariantAnnotations,
                      this.props.selectedTranscriptId
                  );
    }

    @computed
    get signalAccessor() {
        return this.indexedVariantAnnotationDataStatus === 'pending'
            ? () => undefined
            : (mutation: Mutation) =>
                  getSignalData(
                      mutation,
                      this.props.indexedVariantAnnotations,
                      Pathogenicity.GERMLINE
                  )[0];
    }

    @computed
    get clinvarAccessor() {
        return this.indexedVariantAnnotationDataStatus === 'pending'
            ? () => undefined
            : (mutation: Mutation) =>
                  getClinvarData(
                      mutation,
                      this.props.indexedVariantAnnotations
                  );
    }

    @computed
    get initialSortRemoteData() {
        return this.props.initialSortRemoteData || this.annotationColumnData;
    }

    protected getDefaultColumnAccessor(columnKey: MutationColumn) {
        switch (columnKey) {
            case MutationColumn.ANNOTATION:
                return this.annotationColumnAccessor;
            case MutationColumn.HGVSG:
                return this.hgvsgAccessor;
            case MutationColumn.HGVSC:
                return this.hgvscAccessor;
            case MutationColumn.GNOMAD:
                return this.myVariantInfoAccessor;
            case MutationColumn.CLINVAR:
                return this.clinvarAccessor;
            case MutationColumn.DBSNP:
                return this.myVariantInfoAccessor;
            case MutationColumn.SIGNAL:
                return this.signalAccessor;
            default:
                return undefined;
        }
    }

    protected getDefaultColumnCellRender(columnKey: MutationColumn) {
        switch (columnKey) {
            case MutationColumn.ANNOTATION:
                return (column: any) => (
                    <Annotation
                        mutation={column.original}
                        enableOncoKb={true}
                        enableHotspot={true}
                        enableCivic={this.props.enableCivic || false}
                        enableRevue={true}
                        hotspotData={this.props.hotspotData}
                        oncoKbData={this.props.oncoKbData}
                        oncoKbCancerGenes={this.props.oncoKbCancerGenes}
                        usingPublicOncoKbInstance={
                            this.props.usingPublicOncoKbInstance
                        }
                        pubMedCache={this.props.pubMedCache}
                        civicGenes={this.props.civicGenes}
                        civicVariants={this.props.civicVariants}
                        indexedVariantAnnotations={
                            this.props.indexedVariantAnnotations
                        }
                    />
                );
            case MutationColumn.HGVSG:
                return (column: any) => <Hgvsg mutation={column.original} />;
            case MutationColumn.HGVSC:
                return (column: any) => (
                    <Hgvsc
                        mutation={column.original}
                        indexedVariantAnnotations={
                            this.props.indexedVariantAnnotations
                        }
                        selectedTranscriptId={this.props.selectedTranscriptId}
                    />
                );
            case MutationColumn.GNOMAD:
                return (column: any) => (
                    <Gnomad
                        mutation={column.original}
                        indexedMyVariantInfoAnnotations={
                            this.props.indexedMyVariantInfoAnnotations
                        }
                        indexedVariantAnnotations={
                            this.props.indexedVariantAnnotations
                        }
                    />
                );
            case MutationColumn.CLINVAR:
                return (column: any) => (
                    <ClinvarInterpretation
                        mutation={column.original}
                        indexedVariantAnnotations={
                            this.props.indexedVariantAnnotations
                        }
                    />
                );
            case MutationColumn.DBSNP:
                return (column: any) => (
                    <Dbsnp
                        mutation={column.original}
                        indexedMyVariantInfoAnnotations={
                            this.props.indexedMyVariantInfoAnnotations
                        }
                    />
                );
            case MutationColumn.SIGNAL:
                return (column: any) => (
                    <Signal
                        mutation={column.original}
                        indexedVariantAnnotations={
                            this.props.indexedVariantAnnotations
                        }
                        mutationType={Pathogenicity.GERMLINE}
                    />
                );
            default:
                return undefined;
        }
    }

    @computed
    get columns() {
        return this.props.columns.map(c => {
            // we need to clone the column definition first,
            // directly modifying the props.columns breaks certain column functionality
            const column = { ...c };

            if (!column.accessor) {
                const defaultAccessor = this.getDefaultColumnAccessor(
                    column.id as MutationColumn
                );
                if (defaultAccessor) {
                    column.accessor = defaultAccessor;
                }
            }
            if (!column.Cell) {
                const defaultCellRender = this.getDefaultColumnCellRender(
                    column.id as MutationColumn
                );
                if (defaultCellRender) {
                    column.Cell = defaultCellRender;
                }
            }
            return column;
        });
    }

    public render() {
        return (
            <DefaultMutationTableComponent
                {...this.props}
                columns={this.columns}
                initialSortRemoteData={this.initialSortRemoteData}
                onSearch={this.onSearch}
                className="default-mutation-table"
            />
        );
    }

    @action.bound
    protected onSearch(
        searchText: string,
        visibleSearchableColumns: DataTableColumn<Mutation>[]
    ) {
        if (this.props.dataStore) {
            // all other filters except current text input filter
            const otherFilters = findNonTextInputFilters(
                this.props.dataStore.dataFilters
            );

            let dataFilterValues: MutationFilterValue[] = [];

            if (searchText.length > 0) {
                dataFilterValues = visibleSearchableColumns.map(
                    c => ({ [c.id!]: searchText } as MutationFilterValue)
                );

                const textInputFilter = {
                    id: TEXT_INPUT_FILTER_ID,
                    type: DataFilterType.MUTATION,
                    values: dataFilterValues,
                };

                // replace current text input filter with the new one
                this.props.dataStore.setDataFilters([
                    ...otherFilters,
                    textInputFilter,
                ]);
            } else {
                // if no text input remove text input filter (set data filters to all other filters except input)
                this.props.dataStore.setDataFilters(otherFilters);
            }
        }
    }
}
