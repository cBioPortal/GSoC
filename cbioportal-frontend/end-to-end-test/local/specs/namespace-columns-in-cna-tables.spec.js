const assert = require('assert');
const {
    goToUrlAndSetLocalStorageWithProperty,
} = require('../../shared/specUtils_Async');
const {
    namespaceColumnsAreNotDisplayed,
    waitForTable,
    clickColumnSelectionButton,
    selectColumn,
    namespaceColumnsAreDisplayed,
    getRowByGene,
} = require('./namespace-columns-utils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('namespace columns in cna tables', function() {
    describe('patient view', () => {
        const patientViewUrl = `${CBIOPORTAL_URL}/patient?studyId=study_es_0&caseId=TCGA-A2-A04U`;
        const namespaceColumn1 = 'MyNamespace Column1';
        const namespaceValue1 = 'value1b';
        const namespaceColumn2 = 'MyNamespace Column2';
        const namespaceValue2 = 'value2b';
        const namespaceColumns = [namespaceColumn1, namespaceColumn2];
        const patientCnaTable = 'patientview-copynumber-table';
        const geneWithCustomNamespaceData = 'ACAP3';

        it('hides namespace columns when no property set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(
                patientViewUrl,
                true,
                {}
            );
            await waitForTable(patientCnaTable);
            assert(await namespaceColumnsAreNotDisplayed(namespaceColumns));
        });

        it('shows columns when column menu is used', async () => {
            await clickColumnSelectionButton(patientCnaTable);
            await selectColumn(namespaceColumn1);
            await selectColumn(namespaceColumn2);
            await clickColumnSelectionButton(patientCnaTable);
            assert(await namespaceColumnsAreDisplayed(namespaceColumns));
        });

        /**
         * Expected custom namespace columns to be shown
         */
        it('displays custom namespace data', async () => {
            const rowWithNamespaceData = await getRowByGene(
                patientCnaTable,
                geneWithCustomNamespaceData
            );
            assert(!!rowWithNamespaceData);
            const text = await rowWithNamespaceData.getText();
            assert(text.includes(namespaceValue1));
            assert(text.includes(namespaceValue2));
        });
    });
});
