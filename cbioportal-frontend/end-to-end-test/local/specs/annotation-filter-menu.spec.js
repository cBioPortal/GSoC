const assert = require('assert');
const {
    goToUrlAndSetLocalStorageWithProperty,
    goToUrlAndSetLocalStorage,
    useExternalFrontend,
    waitForStudyView,
    waitForComparisonTab,
    openAlterationTypeSelectionMenu,
    getElement,
    getNestedElement,
    clickElement,
    isDisplayed,
    waitForElementDisplayed,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=study_es_0`;
const comparisonResultsViewUrl = `${CBIOPORTAL_URL}/results/comparison?genetic_profile_ids_PROFILE_MUTATION_EXTENDED=study_es_0_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=study_es_0_gistic&cancer_study_list=study_es_0&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&data_priority=0&profileFilter=0&case_set_id=study_es_0_cnaseq&gene_list=ABLIM1%2520TP53&geneset_list=%20&tab_index=tab_visualize&Action=Submit&comparison_subtab=alterations`;
const selectSamplesButton = 'button=Select Samples';

// Note: not all SV elements outside of visible area are rendered:
const SV_COUNTS_SORT_DESC_10 = {
    BRAF: '37',
    SND1: '10',
    AGK: '4',
    ALK: '4',
    TTN: '4',
    NCOA4: '3',
    AGAP3: '2',
    CDK5RAP2: '2',
    EML4: '2',
    MKRN1: '2',
};

/**
 * For filtering of Structural Variants, see also: custom-driver-annotations-in-study-view.spec.js
 */
describe('alteration filter menu', function() {
    describe('study view', () => {
        describe('filtering of gene tables', () => {
            beforeEach(async () => {
                await goToUrlAndSetLocalStorageWithProperty(
                    studyViewUrl,
                    true,
                    {
                        /**
                         * Only use custom driver annotations from local db:
                         */
                        show_oncokb: false,
                    }
                );
                await waitForStudyView();
                await turnOffCancerGenesFilters();
                await openAlterationFilterMenu();
            });

            // -+=+ MUTATION STATUS +=+-
            it('filters mutation table when unchecking somatic checkbox', async () => {
                await clickCheckBoxStudyView('Somatic');
                assert.deepStrictEqual(
                    await geneTableCounts('mutations-table'),
                    {
                        BRCA2: '6',
                        BRCA1: '1',
                        ATM: '1',
                        TP53: '1',
                    }
                );
                // somatic checkbox unchecked, filter structural variant table
                assert.strictEqual(
                    Object.keys(
                        await geneTableCounts('structural variants-table')
                    ).length,
                    0
                );
                // does not filter cna table
                assert.deepStrictEqual(
                    await geneTableCounts('copy number alterations-table'),
                    {
                        ERCC5_AMP: '7',
                        AURKAIP1_AMP: '7',
                        ATAD3A_AMP: '7',
                        ATAD3B_AMP: '7',
                        ACAP3_AMP: '7',
                        ATAD3C_AMP: '7',
                        AGRN_AMP: '7',
                        ERCC5_HOMDEL: '2',
                        AURKAIP1_HOMDEL: '2',
                        ATAD3A_HOMDEL: '2',
                        ATAD3B_HOMDEL: '2',
                        ACAP3_HOMDEL: '2',
                        ATAD3C_HOMDEL: '2',
                        AGRN_HOMDEL: '2',
                    }
                );
            });

            it('filters mutation table when unchecking germline checkbox', async () => {
                await clickCheckBoxStudyView('Germline');
                assert.deepStrictEqual(
                    await geneTableCounts('mutations-table'),
                    {
                        BRCA2: '6',
                        ACP3: '5',
                        BRCA1: '4',
                        ATM: '1',
                        DTNB: '1',
                        ABLIM1: '1',
                        MSH3: '1',
                        MYB: '1',
                        TP53: '1',
                        PIEZO1: '1',
                        ADAMTS20: '1',
                        OR11H1: '1',
                        TMEM247: '1',
                    }
                );
                // does not filter structural variant table
                // (sort and take top ten, as react does not render all rows)
                assert.deepStrictEqual(
                    sortDescLimit(
                        await geneTableCounts('structural variants-table')
                    ),
                    SV_COUNTS_SORT_DESC_10
                );
                // does not filter cna table
                assert.deepStrictEqual(
                    await geneTableCounts('copy number alterations-table'),
                    {
                        ERCC5_AMP: '7',
                        AURKAIP1_AMP: '7',
                        ATAD3A_AMP: '7',
                        ATAD3B_AMP: '7',
                        ACAP3_AMP: '7',
                        ATAD3C_AMP: '7',
                        AGRN_AMP: '7',
                        ERCC5_HOMDEL: '2',
                        AURKAIP1_HOMDEL: '2',
                        ATAD3A_HOMDEL: '2',
                        ATAD3B_HOMDEL: '2',
                        ACAP3_HOMDEL: '2',
                        ATAD3C_HOMDEL: '2',
                        AGRN_HOMDEL: '2',
                    }
                );
            });

            it('does not filter mutation table when unchecking unknown status checkbox', async () => {
                //NOTE this is failing because somatic status filtering appears not to
                // work on SVs where it once did
                // this is probably because SVs were mutations
                // it apparently regarded them as UNKNOWN, now they are KNOWN
                // FILL IN NUMBER OF SVs
                await clickElement('[data-test=ShowUnknown]');
                await waitForStudyView();
                assert.deepStrictEqual(
                    await geneTableCounts('mutations-table'),
                    {
                        BRCA2: '12',
                        ACP3: '5',
                        BRCA1: '5',
                        ATM: '2',
                        DTNB: '1',
                        ABLIM1: '1',
                        MSH3: '1',
                        MYB: '1',
                        TP53: '2',
                        PIEZO1: '1',
                        ADAMTS20: '1',
                        OR11H1: '1',
                        TMEM247: '1',
                    }
                );
                // does not filter structural variant table
                // (take top ten, as react does not render all rows)
                assert.deepStrictEqual(
                    sortDescLimit(
                        await geneTableCounts('structural variants-table')
                    ),
                    SV_COUNTS_SORT_DESC_10
                );
                // does not filter cna table
                assert.deepStrictEqual(
                    await geneTableCounts('copy number alterations-table'),
                    {
                        ERCC5_AMP: '7',
                        AURKAIP1_AMP: '7',
                        ATAD3A_AMP: '7',
                        ATAD3B_AMP: '7',
                        ACAP3_AMP: '7',
                        ATAD3C_AMP: '7',
                        AGRN_AMP: '7',
                        ERCC5_HOMDEL: '2',
                        AURKAIP1_HOMDEL: '2',
                        ATAD3A_HOMDEL: '2',
                        ATAD3B_HOMDEL: '2',
                        ACAP3_HOMDEL: '2',
                        ATAD3C_HOMDEL: '2',
                        AGRN_HOMDEL: '2',
                    }
                );
            });

            // -+=+ DRIVER ANNOTATIONS +=+-
            it('filters tables when unchecking driver checkbox', async () => {
                await clickCheckBoxStudyView('Putative drivers');
                assert.deepStrictEqual(
                    await geneTableCounts('mutations-table'),
                    {
                        ACP3: '5',
                        ADAMTS20: '1',
                        ATM: '2',
                        BRCA1: '3',
                        BRCA2: '12',
                        DTNB: '1',
                        MSH3: '1',
                        MYB: '1',
                        PIEZO1: '1',
                        TMEM247: '1',
                        TP53: '2',
                    }
                );

                assert.deepStrictEqual(
                    await geneTableCounts('copy number alterations-table'),
                    {
                        AURKAIP1_AMP: '7',
                        ATAD3A_AMP: '7',
                        ATAD3B_AMP: '7',
                        ACAP3_AMP: '7',
                        ATAD3C_AMP: '7',
                        ERCC5_AMP: '6',
                        AGRN_AMP: '6',
                        AURKAIP1_HOMDEL: '2',
                        ATAD3A_HOMDEL: '2',
                        ATAD3B_HOMDEL: '2',
                        ACAP3_HOMDEL: '2',
                        ATAD3C_HOMDEL: '2',
                        AGRN_HOMDEL: '2',
                        ERCC5_HOMDEL: '1',
                    }
                );
            });

            it('filters tables when unchecking passenger checkbox', async () => {
                await clickCheckBoxStudyView('Putative passengers');
                assert.deepStrictEqual(
                    await geneTableCounts('mutations-table'),
                    {
                        BRCA2: '12',
                        ACP3: '5',
                        BRCA1: '4',
                        ATM: '2',
                        ABLIM1: '1',
                        TP53: '2',
                        ADAMTS20: '1',
                        OR11H1: '1',
                    }
                );

                // For Structural Variants: see custom-driver-annotations-in-study-view.spec.js

                assert.deepStrictEqual(
                    await geneTableCounts('copy number alterations-table'),
                    {
                        ERCC5_AMP: '7',
                        AURKAIP1_AMP: '7',
                        ATAD3A_AMP: '7',
                        ATAD3B_AMP: '7',
                        ACAP3_AMP: '6',
                        ATAD3C_AMP: '6',
                        AGRN_AMP: '7',
                        ERCC5_HOMDEL: '2',
                        AURKAIP1_HOMDEL: '2',
                        ATAD3A_HOMDEL: '2',
                        ATAD3B_HOMDEL: '2',
                        ACAP3_HOMDEL: '2',
                        ATAD3C_HOMDEL: '2',
                        AGRN_HOMDEL: '2',
                    }
                );
            });

            it('filters tables when unchecking when unchecking unknown oncogenicity checkbox', async () => {
                await clickElement('[data-test=ShowUnknownOncogenicity]');
                await waitForStudyView();
                assert.deepStrictEqual(
                    await geneTableCounts('mutations-table'),
                    {
                        BRCA1: '3',
                        PIEZO1: '1',
                        DTNB: '1',
                        ABLIM1: '1',
                        MSH3: '1',
                        MYB: '1',
                        OR11H1: '1',
                        TMEM247: '1',
                    }
                );

                // For Structural Variants: see custom-driver-annotations-in-study-view.spec.js

                assert.deepStrictEqual(
                    await geneTableCounts('copy number alterations-table'),
                    {
                        ERCC5_AMP: '1',
                        ACAP3_AMP: '1',
                        ATAD3C_AMP: '1',
                        AGRN_AMP: '1',
                        ERCC5_HOMDEL: '1',
                    }
                );
            });

            it('filters structural variant tables when unchecking when unchecking somatic oncogenicity checkbox', async () => {
                await clickElement('[data-test=HideSomatic]');
                await waitForStudyView();
                assert.strictEqual(
                    Object.keys(geneTableCounts('structural variants-table'))
                        .length,
                    0
                );
            });

            // -+=+ TIER ANNOTATIONS +=+-
            it('does not filter tables when checking all tier checkboxes', async () => {
                await waitForStudyView();
                assert.deepStrictEqual(
                    await geneTableCounts('mutations-table'),
                    {
                        BRCA2: '12',
                        ACP3: '5',
                        BRCA1: '5',
                        ATM: '2',
                        DTNB: '1',
                        ABLIM1: '1',
                        MSH3: '1',
                        MYB: '1',
                        TP53: '2',
                        PIEZO1: '1',
                        ADAMTS20: '1',
                        OR11H1: '1',
                        TMEM247: '1',
                    }
                );

                // For Structural Variants: see custom-driver-annotations-in-study-view.spec.js

                assert.deepStrictEqual(
                    await geneTableCounts('copy number alterations-table'),
                    {
                        ERCC5_AMP: '7',
                        AURKAIP1_AMP: '7',
                        ATAD3A_AMP: '7',
                        ATAD3B_AMP: '7',
                        ACAP3_AMP: '7',
                        ATAD3C_AMP: '7',
                        AGRN_AMP: '7',
                        ERCC5_HOMDEL: '2',
                        AURKAIP1_HOMDEL: '2',
                        ATAD3A_HOMDEL: '2',
                        ATAD3B_HOMDEL: '2',
                        ACAP3_HOMDEL: '2',
                        ATAD3C_HOMDEL: '2',
                        AGRN_HOMDEL: '2',
                    }
                );
            });

            it('filters tables when checking only Class 1 checkbox', async () => {
                await selectTier('Class_1');
                await waitForStudyView();
                assert.deepStrictEqual(
                    await geneTableCounts('mutations-table'),
                    {
                        BRCA1: '3',
                        ABLIM1: '1',
                        DTNB: '1',
                    }
                );

                assert.deepStrictEqual(
                    await geneTableCounts('copy number alterations-table'),
                    {
                        ATAD3B_HOMDEL: '1',
                        AGRN_AMP: '1',
                    }
                );
            });

            it('filters tables when checking only Class 2 checkbox', async () => {
                await selectTier('Class_2');

                assert.deepStrictEqual(
                    await geneTableCounts('mutations-table'),
                    {
                        TMEM247: '1',
                    }
                );

                assert.deepStrictEqual(
                    await geneTableCounts('structural variants-table'),
                    { ALK: '1', EML4: '1' }
                );

                assert.deepStrictEqual(
                    await geneTableCounts('copy number alterations-table'),
                    {
                        ATAD3A_HOMDEL: '1',
                        ACAP3_AMP: '1',
                    }
                );
            });

            it('filters tables when checking only Class 3 checkbox', async () => {
                await selectTier('Class_3');
                await waitForStudyView();
                assert.deepStrictEqual(
                    await geneTableCounts('mutations-table'),
                    {
                        MSH3: '1',
                        PIEZO1: '1',
                    }
                );

                assert.deepStrictEqual(
                    await geneTableCounts('structural variants-table'),
                    { NCOA4: '1', RET: '1' }
                );

                assert.strictEqual(
                    Object.keys(
                        await geneTableCounts('copy number alterations-table')
                    ).length,
                    0
                );
            });

            it('filters tables when checking only Class 4 checkbox', async () => {
                await selectTier('Class_4');
                await waitForStudyView();
                assert.deepStrictEqual(
                    await geneTableCounts('mutations-table'),
                    {
                        ADAMTS20: '1',
                    }
                );

                assert.deepStrictEqual(
                    await geneTableCounts('structural variants-table'),
                    {
                        KIAA1549: '1',
                        BRAF: '1',
                        NCOA4: '1',
                        PIEZO1: '1',
                    }
                );

                assert.strictEqual(
                    Object.keys(
                        await geneTableCounts('copy number alterations-table')
                    ).length,
                    0
                );
            });

            it('filters tables when checking only unknown tier checkbox', async () => {
                await selectTier('ShowUnknownTier');
                await waitForStudyView();
                assert.deepStrictEqual(
                    await geneTableCounts('mutations-table'),
                    {
                        BRCA2: '12',
                        ACP3: '5',
                        ATM: '2',
                        BRCA1: '2',
                        TP53: '2',
                        MYB: '1',
                        OR11H1: '1',
                    }
                );

                await sortPaneByCount('structural variants-table');
                assert.deepStrictEqual(
                    await sortDescLimit(
                        await geneTableCounts('structural variants-table'),
                        8
                    ),
                    {
                        BRAF: '36',
                        SND1: '10',
                        AGK: '4',
                        TTN: '4',
                        ALK: '3',
                        AGAP3: '2',
                        CDK5RAP2: '2',
                        MKRN1: '2',
                    }
                );
                assert.deepStrictEqual(
                    await geneTableCounts('copy number alterations-table'),
                    {
                        ERCC5_AMP: '7',
                        AURKAIP1_AMP: '7',
                        ATAD3A_AMP: '7',
                        ATAD3B_AMP: '7',
                        ATAD3C_AMP: '7',
                        ACAP3_AMP: '6',
                        AGRN_AMP: '6',
                        ERCC5_HOMDEL: '2',
                        AURKAIP1_HOMDEL: '2',
                        ACAP3_HOMDEL: '2',
                        ATAD3C_HOMDEL: '2',
                        AGRN_HOMDEL: '2',
                        ATAD3B_HOMDEL: '1',
                        ATAD3A_HOMDEL: '1',
                    }
                );
            });
        });

        describe('filtering of study view samples', () => {
            beforeEach(async () => {
                await goToUrlAndSetLocalStorage(studyViewUrl, true);
                await waitForStudyView();
                await turnOffCancerGenesFilters();
                await openAlterationFilterMenu();
            });

            it('adds breadcrumb text for mutations', async () => {
                await clickCheckBoxStudyView('Somatic');
                await clickCheckBoxStudyView('Putative passengers');
                await clickElement('[data-test=ToggleAllDriverTiers]');
                await clickElement('[data-test=ShowUnknownTier]');
                await waitForStudyView();
                const element = await getNestedElement([
                    '//*[@data-test="mutations-table"]',
                    'input',
                ]);
                await element.click();
                await (
                    await getNestedElement([
                        '//*[@data-test="mutations-table"]',
                        'button=Select Samples',
                    ])
                ).click();
                const sections = await (
                    await getElement('[data-test=groupedGeneFilterIcons]')
                ).$$('div');
                assert.strictEqual(
                    await (await sections[0].$$('span'))[1].getText(),
                    'driver or unknown'
                );
                assert.strictEqual(
                    await (await sections[1].$$('span'))[1].getText(),
                    'germline or unknown'
                );
                assert.strictEqual(
                    await (await sections[2].$$('span'))[1].getText(),
                    'unknown'
                );
            });

            it('adds breadcrumb text for cnas', async () => {
                // does not include the mutation status settings
                await clickCheckBoxStudyView('Somatic');
                await clickCheckBoxStudyView('Putative drivers');
                await (
                    await getNestedElement([
                        '//*[@data-test="copy number alterations-table"]',
                        'input',
                    ])
                ).click();
                await (
                    await getNestedElement([
                        '//*[@data-test="copy number alterations-table"]',
                        'button=Select Samples',
                    ])
                ).click();
                const sections = await (
                    await getElement('[data-test=groupedGeneFilterIcons]')
                ).$$('div');
                assert.strictEqual(sections.length, 1);
                assert.strictEqual(
                    await (await sections[0].$$('span'))[1].getText(),
                    'passenger or unknown'
                );
            });

            it('reduced samples in genes table', async () => {
                await clickCheckBoxStudyView('Somatic');
                await clickCheckBoxStudyView('Putative passengers');

                await (
                    await (
                        await getElement('//*[@data-test="mutations-table"]')
                    ).$$('input')
                )[1].click(); // click ATM gene

                await (
                    await getNestedElement([
                        '//*[@data-test="mutations-table"]',
                        'button=Select Samples',
                    ])
                ).click();
                await waitForStudyView();
                assert.deepStrictEqual(
                    await geneTableCounts('mutations-table'),
                    {
                        BRCA2: '1',
                        BRCA1: '1',
                        ATM: '1',
                        TP53: '1',
                    }
                );
            });
        });
    });

    describe('group comparison - results view ', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(comparisonResultsViewUrl, true);
            await waitForComparisonTab();

            // turn off fusion and cna types
            await openAlterationTypeSelectionMenu();
            await clickCheckBoxResultsView('Structural Variants / Fusions');
            await clickCheckBoxResultsView('Copy Number Alterations');
            await clickElement('[data-test=buttonSelectAlterations]');
            await waitForUpdateResultsView();

            await openAlterationFilterMenuGroupComparison();
        });

        // -+=+ MUTATION STATUS +=+-
        it('filters enrichment table when unchecking germline checkbox', async () => {
            await waitForStudyView();
            await clickCheckBoxResultsView('Germline');
            assert.deepStrictEqual(await enrichmentTableCounts(), {
                DTNB: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ADAMTS20: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '0 (0.00%)', unalt: '6 (30.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
            await clickCheckBoxResultsView('Germline');
        });

        it('filters enrichment table when unchecking somatic checkbox', async () => {
            await clickCheckBoxResultsView('Somatic');
            assert.deepStrictEqual(await enrichmentTableCounts(), {
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '5 (25.00%)' },
            });
            await clickCheckBoxResultsView('Somatic');
        });

        it('filters enrichment table when unchecking unknown status checkbox', async () => {
            await clickElement('[data-test=ShowUnknown]');
            await waitForUpdateResultsView();
            assert.deepStrictEqual(await enrichmentTableCounts(), {
                DTNB: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ADAMTS20: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '11 (55.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
            await clickElement('[data-test=ShowUnknown]');
        });

        // -+=+ DRIVER ANNOTATIONS +=+-
        it('filters enrichment table when unchecking driver checkbox', async () => {
            await clickCheckBoxResultsView('Putative drivers');
            assert.deepStrictEqual(await enrichmentTableCounts(), {
                DTNB: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ADAMTS20: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '11 (55.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
            await clickCheckBoxResultsView('Putative drivers');
        });

        it('filters enrichment table when unchecking passenger checkbox', async () => {
            await clickCheckBoxResultsView('Putative passengers');
            assert.deepStrictEqual(await enrichmentTableCounts(), {
                ADAMTS20: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '11 (55.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
            await clickCheckBoxResultsView('Putative passengers');
        });

        it('filters enrichment table when unchecking unknown oncogenicity checkbox', async () => {
            await clickElement('[data-test=ShowUnknownOncogenicity]');
            await waitForUpdateResultsView();
            assert.deepStrictEqual(await enrichmentTableCounts(), {
                DTNB: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
            });
            await clickElement('[data-test=ShowUnknownOncogenicity]');
        });

        // -+=+ TIER ANNOTATIONS +=+-
        it('does not filter tables when checking all tier checkboxes', async () => {
            assert.deepStrictEqual(await enrichmentTableCounts(), {
                DTNB: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ADAMTS20: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '11 (55.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
        });

        it('filters tables when checking Class 2 checkbox', async () => {
            // browser.pause(1000_000_000)
            await selectTier('Class_2');
            await waitForUpdateResultsView();
            assert.deepStrictEqual(await enrichmentTableCounts(), {
                TMEM247: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
            });
            await clickElement('[data-test=Class_2]');
        });

        it('filters tables when checking unknown tier checkbox', async () => {
            await clickElement('[data-test=ShowUnknownTier]');
            await waitForUpdateResultsView();
            assert.deepStrictEqual(await enrichmentTableCounts(), {
                ATM: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                OR11H1: { alt: '1 (100.00%)', unalt: '0 (0.00%)' },
                BRCA2: { alt: '1 (100.00%)', unalt: '11 (55.00%)' },
                ACP3: { alt: '0 (0.00%)', unalt: '5 (22.73%)' },
            });
            await clickElement('[data-test=ShowUnknownTier]');
        });
    });
});

async function selectTier(tier) {
    const $toggleAllTiers = await getElement(
        '[data-test=ToggleAllDriverTiers]'
    );
    await $toggleAllTiers.waitForExist();
    await $toggleAllTiers.waitForClickable();
    await $toggleAllTiers.click();
    const $tier = await getElement(`[data-test=${tier}]`);
    await $tier.waitForExist();
    await $tier.waitForDisplayed();
    await $tier.waitForClickable();
    await $tier.click();
}

async function sortPaneByCount(pane) {
    await (
        await (await getElement('//*[@data-test="' + pane + '"]')).$('span=#')
    ).click();
    await waitForStudyView();
}

const clickCheckBoxStudyView = async name => {
    const checkboxContainer = await getElement('label=' + name);
    await checkboxContainer.waitForDisplayed();
    const checkboxField = await checkboxContainer.$('input');
    await checkboxField.waitForDisplayed();
    await checkboxField.click();
    await waitForStudyView();
};

const sortDescLimit = (entryCounts, limit = 10) => {
    // First sort by alteration count descending,
    // and then alphabetically by gene name
    return Object.fromEntries(
        Object.entries(entryCounts)
            .sort((e1, e2) =>
                e1[1] !== e2[1]
                    ? parseInt(e2[1]) - parseInt(e1[1])
                    : e1[0].localeCompare(e2[0])
            )
            .slice(0, limit)
    );
};

const clickCheckBoxResultsView = async name => {
    const $el = await getNestedElement(['label=' + name, 'input']);
    await $el.waitForExist();
    await $el.waitForDisplayed();
    await $el.waitForClickable();
    await $el.click();
    await waitForUpdateResultsView();
};

const geneTableCounts = async dataTest => {
    const fieldName =
        dataTest === 'copy number alterations-table'
            ? 'numberOfAlteredCasesText'
            : 'numberOfAlterations';
    const geneCells = await (
        await getElement('//*[@data-test="' + dataTest + '"]')
    ).$$('[data-test=geneNameCell]');
    const geneNames = await Promise.all(
        geneCells.map(async c => (await c.$('div')).getText())
    );
    const countCells = await (await $('//*[@data-test="' + dataTest + '"]')).$$(
        '[data-test=' + fieldName + ']'
    );
    const geneCounts = await Promise.all(countCells.map(c => c.getText()));
    const cnaCells = await (
        await getElement('//*[@data-test="' + dataTest + '"]')
    ).$$('[data-test=cnaCell]');
    const cnas = await Promise.all(cnaCells.map(async c => await c.getText()));
    return geneNames.reduce((obj, geneName, index) => {
        let suffix = '';
        if (cnas.length > 0) suffix = '_' + cnas[index];
        const key = geneName + suffix;
        return { ...obj, [key]: geneCounts[index] };
    }, {});
};

const enrichmentTableCounts = async () => {
    const tbody = await getNestedElement([
        '[data-test=LazyMobXTable]',
        'tbody',
    ]);
    const rows = await tbody.$$('tr');
    const geneNames = await Promise.all(
        rows.map(
            async r =>
                await (await r.$('span[data-test=geneNameCell]')).getText()
        )
    );
    const alteredCounts = await Promise.all(
        (await $$('//*[@data-test="Altered group-CountCell"]')).map(
            async r => await r.getText()
        )
    );
    const unalteredCounts = await Promise.all(
        (await $$('//*[@data-test="Unaltered group-CountCell"]')).map(
            async r => await r.getText()
        )
    );
    return geneNames.reduce((obj, geneName, index) => {
        return {
            ...obj,
            [geneName]: {
                alt: alteredCounts[index],
                unalt: unalteredCounts[index],
            },
        };
    }, {});
};

const waitForUpdateResultsView = async () => {
    await waitForElementDisplayed('[data-test=LazyMobXTable]');
};

const turnOffCancerGenesFilters = async () => {
    const activeFilterIcons = await $$(
        '[data-test=gene-column-header] [data-test=header-filter-icon]'
    );
    for (const icon of activeFilterIcons) {
        if ((await icon.getCSSProperty('color').value) === 'rgba(0,0,0,1)') {
            await icon.click();
        }
    }
};

const openAlterationFilterMenu = async () => {
    await (await $('[data-test=AlterationFilterButton]')).waitForDisplayed();
    await (await $('[data-test=AlterationFilterButton]')).click();
    await (
        await $('[data-test=GlobalSettingsDropdown] input')
    ).waitForDisplayed();
};

const openAlterationFilterMenuGroupComparison = async () => {
    await waitForElementDisplayed(
        '[data-test=AlterationEnrichmentAnnotationsSelectorButton]'
    );
    await clickElement(
        '[data-test=AlterationEnrichmentAnnotationsSelectorButton]'
    );
    await waitForElementDisplayed('[data-test=GlobalSettingsDropdown] input');
};
