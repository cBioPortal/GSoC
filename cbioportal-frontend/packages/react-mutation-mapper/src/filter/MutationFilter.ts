import { Mutation } from 'cbioportal-utils';

import { DataFilter } from '../model/DataFilter';

export type MutationFilterValue = {
    [field in keyof Mutation]: string;
};

export type MutationFilter = DataFilter<MutationFilterValue>;
