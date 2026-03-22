import {
    getProteinImpactType,
    ProteinImpactType,
} from 'cbioportal-frontend-commons';
import { Mutation } from 'cbioportal-utils';
import _ from 'lodash';

import { MutationFilter, MutationFilterValue } from '../filter/MutationFilter';
import { MutationStatusFilter } from '../filter/MutationStatusFilter';
import { PositionFilter } from '../filter/PositionFilter';
import { ProteinImpactTypeFilter } from '../filter/ProteinImpactTypeFilter';
import { NumericalFilterValue } from '../filter/NumericalFilter';
import { CategoricalFilterValue } from '../filter/CategoricalFilter';
import DataStore from '../model/DataStore';
import { DataFilter, DataFilterType } from '../model/DataFilter';
import { ApplyFilterFn } from '../model/FilterApplier';
import { ProteinChangeFilter } from '../filter/ProteinChangeFilter';

export const TEXT_INPUT_FILTER_ID = '_mutationTableTextInputFilter_';

export function updatePositionSelectionFilters(
    dataStore: DataStore,
    position: number,
    isMultiSelect: boolean = false,
    defaultFilters: DataFilter[] = []
) {
    const currentlySelected = dataStore.isPositionSelected(position);
    let selectedPositions: number[] = [];

    if (isMultiSelect) {
        // we need to keep previous positions if shift pressed,
        // but we still want to clear other filters tied with these positions
        selectedPositions = findAllUniquePositions(dataStore.selectionFilters);

        // remove current position if already selected
        if (currentlySelected) {
            selectedPositions = _.without(selectedPositions, position);
        }
    }

    // add current position into list if not selected
    if (!currentlySelected) {
        selectedPositions.push(position);
    }

    const positionFilter = {
        type: DataFilterType.POSITION,
        values: selectedPositions,
    };
    // we want to keep other filters (filters not related to positions) as is
    const otherFilters = dataStore.selectionFilters.filter(
        f => f.type !== DataFilterType.POSITION
    );

    // reset filters
    dataStore.clearSelectionFilters();
    dataStore.setSelectionFilters([
        positionFilter,
        ...defaultFilters,
        ...otherFilters,
    ]);
}

export function updatePositionHighlightFilters(
    dataStore: DataStore,
    positions: number[],
    defaultFilters: DataFilter[] = []
) {
    dataStore.clearHighlightFilters();

    const positionFilter = {
        type: DataFilterType.POSITION,
        values: positions,
    };
    dataStore.setHighlightFilters([...defaultFilters, positionFilter]);
}

export function updatePositionRangeHighlightFilters(
    dataStore: DataStore,
    startPosition: number,
    endPosition: number,
    defaultFilters: DataFilter[] = []
) {
    const positions: number[] = [];

    for (let i = startPosition; i <= endPosition; i++) {
        positions.push(i);
    }

    updatePositionHighlightFilters(dataStore, positions, defaultFilters);
}

export function findAllUniquePositions(filters: DataFilter[]): number[] {
    return _.uniq(
        _.flatten(
            filters
                // pick only position filters
                .filter(f => f.type === DataFilterType.POSITION)
                // we need to spread f.values, since it might be an observable mobx array
                // (mobx observable arrays does not play well with some array functions)
                .map(f => [...f.values])
        )
    );
}

export function indexPositions(
    filters: DataFilter[]
): { [position: string]: { position: number } } {
    return _.keyBy(
        findAllUniquePositions(filters).map(p => ({ position: p })),
        'position'
    );
}

export function includesSearchTextIgnoreCase(
    value?: string,
    searchText?: string
) {
    return (
        searchText &&
        (value || '').toLowerCase().includes(searchText.toLowerCase())
    );
}

export function findTextInputFilter(dataFilters: DataFilter[]) {
    return dataFilters.find(f => f.id === TEXT_INPUT_FILTER_ID);
}

export function findNonTextInputFilters(dataFilters: DataFilter[]) {
    return dataFilters.filter(f => f.id !== TEXT_INPUT_FILTER_ID);
}

export function findOneMutationFilterValue(filter: MutationFilter) {
    return filter.values.length > 0 ? _.values(filter.values[0])[0] : undefined;
}

