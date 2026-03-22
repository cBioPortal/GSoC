const assert = require('assert');
const expect = require('chai').expect;

const {
    goToUrlAndSetLocalStorage,
    clickQueryByGeneButton,
    useNetlifyDeployPreview,
    setInputText,
    waitForNumberOfStudyCheckboxes,
    clickModifyStudySelectionButton,
    waitForOncoprint,
    setDropdownOpen,
    jq,
    getElementByTestHandle,
    getElement,
    clickElement,
    getText,
    isSelected,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const searchInputSelector = 'div[data-test=study-search] input[type=text]';

describe('homepage', () => {
    before(async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    if (!useNetlifyDeployPreview) {
        it('window.frontendConfig.frontendUrl should point to localhost 3000 when testing', async () => {
            // We no longer check whether the dev mode banner exits.
            // The banner is hidden in e2etests.scss
            assert(
                (
                    await browser.execute(() => {
                        return window.getLoadConfig().frontendUrl;
                    })
                ).includes('//localhost:3000')
            );
        });
    }

    // this just shows that we have some studies listed
    it('it should have some (>0) studies listed ', async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
        const selector = '[data-test="cancerTypeListContainer"] > ul > ul';
        await getElement(selector, {
            timeout: 10000,
        });
        expect(0).to.be.below((await jq(selector)).length);
    });

    it('should filter study list according to filter text input', async () => {
        await getElement(searchInputSelector, { timeout: 10000 });
        await setInputText(searchInputSelector, 'bladder');

        assert(
            (await jq('[data-test="StudySelect"] input:checkbox')).length > 1
        );
    });

    it('when a single study is selected, a case set selector is provided', async () => {
        const caseSetSelectorClass = '[data-test="CaseSetSelector"]';
        await getElementByTestHandle('StudySelect', { timeout: 10000 });
        assert.equal(
            await (await getElement(caseSetSelectorClass)).isExisting(),
            false
        );
        await clickElement('[data-test="StudySelect"] input');
        await clickQueryByGeneButton();
        await getElement(caseSetSelectorClass, { timeout: 10000 });
        assert.equal(
            await (await getElement(caseSetSelectorClass)).isExisting(),
            true
        );
    });

    it('should not allow submission if OQL contains EXP or PROT for multiple studies', async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
        await getElement('div[data-test=study-search] input[type=text]', {
            timeout: 20000,
        });
        await setInputText(
            'div[data-test=study-search] input[type=text]',
            'breast -invasive'
        );
        await browser.pause(500);
        await getElement('[data-test="StudySelect"]', { timeout: 10000 });
        await clickElement('[data-test="selectAllStudies"]');
        await clickQueryByGeneButton();
        const oqlEntrySel = 'textarea[data-test="geneSet"]';
        await setInputText(oqlEntrySel, 'PTEN: EXP>1');
        const errorMessageSel = 'span[data-test="oqlErrorMessage"]';
        await (await getElement(errorMessageSel)).waitForExist();
        await browser.waitUntil(
            async () =>
                (await (await getElement(errorMessageSel)).getText()) ===
                'Expression filtering in the gene list (the EXP command) is not supported when doing cross cancer queries.'
        );
        assert.equal(
            await (await getElement(errorMessageSel)).getText(),
            'Expression filtering in the gene list (the EXP command) is not supported when doing cross cancer queries.'
        );
        const submitButtonSel = 'button[data-test="queryButton"]';
        assert.ok(
            !(await (await getElement(submitButtonSel)).isEnabled()),
            'submit should be disabled w/ EXP in oql'
        );
        await setInputText(oqlEntrySel, 'PTEN: PROT>1');
        await (await getElement(errorMessageSel)).waitForExist();
        await (
            await getElement(
                'span=Protein level filtering in the gene list (the PROT command) is not supported when doing cross cancer queries.'
            )
        ).waitForExist();
        assert.equal(
            await getText(errorMessageSel),
            'Protein level filtering in the gene list (the PROT command) is not supported when doing cross cancer queries.'
        );
        assert.ok(
            !(await (await getElement(submitButtonSel)).isEnabled()),
            'submit should be disabled w/ PROT in oql'
        );
    });
});

