const {
    goToUrlAndSetLocalStorage,
    waitForStudyQueryPage,
    waitForOncoprint,
    waitForPlotsTab,
    waitForCoExpressionTab,
    selectReactSelectOption,
    showGsva,
    getNthOncoprintTrackOptionsElements,
    setDropdownOpen,
    checkOncoprintElement,
    clickElement,
    getElement,
    waitForElementDisplayed,
} = require('../../shared/specUtils_Async.js');
const { assertScreenShotMatch } = require('../../shared/lib/testUtils');
const {
    checkTestStudy,
    coexpressionTabUrl,
    queryPageUrl,
    plotsTabUrl,
    oncoprintTabUrl,
    checkGSVAprofile,
} = require('./gsva.spec');

describe('gsva feature', () => {
    describe('GenesetVolcanoPlotSelector', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(queryPageUrl, true);
            await showGsva();
            await waitForStudyQueryPage(20000);
            await checkTestStudy();
            await checkGSVAprofile();
            await clickElement('button[data-test=GENESET_VOLCANO_BUTTON]');
            await (await getElement('div.modal-dialog')).waitForExist();
        });

        it('shows volcano plot for gene sets selection', async () => {
            const res = await browser.checkElement('div.VictoryContainer');
            assertScreenShotMatch(res);
        });

        it('updates volcano plot after change of `percentile of score calculation`', async () => {
            const modal = await getElement('div.modal-body');
            await (await modal.$('.Select-value-label')).waitForExist();
            await (await modal.$('.Select-value-label')).click();
            await (await modal.$('.Select-option=50%')).waitForExist();
            await (await modal.$('.Select-option=50%')).click();
            const res = await browser.checkElement('div.VictoryContainer');
            assertScreenShotMatch(res);
        });
    });

    describe('oncoprint tab', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(oncoprintTabUrl, true);
            await waitForOncoprint();
        });

        it('shows GSVA heatmap track', async () => {
            const res = await browser.checkElement('div[id=oncoprintDiv]');
            assertScreenShotMatch(res);
        });

        it('expands and shows correlation genes for GO_ATP_DEPENDENT_CHROMATIN_REMODELING', async () => {
            const trackOptionsElts = await getNthOncoprintTrackOptionsElements(
                12
            );
            // open menu
            await setDropdownOpen(
                true,
                trackOptionsElts.button_selector,
                trackOptionsElts.dropdown_selector
            );
            // click Show genes
            await waitForElementDisplayed(
                trackOptionsElts.dropdown_selector + ' li:nth-child(7)'
            );
            await clickElement(
                trackOptionsElts.dropdown_selector + ' li:nth-child(7)'
            );

            await waitForOncoprint();
            const res = await checkOncoprintElement('.oncoprintContainer');
            assertScreenShotMatch(res);
        });
    });

    describe('plots tab', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(plotsTabUrl, true);
            await waitForPlotsTab(20000);
        });

        it('shows gsva profile data on horizontal and vertical axes', async () => {
            const horzDataSelect = await (
                await getElement('[name=h-profile-type-selector]')
            ).$('..');
            await (await horzDataSelect.$('.Select-arrow-zone')).click();
            await (await horzDataSelect.$('.Select-option=Gene Sets')).click();

            const vertDataSelect = await (
                await getElement('[name=v-profile-type-selector]')
            ).$('..');
            await (await vertDataSelect.$('.Select-arrow-zone')).click();
            await (await vertDataSelect.$('.Select-option=Gene Sets')).click();
            const res = await browser.checkElement(
                'div[data-test="PlotsTabPlotDiv"]'
            );
            assertScreenShotMatch(res);
        });
    });

    describe('co-expression tab', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(coexpressionTabUrl, true);
            await waitForCoExpressionTab(20000);
        });

        it('shows GSVA scores in scatterplot', async () => {
            await selectReactSelectOption(
                await getElement('.coexpression-select-query-profile'),
                'GSVA scores on oncogenic signatures gene sets (5 samples)'
            );
            await (await getElement('#coexpressionTabGeneTabs')).waitForExist();
            const res = await browser.checkElement('#coexpression-plot-svg');
            assertScreenShotMatch(res);
        });
    });
});
