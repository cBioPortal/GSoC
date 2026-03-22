import _ from 'lodash';
import { action, computed, observable, makeObservable } from 'mobx';
import autobind from 'autobind-decorator';
import {
    applyDataFiltersOnDatum,
    DataFilter,
    DataFilterType,
    DataStore,
    FilterApplier,
    findAllUniquePositions,
    groupDataByGroupFilters,
} from 'react-mutation-mapper';
import { SimpleLazyMobXTableApplicationDataStore } from 'shared/lib/ILazyMobXTableApplicationDataStore';
import { Mutation } from 'cbioportal-ts-api-client';
import {
    ANNOTATED_PROTEIN_IMPACT_TYPE_FILTER_ID,
    countDuplicateMutations,
    groupMutationsByGeneAndPatientAndProteinChange,
} from 'shared/lib/MutationUtils';
import { mergeMutations } from 'shared/lib/StoreUtils';

type GroupedData = { group: string; data: Mutation[][] }[];

export const PROTEIN_IMPACT_TYPE_FILTER_ID =
    '_cBioPortalProteinImpactTypeFilter_';
export const MUTATION_STATUS_FILTER_ID = '_cBioPortalMutationStatusFilter_';
export const PROTEIN_CHANGE_FILTER_ID = '_cBioPortalProteinChangeFilter_';

export function findProteinImpactTypeFilter(dataFilters: DataFilter[]) {
    // there are two types of filters (with putative driver, without putative driver)
    return dataFilters.find(
        f =>
            f.id === PROTEIN_IMPACT_TYPE_FILTER_ID ||
            f.id === ANNOTATED_PROTEIN_IMPACT_TYPE_FILTER_ID
    );
}

