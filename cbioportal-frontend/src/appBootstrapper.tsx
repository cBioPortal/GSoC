import React from 'react';
import ReactDOM from 'react-dom';
import { configure, toJS } from 'mobx';
import { Provider } from 'mobx-react';
import { Router } from 'react-router-dom';
import { createBrowserHistory } from 'history';
import { syncHistoryWithStore } from 'mobx-react-router';
import ExtendedRoutingStore from './shared/lib/ExtendedRouterStore';
import { datadogLogs } from '@datadog/browser-logs';

import {
    fetchServerConfig,
    getLoadConfig,
    getServerConfig,
    initializeAPIClients,
    initializeAppStore,
    initializeLoadConfiguration,
    initializeServerConfiguration,
} from './config/config';

import './shared/lib/ajaxQuiet';
import _ from 'lodash';
import $ from 'jquery';
import * as superagent from 'superagent';
import { buildCBioPortalPageUrl } from './shared/api/urls';
import browser from 'bowser';
import { setNetworkListener } from './shared/lib/ajaxQuiet';
import { initializeTracking, sendToLoggly } from 'shared/lib/tracking';
import superagentCache from 'superagent-cache';
import {
    getBrowserWindow,
    hashString,
    isWebdriver,
    onMobxPromise,
} from 'cbioportal-frontend-commons';
import { AppStore } from './AppStore';
import { handleLongUrls } from 'shared/lib/handleLongUrls';
import 'shared/polyfill/canvasToBlob';
import { setCurrentURLHeader } from 'shared/lib/extraHeader';
import Container from 'appShell/App/Container';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { IServerConfig } from 'config/IAppConfig';
import { initializeGenericAssayServerConfig } from 'shared/lib/GenericAssayUtils/GenericAssayConfig';
import { FeatureFlagStore } from 'shared/FeatureFlagStore';
import eventBus from 'shared/events/eventBus';
import { SiteError } from 'shared/model/appMisc';
import load from 'little-loader';
import internalClient from 'shared/api/cbioportalInternalClientInstance';

export interface ICBioWindow {
    globalStores: {
        routing: ExtendedRoutingStore;
        appStore: AppStore;
    };
    routingStore: ExtendedRoutingStore;
    $: JQueryStatic;
    jQuery: JQueryStatic;

    e2etest: boolean;
    FRONTEND_VERSION: string;
    FRONTEND_COMMIT: string;
    rawServerConfig: IServerConfig;
    postLoadForMskCIS: () => void;
    isMSKCIS: boolean;
}

const browserWindow: ICBioWindow = window as any;

superagentCache(superagent);

configure({
    enforceActions: 'never',
    //disableErrorBoundaries: true
});
/*enableLogging({
    action: true,
    reaction: true,
    transaction: true,
    compute: true
});*/

// this must occur before we initialize tracking
// it fixes the hash portion of url when cohort patient list is too long
handleLongUrls();

// YOU MUST RUN THESE initialize and then set the public path after
initializeLoadConfiguration();
// THIS TELLS WEBPACK BUNDLE LOADER WHERE TO LOAD SPLIT BUNDLES
//@ts-ignore
__webpack_public_path__ = getLoadConfig().frontendUrl;

if (!browserWindow.hasOwnProperty('$')) {
    browserWindow.$ = $;
}

if (!browserWindow.hasOwnProperty('jQuery')) {
    browserWindow.jQuery = $;
}

// write browser name, version to body tag
if (browser) {
    $(document).ready(() => {
        $('body').addClass(browser.name);
    });
}

// e2e test specific stuff
if (getBrowserWindow().navigator.webdriver) {
    $(document).ready(() => {
        $('body').addClass('e2etest');
        browserWindow.e2etest = true;
    });
}

// if we are running e2e OR we are testing performance improvements manually
if (getBrowserWindow().navigator.webdriver || localStorage.recordAjaxQuiet) {
    setNetworkListener();
}

if (localStorage.getItem('timeElementVisible')) {
    const interval = setInterval(() => {
        const elementIsVisible = $(
            localStorage.getItem('timeElementVisible')!
        ).is(':visible');
        if (elementIsVisible) {
            clearInterval(interval);
            console.log(
                `TimeElementVisible for selector "${localStorage.timeElementVisible}"`,
                performance.now()
            );
        }
    }, 1000);
}

// for cbioportal instances, add an extra custom HTTP header to
// aid debugging in Sentry
if (/cbioportal\.org/.test(getBrowserWindow().location.href)) {
    setCurrentURLHeader();
}

// expose version on window
//@ts-ignore
browserWindow.FRONTEND_VERSION = VERSION;
//@ts-ignore
browserWindow.FRONTEND_COMMIT = COMMIT;

// this is a NOOP to fix CIS issue
browserWindow.postLoadForMskCIS = () => {};

// this is the only supported way to disable tracking for the $3Dmol.js
(browserWindow as any).$3Dmol = { notrack: true };

// expose lodash on window
getBrowserWindow()._ = _;

const routingStore = new ExtendedRoutingStore();

const history = createBrowserHistory({
    basename: getLoadConfig().basePath || '',
});

const syncedHistory = syncHistoryWithStore(history, routingStore);

const featureFlagStore = new FeatureFlagStore();

const stores = {
    // Key can be whatever you want
    routing: routingStore,
    appStore: new AppStore(featureFlagStore),
};

browserWindow.globalStores = stores;

eventBus.on('error', (err: SiteError) => {
    sendToLoggly({
        message: err?.errorObj?.message,
        ...err.meta,
    });
    stores.appStore.addError(err);
});