describe('select all/deselect all functionality in study selector', () => {
    const getCheckedCheckboxes = async () => {
        await (
            await getElement('[data-test="StudySelect"] input[type=checkbox]')
        ).waitForDisplayed();
        return jq(`[data-test=\"StudySelect\"] input[type=checkbox]:checked`);
    };

    it('clicking select all studies checkbox selects all studies', async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
        await browser.pause(1000);
        assert.equal(
            (await getCheckedCheckboxes()).length,
            0,
            'no studies selected'
        );

        await clickElement('button=TCGA PanCancer Atlas Studies');

        assert.equal(
            (await getCheckedCheckboxes()).length,
            32,
            'all pan can studies are selected'
        );

        await clickElement('[data-test=globalDeselectAllStudiesButton]');

        assert.equal(
            (await getCheckedCheckboxes()).length,
            0,
            'no studies are selected'
        );
    });

    it('global deselect button clears all selected studies, even during filter', async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        assert.equal(
            await (
                await getElementByTestHandle('globalDeselectAllStudiesButton')
            ).isExisting(),
            false,
            'global deselect button does not exist'
        );

        await browser.pause(500);
        const selectElement = await $$(
            '[data-test="StudySelect"] input[type=checkbox]'
        );
        await selectElement[50].click();

        assert.equal(
            await (
                await getElement('[data-test=globalDeselectAllStudiesButton]')
            ).isExisting(),
            true,
            'global deselect button DOES exist'
        );
        assert.equal(
            (await getCheckedCheckboxes()).length,
            1,
            'we selected one study'
        );
        await setInputText(
            'div[data-test=study-search] input[type=text]',
            'breast'
        );

        //click global deselect all while filtered
        await clickElement('[data-test=globalDeselectAllStudiesButton]');

        // click unfilter button
        await clickElement('[data-test=clearStudyFilter]');

        assert.equal(
            (await getCheckedCheckboxes()).length,
            0,
            'no selected studies are selected after deselect all clicked'
        );
    });
});

describe('case set selection in front page query form', function() {
    const selectedCaseSet_sel =
        'div[data-test="CaseSetSelector"] span.Select-value-label[aria-selected="true"]';

    beforeEach(async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
        // await waitForOncoprint();
    });

    it('selects the default case set for single study selections', async () => {
        const input = 'div[data-test=study-search] input[type=text]';
        await getElement(input, { timeout: 20000 });
        await setInputText(input, 'ovarian nature 2011');
        await waitForNumberOfStudyCheckboxes(1);
        await getElement('[data-test="StudySelect"]', { timeout: 10000 });
        await clickElement('[data-test="StudySelect"] input');

        await clickQueryByGeneButton();

        await (await getElement(selectedCaseSet_sel)).waitForDisplayed();
        await browser.waitUntil(
            async () =>
                (await getText(selectedCaseSet_sel)) ===
                'Samples with mutation and CNA data (316)',
            5000
        );
    });

    it('selects the right default case sets in a single->multiple->single study selection flow', async function() {
        this.retries(0);
        const input = 'div[data-test=study-search] input[type=text]';
        async function searchAndSelectStudy(
            studyName,
            checkboxSelector,
            expectedText
        ) {
            await getElement(input, { timeout: 20000 });
            await setInputText(input, studyName);
            await (
                await getElement('[data-test="study-search"] .dropdown-toggle')
            ).click();
            await waitForNumberOfStudyCheckboxes(1, checkboxSelector);
            await getElement('[data-test="StudySelect"]', { timeout: 10000 });
            await clickElement(checkboxSelector);

            await browser.pause(2000);

            await clickQueryByGeneButton();

            await (await getElement(selectedCaseSet_sel)).waitForDisplayed();
            await browser.waitUntil(async () => {
                const selectedText = (
                    await getText(selectedCaseSet_sel)
                ).trim();
                return selectedText === expectedText;
            }, 30000);
        }
        // Phase 1: Select Ampullary Carcinoma
        await searchAndSelectStudy(
            'ampullary baylor',
            '[data-test="StudySelect"] input',
            'Samples with mutation data (160)'
        );
        await browser.pause(2000);
        await clickModifyStudySelectionButton();
        // Phase 2: Select all TCGA non-provisional
        await searchAndSelectStudy(
            'adrenocortical carcinoma tcga firehose legacy',
            '.studyItem_acc_tcga',
            'All (252)'
        );
        await clickModifyStudySelectionButton();
        await browser.pause(500);
        //Phase 3: Deselect Ampullary Carcinoma
        //await (await getElement(input)).waitForExist({ timeout: 10000 });
        //await setInputText(input, '');
        await clickElement('[data-test="clearStudyFilter"]');
        await browser.pause(2000);

        await clickElement('.studyItem_ampca_bcm_2016');
        await clickQueryByGeneButton();
        await (await getElement(selectedCaseSet_sel)).waitForExist();

        //await browser.debug();

        await browser.waitUntil(async () => {
            const expectedText = 'Samples with mutation and CNA data (88)';
            const selectedText = (await getText(selectedCaseSet_sel)).trim();
            return selectedText === expectedText;
        }, 10000);
    });
});

