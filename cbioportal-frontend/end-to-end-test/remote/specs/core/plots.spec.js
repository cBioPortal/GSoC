const assert = require('assert');
const {
    getElementByTestHandle,
    waitForPlotsTab,
    getTextFromElement,
    goToUrlAndSetLocalStorage,
    getElement,
} = require('../../../shared/specUtils_Async');
const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const METHYLATION_OPTION_SELECTION_BOX = 'div.genericAssaySelectBox';

describe('plots tab tests', function() {
    it('shows data availability alert tooltip for plots tab multiple studies', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=lgg_ucsf_2014%2Cbrca_tcga&case_set_id=all&data_priority=0&gene_list=TP53&geneset_list=%20&plots_coloring_selection=%7B%7D&plots_horz_selection=%7B"selectedGeneOption"%3A7157%2C"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"CANCER_TYPE_DETAILED"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A7157%2C"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"CANCER_TYPE"%7D&profileFilter=0&tab_index=tab_visualize`
        );
        await (
            await getElement('div[data-test="PlotsTabPlotDiv"]')
        ).waitForDisplayed({
            timeout: 20000,
        });
        // Tooltip elements are created when hovering the data availability alert info icon.
        // Control logic below is needed to access the last one after it
        // was created.
        const curNumToolTips = (await $$('div.rc-tooltip-inner')).length;
        await (
            await getElementByTestHandle('dataAvailabilityAlertInfoIcon')
        ).moveTo();
        await browser.waitUntil(
            async () =>
                (await $$('div.rc-tooltip-inner')).length > curNumToolTips
        );
        const toolTips = await $$('div.rc-tooltip-inner');
        const text = await toolTips[toolTips.length - 1].getText();
        assert.equal(
            text,
            'Data availability per profile/axis:\nHorizontal Axis: 1164 samples from 2 studies\nVertical Axis: 1164 samples from 2 studies\nIntersection of the two axes: 1164 samples from 2 studies'
        );
    });
    it('logscale available for all raw data types that are number', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=lgg_ucsf_2014%2Cbrca_tcga&case_set_id=all&data_priority=0&gene_list=TP53&geneset_list=%20&plots_coloring_selection=%7B%7D&plots_horz_selection=%7B"selectedGeneOption"%3A7157%2C"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"TMB_NONSYNONYMOUS"%2C"logScale"%3A"false"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A7157%2C"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"CANCER_TYPE"%7D&profileFilter=0&tab_index=tab_visualize`
        );

        await getElement('div[data-test="PlotsTabPlotDiv"]', {
            timeout: 20000,
        });

        assert.equal(
            await (
                await getElementByTestHandle('HorizontalLogCheckbox')
            ).isExisting(),
            true
        );
        assert.equal(
            await (
                await getElementByTestHandle('VerticalLogCheckbox')
            ).isExisting(),
            false,
            'Log Scale Checkbox should not be availble raw data type is not number'
        );
    });
    it('plots tab select gene related generic assay default option', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?cancer_study_list=acc_tcga_pan_can_atlas_2018&tab_index=tab_visualize&case_set_id=acc_tcga_pan_can_atlas_2018_all&Action=Submit&gene_list=TP53&plots_horz_selection=%7B%22dataType%22%3A%22METHYLATION%22%7D&plots_vert_selection=%7B%22selectedGeneOption%22%3A7157%7D&plots_coloring_selection=%7B%7D`
        );
        await waitForPlotsTab();
        await (
            await getElement(METHYLATION_OPTION_SELECTION_BOX)
        ).waitForDisplayed({
            timeout: 20000,
        });
        assert(
            (await getTextFromElement(METHYLATION_OPTION_SELECTION_BOX)) ===
                "TP53;WRAP53 (cg06587969): TSS1500;5'UTR;1stExon"
        );
    });
});
