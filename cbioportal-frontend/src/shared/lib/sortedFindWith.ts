// Use binary search to find the index/element (respectively) in `sortedArray` for which `oracle` returns 0.
// It's assumed that sortedArray is sorted, i.e. `sortedArray.map(oracle) = [-1,-1,...,-1,0,1,1,...,1]`
// Behavior undefined on non-sorted arrays.

export function sortedFindWith<T>(
    sortedArray: T[],
    oracle: (t: T, index: number) => number // -1, 0, 1,
) {
    const index = sortedFindIndexWith(sortedArray, oracle);
    if (index !== undefined) {
        return sortedArray[index];
    }
    return undefined;
}

export function sortedFindIndexWith<T>(
    sortedArray: T[],
    oracle: (t: T, index: number) => number // -1, 0, 1,
): number | undefined {
    let lowIncl = 0;
    let highExcl = sortedArray.length;
    let middle;
    while (lowIncl < highExcl) {
        middle = Math.floor((lowIncl + highExcl) / 2);
        switch (oracle(sortedArray[middle], middle)) {
            case 1:
                // "too big"
                // target element must be in [low, middle)
                highExcl = middle;
                break;
            case -1:
                // "too small"
                // target element must be in [middle+1, high)
                lowIncl = middle + 1;
                break;
            case 0:
                // we found it
                return middle;
        }
    }
    return undefined;
}
