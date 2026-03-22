const {
    goToUrlAndSetLocalStorage,
    getNestedElement,
    waitForElementDisplayed,
    clickElement,
    getElement,
} = require('../../shared/specUtils_Async');
const assert = require('assert');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyViewUrl = `${CBIOPORTAL_URL}/study/summary?id=study_es_0`;

const GENOMIC_PROFILES_SAMPLE_COUNT_TABLE = `div[data-test="chart-container-GENOMIC_PROFILES_SAMPLE_COUNT"]`;
const SELECT_SAMPLES_BUTTON = 'button=Select Samples';
const ADD_FILTERS_BUTTON = 'button=Add Filters';
const STUDY_VIEW_HEADER = `div[data-test="study-view-header"]`;
const SETTINGS_MENU_BUTTON = `button[data-test="study-view-settings-menu"]`;
const DISABLE_AUTOCOMMIT_FIELD = `label=Manually submit`;
const SUBMIT_STUDY_FILTERS = `button[data-test="submit-study-filters"]`;
const PUTATIVE_PROFILE =
    "//span[text() = 'Putative copy-number alterations from GISTIC']";
const LOG2_PROFILE = "//span[text() = 'Log2 copy-number values']";
const PILL_TAG = 'div[data-test="pill-tag"]';
const DELETE_PILL_TAG = 'span[data-test="pill-tag-delete"]';

describe('Toggling of study view filters autosubmit', function() {
    it('autocommits filters by default', async () => {
        await goToUrlAndSetLocalStorage(studyViewUrl, true);

        //this seems to fix issue with intermittent fail of test due to
        //menu not being clickeable
        await browser.setWindowSize(1600, 1000);

        await selectMutationProfile(0);
        await selectSamples();

        const filterInHeader = await getNestedElement([
            STUDY_VIEW_HEADER,
            PUTATIVE_PROFILE,
        ]);
        assert(await filterInHeader.isDisplayed());
        const isFilterQueued = await hasFilterClass(filterInHeader, 'pending');
        assert(!isFilterQueued);
    });

    it('can disable filter submission in settings menu', async () => {
        await waitForElementDisplayed(SETTINGS_MENU_BUTTON, { timeout: 20000 });
        await clickElement(SETTINGS_MENU_BUTTON);
        await waitForElementDisplayed(DISABLE_AUTOCOMMIT_FIELD, {
            timeout: 20000,
        });
        await clickElement(DISABLE_AUTOCOMMIT_FIELD);
    });

    it('queues new filters when autosubmit disabled', async () => {
        // no submit button
        assert.equal(
            await (await getElement(SUBMIT_STUDY_FILTERS)).isExisting(),
            false
        );

        await selectMutationProfile(1);

        await queueFilter();

        // now we see the submit button
        await waitForElementDisplayed(SUBMIT_STUDY_FILTERS);

        const queuedFilterInHeader = await getNestedElement([
            STUDY_VIEW_HEADER,
            LOG2_PROFILE,
        ]);
        assert(await queuedFilterInHeader.isDisplayed());
        const isFilterQueued = await hasFilterClass(
            queuedFilterInHeader,
            'pending'
        );
        assert(isFilterQueued);
    });
    //
    it('queues deleted filters when autosubmit disabled', async () => {
        const submittedFilterInHeader = await getNestedElement([
            STUDY_VIEW_HEADER,
            PUTATIVE_PROFILE,
        ]);
        assert(await submittedFilterInHeader.isDisplayed());

        await deleteFilter(submittedFilterInHeader);

        assert(await submittedFilterInHeader.isDisplayed());
        const isFilterQueued = await hasFilterClass(
            submittedFilterInHeader,
            'pending'
        );
        assert(isFilterQueued);
        const isFilterDeleted = await hasFilterClass(
            submittedFilterInHeader,
            'pendingDelete'
        );
        assert(isFilterDeleted);
    });
    //
    it('submits queued and deleted filters when manually submitting', async () => {
        const queuedDeletedFilterInHeader = await getNestedElement([
            STUDY_VIEW_HEADER,
            PUTATIVE_PROFILE,
        ]);
        assert(await queuedDeletedFilterInHeader.isDisplayed());
        const queuedFilterInHeader = await getNestedElement([
            STUDY_VIEW_HEADER,
            LOG2_PROFILE,
        ]);
        assert(await queuedFilterInHeader.isDisplayed());

        await clickElement(SUBMIT_STUDY_FILTERS);

        await browser.waitUntil(
            async () => !(await queuedDeletedFilterInHeader.isDisplayed())
        );
        assert(await queuedFilterInHeader.isDisplayed());
        const isFilterQueued = await hasFilterClass(
            queuedFilterInHeader,
            'pending'
        );
        assert(!isFilterQueued);
    });
});

async function selectMutationProfile(index = 0) {
    await (
        await (await getElement(GENOMIC_PROFILES_SAMPLE_COUNT_TABLE)).$$(
            'input'
        )
    )[index].click();
}

async function queueFilter() {
    await (
        await getNestedElement([
            GENOMIC_PROFILES_SAMPLE_COUNT_TABLE,
            ADD_FILTERS_BUTTON,
        ])
    ).click();
}

async function selectSamples() {
    await (
        await getNestedElement([
            GENOMIC_PROFILES_SAMPLE_COUNT_TABLE,
            SELECT_SAMPLES_BUTTON,
        ])
    ).click();
}

/**
 * Execute in browser to be able to use parentElement.closest()
 */
async function hasFilterClass(queuedFilterInHeader, toInclude) {
    return await browser.execute(
        (queuedFilterInHeader, toInclude, PILL_TAG) => {
            return queuedFilterInHeader.parentElement
                .closest(PILL_TAG)
                .getAttribute('class')
                .includes(toInclude);
        },
        queuedFilterInHeader,
        toInclude,
        PILL_TAG
    );
}

async function deleteFilter(queuedFilterInHeader) {
    await browser.execute(
        (queuedFilterInHeader, PILL_TAG, DELETE_PILL_TAG) => {
            return queuedFilterInHeader.parentElement
                .closest(PILL_TAG)
                .querySelector(DELETE_PILL_TAG)
                .click();
        },
        queuedFilterInHeader,
        PILL_TAG,
        DELETE_PILL_TAG
    );
}
