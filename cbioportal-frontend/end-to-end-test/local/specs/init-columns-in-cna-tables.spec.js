const assert = require('assert');
const {
    goToUrlAndSetLocalStorageWithProperty,
    getNestedElement,
} = require('../../shared/specUtils_Async');
const { waitForTable } = require('./namespace-columns-utils');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const DEFAULT_COLS = {
    GENE: 'Gene',
    CNA: 'CNA',
    ANNOTATION: 'Annotation',
    CYTOBAND: 'Cytoband',
    COHORT: 'Cohort',
};

describe('namespace columns in cna tables', function() {
    describe('patient view', () => {
        const patientViewUrl = `${CBIOPORTAL_URL}/patient?studyId=study_es_0&caseId=TCGA-A2-A04U`;
        const patientCnaTable = 'patientview-copynumber-table';

        it('shows default columns when property is not set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(
                patientViewUrl,
                true,
                {}
            );
            await waitForTable(patientCnaTable);
            assert(await defaultColumnsAreDisplayed());
        });

        it('shows selected columns when property is set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {
                skin_patient_view_copy_number_table_columns_show_on_init:
                    'Gene,Annotation,Gene panel',
            });
            await waitForTable(patientCnaTable);
            assert(await columnIsDisplayed(DEFAULT_COLS.GENE));
            assert(await columnIsNotDisplayed(DEFAULT_COLS.CNA));
            assert(await columnIsDisplayed(DEFAULT_COLS.ANNOTATION));
            assert(await columnIsNotDisplayed(DEFAULT_COLS.CYTOBAND));
            assert(await columnIsNotDisplayed(DEFAULT_COLS.COHORT));
            assert(await columnIsDisplayed('Gene panel')); //Failing
        });
    });
});
const patientCnaTable = '[data-test="patientview-copynumber-table"]';
const defaultColumnsAreDisplayed = async () => {
    return (
        (await getNestedElement([
            patientCnaTable,
            `span=${DEFAULT_COLS.GENE}`,
        ])) &&
        (await getNestedElement([
            patientCnaTable,
            `span=${DEFAULT_COLS.CNA}`,
        ])) &&
        (await getNestedElement([
            patientCnaTable,
            `span=${DEFAULT_COLS.ANNOTATION}`,
        ])) &&
        (await getNestedElement([
            patientCnaTable,
            `span=${DEFAULT_COLS.CYTOBAND}`,
        ])) &&
        (await getNestedElement([
            patientCnaTable,
            `span=${DEFAULT_COLS.COHORT}`,
        ])) &&
        !(await (
            await getNestedElement([
                patientCnaTable,
                "//span[text() = 'Gene panel']",
            ])
        ).isDisplayed())
    );
};

async function columnIsDisplayed(column) {
    return await getNestedElement([patientCnaTable, `span=${column}`]);
}

async function columnIsNotDisplayed(column) {
    return !(await (
        await getNestedElement([
            patientCnaTable,
            "//span[text() = '" + column + "']",
        ])
    ).isDisplayed());
}
