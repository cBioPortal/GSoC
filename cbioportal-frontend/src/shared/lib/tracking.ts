import $ from 'jquery';
import { getServerConfig } from 'config/config';
import { getBrowserWindow, isWebdriver } from 'cbioportal-frontend-commons';
import { datadogRum } from '@datadog/browser-rum';
import _ from 'lodash';
import { log } from './consoleLog';
import { StudyViewPageStore } from '../../pages/studyView/StudyViewPageStore';
// @ts-ignore
import { UniversalAnalytics } from 'google.analytics';

export type GAEvent = {
    category:
    | 'studyPage'
    | 'resultsView'
    | 'quickSearch'
    | 'download'
    | 'groupComparison'
    | 'homePage'
    | 'patientView'
    | 'linkout';
    action: string;
    label?: string | string[];
    fieldsObject?: { [key: string]: string | number };
};

export type GA4Event = {
    eventName: string;
    parameters: { [key: string]: string | number };
};

function detectGA4() {
    return (
        true || /^G-/.test(getServerConfig().google_analytics_profile_id || '')
    );
}

export function initializeTracking() {
    if (!_.isEmpty(getServerConfig().google_analytics_profile_id)) {
        // Google Analaytics v4 replaced Universal Analytics in 2023 and we can detect the new
        // implementation based on the prefix (G-) of the analytics id, e.g. "G-XXXXXXXX"
        if (detectGA4()) {
            embedGoogleAnalyticsVersion4(
                getServerConfig().google_analytics_profile_id!
            );
        } else {
            embedGoogleAnalytics(
                getServerConfig().google_analytics_profile_id!
            );
        }
    }

    // Initialize Datadog RUM
    initializeDatadogRUM();

    $('body').on('click', '[data-event]', el => {
        try {
            const event: GAEvent = JSON.parse(
                $(el.currentTarget).attr('data-event')!
            ) as GAEvent;
            trackEvent(event);
        } catch (ex) {}
    });
}

export function trackEvent(event: any) {
    //
    // trackEvent is used to send custom UI events which may depend on custom configuration within GA
    // for other installers, we want to shut these off, leaving them with bare-bones out-of-box GA implementaion
    if (/cbioportal\.org$|mskcc\.org$/.test(getBrowserWindow().location.host)) {
        if (detectGA4() && event.eventName) {
            getGA4Instance()('event', event.eventName, event.parameters);
        }
    }
}

export function serializeEvent(gaEvent: GAEvent) {
    // when we send arrays of values as single event properties to google analytics
    // we want to send them as comma delimitted strings WITH trailing commas to allow us to filter in analytics
    // without risk of catching substring matches (e.g. tcga_brca, tcga_brca_2018)
    // this is annoying to do on one off basis, so this is a little helper transform
    const arraysToString = _.mapValues(gaEvent, val => {
        if (_.isArray(val)) {
            return val.join(',') + ','; // add trailing comma
        } else {
            return val;
        }
    });

    try {
        return JSON.stringify(arraysToString);
    } catch (ex) {}
}

export function sendToLoggly(payload: Record<string, string | number>) {
    try {
        if (/cbioportal\.org$/.test(window.location.hostname)) {
            const LOGGLY_TOKEN = 'b7a422a1-9878-49a2-8a30-2a8d5d33518f';

            const data = {
                location: window.location.href.replace(/#.*$/, ''),
                ...payload,
                e2e: isWebdriver() ? 'true' : 'false',
            };

            $.ajax({
                url: `//logs-01.loggly.com/inputs/${LOGGLY_TOKEN}.gif`,
                data,
            });
        }
    } catch (ex) {
        // do nothing
    }
}

export function embedGoogleAnalytics(ga_code: string) {
    $(document).ready(function() {
        $(
            '<script async src="https://www.google-analytics.com/analytics.js"></script>'
        ).appendTo('body');
        $(
            '<script async src="https://cdnjs.cloudflare.com/ajax/libs/autotrack/2.4.1/autotrack.js"></script>'
        ).appendTo('body');
        getBrowserWindow().ga =
            getBrowserWindow().ga ||
            function() {
                (ga.q = ga.q || []).push(arguments);
            };
        const ga: UniversalAnalytics.ga = getBrowserWindow().ga;
        ga.l = +new Date();
        ga('create', ga_code, 'auto');

        ga('require', 'urlChangeTracker', {
            hitFilter: function(model: any) {
                sendToLoggly({ message: 'PAGE_VIEW' });
            },
        });

        ga('require', 'cleanUrlTracker', {
            stripQuery: true,
            trailingSlash: 'remove',
        });
        ga('send', 'pageview');
        sendToLoggly({ message: 'PAGE_VIEW' });
    });
}

export function embedGoogleAnalyticsVersion4(ga_code: string) {
    $(document).ready(function() {
        $(
            `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga_code}"></script>`
        ).appendTo('body');

        getBrowserWindow().dataLayer = getBrowserWindow().dataLayer || [];

        function gtag(...args: any[]) {
            getBrowserWindow().dataLayer.push(arguments);
        }

        getBrowserWindow().gtag = gtag;

        gtag('js', new Date());

        gtag('config', ga_code);

        sendToLoggly({ message: 'PAGE_VIEW' });
    });
}

export function initializeDatadogRUM() {
    const config = getServerConfig();

    if (!config.datadog_rum_application_id || !config.datadog_rum_client_token) {
        return;
    }

    datadogRum.init({
        applicationId: config.datadog_rum_application_id,
        clientToken: config.datadog_rum_client_token,
        site: config.datadog_rum_site || 'datadoghq.com',
        service: config.app_name || 'cbioportal',
        env: config.datadog_rum_env || 'public',
        sessionSampleRate: config.datadog_rum_session_sample_rate || 100,
        sessionReplaySampleRate: config.datadog_rum_session_replay_sample_rate || 20,
        defaultPrivacyLevel: 'mask-user-input',
    });
}

export function sendSentryMessage(msg: string) {
    log('sentry message', msg);
    if ((window as any).Sentry) {
        (window as any).Sentry.captureException(new Error(msg));
    }
}

export function getGA4Instance() {
    return getBrowserWindow().gtag as (
        command: string,
        eventName: string,
        parameters: any
    ) => void;
}

export function getGAInstance(): UniversalAnalytics.ga {
    const ga: UniversalAnalytics.ga = getBrowserWindow().ga;

    return ga || function() {};
}

let queryCount = 0;

export enum GACustomFieldsEnum {
    Studies = 'studies',
}

export function trackQuery(
    cancerStudyIds: string[],
    oql: string,
    geneSymbols: string[],
    isVirtualStudy: boolean
) {
    getGA4Instance()('event', 'resultsViewQuery', {
        ['studies']: cancerStudyIds.join(',') + ',',
        ['oql']: oql,
        ['study count']: cancerStudyIds.length,
        ['genes']: geneSymbols.join(',') + ',',
        ['virtual study']: isVirtualStudy.toString(),
    });
}

export function trackPatient(studyId: string): void {
    trackEvent({
        category: 'patientView',
        action: 'patientViewed',
        label: studyId,
    });
}

export function trackStudyViewFilterEvent(
    label: string,
    store: StudyViewPageStore
) {
    trackEvent({
        category: 'studyPage',
        action: 'addFilter',
        label: label,
        fieldsObject: {
            [GACustomFieldsEnum.Studies]:
                store.queriedPhysicalStudyIds.result.join(',') + ',',
        },
    });
}
