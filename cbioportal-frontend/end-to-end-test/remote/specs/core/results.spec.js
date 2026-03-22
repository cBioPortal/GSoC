const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');
const assert = require('assert');

const {
    waitForOncoprint,
    goToUrlAndSetLocalStorage,
    isSelected,
    clickElement,
    getElement,
    setInputText,
    getText,
    isDisplayed,
    waitForElementDisplayed,
    waitForNetworkQuiet,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('Results Page', () => {
    before(async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    describe('Cancer Type Summary Bar Chart', () => {
        describe('single study query with four genes', () => {
            before(async () => {
                const url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?tab_index=tab_visualize&cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=BRAF+KRAS+NRAS&gene_set_choice=user-defined-list&Action=Submit`;
                await goToUrlAndSetLocalStorage(url);
                await waitForElementDisplayed(
                    '[data-test="cancerTypeSummaryChart"]',
                    {
                        timeout: 10000,
                    }
                );
            });

            it('defaults to cancerTypeDetailed', async () => {
                const isCancerTypeDetailedSelected = await isSelected(
                    '[data-value="cancerTypeDetailed"]'
                );
                assert.equal(isCancerTypeDetailedSelected, true);
            });

            it('three gene tabs plus "all genes" equals four total tabs, in order of genes in oql', async () => {
                const tabs = await $$(
                    "[data-test='cancerTypeSummaryWrapper'] .nav li a"
                );

                assert.equal(
                    tabs.length,
                    4,
                    'three gene tabs plus "all genes" equals four total tabs'
                );

                const tabTexts = await Promise.all(
                    tabs.map(tab => tab.getText())
                );

                assert.equal(
                    tabTexts[0],
                    'All Queried Genes',
                    'first tab is "All Queried Genes"'
                );
                assert.deepEqual(
                    tabTexts,
                    ['All Queried Genes', 'BRAF', 'KRAS', 'NRAS'],
                    'we have all genes and genes in order of oql'
                );
            });
        });

        describe('cross study query', () => {
            before(async () => {
                const url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?cancer_study_id=all&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=all&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&cancer_study_list=coadread_tcga_pub%2Ccellline_nci60&show_samples=false&clinicallist=CANCER_STUDY`;
                await goToUrlAndSetLocalStorage(url);
                await waitForElementDisplayed(
                    '[data-test=cancerTypeSummaryChart]',
                    {
                        timeout: 10000,
                    }
                );
            });

            it("defaults to grouping by studyId when there's more than one study", async () => {
                const elSelected = await isSelected('[data-value="studyId"]');
                assert.equal(elSelected, true);
            });
        });

        describe('single study with multiple cancer types', () => {
            before(async () => {
                const url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?cancer_study_list=brca_tcga&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cgistic&case_set_id=brca_tcga_cnaseq&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit`;
                await goToUrlAndSetLocalStorage(url);
                await waitForElementDisplayed(
                    '[data-test=cancerTypeSummaryChart]',
                    {
                        timeout: 10000,
                    }
                );
            });

            it("defaults to cancerType grouping when there's more than one cancer type in query", async () => {
                const elSelected = await isSelected(
                    '[data-value="cancerType"]'
                );
                assert.equal(elSelected, true);
            });
        });

        describe('query with genes that have no alterations', () => {
            before(async () => {
                const url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?cancer_study_id=chol_nccs_2013&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=chol_nccs_2013_sequenced&gene_list=CDKN2A%2520CDKN2B%2520CDKN2C%2520CDK4%2520CDK6%2520CCND2%2520RB1&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=chol_nccs_2013_mutations`;
                await goToUrlAndSetLocalStorage(url);
                await waitForElementDisplayed(
                    '[data-test=cancerTypeSummaryChart]',
                    {
                        timeout: 10000,
                    }
                );
            });

            it('shows an alert message on tabs for missing genes', async () => {
                await clickElement('=CDKN2A');
                await (await getElement('body')).moveTo({
                    xOffset: 0,
                    yOffset: 0,
                });
                const res = await browser.checkElement(
                    '[data-test="cancerTypeSummaryWrapper"]',
                    '',
                    { hide: ['.qtip'] }
                );
                assertScreenShotMatch(res);
            });
        });

        describe('customization functionality', () => {
            before(async () => {
                const url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?cancer_study_id=brca_metabric&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=brca_metabric_cnaseq&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_metabric_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_metabric_cna`;
                await goToUrlAndSetLocalStorage(url);
                await waitForElementDisplayed(
                    '[data-test=cancerTypeSummaryChart]',
                    {
                        timeout: 10000,
                    }
                );
            });

            it('group by detailed type', async () => {
                await clickElement('[data-value="cancerTypeDetailed"]');
                const res = await browser.checkElement(
                    '[data-test="cancerTypeSummaryWrapper"]',
                    '',
                    { hide: ['.qtip'] }
                );
                assertScreenShotMatch(res);
            });

            it('handles change to absolute value yaxis', async () => {
                await (
                    await getElement('[data-test="cancerSummaryYAxisSelect"]')
                ).selectByIndex(1);
                const res = await browser.checkElement(
                    '[data-test="cancerTypeSummaryWrapper"]',
                    '',
                    { hide: ['.qtip'] }
                );
                assertScreenShotMatch(res);
            });

            it('handles change to sort of xaxis', async () => {
                await (
                    await getElement('[data-test="cancerSummaryXAxisSelect"]')
                ).selectByIndex(1);
                const res = await browser.checkElement(
                    '[data-test="cancerTypeSummaryWrapper"]',
                    '',
                    { hide: ['.qtip'] }
                );
                assertScreenShotMatch(res);
            });

            it('handles change to alteration threshold', async () => {
                await setInputText(
                    "[data-test='alterationThresholdInput']",
                    300
                );
                await browser.keys('Enter');
                const res = await browser.checkElement(
                    '[data-test="cancerTypeSummaryWrapper"]',
                    '',
                    { hide: ['.qtip'] }
                );
                // now cleanup
                await setInputText("[data-test='alterationThresholdInput']", 0);
                await browser.keys('Enter');
            });

            it('handles change to sample total threshold', async () => {
                await setInputText(
                    "[data-test='sampleTotalThresholdInput']",
                    312
                );
                await browser.keys('Enter');
                browser.pause(1000);
                const res = await browser.checkElement(
                    '[data-test="cancerTypeSummaryWrapper"]',
                    '',
                    { hide: ['.qtip'] }
                );
                assertScreenShotMatch(res);
            });
        });
    });

    describe('Mutations Tab', () => {
        describe('3D structure visualizer', () => {
            before(async () => {
                const url = `${CBIOPORTAL_URL}/results/mutations?tab_index=tab_visualize&cancer_study_list=ov_tcga_pub&cancer_study_id=ov_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations&Z_SCORE_THRESHOLD=2.0&case_set_id=ov_tcga_pub_3way_complete&gene_list=BRCA1+BRCA2&gene_set_choice=user-defined-list&Action=Submit`;
                await browser.url(url);
                await getElement('[data-test=view3DStructure]', {
                    timeout: 10000,
                });
                await (
                    await getElement('[data-test=view3DStructure]')
                ).waitForEnabled({
                    timeout: 10000,
                });
            });

            // TODO temporarily unavailable (enable test after fixing the related 3D viewer issue)
            it.skip('populates PDB info properly', async () => {
                await clickElement('[data-test=view3DStructure]');
                await browser.waitUntil(
                    async () =>
                        (await getText('[data-test=pdbChainInfoText]')) !==
                        'LOADING',
                    10000
                );
                const text = (
                    await getText('[data-test="pdbChainInfoText"]')
                ).trim();
                assert.ok(
                    text.startsWith(
                        'complex structure of brca1 brct with singly'
                    )
                );
            });
        });
        describe('Lollipop Plot Tracks', () => {
            before(async () => {
                const url = `${CBIOPORTAL_URL}/results/mutations?tab_index=tab_visualize&cancer_study_list=ov_tcga_pub&cancer_study_id=ov_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations&Z_SCORE_THRESHOLD=2.0&case_set_id=ov_tcga_pub_3way_complete&gene_list=TP53+PTEN&gene_set_choice=user-defined-list&Action=Submit`;
                await browser.url(url);
                await getElement('[data-test=view3DStructure]', {
                    timeout: 20000,
                });
                await waitForElementDisplayed(
                    '[data-test=oncogenic-icon-image]',
                    {
                        timeout: 10000,
                    }
                );
            });

            it('shows tracks when the corresponding dropdown menu options selected', async () => {
                await clickElement('.annotation-track-selector');

                // open Hotspots track
                await clickElement(
                    './/*[text()[contains(.,"Cancer Hotspots")]]'
                );
                await getElement('[class=cancer-hotspot-0]', {
                    timeout: 10000,
                });

                // open OncoKB track
                await clickElement('.//*[text()[contains(.,"OncoKB")]]');
                await getElement('[class=onco-kb-0]', { timeout: 10000 });

                // open PTM track
                await clickElement(
                    './/*[text()[contains(.,"Post Translational Modifications")]]'
                );
                await getElement('[class=ptm-0-0]', { timeout: 10000 });

                // open 3D visualizer via tracks menu
                // TODO temporarily unavailable (uncomment after fixing the related 3D viewer issue)
                // await clickElement('.//*[text()[contains(.,"3D Structure")]]');
                // await getElement('[class=chain-0]', { timeout: 10000 });
            });

            it('keeps tracks selection state when switching to another gene tab', async () => {
                // switch to the PTEN tab
                await clickElement('.tabAnchor_PTEN');
                // check if the selected tracks still exist on this tab
                await getElement('[class=cancer-hotspot-0]', {
                    timeout: 10000,
                });
                await getElement('[class=onco-kb-0]', { timeout: 10000 });
                // TODO temporarily unavailable (uncomment after fixing the related 3D viewer issue)
                // await getElement('[class=chain-0]', { timeout: 10000 });
                await getElement('[class=ptm-0-0]', { timeout: 10000 });
            });
        });
    });

    describe('oql status banner', () => {
        const yesBannerSelector = 'div[data-test="OqlStatusBannerYes"]';
        const noBannerSelector = 'div[data-test="OqlStatusBannerNo"]';
        const unaffectedBannerSelector =
            'div[data-test="OqlStatusBannerUnaffected"]';
        const simpleQueryUrl = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`;
        const explicitOqlQueryUrl = `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%2520NRAS%2520%250ABRAF%253AMUT&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic`;

        before(async () => {
            await goToUrlAndSetLocalStorage(simpleQueryUrl);
            await waitForOncoprint();
        });

        it('should not be present in oncoprint tab with simple query', async () => {
            assert(
                !(await isDisplayed(
                    `${yesBannerSelector}.oncoprint-oql-status-banner`
                ))
            );
            assert(
                !(await isDisplayed(
                    `${noBannerSelector}.oncoprint-oql-status-banner`
                ))
            );
        });
        it('should not be present in cancer types summary with simple query', async () => {
            await clickElement('.tabAnchor_cancerTypesSummary');
            await browser.pause(500);
            assert(
                !(await isDisplayed(
                    `${yesBannerSelector}.cancer-types-summary-oql-status-banner`
                ))
            );
            assert(
                !(await isDisplayed(
                    `${noBannerSelector}.cancer-types-summary-oql-status-banner`
                ))
            );
        });
        it('should not be present in mutual exclusivity tab with simple query', async () => {
            await clickElement('.tabAnchor_mutualExclusivity');
            await browser.pause(500);
            assert(
                !(await isDisplayed(
                    `${yesBannerSelector}.mutex-oql-status-banner`
                ))
            );
            assert(
                !(await isDisplayed(
                    `${noBannerSelector}.mutex-oql-status-banner`
                ))
            );
        });
        it('should not be present in plots tab with simple query', async () => {
            await clickElement('.tabAnchor_plots');
            await browser.pause(500);
            assert(
                !(await isDisplayed(
                    `${yesBannerSelector}.plots-oql-status-banner`
                ))
            );
            assert(
                !(await isDisplayed(
                    `${noBannerSelector}.plots-oql-status-banner`
                ))
            );
        });
        it('should not be present in mutations tab with simple query', async () => {
            await clickElement('.tabAnchor_mutations');
            await browser.pause(500);
            assert(
                !(await isDisplayed(
                    `${yesBannerSelector}.mutations-oql-status-banner`
                ))
            );
            assert(
                !(await isDisplayed(
                    `${noBannerSelector}.mutations-oql-status-banner`
                ))
            );
            assert(
                !(await isDisplayed(
                    `${unaffectedBannerSelector}.mutations-oql-status-banner`
                ))
            );
        });
        it('should not be present in coexpression tab with simple query', async () => {
            await clickElement('.tabAnchor_coexpression');
            await browser.pause(500);
            assert(
                !(await isDisplayed(
                    `${yesBannerSelector}.coexp-oql-status-banner`
                ))
            );
            assert(
                !(await isDisplayed(
                    `${noBannerSelector}.coexp-oql-status-banner`
                ))
            );
        });
        it('should not be present in alteration enrichments tab with simple query', async () => {
            await clickElement('.tabAnchor_comparison');
            await waitForElementDisplayed(
                '.comparisonTabSubTabs .tabAnchor_alterations'
            );
            await clickElement('.comparisonTabSubTabs .tabAnchor_alterations');
            await browser.pause(500);
            assert(
                !(await isDisplayed(
                    `${yesBannerSelector}.comparison-oql-status-banner`
                ))
            );
            assert(
                !(await isDisplayed(
                    `${noBannerSelector}.comparison-oql-status-banner`
                ))
            );
        });
        it('should not be present in survival tab with simple query', async () => {
            await clickElement('.comparisonTabSubTabs .tabAnchor_survival');
            await browser.pause(500);
            assert(
                !(await isDisplayed(
                    `${yesBannerSelector}.survival-oql-status-banner`
                ))
            );
            assert(
                !(await isDisplayed(
                    `${noBannerSelector}.survival-oql-status-banner`
                ))
            );
        });
        it('should not be present in download tab with simple query', async () => {
            await clickElement('.tabAnchor_download');
            await browser.pause(500);
            assert(
                !(await isDisplayed(
                    `${yesBannerSelector}.download-oql-status-banner`
                ))
            );
            assert(
                !(await isDisplayed(
                    `${noBannerSelector}.download-oql-status-banner`
                ))
            );
        });

        it('should be present in oncoprint tab with explicit query', async () => {
            await goToUrlAndSetLocalStorage(explicitOqlQueryUrl);
            await waitForOncoprint();
            await browser.pause(2000);
            assert(
                await isDisplayed(
                    `${yesBannerSelector}.oncoprint-oql-status-banner`
                )
            );
            assert(
                !(await isDisplayed(
                    `${noBannerSelector}.oncoprint-oql-status-banner`
                ))
            );
        });
        it('should be present in cancer types summary with explicit query', async () => {
            await clickElement('.tabAnchor_cancerTypesSummary');
            await waitForElementDisplayed(
                `${yesBannerSelector}.cancer-types-summary-oql-status-banner`,
                { timeout: 10000 }
            );
            assert(
                await isDisplayed(
                    `${yesBannerSelector}.cancer-types-summary-oql-status-banner`
                )
            );
            assert(
                !(await isDisplayed(
                    `${noBannerSelector}.cancer-types-summary-oql-status-banner`
                ))
            );
        });
        it('should be present in mutual exclusivity tab with explicit query', async () => {
            await clickElement('.tabAnchor_mutualExclusivity');
            await waitForElementDisplayed(
                `${yesBannerSelector}.mutex-oql-status-banner`,
                {
                    timeout: 10000,
                }
            );
            assert(
                await isDisplayed(
                    `${yesBannerSelector}.mutex-oql-status-banner`
                )
            );
            assert(
                !(await isDisplayed(
                    `${noBannerSelector}.mutex-oql-status-banner`
                ))
            );
        });
        it('should be present in plots tab with explicit query', async () => {
            await clickElement('.tabAnchor_plots');
            await waitForElementDisplayed(
                `${noBannerSelector}.plots-oql-status-banner`,
                {
                    timeout: 10000,
                }
            );
            assert(
                !(await isDisplayed(
                    `${yesBannerSelector}.plots-oql-status-banner`
                ))
            );
            assert(
                await isDisplayed(`${noBannerSelector}.plots-oql-status-banner`)
            );
        });
        it('should be present in alterations tab with explicit query', async () => {
            await clickElement('.tabAnchor_comparison');
            await waitForElementDisplayed('.tabAnchor_alterations');
            await clickElement('.tabAnchor_alterations');

            await waitForElementDisplayed(
                `${yesBannerSelector}.comparison-oql-status-banner`,
                { timeout: 10000 }
            );
            assert(
                !(await isDisplayed(
                    `${unaffectedBannerSelector}.comparison-oql-status-banner`
                ))
            );
            assert(
                !(await isDisplayed(
                    `${noBannerSelector}.comparison-oql-status-banner`
                ))
            );
            assert(
                await isDisplayed(
                    `${yesBannerSelector}.comparison-oql-status-banner`
                )
            );
        });
        it('should be present in coexpression tab with explicit query', async () => {
            await clickElement('.tabAnchor_coexpression');
            await waitForElementDisplayed(
                `${noBannerSelector}.coexp-oql-status-banner`,
                {
                    timeout: 10000,
                }
            );
            assert(
                !(await isDisplayed(
                    `${yesBannerSelector}.coexp-oql-status-banner`
                ))
            );
            assert(
                await isDisplayed(`${noBannerSelector}.coexp-oql-status-banner`)
            );
        });
        it('should be present in alteration enrichments tab with explicit query', async () => {
            await clickElement('.tabAnchor_comparison');
            await waitForElementDisplayed(
                '.comparisonTabSubTabs .tabAnchor_alterations'
            );
            await clickElement('.comparisonTabSubTabs .tabAnchor_alterations');
            await waitForElementDisplayed(
                `${yesBannerSelector}.comparison-oql-status-banner`,
                { timeout: 10000 }
            );
            assert(
                await isDisplayed(
                    `${yesBannerSelector}.comparison-oql-status-banner`
                )
            );
            assert(
                !(await isDisplayed(
                    `${noBannerSelector}.comparison-oql-status-banner`
                ))
            );
        });
        it('should be present in survival tab with explicit query', async () => {
            await clickElement('.comparisonTabSubTabs .tabAnchor_survival');
            await waitForElementDisplayed(
                `${yesBannerSelector}.comparison-oql-status-banner`,
                { timeout: 10000 }
            );
            assert(
                await isDisplayed(
                    `${yesBannerSelector}.comparison-oql-status-banner`
                )
            );
            assert(
                !(await isDisplayed(
                    `${noBannerSelector}.comparison-oql-status-banner`
                ))
            );
        });
        it('should be present in download tab with explicit query', async () => {
            await clickElement('.tabAnchor_download');
            await waitForElementDisplayed(
                `${yesBannerSelector}.download-oql-status-banner`,
                { timeout: 10000 }
            );
            assert(
                await isDisplayed(
                    `${yesBannerSelector}.download-oql-status-banner`
                )
            );
            assert(
                !(await isDisplayed(
                    `${noBannerSelector}.download-oql-status-banner`
                ))
            );
        });
    });
});
