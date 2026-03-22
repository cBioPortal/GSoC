const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    waitForStudyQueryPage,
    waitForOncoprint,
    useExternalFrontend,
    waitForPatientView,
    waitForStudyView,
    jsApiHover,
    setServerConfiguration,
    openGroupComparison,
    getElement,
    waitForElementDisplayed,
    clickElement,
    getNthElements,
    waitForNetworkQuiet,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const downloadIcon = '.fa-download';
const downloadCloudIcon = '.fa-cloud-download';
const clipboardIcon = '.fa-clipboard';

const globalCheck = async () => {
    assert(
        !(await (await getElement('*=Download')).isExisting()),
        'The word "Download" occurs on the page. Make sure that it is displayed conditionally based on the skin_hide_download_controls property'
    );
    assert(
        !(await (await getElement('*=download')).isExisting()),
        'The word "download" occurs on the page. Make sure that it is displayed conditionally based on the skin_hide_download_controls property'
    );
    assert(
        !(await (await getElement(downloadIcon)).isExisting()),
        'A download button/icon is visible on the page. Make sure that it is displayed conditionally based on the skin_hide_download_controls property'
    );
    assert(
        !(await (await getElement(downloadCloudIcon)).isExisting()),
        'A cloud download button/icon is visible on the page. Make sure that it is displayed conditionally based on the skin_hide_download_controls property'
    );
    assert(
        !(await (await getElement(clipboardIcon)).isExisting()),
        'A download button/icon is visible on the page. Make sure that it is displayed conditionally based on the skin_hide_download_controls property'
    );
};

const openAndSetProperty = async (url, prop) => {
    await goToUrlAndSetLocalStorage(url, true);
    await setServerConfiguration(prop);
    await goToUrlAndSetLocalStorage(url, true);
};

const waitForTabs = async count => {
    await browser.waitUntil(async () => {
        return (await $$('.tabAnchor')).length >= count;
    }, 300000);
};

async function studyViewChartHoverHamburgerIcon(chartDataTest, timeout) {
    // move to the chart
    const chart = '[data-test=' + chartDataTest + ']';
    await waitForElementDisplayed(chart, { timeout: timeout });
    await jsApiHover(chart);

    // move to hamburger icon
    const hamburgerIcon = '[data-test=chart-header-hamburger-icon]';
    await jsApiHover(hamburgerIcon);
}

