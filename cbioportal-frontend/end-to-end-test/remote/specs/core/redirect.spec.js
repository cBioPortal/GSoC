const {
    waitForOncoprint,
    goToUrlAndSetLocalStorage,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('/encodedRedirect', () => {
    // TODO: for the reslts view gene comparison groups PR, lets add a test
    //  that this handles encoded square brackets

    it('correctly redirects to a results view page URL', async () => {
        await goToUrlAndSetLocalStorage(
            `${CBIOPORTAL_URL}/encodedRedirect?encodedURL=aHR0cHM6Ly93d3cuY2Jpb3BvcnRhbC5vcmcvcmVzdWx0cy9vbmNvcHJpbnQ/Wl9TQ09SRV9USFJFU0hPTEQ9Mi4wJmNhbmNlcl9zdHVkeV9pZD1jb2FkcmVhZF90Y2dhX3B1YiZjYW5jZXJfc3R1ZHlfbGlzdD1jb2FkcmVhZF90Y2dhX3B1YiZjYXNlX3NldF9pZD1jb2FkcmVhZF90Y2dhX3B1Yl9ub25oeXBlcm11dCZnZW5lX2xpc3Q9S1JBUyUyME5SQVMlMjBCUkFGJmdlbmVfc2V0X2Nob2ljZT11c2VyLWRlZmluZWQtbGlzdCZnZW5ldGljX3Byb2ZpbGVfaWRzX1BST0ZJTEVfQ09QWV9OVU1CRVJfQUxURVJBVElPTj1jb2FkcmVhZF90Y2dhX3B1Yl9naXN0aWMmZ2VuZXRpY19wcm9maWxlX2lkc19QUk9GSUxFX01VVEFUSU9OX0VYVEVOREVEPWNvYWRyZWFkX3RjZ2FfcHViX211dGF0aW9ucw%3D%3D`
        );
        await waitForOncoprint();
    });
});