// TODO this is now mostly duplicate of DefaultMutationMapperDataStore in react-mutation-mapper,
//  we should reuse DefaultMutationMapperDataStore instead
export default class MutationMapperDataStore
    extends SimpleLazyMobXTableApplicationDataStore<Mutation[]>
    implements DataStore {
    @observable public dataFilters: DataFilter[] = [];
    @observable public selectionFilters: DataFilter[] = [];
    @observable public highlightFilters: DataFilter[] = [];
    @observable.ref public groupFilters: {
        group: string;
        filter: DataFilter;
    }[];
    public isDataMerged: boolean = false;

    private lazyMobXTableFilter:
        | ((
              d: Mutation[],
              filterString?: string,
              filterStringUpper?: string,
              filterStringLower?: string
          ) => boolean)
        | undefined;

    // this custom filter applier allows us to interpret selection and highlight filters in a customized way,
    // by default only position filters are taken into account
    protected customFilterApplier: FilterApplier | undefined;

    @computed
    public get sortedFilteredGroupedData(): GroupedData {
        return groupDataByGroupFilters(
            this.groupFilters,
            this.isDataMerged
                ? _.flatten(this.sortedFilteredData).map(mutation => [mutation])
                : this.sortedFilteredData,
            this.applyFilter
        );
    }

    @computed
    public get selectedPositions() {
        return _.keyBy(
            findAllUniquePositions(this.selectionFilters).map(p => ({
                position: p,
            })),
            'position'
        );
    }

    @computed
    public get highlightedPositions() {
        return _.keyBy(
            findAllUniquePositions(this.highlightFilters).map(p => ({
                position: p,
            })),
            'position'
        );
    }

    @action
    public clearDataFilters() {
        this.dataFilters = [];
    }

    @action
    public clearHighlightFilters() {
        this.highlightFilters = [];
    }

    @action
    public clearSelectionFilters() {
        this.selectionFilters = [];
    }

    @action
    public setDataFilters(filters: DataFilter[]) {
        this.dataFilters = filters;
    }

    @action
    public setHighlightFilters(filters: DataFilter[]) {
        this.highlightFilters = filters;
    }

    @action
    public setSelectionFilters(filters: DataFilter[]) {
        this.selectionFilters = filters;
    }

    @action
    public setGroupFilters(filters: { group: string; filter: DataFilter }[]) {
        this.groupFilters = filters;
    }

    public isPositionSelected(position: number) {
        return !!this.selectedPositions[position + ''];
    }

    public isPositionHighlighted(position: number) {
        return !!this.highlightedPositions[position + ''];
    }

    // override the parent method to always keep the default main filter (this allows multiple filtering)
    @action
    public setFilter(
        fn?: (
            d: Mutation[],
            filterString?: string,
            filterStringUpper?: string,
            filterStringLower?: string
        ) => boolean
    ) {
        super.setFilter(
            (
                d: Mutation[],
                filterString?: string,
                filterStringUpper?: string,
                filterStringLower?: string
            ) =>
                (!fn ||
                    fn(
                        d,
                        filterString,
                        filterStringUpper,
                        filterStringLower
                    )) &&
                (this.dataFilters.length === 0 || this.dataMainFilter(d))
        );

        // we also need to keep a reference to the original function to be able to apply it individually when necessary
        this.lazyMobXTableFilter = fn;
    }

    // override the parent method to always keep the default main filter
    @action
    public resetFilter() {
        super.resetFilter();
        this.dataFilter = (d: Mutation[]) =>
            this.dataFilters.length === 0 || this.dataMainFilter(d);
        this.lazyMobXTableFilter = undefined;
    }

    @action
    public resetFilters() {
        this.resetFilter();
        this.resetDataFilters();
    }

    @action
    public resetDataFilters() {
        this.clearDataFilters();
        this.clearHighlightFilters();
        this.clearSelectionFilters();
    }

    @computed
    get tableDataGroupedByPatients() {
        return groupMutationsByGeneAndPatientAndProteinChange(
            _.flatten(this.tableData)
        );
    }

    @computed
    get duplicateMutationCountInMultipleSamples(): number {
        return countDuplicateMutations(this.tableDataGroupedByPatients);
    }

    @computed
    get dataSampleIdentifiers() {
        return _.uniqBy(_.flatten(this.allData), m => m.sampleId).map(m => ({
            sampleId: m.sampleId,
            studyId: m.studyId,
        }));
    }

    @computed
    get dataPatientIds() {
        return _.uniq(_.flatten(this.allData).map(m => m.patientId));
    }

    @computed
    get tableDataSamples() {
        return _.uniqBy(_.flatten(this.tableData), m => m.sampleId).map(m => ({
            sampleId: m.sampleId,
            studyId: m.studyId,
        }));
    }

    @computed
    get tableDataPatients() {
        return _.uniq(_.flatten(this.tableData).map(m => m.patientId));
    }

    constructor(
        data: Mutation[][],
        isDataMerged?: boolean,
        customFilterApplier?: FilterApplier,
        dataFilters: DataFilter[] = [],
        selectionFilters: DataFilter[] = [],
        highlightFilters: DataFilter[] = [],
        groupFilters: { group: string; filter: DataFilter }[] = []
    ) {
        super(data);

        makeObservable(this);

        this.dataFilters = dataFilters;
        this.selectionFilters = selectionFilters;
        this.highlightFilters = highlightFilters;
        this.groupFilters = groupFilters;

        this.dataSelector = (d: Mutation[]) => this.dataSelectFilter(d);
        this.dataHighlighter = (d: Mutation[]) => this.dataHighlightFilter(d);
        this.customFilterApplier = customFilterApplier;
        this.setFilter();
        this.isDataMerged = !!isDataMerged;
    }

    @autobind
    public dataMainFilter(d: Mutation[]): boolean {
        return applyDataFiltersOnDatum(d, this.dataFilters, this.applyFilter);
    }

    @autobind
    public dataSelectFilter(d: Mutation[]): boolean {
        return applyDataFiltersOnDatum(
            d,
            this.selectionFilters,
            this.applyFilter
        );
    }

    @autobind
    public dataHighlightFilter(d: Mutation[]): boolean {
        return applyDataFiltersOnDatum(
            d,
            this.highlightFilters,
            this.applyFilter
        );
    }

    @autobind
    public applyFilter(filter: DataFilter, d: Mutation | Mutation[]): boolean {
        const mutation = _.flatten([d])[0];

        if (this.customFilterApplier) {
            // let the custom filter applier decide how to apply the given filter
            return this.customFilterApplier.applyFilter(filter, mutation);
        } else {
            // by default only filter by position
            return (
                filter.type !== DataFilterType.POSITION ||
                filter.values.includes(mutation.proteinPosStart)
            );
        }
    }

    @autobind
    public applyLazyMobXTableFilter(d: Mutation | Mutation[]): boolean {
        return (
            !this.filterString ||
            !this.lazyMobXTableFilter ||
            this.lazyMobXTableFilter(
                [_.flatten([d])[0]],
                this.filterString.toLowerCase(),
                this.filterString.toUpperCase()
            )
        );
    }
}
