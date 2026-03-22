import { buildCBioPortalPageUrl } from '../api/urls';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { fetchServerConfig } from '../../config/config';
import { AppStore } from '../../AppStore';
import { IServerConfig } from '../../config/IAppConfig';

export function openSocialAuthWindow(appStore: AppStore) {
    var _window = getBrowserWindow().open(
        buildCBioPortalPageUrl('login'),
        'blank',
        'width=1000, height=800'
    )!;
    var interval = setInterval(function() {
        try {
            if (_window.closed) {
                clearInterval(interval);
            } else if (
                _window.document.URL.includes(location.origin) &&
                !_window.document.URL.includes(location.origin + '/auth') &&
                !_window.document.URL.includes('login')
            ) {
                _window.close();

                fetchServerConfig().then((config: IServerConfig) => {
                    appStore.userName = config.user_display_name;
                    appStore.authMethod = config.authenticationMethod;
                });
            }
        } catch (err) {
            console.log('Error while monitoring the Login window: ', err);
        }
    }, 1000);
}
