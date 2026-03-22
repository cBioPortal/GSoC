import Immutable from 'seamless-immutable'; // need to use immutables so mobX can observe the cache shallowly
import accumulatingDebounce from './accumulatingDebounce';
import { observable, action, reaction, makeObservable } from 'mobx';
import { AccumulatingDebouncedFunction } from './accumulatingDebounce';

export type CacheData<D, M = any> =
    | {
          status: 'complete' | 'error';
          data: null;
          meta?: M;
      }
    | {
          status: 'complete';
          data: D;
          meta?: M;
      };

export type Cache<D, M = any> = {
    [key: string]: CacheData<D, M>;
};

type Pending = {
    [key: string]: boolean;
};

type ImmutableCache<D, M> = Cache<D, M> &
    Immutable.ImmutableObject<Cache<D, M>>;

type QueryKeyToQuery<Q> = { [queryKey: string]: Q };

export type AugmentedData<D, M> = {
    data: D[];
    meta: M;
};

type FetchResult<D, M> = AugmentedData<D, M>[] | D[];

type CachePromise<D, M> = {
    keys: string[];
    callback: (data: CacheData<D, M>[]) => void;
    error: () => void;
};

function isAugmentedData<D, M>(
    data: D | AugmentedData<D, M>
): data is AugmentedData<D, M> {
    return (data as Object).hasOwnProperty('meta');
}

export default class LazyMobXCache<Data, Query, Metadata = any> {
    @observable.ref private _cache: ImmutableCache<Data, Metadata>;
    private pending: Pending;

    private staticDependencies: any[];
    private debouncedPopulate: AccumulatingDebouncedFunction<Query>;

    private promises: CachePromise<Data, Metadata>[];

    constructor(
        private queryToKey: (q: Query) => string, // query maps to the key of the datum it will fill
        private dataToKey: (d: Data, m?: Metadata) => string, // should uniquely identify the data - for indexing in cache
        private fetch: (
            queries: Query[],
            ...staticDependencies: any[]
        ) => Promise<FetchResult<Data, Metadata>>,
        ...staticDependencies: any[]
    ) {
        makeObservable(this);

        this.init();
        this.staticDependencies = staticDependencies;
        this.debouncedPopulate = accumulatingDebounce<
            QueryKeyToQuery<Query>,
            Query
        >(
            (queryMap: QueryKeyToQuery<Query>) => {
                const queries: Query[] = Object.keys(queryMap).map(
                    k => queryMap[k]
                );
                this.populate(queries);
            },
            (queryMap: QueryKeyToQuery<Query>, newQuery: Query) => {
                queryMap[this.queryToKey(newQuery)] = newQuery;
                return queryMap;
            },
            () => {
                return {};
            },
            0
        );

        reaction(
            () => this._cache,
            (cache: Cache<Data, Metadata>) => {
                // filter out completed promises, we dont listen on them anymore
                this.promises = this.promises.filter(
                    promise => !this.tryTrigger(promise)
                );
            }
        );
    }

    private init() {
        this.pending = {};
        this._cache = Immutable.from<Cache<Data, Metadata>>({});
        this.promises = [];
    }
    public get cache() {
        return this._cache;
    }

    public get activePromisesCount() {
        return this.promises.length;
    }

    public getPromise(
        queries: Query | Query[],
        makeRequest?: boolean
    ): Promise<CacheData<Data, Metadata>[]> {
        return new Promise((resolve, reject) => {
            let queriesArray: Query[];
            if (Array.isArray(queries)) {
                queriesArray = queries;
            } else {
                queriesArray = [queries];
            }
            const newPromise = {
                keys: queriesArray.map(query => this.queryToKey(query)),
                callback: resolve,
                error: reject,
            };
            if (!this.tryTrigger(newPromise)) {
                // try to trigger it immediately
                // if not triggered immediately, add it to callback list
                this.promises.push(newPromise);
                // request if desired
                if (makeRequest) {
                    queriesArray.map(query => this.debouncedPopulate(query));
                }
            }
        });
    }

