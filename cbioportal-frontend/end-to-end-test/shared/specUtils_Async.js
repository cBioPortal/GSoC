const clipboardy = require('clipboardy');
const assertScreenShotMatch = require('./lib/testUtils').assertScreenShotMatch;

const DEFAULT_TIMEOUT = 5000;

async function waitForStudyQueryPage(timeout) {
    await getElement('div[data-test="cancerTypeListContainer"]', {
        timeout: timeout || 10000,
    });
}

async function waitForGeneQueryPage(timeout) {
    // wait until fade effect on studyList has finished (if running in forkedMode)
    await (await $('[data-test=studyList]')).waitForExist({
        timeout: timeout,
        reverse: true,
    });
    await (await $('div[data-test="molecularProfileSelector"]')).waitForExist({
        timeout: timeout || 10000,
    });
}

async function waitForPlotsTab(timeout) {
    await (await $('div.axisBlock')).waitForDisplayed({
        timeout: timeout || 20000,
    });
}

async function waitForAndCheckPlotsTab() {
    await waitForElementDisplayed('div[data-test="PlotsTabPlotDiv"]', {
        timeout: 20000,
    });
    const res = await checkElementWithElementHidden(
        'div[data-test="PlotsTabEntireDiv"]',
        '.popover',
        { hide: ['.qtip'] }
    );
    assertScreenShotMatch(res);
}

async function waitForCoExpressionTab(timeout) {
    await getElement('#coexpressionTabGeneTabs', { timeout: timeout || 20000 });
}

async function waitForPatientView(timeout) {
    await getElement('#patientViewPageTabs', { timeout: timeout || 20000 });
    await waitForElementDisplayed('[data-test=patientview-copynumber-table]', {
        timeout: timeout || 20000,
    });
    await waitForElementDisplayed('[data-test=patientview-mutation-table]', {
        timeout: timeout || 20000,
    });
}

async function waitForOncoprint(timeout = 20000) {
    await browser.pause(500); // give oncoprint time to disappear
    await browser.waitUntil(
        async () => {
            return (
                !(await (await $('.oncoprintLoadingIndicator')).isExisting()) && // wait for loading indicator to hide, and
                (await (await $('#oncoprintDiv svg rect')).isExisting()) && // as a proxy for oncoprint being rendered, wait for an svg rectangle to appear in the legend
                (await (await $('.oncoprint__controls')).isExisting())
            ); // oncoprint controls are showing
        },
        { timeout }
    );
    await browser.pause(1000);
}

async function waitForComparisonTab() {
    await (
        await $('[data-test=GroupComparisonAlterationEnrichments]')
    ).waitForDisplayed();
}

async function getTextInOncoprintLegend() {
    const elements = await $$('#oncoprintDiv .oncoprint-legend-div svg text');
    const texts = await Promise.all(elements.map(t => t.getHTML(false)));
    return texts.join(' ');
}
async function setSettingsMenuOpen(open, buttonId = 'GlobalSettingsButton') {
    const button = 'button[data-test="' + buttonId + '"]';
    const dropdown = 'div[data-test="GlobalSettingsDropdown"]';
    await (await $(button)).waitForDisplayed();
    await browser.waitUntil(
        async () => {
            if (open === (await (await $(dropdown)).isDisplayedInViewport())) {
                return true;
            } else {
                await (await $(button)).click();
                await (await $(dropdown)).waitForDisplayed({
                    timeout: 6000,
                    reverse: !open,
                });
                return false;
            }
        },
        {
            timeout: 10000,
            timeoutMsg: `Couldn't ${
                open ? 'open' : 'close'
            } results page settings menu`,
            interval: 2000,
        }
    );
}

async function getElementByTestHandle(handle, options) {
    if (options?.timeout) {
        const el = await getElement(`[data-test="${handle}"]`);
        await el.waitForExist(options);
    }

    return await getElement(`[data-test="${handle}"]`);
}

async function elementExists(selector) {
    return await (await $(selector)).isExisting();
}

