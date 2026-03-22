const assert = require('assert');
const {
    clickElement,
    getElement,
    goToUrlAndSetLocalStorage,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('Quick Search', () => {
    before(async () => {
        await goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`);
    });

    beforeEach(async () => {
        const url = `${CBIOPORTAL_URL}`;
        await goToUrlAndSetLocalStorage(url);
        await clickElement('a.tabAnchor_quickSearch');
        await (
            await getElement('div=e.g. Lung, EGFR, TCGA-OR-A5J2')
        ).waitForExist();
        await clickElement('div=e.g. Lung, EGFR, TCGA-OR-A5J2');
        // "BRAF" is nice because it matches studies, genes, patients, and samples
        await (await getElement('input')).setValue('Ad');
        await (
            await getElement('div=Click on a study to open its summary')
        ).waitForExist();
        await (
            await getElement('div=Click on a patient to see a summary')
        ).waitForExist();
        await (
            await getElement('div=Click on a sample to open its summary')
        ).waitForExist();
    });

    it('should give results for studies', async () => {
        //await browser.debug();

        const SELECTOR =
            'Adenoid Cystic Carcinoma (FMI, Am J Surg Pathl. 2014)';

        await clickElement(`strong=${SELECTOR}`);
        await (await getElement(`h3=${SELECTOR}`)).waitForExist();

        assert.equal(
            await (await getElement(`h3=${SELECTOR}`)).isDisplayed(),
            true,
            'title is visible'
        );
    });

    it('should give results for genes', async () => {
        await (await getElement('strong=ADAD1')).waitForExist();

        await clickElement('strong=ADAD1');

        await (await getElement('a=ADAD1')).waitForExist({ timeout: 60000 });

        assert.equal(
            await (await getElement('a=ADAD1')).isDisplayed(),
            true,
            'we navigated successfully to gene query'
        );
    });

    it('should give results for patients', async () => {
        await clickElement('strong=AdCC11T');
        await (await getElement('a=AdCC11T')).waitForExist();

        assert.equal(
            await (await getElement('a=AdCC11T')).isDisplayed(),
            true,
            'navigated to patient'
        );
    });

    it('should give results for samples', async () => {
        await clickElement('strong=AdCC11T');
        await (await getElement('a=AdCC11T')).waitForExist();

        assert.equal(
            await (await getElement('a=AdCC11T')).isDisplayed(),
            true,
            'navigated to patient'
        );
    });
});
