const { assertScreenShotMatch } = require('../../shared/lib/testUtils');
const {
    openGroupComparison,
    setInputText,
    setCheckboxChecked,
    clickElement,
    getElement,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('Screenshot test for extend survival chart (feature flag)', function() {
    this.retries(0);

    before(async function() {
        await openGroupComparison(
            `${CBIOPORTAL_URL}/study/summary?id=lgg_ucsf_2014_test_generic_assay&featureFlags=SURVIVAL_PLOT_EXTENDED`,
            'chart-container-OS_STATUS',
            100000
        );
        await clickElement('.tabAnchor_survival');
        await getElement('[data-test="ComparisonPageSurvivalTabDiv"]', {
            timeout: 20000,
        });
    });
    it('Survival chart with landmark event and hazard ratio disabled', async () => {
        const res = await browser.checkElement('div[data-test=SurvivalChart]');
        assertScreenShotMatch(res);
    });
    it('Survival chart with landmark event at time point 20', async () => {
        await setCheckboxChecked(true, 'input[data-test=landmarkLines]');
        await setInputText('input[data-test=landmarkValues]', '20');
        await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
        const res = await browser.checkElement('div[data-test=SurvivalChart]');
        assertScreenShotMatch(res);
    });
    it('Survival chart with hazard ratio table', async () => {
        await setCheckboxChecked(false, 'input[data-test=landmarkLines]');
        await setCheckboxChecked(true, 'input[data-test=hazardRatioCheckbox]');
        const res = await browser.checkElement(
            'div[data-test=survivalTabView]'
        );
        assertScreenShotMatch(res);
    });
    it('Survival chart with hazard ratio table and landmark line', async () => {
        await setCheckboxChecked(true, 'input[data-test=landmarkLines]');
        await setInputText('input[data-test=landmarkValues]', '20');
        await setCheckboxChecked(true, 'input[data-test=hazardRatioCheckbox]');
        const res = await browser.checkElement(
            'div[data-test=survivalTabView]'
        );
        assertScreenShotMatch(res);
    });
});
