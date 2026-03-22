const assert = require('assert');

const {
    getElement,
    goToUrlAndSetLocalStorage,
    waitForNetworkQuiet,
    getElementByTestHandle,
    setServerConfiguration,
    clickElement,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const expressionDataAvailable = async () => {
    return (
        await getElement(
            'span=mRNA Expression. Select one of the profiles below:'
        )
    ).isExisting();
};

describe('plots tab expression data with rule configuration', function() {
    before(async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        await setServerConfiguration({
            enable_cross_study_expression: `
                (studies)=>studies.filter(s=>/pan_can_atlas/.test(s.studyId) === false).length === 0
            `,
        });
    });

    it('For multi study query, if all studies are pan_can then we CAN compare expression in plots', async () => {
        const url = `/results/plots?cancer_study_list=acc_tcga_pan_can_atlas_2018%2Cchol_tcga_pan_can_atlas_2018&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cstructural_variants%2Cgistic&case_set_id=all&gene_list=CDKN2A%2520MDM2&geneset_list=%20&tab_index=tab_visualize&Action=Submit`;
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL + url);

        await waitForNetworkQuiet();
        await clickElement('.Select-arrow-zone');
        await (await getElement('.Select-option')).waitForExist();
        await (await getElement('.Select-option=mRNA')).isExisting();

        assert.equal(
            await (
                await getElement(
                    'div=Expression data cannot be compared across the selected studies.'
                )
            ).isExisting(),
            false
        );
    });

    it('For multi study query that is NOT all pan_can, no expression data in plots', async () => {
        const url = `/results/plots?cancer_study_list=acc_tcga_pan_can_atlas_2018%2Cchol_tcga&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cstructural_variants%2Cgistic&case_set_id=all&gene_list=CDKN2A%2520MDM2&geneset_list=%20&tab_index=tab_visualize&Action=Submit`;
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL + url);
        await waitForNetworkQuiet();
        await clickElement('.Select-arrow-zone');
        await (await getElement('.Select-option=Mutation')).waitForExist();
        assert.equal(
            await (await getElement('.Select-option=mRNA')).isExisting(),
            false
        );

        assert.equal(
            await (
                await getElement(
                    'div=Expression data cannot be compared across the selected studies.'
                )
            ).isExisting(),
            true
        );
    });

    it('For single study, NOT pan_can, there is expression available in plots', async () => {
        const url = `/results/plots?cancer_study_list=chol_tcga&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cstructural_variants%2Cgistic&case_set_id=all&gene_list=CDKN2A%2520MDM2&geneset_list=%20&tab_index=tab_visualize&Action=Submit`;
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL + url);
        await waitForNetworkQuiet();
        await clickElement('.Select-arrow-zone');
        await (await getElement('.Select-option=Mutation')).waitForExist();
        assert.equal(
            await (await getElement('.Select-option=mRNA')).isExisting(),
            true
        );

        assert.equal(
            await (
                await getElement(
                    'div=Expression data cannot be compared across the selected studies.'
                )
            ).isExisting(),
            false
        );
    });
});

describe('plots tab expression data without rule configuration', function() {
    before(async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        await setServerConfiguration({
            enable_cross_study_expression: undefined,
        });
    });

    it('for multi study query that is NOT all pan_can, expression data is NOT available in plots', async () => {
        const url = `/results/plots?cancer_study_list=acc_tcga_pan_can_atlas_2018%2Cchol_tcga&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cstructural_variants%2Cgistic&case_set_id=all&gene_list=CDKN2A%2520MDM2&geneset_list=%20&tab_index=tab_visualize&Action=Submit`;
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL + url);
        await waitForNetworkQuiet();

        await browser.execute(() => {
            window.globalStores.appStore.serverConfig.enable_cross_study_expression = undefined;
        });

        await clickElement('.Select-arrow-zone');
        await (await getElement('.Select-option=Mutation')).waitForExist();
        assert.equal(
            await (await getElement('.Select-option=mRNA')).isExisting(),
            false
        );

        await (
            await getElement(
                'div=Expression data cannot be compared across the selected studies.'
            )
        ).isExisting();
    });
});

