const assert = require('assert');
const {
    setServerConfiguration,
    goToUrlAndSetLocalStorage,
    getElement,
    clickElement,
} = require('../../../shared/specUtils_Async');

const CBIOPORTAL_URL = process.env.CBIOPORTAL_URL.replace(/\/$/, '');

const getBrowserHeight = async () => {
    return Number((await browser.getWindowSize()).height);
};

const customTabBase = location => {
    return [
        {
            title: 'Sync Tab',
            id: 'customTab1',
            location: location,
            mountCallbackName: 'renderCustomTab1',
            hide: false,
            unmountOnHide: false,
        },
        {
            title: 'Async Tab',
            id: 'customTab2',
            location: location,
            mountCallbackName: 'renderCustomTab1',
            hide: false,
            unmountOnHide: false,
            hideAsync: `()=>{
                   return new Promise((resolve)=>{
                        setTimeout(()=>{
                            resolve(true);
                        }, 5000);
                   });
           }`,
        },
    ];
};

const goToUrlWithCustomTabConfig = async (url, custom_tabs) => {
    await browser.url(`${CBIOPORTAL_URL}/blank`);
    await setServerConfiguration({ custom_tabs });
    await goToUrlAndSetLocalStorage(url);
};

const waitForMainTabs = async () => {
    await browser.waitUntil(
        async () => {
            return await (await getElement('.mainTabs')).isDisplayed();
        },
        { timeout: 50000 }
    );
};

