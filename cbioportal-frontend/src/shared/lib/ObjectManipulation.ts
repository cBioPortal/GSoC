/* Functions related to Object manipulation */
import { reduce } from 'lodash';

/*
 * Rename keys in flat dictionary. Keep old keys if not in keyMap.
 */
export function renameKeys(dict: any, keyMap: { [key: string]: string }) {
    return reduce(
        dict,
        (newDict: any, val: any, oldKey: string) => {
            const newKey = keyMap[oldKey];
            if (newKey) {
                newDict[newKey] = val;
            } else {
                newDict[oldKey] = val;
            }
            return newDict;
        },
        {}
    );
}

/*
 * Return new dict w/o given keys (only works on flat dicts)
 */
export function dropKeys<T extends object>(dict: T, keys: (keyof T)[]): T {
    return reduce(
        dict as object,
        (newDict: any, val: any, key: any) => {
            if (keys.indexOf(key) === -1) {
                newDict[key] = val;
            }
            return newDict;
        },
        {}
    );
}
