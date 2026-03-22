const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    setInputText,
    setSettingsMenuOpen,
    jsApiHover,
    getElementByTestHandle,
    getElement,
    getNthElements,
    getColorOfNthElement,
    getColorByTestHandle,
    clickElement,
    waitForElementDisplayed,
    getText,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('group comparison mutations tab tests', () => {
    describe('lollipop alerts and plot display', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison/mutations?comparisonId=634006c24dd45f2bc4c3d4aa`
            );
            await getElement('a.tabAnchor_mutations', { timeout: 30000 });
        });

        it('too many groups alert displayed when more than 2 groups selected', async () => {
            await (
                await getElementByTestHandle('TooManyGroupsAlert')
            ).waitForDisplayed();
        });

        it('not enough groups alert displayed when less than 2 groups selected', async () => {
            await (await getElement('a=Deselect all')).click();
            await (
                await getElementByTestHandle('NotEnoughGroupsAlert')
            ).waitForDisplayed();
            await (
                await getElementByTestHandle(
                    'groupSelectorButtonColon Adenocarcinoma'
                )
            ).click();
            await (
                await getElementByTestHandle('NotEnoughGroupsAlert')
            ).waitForDisplayed();
        });

        it('lollipop plot displayed when 2 groups selected', async () => {
            await (
                await getElementByTestHandle(
                    'groupSelectorButtonColorectal Adenocarcinoma'
                )
            ).click();
            await getElementByTestHandle('ComparisonPageMutationsTabPlot', {
                timeout: 25000,
            });
        });
    });

    describe('lollipop tooltip display', () => {
        it('displays double tooltip when lollipop is present in both plots at the same position', async () => {
            await (await getElement('.lollipop-0')).waitForExist({
                timeout: 30000,
            });
            await (await getElement('.lollipop-0')).moveTo();
            await (
                await getElementByTestHandle(
                    'tooltip-1450-Colon Adenocarcinoma'
                )
            ).waitForDisplayed();
            await (
                await getElementByTestHandle(
                    'tooltip-1450-Colorectal Adenocarcinoma'
                )
            ).waitForDisplayed();
        });
        it("doesn't display % when axis scale # is toggled", async () => {
            await (await getElementByTestHandle('AxisScaleSwitch#')).click();
            await (await getElement('.lollipop-6')).waitForExist();
            await (await getElement('.lollipop-6')).moveTo();
            assert.equal(
                (
                    await (
                        await getElementByTestHandle(
                            'tooltip-1378-Colon Adenocarcinoma'
                        )
                    ).getText()
                ).includes('%'),
                false
            );
        });
        it('displays % when axis scale % is toggled', async () => {
            await (await getElementByTestHandle('AxisScaleSwitch%')).click();
            await (await getElement('.lollipop-6')).waitForExist();
            await (await getElement('.lollipop-6')).moveTo();
            await (
                await getElement(
                    '[data-test="tooltip-1378-Colon Adenocarcinoma"]'
                )
            ).isDisplayed();
            const tooltipText = await (
                await getElement(
                    '[data-test="tooltip-1378-Colon Adenocarcinoma"]'
                )
            ).getHTML(false);
            // TODO: not working as expected
            assert.equal(tooltipText.includes('%'), true);
        });
    });

    describe('selecting gene with dropdown and tabs', () => {
        it('clicking on gene tab sets the selected gene', async () => {
            await (await getElement('a.tabAnchor_TP53')).click();
            await (
                await (
                    await getElementByTestHandle(
                        'ComparisonPageMutationsTabPlot'
                    )
                ).$('h3')
            ).waitForExist();
            assert.equal(
                (
                    await (
                        await (
                            await getElementByTestHandle(
                                'ComparisonPageMutationsTabPlot'
                            )
                        ).$('h3')
                    ).getText()
                ).includes('TP53'),
                true
            );
            assert.equal(
                await (await getElementByTestHandle('GeneSelector')).getText(),
                'TP53'
            );
        });

        it('selecting gene in gene selector sets the selected gene', async () => {
            await setInputText(
                'div[data-test=GeneSelector] input[type=text]',
                'KRAS'
            );
            await browser.keys('Enter');
            await (
                await (
                    await getElementByTestHandle(
                        'ComparisonPageMutationsTabPlot'
                    )
                ).$('h3')
            ).waitForExist();
            assert.equal(
                (
                    await (
                        await (
                            await getElementByTestHandle(
                                'ComparisonPageMutationsTabPlot'
                            )
                        ).$('h3')
                    ).getText()
                ).includes('KRAS'),
                true
            );
            assert.equal(
                (
                    await (
                        await (
                            await getElement('a.tabAnchor_KRAS')
                        ).parentElement()
                    ).getAttribute('class')
                ).includes('active'),
                true
            );
        });
    });

    describe('adding annotation tracks', () => {
        it('track visibility stays on gene change', async () => {
            await clickElement('div.annotation-track-selector', {
                moveTo: true,
            });
            //await (await getElementByTestHandle('')).click();
            await clickElement('handle=CancerHotspots', { moveTo: true });

            await waitForElementDisplayed('a.tabAnchor_APC');
            await clickElement('a.tabAnchor_APC');
            await (
                await getElementByTestHandle('AnnotationTracks')
            ).waitForDisplayed();
        });
    });

    describe('protein badge selecting', () => {
        it('clicking badge filters both top and bottom plots', async () => {
            // deselecting protein driver badge
            await (
                await getElementByTestHandle('badge-truncating_putative_driver')
            ).click();
            // counts are unchanged
            assert.equal(
                await (
                    await getElementByTestHandle(
                        'badge-truncating_putative_driver'
                    )
                ).getText(),
                '115'
            );
            assert.equal(
                await (
                    await getNthElements(
                        '[data-test="badge-truncating_putative_driver"]',
                        1
                    )
                ).getText(),
                '38'
            );

            assert.equal(
                await getColorByTestHandle('badge-truncating_putative_driver'),
                await getColorOfNthElement(
                    '[data-test="badge-truncating_putative_driver"]',
                    1
                )
            );

            assert.equal(
                await getColorByTestHandle('badge-truncating_putative_driver'),
                '#000000'
            );
            await (
                await getElementByTestHandle('filter-reset-panel')
            ).waitForDisplayed();

            // undo filter
            await (
                await getElementByTestHandle('badge-truncating_putative_driver')
            ).click();
            assert.equal(
                await getColorByTestHandle('badge-truncating_putative_driver'),
                await getColorOfNthElement(
                    '[data-test="badge-truncating_putative_driver"]',
                    1
                )
            );
            assert.equal(
                await (
                    await getElementByTestHandle('filter-reset-panel')
                ).isDisplayed(),
                false
            );
        });

        it('deselecting protein badge deselects both protein driver and vus badges', async () => {
            // deselecting protein badge
            await (await getElement('strong=Inframe')).click();

            assert.equal(
                await getColorByTestHandle('badge-inframe_putative_driver'),
                await getColorOfNthElement(
                    '[data-test="badge-inframe_putative_driver"]',
                    1
                )
            );
            assert.equal(
                await getColorByTestHandle(
                    'badge-inframe_unknown_significance'
                ),
                await getColorOfNthElement(
                    '[data-test="badge-inframe_unknown_significance"]',
                    1
                )
            );

            // both protein driver and vus badges are deselected
            assert.equal(
                await getColorByTestHandle('badge-inframe_putative_driver'),
                '#993404'
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-inframe_unknown_significance'
                ),
                '#a68028'
            );
        });

        it('selecting protein badge selects both protein driver and vus badges', async () => {
            // selecting protein badge
            await (await getElement('strong=Inframe')).click();

            assert.equal(
                await getColorByTestHandle('badge-inframe_putative_driver'),
                await getColorOfNthElement(
                    '[data-test="badge-inframe_putative_driver"]',
                    1
                )
            );
            assert.equal(
                await getColorByTestHandle(
                    'badge-inframe_unknown_significance'
                ),
                await getColorOfNthElement(
                    '[data-test="badge-inframe_unknown_significance"]',
                    1
                )
            );

            // both protein driver and vus badges are selected
            assert.equal(
                await getColorByTestHandle('badge-inframe_putative_driver'),
                await getColorByTestHandle('badge-inframe_unknown_significance')
            );

            // deselecting protein driver badge
            await (
                await getElementByTestHandle('badge-inframe_putative_driver')
            ).click();
            // selecting protein badge
            await (await getElement('strong=Inframe')).click();

            assert.equal(
                await getColorByTestHandle('badge-inframe_putative_driver'),
                await getColorOfNthElement(
                    '[data-test="badge-inframe_putative_driver"]',
                    1
                )
            );
            assert.equal(
                await getColorByTestHandle(
                    'badge-inframe_unknown_significance'
                ),
                await getColorOfNthElement(
                    '[data-test="badge-inframe_unknown_significance"]',
                    1
                )
            );

            // both protein driver and vus badges are selected if one of them is deselected
            assert.equal(
                await getColorByTestHandle('badge-inframe_putative_driver'),
                await getColorByTestHandle('badge-inframe_unknown_significance')
            );
        });

        it('deselecting driver/vus badge deselects all protein driver/vus badges', async () => {
            // deselecting driver badge
            await (
                await getNthElements('[data-test="badge-driver"]', 1)
            ).click();

            assert.equal(
                await getColorOfNthElement('[data-test="badge-driver"]', 1),
                await getColorOfNthElement('[data-test="badge-driver"]', 3)
            );

            assert.equal(
                await getColorOfNthElement(
                    '[data-test="badge-driver"]',
                    1,
                    'background-color'
                ),
                '#ffffff'
            );

            await (
                await getElementByTestHandle('filter-reset-panel')
            ).waitForDisplayed();

            // all protein driver badges are deselected
            assert.equal(
                await getColorOfNthElement(
                    '[data-test="badge-driver"]',
                    1,
                    'background-color'
                ),
                await getColorByTestHandle(
                    'badge-missense_putative_driver',
                    'background-color'
                )
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-missense_putative_driver',
                    'background-color'
                ),
                await getColorByTestHandle(
                    'badge-truncating_putative_driver',
                    'background-color'
                )
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-truncating_putative_driver',
                    'background-color'
                ),
                await getColorByTestHandle(
                    'badge-inframe_putative_driver',
                    'background-color'
                )
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-inframe_putative_driver',
                    'background-color'
                ),
                await getColorByTestHandle(
                    'badge-splice_putative_driver',
                    'background-color'
                )
            );

            // selecting driver badge
            await (
                await getNthElements('[data-test="badge-driver"]', 1)
            ).click();

            assert.equal(
                await getColorOfNthElement(
                    '[data-test="badge-driver"]',
                    1,
                    'background-color'
                ),
                await getColorOfNthElement(
                    '[data-test="badge-driver"]',
                    3,
                    'background-color'
                )
            );

            assert.equal(
                await getColorOfNthElement('[data-test="badge-driver"]', 1),
                '#ffffff'
            );

            assert.equal(
                await (
                    await getElementByTestHandle('filter-reset-panel')
                ).isDisplayed(),
                false
            );

            // all protein driver badges are selected
            assert.equal(
                await getColorOfNthElement('[data-test="badge-driver"]', 1),
                await getColorByTestHandle('badge-missense_putative_driver')
            );

            assert.equal(
                await getColorByTestHandle('badge-missense_putative_driver'),
                await getColorByTestHandle('badge-truncating_putative_driver')
            );

            assert.equal(
                await getColorByTestHandle('badge-truncating_putative_driver'),
                await getColorByTestHandle('badge-inframe_putative_driver')
            );

            assert.equal(
                await getColorByTestHandle('badge-inframe_putative_driver'),
                await getColorByTestHandle('badge-splice_putative_driver')
            );

            // deselecting vus badge
            await (await getElementByTestHandle('badge-VUS')).click();

            assert.equal(
                await getColorByTestHandle('badge-VUS', 'background-color'),
                await getColorOfNthElement(
                    '[data-test="badge-VUS"]',
                    1,
                    'background-color'
                )
            );

            assert.equal(
                await getColorByTestHandle('badge-VUS', 'background-color'),
                '#ffffff'
            );

            await (
                await getElementByTestHandle('filter-reset-panel')
            ).waitForDisplayed();

            // all protein vus badges are deselected
            assert.equal(
                await getColorByTestHandle('badge-VUS', 'background-color'),
                await getColorByTestHandle(
                    'badge-missense_unknown_significance',
                    'background-color'
                )
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-missense_unknown_significance',
                    'background-color'
                ),
                await getColorByTestHandle(
                    'badge-truncating_unknown_significance',
                    'background-color'
                )
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-truncating_unknown_significance',
                    'background-color'
                ),
                await getColorByTestHandle(
                    'badge-inframe_unknown_significance',
                    'background-color'
                )
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-inframe_unknown_significance',
                    'background-color'
                ),
                await getColorByTestHandle(
                    'badge-splice_unknown_significance',
                    'background-color'
                )
            );

            // selecting vus badge
            await (await getElementByTestHandle('badge-VUS')).click();

            assert.equal(
                await getColorByTestHandle('badge-VUS'),
                await getColorOfNthElement('[data-test="badge-VUS"]', 1)
            );

            assert.equal(await getColorByTestHandle('badge-VUS'), '#ffffff');

            assert.equal(
                await (
                    await getElementByTestHandle('filter-reset-panel')
                ).isDisplayed(),
                false
            );

            // all protein vus badges are selected
            assert.equal(
                await getColorByTestHandle('badge-VUS'),
                await getColorByTestHandle(
                    'badge-missense_unknown_significance'
                )
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-missense_unknown_significance'
                ),
                await getColorByTestHandle(
                    'badge-truncating_unknown_significance'
                )
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-truncating_unknown_significance'
                ),
                await getColorByTestHandle('badge-inframe_unknown_significance')
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-inframe_unknown_significance'
                ),
                await getColorByTestHandle('badge-splice_unknown_significance')
            );
        });

        it('adjusts mutation counts based on driver annotation settings', async () => {
            await (
                await (await getElementByTestHandle('badge-driver')).$(
                    'span=116'
                )
            ).waitForExist();
            await setSettingsMenuOpen(true);
            await (await getElementByTestHandle('annotateOncoKb')).click();
            await setSettingsMenuOpen(false);
            await (await getElement('.lollipop-svgnode')).waitForDisplayed({
                timeout: 30000,
            });
            await (
                await (await getElementByTestHandle('badge-driver')).$('span=0')
            ).waitForExist();
            await setSettingsMenuOpen(true);
            await (await getElementByTestHandle('annotateOncoKb')).click();
            await setSettingsMenuOpen(false);
            await (await getElement('.lollipop-svgnode')).waitForDisplayed();
            await (
                await (await getElementByTestHandle('badge-driver')).$(
                    'span=116'
                )
            ).waitForExist();
        });
    });

    describe('protein only selecting', () => {
        it('clicking protein driver/vus badge only button selects protein driver/vus, deselects others', async () => {
            await clickElement('handle=badge-splice_putative_driver', {
                moveTo: true,
            });

            assert.equal(
                await getColorByTestHandle('badge-splice_putative_driver'),
                await getColorOfNthElement(
                    '[data-test="badge-splice_putative_driver"]',
                    1
                )
            );

            // protein driver badge selected
            assert.equal(
                await getColorByTestHandle(
                    'badge-splice_putative_driver',
                    'background-color'
                ),
                '#ffffff'
            );
            // protein vus badge deselected
            assert.equal(
                await getColorByTestHandle(
                    'badge-splice_unknown_significance',
                    'background-color'
                ),
                '#f0b87b'
            );
            // driver badge deselected
            assert.equal(
                await getColorOfNthElement('[data-test="badge-driver"]', 1),
                '#000000'
            );
        });

        it('clicking protein type badge only button selects both protein driver and vus, deselects others', async () => {
            await clickElement('handle=missense_only', { moveTo: true });

            assert.equal(
                await getColorByTestHandle('badge-missense_putative_driver'),
                await getColorOfNthElement(
                    '[data-test="badge-missense_putative_driver"]',
                    1
                )
            );
            assert.equal(
                await getColorByTestHandle(
                    'badge-missense_unknown_significance'
                ),
                await getColorOfNthElement(
                    '[data-test="badge-missense_unknown_significance"]',
                    1
                )
            );

            // protein driver and vus badges both selected
            assert.equal(
                await getColorByTestHandle('badge-missense_putative_driver'),
                await getColorByTestHandle(
                    'badge-missense_unknown_significance'
                )
            );
            // driver badge deselected
            assert.equal(
                await getColorOfNthElement('[data-test="badge-driver"]', 1),
                '#000000'
            );
            // vus badge deselected
            assert.equal(
                await getColorOfNthElement('[data-test="badge-VUS"]', 1),
                '#696969'
            );
        });

        it('clicking driver/vus badge only button selects all protein driver/vus badges, deselects protein vus/driver badges', async () => {
            // selecting vus badge, then driver only button
            //await (await getElementByTestHandle('badge-VUS')).click();

            await clickElement('handle=badge-VUS', { moveTo: true });

            //await (await getElementByTestHandle('driver_only')).click();

            await clickElement('handle=driver_only', { moveTo: true });

            assert.equal(
                await getColorOfNthElement('[data-test="badge-driver"]', 1),
                await getColorOfNthElement('[data-test="badge-driver"]', 3)
            );

            // driver badge selected
            assert.equal(
                await getColorOfNthElement('[data-test="badge-driver"]', 1),
                '#ffffff'
            );

            await (
                await getElementByTestHandle('filter-reset-panel')
            ).waitForDisplayed();

            // all protein driver badges are selected
            assert.equal(
                await getColorOfNthElement('[data-test="badge-driver"]', 1),
                await getColorByTestHandle('badge-missense_putative_driver')
            );

            assert.equal(
                await getColorByTestHandle('badge-missense_putative_driver'),
                await getColorByTestHandle('badge-truncating_putative_driver')
            );

            assert.equal(
                await getColorByTestHandle('badge-truncating_putative_driver'),
                await getColorByTestHandle('badge-inframe_putative_driver')
            );

            assert.equal(
                await getColorByTestHandle('badge-inframe_putative_driver'),
                await getColorByTestHandle('badge-splice_putative_driver')
            );

            // vus badge deselected
            assert.equal(await getColorByTestHandle('badge-VUS'), '#696969');

            // all protein vus badges are deselected
            assert.equal(
                await getColorByTestHandle('badge-VUS', 'background-color'),
                await getColorByTestHandle(
                    'badge-missense_unknown_significance',
                    'background-color'
                )
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-missense_unknown_significance',
                    'background-color'
                ),
                await getColorByTestHandle(
                    'badge-truncating_unknown_significance',
                    'background-color'
                )
            );

            // assert.equal(
            //     await getColorByTestHandle(
            //         'badge-truncating_unknown_significance',
            //         'background-color'
            //     ),
            //     await getColorByTestHandle(
            //         'badge-inframe_unknown_significance',
            //         'background-color'
            //     )
            // );

            assert.equal(
                await getColorByTestHandle(
                    'badge-inframe_unknown_significance',
                    'background-color'
                ),
                await getColorByTestHandle(
                    'badge-splice_unknown_significance',
                    'background-color'
                )
            );

            // selecting vus only button
            await clickElement('handle=VUS_only', { moveTo: true });

            assert.equal(
                await getColorByTestHandle('badge-VUS'),
                await getColorOfNthElement('[data-test="badge-VUS"]', 1)
            );

            // vus badge selected
            assert.equal(await getColorByTestHandle('badge-VUS'), '#ffffff');

            await (
                await getElementByTestHandle('filter-reset-panel')
            ).waitForDisplayed();

            // all protein vus badges are selected
            assert.equal(
                await getColorByTestHandle('badge-VUS'),
                await getColorByTestHandle(
                    'badge-missense_unknown_significance'
                )
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-missense_unknown_significance'
                ),
                await getColorByTestHandle(
                    'badge-truncating_unknown_significance'
                )
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-truncating_unknown_significance'
                ),
                await getColorByTestHandle('badge-inframe_unknown_significance')
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-inframe_unknown_significance'
                ),
                await getColorByTestHandle('badge-splice_unknown_significance')
            );

            // driver badge deselected
            assert.equal(
                await getColorOfNthElement('[data-test="badge-driver"]', 1),
                '#000000'
            );

            // all protein driver badges are deselected
            assert.equal(
                await getColorOfNthElement(
                    '[data-test="badge-driver"]',
                    1,
                    'background-color'
                ),
                await getColorByTestHandle(
                    'badge-missense_putative_driver',
                    'background-color'
                )
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-missense_putative_driver',
                    'background-color'
                ),
                await getColorByTestHandle(
                    'badge-truncating_putative_driver',
                    'background-color'
                )
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-truncating_putative_driver',
                    'background-color'
                ),
                await getColorByTestHandle(
                    'badge-inframe_putative_driver',
                    'background-color'
                )
            );

            assert.equal(
                await getColorByTestHandle(
                    'badge-inframe_putative_driver',
                    'background-color'
                ),
                await getColorByTestHandle(
                    'badge-splice_putative_driver',
                    'background-color'
                )
            );

            // selecting driver badge
            await clickElement(
                await getNthElements('[data-test="badge-driver"]', 1),
                { moveTo: true }
            );

            assert.equal(
                await (
                    await getElementByTestHandle('filter-reset-panel')
                ).isDisplayed(),
                false
            );
        });
    });

    describe('displaying fisher exact test label', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison/mutations?sessionId=5cf89323e4b0ab413787436c&selectedGene=AR`
            );
            await getElement('.lollipop-svgnode', {
                timeout: 30000,
            });
        });

        it('fisher test text and tooltip dynamically changes when filtering and selecting', async () => {
            // filter value
            await clickElement('handle=missense_putative_driver_only', {
                moveTo: true,
            });

            assert.equal(
                await (
                    await getElementByTestHandle('fisherTestLabel')
                ).getText(),
                'Fisher Exact Two-Sided Test p-value for filtered mutations - (A) Metastasis vs (B) Primary: 4.21e-8'
            );

            await jsApiHover(await getElementByTestHandle('infoIcon'));

            await (
                await getElementByTestHandle('patientMultipleMutationsMessage')
            ).waitForExist();
            assert.equal(
                await (
                    await getElementByTestHandle(
                        'patientMultipleMutationsMessage'
                    )
                ).getText(),
                '3 patients have more than one mutation in AR'
            );

            // select value
            await (await getElement('.lollipop-3')).click();

            assert.equal(
                await (
                    await getElementByTestHandle('fisherTestLabel')
                ).getText(),
                'Fisher Exact Two-Sided Test p-value for selected mutations - (A) Metastasis vs (B) Primary: 0.0305'
            );

            await jsApiHover(await getElementByTestHandle('infoIcon'));

            await (
                await getElementByTestHandle('patientMultipleMutationsMessage')
            ).waitForExist();
            assert.equal(
                await (
                    await getElementByTestHandle(
                        'patientMultipleMutationsMessage'
                    )
                ).getText(),
                '1 patient has more than one mutation in AR'
            );

            // default value
            await (await getElement('button=Remove filter')).click();

            assert.equal(
                await (
                    await getElementByTestHandle('fisherTestLabel')
                ).getText(),
                'Fisher Exact Two-Sided Test p-value for all mutations - (A) Metastasis vs (B) Primary: 7.200e-6'
            );

            await jsApiHover(await getElementByTestHandle('infoIcon'));

            await (
                await getElementByTestHandle('patientMultipleMutationsMessage')
            ).waitForExist();
            assert.equal(
                await (
                    await getElementByTestHandle(
                        'patientMultipleMutationsMessage'
                    )
                ).getText(),
                '4 patients have more than one mutation in AR'
            );
        });
    });

    describe('displaying table header and pagination status text', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison/mutations?sessionId=5cf89323e4b0ab413787436c&selectedGene=AR`
            );
            await getElement('.lollipop-svgnode', {
                timeout: 30000,
            });
        });

        it('displays correct text and number of mutations and protein changes when filtering and selecting', async () => {
            // filter value
            await (await getElement('strong=Inframe')).click();

            assert.equal(
                await (
                    await getElementByTestHandle('LazyMobXTable_CountHeader')
                ).getText(),
                '14 Mutations'
            );

            assert.equal(
                await (await getElement('.topPagination')).getText(),
                'Showing 1-14 of 14 Mutations'
            );

            // select value
            await (await getElement('.lollipop-1')).click();

            assert.equal(
                await (
                    await getElementByTestHandle('LazyMobXTable_CountHeader')
                ).getText(),
                '1 Mutation'
            );

            assert.equal(
                await (await getElement('.topPagination')).getText(),
                'Showing 1-1 of 1 Mutation'
            );

            // default value
            await (await getElement('button=Remove filter')).click();

            assert.equal(
                await (
                    await getElementByTestHandle('LazyMobXTable_CountHeader')
                ).getText(),
                '16 Mutations'
            );

            assert.equal(
                await (await getElement('.topPagination')).getText(),
                'Showing 1-16 of 16 Mutations'
            );
        });
    });

    describe('mutation table filtering options', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison/mutations?sessionId=5cf89323e4b0ab413787436c&selectedGene=AR`
            );
            await getElement('.lollipop-svgnode', {
                timeout: 30000,
            });
        });

        it('filters table with search box', async () => {
            const searchInput = '[data-test=table-search-input]';
            const numberOfRowsBefore = (await $$('tr')).length;
            await (await getElement(searchInput)).setValue('w7');
            await browser.waitUntil(
                async () => (await $$('tr')).length < numberOfRowsBefore
            );
            assert((await $$('tr')).length < numberOfRowsBefore);
        });

        it('filters table with enriched in dropdown', async () => {
            const numberOfRowsBefore = (await $$('tr')).length;
            await (await getElementByTestHandle('enrichedInDropdown')).click();
            await (await getElement('#react-select-6-option-0-0')).click();
            await browser.waitUntil(
                async () => (await $$('tr')).length < numberOfRowsBefore
            );
            assert((await $$('tr')).length < numberOfRowsBefore);
        });

        it('filters table with significant only checkbox', async () => {
            const numberOfRowsBefore = (await $$('tr')).length;
            await (
                await getElementByTestHandle('significantOnlyCheckbox')
            ).click();
            await browser.waitUntil(
                async () => (await $$('tr')).length < numberOfRowsBefore
            );
            assert((await $$('tr')).length < numberOfRowsBefore);
        });

        it('filters table with protein badge filtering', async () => {
            const numberOfRowsBefore = (await $$('tr')).length;
            await (await getElement('strong=Missense')).click();
            await browser.waitUntil(
                async () => (await $$('tr')).length < numberOfRowsBefore
            );
            assert((await $$('tr')).length < numberOfRowsBefore);
        });

        it('filters table with lollipop selection', async () => {
            const numberOfRowsBefore = (await $$('tr')).length;
            await (await getElement('.lollipop-1')).click();
            await browser.waitUntil(
                async () => (await $$('tr')).length < numberOfRowsBefore
            );
            assert((await $$('tr')).length < numberOfRowsBefore);
        });
    });
});