/**
 * @param {string} testHandle  the data-test handle of the element
 * @param {string} type  the type of color to get background-color, border-color , default is 'color'
 * @returns {Promise<string>} `hex` color of the element
 */
async function getColorByTestHandle(testHandle, type = 'color') {
    const element = await getElementByTestHandle(testHandle);
    const color = await element.getCSSProperty(type);
    return color.parsed.hex;
}

async function getCSSProperty(selector, property) {
    const element = await getElement(selector);
    const value = await element.getCSSProperty(property);
    return value;
}
/**
 * @param {string} selector
 * @param {number} index
 * @param {string} type border-color, background-color, color
 * @returns {Promise<string>} `hex` color of the element
 */
async function getColorOfNthElement(selector, index, type = 'color') {
    const element = await getNthElements(selector, index);
    const color = await element.getCSSProperty(type);
    return color.parsed.hex;
}

async function setOncoprintMutationsMenuOpen(open) {
    const mutationColorMenuButton = '#mutationColorDropdown';
    const mutationColorMenuDropdown =
        'div.oncoprint__controls__mutation_color_menu';
    await (await getElement('div.oncoprint__controls')).moveTo();
    await (await getElement(mutationColorMenuButton)).waitForDisplayed();
    await browser.waitUntil(
        async () => {
            if (
                open ===
                (await (
                    await getElement(mutationColorMenuDropdown)
                ).isDisplayedInViewport())
            ) {
                return true;
            } else {
                await clickElement(mutationColorMenuButton);
                return false;
            }
        },
        {
            timeout: 10000,
            timeoutMsg: `Couldn't ${
                open ? 'open' : 'close'
            } Mutations menu in Oncoprint`,
            interval: 2000,
        }
    );
}

async function setCheckboxChecked(checked, selector, failure_message) {
    const checkbox_elt = await $(selector);
    await browser.waitUntil(
        async () => {
            if (await checkbox_elt.isDisplayed()) {
                await checkbox_elt.click();
                return checked === (await checkbox_elt.isSelected());
            } else {
                return false;
            }
        },
        {
            timeout: 30000,
            timeoutMsg: failure_message,
            interval: 2000,
        }
    );
}

/**
 * Note: before calling this function,
 * check if dropdown element is in correct state
 * (i.e. displayed or not)qq
 */
async function setDropdownOpen(
    open,
    button_selector_or_elt,
    dropdown_selector_or_elt,
    failure_message
) {
    await browser.waitUntil(
        async () => {
            const dropdown_elt =
                typeof dropdown_selector_or_elt === 'string'
                    ? await $(dropdown_selector_or_elt)
                    : dropdown_selector_or_elt;
            // check if exists first because sometimes we get errors with isVisible if it doesn't exist
            const isOpen = (await dropdown_elt.isExisting())
                ? await dropdown_elt.isDisplayedInViewport()
                : false;
            if (open === isOpen) {
                return true;
            } else {
                const button_elt =
                    typeof button_selector_or_elt === 'string'
                        ? await $(button_selector_or_elt)
                        : button_selector_or_elt;
                await button_elt.waitForExist();
                await button_elt.click();
                await browser.pause(100);
                return false;
            }
        },
        {
            timeout: 10000,
            timeoutMsg: failure_message,
            interval: 2000,
        }
    );
}

/**
 * @param {string} url
 * @returns {string} modifiedUrl
 */
function getUrl(url) {
    if (!useExternalFrontend) {
        console.log('Connecting to: ' + url);
    } else {
        const urlparam = 'localdev';
        const prefix = url.indexOf('?') > 0 ? '&' : '?';
        console.log('Connecting to: ' + `${url}${prefix}${urlparam}=true`);
        url = `${url}${prefix}${urlparam}=true`;
    }
    return url;
}

