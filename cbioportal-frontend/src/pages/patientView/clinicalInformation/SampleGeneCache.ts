import { observable, action, makeObservable } from 'mobx';
import Immutable from 'seamless-immutable';
import _ from 'lodash';
import accumulatingDebounce from '../../../shared/lib/accumulatingDebounce';

export type CacheData<T> =
    | { status: 'complete'; data: T | null }
    | { status: 'error'; data: null };
export type Cache<T> = {
    [sampleId: string]: {
        fetchedWithoutGeneArgument: 'complete' | 'error' | false;
        geneData: { [entrezGeneId: number]: CacheData<T> | null };
    };
};
type PendingCache = {
    [sampleId: string]: {
        fetchedWithoutGeneArgument: boolean;
        geneData: { [entrezGeneId: number]: boolean };
    };
};

type CacheMerge<T> = {
    [sampleId: string]: {
        fetchedWithoutGeneArgument?: 'complete' | 'error' | false;
        geneData?: { [entrezGeneId: number]: CacheData<T> | null };
    };
};
export type SampleToEntrezListOrNull = { [sampleId: string]: number[] | null };
export type SampleToEntrezList = { [sampleId: string]: number[] };
type SampleToEntrezSet = { [sampleId: string]: { [entrez: string]: true } };

export default class SampleGeneCache<
    T extends { sampleId: string; entrezGeneId: number }
