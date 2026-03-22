import { extendArray, fastParseInt10, sgndiff } from './utils';

const string_type = typeof '';

export type SortingVector = (number | string)[];

type BucketRange = {
    lower_index_incl: number;
    upper_index_excl: number;
};

type CompareEquals<T> = (a: T, b: T) => number;

type GetVector<T> = (t: T) => SortingVector;

export function bucketSort<T>(
    array: T[],
    getVector?: (t: T) => SortingVector,
    compareEquals?: CompareEquals<T>
) {
    // array: an array of data
    // getVector: a function that takes an element of array and returns an int vector. defaults to identity
    // compareEquals: an optional standard sort comparator - if specified it is run on the
    //               results of the final buckets before returning
    getVector =
        getVector ||
        (function(d: SortingVector) {
            return d;
        } as any);

    var current_sorted_array = array;
    var current_bucket_ranges = [
        { lower_index_incl: 0, upper_index_excl: array.length },
    ];

    var new_sorted_array: T[],
        new_bucket_ranges: BucketRange[],
        bucket_range,
        sorted_result;

    // find max length vector, to use as template for vector component types, and whose length will be the sort depth
    var max_length_vector: SortingVector = [];
    var proposed_vector;
    for (var i = 0; i < array.length; i++) {
        proposed_vector = getVector(array[i]);
        if (proposed_vector.length > max_length_vector.length) {
            max_length_vector = proposed_vector;
        }
    }
    var vector_length = max_length_vector.length;
    for (var vector_index = 0; vector_index < vector_length; vector_index++) {
        new_sorted_array = [];
        new_bucket_ranges = [];
        // sort each bucket range, and collect sorted array and new bucket ranges
        for (var j = 0; j < current_bucket_ranges.length; j++) {
            bucket_range = current_bucket_ranges[j];
            sorted_result = bucketSortHelper(
                current_sorted_array,
                getVector,
                bucket_range.lower_index_incl,
                bucket_range.upper_index_excl,
                vector_index,
                typeof max_length_vector[vector_index] === string_type
            );
            extendArray(new_sorted_array, sorted_result.sorted_array);
            extendArray(new_bucket_ranges, sorted_result.bucket_ranges);
        }
        current_sorted_array = new_sorted_array;
        current_bucket_ranges = new_bucket_ranges;
    }
    // if compareEquals specified, sort remaining buckets with it
    if (compareEquals) {
        new_sorted_array = [];
        var bucket_elts;
        for (var j = 0; j < current_bucket_ranges.length; j++) {
            bucket_range = current_bucket_ranges[j];
            bucket_elts = current_sorted_array.slice(
                bucket_range.lower_index_incl,
                bucket_range.upper_index_excl
            );
            bucket_elts.sort(compareEquals);
            extendArray(new_sorted_array, bucket_elts);
        }
        current_sorted_array = new_sorted_array;
    }
    return current_sorted_array;
}

export function stringSort<T>(array: T[], getString?: (t: T) => string) {
    // array: an array of data
    // getString: a function that takes an element of `array` and returns a string. defaults to identity

    // returns strings sorted in "natural order" (i.e. numbers sorted correctly - P2 comes before P10)
    getString =
        getString ||
        (function(d: string) {
            return d;
        } as any);
    // compute string vectors we'll sort with
    var data = array.map(function(d) {
        return {
            d: d,
            vector: stringToVector(getString(d)),
        };
    });
    // sort
    var sorted = bucketSort(data, function(d) {
        return d.vector;
    });
    // return original passed-in data
    return sorted.map(function(datum) {
        return datum.d;
    });
}

export function stringToVector(string: string) {
    var vector = [];
    var len = string.length;
    var numberStartIncl = -1;
    var charCode;
    for (var i = 0; i < len; i++) {
        charCode = string.charCodeAt(i);
        if (charCode >= 48 && charCode <= 57) {
            // if character is numeric digit 0-9
            if (numberStartIncl === -1) {
                // if we're not in a number yet, start number
                numberStartIncl = i;
            }
            // otherwise, nothing to do
        } else {
            // character is not numeric
            if (numberStartIncl > -1) {
                // if we're in a number, then we need to add the number to the vector
                vector.push(fastParseInt10(string, numberStartIncl, i));
                // and record no longer in a number
                numberStartIncl = -1;
            }
            // add character code to vector
            vector.push(charCode);
        }
    }
    if (numberStartIncl > -1) {
        // if we're in a number at the end of the string, add it to vector
        vector.push(fastParseInt10(string, numberStartIncl));
        // no need to reset numberStartIncl because the algorithm is done
    }
    return vector;
}