async function goToUrlAndSetLocalStorage(url, authenticated = false) {
    const currentUrl = await browser.getUrl();
    const needToLogin =
        authenticated && (!currentUrl || !currentUrl.includes('http'));
    // navigate to blank page first to prevent issues with url hash params
    await browser.url('about:blank');
    if (!useExternalFrontend) {
        await browser.url(url);
        console.log('Connecting to: ' + url);
    } else if (useNetlifyDeployPreview) {
        await browser.url(url);
        await browser.execute(
            function(config) {
                this.localStorage.setItem('netlify', config.netlify);
            },
            { netlify: netlifyDeployPreview }
        );
        await browser.url(url);
        console.log('Connecting to: ' + url);
    } else {
        var urlparam = useLocalDist ? 'localdist' : 'localdev';
        var prefix = url.indexOf('?') > 0 ? '&' : '?';
        await browser.url(`${url}${prefix}${urlparam}=true`);
        console.log('Connecting to: ' + `${url}${prefix}${urlparam}=true`);
    }
    if (needToLogin) await keycloakLogin(10000);
    await browser.pause(1000);
}

const goToUrlAndSetLocalStorageWithProperty = async (
    url,
    authenticated,
    props
) => {
    await goToUrlAndSetLocalStorage(url, authenticated);
    await setServerConfiguration(props);
    await goToUrlAndSetLocalStorage(url, authenticated);
};

async function setServerConfiguration(props) {
    await browser.execute(
        function(frontendConf) {
            this.localStorage.setItem(
                'frontendConfig',
                JSON.stringify(frontendConf)
            );
        },
        { serverConfig: props }
    );
}

async function waitForElementDisplayed(selector, options = {}) {
    const element = await getElement(selector, options);
    await element.waitForDisplayed({
        timeout: options.timeout || 10000,
        ...options,
    });

    return element;
}

async function sessionServiceIsEnabled() {
    return await browser.execute(function() {
        return window.getServerConfig().sessionServiceEnabled;
    }).value;
}

async function showGsva() {
    await setServerConfiguration({ skin_show_gsva: true });
}

async function waitForNumberOfStudyCheckboxes(expectedNumber, text) {
    await browser.waitUntil(async () => {
        const cbs = await jq(`[data-test="StudySelect"] input:checkbox`);
        return cbs.length === expectedNumber;
    });
}

async function getNthOncoprintTrackOptionsElements(n) {
    // n is one-indexed

    const button_selector =
        '#oncoprintDiv .oncoprintjs__track_options__toggle_btn_img.nth-' + n;
    const dropdown_selector =
        '#oncoprintDiv .oncoprintjs__track_options__dropdown.nth-' + n;

    return {
        button: await $(button_selector, {
            timeout: 20000,
        }),
        button_selector,
        dropdown: await $(dropdown_selector, {
            timeout: 20000,
        }),
        dropdown_selector,
    };
}

const netlifyDeployPreview = process.env.NETLIFY_DEPLOY_PREVIEW;
const useNetlifyDeployPreview = !!netlifyDeployPreview;

const useExternalFrontend = !process.env
    .FRONTEND_TEST_DO_NOT_LOAD_EXTERNAL_FRONTEND;

const useLocalDist = process.env.FRONTEND_TEST_USE_LOCAL_DIST;

async function waitForNetworkQuiet(timeout) {
    await browser.waitUntil(
        async () => {
            return (
                (await browser.execute(function() {
                    return window.ajaxQuiet === true;
                })) == true
            );
        },
        { timeout }
    );
}

function getPortalUrlFromEnv() {
    return process.env.CBIOPORTAL_URL.replace(/\/$/, '');
}

async function toStudyViewSummaryTab() {
    const summaryTab = '#studyViewTabs a.tabAnchor_summary';
    const summaryContent = "[data-test='summary-tab-content']";
    if (!(await (await $(summaryContent)).isDisplayedInViewport())) {
        await (await $(summaryTab)).waitForDisplayed({ timeout: 10000 });
        await clickElement(summaryTab);
        await (await $(summaryContent)).waitForDisplayed({ timeout: 10000 });
    }
}

async function toStudyViewClinicalDataTab() {
    const clinicalDataTab = '#studyViewTabs a.tabAnchor_clinicalData';
    const clinicalDataContent = "[data-test='clinical-data-tab-content']";
    if (!(await (await $(clinicalDataContent)).isDisplayedInViewport())) {
        await (await $(clinicalDataTab)).waitForDisplayed({ timeout: 10000 });
        await clickElement(clinicalDataTab);
        await (await $(clinicalDataContent)).waitForDisplayed({
            timeout: 10000,
        });
    }
}

