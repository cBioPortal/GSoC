import { remoteData } from 'cbioportal-frontend-commons';
import {
    action,
    computed,
    extendObservable,
    intercept,
    IReactionDisposer,
    observable,
    reaction,
    runInAction,
    toJS,
    makeObservable,
    autorun,
} from 'mobx';
import ExtendedRouterStore, {
    getRemoteSession,
    normalizeLegacySession,
    PortalSession,
    saveRemoteSession,
} from './ExtendedRouterStore';
import { hashString } from 'cbioportal-frontend-commons';
import _ from 'lodash';
import { log } from 'shared/lib/consoleLog';
import { MapValues, Omit } from './TypeScriptUtils';
import { QueryParams } from 'url';

export type Property<T, NestedObjectType = any> = {
    name: keyof T;
    isSessionProp: boolean;
    isHashedProp?: boolean;
    doubleURIEncode?: boolean;
    nestedObjectProps?: { [prop in keyof Required<NestedObjectType>]: any };
    aliases?: string[];
};

export function needToLoadSession(obj: Partial<URLWrapper<any>>): boolean {
    return (
        obj.sessionId !== undefined &&
        obj.sessionId !== 'pending' &&
        (obj.localSessionData === undefined ||
            obj.localSessionData.id !== obj.sessionId)
    );
}

export type PropertiesMap<QueryParamsType> = {
    [property in keyof Required<QueryParamsType>]: Omit<
        Property<QueryParamsType, Required<QueryParamsType[property]>>,
        'name'
    >;
};

export default class URLWrapper<
    QueryParamsType extends { [key: string]: string | Object | undefined }
