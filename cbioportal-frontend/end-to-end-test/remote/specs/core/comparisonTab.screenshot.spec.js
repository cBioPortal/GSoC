const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    jsApiClick,
    selectClinicalTabPlotType,
    checkElementWithMouseDisabled,
    checkElementWithTemporaryClass,
    getElement,
    clickElement,
    waitForElementDisplayed,
    setCheckboxChecked,
} = require('../../../shared/specUtils_Async');
const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('results view comparison tab screenshot tests', () => {
    describe('general screenshot tests', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Altered%20group"%2C"Unaltered%20group"%2C"KRAS"%2C"NRAS"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
            );
        });
        it('results view comparison tab overlap tab upset plot view', async () => {
            //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            await (
                await getElement('div[data-test="ComparisonPageOverlapTabDiv"]')
            ).waitForDisplayed({
                timeout: 20000,
            });

            const res = await browser.checkElement(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab survival tab exclude overlapping samples', async () => {
            assert(
                await (
                    await getElement(
                        '.comparisonTabSubTabs a.tabAnchor_survival'
                    )
                ).isDisplayed()
            );
            await clickElement('.comparisonTabSubTabs a.tabAnchor_survival');
            await (
                await getElement(
                    'div[data-test="ComparisonPageSurvivalTabDiv"]'
                )
            ).waitForDisplayed({ timeout: 60000 });
            //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                'div[data-test="ComparisonPageSurvivalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab survival tab include overlapping samples', async () => {
            await browser.execute(() => {
                comparisonTab.store.updateOverlapStrategy('Include');
            });
            await getElement('div[data-test="ComparisonPageSurvivalTabDiv"]', {
                timeout: 60000,
            });
            //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                'div[data-test="ComparisonPageSurvivalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab include overlapping samples Kruskal Wallis test', async () => {
            assert(
                await (
                    await getElement(
                        '.comparisonTabSubTabs a.tabAnchor_clinical'
                    )
                ).isDisplayed()
            );
            await clickElement('.comparisonTabSubTabs a.tabAnchor_clinical');
            await (
                await getElement(
                    'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
                )
            ).waitForDisplayed({ timeout: 20000 });
            await (
                await getElement(
                    'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="LazyMobXTable"] span[data-test="Mutation Count"]'
                )
            ).waitForDisplayed();
            await clickElement(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="LazyMobXTable"] span[data-test="Mutation Count"]'
            );
            //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab swaped axes Kruskal Wallis test', async () => {
            await setCheckboxChecked(
                true,
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]'
            );
            await (
                await getElement(
                    'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
                )
            ).waitForDisplayed({ timeout: 20000 });
            //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab log scale  Kruskal Wallis test', async () => {
            await setCheckboxChecked(
                true,
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="logScale"]'
            );
            await (
                await getElement(
                    'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
                )
            ).waitForDisplayed({ timeout: 20000 });
            //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab percentage stacked bar chart exclude overlapping samples Chi squared test', async () => {
            await browser.execute(() => {
                comparisonTab.store.updateOverlapStrategy('Exclude');
            });
            await (
                await getElement(
                    'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
                )
            ).waitForDisplayed({ timeout: 20000 });
            //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab bar chart Chi squared test', async () => {
            await selectClinicalTabPlotType('Bar chart');
            await (
                await getElement(
                    'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
                )
            ).waitForDisplayed({ timeout: 20000 });
            //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab stacked bar chart Chi squared test', async () => {
            await selectClinicalTabPlotType('Stacked bar chart');
            await (
                await getElement(
                    'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
                )
            ).waitForDisplayed({ timeout: 20000 });
            //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab stacked bar chart swaped axes Chi squared test', async () => {
            await setCheckboxChecked(
                true,
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]'
            );
            //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            await (
                await getElement(
                    'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
                )
            ).waitForDisplayed({ timeout: 20000 });
            const res = await checkElementWithMouseDisabled(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                0,
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab clinical tab stacked bar chart horizontal bars Chi squared test', async () => {
            await setCheckboxChecked(
                false,
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]'
            );
            await setCheckboxChecked(
                true,
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="HorizontalBars"]'
            );
            await (
                await getElement(
                    'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
                )
            ).waitForDisplayed({ timeout: 20000 });
            //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab alteration enrichments tab several groups', async () => {
            clickElement('.comparisonTabSubTabs .tabAnchor_alterations');
            await (
                await getElement(
                    'div[data-test="GroupComparisonAlterationEnrichments"]'
                )
            ).waitForDisplayed({ timeout: 10000 });
            const res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });
        it('results view comparison tab alteration enrichments tab several groups only truncating', async () => {
            await clickElement(
                '[data-test="AlterationTypeSelectorMenu"] [data-test="Mutations"]'
            );
            await clickElement(
                '[data-test="AlterationTypeSelectorMenu"] [data-test="CheckCopynumberAlterations"]'
            );
            await clickElement(
                '[data-test="AlterationTypeSelectorMenu"] [data-test="Truncating"]'
            );

            await clickElement(
                '[data-test="AlterationTypeSelectorMenu"] [data-test="buttonSelectAlterations"]'
            );

            await (
                await getElement(
                    'div[data-test="GroupComparisonAlterationEnrichments"]'
                )
            ).waitForDisplayed({ timeout: 10000 });
            const res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab mrna enrichments tab several groups', async () => {
            await clickElement('.comparisonTabSubTabs .tabAnchor_mrna');
            await (
                await getElement(
                    'div[data-test="GroupComparisonMRNAEnrichments"]'
                )
            ).waitForDisplayed({ timeout: 30000 });
            await (await getElement('b=HOXB4')).waitForDisplayed({
                timeout: 10000,
            });
            await clickElement('b=HOXB4');
            await (
                await getElement('div[data-test="MiniBoxPlot"]')
            ).waitForDisplayed({
                timeout: 20000,
            });
            //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab mrna enrichments tab two groups', async () => {
            await clickElement('.comparisonTabSubTabs .tabAnchor_mrna');
            await (
                await getElement(
                    'div[data-test="GroupComparisonMRNAEnrichments"]'
                )
            ).waitForDisplayed({ timeout: 30000 });
            await (await getElement('b=MERTK')).waitForDisplayed({
                timeout: 10000,
            });
            await clickElement('b=MERTK');
            //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab protein enrichments tab several groups', async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=blca_tcga_pub_2017&case_set_id=blca_tcga_pub_2017_all&comparison_selectedGroups=%5B"KRAS"%2C"NRAS"%2C"BRAF"%5D&comparison_subtab=protein&data_priority=0&gene_list=KRAS%2520NRAS%2520BRAF&gene_set_choice=user-defined-list&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_2017_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=blca_tcga_pub_2017_rna_seq_v2_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_2017_mutations&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=blca_tcga_pub_2017_rppa_Zscores&profileFilter=0&tab_index=tab_visualize`
            );
            await (
                await getElement(
                    '[data-test="GroupComparisonProteinEnrichments"]'
                )
            ).waitForDisplayed({ timeout: 30000 });
            await (await getElement('b=SCD')).waitForDisplayed({
                timeout: 10000,
            });
            await clickElement('b=SCD');
            await (
                await getElement('div[data-test="MiniBoxPlot"]')
            ).waitForDisplayed({
                timeout: 20000,
            });
            //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab protein enrichments tab two groups', async () => {
            // deselect a group
            await clickElement('button[data-test="groupSelectorButtonBRAF"]');

            await (
                await getElement(
                    'div[data-test="GroupComparisonProteinEnrichments"]'
                )
            ).waitForDisplayed({ timeout: 10000 });
            await (await getElement('b=FASN')).waitForDisplayed({
                timeout: 10000,
            });
            await clickElement('b=FASN');
            //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab methylation enrichments tab several groups', async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=blca_tcga_pub_2017&case_set_id=blca_tcga_pub_2017_all&comparison_selectedGroups=%5B"KRAS"%2C"NRAS"%2C"BRAF"%5D&comparison_subtab=dna_methylation&data_priority=0&gene_list=KRAS%2520NRAS%2520BRAF&gene_set_choice=user-defined-list&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=blca_tcga_pub_2017_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=blca_tcga_pub_2017_rna_seq_v2_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=blca_tcga_pub_2017_mutations&genetic_profile_ids_PROFILE_PROTEIN_EXPRESSION=blca_tcga_pub_2017_rppa_Zscores&profileFilter=0&tab_index=tab_visualize`
            );
            await waitForElementDisplayed(
                'div[data-test="GroupComparisonMethylationEnrichments"]',
                { timeout: 20000 }
            );
            await (await getElement('b=HDAC1')).waitForDisplayed({
                timeout: 10000,
            });
            await clickElement('b=HDAC1');
            await waitForElementDisplayed('div[data-test="MiniBoxPlot"]', {
                timeout: 20000,
            });
            await waitForElementDisplayed('body');
            await browser.pause(100);
            await (await getElement('body')).moveTo();

            const res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });
    });

    describe('delete group from session', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Altered%20group"%2C"Unaltered%20group"%2C"KRAS"%2C"NRAS"%5D&comparison_subtab=overlap&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&comparison_createdGroupsSessionId=5e74f264e4b0ff7ef5fdb27f`
            );
            await (
                await getElement('div[data-test="ComparisonPageOverlapTabDiv"]')
            ).waitForDisplayed({
                timeout: 20000,
            });
        });
        it('results view comparison tab delete group from session', async () => {
            //this.retries(0);
            await (
                await getElement(
                    'button[data-test="groupSelectorButtontest"] [data-test="deleteButton"]'
                )
            ).waitForExist();
            await clickElement(
                'button[data-test="groupSelectorButtontest"] [data-test="deleteButton"]'
            );
            await browser.pause(1000);
            const res = await checkElementWithMouseDisabled(
                'div.mainContainer'
            );
            assertScreenShotMatch(res);
        });
    });

    describe('overlap venn diagram', () => {
        describe('disjoint diagram', () => {
            before(async () => {
                await goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
                );
                await (
                    await getElement(
                        'div[data-test="ComparisonPageOverlapTabDiv"]'
                    )
                ).waitForDisplayed({ timeout: 20000 });
            });

            it('results view comparison tab overlap tab disjoint venn diagram view', async () => {
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('results view comparison tab overlap tab disjoint venn diagram view with a group selected view', async () => {
                await (
                    await getElement('svg#comparison-tab-overlap-svg')
                ).waitForDisplayed({
                    timeout: 6000,
                });
                await jsApiClick('rect[data-test="sample0VennRegion"]');
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab overlap tab 3 disjoint venn diagram', async () => {
                await goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Unaltered%20group"%2C"KRAS"%2C"BRAF"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
                );
                await (
                    await getElement(
                        'div[data-test="ComparisonPageOverlapTabDiv"]'
                    )
                ).waitForDisplayed({ timeout: 20000 });
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
        });

        describe('venn diagram with overlap', () => {
            before(async () => {
                await goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"KRAS"%2C"NRAS"%2C"Altered%20group"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
                );
                await (
                    await getElement(
                        'div[data-test="ComparisonPageOverlapTabDiv"]'
                    )
                ).waitForDisplayed({ timeout: 20000 });
            });

            it('results view comparison tab overlap tab venn diagram with overlap view', async () => {
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('results view comparison tab overlap tab venn diagram view with overlap and session selected view', async () => {
                await jsApiClick('rect[data-test="sample0,1,2VennRegion"]');
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('results view comparison tab overlap tab venn diagram view with overlap deselect active group', async () => {
                await clickElement(
                    'button[data-test="groupSelectorButtonKRAS"]'
                );
                await (
                    await getElement(
                        'div[data-test="ComparisonPageOverlapTabDiv"]'
                    )
                ).waitForDisplayed({ timeout: 20000 });
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
        });

        describe('venn diagram with complex overlaps', () => {
            const buttonA =
                'button[data-test="groupSelectorButtonAltered group"]';
            const buttonB =
                'button[data-test="groupSelectorButtonUnaltered group"]';
            const buttonC = 'button[data-test="groupSelectorButtonKRAS"]';
            const buttonD = 'button[data-test="groupSelectorButtonNRAS"]';
            const buttonE = 'button[data-test="groupSelectorButtonBRAF"]';

            before(async () => {
                await goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Unaltered%20group"%2C"KRAS"%2C"NRAS"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
                );
                await (
                    await getElement(
                        'div[data-test="ComparisonPageOverlapTabDiv"]'
                    )
                ).waitForDisplayed({ timeout: 20000 });
            });
            it('results view comparison tab complex venn BCD', async () => {
                await (
                    await getElement(
                        'div[data-test="ComparisonPageOverlapTabDiv"]'
                    )
                ).waitForDisplayed({ timeout: 20000 });
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn CD', async () => {
                await clickElement(buttonB);
                await (
                    await getElement(
                        'div[data-test="ComparisonPageOverlapTabDiv"]'
                    )
                ).waitForDisplayed({ timeout: 20000 });
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn BC', async () => {
                await clickElement(buttonB);
                await (await getElement(buttonD)).waitForDisplayed();
                await clickElement(buttonD);
                await (
                    await getElement(
                        'div[data-test="ComparisonPageOverlapTabDiv"]'
                    )
                ).waitForDisplayed({ timeout: 20000 });
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn ABC', async () => {
                await clickElement(buttonA);
                await (
                    await getElement(
                        'div[data-test="ComparisonPageOverlapTabDiv"]'
                    )
                ).waitForDisplayed({ timeout: 20000 });
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn AB', async () => {
                await clickElement(buttonC);
                await (
                    await getElement(
                        'div[data-test="ComparisonPageOverlapTabDiv"]'
                    )
                ).waitForDisplayed({ timeout: 20000 });
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn ABD', async () => {
                await clickElement(buttonD);
                await (
                    await getElement(
                        'div[data-test="ComparisonPageOverlapTabDiv"]'
                    )
                ).waitForDisplayed({ timeout: 20000 });
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn AD', async () => {
                await clickElement(buttonB);
                await (
                    await getElement(
                        'div[data-test="ComparisonPageOverlapTabDiv"]'
                    )
                ).waitForDisplayed({ timeout: 20000 });
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
            it('results view comparison tab complex venn ACD', async () => {
                await clickElement(buttonC);
                await (
                    await getElement(
                        'div[data-test="ComparisonPageOverlapTabDiv"]'
                    )
                ).waitForDisplayed({ timeout: 20000 });
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });
        });
    });

    describe('overlap upset diagram group selection', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B"Unaltered%20group"%2C"KRAS"%2C"NRAS"%2C"Altered%20group"%2C"BRAF"%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
            );
            await (
                await getElement('div[data-test="ComparisonPageOverlapTabDiv"]')
            ).waitForDisplayed({
                timeout: 20000,
            });
        });

        it('results view comparison tab overlap tab upset groups selected', async () => {
            await jsApiClick('.sample_Unaltered_group_bar');
            await jsApiClick('.sample_Altered_group_KRAS_bar');
            await jsApiClick('.patient_Altered_group_NRAS_bar');
            const res = await checkElementWithTemporaryClass(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'disablePointerEvents',
                0
            );
            assertScreenShotMatch(res);
        });

        it('results view comparison tab overlap tab upset deselect active group', async () => {
            await clickElement('button[data-test="groupSelectorButtonNRAS"]');
            const res = await checkElementWithTemporaryClass(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'disablePointerEvents',
                0
            );
            assertScreenShotMatch(res);
        });
    });
});
