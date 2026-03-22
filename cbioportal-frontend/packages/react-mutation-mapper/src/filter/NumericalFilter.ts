import { DataFilter } from '../model/DataFilter';

export type NumericalFilterValue = {
    lowerBound: number;
    upperBound: number;
    hideEmptyValues: boolean;
};

export type NumericalFilter = DataFilter<NumericalFilterValue>;
