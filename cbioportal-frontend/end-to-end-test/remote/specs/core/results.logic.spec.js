const assert = require('assert');

const {
    clickQueryByGeneButton,
    waitForNumberOfStudyCheckboxes,
    waitForOncoprint,
    goToUrlAndSetLocalStorage,
    getElementByTestHandle,
    getElement,
    clickElement,
    getText,
    isSelected,
    isUnselected,
    setInputText,
    waitForNetworkQuiet,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const ALL_CASE_SET_REGEXP = /^All \(\d+\)$/;

describe('Invalid query handling', () => {
    it('shows query form if no genes are submitted', async () => {
        const url = `${CBIOPORTAL_URL}/results/oncoprint?cancer_study_list=metastatic_solid_tumors_mich_2017`;
        await goToUrlAndSetLocalStorage(url);
        await (await getElementByTestHandle('studyList')).waitForDisplayed();

        assert(await (await getElementByTestHandle('studyList')).isDisplayed());

        const elem = await getElement(
            '.studyItem_metastatic_solid_tumors_mich_2017'
        ); // or $(() => document.getElementById('elem'))
        const checkbox = await elem.$(function() {
            return this.previousSibling;
        });
        assert(
            await checkbox.isSelected(),
            'study in url is selected in query form'
        );
    });
});

describe('cross cancer query', function() {
    it('should show cross cancer bar chart be defai;t with TP53 in title when selecting multiple studies and querying for single gene TP53', async function() {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/cancerTypesSummary?cancer_study_list=chol_tcga%2Cblca_tcga_pub%2Ccoadread_tcga&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=all&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit`
        );

        await waitForNetworkQuiet();

        // wait for cancer types summary to appear
        await getElementByTestHandle('cancerTypeSummaryChart', {
            timeout: 60000,
        });

        // check if TP53 is in the navigation above the plots
        await browser.waitUntil(async () => {
            return await (await getElement('.nav-pills*=TP53')).isDisplayed();
        });
    });
});

describe('single study query', async function() {
    this.retries(0);

    describe('mutation mapper ', async function() {
        it('should show somatic and germline mutation rate', async () => {
            await goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`);

            const input = await getElement(
                '[data-test=study-search] input[type=text]'
            );

            await input.waitForExist({ timeout: 10000 });

            await input.setValue('ovarian nature 2011');

            await waitForNumberOfStudyCheckboxes(1);

            await clickElement('[data-test="StudySelect"] input');

            await clickQueryByGeneButton();

            // query BRCA1 and BRCA2
            // const geneInput = await getElementByTestHandle('geneSet');
            // await geneInput.setValue('BRCA1 BRCA2');

            await setInputText('[data-test="geneSet"]', 'BRCA1 BRCA2');

            await (await getElementByTestHandle('queryButton')).waitForEnabled({
                timeout: 10000,
            });

            await clickElement('handle=queryButton', {
                timeout: 10000,
            });

            await clickElement('a.tabAnchor_mutations', {
                timeout: 10000,
            });

            await clickElement('handle=mutation-rate-summary', {
                timeout: 6000,
            });

            const text = await getText('[data-test="mutation-rate-summary"]');

            // check germline mutation rate
            assert(text.search('8.2%') > -1);
            // check somatic mutation
            assert(text.search('3.5%') > -1);
        });

        it('should show lollipop for MUC2', async function() {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?cancer_study_id=cellline_nci60&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=cellline_nci60_cnaseq&gene_list=MUC2&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=cellline_nci60_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=cellline_nci60_cna`
            );

            await waitForNetworkQuiet();

            await clickElement('a.tabAnchor_mutations', {
                timeout: 10000,
            });

            await getElementByTestHandle('LollipopPlot', {
                timeout: 6000,
            });
        });
    });

    describe('enrichments', function() {
        //this.retries(3)

        it('should show mutations plot', async function() {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?cancer_study_id=ov_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=ov_tcga_pub_cna_seq&gene_list=BRCA1+BRCA2&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=ov_tcga_pub_gistic`
            );

            await (
                await getElement('.comparisonTabSubTabs .tabAnchor_alterations')
            ).waitForExist();
        });
    });
});

