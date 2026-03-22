import * as React from 'react';
import { AppStore } from 'AppStore';
import { observer } from 'mobx-react';
import styles from './errorScreen.module.scss';
import classNames from 'classnames';
import _ from 'lodash';

export const ErrorAlert: React.FunctionComponent<{
    appStore: AppStore;
}> = observer(function({ appStore }) {
    const errorGroups = _.groupBy(
        appStore.alertErrors,
        e => e.errorObj.message
    );

    return appStore.alertErrors.length ? (
        <div className={styles.errorAlert}>
            {_.map(errorGroups, (errors, message) => {
                return <p>{message}</p>;
            })}
            <i
                className={classNames(styles.dismissButton, 'fa', 'fa-close')}
                onClick={() => appStore.alertErrors.clear()}
            />
        </div>
    ) : null;
});
