const {
    goToUrlAndSetLocalStorage,
    waitForOncoprint,
    checkOncoprintElement,
    goToUrlAndSetLocalStorageWithProperty,
    getNthOncoprintTrackOptionsElements,
    clickElement,
    waitForElementDisplayed,
    getElement,
} = require('../../../shared/specUtils_Async');

const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');

const _ = require('lodash');
const { parse } = require('query-string');

const USER_SETTINGS_QUERY_PARAM = 'userSettingsJson';
const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const studyes0_oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint' +
    '?Action=Submit' +
    '&RPPA_SCORE_THRESHOLD=2.0' +
    '&Z_SCORE_THRESHOLD=2.0' +
    '&cancer_study_list=study_es_0' +
    '&case_set_id=study_es_0_all' +
    '&data_priority=0' +
    '&gene_list=ABLIM1%250ATMEM247' +
    '&geneset_list=%20' +
    '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic' +
    '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations' +
    '&profileFilter=0' +
    '&tab_index=tab_visualize';

const genericArrayUrl =
    CBIOPORTAL_URL +
    '/results?cancer_study_list=lgg_ucsf_2014_test_generic_assay&tab_index=tab_visualize&case_set_id=lgg_ucsf_2014_test_generic_assay_all&Action=Submit&gene_list=IDH1%250ATP53&generic_assay_groups=lgg_ucsf_2014_test_generic_assay_mutational_signature_binary_SBS%2Cmutational_signature_binary_SBS1%2Cmutational_signature_binary_SBS9%3Blgg_ucsf_2014_test_generic_assay_mutational_signature_category_SBS%2Cmutational_signature_category_SBS1%2Cmutational_signature_category_SBS9';
const SERVER_CLINICAL_TRACK_CONFIG = [
    {
        stableId: 'SUBTYPE',
        sortOrder: 'ASC',
        gapOn: true,
        gapMode: 'HIDE_GAPS',
    },
    {
        stableId: 'OS_STATUS',
        sortOrder: 'DESC',
        gapOn: false,
    },
    {
        stableId: 'DFS_STATUS',
        sortOrder: null,
        gapOn: null,
    },
];

const MANUAL_TRACK_CONFIG = [
    {
        stableId: 'SUBTYPE',
        sortOrder: 'ASC',
        gapOn: false,
        gapMode: 'HIDE_GAPS',
    },
    {
        stableId: 'OS_STATUS',
        sortOrder: 'ASC',
        gapOn: false,
    },
    {
        stableId: 'DFS_STATUS',
        sortOrder: 'ASC',
        gapOn: true,
    },
];

const ONCOPRINT_TIMEOUT = 100000;

