var assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    jsApiClick,
    getElement,
    getElementByTestHandle,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const SampleCreateGroupButton =
    'button[data-test="sampleGroupComparisonCreateGroupButton"]';
const PatientCreateGroupButton =
    'button[data-test="patientGroupComparisonCreateGroupButton"]';
const ComparisonPageOverlapTabDiv =
    'div[data-test="ComparisonPageOverlapTabDiv"]';
const sampleGroupNameInputField = '[data-test="sampleGroupNameInputField"]';
const dataTestSampleGroupNameSubmitButton =
    '[data-test="sampleGroupNameSubmitButton"]';

describe('results view comparison tab venn diagram tests', function() {
    describe('create new group tests', function() {
        before(async function() {
            // await browser.debug()
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
            );
            await getElement(ComparisonPageOverlapTabDiv, {
                timeout: 20000,
            });
        });

        it('create group button disabled as default', async function() {
            assert.equal(
                await (await getElement(SampleCreateGroupButton)).isEnabled(),
                false
            );
            assert.equal(
                await (await getElement(PatientCreateGroupButton)).isEnabled(),
                false
            );
        });

        it('select from sample venn diagram', async function() {
            await jsApiClick('rect[data-test="sample0VennRegion"]');
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

        it('click sample venn diagram create group button', async function() {
            (await getElement(SampleCreateGroupButton)).click();
            await getElement('div.rc-tooltip-inner', { timeout: 20000 });
            await browser.pause(200);
            const el = await getElementByTestHandle(
                'sampleGroupNameInputField'
            );
            const isDisplayed = await el.isDisplayed();
            console.log('isDisplayed', isDisplayed);
            assert.equal(isDisplayed, true, 'group name input exists');
            assert.equal(
                await (
                    await getElement(dataTestSampleGroupNameSubmitButton)
                ).isEnabled(),
                false
            );
        });

        it('sample venn diagram: group name exists, should disable submit button', async function() {
            (await getElement(sampleGroupNameInputField)).setValue(
                'Altered group'
            );
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
                    await getElement(dataTestSampleGroupNameSubmitButton)
                ).isEnabled(),
                false
            );

            (await getElement(sampleGroupNameInputField)).setValue('KRAS');
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
                    await getElement(dataTestSampleGroupNameSubmitButton)
                ).isEnabled(),
                false
            );
        });

        it('sample venn diagram: new group name, should enable submit button', async function() {
            await (await getElement(sampleGroupNameInputField)).setValue(
                'new group'
            );
            await browser.pause(100);
            assert.equal(
                await (
                    await getElement(dataTestSampleGroupNameSubmitButton)
                ).isEnabled(),
                true
            );
        });

        it('select from patient venn diagram', async function() {
            // unselect sample venn diagram first
            await jsApiClick('rect[data-test="sample0VennRegion"]');
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

        it('click patient venn diagram create group button', async function() {
            (await getElement(PatientCreateGroupButton)).click();
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

        it('patient venn diagram: group name exists, should disable submit button', async function() {
            (
                await getElementByTestHandle('patientGroupNameInputField')
            ).setValue('Unaltered group');
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

            (
                await getElementByTestHandle('patientGroupNameInputField')
            ).setValue('BRAF');
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

        it('patient venn diagram: new group name, should enable submit button', async function() {
            (
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

describe('results view comparison tab upset diagram tests', function() {
    describe('create new group tests', function() {
        before(async function() {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/comparison?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&comparison_selectedGroups=%5B%22Altered%20group%22%2C%22Unaltered%20group%22%2C%22KRAS%22%2C%22NRAS%22%5D&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`
            );
            await getElement(ComparisonPageOverlapTabDiv, {
                timeout: 20000,
            });
        });

        it('create group button disabled as default', async function() {
            assert.equal(
                await (await getElement(SampleCreateGroupButton)).isEnabled(),
                false
            );
            assert.equal(
                await (await getElement(PatientCreateGroupButton)).isEnabled(),
                false
            );
        });

        it('select from sample upset diagram', async function() {
            await jsApiClick('.sample_Altered_group_KRAS_bar');
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

        it('click sample upset diagram create group button', async function() {
            (await getElement(SampleCreateGroupButton)).click();
            await getElement('div.rc-tooltip-inner', { timeout: 20000 });
            await browser.pause(100);
            assert.equal(
                await (
                    await getElement(sampleGroupNameInputField)
                ).isDisplayed(),
                true,
                'group name input exists'
            );
            assert.equal(
                await (
                    await getElement(dataTestSampleGroupNameSubmitButton)
                ).isEnabled(),
                false
            );
        });

        it('sample upset diagram: group name exists, should disable submit button', async function() {
            (await getElement(sampleGroupNameInputField)).setValue(
                'Altered group'
            );
            await browser.pause(100);
            await getElementByTestHandle('sampleDuplicateGroupNameMessage', {
                timeout: 20000,
            });
            assert.equal(
                await (
                    await getElement(
                        '[data-test="sampleDuplicateGroupNameMessage"]'
                    )
                ).getText(),
                'Another group already has this name.'
            );
            assert.equal(
                await (
                    await getElement(dataTestSampleGroupNameSubmitButton)
                ).isEnabled(),
                false
            );
        });

        it('sample upset diagram: new group name, should enable submit button', async function() {
            (await getElement(sampleGroupNameInputField)).setValue('new group');
            await browser.pause(100);
            assert.equal(
                await (
                    await getElement(dataTestSampleGroupNameSubmitButton)
                ).isEnabled(),
                true
            );
        });

        it('select from patient upset diagram', async function() {
            // unselect sample venn diagram first
            await jsApiClick('.sample_Altered_group_KRAS_bar');
            await jsApiClick('.patient_Unaltered_group_bar');
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

        it('click patient upset diagram create group button', async function() {
            (await getElement(PatientCreateGroupButton)).click();
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

        it('patient upset diagram: group name exists, should disable submit button', async function() {
            (
                await getElementByTestHandle('patientGroupNameInputField')
            ).setValue('BRAF');
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

        it('patient upset diagram: new group name, should enable submit button', async function() {
            (
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
