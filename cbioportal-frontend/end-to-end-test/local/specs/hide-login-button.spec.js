const assert = require('assert');
const {
    goToUrlAndSetLocalStorageWithProperty,
    getElement,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');
const loggedInButton = '#rightHeaderContent .identity';

describe('hide logged-in button feature', () => {
    it('does not show logged-in button when portal property set', async function() {
        await goToUrlAndSetLocalStorageWithProperty(CBIOPORTAL_URL, true, {
            skin_hide_logout_button: true,
        });
        assert(!(await (await getElement(loggedInButton)).isExisting()));
    });
});
