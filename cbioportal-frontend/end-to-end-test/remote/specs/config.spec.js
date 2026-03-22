var assert = require('assert');
const {
    goToUrlAndSetLocalStorage,
    setServerConfiguration,
} = require('../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

describe('homepage', function() {
    this.retries(0);

    before(async () => {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        await browser.execute(function() {
            this.localStorage.setItem('frontendConfig', '{}');
        });
    });

    afterEach(async () => {
        await browser.execute(function() {
            this.localStorage.setItem(
                'frontendConfig',
                JSON.stringify({ serverConfig: {} })
            );
        });
    });

    it('login ui observes authenticationMethod', async function() {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        await (await $('#rightHeaderContent')).waitForExist();

        await (await $('button=Login')).isExisting();

        await browser.execute(function() {
            this.localStorage.setItem(
                'frontendConfig',
                JSON.stringify({
                    serverConfig: { authenticationMethod: null },
                })
            );
        });

        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        await (await $('#rightHeaderContent')).waitForExist();

        assert.equal(await (await $('button=Login')).isExisting(), false);
    });

    it('dataset nav observes authenticationMethod', async function() {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        await (await $('#rightHeaderContent')).waitForExist();

        await (await $('a=Data Sets')).isExisting();

        await setServerConfiguration({ skin_show_data_tab: false });

        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        await (await $('#rightHeaderContent')).waitForExist();

        assert.equal(await (await $('a=Data Sets')).isExisting(), false);
    });

    it('shows right logo in header bar depending on skin_right_logo', async function() {
        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        await (await $('#rightHeaderContent')).waitForExist();

        await browser.pause(1000);
        let doesLogoExist = await browser.execute(function() {
            return (
                $("img[src='images/msk_logo_transparent_black.png']").length > 0
            );
        });

        assert(!doesLogoExist);

        await setServerConfiguration({
            skin_right_logo: 'msk_logo_transparent_black.png',
        });

        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        await (await $('#rightHeaderContent')).waitForExist();

        // this logo now exists
        await (
            await $("img[src*='images/msk_logo_transparent_black.png']")
        ).waitForExist();
    });

    it('shows skin_blurb as configured', async function() {
        await setServerConfiguration({
            skin_blurb: "<div id='blurbDiv'>This is the blurb</div>",
        });

        await goToUrlAndSetLocalStorage(CBIOPORTAL_URL);

        await (await $('#blurbDiv')).waitForExist();
    });
});
