import {
    MobxPromiseImpl,
    MobxPromise,
    MobxPromiseFactory,
    MobxPromiseInputUnion,
} from '../lib/MobxPromise';
import { hasObservers } from '../lib/mobxPromiseUtils';

type errorHandler = (error: Error) => void;

let errorHandlers: errorHandler[] = [];

export function addServiceErrorHandler(handler: errorHandler) {
    errorHandlers.push(handler);
}

(MobxPromise as any).prototype.toJSON = function() {
    return JSON.stringify(this.result);
};

/**
 * Constructs a MobxPromise which will call seamlessImmutable.from() on the result and the default value.
 */

export const remoteData: MobxPromiseFactory = function<R>(
    input: MobxPromiseInputUnion<R>,
    defaultResult?: R
) {
    const normalizedInput = MobxPromiseImpl.normalizeInput(
        input,
        defaultResult
    );
    const { invoke, onError } = normalizedInput;
    const mobxPromise = new MobxPromise({
        ...input,
        invoke,
        default: normalizedInput.default,
        onError: error => {
            if (onError) {
                onError(error);
            } else if (!hasObservers(mobxPromise, 'error')) {
                errorHandlers.forEach(handler => {
                    handler(error);
                });
            }
        },
    });
    return mobxPromise;
};

export function mobxPromiseResolve<R>(value: R): MobxPromise<R> {
    // wraps a constant value in MobxPromise interface so
    //  it can be passed in as a promise.
    return {
        status: 'complete',
        peekStatus: 'complete',
        isPending: false,
        isComplete: true,
        isError: false,
        result: value,
        error: undefined,
    };
}