describe('selects the right default case sets in a single->select all filtered->single study selection flow', () => {
    before(async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });
    const inputSelector = 'div[data-test=study-search] input[type=text]';
    const selectAllSelector =
        'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]';
    const selectedCaseSetSelector =
        'div[data-test="CaseSetSelector"] span.Select-value-label[aria-selected="true"]';

    const searchAndSelectStudy = async (studyName, expectedCheckboxes = 1) => {
        await getElement(inputSelector, { timeout: 20000 });
        await setInputText(inputSelector, studyName);
        await (
            await getElement('[data-test="study-search"] .dropdown-toggle')
        ).click();
        await waitForNumberOfStudyCheckboxes(expectedCheckboxes);
        await getElement('[data-test="StudySelect"]', { timeout: 10000 });
        // await clickElement('[data-test="StudySelect"] input');
    };

    const validateSelectedCaseSet = async expectedText => {
        await (await getElement(selectedCaseSetSelector)).waitForExist();
        await browser.waitUntil(async () => {
            const selectedText = await getText(selectedCaseSetSelector);
            return selectedText.trim() === expectedText;
        }, 10000);
    };

    it('Step 1: Select Ampullary Carcinoma', async function() {
        await searchAndSelectStudy('ampullary baylor');
        await clickElement('[data-test="StudySelect"] input');
        await clickQueryByGeneButton();
        await validateSelectedCaseSet('Samples with mutation data (160)');
    });

    it('Step 2: Select all TCGA non-provisional studies', async function() {
        await clickModifyStudySelectionButton();
        await searchAndSelectStudy('tcga -provisional');
        await browser.pause(500);
        await clickElement(selectAllSelector);
        await clickQueryByGeneButton();
        await getElementByTestHandle('MUTATION_EXTENDED', {
            timeout: 20000,
        });
        await getElementByTestHandle('COPY_NUMBER_ALTERATION', {
            timeout: 10000,
        });
        await browser.waitUntil(
            async () =>
                /All \(\d+\)/.test(await getText(selectedCaseSetSelector)),
            10000
        );
    });

    it('Step 3: Deselect all TCGA non-provisional studies', async function() {
        await clickModifyStudySelectionButton();
        await clickElement(
            '[data-tour="cancer-study-list-container"] input[data-test="selectAllStudies"]'
        );
        await clickQueryByGeneButton();
        await validateSelectedCaseSet('Samples with mutation data (160)');
    });

    it('Step 4: Select Adrenocortical Carcinoma', async function() {
        await browser.pause(2000);
        await clickModifyStudySelectionButton();
        await searchAndSelectStudy(
            'adrenocortical carcinoma tcga firehose legacy'
        );
        await waitForNumberOfStudyCheckboxes(
            1,
            'Adrenocortical Carcinoma (TCGA, Firehose Legacy)'
        );
        await clickElement('[data-test="StudySelect"] input');
        await clickQueryByGeneButton();
        await validateSelectedCaseSet('All (252)');
    });

    it('Step 5: Deselect Ampullary Carcinoma', async function() {
        await clickModifyStudySelectionButton();
        await searchAndSelectStudy('ampullary baylor');
        await browser.pause(2000);
        await clickElement(
            '[data-tour="cancer-study-list-container"] input[data-test="selectAllStudies"]'
        );

        await clickQueryByGeneButton();
        await validateSelectedCaseSet(
            'Samples with mutation and CNA data (88)'
        );
    });
});

