import { autorun, IReactionDisposer } from 'mobx';
import { MobxPromise } from '../MobxPromise';

export function onMobxPromise<T>(
    promise: MobxPromise<T> | Array<MobxPromise<T>>,
    onComplete: (...results: T[]) => void,
    times: number = 1,
    onDispose?: () => void
): IReactionDisposer {
    let disposer: IReactionDisposer;
    let count: number = 0;
    let promiseArray: Array<MobxPromise<T>>;
    if (promise instanceof Array) {
        promiseArray = promise;
    } else {
        promiseArray = [promise];
    }
    disposer = autorun(reaction => {
        if (promiseArray.reduce((acc, next) => acc && next.isComplete, true)) {
            // if all complete
            onComplete(...promiseArray.map(x => x.result as T));
            count += 1;
        }
        if (count >= times) {
            reaction.dispose();
            onDispose && onDispose();
        }
    });
    return disposer;
}

export function toPromise<T>(promise: MobxPromise<T>): Promise<T> {
    // Reference the `promise` result to trigger invoke if necessary, and
    //  to mobx-link the caller of `toPromise` to `promise`.
    promise.result;
    return new Promise(resolve => {
        onMobxPromise(promise, resolve);
    });
}

export default onMobxPromise;
