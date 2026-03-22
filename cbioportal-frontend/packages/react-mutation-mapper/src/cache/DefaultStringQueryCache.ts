import { action, observable, makeObservable } from 'mobx';
import { CacheData, MobxCache } from 'cbioportal-utils';
import _ from 'lodash';

export abstract class DefaultStringQueryCache<D>
    implements MobxCache<D, string> {
    protected _cache = observable.map<string, CacheData>({}, { deep: false });

    constructor() {
        makeObservable(this);
    }

    @action
    public get(query: string) {
        if (!this._cache.get(query)) {
            this._cache.set(query, { status: 'pending' });

            this.fetch(query)
                .then((d: D) =>
                    this._cache.set(query, { status: 'complete', data: d })
                )
                .catch(() => this._cache.set(query, { status: 'error' }));
        }

        const data = this._cache.get(query);

        return data ? data : null;
    }

    public abstract fetch(query: string): Promise<D>;

    public get cache() {
        return _.fromPairs(this._cache.toJSON());
    }
}
