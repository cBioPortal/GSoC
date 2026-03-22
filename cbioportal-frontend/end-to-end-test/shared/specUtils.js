const clipboardy = require('clipboardy');
const assertScreenShotMatch = require('./lib/testUtils').assertScreenShotMatch;

function waitForStudyQueryPage(timeout) {
    $('div[data-test="cancerTypeListContainer"]').waitForExist({
        timeout: timeout || 10000,
    });
}

function waitForGeneQueryPage(timeout) {
    // wait until fade effect on studyList has finished (if running in forkedMode)
    $('[data-test=studyList]').waitForExist({
        timeout: timeout,
        reverse: true,
    });
    $('div[data-test="molecularProfileSelector"]').waitForExist({
        timeout: timeout || 10000,
    });
}

function waitForPlotsTab(timeout) {
    $('div.axisBlock').waitForDisplayed({ timeout: timeout || 20000 });
}

function waitForAndCheckPlotsTab() {
    $('body').moveTo({ xOffset: 0, yOffset: 0 });
    $('div[data-test="PlotsTabPlotDiv"]').waitForDisplayed({ timeout: 20000 });
    var res = checkElementWithElementHidden(
        'div[data-test="PlotsTabEntireDiv"]',
        '.popover',
        { hide: ['.qtip'] }
    );
    assertScreenShotMatch(res);
}

function waitForCoExpressionTab(timeout) {
    $('#coexpressionTabGeneTabs').waitForExist({ timeout: timeout || 20000 });
}

function waitForPatientView(timeout) {
    $('#patientViewPageTabs').waitForExist({ timeout: timeout || 20000 });
    $('[data-test=patientview-copynumber-table]').waitForDisplayed({
        timeout: timeout || 20000,
    });
    $('[data-test=patientview-mutation-table]').waitForDisplayed({
        timeout: timeout || 20000,
    });
}

function waitForOncoprint() {
    browser.pause(200); // give oncoprint time to disappear
    browser.waitUntil(
        () => {
            return (
                !$('.oncoprintLoadingIndicator').isExisting() && // wait for loading indicator to hide, and
                $('#oncoprintDiv svg rect').isExisting() && // as a proxy for oncoprint being rendered, wait for an svg rectangle to appear in the legend
                $('.oncoprint__controls').isExisting()
            ); // oncoprint controls are showing
        },
        { timeout: 60000 }
    );
    browser.pause(200);
}

function waitForComparisonTab() {
    $('[data-test=GroupComparisonAlterationEnrichments]').waitForDisplayed();
}

function getTextInOncoprintLegend() {
    return $$('#oncoprintDiv .oncoprint-legend-div svg text')
        .map(t => {
            return t.getHTML(false);
        })
        .join(' ');
}

