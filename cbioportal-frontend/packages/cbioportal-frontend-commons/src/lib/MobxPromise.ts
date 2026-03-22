import { observable, action, computed, makeObservable } from 'mobx';

/**
 * This tagged union type describes the interoperability of MobxPromise properties.
 */
type MobxPromiseStatus = 'pending' | 'error' | 'complete';
export type MobxPromiseUnionType<R> = (
    | {
          status: 'pending';
          isPending: true;
          isError: false;
          isComplete: false;
          result: R | undefined;
          error: Error | undefined;
      }
    | {
          status: 'error';
          isPending: false;
          isError: true;
          isComplete: false;
          result: R | undefined;
          error: Error;
      }
    | {
          status: 'complete';
          isPending: false;
          isError: false;
          isComplete: true;
          result: R;
          error: Error | undefined;
      }
) & { peekStatus: MobxPromiseStatus };
export type MobxPromiseUnionTypeWithDefault<R> = (
    | {
          status: 'pending';
          isPending: true;
          isError: false;
          isComplete: false;
          result: R;
          error: Error | undefined;
      }
    | {
          status: 'error';
          isPending: false;
          isError: true;
          isComplete: false;
          result: R;
          error: Error;
      }
    | {
          status: 'complete';
          isPending: false;
          isError: false;
          isComplete: true;
          result: R;
          error: Error | undefined;
      }
) & { peekStatus: MobxPromiseStatus };

export type MobxPromiseInputUnion<R> =
    | PromiseLike<R>
    | (() => PromiseLike<R>)
    | MobxPromiseInputParams<R>;
export type MobxPromiseInputParams<R> = {
    /**
     * A function that returns a list of MobxPromise objects which are dependencies of the invoke function.
     */
    await?: MobxPromise_await;

    /**
     * A function that returns the async result or a promise for the async result.
     */
    invoke: MobxPromise_invoke<R>;

    /**
     * Default result in place of undefined
     */
    default?: R;

    /**
     * A function that will be called when the latest promise from invoke() is resolved.
     * It will not be called for out-of-date promises.
     */
    onResult?: (result?: R) => void;

    /**
     * A function that will be called when the latest promise from invoke() is rejected.
     * It will not be called for out-of-date promises.
     */
    onError?: (error: Error) => void;
};
export type MobxPromise_await = () => Array<
    | MobxPromiseUnionTypeWithDefault<any>
    | MobxPromiseUnionType<any>
    | MobxPromise<any>
>;
export type MobxPromise_invoke<R> = () => PromiseLike<R>;
export type MobxPromiseInputParamsWithDefault<R> = {
    await?: MobxPromise_await;
    invoke: MobxPromise_invoke<R>;
    default: R;
    onResult?: (result: R) => void;
    onError?: (error: Error) => void;
};

/**
 * MobxPromise provides an observable interface for a computed promise.
 * @author adufilie http://github.com/adufilie
 */
export class MobxPromiseImpl<R> {
    static isPromiseLike(value: any) {
        return (
            value != null &&
            typeof value === 'object' &&
            typeof value.then === 'function'
        );
    }

    static normalizeInput<R>(
        input: MobxPromiseInputParamsWithDefault<R>
    ): MobxPromiseInputParamsWithDefault<R>;
    static normalizeInput<R>(
        input: MobxPromiseInputUnion<R>,
        defaultResult?: R
    ): MobxPromiseInputParamsWithDefault<R>;
    static normalizeInput<R>(
        input: MobxPromiseInputUnion<R>
    ): MobxPromiseInputParams<R>;
    static normalizeInput<R>(
        input: MobxPromiseInputUnion<R>,
        defaultResult?: R
    ) {
        if (typeof input === 'function')
            return { invoke: input, default: defaultResult };

        if (MobxPromiseImpl.isPromiseLike(input))
            return {
                invoke: () => input as PromiseLike<R>,
                default: defaultResult,
            };

        input = input as MobxPromiseInputParams<R>;
        if (defaultResult !== undefined)
            input = { ...input, default: defaultResult };
        return input;
    }

    constructor(input: MobxPromiseInputUnion<R>, defaultResult?: R) {
        makeObservable<MobxPromiseImpl<R>>(this);

        let norm = MobxPromiseImpl.normalizeInput(input, defaultResult);
        this.await = norm.await;
        this.invoke = norm.invoke;
        this.defaultResult = norm.default;
        this.onResult = norm.onResult;
        this.onError = norm.onError;
    }

