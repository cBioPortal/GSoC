import { RouterStore } from 'mobx-react-router';
import { action, computed, makeObservable } from 'mobx';
import _ from 'lodash';
import URL, { QueryParams } from 'url';
import sessionClient from '../api/sessionServiceInstance';
import { parse } from 'qs';

export function getSessionKey(hash: string) {
    return `session_${hash}`;
}

export interface PortalSession {
    id: string;
    query: { [key: string]: any };
    path: string;
    version: number;
    timeStamp?: number;
}

export function saveRemoteSession(data: any) {
    const dataCopy = Object.assign({}, data);
    delete dataCopy['']; // artifact of mobx RouterStore URL serialization, when theres & at end of URL, which breaks session service
    return sessionClient.saveSession(dataCopy);
}

export function getRemoteSession(sessionId: string) {
    return sessionClient.getSession(sessionId);
}

export function normalizeLegacySession(sessionData: any) {
    // legacy sessions were stored with values as first item in arrays, so undo this
    sessionData.data = _.mapValues(sessionData.data, (value: any) => {
        if (_.isArray(value)) {
            return value[0];
        } else {
            return value;
        }
    });

    // convert cancer_study_id to cancer_study_list and get rid of cancer_study_id
    if (
        sessionData.data.cancer_study_id &&
        !sessionData.data.cancer_study_list
    ) {
        sessionData.data.cancer_study_list = sessionData.data.cancer_study_id;
    }
    delete sessionData.data.cancer_study_id;

    return sessionData;
}

export default class ExtendedRouterStore extends RouterStore {
    constructor() {
        super();
        makeObservable(this);
    }

    @action updateRoute(
        newParams: QueryParams,
        path: string | undefined = undefined,
        clear = false,
        replace = false
    ) {
        // default to current path
        path = path !== undefined ? path : this.location.pathname;

        // if we're not clearing, we want to merge newParams onto existing query
        // but if we're clearing, we want to use newParams ONLY and wipe out existing query;
        let newQuery: any;
        if (!clear) {
            newQuery = _.clone(this.query);
            _.each(newParams, (v, k: string) => {
                if (v === undefined) {
                    delete newQuery[k];
                } else {
                    newQuery[k] = v;
                }
            });
        } else {
            newQuery = newParams;
        }

        // clear out any undefined props
        _.each(newQuery, (v, k: string) => {
            if (v === undefined || v === '') {
                delete newQuery[k];
            }
        });

        // put a leading slash if there isn't one
        path = URL.resolve('/', path);

        this[replace ? 'replace' : 'push'](
            URL.format({
                pathname: path,
                query: newQuery,
                hash: this.location.hash,
            })
        );
    }

    @computed get query() {
        return parse(this.location.search, {
            depth: 0,
            ignoreQueryPrefix: true,
        }) as any;
    }
}