export function applyDefaultPositionFilter(
    filter: PositionFilter,
    mutation: Mutation
) {
    // const positions: {[position: string]: {position: number}} = indexPositions([filter]);
    // return !positions || !!positions[mutation.proteinPosStart+""];

    return filter.values.includes(mutation.proteinPosStart);
}

export function applyDefaultProteinImpactTypeFilter(
    filter: ProteinImpactTypeFilter,
    mutation: Mutation
) {
    return filter.values.includes(
        getProteinImpactType(mutation.mutationType || 'other')
    );
}

export function applyDefaultProteinChangeFilter(
    filter: ProteinChangeFilter,
    mutation: Mutation
) {
    return (
        mutation.proteinChange !== undefined &&
        _.some(
            filter.values,
            value =>
                value.toLowerCase() === mutation.proteinChange.toLowerCase()
        )
    );
}

export function applyDefaultMutationStatusFilter(
    filter: MutationStatusFilter,
    mutation: Mutation
) {
    return (
        mutation.mutationStatus !== undefined &&
        _.some(
            filter.values,
            value =>
                value.toLowerCase() === mutation.mutationStatus!.toLowerCase()
        )
    );
}

export function applyDefaultMutationFilter(
    filter: MutationFilter,
    mutation: Mutation
) {
    const filterPredicates = filter.values.map((value: MutationFilterValue) => {
        const valuePredicates = Object.keys(value).map(key =>
            includesSearchTextIgnoreCase(
                (mutation as any)[key]
                    ? (mutation as any)[key].toString()
                    : undefined,
                (value as any)[key] ? (value as any)[key.toString()] : undefined
            )
        );

        // all predicates should be true in order for a match with a single MutationFilterValue
        // (multiple values within the same MutationFilterValue are subject to AND)
        return !valuePredicates.includes(false);
    });

    // a single true within a set of MutationFilterValues is a match for the entire filter
    // (multiple MutationFilterValues within the same MutationFilter are subject to OR)
    return filterPredicates.includes(true);
}

export function groupDataByGroupFilters(
    groupFilters: { group: string; filter: DataFilter }[],
    sortedFilteredData: any[],
    applyFilter: ApplyFilterFn
) {
    return groupFilters.map(groupFilter => ({
        group: groupFilter.group,
        data: sortedFilteredData.filter(
            // TODO simplify array flatten if possible
            m => applyFilter(groupFilter.filter, _.flatten([m])[0])
        ),
    }));
}

export function groupDataByProteinImpactType(sortedFilteredData: any[]) {
    const filters = Object.values(ProteinImpactType).map(value => ({
        group: value,
        filter: {
            type: DataFilterType.PROTEIN_IMPACT_TYPE,
            values: [value],
        },
    }));

    const groupedData = groupDataByGroupFilters(
        filters,
        sortedFilteredData,
        applyDefaultProteinImpactTypeFilter
    );

    return _.keyBy(groupedData, d => d.group);
}

export function onFilterOptionSelect(
    selectedValues:
        | string[]
        | NumericalFilterValue[]
        | CategoricalFilterValue[],
    allValuesSelected: boolean,
    dataStore: DataStore,
    dataFilterType: string,
    dataFilterId: string
) {
    // all other filters except the current filter with the given data filter id
    const otherFilters = dataStore.dataFilters.filter(
        (f: DataFilter) => f.id !== dataFilterId
    );

    if (allValuesSelected) {
        // if all values are selected just remove the existing filter with the given data filter id
        // (assuming that no filtering required if everything is selected)
        dataStore.setDataFilters(otherFilters);
    } else {
        const dataFilter = {
            id: dataFilterId,
            type: dataFilterType,
            values: selectedValues,
        };

        // replace the existing data filter wrt the current selection (other filters + new data filter)
        dataStore.setDataFilters([...otherFilters, dataFilter]);
    }
}

export function applyDataFiltersOnDatum(
    datum: any,
    dataFilters: DataFilter[],
    applyFilter: ApplyFilterFn
) {
    return (
        dataFilters.length > 0 &&
        !dataFilters
            .map(dataFilter => applyFilter(dataFilter, datum))
            .includes(false)
    );
}

export function applyDataFilters(
    data: any[],
    dataFilters: DataFilter[],
    applyFilter: ApplyFilterFn
) {
    return dataFilters.length > 0
        ? data.filter(m => applyDataFiltersOnDatum(m, dataFilters, applyFilter))
        : data;
}
