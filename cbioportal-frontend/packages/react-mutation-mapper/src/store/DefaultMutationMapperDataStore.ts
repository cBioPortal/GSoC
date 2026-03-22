import autobind from 'autobind-decorator';
import _ from 'lodash';
import { action, computed, observable, makeObservable } from 'mobx';

import { Mutation } from 'cbioportal-utils';

import { DataFilter, DataFilterType } from '../model/DataFilter';
import DataStore from '../model/DataStore';
import { FilterApplier } from '../model/FilterApplier';
import {
    applyDataFiltersOnDatum,
    groupDataByGroupFilters,
    indexPositions,
} from '../util/FilterUtils';

type GroupedData = Array<{ group: string; data: Array<Mutation | Mutation[]> }>;

export class DefaultMutationMapperDataStore implements DataStore {
    @observable public dataFilters: DataFilter[];
    @observable public selectionFilters: DataFilter[];
    @observable public highlightFilters: DataFilter[];
    @observable public groupFilters: { group: string; filter: DataFilter }[];

    // TODO simplify data if possible
    private data: Array<Mutation | Mutation[]>;

    // this custom filter applier allows us to interpret selection and highlight filters in a customized way,
    // by default only position filters are taken into account
    protected customFilterApplier: FilterApplier | undefined;

    constructor(
        data: Array<Mutation | Mutation[]>,
        customFilterApplier?: FilterApplier,
        dataFilters: DataFilter[] = [],
        selectionFilters: DataFilter[] = [],
        highlightFilters: DataFilter[] = [],
        groupFilters: { group: string; filter: DataFilter }[] = []
    ) {
        makeObservable(this);
        this.data = data;
        this.customFilterApplier = customFilterApplier;

        this.dataFilters = dataFilters;
        this.selectionFilters = selectionFilters;
        this.highlightFilters = highlightFilters;
        this.groupFilters = groupFilters;
    }

    @computed get groupFiltersKeyedByGroup() {
        return _.keyBy(this.groupFilters, 'group');
    }

    @computed
    public get allData() {
        return this.data;
    }

    @computed
    public get filteredData() {
        return this.dataFilters.length > 0
            ? // TODO simplify array flatten if possible
              this.data.filter(m => this.dataMainFilter(_.flatten([m])[0]))
            : this.data;
    }

    @computed
    public get sortedFilteredData() {
        return this.filteredData;
    }

    @computed
    public get sortedFilteredGroupedData(): GroupedData {
        return groupDataByGroupFilters(
            this.groupFilters,
            this.sortedFilteredData,
            this.applyFilter
        );
    }

    @computed
    public get sortedFilteredSelectedData() {
        return this.selectionFilters.length > 0
            ? // TODO simplify array flatten if possible
              this.sortedFilteredData.filter(m =>
                  this.dataSelectFilter(_.flatten([m])[0])
              )
            : [];
    }

    @computed
    public get selectedPositions() {
        return indexPositions(this.selectionFilters);
    }

    @computed
    public get highlightedPositions() {
        return indexPositions(this.highlightFilters);
    }

    @action
    public clearHighlightFilters() {
        if (this.highlightFilters.length > 0) {
            this.highlightFilters = [];
        }
    }

    @action
    public clearSelectionFilters() {
        if (this.selectionFilters.length > 0) {
            this.selectionFilters = [];
        }
    }

    @action
    public clearDataFilters() {
        if (this.dataFilters.length > 0) {
            this.dataFilters = [];
        }
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

    public dataMainFilter(mutation: Mutation): boolean {
        return applyDataFiltersOnDatum(
            mutation,
            this.dataFilters,
            this.applyFilter
        );
    }

    public dataSelectFilter(mutation: Mutation): boolean {
        return applyDataFiltersOnDatum(
            mutation,
            this.selectionFilters,
            this.applyFilter
        );
    }

    public dataHighlightFilter(mutation: Mutation): boolean {
        return applyDataFiltersOnDatum(
            mutation,
            this.highlightFilters,
            this.applyFilter
        );
    }

    @autobind
    public applyFilter(filter: DataFilter, mutation: Mutation): boolean {
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
}

export default DefaultMutationMapperDataStore;
