const assert = require('assert');
const {
    waitForOncoprint,
    setOncoprintMutationsMenuOpen,
    goToUrlAndSetLocalStorage,
    getElement,
    isSelected,
    clickElement,
} = require('../../../shared/specUtils_Async');

const TIMEOUT = 6000;
const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('oncoprinter tests', () => {
    describe('custom driver annotation', () => {
        const doTestWithCustomDriver = async () => {
            await (
                await getElement('.oncoprinterGeneticExampleData')
            ).waitForExist();
            await clickElement('.oncoprinterGeneticExampleData');
            await clickElement('.oncoprinterSubmit');
            await waitForOncoprint(TIMEOUT);

            await setOncoprintMutationsMenuOpen(true);
            assert(!(await isSelected('input[data-test="annotateOncoKb"]')));
            assert(await isSelected('input[data-test="annotateCustomBinary"]'));
        };

        const doTestWithoutCustomDriver = async () => {
            await (
                await getElement('.oncoprinterGeneticExampleData')
            ).waitForExist();
            await browser.execute(text => {
                oncoprinterTool.onGeneticDataInputChange({
                    currentTarget: {
                        value: text,
                    },
                });
            }, 'TCGA-25-2392-01 TP53 FUSION FUSION\nTCGA-04-1357-01 BRCA1 Q1538A MISSENSE');
            await clickElement('.oncoprinterSubmit');
            await waitForOncoprint(TIMEOUT);

            await setOncoprintMutationsMenuOpen(true);
            assert(await isSelected('input[data-test="annotateOncoKb"]'));
            assert(
                !(await (
                    await getElement('input[data-test="annotateCustomBinary"]')
                ).isExisting())
            );
        };

        it('only custom driver annotation is selected when input data includes a custom driver', async () => {
            await goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
            await doTestWithCustomDriver();
        });
        it('oncokb is selected, and custom driver button hidden, when input data does not include a custom driver', async () => {
            await goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
            await doTestWithoutCustomDriver();
        });
        it('mutation annotation settings reset whenever oncoprint is submitted', async () => {
            await goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}/oncoprinter`);
            await doTestWithCustomDriver();
            await clickElement('.oncoprinterModifyInput');
            await doTestWithoutCustomDriver();
        });
    });
});
