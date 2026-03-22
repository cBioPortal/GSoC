import _ from 'lodash';

export function logicalAnd<T>(
    array: T[],
    _iterator?: (t: T) => boolean
): boolean {
    const iterator = _iterator ? _iterator : (x: T) => !!x;
    return _.reduce(
        array,
        (acc: boolean, nextElt: T) => acc && iterator(nextElt),
        true
    );
}
