import {
    PageSettingsData,
    PageSettingsUpdateRequest,
} from 'shared/api/session-service/sessionServiceModels';
import {
    computed,
    IReactionDisposer,
    makeAutoObservable,
    observable,
    reaction,
    toJS,
} from 'mobx';
import sessionServiceClient from 'shared/api/sessionServiceInstance';
import { AppStore } from 'AppStore';
import _ from 'lodash';
import { IPageUserSession } from 'shared/userSession/IPageUserSession';
import { PageSettingsIdentifier } from './PageSettingsIdentifier';
import { getServerConfig } from 'config/config';

export class PageUserSession<T extends PageSettingsData>
    implements IPageUserSession<T> {
    private _id: PageSettingsIdentifier;

    private _previousId: PageSettingsIdentifier | undefined;

    /**
     * User session as used in app, including user changes
     */
    @observable
    private _userSettings: T | undefined;

    /**
     * User settings as stored in user session
     */
    private _savedUserSettings: T | undefined;

    private _userSettingsBeforeLogin: T | undefined;
    private _wasLoggedIn: boolean;

    /**
     * Saved user settings are loaded
     */
    private _isLoaded = false;

    private _reactionDisposers: IReactionDisposer[] = [];

    constructor(
        private appStore: AppStore,
        public isSessionServiceEnabled: boolean
    ) {
        makeAutoObservable(this);

        this._wasLoggedIn = this.isLoggedIn;

        /**
         * Fetch user settings when  user session is enabled and study ID changes
         */
        this._reactionDisposers.push(
            reaction(
                () => [this.id, this.isUserSessionEnabled],
                async () => {
                    await this.fetchSessionUserSettings();
                }
            )
        );

        /**
         * Store changes made before logging in
         */
        this._reactionDisposers.push(
            reaction(
                () => this._wasLoggedIn !== this.isLoggedIn,
                () => {
                    this._wasLoggedIn = this.isLoggedIn;

                    if (this.isLoggedIn) {
                        this._userSettingsBeforeLogin = this._userSettings;
                    }
                }
            )
        );
    }

    get isLoaded(): boolean {
        return this._isLoaded;
    }

    public get id(): PageSettingsIdentifier {
        return this._id;
    }

    @observable
    public set id(id: PageSettingsIdentifier) {
        this._id = id;
    }

    @observable
    public get userSettings(): T | undefined {
        return this._userSettings;
    }

    public set userSettings(userSettings: T | undefined) {
        this._userSettings = userSettings;
    }

    @computed
    public get isLoggedIn() {
        return this.appStore.isLoggedIn;
    }

    @computed
    public get hasSavedConfig() {
        console.log(
            'hasSavedConfig',
            toJS(this._savedUserSettings),
            isConfigured(this._savedUserSettings)
        );
        return isConfigured(this._savedUserSettings);
    }

    /**
     * Local user settings differ from those stored in the user session
     */
    @computed
    public get isDirty(): boolean {
        const dirtyUserSettings = !isEqual(
            this._userSettings,
            this._savedUserSettings
        );
        const dirtyId = !isEqual(this._id, this._previousId);
        return dirtyUserSettings || dirtyId;
    }

    @computed
    public get hasUnsavedChangesFromBeforeLogin(): boolean {
        return !!this._userSettingsBeforeLogin;
    }

    public restoreUnsavedChangesMadeBeforeLogin = async () => {
        this.userSettings = this._userSettingsBeforeLogin;
        this._userSettingsBeforeLogin = undefined;
    };

    public discardUnsavedChangesMadeBeforeLogin = () => {
        this._userSettingsBeforeLogin = undefined;
    };

    public saveUserSession = async () => {
        const update = {
            ...this.id,
            ...this.userSettings,
        } as PageSettingsUpdateRequest;
        await sessionServiceClient.updateUserSettings(update);
        this._savedUserSettings = this.userSettings;
        this._previousId = this.id;
    };

    @computed
    private get isUserSessionEnabled() {
        return this.isLoggedIn && this.isSessionServiceEnabled;
    }

    private async fetchSessionUserSettings() {
        const shouldFetch = this.isUserSessionEnabled && this.isDirty;

        if (shouldFetch) {
            this._savedUserSettings = await sessionServiceClient.fetchPageSettings<
                T
            >(this.id, true);

            this._previousId = this.id;
            if (isConfigured(this._savedUserSettings)) {
                this._userSettings = this._savedUserSettings;
            } else if (isConfigured(this._userSettingsBeforeLogin)) {
                this._userSettings = this._userSettingsBeforeLogin;
            }
            this._isLoaded = true;
        }
    }

    destroy() {
        this._reactionDisposers.forEach(disposer => disposer());
    }
}

/**
 * Null and undefined should be considered equal:
 * backend and frontend use these values interchangeably
 */
function isEqual(a: any, b: any) {
    return _.isEqualWith(toJS(a), toJS(b), nilIsEqual);
}

/**
 * @returns {true|undefined}
 *  true when both null or undefined;
 *  undefined to use default comparator
 */
function nilIsEqual(a: any, b: any) {
    if (_.isNil(a) && _.isNil(b)) {
        return true;
    } else {
        return undefined;
    }
}

/**
 * Config is empty when an empty string or an empty object
 * - Server returns empty object when empty
 * - Default json config file can be empty string
 */
export function isConfigured(config: any) {
    return !_.isEmpty(toJS(config));
}