describe('genetic profile selection in front page query form', function() {
    this.retries(0);

    before(async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('selects the right default genetic profiles after selecting the initial study', async () => {
        // select a study
        const input = 'div[data-test=study-search] input[type=text]';
        await getElement(input, { timeout: 20000 });
        await setInputText(input, 'ovarian nature 2011');
        await waitForNumberOfStudyCheckboxes(1);
        await getElement('[data-test="StudySelect"]', { timeout: 10000 });
        await clickElement('[data-test="StudySelect"] input');
        await browser.pause(200);

        await clickQueryByGeneButton();

        // wait for profiles selector to load
        await getElement(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]',
            { timeout: 6000 }
        );
        // mutations, CNA should be selected
        assert(
            await isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ),
            'mutation profile should be selected'
        );
        assert(
            await isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ),
            'cna profile should be selected'
        );
        assert(
            !(await isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            )),
            'mrna profile not selected'
        );
    });

    it('modifies the study selection and verifies the genetic profiles', async () => {
        await clickModifyStudySelectionButton();

        // select another study
        const input = 'div[data-test=study-search] input[type=text]';
        await getElement(input, { timeout: 10000 });
        await setInputText(input, 'ampullary baylor');
        await waitForNumberOfStudyCheckboxes(
            1,
            'Ampullary Carcinoma (Baylor College of Medicine, Cell Reports 2016)'
        );
        await (
            await getElement('.studyItem_ampca_bcm_2016')
        ).waitForDisplayed();

        await clickElement('.studyItem_ampca_bcm_2016');

        await clickQueryByGeneButton();

        await getElementByTestHandle('MUTATION_EXTENDED', {
            timeout: 10000,
        });

        await getElementByTestHandle('COPY_NUMBER_ALTERATION', {
            timeout: 10000,
        });

        assert(
            await (
                await getElementByTestHandle('MUTATION_EXTENDED')
            ).isSelected(),
            "'Mutation' should be selected"
        );
        assert(
            await getElementByTestHandle('COPY_NUMBER_ALTERATION'),
            "'Copy number alterations' should be selected"
        );
    });

    it('deselects the study and verifies the genetic profiles', async () => {
        await clickModifyStudySelectionButton();

        //deselect other study
        await (
            await getElement('.studyItem_ampca_bcm_2016')
        ).waitForDisplayed();

        await clickElement('.studyItem_ampca_bcm_2016');

        await clickQueryByGeneButton();

        // wait for profiles selector to load
        await getElement(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]',
            { timeout: 10000 }
        );
        // mutations, CNA should be selected
        assert(
            await isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ),
            'mutation profile should be selected'
        );
        assert(
            await isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ),
            'cna profile should be selected'
        );
        assert(
            !(await isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]',
                {
                    timeout: 10000,
                }
            )),
            'mrna profile not selected'
        );
    });

    it('selects all TCGA firehose legacy studies and verifies the genetic profiles', async () => {
        await clickModifyStudySelectionButton();

        // select all tcga firehose legacy studies
        const input = 'div[data-test=study-search] input[type=text]';
        await getElement(input, { timeout: 10000 });
        await setInputText(input, 'tcga firehose');
        await browser.pause(500);
        await clickElement(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        );

        await clickQueryByGeneButton();

        // wait for data type priority selector to load
        await getElementByTestHandle('MUTATION_EXTENDED', {
            timeout: 10000,
        });

        await getElementByTestHandle('COPY_NUMBER_ALTERATION', {
            timeout: 10000,
        });
        assert(
            await (
                await getElementByTestHandle('MUTATION_EXTENDED')
            ).isSelected(),
            "'Mutation' should be selected"
        );
        assert(
            await (
                await getElementByTestHandle('COPY_NUMBER_ALTERATION', {
                    timeout: 10000,
                })
            ).isSelected(),
            "'Copy number alterations' should be selected"
        );
    });

    it('deselects all TCGA firehose legacy studies and verifies the genetic profiles', async () => {
        await clickModifyStudySelectionButton();

        // Deselect all tcga firehose legacy studies
        await clickElement(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        );
        await browser.pause(100);

        await clickQueryByGeneButton();

        // wait for profiles selector to
        // wait for profiles selector to load
        await getElement(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]',
            { timeout: 6000 }
        );
        // mutations, CNA should be selected
        assert(
            await isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ),
            'mutation profile should be selected'
        );
        assert(
            await isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ),
            'cna profile should be selected'
        );
        assert(
            !(await isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]',
                {
                    timeout: 10000,
                }
            )),
            'mrna profile not selected'
        );
    });
});

