const {
    goToUrlAndSetLocalStorage,
    waitForPatientView,
    setDropdownOpen,
    getElementByTestHandle,
    getNestedElement,
    waitForElementDisplayed,
    clickElement,
} = require('../../../shared/specUtils_Async');
const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');
const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const patientViewUrl =
    CBIOPORTAL_URL + '/patient?studyId=teststudy_genepanels&caseId=patientA';
const ascnPatientViewUrl =
    CBIOPORTAL_URL + '/patient?studyId=ascn_test_study&caseId=FAKE_P001';
const genericAssayPatientViewUrl =
    CBIOPORTAL_URL +
    '/patient/mutationalSignatures?studyId=lgg_ucsf_2014_test_generic_assay&caseId=P01';

describe('patient view page', function() {
    describe('mutation table for study with ASCN data', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(ascnPatientViewUrl, true);
            await waitForPatientView();
        });

        it('displays ASCN columns', async () => {
            const res = await browser.checkElement(
                'div[data-test=patientview-mutation-table] table'
            );
            assertScreenShotMatch(res);
        });
    });

    describe('mutation table for study with no ASCN data', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(patientViewUrl, true);
            await waitForPatientView();
        });

        it('does not display ASCN columns for studies with no ASCN data', async () => {
            const res = await browser.checkElement(
                'div[data-test=patientview-mutation-table] table'
            );
            assertScreenShotMatch(res);
        });
    });

    describe('gene panel icons', () => {
        const iconIndexGenePanelSample = 2;
        const iconIndexWholeGenomeSample = 3;

        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(patientViewUrl, true);
            await waitForPatientView();
        });

        it('shows gene panel icons behind mutation and CNA genomic tracks', async () => {
            const res = await browser.checkElement(
                'div.genomicOverviewTracksContainer'
            );
            assertScreenShotMatch(res);
        });

        it('filters mutation tracks based on gene filter setting', async () => {
            await switchGeneFilter('allSamples');
            var res = await browser.checkElement(
                'div.genomicOverviewTracksContainer'
            );
            assertScreenShotMatch(res);
        });

        it('filters VAF plot based on gene filter setting when switching to _all samples_', async () => {
            await switchGeneFilter('allSamples');
            await doVafPlotScreenshotTest();
        });

        it('filters VAF plot based on gene filter setting when switching to _any sample_', async () => {
            await switchGeneFilter('anySample');
            await doVafPlotScreenshotTest();
        });
    });

    describe('patient view mutational signatures', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(genericAssayPatientViewUrl, true);
            //waitForPatientView();
            await (
                await $('a.tabAnchor_mutationalSignatures')
            ).waitForDisplayed({
                timeout: 20000,
            });
            await (await $('a.tabAnchor_mutationalSignatures')).click();
            await (
                await $('div[data-test="MutationalSignaturesContainer"]')
            ).waitForDisplayed({
                timeout: 20000,
            });
        });

        it('show stacked bar chart for patient who has significant SBS signatures', async () => {
            await (await $('div.patientSamples')).waitForDisplayed({
                timeout: 20000,
            });
            var res = await browser.checkElement('div.patientSamples');
            assertScreenShotMatch(res);
        });

        it('show tooltip for patient who has significant SBS signatures', async () => {
            await (await $('div.progress')).waitForDisplayed({
                timeout: 20000,
            });
            await (await $('div.progress')).moveTo({ xOffset: 0, yOffset: 0 });
            assertScreenShotMatch(
                await browser.checkElement('div.patientViewPage')
            );
        });

        it('show mutational signatures table for patient who has significant SBS signatures', async () => {
            var res = await browser.checkElement(
                'div[data-test="MutationalSignaturesContainer"]'
            );
            assertScreenShotMatch(res);
        });

        it('show stacked bar chart for patient who has significant ID signatures', async () => {
            await selectMutationalSignaturesVersionID();

            await (await $('div.patientSamples')).waitForDisplayed({
                timeout: 20000,
            });
            // bar chart does an animation we have to wait for
            await browser.pause(5000);
            var res = await browser.checkElement('div.patientSamples');
            assertScreenShotMatch(res);
        });

        it('show tooltip for patient who has significant ID signatures', async () => {
            //browser.debug();

            await selectMutationalSignaturesVersionID();
            await (await $('div.progress')).waitForDisplayed({
                timeout: 20000,
            });
            await (await $('div.progress')).moveTo({ xOffset: 0, yOffset: 0 });

            await (
                await $(
                    'div[data-test="SignificantMutationalSignaturesTooltip"]'
                )
            ).waitForDisplayed();

            assertScreenShotMatch(
                await browser.checkElement('div.patientViewPage')
            );
        });

        it('show stacked bar chart for patient who has significant DBS signatures', async () => {
            await selectMutationalSignaturesVersionDBS();
            await (await $('div.patientSamples')).waitForDisplayed({
                timeout: 20000,
            });
            // bar chart does an animation we have to wait for
            await browser.pause(5000);
            var res = await browser.checkElement('div.patientSamples');
            assertScreenShotMatch(res);
        });

        it('show tooltip for patient who has significant DBS signatures', async () => {
            await selectMutationalSignaturesVersionDBS();
            await (await $('div.progress')).waitForDisplayed({
                timeout: 20000,
            });
            await (await $('div.progress')).moveTo({ xOffset: 0, yOffset: 0 });

            await (
                await $(
                    'div[data-test="SignificantMutationalSignaturesTooltip"]'
                )
            ).waitForDisplayed();

            assertScreenShotMatch(
                await browser.checkElement('div.patientViewPage')
            );
        });

        it('show mutational signatures table for patient who has significant ID signatures', async () => {
            await selectMutationalSignaturesVersionID();
            var res = await browser.checkElement(
                'div[data-test="MutationalSignaturesContainer"]'
            );
            assertScreenShotMatch(res);
        });
    });
    describe('test the mutational bar chart', () => {
        it('show mutational bar chart sbs', async () => {
            var res = await browser.checkElement(
                'div[data-test=MutationalSignaturesContainer]'
            );
            assertScreenShotMatch(res);
        });
        it('show mutational bar chart id', async () => {
            await selectMutationalSignaturesVersionID();
            var res = await browser.checkElement(
                'div[data-test=MutationalSignaturesContainer]'
            );
            assertScreenShotMatch(res);
        });
        it('show mutational bar chart dbs', async () => {
            await selectMutationalSignaturesVersionDBS();
            var res = await browser.checkElement(
                'div[data-test=MutationalSignaturesContainer]'
            );
            assertScreenShotMatch(res);
        });
        it('show the bar chart with percentage on y axis', async () => {
            await selectPercentageYAxis();
            var res = await browser.checkElement(
                'div[data-test=MutationalSignaturesContainer]'
            );
            assertScreenShotMatch(res);
        });
        it('switch between samples to update mutational bar chart', async () => {
            await selectSampleMutationalSignature();
            var res = await browser.checkElement(
                'div[data-test=MutationalSignaturesContainer]'
            );
            assertScreenShotMatch(res);
        });
    });
});

