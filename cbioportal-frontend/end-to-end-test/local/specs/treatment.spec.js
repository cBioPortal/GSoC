const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    waitForOncoprint,
    waitForPlotsTab,
    reactSelectOption,
    selectReactSelectOption,
    selectElementByText,
    clickElement,
    getElement,
    setInputText,
    getNestedElement,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize';
const plotsTabUrl =
    CBIOPORTAL_URL +
    '/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&clinicallist=PROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize&generic_assay_groups=study_es_0_treatment_ic50,Afatinib-1,Afatinib-2';
const ADD_TRACKS_TREATMENT_TAB =
    '.oncoprintAddTracks a.tabAnchor_TREATMENT_RESPONSE';
const TREATMENT_IC50_PROFILE_NAME =
    'IC50 values of compounds on cellular phenotype readout';
const TREATMENT_EC50_PROFILE_NAME =
    'EC50 values of compounds on cellular phenotype readout';
const GENERIC_ASSAY_PROFILE_SELECTOR =
    '[data-test="GenericAssayProfileSelection"]';
const GENERIC_ASSAY_ENTITY_SELECTOR =
    '[data-test="GenericAssayEntitySelection"]';

describe('treatment feature', function() {
    //this.retries(2);

    describe('oncoprint tab', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(oncoprintTabUrl, true);
            await waitForOncoprint();
        });

        it('shows treatment data type option in heatmap menu', async () => {
            await goToTreatmentTab();
            // open treatment profile selection menu
            await clickElement(GENERIC_ASSAY_PROFILE_SELECTOR);
            await (
                await selectElementByText(TREATMENT_IC50_PROFILE_NAME)
            ).waitForExist();
            assert(
                await getElement(`//*[text()="${TREATMENT_IC50_PROFILE_NAME}"]`)
            );
            await (
                await selectElementByText(TREATMENT_EC50_PROFILE_NAME)
            ).waitForExist();
            assert(
                await getElement(`//*[text()="${TREATMENT_EC50_PROFILE_NAME}"]`)
            );
        });

        it('shows treatment selection box in heatmap menu when treatment data type is selected', async () => {
            await goToTreatmentTab();
            // change profile to IC50
            await clickElement(GENERIC_ASSAY_PROFILE_SELECTOR);
            await (
                await selectElementByText(TREATMENT_IC50_PROFILE_NAME)
            ).waitForExist();
            await (
                await selectElementByText(TREATMENT_IC50_PROFILE_NAME)
            ).click();
            assert(
                await getElement(`//*[text()="${TREATMENT_IC50_PROFILE_NAME}"]`)
            );
            // change profile to EC50
            await clickElement(GENERIC_ASSAY_PROFILE_SELECTOR);
            await (
                await selectElementByText(TREATMENT_EC50_PROFILE_NAME)
            ).waitForExist();
            await (
                await selectElementByText(TREATMENT_EC50_PROFILE_NAME)
            ).click();
            assert(
                await getElement(`//*[text()="${TREATMENT_EC50_PROFILE_NAME}"]`)
            );
        });

        it('shows all treatments in generic assay selector', async () => {
            await goToTreatmentTab();
            // open entity dropdown menu
            await clickElement(GENERIC_ASSAY_ENTITY_SELECTOR);
            const options = await (
                await getElement(GENERIC_ASSAY_ENTITY_SELECTOR)
            ).$$('div[class$="option"]');
            assert.equal(options.length, 10);
        });

        it('select one treatment in generic assay selector', async () => {
            await goToTreatmentTab();
            await clickElement(GENERIC_ASSAY_ENTITY_SELECTOR);
            await setInputText(
                '[data-test="GenericAssayEntitySelection"] input',
                '17-AAG'
            );
            const options = await (
                await getElement(GENERIC_ASSAY_ENTITY_SELECTOR)
            ).$$('div[class$="option"]');
            await options[1].click();
            await (
                await getNestedElement([
                    GENERIC_ASSAY_ENTITY_SELECTOR,
                    'div[class$="multiValue"]',
                ])
            ).waitForExist();
            const selectedOptions = await (
                await getElement(GENERIC_ASSAY_ENTITY_SELECTOR)
            ).$$('div[class$="multiValue"]');
            assert.equal(selectedOptions.length, 1);
        });

        it('show multiple filtered treatments', async () => {
            await goToTreatmentTab();
            await clickElement(GENERIC_ASSAY_ENTITY_SELECTOR);
            await setInputText(
                '[data-test="GenericAssayEntitySelection"] input',
                'AZD'
            );
            const options = await (
                await getElement(GENERIC_ASSAY_ENTITY_SELECTOR)
            ).$$('div[class$="option"]');
            assert.equal(options.length, 3);
        });

        it('select multiple filtered treatments in generic assay selector', async () => {
            await goToTreatmentTab();
            await clickElement(GENERIC_ASSAY_ENTITY_SELECTOR);
            await setInputText(
                '[data-test="GenericAssayEntitySelection"] input',
                'AZD'
            );
            const options = await (
                await getElement(GENERIC_ASSAY_ENTITY_SELECTOR)
            ).$$('div[class$="option"]');
            await options[0].click();
            await (await getElement('div[class$="multiValue"]')).waitForExist();
            const selectedOptions = await (
                await getElement(GENERIC_ASSAY_ENTITY_SELECTOR)
            ).$$('div[class$="multiValue"]');
            assert.equal(selectedOptions.length, 2);
        });

        it('keeps the filtered treatments list open after selecting an option', async () => {
            await goToTreatmentTab();
            await clickElement(GENERIC_ASSAY_ENTITY_SELECTOR);
            var options = await (
                await getElement(GENERIC_ASSAY_ENTITY_SELECTOR)
            ).$$('div[class$="option"]');
            assert.equal(options.length, 10);

            await options[0].click();
            options = await (
                await getElement(GENERIC_ASSAY_ENTITY_SELECTOR)
            ).$$('div[class$="option"]');
            assert.equal(options.length, 9);
        });

        it('initializes from `generic_assay_groups` URL parameter', async () => {
            await goToUrlAndSetLocalStorage(
                oncoprintTabUrl.concat(
                    '&generic_assay_groups=study_es_0_treatment_ic50,17-AAG'
                ),
                true
            );
            await waitForOncoprint();
            await goToTreatmentTab();
            await (
                await getNestedElement([
                    GENERIC_ASSAY_ENTITY_SELECTOR,
                    'div[class$="multiValue"]',
                ])
            ).waitForExist();
            const selectedOptions = await (
                await getElement(GENERIC_ASSAY_ENTITY_SELECTOR)
            ).$$('div[class$="multiValue"]');
            assert.equal(selectedOptions.length, 1);
            assert.equal(
                await selectedOptions[0].getText(),
                'Name of 17-AAG (17-AAG): Desc of 17-AAG'
            );
        });

        it('sets `generic_assay_groups` URL parameter', async () => {
            await goToTreatmentTab();
            // Select treatment profile
            await clickElement(GENERIC_ASSAY_PROFILE_SELECTOR);
            await (
                await selectElementByText(TREATMENT_EC50_PROFILE_NAME)
            ).waitForExist();
            await (
                await selectElementByText(TREATMENT_EC50_PROFILE_NAME)
            ).click();

            // Select treatments
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
            await waitForOncoprint();
            const url = await browser.getUrl();

            const regex = /generic_assay_groups=study_es_0_treatment_ec50%2C17-AAG/;
            assert(url.match(regex));
        });
    });

    describe('plots tab', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(plotsTabUrl, true);
            await waitForPlotsTab();
        });

        it('shows treatment option in horizontal data type selection box', async () => {
            const select = await getNestedElement([
                '[name=h-profile-type-selector]',
                '..',
            ]);
            assert(await reactSelectOption(select, 'Treatment Response'));
        });

        it('shows treatment option in vertical data type selection box', async () => {
            const select = await getNestedElement([
                '[name=v-profile-type-selector]',
                '..',
            ]);
            assert(await reactSelectOption(select, 'Treatment Response'));
        });

        it('horizontal axis menu shows treatments in profile menu', async () => {
            const horzDataSelect = await getNestedElement([
                '[name=h-profile-type-selector]',
                '..',
            ]);
            await selectReactSelectOption(horzDataSelect, 'Treatment Response');

            const horzProfileSelect = await getNestedElement([
                '[name=h-profile-name-selector]',
                '..',
            ]);
            assert(
                await reactSelectOption(
                    horzProfileSelect,
                    'EC50 values of compounds on cellular phenotype readout'
                )
            );
            assert(
                await reactSelectOption(
                    horzProfileSelect,
                    'IC50 values of compounds on cellular phenotype readout'
                )
            );
        });

        it('vertical axis menu shows treatments in profile menu', async () => {
            const vertDataSelect = await getNestedElement([
                '[name=v-profile-type-selector]',
                '..',
            ]);
            await selectReactSelectOption(vertDataSelect, 'Treatment Response');

            const vertProfileSelect = await getNestedElement([
                '[name=v-profile-name-selector]',
                '..',
            ]);
            assert(
                await reactSelectOption(
                    vertProfileSelect,
                    'EC50 values of compounds on cellular phenotype readout'
                )
            );
            assert(
                await reactSelectOption(
                    vertProfileSelect,
                    'IC50 values of compounds on cellular phenotype readout'
                )
            );
        });

        it('horizontal axis menu shows treatment entry in entity menu', async () => {
            const horzDataSelect = await getNestedElement([
                '[name=h-profile-type-selector]',
                '..',
            ]);
            await selectReactSelectOption(horzDataSelect, 'Treatment Response');

            const horzProfileSelect = await getNestedElement([
                '[name=h-profile-name-selector]',
                '..',
            ]);
            await selectReactSelectOption(
                horzProfileSelect,
                'IC50 values of compounds on cellular phenotype readout'
            );

            await getElement('[data-test=generic-assay-info-icon]', {
                waitForExist: true,
            });

            // NOT SUPER CLEAR WHY THESE ARE NECESSARY
            await browser.execute(function() {
                resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect({
                    value: '17-AAG',
                    label: 'Name of 17-AAG',
                });
            });

            await browser.execute(function() {
                resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect({
                    value: 'AEW541',
                    label: 'Name of AEW541',
                });
            });
        });

        it('vertical axis menu shows treatment entry in entity menu', async () => {
            const vertDataSelect = await getNestedElement([
                '[name=v-profile-type-selector]',
                '..',
            ]);
            await selectReactSelectOption(vertDataSelect, 'Treatment Response');

            const vertProfileSelect = await getNestedElement([
                '[name=v-profile-name-selector]',
                '..',
            ]);
            await selectReactSelectOption(
                vertProfileSelect,
                'IC50 values of compounds on cellular phenotype readout'
            );

            await getElement('[data-test=generic-assay-info-icon]', {
                waitForExist: true,
            });

            // browser.execute(function() {
            //     resultsViewPlotsTab.onVerticalAxisGenericAssaySelect({
            //         value: '17-AAG',
            //         label: 'Name of 17-AAG',
            //     });
            // })
            //
            //
            // browser.execute(function() {
            //     resultsViewPlotsTab.onVerticalAxisGenericAssaySelect({
            //         value: 'AEW541',
            //         label: 'Name of AEW541',
            //     });
            // })
        });

        it('has Ordered samples entry in vert. menu when treatment selected on horz. axis', async () => {
            const vertDataSelect = await (
                await $('[name=v-profile-type-selector]')
            ).$('..');
            await selectReactSelectOption(vertDataSelect, 'Treatment Response');

            const vertProfileSelect = await (
                await $('[name=v-profile-name-selector]')
            ).$('..');
            await selectReactSelectOption(
                vertProfileSelect,
                'IC50 values of compounds on cellular phenotype readout'
            );

            await (
                await $('[data-test=generic-assay-info-icon]')
            ).waitForExist();

            await browser.execute(function() {
                resultsViewPlotsTab.onVerticalAxisGenericAssaySelect({
                    value: 'AEW541',
                    label: 'Name of AEW541',
                });
            });

            const horzDataSelect = await (
                await $('[name=h-profile-type-selector]')
            ).$('..');
            assert(await reactSelectOption(horzDataSelect, 'Ordered samples'));
        });

        it('has `Ordered samples` entry in horz. menu when treatment selected on vert. axis', async () => {
            const horzDataSelect = await (
                await $('[name=h-profile-type-selector]')
            ).$('..');
            await selectReactSelectOption(horzDataSelect, 'Treatment Response');

            const horzProfileSelect = await (
                await $('[name=h-profile-name-selector]')
            ).$('..');
            await selectReactSelectOption(
                horzProfileSelect,
                'IC50 values of compounds on cellular phenotype readout'
            );

            await (
                await $('[data-test=generic-assay-info-icon]')
            ).waitForExist();

            await browser.execute(function() {
                resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect({
                    value: 'AEW541',
                    label: 'Name of AEW541',
                });
            });

            const vertDataSelect = await (
                await $('[name=v-profile-type-selector]')
            ).$('..');
            assert(await reactSelectOption(vertDataSelect, 'Ordered samples'));
        });

        it('shows `Log Scale` checkbox when treatment selected on vert. axis', async () => {
            const horzDataSelect = await (
                await $('[name=h-profile-type-selector]')
            ).$('..');
            await selectReactSelectOption(horzDataSelect, 'Treatment Response');
            assert(await $('[data-test=HorizontalLogCheckbox]'));
        });

        it('shows `Log Scale` checkbox when treatment selected on horz. axis', async () => {
            const vertDataSelect = await (
                await $('[name=v-profile-type-selector]')
            ).$('..');
            await selectReactSelectOption(vertDataSelect, 'Treatment Response');
            assert(await $('[data-test=VerticalLogCheckbox]'));
        });

        it('shows checkbox for limit values (e.g., larger_than_8.00) checkbox when such profile selected on horz. axis', async () => {
            const horzDataSelect = await (
                await $('[name=h-profile-type-selector]')
            ).$('..');
            await selectReactSelectOption(horzDataSelect, 'Treatment Response');

            const horzProfileSelect = await (
                await $('[name=h-profile-name-selector]')
            ).$('..');
            await selectReactSelectOption(
                horzProfileSelect,
                'EC50 values of compounds on cellular phenotype readout'
            );

            await (await $('[data-test=generic-assay-info-icon]')).waitForExist(
                {
                    timeout: 10000,
                }
            );

            // WHY WAS ASSERT BEING CALLED ON THIS?
            await browser.execute(function() {
                resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect({
                    value: 'AEW541',
                    label: 'Name of AEW541',
                });
            });
            // browser.pause(1000);

            await (await $('[data-test=ViewLimitValues]')).waitForExist();
            assert(
                await (await $('[data-test=ViewLimitValues]')).isDisplayed()
            );
        });

        it('shows checkbox for limit values (e.g., larger_than_8.00) checkbox when such profile selected on vert. axis', async () => {
            const vertDataSelect = await (
                await $('[name=v-profile-type-selector]')
            ).$('..');
            await selectReactSelectOption(vertDataSelect, 'Treatment Response');

            const vertProfileSelect = await (
                await $('[name=v-profile-name-selector]')
            ).$('..');
            await selectReactSelectOption(
                vertProfileSelect,
                'EC50 values of compounds on cellular phenotype readout'
            );
            await (await $('[data-test=generic-assay-info-icon]')).waitForExist(
                {
                    timeout: 10000,
                }
            );

            await browser.execute(function() {
                resultsViewPlotsTab.onVerticalAxisGenericAssaySelect({
                    value: 'AEW541',
                    label: 'Name of AEW541',
                });
            });

            await (await $('[data-test=ViewLimitValues]')).waitForExist();
            assert(
                await (await $('[data-test=ViewLimitValues]')).isDisplayed()
            );
        });

        it('shows hint for handling of threshold values for treatment data in scatter plot', async () => {
            assert(await $('label=Value >8.00 Labels **'));
            assert(await $('div*=** '));
        });

        it('shows gene selection box in utilities menu for waterfall plot', async () => {
            await selectTreamentsBothAxes();

            const horzDataSelect = await (
                await $('[name=h-profile-type-selector]')
            ).$('..');
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');
            assert(await $('.gene-select-container'));
            assert(await $('.gene-select-container'));
        });

        it('shows selected genes in gene selection box in utilities menu for waterfall plot', async () => {
            await selectTreamentsBothAxes();

            const horzDataSelect = await (
                await $('[name=h-profile-type-selector]')
            ).$('..');
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');

            await (await $('.gene-select-container')).waitForExist();
            const geneSelect = await $('.gene-select-container');

            await geneSelect.click();
            await (
                await (await $('[data-test=GeneColoringMenu]')).$('div=Genes')
            ).waitForDisplayed();

            // select gene menu entries
            const geneMenuEntries = await (
                await (
                    await (
                        await (await $('[data-test=GeneColoringMenu]')).$(
                            'div=Genes'
                        )
                    ).$('..')
                ).$$('div')
            )[1].$$('div');

            assert.strictEqual(await geneMenuEntries[0].getText(), 'CDKN2A');
            assert.strictEqual(await geneMenuEntries[1].getText(), 'MDM2');
            assert.strictEqual(await geneMenuEntries[2].getText(), 'MDM4');
            assert.strictEqual(await geneMenuEntries[3].getText(), 'TP53');
        });

        it('shows sort order button for waterfall plot when `Ordered samples` selected', async () => {
            await selectTreamentsBothAxes();
            const horzDataSelect = await (
                await $('[name=h-profile-type-selector]')
            ).$('..');
            await selectReactSelectOption(horzDataSelect, 'Ordered samples');
            assert(await $('[data-test=changeSortOrderButton'));
        });
    });
});

