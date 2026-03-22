const assertScreenShotMatch = require('../../shared/lib/testUtils')
    .assertScreenShotMatch;
const {
    checkElementWithMouseDisabled,
    goToUrlAndSetLocalStorage,
    jsApiHover,
    getElement,
    waitForElementDisplayed,
    getNestedElement,
    setInputText,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`;
const MUTATION_COUNT_CHART = `div[data-test="chart-container-MUTATION_COUNT"]`;
const MUTATION_COUNT_HAMBURGER_ICON = `${MUTATION_COUNT_CHART} [data-test="chart-header-hamburger-icon"]`;
const MUTATION_COUNT_MENU = `${MUTATION_COUNT_CHART} [data-test="chart-header-hamburger-icon-menu"]`;
const CUSTOM_BINS_MENU = `.modal-dialog`;
const UPDATE_BUTTON = '.btn-sm';
const BIN_SIZE_INPUT = '[data-test=bin-size-input]';
const MIN_VALUE_INPUT = '[data-test=anchorvalue-input]';
const CUSTOM_BINS_TEXTAREA = '[data-test=custom-bins-textarea]';

describe('Custom Bins menu in study view chart header', function() {
    beforeEach(async () => {
        await goToUrlAndSetLocalStorage(studyViewUrl, true);
        await openCustomBinsMenu();
    });

    it('creates quartiles bins', async () => {
        await selectMenuOption('label=Quartiles');
        await clickUpdate();
        await (await getElement('body')).moveTo();
        const res = await checkElementWithMouseDisabled(MUTATION_COUNT_CHART);
        assertScreenShotMatch(res);
    });

    it('creates median split bins', async () => {
        await selectMenuOption('label=Median split');
        await clickUpdate();
        await (await getElement('body')).moveTo();
        await browser.pause(2000);
        const res = await checkElementWithMouseDisabled(MUTATION_COUNT_CHART);
        assertScreenShotMatch(res);
    });

    it('generates bins using min and bin size input fields', async () => {
        await selectMenuOption('label=Generate bins');
        await getElement(BIN_SIZE_INPUT, {
            waitForExist: true,
        });
        await setInputText(BIN_SIZE_INPUT, '2');
        await setInputText(MIN_VALUE_INPUT, '2');
        await clickUpdate();
        await (await getElement('body')).moveTo();
        const res = await checkElementWithMouseDisabled(MUTATION_COUNT_CHART);
        assertScreenShotMatch(res);
    });

    it('creates custom bins using custom bins input field', async () => {
        await selectMenuOption('label=Custom bins');
        await getElement(CUSTOM_BINS_TEXTAREA, {
            waitForExist: true,
        });
        await setInputText(CUSTOM_BINS_TEXTAREA, '0,10,20,30,40');
        await clickUpdate();
        await (await getElement('body')).moveTo();
        const res = await checkElementWithMouseDisabled(MUTATION_COUNT_CHART);
        assertScreenShotMatch(res);
    });
});

async function openCustomBinsMenu() {
    await waitForElementDisplayed(MUTATION_COUNT_CHART);
    await jsApiHover(MUTATION_COUNT_CHART);

    await waitForElementDisplayed(MUTATION_COUNT_HAMBURGER_ICON);
    await jsApiHover(MUTATION_COUNT_HAMBURGER_ICON);

    await waitForElementDisplayed(MUTATION_COUNT_MENU);
    await (
        await getNestedElement([MUTATION_COUNT_MENU, 'a.dropdown-item'])
    ).click();

    await waitForElementDisplayed(CUSTOM_BINS_MENU);
}

async function selectMenuOption(identifier) {
    await (await getNestedElement([CUSTOM_BINS_MENU, identifier])).click();
}

async function clickUpdate() {
    await (await getNestedElement([CUSTOM_BINS_MENU, UPDATE_BUTTON])).click();
}
