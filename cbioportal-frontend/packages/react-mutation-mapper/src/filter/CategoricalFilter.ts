import { DataFilter } from '../model/DataFilter';

export type CategoricalFilterValue = {
    filterCondition: string;
    filterString: string;
    selections: Set<string>;
};

export type CategoricalFilter = DataFilter<CategoricalFilterValue>;
