export interface MobxCache<D = any, Query = any> {
    get: (query: Query) => CacheData<D> | null;
    cache: Cache<D>;
}

export interface CacheData<D = any> {
    status: 'pending' | 'complete' | 'error';
    data?: D;
}

export interface Cache<D = any> {
    [queryId: string]: CacheData<D>;
}
