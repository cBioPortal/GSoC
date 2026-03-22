const {
    goToUrlAndSetLocalStorage,
    waitForAndCheckPlotsTab,
    getElement,
    waitForElementDisplayed,
    clickElement,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('plots tab screenshot tests', function() {
    // you cannot use retries on this spec because tests are
    // order sensitive :(
    this.retries(0);

    it('plots tab mutation type view', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2&Z_SCORE_THRESHOLD=2&cancer_study_id=brca_tcga&case_set_id=brca_tcga_cnaseq&data_priority=0&gene_list=TP53%20MDM2&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_mutations&plots_vert_selection=%7B"selectedDataSourceOption"%3A"rna_seq_v2_mrna_median_Zscores"%7D&tab_index=tab_visualize`
        );
        await waitForAndCheckPlotsTab();
    });
    it('plots tab molecular vs molecular same gene', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2&Z_SCORE_THRESHOLD=2&cancer_study_id=brca_tcga&case_set_id=brca_tcga_cnaseq&data_priority=0&gene_list=TP53%20MDM2&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_mutations&plots_horz_selection=%7B"dataType"%3A"MRNA_EXPRESSION"%2C"selectedDataSourceOption"%3A"mrna"%7D&plots_vert_selection=%7B"selectedDataSourceOption"%3A"rna_seq_v2_mrna_median_Zscores"%7D&tab_index=tab_visualize`
        );
        await waitForElementDisplayed('div[data-test="PlotsTabPlotDiv"]', {
            timeout: 20000,
        });
        await (
            await getElement('input[data-test="ViewCopyNumber"]')
        ).waitForExist();
        await clickElement('input[data-test="ViewCopyNumber"]');
        await waitForAndCheckPlotsTab();
    });
    it('plots tab molecular vs molecular same gene changed gene', async function() {
        await browser.execute(function() {
            resultsViewPlotsTab.test__selectGeneOption(false, 4193);
        });
        await getElement('input[data-test="ShowRegressionline"]', {
            timeout: 10000,
        });
        await clickElement('input[data-test="ShowRegressionline"]');
        await waitForAndCheckPlotsTab();
    });
    it('plots tab copy number view', async () => {
        await clickElement('input[data-test="ShowRegressionline"]');
        await clickElement('input[data-test="ViewCopyNumber"]');
        await waitForAndCheckPlotsTab();
    });
    it('plots tab molecular vs molecular different genes', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.test__selectGeneOption(true, 7157);
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab molecular vs molecular different genes different profiles', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({
                value: 'rna_seq_v2_mrna',
            });
        });
        await getElement('input[data-test="ShowRegressionline"]', {
            timeout: 3000,
        });
        await clickElement('input[data-test="ShowRegressionline"]');
        await waitForAndCheckPlotsTab();
    });
    it('plots tab molecular vs molecular swapped axes', async () => {
        await clickElement('input[data-test="ShowRegressionline"]');
        await clickElement('[data-test="swapHorzVertButton"]');
        await waitForAndCheckPlotsTab();
    });
    it('plots tab search case id', async () => {
        await clickElement('input[data-test="ViewMutationType"]');
        await browser.execute(() => {
            resultsViewPlotsTab.executeSearchCase('TCGA-E2 TCGA-A8-A08G');
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab search case id and mutation', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.executeSearchMutation(
                'L321 V2L apsdoifjapsoid'
            );
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab search mutation', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.executeSearchCase('');
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab log scale off', async () => {
        await clickElement('input[data-test="VerticalLogCheckbox"]');
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs molecular', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({
                value: 'clinical_attribute',
            });
        });
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({
                value: 'AGE',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs molecular boxplot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({
                value: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab molecular vs clinical boxplot, mutation search off', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.executeSearchMutation('');
        });
        await clickElement('[data-test="swapHorzVertButton"]');
        await waitForAndCheckPlotsTab();
    });
    it('plots tab mutations vs clinical boxplot', async () => {
        await clickElement('[data-test="swapHorzVertButton"]');
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({
                value: 'AGE',
            });
        });
        await clickElement('[data-test="swapHorzVertButton"]');
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({
                value: 'MUTATION_EXTENDED',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab mutations driver mode vs clinical boxplot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisMutationCountBySelect({
                value: 'DriverVsVUS',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab mutations wild type mode vs clinical boxplot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisMutationCountBySelect({
                value: 'MutatedVsWildType',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab mutations Variant Allele Frequency mode vs clinical boxplot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisMutationCountBySelect({
                value: 'VariantAlleleFrequency',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical boxplot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onVerticalAxisDataTypeSelect({
                value: 'clinical_attribute',
            });
        });
        await browser.execute(() => {
            resultsViewPlotsTab.onVerticalAxisDataSourceSelect({
                value: 'AJCC_PATHOLOGIC_TUMOR_STAGE',
            });
        });
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({
                value: 'clinical_attribute',
            });
        });
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({
                value: 'AGE',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab search case id in clinical vs clinical boxplot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.executeSearchCase(
                'kjpoij12     TCGA-B6 asdfas TCGA-A7-A13'
            );
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical stacked bar plot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({
                value: 'AJCC_TUMOR_PATHOLOGIC_PT',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical stacked bar plot sort by number of samples', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.handleSortByChange({
                value: 'SortByTotalSum',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical stacked bar plot sort by category', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.handleSortByChange({
                value: 'Stage I',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    //commenting this for now because of https://github.com/zinserjan/wdio-screenshot/issues/87
    /* it("plots tab clinical vs clinical grouped bar plot", () => {
        await browser.execute(() => { resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({ value: "Bar" }); });
        await waitForAndCheckPlotsTab();
    }); */
    it('plots tab clinical vs clinical percentage stacked bar plot sort by category', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'PercentageStackedBar',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical percentage stacked bar plot sort by number of samples', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.handleSortByChange({
                value: 'SortByTotalSum',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical percentage stacked bar plot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.handleSortByChange({
                value: 'alphabetically',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical horizontal stacked bar plot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'StackedBar',
            });
        });
        await (
            await getElement('input[data-test="horizontalBars"]')
        ).waitForExist();
        await clickElement('input[data-test="horizontalBars"]');
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical horizontal stacked bar plot sort by number of samples', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.handleSortByChange({
                value: 'SortByTotalSum',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical horizontal stacked bar plot sort by category', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.handleSortByChange({
                value: 'T2',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical horizontal grouped bar plot sort by category', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'Bar',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical horizontal grouped bar plot sort by number of samples', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.handleSortByChange({
                value: 'SortByTotalSum',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical horizontal grouped bar plot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.handleSortByChange({
                value: 'alphabetically',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical horizontal percentage stacked bar plot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'PercentageStackedBar',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical horizontal percentage stacked bar plot sort by number of samples', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.handleSortByChange({
                value: 'SortByTotalSum',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical horizontal percentage stacked bar plot sort by category', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.handleSortByChange({
                value: 'T2',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab clinical vs clinical table plot', async () => {
        await (
            await getElement('input[data-test="horizontalBars"]')
        ).waitForExist();
        await clickElement('input[data-test="horizontalBars"]');
        await browser.execute(() => {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'Table',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab copy number vs clinical stacked bar plot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'StackedBar',
            });
        });
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({
                value: 'COPY_NUMBER_ALTERATION',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab copy number vs clinical horizontal stacked bar plot', async () => {
        await (
            await getElement('input[data-test="horizontalBars"]')
        ).waitForExist();
        await clickElement('input[data-test="horizontalBars"]');
        await waitForAndCheckPlotsTab();
    });
    it('plots tab copy number vs clinical horizontal percentage stacked bar plot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'PercentageStackedBar',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab copy number vs clinical percentage stacked bar plot', async () => {
        await (
            await getElement('input[data-test="horizontalBars"]')
        ).waitForExist();
        await clickElement('input[data-test="horizontalBars"]');
        await waitForAndCheckPlotsTab();
    });
    it('plots tab copy number vs clinical table plot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'Table',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab mutations wildtype mode vs clinical stacked bar plot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'StackedBar',
            });
        });
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisMutationCountBySelect({
                value: 'MutatedVsWildType',
            });
        });
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({
                value: 'MUTATION_EXTENDED',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab mutations wildtype mode vs clinical horizontal stacked bar plot', async () => {
        await (
            await getElement('input[data-test="horizontalBars"]')
        ).waitForExist();
        await clickElement('input[data-test="horizontalBars"]');
        await waitForAndCheckPlotsTab();
    });
    it('plots tab mutations wildtype mode vs clinical horizontal percentage stacked bar plot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'PercentageStackedBar',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab mutations wildtype mode vs clinical percentage stacked bar plot', async () => {
        await (
            await getElement('input[data-test="horizontalBars"]')
        ).waitForExist();
        await clickElement('input[data-test="horizontalBars"]');
        await waitForAndCheckPlotsTab();
    });
    it('plots tab mutations wildtype mode vs clinical table plot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'Table',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab mutations vs clinical stacked bar plot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'StackedBar',
            });
        });
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisMutationCountBySelect({
                value: 'MutationType',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab mutations vs clinical horizontal stacked bar plot', async () => {
        await (
            await getElement('input[data-test="horizontalBars"]')
        ).waitForExist();
        await clickElement('input[data-test="horizontalBars"]');
        await waitForAndCheckPlotsTab();
    });
    it('plots tab mutations vs clinical horizontal percentage stacked bar plot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'PercentageStackedBar',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab mutations vs clinical percentage stacked bar plot', async () => {
        await (
            await getElement('input[data-test="horizontalBars"]')
        ).waitForExist();
        await clickElement('input[data-test="horizontalBars"]');
        await waitForAndCheckPlotsTab();
    });
    it('plots tab mutations vs clinical table plot', async () => {
        await browser.execute(() => {
            resultsViewPlotsTab.onDiscreteVsDiscretePlotTypeSelect({
                value: 'Table',
            });
        });
        await waitForAndCheckPlotsTab();
    });
    it('plots tab one box clinical vs clinical boxplot', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?cancer_study_id=lgg_ucsf_2014&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&case_set_id=lgg_ucsf_2014_sequenced&gene_list=SMARCA4%2520CIC&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=lgg_ucsf_2014_mutations&show_samples=true&clinicallist=MUTATION_COUNT`
        );
        await waitForElementDisplayed('div[data-test="PlotsTabPlotDiv"]', {
            timeout: 20000,
        });
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({
                value: 'clinical_attribute',
            });
        });
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisDataSourceSelect({
                value: 'CANCER_TYPE',
            });
        });
        await waitForAndCheckPlotsTab();
    });

    it('plots tab mutations profile with duplicates', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?cancer_study_id=msk_impact_2017&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=msk_impact_2017_Non-Small_Cell_Lung_Cancer&gene_list=TP53&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=msk_impact_2017_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=msk_impact_2017_cna`
        );
        await waitForElementDisplayed('div[data-test="PlotsTabPlotDiv"]', {
            timeout: 20000,
        });
        await browser.execute(() => {
            resultsViewPlotsTab.onHorizontalAxisDataTypeSelect({
                value: 'MUTATION_EXTENDED',
            });
        });
        await waitForAndCheckPlotsTab();
    });

    it('plots tab scatter plot color by cancer type', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&plots_coloring_selection=%7B"selectedOption"%3A"undefined_%7B%5C"clinicalAttributeId%5C"%3A%5C"CANCER_TYPE%5C"%2C%5C"patientAttribute%5C"%3Afalse%2C%5C"studyId%5C"%3A%5C"ccle_broad_2019%5C"%7D"%7D&plots_horz_selection=%7B"dataType"%3A"MRNA_EXPRESSION"%2C"selectedGeneOption"%3A672%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A672%2C"dataType"%3A"TREATMENT_RESPONSE"%2C"selectedGenericAssayOption"%3A"Afatinib-1"%2C"selectedDataSourceOption"%3A"CCLE_drug_treatment_AUC"%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&session_id=5ed80b90e4b030a3bfd0c662&tab_index=tab_visualize`
        );
        await waitForAndCheckPlotsTab();
    });
    it('plots tab scatter plot color by cancer type highlight categories', async () => {
        await clickElement(`svg#plots-tab-plot-svg .legendLabel_Breast`);
        await clickElement(`svg#plots-tab-plot-svg .legendLabel_Glioma`);
        await waitForAndCheckPlotsTab();
    });

    it('plots tab box plot color by cancer type', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&plots_coloring_selection=%7B"selectedOption"%3A"undefined_%7B%5C"clinicalAttributeId%5C"%3A%5C"CANCER_TYPE%5C"%2C%5C"patientAttribute%5C"%3Afalse%2C%5C"studyId%5C"%3A%5C"ccle_broad_2019%5C"%7D"%7D&plots_horz_selection=%7B"dataType"%3A"MRNA_EXPRESSION"%2C"selectedGeneOption"%3A672%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A672%2C"dataType"%3A"MUTATION_EXTENDED"%2C"selectedGenericAssayOption"%3A"Afatinib-1"%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&session_id=5ed80b90e4b030a3bfd0c662&tab_index=tab_visualize`
        );
        await waitForAndCheckPlotsTab();
    });
    it('plots tab box plot color by cancer type highlight categories', async () => {
        await clickElement(`svg#plots-tab-plot-svg .legendLabel_Breast`);
        await clickElement(`svg#plots-tab-plot-svg .legendLabel_Glioma`);
        await waitForAndCheckPlotsTab();
    });

    it('plots tab waterfall plot color by cancer type', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&plots_coloring_selection=%7B"selectedOption"%3A"undefined_%7B%5C"clinicalAttributeId%5C"%3A%5C"CANCER_TYPE%5C"%2C%5C"patientAttribute%5C"%3Afalse%2C%5C"studyId%5C"%3A%5C"ccle_broad_2019%5C"%7D"%7D&plots_horz_selection=%7B"dataType"%3A"none"%2C"selectedGeneOption"%3A672%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A672%2C"dataType"%3A"TREATMENT_RESPONSE"%2C"selectedGenericAssayOption"%3A"Afatinib-1"%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&session_id=5ed80b90e4b030a3bfd0c662&tab_index=tab_visualize`
        );
        await waitForAndCheckPlotsTab();
    });
    it('plots tab waterfall plot color by cancer type highlight categories', async () => {
        await clickElement(`svg#plots-tab-plot-svg .legendLabel_Breast`);
        await clickElement(`svg#plots-tab-plot-svg .legendLabel_Glioma`);
        await waitForAndCheckPlotsTab();
    });

    it('plots tab scatter plot color by mutation count', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&plots_coloring_selection=%7B"selectedOption"%3A"undefined_%7B%5C"clinicalAttributeId%5C"%3A%5C"MUTATION_COUNT%5C"%2C%5C"patientAttribute%5C"%3Afalse%2C%5C"studyId%5C"%3A%5C"ccle_broad_2019%5C"%7D"%7D&plots_horz_selection=%7B"dataType"%3A"MRNA_EXPRESSION"%2C"selectedGeneOption"%3A672%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A672%2C"dataType"%3A"TREATMENT_RESPONSE"%2C"selectedGenericAssayOption"%3A"Afatinib-1"%2C"selectedDataSourceOption"%3A"CCLE_drug_treatment_AUC"%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&session_id=5ed80b90e4b030a3bfd0c662&tab_index=tab_visualize`
        );
        await waitForAndCheckPlotsTab();
    });
    it('plots tab scatter plot color by mutation count log scale', async () => {
        await clickElement('.coloringLogScale');
        await waitForAndCheckPlotsTab();
    });

    it('plots tab box plot color by mutation count', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&plots_coloring_selection=%7B"selectedOption"%3A"undefined_%7B%5C"clinicalAttributeId%5C"%3A%5C"MUTATION_COUNT%5C"%2C%5C"patientAttribute%5C"%3Afalse%2C%5C"studyId%5C"%3A%5C"ccle_broad_2019%5C"%7D"%2C"logScale"%3A"false"%7D&plots_horz_selection=%7B"dataType"%3A"MRNA_EXPRESSION"%2C"selectedGeneOption"%3A672%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A672%2C"dataType"%3A"MUTATION_EXTENDED"%2C"selectedGenericAssayOption"%3A"Afatinib-1"%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&session_id=5ed80b90e4b030a3bfd0c662&tab_index=tab_visualize`
        );
        await waitForAndCheckPlotsTab();
    });
    it('plots tab box plot color by mutation count log scale', async () => {
        await clickElement('.coloringLogScale');
        await waitForAndCheckPlotsTab();
    });

    it('plots tab waterfall plot color by mutation count', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&plots_coloring_selection=%7B"selectedOption"%3A"undefined_%7B%5C"clinicalAttributeId%5C"%3A%5C"MUTATION_COUNT%5C"%2C%5C"patientAttribute%5C"%3Afalse%2C%5C"studyId%5C"%3A%5C"ccle_broad_2019%5C"%7D"%2C"logScale"%3A"false"%7D&plots_horz_selection=%7B"dataType"%3A"none"%2C"selectedGeneOption"%3A672%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A672%2C"dataType"%3A"TREATMENT_RESPONSE"%2C"selectedGenericAssayOption"%3A"Afatinib-1"%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&session_id=5ed80b90e4b030a3bfd0c662&tab_index=tab_visualize`
        );
        await waitForAndCheckPlotsTab();
    });
    it('plots tab waterfall plot color by mutation count log scale', async () => {
        await clickElement('.coloringLogScale');
        await waitForAndCheckPlotsTab();
    });
    it('plots tab with structural variant coloring', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=prad_mich&case_set_id=prad_mich_cna&data_priority=0&gene_list=ERG&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=prad_mich_cna&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=prad_mich_mutations&genetic_profile_ids_PROFILE_STRUCTURAL_VARIANT=prad_mich_fusion&plots_coloring_selection=%7B"colorByCopyNumber"%3A"true"%2C"colorBySv"%3A"true"%7D&plots_horz_selection=%7B"dataType"%3A"clinical_attribute"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A2078%2C"dataType"%3A"COPY_NUMBER_ALTERATION"%7D&profileFilter=0&tab_index=tab_visualize`
        );

        await waitForAndCheckPlotsTab();
    });
    it('plots tab box plot log scale zero', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?cancer_study_list=msk_spectrum_tme_2022&tab_index=tab_visualize&case_set_id=msk_spectrum_tme_2022_all&Action=Submit&gene_list=EGFR&plots_horz_selection=%7B"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"METASTATIC_SITE"%2C"selectedGeneOption"%3A1956%2C"selectedGenericAssayOption"%3A"T_cell"%2C"mutationCountBy"%3A"MutationType"%2C"logScale"%3A"false"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A1956%2C"dataType"%3A"SINGLE_CELL_RELATIVE_CELL_TYPE_COUNTS"%2C"logScale"%3A"true"%2C"selectedDataSourceOption"%3A"cell_type_relative_counts"%2C"mutationCountBy"%3A"MutationType"%2C"selectedGenericAssayOption"%3A"T_cell"%7D&plots_coloring_selection=%7B"selectedOption"%3A"-10000_undefined"%7D`
        );

        await waitForAndCheckPlotsTab();
    });
});

describe('plots tab multiple studies screenshot tests', () => {
    before(async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=lgg_ucsf_2014%2Cbrca_tcga&case_set_id=all&data_priority=0&gene_list=TP53&geneset_list=%20&plots_coloring_selection=%7B%7D&plots_horz_selection=%7B"selectedGeneOption"%3A7157%2C"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"CANCER_TYPE_DETAILED"%7D&plots_vert_selection=%7B"selectedGeneOption"%3A7157%2C"dataType"%3A"clinical_attribute"%2C"selectedDataSourceOption"%3A"CANCER_TYPE"%7D&profileFilter=0&tab_index=tab_visualize`
        );
        await waitForElementDisplayed('div[data-test="PlotsTabPlotDiv"]', {
            timeout: 20000,
        });
    });

    it('plots tab multiple studies with data availability alert', async () => {
        await waitForAndCheckPlotsTab();
    });
});