describe('auto-selecting needed profiles for oql in query form', () => {
    beforeEach(async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('gives a submit error if protein oql is inputted and no protein profile is available for the study', async () => {
        await getElement('.studyItem_nsclc_mskcc_2018', { timeout: 20000 });
        await clickElement('.studyItem_nsclc_mskcc_2018');
        await clickQueryByGeneButton();

        // enter oql
        await getElement('textarea[data-test="geneSet"]', { timeout: 2000 });
        await setInputText('textarea[data-test="geneSet"]', 'BRCA1: PROT>1');

        // error appears
        await browser.waitUntil(
            async () => {
                const errorMessageSel = await getElement(
                    '[data-test="oqlErrorMessage"]'
                );
                return (
                    (await errorMessageSel.isExisting()) &&
                    (await errorMessageSel.getText()) ===
                        'Protein level data query specified in OQL, but no protein level profile is available in the selected study.'
                );
            },
            { timeout: 20000 }
        );

        // submit is disabled
        assert(
            !(await (
                await getElement('button[data-test="queryButton"]')
            ).isEnabled())
        );
    });
    it('auto-selects an mrna profile when mrna oql is entered', async () => {
        await getElement('.studyItem_chol_tcga_pan_can_atlas_2018', {
            timeout: 20000,
        });
        await clickElement('.studyItem_chol_tcga_pan_can_atlas_2018');
        await clickQueryByGeneButton();

        // make sure profiles selector is loaded
        await getElement(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"]',
            { timeout: 3000 }
        );
        // mutations, CNA should be selected
        assert(
            await isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
            ),
            'mutation profile should be selected'
        );
        assert(
            await isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
            ),
            'cna profile should be selected'
        );
        assert(
            !(await isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            )),
            'mrna profile not selected'
        );

        // enter oql
        await getElement('textarea[data-test="geneSet"]', { timeout: 2000 });
        await setInputText(
            'textarea[data-test="geneSet"]',
            'TP53 BRCA1: EXP>1'
        );

        await (
            await getElement('button[data-test="queryButton"]')
        ).waitForEnabled({ timeout: 5000 });
        await clickElement('button[data-test="queryButton"]');

        // wait for query to load
        await waitForOncoprint();

        const profileFilter = (
            (
                await browser.execute(() => {
                    return { ...urlWrapper.query };
                })
            ).profileFilter || ''
        ).split(',');

        // mutation, cna, mrna profiles are there
        assert.equal(profileFilter.includes('mutations'), true);
        assert.equal(profileFilter.includes('gistic'), true);
        assert.equal(
            profileFilter.includes('rna_seq_v2_mrna_median_Zscores'),
            true
        );
    });
});

