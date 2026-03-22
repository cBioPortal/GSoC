import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';

export type FilteredAndAnnotatedMutationsReport<
    T extends AnnotatedMutation = AnnotatedMutation
> = {
    data: T[];
    vus: T[];
    germline: T[];
    vusAndGermline: T[];
};

export function compileMutations<
    T extends AnnotatedMutation = AnnotatedMutation
>(
    report: FilteredAndAnnotatedMutationsReport<T>,
    excludeVus: boolean,
    excludeGermline: boolean
) {
    let mutations = report.data;
    if (!excludeVus) {
        mutations = mutations.concat(report.vus);
    }
    if (!excludeGermline) {
        mutations = mutations.concat(report.germline);
    }
    if (!excludeVus && !excludeGermline) {
        mutations = mutations.concat(report.vusAndGermline);
    }
    return mutations;
}