async function removeAllStudyViewFilters() {
    const clearAllFilter = "[data-test='clear-all-filters']";
    if (await (await $(clearAllFilter)).isDisplayedInViewport()) {
        await (await $(clearAllFilter)).click();
    }
}

async function waitForStudyViewSelectedInfo() {
    await (await $("[data-test='selected-info']")).waitForDisplayed({
        timeout: 20000,
    });
    // pause to wait the animation finished
    await browser.pause(2000);
}

async function waitForStudyView() {
    await browser.waitUntil(
        async () => (await $$('.sk-spinner')).length === 0,
        {
            timeout: 10000,
        }
    );
}

async function waitForGroupComparisonTabOpen(timeout) {
    await waitForElementDisplayed('[data-test=ComparisonPageOverlapTabDiv]', {
        timeout: timeout || 10000,
    });
}

async function getTextFromElement(element) {
    return (await (await $(element)).getText()).trim();
}

async function getNumberOfStudyViewCharts() {
    return (await $$('div.react-grid-item')).length;
}

async function setInputText(selector, text) {
    // backspace to delete current contents - webdriver is supposed to clear it but it doesnt always work
    // await (await $(selector)).click();
    //browser.keys('\uE003'.repeat($(selector).getValue().length));

    await (await $(selector)).clearValue();

    await (await $(selector)).setValue('');
    //browser.pause(1000);

    await (await $(selector)).setValue(text);
}

async function getReactSelectOptions(parent) {
    await (await parent.$('.Select-control')).click();
    return await parent.$$('.Select-option');
}

async function selectReactSelectOption(parent, optionText) {
    await (await reactSelectOption(parent, optionText)).click();
}

async function reactSelectOption(parent, optionText, loose = false) {
    await setDropdownOpen(
        true,
        await parent.$('.Select-control'),
        loose
            ? await parent.$('.Select-option*=' + optionText)
            : await parent.$('.Select-option=' + optionText)
    );
    if (loose) {
        return await parent.$('.Select-option*=' + optionText);
    }
    return await parent.$('.Select-option=' + optionText);
}

async function selectCheckedOption(parent, optionText, loose = false) {
    await (await parent.$('.default-checked-select')).click();
    if (loose) {
        return await parent.$('.checked-select-option*=' + optionText);
    }
    return await parent.$('.checked-select-option=' + optionText);
}

async function getSelectCheckedOptions(parent) {
    await (await parent.$('.default-checked-select')).click();
    return await parent.$$('.checked-select-option');
}

async function pasteToElement(elementSelector, text) {
    await clipboardy.writeSync(text);
    await clickElement(elementSelector);
    await browser.keys(['Shift', 'Insert']);
}

async function checkOncoprintElement(selector, viewports) {
    //browser.moveToObject('body', 0, 0);

    if (
        await $('.oncoprint__controls .open #viewDropdownButton').isExisting()
    ) {
        await clickElement('.dropdown.open #viewDropdownButton');
    }

    await browser.execute(() => {
        frontendOnc.clearMouseOverEffects(); // clear mouse hover effects for uniform screenshot
    });
    return await checkElementWithMouseDisabled(selector || '#oncoprintDiv', 0, {
        hide: [
            '.qtip',
            '.dropdown-menu',
            '.oncoprintjs__track_options__dropdown',
            '.oncoprintjs__cell_overlay_div',
        ],
        viewports: viewports,
    });
}

async function jsApiHover(selector) {
    await browser.execute(function(_selector) {
        $(_selector)[0].dispatchEvent(
            new MouseEvent('mouseover', { bubbles: true })
        );
    }, selector);
}

async function jsApiClick(selector) {
    await browser.execute(function(_selector) {
        $(_selector)[0].dispatchEvent(
            new MouseEvent('click', { bubbles: true })
        );
    }, selector);
}

