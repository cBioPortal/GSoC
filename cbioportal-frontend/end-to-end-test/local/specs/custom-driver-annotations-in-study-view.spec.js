const assert = require('assert');
const {
    waitForNetworkQuiet,
    goToUrlAndSetLocalStorage,
    getNestedElement,
    getElement,
    clickElement,
    waitForElementDisplayed,
    isSelected,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const STUDY_VIEW_URL = `${CBIOPORTAL_URL}/study/summary?id=study_es_0`;
const ALTERATION_MENU_BTN = `button[data-test="AlterationFilterButton"]`;
const SHOW_UNKNOWN_TIER = `input[data-test="ShowUnknownTier"]`;
const SV_TABLE = `div[data-test="structural variants-table"]`;
const ANY_ROW = `div[aria-rowindex]`;
const BRAF_ROW = `div[aria-rowindex="1"]`;
const BRAF_ROW_EXCLUDE_UNKNOWN = `div[aria-rowindex="8"]`;
const GENE_NAME = `div[data-test="geneNameCell"]`;
const ALTERATIONS_TOTAL = `span[data-test="numberOfAlterations"]`;
const ALTERATION_CASES = `span[data-test="numberOfAlteredCasesText"]`;
const SHOW_CLASS_3 = `input[data-test="Class_3"]`;
const SHOW_CLASS_4 = `input[data-test="Class_4"]`;
const SHOW_PUTATIVE_DRIVERS = `input[data-test="ShowDriver"]`;
const SHOW_UNKNOWN_ONCOGENICITY = `input[data-test="ShowUnknownOncogenicity"]`;

describe('custom driver annotations feature in study view', function() {
    describe('structural variants', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(STUDY_VIEW_URL, true);
            await waitForNetworkQuiet();
        });

        it('shows all structural variants', async () => {
            const elements = await getNestedElement([SV_TABLE, BRAF_ROW]);
            await elements.waitForDisplayed();

            expect(
                (await (await getElement(SV_TABLE)).$$(ANY_ROW)).length
            ).toBe(21);
            let geneName = await (
                await getNestedElement([SV_TABLE, BRAF_ROW, GENE_NAME])
            ).getText();

            expect(geneName).toBe('BRAF');
            const alterations = await getNestedElement([
                SV_TABLE,
                BRAF_ROW,
                ALTERATIONS_TOTAL,
            ]);
            expect(await alterations.getText()).toBe('37');

            const alterationCases = await (
                await getNestedElement([SV_TABLE, BRAF_ROW, ALTERATION_CASES])
            ).getText();
            expect(alterationCases).toBe('35');
        });

        it('can exclude unknown (and NULL) driver tiers', async () => {
            await clickElement(ALTERATION_MENU_BTN);
            await waitForElementDisplayed(SHOW_UNKNOWN_TIER, { timeout: 5000 });
            assert(await isSelected(SHOW_UNKNOWN_TIER));
            await clickElement(SHOW_UNKNOWN_TIER);

            await (
                await getNestedElement([SV_TABLE, BRAF_ROW_EXCLUDE_UNKNOWN])
            ).waitForDisplayed();

            expect(
                (await (await getElement(SV_TABLE)).$$(ANY_ROW)).length
            ).toBe(10);
            const alterations = await (
                await getNestedElement([
                    SV_TABLE,
                    BRAF_ROW_EXCLUDE_UNKNOWN,
                    ALTERATIONS_TOTAL,
                ])
            ).getText();
            expect(alterations).toBe('1');
            const brafCases = await (
                await getNestedElement([
                    SV_TABLE,
                    BRAF_ROW_EXCLUDE_UNKNOWN,
                    ALTERATION_CASES,
                ])
            ).getText();
            expect(brafCases).toBe('1');
        });

        it('can exclude custom driver tiers', async () => {
            await clickElement(ALTERATION_MENU_BTN);
            await waitForElementDisplayed(SHOW_UNKNOWN_TIER, { timeout: 5000 });
            assert(await isSelected(SHOW_UNKNOWN_TIER));
            await clickElement(SHOW_UNKNOWN_TIER);

            assert(await isSelected(SHOW_CLASS_3));
            await clickElement(SHOW_CLASS_3);

            assert(await isSelected(SHOW_CLASS_4));
            await clickElement(SHOW_CLASS_4);

            await (
                await getNestedElement([SV_TABLE, ANY_ROW])
            ).waitForDisplayed();

            expect(
                (await (await getElement(SV_TABLE)).$$(ANY_ROW)).length
            ).toBe(5);
            assert((await getAllGeneNames()) === 'ALK,EGFR,EML4,ERG,TMPRSS2');
        });

        it('can exclude custom drivers', async () => {
            await clickElement(ALTERATION_MENU_BTN);
            await waitForElementDisplayed(SHOW_UNKNOWN_TIER, { timeout: 5000 });

            assert(await isSelected(SHOW_PUTATIVE_DRIVERS));
            await clickElement(SHOW_PUTATIVE_DRIVERS);

            assert(await isSelected(SHOW_UNKNOWN_ONCOGENICITY));
            await clickElement(SHOW_UNKNOWN_ONCOGENICITY);

            await (
                await getNestedElement([SV_TABLE, ANY_ROW])
            ).waitForDisplayed();

            expect(
                (await (await getElement(SV_TABLE)).$$(ANY_ROW)).length
            ).toBe(2);
            expect(await getAllGeneNames()).toBe('NCOA4,RET');
        });
    });
});

async function getAllGeneNames() {
    const geneNames = await (await $(SV_TABLE)).$$(ANY_ROW);
    const words = await Promise.all(
        geneNames.map(async e => await (await e.$(GENE_NAME)).getText())
    );
    return words.sort().join();
}
