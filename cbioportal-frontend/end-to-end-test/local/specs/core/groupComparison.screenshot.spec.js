const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');
const {
    openGroupComparison,
    setInputText,
    waitForNetworkQuiet,
    clickElement,
    getElement,
    waitForElementDisplayed,
    setDropdownOpen,
    selectClinicalTabPlotType,
    getElementByTestHandle,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('group comparison page screenshot tests', function() {
    describe('Alteration enrichments tab', function() {
        this.retries(0);

        before(async function() {
            await openGroupComparison(
                `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`,
                'chart-container-ONCOTREE_CODE',
                10000
            );
            await clickElement('.tabAnchor_alterations');
            await getElement(
                '[data-test="GroupComparisonAlterationEnrichments"]',
                { timeout: 20000 }
            );
        });

        it('group comparison page alteration enrichments tab several groups', async function() {
            await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page alteration enrichments tab patient mode', async function() {
            await browser.execute(function() {
                groupComparisonStore.setUsePatientLevelEnrichments(true);
            });
            await getElement(
                '[data-test="GroupComparisonAlterationEnrichments"]',
                { timeout: 20000 }
            );
            await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page alteration enrichments tab 2 genes with highest frequency in any group', async function() {
            await browser.execute(function() {
                groupComparisonStore.setUsePatientLevelEnrichments(false);
            });
            await openGeneSelectorMenu();
            await (await getElement('input[data-test=numberOfGenes]')).setValue(
                '2\n'
            );
            await (
                await getElement('[data-test="addGenestoBarPlot"]')
            ).waitForEnabled({
                timeout: 10000,
            });
            await clickElement('[data-test="addGenestoBarPlot"]');
            await waitForElementDisplayed('div[data-test="GeneBarPlotDiv"]', {
                timeout: 10000,
            });
            await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                'div[data-test="GeneBarPlotDiv"]',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page alteration enrichments tab gene box highest average frequency', async function() {
            await openGeneSelectorMenu();
            await browser.execute(function() {
                genesSelection.onGeneListOptionChange({
                    label: 'Genes with highest average frequency',
                });
            });
            await waitForNetworkQuiet();
            await (
                await getElement('[data-test="addGenestoBarPlot"]')
            ).waitForEnabled({
                timeout: 10000,
            });
            await clickElement('[data-test="addGenestoBarPlot"]');
            await waitForElementDisplayed('div[data-test="GeneBarPlotDiv"]', {
                timeout: 10000,
            });
            await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                'div[data-test="GeneBarPlotDiv"]',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page alteration enrichments tab gene box most significant pValues', async function() {
            await openGeneSelectorMenu();
            await browser.execute(function() {
                genesSelection.onGeneListOptionChange({
                    label: 'Genes with most significant p-value',
                });
            });
            await waitForNetworkQuiet();
            await (
                await getElement('[data-test="addGenestoBarPlot"]')
            ).waitForEnabled({
                timeout: 10000,
            });
            await clickElement('[data-test="addGenestoBarPlot"]');
            await (
                await getElement('div[data-test="GeneBarPlotDiv"]')
            ).waitForDisplayed({
                timeout: 10000,
            });
            await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                'div[data-test="GeneBarPlotDiv"]',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page alteration enrichments tab gene box user-defined genes', async function() {
            await openGeneSelectorMenu();
            await setInputText('textarea[data-test="geneSet"]', 'TP53');
            await waitForNetworkQuiet();
            await (
                await getElement('[data-test="addGenestoBarPlot"]')
            ).waitForEnabled({
                timeout: 10000,
            });
            await clickElement('[data-test="addGenestoBarPlot"]');
            await (
                await getElement('div[data-test="GeneBarPlotDiv"]')
            ).waitForDisplayed({
                timeout: 10000,
            });
            await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                'div[data-test="GeneBarPlotDiv"]',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison alteration enrichments two groups', async function() {
            // this test will not work on retry because groups will be toggled back on
            this.retries(0);

            await (
                await getElementByTestHandle('groupSelectorButtonGB')
            ).click();
            await (
                await getElementByTestHandle('groupSelectorButtonOAST')
            ).click();
            await (
                await getElementByTestHandle('groupSelectorButtonODG')
            ).click();

            await getElement(
                '[data-test="GroupComparisonAlterationEnrichments"]',
                { timeout: 20000 }
            );
            await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });
    });

    describe('Clinical tab', () => {
        before(async function() {
            await openGroupComparison(
                `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay`,
                'chart-container-ONCOTREE_CODE',
                10000
            );
            await clickElement('.tabAnchor_clinical');
            await getElement('[data-test="ComparisonPageClinicalTabDiv"]', {
                timeout: 20000,
            });
        });

        it('shows box plot for numerical data', async () => {
            await clickElement('[data-test="Mutation Count"]');
            const res = await checkClinicalTabPlot();
            assertScreenShotMatch(res);
        });

        it('shows table when selecting table visualisation', async () => {
            await clickElement('[data-test="Mutation Count"]');
            await selectClinicalTabNumericalDisplayType('Table');
            const res = await checkClinicalTabPlot();
            assertScreenShotMatch(res);
        });

        it('displays 100 percent stacked bar chart for categorical data', async () => {
            await clickElement('[data-test="Oncotree Code"]');
            const res = await checkClinicalTabPlot();
            assertScreenShotMatch(res);
        });

        it('displays heatmap when picked from categorical plot type dropdown', async () => {
            await clickElement('[data-test="Oncotree Code"]');
            await selectClinicalTabPlotType('Heatmap');

            const res = await checkClinicalTabPlot();
            assertScreenShotMatch(res);
        });
    });
});

async function openGeneSelectorMenu() {
    await setDropdownOpen(
        true,
        '[data-test="selectGenes"]',
        'input[data-test=numberOfGenes]'
    );
}

async function checkClinicalTabPlot() {
    return await browser.checkElement(
        'div[data-test="ClinicalTabPlotDiv"]',
        '',
        {
            hide: ['.qtip'],
        }
    );
}

async function selectClinicalTabNumericalDisplayType(type) {
    await setDropdownOpen(
        true,
        '[data-test="numericalVisualisationTypeSelector"] .Select-arrow-zone',
        '[data-test="numericalVisualisationTypeSelector"] .Select-menu',
        "Couldn't open clinical tab chart type dropdown"
    );
    await clickElement(
        `[data-test="numericalVisualisationTypeSelector"] .Select-option[aria-label="${type}"]`
    );
}
