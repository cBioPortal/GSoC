const assert = require('assert');
const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');
const {
    goToUrlAndSetLocalStorage,
    selectReactSelectOption,
    waitForElementDisplayed,
    getNestedElement,
    clickElement,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('plots tab', function() {
    describe('utilities menu', function() {
        it('is shown when plot data available', async function() {
            await loadPlotsTab(
                `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize`
            );
            assert(
                await (await $('div.color-samples-toolbar-elt')).isExisting()
            );
        });

        it('is hidden when plot data unavailable', async function() {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=AR%2520RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize`,
                true
            );
            await (
                await $('div[data-test="PlotsTabNoDataDiv"]')
            ).waitForDisplayed();
            assert(true);
        });

        it('shows gene selection box and radio buttons in clinical attribute vs treatment plot', async () => {
            await loadPlotsTab(
                `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&heatmap_track_groups=study_es_0_treatment_ic50%2CErlotinib&show_samples=false&tab_index=tab_visualize&treatment_list=Erlotinib`
            );
            await selectTreatmentProfile();
            assert(await (await $('div.coloring-menu')).isExisting());
            assert(
                (
                    await (await $('div.coloring-menu')).$$(
                        'input[type="checkbox"]'
                    )
                ).length === 3
            );
        });

        it('shows mutation and copy number by default', async () => {
            await loadPlotsTab(
                `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&heatmap_track_groups=study_es_0_treatment_ic50%2CErlotinib&show_samples=false&tab_index=tab_visualize&treatment_list=Erlotinib&plots_horz_selection=%7B"dataType"%3A"clinical_attribute"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A6205%2C"dataType"%3A"TREATMENT_RESPONSE"%7D&plots_coloring_selection=%7B%7D&profileFilter=0`
            );
            await selectTreatmentProfile();
            const res = await browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('shows only mutation types when copy number is de-selected', async () => {
            await loadPlotsTab(
                `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&heatmap_track_groups=study_es_0_treatment_ic50%2CErlotinib&show_samples=false&tab_index=tab_visualize&treatment_list=Erlotinib&plots_horz_selection=%7B"dataType"%3A"clinical_attribute"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A6205%2C"dataType"%3A"TREATMENT_RESPONSE"%7D&plots_coloring_selection=%7B"colorByCopyNumber"%3A"false"%2C"colorBySv"%3A"false"%7D&profileFilter=0`
            );
            await selectTreatmentProfile();
            await clickElement('input[data-test="ViewCopyNumber"]');
            const res = await browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('shows only CNA types when mutation checkbox is deselected', async () => {
            await loadPlotsTab(
                `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&heatmap_track_groups=study_es_0_treatment_ic50%2CErlotinib&show_samples=false&tab_index=tab_visualize&treatment_list=Erlotinib&plots_horz_selection=%7B"dataType"%3A"clinical_attribute"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A6205%2C"dataType"%3A"TREATMENT_RESPONSE"%7D&plots_coloring_selection=%7B"colorByMutationType"%3A"false"%2C"colorBySv"%3A"false"%7D&profileFilter=0`
            );
            await selectTreatmentProfile();
            await clickElement('input[data-test="ViewMutationType"]');
            const res = await browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });

        it('removes sample stylings when selecting None in gene selection box', async () => {
            await loadPlotsTab(
                `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=RPS11&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&heatmap_track_groups=study_es_0_treatment_ic50%2CErlotinib&show_samples=false&tab_index=tab_visualize&treatment_list=Erlotinib&plots_horz_selection=%7B"dataType"%3A"clinical_attribute"%7D&plots_vert_selection=%7B"dataType"%3A"TREATMENT_RESPONSE"%7D&plots_coloring_selection=%7B"selectedOption"%3A"6205_undefined"%7D&profileFilter=0`
            );
            await selectTreatmentProfile();
            await clickElement('.gene-select');
            // select gene menu entries
            const geneMenuEntries = await (
                await (
                    await getNestedElement([
                        '[data-test=GeneColoringMenu]',
                        'div=Genes',
                        '..',
                    ])
                ).$$('div')
            )[1].$$('div');
            await geneMenuEntries[0].click();
            await waitForElementDisplayed('[data-test=PlotsTabPlotDiv]');
            const res = await browser.checkElement('[id=plots-tab-plot-svg]');
            assertScreenShotMatch(res);
        });
    });
});

const loadPlotsTab = async url => {
    await goToUrlAndSetLocalStorage(url, true);
    await waitForElementDisplayed('div[data-test="PlotsTabPlotDiv"]');
};

const selectTreatmentProfile = async () => {
    const vertDataSelect = await getNestedElement([
        '[name=v-profile-type-selector]',
        '..',
    ]);
    await selectReactSelectOption(vertDataSelect, 'Treatment Response');
    await waitForElementDisplayed('div[data-test="PlotsTabPlotDiv"]');
};
