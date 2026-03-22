const assert = require('assert');
const {
    goToUrlAndSetLocalStorageWithProperty,
    isDisplayed,
    getElement,
    waitForElementDisplayed,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const resultsViewUrl = `${CBIOPORTAL_URL}/results/mutations?cancer_study_list=study_es_0&Z_SCORE_THRESHOLD=2.0&RPPA_SCORE_THRESHOLD=2.0&profileFilter=mutations%2Cfusion%2Cgistic&case_set_id=study_es_0_all&gene_list=BRCA1&geneset_list=%20&tab_index=tab_visualize&Action=Submit`;
const patientViewUrl = `${CBIOPORTAL_URL}/patient?sampleId=TEST_SAMPLE_SOMATIC_HOMOZYGOUS&studyId=study_es_0`;

const DEFAULT_RESULT_COLS = {
    SAMPLE_ID: 'Sample ID',
    PROTEIN_CHANGE: 'Protein Change',
    ANNOTATION: 'Annotation',
    MUTATION_TYPE: 'Mutation Type',
    COPY_NUM: 'Copy #',
    NUM_MUT_IN_SAMPLE: '# Mut in Sample',
};

const DEFAULT_PATIENT_COLS = {
    GENE: 'Gene',
    PROTEIN_CHANGE: 'Protein Change',
    ANNOTATION: 'Annotation',
    MUTATION_TYPE: 'Mutation Type',
    COPY_NUM: 'Copy #',
    COHORT: 'Cohort',
};

describe('default init columns in mutation tables', function() {
    describe('results view', () => {
        it('shows default columns when properties not set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(
                resultsViewUrl,
                true,
                {}
            );
            await waitForMutationTable();
            assert(await defaultResultColumnsAreDisplayed());
            assert(await namespaceColumnsAreNotDisplayed());
        });
        it('shows default and namespace columns when only namespace property set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(resultsViewUrl, true, {
                skin_mutation_table_namespace_column_show_by_default: true,
            });
            await waitForMutationTable();
            assert(await defaultResultColumnsAreDisplayed());
            assert(await namespaceColumnsAreDisplayed());
        });

        it('shows selected columns when only selected property set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(resultsViewUrl, true, {
                skin_results_view_mutation_table_columns_show_on_init:
                    'Sample ID,Protein Change',
            });
            await waitForMutationTable();
            assert(await columnIsDisplayed(DEFAULT_RESULT_COLS.SAMPLE_ID));
            assert(await columnIsDisplayed(DEFAULT_RESULT_COLS.PROTEIN_CHANGE));
            assert(await columnIsNotDisplayed(DEFAULT_RESULT_COLS.ANNOTATION));
            assert(
                await columnIsNotDisplayed(DEFAULT_RESULT_COLS.MUTATION_TYPE)
            );
            assert(await columnIsNotDisplayed(DEFAULT_RESULT_COLS.COPY_NUM));
            assert(
                await columnIsNotDisplayed(
                    DEFAULT_RESULT_COLS.NUM_MUT_IN_SAMPLE
                )
            );
            assert(await columnIsNotDisplayed('Functional Impact'));
            assert(await columnIsNotDisplayed('Variant Type'));
            assert(await namespaceColumnsAreNotDisplayed());
        });

        it('shows selected and namespace columns when both properties are set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(resultsViewUrl, true, {
                skin_results_view_mutation_table_columns_show_on_init:
                    'Sample ID,Protein Change',
                skin_mutation_table_namespace_column_show_by_default: true,
            });
            await waitForMutationTable();
            assert(await columnIsDisplayed(DEFAULT_RESULT_COLS.SAMPLE_ID));
            assert(await columnIsDisplayed(DEFAULT_RESULT_COLS.PROTEIN_CHANGE));
            assert(
                await columnIsNotDisplayed(DEFAULT_RESULT_COLS.MUTATION_TYPE)
            );
            assert(await columnIsNotDisplayed(DEFAULT_RESULT_COLS.COPY_NUM));
            assert(
                await columnIsNotDisplayed(
                    DEFAULT_RESULT_COLS.NUM_MUT_IN_SAMPLE
                )
            );
            assert(await columnIsNotDisplayed('Functional Impact'));
            assert(await columnIsNotDisplayed('Variant Type'));
            assert(await namespaceColumnsAreDisplayed());
        });
    });
    describe('patient view', () => {
        it('shows default columns when properties not set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(
                patientViewUrl,
                true,
                {}
            );
            await waitForPatientViewMutationTable();
            assert(await defaultPatientColumnsAreDisplayed());
            assert(await namespaceColumnsAreNotDisplayed());
        });
        it('shows default and namespace columns when only namespace property set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {
                skin_mutation_table_namespace_column_show_by_default: true,
            });
            await waitForPatientViewMutationTable();
            assert(await defaultPatientColumnsAreDisplayed());
            assert(await namespaceColumnsAreDisplayed());
        });

        it('shows selected columns when only selected property set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {
                skin_patient_view_mutation_table_columns_show_on_init:
                    'Gene,Protein Change',
            });
            await waitForPatientViewMutationTable();
            assert(await columnIsDisplayed(DEFAULT_PATIENT_COLS.GENE));
            assert(
                await columnIsDisplayed(DEFAULT_PATIENT_COLS.PROTEIN_CHANGE)
            );
            assert(await columnIsNotDisplayed(DEFAULT_PATIENT_COLS.ANNOTATION));
            assert(
                await columnIsNotDisplayed(DEFAULT_PATIENT_COLS.MUTATION_TYPE)
            );
            assert(await columnIsNotDisplayed(DEFAULT_PATIENT_COLS.COPY_NUM));
            assert(await columnIsNotDisplayed(DEFAULT_PATIENT_COLS.COHORT));
            assert(await columnIsNotDisplayed('Functional Impact'));
            assert(await columnIsNotDisplayed('Variant Type'));
            assert(await namespaceColumnsAreNotDisplayed());
        });

        it('shows selected and namespace columns when both properties are set', async () => {
            await goToUrlAndSetLocalStorageWithProperty(patientViewUrl, true, {
                skin_patient_view_mutation_table_columns_show_on_init:
                    'Gene,Protein Change',
                skin_mutation_table_namespace_column_show_by_default: true,
            });
            await waitForPatientViewMutationTable();
            assert(await columnIsDisplayed(DEFAULT_PATIENT_COLS.GENE));
            assert(
                await columnIsDisplayed(DEFAULT_PATIENT_COLS.PROTEIN_CHANGE)
            );
            assert(await columnIsNotDisplayed(DEFAULT_PATIENT_COLS.ANNOTATION));
            assert(
                await columnIsNotDisplayed(DEFAULT_PATIENT_COLS.MUTATION_TYPE)
            );
            assert(await columnIsNotDisplayed(DEFAULT_PATIENT_COLS.COPY_NUM));
            assert(await columnIsNotDisplayed(DEFAULT_PATIENT_COLS.COHORT));
            assert(await columnIsNotDisplayed('Functional Impact'));
            assert(await columnIsNotDisplayed('Variant Type'));
            assert(await namespaceColumnsAreDisplayed());
        });
    });
});

