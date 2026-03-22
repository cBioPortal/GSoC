const assert = require('assert');
const {
    goToUrlAndSetLocalStorageWithProperty,
    getText,
    getElement,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('displays appropriate user name/email', function() {
    it('shows email in the logged-in button with new value defined', async function() {
        const userEmailAddress = 'other@email.com';
        await goToUrlAndSetLocalStorageWithProperty(CBIOPORTAL_URL, true, {
            user_display_name: userEmailAddress,
        });
        assert.equal(
            await getText(
                '#dat-dropdown.btn-sm.dropdown-toggle.btn.btn-default'
            ),
            'Logged in as ' + userEmailAddress
        );
    });

    it('does not display login button if no value defined', async function() {
        await goToUrlAndSetLocalStorageWithProperty(CBIOPORTAL_URL, true, {
            user_display_name: null,
        });
        await getElement('#rightHeaderContent', {
            waitForExist: true,
        });
        !(await (
            await getElement(
                '#dat-dropdown.btn-sm.dropdown-toggle.btn.btn-default'
            )
        ).isExisting());
    });
});
