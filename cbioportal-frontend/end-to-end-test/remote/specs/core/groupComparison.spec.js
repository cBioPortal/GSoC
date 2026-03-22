const assert = require('assert');
const {
    jsApiClick,
    goToUrlAndSetLocalStorage,
    getElementByTestHandle,
    getElement,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const SampleCreateGroupButton =
    'button[data-test="sampleGroupComparisonCreateGroupButton"]';
const PatientCreateGroupButton =
    'button[data-test="patientGroupComparisonCreateGroupButton"]';

describe('group comparison venn diagram tests', () => {
    describe('create new group tests', () => {
        before(async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison/overlap?sessionId=5cf6bcf0e4b0ab413787430c`
            );
            await getElement('div[data-test="ComparisonPageOverlapTabDiv"]', {
                timeout: 20000,
            });
        });

        it('create group button disabled as default', async () => {
            assert.equal(
                await (await getElement(SampleCreateGroupButton)).isEnabled(),
                false
            );
            assert.equal(
                await (await getElement(PatientCreateGroupButton)).isEnabled(),
                false
            );
        });

        it('select from sample venn diagram', async () => {
            await jsApiClick('rect[data-test="sample0,1VennRegion"]');
            await browser.pause(100);
            assert.equal(
                await (await getElement(SampleCreateGroupButton)).isEnabled(),
                true
            );
            assert.equal(
                await (await getElement(PatientCreateGroupButton)).isEnabled(),
                false
            );
        });

        it('click sample venn diagram create group button', async () => {
            await (await getElement(SampleCreateGroupButton)).click();
            await getElement('div.rc-tooltip-inner', { timeout: 20000 });
            await browser.pause(100);
            assert.equal(
                await (
                    await getElementByTestHandle('sampleGroupNameInputField')
                ).isDisplayed(),
                true,
                'group name input exists'
            );
            assert.equal(
                await (
                    await getElementByTestHandle('sampleGroupNameSubmitButton')
                ).isEnabled(),
                false
            );
        });

        it('sample venn diagram: group name exists, should disable submit button', async () => {
            await (
                await getElementByTestHandle('sampleGroupNameInputField')
            ).setValue('GARS mutant');
            await browser.pause(100);
            await getElementByTestHandle('sampleDuplicateGroupNameMessage', {
                timeout: 20000,
            });
            assert.equal(
                await (
                    await getElementByTestHandle(
                        'sampleDuplicateGroupNameMessage'
                    )
                ).getText(),
                'Another group already has this name.'
            );
            assert.equal(
                await (
                    await getElementByTestHandle('sampleGroupNameSubmitButton')
                ).isEnabled(),
                false
            );
        });

        it('sample venn diagram: new group name, should enable submit button', async () => {
            await (
                await getElementByTestHandle('sampleGroupNameInputField')
            ).setValue('new group');
            await browser.pause(100);
            assert.equal(
                await (
                    await getElementByTestHandle('sampleGroupNameSubmitButton')
                ).isEnabled(),
                true
            );
        });

        it('select from patient venn diagram', async () => {
            // unselect sample venn diagram first
            await jsApiClick('rect[data-test="sample0,1VennRegion"]');
            await jsApiClick('rect[data-test="patient0VennRegion"]');
            await browser.pause(100);
            assert.equal(
                await (await getElement(SampleCreateGroupButton)).isEnabled(),
                false
            );
            assert.equal(
                await (await getElement(PatientCreateGroupButton)).isEnabled(),
                true
            );
        });

        it('click patient venn diagram create group button', async () => {
            await (await getElement(PatientCreateGroupButton)).click();
            await getElement('div.rc-tooltip-inner', { timeout: 20000 });
            await browser.pause(100);
            assert.equal(
                await (
                    await getElementByTestHandle('patientGroupNameInputField')
                ).isDisplayed(),
                true,
                'group name input exists'
            );
            assert.equal(
                await (
                    await getElementByTestHandle('patientGroupNameSubmitButton')
                ).isEnabled(),
                false
            );
        });

        it('patient venn diagram: group name exists, should disable submit button', async () => {
            await (
                await getElementByTestHandle('patientGroupNameInputField')
            ).setValue('GARS mutant');
            await browser.pause(100);
            await getElementByTestHandle('patientDuplicateGroupNameMessage', {
                timeout: 20000,
            });
            assert.equal(
                await (
                    await getElementByTestHandle(
                        'patientDuplicateGroupNameMessage'
                    )
                ).getText(),
                'Another group already has this name.'
            );
            assert.equal(
                await (
                    await getElementByTestHandle('patientGroupNameSubmitButton')
                ).isEnabled(),
                false
            );
        });

        it('patient venn diagram: new group name, should enable submit button', async () => {
            await (
                await getElementByTestHandle('patientGroupNameInputField')
            ).setValue('new group');
            await browser.pause(100);
            assert.equal(
                await (
                    await getElementByTestHandle('patientGroupNameSubmitButton')
                ).isEnabled(),
                true
            );
        });
    });
});

describe('group comparison upset diagram tests', function() {
    describe('create new group tests', function() {
        before(async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/comparison?sessionId=5d0bc0c5e4b0ab4137876bc3`
            );
            await getElement('div[data-test="ComparisonPageOverlapTabDiv"]', {
                timeout: 20000,
            });
        });

        it('create group button disabled as default', async () => {
            assert.equal(
                await (await getElement(SampleCreateGroupButton)).isEnabled(),
                false
            );
            assert.equal(
                await (await getElement(PatientCreateGroupButton)).isEnabled(),
                false
            );
        });

        it('select from sample upset diagram', async () => {
            await jsApiClick('.sample_testGroup2_testGroup3_bar');
            await browser.pause(100);
            assert.equal(
                await (await getElement(SampleCreateGroupButton)).isEnabled(),
                true
            );
            assert.equal(
                await (await getElement(PatientCreateGroupButton)).isEnabled(),
                false
            );
        });

        it('click sample upset diagram create group button', async () => {
            await (await getElement(SampleCreateGroupButton)).click();
            await getElement('div.rc-tooltip-inner', { timeout: 20000 });
            await browser.pause(100);
            assert.equal(
                await (
                    await getElementByTestHandle('sampleGroupNameInputField')
                ).isDisplayed(),
                true,
                'group name input exists'
            );
            assert.equal(
                await (
                    await getElementByTestHandle('sampleGroupNameSubmitButton')
                ).isEnabled(),
                false
            );
        });

        it('sample upset diagram: group name exists, should disable submit button', async () => {
            await (
                await getElementByTestHandle('sampleGroupNameInputField')
            ).setValue('testGroup5');
            await browser.pause(100);
            await getElementByTestHandle('sampleDuplicateGroupNameMessage', {
                timeout: 20000,
            });
            assert.equal(
                await (
                    await getElementByTestHandle(
                        'sampleDuplicateGroupNameMessage'
                    )
                ).getText(),
                'Another group already has this name.'
            );
            assert.equal(
                await (
                    await getElementByTestHandle('sampleGroupNameSubmitButton')
                ).isEnabled(),
                false
            );
        });

        it('sample upset diagram: new group name, should enable submit button', async () => {
            await (
                await getElementByTestHandle('sampleGroupNameInputField')
            ).setValue('new group');
            await browser.pause(100);
            assert.equal(
                await (
                    await getElementByTestHandle('sampleGroupNameSubmitButton')
                ).isEnabled(),
                true
            );
        });

        it('select from patient upset diagram', async () => {
            // unselect sample venn diagram first
            await (
                await getElement('path.sample_testGroup2_testGroup3_bar')
            ).click();
            await (
                await getElement('path.patient_testGroup3_testGroup4_bar')
            ).click();
            await browser.pause(100);
            assert.equal(
                await (await getElement(SampleCreateGroupButton)).isEnabled(),
                false
            );
            assert.equal(
                await (await getElement(PatientCreateGroupButton)).isEnabled(),
                true
            );
        });

        it('click patient upset diagram create group button', async () => {
            await (await getElement(PatientCreateGroupButton)).click();
            await getElement('div.rc-tooltip-inner', { timeout: 20000 });
            await browser.pause(100);
            assert.equal(
                await (
                    await getElementByTestHandle('patientGroupNameInputField')
                ).isDisplayed(),
                true,
                'group name input exists'
            );
            assert.equal(
                await (
                    await getElementByTestHandle('patientGroupNameSubmitButton')
                ).isEnabled(),
                false
            );
        });

        it('patient upset diagram: group name exists, should disable submit button', async () => {
            await (
                await getElementByTestHandle('patientGroupNameInputField')
            ).setValue('testGroup3');
            await browser.pause(100);
            await getElementByTestHandle('patientDuplicateGroupNameMessage', {
                timeout: 20000,
            });
            assert.equal(
                await (
                    await getElementByTestHandle(
                        'patientDuplicateGroupNameMessage'
                    )
                ).getText(),
                'Another group already has this name.'
            );
            assert.equal(
                await (
                    await getElementByTestHandle('patientGroupNameSubmitButton')
                ).isEnabled(),
                false
            );
        });

        it('patient upset diagram: new group name, should enable submit button', async () => {
            await (
                await getElementByTestHandle('patientGroupNameInputField')
            ).setValue('new group');
            await browser.pause(100);
            assert.equal(
                await (
                    await getElementByTestHandle('patientGroupNameSubmitButton')
                ).isEnabled(),
                true
            );
        });
    });
});
