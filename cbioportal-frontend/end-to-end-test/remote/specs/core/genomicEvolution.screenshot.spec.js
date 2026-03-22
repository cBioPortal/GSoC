const assert = require('assert');
const {
    selectReactSelectOption,
    goToUrlAndSetLocalStorage,
    checkElementWithMouseDisabled,
    waitForNetworkQuiet,
    setCheckboxChecked,
    jsApiClick,
    jsApiHover,
    getElement,
    clickElement,
} = require('../../../shared/specUtils_Async');

const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');
const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const patientViewUrl = `${CBIOPORTAL_URL}/patient/genomicEvolution?caseId=P04&studyId=lgg_ucsf_2014`;

describe('Patient View Genomic Evolution tab screenshot tests', function() {
    this.retries(0);

    before(async () => {
        await goToUrlAndSetLocalStorage(patientViewUrl);
        await browser.pause(2000);
        await (await getElement('a.tabAnchor_lineChart')).waitForDisplayed({
            timeout: 20000,
        });
        await clickElement('a.tabAnchor_lineChart');
        //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
        await (
            await getElement('[data-test=VAFChartWrapper]')
        ).waitForDisplayed({ timeout: 5000 });
        await waitForNetworkQuiet(10000);
    });
    it('pvge initial view with line chart', async () => {
        const res = await browser.checkElement(
            'div[data-test="GenomicEvolutionTab"]',
            '',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge show timeline', async () => {
        await clickElement('button[data-test="ToggleTimeline"]');
        await (await getElement('div.tl-timeline-wrapper')).waitForDisplayed();
        const res = await browser.checkElement(
            'div[data-test="GenomicEvolutionTab"]',
            '',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge one mutation selected with line chart', async () => {
        await clickElement('button[data-test="ToggleTimeline"]'); // toggle timeline off
        await clickElement(
            'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(1)'
        );
        const res = await checkElementWithMouseDisabled(
            'div[data-test="GenomicEvolutionTab"]',
            0,
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it.skip('pvge hover a mutation with line chart', async () => {
        await jsApiHover(
            'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(2)'
        );
        const res = await browser.checkElement(
            'div[data-test="GenomicEvolutionTab"]',
            '',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });

    it('pvge switch to sequential mode', async () => {
        await setCheckboxChecked(true, 'input[data-test="VAFSequentialMode"]');
        //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
        const res = await browser.checkElement('[data-test=VAFChartWrapper]');
        assertScreenShotMatch(res);
    });

    it('pvge only show highlighted in line chart', async () => {
        await setCheckboxChecked(false, 'input[data-test="VAFSequentialMode"]');
        await setCheckboxChecked(true, 'input[data-test="VAFOnlyHighlighted"]');
        //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
        const res = await browser.checkElement('[data-test=VAFChartWrapper]');
        assertScreenShotMatch(res);
    });
    it('pvge line chart log scale', async () => {
        await setCheckboxChecked(true, 'input[data-test="VAFLogScale"]');
        //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });

        const res = await browser.checkElement('[data-test=VAFChartWrapper]');
        assertScreenShotMatch(res);
    });
    it('pvge line chart with data range y axis', async () => {
        await jsApiClick('input[data-test="VAFDataRange"]');

        const res = await browser.checkElement('[data-test=VAFChartWrapper]');
        assertScreenShotMatch(res);
    });
    it('pvge add a mutation to line chart', async () => {
        await clickElement(
            'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(2)'
        );
        //await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
        const res = await browser.checkElement('[data-test=VAFChartWrapper]');
        assertScreenShotMatch(res);
    });
    it('pvge heatmap with two mutations selected from before', async () => {
        await clickElement('a.tabAnchor_heatmap');
        await (await getElement('div#MutationHeatmap')).waitForDisplayed({
            timeout: 3000,
        });
        const res = await browser.checkElement(
            'div[data-test="GenomicEvolutionTab"]',
            '',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge one mutation selected with heatmap', async () => {
        await clickElement(
            'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(1)'
        );
        await (await getElement('#cbioportal-logo')).moveTo();
        const res = await checkElementWithMouseDisabled(
            'div[data-test="GenomicEvolutionTab"]',
            0,
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge hover a mutation with heatmap', async () => {
        const el = await getElement(
            'div[data-test="GenomicEvolutionMutationTable"] table tbody > tr:nth-child(9)'
        );

        await el.scrollIntoView();

        await el.moveTo();
        await browser.pause(2000); // give time for hover effect

        const res = await browser.checkElement(
            'div[data-test="GenomicEvolutionTab"]',
            '',
            { hide: ['.qtip'] }
        );
        assertScreenShotMatch(res);
    });
    it('pvge uncluster heatmap', async () => {
        await setCheckboxChecked(false, 'input[data-test="HeatmapCluster"]');
        await browser.pause(2000); // give time to uncluster
        const res = await checkElementWithMouseDisabled(
            'div#MutationHeatmap',
            0,
            {
                hide: ['.qtip', '.dropdown-menu'],
            }
        );
        assertScreenShotMatch(res);
    });
    it('pvge transpose heatmap', async () => {
        await setCheckboxChecked(true, 'input[data-test="HeatmapTranspose"]');
        await browser.pause(2000); // give time to transpose
        const res = await checkElementWithMouseDisabled(
            'div#MutationHeatmap',
            0,
            {
                hide: ['.qtip', '.dropdown-menu'],
            }
        );
        assertScreenShotMatch(res);
    });
    it('pvge transposed heatmap hide labels', async () => {
        await setCheckboxChecked(
            false,
            'input[data-test="HeatmapMutationLabels"]'
        );
        await browser.pause(400); // give time to rerender
        const res = await checkElementWithMouseDisabled(
            'div#MutationHeatmap',
            0,
            {
                hide: ['.qtip', '.dropdown-menu'],
            }
        );
        assertScreenShotMatch(res);
    });
    it('pvge heatmap hide labels', async () => {
        await setCheckboxChecked(false, 'input[data-test="HeatmapTranspose"]');
        await browser.pause(2000); // give time to untranspose

        const res = await checkElementWithMouseDisabled(
            'div#MutationHeatmap',
            0,
            {
                hide: ['.qtip', '.dropdown-menu'],
            }
        );

        assertScreenShotMatch(res);
    });
});