const runTests = async (pageName, url, tabLocation) => {
    describe(`${pageName} Custom Tabs`, () => {
        before(
            async () =>
                await browser.setWindowSize(2000, await getBrowserHeight())
        );

        it.skip('Sync and async hide/show works', async function() {
            this.retries(0);

            await goToUrlWithCustomTabConfig(url, customTabBase(tabLocation));

            await browser.execute(() => {
                window.renderCustomTab1 = async function(div, tab) {
                    (await getElement(div)).append(
                        `<div>this is the content for ${tab.title}</div>`
                    );
                };
            });

            await waitForMainTabs();

            assert.equal(
                await (await getElement('=Async Tab')).isDisplayed(),
                false,
                'We do NOT see async tab initially'
            );

            assert(
                await (await getElement('=Sync Tab')).isDisplayed(),
                'We see sync tab immediately'
            );

            await browser.pause(6000);

            assert(
                await (await getElement('=Async Tab')).isDisplayed(),
                'Async tab displays after pause'
            );

            await (await getElement('=Sync Tab')).click();

            assert(
                await (
                    await getElement('div=this is the content for Sync Tab')
                ).isDisplayed()
            );

            await (await getElement('=Async Tab')).click();

            assert(
                await (
                    await getElement('div=this is the content for Async Tab')
                ).isDisplayed()
            );
        });

        it('Tab page location configuration is obeyed', async () => {
            const conf = [
                {
                    title: 'Patient Tab',
                    id: 'customTab1',
                    location: 'SOMETHING_ELSE',
                    mountCallbackName: 'renderCustomTab1',
                    hide: false,
                },
                {
                    title: 'Result Tab',
                    id: 'customTab2',
                    location: tabLocation,
                    mountCallbackName: 'renderCustomTab1',
                    hide: false,
                },
            ];

            await goToUrlWithCustomTabConfig(url, conf);

            await browser.setWindowSize(2500, await getBrowserHeight());

            await waitForMainTabs();

            assert.equal(
                await (await getElement('=Patient Tab')).isDisplayed(),
                false,
                'We do NOT see hidden tab'
            );

            assert.equal(
                await (await getElement('=Result Tab')).isDisplayed(),
                true,
                'We do see showing tab'
            );
        });

        it('Hide property indeed hides custom tab', async () => {
            const conf = [
                {
                    title: 'Hidden Tab',
                    id: 'customTab1',
                    location: tabLocation,
                    mountCallbackName: 'renderCustomTab1',
                    hide: true,
                    unmountOnHide: false,
                },
                {
                    title: 'Showing Tab',
                    id: 'customTab1',
                    location: tabLocation,
                    mountCallbackName: 'renderCustomTab1',
                    hide: false,
                    unmountOnHide: false,
                },
            ];

            await goToUrlWithCustomTabConfig(url, conf);

            await browser.setWindowSize(2000, Number(await getBrowserHeight()));

            await waitForMainTabs();

            assert.equal(
                await (await getElement('=Hidden Tab')).isDisplayed(),
                false,
                'We do NOT see hidden tab'
            );

            assert.equal(
                await (await getElement('=Showing Tab')).isDisplayed(),
                true,
                'We do see showing tab'
            );
        });

        it('Routing directly to conditional tab forces it to show', async () => {
            const conf = [
                {
                    title: 'Async Tab',
                    id: 'customTab1',
                    location: tabLocation,
                    hideAsync: `()=>{
                           return new Promise((resolve)=>{
                                setTimeout(()=>{
                                    resolve(true);
                                }, 2000);
                           });
                }`,
                },
                {
                    title: 'Async Tab 2',
                    id: 'customTab2',
                    location: tabLocation,
                    hideAsync: `()=>{
                           return new Promise((resolve)=>{
                                setTimeout(()=>{
                                    resolve(true);
                                }, 2000);
                           });
                    }`,
                },
            ];

            await goToUrlWithCustomTabConfig(
                url.replace(/\?/, '/customTab1?'),
                conf
            );
            await waitForMainTabs();

            // TODO: why are we assert
            assert.equal(
                await (
                    await getElement('[data-test=LoadingIndicator]', {
                        timeout: 5000,
                    })
                ).isDisplayed(),
                true,
                'tab loading indicator is showing'
            );

            // TODO: this is not a quality test
            // when we are directly routed to tab
            // the navigation tab button DOES show
            // even though hideAsync is still pending

            assert.equal(
                await (
                    await getElement('=Async Tab', {
                        timeout: 5000,
                    })
                ).isDisplayed(),
                true,
                'We see pending custom tab button when routed to it'
            );

            assert.equal(
                await (await getElement('=Async Tab 2')).isDisplayed(),
                false,
                'We do not see the second custom tab button'
            );
        });

        it('Remounts tab only when tracked url param changes (part of hash in url wrapper)', async () => {
            const conf = [
                {
                    title: 'Async Tab',
                    id: 'customTab1',
                    location: tabLocation,
                    hideAsync: `()=>{
                           return new Promise((resolve)=>{
                                setTimeout(()=>{
                                    resolve(true);
                                }, 1000);
                           });
                }`,
                    mountCallbackName: 'renderCustomTab1',
                },
            ];

            await goToUrlWithCustomTabConfig(url, conf);

            await waitForMainTabs();

            await browser.setWindowSize(2000, await getBrowserHeight());

            await browser.execute(() => {
                window.renderCustomTab1 = div => {
                    $(div).append(`<div>First render</div>`);
                };
            });

            // offset to avoid overlapping elements
            await clickElement('=Async Tab');

            await browser.pause(1000);

            assert(await (await getElement('div=First render')).isDisplayed());

            // redefine custom tab render
            // so we can see when it's called
            await browser.execute(() => {
                window.renderCustomTab1 = function(div, _tab) {
                    $(div).append(`<div>Second render</div>`);
                };
            });

            await browser.pause(2000);

            // switch to new tab and then back
            await clickElement('.mainTabs .tabAnchor');
            await clickElement('=Async Tab');

            const render1 = await (
                await getElement('div=First render')
            ).isDisplayed();
            const render2 = await (
                await getElement('div=Second render')
            ).isDisplayed();

            // we haven't re-mounted the tab
            assert(
                !render2 && render1,
                "merely switching tabs didn't call mount function"
            );

            // For study page, I do not see a way to evoke a remount (e.g., by changing query params)
            // I will just skip this test for study page by returning 'true' here.
            if (tabLocation === 'STUDY_PAGE') {
                assert(true);
                return;
            }

            // the following two commands are intended to trigger
            // remount of MSKTabs and thus remount of custom tab+
            // kinda annoying, i know
            switch (tabLocation) {
                case 'RESULTS_PAGE':
                    await browser.execute(() => {
                        window.urlWrapper.updateRoute({
                            gene_list: 'BRAF KRAS',
                        });
                    });
                    break;
                case 'PATIENT_PAGE':
                    await (await getElement('.nextPageBtn')).isDisplayed();
                    await clickElement('.nextPageBtn');
                    break;
                case 'COMPARISON_PAGE':
                    await clickElement(
                        "[data-test='groupSelectorButtonMSI/CIMP']"
                    );
                    break;
                case 'STUDY_PAGE':
                    // For study page, I do not see a way to evoke a remount (eg. by changing query params)
                    break;
            }

            await browser.pause(2000);

            // 'Second Render' doesn't exist anymore for comparison page due to the newer way we load tabs
            if (tabLocation !== 'COMPARISON_PAGE') {
                await (
                    await getElement('div=Second render')
                ).waitForDisplayed();

                assert(
                    await (await getElement('div=Second render')).isDisplayed(),
                    'changing query causes custom tab to remount'
                );
            }
        });
    });
};

