const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    goToUrlAndSetLocalStorageWithProperty,
    waitForStudyQueryPage,
    waitForGeneQueryPage,
    waitForOncoprint,
    waitForPlotsTab,
    waitForCoExpressionTab,
    reactSelectOption,
    getReactSelectOptions,
    selectReactSelectOption,
    getElement,
    clickElement,
    clickQueryByGeneButton,
    showGsva,
    jq,
    isDisplayed,
    setInputText,
    getNestedElement,
    getNthElements,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const oncoprintTabUrl =
    CBIOPORTAL_URL +
    '/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=GO_ACYLGLYCEROL_HOMEOSTASIS%20GO_ANATOMICAL_STRUCTURE_FORMATION_INVOLVED_IN_MORPHOGENESIS%20GO_ANTEROGRADE_AXONAL_TRANSPORT%20GO_APICAL_PROTEIN_LOCALIZATION%20GO_ATP_DEPENDENT_CHROMATIN_REMODELING%20GO_CARBOHYDRATE_CATABOLIC_PROCESS%20GO_CARDIAC_CHAMBER_DEVELOPMENT&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_GENESET_SCORE=study_es_0_gsva_scores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&tab_index=tab_visualize&show_samples=false&clinicallist=PROFILED_IN_study_es_0_gsva_scores%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic';
const plotsTabUrl =
    CBIOPORTAL_URL +
    '/results/plots?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_cnaseq&clinicallist=PROFILED_IN_study_es_0_gsva_scores%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic&data_priority=0&gene_list=CDKN2A%2520MDM2%2520MDM4%2520TP53&geneset_list=GO_ACYLGLYCEROL_HOMEOSTASIS%20GO_ANATOMICAL_STRUCTURE_FORMATION_INVOLVED_IN_MORPHOGENESIS%20GO_ANTEROGRADE_AXONAL_TRANSPORT%20GO_APICAL_PROTEIN_LOCALIZATION%20GO_ATP_DEPENDENT_CHROMATIN_REMODELING%20GO_CARBOHYDRATE_CATABOLIC_PROCESS%20GO_CARDIAC_CHAMBER_DEVELOPMENT&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_GENESET_SCORE=study_es_0_gsva_scores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize';
const coexpressionTabUrl =
    CBIOPORTAL_URL +
    '/results/coexpression?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=study_es_0&case_set_id=study_es_0_all&clinicallist=NUM_SAMPLES_PER_PATIENT%2CPROFILED_IN_study_es_0_gsva_scores%2CPROFILED_IN_study_es_0_mutations%2CPROFILED_IN_study_es_0_gistic%2CPROFILED_IN_study_es_0_mrna_median_Zscores&data_priority=0&gene_list=CREB3L1%2520RPS11%2520PNMA1%2520MMP2%2520ZHX3%2520ERCC5&geneset_list=GO_ATP_DEPENDENT_CHROMATIN_REMODELING%20GO_ACYLGLYCEROL_HOMEOSTASIS%20GO_ANATOMICAL_STRUCTURE_FORMATION_INVOLVED_IN_MORPHOGENESIS%20GO_ANTEROGRADE_AXONAL_TRANSPORT%20GO_APICAL_PROTEIN_LOCALIZATION%20GO_CARBOHYDRATE_CATABOLIC_PROCESS%20GO_CARDIAC_CHAMBER_DEVELOPMENT&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&genetic_profile_ids_PROFILE_GENESET_SCORE=study_es_0_gsva_scores&genetic_profile_ids_PROFILE_MRNA_EXPRESSION=study_es_0_mrna_median_Zscores&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&show_samples=false&tab_index=tab_visualize%27';
const ADD_TRACKS_HEATMAP_TAB = '.oncoprintAddTracks a.tabAnchor_Heatmap';