async function executeInBrowser(callback) {
    return await browser.execute(callback);
}

async function checkElementWithTemporaryClass(
    selectorForChecking,
    selectorForTemporaryClass,
    temporaryClass,
    pauseTime,
    options
) {
    await browser.execute(
        (selectorForTemporaryClass, temporaryClass) => {
            $(selectorForTemporaryClass).addClass(temporaryClass);
        },
        selectorForTemporaryClass,
        temporaryClass
    );
    await browser.pause(pauseTime);
    const res = await browser.checkElement(selectorForChecking, '', options);
    await browser.execute(
        function(selectorForTemporaryClass, temporaryClass) {
            $(selectorForTemporaryClass).removeClass(temporaryClass);
        },
        selectorForTemporaryClass,
        temporaryClass
    );
    return res;
}

async function checkElementWithMouseDisabled(selector, pauseTime, options) {
    await browser.execute(() => {
        const style = 'display:block !important;visibility:visible !important;';
        $(`<div id='blockUIToDisableMouse' style='${style}'></div>`).appendTo(
            'body'
        );
    });

    await getElement(selector, { timeout: 5000 });

    const ret = await checkElementWithTemporaryClass(
        selector,
        selector,
        'disablePointerEvents',
        pauseTime || 0,
        options
    );

    await browser.execute(() => {
        $('#blockUIToDisableMouse').remove();
    });

    return ret;
}

async function checkElementWithElementHidden(
    selector,
    selectorToHide,
    options
) {
    await browser.execute(selectorToHide => {
        $(
            `<style id="tempHiddenStyles" type="text/css">${selectorToHide}{opacity:0;}</style>`
        ).appendTo('head');
    }, selectorToHide);

    const res = await browser.checkElement(selector, '', options);

    await browser.execute(selectorToHide => {
        $('#tempHiddenStyles').remove();
    }, selectorToHide);

    return res;
}

async function clickQueryByGeneButton() {
    await (await $('.disabled[data-test=queryByGeneButton]')).waitForExist({
        reverse: true,
    });
    await (await getElementByTestHandle('queryByGeneButton')).click();
    await (await $('body')).scrollIntoView();
}

async function clickModifyStudySelectionButton() {
    await clickElement('[data-test="modifyStudySelectionButton"]');
}

async function getOncoprintGroupHeaderOptionsElements(trackGroupIndex) {
    //trackGroupIndex is 0-indexed

    const button_selector =
        '#oncoprintDiv .oncoprintjs__header__toggle_btn_img.track-group-' +
        trackGroupIndex;
    const dropdown_selector =
        '#oncoprintDiv .oncoprintjs__header__dropdown.track-group-' +
        trackGroupIndex;

    return {
        button: await $(button_selector),
        button_selector,
        dropdown: await $(dropdown_selector),
        dropdown_selector,
    };
}

/**
 *
 * @param {string} url
 * @param {any} data
 * @param {boolean} authenticated
 */
async function postDataToUrl(url, data, authenticated = true) {
    const currentUrl = await browser.getUrl();
    const needToLogin =
        authenticated && (!currentUrl || !currentUrl.includes('http'));

    url = getUrl(url);
    await browser.execute(
        (/** @type {string} */ url, /** @type {any} */ data) => {
            function formSubmit(url, params) {
                // method="smart" means submit with GET iff the URL wouldn't be too long

                const form = document.createElement('form');
                form.setAttribute('method', 'post');
                form.setAttribute('action', url);
                form.setAttribute('target', '_self');

                for (const key of Object.keys(params)) {
                    const hiddenField = document.createElement('input');
                    hiddenField.setAttribute('type', 'hidden');
                    hiddenField.setAttribute('name', key);
                    hiddenField.setAttribute('value', params[key]);
                    form.appendChild(hiddenField);
                }

                document.body.appendChild(form);
                form.submit();
            }

            formSubmit(url, data);
        },
        url,
        data
    );
    if (needToLogin) await keycloakLogin(10000);
}

