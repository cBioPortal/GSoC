import { DataFilter } from './DataFilter';

export interface DataStore {
    allData: any[]; // TODO find a better way to define/access this data
    sortedFilteredData: any[]; // TODO find a better way to define/access this data
    sortedFilteredSelectedData: any[]; // TODO find a better way to define/access this data
    sortedFilteredGroupedData: { group: string; data: any[] }[]; // TODO find a better way to define/access this data
    setDataFilters: (filters: DataFilter[]) => void;
    setHighlightFilters: (filters: DataFilter[]) => void;
    setSelectionFilters: (filters: DataFilter[]) => void;
    setGroupFilters: (filters: { group: string; filter: DataFilter }[]) => void;
    clearHighlightFilters: () => void;
    clearSelectionFilters: () => void;
    clearDataFilters: () => void;
    dataFilters: DataFilter[];
    selectionFilters: DataFilter[];
    highlightFilters: DataFilter[];
    groupFilters: { group: string; filter: DataFilter }[];
    isPositionSelected: (position: number) => boolean;
    isPositionHighlighted: (position: number) => boolean;
    dataMainFilter: (datum: any) => boolean;
    dataSelectFilter: (datum: any) => boolean;
    dataHighlightFilter: (datum: any) => boolean;
    applyFilter: (
        filter: DataFilter,
        datum: any,
        positions?: { [position: string]: { position: number } }
    ) => boolean;
}

export default DataStore;
