import {
    action,
    computed,
    observable,
    runInAction,
    makeObservable,
} from 'mobx';

type PromisePlusStatus = 'complete' | 'pending' | 'error';

export default class PromisePlus<T> {
    @observable.ref private _status: PromisePlusStatus = 'pending';
    @observable.ref private _result: T | undefined = undefined;
    @observable.ref private _error: any = undefined;

    @computed public get status(): PromisePlusStatus {
        return this._status;
    }

    @computed public get result(): T | undefined {
        return this._result;
    }

    @computed public get error(): any {
        return this._error;
    }

    @computed public get promise(): Promise<T> {
        return this._promise;
    }

    constructor(private _promise: Promise<T>) {
        makeObservable(this);
        runInAction(() => {
            this._status = 'pending';

            _promise.then(
                action((result: T) => {
                    this._status = 'complete';
                    this._result = result;
                }),
                action((reason: any) => {
                    this._status = 'error';
                    this._error = reason;
                })
            );
        });
    }
}
