import { action, computed, observable, makeObservable } from 'mobx';
import {
    addServiceErrorHandler,
    getBrowserWindow,
    remoteData,
} from 'cbioportal-frontend-commons';
import { getLoadConfig, getServerConfig } from './config/config';
import _ from 'lodash';
import client from 'shared/api/cbioportalClientInstance';
import { sendSentryMessage } from './shared/lib/tracking';
import { FeatureFlagStore } from 'shared/FeatureFlagStore';
import { SiteError } from 'shared/model/appMisc';

export class AppStore {
    constructor(
        public featureFlagStore: FeatureFlagStore = new FeatureFlagStore()
    ) {
        makeObservable(this);
        getBrowserWindow().me = this;
        addServiceErrorHandler((error: any) => {
            try {
                sendSentryMessage('ERRORHANDLER:' + error);
            } catch (ex) {}

            if (error.status && /400|500|5\d\d|403/.test(error.status)) {
                sendSentryMessage('ERROR DIALOG SHOWN:' + error);
                if (error instanceof Error) {
                    this.siteErrors.push(new SiteError(error));
                } else {
                    this.siteErrors.push(new SiteError(new Error(error)));
                }
            }
        });
    }

    get serverConfig() {
        return getServerConfig();
    }

    get loadConfig() {
        return getLoadConfig();
    }

    @observable private _appReady = false;

    siteErrors = observable.array<SiteError>();

    alertErrors = observable.array<SiteError>();

    @observable.ref userName: string | undefined = undefined;

    @observable.ref authMethod: string | undefined = undefined;

    @computed get isLoggedIn() {
        return _.isString(this.userName) && this.userName !== 'anonymousUser';
    }

    @computed get isSocialAuthenticated() {
        if (this.authMethod) {
            return this.authMethod.includes('optional_oauth2');
        }
        return false;
    }

    get isPublicPortal() {
        return this.serverConfig.app_name === 'public-portal';
    }

    @computed get logoutUrl() {
        return 'logout';
    }

    @computed get isErrorCondition() {
        return this.siteErrors.length > 0;
    }

    @action
    public dismissErrors() {
        this.siteErrors.clear();
    }

    @action
    public dismissError(err: SiteError) {
        this.siteErrors.remove(err);
    }

    @action public addError(err: SiteError | string) {
        if (typeof err === 'string') {
            this.siteErrors.push(new SiteError(new Error(err)));
        } else {
            if (err.displayType === 'alert') {
                this.alertErrors.push(err);
            } else {
                this.siteErrors.push(err);
            }
        }
    }

    @action
    public setAppReady() {
        this._appReady = true;
    }

    public get appReady() {
        return this._appReady;
    }

    readonly portalVersion = remoteData<string | undefined>({
        invoke: async () => {
            const portalVersionResult = await client.getInfoUsingGET({});
            if (portalVersionResult && portalVersionResult.portalVersion) {
                let version = undefined;

                // try getting version from branch name assume like release-x.y.z
                if (
                    portalVersionResult.gitBranch &&
                    portalVersionResult.gitBranch.startsWith('release-')
                ) {
                    let branchVersion = portalVersionResult.gitBranch.split(
                        '-'
                    )[1];
                    if (branchVersion.split('.').length == 3) {
                        version = branchVersion;
                    }
                }

                // if branch name does not contain version name, use
                // portalVersion
                if (version === undefined) {
                    version = portalVersionResult.portalVersion.split('-')[0];
                }

                // add v prefix if missing
                if (version !== undefined && !version.startsWith('v')) {
                    version = `v${version}`;
                }
                return Promise.resolve(version);
            }
            return undefined;
        },
    });
}