describe('results page quick oql edit', () => {
    it('gives a submit error if protein oql is inputted and no protein profile is available for the study', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?cancer_study_list=ccrcc_dfci_2019&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations&case_set_id=ccrcc_dfci_2019_sequenced&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit`
        );

        await waitForOncoprint();

        await getElement('[data-test="oqlQuickEditButton"]', {
            timeout: 20000,
        });
        await clickElement('[data-test="oqlQuickEditButton"]');

        await getElement('.quick_oql_edit [data-test="geneSet"]', {
            timeout: 5000,
        });
        await setInputText(
            '.quick_oql_edit [data-test="geneSet"]',
            'PTEN: PROT>0'
        );

        // error appears
        await browser.waitUntil(
            async () => {
                return (
                    (await (
                        await getElement(
                            '.quick_oql_edit [data-test="oqlErrorMessage"]'
                        )
                    ).isExisting()) &&
                    (await getText(
                        '.quick_oql_edit [data-test="oqlErrorMessage"]'
                    )) ===
                        'Protein level data query specified in OQL, but no protein level profile is available in the selected study.'
                );
            },
            { timeout: 20000 }
        );

        // submit is disabled
        assert(
            !(await (
                await getElement('button[data-test="oqlQuickEditSubmitButton"]')
            ).isEnabled())
        );
    });
    /** skip tests */
    it.skip('auto-selects an mrna profile when mrna oql is entered', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=prad_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=prad_tcga_pub_gistic&cancer_study_list=prad_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=prad_tcga_pub_cnaseq&gene_list=BRCA1&geneset_list=%20&tab_index=tab_visualize&Action=Submit`
        );

        // await waitForOncoprint();

        await getElement('[data-test="oqlQuickEditButton"]', {
            timeout: 20000,
        });

        await clickElement('[data-test="oqlQuickEditButton"]');

        await getElement('.quick_oql_edit [data-test="geneSet"]', {
            timeout: 5000,
        });
        await setInputText(
            '.quick_oql_edit [data-test="geneSet"]',
            'TP53 PTEN: PROT>0'
        );

        let query = await browser.execute(() => {
            return { ...urlWrapper.query };
        });
        // mutation and cna profile are there
        assert.equal(
            query.genetic_profile_ids_PROFILE_MUTATION_EXTENDED,
            'prad_tcga_pub_mutations'
        );
        assert.equal(
            query.genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION,
            'prad_tcga_pub_gistic'
        );
        assert.equal(
            query.genetic_profile_ids_PROFILE_MRNA_EXPRESSION,
            undefined
        );

        // enter oql
        await setDropdownOpen(
            true,
            'a[data-test="oqlQuickEditButton"]',
            '.quick_oql_edit textarea[data-test="geneSet"]'
        );
        await setInputText(
            '.quick_oql_edit textarea[data-test="geneSet"]',
            'PTEN: EXP>1'
        );

        await browser.pause(1000); // give it a second
        await getElement('button[data-test="oqlQuickEditSubmitButton"]', {
            timeout: 5000,
        });
        await clickElement('button[data-test="oqlQuickEditSubmitButton"]');

        // wait for query to load
        await waitForOncoprint();

        // mutation, cna, mrna profiles are there
        //TODO:-- why is this not working? profileFilter is '0' when logged even on the query url
        let profileFilter = (
            (await browser.execute(function() {
                return { ...urlWrapper.query };
            }).profileFilter) || ''
        ).split(',');

        console.log('profileFilter', profileFilter);
        // mutation, cna, mrna profiles are there
        assert.equal(profileFilter.includes('mutations'), true);
        assert.equal(profileFilter.includes('gistic'), true);
        assert.equal(
            profileFilter.includes('rna_seq_v2_mrna_median_Zscores'),
            true
        );
    });
});
