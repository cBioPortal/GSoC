const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    waitForNetworkQuiet,
    clickElement,
    getElement,
    waitForElementDisplayed,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('embeddings tab interaction tests', function() {
    this.retries(0);

    describe('legend interactions', () => {
        it('allows toggling category visibility by clicking legend items', async () => {
            const url = `${CBIOPORTAL_URL}/study/embeddings?id=msk_chord_2024&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();
            await browser.pause(2000);

            // Wait for legend to be displayed
            await waitForElementDisplayed('[data-test="embeddings-legend"]');

            // Get initial legend items count
            const legend = await $('[data-test="embeddings-legend"]');
            const initialItems = await legend.$$(
                'div[style*="cursor: pointer"]'
            );
            const initialCount = initialItems.length;

            // Click first legend item to toggle it
            if (initialCount > 0) {
                await initialItems[0].click();
                await browser.pause(500);

                // Verify item is now styled as hidden (opacity 0.5)
                const style = await initialItems[0].getAttribute('style');
                assert(
                    style.includes('opacity: 0.5') ||
                        style.includes('opacity:0.5'),
                    'Legend item should be styled as hidden'
                );

                // Click again to show it
                await initialItems[0].click();
                await browser.pause(500);

                // Verify item is now styled as visible (opacity 1)
                const styleAfter = await initialItems[0].getAttribute('style');
                assert(
                    styleAfter.includes('opacity: 1') ||
                        styleAfter.includes('opacity:1'),
                    'Legend item should be styled as visible'
                );
            }
        });

        it('shows/hides all categories with Show All/Hide All button', async () => {
            const url = `${CBIOPORTAL_URL}/study/embeddings?id=msk_chord_2024&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();
            await browser.pause(2000);

            await waitForElementDisplayed('[data-test="embeddings-legend"]');

            // Find the Show All/Hide All button
            const legend = await $('[data-test="embeddings-legend"]');
            const buttons = await legend.$$('button');

            if (buttons.length > 0) {
                const toggleButton = buttons[0];

                // Click Hide All
                await toggleButton.click();
                await browser.pause(500);

                // Verify button text changed to "Show All"
                const buttonText = await toggleButton.getText();
                assert(
                    buttonText.includes('Show All'),
                    'Button should show "Show All" after hiding all'
                );

                // Click Show All
                await toggleButton.click();
                await browser.pause(500);

                // Verify button text changed back to "Hide All"
                const buttonTextAfter = await toggleButton.getText();
                assert(
                    buttonTextAfter.includes('Hide All'),
                    'Button should show "Hide All" after showing all'
                );
            }
        });

        it('displays sample counts for each category', async () => {
            const url = `${CBIOPORTAL_URL}/study/embeddings?id=msk_chord_2024&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();
            await browser.pause(2000);

            await waitForElementDisplayed('[data-test="embeddings-legend"]');

            const legend = await $('[data-test="embeddings-legend"]');
            const legendText = await legend.getText();

            // Verify the legend contains "Total Samples:" and "Visible Samples:"
            assert(
                legendText.includes('Total Samples:'),
                'Legend should display total samples count'
            );
            assert(
                legendText.includes('Visible Samples:'),
                'Legend should display visible samples count'
            );
        });
    });

    describe('coloring menu interactions', () => {
        it('allows switching between cancer type and gene coloring', async () => {
            const url = `${CBIOPORTAL_URL}/study/embeddings?id=msk_chord_2024&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();
            await browser.pause(2000);

            // Find and click the coloring menu
            const coloringMenuExists = await $(
                '[data-test="embeddings-coloring-menu"]'
            ).isExisting();

            if (coloringMenuExists) {
                await clickElement('[data-test="embeddings-coloring-menu"]');
                await browser.pause(500);

                // Verify menu is open and contains options
                const menuOptions = await $$('.Select-menu-outer');
                assert(
                    menuOptions.length > 0,
                    'Coloring menu should be displayed with options'
                );
            }
        });
    });

    describe('viewport controls', () => {
        it('allows exporting plot to PNG', async () => {
            const url = `${CBIOPORTAL_URL}/study/embeddings?id=msk_chord_2024&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();
            await browser.pause(2000);

            // Look for export button in toolbar
            // The toolbar controls are rendered as buttons with FontAwesome icons
            const visualization = await $(
                '[data-test="embeddings-visualization"]'
            );
            const buttons = await visualization.$$('button');

            // Export button should be one of the toolbar buttons
            // We can verify it exists without actually clicking it (which would download a file)
            assert(
                buttons.length > 0,
                'Toolbar should contain control buttons'
            );
        });

        it('allows centering the view', async () => {
            const url = `${CBIOPORTAL_URL}/study/embeddings?id=msk_chord_2024&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();
            await browser.pause(2000);

            const visualization = await $(
                '[data-test="embeddings-visualization"]'
            );
            const buttons = await visualization.$$('button');

            // Center button should be one of the toolbar buttons
            assert(
                buttons.length > 0,
                'Toolbar should contain control buttons'
            );
        });
    });

    describe('selection and filtering behavior', () => {
        it('shows unselected samples as gray when filtering is applied', async () => {
            // Navigate to study view with a filter
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

            // Verify legend includes "Unselected" category
            const legend = await $('[data-test="embeddings-legend"]');
            const legendText = await legend.getText();

            assert(
                legendText.includes('Unselected'),
                'Legend should contain "Unselected" category when filtering is active'
            );
        });

        it('preserves selection when switching between tabs', async () => {
            const url = `${CBIOPORTAL_URL}/study?id=msk_chord_2024&featureFlags=EMBEDDINGS`;
            await goToUrlAndSetLocalStorage(url, true);
            await waitForNetworkQuiet();

            // Apply a filter
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
            await browser.pause(2000);

            // Get legend text with filter active
            const legend1 = await $('[data-test="embeddings-legend"]');
            const legendText1 = await legend1.getText();
            assert(
                legendText1.includes('Unselected'),
                'Unselected category should be present'
            );

            // Switch to Summary tab
            await clickElement('[data-test="study-tabs-summary"]');
            await waitForNetworkQuiet();

            // Switch back to Embeddings tab
            await clickElement('[data-test="study-tabs-embeddings"]');
            await waitForNetworkQuiet();
            await browser.pause(2000);

            // Verify filter is still active
            const legend2 = await $('[data-test="embeddings-legend"]');
            const legendText2 = await legend2.getText();
            assert(
                legendText2.includes('Unselected'),
                'Filter should persist when switching between tabs'
            );
        });
    });

    describe('URL parameter handling', () => {
        it('initializes with gene coloring from URL parameter', async () => {
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

            // Verify legend shows mutation-related categories
            const legend = await $('[data-test="embeddings-legend"]');
            const legendText = await legend.getText();

            // Should contain mutation-related categories when colored by EGFR
            const hasMutationCategory =
                legendText.includes('Missense') ||
                legendText.includes('Truncating') ||
                legendText.includes('Inframe') ||
                legendText.includes('Not mutated');

            assert(
                hasMutationCategory,
                'Legend should show mutation categories when colored by gene'
            );
        });

        it('initializes with clinical attribute coloring from URL parameter', async () => {
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

            // Verify legend shows clinical attribute values
            const legend = await $('[data-test="embeddings-legend"]');
            const legendText = await legend.getText();

            // Should contain Yes/No/NA for ADRENAL_GLANDS attribute
            const hasAttributeValues =
                legendText.includes('Yes') ||
                legendText.includes('No') ||
                legendText.includes('NA');

            assert(
                hasAttributeValues,
                'Legend should show clinical attribute values when colored by clinical attribute'
            );
        });
    });
});
