const assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    getElement,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const studyEs0Summary = CBIOPORTAL_URL + '/study/summary?id=study_es_0';

describe('Virtual Study life cycle', function() {
    const vsTitle = 'Test VS ' + Date.now();
    let link;
    let vsId;
    const X_PUBLISHER_API_KEY = 'SECRETKEY';

    it('Login and navigate to the study_es_0 study summary page', async function() {
        await goToUrlAndSetLocalStorage(studyEs0Summary, true);
    });
    it('Click Share Virtual Study button', async function() {
        const studyView = await getElement('.studyView');
        const shareVSBtn = await studyView.$(
            'button[data-tour="action-button-bookmark"]'
        );
        await shareVSBtn.waitForClickable();
        await shareVSBtn.click();
    });
    it('Provide the title and save', async function() {
        const modalDialog = await getElement('.modal-dialog');
        await modalDialog.waitForDisplayed();
        const titleInput = await modalDialog.$('input#sniglet');
        await titleInput.setValue(vsTitle);
        const saveBtn = await modalDialog.$(
            '[data-tour="virtual-study-summary-save-btn"]'
        );
        await saveBtn.click();
        await (await modalDialog.$('.text-success')).waitForDisplayed();
        const linkInput = await modalDialog.$('input[type="text"]');
        const link = await linkInput.getValue();
        assert.ok(
            await link.startsWith('http'),
            'The value should be link, but was ' + link
        );
        vsId = await (
            await (
                await (await link.split('?')[1]).split('&')
            ).map(paramEqValue => paramEqValue.split('='))
        ).find(([key, value]) => key === 'id')[1];
        assert.ok(vsId, 'Virtual Study ID has not to be empty');
    });
    it('See the VS in My Virtual Studies section on the landing page', async function() {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
        const vsSection = await getElement(
            `//*[text()="${vsTitle}"]/ancestor::ul[1]`
        );
        await vsSection.waitForDisplayed();
        const sectionTitle = await vsSection.$('li label span');
        assert.equal(await sectionTitle.getText(), 'My Virtual Studies');
    });
    it('Publish the VS', async function() {
        const result = await browser.executeAsync(
            function(cbioUrl, vsId, key, done) {
                const url = cbioUrl + '/api/public_virtual_studies/' + vsId;
                const headers = new Headers();
                headers.append('X-PUBLISHER-API-KEY', key);
                fetch(url, {
                    method: 'POST',
                    headers: headers,
                })
                    .then(response => {
                        done({
                            success: response.ok,
                            message: 'HTTP Status: ' + response.status,
                        });
                    })
                    .catch(error => {
                        done({ success: false, message: error.message });
                    });
            },
            CBIOPORTAL_URL,
            vsId,
            X_PUBLISHER_API_KEY
        );
        assert.ok(result.success, result.message);
    });
    it('See the VS in Public Virtual Studies section on the landing page', async function() {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
        const vsSection = await getElement(
            `//*[text()="${vsTitle}"]/ancestor::ul[1]`
        );
        await vsSection.waitForDisplayed();
        const sectionTitle = await vsSection.$('li label span');
        assert.equal(await sectionTitle.getText(), 'Public Virtual Studies');
    });
    it('Re-publish the VS specifying PubMed ID and type of cancer', async function() {
        const result = await browser.executeAsync(
            function(cbioUrl, vsId, key, done) {
                const headers = new Headers();
                headers.append('X-PUBLISHER-API-KEY', key);
                fetch(
                    cbioUrl +
                        '/api/public_virtual_studies/' +
                        vsId +
                        '?pmid=28783718&typeOfCancerId=aca',
                    {
                        method: 'POST',
                        headers: headers,
                    }
                )
                    .then(response => {
                        done({
                            success: response.ok,
                            message: 'HTTP Status: ' + response.status,
                        });
                    })
                    .catch(error => {
                        done({ success: false, message: error.message });
                    });
            },
            CBIOPORTAL_URL,
            vsId,
            X_PUBLISHER_API_KEY
        );
        assert.ok(result.success, result.message);
    });
    it('See the VS in the Adrenocortical Adenoma section with PubMed link', async function() {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
        const vsRow = await getElement(
            `//*[text()="${vsTitle}"]/ancestor::li[1]`
        );
        const vsSection = await vsRow.parentElement();
        await vsSection.waitForDisplayed();
        const sectionTitle = await vsSection.$('li label span');
        assert.equal(await sectionTitle.getText(), 'Adrenocortical Adenoma');
        //has PubMed link
        assert.ok(await (await vsRow.$('.fa-book')).isExisting());
    });
    it('Un-publish the VS', async function() {
        const result = await browser.executeAsync(
            function(cbioUrl, vsId, key, done) {
                const headers = new Headers();
                headers.append('X-PUBLISHER-API-KEY', key);
                fetch(cbioUrl + '/api/public_virtual_studies/' + vsId, {
                    method: 'DELETE',
                    headers: headers,
                })
                    .then(response => {
                        done({
                            success: response.ok,
                            message: 'HTTP Status: ' + response.status,
                        });
                    })
                    .catch(error => {
                        done({ success: false, message: error.message });
                    });
            },
            CBIOPORTAL_URL,
            vsId,
            X_PUBLISHER_API_KEY
        );
        assert.ok(result.success, result.message);
    });

    it('Removing the VS', async function() {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
        const vsRow = await getElement(
            `//*[text()="${vsTitle}"]/ancestor::li[1]`
        );
        await vsRow.waitForDisplayed();

        const removeBtn = await vsRow.$('.fa-trash');
        await removeBtn.click();
    });

    it('The VS disappears from the landing page', async function() {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
        await (
            await getElement('[data-test="cancerTypeListContainer"]')
        ).waitForDisplayed();
        const vsRowTitle = await getElement(`//*[text()="${vsTitle}"]`);
        await browser.pause(100);
        assert.ok(!(await vsRowTitle.isExisting()));
    });
});
