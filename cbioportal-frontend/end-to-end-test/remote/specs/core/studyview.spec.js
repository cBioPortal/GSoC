const assert = require('assert');
const {
    waitForOncoprint,
    goToUrlAndSetLocalStorage,
    waitForNetworkQuiet,
    toStudyViewSummaryTab,
    toStudyViewClinicalDataTab,
    getNumberOfStudyViewCharts,
    getTextFromElement,
    waitForStudyViewSelectedInfo,
    waitForStudyView,
    setDropdownOpen,
    jsApiHover,
    setCheckboxChecked,
    getElementByTestHandle,
    checkElementWithMouseDisabled,
    setInputText,
    elementExists,
    clickElement,
    getElement,
    getColorOfNthElement,
    getNthElements,
    waitForElementDisplayed,
} = require('../../../shared/specUtils_Async');
const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const CUSTOM_SELECTION_BUTTON = "[data-test='custom-selection-button']";
const SELECTED_SAMPLES = "strong[data-test='selected-samples']";
const SELECTED_PATIENTS = "strong[data-test='selected-patients']";
const ADD_CHART_BUTTON = "[data-test='add-charts-button']";
const ADD_CHART_CLINICAL_TAB = '.addChartTabs a.tabAnchor_Clinical';
const ADD_CHART_GENOMIC_TAB = '.addChartTabs a.tabAnchor_Genomic';
const ADD_CHART_CUSTOM_DATA_TAB = '.addChartTabs a.tabAnchor_Custom_Data';
const ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON =
    "[data-test='CustomCaseSetSubmitButton']";
const ADD_CHART_GENERIC_ASSAY_TAB =
    '.addChartTabs a.tabAnchor_MICROBIOME_SIGNATURE';
const ADD_CHART_CUSTOM_GROUPS_TEXTAREA = "[data-test='CustomCaseSetInput']";
const STUDY_SUMMARY_RAW_DATA_DOWNLOAD =
    "[data-test='studySummaryRawDataDownloadIcon']";
const CNA_GENES_TABLE = "[data-test='copy number alterations-table']";
const CANCER_GENE_FILTER_ICON = "[data-test='header-filter-icon']";

const WAIT_FOR_VISIBLE_TIMEOUT = 30000;

const hide = ['.chartHeader .controls'];

