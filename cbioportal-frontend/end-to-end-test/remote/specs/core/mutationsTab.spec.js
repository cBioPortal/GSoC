var assert = require('assert');
const {
    getElementByTestHandle,
    waitForOncoprint,
    setSettingsMenuOpen,
    goToUrlAndSetLocalStorage,
    clickElement,
    getElement,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('mutations tab', () => {
    describe('VUS filtering', () => {
        it('uses VUS filtering', async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/oncoprint?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=acc_tcga_pan_can_atlas_2018&case_set_id=acc_tcga_pan_can_atlas_2018_cnaseq&data_priority=0&gene_list=HSD17B4&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=acc_tcga_pan_can_atlas_2018_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=acc_tcga_pan_can_atlas_2018_mutations&tab_index=tab_visualize`
            );
            await waitForOncoprint();
            await setSettingsMenuOpen(true);
            await clickElement('input[data-test="HideVUS"]');
            await setSettingsMenuOpen(false);
            await (await getElement('a.tabAnchor_mutations')).waitForExist();
            await clickElement('a.tabAnchor_mutations');
            await (
                await getElementByTestHandle('LazyMobXTable_CountHeader')
            ).waitForDisplayed();
            assert(
                (
                    await (
                        await getElementByTestHandle(
                            'LazyMobXTable_CountHeader'
                        )
                    ).getHTML(false)
                ).indexOf('0 Mutations') > -1
            );
        });
        it('uses germline filtering', async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/mutations?Action=Submit&RPPA_SCORE_THRESHOLD=2.0&Z_SCORE_THRESHOLD=2.0&cancer_study_list=brca_tcga_pub&case_set_id=brca_tcga_pub_cnaseq&data_priority=0&gene_list=BRCA1%2520BRCA2&geneset_list=%20&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=brca_tcga_pub_gistic&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=brca_tcga_pub_mutations&tab_index=tab_visualize`
            );
            await (
                await getElementByTestHandle('LazyMobXTable_CountHeader')
            ).waitForDisplayed({
                timeout: 10000,
            });
            assert(
                (
                    await (
                        await getElementByTestHandle(
                            'LazyMobXTable_CountHeader'
                        )
                    ).getHTML(false)
                ).indexOf('19 Mutations') > -1,
                'unfiltered is 19 mutations'
            );

            await setSettingsMenuOpen(true);
            await clickElement(
                'div[data-test="GlobalSettingsDropdown"] input[data-test="HideGermline"]'
            );
            await setSettingsMenuOpen(false);

            await (
                await getElementByTestHandle('LazyMobXTable_CountHeader')
            ).waitForDisplayed({
                timeout: 10000,
            });
            assert(
                (
                    await (
                        await getElementByTestHandle(
                            'LazyMobXTable_CountHeader'
                        )
                    ).getHTML(false)
                ).indexOf('6 Mutations') > -1,
                'filtered is 6 mutations'
            );
        });
    });

    describe('alteration badge selectors and filtering', () => {
        beforeEach(async () => {
            await goToUrlAndSetLocalStorage(
                `${CBIOPORTAL_URL}/results/mutations?cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=TP53&gene_set_choice=user-defined-list&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations&geneset_list=%20&tab_index=tab_visualize&Action=Submit&mutations_gene=KRAS`
            );
            await (await getElement('.lollipop-svgnode')).waitForDisplayed({
                timeout: 10000,
            });
        });

        it('clicking badge filters adjusts mutation table counts', async () => {
            const getCountText = async () => {
                return (
                    await getElementByTestHandle('LazyMobXTable_CountHeader')
                ).getText();
            };

            assert(
                (await getCountText()).includes('98 Mutations'),
                'starts with full complement of mutations'
            );

            // click first missense badge
            await clickElement('strong=Missense');

            assert(
                (await getCountText()).includes('31 Mutations'),
                'reduced by removing missense'
            );

            // toggle it back on
            await clickElement('strong=Missense');

            assert(
                (await getCountText()).includes('98 Mutations'),
                'full complement restored'
            );

            await clickElement('strong=Splice');

            assert(
                (await getCountText()).includes('97 Mutations'),
                'splice filters down'
            );

            await clickElement('strong=Missense');

            assert(
                (await getCountText()).includes('30 Mutations'),
                'splice AND missense filters down'
            );
        });

        it('adjusts mutation counts based on driver annotation settings', async () => {
            await (
                await (await getElementByTestHandle('badge-driver')).$(
                    'span=98'
                )
            ).waitForExist();

            await setSettingsMenuOpen(true);
            (await getElementByTestHandle('annotateOncoKb')).click();
            await setSettingsMenuOpen(false);

            await (await getElement('.lollipop-svgnode')).waitForDisplayed();

            await (
                await (await getElementByTestHandle('badge-driver')).$(
                    'span=64'
                )
            ).waitForExist();

            await setSettingsMenuOpen(true);
            (await getElementByTestHandle('annotateOncoKb')).click();
            await setSettingsMenuOpen(false);

            await (await getElement('.lollipop-svgnode')).waitForDisplayed();

            await (
                await (await getElementByTestHandle('badge-driver')).$(
                    'span=98'
                )
            ).waitForExist();
        });
    });
});