const switchGeneFilter = async selectedOption => {
    const selectMenu = '.rc-tooltip';
    const filterIcon =
        'div[data-test=patientview-mutation-table] i[data-test=gene-filter-icon]';
    await setDropdownOpen(true, filterIcon, selectMenu);
    const allGenesRadio = await getNestedElement([
        selectMenu,
        'input[value=' + selectedOption + ']',
    ]);
    await allGenesRadio.click();
    await setDropdownOpen(false, filterIcon, selectMenu);
};

const doVafPlotScreenshotTest = async () => {
    // we need to hide annotation column in mutations table first
    // because annotation column header icons will add extra height, the extra height will sometimes make scroll bar showing up on the right
    // browser.checkElement() doesn't work correctly on tooltip when there is a scroll bar
    // because scroll bar also takes some space and makes the total width shorter than tooltip, then tooltip will move to the right but browser.checkElement() still grabs the "old" position

    // open columns dropdown
    await (await $('button*=Columns')).click();
    // click "Annotation" to hide annotation column
    await (await $('//*[text()="Annotation"]')).click();
    // close on columns dropdown
    await (await $('button*=Columns')).click();
    await (await $('.vafPlotThumbnail')).moveTo(); // moves pointer to plot thumbnail
    await (await $('div[role=tooltip] [data-test=vaf-plot]')).waitForExist();
    const res = await browser.checkElement(
        'div[role=tooltip] [data-test=vaf-plot]'
    ); // grabs the full plot
    assertScreenShotMatch(res);
};

const selectMutationalSignaturesVersionID = async () => {
    await (
        await $('div.mutationalSignaturesVersionSelector__indicators')
    ).waitForDisplayed({
        timeout: 10000,
    });
    await (
        await $('div.mutationalSignaturesVersionSelector__indicators')
    ).click();
    await (await $('div=Mutational Signature ID')).waitForDisplayed({
        timeout: 10000,
    });
    await (await $('div=Mutational Signature ID')).click();
};

const selectMutationalSignaturesVersionDBS = async () => {
    await (
        await $('div.mutationalSignaturesVersionSelector__indicators')
    ).waitForDisplayed({
        timeout: 10000,
    });
    await (
        await $('div.mutationalSignaturesVersionSelector__indicators')
    ).click();
    await (await $('div=Mutational Signature DBS')).waitForDisplayed({
        timeout: 10000,
    });
    await (await $('div=Mutational Signature DBS')).click();
};
const selectPercentageYAxis = async () => {
    await (await getElementByTestHandle('AxisScaleSwitch%')).click();
};

const selectSampleMutationalSignature = async () => {
    await waitForElementDisplayed(
        'div.mutationalSignatureSampleSelector__indicators',
        {
            timeout: 10000,
        }
    );
    await clickElement('div.mutationalSignatureSampleSelector__indicators');
    await waitForElementDisplayed('div=P01_Rec', { timeout: 10000 });
    await clickElement('div=P01_Rec');
};
