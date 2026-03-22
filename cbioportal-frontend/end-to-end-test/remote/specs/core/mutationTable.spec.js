const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    setCheckboxChecked,
    executeInBrowser,
    jq,
    getElement,
    setInputText,
    clickElement,
    getText,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const RESULTS_MUTATION_TABLE_URL = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&Z_SCORE_THRESHOLD=1.0&cancer_study_id=gbm_tcga_pub&cancer_study_list=gbm_tcga_pub&case_set_id=gbm_tcga_pub_sequenced&clinicallist=PROFILED_IN_gbm_tcga_pub_cna_rae&gene_list=TP53%20MDM2%20MDM4&gene_set_choice=user-defined_list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=gbm_tcga_pub_cna_rae&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=gbm_tcga_pub_mutations&show_samples=false`;

describe('Mutation Table', function() {
    this.retries(0);
    before(async () => {
        await goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`);
    });

    describe('basic mutation table functions', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(RESULTS_MUTATION_TABLE_URL);
            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            await (
                await getElement(
                    'tr:nth-child(1) [data-test=oncogenic-icon-image]'
                )
            ).waitForDisplayed({ timeout: 30000 });
        });

        it('filters table with search box', async () => {
            const searchInput = '[data-test=table-search-input]';
            const numberOfRowsBefore = (await $$('tr')).length;
            await setInputText(searchInput, 'TCGA-02-0010-01');
            await browser.waitUntil(
                async () => (await $$('tr')).length < numberOfRowsBefore
            );
            assert((await $$('tr')).length < numberOfRowsBefore);
        });
    });

    describe('try getting exon and hgvsc info from genome nexus', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(RESULTS_MUTATION_TABLE_URL);
            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            await (
                await getElement(
                    'tr:nth-child(1) [data-test=oncogenic-icon-image]'
                )
            ).waitForDisplayed({ timeout: 30000 });
        });

        it('should show the exon number after adding the exon column', async () => {
            // click on column button
            await clickElement('button*=Columns');
            // scroll down to activated "Exon" selection
            await browser.execute(
                'document.getElementsByClassName("ReactVirtualized__Grid")[0].scroll(1000, 1000)'
            );
            // wait for exon checkbox to appear
            await browser.pause(2000);
            // click "exon"
            await clickElement('//*[text()="Exon"]');
            // check if three exact matches for 6 appear

            let res;
            await browser.waitUntil(
                async () => {
                    res = await executeInBrowser(
                        () => $('[class*=exon-module__exon-table]').length
                    );
                    return res == 25;
                },
                60000,
                `Failed: There's 25 exons rows in table (${res} found)`
            );
        });

        it('should show more exon number after clicking "Show more"', async () => {
            // click "show more" to add more data
            await clickElement('button*=Show more');
            let res;
            await browser.waitUntil(
                async () => {
                    res = await executeInBrowser(
                        () => $('[class*=exon-module__exon-table]').length
                    );
                    return res > 25;
                },
                60000,
                `Failed: There's more than 25 exons rows in table (${res} found)`
            );
        });

        it('should show the HGVSc data after adding the HGVSc column', async () => {
            // reopen columns
            await clickElement('button*=Columns');
            // click "HGVSc"
            await clickElement('//*[text()="HGVSc"]');

            await (
                await getElement(
                    '//*[text()[contains(.,"ENST00000269305.4:c.817C>T")]]'
                )
            ).waitForExist({ timeout: 60000 });
        });

        it('should show more HGVSc data after clicking "Show more"', async () => {
            // click "show more" to add more data
            await clickElement('button*=Show more');
            // check if "C>T" exact matches for 12 appear
            await (
                await getElement('//*[text()[contains(.,"C>T")]]')
            ).waitForExist({
                timeout: 60000,
            });
        });
    });

    describe('try getting GNOMAD from genome nexus', function() {
        this.retries(0);
        before(async () => {
            const url = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=nsclc_tcga_broad_2016&case_set_id=nsclc_tcga_broad_2016_cnaseq&data_priority=0&gene_list=TP53&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=nsclc_tcga_broad_2016_cna&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=nsclc_tcga_broad_2016_mutations&tab_index=tab_visualize`;
            await goToUrlAndSetLocalStorage(url);
            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            await (
                await getElement('[data-test=oncogenic-icon-image]')
            ).waitForDisplayed({ timeout: 300000 });
        });

        it.skip('should show the gnomad table after mouse over the frequency in gnomad column', async () => {
            // filter the table
            await setInputText(
                '[class*=tableSearchInput]',
                'LUAD-B00416-Tumor'
            );
            await (
                await getElement('[data-test=oncogenic-icon-image]')
            ).waitForDisplayed({ timeout: 10000 });
            // show the gnomad column
            await (await getElement('button*=Columns')).scrollIntoView();
            // click on column button
            await clickElement('button*=Columns');
            // scroll down to activated "GNOMAD" selection
            await browser.execute(
                'document.getElementsByClassName("ReactVirtualized__Grid")[0].scroll(1000, 1000)'
            );
            // wait for gnomad checkbox appear
            await (
                await getElement('[data-test="add-chart-option-gnomad"] input')
            ).waitForDisplayed({
                timeout: 10000,
            });
            // click "GNOMAD"
            await setCheckboxChecked(
                true,
                '[data-test="add-chart-option-gnomad"] input'
            );
            // close columns menu
            await clickElement('button*=Columns');

            await browser.pause(5000);
            // find frequency
            // TODO: not sure why this is not working

            await browser.debug();

            const frequency =
                '[data-test2="LUAD-B00416-Tumor"][data-test="gnomad-column"] span';
            await getElement(frequency, {
                timeout: 10000,
            });
            // wait for gnomad frequency show in the column
            await browser.waitUntil(
                async () => {
                    const textFrequency = await (
                        await getElement(frequency)
                    ).getText();
                    return textFrequency.length >= 1;
                },
                10000,
                'Frequency data not in Gnoamd column'
            );
            // mouse over the frequency
            await (await getElement(frequency)).moveTo();
            // wait for gnomad table showing up
            await getElement('[data-test="gnomad-table"]', { timeout: 20000 });
            // check if the gnomad table show up
            let res;
            await browser.waitUntil(
                async () => {
                    res = await executeInBrowser(
                        () => $('[data-test="allele-frequency-data"]').length
                    );
                    return res == 9;
                },
                10000,
                `Failed: There's 9 allele frequency rows in table (${res} found)`
            );
        });
    });

    describe('try getting ClinVar id from genome nexus', () => {
        before(async () => {
            const url = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=brca_broad&case_set_id=brca_broad_sequenced&data_priority=0&gene_list=TP53&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_broad_mutations&tab_index=tab_visualize`;

            await goToUrlAndSetLocalStorage(url);
            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            await (
                await getElement(
                    'tr:nth-child(1) [data-test=oncogenic-icon-image]'
                )
            ).waitForDisplayed({ timeout: 30000 });
        });

        // TODO:-- this test is not working, need to fix
        it('should show the ClinVar interpretation after adding the ClinVar column', async () => {
            // click on column button
            await clickElement('button*=Columns');
            // scroll down to activated "ClinVar" selection
            await browser.execute(
                'document.getElementsByClassName("ReactVirtualized__Grid")[0].scroll(1000, 1000)'
            );
            // wait for clinvar checkbox to appear
            //await browser.pause(2000);
            // click "clinvar"
            await clickElement('//*[text()="ClinVar"]');
            let res;
            await browser.waitUntil(
                async () => {
                    res = await executeInBrowser(
                        () => $('[data-test="clinvar-data"]').length
                    );
                    return res === 25;
                },
                60000,
                `Failed: There's 25 clinvar rows in table (${res} found)`
            );
        });
    });

    describe('try getting dbSNP from genome nexus', () => {
        before(async () => {
            const url = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=brca_broad&case_set_id=brca_broad_sequenced&data_priority=0&gene_list=TP53&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_broad_mutations&tab_index=tab_visualize`;

            await goToUrlAndSetLocalStorage(url);
            // mutations table should be visiable after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            await (
                await getElement(
                    'tr:nth-child(1) [data-test=oncogenic-icon-image]'
                )
            ).waitForDisplayed({ timeout: 30000 });
        });

        it('should show the rs ids in dbsnp after adding the dbSNP column', async () => {
            // click on column button
            await (await getElement('button*=Columns')).click();
            // scroll down to activated "dbSNP" selection
            await browser.execute(
                'document.getElementsByClassName("ReactVirtualized__Grid")[0].scroll(1000, 1000)'
            );
            // wait for dbSNP checkbox to appear
            await browser.pause(2000);
            // click "dbSNP"
            await clickElement('//*[text()="dbSNP"]');
            let res;
            await browser.waitUntil(
                async () => {
                    res = await executeInBrowser(
                        () => $('[data-test="dbsnp-data"]').length
                    );
                    return res == 25;
                },
                60000,
                `Failed: There's 25 dbsnp rows in table (${res} found)`
            );
        });
    });

    describe('try filtering', () => {
        it('should show filter dropdown and filter tabe based on text entry', async () => {
            const url = `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=brca_broad&case_set_id=brca_broad_sequenced&data_priority=0&gene_list=TP53&geneset_list=%20&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_broad_mutations&tab_index=tab_visualize`;

            await goToUrlAndSetLocalStorage(url);

            await (await getElement('.lazy-mobx-table')).waitForExist();

            const filterButton = await getElement(
                '.lazy-mobx-table th .fa-filter'
            );
            await filterButton.moveTo();
            await browser.pause(1000);
            await filterButton.click();

            await (
                await getElement('.multilineHeader .dropdown')
            ).waitForDisplayed();

            assert.equal(
                (await jq('.multilineHeader .dropdown.open input:checkbox'))
                    .length,
                28,
                '28 filter checkboxes available'
            );

            await setInputText(
                '.multilineHeader .dropdown.open input.input-sm',
                'BR-V-033'
            );

            await browser.waitUntil(async () => {
                return (
                    (await jq('.multilineHeader .dropdown.open input:checkbox'))
                        .length === 1
                );
            });

            assert.equal(
                (await jq('.multilineHeader .dropdown.open input:checkbox'))
                    .length,
                1,
                'List filtered to one'
            );

            assert.equal((await $$('.lazy-mobx-table tbody tr')).length, 1);

            assert.equal(
                await getText('.lazy-mobx-table tbody tr td'),
                'BR-V-033'
            );
        });
    });

    describe('Test Functional Impact Mutation Assessor', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(RESULTS_MUTATION_TABLE_URL);
            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            await (
                await getElement(
                    'tr:nth-child(1) [data-test=oncogenic-icon-image]'
                )
            ).waitForDisplayed({ timeout: 300000 });
        });

        it('should show 24 MA dots in Functional Impact column and display tooltip on hover', async () => {
            // click on column button
            await clickElement('button*=Columns');
            await browser.pause(2000);

            // click "Functional Impact"
            await clickElement('//*[text()="Functional Impact"]');

            // click on column button to close the column selection menu
            await clickElement('button*=Columns');
            await browser.pause(2000);

            // wait for MA dots to appear
            let dotsCount;
            await browser.waitUntil(
                async () => {
                    dotsCount = await executeInBrowser(
                        () => $('[data-test="mutation-assessor-dot"]').length
                    );
                    return dotsCount >= 1;
                },
                {
                    timeout: 60000,
                    timeoutMsg: `time out while waiting for Mutation Assessor dots to appear, found ${dotsCount}`,
                }
            );

            // verify there are 24 MA dots
            const finalMADotCount = await executeInBrowser(
                () => $('[data-test="mutation-assessor-dot"]').length
            );
            assert.equal(
                finalMADotCount,
                24,
                `Expected 24 Mutation Assessor dots, found ${finalMADotCount}`
            );
        });
    });
});
