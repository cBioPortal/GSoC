const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    openAlterationTypeSelectionMenu,
    getNestedElement,
    clickElement,
    getElement,
    isDisplayed,
    waitForElementDisplayed,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const resultsViewComparisonTab = `${CBIOPORTAL_URL}/results/comparison?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&data_priority=0&gene_list=BRCA1%2520BRCA2&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize&comparison_subtab=alterations`;

describe('comparison alterations tab', () => {
    beforeEach(async () => {
        await loadAlterationsTab();
        await openAlterationTypeSelectionMenu();
    });

    it('shows basic counts', async () => {
        const alteredCount = await selectAlteredCount('ALK');
        assert.strictEqual(alteredCount, '2 (18.18%)');
    });

    it('shows banner when no results retrieved', async () => {
        await clickAlterationTypeCheckBox('Mutations');
        await clickAlterationTypeCheckBox('Structural Variants / Fusions');
        await clickAlterationTypeCheckBox('Copy Number Alterations');
        await clickElement('[data-test=buttonSelectAlterations]');
        await getElement('div=No data/result available', {
            waitForExist: true,
        });
        assert(await isDisplayed('div=No data/result available'));
    });

    it('filters mutation types', async () => {
        await clickAlterationTypeCheckBox('Copy Number Alterations');
        await clickAlterationTypeCheckBox('Structural Variants / Fusions');
        await submitEnrichmentRequest();
        await waitForElementDisplayed('[data-test=LazyMobXTable]');
        var rows = await $$('[data-test=LazyMobXTable] tbody tr');
        assert.strictEqual(rows.length, 8, 'table has 8 rows');
        await clickAlterationTypeCheckBox('Mutations');
        await clickAlterationTypeCheckBox('Frameshift Deletion');
        await submitEnrichmentRequest();
        await waitForElementDisplayed('[data-test=LazyMobXTable]');
        rows = await $$('[data-test=LazyMobXTable] tbody tr');
        assert.strictEqual(rows.length, 2, 'table has 2 rows');
    });

    it('filters CNA types', async () => {
        await clickAlterationTypeCheckBox('Mutations');
        await clickAlterationTypeCheckBox('Structural Variants / Fusions');

        await submitEnrichmentRequest();
        await waitForElementDisplayed('[data-test=LazyMobXTable]');
        assert.strictEqual(await selectUnalteredCount('ACAP3'), '9 (1.17%)');

        await clickAlterationTypeCheckBox('Deletion');
        await submitEnrichmentRequest();
        await waitForElementDisplayed('[data-test=LazyMobXTable]');
        assert.strictEqual(await selectUnalteredCount('ACAP3'), '7 (0.91%)');
    });
});

// The loading of the tabs in comparison view is extremely fragile.
// Multiple loading attempts are needed in some cases to show the
// enrichment panels and make the tests pass reliably.
const loadAlterationsTab = async () => {
    const timeIntervals = [3000, 4000, 5000, 5000, 10000, 30000, 100000];
    for (const timeInterval of timeIntervals) {
        await goToUrlAndSetLocalStorage(resultsViewComparisonTab, true);
        await browser.pause(timeInterval);
        if (
            await isDisplayed(
                '[data-test=GroupComparisonAlterationEnrichments]'
            )
        )
            break;
    }
};

const selectAlteredCount = async genename => {
    const row = await getNestedElement([`span=${genename}`, '..', '..', '..']);
    const alteredCount = await (
        await (await row.$$('td'))[2].$('span')
    ).getText();
    return alteredCount;
};

const selectUnalteredCount = async genename => {
    const row = await getNestedElement([`span=${genename}`, '..', '..', '..']);
    const alteredCount = await (
        await (await row.$$('td'))[3].$('span')
    ).getText();
    return alteredCount;
};

const clickAlterationTypeCheckBox = async name => {
    await (await getNestedElement(['label=' + name, 'input'])).click();
};

const submitEnrichmentRequest = async () => {
    await clickElement('[data-test=buttonSelectAlterations]');
    await getElement('[data-test=GroupComparisonAlterationEnrichments]', {
        waitForExist: true,
    });
};
