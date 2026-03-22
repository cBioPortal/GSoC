import { observable, action, makeObservable } from 'mobx';

export default class LazyCache {
    @observable.ref protected _cache: any;
    protected dependencies: any[];

    constructor(..._dependencies: any[]) {
        makeObservable(this);
        this._cache = {};
        this.dependencies = _dependencies;
    }

    public get cache() {
        return this._cache;
    }

    public populate(args: any) {
        this.populateCache(args, ...this.dependencies).then(
            (didChange: boolean) => {
                if (didChange) {
                    this.redefineCacheToTriggerMobX();
                }
            }
        );
    }

    @action private redefineCacheToTriggerMobX(): void {
        this._cache = { ...this._cache };
    }

    /* This is all that should be overridden */
    protected populateCache(...argsAndDependencies: any[]): Promise<boolean> {
        // Should resolve with true if a change to cache has been made, false if not.
        // You can see how it's used in LazyCache.populate
        throw new Error('not implemented in abstract class');
    }
}