> {
    protected _query: QueryParamsType;
    public reactionDisposer: IReactionDisposer;
    protected pathContext: string;
    protected readonly properties: Property<QueryParamsType>[];

    @observable sessionProps = {};
    @observable localSessionData: PortalSession | undefined = undefined;

    constructor(
        public routing: ExtendedRouterStore,
        // pass it in in a map so that typescript can ensure that every property is accounted for
        protected propertiesMap: PropertiesMap<QueryParamsType>,
        public sessionEnabled = false,
        public urlCharThresholdForSession = 1500,
        protected backwardsCompatibilityMapping?: (oldParams: {
            [key: string]: string | undefined;
        }) => MapValues<QueryParamsType, string | undefined>
    ) {
        makeObservable(this);

        this.properties = _.entries(this.propertiesMap).map(entry => ({
            name: entry[0],
            ...entry[1],
        }));

        const initValues: Partial<QueryParamsType> = {};

        // init values MUST include all properties in type
        // even if they are not represented in browser url at the moment
        // they need to be there so that they will observable in the future upon assignment
        for (const property of this.properties) {
            let value:
                | string
                | undefined
                | Object = (routing.query as MapValues<
                QueryParamsType,
                string | undefined
            >)[property.name];
            if (_.isString(value) && property.doubleURIEncode) {
                // @ts-ignore
                value = decodeURIComponent(value);
            }
            if (property.nestedObjectProps) {
                // nested object
                value = value ? JSON.parse(value as string) : {};
                for (const subprop of _.keys(property.nestedObjectProps!)) {
                    (value as any)[subprop] =
                        (value as any)[subprop] || undefined; // need to be there so that they will be observable in the future upon assignment
                }
            }
            initValues[property.name] = value as any;
        }

        // consumers of wrapper read from this query
        this._query = observable<QueryParamsType>(
            initValues as QueryParamsType
        );

        // whenever a change is made either to the url querystring or to internal representation of
        // query (when in session mode),
        // we want to sync query
        // note that the above intercept will avoid resetting properties with existing values
        this.reactionDisposer = reaction(
            () => {
                // this is necessary to establish observation of properties
                // at least in test context, it doesn't otherwise work
                //const queryProps = _.mapValues(routing.query);
                //const sessionProps = this._sessionData && this._sessionData.query && _.mapValues(this._sessionData.query);
                return [routing.query, this.sessionQuery];
            },
            ([routeQuery, sessionQuery]) => {
                if (
                    this.pathContext &&
                    !new RegExp(`^/*${this.pathContext}`).test(
                        this.routing.location.pathname
                    )
                ) {
                    return;
                }

                runInAction(() => {
                    log('setting session', routeQuery.session_id);
                    this.syncAllProperties(routeQuery, sessionQuery);
                });
            },
            { fireImmediately: true }
        );
    }

    @computed get sessionQuery(): MapValues<
        QueryParamsType,
        string | undefined
    > {
        if (
            this.localSessionData &&
            this.localSessionData.id === this.sessionId
        ) {
            return this.localSessionData.query as MapValues<
                QueryParamsType,
                string | undefined
            >;
        } else {
            return this.remoteSessionData.result?.query;
        }
    }

    @action
    protected updateRoute(
        newParams: QueryParams,
        path: string | undefined = undefined,
        clear = false,
        replace = false
    ) {
        this.routing.updateRoute(newParams, path, clear, replace);
        // immediately sync properties from URL and session
        this.syncAllProperties(this.routing.query, this.sessionQuery);
    }

    @action
    protected syncAllProperties(
        routeQuery: MapValues<QueryParamsType, string | undefined>,
        sessionQuery?: MapValues<QueryParamsType, string | undefined>
    ) {
        // map to updated params based on backwards-compatibility mapping, if given
        if (this.backwardsCompatibilityMapping) {
            routeQuery = this.backwardsCompatibilityMapping(routeQuery);
            sessionQuery =
                sessionQuery &&
                this.backwardsCompatibilityMapping(sessionQuery);
        }
        for (const property of this.properties) {
            // if property is not a session prop
            // it will always be represented in URL
            if (this.hasSessionId && property.isSessionProp) {
                // if there is a session, then sync it with session
                sessionQuery && this.syncProperty(property, sessionQuery);
            } else {
                // @ts-ignore
                this.syncProperty(property, routeQuery);
            }
        }
    }

    public get query(): Readonly<QueryParamsType> {
        // use typescript to make it readonly

        // NOTE: `query` always contains every URL property (including nested properties) declared, even
        //  if it's not present in the URL. If it's not present in the URL, that property will have
        //  value undefined in the `query` object.

        // `query` ONLY reflects properties that are passed through in `propertiesMap` in the constructor.

        return this._query;
    }

    //@observable.ref _sessionId: string;

    @computed get aliasToPropertyName() {
        const ret: { [alias: string]: keyof QueryParamsType } = {};
        for (const property of this.properties) {
            if (property.aliases) {
                for (const alias of property.aliases) {
                    ret[alias] = property.name;
                }
            }
        }
        return ret;
    }

    protected getProperty(
        name: string
    ): Omit<Property<QueryParamsType>, 'name'> {
        if (name in this.propertiesMap) {
            return this.propertiesMap[name];
        } else {
            const propName = this.aliasToPropertyName[name];
            return this.propertiesMap[propName];
        }
    }

    protected stringifyProps<T extends Partial<QueryParamsType>>(
        props: T
    ): MapValues<T, string | undefined> {
        return _.mapValues(props, (value, key) => {
            const property = this.getProperty(key);
            let ret: string | undefined;

            if (property && property.nestedObjectProps) {
                ret = JSON.stringify(value) as string;
            } else {
                ret = value as string | undefined;
            }

            if (ret && property && property.doubleURIEncode) {
                ret = encodeURIComponent(ret);
            }
            return ret;
        });
    }

    @action
    public updateURL(
        _updatedParams:
            | Partial<QueryParamsType>
            | ((currentQuery: QueryParamsType) => Partial<QueryParamsType>),
        path: string | undefined = undefined,
        clear = false,
        replace = false
    ) {
        const updatedParams: Partial<QueryParamsType> =
            typeof _updatedParams === 'function'
                ? _updatedParams(toJS(this.query))
                : _updatedParams;

        // get the names of the props that are designated as session props
        const sessionProps = this.getSessionProps();

        // overwrite params onto the existing params
        const mergedParams = clear
            ? updatedParams
            : _.assign({}, this.query, updatedParams);

        //put params in buckets according to whether they are session or non session
        const paramsMap = _.reduce(
            mergedParams,
            (
                acc: {
                    sessionProps: Partial<QueryParamsType>;
                    nonSessionProps: Partial<QueryParamsType>;
                },
                value,
                paramKey: keyof QueryParamsType
            ) => {
                if (paramKey in sessionProps) {
                    acc.sessionProps[paramKey] = mergedParams[paramKey];
                } else {
                    // only do this if value is NOT undefined
                    // we don't nee to bother putting it in URL if it's undefined
                    if (mergedParams[paramKey] !== undefined) {
                        acc.nonSessionProps[paramKey] = mergedParams[paramKey];
                    }
                }
                return acc;
            },
            {
                sessionProps: {} as Partial<QueryParamsType>,
                nonSessionProps: {} as Partial<QueryParamsType>,
            }
        );

        const url = _.reduce(
            this.stringifyProps(paramsMap.sessionProps),
            (agg: string[], val, key) => {
                if (val !== undefined) {
                    agg.push(`${key}=${encodeURIComponent(val!)}`);
                }
                return agg;
            },
            []
        ).join('&');

        log('url length', url.length);

        // determine which of the MODIFIED params are session props. This is important, so that we don't unnecessarily create new sessions
        const sessionParametersChanged = _.some(
            _.keys(updatedParams),
            key =>
                key in sessionProps &&
                !_.isEqual(updatedParams[key], this.query[key])
        );

        // we need session if url is longer than this
        // or if we already have session
        const inSessionMode =
            this.sessionEnabled &&
            (this.hasSessionId || url.length > this.urlCharThresholdForSession);

        // if we need to make a new session due to url constraints AND we have a changed session prop
        // then save a new remote session and put the session props in memory for consumption by app
        // otherwise just update the URL
        if (inSessionMode) {
            if (sessionParametersChanged) {
                /* keep a timestamp to make sure
                    that async session response matches the
                    current session and hasn't been invalidated by subsequent session
                */
                const timeStamp = Date.now();
                this.localSessionData = {
                    id: 'pending',
                    query: this.stringifyProps(paramsMap.sessionProps),
                    path: path || this.pathName,
                    version: 3,
                    timeStamp,
                };

                // we need to make a new session
                this.updateRoute(
                    Object.assign(
                        {},
                        this.stringifyProps(paramsMap.nonSessionProps),
                        {
                            session_id: 'pending',
                        }
                    ),
                    path,
                    true,
                    replace
                );

                log('updating URL (non session)', updatedParams);

                this.saveRemoteSession(
                    this.stringifyProps(paramsMap.sessionProps)
                ).then(
                    action((data: any) => {
                        // Make sure that timestamp
                        //  on the session hasn't been changed since it started
                        if (timeStamp !== this.localSessionData?.timeStamp) {
                            return;
                        }

                        this.localSessionData!.id = data.id;
                        this.updateRoute(
                            { session_id: data.id as string },
                            path,
                            false,
                            true // we don't want pending to show up in history
                        );
                    })
                );
            } else {
                // we already have session, we just need to update path or non session params
                this.updateRoute(
                    this.stringifyProps(paramsMap.nonSessionProps),
                    path,
                    clear,
                    replace
                );
            }
        } else {
            // WE ARE NOT IN SESSION MODE
            //this._sessionData = undefined;
            //updatedParams.session_id = undefined;
            this.updateRoute(
                this.stringifyProps(updatedParams),
                path,
                clear,
                replace
            );
        }
    }

    saveRemoteSession(
        sessionProps: MapValues<Partial<QueryParamsType>, string | undefined>
    ) {
        // url encode props to match with convention of
        return saveRemoteSession(sessionProps);
    }

    @computed public get isTemporarySessionPendingSave() {
        return this.sessionId === 'pending';
    }

    @computed public get sessionId() {
        return this.routing.query.session_id === ''
            ? undefined
            : this.routing.query.session_id;
    }

    @computed get isLoadingSession() {
        return !_.isEmpty(this.sessionId) && this.remoteSessionData.isPending;
    }

    @computed get hasSessionId() {
        return this.sessionId !== undefined;
    }

    getRemoteSession(sessionId: string) {
        return getRemoteSession(sessionId);
    }

    public remoteSessionData = remoteData({
        invoke: async () => {
            if (!needToLoadSession(this)) {
                return undefined;
            }

            log('fetching remote session', this.sessionId);

            let sessionData = await this.getRemoteSession(this.sessionId);

            // if it has no version, it's a legacy session and needs to be normalized
            if (sessionData.version === undefined) {
                sessionData = normalizeLegacySession(sessionData);
            }

            const { id, data, version, ...rest } = sessionData;

            return {
                id,
                query: data,
                version,
                path: this.routing.location.pathname,
                ...rest,
            };
        },
    });

    private syncProperty(
        property: Property<QueryParamsType>,
        queryFromUrl: MapValues<QueryParamsType, string | undefined>
    ) {
        // first determine what value should be
        // resolving to aliases IF they exist

        let value = undefined;
        if (queryFromUrl[property.name] !== undefined) {
            value = queryFromUrl[property.name];
        } else if (property.aliases && property.aliases.length) {
            for (const alias of property.aliases) {
                value = queryFromUrl[alias];
                // once you've set it, don't bother with any other aliases
                if (value !== undefined) break;
            }
        }

        this.trySyncProperty(property, value);
    }

    @action
    private trySyncProperty(
        property: Property<QueryParamsType>,
        value: string | undefined
    ) {
        let processedValue: string | undefined;
        // decode from URI
        if (property.doubleURIEncode && value !== undefined) {
            processedValue = decodeURIComponent(value);
        } else {
            processedValue = value;
        }

        // handle nested objects differently
        if (property.nestedObjectProps) {
            processedValue = processedValue || JSON.stringify({});
            // json parse nested object
            const urlNestedObject = JSON.parse(processedValue);
            const existingNestedObject: any = this._query[property.name];
            // update changed properties individually
            for (const subprop of _.keys(property.nestedObjectProps)) {
                const value = urlNestedObject[subprop];
                if (existingNestedObject[subprop] !== value) {
                    // @ts-ignore
                    existingNestedObject[subprop] = value;
                }
            }
        } else {
            if (this._query[property.name] !== processedValue) {
                // update value if its changed
                // @ts-ignore
                this._query[property.name] = processedValue;
            }
        }
    }

    public getSessionProps() {
        const ret: Partial<QueryParamsType> = {};
        for (const property of this.properties) {
            if (property.isSessionProp) {
                ret[property.name] = this.query[property.name];
            }
        }
        return ret;
    }

    @computed get hash(): number {
        const stringifiedProps = this.stringifyProps(this.query);
        const stringified = this.properties.reduce((acc, nextVal) => {
            if (nextVal.isHashedProp)
                acc = `${acc},${String(nextVal.name)}:${
                    stringifiedProps[nextVal.name]
                }`;
            return acc;
        }, '');
        return hashString(stringified);
    }

    @computed public get pathName() {
        return this.routing.location.pathname;
    }

    public destroy() {
        this.reactionDisposer();
    }
}
