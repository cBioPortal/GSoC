const assert = require('assert');
const {
    getElement,
    waitForOncoprint,
    goToUrlAndSetLocalStorage,
    goToUrlAndSetLocalStorageWithProperty,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const url = `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&data_priority=0&gene_list=ABLIM1%250ATMEM247&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize`;

describe('results view check possibility to disable tabs', function() {
    it('check that all tabs can be disabled', async () => {
        await goToUrlAndSetLocalStorage(url, true);
        await waitForOncoprint();
        const tabsContainer = await getElement('.mainTabs');
        await tabsContainer.waitForDisplayed();
        const tabs = await getResultsViewTabNames();

        // test that each tab can be disabled
        let message = '';
        let allTabsCanBeDisabled = true;

        for (const tab of tabs) {
            await goToUrlAndSetLocalStorageWithProperty(url, true, {
                disabled_tabs: tab,
            });
            await tabsContainer.waitForDisplayed();
            const tabAnchor = await getElement('.tabAnchor.tabAnchor_' + tab);
            if (await tabAnchor.isDisplayed()) {
                message += 'Tab ' + tab + ' could not be disabled; ';
                allTabsCanBeDisabled = false;
            }
        }
        assert(allTabsCanBeDisabled, message);
    });
});

async function getResultsViewTabNames() {
    // getting all visible tabs, excluding the first one, oncoprint
    const tabsElement = await (await getElement('.nav-tabs')).$$('.tabAnchor');

    const tabs = [];
    for (const tab of tabsElement) {
        if (await tab.isDisplayed()) {
            const classes = await tab.getAttribute('class');
            if (!classes.includes('tabAnchor_oncoprint')) {
                const tabAnchorClass = classes
                    .split(' ')
                    .find(cls => cls.startsWith('tabAnchor_'));
                if (tabAnchorClass) {
                    tabs.push(tabAnchorClass.split('_')[1]);
                }
            }
        }
    }
    return tabs;
}
