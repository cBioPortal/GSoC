const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    getElementByTestHandle,
    clickElement,
    getElement,
    setInputText,
    getText,
} = require('../../../shared/specUtils_Async');
const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

async function waitForGenomeNexusAnnotation() {
    await browser.pause(5000); // wait for annotation
}

describe('Mutation Mapper Tool', function() {
    before(async () => {
        await goToUrlAndSetLocalStorage(`${CBIOPORTAL_URL}`);
    });

    describe('example genomic changes input', () => {
        beforeEach(async () => {
            const url = `${CBIOPORTAL_URL}/mutation_mapper`;
            await goToUrlAndSetLocalStorage(url);
            await (
                await getElementByTestHandle('GenomicChangesExampleButton')
            ).waitForDisplayed({
                timeout: 10000,
            });
        });

        it('should correctly annotate the genomic changes example and display the results', async () => {
            await clickElement('[data-test=GenomicChangesExampleButton]');
            await clickElement('[data-test=MutationMapperToolVisualizeButton]');

            await waitForGenomeNexusAnnotation();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            await (
                await getElement(
                    'tr:nth-child(1) [data-test=oncogenic-icon-image]'
                )
            ).waitForDisplayed({ timeout: 60000 });

            // Waiting for Annotation column sorting
            await (
                await getElement('.//*[text()[contains(.,"T790M")]]')
            ).waitForExist();

            assert.equal(
                (await $$('.//*[text()[contains(.,"T790M")]]')).length,
                2,
                'there should be two samples with a T790M mutation'
            );

            // check total number of mutations (this gets Showing 1-25 of 122
            // Mutations)
            assert.ok(
                await (
                    await getElement(
                        './/*[text()[contains(.,"122 Mutations")]]'
                    )
                ).isExisting()
            );

            assert.ok(
                await (
                    await getElement('.//*[text()[contains(.,"BRCA1")]]')
                ).isExisting()
            );

            await (
                await (await getElement('.nav-pills')).$('a*=BRCA1')
            ).click();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            await (
                await getElement('[data-test=oncogenic-icon-image]')
            ).waitForDisplayed({
                timeout: 60000,
            });

            // check total number of mutations (this gets Showing 1-25 of 85
            // Mutations)
            assert.ok(
                await (
                    await getElement('.//*[text()[contains(.,"85 Mutations")]]')
                ).isExisting()
            );

            assert.ok(
                await (
                    await getElement('.//*[text()[contains(.,"BRCA2")]]')
                ).isExisting()
            );
            (await (await getElement('.nav-pills')).$('a*=BRCA2')).click();
            // check total number of mutations (this gets Showing 1-25 of 113
            // Mutations)
            await (
                await getElement('.//*[text()[contains(.,"113 Mutations")]]')
            ).waitForExist();

            assert.ok(
                await (
                    await getElement('.//*[text()[contains(.,"PTEN")]]')
                ).isExisting()
            );
            await (await (await getElement('.nav-pills')).$('a*=PTEN')).click();
            // check total number of mutations (this gets Showing 1-25 of 136
            // Mutations)
            await (
                await getElement('.//*[text()[contains(.,"136 Mutations")]]')
            ).waitForExist();
        });

        it('should update the listed number of mutations when selecting a different transcript in the dropdown', async () => {
            await clickElement('[data-test=GenomicChangesExampleButton]');
            await clickElement('[data-test=MutationMapperToolVisualizeButton]');

            await waitForGenomeNexusAnnotation();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            await (
                await getElement('[data-test=oncogenic-icon-image]')
            ).waitForDisplayed({
                timeout: 60000,
            });

            // wait for transcript to be listed
            await (
                await getElement('.//*[text()[contains(.,"NM_005228")]]')
            ).waitForExist();
            // click on dropbox
            await clickElement('.//*[text()[contains(.,"NM_005228")]]');
            // select a different transcript
            await clickElement('.//*[text()[contains(.,"NM_201283")]]');

            // check number of mutations on this transcript (this gets Showing
            // 1-27 of 27 Mutations)
            await (
                await getElement('.//*[text()[contains(.,"27 Mutations")]]')
            ).waitForExist();
        });

        it('should show all transcripts when using protein changes', async () => {
            await clickElement('[data-test=ProteinChangesExampleButton]');
            await clickElement('[data-test=MutationMapperToolVisualizeButton]');

            await waitForGenomeNexusAnnotation();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            await (
                await getElementByTestHandle('oncogenic-icon-image')
            ).waitForDisplayed({
                timeout: 60000,
            });
            // it should have 124 egfr mutations
            await (
                await getElement('.//*[text()[contains(.,"124 Mutations")]]')
            ).waitForExist();

            // wait for transcript to be listed
            await (
                await getElement('.//*[text()[contains(.,"NM_005228")]]')
            ).waitForExist();
            // click on dropbox
            await clickElement('.//*[text()[contains(.,"NM_005228")]]');

            // check if all 8 transcripts are listed (already know the one above
            // is listed, since we clicked on it)
            await (
                await getElement('.//*[text()[contains(.,"NM_201284")]]')
            ).waitForExist();
            await (
                await getElement('.//*[text()[contains(.,"NM_201282")]]')
            ).waitForExist();
            await (
                await getElement('.//*[text()[contains(.,"NM_201283")]]')
            ).waitForExist();
            await (
                await getElement('.//*[text()[contains(.,"ENST00000454757")]]')
            ).waitForExist();
            await (
                await getElement('.//*[text()[contains(.,"ENST00000455089")]]')
            ).waitForExist();
            await (
                await getElement('.//*[text()[contains(.,"ENST00000442591")]]')
            ).waitForExist();
            await (
                await getElement('.//*[text()[contains(.,"ENST00000450046")]]')
            ).waitForExist();

            // select a different transcript
            await clickElement('.//*[text()[contains(.,"NM_201283")]]');

            // check number of mutations on this transcript (this should keep
            // showing all mutations (we don't know which transcript was used to
            // get those annotations the user inputted))
            await (
                await getElement('.//*[text()[contains(.,"124 Mutations")]]')
            ).waitForExist();
        });

        it('should show all transcripts when using combination of genomic and protein changes', async () => {
            await clickElement(
                '[data-test=GenomicAndProteinChangesExampleButton]'
            );
            await clickElement('[data-test=MutationMapperToolVisualizeButton]');

            await waitForGenomeNexusAnnotation();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            await (
                await getElement('[data-test="oncogenic-icon-image"]')
            ).waitForDisplayed({
                timeout: 60000,
            });
            // it should have 122 egfr mutations
            await (
                await getElement('.//*[text()[contains(.,"122 Mutations")]]')
            ).waitForExist();

            // wait for transcript to be listed
            await (
                await getElement('.//*[text()[contains(.,"NM_005228")]]')
            ).waitForExist();
            // click on dropbox
            await clickElement('.//*[text()[contains(.,"NM_005228")]]');

            // check if all 8 transcripts are listed (already know the one above
            // is listed, since we clicked on it)
            await (
                await getElement('.//*[text()[contains(.,"NM_201284")]]')
            ).waitForExist();
            await (
                await getElement('.//*[text()[contains(.,"NM_201282")]]')
            ).waitForExist();
            await (
                await getElement('.//*[text()[contains(.,"NM_201283")]]')
            ).waitForExist();
            await (
                await getElement('.//*[text()[contains(.,"ENST00000454757")]]')
            ).waitForExist();
            await (
                await getElement('.//*[text()[contains(.,"ENST00000455089")]]')
            ).waitForExist();
            await (
                await getElement('.//*[text()[contains(.,"ENST00000442591")]]')
            ).waitForExist();
            await (
                await getElement('.//*[text()[contains(.,"ENST00000450046")]]')
            ).waitForExist();

            // select a different transcript
            await clickElement('.//*[text()[contains(.,"NM_201283")]]');

            // check number of mutations on this transcript (this should keep
            // showing all mutations (we don't know which transcript was used to
            // get those annotations the user inputted))
            await (
                await getElement('.//*[text()[contains(.,"122 Mutations")]]')
            ).waitForExist();
        });

        it('should correctly annotate the protein changes example and display the results', async () => {
            await clickElement('[data-test=ProteinChangesExampleButton]');
            await clickElement('[data-test=MutationMapperToolVisualizeButton]');

            await waitForGenomeNexusAnnotation();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            await (
                await getElement(
                    'tr:nth-child(1) [data-test="oncogenic-icon-image"]'
                )
            ).waitForDisplayed({ timeout: 60000 });

            const mutationsT790M = await $$(
                './/*[text()[contains(.,"T790M")]]'
            );
            assert.equal(
                mutationsT790M.length,
                2,
                'there should be two samples with a T790M mutation'
            );

            // check total number of mutations (this gets Showing 1-25 of 124
            // Mutations)
            assert.ok(
                await (
                    await getElement(
                        './/*[text()[contains(.,"124 Mutations")]]'
                    )
                ).isExisting()
            );

            assert.ok(
                await (
                    await getElement('.//*[text()[contains(.,"BRCA1")]]')
                ).isExisting()
            );

            assert.ok(
                await (
                    await getElement('.//*[text()[contains(.,"BRCA2")]]')
                ).isExisting()
            );

            assert.ok(
                await (
                    await getElement('.//*[text()[contains(.,"PTEN")]]')
                ).isExisting()
            );
        });

        it.skip('should not display mutations that do not affect the displayed transcript id (HIST1H2BN, ENST00000396980)', async () => {
            await setInputText(
                '#standaloneMutationTextInput',
                'Sample_ID Cancer_Type Chromosome Start_Position End_Position Reference_Allele constiant_Allele\nTCGA-49-4494-01 Lung_Adenocarcinoma 6 27819890 27819890 A G'
            );

            await clickElement('[data-test=MutationMapperToolVisualizeButton]');

            await (await getElement('[class=borderedChart]')).waitForDisplayed({
                timeout: 20000,
            });

            // the canonical transcript id for HIST1H2BN is ENST00000396980, but
            // this mutation applies to ENST00000606613 and ENST00000449538
            await (
                await getElement('.//*[text()[contains(.,"ENST00000449538")]]')
            ).waitForExist();

            await (
                await getElement('.//*[text()[contains(.,"1 Mutation")]]')
            ).waitForExist();
        });

        it('should show a warning when certain lines were not annotated', async () => {
            const input = await getElement('#standaloneMutationTextInput');
            await input.setValue(
                'Sample_ID Cancer_Type Chromosome Start_Position End_Position Reference_Allele Variant_Allele\nTCGA-O2-A52N-01 Lung_Squamous_Cell_Carcinoma 7 -1 -1 NA\nTCGA-33-4566-01 Lung_Squamous_Cell_Carcinoma 7 55269425 55269425 C T'
            );

            await clickElement('[data-test=MutationMapperToolVisualizeButton]');

            await (
                await getElement('[class="borderedChart"]')
            ).waitForDisplayed({ timeout: 20000 });

            assert.ok(
                await (
                    await getElement(
                        './/*[text()[contains(.,"Failed to annotate")]]'
                    )
                ).isExisting(),
                'there should be a warning indicating one mutation failed annotation'
            );

            await clickElement('[data-test=ShowWarningsButton]');

            assert.ok(
                await (
                    await getElement(
                        './/*[text()[contains(.,"TCGA-33-4566-01")]]'
                    )
                ).isExisting(),
                'there should be a warning indicating which sample is failing'
            );
        });

        // based on HLA-A user question
        // https://groups.google.com/forum/?utm_medium=email&utm_source=footer#!msg/cbioportal/UQP41OIT5HI/1AaX24AcAwAJ
        it.skip('should not show the canonical transcript when there are no matching annotations', async () => {
            const input = '#standaloneMutationTextInput';
            const hla = require('./data/hla_a_test_mutation_mapper_tool.txt');

            await setInputText(input, hla);
            await clickElement('[data-test=MutationMapperToolVisualizeButton]');

            await (
                await getElement('[class="borderedChart"]')
            ).waitForDisplayed({ timeout: 20000 });

            // the canonical transcript id for HLA-A is ENST00000376809, but
            // these mutations apply to ENST00000376802
            await (
                await './/*[text()[contains(.,"ENST00000376802")]]'
            ).waitForExist();

            // check total number of mutations (all should be successfully annotated)
            const mutationCount = await getText(
                './/*[text()[contains(.,"16 Mutations")]]'
            );

            assert.ok(mutationCount.length > 0);
        });
    });

    describe('GRCh38 example genomic changes input', () => {
        beforeEach(async () => {
            const url = `${CBIOPORTAL_URL}/mutation_mapper`;
            await goToUrlAndSetLocalStorage(url);
            await (
                await getElementByTestHandle('MutationMapperToolGRCh38Button')
            ).waitForDisplayed({
                timeout: 10000,
            });
        });

        it('should correctly annotate the genomic changes example with GRCh38 and display the results', async () => {
            // choose GRCh38
            await clickElement('[data-test=MutationMapperToolGRCh38Button]');
            // the page will reloda after change genome build, wait until loading finished
            await (
                await getElementByTestHandle('GenomicChangesExampleButton')
            ).waitForDisplayed({
                timeout: 10000,
            });
            await clickElement('[data-test=GenomicChangesExampleButton]');
            await clickElement('[data-test=MutationMapperToolVisualizeButton]');

            await waitForGenomeNexusAnnotation();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            await (
                await getElement(
                    'tr:nth-child(1) [data-test=oncogenic-icon-image]'
                )
            ).waitForDisplayed({ timeout: 60000 });

            // Waiting for Annotation column sorting
            await (
                await getElement('.//*[text()[contains(.,"T790M")]]')
            ).waitForExist();

            assert.equal(
                (await $$('.//*[text()[contains(.,"T790M")]]')).length,
                2,
                'there should be two samples with a T790M mutation'
            );

            // check total number of mutations (this gets Showing 1-25 of 122
            // Mutations)
            assert.ok(
                await (
                    await getElement(
                        './/*[text()[contains(.,"122 Mutations")]]'
                    )
                ).isExisting()
            );

            const brca1 = await getElement('.//*[text()[contains(.,"BRCA1")]]');
            assert.ok(await brca1.isExisting());
            await (
                await (await getElement('.nav-pills')).$('a*=BRCA1')
            ).click();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            await (
                await getElement('[data-test=oncogenic-icon-image]')
            ).waitForDisplayed({
                timeout: 60000,
            });

            // check total number of mutations (this gets Showing 1-25 of 85
            // Mutations)
            mutationCount = await getElement(
                './/*[text()[contains(.,"85 Mutations")]]'
            );
            assert.ok(await mutationCount.isExisting());

            const brca2 = await getElement('.//*[text()[contains(.,"BRCA2")]]');
            assert.ok(await brca2.isExisting());
            await (
                await (await getElement('.nav-pills')).$('a*=BRCA2')
            ).click();
            // check total number of mutations (this gets Showing 1-25 of 113
            // Mutations)
            await (
                await getElement('.//*[text()[contains(.,"113 Mutations")]]')
            ).waitForExist();

            const pten = await getElement('.//*[text()[contains(.,"PTEN")]]');
            assert.ok(await pten.isExisting());
            await (await (await getElement('.nav-pills')).$('a*=PTEN')).click();
            // check total number of mutations (this gets Showing 1-25 of 136
            // Mutations)
            await (
                await getElement('.//*[text()[contains(.,"136 Mutations")]]')
            ).waitForExist();
        });

        it('should show dbSNP with GRCh38 instance', async () => {
            // dbSNP is getting from myconstiant Info
            // choose GRCh38
            await clickElement('[data-test=MutationMapperToolGRCh38Button]');
            // the page will reloda after change genome build, wait until loading finished
            await (
                await getElement('[data-test=GenomicChangesExampleButton]')
            ).waitForDisplayed({
                timeout: 10000,
            });
            await clickElement('[data-test=GenomicChangesExampleButton]');
            await clickElement('[data-test=MutationMapperToolVisualizeButton]');

            await waitForGenomeNexusAnnotation();

            // mutations table should be visible after oncokb icon shows up,
            // also need to wait for mutations to be sorted properly
            await (
                await getElementByTestHandle('oncogenic-icon-image')
            ).waitForDisplayed({
                timeout: 60000,
            });

            // click on column button
            await clickElement('button*=Columns');
            // scroll down to activated "dbSNP" selection
            await (await getElement('//*[text()="dbSNP"]')).scrollIntoView();
            // click "dbSNP"
            await clickElement('//*[text()="dbSNP"]');
            await (
                await getElement('.//*[text()[contains(.,"rs121434568")]]')
            ).waitForExist();
        });
    });
});