describe('oncoprint', function() {
    this.retries(0);
    describe('generic assay categorical tracks', () => {
        it('shows binary and multiple category tracks', async () => {
            await goToUrlAndSetLocalStorage(genericArrayUrl, true);
            await waitForOncoprint();
            const res = await checkOncoprintElement();
            assertScreenShotMatch(res);
        });
    });

    describe('clinical tracks', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorageWithProperty(
                studyes0_oncoprintTabUrl,
                true,
                {
                    oncoprint_clinical_tracks_config_json: JSON.stringify(
                        SERVER_CLINICAL_TRACK_CONFIG
                    ),
                }
            );
            await waitForOncoprint();
        });

        it('initializes as configured by default', async () => {
            const res = await checkOncoprintElement();
            assertScreenShotMatch(res);
        });

        it('updates url when changing gaps', async () => {
            await changeNthTrack(1, 'Hide gaps (w/%)');
            const clinicalTracksUrlParam = await getTracksFromBookmark(browser);

            expect(clinicalTracksUrlParam).toEqual(
                SERVER_CLINICAL_TRACK_CONFIG
            );
        });

        it('updates url when sorting', async () => {
            await changeNthTrack(1, 'Sort Z-a');

            const clinicallist = await getTracksFromBookmark(browser);

            expect(SERVER_CLINICAL_TRACK_CONFIG[0].sortOrder === 'ASC');
            const updatedTrackConfig = JSON.parse(
                JSON.stringify(SERVER_CLINICAL_TRACK_CONFIG)
            );
            updatedTrackConfig[0].sortOrder = 'DESC';
            expect(clinicallist).toEqual(updatedTrackConfig);
        });

        it('initializes correctly when clinicallist config present in url', async () => {
            const urlWithUserConfig = createUrlWithSettingsQueryParam(
                MANUAL_TRACK_CONFIG
            );
            await goToUrlAndSetLocalStorage(urlWithUserConfig, false);
            await waitForOncoprint();

            const res = await checkOncoprintElement();
            assertScreenShotMatch(res);

            const clinicallist = await getTracksFromBookmark(browser);
            expect(clinicallist).toEqual(MANUAL_TRACK_CONFIG);
        });

        it('still supports legacy clinicallist format', async () => {
            const legacyFormatUrlParam = await createOncoprintFromLegacyFormat();

            await changeNthTrack(1, 'Sort a-Z');

            const res = await checkOncoprintElement();
            assertScreenShotMatch(res);

            const clinicallist = await getTracksFromBookmark(browser);

            const stableIds = clinicallist.map(tracks => tracks.stableId);
            expect(stableIds.join(',')).toEqual(legacyFormatUrlParam);
            expect(clinicallist[0].sortOrder).toEqual('ASC');
        });

        /**
         * Note: to rerun test locally, first clean user session
         */
        it.skip('stores config in user session when save button clicked', async () => {
            // Load page with a default config that differs from SERVER_CLINICAL_TRACK_CONFIG
            const customConfig = JSON.parse(
                JSON.stringify(SERVER_CLINICAL_TRACK_CONFIG)
            );
            // Remove track to create diff
            customConfig.pop();
            const urlWithUserConfig = await createUrlWithSettingsQueryParam(
                customConfig
            );
            await goToUrlAndSetLocalStorage(urlWithUserConfig, false);

            await waitForOncoprint();

            // Check save button enabled
            await openTracksMenu();
            const $saveSessionBtn = await getElement(
                '#save-oncoprint-config-to-session'
            );
            let classes = (await $saveSessionBtn.getAttribute('class')).split(
                ' '
            );
            const saveBtnIsEnabled = !classes.includes('disabled');
            expect(saveBtnIsEnabled).toBe(true);

            // Click save button
            await $saveSessionBtn.click();
            await waitForOncoprint();
            // Check save button disabled
            classes = (await $saveSessionBtn.getAttribute('class')).split(' ');
            const saveBtnIsDisabled = classes.includes('disabled');
            expect(saveBtnIsDisabled).toBe(true);
        });

        /**
         * Uses session from previous test
         * to differentiate between default and custom config
         */
        it.skip('uses configuration stored in session when available', async () => {
            // Expected should match custom config of previous test
            const expected = JSON.parse(
                JSON.stringify(SERVER_CLINICAL_TRACK_CONFIG)
            );
            expected.pop(); // <-- remove track
            const clinicallist = await getTracksFromBookmark(browser);
            expect(clinicallist).toEqual(expected);
        });
    });

    describe('oql structural variant tracks', async () => {
        beforeEach(async () => {
            // Build Struct Var OQL and place in the URL.
            const oql =
                // Downstream KIAA1549 has 1 struct var event (0.1%):
                'KIAA1549: FUSION::\n' +
                // Downstream KIAA1549 (using NULL special value) has 0 struct vars events:
                'KIAA1549: FUSION::-\n' +
                // Downstream BRAF has 1 struct var event (0.1%):
                'BRAF: FUSION::\n' +
                // Upstream BRAF has 35 struct var events (4%):
                'BRAF: ::FUSION\n' +
                // Upstream TMPRSS2 and downstream ERG have 1 struct var events (0.1%):
                'ERG: TMPRSS2::FUSION\n';
            const encodedOql = encodeURI(encodeURIComponent(oql));

            const stuctVarUrl =
                CBIOPORTAL_URL +
                '/results/oncoprint' +
                '?Action=Submit' +
                '&RPPA_SCORE_THRESHOLD=2.0' +
                '&Z_SCORE_THRESHOLD=2.0' +
                '&cancer_study_list=study_es_0' +
                '&case_set_id=study_es_0_all' +
                '&data_priority=0' +
                '&gene_list=' +
                encodedOql +
                '&geneset_list=%20' +
                '&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic' +
                '&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations' +
                '&profileFilter=0' +
                '&tab_index=tab_visualize';

            // Define a set of clinical tracks in the props so that changes here
            // do not cause unnecessary differences in the screenshot test.
            await goToUrlAndSetLocalStorageWithProperty(stuctVarUrl, true, {
                oncoprint_clinical_tracks_config_json: JSON.stringify(
                    SERVER_CLINICAL_TRACK_CONFIG
                ),
            });
            await waitForOncoprint();
        });

        it('shows oql structural variant variations', async function() {
            const res = await checkOncoprintElement();
            assertScreenShotMatch(res);
        });
    });
});

function createUrlWithSettingsQueryParam(config) {
    const jsonConfig = encodeURIComponent(
        JSON.stringify({ clinicallist: config })
    );
    return `${studyes0_oncoprintTabUrl}#${USER_SETTINGS_QUERY_PARAM}=${jsonConfig}`;
}

async function openTracksMenu() {
    const $tracksDropdown = await getElement('#addTracksDropdown');
    await $tracksDropdown.click();
    await waitForOncoprint();
}

async function changeNthTrack(track, menuOptionButtonText) {
    const firstTrack = await getNthOncoprintTrackOptionsElements(1);
    await firstTrack.button.click();
    await waitForElementDisplayed(firstTrack.dropdown_selector, {
        timeout: 1000,
    });
    await clickElement(`li=${menuOptionButtonText}`);
    await waitForOncoprint();
}

async function getBookmarkUrl(browser) {
    const showBookmarkButtonSelector = '[data-test=bookmark-link]';
    await browser.waitUntil(
        async () =>
            await (await getElement(showBookmarkButtonSelector)).isExisting()
    );
    await clickElement(showBookmarkButtonSelector);
    const bookmarkUrlInputFieldSelector = '[data-test=bookmark-url]';
    await browser.waitUntil(
        async () =>
            await (await getElement(bookmarkUrlInputFieldSelector)).isExisting()
    );
    const $bookMarkUrl = await getElement('[data-test=bookmark-url]');
    return $bookMarkUrl.getValue();
}

async function getTracksFromBookmark(browser) {
    const bookmarkUrl = await getBookmarkUrl(browser);
    const userSettings = await getUserSettingsFrom(bookmarkUrl);
    return userSettings.clinicallist;
}

async function getUserSettingsFrom(bookmarkUrl) {
    let params = parse(new URL(bookmarkUrl).hash);
    return JSON.parse(params[USER_SETTINGS_QUERY_PARAM]);
}

/**
 * @returns {string} legacy format
 */
async function createOncoprintFromLegacyFormat() {
    const legacyFormatQueryParam = MANUAL_TRACK_CONFIG.map(
        track => track.stableId
    ).join(',');
    const legacyUrl = `${studyes0_oncoprintTabUrl}&clinicallist=${legacyFormatQueryParam}`;
    await goToUrlAndSetLocalStorage(legacyUrl, false);
    await waitForOncoprint();
    return legacyFormatQueryParam;
}
