const assert = require('assert');
const {
    goToUrlAndSetLocalStorageWithProperty,
    clickElement,
    setInputText,
    getNestedElement,
    getElement,
    isDisplayed,
    waitForElementDisplayed,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const resultsViewUrl = `${CBIOPORTAL_URL}/results/mutations?cancer_study_list=study_es_0&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cfusion%2Cgistic&case_set_id=study_es_0_all&gene_list=BRCA1&geneset_list=%20&tab_index=tab_visualize&Action=Submit`;
const patientViewUrl = `${CBIOPORTAL_URL}/patient?sampleId=TEST_SAMPLE_SOMATIC_HOMOZYGOUS&studyId=study_es_0`;

describe('namespace columns in mutation tables', function() {
    describe('results view', () => {
        it('hides namespace columns when no property set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(
                resultsViewUrl,
                true,
                {}
            );
            await waitForMutationTable();
            assert(await namespaceColumnsAreNotDisplayed());
        });
        it('shows columns when column menu is used', async () => {
            // Click on column button.
            await clickElement('button*=Columns');
            // Filter menu options.
            await setInputText(
                '[data-test=fixed-header-table-search-input]',
                'zygosity'
            );
            await (
                await getNestedElement([
                    '[data-test=add-by-type]',
                    'div*=Zygosity',
                ])
            ).waitForDisplayed();
            // Click namespace column checkboxes.
            const checkboxes = await (
                await getElement('[data-test=add-by-type]')
            ).$$('div*=Zygosity');
            for (const checkbox of checkboxes) {
                await checkbox.waitForDisplayed();
                await checkbox.click();
            }
            await clickElement('button*=Columns');
            assert(await namespaceColumnsAreDisplayed());
        });
        it('shows namespace columns when property set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(resultsViewUrl, true, {
                skin_mutation_table_namespace_column_show_by_default: true,
            });
            await waitForMutationTable();
            assert(await namespaceColumnsAreDisplayed());
        });
        it('has filter icons', async () => {
            await clickElement("//span[text() = 'Zygosity Code']");
            await (
                await filterIconOfHeader("//span[text() = 'Zygosity Code']")
            ).waitForDisplayed();
            await clickElement("//span[text() = 'Zygosity Name']");
            await (
                await filterIconOfHeader("//span[text() = 'Zygosity Name']")
            ).waitForDisplayed();
        });
        it('filters rows when using numerical filter menu', async () => {
            await clickElement("//span[text() = 'Zygosity Code']");
            await (
                await filterIconOfHeader("//span[text() = 'Zygosity Code']")
            ).waitForDisplayed();
            await (
                await filterIconOfHeader("//span[text() = 'Zygosity Code']")
            ).click();
            // Empty rows
            const numberOfRowsBefore = await numberOfTableRows();
            await (await getElement('#Zygosity_Code-lowerValue-box')).setValue(
                '2'
            );
            await clickElement(
                '[data-test=numerical-filter-menu-remove-empty-rows]'
            );
            await browser.waitUntil(
                async () => (await numberOfTableRows()) < numberOfRowsBefore
            );

            // reset state
            await (await getElement('#Zygosity_Code-lowerValue-box')).setValue(
                '1'
            );
            await clickElement(
                '[data-test=numerical-filter-menu-remove-empty-rows]'
            );
            await browser.waitUntil(
                async () => (await numberOfTableRows()) === numberOfRowsBefore
            );
        });
        it('filters rows when using categorical filter menu', async () => {
            await clickElement("//span[text() = 'Zygosity Name']");
            await (
                await filterIconOfHeader("//span[text() = 'Zygosity Name']")
            ).waitForDisplayed();
            await (
                await filterIconOfHeader("//span[text() = 'Zygosity Name']")
            ).click();
            // Empty rows
            var numberOfRowsBefore = await numberOfTableRows();
            await (
                await $('[data-test=categorical-filter-menu-search-input]')
            ).setValue('Homozygous');
            await browser.waitUntil(
                async () => (await numberOfTableRows()) < numberOfRowsBefore
            );
        });
    });
    describe('patient view', () => {
        it('hides namespace columns when no property set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(
                patientViewUrl,
                true,
                {}
            );
            await waitForPatientViewMutationTable();
            assert(await namespaceColumnsAreNotDisplayed());
        });
        it('shows columns when column menu is used', async () => {
            // Click on column button.
            await (
                await getNestedElement([
                    '[data-test=patientview-mutation-table]',
                    'button*=Columns',
                ])
            ).click();
            // Click namespace column checkboxes.
            await clickElement('[data-id="Zygosity Code"]');
            await clickElement('[data-id="Zygosity Name"]');
            await (
                await getNestedElement([
                    '[data-test=patientview-mutation-table]',
                    'button*=Columns',
                ])
            ).click();
            assert(await namespaceColumnsAreDisplayed());
        });
        it('shows namespace columns when property set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {
                skin_mutation_table_namespace_column_show_by_default: true,
            });
            await waitForPatientViewMutationTable();
            assert(await namespaceColumnsAreDisplayed());
        });
    });
});

const waitForMutationTable = async () => {
    await waitForElementDisplayed('[data-test=LazyMobXTable]');
};

const waitForPatientViewMutationTable = async () => {
    await waitForElementDisplayed('[data-test=patientview-mutation-table]');
};

const namespaceColumnsAreDisplayed = async () => {
    return (
        (await isDisplayed("//span[text() = 'Zygosity Code']")) &&
        (await isDisplayed("//span[text() = 'Zygosity Name']"))
    );
};

const namespaceColumnsAreNotDisplayed = async () => {
    return !(
        (await isDisplayed("//span[text() = 'Zygosity Code']")) &&
        (await isDisplayed("//span[text() = 'Zygosity Name']"))
    );
};

const filterIconOfHeader = async selector => {
    // return await (await (
    //     await (await $(selector))
    //         .parentElement())
    //     .parentElement())
    //     .$('.fa-filter');

    return await getNestedElement([selector, '..', '..', '.fa-filter']);
};

const numberOfTableRows = async () => (await $$('.lazy-mobx-table tr')).length;
