const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');
const assert = require('assert');
const {
    waitForOncoprint,
    checkOncoprintElement,
    getElementByTestHandle,
    goToUrlAndSetLocalStorage,
    getNthOncoprintTrackOptionsElements,
    getElement,
    clickElement,
    getNthElements,
    waitForElementDisplayed,
} = require('../../../shared/specUtils_Async.js');

const TIMEOUT = 6000;

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('oncoprinter clinical example data, color configuration', () => {
    it('oncoprinter color configuration modal reflects user selected colors', async () => {
        await goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
        await (
            await getElement('.oncoprinterClinicalExampleData')
        ).waitForExist();
        await clickElement('.oncoprinterClinicalExampleData');
        await clickElement('.oncoprinterSubmit');
        await waitForOncoprint(TIMEOUT);

        const trackOptionsElts = await getNthOncoprintTrackOptionsElements(2);
        // open menu
        await (await getElement(trackOptionsElts.button_selector)).click();
        await waitForElementDisplayed(trackOptionsElts.dropdown_selector);
        // click "Edit Colors" to open modal
        await clickElement(
            trackOptionsElts.dropdown_selector + ' li:nth-child(11)'
        );
        await browser.pause(1000);

        // select new colors for track values
        await (await getElementByTestHandle('color-picker-icon')).click();
        await waitForElementDisplayed('.circle-picker');
        await clickElement('.circle-picker [title="#990099"]');
        await waitForOncoprint();
        await (
            await getElementByTestHandle('color-picker-icon')
        ).waitForDisplayed();
        await (await getElementByTestHandle('color-picker-icon')).click();
        await waitForElementDisplayed('.circle-picker', {
            reverse: true,
        });

        await (
            await getNthElements('[data-test="color-picker-icon"]', 1)
        ).click();
        await waitForElementDisplayed('.circle-picker');
        await clickElement('.circle-picker [title="#109618"]');
        await waitForOncoprint();
        await (
            await getElementByTestHandle('color-picker-icon')
        ).waitForDisplayed();
        await (
            await getNthElements('[data-test="color-picker-icon"]', 1)
        ).click();
        await waitForElementDisplayed('.circle-picker', {
            reverse: true,
        });

        await (
            await getNthElements('[data-test="color-picker-icon"]', 2)
        ).click();
        await waitForElementDisplayed('.circle-picker', {
            timeout: 1000,
        });
        await clickElement('.circle-picker [title="#8b0707"]');
        await waitForOncoprint();

        assert.strictEqual(
            await (
                await getElement('[data-test="color-picker-icon"] rect')
            ).getAttribute('fill'),
            '#990099'
        );
        assert.strictEqual(
            await (
                await getNthElements('[data-test="color-picker-icon"] rect', 1)
            ).getAttribute('fill'),
            '#109618'
        );
        assert.strictEqual(
            await (
                await getNthElements('[data-test="color-picker-icon"] rect', 2)
            ).getAttribute('fill'),
            '#8b0707'
        );

        // close modal
        await clickElement('.modal-dialog .close');
    });

    it('oncoprinter reflects user selected colors', async () => {
        await clickElement('a.tabAnchor_oncoprint');
        const res = await checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprinter reset colors button is visible when default colors not used', async () => {
        // click "Edit Colors" to open modal and check "Reset Colors" button in modal
        const trackOptionsElts = await getNthOncoprintTrackOptionsElements(2);

        await clickElement(trackOptionsElts.button_selector, { moveTo: true });

        await waitForElementDisplayed(trackOptionsElts.dropdown_selector, {
            timeout: 1000,
        });
        await clickElement(
            trackOptionsElts.dropdown_selector + ' li:nth-child(11)'
        );
        await waitForElementDisplayed('[data-test="resetColors"]');
    });

    it('oncoprinter color configuration modal reflects default colors', async () => {
        // click "Reset Colors" track
        await clickElement('[data-test="resetColors"]', { moveTo: true });
        await waitForOncoprint();

        assert.strictEqual(
            await (
                await getElement('[data-test="color-picker-icon"] rect')
            ).getAttribute('fill'),
            '#dc3912'
        );
        assert.strictEqual(
            await (
                await getNthElements('[data-test="color-picker-icon"] rect', 1)
            ).getAttribute('fill'),
            '#3366cc'
        );
        assert.strictEqual(
            await (
                await getNthElements('[data-test="color-picker-icon"] rect', 2)
            ).getAttribute('fill'),
            '#ff9900'
        );
    });

    it('oncoprinter reflects default colors', async () => {
        // close modal
        await clickElement('.modal button.close', { moveTo: true });
        const res = await checkOncoprintElement();
        assertScreenShotMatch(res);
    });

    it('oncoprinter reset colors button is hidden when default colors are used', async () => {
        // click "Edit Colors" to open modal and check "Reset Colors" button in modal
        const trackOptionsElts = await getNthOncoprintTrackOptionsElements(2);
        await clickElement(trackOptionsElts.button_selector, { moveTo: true });
        await waitForElementDisplayed(trackOptionsElts.dropdown_selector, {
            timeout: 1000,
        });
        await clickElement(
            trackOptionsElts.dropdown_selector + ' li:nth-child(11)'
        );
        await (await getElementByTestHandle('resetColors')).waitForDisplayed({
            reverse: true,
        });
    });
});
