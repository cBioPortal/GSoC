/**
 * 'Toggle' an element in the included list
 * i.e. when present: remove element from included, when missing: add to included
 *
 * @param element to toggle
 * @param included list of elements
 * @param callbackFn to test and toggle objects instead of primitives
 */
export function toggleIncluded<T>(
    element: T,
    included: T[],
    callbackFn?: (element: T) => boolean
): T[] {
    let index;
    if (callbackFn) {
        index = included.findIndex(callbackFn);
    } else {
        index = included.indexOf(element);
    }
    if (index === -1) {
        return included.concat([element]);
    } else {
        const toggled = included.slice();
        toggled.splice(index, 1);
        return toggled;
    }
}

export function insertBetween<T>(elt: T, array: T[]): T[] {
    const newArray = [];
    for (let i = 0; i < array.length; i++) {
        newArray.push(array[i]);
        if (i < array.length - 1) {
            newArray.push(elt);
        }
    }
    return newArray;
}