    private tryTrigger(promise: CachePromise<Data, Metadata>) {
        let allDefined = true;
        let error = false;
        const data = promise.keys.map(key => {
            const datum = this._cache[key];
            if (!datum) {
                allDefined = false;
            } else if (datum.status === 'error') {
                allDefined = false;
                error = true;
            }
            return datum;
        });
        if (error) {
            promise.error();
            return true;
        } else if (allDefined) {
            // if all data fetching complete, then trigger callback
            promise.callback(data);
            return true;
        } else {
            // otherwise, not complete yet
            return false;
        }
    }

    public peek(query: Query): CacheData<Data, Metadata> | null {
        const key = this.queryToKey(query);
        const cacheData: CacheData<Data, Metadata> | undefined = this._cache[
            key
        ];
        return cacheData || null;
    }

    public get(query: Query): CacheData<Data, Metadata> | null {
        this.debouncedPopulate(query);

        return this.peek(query);
    }

    public async getImmediately(query: Query) {
        await this.populate([query]);
        return this.peek(query);
    }

    public addData(data: Data[]): void {
        const toMerge: Cache<Data, Metadata> = {};
        for (const datum of data) {
            toMerge[this.dataToKey(datum)] = {
                status: 'complete',
                data: datum,
            };
        }
        this.updateCache(toMerge);
    }

    private async populate(queries: Query[]) {
        const missing: Query[] = this.getMissing(queries);
        if (missing.length === 0) {
            return;
        }
        this.markPending(missing);
        try {
            const data: FetchResult<Data, Metadata> = await this.fetch(
                missing,
                ...this.staticDependencies
            );
            this.putData(missing, data);
            return true;
        } catch (err) {
            this.markError(missing);
            return false;
        } finally {
            this.unmarkPending(missing);
        }
    }

    private getMissing(queries: Query[]): Query[] {
        const cache = this._cache;
        const pending = this.pending;

        return queries.filter(q => {
            const key = this.queryToKey(q);
            return !cache[key] && !pending[key];
        });
    }

    private markPending(queries: Query[]): void {
        const pending = this.pending;
        for (const query of queries) {
            pending[this.queryToKey(query)] = true;
        }
    }

    private unmarkPending(queries: Query[]): void {
        const pending = this.pending;
        for (const query of queries) {
            pending[this.queryToKey(query)] = false;
        }
    }

    private markError(queries: Query[]) {
        const toMerge: Cache<Data, Metadata> = {};
        const error: CacheData<Data, Metadata> = {
            status: 'error',
            data: null,
        };
        for (const query of queries) {
            toMerge[this.queryToKey(query)] = error;
        }
        this.updateCache(toMerge);
    }

    private putData(queries: Query[], data: FetchResult<Data, Metadata>) {
        const toMerge: Cache<Data, Metadata> = {};
        const keyHasData: { [key: string]: boolean } = {};

        for (const dataElt of data) {
            if (isAugmentedData(dataElt)) {
                // if augmented data, then we add each datum to the cache using the associated metadata
                const meta = dataElt.meta;
                for (const datum of dataElt.data) {
                    const datumKey = this.dataToKey(datum, meta);
                    toMerge[datumKey] = {
                        status: 'complete',
                        data: datum,
                        meta,
                    };
                    keyHasData[datumKey] = true;
                }
            } else {
                // if not augmented data (no metadata), then we just add it using the information in the datum
                const datumKey = this.dataToKey(dataElt);
                toMerge[datumKey] = {
                    status: 'complete',
                    data: dataElt,
                };
                keyHasData[datumKey] = true;
            }
        }

        for (const query of queries) {
            const queryKey = this.queryToKey(query);
            if (!keyHasData[queryKey]) {
                // if a query was made, but no corresponding data is given, it's assumed there is
                //  no data for this query, so we put the following object corresponding to that knowledge.
                toMerge[queryKey] = {
                    status: 'complete',
                    data: null,
                };
            }
        }
        this.updateCache(toMerge);
    }

    @action private updateCache(toMerge: Cache<Data, Metadata>) {
        if (Object.keys(toMerge).length > 0) {
            this._cache = this._cache.merge(toMerge, {
                deep: true,
            }) as ImmutableCache<Data, Metadata>;
        }
    }
}
