const assert = require('assert');
const { assertScreenShotMatch } = require('../../shared/lib/testUtils');
const {
    goToUrlAndSetLocalStorage,
    waitForOncoprint,
    waitForPlotsTab,
    selectReactSelectOption,
    selectElementByText,
    clickElement,
    setInputText,
    getNestedElement,
    getElement,
} = require('../../shared/specUtils_Async');
const {
    oncoprintTabUrl,
    plotsTabUrl,
    goToTreatmentTab,
    selectTreamentsBothAxes,
} = require('./treatment.spec');

const TREATMENT_EC50_PROFILE_NAME =
    'EC50 values of compounds on cellular phenotype readout';
const GENERIC_ASSAY_ENTITY_SELECTOR =
    '[data-test="GenericAssayEntitySelection"]';
const GENERIC_ASSAY_PROFILE_SELECTOR =
    '[data-test="GenericAssayProfileSelection"]';

describe('treatment feature', () => {
    describe('oncoprint tab', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(oncoprintTabUrl, true);
            await waitForOncoprint();
        });

        it('shows treatment profile heatmap track for treatment', async () => {
            await goToTreatmentTab();
            // change profile to EC50
            await clickElement(GENERIC_ASSAY_PROFILE_SELECTOR);
            await selectElementByText(TREATMENT_EC50_PROFILE_NAME, {
                waitForExist: true,
            });
            await (
                await selectElementByText(TREATMENT_EC50_PROFILE_NAME)
            ).click();
            await clickElement(GENERIC_ASSAY_ENTITY_SELECTOR);
            await setInputText(
                '[data-test="GenericAssayEntitySelection"] input',
                '17-AAG'
            );
            const options = await (
                await getElement(GENERIC_ASSAY_ENTITY_SELECTOR)
            ).$$('div[class$="option"]');
            await options[0].click();
            const indicators = await (
                await getElement(GENERIC_ASSAY_ENTITY_SELECTOR)
            ).$$('div[class$="indicatorContainer"]');
            // close the dropdown
            await indicators[0].click();
            const selectedOptions = await (
                await getElement(GENERIC_ASSAY_ENTITY_SELECTOR)
            ).$$('div[class$="multiValue"]');

            assert.equal(selectedOptions.length, 1);

            await clickElement('button=Add Track');
            // close add tracks menu
            await clickElement('button[id=addTracksDropdown]');
            await waitForOncoprint();
            const res = await browser.checkElement('[id=oncoprintDiv]');
            assertScreenShotMatch(res);
        });
    });

    describe('plots tab', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(plotsTabUrl, true);
            await waitForPlotsTab();
            await selectTreamentsBothAxes();
        });

        it('shows `value larger_than_8.00` in figure legend and indicates sub-threshold data points in plot', async () => {
            const res = await browser.checkElement('[id=plots-tab-plot-svg]');

            await browser.execute(() => {
                $('div').css({ border: '1px solid red !important' });
            });

            assertScreenShotMatch(res);
        });

        it.skip('when option deselected, hides `value larger_than_8.00` in figure legend and sub-threshold data points in plot', async () => {
            await getElement('[data-test=ViewLimitValues]', { timeout: 10000 });
            await clickElement('[data-test=ViewLimitValues]');

            const res = await browser.checkElement('[id=plots-tab-plot-svg]');

            await browser.debug();
            assertScreenShotMatch(res);
        });

        it('shows waterfall plot when `Ordered samples` option is selected', async () => {
            const horzDataSelect = await getNestedElement([
                '[name=h-profile-type-selector]',
                '..',
            ]);
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');

            // make sure bars become visible (no mut data is available)
            await getElement('[data-test=ViewCopyNumber]', { timeout: 10000 });
            await clickElement('[data-test=ViewCopyNumber]');

            const res = await browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('when option deselected, hides `value larger_than_8.00` in figure legend and sub-threshold data point indicators in waterfall plot', async () => {
            const horzDataSelect = await getNestedElement([
                '[name=h-profile-type-selector]',
                '..',
            ]);
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');

            // make sure bars become visible (no mut data is available)
            await getElement('[data-test=ViewCopyNumber]', {
                waitForExist: true,
            });
            await clickElement('[data-test=ViewCopyNumber]');

            await clickElement('[data-test=ViewLimitValues]');

            const res = await browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('rotates waterfall plot when swapping axes', async () => {
            const horzDataSelect = await getNestedElement([
                '[name=h-profile-type-selector]',
                '..',
            ]);
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');

            // make sure bars become visible (no mut data is available)
            await getElement('[data-test=ViewCopyNumber]', {
                waitForExist: true,
            });
            await clickElement('[data-test=ViewCopyNumber]');

            await clickElement('[data-test=swapHorzVertButton]');

            const res = await browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('updates title of watefall plot when selecting a new gene', async () => {
            const horzDataSelect = await getNestedElement([
                '[name=h-profile-type-selector]',
                '..',
            ]);
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');

            // make sure bars become visible (no mut data is available)
            await getElement('[data-test=ViewCopyNumber]', {
                waitForExist: true,
            });
            await clickElement('[data-test=ViewCopyNumber]');

            await clickElement('.gene-select');

            // select gene menu entries
            const geneMenuEntries = await (
                await (
                    await getNestedElement([
                        '[data-test=GeneColoringMenu]',
                        'div=Genes',
                        '..',
                    ])
                ).$$('div')
            )[1].$$('div');

            await geneMenuEntries[3].click();

            const res = await browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('applies log-scale in waterfall plot', async () => {
            const horzDataSelect = await getNestedElement([
                '[name=h-profile-type-selector]',
                '..',
            ]);
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');

            // make sure bars become visible (no mut data is available)
            await getElement('[data-test=ViewCopyNumber]', {
                waitForExist: true,
            });
            await clickElement('[data-test=ViewCopyNumber]');

            await clickElement('[data-test=VerticalLogCheckbox]');

            const res = await browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('reverses order of waterfall plot data when `Sort order` button pressed', async () => {
            const horzDataSelect = await getNestedElement([
                '[name=h-profile-type-selector]',
                '..',
            ]);
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');

            // make sure bars become visible (no mut data is available)
            await getElement('[data-test=ViewCopyNumber]', {
                waitForExist: true,
            });
            await clickElement('[data-test=ViewCopyNumber]');

            await clickElement('[data-test=changeSortOrderButton]');

            const res = await browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('shows a search indicator when sample search term is entered', async () => {
            const horzDataSelect = await getNestedElement([
                '[name=h-profile-type-selector]',
                '..',
            ]);
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');

            // make sure bars become visible (no mut data is available)
            await getElement('[data-test=ViewCopyNumber]', {
                waitForExist: true,
            });
            await clickElement('[data-test=ViewCopyNumber]');

            const sampleSearch = await getNestedElement([
                'label=Search Case(s)',
                '..',
                'input',
            ]);
            await sampleSearch.setValue('TCGA-A2-A04U-01 TCGA-A1-A0SE-01');

            const res = await browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });
    });
});
