const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');
const {
    goToUrlAndSetLocalStorage,
    waitForNetworkQuiet,
    setInputText,
    setDropdownOpen,
    getElement,
    clickElement,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('results view comparison tab screenshot tests', function() {
    describe('general screenshot tests', function() {
        before(async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations&cancer_study_list=lgg_ucsf_2014_test_generic_assay&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced&gene_list=TOPAZ1%2520ANK1%2520ACAN%2520INTS4&geneset_list=%20&tab_index=tab_visualize&Action=Submit&comparison_subtab=alterations&comparison_selectedGroups=%5B"TOPAZ1"%2C"ANK1"%2C"ACAN"%2C"INTS4"%5D`,
                true
            );
            await getElement(
                '[data-test=GroupComparisonAlterationEnrichments]',
                {
                    timeout: 20000,
                }
            );
        });

        it('results view comparison tab alteration enrichments several groups', async function() {
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

        it('results view comparison tab alteration enrichments patient mode', async function() {
            await browser.execute(function() {
                comparisonTab.store.setUsePatientLevelEnrichments(true);
            });
            await getElement(
                '[data-test=GroupComparisonAlterationEnrichments]',
                {
                    timeout: 20000,
                }
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

        it('results view comparison tab alteration enrichments 2 genes with highest frequency in any group', async function() {
            await browser.execute(function() {
                comparisonTab.store.setUsePatientLevelEnrichments(false);
            });
            await openGeneSelectorMenu();
            await setInputText('input[data-test=numberOfGenes]', '2\n');
            await (
                await getElement('[data-test="addGenestoBarPlot"]')
            ).waitForEnabled({
                timeout: 30000,
            });
            await clickElement('[data-test="addGenestoBarPlot"]');
            await getElement('div[data-test="GeneBarPlotDiv"]', {
                timeout: 30000,
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

        it('results view comparison tab alteration enrichments gene box highest average frequency', async function() {
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
                timeout: 30000,
            });
            await clickElement('[data-test="addGenestoBarPlot"]');
            await getElement('div[data-test="GeneBarPlotDiv"]', {
                timeout: 30000,
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

        it('results view comparison tab alteration enrichments gene box most significant pValues', async function() {
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
                timeout: 30000,
            });
            await clickElement('[data-test="addGenestoBarPlot"]');
            await getElement('div[data-test="GeneBarPlotDiv"]', {
                timeout: 30000,
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

        it('results view comparison tab alteration enrichments gene box user-defined genes', async function() {
            await openGeneSelectorMenu();
            await setInputText('textarea[data-test="geneSet"]', 'TP53');
            await waitForNetworkQuiet();
            await (
                await getElement('[data-test="addGenestoBarPlot"]')
            ).waitForEnabled({
                timeout: 30000,
            });
            await clickElement('[data-test="addGenestoBarPlot"]');
            await getElement('div[data-test="GeneBarPlotDiv"]', {
                timeout: 30000,
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

        it('results view comparison tab alteration enrichments two groups', async function() {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations&cancer_study_list=lgg_ucsf_2014_test_generic_assay&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced&gene_list=TOPAZ1%2520ANK1%2520ACAN%2520INTS4&geneset_list=%20&tab_index=tab_visualize&Action=Submit&comparison_subtab=alterations&comparison_selectedGroups=%5B"ACAN"%2C"INTS4"%5D`,
                true
            );
            await getElement(
                '[data-test=GroupComparisonAlterationEnrichments]',
                {
                    timeout: 20000,
                }
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
});

async function openGeneSelectorMenu() {
    await setDropdownOpen(
        true,
        '[data-test="selectGenes"]',
        'input[data-test=numberOfGenes]'
    );
}
