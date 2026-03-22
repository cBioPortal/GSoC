const assert = require('assert');
const {
    goToUrlAndSetLocalStorageWithProperty,
    getElementByTestHandle,
    waitForElementDisplayed,
    getNestedElement,
} = require('../../shared/specUtils_Async');
const { waitForTable } = require('./namespace-columns-utils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const DEFAULT_COLS = {
    GENE_1: 'Gene 1',
    GENE_2: 'Gene 2',
    STATUS: 'Status',
    ANNOTATION: 'Annotation',
    VARIANT_CLASS: 'Variant Class',
    EVENT_INFO: 'Event Info',
    CONNECTION_TYPE: 'Connection Type',
};

describe('namespace columns in structural variant tables', function() {
    describe('patient view', () => {
        const patientViewUrl = `${CBIOPORTAL_URL}/patient?studyId=study_es_0&caseId=TCGA-A2-A04P`;
        const patientStructVarTable = 'patientview-structural-variant-table';

        it('shows default columns when property is not set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(
                patientViewUrl,
                true,
                {}
            );
            await waitForTable(patientStructVarTable);

            assert(await defaultColumnsAreDisplayed());
        });

        it('shows selected columns when property is set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {
                skin_patient_view_structural_variant_table_columns_show_on_init:
                    'Gene 1,Annotation,Breakpoint Type',
            });
            await waitForTable(patientStructVarTable);
            assert(await columnIsDisplayed(DEFAULT_COLS.GENE_1));
            assert(await columnIsNotDisplayed(DEFAULT_COLS.GENE_2));
            assert(await columnIsNotDisplayed(DEFAULT_COLS.STATUS));
            assert(await columnIsDisplayed(DEFAULT_COLS.ANNOTATION));
            assert(await columnIsNotDisplayed(DEFAULT_COLS.VARIANT_CLASS));
            assert(await columnIsNotDisplayed(DEFAULT_COLS.EVENT_INFO));
            assert(await columnIsNotDisplayed(DEFAULT_COLS.CONNECTION_TYPE));
            assert(await columnIsDisplayed('Breakpoint Type'));
        });
    });
});

const defaultColumnsAreDisplayed = async () => {
    const patientStructVarTable = 'patientview-structural-variant-table';
    return (
        (await waitForElementDisplayed(
            "//span[text() = '" + DEFAULT_COLS.GENE_1 + "']",
            {
                timeout: 10000,
            }
        )) &&
        (await (await getElementByTestHandle(patientStructVarTable)).$(
            `span=${DEFAULT_COLS.GENE_2}`
        )) &&
        (await (await getElementByTestHandle(patientStructVarTable)).$(
            `span=${DEFAULT_COLS.STATUS}`
        )) &&
        (await (await getElementByTestHandle(patientStructVarTable)).$(
            `span=${DEFAULT_COLS.ANNOTATION}`
        )) &&
        (await (await getElementByTestHandle(patientStructVarTable)).$(
            `span=${DEFAULT_COLS.VARIANT_CLASS}`
        )) &&
        (await (await getElementByTestHandle(patientStructVarTable)).$(
            `span=${DEFAULT_COLS.EVENT_INFO}`
        )) &&
        (await (await getElementByTestHandle(patientStructVarTable)).$(
            `span=${DEFAULT_COLS.CONNECTION_TYPE}`
        )) &&
        (await (await getElementByTestHandle(patientStructVarTable)).$(
            `span='Breakpoint Type'`
        ))
    );
};

async function columnIsDisplayed(column) {
    return await (
        await getElementByTestHandle('patientview-structural-variant-table')
    ).$(`span=${column}`);
}

async function columnIsNotDisplayed(column) {
    return !(await (
        await getNestedElement([
            `[data-test=${'patientview-structural-variant-table'}]`,
            "//span[text() = '" + column + "']",
        ])
    ).isDisplayed());
}
