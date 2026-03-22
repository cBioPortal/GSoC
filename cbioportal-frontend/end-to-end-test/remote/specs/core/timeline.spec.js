const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    checkElementWithMouseDisabled,
    getElement,
    waitForElementDisplayed,
    getNthElements,
} = require('../../../shared/specUtils_Async');
const { assertScreenShotMatch } = require('../../../shared/lib/testUtils');
const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('clinical timeline', () => {
    beforeEach(async () => {
        const url = `${CBIOPORTAL_URL}/patient/summary?studyId=mpcproject_broad_2021&caseId=MPCPROJECT_0013`;
        await goToUrlAndSetLocalStorage(url);
    });

    it('timeline displays on load', async () => {
        await waitForElementDisplayed('.tl-timeline-svg');
        const res = await checkElementWithMouseDisabled('.tl-timeline-wrapper');
        assertScreenShotMatch(res);
    });

    it.skip('timeline rows collapse when caret clicked', async () => {
        await waitForElementDisplayed('.tl-timeline-svg');

        //TODO:-- this does not work
        assert.equal((await $$('.tl-timeline-tracklabels > div')).length, 15);

        await (
            await getNthElements('.tl-timeline-wrapper .fa-caret-down', 1)
        ).click();

        assert.equal((await $$('.tl-timeline-tracklabels > div')).length, 6);
        const res = await checkElementWithMouseDisabled('.tl-timeline-wrapper');
        assertScreenShotMatch(res);

        // now restore it
        await (
            await getNthElements('.tl-timeline-wrapper .fa-caret-right', 0)
        ).click();

        assert.equal((await $$('.tl-timeline-tracklabels > div')).length, 15);
    });

    it('timeline zooms in on drag and drop', async () => {
        await (await getElement('.tl-timeline-svg')).waitForDisplayed();

        const moo = (await $$('.tl-timelineviewport text')).find(async t =>
            (await t.getHTML()).includes('>0<')
        );

        // this doesn't work too well
        await moo.dragAndDrop({ x: 300, y: 0, duration: 10000 }, 10000);

        await (await getElement('body')).moveTo({ x: 0, y: 0 });

        const res = checkElementWithMouseDisabled('.tl-timeline-wrapper');
    });
});
