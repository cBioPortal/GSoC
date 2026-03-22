const type_of_undefined = typeof undefined;

export default function ifNotDefined<T>(target: any, fallback: T) {
    if (typeof target === type_of_undefined) {
        return fallback;
    } else {
        return target;
    }
}