const defaultResultColumnsAreDisplayed = async () => {
    return (
        (await isDisplayed(
            "//span[text() = '" + DEFAULT_RESULT_COLS.SAMPLE_ID + "']"
        )) &&
        (await isDisplayed(
            "//span[text() = '" + DEFAULT_RESULT_COLS.PROTEIN_CHANGE + "']"
        )) &&
        (await isDisplayed(
            "//span[text() = '" + DEFAULT_RESULT_COLS.ANNOTATION + "']"
        )) &&
        (await isDisplayed(
            "//span[text() = '" + DEFAULT_RESULT_COLS.MUTATION_TYPE + "']"
        )) &&
        (await isDisplayed(
            "//span[text() = '" + DEFAULT_RESULT_COLS.COPY_NUM + "']"
        )) &&
        (await isDisplayed(
            "//span[text() = '" + DEFAULT_RESULT_COLS.NUM_MUT_IN_SAMPLE + "']"
        )) &&
        !(await isDisplayed("//span[text() = 'Functional Impact']")) &&
        !(await isDisplayed("//span[text() = 'Variant Type']"))
    );
};

const defaultPatientColumnsAreDisplayed = async () => {
    return (
        (await isDisplayed(
            "//span[text() = '" + DEFAULT_PATIENT_COLS.GENE + "']"
        )) &&
        (await isDisplayed(
            "//span[text() = '" + DEFAULT_PATIENT_COLS.PROTEIN_CHANGE + "']"
        )) &&
        (await isDisplayed(
            "//span[text() = '" + DEFAULT_PATIENT_COLS.ANNOTATION + "']"
        )) &&
        (await isDisplayed(
            "//span[text() = '" + DEFAULT_PATIENT_COLS.MUTATION_TYPE + "']"
        )) &&
        (await isDisplayed(
            "//span[text() = '" + DEFAULT_PATIENT_COLS.COPY_NUM + "']"
        )) &&
        (await isDisplayed(
            "//span[text() = '" + DEFAULT_PATIENT_COLS.COHORT + "']"
        )) &&
        !(await isDisplayed("//span[text() = 'Functional Impact']")) &&
        !(await isDisplayed("//span[text() = 'Variant Type']"))
    );
};

const namespaceColumnsAreDisplayed = async () => {
    return (
        (await isDisplayed("//span[text() = 'Zygosity Code']")) &&
        (await isDisplayed("//span[text() = 'Zygosity Name']"))
    );
};

const namespaceColumnsAreNotDisplayed = async () => {
    return !(
        (await (
            await getElement("//span[text() = 'Zygosity Code']")
        ).isDisplayed()) &&
        (await (
            await getElement("//span[text() = 'Zygosity Name']")
        ).isDisplayed())
    );
};

async function columnIsDisplayed(column) {
    return await (
        await getElement("//span[text() = '" + column + "']")
    ).isDisplayed();
}

async function columnIsNotDisplayed(column) {
    return !(await (
        await getElement("//span[text() = '" + column + "']")
    ).isDisplayed());
}

const waitForMutationTable = async () => {
    await waitForElementDisplayed('[data-test=LazyMobXTable]');
};

const waitForPatientViewMutationTable = async () => {
    await waitForElementDisplayed('[data-test=patientview-mutation-table]');
    await waitForElementDisplayed('[data-test=LazyMobXTable]');
};
