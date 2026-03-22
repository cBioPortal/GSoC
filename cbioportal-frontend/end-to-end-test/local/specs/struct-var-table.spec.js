const assert = require('assert');
const {
    goToUrlAndSetLocalStorageWithProperty,
    waitForStudyView,
    getNestedElement,
    getElement,
    clickElement,
    getNthElements,
    waitForElementDisplayed,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=study_es_0`;
const structVarTable = '//*[@data-test="structural variant pairs-table"]';
const filterCheckBox = '[data-test=labeledCheckbox]';
const structVarFilterPillTag = '[data-test=pill-tag]';
const uncheckedSvIcon = '[data-test=structVarQueryCheckboxUnchecked]';
const checkedSvIcon = '[data-test=structVarQueryCheckboxChecked]';
const structVarNameCell = '[data-test=structVarNameCell]';
const toast = '.Toastify div[role=alert]';

describe('study view structural variant table', function() {
    beforeEach(async () => {
        await goToUrlAndSetLocalStorageWithProperty(studyViewUrl, true, {
            skin_study_view_show_sv_table: true,
        });
        await waitForStudyView();
        await showSvPane();
    });

    it('adds structural variant to study view filter', async () => {
        await (
            await getNestedElement([structVarTable, filterCheckBox])
        ).click();
        await getElement('[data-test=selectSamplesButton]', {
            waitForExist: true,
        });
        await clickElement('[data-test=selectSamplesButton]');
        assert(await (await getElement(structVarFilterPillTag)).isExisting());
    });

    it.skip('shows all checkboxes when row is hovered', async () => {
        await getElement(structVarNameCell, {
            waitForExist: true,
        });
        const firstSvRowCell = await getNthElements(structVarNameCell, 0);
        assert.equal(
            await (await getNthElements(structVarNameCell, 1)).getText(),
            'SND1'
        );
        assert.equal(
            await (await getNthElements(structVarNameCell, 2)).getText(),
            'BRAF'
        );

        await movePointerWithRetry(
            firstSvRowCell,
            async () => await waitForElementDisplayed(uncheckedSvIcon)
        );
        assert.equal((await $$(uncheckedSvIcon)).length, 3);
    });

    it.skip('shows only checked checkboxes when row is not hovered', async () => {
        await getElement(structVarNameCell, {
            waitForExist: true,
        });
        const gene1Cell = await getNthElements(structVarNameCell, 1);
        await movePointerWithRetry(
            gene1Cell,
            async () => await waitForElementDisplayed(uncheckedSvIcon)
        );
        assert.equal((await $$(uncheckedSvIcon)).length, 3);

        await gene1Cell.waitForClickable();
        await gene1Cell.click();

        // hover somewhere else:
        await movePointerWithRetry(
            await getElement('span=Gene 2'),
            await getElement(checkedSvIcon, {
                waitForExist: true,
            })
        );

        assert.equal((await $$(uncheckedSvIcon)).length, 0);
        assert.equal((await $$(checkedSvIcon)).length, 1);
    });

    it.skip('adds gene1::gene2 to Results View query', async () => {
        await getElement(structVarNameCell, {
            waitForExist: true,
        });
        const firstSvRowCell = await getNthElements(structVarNameCell, 0);

        await movePointerWithRetry(firstSvRowCell, async () => {
            await (await getNthElements(uncheckedSvIcon, 0)).waitForClickable();
        });
        const gene1And2Checkbox = await getNthElements(uncheckedSvIcon, 0);
        await gene1And2Checkbox.click();
        await waitForElementDisplayed(toast);
        await clearToast();

        const resultsViewQueryBox = await openResultViewQueryBox();
        assert.equal(
            'SND1: FUSION::BRAF;',
            await resultsViewQueryBox.getValue()
        );
    });

    it.skip('adds gene1::* to Results View query', async () => {
        await getElement(structVarNameCell, {
            waitForExist: true,
        });
        const gene1Cell = await getNthElements(structVarNameCell, 1);
        await movePointerWithRetry(
            gene1Cell,
            async () => await waitForElementDisplayed(uncheckedSvIcon)
        );
        await gene1Cell.waitForClickable();
        await gene1Cell.click();
        await waitForElementDisplayed(toast);
        await clearToast();

        const resultsViewQueryBox = await openResultViewQueryBox();
        assert.equal('SND1: FUSION::;', await resultsViewQueryBox.getValue());
    });

    it.skip('adds *::gene2 to Results View query', async () => {
        await getElement(structVarNameCell, {
            waitForExist: true,
        });
        const gene2Cell = await getNthElements(structVarNameCell, 2);
        await movePointerWithRetry(
            gene2Cell,
            async () => await waitForElementDisplayed(uncheckedSvIcon)
        );
        await gene2Cell.waitForClickable();
        await gene2Cell.click();
        await waitForElementDisplayed(toast);
        await clearToast();

        const resultsViewQueryBox = await openResultViewQueryBox();
        assert.equal('BRAF: ::FUSION;', await resultsViewQueryBox.getValue());
    });
});

async function showSvPane() {
    const $chartsBtn = await getElement('[data-test=add-charts-button]');
    await $chartsBtn.waitForExist();
    await $chartsBtn.waitForClickable();
    await $chartsBtn.click();
    const $chartsGenomicTab = await getElement('.tabAnchor_Genomic');
    await $chartsGenomicTab.waitForExist();
    await $chartsGenomicTab.waitForClickable();
    await $chartsGenomicTab.click();
    const $svChartCheckbox = await getNestedElement([
        '[data-test="add-chart-option-structural-variants"]',
        '[data-test="labeledCheckbox"]',
    ]);
    await $svChartCheckbox.waitForExist();
    await $svChartCheckbox.waitForClickable();
    if (!(await $svChartCheckbox.isSelected())) {
        await $svChartCheckbox.click();
    }
    await $chartsBtn.click();
    await waitForStudyView();
}

async function openResultViewQueryBox() {
    const resultsViewQueryBox = await getElement('[data-test=geneSet]');
    await resultsViewQueryBox.waitForClickable();
    await resultsViewQueryBox.click();
    return resultsViewQueryBox;
}

async function clearToast() {
    const toastify = await getElement('.Toastify button');
    await toastify.waitForClickable();
    await toastify.click();
    await browser.pause(100);
}

async function movePointerTo(element) {
    await element.waitForDisplayed();
    await element.scrollIntoView();
    const x = await element.getLocation('x');
    const y = await element.getLocation('y');
    await browser.performActions([
        {
            type: 'pointer',
            parameters: { pointerType: 'mouse' },
            actions: [
                { type: 'pointerMove', duration: 0, x, y },
                { type: 'pointerMove', duration: 0, x, y },
            ],
        },
    ]);
}

/**
 * When scrolling to the new location, some tooltips might pop up and interfere.
 * A retry solves this problem: the second time the pointer is already near/at the desired location
 */
async function movePointerWithRetry(element, isOk) {
    await movePointerTo(element);
    try {
        if (await isOk()) {
            return;
        }
    } catch (e) {
        // retry
        await movePointerTo(element);
    }
}