function setSettingsMenuOpen(open, buttonId = 'GlobalSettingsButton') {
    const button = 'button[data-test="' + buttonId + '"]';
    const dropdown = 'div[data-test="GlobalSettingsDropdown"]';
    $(button).waitForDisplayed();
    browser.waitUntil(
        () => {
            if (open === $(dropdown).isDisplayedInViewport()) {
                return true;
            } else {
                $(button).click();
                $(dropdown).waitForDisplayed({
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

function getElementByTestHandle(handle) {
    return $(`[data-test="${handle}"]`);
}

function setOncoprintMutationsMenuOpen(open) {
    const mutationColorMenuButton = '#mutationColorDropdown';
    const mutationColorMenuDropdown =
        'div.oncoprint__controls__mutation_color_menu';
    $('div.oncoprint__controls').moveTo();
    $(mutationColorMenuButton).waitForDisplayed();
    browser.waitUntil(
        () => {
            if (open === $(mutationColorMenuDropdown).isDisplayedInViewport()) {
                return true;
            } else {
                $(mutationColorMenuButton).click();
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

function setCheckboxChecked(checked, selector, failure_message) {
    browser.waitUntil(
        () => {
            if ($(selector).isDisplayed()) {
                $(selector).click();
                return checked === $(selector).isSelected();
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
function setDropdownOpen(
    open,
    button_selector_or_elt,
    dropdown_selector_or_elt,
    failure_message
) {
    browser.waitUntil(
        () => {
            const dropdown_elt =
                typeof dropdown_selector_or_elt === 'string'
                    ? $(dropdown_selector_or_elt)
                    : dropdown_selector_or_elt;
            // check if exists first because sometimes we get errors with isVisible if it doesn't exist
            const isOpen = dropdown_elt.isExisting()
                ? dropdown_elt.isDisplayedInViewport()
                : false;
            if (open === isOpen) {
                return true;
            } else {
                const button_elt =
                    typeof button_selector_or_elt === 'string'
                        ? $(button_selector_or_elt)
                        : button_selector_or_elt;
                button_elt.waitForExist();
                button_elt.click();
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

function goToUrlAndSetLocalStorage(url, authenticated = false) {
    const currentUrl = browser.getUrl();
    const needToLogin =
        authenticated && (!currentUrl || !currentUrl.includes('http'));
    // navigate to blank page first to prevent issues with url hash params
    browser.url('about:blank');
    if (!useExternalFrontend) {
        browser.url(url);
        console.log('Connecting to: ' + url);
    } else if (useNetlifyDeployPreview) {
        browser.url(url);
        browser.execute(
            function(config) {
                this.localStorage.setItem('netlify', config.netlify);
            },
            { netlify: netlifyDeployPreview }
        );
        browser.url(url);
        console.log('Connecting to: ' + url);
    } else {
        var urlparam = useLocalDist ? 'localdist' : 'localdev';
        var prefix = url.indexOf('?') > 0 ? '&' : '?';
        browser.url(`${url}${prefix}${urlparam}=true`);
        console.log('Connecting to: ' + `${url}${prefix}${urlparam}=true`);
    }
    if (needToLogin) keycloakLogin(10000);

    //browser.setViewportSize({ height: 1000, width: 1600 });

    // move mouse out of the way
    // move mouse out of the way
    //browser.moveToObject('body', 0, 0);
}

const goToUrlAndSetLocalStorageWithProperty = (url, authenticated, props) => {
    goToUrlAndSetLocalStorage(url, authenticated);
    setServerConfiguration(props);
    goToUrlAndSetLocalStorage(url, authenticated);
};

function setServerConfiguration(props) {
    browser.execute(
        function(frontendConf) {
            this.localStorage.setItem(
                'frontendConfig',
                JSON.stringify(frontendConf)
            );
        },
        { serverConfig: props }
    );
}

function sessionServiceIsEnabled() {
    return browser.execute(function() {
        return window.getServerConfig().sessionServiceEnabled;
    }).value;
}

async function showGsva() {
    await setServerConfiguration({ skin_show_gsva: true });
}

function waitForNumberOfStudyCheckboxes(expectedNumber, text) {
    browser.waitUntil(
        () => {
            var ret =
                $$('[data-test="cancerTypeListContainer"] > ul > ul').length ===
                expectedNumber;
            if (text && ret) {
                ret = $(
                    '[data-test="cancerTypeListContainer"] > ul > ul > ul > li:nth-child(2) > label > span'
                ).isExisting();
                if (ret) {
                    ret =
                        $(
                            '[data-test="cancerTypeListContainer"] > ul > ul > ul > li:nth-child(2) > label > span'
                        ).getText() === text;
                }
            }
            return ret;
        },
        { timeout: 60000 }
    );
}

function getNthOncoprintTrackOptionsElements(n) {
    // n is one-indexed

    const button_selector =
        '#oncoprintDiv .oncoprintjs__track_options__toggle_btn_img.nth-' + n;
    const dropdown_selector =
        '#oncoprintDiv .oncoprintjs__track_options__dropdown.nth-' + n;

    return {
        button: $(button_selector),
        button_selector,
        dropdown: $(dropdown_selector),
        dropdown_selector,
    };
}

const netlifyDeployPreview = process.env.NETLIFY_DEPLOY_PREVIEW;
const useNetlifyDeployPreview = !!netlifyDeployPreview;

const useExternalFrontend = !process.env
    .FRONTEND_TEST_DO_NOT_LOAD_EXTERNAL_FRONTEND;

const useLocalDist = process.env.FRONTEND_TEST_USE_LOCAL_DIST;

function waitForNetworkQuiet(timeout) {
    browser.waitUntil(
        () => {
            return (
                browser.execute(function() {
                    return window.ajaxQuiet === true;
                }) == true
            );
        },
        { timeout }
    );
}

function getPortalUrlFromEnv() {
    return process.env.CBIOPORTAL_URL.replace(/\/$/, '');
}

function toStudyViewSummaryTab() {
    var summaryTab = '#studyViewTabs a.tabAnchor_summary';
    var summaryContent = "[data-test='summary-tab-content']";
    if (!$(summaryContent).isDisplayedInViewport()) {
        $(summaryTab).waitForDisplayed({ timeout: 10000 });
        $(summaryTab).click();
        $(summaryContent).waitForDisplayed({ timeout: 10000 });
    }
}

function toStudyViewClinicalDataTab() {
    var clinicalDataTab = '#studyViewTabs a.tabAnchor_clinicalData';
    var clinicalDataContent = "[data-test='clinical-data-tab-content']";
    if (!$(clinicalDataContent).isDisplayedInViewport()) {
        $(clinicalDataTab).waitForDisplayed({ timeout: 10000 });
        $(clinicalDataTab).click();
        $(clinicalDataContent).waitForDisplayed({ timeout: 10000 });
    }
}

function removeAllStudyViewFilters() {
    const clearAllFilter = "[data-test='clear-all-filters']";
    if ($(clearAllFilter).isDisplayedInViewport()) {
        $(clearAllFilter).click();
    }
}

function waitForStudyViewSelectedInfo() {
    $("[data-test='selected-info']").waitForDisplayed({ timeout: 5000 });
    // pause to wait the animation finished
    browser.pause(2000);
}

function waitForStudyView() {
    browser.waitUntil(() => $$('.sk-spinner').length === 0, {
        timeout: 100000,
    });
}

function waitForGroupComparisonTabOpen(timeout) {
    $('[data-test=ComparisonPageOverlapTabDiv]').waitForDisplayed({
        timeout: timeout || 10000,
    });
}

function getTextFromElement(element) {
    return $(element)
        .getText()
        .trim();
}

function getNumberOfStudyViewCharts() {
    return $$('div.react-grid-item').length;
}

function setInputText(selector, text) {
    // backspace to delete current contents - webdriver is supposed to clear it but it doesnt always work
    $(selector).click();
    //browser.keys('\uE003'.repeat($(selector).getValue().length));

    $(selector).clearValue();
    //browser.pause(1000);

    $(selector).setValue(text);
}

function getReactSelectOptions(parent) {
    parent.$('.Select-control').click();
    return parent.$$('.Select-option');
}

function selectReactSelectOption(parent, optionText) {
    reactSelectOption(parent, optionText).click();
}

function reactSelectOption(parent, optionText, loose = false) {
    setDropdownOpen(
        true,
        parent.$('.Select-control'),
        loose
            ? parent.$('.Select-option*=' + optionText)
            : parent.$('.Select-option=' + optionText)
    );
    if (loose) {
        return parent.$('.Select-option*=' + optionText);
    }
    return parent.$('.Select-option=' + optionText);
}

function selectCheckedOption(parent, optionText, loose = false) {
    parent.$('.default-checked-select').click();
    if (loose) {
        return parent.$('.checked-select-option*=' + optionText);
    }
    return parent.$('.checked-select-option=' + optionText);
}

function getSelectCheckedOptions(parent) {
    parent.$('.default-checked-select').click();
    return parent.$$('.checked-select-option');
}

function pasteToElement(elementSelector, text) {
    clipboardy.writeSync(text);
    $(elementSelector).click();
    browser.keys(['Shift', 'Insert']);
}

function checkOncoprintElement(selector, viewports) {
    //browser.moveToObject('body', 0, 0);
    browser.execute(function() {
        frontendOnc.clearMouseOverEffects(); // clear mouse hover effects for uniform screenshot
    });
    return checkElementWithMouseDisabled(selector || '#oncoprintDiv', 0, {
        hide: [
            '.qtip',
            '.dropdown-menu',
            '.oncoprintjs__track_options__dropdown',
            '.oncoprintjs__cell_overlay_div',
        ],
        viewports: viewports,
    });
}

function jsApiHover(selector) {
    browser.execute(function(_selector) {
        $(_selector)[0].dispatchEvent(
            new MouseEvent('mouseover', { bubbles: true })
        );
    }, selector);
}

function jsApiClick(selector) {
    browser.execute(function(_selector) {
        $(_selector)[0].dispatchEvent(
            new MouseEvent('click', { bubbles: true })
        );
    }, selector);
}

function executeInBrowser(callback) {
    return browser.execute(callback);
}

function checkElementWithTemporaryClass(
    selectorForChecking,
    selectorForTemporaryClass,
    temporaryClass,
    pauseTime,
    options
) {
    browser.execute(
        function(selectorForTemporaryClass, temporaryClass) {
            $(selectorForTemporaryClass).addClass(temporaryClass);
        },
        selectorForTemporaryClass,
        temporaryClass
    );
    browser.pause(pauseTime);
    var res = browser.checkElement(selectorForChecking, '', options);
    browser.execute(
        function(selectorForTemporaryClass, temporaryClass) {
            $(selectorForTemporaryClass).removeClass(temporaryClass);
        },
        selectorForTemporaryClass,
        temporaryClass
    );
    return res;
}

function checkElementWithMouseDisabled(selector, pauseTime, options) {
    browser.execute(function() {
        const style = 'display:block !important;visibility:visible !important;';
        $(`<div id='blockUIToDisableMouse' style='${style}'></div>`).appendTo(
            'body'
        );
    });

    $(selector).waitForExist({ timeout: 5000 });

    const ret = checkElementWithTemporaryClass(
        selector,
        selector,
        'disablePointerEvents',
        pauseTime || 0,
        options
    );

    browser.execute(function() {
        $('#blockUIToDisableMouse').remove();
    });

    return ret;
}

function checkElementWithElementHidden(selector, selectorToHide, options) {
    browser.execute(selectorToHide => {
        $(
            `<style id="tempHiddenStyles" type="text/css">${selectorToHide}{opacity:0;}</style>`
        ).appendTo('head');
    }, selectorToHide);

    var res = browser.checkElement(selector, '', options);

    browser.execute(selectorToHide => {
        $('#tempHiddenStyles').remove();
    }, selectorToHide);

    return res;
}

function clickQueryByGeneButton() {
    $('.disabled[data-test=queryByGeneButton]').waitForExist({
        reverse: true,
    });
    getElementByTestHandle('queryByGeneButton').click();
    $('body').scrollIntoView();
}

function clickModifyStudySelectionButton() {
    $('[data-test="modifyStudySelectionButton"]').click();
}

function getOncoprintGroupHeaderOptionsElements(trackGroupIndex) {
    //trackGroupIndex is 0-indexed

    const button_selector =
        '#oncoprintDiv .oncoprintjs__header__toggle_btn_img.track-group-' +
        trackGroupIndex;
    const dropdown_selector =
        '#oncoprintDiv .oncoprintjs__header__dropdown.track-group-' +
        trackGroupIndex;

    return {
        button: $(button_selector),
        button_selector,
        dropdown: $(dropdown_selector),
        dropdown_selector,
    };
}

/**
 *
 * @param {string} url
 * @param {any} data
 * @param {boolean} authenticated
 */
function postDataToUrl(url, data, authenticated = true) {
    const currentUrl = browser.getUrl();
    const needToLogin =
        authenticated && (!currentUrl || !currentUrl.includes('http'));

    url = getUrl(url);
    browser.execute(
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
    if (needToLogin) keycloakLogin(10000);
}

function keycloakLogin(timeout) {
    browser.waitUntil(() => browser.getUrl().includes('/auth/realms/cbio'), {
        timeout,
        timeoutMsg: 'No redirect to Keycloak could be detected.',
    });
    $('#username').waitForDisplayed(timeout);

    $('#username').setValue('testuser');
    $('#password').setValue('P@ssword1');
    $('#kc-login').click();

    browser.waitUntil(() => !browser.getUrl().includes('/auth/realms/cbio'));
    $('body').waitForDisplayed(timeout);
}

function closeOtherTabs() {
    const studyWindow = browser.getWindowHandle();
    browser.getWindowHandles().forEach(id => {
        if (id === studyWindow) {
            return;
        }
        console.log('close tab:', id);
        browser.switchToWindow(id);
        browser.closeWindow();
    });
    browser.switchToWindow(studyWindow);
}

function openGroupComparison(studyViewUrl, chartDataTest, timeout) {
    goToUrlAndSetLocalStorage(studyViewUrl, true);
    $('[data-test=summary-tab-content]').waitForDisplayed();
    waitForNetworkQuiet();

    // needed to switch to group comparison tab later on:
    closeOtherTabs();

    const chart = '[data-test=' + chartDataTest + ']';
    $(chart).waitForDisplayed({ timeout: timeout || 10000 });
    jsApiHover(chart);

    browser.waitUntil(
        () => {
            return $(chart + ' .controls').isExisting();
        },
        { timeout: timeout || 10000 }
    );

    // move to hamburger icon
    const hamburgerIcon = '[data-test=chart-header-hamburger-icon]';
    jsApiHover(hamburgerIcon);

    // wait for the menu available
    $(hamburgerIcon).waitForDisplayed({ timeout: timeout || 10000 });

    // open comparison session
    const studyViewTabId = browser.getWindowHandle();

    const chartHamburgerIcon = $(chart).$(hamburgerIcon);
    $(chartHamburgerIcon).waitForDisplayed({ timeout: timeout || 10000 });

    $(chartHamburgerIcon)
        .$$('li')[1]
        .click();

    browser.waitUntil(() => browser.getWindowHandles().length > 1); // wait until new tab opens

    const groupComparisonTabId = browser
        .getWindowHandles()
        .find(id => id !== studyViewTabId);

    browser.switchToWindow(groupComparisonTabId);
    waitForGroupComparisonTabOpen(timeout);
}

function selectElementByText(text) {
    return $(`//*[text()="${text}"]`);
}

function jq(selector) {
    return browser.execute(selector => {
        return jQuery(selector).toArray();
    }, selector);
}

function setServerConfiguration(serverConfig) {
    browser.execute(function(_serverConfig) {
        this.localStorage.setItem(
            'frontendConfig',
            JSON.stringify({ serverConfig: _serverConfig })
        );
    }, serverConfig);
}

var openAlterationTypeSelectionMenu = () => {
    $('[data-test=AlterationEnrichmentTypeSelectorButton]').waitForExist();
    $('[data-test=AlterationEnrichmentTypeSelectorButton]').click();
    $('[data-test=AlterationTypeSelectorMenu]').waitForDisplayed();
};

function strIsNumeric(str) {
    if (typeof str != 'string') return false; // we only process strings!
    return (
        !isNaN(str) && !isNaN(parseFloat(str)) // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    ); // ...and ensure strings of whitespace fail
}

function selectClinicalTabPlotType(type) {
    setDropdownOpen(
        true,
        '[data-test="plotTypeSelector"] .Select-arrow-zone',
        '[data-test="plotTypeSelector"] .Select-menu',
        "Couldn't open clinical tab chart type dropdown"
    );
    $(
        `[data-test="plotTypeSelector"] .Select-option[aria-label="${type}"]`
    ).click();
}

module.exports = {
    checkElementWithElementHidden,
    waitForPlotsTab,
    waitForAndCheckPlotsTab,
    waitForStudyQueryPage,
    waitForGeneQueryPage,
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
    COEXPRESSION_TIMEOUT: 120000,
    getSelectCheckedOptions,
    selectCheckedOption,
    getOncoprintGroupHeaderOptionsElements,
    showGsva,
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
    jq,
    setServerConfiguration,
    selectClinicalTabPlotType,
    getElementByTestHandle,
};
