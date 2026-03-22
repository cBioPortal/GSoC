import { observable, action, makeObservable } from 'mobx';
import Immutable from 'seamless-immutable';

export interface ICacheData<T> {
    status: 'pending' | 'complete' | 'error';
    data?: T;
}

export interface ICache<T> {
    [queryId: string]: ICacheData<T>;
}

export type ImmutableCache<T> = ICache<T> &
    Immutable.ImmutableObject<ICache<T>>;

/**
 * @author Selcuk Onur Sumer
 */
export default class SimpleCache<T, Query> {
    @observable.ref protected _cache: ImmutableCache<T>;
    protected _pendingCache: ICache<T>;

    constructor() {
        makeObservable<SimpleCache<T, Query>, '_cache' | 'putData'>(this);
        this._cache = Immutable.from<ICache<T>>({});
        this._pendingCache = {};
    }

    protected async fetch(query: Query) {
        // must be implemented by child classes
    }

    protected filter(ids: string[], query: Query): Query {
        // should be implemented by the child classes in order to filter certain ids out of the query Q
        // this might be useful if your query contains already cached ids
        return query;
    }

    public getData(ids: string[], query: Query): ICache<T> {
        const values: ICache<T> = {};
        const missing: string[] = [];

        ids.forEach((id: string) => {
            const data = this._cache[id] || this._pendingCache[id];

            if (data === undefined) {
                missing.push(id);
            } else {
                values[id] = data;
            }
        });

        // no cache entry for missing ids, we need to fetch
        if (missing.length > 0) {
            const pendingData: ICache<T> = {};

            // set status to pending
            missing.forEach((id: string) => {
                // update pending data to put in the cache
                pendingData[id] = {
                    status: 'pending',
                };

                // putting pending data in the actual cache causes problems,
                // so putting it in a separate pending cache instead...
                this._pendingCache[id] = pendingData[id];

                // values to return should contain but completed and pending data
                values[id] = pendingData[id];
            });

            // fetch missing data
            this.fetch(this.filter(missing, query));
        }

        return values;
    }

    @action protected putData(data: ICache<T>) {
        // remove data from the pending cache if it is not pending anymore
        Object.keys(data).forEach((id: string) => {
            if (data[id].status !== 'pending') {
                delete this._pendingCache[id];
            }
        });

        // put the data into the actual cache
        if (Object.keys(data).length > 0) {
            this._cache = this._cache.merge(data, {
                deep: true,
            }) as ImmutableCache<T>;
        }
    }
}