describe('study laml_tcga tests', () => {
    before(async () => {
        const url = `${CBIOPORTAL_URL}/study?id=laml_tcga`;
        await goToUrlAndSetLocalStorage(url);
    });
    it('study view laml_tcga', async () => {
        await (
            await getElementByTestHandle('summary-tab-content')
        ).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await waitForNetworkQuiet();
        // screenshot seems to occasionally fail because of tooltip showing up
        // see "need-fixing" tests
        // const res = browser.checkElement('#mainColumn');
        // assertScreenShotMatch(res);
    });
    it('study view laml_tcga clinical data clicked', async () => {
        await clickElement('.tabAnchor_clinicalData');
        await (
            await getElementByTestHandle('clinical-data-tab-content')
        ).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await waitForNetworkQuiet();
        const res = await checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('study should have the raw data available', async () => {
        assert(
            await (
                await getElement(STUDY_SUMMARY_RAW_DATA_DOWNLOAD)
            ).isExisting()
        );
    });

    it('when quickly adding charts, each chart should get proper data.', async function() {
        this.retries(0);

        await toStudyViewSummaryTab();
        await waitForStudyViewSelectedInfo();
        await clickElement(ADD_CHART_BUTTON);
        // Wait for the data frequency is calculated
        await waitForNetworkQuiet();

        // Add three charts
        await clickElement("[data-test='add-chart-option-cancer-type'] input");
        await clickElement("[data-test='add-chart-option-case-lists'] input");

        // Pause a bit time to let the page render the charts
        await waitForStudyView();
        const res = await checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('when adding chart with categories more than the pie2Table threshold, the pie chart should be converted to table', async () => {
        await setInputText(
            "[data-test='fixed-header-table-search-input']",
            'Other Sample ID'
        );
        await browser.pause(2000);
        await (
            await getElement(
                "[data-test='add-chart-option-other-sample-id'] input"
            )
        ).waitForDisplayed({ timeout: WAIT_FOR_VISIBLE_TIMEOUT });
        await clickElement(
            "[data-test='add-chart-option-other-sample-id'] label"
        );
        await browser.pause(2000);
        await (
            await getElement(
                "[data-test='chart-container-OTHER_SAMPLE_ID'] .ReactVirtualized__Table"
            )
        ).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        const res = await browser.checkElement(
            "[data-test='chart-container-OTHER_SAMPLE_ID']"
        );
        assertScreenShotMatch(res);
    });

    it('custom Selection should trigger filtering the study, no chart should be added, custom selection tooltip should be closed', async () => {
        await clickElement(CUSTOM_SELECTION_BUTTON);
        await browser.pause(2000);

        // Select button should be disabled
        assert(
            !(await (
                await getElement(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON)
            ).isEnabled())
        );
        await (
            await getElement(ADD_CHART_CUSTOM_GROUPS_TEXTAREA)
        ).waitForDisplayed();
        await setInputText(
            ADD_CHART_CUSTOM_GROUPS_TEXTAREA,
            'laml_tcga:TCGA-AB-2802-03\nlaml_tcga:TCGA-AB-2803-03\n'
        );
        await (
            await getElement(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON)
        ).waitForEnabled();
        await clickElement(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON);

        await waitForStudyViewSelectedInfo();
        assert((await getTextFromElement(SELECTED_PATIENTS)) === '2');
        assert((await getTextFromElement(SELECTED_SAMPLES)) === '2');

        // clear the filters
        await (
            await getElementByTestHandle('clear-all-filters')
        ).waitForDisplayed();
        await clickElement("[data-test='clear-all-filters']");
    });

    describe('add chart', () => {
        it('the button text should be updated in different tab', async () => {
            await toStudyViewSummaryTab();
            assert((await getTextFromElement(ADD_CHART_BUTTON)) === 'Charts ▾');

            await toStudyViewClinicalDataTab();
            assert(
                (await getTextFromElement(ADD_CHART_BUTTON)) === 'Columns ▾'
            );
        });
        it('chart in genomic tab can be updated', async () => {
            await toStudyViewSummaryTab();
            const numOfChartsBeforeAdding = await getNumberOfStudyViewCharts();
            await setDropdownOpen(
                true,
                ADD_CHART_BUTTON,
                ADD_CHART_GENOMIC_TAB
            );
            await clickElement(ADD_CHART_GENOMIC_TAB);
            await browser.pause(2000);

            const chosenCheckbox =
                '.addChartTabs .addGenomicChartTab .add-chart-option:nth-child(1) input';

            await getElement(chosenCheckbox, { timeout: 10000 });

            const isSelected = await (
                await getElement(chosenCheckbox)
            ).isSelected();

            await clickElement(chosenCheckbox);
            assert(
                numOfChartsBeforeAdding ===
                    (await getNumberOfStudyViewCharts()) + (isSelected ? 1 : -1)
            );
        });
        it('chart in clinical tab can be updated', async () => {
            const numOfChartsBeforeAdding = await getNumberOfStudyViewCharts();

            if (
                !(await (
                    await getElement(ADD_CHART_CLINICAL_TAB)
                ).isDisplayed())
            ) {
                await clickElement(ADD_CHART_BUTTON);
            }
            await clickElement(ADD_CHART_CLINICAL_TAB);

            const chosenCheckbox = await getElement(
                '.addChartTabs .add-chart-option input'
            );
            const isSelected = await chosenCheckbox.isSelected();

            await chosenCheckbox.click();
            assert(
                numOfChartsBeforeAdding ===
                    (await getNumberOfStudyViewCharts()) + (isSelected ? 1 : -1)
            );
        });
        describe('add custom data', () => {
            before(async () => {
                if (
                    !(await (
                        await getElement(ADD_CHART_CUSTOM_DATA_TAB)
                    ).isDisplayed())
                ) {
                    await (await getElement(ADD_CHART_BUTTON)).waitForExist();
                    await clickElement(ADD_CHART_BUTTON);
                }
                await (
                    await getElement(ADD_CHART_CUSTOM_DATA_TAB)
                ).waitForExist();
                await clickElement(ADD_CHART_CUSTOM_DATA_TAB);
            });
            it('add chart button should be disabled when no content in the textarea', async () => {
                assert(
                    !(await (
                        await getElement(
                            ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON
                        )
                    ).isEnabled())
                );
            });
            it('add chart button should be disabled when content is invalid', async () => {
                await setInputText(ADD_CHART_CUSTOM_GROUPS_TEXTAREA, 'test');
                // pause to wait for the content validation
                await (
                    await getElement('[data-test=ValidationResultWarning]')
                ).waitForDisplayed();
                assert(
                    !(await (
                        await getElement(
                            ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON
                        )
                    ).isEnabled())
                );
            });
            it('add chart button should be enabled when content is valid', async () => {
                await setInputText(
                    ADD_CHART_CUSTOM_GROUPS_TEXTAREA,
                    'laml_tcga:TCGA-AB-2802-03'
                );
                // pause to wait for the content validation (remove the error message from the previous test)
                await (
                    await getElement('[data-test=ValidationResultWarning]')
                ).waitForDisplayed({
                    reverse: true,
                });
                assert(
                    await (
                        await getElement(
                            ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON
                        )
                    ).isEnabled()
                );
            });
            //Skipping it for now since this feature is dependent on session-service and
            // heroku instance of it not stable (would not be active/running all the time)
            // also data-test would be dynamic and depends on chart id (session id)
            it('a new chart should be added and filtered', async () => {
                await (
                    await getElement(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON)
                ).waitForEnabled();
                const beforeClick = await getNumberOfStudyViewCharts();
                await clickElement(ADD_CHART_CUSTOM_GROUPS_ADD_CHART_BUTTON);

                await (
                    await getElement('.chartTitle*=Custom Data 1')
                ).waitForDisplayed();

                // it should not impact any other charts
                assert(
                    beforeClick + 1 === (await getNumberOfStudyViewCharts())
                );

                assert(
                    await (
                        await (await getElement('.userSelections')).$(
                            'span=Custom Data 1'
                        )
                    ).isExisting(),
                    'new chart filter state is reflected in filter breadcrumb'
                );
            });
            after(async () => {
                // Close the tooltip
                if (
                    await (
                        await getElement(ADD_CHART_CUSTOM_DATA_TAB)
                    ).isDisplayed()
                ) {
                    await clickElement(ADD_CHART_BUTTON);
                }
            });
        });
    });
});

describe('add chart should not be shown in other irrelevant tabs', () => {
    it('check add chart button doesnt exist on heatmap', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/study?id=brca_tcga_pub`
        );
        await waitForNetworkQuiet(30000);

        await (
            await getElement('#studyViewTabs a.tabAnchor_clinicalData')
        ).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });

        assert(await (await getElement('button=Charts ▾')).isExisting());

        await clickElement('#studyViewTabs a.tabAnchor_clinicalData');
        assert(!(await (await getElement('button=Charts ▾')).isExisting()));
    });
});

describe('check the filters are working properly', () => {
    before(async () => {
        const url = `${CBIOPORTAL_URL}/study/summary?id=laml_tcga#filterJson=%7B%22genomicDataFilters%22%3A%5B%7B%22hugoGeneSymbol%22%3A%22NPM1%22%2C%22profileType%22%3A%22rna_seq_v2_mrna_median_Zscores%22%2C%22values%22%3A%5B%7B%22start%22%3A0%2C%22end%22%3A0.25%7D%2C%7B%22start%22%3A0.25%2C%22end%22%3A0.5%7D%2C%7B%22start%22%3A0.5%2C%22end%22%3A0.75%7D%5D%7D%5D%2C%22clinicalDataFilters%22%3A%5B%7B%22attributeId%22%3A%22SEX%22%2C%22values%22%3A%5B%7B%22value%22%3A%22Female%22%7D%5D%7D%2C%7B%22attributeId%22%3A%22AGE%22%2C%22values%22%3A%5B%7B%22end%22%3A35%2C%22start%22%3A30%7D%2C%7B%22end%22%3A40%2C%22start%22%3A35%7D%2C%7B%22end%22%3A45%2C%22start%22%3A40%7D%2C%7B%22end%22%3A50%2C%22start%22%3A45%7D%2C%7B%22end%22%3A55%2C%22start%22%3A50%7D%2C%7B%22end%22%3A60%2C%22start%22%3A55%7D%2C%7B%22end%22%3A65%2C%22start%22%3A60%7D%5D%7D%5D%2C%22geneFilters%22%3A%5B%7B%22molecularProfileIds%22%3A%5B%22laml_tcga_mutations%22%5D%2C%22geneQueries%22%3A%5B%5B%22NPM1%22%2C%22FLT3%22%5D%5D%7D%2C%7B%22molecularProfileIds%22%3A%5B%22laml_tcga_gistic%22%5D%2C%22geneQueries%22%3A%5B%5B%22FUS%3AHOMDEL%22%2C%22KMT2A%3AAMP%22%5D%5D%7D%5D%2C%22genomicProfiles%22%3A%5B%5B%22gistic%22%5D%2C%5B%22mutations%22%5D%5D%7D`;
        await goToUrlAndSetLocalStorage(url);
        await waitForNetworkQuiet(60000);
    });
    it('filter study from url', async () => {
        await waitForNetworkQuiet(60000);
        const res = await checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('removing filters are working properly', async () => {
        // Remove pie chart filter
        await clickElement("[data-test='pill-tag-delete']");
        await waitForStudyViewSelectedInfo();
        assert((await getTextFromElement(SELECTED_PATIENTS)) === '1');
        assert((await getTextFromElement(SELECTED_SAMPLES)) === '1');

        // Remove bar chart filter
        await clickElement("[data-test='pill-tag-delete']");
        await waitForStudyViewSelectedInfo();
        assert((await getTextFromElement(SELECTED_PATIENTS)) === '1');
        assert((await getTextFromElement(SELECTED_SAMPLES)) === '1');

        // Remove gene specific chart filter
        await clickElement("[data-test='pill-tag-delete']");
        await waitForStudyViewSelectedInfo();
        assert((await getTextFromElement(SELECTED_PATIENTS)) === '5');
        assert((await getTextFromElement(SELECTED_SAMPLES)) === '5');

        // Remove mutated genes filter
        await clickElement("[data-test='pill-tag-delete']");
        await waitForStudyViewSelectedInfo();
        await clickElement("[data-test='pill-tag-delete']");
        await waitForStudyViewSelectedInfo();
        assert((await getTextFromElement(SELECTED_PATIENTS)) === '13');
        assert((await getTextFromElement(SELECTED_SAMPLES)) === '13');

        // Remove cna genes filter
        await clickElement("[data-test='pill-tag-delete']");
        await waitForStudyViewSelectedInfo();
        await clickElement("[data-test='pill-tag-delete']");
        await waitForStudyViewSelectedInfo();
        assert((await getTextFromElement(SELECTED_PATIENTS)) === '188');
        assert((await getTextFromElement(SELECTED_SAMPLES)) === '188');

        // Remove genomic profiles sample count filter
        await clickElement("[data-test='pill-tag-delete']");
        await waitForStudyViewSelectedInfo();
        await clickElement("[data-test='pill-tag-delete']");
        await waitForStudyViewSelectedInfo();
        assert((await getTextFromElement(SELECTED_PATIENTS)) === '200');
        assert((await getTextFromElement(SELECTED_SAMPLES)) === '200');
    });
});

// This needs to be done separately due to leak of data in the other tests
describe('check the fusion filter is working properly', () => {
    before(async () => {
        const url = `${CBIOPORTAL_URL}/study/summary?id=es_dfarber_broad_2014&filters=%7B%22geneFilters%22%3A%5B%7B%22molecularProfileIds%22%3A%5B%22es_dfarber_broad_2014_structural_variants%22%5D%2C%22geneQueries%22%3A%5B%5B%22FLI1%22%5D%5D%7D%5D%7D`;
        await goToUrlAndSetLocalStorage(url);
        await waitForNetworkQuiet(60000);
    });
    it('fusion filter filter study from url', async () => {
        await browser.pause(2000);
        await waitForStudyViewSelectedInfo();
        const res = await checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('fusion filter removing filters are working properly', async () => {
        // Remove cna genes filter
        await clickElement("[data-test='pill-tag-delete']");
        await waitForStudyViewSelectedInfo();
        assert((await getTextFromElement(SELECTED_PATIENTS)) === '103');
        assert((await getTextFromElement(SELECTED_SAMPLES)) === '107');
    });
});

describe('cancer gene filter', () => {
    before(async () => {
        const url = `${CBIOPORTAL_URL}/study?id=laml_tcga`;
        await goToUrlAndSetLocalStorage(url);
    });

    it('the cancer gene filter should be, by default, disabled', async () => {
        await (
            await getElement(
                `${CNA_GENES_TABLE} [data-test='gene-column-header']`
            )
        ).waitForDisplayed({ timeout: WAIT_FOR_VISIBLE_TIMEOUT });
        assert.equal(
            await (
                await getElement(
                    `${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`
                )
            ).isExisting(),
            true
        );
        assert.equal(
            await getColorOfNthElement(
                `${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`,
                0
            ),
            '#bebebe'
        );
    });

    it('non cancer gene should show up when the cancer gene filter is disabled', async () => {
        assertScreenShotMatch(
            await checkElementWithMouseDisabled(CNA_GENES_TABLE)
        );
    });

    it('the cancer gene filter should remove non cancer gene', async () => {
        // enable the filter and check
        await clickElement(`${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`);
        assert.equal(
            await getColorOfNthElement(
                `${CNA_GENES_TABLE} ${CANCER_GENE_FILTER_ICON}`,
                0
            ),
            '#000000'
        );
        assertScreenShotMatch(
            await checkElementWithMouseDisabled(CNA_GENES_TABLE)
        );
    });
});

describe('crc_msk_2017 study tests', () => {
    before(async () => {
        const url = `${CBIOPORTAL_URL}/study?id=crc_msk_2017`;
        await goToUrlAndSetLocalStorage(url);
        await waitForNetworkQuiet();
    });
    it('the MSI score should use the custom bins, then the MSI score column should be added in the clinical data tab', async () => {
        await (await getElement(ADD_CHART_BUTTON)).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await browser.waitUntil(
            async () => {
                const addChartButton = await getElement(ADD_CHART_BUTTON);
                await addChartButton.waitForDisplayed();
                const addChartButtonClass = await addChartButton.getAttribute(
                    'class'
                );
                return !addChartButtonClass.includes('disabled');
            },
            { timeout: WAIT_FOR_VISIBLE_TIMEOUT }
        );
        await setDropdownOpen(
            true,
            ADD_CHART_BUTTON,
            "[data-test='fixed-header-table-search-input']"
        );

        // Wait after the frequency is calculated.
        await waitForNetworkQuiet();

        const msiScoreRow = "[data-test='add-chart-option-msi-score']";
        await setInputText(
            "[data-test='fixed-header-table-search-input']",
            'msi'
        );
        await (await getElement(msiScoreRow)).waitForDisplayed();

        await (await getElement(msiScoreRow + ' input')).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await clickElement(msiScoreRow + ' input');
        // Close the tooltip

        await (await getElement(ADD_CHART_BUTTON)).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        await clickElement(ADD_CHART_BUTTON);

        await getElement("[data-test='chart-container-MSI_SCORE'] svg", {
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });

        const res = await checkElementWithMouseDisabled(
            "[data-test='chart-container-MSI_SCORE'] svg"
        );
        assertScreenShotMatch(res);

        await toStudyViewClinicalDataTab();
        await (
            await getElement("[data-test='clinical-data-tab-content'] table")
        ).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        assert(
            await (await getElement("span[data-test='MSI Score']")).isExisting()
        );
    });
});

describe('study view lgg_tcga study tests', () => {
    const pieChart = "[data-test='chart-container-SEX']";
    const table = "[data-test='chart-container-CANCER_TYPE_DETAILED']";
    before(async () => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_tcga`;
        await goToUrlAndSetLocalStorage(url);
        await toStudyViewSummaryTab();
        await waitForNetworkQuiet();
    });
    describe('bar chart', () => {
        const barChart = "[data-test='chart-container-DAYS_TO_COLLECTION']";
        it('the log scale should be used for Sample Collection', async () => {
            await (await getElement(barChart)).waitForDisplayed({
                timeout: WAIT_FOR_VISIBLE_TIMEOUT,
            });
            await (await getElement(barChart)).scrollIntoView();
            await jsApiHover(barChart);
            await getElement(barChart + ' .controls', { timeout: 10000 });

            // move to hamburger icon
            await jsApiHover("[data-test='chart-header-hamburger-icon']");

            // wait for the menu available
            await (
                await getElement(
                    "[data-test='chart-header-hamburger-icon-menu']"
                )
            ).waitForDisplayed({ timeout: WAIT_FOR_VISIBLE_TIMEOUT });

            assert(
                await (
                    await getElement(
                        barChart + ' .chartHeader .logScaleCheckbox input'
                    )
                ).isSelected()
            );
        });
    });
    describe('pie chart', () => {
        describe('chart controls', () => {
            it('the table icon should be available', async () => {
                await (await getElement(pieChart)).waitForDisplayed({
                    timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                });
                await jsApiHover(pieChart);

                await browser.waitUntil(async () => {
                    return await (
                        await getElement(pieChart + ' .controls')
                    ).isExisting();
                }, 10000);
                assert(
                    await (
                        await getElement(pieChart + ' .controls .fa-table')
                    ).isExisting()
                );
            });
        });
    });
    describe('table', () => {
        describe('chart controls', () => {
            it('the pie icon should be available', async () => {
                await (await getElement(table)).waitForDisplayed({
                    timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                });
                await jsApiHover(table);

                await browser.waitUntil(async () => {
                    return (
                        await getElement(table + ' .controls')
                    ).isExisting();
                }, 10000);
                assert(
                    await (
                        await getElement(table + ' .controls .fa-pie-chart')
                    ).isExisting()
                );
            });

            //TODO-- the move out of bounds error is happening here
            it('table should be sorted by Freq in the default setting', async () => {
                // Open the 'Add clinical chart' menu
                await setDropdownOpen(
                    true,
                    ADD_CHART_BUTTON,
                    ADD_CHART_CLINICAL_TAB
                );
                await clickElement(ADD_CHART_CLINICAL_TAB);

                const option =
                    "[data-test='add-chart-option-cancer-type-detailed'] input";

                await setInputText(
                    "[data-test='fixed-header-table-search-input']",
                    'cancer type detailed'
                );
                await (await getElement(option)).waitForDisplayed({
                    timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                });
                // Remove and add the table back to reset the table to prevent any side effects created in other tests
                await setCheckboxChecked(false, option);
                await browser.pause(2000);
                // Make sure the studies dropdown is still open
                await setDropdownOpen(
                    true,
                    ADD_CHART_BUTTON,
                    ADD_CHART_CLINICAL_TAB
                );
                await (await getElement(option)).waitForDisplayed({
                    timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                });
                await setCheckboxChecked(true, option);

                // Close the 'Add chart' menu
                await setDropdownOpen(
                    false,
                    ADD_CHART_BUTTON,
                    ADD_CHART_CLINICAL_TAB
                );

                const res = await checkElementWithMouseDisabled(table);
                assertScreenShotMatch(res);
            });
        });
    });
});

describe('study view tcga pancancer atlas tests', () => {
    before(async () => {
        const url = `${CBIOPORTAL_URL}/study?id=laml_tcga_pan_can_atlas_2018%2Cacc_tcga_pan_can_atlas_2018%2Cblca_tcga_pan_can_atlas_2018%2Clgg_tcga_pan_can_atlas_2018%2Cbrca_tcga_pan_can_atlas_2018%2Ccesc_tcga_pan_can_atlas_2018%2Cchol_tcga_pan_can_atlas_2018%2Ccoadread_tcga_pan_can_atlas_2018%2Cdlbc_tcga_pan_can_atlas_2018%2Cesca_tcga_pan_can_atlas_2018%2Cgbm_tcga_pan_can_atlas_2018%2Chnsc_tcga_pan_can_atlas_2018%2Ckich_tcga_pan_can_atlas_2018%2Ckirc_tcga_pan_can_atlas_2018%2Ckirp_tcga_pan_can_atlas_2018%2Clihc_tcga_pan_can_atlas_2018%2Cluad_tcga_pan_can_atlas_2018%2Clusc_tcga_pan_can_atlas_2018%2Cmeso_tcga_pan_can_atlas_2018%2Cov_tcga_pan_can_atlas_2018%2Cpaad_tcga_pan_can_atlas_2018%2Cpcpg_tcga_pan_can_atlas_2018%2Cprad_tcga_pan_can_atlas_2018%2Csarc_tcga_pan_can_atlas_2018%2Cskcm_tcga_pan_can_atlas_2018%2Cstad_tcga_pan_can_atlas_2018%2Ctgct_tcga_pan_can_atlas_2018%2Cthym_tcga_pan_can_atlas_2018%2Cthca_tcga_pan_can_atlas_2018%2Cucs_tcga_pan_can_atlas_2018%2Cucec_tcga_pan_can_atlas_2018%2Cuvm_tcga_pan_can_atlas_2018`;
        await goToUrlAndSetLocalStorage(url);
        await toStudyViewSummaryTab();
        await waitForNetworkQuiet(30000);
    });
    it('tcga pancancer atlas page', async () => {
        assertScreenShotMatch(
            await checkElementWithMouseDisabled('#mainColumn')
        );
    });
});

describe('virtual study', () => {
    it('loads a virtual study', async () => {
        const url = `${CBIOPORTAL_URL}/study/summary?id=5dd408f0e4b0f7d2de7862a8`;
        await goToUrlAndSetLocalStorage(url);
        await waitForStudyView();
        assertScreenShotMatch(
            await checkElementWithMouseDisabled('#mainColumn')
        );
    });
});

describe('multi studies', () => {
    before(async () => {
        const url = `${CBIOPORTAL_URL}/study?id=acc_tcga,lgg_tcga`;
        await goToUrlAndSetLocalStorage(url);
        await waitForNetworkQuiet();
    });

    it('check for survival plots', async () => {
        assertScreenShotMatch(
            await checkElementWithMouseDisabled('#mainColumn')
        );
    });

    it('multi studies view should not have the raw data available', async () => {
        assert(
            !(await (
                await getElement(STUDY_SUMMARY_RAW_DATA_DOWNLOAD)
            ).isExisting())
        );
    });
});

describe('check the simple filter(filterAttributeId, filterValues) is working properly', () => {
    it('A error message should be shown when the filterAttributeId is not available for the study', async () => {
        const url = `${CBIOPORTAL_URL}/study?id=lgg_tcga&filterAttributeId=ONCOTREE_CODE_TEST&filterValues=OAST`;
        await goToUrlAndSetLocalStorage(url);
        await waitForNetworkQuiet();
        //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });

        const res = await checkElementWithMouseDisabled(
            "[data-test='study-view-header']"
        );
        assertScreenShotMatch(res);
    });
    it('Check if case insensitivity in filter works', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/study?id=lgg_tcga&filterAttributeId=SEX&filterValues=MALE`
        );
        await waitForNetworkQuiet();
        await waitForStudyViewSelectedInfo();
        const sampleCount1 = await getTextFromElement(SELECTED_PATIENTS);

        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/study?id=lgg_tcga&filterAttributeId=SEX&filterValues=Male`
        );
        await waitForNetworkQuiet();
        await waitForStudyViewSelectedInfo();
        const sampleCount2 = await getTextFromElement(SELECTED_PATIENTS);
        assert(sampleCount1 === sampleCount2);
    });
});

describe('the gene panel is loaded properly', () => {
    before(async () => {
        const url = `${CBIOPORTAL_URL}/study?id=msk_impact_2017`;
        await goToUrlAndSetLocalStorage(url);
    });
    it('check the mutated genes table has gene panel info', async () => {
        const tooltipSelector = '[data-test="freq-cell-tooltip"]';
        await (
            await getElement(`${CNA_GENES_TABLE} [data-test='freq-cell']`)
        ).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });

        const el = await getElement(
            `${CNA_GENES_TABLE} [data-test='freq-cell']:first-child`
        );

        await el.scrollIntoView();
        await el.moveTo();

        await (await getElement(tooltipSelector)).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });

        // the gene panel ID IMPACT341 should be listed
        (await getTextFromElement(tooltipSelector)).includes('IMPACT341');

        await clickElement(
            `${tooltipSelector} a[data-test='gene-panel-linkout-IMPACT341']`
        );

        // pause a little so that the modal can fully render
        await browser.pause(2000);

        // the modal title should show gene panel ID
        await browser.waitUntil(
            async () =>
                (await getTextFromElement(
                    `[data-test="gene-panel-modal-title"]`
                )) === 'IMPACT341',
            { timeout: WAIT_FOR_VISIBLE_TIMEOUT }
        );

        // test whether the gene info has been loaded correctly
        await (
            await getElement(`[data-test="gene-panel-modal-body"]`)
        ).waitForDisplayed({
            timeout: WAIT_FOR_VISIBLE_TIMEOUT,
        });
        assert.equal(
            await (
                await getElement(
                    '[data-test="gene-panel-modal-body"] p:first-child'
                )
            ).getText(),
            'ABL1'
        );
    });
});

describe('submit genes to results view query', () => {
    it('gives a submit error if protein oql is inputted and no protein profile is available for the study', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/study/summary?id=brca_mskcc_2019`
        );
        await browser.pause(2000);
        await getElement('[data-test="geneSet"]', { timeout: 5000 });
        await setInputText('[data-test="geneSet"]', 'PTEN: PROT>0');

        // error appears
        await browser.waitUntil(async () => {
            const errorElement = await getElement(
                '[data-test="oqlErrorMessage"]'
            );
            return (
                (await errorElement.isExisting()) &&
                (await errorElement.getText()) ===
                    'Protein level data query specified in OQL, but no protein level profile is available in the selected study.'
            );
        }, 20000);

        // submit is disabled
        await browser.waitUntil(async () => {
            return !(await (
                await getElement('button[data-test="geneSetSubmit"]')
            ).isEnabled());
        }, 5000);
    });
    it('auto-selects an mrna profile when mrna oql is entered', async function() {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/study/summary?id=acc_tcga_pan_can_atlas_2018`
        );
        const studyViewTabId = (await browser.getWindowHandles())[0];

        // enter oql
        await getElement('textarea[data-test="geneSet"]', { timeout: 10000 });
        await setInputText('textarea[data-test="geneSet"]', 'PTEN: EXP>1');

        await (
            await getElement('button[data-test="geneSetSubmit"]')
        ).waitForEnabled({
            timeout: 10000,
        });
        await clickElement('button[data-test="geneSetSubmit"]');

        await browser.waitUntil(
            async () => (await browser.getWindowHandles()).length > 1
        ); // wait until new tab opens

        // switch tabs to results view
        const resultsViewTabId = (await browser.getWindowHandles()).find(
            x => x !== studyViewTabId
        );

        await browser.switchToWindow(resultsViewTabId);

        await browser.pause(2000);

        // wait for query to load
        await waitForOncoprint();

        // only mrna profile is there
        const { profileFilter = '' } = await browser.execute(function() {
            return { ...urlWrapper.query };
        });
        assert.equal(profileFilter.includes('mutations'), false);
        assert.equal(profileFilter.includes('gistic'), false);
        assert.equal(
            profileFilter.includes('rna_seq_v2_mrna_median_Zscores'),
            true
        );
    });

    describe('chol_tcga_pan_can_atlas_2018 study generic assay tests', () => {
        before(async () => {
            const url = `${CBIOPORTAL_URL}/study?id=chol_tcga_pan_can_atlas_2018`;
            await goToUrlAndSetLocalStorage(url);
            await waitForNetworkQuiet();
            await browser.pause(2000);
        });
        it.skip('generic assay chart should be added in the summary tab', async function() {
            this.retries(0);
            await browser.waitUntil(
                async () => {
                    const addChatButtonElement = await getElement(
                        ADD_CHART_BUTTON
                    );
                    await addChatButtonElement.waitForDisplayed();
                    const classAttributes = await addChatButtonElement.getAttribute(
                        'class'
                    );
                    return !classAttributes.includes('disabled');
                },
                { timeout: 60000 }
            );
            await clickElement(ADD_CHART_BUTTON);
            await browser.pause(5000);
            // Change to GENERIC ASSAY tab
            await (
                await getElement(ADD_CHART_GENERIC_ASSAY_TAB, {
                    timeout: WAIT_FOR_VISIBLE_TIMEOUT,
                })
            ).waitForDisplayed({
                timeout: WAIT_FOR_VISIBLE_TIMEOUT,
            });
            await clickElement(ADD_CHART_GENERIC_ASSAY_TAB);

            // wait for generic assay data loading complete
            // and select a option
            await (
                await getElement(
                    'div[data-test="GenericAssayEntitySelection"] #react-select-3-input'
                )
            ).waitForExist();
            await setInputText(
                'div[data-test="GenericAssayEntitySelection"] #react-select-3-input',
                'Prasinovirus'
            );

            await clickElement('div=Select all filtered options (1)');
            // close the dropdown
            const indicators = await getNthElements(
                'div[class$="indicatorContainer"]',
                0
            );
            await indicators.click();
            const selectedOptions = await $$('div[class$="multiValue"]');
            assert.equal(selectedOptions.length, 1);

            // this is necessary to get the options selection to "take"
            await clickElement(ADD_CHART_GENERIC_ASSAY_TAB);

            await clickElement('button=Add Chart');
            // Wait for chart to be added
            await waitForNetworkQuiet();

            const res = await checkElementWithMouseDisabled('#mainColumn');
            assertScreenShotMatch(res);
        });
    });
});

describe('study view treatments table', () => {
    it('loads multiple studies with treatments tables', async () => {
        const url = `${CBIOPORTAL_URL}/study/summary?id=gbm_columbia_2019%2Clgg_ucsf_2014`;
        await goToUrlAndSetLocalStorage(url);
        await waitForNetworkQuiet();
        await (
            await getElementByTestHandle('PATIENT_TREATMENTS-table')
        ).waitForExist();
        await (
            await getElementByTestHandle('SAMPLE_TREATMENTS-table')
        ).waitForExist();

        const res = await checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('can filter a study by sample treatments', async () => {
        const sampleTreatmentsFirstCheckbox =
            '[data-test="SAMPLE_TREATMENTS-table"] .ReactVirtualized__Table__row:nth-child(1) input';
        const sampleTreatmentsSelectSamplesButton =
            '[data-test="SAMPLE_TREATMENTS-table"] button';
        const url = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014`;
        await goToUrlAndSetLocalStorage(url);

        await (await getElement(sampleTreatmentsFirstCheckbox)).waitForExist();
        await clickElement(sampleTreatmentsFirstCheckbox);
        await (
            await getElement(sampleTreatmentsSelectSamplesButton)
        ).waitForExist();
        await clickElement(sampleTreatmentsSelectSamplesButton);
        await waitForNetworkQuiet();

        const res = await checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('compare button appears when selecting multiple rows in sample treatments', async () => {
        const sampleTreatmentsFirstCheckbox =
            '[data-test="SAMPLE_TREATMENTS-table"] .ReactVirtualized__Table__row:nth-child(1) input';
        const sampleTreatmentsSecondCheckbox =
            '[data-test="SAMPLE_TREATMENTS-table"] .ReactVirtualized__Table__row:nth-child(2) input';
        const sampleTreatmentsCompareButton = '[data-test="table-compare-btn"]';
        const url = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014`;
        await goToUrlAndSetLocalStorage(url);

        await (await getElement(sampleTreatmentsFirstCheckbox)).waitForExist();
        await clickElement(sampleTreatmentsFirstCheckbox);
        await (await getElement(sampleTreatmentsSecondCheckbox)).waitForExist();
        await clickElement(sampleTreatmentsSecondCheckbox);
        assert(
            await (await getElement(sampleTreatmentsCompareButton)).isExisting()
        );
    });

    it('can filter a study by patient treatments', async () => {
        const url = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014`;
        await goToUrlAndSetLocalStorage(url);

        const patientTreatmentsFirstCheckbox =
            '[data-test="PATIENT_TREATMENTS-table"] .ReactVirtualized__Table__row:nth-child(1) input';
        const patientTreatmentsSelectSamplesButton =
            '[data-test="PATIENT_TREATMENTS-table"] button';

        await (await getElement(patientTreatmentsFirstCheckbox)).waitForExist();
        await clickElement(patientTreatmentsFirstCheckbox);
        await (
            await getElement(patientTreatmentsSelectSamplesButton)
        ).waitForExist();
        await clickElement(patientTreatmentsSelectSamplesButton);
        await waitForNetworkQuiet();

        const res = await checkElementWithMouseDisabled('#mainColumn');
        assertScreenShotMatch(res);
    });

    it('compare button appears when selecting multiple rows in patient treatments', async () => {
        const url = `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014`;
        await goToUrlAndSetLocalStorage(url);

        const patientTreatmentsFirstCheckbox =
            '[data-test="PATIENT_TREATMENTS-table"] .ReactVirtualized__Table__row:nth-child(1) input';
        const patientTreatmentsSecondCheckbox =
            '[data-test="PATIENT_TREATMENTS-table"] .ReactVirtualized__Table__row:nth-child(2) input';
        const patientTreatmentsCompareButton =
            '[data-test="table-compare-btn"]';

        await (await getElement(patientTreatmentsFirstCheckbox)).waitForExist();
        await clickElement(patientTreatmentsFirstCheckbox);
        await (
            await getElement(patientTreatmentsSecondCheckbox)
        ).waitForExist();
        await clickElement(patientTreatmentsSecondCheckbox);
        assert(
            await (
                await getElement(patientTreatmentsCompareButton)
            ).isExisting()
        );
    });
});

describe('study view mutations table', () => {
    // this guards against server-side regression
    // in which frequencies are miscalculated for
    // with mutations which are called but not profile
    it('shows mutation frequencies correctly for called but unprofiled mutations', async () => {
        const url = `${CBIOPORTAL_URL}/study/summary?id=msk_impact_2017`;
        await goToUrlAndSetLocalStorage(url);

        const res = await checkElementWithMouseDisabled(
            "[data-test='chart-container-msk_impact_2017_mutations']"
        );
        assertScreenShotMatch(res);
    });
});

describe('custom data chart addition', () => {
    // this guards against server-side regression
    // in which frequencies are miscalculated for
    // with mutations which are called but not profile

    const customSamples = `msk_impact_2017:P-0007153-T01-IM5 1
msk_impact_2017:P-0008475-T01-IM5 1
msk_impact_2017:P-0009925-T01-IM5 2
msk_impact_2017:P-0010568-T01-IM5 2
msk_impact_2017:P-0010590-T01-IM5 2`;

    it('properly handles parsing of custom data list - distinct from custom sample list', async () => {
        const url = `${CBIOPORTAL_URL}/study/summary?id=msk_impact_2017`;
        await goToUrlAndSetLocalStorage(url);

        await clickElement('[data-test=add-charts-button]', { timeout: 10000 });

        await clickElement('.tabAnchor_Custom_Data', { timeout: 10000 });

        await setInputText('.custom textarea', customSamples);

        assert.equal(
            await elementExists('[data-test=ValidationResultWarning]'),
            false
        );

        // but now when we set an invalid sample id, we trigger validation error
        await setInputText(
            '.custom textarea',
            customSamples.replace('P-0008475-T01-IM5', 'P-XXXXX-T01-IM5')
        );

        await browser.pause(500);

        assert.equal(
            await elementExists('[data-test=ValidationResultWarning]'),
            true
        );
    });
});
