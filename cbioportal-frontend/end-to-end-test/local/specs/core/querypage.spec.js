const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    getElement,
    getNestedElement,
    clickElement,
    isDisplayed,
    isSelected,
    setInputText,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('study select page', function() {
    describe.skip('error messaging for invalid study id(s)', function() {
        // FIXME: on authenticated portals the alert does not show because the backend throws 403 because
        // the user does not have permission to access a non-existing study.
        // Possibly, run localdb against an unauthenticated portal or as a remote tests against public cbioportal
        it('show error alert and query form for single invalid study id', async function() {
            const url = `${CBIOPORTAL_URL}/results/oncoprint?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations`;
            await goToUrlAndSetLocalStorage(url, true);
            await getElement('[data-test="StudySelect"]', {
                waitForExist: true,
            });
            assert(
                await getNestedElement([
                    '[data-test="unkown-study-warning"]',
                    'li=coadread_tcga_pubb',
                ])
            );
        });

        // FIXME: on authenticated portals the alert does not show because the backend throws 403 because
        // the user does not have permission to access a non-existing study.
        // Possibly, run localdb against an unauthenticated portal or as a remote tests against public cbioportal
        it('show error alert and query form for two studies, one invalid', async function() {
            const url = `${CBIOPORTAL_URL}/results/cancerTypesSummary?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=acc_tcgaa%2Cstudy_es_0&case_set_id=all&data_priority=0&gene_list=TP53&geneset_list=%20&tab_index=tab_visualize`;
            await goToUrlAndSetLocalStorage(url, true);
            await getElement('[data-test="StudySelect"]', {
                waitForExist: true,
            });
            assert(
                await (
                    await getNestedElement([
                        '[data-test="unkown-study-warning"]',
                        'li=acc_tcgaa',
                    ])
                ).isExisting()
            );
            assert(
                !(await (
                    await getNestedElement([
                        '[data-test="unkown-study-warning"]',
                        'li=study_es_0',
                    ])
                ).isExisting())
            );
        });
    });

    describe('study search box', () => {
        const searchTextInput = '[data-test=study-search-input]';
        const searchControlsMenu =
            '[data-test=study-search-controls-container]';
        const referenceGenomeFormSection = '//h5[text()="Reference genome"]';
        const hg38StudyEntry = '//span[text()="Study HG38"]';
        const hg38Checkbox = '#input-hg38';

        before(async () => {
            await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
            await getElement('[data-test=cancerTypeListContainer]', {
                waitForExist: true,
            });
            // NOTE Somehow, we need to reload to load the  external frontend.
            await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
            await getElement('[data-test=cancerTypeListContainer]', {
                waitForExist: true,
            });
        });

        it('shows menu when focussing the text input', async () => {
            assert(!(await isDisplayed(searchControlsMenu)));
            await clickElement(searchTextInput);
            assert(await isDisplayed(searchControlsMenu));
        });

        describe('reference genome', () => {
            it('shows reference genome form elements when studies on different reference genomes are present', async () => {
                assert(await isDisplayed(searchControlsMenu));
                assert(await isDisplayed(referenceGenomeFormSection));
            });
            it('fills text input with search shorthand and filters studies when filtering studies via reference genome form element', async () => {
                assert(await isDisplayed(referenceGenomeFormSection));
                assert(await isDisplayed(hg38StudyEntry));
                await clickElement(hg38Checkbox);
                const textInSearchTextInput = await (
                    await getElement(searchTextInput)
                ).getValue();
                assert.equal(textInSearchTextInput, 'reference-genome:hg19');
                assert(!(await isDisplayed(hg38StudyEntry)));
            });
            it('updates reference genome form elements and study filter when entering search shorthand in text input', async () => {
                await clickElement('.input-group-btn');
                await getElement(referenceGenomeFormSection, {
                    waitForExist: true,
                });
                assert(await isDisplayed(referenceGenomeFormSection));
                assert(!(await isDisplayed(hg38StudyEntry)));
                assert(!(await isSelected(hg38Checkbox)));
                await setInputText(searchTextInput, 'Study'); // empty string does not trigger refresh
                await getElement(hg38StudyEntry, {
                    waitForExist: true,
                });
                assert(await isSelected(hg38Checkbox));
            });
        });
    });
});
