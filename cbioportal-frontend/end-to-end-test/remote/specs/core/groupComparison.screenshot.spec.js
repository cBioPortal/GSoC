const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    waitForNetworkQuiet,
    checkElementWithTemporaryClass,
    checkElementWithMouseDisabled,
    jsApiClick,
    jsApiHover,
    getElementByTestHandle,
    getElement,
    clickElement,
    setInputText,
} = require('../../../shared/specUtils_Async');
const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('group comparison page screenshot tests', () => {
    describe('general screenshot tests', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison?sessionId=5ce411c7e4b0ab4137874076`
            );
            await (
                await getElement('div[data-test="ComparisonPageOverlapTabDiv"]')
            ).waitForDisplayed({
                timeout: 100000,
            });
        });
        it('group comparison page overlap tab upset plot view', async () => {
            ////await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page survival tab exclude overlapping samples', async () => {
            assert(
                await (await getElement('a.tabAnchor_survival')).isDisplayed()
            );
            await clickElement('a.tabAnchor_survival');
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

        it('group comparison page survival tab include overlapping samples', async () => {
            await browser.execute(() => {
                groupComparisonPage.onOverlapStrategySelect({
                    value: 'Include',
                });
            });
            await waitForNetworkQuiet();
            await getElement('div[data-test="ComparisonPageSurvivalTabDiv"]', {
                timeout: 60000,
            });
            //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await checkElementWithMouseDisabled(
                'div[data-test="ComparisonPageSurvivalTabDiv"]',
                0,
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page clinical tab include overlapping samples Kruskal Wallis test', async () => {
            assert(
                await (await getElement('a.tabAnchor_clinical')).isDisplayed()
            );
            await clickElement('a.tabAnchor_clinical');
            await waitForNetworkQuiet();
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

        it('group comparison page clinical tab swaped axes Kruskal Wallis test', async () => {
            await clickElement(
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

        it('group comparison page clinical tab log scale  Kruskal Wallis test', async () => {
            await clickElement(
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

        it('group comparison page clinical tab percentage stacked bar chart exclude overlapping samples Chi squared test', async () => {
            await browser.execute(() => {
                groupComparisonPage.onOverlapStrategySelect({
                    value: 'Exclude',
                });
            });
            await waitForNetworkQuiet();
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

        it('group comparison page clinical tab bar chart Chi squared test', async () => {
            await setInputText(
                '[data-test="plotTypeSelector"] .Select-input input',
                'Bar chart'
            );
            await clickElement('[data-test="plotTypeSelector"] .Select-option');
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

        it('group comparison page clinical tab stacked bar chart Chi squared test', async () => {
            await setInputText(
                '[data-test="plotTypeSelector"] .Select-input input',
                'Stacked bar chart'
            );
            await clickElement('[data-test="plotTypeSelector"] .Select-option');
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

        it('group comparison page clinical tab stacked bar chart swaped axes Chi squared test', async () => {
            await clickElement(
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

        it('group comparison page clinical tab stacked bar chart horizontal bars Chi squared test', async () => {
            await clickElement(
                'div[data-test="ComparisonPageClinicalTabDiv"] input[data-test="SwapAxes"]'
            );
            await clickElement(
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
        //TODO:-- this test is not passing because of out of bounds error
        it('group comparison page mrna enrichments tab several groups', async () => {
            await clickElement('.tabAnchor_mrna');
            await (
                await getElement(
                    'div[data-test="GroupComparisonMRNAEnrichments"]'
                )
            ).waitForDisplayed({ timeout: 20000 });
            await (await getElement('b=BTN3A3')).waitForDisplayed({
                timeout: 10000,
            });
            await clickElement('b=BTN3A3');
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

        it('group comparison page protein enrichments tab several groups', async () => {
            await clickElement('.tabAnchor_protein');
            await (
                await getElement(
                    'div[data-test="GroupComparisonProteinEnrichments"]'
                )
            ).waitForDisplayed({ timeout: 10000 });
            await (await getElement('b=TUBA1B')).waitForDisplayed({
                timeout: 10000,
            });
            await clickElement('b=TUBA1B');
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

        it('group comparison page methylation enrichments tab several groups', async () => {
            await clickElement('.tabAnchor_dna_methylation');
            await (
                await getElement(
                    'div[data-test="GroupComparisonMethylationEnrichments"]'
                )
            ).waitForDisplayed({ timeout: 10000 });
            await (await getElement('b=MTRF1L')).waitForDisplayed({
                timeout: 10000,
            });
            await clickElement('b=MTRF1L');
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

        it('group comparison page alteration enrichments tab two groups', async () => {
            // deselect two groups
            await clickElement(
                'button[data-test="groupSelectorButtonGARS mutant"]'
            );
            await getElement(
                'button[data-test="groupSelectorButtonZNF517 mutant"]',
                { timeout: 10000 }
            );
            await clickElement(
                'button[data-test="groupSelectorButtonZNF517 mutant"]'
            );
            // go back to mutations tab
            await getElement('.tabAnchor_alterations', { timeout: 10000 });
            await clickElement('.tabAnchor_alterations');
            await (
                await getElement(
                    'div[data-test="GroupComparisonAlterationEnrichments"]'
                )
            ).waitForDisplayed({ timeout: 10000 });
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

        it('group comparison page cna enrichments tab two groups', async () => {
            await clickElement('.tabAnchor_alterations');
            await (
                await getElement(
                    'div[data-test="GroupComparisonAlterationEnrichments"]'
                )
            ).waitForDisplayed({ timeout: 10000 });
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

        it('group comparison page cna enrichments tab patient mode', async () => {
            await browser.execute(() => {
                groupComparisonStore.setUsePatientLevelEnrichments(true);
            });
            await (
                await getElement(
                    'div[data-test="GroupComparisonAlterationEnrichments"]'
                )
            ).waitForDisplayed({ timeout: 30000 });
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

        //TODO:-- this test is not passing because of out of bounds error
        it('group comparison page mrna enrichments tab two groups', async () => {
            await clickElement('.tabAnchor_mrna');
            await (
                await getElement(
                    'div[data-test="GroupComparisonMRNAEnrichments"]'
                )
            ).waitForDisplayed({ timeout: 10000 });
            await (await getElement('b=RBMX2')).waitForDisplayed({
                timeout: 10000,
            });
            await clickElement('b=RBMX2');
            await (
                await getElement('div[data-test="MiniBoxPlot"]')
            ).waitForDisplayed({
                timeout: 20000,
            });
            const res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page protein enrichments tab two groups', async () => {
            await clickElement('.tabAnchor_protein');
            await (
                await getElement(
                    'div[data-test="GroupComparisonProteinEnrichments"]'
                )
            ).waitForDisplayed({ timeout: 10000 });
            await (await getElement('b=ETS1')).waitForDisplayed({
                timeout: 10000,
            });
            await clickElement('b=ETS1');
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

        it('group comparison page methylation enrichments tab two groups', async () => {
            await clickElement('.tabAnchor_dna_methylation');
            await (
                await getElement(
                    'div[data-test="GroupComparisonMethylationEnrichments"]',
                    {
                        timeout: 20000,
                    }
                )
            ).waitForDisplayed({ timeout: 10000 });
            await (
                await getElement('b=BET1', {
                    timeout: 20000,
                })
            ).waitForDisplayed({
                timeout: 20000,
            });
            await clickElement('b=BET1');
            ////await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                '.msk-tab:not(.hiddenByPosition)',
                '',
                {
                    hide: ['.qtip'],
                }
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page mutations tab two groups', async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison/mutations?sessionId=5cf89323e4b0ab413787436c&selectedGene=AR`
            );
            await (
                await getElement('.borderedChart svg', {
                    timeout: 20000,
                })
            ).waitForDisplayed({
                timeout: 20000,
            });
            const res = await browser.checkElement(
                '[data-test="ComparisonPageMutationsTabPlot"]',
                '',
                {
                    viewportChangePause: 4000,
                }
            ); // hide these things because the timing of data loading makes this test so flaky
            assertScreenShotMatch(res);
        });

        it('group comparison page mutations tab two groups no mutations types selected', async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison/mutations?sessionId=5cf89323e4b0ab413787436c&selectedEnrichmentEventTypes=%5B"HOMDEL"%2C"AMP"%2C"structural_variant"%5D`
            );
            await (
                await getElement('.borderedChart svg', {
                    timeout: 20000,
                })
            ).waitForDisplayed({
                timeout: 20000,
            });
            const res = await browser.checkElement(
                '[data-test="ComparisonPageMutationsTabPlot"]',
                '',
                {
                    viewportChangePause: 4000,
                }
            ); // hide these things because the timing of data loading makes this test so flaky
            assertScreenShotMatch(res);
        });

        it('group comparison page mutations tab three groups first unselected', async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison/mutations?comparisonId=634006c24dd45f2bc4c3d4aa&unselectedGroups=%5B"Colon%20Adenocarcinoma"%5D`
            );
            await (
                await getElement('.borderedChart svg', {
                    timeout: 20000,
                })
            ).waitForDisplayed({
                timeout: 20000,
            });
            await jsApiHover(
                await getElementByTestHandle('infoIcon', {
                    timeout: 20000,
                })
            );

            await (
                await getElementByTestHandle('patientMultipleMutationsMessage')
            ).waitForDisplayed();
            const res = await browser.checkElement(
                '[data-test="ComparisonPageMutationsTabPlot"]',
                '',
                {
                    viewportChangePause: 4000,
                }
            ); // hide these things because the timing of data loading makes this test so flaky
            assertScreenShotMatch(res);
        });
    });

    describe('delete group from session', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison?sessionId=5ce411c7e4b0ab4137874076`
            );
            await (
                await getElement(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    {
                        timeout: 20000,
                    }
                )
            ).waitForDisplayed({
                timeout: 20000,
            });
        });
        it('group comparison page delete group from session', async function() {
            await this.retries(0);
            await clickElement(
                'button[data-test="groupSelectorButtonGARS mutant"] [data-test="deleteButton"]'
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
                    `${CBIOPORTAL_URL}/comparison?sessionId=5cf8b1b3e4b0ab413787436f`
                );
                await (
                    await getElement(
                        'div[data-test="ComparisonPageOverlapTabDiv"]'
                    )
                ).waitForDisplayed({ timeout: 20000 });
            });

            it('group comparison page overlap tab disjoint venn diagram view', async () => {
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('group comparison page overlap tab disjoint venn diagram view with a group selected view', async () => {
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
            it('group comparison page overlap tab 3 disjoint venn diagram', async () => {
                await goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/comparison?sessionId=5d28f03be4b0ab413787b1ef`
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
                    `${CBIOPORTAL_URL}/comparison/overlap?sessionId=5cf6bcf0e4b0ab413787430c`
                );
                await (
                    await getElement(
                        'div[data-test="ComparisonPageOverlapTabDiv"]'
                    )
                ).waitForDisplayed({ timeout: 20000 });
            });

            it('group comparison page overlap tab venn diagram with overlap view', async () => {
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('group comparison page overlap tab venn diagram view with overlap and session selected view', async () => {
                await jsApiClick('rect[data-test="sample0,1,2VennRegion"]');
                const res = await checkElementWithTemporaryClass(
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'div[data-test="ComparisonPageOverlapTabDiv"]',
                    'disablePointerEvents',
                    0
                );
                assertScreenShotMatch(res);
            });

            it('group comparison page overlap tab venn diagram view with overlap deselect active group', async () => {
                await clickElement(
                    'button[data-test="groupSelectorButtonZFPM1 mutant"]'
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

        describe('venn diagram with complex overlaps', async () => {
            const buttonA = 'button[data-test="groupSelectorButtonAll Cases"]';
            const buttonB = 'button[data-test="groupSelectorButtonMetastasis"]';
            const buttonC =
                'button[data-test="groupSelectorButtonoverlapping patients"]';
            const buttonD = 'button[data-test="groupSelectorButtonPrimary"]';

            before(async () => {
                await goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/comparison/overlap?sessionId=5d1bc517e4b0ab413787924a`
                );
                await (
                    await getElement(
                        'div[data-test="ComparisonPageOverlapTabDiv"]'
                    )
                ).waitForDisplayed({ timeout: 20000 });
            });
            it('group comparison complex venn BCD', async () => {
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
            it('group comparison complex venn CD', async () => {
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
            it('group comparison complex venn BC', async () => {
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
            it('group comparison complex venn ABC', async () => {
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
            it('group comparison complex venn AB', async () => {
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
            it('group comparison complex venn ABD', async () => {
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
            it('group comparison complex venn AD', async () => {
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
            it('group comparison complex venn ACD', async () => {
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
                `${CBIOPORTAL_URL}/comparison?sessionId=5d0bc0c5e4b0ab4137876bc3`
            );
            await (
                await getElement('div[data-test="ComparisonPageOverlapTabDiv"]')
            ).waitForDisplayed({
                timeout: 20000,
            });
        });

        it('group comparison page overlap tab upset groups selected', async () => {
            await jsApiClick('.sample_testGroup5_bar');
            await jsApiClick('.sample_testGroup1_testGroup2_bar');
            await jsApiClick('.patient_testGroup1_bar');
            const res = await checkElementWithTemporaryClass(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'disablePointerEvents',
                0
            );
            assertScreenShotMatch(res);
        });

        it('group comparison page overlap tab upset deselect active group', async () => {
            await clickElement(
                'button[data-test="groupSelectorButtontestGroup4"]'
            );
            await (
                await getElement('div[data-test="ComparisonPageOverlapTabDiv"]')
            ).waitForDisplayed({
                timeout: 20000,
            });
            const res = await checkElementWithTemporaryClass(
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'div[data-test="ComparisonPageOverlapTabDiv"]',
                'disablePointerEvents',
                0
            );
            assertScreenShotMatch(res);
        });
    });

    describe('clinical tab categorical table', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison?sessionId=67a22dd583e9543d61940572`
            );
            await (
                await getElement('div[data-test="ComparisonPageOverlapTabDiv"]')
            ).waitForDisplayed({ timeout: 60000 });
        });

        it('group comparison page clinical tab race plot type table', async () => {
            assert(
                await (await getElement('a.tabAnchor_clinical')).isDisplayed()
            );
            await clickElement('a.tabAnchor_clinical');
            await (
                await getElement(
                    'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]'
                )
            ).waitForDisplayed({ timeout: 20000 });
            await clickElement(
                'div[data-test="ComparisonPageClinicalTabDiv"] span[data-test="Race"]'
            );
            await setInputText(
                '[data-test="plotTypeSelector"] .Select-input input',
                'Table'
            );
            await clickElement('[data-test="plotTypeSelector"] .Select-option');

            ////await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
            const res = await browser.checkElement(
                'div[data-test="ComparisonPageClinicalTabDiv"] div[data-test="ClinicalTabPlotDiv"]',
                '',
                { hide: ['.qtip'] }
            );
            assertScreenShotMatch(res);
        });
    });
});
