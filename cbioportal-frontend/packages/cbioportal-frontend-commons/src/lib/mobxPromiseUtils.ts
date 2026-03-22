import {
    autorun,
    getObserverTree,
    IListenable,
    IObservable,
    _getAdministration,
    getAtom,
} from 'mobx';
import { MobxPromise } from './MobxPromise';

/**
 * A decorator for creating a <code>@computed</code> property that will be cached
 * after the first time it is accessed, even if it becomes unobserved later.
 * @param target
 * @param propertyKey
 * @param descriptor
 */
export function cached<T>(
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
) {
    if (descriptor.get) {
        let get = descriptor.get;
        descriptor.get = function(...args: any[]) {
            const atom = getAtom(this, propertyKey as string) as IObservable &
                IListenable;
            // to keep the cached value, add an observer if there are none
            if (!atom.isBeingObserved_) autorun(() => atom);

            return get.apply(this, args);
        };
    }
    return descriptor;
}

/**
 * Checks if a property has observers.
 */
export function hasObservers<T>(thing: T, property: keyof T) {
    let tree = getObserverTree(thing, property as string);
    return tree && tree.observers ? tree.observers.length > 0 : false;
}

/**
 * Update MobxPromise debug names to reflect their property names on a given object.
 * @param target An object which has properties that are MobxPromises.
 */
export function labelMobxPromises<T extends object>(target: T) {
    for (let key in target) {
        let desc = Object.getOwnPropertyDescriptor(target, key);
        if (desc && desc.value instanceof MobxPromise) {
            let admin = _getAdministration(desc.value);
            admin.name = `${key}(${admin.name})`;
        }
    }
}

/**
 * A function created with debounceAsync() returns a new Promise
 * every time, but only the last promise created before invoking the
 * original function will be resolved after a specified delay.
 */
export function debounceAsync<R, F extends (...args: any[]) => PromiseLike<R>>(
    invoke: F,
    delay = 0
): F {
    function invokeLater(
        context: any,
        args: any[],
        resolve: (result: PromiseLike<R>) => void,
        reject: (error: Error) => void
    ) {
        try {
            resolve(invoke.apply(context, args));
        } catch (e) {
            reject(e);
        }
    }

    let timeout = 0;
    return function(...args: any[]): PromiseLike<R> {
        return new Promise<R>(function(resolve, reject) {
            window.clearTimeout(timeout);
            timeout = window.setTimeout(
                invokeLater,
                delay,
                //@ts-ignore
                this,
                args,
                resolve,
                reject
            );
        });
    } as F;
}
