const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');
const assert = require('assert');
const {
    waitForOncoprint,
    getNthOncoprintTrackOptionsElements,
    goToUrlAndSetLocalStorage,
    getTextInOncoprintLegend,
    checkOncoprintElement,
    getElementByTestHandle,
    getElement,
    clickElement,
    getNthElements,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('oncoprint colors', () => {
    describe('clinical tracks color configuration', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=gbm_tcga&case_set_id=gbm_tcga_all&data_priority=0&gene_list=EGFR%250APTEN%250AIDH1%250ATP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=gbm_tcga_mrna_median_all_sample_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_mutations&hide_unprofiled_samples=false&profileFilter=0&tab_index=tab_visualize&show_samples=false`
            );
            await waitForOncoprint();
        });

        it('color configuration modal reflects user selected colors', async () => {
            // add "Mutation spectrum" track
            await clickElement('#addTracksDropdown');
            await (
                await getElementByTestHandle(
                    'add-chart-option-mutation-spectrum'
                )
            ).waitForDisplayed();
            const chartOptionMutationSpectrumLabel = await (
                await getElementByTestHandle(
                    'add-chart-option-mutation-spectrum'
                )
            ).$('label');
            await chartOptionMutationSpectrumLabel.click();
            const updateTracksElement = await getElementByTestHandle(
                'update-tracks'
            );
            await updateTracksElement.waitForDisplayed();
            await updateTracksElement.click();
            await waitForOncoprint();

            // check that mutation spectrum is added to the oncoprint
            let legendText = await getTextInOncoprintLegend();
            const trackOptionsElts = await getNthOncoprintTrackOptionsElements(
                5
            );
            await (await getElement(trackOptionsElts.button_selector)).moveTo();
            // open menu
            await clickElement(trackOptionsElts.button_selector);
            await (
                await getElement(trackOptionsElts.dropdown_selector)
            ).waitForDisplayed({
                timeout: 1000,
            });
            // click "Edit Colors" to open modal
            await clickElement(
                trackOptionsElts.dropdown_selector + ' li:nth-child(8)'
            );
            await browser.pause(1000);

            // select new colors for track values
            const colorPickerIcon = '[data-test="color-picker-icon"]';
            await clickElement(colorPickerIcon);
            await (await getElement('.circle-picker')).waitForDisplayed({
                timeout: 1000,
            });
            await clickElement('.circle-picker [title="#990099"]');
            await waitForOncoprint();
            await (await getElement(colorPickerIcon)).waitForDisplayed();
            await clickElement(colorPickerIcon);
            await (await getElement('.circle-picker')).waitForDisplayed({
                reverse: true,
            });

            await (
                await getNthElements('[data-test="color-picker-icon"]', 1)
            ).click();
            await (await getElement('.circle-picker')).waitForDisplayed({
                timeout: 1000,
            });
            await clickElement('.circle-picker [title="#109618"]');
            await waitForOncoprint();
            await (
                await getElementByTestHandle('color-picker-icon')
            ).waitForDisplayed();
            await (
                await getNthElements('[data-test="color-picker-icon"]', 1)
            ).click();
            await (await getElement('.circle-picker')).waitForDisplayed({
                reverse: true,
            });

            await (
                await getNthElements('[data-test="color-picker-icon"]', 2)
            ).click();
            await (await getElement('.circle-picker')).waitForDisplayed({
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
                    await getNthElements(
                        '[data-test="color-picker-icon"] rect',
                        1
                    )
                ).getAttribute('fill'),
                '#109618'
            );
            assert.strictEqual(
                await (
                    await getNthElements(
                        '[data-test="color-picker-icon"] rect',
                        2
                    )
                ).getAttribute('fill'),
                '#8b0707'
            );
        });

        it('oncoprint reflects user selected colors', async () => {
            // close modal
            await clickElement('.modal button.close');
            const res = await checkOncoprintElement();
            assertScreenShotMatch(res);
        });

        it('reset colors button is visible when default colors not used', async () => {
            // click "Edit Colors" to open modal and check "Reset Colors" button in modal
            const trackOptionsElts = await getNthOncoprintTrackOptionsElements(
                5
            );
            await (await getElement(trackOptionsElts.button_selector)).moveTo();
            await clickElement(trackOptionsElts.button_selector);
            await (
                await getElement(trackOptionsElts.dropdown_selector)
            ).waitForDisplayed({
                timeout: 1000,
            });
            await clickElement(
                trackOptionsElts.dropdown_selector + ' li:nth-child(8)'
            );
            await (
                await getElementByTestHandle('resetColors', {
                    timeout: 10000,
                })
            ).waitForDisplayed();
        });

        it('color configuration modal reflects default colors', async () => {
            // click "Reset Colors" track
            await (
                await getElementByTestHandle('resetColors', {
                    timeout: 10000,
                })
            ).click();
            await waitForOncoprint();

            assert.strictEqual(
                await (
                    await getElement('[data-test="color-picker-icon"] rect')
                ).getAttribute('fill'),
                '#3d6eb1'
            );
            assert.strictEqual(
                await (
                    await getNthElements(
                        '[data-test="color-picker-icon"] rect',
                        1
                    )
                ).getAttribute('fill'),
                '#8ebfdc'
            );
            assert.strictEqual(
                await (
                    await getNthElements(
                        '[data-test="color-picker-icon"] rect',
                        2
                    )
                ).getAttribute('fill'),
                '#dff1f8'
            );
        });

        it('oncoprint reflects default colors', async () => {
            // close modal
            await clickElement('.modal button.close');
            const res = await checkOncoprintElement();
            assertScreenShotMatch(res);
        });

        it('reset colors button is hidden when default colors are used', async () => {
            // click "Edit Colors" to open modal and check "Reset Colors" button in modal
            const trackOptionsElts = await getNthOncoprintTrackOptionsElements(
                5
            );
            await (await getElement(trackOptionsElts.button_selector)).moveTo();
            await clickElement(trackOptionsElts.button_selector);
            await (
                await getElement(trackOptionsElts.dropdown_selector)
            ).waitForDisplayed({
                timeout: 1000,
            });
            await clickElement(
                trackOptionsElts.dropdown_selector + ' li:nth-child(8)'
            );
            await (
                await getElementByTestHandle('resetColors')
            ).waitForDisplayed({
                reverse: true,
            });
        });
    });

    describe('enable white background for glyphs', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=gbm_tcga&case_set_id=gbm_tcga_all&data_priority=0&gene_list=EGFR%250APTEN%250AIDH1%250ATP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=gbm_tcga_mrna_median_all_sample_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_mutations&hide_unprofiled_samples=false&profileFilter=0&tab_index=tab_visualize&show_samples=false`
            );
            await waitForOncoprint();
        });
        it('oncoprint uses white background for glyphs when option toggled', async () => {
            // toggle on white backgrounds for glyphs
            const $viewDropdown = await getElement('#viewDropdownButton');
            await $viewDropdown.click();
            await waitForOncoprint();
            await (
                await getElementByTestHandle('toggleWhiteBackgroundForGlyphs')
            ).click();
            await $viewDropdown.click();

            const res = await checkOncoprintElement();
            assertScreenShotMatch(res);
        });

        it('oncoprint uses default background for glyphs when option not toggled', async () => {
            // toggle off white backgrounds for glyphs
            const $viewDropdown = await getElement('#viewDropdownButton');
            await $viewDropdown.click();
            await waitForOncoprint();
            await (
                await getElementByTestHandle('toggleWhiteBackgroundForGlyphs')
            ).click();
            await $viewDropdown.click();

            const res = await checkOncoprintElement();
            assertScreenShotMatch(res);
        });
    });
});