const resultsUrl = `${CBIOPORTAL_URL}/results?cancer_study_list=coadread_tcga_pub&cancer_study_id=coadread_tcga_pub&genetic_profile_ids_PROFILE_MUTATION_EXTENDED=coadread_tcga_pub_mutations&genetic_profile_ids_PROFILE_COPY_NUMBER_ALTERATION=coadread_tcga_pub_gistic&Z_SCORE_THRESHOLD=2.0&case_set_id=coadread_tcga_pub_nonhypermut&gene_list=KRAS%20NRAS%20BRAF`;

const studyUrl = `${CBIOPORTAL_URL}/study?id=ucec_tcga_pub`;

const patientUrl = `${CBIOPORTAL_URL}/patient?studyId=ucec_tcga_pub&caseId=TCGA-AP-A053#navCaseIds=ucec_tcga_pub:TCGA-AP-A053,ucec_tcga_pub:TCGA-BG-A0M8,ucec_tcga_pub:TCGA-BG-A0YV,ucec_tcga_pub:TCGA-BS-A0U8`;

const comparisonUrl = `${CBIOPORTAL_URL}/comparison?comparisonId=61845a6ff8f71021ce56e22b`;

describe('Patient Cohort View Custom Tab Tests', () => {
    const conf = [
        {
            title: 'Sync Tab',
            id: 'customTab1',
            location: 'PATIENT_PAGE',
            mountCallback: `(div)=>{
                    $(div).html("tab for patient " + window.location.search.split("=").slice(-1))
                }`,
        },
        {
            title: 'Async Tab',
            id: 'customTab2',
            location: 'PATIENT_PAGE',
            hide: false,
            hideAsync: `()=>{
                           return new Promise((resolve)=>{
                                const int = setInterval(()=>{
                                    if ( $(".tabAnchor_customTab1").length ) {
                                      clearInterval(int)
                                       setTimeout(()=>{
                                            resolve(true);
                                        }, 10000);
                                    }
                                },500);
                           });
                    }`,
        },
    ];

    it('Navigating between patients changes tab contents', async function() {
        this.retries(0);

        await goToUrlWithCustomTabConfig(patientUrl, conf);

        await (await getElement('a=Summary')).waitForDisplayed();

        const asyncExists = await (
            await getElement('a=Async Tab')
        ).isExisting();

        if (asyncExists) {
            assert.fail("Async exists when it shouldn't!");
        }

        await clickElement('=Sync Tab');

        assert.equal(
            await (
                await getElement('div=tab for patient TCGA-AP-A053')
            ).isDisplayed(),
            true,
            'We first patient'
        );

        await browser.pause(11000);

        assert.equal(
            await (await getElement('=Async Tab')).isDisplayed(),
            true,
            'Async tab has showed up'
        );

        await clickElement('.nextPageBtn');

        await (await getElement('.mainTabs')).waitForDisplayed();

        assert.equal(
            await (await getElement('=Async Tab')).isDisplayed(),
            false,
            'Async is hidden again (pending)'
        );

        assert.equal(
            await (
                await getElement('div=tab for patient TCGA-BG-A0M8')
            ).isDisplayed(),
            true,
            'We see next patient'
        );

        await (await getElement('.prevPageBtn')).waitForDisplayed();

        await clickElement('.prevPageBtn');

        await (
            await getElement('div=tab for patient TCGA-AP-A053')
        ).waitForDisplayed();
    });
});

describe('It runs test for the respective Tab views', async () => {
    await runTests('ResultsView', resultsUrl, 'RESULTS_PAGE');
    await runTests('StudyView', studyUrl, 'STUDY_PAGE');
    await runTests('PatientView', patientUrl, 'PATIENT_PAGE');
    await runTests('ComparisonPage', comparisonUrl, 'COMPARISON_PAGE');
});
