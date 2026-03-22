export function addTimeoutToPromise<T>(
    promise: Promise<T>,
    ms: number
): Promise<T> {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject();
        }, ms);
        promise.then(
            result => {
                clearTimeout(timeout);
                resolve(result);
            },
            error => {
                clearTimeout(timeout);
                reject(error);
            }
        );
    });
}

export function isPromiseLike<T>(obj: any): obj is PromiseLike<T> {
    return typeof obj.then === 'function';
}
