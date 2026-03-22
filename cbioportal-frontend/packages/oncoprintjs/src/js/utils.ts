import { ComputedShapeParams } from './oncoprintshape';
import { RGBAColor } from './oncoprintruleset';

export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export function cloneShallow<T extends Object>(obj: T) {
    const ret: Partial<T> = {};
    for (const key of Object.keys(obj) as (keyof T)[]) {
        ret[key] = obj[key];
    }
    return ret as T;
}

export function extendArray(target: any[], source: any[]) {
    for (let i = 0; i < source.length; i++) {
        target.push(source[i]);
    }
}

export function doesCellIntersectPixel(
    cellHitzone: [number, number],
    pixelX: number
) {
    // checks intersection with the half-open interval [pixelX, pixelX+1)

    const lower = cellHitzone[0],
        upper = cellHitzone[1];
    if (upper < pixelX) {
        return false;
    } else if (lower < pixelX + 1) {
        return true;
    } else {
        return false;
    }
}

export function ifndef<T>(x: T | undefined, val: T): T {
    return typeof x === 'undefined' ? val : x;
}

export function shallowExtend<T extends Object, S extends Object>(
    target: T,
    source: S
): T & S {
    const ret: Partial<T & S> = {};
    for (const key of Object.keys(target) as (keyof T & S)[]) {
        ret[key] = target[key as keyof T] as any;
    }
    for (const key of Object.keys(source) as (keyof T & S)[]) {
        ret[key] = source[key as keyof S] as any;
    }
    return ret as T & S;
}

export function objectValues<T extends Object>(obj: T): T[keyof T][] {
    return Object.keys(obj).map(function(key: string & keyof T) {
        return obj[key];
    });
}

export function arrayFindIndex<T>(
    arr: T[],
    predicate: (t: T) => boolean,
    start_index?: number
) {
    start_index = start_index || 0;
    for (let i = start_index; i < arr.length; i++) {
        if (predicate(arr[i])) {
            return i;
        }
    }
    return -1;
}

export function sgndiff(a: number, b: number) {
    if (a < b) {
        return -1;
    } else if (a > b) {
        return 1;
    } else {
        return 0;
    }
}

export function clamp(x: number, lower: number, upper: number) {
    return Math.max(lower, Math.min(upper, x));
}
export function z_comparator(
    shapeA: ComputedShapeParams,
    shapeB: ComputedShapeParams
) {
    const zA = shapeA.z;
    const zB = shapeB.z;
    if (zA < zB) {
        return -1;
    } else if (zA > zB) {
        return 1;
    } else {
        return 0;
    }
}

export function fastParseInt10(
    x: string,
    substringStart?: number,
    substringEnd?: number
) {
    // simple, fast parseInt when you know its a base-10 int and
    //  you don't need any error handling.
    // Performance testing shows this is 85% faster than built-in parseInt
    substringStart = substringStart || 0;
    substringEnd = substringEnd || x.length;
    let ret = 0;
    for (let i = substringStart; i < substringEnd; i++) {
        ret *= 10;
        ret += x.charCodeAt(i) - 48; // the integer character codes from 0 to 9 are 48, 49, ..., 58
    }
    return ret;
}

export function fastParseInt16(x: string) {
    // simple, fast parseInt when you know its a base-16 int and
    //  you don't need any error handling.
    // Performance testing shows this is 43% faster than parseInt(x,16)
    let ret = 0;
    let nextCharCode: number;
    for (let i = 0; i < x.length; i++) {
        ret *= 16;
        nextCharCode = x.charCodeAt(i);
        if (nextCharCode > 96) {
            ret += nextCharCode - 87; // lower case letters start at 97. a is 97, should be 10
        } else if (nextCharCode > 64) {
            ret += nextCharCode - 55; // capital letters start at 65. A is 65, should be 10
        } else {
            // otherwise, its an integer
            ret += nextCharCode - 48;
        }
    }
    return ret;
}

export function rgbString(color: RGBAColor) {
    return `rgb(${color[0]},${color[1]},${color[2]})`;
}
