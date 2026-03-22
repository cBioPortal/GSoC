import { observable } from 'mobx';
import { parseUrl } from 'query-string';
import _ from 'lodash';

const FEATURE_FLAG_ID = 'featureFlags';
const DELIMITER = ',';

export class FeatureFlagStore {
    @observable.ref currentState: string[] = [];

    constructor() {
        const url = parseUrl(window.location.href);
        let newState =
            url.query.featureFlags?.toString().split(DELIMITER) || [];
        this.add(newState);
    }

    add(toAdd: string | string[]) {
        // normalize input to array
        const _toAdd = _.isString(toAdd) ? [toAdd] : toAdd;

        let storageState =
            localStorage.getItem(FEATURE_FLAG_ID)?.split(DELIMITER) || [];
        this.currentState = _.uniq(storageState.concat(_toAdd));
        localStorage.setItem(
            FEATURE_FLAG_ID,
            this.currentState.join(DELIMITER)
        );
    }

    clear() {
        localStorage.removeItem(FEATURE_FLAG_ID);
        this.currentState = [];
    }

    remove(flag: string) {
        let storageState =
            localStorage.getItem(FEATURE_FLAG_ID)?.split(DELIMITER) || [];
        let newState = _.reject(storageState, s => s === flag);
        this.currentState = newState;
        localStorage.setItem(
            FEATURE_FLAG_ID,
            this.currentState.join(DELIMITER)
        );

        window.location.href = window.location.href.replace(
            /featureFlags=[^&]+/,
            ''
        );
    }

    has(str: string) {
        return this.currentState.includes(str);
    }
}