const goToTreatmentTab = async () => {
    await clickElement('button[id=addTracksDropdown]');
    await getElement(ADD_TRACKS_TREATMENT_TAB, {
        waitForExist: true,
    });
    await clickElement(ADD_TRACKS_TREATMENT_TAB);
};

const selectTreamentsBothAxes = async () => {
    const horzDataSelect = await (await $('[name=h-profile-type-selector]')).$(
        '..'
    );
    await selectReactSelectOption(horzDataSelect, 'Treatment Response');
    const horzProfileSelect = await (
        await $('[name=h-profile-name-selector]')
    ).$('..');
    await selectReactSelectOption(
        horzProfileSelect,
        'IC50 values of compounds on cellular phenotype readout'
    );

    const vertDataSelect = await (await $('[name=v-profile-type-selector]')).$(
        '..'
    );
    await selectReactSelectOption(vertDataSelect, 'Treatment Response');
    const vertProfileSelect = await (
        await $('[name=v-profile-name-selector]')
    ).$('..');
    await selectReactSelectOption(
        vertProfileSelect,
        'IC50 values of compounds on cellular phenotype readout'
    );

    await (await $('[data-test=generic-assay-info-icon]')).waitForExist();
    await browser.execute(function() {
        resultsViewPlotsTab.onHorizontalAxisGenericAssaySelect({
            value: 'AEW541',
            label: 'Name of AEW541',
        });
    });

    await browser.execute(function() {
        resultsViewPlotsTab.onVerticalAxisGenericAssaySelect({
            value: 'AEW541',
            label: 'Name of AEW541',
        });
    });

    await (await $('[data-test=ViewLimitValues]')).waitForExist();
    if (!(await (await $('[data-test=ViewLimitValues]')).isSelected())) {
        await (await $('[data-test=ViewLimitValues]')).click();
    }

    if (await (await $('[data-test=HorizontalLogCheckbox]')).isSelected()) {
        await (await $('[data-test=HorizontalLogCheckbox]')).click();
    }

    if (await (await $('[data-test=VerticalLogCheckbox]')).isSelected()) {
        await (await $('[data-test=VerticalLogCheckbox]')).click();
    }
};

module.exports = {
    oncoprintTabUrl: oncoprintTabUrl,
    goToTreatmentTab: goToTreatmentTab,
    queryPageUrl: CBIOPORTAL_URL,
    plotsTabUrl: plotsTabUrl,
    selectTreamentsBothAxes: selectTreamentsBothAxes,
};
