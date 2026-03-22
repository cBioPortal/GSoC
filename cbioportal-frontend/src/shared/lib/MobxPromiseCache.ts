import {
    MobxPromise,
    MobxPromiseInputParams,
} from 'cbioportal-frontend-commons';
import { logicalAnd } from './LogicUtils';

export function stringifyObjectUnique(obj: { [k: string]: any }) {
    const keys = Object.keys(obj);
    keys.sort();
    return `{${keys
        .map(k => {
            const val = obj[k];
            if (typeof val === typeof {})
                throw new Error(
                    'Warning: keys in cache may not be unique because query contains nested objects. Specify queryToKey init. param. to be safe.'
                );
            return `"${k}":"${val}"`;
        })
        .join(',')}}`;
}

export default class MobxPromiseCache<Query, Result> {
    private cache: { [key: string]: MobxPromise<Result> };

    constructor(
        private queryToMobxPromiseInput: (
            q: Query
        ) => MobxPromiseInputParams<Result>,
        private queryToKey: (q: Query) => string = stringifyObjectUnique as (
            q: Query
        ) => string
    ) {
        this.cache = {};
    }

    public get(q: Query): MobxPromise<Result> {
        const key = this.queryToKey(q);
        if (!this.cache[key]) {
            this.cache[key] = new MobxPromise<Result>(
                this.queryToMobxPromiseInput(q)
            );
        }
        return this.cache[key];
    }

    public getAll(queries: Query[]): MobxPromise<Result>[] {
        return queries.map(q => this.get(q));
    }

    public await(
        promises: MobxPromise<any>[],
        getQueries: (...promiseResults: any[]) => Query[]
    ) {
        let ret = promises;
        if (logicalAnd(promises.map(p => p.isComplete))) {
            ret = ret.concat(
                this.getAll(
                    getQueries.apply(
                        null,
                        promises.map(p => p.result)
                    )
                )
            );
        }
        return ret;
    }
}