async function keycloakLogin(timeout) {
    await browser.waitUntil(
        async () => (await browser.getUrl()).includes('/auth/realms/cbio'),
        {
            timeout,
            timeoutMsg: 'No redirect to Keycloak could be detected.',
        }
    );
    await isDisplayed('#username');

    await setInputText('#username', 'testuser');
    await setInputText('#password', 'P@ssword1');
    await clickElement('#kc-login');

    await browser.waitUntil(
        async () => !(await browser.getUrl()).includes('/auth/realms/cbio')
    );
    await isDisplayed('body', timeout);
}

async function closeOtherTabs() {
    const studyWindow = await browser.getWindowHandle();
    const windowHandles = await browser.getWindowHandles();

    await Promise.all(
        windowHandles.map(async id => {
            if (id !== studyWindow) {
                console.log('close tab:', id);
                await browser.switchToWindow(id);
                await browser.closeWindow();
            }
        })
    );

    await browser.switchToWindow(studyWindow);
}

async function openGroupComparison(studyViewUrl, chartDataTest, timeout) {
    await goToUrlAndSetLocalStorage(studyViewUrl, true);
    await waitForElementDisplayed('[data-test=summary-tab-content]');
    await waitForNetworkQuiet(20000);

    // needed to switch to group comparison tab later on:
    await closeOtherTabs();

    const chart = '[data-test=' + chartDataTest + ']';

    await waitForElementDisplayed(chart, { timeout: timeout || 10000 });

    await (await getElement('body')).moveTo({ xOffset: 0, yOffset: 0 });
    await $(chart).scrollIntoView();

    await jsApiHover(chart);

    await getElement(chart + ' .controls', {
        waitForExist: true,
    });

    await $(chart + ' .controls').waitForClickable();
    //await browser.pause(5000);

    // move to hamburger icon
    const hamburgerIcon = '[data-test=chart-header-hamburger-icon]';
    await $(hamburgerIcon).moveTo();

    // wait for the menu available
    await waitForElementDisplayed(hamburgerIcon, { timeout: timeout || 10000 });

    const studyViewTabId = await browser.getWindowHandle();

    const chartHamburgerIcon = await getNestedElement([chart, hamburgerIcon]);
    await chartHamburgerIcon.waitForDisplayed();

    await (await (await getElement(chartHamburgerIcon)).$$('li'))[1].click();

    await browser.waitUntil(
        async () => (await browser.getWindowHandles()).length > 1
    ); // wait until new tab opens

    const groupComparisonTabId = (await browser.getWindowHandles()).find(
        id => id !== studyViewTabId
    );

    await browser.switchToWindow(groupComparisonTabId);
    await waitForGroupComparisonTabOpen(timeout);
}

async function selectElementByText(text) {
    return await $(`//*[text()="${text}"]`);
}

async function jq(selector) {
    return await browser.execute(selector => {
        return jQuery(selector).toArray();
    }, selector);
}

const openAlterationTypeSelectionMenu = async () => {
    await (
        await getElement('[data-test=AlterationEnrichmentTypeSelectorButton]')
    ).waitForExist();
    await clickElement('[data-test=AlterationEnrichmentTypeSelectorButton]');
    await (
        await getElement('[data-test=AlterationTypeSelectorMenu]')
    ).waitForDisplayed();
};

