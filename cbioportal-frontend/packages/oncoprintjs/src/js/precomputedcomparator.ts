import * as BucketSort from './bucketsort';
import binarysearch from './binarysearch';
import hasElementsInInterval from './haselementsininterval';
import {
    ColumnId,
    TrackSortComparator,
    TrackSortDirection,
    TrackSortSpecification,
    TrackSortSpecificationComparators,
    TrackSortSpecificationVectors,
    TrackSortVector,
} from './oncoprintmodel';
import { SortingVector } from './bucketsort';

type DatumWithVectors<T> = {
    d: T;
    preferred_vector: SortingVector;
    mandatory_vector: SortingVector;
};

export default class PrecomputedComparator<T> {
    private preferred_change_points: number[];
    private mandatory_change_points: number[];
    private id_to_index: { [columnId: string]: number };

    constructor(
        list: T[],
        comparator: TrackSortSpecification<T>,
        sort_direction: TrackSortDirection,
        element_identifier_key: string & keyof T
    ) {
        if (comparator.isVector) {
            this.initializeVector(
                list,
                comparator,
                sort_direction,
                element_identifier_key
            );
        } else {
            this.initializeComparator(
                list,
                comparator as TrackSortSpecificationComparators<T>,
                sort_direction,
                element_identifier_key
            );
        }
    }

    private initializeComparator(
        list: T[],
        comparator:
            | TrackSortComparator<T>
            | TrackSortSpecificationComparators<T>,
        sort_direction: TrackSortDirection,
        element_identifier_key: keyof T
    ) {
        // initializeComparator initializes the PrecomputedComparator in the case that
        //	the sort order is given using a comparator
        let preferred, mandatory;
        if (typeof comparator === 'function') {
            preferred = comparator;
            mandatory = comparator;
        } else {
            preferred = comparator.preferred;
            mandatory = comparator.mandatory;
        }
        function makeDirectedComparator(cmp: TrackSortComparator<T>) {
            return function(d1: T, d2: T) {
                if (sort_direction === 0) {
                    return 0;
                }
                const res = cmp(d1, d2);
                if (res === 2) {
                    return 1;
                } else if (res === -2) {
                    return -1;
                } else {
                    return res * sort_direction;
                }
            };
        }
        const preferredComparator = makeDirectedComparator(preferred);
        const mandatoryComparator = makeDirectedComparator(mandatory);
        const sorted_list = list.sort(preferredComparator);

        // i is a change point iff comp(elt[i], elt[i+1]) !== 0
        this.preferred_change_points = [0]; // i is a preferred change pt iff its a change pt with comp = preferredComparator but not with comp = mandatoryComparator
        this.mandatory_change_points = [0]; // i is a mandatory change pt iff its a change pt with comp = mandatoryComparator

        // note that by the following process, preferred_change_points and mandatory_change_points are sorted
        for (let i = 1; i < sorted_list.length; i++) {
            if (mandatoryComparator(sorted_list[i - 1], sorted_list[i]) !== 0) {
                this.mandatory_change_points.push(i);
            } else if (
                preferredComparator(sorted_list[i - 1], sorted_list[i]) !== 0
            ) {
                this.preferred_change_points.push(i);
            }
        }
        this.id_to_index = {};
        for (let i = 0; i < sorted_list.length; i++) {
            this.id_to_index[
                (sorted_list[i][element_identifier_key] as any) as string
            ] = i;
        }
    }

    private initializeVector(
        list: T[],
        getVector: TrackSortSpecificationVectors<T>,
        sort_direction: TrackSortDirection,
        element_identifier_key: keyof T
    ) {
        // initializeVector initializes the PrecomputedComparator in the case that the sort order is specified by vectors for bucket sort
        function makeDirectedVector(vec: TrackSortVector<T>) {
            if (sort_direction === 0) {
                return function(d: T) {
                    return 0;
                };
            } else {
                return function(d: T) {
                    return vec(d).map(function(n: number | string) {
                        if (typeof n === 'number') {
                            return n * sort_direction;
                        } else {
                            return n;
                        }
                    });
                };
            }
        }
        const preferredVector = makeDirectedVector(getVector.preferred);
        const mandatoryVector = makeDirectedVector(getVector.mandatory);

        // associate each data to its vector and sort them together
        const list_with_vectors: DatumWithVectors<T>[] = list.map(function(d) {
            return {
                d: d,
                preferred_vector: preferredVector(d),
                mandatory_vector: mandatoryVector(d),
            };
        }) as DatumWithVectors<T>[];
        // sort by preferred vector
        const _compareEquals = getVector.compareEquals;
        const compareEquals = _compareEquals
            ? function(d1: DatumWithVectors<T>, d2: DatumWithVectors<T>) {
                  return _compareEquals(d1.d, d2.d);
              }
            : undefined;
        const sorted_list = BucketSort.bucketSort(
            list_with_vectors,
            function(d) {
                return d.preferred_vector;
            },
            compareEquals
        );

        // i is a change point iff comp(elt[i], elt[i+1]) !== 0
        this.preferred_change_points = [0]; // i (besides 0) is a preferred change pt iff its a change pt with comp = preferredComparator but not with comp = mandatoryComparator
        this.mandatory_change_points = [0]; // i (besides 0) is a mandatory change pt iff its a change pt with comp = mandatoryComparator

        // note that by the following process, preferred_change_points and mandatory_change_points are sorted
        const getMandatoryVector = function(d: {
            mandatory_vector: (number | string)[];
        }) {
            return d.mandatory_vector;
        };
        const getPreferredVector = function(d: {
            preferred_vector: (number | string)[];
        }) {
            return d.preferred_vector;
        };
        for (let i = 1; i < sorted_list.length; i++) {
            if (
                BucketSort.compareFull(
                    sorted_list[i - 1],
                    sorted_list[i],
                    getMandatoryVector
                ) !== 0
            ) {
                this.mandatory_change_points.push(i);
            } else if (
                BucketSort.compareFull(
                    sorted_list[i - 1],
                    sorted_list[i],
                    getPreferredVector,
                    compareEquals
                ) !== 0
            ) {
                this.preferred_change_points.push(i);
            }
        }

        this.id_to_index = {};
        for (let i = 0; i < sorted_list.length; i++) {
            this.id_to_index[
                (sorted_list[i].d[element_identifier_key] as any) as string
            ] = i;
        }
    }

    public getSortValue(id: ColumnId) {
        const index = this.id_to_index[id];
        // find greatest lower change points - thats where this should be sorted by
        //		because everything between change points has same sort value
        let mandatory = 0;
        let preferred = 0;
        if (this.mandatory_change_points.length) {
            mandatory = this.mandatory_change_points[
                binarysearch(
                    this.mandatory_change_points,
                    index,
                    function(ind) {
                        return ind;
                    },
                    true
                )
            ];
        }
        if (this.preferred_change_points.length) {
            preferred = this.preferred_change_points[
                binarysearch(
                    this.preferred_change_points,
                    index,
                    function(ind) {
                        return ind;
                    },
                    true
                )
            ];
        }
        return {
            mandatory: mandatory,
            preferred: preferred,
        };
    }
}
