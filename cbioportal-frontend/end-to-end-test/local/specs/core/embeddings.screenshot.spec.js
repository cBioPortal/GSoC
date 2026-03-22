const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');
const {
    checkElementWithMouseDisabled,
    goToUrlAndSetLocalStorage,
    waitForNetworkQuiet,
    clickElement,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('embeddings tab screenshot tests', function() {
    this.retries(0);

    describe('basic embedding visualization', () => {
        it('renders embeddings tab with default cancer type coloring', async () => {
            const url = `${CBIOPORTAL_URL}/study/embeddings?id=msk_chord_2024&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();
            // Allow time for deck.gl to render
            await browser.pause(2000);

            const res = await checkElementWithMouseDisabled(
                '[data-test="embeddings-visualization"]',
                0,
                { hide: ['.qtip', '.dropdown-menu'] }
            );
            assertScreenShotMatch(res);
        });

        it('shows legend with correct category counts', async () => {
            const url = `${CBIOPORTAL_URL}/study/embeddings?id=msk_chord_2024&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();
            await browser.pause(2000);

            const res = await checkElementWithMouseDisabled(
                '[data-test="embeddings-legend"]',
                0
            );
            assertScreenShotMatch(res);
        });
    });

    describe('gene mutation coloring', () => {
        it('colors embedding by EGFR mutations', async () => {
            const coloringParam = encodeURIComponent(
                JSON.stringify({
                    selectedOption: 'EGFR',
                    colorByMutationType: 'true',
                    colorByCopyNumber: 'true',
                    colorBySv: 'true',
                })
            );
            const url = `${CBIOPORTAL_URL}/study/embeddings?id=msk_chord_2024&embeddings_coloring_selection=${coloringParam}&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();
            await browser.pause(2000);

            const res = await checkElementWithMouseDisabled(
                '[data-test="embeddings-visualization"]',
                0,
                { hide: ['.qtip', '.dropdown-menu'] }
            );
            assertScreenShotMatch(res);
        });

        it('colors embedding by BRAF mutations', async () => {
            const coloringParam = encodeURIComponent(
                JSON.stringify({
                    selectedOption: 'BRAF',
                    colorByMutationType: 'true',
                    colorByCopyNumber: 'true',
                    colorBySv: 'true',
                })
            );
            const url = `${CBIOPORTAL_URL}/study/embeddings?id=msk_chord_2024&embeddings_coloring_selection=${coloringParam}&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();
            await browser.pause(2000);

            const res = await checkElementWithMouseDisabled(
                '[data-test="embeddings-visualization"]',
                0,
                { hide: ['.qtip', '.dropdown-menu'] }
            );
            assertScreenShotMatch(res);
        });

        it('shows legend with mutation types for EGFR', async () => {
            const coloringParam = encodeURIComponent(
                JSON.stringify({
                    selectedOption: 'EGFR',
                    colorByMutationType: 'true',
                    colorByCopyNumber: 'true',
                    colorBySv: 'true',
                })
            );
            const url = `${CBIOPORTAL_URL}/study/embeddings?id=msk_chord_2024&embeddings_coloring_selection=${coloringParam}&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();
            await browser.pause(2000);

            const res = await checkElementWithMouseDisabled(
                '[data-test="embeddings-legend"]',
                0
            );
            assertScreenShotMatch(res);
        });
    });

    describe('clinical attribute coloring', () => {
        it('colors embedding by patient-level clinical attribute (ADRENAL_GLANDS)', async () => {
            // Create the clinical attribute selection parameter
            // Format: undefined_{...json with clinicalAttributeId...}
            const clinicalAttrJson = JSON.stringify({
                clinicalAttributeId: 'ADRENAL_GLANDS',
                patientAttribute: true,
                studyId: 'msk_chord_2024',
            });

            const coloringParam = encodeURIComponent(
                JSON.stringify({
                    selectedOption: `undefined_${clinicalAttrJson}`,
                    colorByMutationType: 'false',
                    colorByCopyNumber: 'false',
                    colorBySv: 'false',
                })
            );

            const url = `${CBIOPORTAL_URL}/study/embeddings?id=msk_chord_2024&embeddings_coloring_selection=${coloringParam}&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();
            await browser.pause(2000);

            const res = await checkElementWithMouseDisabled(
                '[data-test="embeddings-visualization"]',
                0,
                { hide: ['.qtip', '.dropdown-menu'] }
            );
            assertScreenShotMatch(res);
        });

        it('shows legend with clinical attribute values', async () => {
            const clinicalAttrJson = JSON.stringify({
                clinicalAttributeId: 'ADRENAL_GLANDS',
                patientAttribute: true,
                studyId: 'msk_chord_2024',
            });

            const coloringParam = encodeURIComponent(
                JSON.stringify({
                    selectedOption: `undefined_${clinicalAttrJson}`,
                    colorByMutationType: 'false',
                    colorByCopyNumber: 'false',
                    colorBySv: 'false',
                })
            );

            const url = `${CBIOPORTAL_URL}/study/embeddings?id=msk_chord_2024&embeddings_coloring_selection=${coloringParam}&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();
            await browser.pause(2000);

            const res = await checkElementWithMouseDisabled(
                '[data-test="embeddings-legend"]',
                0
            );
            assertScreenShotMatch(res);
        });
    });

    describe('numeric clinical attribute coloring', () => {
        it('colors embedding by numeric clinical attribute with gradient (CURRENT_AGE)', async () => {
            const clinicalAttrJson = JSON.stringify({
                clinicalAttributeId: 'CURRENT_AGE',
                patientAttribute: true,
                studyId: 'msk_chord_2024',
            });

            const coloringParam = encodeURIComponent(
                JSON.stringify({
                    selectedOption: `undefined_${clinicalAttrJson}`,
                    colorByMutationType: 'false',
                    colorByCopyNumber: 'false',
                    colorBySv: 'false',
                })
            );

            const url = `${CBIOPORTAL_URL}/study/embeddings?id=msk_chord_2024&embeddings_coloring_selection=${coloringParam}&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();
            await browser.pause(2000);

            const res = await checkElementWithMouseDisabled(
                '[data-test="embeddings-visualization"]',
                0,
                { hide: ['.qtip', '.dropdown-menu'] }
            );
            assertScreenShotMatch(res);
        });

        it('shows gradient legend for numeric clinical attribute', async () => {
            const clinicalAttrJson = JSON.stringify({
                clinicalAttributeId: 'CURRENT_AGE',
                patientAttribute: true,
                studyId: 'msk_chord_2024',
            });

            const coloringParam = encodeURIComponent(
                JSON.stringify({
                    selectedOption: `undefined_${clinicalAttrJson}`,
                    colorByMutationType: 'false',
                    colorByCopyNumber: 'false',
                    colorBySv: 'false',
                })
            );

            const url = `${CBIOPORTAL_URL}/study/embeddings?id=msk_chord_2024&embeddings_coloring_selection=${coloringParam}&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();
            await browser.pause(2000);

            const res = await checkElementWithMouseDisabled(
                '[data-test="embeddings-legend"]',
                0
            );
            assertScreenShotMatch(res);
        });
    });

    describe('selection and filtering', () => {
        it('shows unselected samples as gray when filtering by cancer type', async () => {
            // Navigate to study view with a cancer type filter
            const filterJson = encodeURIComponent(
                JSON.stringify({
                    clinicalDataEqualityFilters: [
                        {
                            attributeId: 'CANCER_TYPE_DETAILED',
                            values: ['Colorectal Cancer'],
                        },
                    ],
                })
            );

            const url = `${CBIOPORTAL_URL}/study?id=msk_chord_2024&filterJson=${filterJson}&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();

            // Switch to embeddings tab
            await clickElement('[data-test="study-tabs-embeddings"]');
            await waitForNetworkQuiet();
            await browser.pause(2000);

            const res = await checkElementWithMouseDisabled(
                '[data-test="embeddings-visualization"]',
                0,
                { hide: ['.qtip', '.dropdown-menu'] }
            );
            assertScreenShotMatch(res);
        });

        it('legend includes Unselected category when filtering', async () => {
            const filterJson = encodeURIComponent(
                JSON.stringify({
                    clinicalDataEqualityFilters: [
                        {
                            attributeId: 'CANCER_TYPE_DETAILED',
                            values: ['Colorectal Cancer'],
                        },
                    ],
                })
            );

            const url = `${CBIOPORTAL_URL}/study?id=msk_chord_2024&filterJson=${filterJson}&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();

            await clickElement('[data-test="study-tabs-embeddings"]');
            await waitForNetworkQuiet();
            await browser.pause(2000);

            const res = await checkElementWithMouseDisabled(
                '[data-test="embeddings-legend"]',
                0
            );
            assertScreenShotMatch(res);
        });
    });

    describe('viewport and layout', () => {
        it('maintains full width after switching tabs', async () => {
            const url = `${CBIOPORTAL_URL}/study?id=msk_chord_2024&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();

            // Switch to Summary tab
            await clickElement('[data-test="study-tabs-summary"]');
            await waitForNetworkQuiet();

            // Apply a filter by clicking a cancer type chart
            const filterJson = encodeURIComponent(
                JSON.stringify({
                    clinicalDataEqualityFilters: [
                        {
                            attributeId: 'CANCER_TYPE_DETAILED',
                            values: ['Melanoma'],
                        },
                    ],
                })
            );
            const filterUrl = `${CBIOPORTAL_URL}/study?id=msk_chord_2024&filterJson=${filterJson}&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(filterUrl, false);
            await waitForNetworkQuiet();

            // Switch to Embeddings tab
            await clickElement('[data-test="study-tabs-embeddings"]');
            await waitForNetworkQuiet();
            // Allow time for layout recalculation
            await browser.pause(2000);

            const res = await checkElementWithMouseDisabled(
                '[data-test="embeddings-visualization"]',
                0,
                { hide: ['.qtip', '.dropdown-menu'] }
            );
            assertScreenShotMatch(res);
        });
    });
});