describe('hide download controls feature', function() {
    if (useExternalFrontend) {
        describe('study query page', () => {
            const expectedTabNames = ['Query'];

            before(async () => {
                await openAndSetProperty(CBIOPORTAL_URL, {
                    skin_hide_download_controls: 'hide',
                });
                // browser.debug();
                await waitForStudyQueryPage();
                await waitForTabs(expectedTabNames.length);
            });

            it('covers all tabs with download control tests', async () => {
                const tabElements = await $$('.tabAnchor');
                const displayedTabs = await Promise.all(
                    tabElements.map(async a =>
                        (await a.isDisplayed()) ? a : null
                    )
                );
                const visibleTabs = displayedTabs.filter(a => a !== null);
                const observedTabNames = await Promise.all(
                    visibleTabs.map(async a => await a.getText())
                );
                assert.deepStrictEqual(
                    expectedTabNames,
                    observedTabNames,
                    'There appears to be a new tab on the page (observed names: [' +
                        observedTabNames.join(', ') +
                        '] expected names: [' +
                        expectedTabNames.join(', ') +
                        ']). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include' +
                        ' tests for this in hide-download-controls.spec.js.'
                );
            });

            it('global check for icon and occurrence of "Download" as a word', async () => {
                await globalCheck();
            });

            it('does not show Download tab', async () => {
                assert(
                    !(await (
                        await getElement('.tabAnchor_download')
                    ).isExisting())
                );
            });

            it('does not show download icons data sets in study rows', async () => {
                await goToUrlAndSetLocalStorage(
                    `${CBIOPORTAL_URL}/datasets`,
                    true
                );
                await (
                    await getElement('[data-test=LazyMobXTable]')
                ).waitForExist();
                assert(!(await (await getElement(downloadIcon)).isExisting()));
            });
        });

        describe('results view page', () => {
            const expectedTabNames = [
                'OncoPrint',
                'Cancer Types Summary',
                'Mutual Exclusivity',
                'Plots',
                'Mutations',
                'Co-expression',
                'Comparison/Survival',
                'CN Segments',
                'Pathways',
            ];
            before(async () => {
                await browser.setWindowSize(3200, 1000);

                await openAndSetProperty(
                    `${CBIOPORTAL_URL}/results/oncoprint?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&cancer_study_list=study_es_0&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=mutations%2Cgistic&case_set_id=study_es_0_cnaseq&gene_list=CREB3L1%2520RPS11%2520PNMA1%2520MMP2%2520ZHX3%2520ERCC5%2520TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit&comparison_subtab=mrna`,
                    { skin_hide_download_controls: 'hide' }
                );
                await waitForOncoprint();
                await waitForTabs(expectedTabNames.length);
            });

            it('covers all tabs with download control tests', async () => {
                const tabElements = await $$('.tabAnchor');
                const displayedTabs = await Promise.all(
                    tabElements.map(async a =>
                        (await a.isDisplayed()) ? a : null
                    )
                );
                const visibleTabs = displayedTabs.filter(a => a !== null);
                const observedTabNames = await Promise.all(
                    visibleTabs.map(async a => await a.getText())
                );

                assert.deepStrictEqual(
                    expectedTabNames,
                    observedTabNames,
                    'There appears to be a new tab on the page (observed names: [' +
                        observedTabNames.join(', ') +
                        '] expected names: [' +
                        expectedTabNames.join(', ') +
                        ']). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include' +
                        ' tests for this in hide-download-controls.spec.js.'
                );
            });

            describe('oncoprint', () => {
                it('does not show download/clipboard icons and does not contain the word "Download"', async () => {
                    await globalCheck();
                });
            });

            describe('cancer type summary', () => {
                it('does not show download/clipboard icons and does not contain the word "Download"', async () => {
                    await clickElement('.tabAnchor_cancerTypesSummary');
                    await (
                        await getElement('[data-test=cancerTypeSummaryChart]')
                    ).waitForExist();
                    await globalCheck();
                });
            });

            describe('mutual exclusivity', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_mutualExclusivity');
                    await (
                        await getElement('[data-test=LazyMobXTable]')
                    ).waitForExist();
                    await globalCheck();
                });
            });

            describe('plots', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_plots');
                    await (
                        await getElement('=mRNA vs mut type')
                    ).waitForExist();
                    await clickElement('=mRNA vs mut type');
                    await (
                        await getElement('[data-test=PlotsTabPlotDiv]')
                    ).waitForExist();
                    await globalCheck();
                });
            });

            describe('mutations', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_mutations');
                    await (
                        await getElement('[data-test=LollipopPlot]')
                    ).waitForExist();
                    await clickElement('.tabAnchor_TP53');
                    await (
                        await getElement('[data-test=LollipopPlot]')
                    ).waitForExist();
                    await globalCheck();
                    // $('[data-test=view3DStructure]').click();
                    // $('.borderedChart canvas').waitForExist();
                    // globalCheck();
                });
            });

            describe('co-expression', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_coexpression');
                    await (
                        await getElement('#coexpression-plot-svg')
                    ).waitForExist();
                    await globalCheck();
                });
            });

            describe('comparison/survival', () => {
                before(async () => {
                    await clickElement('.tabAnchor_comparison');
                    await waitForNetworkQuiet();
                });
                it('covers all tabs with download control tests', async () => {
                    const expectedTabNames = [
                        'Overlap',
                        'Survival',
                        'Clinical',
                        'Genomic Alterations',
                        'mRNA',
                        'DNA Methylation',
                        'Generic Assay Patient Test',
                        'Mutational Signature',
                        'Treatment Response',
                    ];

                    const tabElements = await $$(
                        '[data-test=ComparisonTabDiv] .tabAnchor'
                    );
                    const displayedTabs = await Promise.all(
                        tabElements.map(async a =>
                            (await a.isDisplayed()) ? a : null
                        )
                    );
                    const visibleTabs = displayedTabs.filter(a => a !== null);
                    const observedTabNames = await Promise.all(
                        visibleTabs.map(async a => await a.getText())
                    );

                    assert.deepStrictEqual(
                        expectedTabNames,
                        observedTabNames,
                        'There appears to be a new tab on the page (observed names: [' +
                            observedTabNames.join(', ') +
                            '] expected names: [' +
                            expectedTabNames.join(', ') +
                            ']). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include' +
                            ' tests for this in hide-download-controls.spec.js.'
                    );
                });
                describe('overlap tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', async () => {
                        await clickElement('.tabAnchor_overlap');
                        await (
                            await getElement(
                                '[data-test=ComparisonPageOverlapTabContent]'
                            )
                        ).waitForExist();
                        await globalCheck();
                    });
                });
                describe('survival tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', async () => {
                        await clickElement('.tabAnchor_survival');
                        await (
                            await getElement('[data-test=SurvivalChart]')
                        ).waitForExist();
                        await globalCheck();
                    });
                });
                describe('clinical tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', async () => {
                        await clickElement('.tabAnchor_clinical');
                        await (
                            await getElement('[data-test=ClinicalTabPlotDiv]')
                        ).waitForExist();
                        await (
                            await getElement('[data-test=LazyMobXTable]')
                        ).waitForExist();
                        await globalCheck();
                    });
                });
                describe('alterations tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', async () => {
                        await clickElement('.tabAnchor_alterations');
                        await (
                            await getElement('[data-test=LazyMobXTable]')
                        ).waitForExist();
                        await globalCheck();
                    });
                });
                describe('mrna tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', async () => {
                        await clickElement('.tabAnchor_mrna');
                        await (
                            await getElement(
                                '[data-test=GroupComparisonMRNAEnrichments]'
                            )
                        ).waitForExist();
                        await (
                            await getNthElements(
                                '[data-test=GroupComparisonMRNAEnrichments] tbody tr b',
                                0
                            )
                        ).click();
                        await (
                            await getElement('[data-test=MiniBoxPlot]')
                        ).waitForExist();
                        await globalCheck();
                    });
                });
                describe('dna_methylation tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', async () => {
                        await clickElement('.tabAnchor_dna_methylation');
                        await (
                            await getElement(
                                '[data-test=GroupComparisonMethylationEnrichments]'
                            )
                        ).waitForExist();
                        await (
                            await getNthElements(
                                '[data-test=GroupComparisonMethylationEnrichments] tbody tr b',
                                0
                            )
                        ).click();
                        await (
                            await getElement('[data-test=MiniBoxPlot]')
                        ).waitForExist();
                        await globalCheck();
                    });
                });
                describe('treatment response tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', async () => {
                        await clickElement(
                            '.tabAnchor_generic_assay_treatment_response'
                        );
                        await getElement(
                            '[data-test=GroupComparisonGenericAssayEnrichments]',
                            {
                                waitForExist: true,
                            }
                        );
                        await (
                            await getNthElements(
                                '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b',
                                0
                            )
                        ).click();
                        await getElement('[data-test=MiniBoxPlot]', {
                            waitForExist: true,
                        });
                        await globalCheck();
                    });
                });
                describe('mutational signature tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', async () => {
                        await clickElement(
                            '.tabAnchor_generic_assay_mutational_signature'
                        );
                        await (
                            await getElement(
                                '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b'
                            )
                        ).waitForExist();
                        await browser.pause(1000);
                        await (
                            await getNthElements(
                                '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b',
                                1
                            )
                        ).click(); // first row is invisible treatment response 'Name of 17-AAG'
                        await getElement('[data-test=MiniBoxPlot]', {
                            waitForExist: true,
                        });
                        await globalCheck();
                    });
                });
                // Activation of the 'Patient Test' tab results in a backend error. Omitting for now.
                // Inactivation of download tabs is also covered by other Generic Assay tabs.
                describe.skip('generic assay patient test tab', () => {
                    it('global check for icon and occurrence of "Download" as a word', async () => {
                        await clickElement(
                            '.tabAnchor_generic_assay_generic_assay_patient_test'
                        );
                        await getElement(
                            '[data-test=GroupComparisonGenericAssayEnrichments]',
                            { waitForExist: true }
                        );
                        await (
                            await getNthElements(
                                '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b',
                                5
                            )
                        ).click(); // first 5 rows is invisible treatment responses
                        await getElement('[data-test=MiniBoxPlot]', {
                            waitForExist: true,
                        });
                        await globalCheck();
                    });
                });

                describe('CN segments', () => {
                    before(async () => {
                        await clickElement('.tabAnchor_cnSegments');
                        await getElement('.igvContainer', {
                            waitForExist: true,
                        });
                    });
                    it('global check for icon and occurrence of "Download" as a word', async () => {
                        await globalCheck();
                    });
                });

                describe('pathways', () => {
                    before(async () => {
                        await clickElement('.tabAnchor_pathways');
                        await getElement('.pathwayMapper', {
                            waitForExist: true,
                        });
                    });
                    it('global check for icon and occurrence of "Download" as a word', async () => {
                        await globalCheck();
                    });
                });

                it('does not show Download tab', async () => {
                    assert(
                        !(await (
                            await getElement('.tabAnchor_download')
                        ).isExisting())
                    );
                });
            });
        });

        describe('patient view', () => {
            const expectedTabNames = [
                'Summary',
                'Pathways',
                'Clinical Data',
                'Files & Links',
                'Tissue Image',
                'Pathology Slide',
                'Study Sponsors',
            ];
            before(async () => {
                await openAndSetProperty(
                    `${CBIOPORTAL_URL}/patient?studyId=study_es_0&caseId=TCGA-A1-A0SK`,
                    { skin_hide_download_controls: 'hide' }
                );
                await waitForPatientView();
                await waitForTabs(expectedTabNames.length);
            });
            it('covers all tabs with download control tests', async () => {
                const tabElements = await $$('.tabAnchor');
                const displayedTabs = await Promise.all(
                    tabElements.map(async a =>
                        (await a.isDisplayed()) ? a : null
                    )
                );
                const visibleTabs = displayedTabs.filter(a => a !== null);
                const observedTabNames = await Promise.all(
                    visibleTabs.map(async a => await a.getText())
                );

                assert.deepStrictEqual(
                    expectedTabNames,
                    observedTabNames,
                    'There appears to be a new tab on the page (observed names: [' +
                        observedTabNames.join(', ') +
                        '] expected names: [' +
                        expectedTabNames.join(', ') +
                        ']). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include' +
                        ' tests for this in hide-download-controls.spec.js.'
                );
            });
            describe('summary tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_summary');
                    await getElement('[data-test=LazyMobXTable]', {
                        waitForExist: true,
                    });
                    await globalCheck();
                });
            });
            describe('pathways tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_pathways');
                    await getElement('.pathwayMapper', {
                        waitForExist: true,
                    });
                    await globalCheck();
                });
            });
            describe('clinical data tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_clinicalData');
                    await getElement('[data-test=LazyMobXTable]', {
                        waitForExist: true,
                    });
                    await globalCheck();
                });
            });
            describe('files and links tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_filesAndLinks');
                    await getElement('.resourcesSection', {
                        waitForExist: true,
                    });
                    await globalCheck();
                });
            });
            describe('tissue image tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_tissueImage');
                    await getElement('iframe', { waitForExist: true });
                    await globalCheck();
                });
            });
            describe('pathology slide tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement(
                        '.tabAnchor_openResource_PATHOLOGY_SLIDE'
                    );
                    await getElement('h2', { waitForExist: true });
                    await globalCheck();
                });
            });
            describe('study sponsors tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement(
                        '.tabAnchor_openResource_STUDY_SPONSORS'
                    );
                    await getElement('h2', { waitForExist: true });
                    await globalCheck();
                });
            });
        });

        describe('study view', () => {
            const expectedTabNames = [
                'Summary',
                'Clinical Data',
                'CN Segments',
                'Files & Links',
                'Plots Beta!',
                'Study Sponsors',
            ];
            before(async () => {
                await openAndSetProperty(
                    `${CBIOPORTAL_URL}/study/summary?id=study_es_0`,
                    { skin_hide_download_controls: 'hide' }
                );
                await waitForStudyView();
                await waitForTabs(expectedTabNames.length);
            });
            describe('summary tab', () => {
                it('covers all tabs with download control tests', async () => {
                    const tabElements = await $$('.tabAnchor');
                    console.log('visibleTabs', { tabElements });
                    const displayedTabs = await Promise.all(
                        tabElements.map(async a =>
                            (await a.isDisplayed()) ? a : null
                        )
                    );
                    console.log('visibleTabs', { displayedTabs });
                    const visibleTabs = displayedTabs.filter(a => a !== null);
                    console.log('visibleTabs', { visibleTabs });
                    const observedTabNames = await Promise.all(
                        visibleTabs.map(async a => await a.getText())
                    );
                    assert.deepStrictEqual(
                        expectedTabNames,
                        observedTabNames,
                        'There appears to be a new tab on the page (observed names: [' +
                            observedTabNames.join(', ') +
                            '] expected names: [' +
                            expectedTabNames.join(', ') +
                            ']). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include' +
                            ' tests for this in hide-download-controls.spec.js.'
                    );
                });
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await globalCheck();
                });
                it('does not show download option in chart menu-s', async () => {
                    await studyViewChartHoverHamburgerIcon(
                        'chart-container-SAMPLE_COUNT',
                        1000
                    );
                    await globalCheck();
                    await studyViewChartHoverHamburgerIcon(
                        'chart-container-study_es_0_mutations',
                        1000
                    );
                    await globalCheck();
                    await studyViewChartHoverHamburgerIcon(
                        'chart-container-MUTATION_COUNT',
                        1000
                    );
                    await globalCheck();
                    await studyViewChartHoverHamburgerIcon(
                        'chart-container-GENOMIC_PROFILES_SAMPLE_COUNT',
                        1000
                    );
                    await globalCheck();
                    await studyViewChartHoverHamburgerIcon(
                        'chart-container-FRACTION_GENOME_ALTERED',
                        1000
                    );
                    await globalCheck();
                    await studyViewChartHoverHamburgerIcon(
                        'chart-container-OS_SURVIVAL',
                        1000
                    );
                    await globalCheck();
                });
            });
            describe('clinical data tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_clinicalData');
                    await getElement('[data-test=LazyMobXTable]', {
                        waitForExist: true,
                    });
                    await globalCheck();
                });
            });
            describe('CN segments tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_cnSegments');
                    await getElement('.igvContainer', { timeout: 30000 });
                    await globalCheck();
                });
            });
            describe('files and links tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_filesAndLinks');
                    await getElement('.resourcesSection', {
                        waitForExist: true,
                    });
                    await globalCheck();
                });
            });
            describe('study sponsors tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement(
                        '.tabAnchor_openResource_STUDY_SPONSORS'
                    );
                    await getElement('h2', { waitForExist: true });
                    await globalCheck();
                });
            });
        });

        describe('group comparison', () => {
            const expectedTabNames = [
                'Overlap',
                'Survival',
                'Clinical',
                'Genomic Alterations',
                'Mutations Beta!',
                'mRNA',
                'DNA Methylation',
                'Generic Assay Patient Test',
                'Mutational Signature',
                'Treatment Response',
            ];
            before(async () => {
                await openAndSetProperty(await browser.getUrl(), {
                    skin_hide_download_controls: 'show',
                });
                await openGroupComparison(
                    `${CBIOPORTAL_URL}/study/summary?id=study_es_0`,
                    'chart-container-OS_STATUS',
                    30000
                );
                await openAndSetProperty(await browser.getUrl(), {
                    skin_hide_download_controls: 'hide',
                });
                await waitForTabs(expectedTabNames.length);
            });
            it('covers all tabs with download control tests', async () => {
                const allTabs = await $$('.tabAnchor');
                const observedTabNames = [];
                for (const tab of allTabs) {
                    if (await tab.isDisplayed()) {
                        observedTabNames.push(await tab.getText());
                    }
                }
                assert.deepStrictEqual(
                    expectedTabNames,
                    observedTabNames,
                    'There appears to be a new tab on the page (observed names: [' +
                        observedTabNames.join(', ') +
                        '] expected names: [' +
                        expectedTabNames.join(', ') +
                        ']). Please make sure to hide download controls depending on the "skin_hide_download_controls" property and include' +
                        ' tests for this in hide-download-controls.spec.js.'
                );
            });
            describe('overlap tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await getElement(
                        '[data-test=ComparisonPageOverlapTabDiv]',
                        {
                            waitForExist: true,
                        }
                    );
                    await globalCheck();
                });
            });
            describe('survival tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_survival');
                    await getElement(
                        '[data-test=ComparisonPageSurvivalTabDiv]',
                        {
                            waitForExist: true,
                        }
                    );
                    await globalCheck();
                });
            });
            describe('clinical tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_clinical');
                    await getElement('[data-test=LazyMobXTable]', {
                        waitForExist: true,
                    });
                    await getElement('[data-test=ClinicalTabPlotDiv]', {
                        waitForExist: true,
                    });
                    await globalCheck();
                });
            });
            describe('genomic alterations tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_alterations');
                    await getElement('[data-test=GeneBarPlotDiv]', {
                        waitForExist: true,
                    });
                    await globalCheck();
                });
            });
            describe('mRNA tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_mrna');
                    await getElement(
                        '[data-test=GroupComparisonMRNAEnrichments]',
                        {
                            waitForExist: true,
                        }
                    );
                    await (
                        await getNthElements(
                            '[data-test=GroupComparisonMRNAEnrichments] tbody tr b',
                            0
                        )
                    ).click();
                    await getElement('[data-test=MiniBoxPlot]', {
                        waitForExist: true,
                    });
                    await globalCheck();
                });
            });
            describe('DNA methylation tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement('.tabAnchor_dna_methylation');
                    await getElement(
                        '[data-test=GroupComparisonMethylationEnrichments]',
                        {
                            waitForExist: true,
                        }
                    );
                    await (
                        await getNthElements(
                            '[data-test=GroupComparisonMethylationEnrichments] tbody tr b',
                            0
                        )
                    ).click();
                    await getElement('[data-test=MiniBoxPlot]', {
                        waitForExist: true,
                    });
                    await globalCheck();
                });
            });
            describe('treatment response tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement(
                        '.tabAnchor_generic_assay_treatment_response'
                    );
                    await getElement('[data-test=LazyMobXTable]', {
                        waitForExist: true,
                    });
                    await getElement(
                        '[data-test=GroupComparisonGenericAssayEnrichments]',
                        {
                            waitForExist: true,
                        }
                    );
                    await (
                        await getNthElements(
                            '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b',
                            0
                        )
                    ).click();

                    await getElement('[data-test=MiniBoxPlot]', {
                        waitForExist: true,
                    });
                    await globalCheck();
                });
            });
            describe('mutational signature tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement(
                        '.tabAnchor_generic_assay_mutational_signature'
                    );
                    await getElement(
                        '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b',
                        {
                            waitForExist: true,
                        }
                    );
                    await browser.pause(1000);
                    await (
                        await getNthElements(
                            '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b',
                            5
                        )
                    ).click(); // first 5 rows is invisible treatment responses
                    await getElement('[data-test=MiniBoxPlot]', {
                        waitForExist: true,
                    });
                    await globalCheck();
                });
            });
            // Activation of the 'Patient Test' tab results in a backend error. Omitting for now.
            // Inactivation of download tabs is also covered by other Generic Assay tabs.
            describe.skip('generic assay patient test tab', () => {
                it('global check for icon and occurrence of "Download" as a word', async () => {
                    await clickElement(
                        '.tabAnchor_generic_assay_generic_assay_patient_test'
                    );
                    await getElement(
                        '[data-test=GroupComparisonGenericAssayEnrichments]',
                        {
                            waitForExist: true,
                        }
                    );
                    await (
                        await getNthElements(
                            '[data-test=GroupComparisonGenericAssayEnrichments] tbody tr b',
                            5
                        )
                    ).click(); // first 5 rows is invisible treatment responses
                    await getElement('[data-test=MiniBoxPlot]', {
                        waitForExist: true,
                    });
                    await globalCheck();
                });
            });
        });
    }
});