> {
    @observable.ref private _cache: Cache<T> &
        Immutable.ImmutableObject<Cache<T>>;
    private _pending: PendingCache;
    private dependencies: any[];

    private debouncedPopulate: (sampleId: string, entrezGeneId: number) => void;

    constructor(sampleIds: string[], ...dependencies: any[]) {
        makeObservable(this);
        this.dependencies = dependencies;
        this.initCache(sampleIds);
        this._pending = {};

        this.debouncedPopulate = accumulatingDebounce<
            SampleToEntrezSet,
            string | number
        >(
            (toFetch: SampleToEntrezSet) => {
                const sampleToEntrezList: SampleToEntrezList = {};
                for (const sample of Object.keys(toFetch)) {
                    sampleToEntrezList[sample] = Object.keys(
                        toFetch[sample]
                    ).map(x => parseInt(x, 10));
                }
                this.populate(sampleToEntrezList);
            },
            (
                acc: SampleToEntrezSet,
                sampleId: string,
                entrezGeneId: number
            ) => {
                acc[sampleId] = acc[sampleId] || new Set<number>();
                acc[sampleId][entrezGeneId] = true;
                return acc;
            },
            () => {
                return {};
            },
            0
        );
    }

    public get cache() {
        return this._cache;
    }

    public get data(): T[] {
        const ret: T[] = [];
        for (const sampleId of Object.keys(this._cache)) {
            const geneData = this._cache[sampleId].geneData || {};
            for (const entrezGeneId of Object.keys(geneData)) {
                const datum: CacheData<T> | null =
                    geneData[parseInt(entrezGeneId, 10)];
                if (
                    datum !== null &&
                    datum.status === 'complete' &&
                    datum.data !== null
                ) {
                    ret.push(datum.data);
                }
            }
        }
        return ret;
    }

    public get(sampleId: string, entrezGeneId: number): CacheData<T> | null {
        const cacheDatum =
            this._cache[sampleId] &&
            this._cache[sampleId].geneData[entrezGeneId];
        if (!cacheDatum) {
            if (
                this._cache[sampleId] &&
                this._cache[sampleId].fetchedWithoutGeneArgument === 'complete'
            ) {
                // in this case, we infer there is no data, because we've already fetched all data for this sample
                return {
                    status: 'complete',
                    data: null,
                };
            } else {
                // if we have not fetched all data for this sample, there's no data yet, so we should query
                this.debouncedPopulate(sampleId, entrezGeneId);
                // return null indicating no data yet
                return null;
            }
        } else {
            return cacheDatum;
        }
    }

    protected async populate(sampleToEntrezList: SampleToEntrezListOrNull) {
        // Subclasses extending this need to redefine this with the proper argument,
        // i.e. should it be SampleToEntrezList or SampleToEntrezListOrNull
        // See MrnaExprRankCache for an example
        const missing = this.getMissing(sampleToEntrezList);
        if (Object.keys(missing).length === 0) {
            return;
        }
        this.markPending(missing);
        try {
            const data: T[] = await this.fetch(missing, ...this.dependencies);
            this.putData(missing, data);
            return true;
        } catch (err) {
            this.markError(missing);
            return false;
        } finally {
            this.unmarkPending(missing);
        }
    }

    protected fetch(
        sampleToEntrezList: SampleToEntrezListOrNull,
        ...dependencies: any[]
    ): Promise<T[]> {
        throw 'Not implemented in abstract class.';
    }

    private initCache(sampleIds: string[]) {
        const _cache: Cache<T> = {};
        for (const sampleId of sampleIds) {
            _cache[sampleId] = {
                fetchedWithoutGeneArgument: false,
                geneData: {},
            };
        }
        this._cache = Immutable.from<Cache<T>>(_cache);
    }

    private markError(sampleToEntrezList: SampleToEntrezListOrNull) {
        const cache = this._cache;
        const toMerge: CacheMerge<T> = {};
        for (const sample of Object.keys(sampleToEntrezList)) {
            const entrezList = sampleToEntrezList[sample];
            toMerge[sample] = { geneData: {} };
            if (entrezList === null) {
                toMerge[sample].fetchedWithoutGeneArgument = 'error';
            } else {
                for (const entrez of entrezList) {
                    toMerge[sample].geneData![entrez] = {
                        status: 'error',
                        data: null,
                    };
                }
            }
        }
        this.updateCache(toMerge);
    }

    private getMissing(
        sampleToEntrezList: SampleToEntrezListOrNull
    ): SampleToEntrezListOrNull {
        const ret: SampleToEntrezListOrNull = {};
        const pending = this._pending;
        const cache = this._cache;
        for (const sampleId of Object.keys(sampleToEntrezList)) {
            const entrezList = sampleToEntrezList[sampleId];
            if (entrezList === null) {
                if (
                    !(
                        cache[sampleId] &&
                        cache[sampleId].fetchedWithoutGeneArgument
                    ) &&
                    !(
                        pending[sampleId] &&
                        pending[sampleId].fetchedWithoutGeneArgument
                    )
                ) {
                    ret[sampleId] = null;
                }
            } else {
                const missingEntrez = entrezList.filter((g: number) => {
                    return (
                        !(cache[sampleId] && cache[sampleId].geneData[g]) &&
                        !(pending[sampleId] && pending[sampleId].geneData[g])
                    );
                });
                if (missingEntrez.length > 0) {
                    ret[sampleId] = missingEntrez;
                }
            }
        }
        return ret;
    }

    private markPendingStatus(
        sampleToEntrezList: SampleToEntrezListOrNull,
        status: boolean
    ) {
        // Helper function for markPending and unmarkPending
        const pending = this._pending;
        for (const sampleId of Object.keys(sampleToEntrezList)) {
            const entrezList = sampleToEntrezList[sampleId];
            pending[sampleId] = pending[sampleId] || {};
            if (entrezList === null) {
                pending[sampleId].fetchedWithoutGeneArgument = status;
            } else {
                pending[sampleId].geneData = pending[sampleId].geneData || {};
                for (const entrezGene of entrezList) {
                    pending[sampleId].geneData[entrezGene] = status;
                }
            }
        }
    }

    private markPending(sampleToEntrezList: SampleToEntrezListOrNull): void {
        this.markPendingStatus(sampleToEntrezList, true);
    }

    private unmarkPending(sampleToEntrezList: SampleToEntrezListOrNull): void {
        this.markPendingStatus(sampleToEntrezList, false);
    }

    private putData(query: SampleToEntrezListOrNull, fetchedData: T[]): void {
        const dataMap: {
            [sampleId: string]: { [entrezGeneId: number]: T };
        } = {};
        for (const fetchedDatum of fetchedData) {
            dataMap[fetchedDatum.sampleId] =
                dataMap[fetchedDatum.sampleId] || {};
            dataMap[fetchedDatum.sampleId][
                fetchedDatum.entrezGeneId
            ] = fetchedDatum;
        }
        const toMerge: CacheMerge<T> = {};
        for (const sampleId of Object.keys(query)) {
            const entrezList = query[sampleId];
            toMerge[sampleId] = { geneData: {} };
            const sampleData = dataMap[sampleId];

            if (entrezList === null) {
                toMerge[sampleId].fetchedWithoutGeneArgument = 'complete';
                // Put all fetched data for this sample
                if (sampleData) {
                    for (const entrezGene in sampleData) {
                        if (sampleData.hasOwnProperty(entrezGene)) {
                            toMerge[sampleId].geneData![entrezGene] = {
                                status: 'complete',
                                data: sampleData[entrezGene],
                            };
                        }
                    }
                }
            } else {
                for (const entrezGene of entrezList) {
                    toMerge[sampleId].geneData![entrezGene] = {
                        status: 'complete',
                        data: (sampleData && sampleData[entrezGene]) || null,
                    };
                }
            }
        }
        this.updateCache(toMerge);
    }

    @action private updateCache(toMerge: CacheMerge<T>) {
        if (Object.keys(toMerge).length > 0) {
            this._cache = this._cache.merge(toMerge, { deep: true }) as Cache<
                T
            > &
                Immutable.ImmutableObject<Cache<T>>;
        }
    }
}
