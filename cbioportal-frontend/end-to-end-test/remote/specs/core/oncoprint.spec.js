const assertScreenShotMatch = require('../../../shared/lib/testUtils')
    .assertScreenShotMatch;
const assert = require('assert');
const {
    waitForOncoprint,
    goToUrlAndSetLocalStorage,
    getNthOncoprintTrackOptionsElements,
    getTextInOncoprintLegend,
    setOncoprintMutationsMenuOpen,
    setSettingsMenuOpen,
    waitForNumberOfStudyCheckboxes,
    setInputText,
    getOncoprintGroupHeaderOptionsElements: getGroupHeaderOptionsElements,
    clickQueryByGeneButton,
    setDropdownOpen,
    clickElement,
    waitForElementDisplayed,
    getElement,
    getText,
} = require('../../../shared/specUtils_Async.js');
const { getCSSProperty } = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('merged tracks', () => {
    before(async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=coadread_tcga&case_set_id=coadread_tcga_cnaseq&data_priority=0&gene_list=%255B%2522RAS%2522%2520KRAS%2520NRAS%2520HRAS%255D&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_mutations&tab_index=tab_visualize`
        );
        await waitForOncoprint();
    });
    it('oncoprint loads and expands a merged track', async () => {
        const trackOptionsElts = await getNthOncoprintTrackOptionsElements(1);
        await (await getElement(trackOptionsElts.button_selector)).moveTo();
        await clickElement(trackOptionsElts.button_selector);
        await waitForElementDisplayed(trackOptionsElts.dropdown_selector, {
            timeout: 10000,
        });
        // click expand
        await clickElement(
            $(trackOptionsElts.dropdown_selector).$('li=Expand')
        );

        await browser.pause(10000); // give time for track to expand

        const res = await browser.checkElement('.oncoprintContainer', '', {
            hide: ['.oncoprint__controls'],
        }); // just hide the controls bc for some reason they keep showing up transparent in this test only
        assertScreenShotMatch(res);
    });
});

describe('oncoprint', function() {
    describe('initialization from URL parameters', () => {
        it('should start in patient mode if URL parameter show_samples=false or not specified', async () => {
            // not specified
            await goToUrlAndSetLocalStorage(
                CBIOPORTAL_URL +
                    '/index.do?cancer_study_id=acc_tcga&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=acc_tcga_cnaseq&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic'
            );
            await waitForOncoprint();

            const patient_id_order =
                'VENHQS1PUi1BNUpZOmFjY190Y2dh,VENHQS1PUi1BNUo0OmFjY190Y2dh,VENHQS1PUi1BNUpCOmFjY190Y2dh,VENHQS1PUi1BNUoxOmFjY190Y2dh,VENHQS1PUi1BNUoyOmFjY190Y2dh,VENHQS1PUi1BNUozOmFjY190Y2dh,VENHQS1PUi1BNUo1OmFjY190Y2dh,VENHQS1PUi1BNUo2OmFjY190Y2dh,VENHQS1PUi1BNUo3OmFjY190Y2dh,VENHQS1PUi1BNUo4OmFjY190Y2dh,VENHQS1PUi1BNUo5OmFjY190Y2dh,VENHQS1PUi1BNUpBOmFjY190Y2dh,VENHQS1PUi1BNUpDOmFjY190Y2dh,VENHQS1PUi1BNUpEOmFjY190Y2dh,VENHQS1PUi1BNUpFOmFjY190Y2dh,VENHQS1PUi1BNUpGOmFjY190Y2dh,VENHQS1PUi1BNUpHOmFjY190Y2dh,VENHQS1PUi1BNUpIOmFjY190Y2dh,VENHQS1PUi1BNUpJOmFjY190Y2dh,VENHQS1PUi1BNUpKOmFjY190Y2dh,VENHQS1PUi1BNUpLOmFjY190Y2dh,VENHQS1PUi1BNUpMOmFjY190Y2dh,VENHQS1PUi1BNUpNOmFjY190Y2dh,VENHQS1PUi1BNUpPOmFjY190Y2dh,VENHQS1PUi1BNUpQOmFjY190Y2dh,VENHQS1PUi1BNUpROmFjY190Y2dh,VENHQS1PUi1BNUpSOmFjY190Y2dh,VENHQS1PUi1BNUpTOmFjY190Y2dh,VENHQS1PUi1BNUpUOmFjY190Y2dh,VENHQS1PUi1BNUpVOmFjY190Y2dh,VENHQS1PUi1BNUpWOmFjY190Y2dh,VENHQS1PUi1BNUpXOmFjY190Y2dh,VENHQS1PUi1BNUpYOmFjY190Y2dh,VENHQS1PUi1BNUpaOmFjY190Y2dh,VENHQS1PUi1BNUswOmFjY190Y2dh,VENHQS1PUi1BNUsxOmFjY190Y2dh,VENHQS1PUi1BNUsyOmFjY190Y2dh,VENHQS1PUi1BNUszOmFjY190Y2dh,VENHQS1PUi1BNUs0OmFjY190Y2dh,VENHQS1PUi1BNUs1OmFjY190Y2dh,VENHQS1PUi1BNUs2OmFjY190Y2dh,VENHQS1PUi1BNUs4OmFjY190Y2dh,VENHQS1PUi1BNUs5OmFjY190Y2dh,VENHQS1PUi1BNUtCOmFjY190Y2dh,VENHQS1PUi1BNUtPOmFjY190Y2dh,VENHQS1PUi1BNUtQOmFjY190Y2dh,VENHQS1PUi1BNUtROmFjY190Y2dh,VENHQS1PUi1BNUtTOmFjY190Y2dh,VENHQS1PUi1BNUtUOmFjY190Y2dh,VENHQS1PUi1BNUtVOmFjY190Y2dh,VENHQS1PUi1BNUtWOmFjY190Y2dh,VENHQS1PUi1BNUtXOmFjY190Y2dh,VENHQS1PUi1BNUtYOmFjY190Y2dh,VENHQS1PUi1BNUtZOmFjY190Y2dh,VENHQS1PUi1BNUtaOmFjY190Y2dh,VENHQS1PUi1BNUwxOmFjY190Y2dh,VENHQS1PUi1BNUwyOmFjY190Y2dh,VENHQS1PUi1BNUwzOmFjY190Y2dh,VENHQS1PUi1BNUw0OmFjY190Y2dh,VENHQS1PUi1BNUw1OmFjY190Y2dh,VENHQS1PUi1BNUw2OmFjY190Y2dh,VENHQS1PUi1BNUw4OmFjY190Y2dh,VENHQS1PUi1BNUw5OmFjY190Y2dh,VENHQS1PUi1BNUxBOmFjY190Y2dh,VENHQS1PUi1BNUxCOmFjY190Y2dh,VENHQS1PUi1BNUxDOmFjY190Y2dh,VENHQS1PUi1BNUxEOmFjY190Y2dh,VENHQS1PUi1BNUxFOmFjY190Y2dh,VENHQS1PUi1BNUxGOmFjY190Y2dh,VENHQS1PUi1BNUxHOmFjY190Y2dh,VENHQS1PUi1BNUxIOmFjY190Y2dh,VENHQS1PUi1BNUxJOmFjY190Y2dh,VENHQS1PUi1BNUxKOmFjY190Y2dh,VENHQS1PUi1BNUxLOmFjY190Y2dh,VENHQS1PUi1BNUxMOmFjY190Y2dh,VENHQS1PUi1BNUxOOmFjY190Y2dh,VENHQS1PUi1BNUxPOmFjY190Y2dh,VENHQS1PUi1BNUxQOmFjY190Y2dh,VENHQS1PUi1BNUxSOmFjY190Y2dh,VENHQS1PUi1BNUxTOmFjY190Y2dh,VENHQS1PUi1BNUxUOmFjY190Y2dh,VENHQS1PVS1BNVBJOmFjY190Y2dh,VENHQS1QNi1BNU9IOmFjY190Y2dh,VENHQS1QQS1BNVlHOmFjY190Y2dh,VENHQS1QSy1BNUg5OmFjY190Y2dh,VENHQS1QSy1BNUhBOmFjY190Y2dh,VENHQS1QSy1BNUhCOmFjY190Y2dh,VENHQS1QSy1BNUhDOmFjY190Y2dh';
            assert.equal(
                await browser.execute(function() {
                    return frontendOnc.getIdOrder().join(',');
                }),
                patient_id_order,
                'patient id order'
            );

            // = false
            await goToUrlAndSetLocalStorage(
                CBIOPORTAL_URL +
                    '/index.do?cancer_study_id=acc_tcga&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&show_samples=false&data_priority=0&case_set_id=acc_tcga_cnaseq&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic'
            );

            await waitForOncoprint();

            assert.equal(
                await browser.execute(function() {
                    return frontendOnc.getIdOrder().join(',');
                }),
                'VENHQS1PUi1BNUpZOmFjY190Y2dh,VENHQS1PUi1BNUo0OmFjY190Y2dh,VENHQS1PUi1BNUpCOmFjY190Y2dh,VENHQS1PUi1BNUoxOmFjY190Y2dh,VENHQS1PUi1BNUoyOmFjY190Y2dh,VENHQS1PUi1BNUozOmFjY190Y2dh,VENHQS1PUi1BNUo1OmFjY190Y2dh,VENHQS1PUi1BNUo2OmFjY190Y2dh,VENHQS1PUi1BNUo3OmFjY190Y2dh,VENHQS1PUi1BNUo4OmFjY190Y2dh,VENHQS1PUi1BNUo5OmFjY190Y2dh,VENHQS1PUi1BNUpBOmFjY190Y2dh,VENHQS1PUi1BNUpDOmFjY190Y2dh,VENHQS1PUi1BNUpEOmFjY190Y2dh,VENHQS1PUi1BNUpFOmFjY190Y2dh,VENHQS1PUi1BNUpGOmFjY190Y2dh,VENHQS1PUi1BNUpHOmFjY190Y2dh,VENHQS1PUi1BNUpIOmFjY190Y2dh,VENHQS1PUi1BNUpJOmFjY190Y2dh,VENHQS1PUi1BNUpKOmFjY190Y2dh,VENHQS1PUi1BNUpLOmFjY190Y2dh,VENHQS1PUi1BNUpMOmFjY190Y2dh,VENHQS1PUi1BNUpNOmFjY190Y2dh,VENHQS1PUi1BNUpPOmFjY190Y2dh,VENHQS1PUi1BNUpQOmFjY190Y2dh,VENHQS1PUi1BNUpROmFjY190Y2dh,VENHQS1PUi1BNUpSOmFjY190Y2dh,VENHQS1PUi1BNUpTOmFjY190Y2dh,VENHQS1PUi1BNUpUOmFjY190Y2dh,VENHQS1PUi1BNUpVOmFjY190Y2dh,VENHQS1PUi1BNUpWOmFjY190Y2dh,VENHQS1PUi1BNUpXOmFjY190Y2dh,VENHQS1PUi1BNUpYOmFjY190Y2dh,VENHQS1PUi1BNUpaOmFjY190Y2dh,VENHQS1PUi1BNUswOmFjY190Y2dh,VENHQS1PUi1BNUsxOmFjY190Y2dh,VENHQS1PUi1BNUsyOmFjY190Y2dh,VENHQS1PUi1BNUszOmFjY190Y2dh,VENHQS1PUi1BNUs0OmFjY190Y2dh,VENHQS1PUi1BNUs1OmFjY190Y2dh,VENHQS1PUi1BNUs2OmFjY190Y2dh,VENHQS1PUi1BNUs4OmFjY190Y2dh,VENHQS1PUi1BNUs5OmFjY190Y2dh,VENHQS1PUi1BNUtCOmFjY190Y2dh,VENHQS1PUi1BNUtPOmFjY190Y2dh,VENHQS1PUi1BNUtQOmFjY190Y2dh,VENHQS1PUi1BNUtROmFjY190Y2dh,VENHQS1PUi1BNUtTOmFjY190Y2dh,VENHQS1PUi1BNUtUOmFjY190Y2dh,VENHQS1PUi1BNUtVOmFjY190Y2dh,VENHQS1PUi1BNUtWOmFjY190Y2dh,VENHQS1PUi1BNUtXOmFjY190Y2dh,VENHQS1PUi1BNUtYOmFjY190Y2dh,VENHQS1PUi1BNUtZOmFjY190Y2dh,VENHQS1PUi1BNUtaOmFjY190Y2dh,VENHQS1PUi1BNUwxOmFjY190Y2dh,VENHQS1PUi1BNUwyOmFjY190Y2dh,VENHQS1PUi1BNUwzOmFjY190Y2dh,VENHQS1PUi1BNUw0OmFjY190Y2dh,VENHQS1PUi1BNUw1OmFjY190Y2dh,VENHQS1PUi1BNUw2OmFjY190Y2dh,VENHQS1PUi1BNUw4OmFjY190Y2dh,VENHQS1PUi1BNUw5OmFjY190Y2dh,VENHQS1PUi1BNUxBOmFjY190Y2dh,VENHQS1PUi1BNUxCOmFjY190Y2dh,VENHQS1PUi1BNUxDOmFjY190Y2dh,VENHQS1PUi1BNUxEOmFjY190Y2dh,VENHQS1PUi1BNUxFOmFjY190Y2dh,VENHQS1PUi1BNUxGOmFjY190Y2dh,VENHQS1PUi1BNUxHOmFjY190Y2dh,VENHQS1PUi1BNUxIOmFjY190Y2dh,VENHQS1PUi1BNUxJOmFjY190Y2dh,VENHQS1PUi1BNUxKOmFjY190Y2dh,VENHQS1PUi1BNUxLOmFjY190Y2dh,VENHQS1PUi1BNUxMOmFjY190Y2dh,VENHQS1PUi1BNUxOOmFjY190Y2dh,VENHQS1PUi1BNUxPOmFjY190Y2dh,VENHQS1PUi1BNUxQOmFjY190Y2dh,VENHQS1PUi1BNUxSOmFjY190Y2dh,VENHQS1PUi1BNUxTOmFjY190Y2dh,VENHQS1PUi1BNUxUOmFjY190Y2dh,VENHQS1PVS1BNVBJOmFjY190Y2dh,VENHQS1QNi1BNU9IOmFjY190Y2dh,VENHQS1QQS1BNVlHOmFjY190Y2dh,VENHQS1QSy1BNUg5OmFjY190Y2dh,VENHQS1QSy1BNUhBOmFjY190Y2dh,VENHQS1QSy1BNUhCOmFjY190Y2dh,VENHQS1QSy1BNUhDOmFjY190Y2dh',
                'patient id order'
            );
        });

        it('should start in sample mode if URL paramter show_samples=true', async () => {
            await goToUrlAndSetLocalStorage(
                CBIOPORTAL_URL +
                    '/index.do?cancer_study_id=acc_tcga&show_samples=true&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=acc_tcga_cnaseq&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic'
            );
            await waitForOncoprint();

            assert.equal(
                await browser.execute(function() {
                    return frontendOnc.getIdOrder().join(',');
                }),
                'VENHQS1PUi1BNUpZLTAxOmFjY190Y2dh,VENHQS1PUi1BNUo0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUpCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUoxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUoyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUozLTAxOmFjY190Y2dh,VENHQS1PUi1BNUo1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo3LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUpBLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpDLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpELTAxOmFjY190Y2dh,VENHQS1PUi1BNUpFLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpGLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpHLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpILTAxOmFjY190Y2dh,VENHQS1PUi1BNUpJLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpKLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpLLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpMLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpNLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpRLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpSLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpULTAxOmFjY190Y2dh,VENHQS1PUi1BNUpVLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpWLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpXLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpYLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpaLTAxOmFjY190Y2dh,VENHQS1PUi1BNUswLTAxOmFjY190Y2dh,VENHQS1PUi1BNUsxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUsyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUszLTAxOmFjY190Y2dh,VENHQS1PUi1BNUs0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUtCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtRLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtULTAxOmFjY190Y2dh,VENHQS1PUi1BNUtVLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtWLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtXLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtYLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtZLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtaLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwzLTAxOmFjY190Y2dh,VENHQS1PUi1BNUw0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUxBLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxDLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxELTAxOmFjY190Y2dh,VENHQS1PUi1BNUxFLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxGLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxHLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxILTAxOmFjY190Y2dh,VENHQS1PUi1BNUxJLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxKLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxLLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxMLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxOLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxSLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxULTAxOmFjY190Y2dh,VENHQS1PVS1BNVBJLTAxOmFjY190Y2dh,VENHQS1QNi1BNU9ILTAxOmFjY190Y2dh,VENHQS1QQS1BNVlHLTAxOmFjY190Y2dh,VENHQS1QSy1BNUg5LTAxOmFjY190Y2dh,VENHQS1QSy1BNUhBLTAxOmFjY190Y2dh,VENHQS1QSy1BNUhCLTAxOmFjY190Y2dh,VENHQS1QSy1BNUhDLTAxOmFjY190Y2dh',
                'sample id order'
            );
        });

        it('should start successfully if a specified clinical track doesnt exist', async () => {
            await goToUrlAndSetLocalStorage(
                CBIOPORTAL_URL +
                    '/index.do?cancer_study_id=acc_tcga&show_samples=true&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=acc_tcga_cnaseq&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic&clinicallist=asodifjpaosidjfa'
            );
            await waitForOncoprint();

            assert.equal(
                await browser.execute(function() {
                    return frontendOnc.getIdOrder().join(',');
                }),
                'VENHQS1PUi1BNUpZLTAxOmFjY190Y2dh,VENHQS1PUi1BNUo0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUpCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUoxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUoyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUozLTAxOmFjY190Y2dh,VENHQS1PUi1BNUo1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo3LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUpBLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpDLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpELTAxOmFjY190Y2dh,VENHQS1PUi1BNUpFLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpGLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpHLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpILTAxOmFjY190Y2dh,VENHQS1PUi1BNUpJLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpKLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpLLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpMLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpNLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpRLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpSLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpULTAxOmFjY190Y2dh,VENHQS1PUi1BNUpVLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpWLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpXLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpYLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpaLTAxOmFjY190Y2dh,VENHQS1PUi1BNUswLTAxOmFjY190Y2dh,VENHQS1PUi1BNUsxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUsyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUszLTAxOmFjY190Y2dh,VENHQS1PUi1BNUs0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUtCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtRLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtULTAxOmFjY190Y2dh,VENHQS1PUi1BNUtVLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtWLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtXLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtYLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtZLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtaLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwzLTAxOmFjY190Y2dh,VENHQS1PUi1BNUw0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUxBLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxDLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxELTAxOmFjY190Y2dh,VENHQS1PUi1BNUxFLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxGLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxHLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxILTAxOmFjY190Y2dh,VENHQS1PUi1BNUxJLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxKLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxLLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxMLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxOLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxSLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxULTAxOmFjY190Y2dh,VENHQS1PVS1BNVBJLTAxOmFjY190Y2dh,VENHQS1QNi1BNU9ILTAxOmFjY190Y2dh,VENHQS1QQS1BNVlHLTAxOmFjY190Y2dh,VENHQS1QSy1BNUg5LTAxOmFjY190Y2dh,VENHQS1QSy1BNUhBLTAxOmFjY190Y2dh,VENHQS1QSy1BNUhCLTAxOmFjY190Y2dh,VENHQS1QSy1BNUhDLTAxOmFjY190Y2dh',
                'sample id order'
            );

            assert.equal(
                await browser.execute(function() {
                    return frontendOnc.model.getTracks().length;
                }),
                3,
                'gene tracks should exist'
            );
        });

        it('should start successfully if a specified clinical track doesnt exist, but others do', async () => {
            await goToUrlAndSetLocalStorage(
                CBIOPORTAL_URL +
                    '/index.do?cancer_study_id=acc_tcga&show_samples=true&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=acc_tcga_cnaseq&gene_list=KRAS%2520NRAS%2520BRAF&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_gistic&clinicallist=CANCER_TYPE,asodifjpaosidjfa,CANCER_TYPE_DETAILED,FRACTION_GENOME_ALTERED,aposdijfpoai,MUTATION_COUNT'
            );
            await waitForOncoprint();
            await browser.pause(2000);

            assert.equal(
                await browser.execute(function() {
                    return frontendOnc.getIdOrder().join(',');
                }),
                'VENHQS1PUi1BNUpZLTAxOmFjY190Y2dh,VENHQS1PUi1BNUo0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUpCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUoxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUoyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUozLTAxOmFjY190Y2dh,VENHQS1PUi1BNUo1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo3LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUo5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUpBLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpDLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpELTAxOmFjY190Y2dh,VENHQS1PUi1BNUpFLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpGLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpHLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpILTAxOmFjY190Y2dh,VENHQS1PUi1BNUpJLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpKLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpLLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpMLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpNLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpRLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpSLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpULTAxOmFjY190Y2dh,VENHQS1PUi1BNUpVLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpWLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpXLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpYLTAxOmFjY190Y2dh,VENHQS1PUi1BNUpaLTAxOmFjY190Y2dh,VENHQS1PUi1BNUswLTAxOmFjY190Y2dh,VENHQS1PUi1BNUsxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUsyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUszLTAxOmFjY190Y2dh,VENHQS1PUi1BNUs0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUs5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUtCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtRLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtULTAxOmFjY190Y2dh,VENHQS1PUi1BNUtVLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtWLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtXLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtYLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtZLTAxOmFjY190Y2dh,VENHQS1PUi1BNUtaLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwxLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwyLTAxOmFjY190Y2dh,VENHQS1PUi1BNUwzLTAxOmFjY190Y2dh,VENHQS1PUi1BNUw0LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw1LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw2LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw4LTAxOmFjY190Y2dh,VENHQS1PUi1BNUw5LTAxOmFjY190Y2dh,VENHQS1PUi1BNUxBLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxCLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxDLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxELTAxOmFjY190Y2dh,VENHQS1PUi1BNUxFLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxGLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxHLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxILTAxOmFjY190Y2dh,VENHQS1PUi1BNUxJLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxKLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxLLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxMLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxOLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxPLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxQLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxSLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxTLTAxOmFjY190Y2dh,VENHQS1PUi1BNUxULTAxOmFjY190Y2dh,VENHQS1PVS1BNVBJLTAxOmFjY190Y2dh,VENHQS1QNi1BNU9ILTAxOmFjY190Y2dh,VENHQS1QQS1BNVlHLTAxOmFjY190Y2dh,VENHQS1QSy1BNUg5LTAxOmFjY190Y2dh,VENHQS1QSy1BNUhBLTAxOmFjY190Y2dh,VENHQS1QSy1BNUhCLTAxOmFjY190Y2dh,VENHQS1QSy1BNUhDLTAxOmFjY190Y2dh',
                'sample id order'
            );

            assert.equal(
                await browser.execute(function() {
                    return frontendOnc.model.getTracks().length;
                }),
                7,
                'gene tracks and existing clinical tracks should exist'
            );
        });
    });

    describe('heatmap clustering', () => {
        it('track group options UI reflects clustered state correctly', async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/oncoprint?Z_SCORE_THRESHOLD=2.0&cancer_study_id=coadread_tcga_pub&cancer_study_list=coadread_tcga_pub&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF&gene_set_choice=user-defined-list&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&heatmap_track_groups=coadread_tcga_pub_rna_seq_mrna_median_Zscores%2CKRAS%2CNRAS%2CBRAF%3Bcoadread_tcga_pub_methylation_hm27%2CKRAS%2CNRAS%2CBRAF&show_samples=false`
            );

            await waitForOncoprint();

            const FONT_WEIGHT_NORMAL = 400;
            const FONT_WEIGHT_BOLD = 700;

            // Open mrna track group menu
            let mrnaElements = await getGroupHeaderOptionsElements(2);
            await setDropdownOpen(
                true,
                mrnaElements.button_selector,
                mrnaElements.dropdown_selector
            );

            await waitForElementDisplayed(
                mrnaElements.dropdown_selector + ' li:nth-child(1)'
            );

            // Confirm that 'Dont cluster' is bolded, reflecting current unclustered state
            assert.equal(
                (
                    await getCSSProperty(
                        mrnaElements.dropdown_selector + ' li:nth-child(1)',
                        'font-weight'
                    )
                ).value,
                FONT_WEIGHT_NORMAL
            );
            assert.equal(
                (
                    await getCSSProperty(
                        mrnaElements.dropdown_selector + ' li:nth-child(2)',
                        'font-weight'
                    )
                ).value,
                FONT_WEIGHT_BOLD
            );

            // Cluster
            await clickElement(
                mrnaElements.dropdown_selector + ' li:nth-child(1)'
            ); // Click Cluster
            await browser.pause(500); // give it time to sort

            // Open menu again, which may have closed

            mrnaElements = await getGroupHeaderOptionsElements(2);

            await setDropdownOpen(
                true,
                mrnaElements.button_selector,
                mrnaElements.dropdown_selector
            );

            // Confirm that 'Cluster' is bolded, reflecting current clustered state
            assert.equal(
                (
                    await getCSSProperty(
                        mrnaElements.dropdown_selector + ' li:nth-child(1)',
                        'font-weight'
                    )
                ).value,
                FONT_WEIGHT_BOLD
            );

            await setDropdownOpen(
                true,
                mrnaElements.button_selector,
                mrnaElements.dropdown_selector
            );

            assert.equal(
                (
                    await getCSSProperty(
                        mrnaElements.dropdown_selector + ' li:nth-child(2)',
                        'font-weight'
                    )
                ).value,
                FONT_WEIGHT_NORMAL
            );

            await setDropdownOpen(
                true,
                mrnaElements.button_selector,
                mrnaElements.dropdown_selector
            );

            // Uncluster
            clickElement(mrnaElements.dropdown_selector + ' li:nth-child(2)'); // Click Don't clsuter
            await browser.pause(500); // give it time to sort

            mrnaElements = await getGroupHeaderOptionsElements(2);
            // Open menu again, which may have closed
            await setDropdownOpen(
                true,
                mrnaElements.button_selector,
                mrnaElements.dropdown_selector
            );
            // Confirm that 'Don't cluster' is bolded, reflecting current unclustered state
            assert.equal(
                (
                    await getCSSProperty(
                        mrnaElements.dropdown_selector + ' li:nth-child(1)',
                        'font-weight'
                    )
                ).value,
                FONT_WEIGHT_NORMAL
            );

            await setDropdownOpen(
                true,
                mrnaElements.button_selector,
                mrnaElements.dropdown_selector
            );

            assert.equal(
                (
                    await getCSSProperty(
                        mrnaElements.dropdown_selector + ' li:nth-child(2)',
                        'font-weight'
                    )
                ).value,
                FONT_WEIGHT_BOLD
            );
        });
    });

    describe('mutation annotation', () => {
        let resultsPageSettingsDropdown;
        let oncoKbCheckbox;
        let hotspotsCheckbox;

        before(async () => {
            await goToUrlAndSetLocalStorage(
                CBIOPORTAL_URL +
                    '/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=coadread_tcga_pub_cna_seq&gene_list=FBXW7&geneset_list=+&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations'
            );
            await waitForOncoprint();

            resultsPageSettingsDropdown =
                'div[data-test="GlobalSettingsDropdown"]';

            oncoKbCheckbox =
                resultsPageSettingsDropdown +
                ' input[data-test="annotateOncoKb"]';
            hotspotsCheckbox =
                resultsPageSettingsDropdown +
                ' input[data-test="annotateHotspots"]';
        });
    });

    describe('germline mutation', () => {
        it('should sort germline mutation in study ov_tcga_pub', async () => {
            // search for study with germline mutation (ov_tcga_pub)
            await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
            const inputSelector =
                'div[data-test=study-search] input[type="text"]';
            await getElement(inputSelector, { timeout: 10000 });
            await setInputText(
                inputSelector,
                'ovarian serous cystadenocarcinoma tcga nature 2011'
            );
            await waitForNumberOfStudyCheckboxes(1);

            // select it
            await getElement('[data-test="StudySelect"]', { timeout: 10000 });
            await clickElement('[data-test="StudySelect"] input');

            await clickQueryByGeneButton();

            // query with BRCA1
            await setInputText('[data-test="geneSet"]', 'BRCA1');

            await (
                await getElement('[data-test="queryButton"]')
            ).waitForEnabled({ timeout: 30000 });
            await (
                await getElement('[data-test="queryButton"]')
            ).scrollIntoView();
            await clickElement('[data-test="queryButton"]');

            await waitForOncoprint();

            // All patient/samples with germline mutation should be displayed first
            // ====================================================================
            // check if patient are sorted
            assert.equal(
                await browser.execute(function() {
                    return frontendOnc.getIdOrder().join(',');
                }),
                'VENHQS0zMS0xOTU5Om92X3RjZ2FfcHVi,VENHQS0yMy0xMTIyOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzU2Om92X3RjZ2FfcHVi,VENHQS0wOS0xNjY5Om92X3RjZ2FfcHVi,VENHQS0wOS0yMDQ1Om92X3RjZ2FfcHVi,VENHQS0wOS0yMDUxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTMxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODgzOm92X3RjZ2FfcHVi,VENHQS0xMy0wODkzOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTAzOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDA4Om92X3RjZ2FfcHVi,VENHQS0xMy0xNTEyOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDI3Om92X3RjZ2FfcHVi,VENHQS0yMy0xMTE4Om92X3RjZ2FfcHVi,VENHQS0yMy0yMDc3Om92X3RjZ2FfcHVi,VENHQS0yMy0yMDc4Om92X3RjZ2FfcHVi,VENHQS0yMy0yMDc5Om92X3RjZ2FfcHVi,VENHQS0yMy0yMDgxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDcwOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjk4Om92X3RjZ2FfcHVi,VENHQS0yNS0yMzkyOm92X3RjZ2FfcHVi,VENHQS0yNS0yNDAxOm92X3RjZ2FfcHVi,VENHQS01Ny0xNTgyOm92X3RjZ2FfcHVi,VENHQS01OS0yMzQ4Om92X3RjZ2FfcHVi,VENHQS02MS0yMDA4Om92X3RjZ2FfcHVi,VENHQS02MS0yMTA5Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzU3Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzMwOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDg5Om92X3RjZ2FfcHVi,VENHQS0yMy0xMDI2Om92X3RjZ2FfcHVi,VENHQS0yNC0yMDM1Om92X3RjZ2FfcHVi,VENHQS0yNS0xNjI1Om92X3RjZ2FfcHVi,VENHQS0yNS0xNjMwOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjMyOm92X3RjZ2FfcHVi,VENHQS0yOS0yNDI3Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDk0Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzYxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODA0Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzMxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzMyOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzM2Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzM3Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzM4Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzQyOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzQzOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzQ2Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzQ3Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzQ4Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzQ5Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzUwOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzYxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzYyOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzY0Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzY1Om92X3RjZ2FfcHVi,VENHQS0wNC0xMzY3Om92X3RjZ2FfcHVi,VENHQS0wNC0xNTE0Om92X3RjZ2FfcHVi,VENHQS0wNC0xNTE3Om92X3RjZ2FfcHVi,VENHQS0wNC0xNTI1Om92X3RjZ2FfcHVi,VENHQS0wNC0xNTMwOm92X3RjZ2FfcHVi,VENHQS0wNC0xNTQyOm92X3RjZ2FfcHVi,VENHQS0wOS0wMzY2Om92X3RjZ2FfcHVi,VENHQS0wOS0wMzY5Om92X3RjZ2FfcHVi,VENHQS0wOS0xNjU5Om92X3RjZ2FfcHVi,VENHQS0wOS0xNjYxOm92X3RjZ2FfcHVi,VENHQS0wOS0xNjYyOm92X3RjZ2FfcHVi,VENHQS0wOS0xNjY1Om92X3RjZ2FfcHVi,VENHQS0wOS0xNjY2Om92X3RjZ2FfcHVi,VENHQS0wOS0yMDQ0Om92X3RjZ2FfcHVi,VENHQS0wOS0yMDQ5Om92X3RjZ2FfcHVi,VENHQS0wOS0yMDUwOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDUzOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDU2Om92X3RjZ2FfcHVi,VENHQS0xMC0wOTI2Om92X3RjZ2FfcHVi,VENHQS0xMC0wOTI3Om92X3RjZ2FfcHVi,VENHQS0xMC0wOTI4Om92X3RjZ2FfcHVi,VENHQS0xMC0wOTMwOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTMzOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTM0Om92X3RjZ2FfcHVi,VENHQS0xMC0wOTM1Om92X3RjZ2FfcHVi,VENHQS0xMC0wOTM3Om92X3RjZ2FfcHVi,VENHQS0xMC0wOTM4Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzE0Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzE3Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzIwOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzIzOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzI0Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzI2Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzI3Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzUxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzU1Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzYwOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzYyOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzY1Om92X3RjZ2FfcHVi,VENHQS0xMy0wNzkxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzkyOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzkzOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzk1Om92X3RjZ2FfcHVi,VENHQS0xMy0wODAwOm92X3RjZ2FfcHVi,VENHQS0xMy0wODA3Om92X3RjZ2FfcHVi,VENHQS0xMy0wODg0Om92X3RjZ2FfcHVi,VENHQS0xMy0wODg1Om92X3RjZ2FfcHVi,VENHQS0xMy0wODg2Om92X3RjZ2FfcHVi,VENHQS0xMy0wODg3Om92X3RjZ2FfcHVi,VENHQS0xMy0wODg5Om92X3RjZ2FfcHVi,VENHQS0xMy0wODkwOm92X3RjZ2FfcHVi,VENHQS0xMy0wODkxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODk0Om92X3RjZ2FfcHVi,VENHQS0xMy0wODk3Om92X3RjZ2FfcHVi,VENHQS0xMy0wODk5Om92X3RjZ2FfcHVi,VENHQS0xMy0wOTAwOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTA0Om92X3RjZ2FfcHVi,VENHQS0xMy0wOTA1Om92X3RjZ2FfcHVi,VENHQS0xMy0wOTA2Om92X3RjZ2FfcHVi,VENHQS0xMy0wOTEwOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTExOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTEyOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTEzOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTE2Om92X3RjZ2FfcHVi,VENHQS0xMy0wOTE5Om92X3RjZ2FfcHVi,VENHQS0xMy0wOTIwOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTIzOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTI0Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDAzOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDA0Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDA1Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDA3Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDA5Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDEwOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDExOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDEyOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDc3Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDgxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDgyOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDgzOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDg0Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDg3Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDg4Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDkxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDkyOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDk1Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDk2Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDk3Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDk4Om92X3RjZ2FfcHVi,VENHQS0xMy0xNDk5Om92X3RjZ2FfcHVi,VENHQS0xMy0xNTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTA0Om92X3RjZ2FfcHVi,VENHQS0xMy0xNTA1Om92X3RjZ2FfcHVi,VENHQS0xMy0xNTA2Om92X3RjZ2FfcHVi,VENHQS0xMy0xNTA3Om92X3RjZ2FfcHVi,VENHQS0xMy0xNTA5Om92X3RjZ2FfcHVi,VENHQS0xMy0xNTEwOm92X3RjZ2FfcHVi,VENHQS0xMy0yMDYwOm92X3RjZ2FfcHVi,VENHQS0yMC0wOTg3Om92X3RjZ2FfcHVi,VENHQS0yMC0wOTkwOm92X3RjZ2FfcHVi,VENHQS0yMC0wOTkxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDIxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDIyOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDIzOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDI0Om92X3RjZ2FfcHVi,VENHQS0yMy0xMDI4Om92X3RjZ2FfcHVi,VENHQS0yMy0xMDMwOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDMxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDMyOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTEwOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTE2Om92X3RjZ2FfcHVi,VENHQS0yMy0xMTE3Om92X3RjZ2FfcHVi,VENHQS0yMy0xMTIwOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTIzOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTI0Om92X3RjZ2FfcHVi,VENHQS0yMy0yMDcyOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTY2Om92X3RjZ2FfcHVi,VENHQS0yNC0wOTY4Om92X3RjZ2FfcHVi,VENHQS0yNC0wOTcwOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTc1Om92X3RjZ2FfcHVi,VENHQS0yNC0wOTc5Om92X3RjZ2FfcHVi,VENHQS0yNC0wOTgwOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTgyOm92X3RjZ2FfcHVi,VENHQS0yNC0xMTAzOm92X3RjZ2FfcHVi,VENHQS0yNC0xMTA0Om92X3RjZ2FfcHVi,VENHQS0yNC0xMTA1Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDEzOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDE2Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDE3Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDE4Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDE5Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDIyOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDIzOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDI0Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDI1Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDI2Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDI3Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDI4Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDMxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDM0Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDM1Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDM2Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDYzOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDY0Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDY2Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDY5Om92X3RjZ2FfcHVi,VENHQS0yNC0xNDcxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDc0Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTQ0Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTQ1Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTQ4Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTQ5Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTUxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTUyOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTUzOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTU1Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTU2Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTU3Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTU4Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTYwOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTYyOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTYzOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTY0Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTY1Om92X3RjZ2FfcHVi,VENHQS0yNC0xNTY3Om92X3RjZ2FfcHVi,VENHQS0yNC0xNjAzOm92X3RjZ2FfcHVi,VENHQS0yNC0xNjA0Om92X3RjZ2FfcHVi,VENHQS0yNC0xNjE0Om92X3RjZ2FfcHVi,VENHQS0yNC0xNjE2Om92X3RjZ2FfcHVi,VENHQS0yNC0yMDE5Om92X3RjZ2FfcHVi,VENHQS0yNC0yMDI0Om92X3RjZ2FfcHVi,VENHQS0yNC0yMDMwOm92X3RjZ2FfcHVi,VENHQS0yNC0yMDM4Om92X3RjZ2FfcHVi,VENHQS0yNC0yMjU0Om92X3RjZ2FfcHVi,VENHQS0yNC0yMjYwOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjYxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjYyOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjY3Om92X3RjZ2FfcHVi,VENHQS0yNC0yMjcxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjgwOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjgxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjg4Om92X3RjZ2FfcHVi,VENHQS0yNC0yMjg5Om92X3RjZ2FfcHVi,VENHQS0yNC0yMjkwOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjkzOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzEzOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzE1Om92X3RjZ2FfcHVi,VENHQS0yNS0xMzE2Om92X3RjZ2FfcHVi,VENHQS0yNS0xMzE3Om92X3RjZ2FfcHVi,VENHQS0yNS0xMzE4Om92X3RjZ2FfcHVi,VENHQS0yNS0xMzE5Om92X3RjZ2FfcHVi,VENHQS0yNS0xMzIwOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzIxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzIyOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzI0Om92X3RjZ2FfcHVi,VENHQS0yNS0xMzI2Om92X3RjZ2FfcHVi,VENHQS0yNS0xMzI4Om92X3RjZ2FfcHVi,VENHQS0yNS0xMzI5Om92X3RjZ2FfcHVi,VENHQS0yNS0xNjIzOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjI2Om92X3RjZ2FfcHVi,VENHQS0yNS0xNjI3Om92X3RjZ2FfcHVi,VENHQS0yNS0xNjI4Om92X3RjZ2FfcHVi,VENHQS0yNS0xNjMxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjMzOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjM0Om92X3RjZ2FfcHVi,VENHQS0yNS0xNjM1Om92X3RjZ2FfcHVi,VENHQS0yNS0yMDQyOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzkxOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzkzOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzk2Om92X3RjZ2FfcHVi,VENHQS0yNS0yMzk4Om92X3RjZ2FfcHVi,VENHQS0yNS0yMzk5Om92X3RjZ2FfcHVi,VENHQS0yNS0yNDAwOm92X3RjZ2FfcHVi,VENHQS0yNS0yNDA0Om92X3RjZ2FfcHVi,VENHQS0yNS0yNDA4Om92X3RjZ2FfcHVi,VENHQS0yNS0yNDA5Om92X3RjZ2FfcHVi,VENHQS0zMC0xODUzOm92X3RjZ2FfcHVi,VENHQS0zMC0xODYyOm92X3RjZ2FfcHVi,VENHQS0zMC0xODkxOm92X3RjZ2FfcHVi,VENHQS0zMS0xOTUwOm92X3RjZ2FfcHVi,VENHQS0zMS0xOTUzOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTY4Om92X3RjZ2FfcHVi,VENHQS0zNi0xNTY5Om92X3RjZ2FfcHVi,VENHQS0zNi0xNTcwOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTcxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTc0Om92X3RjZ2FfcHVi,VENHQS0zNi0xNTc1Om92X3RjZ2FfcHVi,VENHQS0zNi0xNTc2Om92X3RjZ2FfcHVi,VENHQS0zNi0xNTc3Om92X3RjZ2FfcHVi,VENHQS0zNi0xNTc4Om92X3RjZ2FfcHVi,VENHQS0zNi0xNTgwOm92X3RjZ2FfcHVi,VENHQS01Ny0xNTgzOm92X3RjZ2FfcHVi,VENHQS01Ny0xNTg0Om92X3RjZ2FfcHVi,VENHQS01Ny0xOTkzOm92X3RjZ2FfcHVi,VENHQS01OS0yMzUwOm92X3RjZ2FfcHVi,VENHQS01OS0yMzUxOm92X3RjZ2FfcHVi,VENHQS01OS0yMzUyOm92X3RjZ2FfcHVi,VENHQS01OS0yMzU0Om92X3RjZ2FfcHVi,VENHQS01OS0yMzU1Om92X3RjZ2FfcHVi,VENHQS01OS0yMzYzOm92X3RjZ2FfcHVi,VENHQS02MS0xNzI4Om92X3RjZ2FfcHVi,VENHQS02MS0xNzM2Om92X3RjZ2FfcHVi,VENHQS02MS0xOTE5Om92X3RjZ2FfcHVi,VENHQS02MS0xOTk1Om92X3RjZ2FfcHVi,VENHQS02MS0xOTk4Om92X3RjZ2FfcHVi,VENHQS02MS0yMDAwOm92X3RjZ2FfcHVi,VENHQS02MS0yMDAyOm92X3RjZ2FfcHVi,VENHQS02MS0yMDAzOm92X3RjZ2FfcHVi,VENHQS02MS0yMDA5Om92X3RjZ2FfcHVi,VENHQS02MS0yMDEyOm92X3RjZ2FfcHVi,VENHQS02MS0yMDE2Om92X3RjZ2FfcHVi,VENHQS02MS0yMDg4Om92X3RjZ2FfcHVi,VENHQS02MS0yMDkyOm92X3RjZ2FfcHVi,VENHQS02MS0yMDk0Om92X3RjZ2FfcHVi,VENHQS02MS0yMDk1Om92X3RjZ2FfcHVi,VENHQS02MS0yMDk3Om92X3RjZ2FfcHVi,VENHQS02MS0yMTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMTAyOm92X3RjZ2FfcHVi,VENHQS02MS0yMTA0Om92X3RjZ2FfcHVi,VENHQS02MS0yMTEwOm92X3RjZ2FfcHVi,VENHQS02MS0yMTExOm92X3RjZ2FfcHVi,VENHQS02MS0yMTEzOm92X3RjZ2FfcHVi',
                'patient id order correct'
            );

            await clickElement(
                '.oncoprintContainer .oncoprint__controls #viewDropdownButton'
            ); // open view menu
            await getElement(
                '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="0"]',
                { timeout: 10000 }
            );
            await clickElement(
                '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="0"]'
            ); // go to sample mode

            await waitForOncoprint();

            // check if samples are sorted
            assert.equal(
                await browser.execute(function() {
                    return frontendOnc.getIdOrder().join(',');
                }),
                'VENHQS0zMS0xOTU5LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTIyLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzU2LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0xNjY5LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDQ1LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDUxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTMxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODgzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODkzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTAzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDA4LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTEyLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDI3LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTE4LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0yMDc3LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0yMDc4LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0yMDc5LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0yMDgxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDcwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjk4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzkyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yNDAxLTAxOm92X3RjZ2FfcHVi,VENHQS01Ny0xNTgyLTAxOm92X3RjZ2FfcHVi,VENHQS01OS0yMzQ4LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDA4LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMTA5LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzU3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzMwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDg5LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDI2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMDM1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjI1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjMwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjMyLTAxOm92X3RjZ2FfcHVi,VENHQS0yOS0yNDI3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDk0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzYxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODA0LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzMxLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzMyLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzM2LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzM3LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzM4LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzQyLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzQzLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzQ2LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzQ3LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzQ4LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzQ5LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzUwLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzYxLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzYyLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzY0LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzY1LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xMzY3LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xNTE0LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xNTE3LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xNTI1LTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xNTMwLTAxOm92X3RjZ2FfcHVi,VENHQS0wNC0xNTQyLTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0wMzY2LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0wMzY5LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0xNjU5LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0xNjYxLTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0xNjYyLTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0xNjY1LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0xNjY2LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDQ0LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDQ5LTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDUwLTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDUzLTAxOm92X3RjZ2FfcHVi,VENHQS0wOS0yMDU2LTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTI2LTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTI3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTI4LTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTMwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTMzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTM0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTM1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTM3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMC0wOTM4LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzE0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzE3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzIwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzIzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzI0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzI2LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzI3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzUxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzU1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzYwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzYyLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzY1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzkxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzkyLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzkzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wNzk1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODAwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODA3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODg0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODg1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODg2LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODg3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODg5LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODkwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODkxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODk0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODk3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wODk5LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTAwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTA0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTA1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTA2LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTEwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTExLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTEyLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTEzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTE2LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTE5LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTIwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTIzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0wOTI0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDAzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDA0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDA1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDA3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDA5LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDEwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDExLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDEyLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDc3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDgxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDgyLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDgzLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDg0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDg3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDg4LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDkxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDkyLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDk1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDk2LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDk3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDk4LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNDk5LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTAxLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTA0LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTA1LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTA2LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTA3LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTA5LTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0xNTEwLTAxOm92X3RjZ2FfcHVi,VENHQS0xMy0yMDYwLTAxOm92X3RjZ2FfcHVi,VENHQS0yMC0wOTg3LTAxOm92X3RjZ2FfcHVi,VENHQS0yMC0wOTkwLTAxOm92X3RjZ2FfcHVi,VENHQS0yMC0wOTkxLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDIxLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDIyLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDIzLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDI0LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDI4LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDMwLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDMxLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMDMyLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTEwLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTE2LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTE3LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTIwLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTIzLTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0xMTI0LTAxOm92X3RjZ2FfcHVi,VENHQS0yMy0yMDcyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTY2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTY4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTcwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTc1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTc5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTgwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0wOTgyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xMTAzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xMTA0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xMTA1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDEzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDE2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDE3LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDE4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDE5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDIyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDIzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDI0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDI1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDI2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDI3LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDI4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDMxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDM0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDM1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDM2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDYzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDY0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDY2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDY5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDcxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNDc0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTQ0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTQ1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTQ4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTQ5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTUxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTUyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTUzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTU1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTU2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTU3LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTU4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTYwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTYyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTYzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTY0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTY1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNTY3LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNjAzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNjA0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNjE0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0xNjE2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMDE5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMDI0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMDMwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMDM4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjU0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjYwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjYxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjYyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjY3LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjcxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjgwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjgxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjg4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjg5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjkwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNC0yMjkzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzEzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzE1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzE2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzE3LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzE4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzE5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzIwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzIxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzIyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzI0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzI2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzI4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xMzI5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjIzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjI2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjI3LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjI4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjMxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjMzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjM0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0xNjM1LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yMDQyLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzkxLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzkzLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzk2LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzk4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yMzk5LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yNDAwLTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yNDA0LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yNDA4LTAxOm92X3RjZ2FfcHVi,VENHQS0yNS0yNDA5LTAxOm92X3RjZ2FfcHVi,VENHQS0zMC0xODUzLTAxOm92X3RjZ2FfcHVi,VENHQS0zMC0xODYyLTAxOm92X3RjZ2FfcHVi,VENHQS0zMC0xODkxLTAxOm92X3RjZ2FfcHVi,VENHQS0zMS0xOTUwLTAxOm92X3RjZ2FfcHVi,VENHQS0zMS0xOTUzLTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTY4LTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTY5LTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTcwLTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTcxLTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTc0LTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTc1LTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTc2LTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTc3LTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTc4LTAxOm92X3RjZ2FfcHVi,VENHQS0zNi0xNTgwLTAxOm92X3RjZ2FfcHVi,VENHQS01Ny0xNTgzLTAxOm92X3RjZ2FfcHVi,VENHQS01Ny0xNTg0LTAxOm92X3RjZ2FfcHVi,VENHQS01Ny0xOTkzLTAxOm92X3RjZ2FfcHVi,VENHQS01OS0yMzUwLTAxOm92X3RjZ2FfcHVi,VENHQS01OS0yMzUxLTAxOm92X3RjZ2FfcHVi,VENHQS01OS0yMzUyLTAxOm92X3RjZ2FfcHVi,VENHQS01OS0yMzU0LTAxOm92X3RjZ2FfcHVi,VENHQS01OS0yMzU1LTAxOm92X3RjZ2FfcHVi,VENHQS01OS0yMzYzLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0xNzI4LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0xNzM2LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0xOTE5LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0xOTk1LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0xOTk4LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDAwLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDAyLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDAzLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDA5LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDEyLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDE2LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDg4LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDkyLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDk0LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDk1LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMDk3LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMTAxLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMTAyLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMTA0LTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMTEwLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMTExLTAxOm92X3RjZ2FfcHVi,VENHQS02MS0yMTEzLTAxOm92X3RjZ2FfcHVi',
                'sample id order correct'
            );
        });

        it('should hide germline mutations correctly', async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=ov_tcga_pub&case_set_id=ov_tcga_pub_cna_seq&data_priority=0&gene_list=BRCA1&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=ov_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations&tab_index=tab_visualize`
            );
            await waitForOncoprint();
            let oncoprintDivText = await getText('#oncoprintDiv');
            let legendText = await getTextInOncoprintLegend();
            assert(
                legendText.indexOf('Germline Mutation') > -1,
                'by default, there are germline mutations'
            );
            assert(
                oncoprintDivText.indexOf('12%') > -1,
                'by default, 12% altered'
            );

            await setSettingsMenuOpen(true);
            const hideGermlineButton = 'input[data-test="HideGermline"]';
            await waitForElementDisplayed(hideGermlineButton, {
                timeout: 1000,
            });
            await clickElement(hideGermlineButton);
            await waitForOncoprint();
            legendText = await getTextInOncoprintLegend();
            oncoprintDivText = await getText('#oncoprintDiv');
            assert(
                legendText.indexOf('Germline Mutation') === -1,
                'now, there are no germline mutations'
            );
            assert(oncoprintDivText.indexOf('4%') > -1, 'now, 4% altered');

            await setSettingsMenuOpen(true);
            await waitForElementDisplayed(hideGermlineButton, {
                timeout: 1000,
            });
            await clickElement(hideGermlineButton);
            await waitForOncoprint();
            legendText = await getTextInOncoprintLegend();
            oncoprintDivText = await getText('#oncoprintDiv');
            assert(
                legendText.indexOf('Germline Mutation') > -1,
                'germline mutations are back now'
            );
            assert(oncoprintDivText.indexOf('12%') > -1, '12% altered again');
        });

        it('should not color by germline mutations, if that setting is chosen', async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=ov_tcga_pub&case_set_id=ov_tcga_pub_cna_seq&data_priority=0&gene_list=BRCA1&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=ov_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=ov_tcga_pub_mutations&tab_index=tab_visualize`
            );
            await waitForOncoprint();
            let legendText = await getTextInOncoprintLegend();
            let oncoprintDivText = await getText('#oncoprintDiv');
            assert(
                legendText.indexOf('Germline Mutation') > -1,
                'by default, there are germline mutations'
            );
            assert(oncoprintDivText.indexOf('12%') > -1, '12% altered');

            await setOncoprintMutationsMenuOpen(true);
            const colorByGermline = 'input[data-test="ColorByGermline"]';
            await waitForElementDisplayed(colorByGermline, { timeout: 1000 });
            await clickElement(colorByGermline);
            await waitForOncoprint();
            legendText = await getTextInOncoprintLegend();
            oncoprintDivText = await getText('#oncoprintDiv');
            assert(
                legendText.indexOf('Germline Mutation') === -1,
                'now, there are no germline mutations'
            );
            assert(oncoprintDivText.indexOf('12%') > -1, 'still 12% altered');

            await setOncoprintMutationsMenuOpen(true);
            await waitForElementDisplayed(colorByGermline, { timeout: 1000 });
            await clickElement(colorByGermline);
            await waitForOncoprint();
            legendText = await getTextInOncoprintLegend();
            oncoprintDivText = await getText('#oncoprintDiv');
            assert(
                legendText.indexOf('Germline Mutation') > -1,
                'germline mutations are back now'
            );
            assert(
                oncoprintDivText.indexOf('12%') > -1,
                'still still 12% altered'
            );
        });
    });

    describe('custom case list sorting', () => {
        it('should sort patients and samples by custom case list order correctly', async () => {
            async function doCustomCaseOrderTest() {
                // now we're on results page
                await waitForOncoprint(100000);

                // make sure we are in sample mode
                await clickElement(
                    '.oncoprintContainer .oncoprint__controls #viewDropdownButton'
                ); // open view menu
                await waitForElementDisplayed(
                    '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="1"]',
                    { timeout: 10000 }
                );
                await clickElement(
                    '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="1"]'
                ); // go to sample mode

                await waitForOncoprint();

                await clickElement('#sortDropdown');
                await waitForElementDisplayed(
                    '[data-test="oncoprintSortDropdownMenu"] input[data-test="caseList"]'
                );
                await clickElement(
                    '[data-test="oncoprintSortDropdownMenu"] input[data-test="caseList"]'
                );
                await browser.pause(100); // allow to sort

                assert.equal(
                    await browser.execute(function() {
                        return frontendOnc.getIdOrder().join(',');
                    }),
                    'VENHQS1BQS0zOTcxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1PUi1BNUpDOmFjY190Y2dh,VENHQS1PUi1BNUoyOmFjY190Y2dh,VENHQS1BQS1BMDBROmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1DTS00NzQ4OmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1PUi1BNUpEOmFjY190Y2dh,VENHQS1PUi1BNUozOmFjY190Y2dh',
                    'sorted patient order correct'
                );

                await clickElement(
                    '.oncoprintContainer .oncoprint__controls #viewDropdownButton'
                ); // open view menu
                await waitForElementDisplayed(
                    '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="0"]',
                    { timeout: 10000 }
                );
                await clickElement(
                    '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="0"]'
                ); // go to sample mode
                await waitForOncoprint();

                assert.equal(
                    await browser.execute(function() {
                        return frontendOnc.getIdOrder().join(',');
                    }),
                    'VENHQS1BQS0zOTcxLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1PUi1BNUpDLTAxOmFjY190Y2dh,VENHQS1PUi1BNUoyLTAxOmFjY190Y2dh,VENHQS1BQS1BMDBRLTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1DTS00NzQ4LTAxOmNvYWRyZWFkX3RjZ2FfcHVi,VENHQS1PUi1BNUpELTAxOmFjY190Y2dh,VENHQS1PUi1BNUozLTAxOmFjY190Y2dh',
                    'sorted sample order correct'
                );
            }

            await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
            await browser.pause(5000);

            // select Colorectal TCGA and Adrenocortical Carcinoma TCGA
            const inputSelector =
                'div[data-test=study-search] input[type="text"]';
            await (await getElement(inputSelector)).waitForDisplayed({
                timeout: 100000,
            });
            await setInputText(inputSelector, 'colorectal tcga nature');
            await waitForNumberOfStudyCheckboxes(1);
            await getElement('[data-test="StudySelect"]', { timeout: 10000 });
            await clickElement('[data-test="StudySelect"] input');

            await setInputText(
                inputSelector,
                'adrenocortical carcinoma tcga firehose legacy'
            );
            await waitForNumberOfStudyCheckboxes(
                1,
                'Adrenocortical Carcinoma (TCGA, Firehose Legacy)'
            );

            await (
                await getElement('[data-test="StudySelect"]')
            ).waitForDisplayed();
            await browser.pause(1000); // let things trigger
            await clickElement('[data-test="StudySelect"] input');

            await clickQueryByGeneButton();

            await browser.pause(10000); // let things trigger
            const molecularProfileSelector = await getElement(
                '[data-test="molecularProfileSelector"]',
                {
                    timeout: 20000,
                }
            );

            await molecularProfileSelector.waitForExist({ timeout: 10000 });
            // Check for the "Mutations" checkbox
            const mutationsLabel = await molecularProfileSelector.$(
                'label*=Mutations'
            );
            const mutationsCheckbox = await mutationsLabel.$(
                'input[type="checkbox"]'
            );
            await mutationsCheckbox.waitForExist({ timeout: 20000 });

            // Check for the "Putative copy-number alterations from GISTIC" checkbox
            const alterationsLabel = await molecularProfileSelector.$(
                'label*=Putative copy-number alterations from GISTIC'
            );
            await alterationsLabel.waitForExist({ timeout: 10000 });
            const alterationsCheckbox = await alterationsLabel.$(
                'input[type="checkbox"]'
            );
            await alterationsCheckbox.waitForExist({ timeout: 10000 });

            // select custom case list
            const caseSetSelector = await getElement(
                '[data-test="CaseSetSelector"] .Select-input input',
                { timeout: 10000 }
            );
            await caseSetSelector.setValue('User-defined Case List');
            await clickElement('[data-test="CaseSetSelector"] .Select-option');

            const caseInput = await getElement(
                '[data-test="CustomCaseSetInput"]',
                { timeout: 10000 }
            );
            await caseInput.setValue(
                'coadread_tcga_pub:TCGA-AA-3971-01\n' +
                    'acc_tcga:TCGA-OR-A5JC-01\n' +
                    'acc_tcga:TCGA-OR-A5J2-01\n' +
                    'coadread_tcga_pub:TCGA-AA-A00Q-01\n' +
                    'coadread_tcga_pub:TCGA-CM-4748-01\n' +
                    'acc_tcga:TCGA-OR-A5JD-01\n' +
                    'acc_tcga:TCGA-OR-A5J3-01'
            );

            await setInputText(
                '[data-test="geneSet"]',
                'DKK2 KRAS BCL2L1 RASA1 HLA-B RRAGC'
            );
            await (
                await getElement('[data-test="queryButton"]')
            ).waitForEnabled({ timeout: 30000 });
            await clickElement('[data-test="queryButton"]');

            await doCustomCaseOrderTest();

            // change genes and resubmit
            await clickElement('button#modifyQueryBtn');
            await waitForElementDisplayed('textarea[data-test="geneSet"]', {
                timeout: 10000,
            });
            await setInputText('textarea[data-test="geneSet"]', 'TP53');
            await browser.pause(100); // let things trigger
            await (
                await getElement('[data-test="queryButton"]')
            ).waitForEnabled({ timeout: 30000 });
            await clickElement('button[data-test="queryButton"]');
            await browser.pause(100); // wait for query to submit
            // go to oncoprint tab
            await getElement('a.tabAnchor_oncoprint', { timeout: 10000 });
            await clickElement('a.tabAnchor_oncoprint');

            // run same test again
            await doCustomCaseOrderTest();
        });
    });

    describe('only show clinical legends for altered cases', function() {
        const checkboxSelector =
            '.oncoprintContainer .oncoprint__controls input[type="checkbox"][data-test="onlyShowClinicalLegendsForAltered"]';
        it('only shows legend items for cases which are altered', async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=-1&case_ids=coadread_tcga_pub%3ATCGA-AA-A00D-01%2Bcoadread_tcga_pub%3ATCGA-A6-2677-01&gene_list=BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&show_samples=false&clinicallist=SEX`
            );
            await waitForOncoprint();
            let legendText = await getTextInOncoprintLegend();
            assert(legendText.indexOf('Male') > -1, 'a patient is male');
            assert(legendText.indexOf('Female') > -1, 'a patient is female');

            await clickElement(
                '.oncoprintContainer .oncoprint__controls #viewDropdownButton'
            ); // open view menu
            await getElement(checkboxSelector, { timeout: 1000 });
            await clickElement(checkboxSelector); // turn off legend for unaltered cases
            await waitForOncoprint(); // wait for oncoprint to reset
            legendText = await getTextInOncoprintLegend();
            assert(legendText.indexOf('Male') > -1, 'altered patient is male');
            assert(
                legendText.indexOf('Female') === -1,
                'altered patient is not female'
            );

            await clickElement(
                '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="0"]'
            ); // go to sample mode
            await waitForOncoprint(); // wait for oncoprint to reset
            legendText = await getTextInOncoprintLegend();
            assert(legendText.indexOf('Male') > -1, 'altered sample is male');
            assert(
                legendText.indexOf('Female') === -1,
                'altered sample is not female'
            );

            await clickElement(checkboxSelector); // turn back on legend for unaltered cases
            await waitForOncoprint(); // wait for oncoprint to reset
            legendText = await getTextInOncoprintLegend();
            assert(legendText.indexOf('Male') > -1, 'a sample is male');
            assert(legendText.indexOf('Female') > -1, 'a sample is female');
        });
        it('does not show a legend when no altered cases', async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/index.do?cancer_study_id=coadread_tcga_pub&Z_SCORE_THRESHOLD=2&RPPA_SCORE_THRESHOLD=2&data_priority=0&case_set_id=-1&case_ids=coadread_tcga_pub%3ATCGA-A6-2677-01&gene_list=BRAF&geneset_list=%20&tab_index=tab_visualize&Action=Submit&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&show_samples=false&clinicallist=SEX`
            );
            await waitForOncoprint();
            let legendText = await getTextInOncoprintLegend();
            assert(
                legendText.indexOf('Sex') > -1,
                'Sex legend is shown (in patient mode)'
            );
            assert(
                legendText.indexOf('Female') > -1,
                'Female item is shown (in patient mode)'
            );

            await clickElement(
                '.oncoprintContainer .oncoprint__controls #viewDropdownButton'
            ); // open view menu
            await getElement(checkboxSelector, { timeout: 1000 });
            await clickElement(checkboxSelector); // turn off legend for unaltered cases
            await waitForOncoprint(); // wait for oncoprint to reset
            legendText = await getTextInOncoprintLegend();
            assert(
                legendText.indexOf('Sex') === -1,
                'Sex legend is not shown (in patient mode)'
            );
            assert(
                legendText.indexOf('Female') === -1,
                'Female item is not shown (in patient mode)'
            );

            await clickElement(
                '.oncoprintContainer .oncoprint__controls input[type="radio"][name="columnType"][value="0"]'
            ); // go to sample mode
            await waitForOncoprint(); // wait for oncoprint to reset
            legendText = await getTextInOncoprintLegend();
            assert(
                legendText.indexOf('Sex') === -1,
                'Sex legend is not shown (in sample mode)'
            );
            assert(
                legendText.indexOf('Female') === -1,
                'Female item is not shown (in sample mode)'
            );

            await clickElement(checkboxSelector); // turn back on legend for unaltered cases
            await waitForOncoprint(); // wait for oncoprint to reset
            legendText = await getTextInOncoprintLegend();
            assert(
                legendText.indexOf('Sex') > -1,
                'Sex legend is shown (in sample mode)'
            );
            assert(
                legendText.indexOf('Female') > -1,
                'Female item is shown (in sample mode)'
            );
        });
    });
});
