const {
    goToUrlAndSetLocalStorage,
    waitForAndCheckPlotsTab,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('plots tab', function() {
    describe('generic assay categorical plots', () => {
        it('show category vs os status plot', async () => {
            const url = `${CBIOPORTAL_URL}/results/plots?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations&cancer_study_list=lgg_ucsf_2014_test_generic_assay&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit&plots_horz_selection=%7B%22selectedGenericAssayOption%22%3A%22mutational_signature_category_1%22%2C%22dataType%22%3A%22MUTATIONAL_SIGNATURE_TEST%22%2C%22selectedDataSourceOption%22%3A%22mutational_signature_category_v2%22%7D&plots_vert_selection=%7B%22dataType%22%3A%22clinical_attribute%22%2C%22selectedDataSourceOption%22%3A%22OS_STATUS%22%7D&plots_coloring_selection=%7B%7D`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForAndCheckPlotsTab();
        });
        it('show category vs mutation count plot', async () => {
            const url = `${CBIOPORTAL_URL}/results/plots?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations&cancer_study_list=lgg_ucsf_2014_test_generic_assay&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit&plots_horz_selection=%7B%22selectedGenericAssayOption%22%3A%22mutational_signature_category_1%22%2C%22dataType%22%3A%22MUTATIONAL_SIGNATURE_TEST%22%2C%22selectedDataSourceOption%22%3A%22mutational_signature_category_v2%22%7D&plots_vert_selection=%7B%22dataType%22%3A%22clinical_attribute%22%2C%22selectedDataSourceOption%22%3A%22MUTATION_COUNT%22%7D&plots_coloring_selection=%7B%7D`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForAndCheckPlotsTab();
        });
    });
    describe('generic assay binary plots', () => {
        it('show binary vs os status plot', async () => {
            const url = `${CBIOPORTAL_URL}/results/plots?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations&cancer_study_list=lgg_ucsf_2014_test_generic_assay&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit&plots_horz_selection=%7B"dataType"%3A"MUTATIONAL_SIGNATURE_TEST"%2C"selectedDataSourceOption"%3A"mutational_signature_binary_v2"%7D&plots_vert_selection=%7B"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"OS_STATUS"%7D&plots_coloring_selection=%7B%7D`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForAndCheckPlotsTab();
        });
        it('show binary vs mutation count plot', async () => {
            const url = `${CBIOPORTAL_URL}/results/plots?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_test_generic_assay_mutations&cancer_study_list=lgg_ucsf_2014_test_generic_assay&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=lgg_ucsf_2014_test_generic_assay_sequenced&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit&plots_horz_selection=%7B"dataType"%3A"MUTATIONAL_SIGNATURE_TEST"%2C"selectedDataSourceOption"%3A"mutational_signature_binary_v2"%7D&plots_vert_selection=%7B"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"MUTATION_COUNT"%7D&plots_coloring_selection=%7B%7D`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForAndCheckPlotsTab();
        });
    });
});
