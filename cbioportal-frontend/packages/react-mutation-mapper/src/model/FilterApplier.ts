import { DataFilter } from './DataFilter';

export type ApplyFilterFn = (filter: DataFilter, datum: any) => boolean;

export interface FilterApplier {
    applyFilter: ApplyFilterFn;
}