describe('results page', function() {
    this.retries(0);

    describe('tab hiding', function() {
        it('should hide coexpression and cn segment tabs in a query without any data for those tabs', async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?session_id=5bc64b48498eb8b3d5685af7`
            );
            await waitForOncoprint();
            assert(
                !(await (
                    await getElement('a.tabAnchor_coexpression')
                ).isDisplayed())
            );
            assert(
                !(await (
                    await getElement('a.tabAnchor_cnSegments')
                ).isDisplayed())
            );
        });
        it('should hide survival tab in a query without any survival data', async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?session_id=5bc64bb5498eb8b3d5685afb`
            );
            await getElement('div[data-test="ComparisonPageOverlapTabDiv"]', {
                timeout: 20000,
            });
            assert(
                !(await (
                    await getElement('a.tabAnchor_survival')
                ).isDisplayed())
            );
        });
    });
    describe('mutual exclusivity tab', function() {
        it('should appear in a single study query with multiple genes', async function() {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%2520NRAS%2520BRAF%250APTEN%253A%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`
            );
            await getElement('a.tabAnchor_mutualExclusivity', {
                timeout: 10000,
            });

            assert(
                await (
                    await getElement('a.tabAnchor_mutualExclusivity')
                ).isDisplayed()
            );
        });
        it('should appear in a multiple study with multiple genes', async function() {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=KRAS%2520NRAS%2520BRAF%250APTEN%253A%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60%2Cacc_tcga`
            );
            await getElement('a.tabAnchor_mutualExclusivity', {
                timeout: 10000,
            });

            assert(
                await (
                    await getElement('a.tabAnchor_mutualExclusivity')
                ).isDisplayed()
            );
        });
        it('should not appear in a single study query with one gene', async function() {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%253A%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`
            );
            await waitForOncoprint();
            assert(
                !(await (
                    await getElement('a.tabAnchor_mutualExclusivity')
                ).isDisplayed())
            );

            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`
            );
            await waitForOncoprint();
            assert(
                !(await (
                    await getElement('a.tabAnchor_mutualExclusivity')
                ).isDisplayed())
            );
        });
        it('should not appear in a multiple study query with one gene', async function() {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=KRAS&geneset_list=+&tab_index=tab_visualize&Action=Submit&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60%2Cacc_tcga`
            );
            await getElement('a.tabAnchor_oncoprint', { timeout: 10000 });
            await browser.waitUntil(async function() {
                return !(await (
                    await getElement('a.tabAnchor_mutualExclusivity')
                ).isDisplayed());
            });
            assert(
                !(await (
                    await getElement('a.tabAnchor_mutualExclusivity')
                ).isDisplayed())
            );
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=KRAS%253A%2520MUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60%2Cacc_tcga`
            );
            await getElement('a.tabAnchor_oncoprint', { timeout: 10000 });
            await browser.waitUntil(async function() {
                return !(await (
                    await getElement('a.tabAnchor_mutualExclusivity')
                ).isDisplayed());
            });
            assert(
                !(await (
                    await getElement('a.tabAnchor_mutualExclusivity')
                ).isDisplayed())
            );
        });
    });
});