describe.skip('gsva feature', function() {
    //this.retries(2);

    describe('query page', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
            await showGsva();
            await waitForStudyQueryPage();
        });

        it('shows GSVA-profile option when selecting study_es_0', async () => {
            // somehow reloading the page is needed to turn on the GSVA feature for the first test
            await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
            await waitForStudyQueryPage();
            await checkTestStudy();
            assert(await isDisplayed('[data-test=GENESET_SCORE]'));
        });

        it('shows gene set entry component when selecting gsva-profile data type', async () => {
            await checkTestStudy();
            await checkGSVAprofile();

            assert(await isDisplayed('h2=Enter Gene Sets:'));
            assert(await isDisplayed('[data-test=GENESET_HIERARCHY_BUTTON]'));
            assert(await isDisplayed('[data-test=GENESET_VOLCANO_BUTTON]'));
            assert(await isDisplayed('[data-test=GENESETS_TEXT_AREA]'));
        });

        it('adds gene set parameter to url after submit', async () => {
            await checkTestStudy();
            await checkGSVAprofile();
            await setInputText(
                '[data-test=GENESETS_TEXT_AREA]',
                'GO_ATP_DEPENDENT_CHROMATIN_REMODELING'
            );
            await setInputText('[data-test=geneSet]', 'TP53');
            const queryButton = await getElement('[data-test=queryButton]');
            await queryButton.waitForEnabled();
            await queryButton.click();
            const url = await browser.getUrl();
            const regex = /geneset_list=GO_ATP_DEPENDENT_CHROMATIN_REMODELING/;
            assert(url.match(regex));
        });
    });

    describe('GenesetsHierarchySelector', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
            await showGsva();
            await waitForStudyQueryPage();
            await checkTestStudy();
            await checkGSVAprofile();
        });

        it('adds gene set name to entry component from hierachy selector', async () => {
            await openGsvaHierarchyDialog();

            const checkBox = await getElement(
                '*=GO_ATP_DEPENDENT_CHROMATIN_REMODELING'
            );
            await checkBox.click();

            // wait for jstree to process the click
            await browser.waitUntil(async () =>
                (await checkBox.getAttribute('class')).includes(
                    'jstree-clicked'
                )
            );

            await clickElement('button=Select');

            await (
                await getElement('span*=All gene sets are valid')
            ).waitForExist();

            assert.equal(
                await (
                    await getElement('[data-test=GENESETS_TEXT_AREA]')
                ).getHTML(false),
                'GO_ATP_DEPENDENT_CHROMATIN_REMODELING'
            );
        });

        it('filters gene sets with the GSVA score input field', async () => {
            await openGsvaHierarchyDialog();

            await setInputText('[id=GSVAScore]', '0');
            await clickElement('[id=filterButton]');
            await waitForModalUpdate();

            assert.equal((await $$('*=GO_')).length, 5);

            // reset state
            await setInputText('[id=GSVAScore]', '0.5');
            await clickElement('[id=filterButton]');
            await waitForModalUpdate();
        });

        it('filters gene sets with the search input field', async () => {
            await setInputText('[id=GSVAScore]', '0');
            await clickElement('[id=filterButton]');
            await waitForModalUpdate();

            // note: search inbox hides elements in JTree rather than reload data
            const hiddenBefore = (await $$('.jstree-hidden')).length;
            assert(
                hiddenBefore == 0,
                'The tree should not have hidden elements at this point'
            );

            await setInputText(
                '[id=geneset-hierarchy-search]',
                'GO_ACYLGLYCEROL_HOMEOSTASIS'
            );
            await waitForModalUpdate();
            assert.equal((await $$('.jstree-hidden')).length, 7);
            assert(await getElement('*=GO_ACYLGLYCEROL_HOMEOSTASIS'));

            // reset state
            await setInputText('[id=geneset-hierarchy-search]', '');
            await setInputText('[id=GSVAScore]', '0.5');
            await clickElement('[id=filterButton]');
            await waitForModalUpdate();
        });

        it('filters gene sets with the gene set pvalue input field', async () => {
            await setInputText('[id=Pvalue]', '0.0005');
            await clickElement('[id=filterButton]');
            await waitForModalUpdate();
            const after = await $$('*=GO_');
            assert.equal((await $$('*=GO_')).length, 0);
            // reset state
            await setInputText('[id=Pvalue]', '0.05');
            await clickElement('[id=filterButton]');
            await waitForModalUpdate();
        });

        it('filters gene sets with the gene set percentile select box', async () => {
            const modal = await getElement('div.modal-body');
            await (await modal.$('.Select-value-label')).click();
            await (await modal.$('.Select-option=100%')).click();
            await (await modal.$('[id=filterButton]')).click();
            await waitForModalUpdate();

            assert.equal((await $$('*=GO_')).length, 2);

            // reset state
            await (await modal.$('.Select-value-label')).click();
            await (await modal.$('.Select-option=75%')).click();
            await (await modal.$('[id=filterButton]')).click();
            await waitForModalUpdate();
        });

        describe('skin.geneset_hierarchy.collapse_by_default property', () => {
            it('collapses tree on init when property set to true', async () => {
                await goToUrlAndSetLocalStorageWithProperty(
                    CBIOPORTAL_URL,
                    true,
                    {
                        skin_geneset_hierarchy_collapse_by_default: true,
                    }
                );
                await showGsva();
                await waitForStudyQueryPage();
                await checkTestStudy();
                await checkGSVAprofile();
                await openGsvaHierarchyDialog();
                const gsvaEntriesNotShown = (await $$('*=GO_')).length === 0;
                assert(gsvaEntriesNotShown);
            });
            it('expands tree on init when property set to false', async () => {
                await goToUrlAndSetLocalStorageWithProperty(
                    CBIOPORTAL_URL,
                    true,
                    {
                        skin_geneset_hierarchy_collapse_by_default: false,
                    }
                );
                await showGsva();
                await waitForStudyQueryPage();
                await checkTestStudy();
                await checkGSVAprofile();
                await openGsvaHierarchyDialog();
                const gsvaEntriesShown = (await $$('*=GO_')).length > 0;
                assert(gsvaEntriesShown);
            });
            it('expands tree on init when property not defined', async () => {
                await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
                await showGsva();
                await waitForStudyQueryPage();
                await checkTestStudy();
                await checkGSVAprofile();
                await openGsvaHierarchyDialog();
                const gsvaEntriesShown = (await $$('*=GO_')).length > 0;
                assert(gsvaEntriesShown);
            });
        });
    });

    describe('GenesetVolcanoPlotSelector', () => {
        this.retries(0);

        before(async () => {
            await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
            await showGsva();
            await waitForStudyQueryPage();
            await checkTestStudy();
            await checkGSVAprofile();
        });

        it('adds gene set name to entry component', async () => {
            await openGsvaVolcanoDialog();
            // find the GO_ATP_DEPENDENT_CHROMATIN_REMODELING entry and check its checkbox
            await (
                await getElement('span=GO_ATP_DEPENDENT_CHROMATIN_REMODELING')
            ).waitForExist();
            const checkBoxParent = await getNestedElement([
                'span=GO_ATP_DEPENDENT_CHROMATIN_REMODELING',
                '..',
                '..',
            ]);
            const checkBox = await (await checkBoxParent.$$('td'))[3].$(
                'label input'
            );
            await checkBox.waitForDisplayed();
            await browser.waitUntil(async () => {
                await checkBox.click();
                return checkBox.isSelected();
            });

            await (
                await getElement('button=Add selection to the query')
            ).waitForExist();
            await clickElement('button=Add selection to the query');

            await (
                await getElement('span*=All gene sets are valid')
            ).waitForExist();

            const textArea = await getElement('[data-test=GENESETS_TEXT_AREA]');
            assert.equal(
                await textArea.getHTML(false),
                'GO_ATP_DEPENDENT_CHROMATIN_REMODELING'
            );
        });

        it('selects gene sets from query page text area', async () => {
            await openGsvaVolcanoDialog();

            const checkBoxParent = await getNestedElement([
                'span=GO_ATP_DEPENDENT_CHROMATIN_REMODELING',
                '..',
                '..',
            ]);
            const checkBox = await (await checkBoxParent.$$('td'))[3].$(
                'label input'
            );

            assert(await checkBox.isSelected());
        });

        it('reset keeps gene sets from query page text area', async () => {
            const checkBoxParent = await getNestedElement([
                'span=GO_ATP_DEPENDENT_CHROMATIN_REMODELING',
                '..',
                '..',
            ]);
            const checkBox = await (await checkBoxParent.$$('td'))[3].$(
                'label input'
            );

            await clickElement('button=Clear selection');

            assert(await checkBox.isSelected());
        });

        it('searchbox filters gene set list', async () => {
            const lengthBefore = (await jq('td span:contains("GO_")')).length;
            assert.equal(lengthBefore, 5);

            await (await getElement('input.tableSearchInput')).waitForExist();
            await setInputText('input.tableSearchInput', 'GO_ACYL');

            await browser.waitUntil(
                async () =>
                    (await jq('td span:contains("GO_")')).length < lengthBefore,
                {
                    timeout: 10000,
                }
            );

            const lengthAfter = (await jq('td span:contains("GO_")')).length;
            assert.equal(lengthAfter, 1);
        });
    });

    describe('results view page', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(oncoprintTabUrl, true);
            await waitForOncoprint();
        });

        it('shows co-expression tab when genes with expression data selected', async () => {
            assert(await getElement('ul.nav-tabs li.tabAnchor_coexpression'));
        });
    });

    describe('oncoprint tab', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(oncoprintTabUrl, true);
            await waitForOncoprint();
        });

        it('has GSVA profile option in heatmap menu', async () => {
            await clickElement('button[id=addTracksDropdown]');

            await clickElement(ADD_TRACKS_HEATMAP_TAB);

            const heatmapDropdown = await getNthElements('.Select-control', 0);
            await heatmapDropdown.waitForExist();
            await heatmapDropdown.click();
            assert(
                await isDisplayed(
                    'div=GSVA scores on oncogenic signatures gene sets'
                )
            );
        });
    });

    describe('plots tab', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(plotsTabUrl, true);
            await waitForPlotsTab();
        });

        it('shows gsva option in horizontal data type selection box', async () => {
            const horzDataSelect = await getNestedElement([
                '[name=h-profile-type-selector]',
                '..',
            ]);
            await (await horzDataSelect.$('.Select-arrow-zone')).click();
            assert(await horzDataSelect.$('.Select-option=Gene Sets'));
        });

        it('shows gsva option in vertical data type selection box', async () => {
            const vertDataSelect = await getNestedElement([
                '[name=v-profile-type-selector]',
                '..',
                '.Select-arrow-zone',
            ]);
            await vertDataSelect.click();
            assert(await vertDataSelect.$('.Select-option=Gene Sets'));
        });

        it('horizontal axis menu shows gsva score and pvalue in profile menu', async () => {
            const horzDataSelect = await getNestedElement([
                '[name=h-profile-type-selector]',
                '..',
            ]);
            await (await horzDataSelect.$('.Select-arrow-zone')).click();
            await (await horzDataSelect.$('.Select-option=Gene Sets')).click();

            const horzProfileSelect = await getNestedElement([
                '[name=h-profile-name-selector]',
                '..',
            ]);
            await (await horzProfileSelect.$('.Select-arrow-zone')).click();

            assert(
                await horzProfileSelect.$(
                    '.Select-option=GSVA scores on oncogenic signatures gene sets'
                )
            );
            assert(
                await horzProfileSelect.$(
                    '.Select-option=Pvalues of GSVA scores on oncogenic signatures gene sets'
                )
            );
        });

        it('vertical axis menu shows gsva score and pvalue in profile menu', async () => {
            const vertDataSelect = await getNestedElement([
                '[name=v-profile-type-selector]',
                '..',
            ]);
            await (await vertDataSelect.$('.Select-arrow-zone')).click();
            await (await vertDataSelect.$('.Select-option=Gene Sets')).click();

            const vertProfileSelect = await getNestedElement([
                '[name=v-profile-name-selector]',
                '..',
            ]);
            await (await vertProfileSelect.$('.Select-arrow-zone')).click();

            assert(
                await vertProfileSelect.$(
                    '.Select-option=GSVA scores on oncogenic signatures gene sets'
                )
            );
            assert(
                await vertProfileSelect.$(
                    '.Select-option=Pvalues of GSVA scores on oncogenic signatures gene sets'
                )
            );
        });

        it('horizontal axis menu shows gene set entry in entity menu', async () => {
            const horzDataSelect = await getNestedElement([
                '[name=h-profile-type-selector]',
                '..',
            ]);
            await (
                await horzDataSelect.$('.Select-arrow-zone')
            ).waitForDisplayed();
            await (await horzDataSelect.$('.Select-arrow-zone')).click();
            await (
                await horzDataSelect.$('.Select-option=Gene Sets')
            ).waitForDisplayed();
            await (await horzDataSelect.$('.Select-option=Gene Sets')).click();

            const horzProfileSelect = await getNestedElement([
                '[name=h-profile-name-selector]',
                '..',
            ]);
            await (
                await horzProfileSelect.$('.Select-arrow-zone')
            ).waitForDisplayed();
            await (await horzProfileSelect.$('.Select-arrow-zone')).click();
            const profileMenuEntry =
                '.Select-option=Pvalues of GSVA scores on oncogenic signatures gene sets';
            await (
                await horzProfileSelect.$(profileMenuEntry)
            ).waitForDisplayed();
            await (await horzProfileSelect.$(profileMenuEntry)).click();

            const horzEntitySelect = await getNestedElement([
                '[name=h-geneset-selector]',
                '..',
            ]);
            await (
                await horzEntitySelect.$('.Select-arrow-zone')
            ).waitForDisplayed();
            await (await horzEntitySelect.$('.Select-arrow-zone')).click();
            const entityMenuEntry =
                '.Select-option=GO_ATP_DEPENDENT_CHROMATIN_REMODELING';
            await (await horzEntitySelect.$(entityMenuEntry)).waitForExist();

            assert(await horzEntitySelect.$(entityMenuEntry));
        });

        it('vertical axis menu shows gene set entry in entity menu', async () => {
            const vertDataSelect = await getNestedElement([
                '[name=v-profile-type-selector]',
                '..',
            ]);
            await (
                await vertDataSelect.$('.Select-arrow-zone')
            ).waitForDisplayed();
            await (await vertDataSelect.$('.Select-arrow-zone')).click();
            await (
                await vertDataSelect.$('.Select-option=Gene Sets')
            ).waitForDisplayed();
            await (await vertDataSelect.$('.Select-option=Gene Sets')).click();

            const vertProfileSelect = await getNestedElement([
                '[name=v-profile-name-selector]',
                '..',
            ]);
            await (
                await vertProfileSelect.$('.Select-arrow-zone')
            ).waitForDisplayed();
            await (await vertProfileSelect.$('.Select-arrow-zone')).click();
            const profileMenuEntry =
                '.Select-option=Pvalues of GSVA scores on oncogenic signatures gene sets';
            await (
                await vertProfileSelect.$(profileMenuEntry)
            ).waitForDisplayed();
            await (await vertProfileSelect.$(profileMenuEntry)).click();

            const vertEntitySelect = await getNestedElement([
                '[name=v-geneset-selector]',
                '..',
            ]);
            await (
                await vertEntitySelect.$('.Select-arrow-zone')
            ).waitForDisplayed();
            await (await vertEntitySelect.$('.Select-arrow-zone')).click();
            const entityMenuEntry =
                '.Select-option=GO_ATP_DEPENDENT_CHROMATIN_REMODELING';
            await (await vertEntitySelect.$(entityMenuEntry)).waitForExist();

            assert(await vertEntitySelect.$(entityMenuEntry));
        });
    });

    describe('co-expression tab', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(coexpressionTabUrl, true);
            await waitForCoExpressionTab();
        });

        it('shows buttons for genes', async () => {
            const genes = coexpressionTabUrl
                .match(/gene_list=(.*)\&/)[1]
                .split('%20');
            const container = await getElement(
                '//*[@id="coexpressionTabGeneTabs"]'
            );
            const icons = await Promise.all(
                genes.map(async g => await container.$(`a=${g}`))
            );
            assert.equal(genes.length, icons.length);
        });

        it('shows buttons for genes and gene sets', async () => {
            const geneSets = coexpressionTabUrl
                .match(/geneset_list=(.*)\&/)[1]
                .split('%20');
            const container = await getElement(
                '//*[@id="coexpressionTabGeneTabs"]'
            );
            const icons = await Promise.all(
                geneSets.map(async g => await container.$('a=' + g))
            );
            assert.equal(geneSets.length, icons.length);
        });

        it('shows mRNA expression/GSVA scores in query profile select box when reference gene selected', async () => {
            const icon = await getNestedElement([
                '#coexpressionTabGeneTabs',
                'a=RPS11',
            ]);
            await icon.click();
            await (await getElement('#coexpressionTabGeneTabs')).waitForExist();

            assert.equal(
                (
                    await getReactSelectOptions(
                        await getElement('.coexpression-select-query-profile')
                    )
                ).length,
                2
            );
            assert(
                await reactSelectOption(
                    await getElement('.coexpression-select-query-profile'),
                    'mRNA expression (microarray) (526 samples)'
                )
            );
            assert(
                await reactSelectOption(
                    await getElement('.coexpression-select-query-profile'),
                    'GSVA scores on oncogenic signatures gene sets (5 samples)'
                )
            );
        });

        it('shows mRNA expression in subject profile select box when reference gene selected', async () => {
            const icon = await getNestedElement([
                '//*[@id="coexpressionTabGeneTabs"]',
                'a=RPS11',
            ]);
            await icon.click();
            await (
                await getElement('//*[@id="coexpressionTabGeneTabs"]')
            ).waitForExist();
            assert.equal(
                (
                    await getReactSelectOptions(
                        await getElement('.coexpression-select-subject-profile')
                    )
                ).length,
                1
            );
            assert(
                await reactSelectOption(
                    await getElement('.coexpression-select-subject-profile'),
                    'mRNA expression (microarray) (526 samples)'
                )
            );
        });

        it('shows name of gene in `correlated with` field when reference gene selected', async () => {
            const icon = await getNestedElement([
                '//*[@id="coexpressionTabGeneTabs"]',
                'a=RPS11',
            ]);
            await icon.click();
            await (
                await getElement('//*[@id="coexpressionTabGeneTabs"]')
            ).waitForExist();
            const text = await (
                await getElement('span*=that are correlated')
            ).getText();
            assert(text.match('RPS11'));
        });

        it('shows mRNA expression/GSVA scores in subject profile box when reference gene set selected', async () => {
            const icon = await getNestedElement([
                '//*[@id="coexpressionTabGeneTabs"]',
                'a=GO_ACYLGLYCEROL_HOMEOSTASIS',
            ]);
            await icon.click();
            await (
                await getElement('//*[@id="coexpressionTabGeneTabs"]')
            ).waitForExist();
            assert.equal(
                (
                    await getReactSelectOptions(
                        await getElement('.coexpression-select-query-profile')
                    )
                ).length,
                2
            );
            assert(
                await reactSelectOption(
                    await getElement('.coexpression-select-query-profile'),
                    'mRNA expression (microarray) (526 samples)'
                )
            );
            assert(
                await reactSelectOption(
                    await getElement('.coexpression-select-query-profile'),
                    'GSVA scores on oncogenic signatures gene sets (5 samples)'
                )
            );
        });

        it('shows disabled subject query select box when reference gene set selected', async () => {
            const icon = await getNestedElement([
                '//*[@id="coexpressionTabGeneTabs"]',
                'a=GO_ACYLGLYCEROL_HOMEOSTASIS',
            ]);
            await icon.click();
            await (
                await getElement('//*[@id="coexpressionTabGeneTabs"]')
            ).waitForExist();
            assert(
                await getElement(
                    '.coexpression-select-subject-profile.is-disabled '
                )
            );
            assert(
                await getNestedElement([
                    '.coexpression-select-subject-profile',
                    '.Select-value-label*=GSVA scores on oncogenic',
                ])
            );
        });

        it('shows gene sets in table when GSVA scores selected in subject profile select box', async () => {
            await selectReactSelectOption(
                await getElement('.coexpression-select-query-profile'),
                'GSVA scores on oncogenic signatures gene sets (5 samples)'
            );
            await (
                await getElement('//*[@id="coexpressionTabGeneTabs"]')
            ).waitForExist();

            assert.equal((await jq('td span:contains("GO_")')).length, 7);
        });

        it('shows `Enter gene set.` placeholder in table search box when GSVA scores selected in first select box', async () => {
            await selectReactSelectOption(
                await getElement('.coexpression-select-query-profile'),
                'GSVA scores on oncogenic signatures gene sets (5 samples)'
            );
            await (
                await getElement('//*[@id="coexpressionTabGeneTabs"]')
            ).waitForExist();
            assert(
                await getElement(
                    '[data-test=CoExpressionGeneTabContent] input[placeholder="Enter gene set.."]'
                )
            );
        });
    });
});

