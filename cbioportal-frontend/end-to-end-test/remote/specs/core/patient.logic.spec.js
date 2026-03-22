const {
    goToUrlAndSetLocalStorage,
    getElementByTestHandle,
    getElement,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('patient page', () => {
    before(async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);
    });

    it('should show "all samples button" for single sample view of multi sample patient', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/patient?studyId=lgg_ucsf_2014&tab=summaryTab&sampleId=P04_Pri`
        );

        await (await getElement('button=Show all 4 samples')).waitForExist();
    });

    it('show appropriate messaging when a patient has only some profiled samples', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/patient?studyId=mpcproject_broad_2021&caseId=MPCPROJECT_0013`
        );

        // there is one partial profile message for CNA and sample 2
        await (
            await getElementByTestHandle('patientview-mutation-table')
        ).waitForDisplayed();
    });
});