describe('case set selection in modify query form', function() {
    const selectedCaseSet_sel =
        'div[data-test="CaseSetSelector"] span.Select-value-label[aria-selected="true"]';

    //this.retries(2);

    beforeEach(async function() {
        const url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_rppa&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`;
        await goToUrlAndSetLocalStorage(url);
        await getElement('#modifyQueryBtn', { timeout: 60000 });
    });

    it('contains correct selected case set through a certain use flow involving two selected studies', async () => {
        //populates case set selector with selected case set in current query, then selects "All" when more studies are selected, then selects default when only one is selected again
        // open query form
        await clickElement('#modifyQueryBtn');
        await getElement(selectedCaseSet_sel, { timeout: 10000 });
        assert.equal(
            await getText(selectedCaseSet_sel),
            'Samples with protein data (RPPA) (196)',
            'Initially selected case set should be as specified from URL'
        );

        // Select a different study
        const input = await getElement(
            'div[data-test=study-search] input[type=text]',
            { timeout: 10000 }
        );
        await input.setValue('adrenocortical carcinoma tcga firehose legacy');
        await waitForNumberOfStudyCheckboxes(1);
        await getElementByTestHandle('StudySelect', { timeout: 10000 });
        await clickElement('[data-test="StudySelect"] input');
        await browser.pause(100);

        await getElementByTestHandle('COPY_NUMBER_ALTERATION', {
            timeout: 10000,
        });

        await getElement(selectedCaseSet_sel, { timeout: 10000 });
        assert(
            ALL_CASE_SET_REGEXP.test(await getText(selectedCaseSet_sel)),
            "'All' case set"
        );

        // Uncheck study
        await clickElement('[data-test="StudySelect"] input');
        await browser.pause(100);

        await getElement(selectedCaseSet_sel, { timeout: 10000 });
        assert.equal(
            await getText(selectedCaseSet_sel),
            'Samples with mutation and CNA data (212)',
            'Now we should be back to default selected case set for this study'
        );
    });

    it('contains correct selected case set through a certain use flow involving the "select all filtered studies" checkbox', async () => {
        //populates case set selector with selected case set in current query, then selects "All" when more studies are selected, then selects default when only one is selected again
        // open query form
        await clickElement('#modifyQueryBtn');
        await getElement(selectedCaseSet_sel, { timeout: 10000 });
        assert.equal(
            await getText(selectedCaseSet_sel),
            'Samples with protein data (RPPA) (196)',
            'Initially selected case set should be as specified from URL'
        );

        // Select all impact studies
        const input = await getElement(
            'div[data-test=study-search] input[type=text]',
            { timeout: 10000 }
        );
        await input.setValue('glioblastoma');
        await browser.pause(500);

        await clickElement(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        );

        await getElementByTestHandle('MUTATION_EXTENDED', {
            timeout: 10000,
        });
        await getElementByTestHandle('COPY_NUMBER_ALTERATION', {
            timeout: 10000,
        });

        await getElement(selectedCaseSet_sel, { timeout: 10000 });
        await browser.waitUntil(async () => {
            return ALL_CASE_SET_REGEXP.test(await getText(selectedCaseSet_sel));
        }, 5000);

        // Deselect all filtered studies
        await clickElement(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        );
        await browser.pause(100);

        await getElement(selectedCaseSet_sel, { timeout: 10000 });
        assert.equal(
            await getText(selectedCaseSet_sel),
            'Samples with mutation and CNA data (212)',
            'Now we should be back to default selected case set for this study'
        );
    });
});

describe('gene list input', function() {
    beforeEach(async function() {
        const url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_rppa&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`;
        await goToUrlAndSetLocalStorage(url);
        await getElement('#modifyQueryBtn', { timeout: 60000 });
    });

    // we're testing this because it was broken
    it('allows gene textarea update', async () => {
        await clickElement('#modifyQueryBtn');
        const textarea = await getElementByTestHandle('geneSet');
        await textarea.waitForDisplayed();
        await textarea.setValue('TP53 BRAF');

        assert((await textarea.getValue()) === 'TP53 BRAF');
    });
});