export function compareFull<T>(
    d1: T,
    d2: T,
    getVector: GetVector<T>,
    compareEquals?: CompareEquals<T>
) {
    // utility function - comparator that describes sort order given by bucketSort
    var ret = compare(getVector(d1), getVector(d2));
    if (ret === 0 && compareEquals) {
        ret = compareEquals(d1, d2);
    }
    return ret;
}

function compareVectorElements(elt1: number | string, elt2: number | string) {
    if (typeof elt1 === string_type) {
        return compare(
            stringToVector(elt1 as string),
            stringToVector(elt2 as string)
        );
    } else {
        return sgndiff(elt1 as number, elt2 as number);
    }
}

export function compare(vector1: SortingVector, vector2: SortingVector) {
    // utility function - comparator that describes vector sort order given by bucketSort

    var ret = 0;
    // go left to right, return result of first difference
    // if one vector is shorter, that one comes first
    var cmp;
    for (var i = 0; i < vector1.length; i++) {
        if (i >= vector2.length) {
            // if we've gotten here, that means no change up til i, and vector2 is shorter
            ret = 1;
            break;
        }
        cmp = compareVectorElements(vector1[i], vector2[i]);
        if (cmp !== 0) {
            ret = cmp;
            break;
        }
    }
    if (ret === 0) {
        if (vector1.length < vector2.length) {
            // we iterated through vector1, so if we get here and no difference, then if
            // vector1 is shorter, then it comes first
            ret = -1;
        }
        // theres no way to get here and no difference if vector2 is shorter
    }
    return ret;
}

export function bucketSortHelper<T>(
    array: T[],
    getVector: GetVector<T>,
    sort_range_lower_index_incl: number,
    sort_range_upper_index_excl: number,
    vector_index: number,
    isStringElt: boolean
) {
    // returns { sorted_array: d[], bucket_ranges:{lower_index_incl, upper_index_excl}[]}} },
    //      where sorted_array only contains elements from the specified range of
    //      array[sort_range_lower_index_incl:sort_range_upper_index_excl]

    // stop if empty sort range, or end of vector
    if (
        !array.length ||
        sort_range_lower_index_incl >= sort_range_upper_index_excl
    ) {
        return {
            sorted_array: [],
            bucket_ranges: [],
        };
    }

    // bucket sort the specified range
    // gather elements into buckets
    var buckets: { [vectorElt: string]: T[] } = {};
    var keys = [];
    var vector, key;
    var sortFirst = [];
    for (
        var i = sort_range_lower_index_incl;
        i < sort_range_upper_index_excl;
        i++
    ) {
        vector = getVector(array[i]);
        if (vector.length > vector_index) {
            key = vector[vector_index];
            if (!(key in buckets)) {
                keys.push(key);
                buckets[key] = [];
            }
            buckets[key].push(array[i]);
        } else {
            // if the vector has no entry at this index, sort earlier, in line w string sorting convention of shorter strings first
            sortFirst.push(array[i]);
        }
    }
    // reduce in sorted order
    if (!isStringElt) {
        // sort numbers
        keys.sort(sgndiff);
    } else {
        // sort strings
        keys = stringSort(keys);
    }

    var sorted_array: T[] = [];
    var bucket_ranges = [];
    var lower_index_incl, upper_index_excl;
    // add sortFirst
    if (sortFirst.length) {
        lower_index_incl = sort_range_lower_index_incl + sorted_array.length;
        bucket_ranges.push({
            lower_index_incl: lower_index_incl,
            upper_index_excl: lower_index_incl + sortFirst.length,
        });
        extendArray(sorted_array, sortFirst);
    }
    for (var i = 0; i < keys.length; i++) {
        var bucket = buckets[keys[i]];
        lower_index_incl = sort_range_lower_index_incl + sorted_array.length;
        upper_index_excl = lower_index_incl + bucket.length;
        bucket_ranges.push({
            lower_index_incl: lower_index_incl,
            upper_index_excl: upper_index_excl,
        });
        extendArray(sorted_array, bucket);
    }

    return { sorted_array: sorted_array, bucket_ranges: bucket_ranges };
}
