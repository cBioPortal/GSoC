import ExtendedRouterStore from './ExtendedRouterStore';
import { getBrowserWindow } from 'cbioportal-frontend-commons';
import { QueryParams } from 'url';
import { PatientViewUrlParams } from '../../pages/patientView/PatientViewPage';
import { getServerConfig } from 'config/config';
import ResultsViewURLWrapper from 'pages/resultsView/ResultsViewURLWrapper';
import { EncodedURLParam } from './bitly';
import { ServerConfigHelpers } from 'config/config';
import { CategorizedConfigItems } from 'config/IAppConfig';
import _ from 'lodash';
import client from 'shared/api/cbioportalClientInstance';

export function restoreRouteAfterRedirect(injected: {
    routing: ExtendedRouterStore;
}) {
    const win = getBrowserWindow();

    const key = injected.routing.query.key;
    let restoreRoute = win.localStorage.getItem(key);
    if (restoreRoute) {
        restoreRoute = restoreRoute.replace(/^#/, '');
        win.localStorage.removeItem(key);
        if (restoreRoute.includes(win.location.hostname)) {
            win.location.href = restoreRoute;
        } else {
            injected.routing.push(restoreRoute);
        }
    } else {
        injected.routing.push('/');
    }
    return null;
}

// harvest query data written to the page by JSP (or assigned by parent window) to support queries originating
// from external posts
export function handlePostedSubmission(urlWrapper: ResultsViewURLWrapper) {
    if (getBrowserWindow().postData || getBrowserWindow().clientPostedData) {
        urlWrapper.updateURL(
            getBrowserWindow().postData || getBrowserWindow().clientPostedData,
            'results',
            true,
            true
        );
        // we don't want this data to be around anymore once we've tranferred it to URL
        getBrowserWindow().postData = null;
        getBrowserWindow().clientPostedData = null;
    }
}

export function handleLegacySubmission(urlWrapper: ResultsViewURLWrapper) {
    const legacySubmission = localStorage.getItem('legacyStudySubmission');
    localStorage.removeItem('legacyStudySubmission');
    if (legacySubmission) {
        const parsedSubmission: any = JSON.parse(legacySubmission);
        if (parsedSubmission.Action) {
            urlWrapper.updateURL(parsedSubmission, 'results');
        }
    }
}

export function handleCaseDO() {
    const routingStore: ExtendedRouterStore = getBrowserWindow().routingStore;

    const newParams: Partial<PatientViewUrlParams> = {};

    const currentQuery = routingStore.query;

    if (currentQuery.cancer_study_id) {
        newParams.studyId = currentQuery.cancer_study_id;
    }

    if (currentQuery.case_id) {
        newParams.caseId = currentQuery.case_id;
    }

    if (currentQuery.sample_id) {
        newParams.sampleId = currentQuery.sample_id;
    }

    if (
        routingStore.location.hash &&
        routingStore.location.hash.includes('nav_case_ids')
    ) {
        routingStore.location.hash = routingStore.location.hash!.replace(
            /nav_case_ids/,
            'navCaseIds'
        );
    }

    // Support for URLs like cbioportal.org/case.do#/patient?studyId=foo&caseId=bar
    if (
        routingStore.location.hash &&
        routingStore.location.hash.startsWith('#/patient')
    ) {
        routingStore.location.hash = routingStore.location.hash!.replace(
            /#\/patient\??/,
            ''
        );
        // parse the url params from the hash and add them to new params
        routingStore.location.hash
            .split('&') // split the url params
            .map(s => s.split('=')) // separate key value pairs
            .forEach(pair => (newParams[pair[0]] = pair[1]));
        routingStore.location.hash = '';
    }

    (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(
        newParams,
        '/patient',
        true
    );
}

async function getCuratedNonRedundantStudyList() {
    // Parse curated non-redundant set from AppConfig
    let quickSelectButtons: CategorizedConfigItems = {};
    if (getServerConfig().skin_quick_select_buttons) {
        try {
            quickSelectButtons = ServerConfigHelpers.parseConfigFormat(
                getServerConfig().skin_quick_select_buttons
            );
        } catch (ex) {
            return {};
        }
    }

    const curatedNonRedundantStudyIdsArray = _.find(
        quickSelectButtons,
        (studyIds, buttonName) => {
            const [buttonText, tooltipText] = buttonName.split('|');
            return buttonText
                .toLowerCase()
                .includes('curated set of non-redundant studies');
        }
    );
    if (curatedNonRedundantStudyIdsArray) {
        // filter out studies that user doesnt have access to
        const allStudies = await client.getAllStudiesUsingGET({});
        const accessStudyIds = _.keyBy(allStudies, s => s.studyId);

        const filteredIds = curatedNonRedundantStudyIdsArray.filter(
            s => s in accessStudyIds
        );
        return filteredIds.join(',');
    }
    return undefined;
}
/*
 * Handle LinkOut of style /ln?q=TP53:MUT and ln?cancer_study_id=gbm_tcga&q=EGFR+NF1.
 */
export async function handleLinkOut() {
    const routingStore: ExtendedRouterStore = getBrowserWindow().routingStore;
    const currentQuery = routingStore.query;

    const curatedList = await getCuratedNonRedundantStudyList();

    const data = {
        case_set_id: 'all',
        gene_list: currentQuery.q.replace('+', ','),
        cancer_study_list:
            curatedList ||
            currentQuery.cancer_study_id ||
            // use same set of studies as quick search gene query if no
            // specific study is supplied
            getServerConfig().default_cross_cancer_study_session_id ||
            getServerConfig().default_cross_cancer_study_list,
    };

    (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(
        data,
        '/results/mutations',
        true,
        true
    );
}

export function handleStudyDO() {
    (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(
        {},
        '/study',
        false
    );
}

export function handleIndexDO() {
    if (/Action=Submit/i.test(window.location.search)) {
        let data: QueryParams = {};

        // ALL QUERIES NOW HAVE cancer_study_list. if we have a legacy cancer_study_id but not a cancer_study_list, copy it over
        if (
            !getBrowserWindow().routingStore.query.cancer_study_list &&
            getBrowserWindow().routingStore.query.cancer_study_id
        ) {
            data.cancer_study_list = getBrowserWindow().routingStore.query.cancer_study_id;
            data.cancer_study_id = undefined;
        }

        (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(
            data,
            '/results'
        );
    } else if (/session_id/.test(window.location.search)) {
        (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(
            {},
            '/results'
        );
    } else {
        (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(
            {},
            '/'
        );
    }
}

export function handleEncodedRedirect() {
    const encodedURL = getBrowserWindow().routingStore.query[EncodedURLParam];
    const decodedURL = atob(encodedURL);
    getBrowserWindow().location.href = decodedURL;
}

export function redirectTo(
    newParams: QueryParams,
    path: string | undefined = undefined,
    clear = false
) {
    (getBrowserWindow().routingStore as ExtendedRouterStore).updateRoute(
        newParams,
        path,
        clear,
        true
    );
}
