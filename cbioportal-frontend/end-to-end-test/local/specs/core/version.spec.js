const {
    goToUrlAndSetLocalStorage,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

// this consoles the backend version to make sure
// we are running correct backend
describe('Backend version', function() {
    it('Retrieves backend info', async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL, true);
        await browser.setTimeout({ script: 5000 });
        const d = await browser.executeAsync(done => {
            // browser context - you may not access client or console
            fetch('/api/info').then(d => {
                d.json().then(t => {
                    done(JSON.stringify(t));
                });
            });
        });
        console.log(d);
    });
});