const checkTestStudy = async () => {
    await (await getElement('span=Test study es_0')).waitForExist();

    const checkbox = await getNestedElement([
        'span=Test study es_0',
        '..',
        'input[type=checkbox]',
    ]);
    await checkbox.click();
    await clickQueryByGeneButton();
    await waitForGeneQueryPage();
};

const checkGSVAprofile = async () => {
    await (await getElement('[data-test=GENESET_SCORE]')).waitForExist();
    await clickElement('[data-test=GENESET_SCORE]');
    await (await getElement('[data-test=GENESETS_TEXT_AREA]')).waitForExist();
};

const openGsvaHierarchyDialog = async () => {
    await clickElement('button[data-test=GENESET_HIERARCHY_BUTTON]');
    await (await getElement('div.modal-dialog')).waitForExist();
    await (
        await getElement('div[data-test=gsva-tree-container] ul')
    ).waitForExist();
    await waitForModalUpdate();
};

const openGsvaVolcanoDialog = async () => {
    await (
        await getElement('button[data-test=GENESET_VOLCANO_BUTTON]')
    ).waitForExist();
    await clickElement('button[data-test=GENESET_VOLCANO_BUTTON]');
    await (await getElement('div.modal-dialog')).waitForExist();
};

module.exports = {
    checkTestStudy: checkTestStudy,
    checkGSVAprofile: checkGSVAprofile,
    queryPageUrl: CBIOPORTAL_URL,
    oncoprintTabUrl: oncoprintTabUrl,
    plotsTabUrl: plotsTabUrl,
    coexpressionTabUrl: coexpressionTabUrl,
};

async function waitForModalUpdate() {
    await browser.waitUntil(
        async () => (await $$('.sk-spinner')).length === 0,
        { timeout: 10000 }
    );
}