describe('genetic profile selection in modify query form', () => {
    beforeEach(async () => {
        const url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=chol_tcga&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=chol_tcga_all&gene_list=EGFR&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=chol_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=chol_tcga_gistic&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=chol_tcga_rppa_Zscores`;
        await goToUrlAndSetLocalStorage(url);
        await getElement('#modifyQueryBtn', { timeout: 20000 });
    });

    it('contains correct selected genetic profiles through a certain use flow involving two studies', async () => {
        //populates selected genetic profiles from current query, then goes back to defaults if another study is selected then deselected
        // open modify query form
        await clickElement('#modifyQueryBtn');

        await browser.waitUntil(
            async () =>
                await isSelected(
                    'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
                )
        );

        await isSelected(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MUTATION_EXTENDED"]'
        );

        await isSelected(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="COPY_NUMBER_ALTERATION"]'
        );

        await isSelected(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
        );

        await isSelected(
            'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="PROTEIN_LEVEL"]'
        );

        // select another study
        const input = await getElement(
            'div[data-test=study-search] input[type=text]',
            { timeout: 10000 }
        );
        await input.setValue('ampullary baylor');
        await waitForNumberOfStudyCheckboxes(1);
        await getElement('[data-test="StudySelect"]', { timeout: 10000 });
        await clickElement(`[data-test="StudySelect"] input`);

        await isSelected('handle=MUTATION_EXTENDED');

        await isSelected('handle=COPY_NUMBER_ALTERATION');

        await isSelected('handle=COPY_NUMBER_ALTERATION');

        //deselect other study so that available profile types will change
        await clickElement(`[data-test="StudySelect"] input`);

        await isSelected('handle=MUTATION_EXTENDED');

        await isSelected('handle=COPY_NUMBER_ALTERATION');

        await isUnselected('handle=MRNA_EXPRESSION');

        await isUnselected('handle=PROTEIN_LEVEL');
    });

    it('contains correct selected genetic profiles through a certain use flow involving the "select all filtered studies" checkbox', async () => {
        //populates selected genetic profiles from current query, then goes back to defaults if a lot of studies are selected then deselected
        // open modify query form
        await clickElement('#modifyQueryBtn');
        // wait for profiles selector to load
        await getElementByTestHandle('MUTATION_EXTENDED', {
            timeout: 10000,
        });

        // mutations, CNA, and protein should be selected
        assert(
            await (
                await getElementByTestHandle('COPY_NUMBER_ALTERATION')
            ).isSelected(),
            'mutation profile should be selected'
        );
        assert(
            await (
                await getElementByTestHandle('MUTATION_EXTENDED')
            ).isSelected(),
            'cna profile should be selected'
        );
        assert(
            !(await isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="MRNA_EXPRESSION"]'
            )),
            'mrna profile not selected'
        );
        assert(
            await isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="PROTEIN_LEVEL"]'
            ),
            'protein level should be selected'
        );

        // select all TCGA non-firehose studies
        const input = await getElement(
            'div[data-test=study-search] input[type=text]',
            { timeout: 10000 }
        );
        await input.setValue('tcga -firehose');
        await browser.pause(500);

        await clickElement(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        );

        // wait for data type priority selector to load
        // getElementByTestHandle('MUTATION_EXTENDED').waitForExist({
        //     timeout: 10000,
        // });

        await browser.waitUntil(async () => {
            return await (
                await getElementByTestHandle('MUTATION_EXTENDED')
            ).isSelected();
        });

        //browser.debug();

        assert(
            await (
                await getElementByTestHandle('COPY_NUMBER_ALTERATION')
            ).isSelected(),
            "'Copy number alterations' should be selected"
        );

        // Deselect all TCGA non-firehose studies
        await clickElement(
            'div[data-test="cancerTypeListContainer"] input[data-test="selectAllStudies"]'
        );
        await browser.pause(100);

        // wait for profiles selector to load
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
        assert(
            !(await isSelected(
                'div[data-test="molecularProfileSelector"] input[type="checkbox"][data-test="PROTEIN_LEVEL"]'
            )),
            'protein level not selected'
        );
    });
});

describe('invalid query from url', function() {
    //this.retries(1);

    it('show invalid query alert when url contains invalid gene', async () => {
        //go to cbioportal with a url that contains an invalid gene symbol RB:
        const url = `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=mixed_pipseq_2017&case_set_id=mixed_pipseq_2017_sequenced&clinicallist=NUM_SAMPLES_PER_PATIENT&data_priority=0&gene_list=RB&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=mixed_pipseq_2017_mutations&show_samples=false&tab_index=tab_visualize`;
        await goToUrlAndSetLocalStorage(url);

        // check alert message
        await getElement('[data-test="invalidQueryAlert"]', { timeout: 60000 });
        const text = (await getText('[data-test="invalidQueryAlert"]')).trim();
        assert.equal(
            text,
            'Your query has invalid or out-dated gene symbols. Please correct below.'
        );
    });

    it('show result view page after correct the invalid gene', async () => {
        // correct to valid gene symbol RB1
        await (await getElement('[data-test="geneSet"]')).setValue('RB1');

        await $('[data-test="queryButton"]').waitForEnabled();

        await clickElement('[data-test="queryButton"]', { timeout: 15000 });

        await (await getElement('#modifyQueryBtn')).waitForExist({
            timeout: 6000,
        });
        await waitForOncoprint();
    });
});
