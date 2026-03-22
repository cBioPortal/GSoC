const {
    checkOncoprintElement,
    setDropdownOpen,
    waitForOncoprint,
    goToUrlAndSetLocalStorage,
    getNthOncoprintTrackOptionsElements,
    clickElement,
} = require('../../../shared/specUtils_Async');

const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('oncoprint gap screenshot tests', () => {
    before(async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/results/oncoprint?cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_cna&gene_list=BCHE%252CCDK8%252CCTBP1%252CACKR3&gene_set_choice=user-defined-list&&clinicallist=SEX,CANCER_TYPE_DETAILED&profileFilter=mutations%2Cgistic&geneset_list=%20&tab_index=tab_visualize&Action=Submit`
        );
        await waitForOncoprint();
    });
    it('shows gaps for sex track with correct subgroup percentages', async () => {
        const sexElements = await getNthOncoprintTrackOptionsElements(1);
        await setDropdownOpen(
            true,
            sexElements.button_selector,
            sexElements.dropdown_selector,
            'Failed to open sex track menu'
        );
        await clickElement(`${sexElements.dropdown_selector} li:nth-child(10)`); // Click "show gaps"
        await browser.pause(100); // give time to sort and insert gaps

        await waitForOncoprint();

        await clickElement('.oncoprint__zoom-controls .fa-search-minus');
        await clickElement('.oncoprint__zoom-controls .fa-search-minus');

        await browser.pause(100); // give time to rezoom

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });

    it('hierarchical sorting when two tracks have enabled gaps', async () => {
        const cancerTypeDetailedElements = await getNthOncoprintTrackOptionsElements(
            2
        );
        await setDropdownOpen(
            true,
            cancerTypeDetailedElements.button_selector,
            cancerTypeDetailedElements.dropdown_selector,
            'Failed to open cancer type detailed track menu'
        );
        await clickElement(
            `${cancerTypeDetailedElements.dropdown_selector} li:nth-child(10)`
        ); // Click "show gaps"
        await browser.pause(100); // give time to sort and insert gaps

        await waitForOncoprint();

        const res = await checkOncoprintElement('.oncoprintContainer');
        assertScreenShotMatch(res);
    });
});
