const {
    waitForOncoprint,
    setSettingsMenuOpen,
    checkElementWithMouseDisabled,
    goToUrlAndSetLocalStorage,
    waitForNetworkQuiet,
    sessionServiceIsEnabled,
    getElement,
    COEXPRESSION_TIMEOUT,
    clickElement,
    waitForElementDisplayed,
} = require('../../../shared/specUtils_Async');

const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

async function waitForAndCheckPlotsTab() {
    await waitForElementDisplayed('div[data-test="PlotsTabPlotDiv"]', {
        timeout: 100000,
    });
    const res = await browser.checkElement(
        'div[data-test="PlotsTabEntireDiv"]'
    );
    assertScreenShotMatch(res);
}

function runResultsTestSuite(prefix, options = {}) {
    it(`${prefix} render the oncoprint`, async function() {
        await waitForOncoprint();
        //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 }); // move mouse out of the way
        await browser.pause(100);
        const res = await checkElementWithMouseDisabled('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it(`${prefix} igv_tab tab`, async function() {
        await clickElement('a.tabAnchor_cnSegments');
        await (await getElement('.igv-column-container')).waitForDisplayed();
        const res = await checkElementWithMouseDisabled('.pillTabs');
        assertScreenShotMatch(res);
    });

    it(`${prefix} cancer type summary`, async function() {
        await clickElement('a.tabAnchor_cancerTypesSummary');
        await waitForElementDisplayed('[data-test="cancerTypeSummaryChart"]', {
            timeout: 10000,
        });
        await (
            await getElement('[data-test="cancerTypeSummaryWrapper"]')
        ).waitForExist();
        const res = await browser.checkElement(
            '[data-test="cancerTypeSummaryWrapper"]'
        );
        assertScreenShotMatch(res);
    });

    it(`${prefix} mutex tab`, async function() {
        await clickElement('a.tabAnchor_mutualExclusivity');
        const res = await browser.checkElement(
            '[data-test="mutualExclusivityTabDiv"]'
        );
        assertScreenShotMatch(res);
    });

    it(`${prefix} plots tab`, async function() {
        await clickElement('a.tabAnchor_plots');
        await waitForAndCheckPlotsTab();
    });

    it(`${prefix} mutation tab`, async function() {
        await clickElement('a.tabAnchor_mutations');
        await waitForElementDisplayed('div[data-test="LollipopPlot"]', {
            timeout: 20000,
        });
        const res = await browser.checkElement(
            '[data-test="mutationsTabDiv"]',
            ''
        ); // hide these things because the timing of data loading makes this test so flaky
        assertScreenShotMatch(res);
    });

    it(`${prefix} coexpression tab`, async function() {
        await clickElement('a.tabAnchor_coexpression');
        await waitForElementDisplayed('div[data-test="CoExpressionPlot"]', {
            timeout: COEXPRESSION_TIMEOUT,
        });
        const res = await browser.checkElement(
            '[data-test="coExpressionTabDiv"]'
        );
        assertScreenShotMatch(res);
    });

    it(`${prefix} comparison tab overlap`, async function() {
        await clickElement('a.tabAnchor_comparison');
        await waitForElementDisplayed(
            'div[data-test="ComparisonPageOverlapTabContent"]'
        );
        const res = await checkElementWithMouseDisabled(
            'div[data-test="ComparisonTabDiv"]'
        );
        assertScreenShotMatch(res);
    });

    it(`${prefix} comparison tab clinical`, async function() {
        await clickElement('.comparisonTabSubTabs .tabAnchor_clinical');
        await waitForElementDisplayed(
            'div[data-test="ComparisonPageClinicalTabDiv"]'
        );
        const res = await checkElementWithMouseDisabled(
            'div[data-test="ComparisonTabDiv"]'
        );
        assertScreenShotMatch(res);
    });

    it(`${prefix} comparison tab alteration enrichments sample mode`, async function() {
        await clickElement('.comparisonTabSubTabs .tabAnchor_alterations');
        await waitForElementDisplayed(
            'div[data-test="GroupComparisonAlterationEnrichments"]'
        );
        const res = await browser.checkElement(
            'div[data-test="ComparisonTabDiv"]',
            '',
            {
                hide: ['.qtip'],
            }
        );
        assertScreenShotMatch(res);
    });

    it(`${prefix} comparison tab alteration enrichments patient mode`, async function() {
        await browser.execute(function() {
            comparisonTab.store.setUsePatientLevelEnrichments(true);
        });
        await waitForElementDisplayed(
            'div[data-test="GroupComparisonAlterationEnrichments"]'
        );
        const res = await browser.checkElement(
            'div[data-test="ComparisonTabDiv"]',
            '',
            {
                hide: ['.qtip'],
            }
        );
        assertScreenShotMatch(res);
    });

    it(`${prefix} comparison tab mrna enrichments`, async function() {
        await clickElement('.comparisonTabSubTabs .tabAnchor_mrna');
        await (
            await getElement('div[data-test="GroupComparisonMRNAEnrichments"]')
        ).waitForDisplayed();
        await clickElement(options.mrnaEnrichmentsRowSelector || 'b=ETV5');
        //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
        await waitForElementDisplayed('div[data-test="MiniBoxPlot"]');
        const res = await browser.checkElement(
            'div[data-test="ComparisonTabDiv"]'
        );
        assertScreenShotMatch(res);
    });

    it(`${prefix} survival tab`, async function() {
        await clickElement('.comparisonTabSubTabs a.tabAnchor_survival');
        await waitForElementDisplayed(
            '[data-test="ComparisonPageSurvivalTabDiv"] svg',
            { timeout: 10000 }
        );
        const res = await checkElementWithMouseDisabled(
            '[data-test="ComparisonTabDiv"]'
        );
        assertScreenShotMatch(res);
    });

    it(`${prefix} pathwaymapper tab`, async function() {
        // go to pathways tab
        await waitForElementDisplayed('a.tabAnchor_pathways');
        await clickElement('a.tabAnchor_pathways');

        await (await getElement('#cy')).waitForDisplayed({ timeout: 10000 });

        await waitForNetworkQuiet(5000);

        const res = await browser.checkElement(
            '[data-test="pathwayMapperTabDiv"]',
            '',
            { hide: ['.qtip', '.__react_component_tooltip', '.rc-tooltip'] }
        );

        assertScreenShotMatch(res);
    });

    it(`${prefix} data_download tab`, async function() {
        await clickElement('a.tabAnchor_download');
        //  browser.pause(1000);
        await getElement(`[data-test='downloadTabDiv']`, { timeout: 20000 });

        const res = await browser.checkElement(`[data-test="downloadTabDiv"]`);

        assertScreenShotMatch(res);
    });
}

describe('result page screenshot tests', function() {
    before(async function() {
        const url = `${CBIOPORTAL_URL}/index.do?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit&show_samples=false&`;
        await goToUrlAndSetLocalStorage(url);
        await waitForOncoprint();
    });

    runResultsTestSuite('no session');
});

describe('download tab screenshot tests', async () => {
    it('download tab - msk_impact_2017 with ALK and SOS1 - SOS1 should be not sequenced', async function() {
        const url = `${CBIOPORTAL_URL}/index.do?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_all&gene_list=ALK%2520SOS1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`;
        await goToUrlAndSetLocalStorage(url);
        await getElement('a.tabAnchor_download', { timeout: 10000 });
        await clickElement('a.tabAnchor_download');
        await getElement(
            '[data-test="dataDownloadGeneAlterationTable"] tr > td > svg',
            { timeout: 20000 }
        );
        await getElement('[data-test="downloadTabDiv"]', { timeout: 10000 });
        const res = await browser.checkElement('[data-test="downloadTabDiv"]');
        assertScreenShotMatch(res);
    });

    it('download tab - nsclc_tcga_broad_2016 with TP53', async function() {
        const url = `${CBIOPORTAL_URL}/results/download?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=nsclc_tcga_broad_2016&case_set_id=nsclc_tcga_broad_2016_cnaseq&data_priority=0&gene_list=TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations&tab_index=tab_visualize`;
        await goToUrlAndSetLocalStorage(url);
        await getElement(
            '[data-test="dataDownloadGeneAlterationTable"] tr > td > svg',
            { timeout: 20000 }
        );
        await getElement('[data-test="downloadTabDiv"]', { timeout: 5000 });
        const res = await browser.checkElement('[data-test="downloadTabDiv"]');
        assertScreenShotMatch(res);
    });

    it('download tab - nsclc_tcga_broad_2016 with CDKN2A MDM2 and merged track MDM4 TP53', async () => {
        const url = `${CBIOPORTAL_URL}/results/download?Action=Submit&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna&Z_SCORE_THRESHOLD=2.0&tab_index=tab_visualize&data_priority=0&case_set_id=nsclc_tcga_broad_2016_cnaseq&gene_list=CDKN2A%2520MDM2%2520%255B%2522MERGED%2522%2520MDM4%2520TP53%255D&RPPA_SCORE_THRESHOLD=2.0&cancer_study_list=nsclc_tcga_broad_2016&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations`;
        await goToUrlAndSetLocalStorage(url);
        await getElement(
            '[data-test="dataDownloadGeneAlterationTable"] tr > td > svg',
            { timeout: 20000 }
        );
        await getElement('[data-test="downloadTabDiv"]', { timeout: 5000 });
        const res = await browser.checkElement('[data-test="downloadTabDiv"]');
        assertScreenShotMatch(res);
    });

    it('download tab - nsclc_tcga_broad_2016 for query EGFR: MUT=T790M AMP', async () => {
        const url = `${CBIOPORTAL_URL}/results/download?Action=Submit&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna&Z_SCORE_THRESHOLD=2.0&tab_index=tab_visualize&data_priority=0&case_set_id=nsclc_tcga_broad_2016_cnaseq&gene_list=EGFR%253A%2520MUT%253DT790M%2520AMP&RPPA_SCORE_THRESHOLD=2.0&cancer_study_list=nsclc_tcga_broad_2016&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations`;
        await goToUrlAndSetLocalStorage(url);
        await getElement(
            '[data-test="dataDownloadGeneAlterationTable"] tr > td > svg',
            { timeout: 20000 }
        );
        await getElement('[data-test="downloadTabDiv"]', { timeout: 5000 });
        const res = await browser.checkElement('[data-test="downloadTabDiv"]');
        assertScreenShotMatch(res);
    });

    it('download tab - nsclc_tcga_broad_2016 with overlapping TP53', async function() {
        const url = `${CBIOPORTAL_URL}/results/download?Action=Submit&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna&Z_SCORE_THRESHOLD=2.0&tab_index=tab_visualize&data_priority=0&case_set_id=nsclc_tcga_broad_2016_cnaseq&gene_list=TP53%250ATP53%253A%2520AMP%250ATP53%253A%2520MUT&RPPA_SCORE_THRESHOLD=2.0&cancer_study_list=nsclc_tcga_broad_2016&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations`;
        await goToUrlAndSetLocalStorage(url);
        await getElement(
            '[data-test="dataDownloadGeneAlterationTable"] tr > td > svg',
            { timeout: 20000 }
        );

        await getElement('[data-test="downloadTabDiv"]', { timeout: 5000 });

        const res = await browser.checkElement('[data-test="downloadTabDiv"]');
        assertScreenShotMatch(res);
    });
});

describe('patient view page screenshot test', function() {
    it('patient view lgg_ucsf_2014 P04', async function() {
        const url = `${CBIOPORTAL_URL}/patient?studyId=lgg_ucsf_2014&caseId=P04`;
        await goToUrlAndSetLocalStorage(url);

        // find oncokb image
        const oncokbIndicator = await getElement(
            '[data-test="oncogenic-icon-image"]'
        );
        await oncokbIndicator.waitForExist({ timeout: 30000 });
        // find vaf plot
        const vafPlot = await getElement('.vafPlotThumbnail');
        await vafPlot.waitForExist({ timeout: 30000 });

        const res = await browser.checkElement('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('patient view with 0 mutations msk_impact_2017 P-0000053-T01-IM3', async function() {
        const url = `${CBIOPORTAL_URL}/patient?sampleId=P-0000053-T01-IM3&studyId=msk_impact_2017`;
        await goToUrlAndSetLocalStorage(url);

        // should show 0 mutations
        await (await getElement('span*=0 Mutations')).waitForExist();

        // should show 21.6% copy number altered in genomic overview
        await (await getElement('div*=21.6%')).waitForExist();

        // take screenshot
        const res = await browser.checkElement('#mainColumn', '', {
            hide: ['.qtip'],
        });
        assertScreenShotMatch(res);
    });

    it('patient view pathways tab msk_impact_2017 P-0000377', async function() {
        const url = `${CBIOPORTAL_URL}/patient/pathways?studyId=msk_impact_2017&caseId=P-0000377`;
        await goToUrlAndSetLocalStorage(url);

        await (await getElement('#cy')).waitForDisplayed({ timeout: 10000 });
        const res = await browser.checkElement(
            '[data-test="pathwayMapperTabDiv"]',
            '',
            {
                hide: ['.qtip', '.__react_component_tooltip', '.rc-tooltip'],
            }
        );

        assertScreenShotMatch(res);
    });

    it('patient view pathways tab msk_impact_2017 P-0000377-T03-IM3', async function() {
        const url = `${CBIOPORTAL_URL}/patient/pathways?studyId=msk_impact_2017&sampleId=P-0000377-T03-IM3`;
        await goToUrlAndSetLocalStorage(url);

        await (await getElement('#cy')).waitForDisplayed({ timeout: 10000 });
        const res = await browser.checkElement(
            '[data-test="pathwayMapperTabDiv"]',
            '',
            {
                hide: ['.qtip', '.__react_component_tooltip', '.rc-tooltip'],
            }
        );

        assertScreenShotMatch(res);
    });
});

describe('enrichments tab screenshot tests', function() {
    beforeEach(async function() {
        const url = `${CBIOPORTAL_URL}/results/enrichments?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS+NRAS+BRAF&gene_set_choice=user-defined-list&Action=Submit`;
        await goToUrlAndSetLocalStorage(url);
        //browser.$('.fdsa').waitForDisplayed();
    });

    it('enrichments tab coadread_tcga_pub mRNA profile', async function() {
        await (
            await browser.$('.comparisonTabSubTabs .tabAnchor_mrna')
        ).waitForDisplayed();
        await clickElement('.comparisonTabSubTabs .tabAnchor_mrna');

        await waitForElementDisplayed(
            'div[data-test="GroupComparisonMRNAEnrichments"]'
        );
        await clickElement('b=MERTK');
        //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
        await waitForElementDisplayed('div[data-test="MiniBoxPlot"]');

        const res = await browser.checkElement(
            'div[data-test="ComparisonTabDiv"]'
        );

        assertScreenShotMatch(res);
    });
});

describe('result page tabs, loading from session id', function() {
    before(async function() {
        // only run these tests if session service is enabled
        if ((await sessionServiceIsEnabled()) === false) {
            this.skip();
        }

        const url = `${CBIOPORTAL_URL}/results?session_id=5bbe8197498eb8b3d5684271`;
        await goToUrlAndSetLocalStorage(url);
        await waitForOncoprint();
    });

    runResultsTestSuite('session');
});

describe('results page tabs while excluding unprofiled samples', function() {
    before(async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=gbm_tcga&case_set_id=gbm_tcga_all&data_priority=0&gene_list=EGFR%250APTEN%250AIDH1%250ATP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=gbm_tcga_mrna_median_all_sample_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_mutations&hide_unprofiled_samples=false&profileFilter=0&tab_index=tab_visualize`
        );
        await waitForOncoprint();
        await setSettingsMenuOpen(true);
        await (
            await getElement('input[data-test="HideUnprofiled"]')
        ).waitForExist();
        await clickElement('input[data-test="HideUnprofiled"]');
        await waitForOncoprint();
        await setSettingsMenuOpen(false);
    });

    runResultsTestSuite('excluding unprofiled samples', {
        mrnaEnrichmentsRowSelector: 'b=DSC1',
    });
});

describe('results page pathways tab with unprofiled genes', function() {
    before(async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/pathways?cancer_study_list=msk_impact_2017&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cfusion%2Ccna&case_set_id=msk_impact_2017_cnaseq&gene_list=EGFR%2520ERBB2%2520PDGFRA%2520MET%2520KRAS%2520NRAS%2520HRAS%2520NF1%2520SPRY2%2520FOXO1%2520FOXO3%2520AKT1%2520AKT2%2520AKT3%2520PIK3R1%2520PIK3CA%2520PTEN&geneset_list=%20&tab_index=tab_visualize&Action=Submit`
        );
    });

    it(`results page pathwaymapper tab with unprofiled genes`, async function() {
        await (await getElement('#cy')).waitForDisplayed({ timeout: 30000 });

        await waitForNetworkQuiet(15000);

        const res = await browser.checkElement(
            '[data-test="pathwayMapperTabDiv"]',
            '',
            { hide: ['.qtip', '.__react_component_tooltip', '.rc-tooltip'] }
        );

        assertScreenShotMatch(res);
    });
});
