const {
    getNthOncoprintTrackOptionsElements,
    waitForOncoprint,
    getElementByTestHandle,
    goToUrlAndSetLocalStorage,
    setInputText,
    waitForNumberOfStudyCheckboxes,
    getOncoprintGroupHeaderOptionsElements: getGroupHeaderOptionsElements,
    checkOncoprintElement,
    setDropdownOpen,
    clickElement,
    getElement,
    waitForElementDisplayed,
} = require('../../../shared/specUtils_Async');
const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('oncoprint screenshot tests', () => {
    it('ov_tcga_pub with germline mutations', async () => {
        const url = `${CBIOPORTAL_URL}/results/oncoprint?cancer_study_list=ov_tcga_pub&cancer_study_id=ov_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations&Z_SCORE_THRESHOLD=2.0&case_set_id=ov_tcga_pub_3way_complete&gene_list=BRCA1%20BRCA2&gene_set_choice=user-defined-list`;
        await goToUrlAndSetLocalStorage(url);
        await browser.pause(2000);
        await waitForOncoprint();
        await browser.pause(100);
        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('coadread_tcga_pub with clinical and heatmap tracks', async () => {
        const url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=coadread_tcga_pub_rna_seq_mrna_median_Zscores&show_samples=false&clinicallist=0%2C2%2CMETHYLATION_SUBTYPE&heatmap_track_groups=coadread_tcga_pub_rna_seq_mrna_median_Zscores%2CKRAS%2CNRAS%2CBRAF&`;
        await goToUrlAndSetLocalStorage(url);
        await browser.pause(2000);
        await waitForOncoprint();
        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('acc_tcga with clinical and heatmap tracks', async () => {
        const url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=acc_tcga&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=1&data_priority=0&case_set_id=acc_tcga_all&gene_list=SOX9%20RAN%20TNK2%20EP300%20PXN%20NCOA2%20AR%20NRIP1%20NCOR1%20NCOR2&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=acc_tcga_rna_seq_v2_mrna_median_Zscores&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=acc_tcga_rppa_Zscores&show_samples=false&clinicallist=0%2C1%2CMETASTATIC_DX_CONFIRMED_BY&heatmap_track_groups=acc_tcga_rna_seq_v2_mrna_median_Zscores%2CSOX9%2CRAN%2CTNK2%2CEP300%2CPXN%2CNCOA2%2CAR%2CNRIP1%2CNCOR1%2CNCOR2`;
        await goToUrlAndSetLocalStorage(url);
        await browser.pause(2000);
        await waitForOncoprint();
        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('blca_tcga with clinical and heatmap tracks', async () => {
        const url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=blca_tcga_pub&Z_SCORE_THRESHOLD=1&RPPA_SCORE_THRESHOLD=1&data_priority=0&case_set_id=blca_tcga_pub_all&gene_list=SOX9%20RAN%20TNK2%20EP300%20PXN%20NCOA2%20AR%20NRIP1%20NCOR1%20NCOR2&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=blca_tcga_pub_rna_seq_mrna_median_Zscores&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=blca_tcga_pub_rppa_Zscores&show_samples=false&heatmap_track_groups=blca_tcga_pub_rna_seq_mrna_median_Zscores%2CSOX9%2CRAN%2CTNK2%2CEP300%2CPXN%2CNCOA2%2CAR%2CNRIP1%2CNCOR1%2CNCOR2&clinicallist=CANCER_TYPE_DETAILED%2CMETASTATIC_SITE_OTHER%2CNEW_TUMOR_EVENT_AFTER_INITIAL_TREATMENT`;
        await goToUrlAndSetLocalStorage(url);
        await waitForOncoprint();
        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('hcc_inserm_fr_2015 with genes including TERT - it should show orange promoter mutations in TERT', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/index.do?cancer_study_id=hcc_inserm_fr_2015&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=hcc_inserm_fr_2015_sequenced&gene_list=SOX9%2520RAN%2520TNK2%2520EP300%2520PXN%2520NCOA2%2520AR%2520NRIP1%2520NCOR1%2520NCOR2%2520TERT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=hcc_inserm_fr_2015_mutations`
        );
        await waitForOncoprint();
        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('msk_impact_2017 with SOS1 - SOS1 should be not sequenced', async () => {
        const url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations`;
        await goToUrlAndSetLocalStorage(url);
        await browser.pause(2000);
        await waitForOncoprint();
        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('msk_impact_2017 with ALK and SOS1 - SOS1 should be not sequenced', async () => {
        const url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=ALK%2520SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations`;
        await goToUrlAndSetLocalStorage(url);
        await browser.pause(2000);
        await waitForOncoprint();
        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('msk_impact_2017 with SOS1 with CNA profile - SOS1 should not be sequenced', async () => {
        const url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`;
        await goToUrlAndSetLocalStorage(url);
        await browser.pause(2000);
        await waitForOncoprint();
        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('brca_tcga_pub with KRAS NRAS BRAF and methylation heatmap tracks', async () => {
        const url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=brca_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=brca_tcga_pub_cnaseq&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_pub_gistic&show_samples=false&heatmap_track_groups=brca_tcga_pub_methylation_hm27%2CKRAS%2CNRAS%2CBRAF%2CTP53%2CBRCA1%2CBRCA2`;
        await goToUrlAndSetLocalStorage(url);
        await waitForOncoprint();
        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('profiled in tracks in msk impact with 3 not profiled genes', async () => {
        const url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=msk_impact_2017_cnaseq&gene_list=AKR1C1%2520AKR1C2%2520AKR1C4&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`;
        await goToUrlAndSetLocalStorage(url);
        await waitForOncoprint();
        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('profiled in tracks in a combined study', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?session_id=5c38e4c0e4b05228701fb0c9&show_samples=false`
        );
        await waitForOncoprint();
        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('profiled in tracks in multiple study with SOS1', async () => {
        const url = `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=msk_impact_2017%2Cbrca_tcga_pub&case_set_id=all&data_priority=0&gene_list=SOS1&geneset_list=%20&tab_index=tab_visualize`;
        await goToUrlAndSetLocalStorage(url);
        await waitForOncoprint();
        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('multiple tracks with same gene', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=acc_tcga_pan_can_atlas_2018&case_set_id=acc_tcga_pan_can_atlas_2018_cnaseq&data_priority=0&gene_list=EGFR%253AAMP%253BEGFR%253AMUT%253B%2520PTEN%253B%2520EGFR%2520EGFR&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_pan_can_atlas_2018_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_pan_can_atlas_2018_mutations&tab_index=tab_visualize`
        );
        await waitForOncoprint();
        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('removes top treatment track successfully', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=ccle_broad_2019&case_set_id=ccle_broad_2019_cnaseq&data_priority=0&gene_list=TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=ccle_broad_2019_cna&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ccle_broad_2019_mutations&profileFilter=0&tab_index=tab_visualize&heatmap_track_groups=ccle_broad_2019_CCLE_drug_treatment_IC50%2CAfatinib-2%2CAKTinhibitorVIII-1&treatment_list=Afatinib-2%3BAKTinhibitorVIII-1`
        );
        await waitForOncoprint();

        const elements = await getNthOncoprintTrackOptionsElements(2);
        await setDropdownOpen(
            true,
            elements.button_selector,
            elements.dropdown_selector,
            'Couldnt open top treatment track options'
        );
        await clickElement(elements.dropdown_selector + ' li:nth-child(3)');
        await waitForOncoprint();

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
    it('coadread_tcga_pub with column gaps inserted based on clinical track', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&clinicallist=CANCER_TYPE_DETAILED&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
        );
        await browser.pause(2000);
        await waitForOncoprint();

        const cancerTypeDetailedElements = await getNthOncoprintTrackOptionsElements(
            1
        );
        await setDropdownOpen(
            true,
            cancerTypeDetailedElements.button_selector,
            cancerTypeDetailedElements.dropdown_selector,
            'Failed to open cancer type detailed track menu'
        );
        await clickElement(
            `${cancerTypeDetailedElements.dropdown_selector} li:nth-child(10)`
        ); // Click "show gaps"
        await browser.pause(100); // give time to sort and insert gaps

        // open minimap
        await (
            await getElement('[data-test="ShowMinimapButton"]')
        ).waitForExist();
        await clickElement('[data-test="ShowMinimapButton"]');

        // zoom to fit
        await waitForElementDisplayed('.oncoprint-zoomtofit-btn');
        await clickElement('.oncoprint-zoomtofit-btn');
        await browser.pause(100); // give time to rezoom

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
});

describe('track group headers', () => {
    beforeEach(async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&heatmap_track_groups=coadread_tcga_pub_rna_seq_mrna_median_Zscores%2CKRAS%2CNRAS%2CBRAF%3Bcoadread_tcga_pub_methylation_hm27%2CKRAS%2CNRAS%2CBRAF&show_samples=false`
        );

        await waitForOncoprint();

        // Cluster the mrna heatmap group
        const mrnaElements = await getGroupHeaderOptionsElements(2);
        await setDropdownOpen(
            true,
            mrnaElements.button_selector,
            mrnaElements.dropdown_selector + ' li:nth-child(1)'
        );
        await clickElement(mrnaElements.dropdown_selector + ' li:nth-child(1)'); // Click Cluster
        await browser.pause(500); // give it time to sort
    });

    it('oncoprint should cluster heatmap group correctly', async () => {
        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint should delete clustered heatmap group correctly', async () => {
        // Remove the mrna heatmap group, leaving the methylation group and everything sorted by data
        const mrnaElements = await getGroupHeaderOptionsElements(2);
        await setDropdownOpen(
            true,
            mrnaElements.button_selector,
            mrnaElements.dropdown_selector + ' li:nth-child(4)',
            'could not open mrna group options dropdown'
        );

        await clickElement(mrnaElements.dropdown_selector + ' li:nth-child(4)'); // Click Delete
        await waitForOncoprint();

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint should delete non-clustered heatmap group correctly', async () => {
        // Remove the methylation group, leaving the mrna group clustered
        const methylElements = await getGroupHeaderOptionsElements(3);
        await setDropdownOpen(
            true,
            methylElements.button_selector,
            methylElements.dropdown_selector + ' li:nth-child(4)',
            'could not open mrna group options dropdown'
        );
        await clickElement(
            methylElements.dropdown_selector + ' li:nth-child(4)'
        ); // Click Delete
        await waitForOncoprint();

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint should return to non-clustered state correctly', async () => {
        // Cluster the mrna heatmap group
        const mrnaElements = await getGroupHeaderOptionsElements(2);
        await setDropdownOpen(
            true,
            mrnaElements.button_selector,
            mrnaElements.dropdown_selector + ' li:nth-child(2)'
        );
        await clickElement(mrnaElements.dropdown_selector + ' li:nth-child(2)'); // Click Don't Cluster
        await browser.pause(2000); // give it time to sort
        await (await getElement('body')).moveTo(); // move mouse out of the way
        const res = await checkOncoprintElement(undefined, [
            { width: 2000, height: 1000 },
        ]);
        assertScreenShotMatch(res);
    });
});

describe('sorting', () => {
    const eventsPerSampleRadioButton =
        '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="0"]';
    const eventsPerPatientRadioButton =
        '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="1"]';

    it('oncoprint should sort patients correctly in coadread_tcga_pub', async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        const inputSelector = 'div[data-test=study-search] input[type="text"]';

        await getElement(inputSelector, { timeout: 10000 });

        await setInputText(inputSelector, 'colorectal tcga nature');

        await waitForNumberOfStudyCheckboxes(1);

        const checkBox = await getElement('[data-test="StudySelect"]');

        await checkBox.waitForExist({ timeout: 10000 });

        await clickElement('[data-test="StudySelect"] input');

        await (await getElementByTestHandle('queryByGeneButton')).click();

        await browser.pause(1000);

        // query KRAS NRAS BRAF
        await setInputText('[data-test="geneSet"]', 'KRAS NRAS BRAF');

        await (await getElement('[data-test="queryButton"]')).waitForEnabled({
            timeout: 30000,
        });

        await clickElement('[data-test="queryButton"]');

        await waitForOncoprint();

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint should sort samples correctly in coadread_tcga_pub', async () => {
        await setDropdownOpen(
            true,
            '.oncoprintContainer .oncoprint__controls #viewDropdownButton',
            eventsPerSampleRadioButton
        );
        await clickElement(eventsPerSampleRadioButton); // go to sample mode

        await waitForOncoprint();

        await setDropdownOpen(
            false,
            '.oncoprintContainer .oncoprint__controls #viewDropdownButton',
            eventsPerSampleRadioButton
        );

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint should sort patients correctly in gbm_tcga_pub', async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        const inputSelector = 'div[data-test=study-search] input[type="text"]';

        await getElement(inputSelector, { timeout: 10000 });

        await setInputText(inputSelector, 'glio tcga nature 2008');

        await waitForNumberOfStudyCheckboxes(1); // should only be one element

        const checkBox = await getElement('[data-test="StudySelect"]', {
            timeout: 6000,
        });

        await clickElement('[data-test="StudySelect"] input');

        await (await getElementByTestHandle('queryByGeneButton')).click();

        await setInputText('[data-test="geneSet"]', 'TP53 MDM2 MDM4');

        await (await getElement('[data-test="queryButton"]')).waitForEnabled({
            timeout: 30000,
        });

        await clickElement('[data-test="queryButton"]');

        await waitForOncoprint();

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint should sort samples correctly in gbm_tcga_pub', async () => {
        await setDropdownOpen(
            true,
            '.oncoprintContainer .oncoprint__controls #viewDropdownButton',
            eventsPerSampleRadioButton
        );
        await clickElement(eventsPerSampleRadioButton); // go to sample mode

        await waitForOncoprint();

        await setDropdownOpen(
            false,
            '.oncoprintContainer .oncoprint__controls #viewDropdownButton',
            eventsPerSampleRadioButton
        );

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - initial patient order', async () => {
        await goToUrlAndSetLocalStorage(
            CBIOPORTAL_URL +
                '/index.do?cancer_study_id=gbm_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=gbm_tcga_pub_cnaseq&gene_list=TP53%20MDM2%20MDM4&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_pub_cna_rae&clinicallist=FRACTION_GENOME_ALTERED%2CDFS_MONTHS%2CKARNOFSKY_PERFORMANCE_SCORE%2COS_STATUS&heatmap_track_groups=gbm_tcga_pub_mrna_median_Zscores%2CTP53%2CMDM2%2CMDM4%3Bgbm_tcga_pub_mrna_merged_median_Zscores%2CTP53%2CMDM2%2CMDM4'
        );
        await waitForOncoprint();
        // first get rid of the Profiled track
        const profiledElements = await getNthOncoprintTrackOptionsElements(5);
        await (await getElement(profiledElements.button_selector)).moveTo();
        await clickElement(profiledElements.button_selector);
        await waitForElementDisplayed(profiledElements.dropdown_selector, {
            timeout: 1000,
        }); // wait for menu to appear
        await clickElement(
            profiledElements.dropdown_selector + ' li:nth-child(3)'
        ); // Click Remove Track
        await waitForOncoprint();

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - initial sample order', async () => {
        await setDropdownOpen(
            true,
            '.oncoprintContainer .oncoprint__controls #viewDropdownButton',
            eventsPerSampleRadioButton
        );
        await clickElement(eventsPerSampleRadioButton); // go to sample mode

        await waitForOncoprint();

        await waitForElementDisplayed(eventsPerPatientRadioButton, {
            timeout: 2000,
        });
        await setDropdownOpen(
            false,
            '.oncoprintContainer .oncoprint__controls #viewDropdownButton',
            eventsPerSampleRadioButton
        );

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted patient order 1', async () => {
        await setDropdownOpen(
            true,
            '.oncoprintContainer .oncoprint__controls #viewDropdownButton',
            eventsPerPatientRadioButton
        );
        await clickElement(eventsPerPatientRadioButton); // go to patient mode

        await waitForOncoprint();

        const overallSurvivalElements = await getNthOncoprintTrackOptionsElements(
            4
        );
        await overallSurvivalElements.button.click();
        await waitForElementDisplayed(
            overallSurvivalElements.dropdown_selector,
            {
                timeout: 1000,
            }
        ); // wait for menu to appear
        await (await overallSurvivalElements.dropdown.$('li=Sort a-Z')).click(); // Click sort a-Z

        await browser.pause(100); // give time to sort

        await waitForElementDisplayed(eventsPerPatientRadioButton, {
            timeout: 2000,
        });
        await setDropdownOpen(
            false,
            '.oncoprintContainer .oncoprint__controls #viewDropdownButton',
            eventsPerPatientRadioButton
        );

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted patient order 2', async () => {
        const overallSurvivalElements = await getNthOncoprintTrackOptionsElements(
            4
        );
        await setDropdownOpen(
            true,
            overallSurvivalElements.button_selector,
            overallSurvivalElements.dropdown_selector,
            'couldnt show overall survival dropdown'
        );
        await (await overallSurvivalElements.dropdown.$('li=Sort Z-a')).click(); // Click sort Z-a
        await browser.pause(100); // give time to sort

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted patient order 3', async () => {
        const karnofskyPerformanceElements = await getNthOncoprintTrackOptionsElements(
            3
        );
        await karnofskyPerformanceElements.button.click(); // open Karnofsky Performance clinical track menu
        await waitForElementDisplayed(
            karnofskyPerformanceElements.dropdown_selector,
            {
                timeout: 1000,
            }
        ); // wait for menu to appear
        await (
            await karnofskyPerformanceElements.dropdown.$('li=Sort Z-a')
        ).click(); // Click sort Z-a
        await browser.pause(100); // give time to sort

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted patient order 4', async () => {
        const karnofskyPerformanceElements = await getNthOncoprintTrackOptionsElements(
            3
        );
        await setDropdownOpen(
            true,
            karnofskyPerformanceElements.button_selector,
            karnofskyPerformanceElements.dropdown_selector,
            'couldnt show karnofsky performance dropdown'
        );
        await (
            await karnofskyPerformanceElements.dropdown.$('li=Sort a-Z')
        ).click(); // Click sort a-Z
        await browser.pause(100); // give time to sort

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted sample order 1', async () => {
        await setDropdownOpen(
            true,
            '.oncoprintContainer .oncoprint__controls #viewDropdownButton',
            eventsPerSampleRadioButton
        );
        await clickElement(eventsPerSampleRadioButton); // go to sample mode

        await waitForOncoprint();

        await setDropdownOpen(
            false,
            '.oncoprintContainer .oncoprint__controls #viewDropdownButton',
            eventsPerSampleRadioButton
        );

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted sample order 2', async () => {
        const diseaseFreeElements = await getNthOncoprintTrackOptionsElements(
            2
        );
        await diseaseFreeElements.button.click(); // open Disease Free (months) clinical track menu
        await waitForElementDisplayed(diseaseFreeElements.dropdown_selector, {
            timeout: 1000,
        }); // wait for menu to appear
        await (await diseaseFreeElements.dropdown.$('li=Sort a-Z')).click(); // Click sort a-Z
        await browser.pause(100); // give time to sort

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted sample order 3', async () => {
        const diseaseFreeElements = await getNthOncoprintTrackOptionsElements(
            2
        );
        await setDropdownOpen(
            true,
            diseaseFreeElements.button_selector,
            diseaseFreeElements.dropdown_selector,
            'couldnt show disease free dropdown'
        );
        await (await diseaseFreeElements.dropdown.$('li=Sort Z-a')).click(); // Click sort Z-a
        await browser.pause(100); // give time to sort

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted sample order 4', async () => {
        const fractionGenomeAlteredElements = await getNthOncoprintTrackOptionsElements(
            1
        );
        await fractionGenomeAlteredElements.button.click(); // open Fraction Genome Altered clinical track menu
        await waitForElementDisplayed(
            fractionGenomeAlteredElements.dropdown_selector,
            {
                timeout: 1000,
            }
        ); // wait for menu to appear
        await (
            await fractionGenomeAlteredElements.dropdown.$('li=Sort Z-a')
        ).click(); // Click sort Z-a
        await browser.pause(100); // give time to sort

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted sample order 5', async () => {
        const fractionGenomeAlteredElements = await getNthOncoprintTrackOptionsElements(
            1
        );
        await setDropdownOpen(
            true,
            fractionGenomeAlteredElements.button_selector,
            fractionGenomeAlteredElements.dropdown_selector,
            'couldnt show fraction genome altered dropdown'
        );
        await (
            await fractionGenomeAlteredElements.dropdown.$('li=Sort a-Z')
        ).click(); // Click sort a-Z
        await browser.pause(100); // give time to sort

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with clinical tracks sorted - sorted sample order 6', async () => {
        // Sort TP53 heatmap track
        const TP53HeatmapElements = await getNthOncoprintTrackOptionsElements(
            8
        );
        await TP53HeatmapElements.button.click(); // open Fraction Genome Altered clinical track menu
        await waitForElementDisplayed(TP53HeatmapElements.dropdown_selector, {
            timeout: 1000,
        }); // wait for menu to appear

        const heatmapDropdown = await (
            await getElement(TP53HeatmapElements.dropdown_selector)
        ).$('li=Sort Z-a');
        await heatmapDropdown.scrollIntoView();
        await heatmapDropdown.click(); // Click sort Z-a
        await browser.pause(100); // give time to sort

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with heatmap tracks sorted - sorted sample order 1', async () => {
        await goToUrlAndSetLocalStorage(
            CBIOPORTAL_URL +
                '/index.do?cancer_study_id=gbm_tcga_pub&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=gbm_tcga_pub_cnaseq&gene_list=TP53%2520MDM2%2520MDM4&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_pub_cna_rae&clinicallist=FRACTION_GENOME_ALTERED%2CDFS_MONTHS%2CKARNOFSKY_PERFORMANCE_SCORE%2COS_STATUS&heatmap_track_groups=gbm_tcga_pub_mrna_median_Zscores%2CTP53%2CMDM2%2CMDM4%3Bgbm_tcga_pub_mrna_merged_median_Zscores%2CTP53%2CMDM2%2CMDM4&show_samples=true'
        );
        await browser.pause(2000);

        await waitForOncoprint();

        // Sort heatmap tracks
        const TP53HeatmapElements = await getNthOncoprintTrackOptionsElements(
            8
        );
        await (await getElement(TP53HeatmapElements.button_selector)).moveTo();
        await clickElement(TP53HeatmapElements.button_selector); // open track menu
        await (
            await getElement(TP53HeatmapElements.dropdown_selector)
        ).moveTo();
        await waitForElementDisplayed(TP53HeatmapElements.dropdown_selector, {
            timeout: 1000,
        }); // wait for menu to appear
        await (
            await (await getElement(TP53HeatmapElements.dropdown_selector)).$(
                'li=Sort Z-a'
            )
        ).click(); // Click sort Z-a
        await browser.pause(100); // give time to sort

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with heatmap tracks sorted - sorted sample order 2', async () => {
        const TP53HeatmapElements = await getNthOncoprintTrackOptionsElements(
            8
        );
        await setDropdownOpen(
            true,
            TP53HeatmapElements.button_selector,
            TP53HeatmapElements.dropdown_selector,
            'couldnt show TP53 heatmap dropdown'
        );
        await (await TP53HeatmapElements.dropdown.$('li=Sort a-Z')).click(); // Click sort a-Z
        await browser.pause(100); // give time to sort

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with heatmap tracks sorted - sorted sample order 3', async () => {
        const TP53HeatmapElements = await getNthOncoprintTrackOptionsElements(
            8
        );
        await setDropdownOpen(
            false,
            TP53HeatmapElements.button_selector,
            TP53HeatmapElements.dropdown_selector,
            'couldnt hide TP53 heatmap dropdown'
        );

        const MDM4HeatmapElements = await getNthOncoprintTrackOptionsElements(
            13
        );
        await MDM4HeatmapElements.button.click(); // open track menu
        await waitForElementDisplayed(MDM4HeatmapElements.dropdown_selector, {
            timeout: 1000,
        }); // wait for menu to appear
        await (await MDM4HeatmapElements.dropdown.$('li=Sort a-Z')).click(); // Click sort a-Z
        await browser.pause(100); // give time to sort

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with heatmap tracks sorted - sorted sample order 4', async () => {
        const MDM4HeatmapElements = await getNthOncoprintTrackOptionsElements(
            13
        );
        await setDropdownOpen(
            true,
            MDM4HeatmapElements.button_selector,
            MDM4HeatmapElements.dropdown_selector,
            'couldnt show MDM4 heatmap dropdown'
        );
        await (await MDM4HeatmapElements.dropdown.$('li=Sort Z-a')).click(); // Click sort Z-a
        await browser.pause(100); // give time to sort

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with heatmap tracks sorted - sorted sample order 5', async () => {
        const TP53HeatmapElements = await getNthOncoprintTrackOptionsElements(
            8
        );
        await TP53HeatmapElements.button.click(); // open track menu
        await waitForElementDisplayed(TP53HeatmapElements.dropdown_selector, {
            timeout: 1000,
        }); // wait for menu to appear
        await (
            await TP53HeatmapElements.dropdown.$(`li=Don't sort track`)
        ).click(); // Click Don't sort
        await browser.pause(100); // give time to sort

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('oncoprint sorts through a flow with heatmap tracks sorted - sorted patient order 1', async () => {
        await setDropdownOpen(
            true,
            '.oncoprintContainer .oncoprint__controls #viewDropdownButton',
            eventsPerPatientRadioButton
        );
        await clickElement(eventsPerPatientRadioButton); // go to patient mode
        await waitForOncoprint();

        await setDropdownOpen(
            false,
            '.oncoprintContainer .oncoprint__controls #viewDropdownButton',
            eventsPerPatientRadioButton
        );

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
});