    private await?: MobxPromise_await;
    private invoke: MobxPromise_invoke<R>;
    private onResult?: (result?: R) => void;
    private onError?: (error: Error) => void;
    private defaultResult?: R;
    private invokeId: number = 0;
    private _latestInvokeId: number = 0;

    @observable private internalStatus: 'pending' | 'complete' | 'error' =
        'pending';
    @observable.ref private internalResult?: R = undefined;
    @observable.ref private internalError?: Error = undefined;

    @computed get status(): 'pending' | 'complete' | 'error' {
        // wait until all MobxPromise dependencies are complete
        if (this.await)
            for (let status of this.await().map(mp => mp.status)) // track all statuses before returning
                if (status !== 'complete') return status;

        let status = this.internalStatus; // force mobx to track changes to internalStatus
        if (this.latestInvokeId != this.invokeId) status = 'pending';
        return status;
    }

    @computed get peekStatus(): 'pending' | 'complete' | 'error' {
        // check status without triggering invoke

        // check status of all MobxPromise dependencies
        if (this.await)
            for (let status of this.await().map(mp => mp.peekStatus))
                if (status !== 'complete') return status;

        // otherwise, return internal status
        return this.internalStatus;
    }

    @computed get isPending() {
        return this.status == 'pending';
    }

    @computed get isComplete() {
        return this.status == 'complete';
    }

    @computed get isError() {
        return this.status == 'error';
    }

    @computed get result(): R | undefined {
        // checking status may trigger invoke
        if (this.isError || this.internalResult == null)
            return this.defaultResult;

        return this.internalResult;
    }

    @computed get error(): Error | undefined {
        // checking status may trigger invoke
        if (!this.isComplete && this.await)
            for (let error of this.await().map(mp => mp.error)) // track all errors before returning
                if (error) return error;

        return this.internalError;
    }

    /**
     * This lets mobx determine when to call this.invoke(),
     * taking advantage of caching based on observable property access tracking.
     */
    @computed
    private get latestInvokeId() {
        window.clearTimeout(this._latestInvokeId);
        let promise = this.invoke();
        let invokeId: number = window.setTimeout(() =>
            this.setPending(invokeId, promise)
        );
        return (this._latestInvokeId = invokeId);
    }

    @action
    private setPending(invokeId: number, promise: PromiseLike<R>) {
        this.invokeId = invokeId;
        promise.then(
            result => this.setComplete(invokeId, result),
            error => this.setError(invokeId, error)
        );
        this.internalStatus = 'pending';
    }

    @action
    private setComplete(invokeId: number, result: R) {
        if (invokeId === this.invokeId) {
            this.internalResult = result;
            this.internalError = undefined;
            this.internalStatus = 'complete';

            if (this.onResult) this.onResult(result || this.defaultResult); // may use defaultResult
        }
    }

    @action
    private setError(invokeId: number, error: Error) {
        if (invokeId === this.invokeId) {
            this.internalError = error;
            this.internalResult = undefined;
            this.internalStatus = 'error';

            if (this.onError) this.onError(error);
        }
    }
}

export type MobxPromiseFactory = {
    // This provides more information for TypeScript code flow analysis
    <R>(
        input: MobxPromiseInputParamsWithDefault<R>
    ): MobxPromiseUnionTypeWithDefault<R>;
    <R>(
        input: MobxPromiseInputUnion<R>,
        defaultResult: R
    ): MobxPromiseUnionTypeWithDefault<R>;
    <R>(input: MobxPromiseInputUnion<R>): MobxPromiseUnionType<R>;
};

export const MobxPromise = MobxPromiseImpl as {
    // This provides more information for TypeScript code flow analysis
    new <R>(
        input: MobxPromiseInputParamsWithDefault<R>
    ): MobxPromiseUnionTypeWithDefault<R>;
    new <R>(
        input: MobxPromiseInputUnion<R>,
        defaultResult: R
    ): MobxPromiseUnionTypeWithDefault<R>;
    new <R>(input: MobxPromiseInputUnion<R>): MobxPromiseUnionType<R>;
};

export interface MobxPromise<T>
    extends Pick<
        MobxPromiseImpl<T>,
        | 'status'
        | 'error'
        | 'result'
        | 'isPending'
        | 'isError'
        | 'isComplete'
        | 'peekStatus'
    > {}
