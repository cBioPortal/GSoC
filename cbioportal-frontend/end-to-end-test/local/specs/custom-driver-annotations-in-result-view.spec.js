const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    waitForOncoprint,
    setSettingsMenuOpen,
    getElement,
    isSelected,
    getNestedElement,
    clickElement,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&data_priority=0&gene_list=ABLIM1%250ATMEM247&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize';

const oncoprintTabUrlCna =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&data_priority=0&gene_list=ACAP3%2520AGRN&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&profileFilter=0&tab_index=tab_visualize&show_samples=true';

const oncoprintTabUrlStructVar =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&cancer_study_list=study_es_0&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cstructural_variants%2Cgistic&case_set_id=study_es_0_cnaseq&gene_list=TMPRSS2&geneset_list=%20&tab_index=tab_visualize';

describe('custom driver annotations feature in result view', () => {
    describe('oncoprint tab - mutations', async () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(oncoprintTabUrl, true);
            await waitForOncoprint();
            await setSettingsMenuOpen(true, 'GlobalSettingsButton');
        });

        it('shows custom driver annotation elements in config menu', async () => {
            assert(await isSelected('input[data-test=annotateCustomBinary]'));
            const tiersCheckboxes = await (
                await getElement('span[data-test=annotateCustomTiers]')
            ).$$('input');
            assert(await tiersCheckboxes[0].isSelected());
            assert(await tiersCheckboxes[1].isSelected());
        });

        it('allows deselection of Tiers checkboxes', async () => {
            const class1Checkbox = await getNestedElement([
                'label*=Class 1',
                'input',
            ]);
            await class1Checkbox.click();
            await waitForOncoprint();
            assert(!(await class1Checkbox.isSelected()));

            const class2Checkbox = await getNestedElement([
                'label*=Class 2',
                'input',
            ]);
            await class2Checkbox.click();
            await waitForOncoprint();
            assert(!(await class2Checkbox.isSelected()));
        });

        it('updates selected samples when VUS alterations are excluded', async () => {
            // deselected all checkboxes except Custom driver annotation
            await clickElement('input[data-test=annotateHotspots]');
            await (await getNestedElement(['label*=Class 1', 'input'])).click();
            await (await getNestedElement(['label*=Class 2', 'input'])).click();

            await clickElement('input[data-test=HideVUS]');
            await waitForOncoprint();
            assert(
                await (
                    await getElement('div.alert-info*=1 mutation')
                ).isExisting()
            );
            await (await getNestedElement(['label*=Class 1', 'input'])).click();
            await waitForOncoprint();
            assert(
                await (
                    await getElement('div.alert-info*=1 mutation')
                ).isExisting()
            );

            await (await getNestedElement(['label*=Class 2', 'input'])).click();
            await waitForOncoprint();
            assert(!(await (await getElement('div.alert-info')).isExisting()));
        });
    });

    describe('oncoprint tab - discrete CNA', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(oncoprintTabUrlCna, true);
            await waitForOncoprint();
            await setSettingsMenuOpen(true, 'GlobalSettingsButton');
        });

        it('shows custom driver annotation elements in config menu', async () => {
            assert(await isSelected('input[data-test=annotateCustomBinary]'));
            const tiersCheckboxes = await (
                await getElement('span[data-test=annotateCustomTiers]')
            ).$$('input');
            assert(await tiersCheckboxes[0].isSelected());
            assert(await tiersCheckboxes[1].isSelected());
        });

        it('allows deselection of Tiers checkboxes', async () => {
            const class1Checkbox = await getNestedElement([
                'label*=Class 1',
                'input',
            ]);
            await class1Checkbox.click();
            await waitForOncoprint();
            assert(!(await class1Checkbox.isSelected()));

            const class2Checkbox = await getNestedElement([
                'label*=Class 2',
                'input',
            ]);
            await class2Checkbox.click();
            await waitForOncoprint();
            assert(!(await class2Checkbox.isSelected()));
        });

        it('updates selected samples when VUS alterations are excluded', async () => {
            // deselected all checkboxes except Custom driver annotation
            await clickElement('input[data-test=annotateHotspots]');
            await (await getNestedElement(['label*=Class 1', 'input'])).click();
            await (await getNestedElement(['label*=Class 2', 'input'])).click();

            await clickElement('input[data-test=HideVUS]');
            await waitForOncoprint();
            assert(
                await (
                    await getElement(
                        'div.alert-info*=17 copy number alterations'
                    )
                ).isExisting()
            );

            await (await getNestedElement(['label*=Class 1', 'input'])).click();
            await waitForOncoprint();
            assert(
                await (
                    await getElement(
                        'div.alert-info*=17 copy number alterations'
                    )
                ).isExisting()
            );

            await (await getNestedElement(['label*=Class 2', 'input'])).click();

            await waitForOncoprint();
            assert(
                await (
                    await getElement(
                        'div.alert-info*=16 copy number alterations'
                    )
                ).isExisting()
            );
        });
    });

    describe('oncoprint tab - structural variants', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(oncoprintTabUrlStructVar, true);
            await waitForOncoprint();
            await setSettingsMenuOpen(true, 'GlobalSettingsButton');
        });

        it('shows custom driver annotation elements in config menu', async () => {
            assert(await isSelected('input[data-test=annotateCustomBinary]'));
            const tiersCheckboxes = await (
                await getElement('span[data-test=annotateCustomTiers]')
            ).$$('input');
            assert(await tiersCheckboxes[0].isSelected());
        });

        it('allows deselection of Tiers checkboxes', async () => {
            const class1Checkbox = await getNestedElement([
                'label*=Class 1',
                'input',
            ]);
            await class1Checkbox.click();
            await waitForOncoprint();
            assert(!(await class1Checkbox.isSelected()));
        });

        it('updates selected samples when VUS alterations are excluded', async () => {
            await clickElement('input[data-test=annotateHotspots]');
            await clickElement('input[data-test=annotateOncoKb]');
            await clickElement('input[data-test=HideVUS]');
            await waitForOncoprint();
            assert(
                await (
                    await getElement('div.alert-info*=1 structural variant')
                ).isExisting()
            );

            await (await getNestedElement(['label*=Class 1', 'input'])).click();
            await waitForOncoprint();
            assert(
                await (
                    await getElement('div.alert-info*=2 structural variants')
                ).isExisting()
            );
        });
    });
});
