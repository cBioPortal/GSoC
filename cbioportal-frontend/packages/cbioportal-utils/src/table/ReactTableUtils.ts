export function defaultSortMethod(a: any, b: any): number {
    // force null and undefined to the bottom
    a = a === null || a === undefined ? -Infinity : a;
    b = b === null || b === undefined ? -Infinity : b;

    // force any string values to lowercase
    a = typeof a === 'string' ? a.toLowerCase() : a;
    b = typeof b === 'string' ? b.toLowerCase() : b;

    // Return either 1 or -1 to indicate a sort priority
    if (a > b) {
        return 1;
    }
    if (a < b) {
        return -1;
    }

    // returning 0 or undefined will use any subsequent column sorting methods or the row index as a tiebreaker
    return 0;
}

export function defaultStringArraySortMethod(a: string[], b: string[]): number {
    return defaultSortMethod(a.join(), b.join());
}

export function defaultArraySortMethod<U extends number | string>(
    a: (U | null)[],
    b: (U | null)[]
): number {
    let result = 0;

    const loopLength = Math.min(a.length, b.length);

    for (let i = 0; i < loopLength; i++) {
        result = defaultSortMethod(a[i], b[i]);

        if (result !== 0) {
            break;
        }
    }

    if (result === 0) {
        if (a.length < b.length) {
            // result = (asc ? -1 : 1);
            result = -1;
        } else if (a.length > b.length) {
            // result = (asc ? 1 : -1);
            result = 1;
        }
    }

    return result;
}
