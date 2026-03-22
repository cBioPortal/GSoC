import _ from 'lodash';

export enum CaseSetId {
    'custom' = '-1',
    'mutation_cna' = 'w_mut_cna',
    'mutation' = 'w_mut',
    'cna' = 'w_cna',
    'all' = 'all',
}

export type CustomCaseSet = {
    name: string;
    description: string;
    value: CaseSetId;
    isdefault: boolean;
};

export const CustomCaseSets: CustomCaseSet[] = [
    {
        name: 'All',
        description: 'All cases in the selected cohorts',
        value: CaseSetId.all,
        isdefault: false,
    },
    {
        name: 'Cases with mutations data',
        description: 'All cases with mutations data',
        value: CaseSetId.mutation,
        isdefault: false,
    },
    {
        name: 'Cases with copy number alterations data',
        description: 'All cases with copy number alterations data',
        value: CaseSetId.cna,
        isdefault: false,
    },
    {
        name: 'Cases with both mutations and copy number alterations data',
        description:
            'All cases with both mutations and copy number alterations data',
        value: CaseSetId.mutation_cna,
        isdefault: false,
    },
    {
        name: 'User-defined Case List',
        description: 'Specify your own case list',
        value: CaseSetId.custom,
        isdefault: true,
    },
];

export function getFilteredCustomCaseSets(
    isVirtualStudy: boolean,
    isMultipleNonVirtualStudies: boolean,
    profiledSamplesCount: {
        w_mut: number;
        w_cna: number;
        w_mut_cna: number;
        all: number;
    }
) {
    return _.reduce(
        CustomCaseSets,
        (acc: CustomCaseSet[], next) => {
            if (next.isdefault) {
                acc.push(next);
            } else if (isMultipleNonVirtualStudies && !isVirtualStudy) {
                // add all non-zero CustomCaseSets options for multiple studies without virtual study
                let count =
                    profiledSamplesCount[
                        next.value as 'w_mut_cna' | 'w_mut' | 'w_cna' | 'all'
                    ];
                //add profile only if it has samples
                if (count > 0) {
                    acc.push(
                        Object.assign({}, next, {
                            name: `${next.name} (${count})`,
                        })
                    );
                }
            } else if (isVirtualStudy && next.value === CaseSetId.all) {
                // only add 'all' option for virtual study
                let count =
                    profiledSamplesCount[
                        next.value as 'w_mut_cna' | 'w_mut' | 'w_cna' | 'all'
                    ];
                //add profile only if it has samples
                if (count > 0) {
                    acc.push(
                        Object.assign({}, next, {
                            name: `${next.name} (${count})`,
                        })
                    );
                }
            }
            return acc;
        },
        []
    );
}