describe('expression data in query form', function() {
    beforeEach(async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        await setServerConfiguration({
            enable_cross_study_expression: `
                (studies)=>studies.filter(s=>/pan_can_atlas/.test(s.studyId) === false).length === 0
            `,
        });

        await waitForNetworkQuiet();
    });

    after(async () => {
        await setServerConfiguration({});
    });

    it('For single study with expression data, we can see expression data', async () => {
        await clickElement('.studyItem_sarc_tcga_pub');
        await clickElement('[data-test="queryByGeneButton"]');
        assert.equal(await expressionDataAvailable(), true);
    });

    it("For single study without expression data, we AREN'T offered expression data", async () => {
        await clickElement('.studyItem_chol_nccs_2013');
        await clickElement('[data-test="queryByGeneButton"]');
        assert.equal(await expressionDataAvailable(), false);
    });

    it("For two studies with expression data (only one pancan) we AREN'T offered expression data", async () => {
        await clickElement('.studyItem_sarc_tcga_pub');
        await clickElement('.studyItem_chol_tcga_pan_can_atlas_2018');
        await clickElement('[data-test="queryByGeneButton"]');
        assert.equal(await expressionDataAvailable(), false);
    });

    it('For two studies (both pan can) with expression data we ARE offered expression data', async () => {
        await clickElement('.studyItem_brca_tcga_pan_can_atlas_2018');
        await clickElement('.studyItem_chol_tcga_pan_can_atlas_2018');
        await (await getElementByTestHandle('queryByGeneButton')).click();
        assert.equal(await expressionDataAvailable(), true);
    });
});

describe('cross study expression data without configuration rule', () => {
    beforeEach(async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        await browser.execute(() => {
            window.globalStores.appStore.serverConfig.enable_cross_study_expression = undefined;
        });
    });

    it('without configuration rule, no multi study expression', async () => {
        await clickElement('.studyItem_brca_tcga_pan_can_atlas_2018');
        await clickElement('.studyItem_chol_tcga_pan_can_atlas_2018');
        await (await getElementByTestHandle('queryByGeneButton')).click();
        assert.equal(await expressionDataAvailable(), false);
    });

    it('without configuration rule, single study expression available', async () => {
        await clickElement('.studyItem_brca_tcga_pan_can_atlas_2018');
        await clickElement('.studyItem_chol_tcga_pan_can_atlas_2018');
        await (await getElementByTestHandle('queryByGeneButton')).click();
        assert.equal(await expressionDataAvailable(), false);
    });
});

describe('custom expression comparison rule', () => {
    beforeEach(async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
        await setServerConfiguration({
            enable_cross_study_expression:
                '(studies)=>studies.filter(s=>/gbm_cptac_2021/.test(s.studyId)).length > 0',
        });
        await browser.refresh();
    });

    it('with all pancan, expression NOT available', async () => {
        await clickElement('.studyItem_brca_tcga_pan_can_atlas_2018');
        await clickElement('.studyItem_chol_tcga_pan_can_atlas_2018');
        await (await getElementByTestHandle('queryByGeneButton')).click();
        assert.equal(await expressionDataAvailable(), false);
    });

    it('configuration rule is satisfied and expression available across study', async () => {
        await clickElement('.studyItem_chol_tcga');
        await clickElement('.studyItem_gbm_cptac_2021');
        await (await getElementByTestHandle('queryByGeneButton')).click();
        assert.equal(await expressionDataAvailable(), true);
    });

    it('single study still has expression despite rule', async () => {
        await clickElement('.studyItem_chol_tcga_pan_can_atlas_2018');
        await (await getElementByTestHandle('queryByGeneButton')).click();
        assert.equal(await expressionDataAvailable(), true);
    });
});
