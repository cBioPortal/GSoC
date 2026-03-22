const assert = require('assert');
const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');
const {
    checkElementWithMouseDisabled,
    goToUrlAndSetLocalStorage,
    waitForNetworkQuiet,
    setDropdownOpen,
    jsApiHover,
    waitForElementDisplayed,
    clickElement,
    getElement,
    getNestedElement,
    getCSSProperty,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const ADD_CHART_BUTTON = "[data-test='add-charts-button']";
const ADD_CHART_GENERIC_ASSAY_TAB =
    '.addChartTabs a.tabAnchor_MUTATIONAL_SIGNATURE_TEST';
const GENERIC_ASSAY_PROFILE_SELECTION =
    "[data-test='GenericAssayProfileSelection']";
const CATEGORY_MUTATIONAL_SIGNATURE_PROFILE_TEXT =
    'div=mutational signature category v2 (61 samples)';
const ADD_CHART_X_VS_Y_TAB = '.addChartTabs a.tabAnchor_X_Vs_Y';
const WAIT_FOR_VISIBLE_TIMEOUT = 30000;
const MUTATIONS_GENES_TABLE = "[data-test='mutations-table']";
const CANCER_GENE_FILTER_ICON = "[data-test='header-filter-icon']";
const ADD_CUSTOM_CHART_TAB = '.addChartTabs a.tabAnchor.tabAnchor_Custom_Data';

describe('study view generic assay categorical/binary features', function() {
    it.skip('generic assay pie chart should be added in the summary tab', async function() {
        this.retries(0);

        const url = `${CBIOPORTAL_URL}/study?id=lgg_ucsf_2014_test_generic_assay`;
        await goToUrlAndSetLocalStorage(url, true);

        await (await $(ADD_CHART_BUTTON)).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await (await $(ADD_CHART_BUTTON)).click();

        // Change to GENERIC ASSAY tab
        await (await $(ADD_CHART_GENERIC_ASSAY_TAB)).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        //browser.debug();
        await (await $(ADD_CHART_GENERIC_ASSAY_TAB)).click();

        // Select category mutational signature profile
        await (await $(GENERIC_ASSAY_PROFILE_SELECTION)).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await (await $(GENERIC_ASSAY_PROFILE_SELECTION)).click();

        await (
            await (await $(GENERIC_ASSAY_PROFILE_SELECTION)).$(
                CATEGORY_MUTATIONAL_SIGNATURE_PROFILE_TEXT
            )
        ).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await (
            await (await $(GENERIC_ASSAY_PROFILE_SELECTION)).$(
                CATEGORY_MUTATIONAL_SIGNATURE_PROFILE_TEXT
            )
        ).click();

        // wait for generic assay data loading complete
        // and select a option
        await (
            await $('div[data-test="GenericAssayEntitySelection"]')
        ).waitForExist();
        await (
            await $('div[data-test="GenericAssayEntitySelection"] input')
        ).setValue('mutational_signature_category_10');

        await (await $('div=Select all filtered options (1)')).waitForExist();
        await (await $('div=Select all filtered options (1)')).click();
        // close the dropdown
        var indicators = await $$('div[class$="indicatorContainer"]');
        await indicators[0].click();
        var selectedOptions = await $$('div[class$="multiValue"]');
        assert.equal(selectedOptions.length, 1);

        // this needs to be done twice for some reason on circleci
        await (await $('button=Add Chart')).click();
        await (await $('button=Add Chart')).click();
        //$('button=Add Chart').click();
        // Wait for chart to be added
        await waitForNetworkQuiet();

        // allow time to render
        await browser.pause(1000);

        const el = await jq(
            "[data-test*='chart-container-mutational_signature_category_10_mutational']"
        );
        const att = await (await $(el[0])).getAttribute('data-test');

        // console.log('AARON');
        // console.log(att);

        const res = await checkElementWithMouseDisabled(`[data-test='${att}']`);

        assertScreenShotMatch(res);
    });
});

describe('Test the Custom data tab', function() {
    it('Add custom data tab should have numerical and categorical selector', async () => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_ucsf_2014_test_generic_assay`;
        await goToUrlAndSetLocalStorage(url, true);
        await waitForNetworkQuiet();

        await waitForElementDisplayed(ADD_CHART_BUTTON, {
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await clickElement(ADD_CHART_BUTTON);

        await waitForNetworkQuiet();
        // Change to custom tab
        await waitForElementDisplayed(ADD_CUSTOM_CHART_TAB, {
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await clickElement(ADD_CUSTOM_CHART_TAB);
        const res = await browser.checkElement('div.msk-tab.custom');
        assertScreenShotMatch(res);
    });
    it('Selecting numerical for custom data should return a bar chart', async () => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_ucsf_2014_test_generic_assay`;
        await goToUrlAndSetLocalStorage(url, true);
        await waitForNetworkQuiet();

        await waitForElementDisplayed(ADD_CHART_BUTTON, {
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await clickElement(ADD_CHART_BUTTON);

        await waitForNetworkQuiet();
        // Change to custom tab
        await waitForElementDisplayed(ADD_CUSTOM_CHART_TAB, {
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await clickElement(ADD_CUSTOM_CHART_TAB);
        CUSTOM_CHART_TAB = await getElement('div.msk-tab.custom');
        // Add values to the input form
    });
});

describe('study view x vs y charts', function() {
    this.retries(0);
    const X_VS_Y_CHART = `div[data-test="chart-container-X-VS-Y-AGE-MUTATION_COUNT"]`;
    const X_VS_Y_HAMBURGER_ICON = `${X_VS_Y_CHART} [data-test="chart-header-hamburger-icon"]`;
    const X_VS_Y_MENU = `${X_VS_Y_CHART} [data-test="chart-header-hamburger-icon-menu"]`;
    before(async () => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_ucsf_2014_test_generic_assay`;
        await goToUrlAndSetLocalStorage(url, true);

        // remove mutation count vs diagnosis age chart if it exists
        if (await (await getElement(X_VS_Y_CHART)).isExisting()) {
            await jsApiHover(X_VS_Y_CHART);
            await (
                await getNestedElement([
                    X_VS_Y_CHART,
                    '[data-test="deleteChart"]',
                ])
            ).waitForDisplayed();
            await (
                await getNestedElement([
                    X_VS_Y_CHART,
                    '[data-test="deleteChart"]',
                ])
            ).click();
            await browser.waitUntil(async () => {
                return !(await (await getElement(X_VS_Y_CHART)).isExisting());
            });
        }
    });
    it('adds mutation count vs diagnosis age chart', async () => {
        await waitForElementDisplayed(ADD_CHART_BUTTON, {
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await clickElement(ADD_CHART_BUTTON);

        // Change to X vs Y tab
        await waitForElementDisplayed(ADD_CHART_X_VS_Y_TAB, {
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await clickElement(ADD_CHART_X_VS_Y_TAB);

        // Add Mutation Count vs Diagnosis Age chart
        // X-axis: diagnosis age
        await waitForElementDisplayed('.xvsy-x-axis-selector');
        await clickElement('.xvsy-x-axis-selector');
        await (
            await getNestedElement([
                '.xvsy-x-axis-selector',
                'div=Diagnosis Age',
            ])
        ).waitForDisplayed();
        await (
            await getNestedElement([
                '.xvsy-x-axis-selector',
                'div=Diagnosis Age',
            ])
        ).click();

        // Y-axis: mutation count
        await waitForElementDisplayed('.xvsy-y-axis-selector');
        await clickElement('.xvsy-y-axis-selector');
        await (
            await getNestedElement([
                '.xvsy-y-axis-selector',
                'div=Mutation Count',
            ])
        ).waitForDisplayed();
        await (
            await getNestedElement([
                '.xvsy-y-axis-selector',
                'div=Mutation Count',
            ])
        ).click();

        // temporarily allow button to not be enabled
        // TODO: issue # 9226
        try {
            // submit
            await (
                await getElement('button[data-test="x-vs-y-submit-btn"]')
            ).waitForEnabled();
            await clickElement('button[data-test="x-vs-y-submit-btn"]');
        } catch (e) {
            // this should only fail because the submit button isnt enabled because the chart already still exists
        }

        await getElement(X_VS_Y_CHART, { waitForExist: true });

        const res = await checkElementWithMouseDisabled(X_VS_Y_CHART);
        assertScreenShotMatch(res);
    });
    it('turns on log scale from dropdown menu', async () => {
        await jsApiHover(X_VS_Y_CHART);
        await waitForElementDisplayed(X_VS_Y_HAMBURGER_ICON);
        await jsApiHover(X_VS_Y_HAMBURGER_ICON);
        await waitForElementDisplayed(X_VS_Y_MENU);
        await (
            await getNestedElement([X_VS_Y_MENU, 'a.logScaleCheckbox'])
        ).click();
        await (await getElement('body')).moveTo();
        const res = await checkElementWithMouseDisabled(X_VS_Y_CHART);
        assertScreenShotMatch(res);
    });
    it('swaps axis from dropdown menu', async () => {
        await jsApiHover(X_VS_Y_CHART);
        await waitForElementDisplayed(X_VS_Y_HAMBURGER_ICON);
        await jsApiHover(X_VS_Y_HAMBURGER_ICON);
        await waitForElementDisplayed(X_VS_Y_MENU);
        await (
            await getNestedElement([X_VS_Y_MENU, '[data-test="swapAxes"]'])
        ).click();
        await (await getElement('body')).moveTo();
        const res = await checkElementWithMouseDisabled(X_VS_Y_CHART);
        assertScreenShotMatch(res);
    });
    after(async () => {
        // remove mutation count vs diagnosis age chart
        await jsApiHover(X_VS_Y_CHART);
        await (
            await getNestedElement([X_VS_Y_CHART, '[data-test="deleteChart"]'])
        ).waitForDisplayed();
        await (
            await getNestedElement([X_VS_Y_CHART, '[data-test="deleteChart"]'])
        ).click();
        await browser.waitUntil(async () => {
            return !(await (await getElement(X_VS_Y_CHART)).isExisting());
        });

        // reset charts to reset layout if 'Reset charts' button exists
        await clickElement(ADD_CHART_BUTTON);
        await waitForNetworkQuiet();
        const doesResetChartsButtonExist = await (
            await getElement('button=Reset charts')
        ).isExisting();
        if (doesResetChartsButtonExist) {
            await clickElement('button=Reset charts');
            await (
                await getNestedElement(['.modal-content', 'button=Confirm'])
            ).waitForDisplayed();
            await (
                await getNestedElement(['.modal-content', 'button=Confirm'])
            ).click();
            // wait for session to save
            await browser.pause(4000);
            await waitForNetworkQuiet();
        }
    });
});

describe('study view editable breadcrumbs', () => {
    it('breadcrumbs are editable for mutation count chart', async () => {
        const url = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay#filterJson={"clinicalDataFilters":[{"attributeId":"MUTATION_COUNT","values":[{"start":15,"end":20},{"start":20,"end":25},{"start":25,"end":30},{"start":30,"end":35},{"start":35,"end":40},{"start":40,"end":45}]}],"studyIds":["lgg_ucsf_2014_test_generic_assay"],"alterationFilter":{"copyNumberAlterationEventTypes":{"AMP":true,"HOMDEL":true},"mutationEventTypes":{"any":true},"structuralVariants":null,"includeDriver":true,"includeVUS":true,"includeUnknownOncogenicity":true,"includeUnknownTier":true,"includeGermline":true,"includeSomatic":true,"includeUnknownStatus":true,"tiersBooleanMap":{}}}`;
        await goToUrlAndSetLocalStorage(url, true);
        await waitForNetworkQuiet();
        await waitForElementDisplayed('.userSelections');

        const element = await getNestedElement(['.userSelections', 'span=15']);
        // ArrowRight, ArrowRight, Backspace, Backspace, 13
        await element.setValue('\uE014\uE014\uE003\uE00313');
        await element.keys(['Enter']);

        // Wait for everything to settle
        await waitForNetworkQuiet();
        await browser.pause(1000);

        const res = await checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });
    after(async () => {
        // reset charts to reset custom bin
        await setDropdownOpen(true, ADD_CHART_BUTTON, 'button=Reset charts');
        await clickElement('button=Reset charts');
        await (
            await getNestedElement(['.modal-content', 'button=Confirm'])
        ).waitForDisplayed();
        await (
            await getNestedElement(['.modal-content', 'button=Confirm'])
        ).click();
        // wait for session to save
        await browser.pause(4000);
        await waitForNetworkQuiet();
    });
});

describe('cancer gene filter', function() {
    this.retries(0);

    it('cancer gene filter should by default be disabled', async () => {
        const url = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`;
        // set up the page without filters
        await goToUrlAndSetLocalStorage(url, true);
        await waitForElementDisplayed(
            `${MUTATIONS_GENES_TABLE} [data-test='gene-column-header']`,
            { timeout: WAIT_FOR_VISIBLE_TIMEOUT }
        );
        assert.equal(
            await (
                await getElement(
                    `${MUTATIONS_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`
                )
            ).isExisting(),
            true
        );
        assert.equal(
            (
                await getCSSProperty(
                    `${MUTATIONS_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`,
                    'color'
                )
            ).parsed.hex,
            '#bebebe'
        );
    });

    it('cancer gene filter should remove non cancer genes', async () => {
        await clickElement(
            `${MUTATIONS_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`
        );
        assert.equal(
            (
                await getCSSProperty(
                    `${MUTATIONS_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`,
                    'color'
                )
            ).parsed.hex,
            '#000000'
        );
        assertScreenShotMatch(
            await checkElementWithMouseDisabled(MUTATIONS_GENES_TABLE)
        );
    });

    it('reset charts button should revert and disable cancer gene filter', async () => {
        await waitForElementDisplayed(ADD_CHART_BUTTON, {
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });

        await browser.waitUntil(
            async () => {
                const isOpen = (await (
                    await getElement('button=Reset charts')
                ).isExisting())
                    ? await (
                          await getElement('button=Reset charts')
                      ).isDisplayedInViewport()
                    : false;
                if (isOpen) {
                    return true;
                } else {
                    await clickElement(ADD_CHART_BUTTON);
                }
            },
            {
                timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                interval: 10000,
            }
        );

        await clickElement('button=Reset charts');
        await (
            await getNestedElement(['.modal-content', 'button=Confirm'])
        ).waitForDisplayed();
        await (
            await getNestedElement(['.modal-content', 'button=Confirm'])
        ).click();
        assert.equal(
            (
                await getCSSProperty(
                    `${MUTATIONS_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`,
                    'color'
                )
            ).parsed.hex,
            '#bebebe'
        );
        assertScreenShotMatch(
            await checkElementWithMouseDisabled(MUTATIONS_GENES_TABLE)
        );
    });
});