function strIsNumeric(str) {
    if (typeof str != 'string') return false; // we only process strings!
    return (
        !isNaN(str) && !isNaN(parseFloat(str)) // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    ); // ...and ensure strings of whitespace fail
}

async function selectClinicalTabPlotType(type) {
    await setDropdownOpen(
        true,
        '[data-test="plotTypeSelector"] .Select-arrow-zone',
        '[data-test="plotTypeSelector"] .Select-menu',
        "Couldn't open clinical tab chart type dropdown"
    );
    await clickElement(
        `[data-test="plotTypeSelector"] .Select-option[aria-label="${type}"]`
    );
}

async function isDisplayed(selector, options = {}) {
    const element = await getElement(selector, options);
    return await element.isDisplayed();
}

async function getElement(selector, options = {}) {
    let el;

    if (/^handle=/.test(selector)) {
        el = await getElementByTestHandle(selector.replace(/^handle=/, ''));
    } else {
        el = await $(selector);
    }

    if (options.timeout) {
        await el.waitForExist(options);
    }

    if (options.waitForExist) {
        await el.waitForExist();
    }

    return el;
}

const getNestedElement = async function(selector = [], options = {}) {
    let currentElement;
    for (const element of selector) {
        if (!currentElement) {
            currentElement = await getElement(element, options);
        } else {
            currentElement = await currentElement.$(element);
        }
    }
    return currentElement;
};

/**
 * @param {string} selector  css selector
 * @param {number} index  index of the element
 * @param {object} options  options for the element
 * @returns  {Promise<WebdriverIO.ElementArray>}
 */
async function getNthElements(selector, index, options = {}) {
    let els;
    if (/^handle=/.test(selector)) {
        els = await $$(selector.replace(/^handle=/, ''));
    } else {
        els = await $$(selector);
    }
    if (options?.timeout) {
        await els.waitForExist(options);
    }
    return els[index];
}

async function getText(selector, option) {
    const el = await getElement(...arguments);
    return await el.getText();
}

async function isSelected(selector, options) {
    const el = await getElement(
        selector,
        options || { timeout: DEFAULT_TIMEOUT }
    );
    return await el.isSelected();
}

async function isUnselected(selector, options) {
    return (await isSelected(...arguments)) === false;
}

async function clickElement(selector, options = {}) {
    // note that selector can be string an element
    let el =
        typeof selector === 'string' ? await getElement(selector) : selector;

    if (options?.moveTo) await el.moveTo();
    await el.waitForDisplayed(options);
    await el.click();
}

module.exports = {
    checkElementWithElementHidden,
    waitForPlotsTab,
    waitForAndCheckPlotsTab,
    waitForStudyQueryPage,
    waitForGeneQueryPage,
    clickElement,
    waitForOncoprint,
    waitForCoExpressionTab,
    waitForPatientView,
    waitForComparisonTab,
    goToUrlAndSetLocalStorage,
    goToUrlAndSetLocalStorageWithProperty,
    useExternalFrontend,
    useNetlifyDeployPreview,
    sessionServiceIsEnabled,
    waitForNumberOfStudyCheckboxes,
    waitForNetworkQuiet,
    getTextInOncoprintLegend,
    toStudyViewSummaryTab,
    toStudyViewClinicalDataTab,
    removeAllStudyViewFilters,
    waitForStudyViewSelectedInfo,
    waitForStudyView,
    waitForGroupComparisonTabOpen,
    getTextFromElement,
    getNumberOfStudyViewCharts,
    setOncoprintMutationsMenuOpen,
    getNthOncoprintTrackOptionsElements,
    setInputText,
    pasteToElement,
    checkOncoprintElement,
    executeInBrowser,
    checkElementWithTemporaryClass,
    checkElementWithMouseDisabled,
    clickQueryByGeneButton,
    clickModifyStudySelectionButton,
    selectReactSelectOption,
    reactSelectOption,
    getReactSelectOptions,
    waitForElementDisplayed,
    COEXPRESSION_TIMEOUT: 120000,
    getSelectCheckedOptions,
    selectCheckedOption,
    getOncoprintGroupHeaderOptionsElements,
    showGsva,
    isDisplayed,
    setSettingsMenuOpen,
    setDropdownOpen,
    postDataToUrl,
    getPortalUrlFromEnv,
    openGroupComparison,
    selectElementByText,
    jsApiHover,
    jsApiClick,
    setCheckboxChecked,
    openAlterationTypeSelectionMenu,
    strIsNumeric,
    getNthElements,
    getColorByTestHandle,
    getNestedElement,
    getColorOfNthElement,
    jq,
    setServerConfiguration,
    selectClinicalTabPlotType,
    getElementByTestHandle,
    getElement,
    getText,
    isSelected,
    isUnselected,
    isDisplayed,
    waitForElementDisplayed,
    getCSSProperty,
    elementExists,
};
