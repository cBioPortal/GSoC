import { DataFilter } from '../model/DataFilter';

export enum OncoKbFilterValue {
    Oncogenic = 'ONCOGENIC',
}

export type OncoKbFilter = DataFilter<OncoKbFilterValue>;
