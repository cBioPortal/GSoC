const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    getElementByTestHandle,
    waitForNetworkQuiet,
    getElement,
    getText,
    clickElement,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('Patient View Genomic Evolution tab', function() {
    describe('mutation table', () => {
        it('shows only highlighted, or all mutations, depending on setting', async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/patient/genomicEvolution?caseId=P04&studyId=lgg_ucsf_2014`
            );
            await waitForNetworkQuiet(10000);
            // at first, showing all mutations
            await getElement('input[data-test="TableShowOnlyHighlighted"]', {
                timeout: 3000,
            });
            assert(
                !(await (
                    await getElement(
                        'input[data-test="TableShowOnlyHighlighted"]'
                    )
                ).isSelected())
            );

            // at first, more than 2 mutations (making this ambiguous to be unaffected by data changes
            await (
                await getElement(
                    'div[data-test="GenomicEvolutionMutationTable"] span[data-test="LazyMobXTable_CountHeader"]'
                )
            ).waitForExist();
            let numMutationsText = await getText(
                'div[data-test="GenomicEvolutionMutationTable"] span[data-test="LazyMobXTable_CountHeader"]'
            );
            let numMutations = parseInt(numMutationsText, 10);
            assert(numMutations > 2);

            // now select two mutations
            await clickElement(
                'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(1)'
            );
            await clickElement(
                'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(4)'
            );

            // should still show all
            await (
                await getElement(
                    'div[data-test="GenomicEvolutionMutationTable"] span[data-test="LazyMobXTable_CountHeader"]'
                )
            ).waitForExist();
            numMutationsText = await getText(
                'div[data-test="GenomicEvolutionMutationTable"] span[data-test="LazyMobXTable_CountHeader"]'
            );
            numMutations = parseInt(numMutationsText, 10);
            assert(numMutations > 2);

            // now select "show only highlighted"
            await clickElement('input[data-test="TableShowOnlyHighlighted"]');
            await browser.waitUntil(
                async () => {
                    numMutationsText = await getText(
                        'div[data-test="GenomicEvolutionMutationTable"] span[data-test="LazyMobXTable_CountHeader"]'
                    );
                    numMutations = parseInt(numMutationsText, 10);
                    return numMutations === 2;
                },
                2000,
                'should only be 2 mutations in the table now'
            );

            // now click on one of the 2 mutations
            await clickElement(
                'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(1)'
            );
            await browser.waitUntil(
                async () => {
                    numMutationsText = await getText(
                        'div[data-test="GenomicEvolutionMutationTable"] span[data-test="LazyMobXTable_CountHeader"]'
                    );
                    numMutations = parseInt(numMutationsText, 10);
                    return numMutations === 1;
                },
                2000,
                'should only be 1 mutation in the table now'
            );

            // now click on the last remaining mutation
            await clickElement(
                'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(1)'
            );
            await browser.waitUntil(
                async () => {
                    numMutationsText = await getText(
                        'div[data-test="GenomicEvolutionMutationTable"] span[data-test="LazyMobXTable_CountHeader"]'
                    );
                    numMutations = parseInt(numMutationsText, 10);
                    return numMutations > 2;
                },
                2000,
                'should show all mutations again, since none explicitly selected'
            );
        });

        it('force sequential mode when samples have no equivalent clincal events', async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/patient/genomicEvolution?studyId=nsclc_ctdx_msk_2022&caseId=P-0016223`
            );

            assert.equal(
                await (
                    await getElementByTestHandle('VAFSequentialMode')
                ).isExisting(),
                false,
                'SequentialModel Check Box should not exists if not possible.'
            );
        });
    });
});