//@ts-ignore
const end = superagent.Request.prototype.end;

let redirecting = false;

//@ts-ignore
superagent.Request.prototype.end = function(callback) {
    return end.call(this, (error: any, response: any) => {
        if (redirecting) {
            return;
        }
        if (response && response.statusCode === 401) {
            var storageKey = `login-redirect`;

            localStorage.setItem(storageKey, window.location.href);

            // build URL with a reference to storage key so that /restore route can restore it after login
            //@ts-ignore because we're using buildCBioPortalPageUrl without a pathname, which is normally required
            const loginUrl = buildCBioPortalPageUrl({
                query: {
                    'spring-security-redirect': buildCBioPortalPageUrl({
                        pathname: 'restore',
                        query: { key: storageKey },
                    }),
                },
            });

            redirecting = true;
            window.location.href = loginUrl;
        } else {
            callback(error, response);
        }
    });
};

function enableDataDogTracking(store: AppStore) {
    datadogLogs.init({
        clientToken: 'pub9a94ebb002f105ff44d8e427b6549775',
        site: 'datadoghq.com',
        service: 'cbioportalinternal',
        forwardErrorsToLogs: true,
        sessionSampleRate: 100,
    } as any);

    const match = [
        /filtered-samples/,
        /clinical-data-bin-counts/,
        /generic-assay-data-bin-counts/,
        /mutated-genes/,
        /molecular-profile-sample-counts/,
        /cna-genes/,
        /structuralvariant-genes/,
        /clinical-data-counts/,
        /sample-lists-counts/,
        /clinical-data-density-plot/,
        /clinical-data-violin-plots/,
        /genomic-data-counts/,
        /mutation-data-counts/,
        /clinical-event-type-counts/,
        /treatments\/patient-counts/,
        /treatments\/sample-counts/,
        /genomic-data-bin-counts/,
        /clinical-event-type-counts/,
    ];

    const oldRequest = (internalClient as any).request;
    (internalClient as any).request = function(...args: any) {
        try {
            let url = args[1];

            if (Object.keys(args[4]).length) {
                url = url + '?' + $.param(args[4]);
            }

            const data = args[2];

            const studyIds = data.studyIds || data.studyViewFilter.studyIds;

            const appName = store.serverConfig.app_name;

            if (studyIds.length < 4 && _.some(match, re => re.test(url))) {
                const hash = hashString(url + JSON.stringify(toJS(data)));
                datadogLogs.logger.info('study view request', {
                    url,
                    data,
                    hash,
                    appName,
                });
            }
        } catch (ex) {
            // fail silently
        }

        return oldRequest.apply(this, args);
    };
}

//
browserWindow.routingStore = routingStore;

let render = (key?: number) => {
    if (!getBrowserWindow().navigator.webdriver) initializeTracking();

    if (stores.appStore?.serverConfig.user_display_name === 'servcbioportal') {
        getLoadConfig().hide_login = true;
        browserWindow.isMSKCIS = true;
    }

    // @ts-ignore
    if (stores.appStore.serverConfig.app_name === 'public-portal') {
        stores.appStore.serverConfig.download_custom_buttons_json = `[
        {
            "id": "avm",
            "name": "AVM for cBioPortal",
            "tooltip": "Launch AVM for cBioPortal with data (copied to clipboard)",
            "image_src": "https://aquminmedical.com/images/content/AquminLogoSimple.png",
            "required_user_agent": "Win",
            "required_installed_font_family": "AVMInstalled",
            "url_format": "avm://?importclipboard&-AutoMode=true&-ProjectNameHint={studyName}&-ImportDataLength={dataLength}",
            "visualize_title": "AVM for cBioPortal (Windows)",
            "visualize_href": "https://bit.ly/avm-cbioportal",
            "visualize_description": "Windows software that loads data into 3D Landscapes for interactive visualization and pathway analysis. Download table data directly from cBioPortal.",
            "visualize_image_src": "https://github.com/user-attachments/assets/5c17f5ed-0357-4ffa-a6e1-5a9d435dd3c5"
        }
    ]`;
    }

    const rootNode = document.getElementById('reactRoot');

    ReactDOM.render(
        <Provider {...stores}>
            <Router history={syncedHistory}>
                {/*@ts-ignore*/}
                <Container location={routingStore.location} />
            </Router>
        </Provider>,
        rootNode
    );
};

//@ts-ignore
if (__DEBUG__ && module.hot) {
    const renderApp = render;
    render = () => renderApp(Math.random());

    //@ts-ignore
    module.hot.accept('./routes', () => render());
}

async function loadCustomJs() {
    if (!getServerConfig().custom_js_urls) {
        return Promise.resolve();
    }
    const customJsFiles = getServerConfig().custom_js_urls.split(',');
    return Promise.all(
        Object.values(customJsFiles).map(
            (customJsFileUrl: string) =>
                new Promise<void>((resolve, reject) => {
                    load(customJsFileUrl, (err: any) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                })
        )
    );
}

$(document).ready(async () => {
    // we show blank page if the window.name is "blank"
    if (window.name === 'blank') {
        return;
    }

    // we use rawServerConfig (written by JSP) if it is present
    // or fetch from config service if not
    // need to use jsonp, so use jquery
    let initialServerConfig =
        browserWindow.rawServerConfig || (await fetchServerConfig());

    getBrowserWindow().onMobxPromise = onMobxPromise;

    initializeServerConfiguration(initialServerConfig);

    initializeGenericAssayServerConfig();

    initializeAPIClients();

    initializeAppStore(stores.appStore);

    await loadCustomJs();

    render();

    stores.appStore.setAppReady();
});
