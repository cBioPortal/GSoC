const { join } = require('path');

const mergeReports = require('./merge-e2e-reports');

const fs = require('fs');
var path = require('path');
var VisualRegressionCompare = require('wdio-novus-visual-regression-service/compare');
var getScreenshotName = require('./getScreenshotName');

const TEST_TYPE = process.env.TEST_TYPE || 'remote';

const { transformJUNITFiles } = require('../edit-junit');

const debug = process.env.DEBUG;
const defaultTimeoutInterval = 180000;

const resultsDir = process.env.JUNIT_REPORT_PATH || './shared/results/';

const chromedriverCustomPath =
    process.env.CHROMEDRIVER_CUSTOM_PATH || require('chromedriver').path;

const retries = 1;

let screenshotRoot = process.env.SCREENSHOT_DIRECTORY;

// correct if screenshot directory has trailing slash
screenshotRoot = screenshotRoot.replace(/\/$/, '');

let headless = process.env.HEADLESS_CHROME === 'true';

console.log('headless var', headless);

const chromeArgs = [
    '--disable-composited-antialiasing',
    '--allow-insecure-localhost',
    '--ignore-certificate-errors',
    '--ignore-certificate-errors-spki-list',
    '--disable-web-security',
    '--window-size=1600,1000',
].concat(
    (function() {
        return headless ? ['--headless=true', '--no-sandbox'] : [];
    })()
);

console.log(`chrome args: ${chromeArgs}`);

var diffDir = path.join(process.cwd(), `${screenshotRoot}/diff/`);
var refDir = path.join(process.cwd(), `${screenshotRoot}/reference/`);
var screenDir = path.join(process.cwd(), `${screenshotRoot}/screen/`);

var errorDir = path.join(process.cwd(), `${screenshotRoot}/errors/`);

console.log(`TEST TYPE: ${TEST_TYPE}`);

console.log(`HEADLESS_CHROME: ${process.env.HEADLESS_CHROME}`);
console.log(`HEADLESS_CHROME TYPE: ${typeof process.env.HEADLESS_CHROME}`);

console.log(`ENV SCREENSHOT_DIRECTORY: ${process.env.SCREENSHOT_DIRECTORY}`);
console.log(`ENV JUNIT_REPORT_PATH PATH: ${process.env.JUNIT_REPORT_PATH}`);
console.log(`ENV JUNIT_REPORT_PATH PATH: ${process.env.JUNIT_REPORT_PATH}`);

console.log(`screenshot root: ${screenshotRoot}`);
console.log(`diff dir: ${diffDir}`);
console.log(`ref dir: ${refDir}`);
console.log(`screen dir: ${screenDir}`);

var defaultMaxInstances = TEST_TYPE === 'remote' ? 3 : 1;

const LocalCompare = new VisualRegressionCompare.LocalCompare({
    referenceName: getScreenshotName(refDir),
    screenshotName: getScreenshotName(screenDir),
    diffName: getScreenshotName(diffDir),
    misMatchTolerance: 0.01,
});

function proxyComparisonMethod(target) {
    const oldProcessScreenshot = target.processScreenshot;
    LocalCompare.processScreenshot = async function(context, base64Screenshot) {
        const screenshotPath = this.getScreenshotFile(context);
        const referencePath = this.getReferencefile(context);
        const referenceExists = await fs.existsSync(referencePath);

        // add it to test data in case it's needed later
        context.test.referenceExists = referenceExists;

        // Capture the current URL where the screenshot was taken
        try {
            // Access browser from the global scope where wdio exposes it
            const wdioBrowser = global.browser;
            if (wdioBrowser && typeof wdioBrowser.getUrl === 'function') {
                let url = await wdioBrowser.getUrl();
                // Remove localdev/localdist parameters from URL
                url = url
                    .replace(/[&?]localdev(=[^&]*)?(&|$)/g, '$2')
                    .replace(/[&?]localdist(=[^&]*)?(&|$)/g, '$2');
                // Clean up any trailing ? or & characters
                url = url.replace(/[?&]$/, '');
                context.test.screenshotUrl = url;
                console.log('[URL CAPTURE] Successfully captured:', url);

                // Store URL in a separate file for the image comparison report
                // Normalize the screenshot directory path (remove leading ./)
                const normalizedScreenshotRoot = screenshotRoot.replace(
                    /^\.\//,
                    ''
                );
                const urlsFilePath = path.join(
                    process.cwd(),
                    normalizedScreenshotRoot,
                    'screenshot-urls.json'
                );
                console.log('[URL CAPTURE] Writing to path:', urlsFilePath);

                let urlsData = {};
                if (fs.existsSync(urlsFilePath)) {
                    try {
                        urlsData = JSON.parse(
                            fs.readFileSync(urlsFilePath, 'utf8')
                        );
                    } catch (e) {
                        console.log(
                            '[URL CAPTURE] Could not read existing URLs file:',
                            e.message
                        );
                    }
                }
                // Use test title as key
                const testName = context.test.title
                    .replace(/\s/g, '_')
                    .toLowerCase();
                urlsData[testName] = url;

                // Ensure directory exists
                const urlsDir = path.dirname(urlsFilePath);
                if (!fs.existsSync(urlsDir)) {
                    console.log('[URL CAPTURE] Creating directory:', urlsDir);
                    fs.mkdirSync(urlsDir, { recursive: true });
                }

                fs.writeFileSync(
                    urlsFilePath,
                    JSON.stringify(urlsData, null, 2)
                );
                console.log(
                    '[URL CAPTURE] Wrote URL to file for test:',
                    testName,
                    'at path:',
                    urlsFilePath
                );
            } else {
                console.log(
                    '[URL CAPTURE] Browser not available in global scope'
                );
            }
        } catch (e) {
            console.log('[URL CAPTURE] Error:', e.message);
        }

        const resp = await oldProcessScreenshot.apply(this, arguments);

        // process screenshot will create a reference screenshot
        // if it's missing.  this will cause subsequent retries to fail
        // for this reason, we just delete the reference image
        // so that the test will fail with missing reference error
        if (referenceExists === false) {
            console.log(`MISSING REFERENCE SCREENSHOT: ${referencePath}`);
            console.log('REMOVING auto generated reference image');
            fs.rmSync(referencePath);
            const report = {
                ...this.createResultReport(1000, false, true),
                referenceExists,
            };
            return report;
        }

        return resp;
    };
}

function formatTestTitle(test) {
    return test.title.trim().replace(/\s/g, '_');
}

function getTestId(test) {
    const title = formatTestTitle(test);
    return `${process.pid}-${title}`;
}

async function setupNetworkTracker(test) {
    const testId = getTestId(test);

    const puppeteer = await browser.getPuppeteer();
    const pages = await puppeteer.pages();
    if (!pages.length) {
        return;
    }
    const page = pages[pages.length - 1];
    const cdpSession = await page.target().createCDPSession();
    await cdpSession.send('Network.enable');

    const tracker = {
        session: cdpSession,
        requests: {},
        networkLog: {},
        listeners: {},
    };

    // capture url and start time
    const requestListener = params => {
        if (!['Document', 'XHR', 'Fetch'].includes(params.type)) return;
        tracker.requests[params.requestId] = {
            url: params.request.url,
            startTime: params.timestamp,
            type: params.type,
        };
    };
    cdpSession.on('Network.requestWillBeSent', requestListener);

    // capture status
    const responseListener = params => {
        if (tracker.requests[params.requestId]) {
            tracker.requests[params.requestId].status = params.response.status;
        }
    };
    cdpSession.on('Network.responseReceived', responseListener);

    // capture requests that fail before completion
    const failedListener = params => {
        if (tracker.requests[params.requestId]) {
            const data = tracker.requests[params.requestId];
            const duration =
                data.startTime != null
                    ? (params.timestamp - data.startTime) * 1000
                    : undefined;
            tracker.networkLog[params.requestId] = {
                url: data.url,
                status: null,
                type: data.type || null,
                duration: duration,
                errorText: params.errorText,
            };
            delete tracker.requests[params.requestId];
        }
    };
    cdpSession.on('Network.loadingFailed', failedListener);

    // calculate duration
    const finishedListener = params => {
        if (tracker.requests[params.requestId]) {
            const data = tracker.requests[params.requestId];
            const duration =
                data.startTime != null
                    ? (params.timestamp - data.startTime) * 1000
                    : undefined;

            tracker.networkLog[params.requestId] = {
                url: data.url,
                status: data.status,
                type: data.type,
                duration: duration,
            };

            delete tracker.requests[params.requestId];
        }
    };
    cdpSession.on('Network.loadingFinished', finishedListener);

    tracker.listeners = {
        requestListener,
        responseListener,
        failedListener,
        finishedListener,
    };

    // save tracker for afterTest
    browser._networkTrackers.set(testId, tracker);
}

async function deleteNetworkTracker(test) {
    const testId = getTestId(test);
    const tracker = browser._networkTrackers?.get(testId);
    if (!tracker) {
        return;
    }

    const { session, listeners } = tracker;

    // remove listeners
    session.removeListener(
        'Network.requestWillBeSent',
        listeners.requestListener
    );
    session.removeListener(
        'Network.responseReceived',
        listeners.responseListener
    );
    session.removeListener('Network.loadingFailed', listeners.failedListener);
    session.removeListener(
        'Network.loadingFinished',
        listeners.finishedListener
    );

    // detach CDP session
    await session.detach();

    // delete tracker
    browser._networkTrackers.delete(testId);

    return tracker;
}

function saveErrorImage(
    test,
    context,
    { error, result, duration, passed, retries },
    networkLog,
    requests
) {
    if (error) {
        if (!fs.existsSync(errorDir)) {
            fs.mkdirSync(errorDir, 0o755);
        }
        const title = formatTestTitle(test);
        const img = `${errorDir}${title}.png`;
        console.log('ERROR SHOT PATH: ' + img);
        browser.saveScreenshot(img);

        for (const requestId of Object.keys(requests)) {
            const data = requests[requestId];

            networkLog[requestId] = {
                url: data.url,
                status: 'PENDING',
                type: data.type,
            };
        }

        // log failed network requests
        if (Object.keys(networkLog).length) {
            const errorLogs = Object.values(networkLog).filter(
                log =>
                    log.status === 'PENDING' || !log.status || log.status >= 400
            );
            if (errorLogs.length) {
                console.log(
                    `[network] Failed or pending requests for '${title}':`
                );
                for (const log of errorLogs) {
                    console.log(
                        `[network] ${log.status ?? '-'} ${log.type ??
                            '-'} (${log.duration?.toFixed(0) ?? '-'}ms) ${
                            log.url
                        }${log.errorText ? ` (${log.errorText})` : ''}`
                    );
                }
            }
        }
    }
}

proxyComparisonMethod(LocalCompare);

const grep = process.argv.find(l => /--grep=/.test(l));

let SPEC_FILE_PATTERN = undefined;

// if we cound a grep, assign it to spec file pattern
if (grep) {
    SPEC_FILE_PATTERN = grep.split('=')[1];
} else {
    SPEC_FILE_PATTERN = process.env.SPEC_FILE_PATTERN
        ? process.env.SPEC_FILE_PATTERN
        : `${TEST_TYPE}/specs/**/*.spec.js`;
}

// if spec pattern contains slash, use it whole, otherwise, assume it is just a spec file name or wildcard
SPEC_FILE_PATTERN = SPEC_FILE_PATTERN.includes('/')
    ? SPEC_FILE_PATTERN
    : `${TEST_TYPE}/specs/**/${SPEC_FILE_PATTERN}`;

console.log(`ENV SPEC_FILE_PATTERN: ` + process.env.SPEC_FILE_PATTERN);
console.log(`active spec file pattern: ` + SPEC_FILE_PATTERN);

exports.config = {
    //
    // ====================
    // Runner Configuration
    // ====================
    //
    // WebdriverIO allows it to run your tests in arbitrary locations (e.g. locally or
    // on a remote machine).
    runner: 'local',
    //
    // ==================
    // Specify Test Files
    // ==================
    // Define which test specs should run. The pattern is relative to the directory
    // from which `wdio` was called. Notice that, if you are calling `wdio` from an
    // NPM script (see https://docs.npmjs.com/cli/run-script) then the current working
    // directory is where your package.json resides, so `wdio` will be called from there.
    //
    //

    specs: [SPEC_FILE_PATTERN],
    // specs: ['./local/specs/core/oncoprint.screenshot.spec.js'],

    //exclude: ['./remote/specs/core/groupComparisonLollipop.spec.js'],

    // Patterns to exclude.
    exclude: [
        './local/specs/gsva.screenshot.spec.js',
        './local/specs/gsva.spec.js',
    ],
    //
    // ============
    // Capabilities
    // ============
    // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
    // time. Depending on the number of capabilities, WebdriverIO launches several test
    // sessions. Within your capabilities you can overwrite the spec and exclude options in
    // order to group specific specs to a specific capability.
    //
    // First, you can define how mfany instances should be started at the same time. Let's
    // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
    // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
    // files and you set maxInstances to 10, all spec files will get tested at the same time
    // and 30 processes will get spawned. The property handles how many capabilities
    // from the same test should run tests.
    //
    maxInstances: 2,
    //
    // If you have trouble getting all important capabilities together, check out the
    // Sauce Labs platform configurator - a great tool to configure your capabilities:
    // https://docs.saucelabs.com/reference/platforms-configurator
    //
    capabilities: [
        {
            // maxInstances can get overwritten per capability. So if you have an in-house Selenium
            // grid with only 5 firefox instances available you can make sure that not more than
            // 5 instances get started at a time.
            //
            browserName: 'chrome',
            'goog:chromeOptions': {
                args: chromeArgs,
            },
            'goog:loggingPrefs': { browser: 'SEVERE' },
            acceptInsecureCerts: true,
            //acceptSslCerts: true,
            // If outputDir is provided WebdriverIO can capture driver session logs
            // it is possible to configure which logTypes to include/exclude.
            // excludeDriverLogs: ['*'], // pass '*' to exclude all driver session logs
            // excludeDriverLogs: ['bugreport', 'server'],
        },
    ],

    //
    // ===================
    // Test Configurations
    // ===================
    // Define all options that are relevant for the WebdriverIO instance here
    //
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    logLevel: 'error',
    //
    // Set specific log levels per logger
    // loggers:
    // - webdriver, webdriverio
    // - @wdio/applitools-service, @wdio/browserstack-service, @wdio/devtools-service, @wdio/sauce-service
    // - @wdio/mocha-framework, @wdio/jasmine-framework
    // - @wdio/local-runner
    // - @wdio/sumologic-reporter
    // - @wdio/cli, @wdio/config, @wdio/sync, @wdio/utils
    // Level of logging verbosity: trace | debug | info | warn | error | silent
    // logLevels: {
    //     webdriver: 'info',
    //     '@wdio/applitools-service': 'info'
    // },
    //
    // If you only want to run your tests until a specific amount of tests have failed use
    // bail (default is 0 - don't bail, run all tests).
    bail: 0,
    //
    // Set a base URL in order to shorten url command calls. If your `url` parameter starts
    // with `/`, the base url gets prepended, not including the path portion of your baseUrl.
    // If your `url` parameter starts without a scheme or `/` (like `some/path`), the base url
    // gets prepended directly.
    baseUrl: 'http://localhost',
    //
    // Default timeout for all waitFor* commands.
    waitforTimeout: 10000,
    //
    // Default timeout in milliseconds for request
    // if browser driver or grid doesn't send response
    connectionRetryTimeout: 120000,
    //
    // Default request retries count
    connectionRetryCount: 3,

    //
    // Test runner services
    // Services take over a specific job you don't want to take care of. They enhance
    // your test setup with almost no effort. Unlike plugins, they don't add new
    // commands. Instead, they hook themselves up into the test process.

    //automationProtocol: 'devtools',

    services: [
        [
            'chromedriver',
            {
                logLevel: 'info',
                outputDir: './driver-logs',
                chromedriverCustomPath,
            },
        ],
        // ['devtools'],
        [
            'novus-visual-regression',
            {
                compare: LocalCompare,
                viewportChangePause: 300,
                viewports: [{ width: 1600, height: 1000 }],
                orientations: ['landscape'],
                after: () => {},
            },
        ],
    ],

    // port: 54472,

    // Framework you want to run your specs with.
    // The following are supported: Mocha, Jasmine, and Cucumber
    // see also: https://webdriver.io/docs/frameworks.html
    //
    // Make sure you have the wdio adapter package for the specific framework installed
    // before running any tests.
    framework: 'mocha',
    //
    // The number of times to retry the entire specfile when it fails as a whole
    specFileRetries: 0,
    //
    // Delay in seconds between the spec file retry attempts
    // specFileRetriesDelay: 0,
    //
    // Whether or not retried specfiles should be retried immediately or deferred to the end of the queue
    specFileRetriesDeferred: false,
    //
    // Test reporter for stdout.
    // The only one supported by default is 'dot'
    // see also: https://webdriver.io/docs/dot-reporter.html
    reporters: [
        'spec',
        [
            'json',
            {
                outputDir: process.env.JUNIT_REPORT_PATH || './shared/results/',
                outputFileFormat: function(opts) {
                    return `results-${opts.cid}.json`;
                },
            },
        ],
        [
            'junit',
            {
                outputDir: process.env.JUNIT_REPORT_PATH || './shared/results/',
                outputFileFormat: function(opts) {
                    return `results-${opts.cid}.${opts.capabilities.browserName}.xml`;
                },
            },
        ],
    ],

    testHome: process.env.JUNIT_REPORT_PATH,

    //
    // Options to be passed to Mocha.
    // See the full list at http://mochajs.org/
    mochaOpts: {
        ui: 'bdd',
        timeout: debug ? 20000000 : defaultTimeoutInterval, // make big when using browser.debug()
        require: './shared/wdio/it-override.js',
        retries: retries,
    },
    //
    // =====
    // Hooks
    // =====
    // WebdriverIO provides several hooks you can use to interfere with the test process in order to enhance
    // it and to build services around it. You can either apply a single function or an array of
    // methods to it. If one of them returns with a promise, WebdriverIO will wait until that promise got
    // resolved to continue.
    /**
     * Gets executed once before all workers get launched.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     */
    // onPrepare: function (config, capabilities) {
    // },
    /**
     * Gets executed before a worker process is spawned and can be used to initialise specific service
     * for that worker as well as modify runtime environments in an async fashion.
     * @param  {String} cid      capability id (e.g 0-0)
     * @param  {[type]} caps     object containing capabilities for session that will be spawn in the worker
     * @param  {[type]} specs    specs to be run in the worker process
     * @param  {[type]} args     object that will be merged with the main configuration once worker is initialised
     * @param  {[type]} execArgv list of string arguments passed to the worker process
     */
    // onWorkerStart: function (cid, caps, specs, args, execArgv) {
    // },
    /**
     * Gets executed just before initialising the webdriver session and test framework. It allows you
     * to manipulate configurations depending on the capability or spec.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that are to be run
     */
    // beforeSession: function (config, capabilities, specs) {
    // },
    /**
     * Gets executed before test execution begins. At this point you can access to all global
     * variables like `browser`. It is the perfect place to define custom commands.
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs        List of spec file paths that are to be run
     * @param {Object}         browser      instance of created browser/device session
     */
    before: function(capabilities, specs) {
        // initialize tracker map
        if (!browser._networkTrackers) {
            browser._networkTrackers = new Map();
        }
    },
    /**
     * Runs before a WebdriverIO command gets executed.
     * @param {String} commandName hook command name
     * @param {Array} args arguments that command would receive
     */
    // beforeCommand: function (commandName, args) {
    // },
    /**
     * Hook that gets executed before the suite starts
     * @param {Object} suite suite details
     */
    // beforeSuite: function (suite) {
    // },
    /**
     * Function to be executed before a test (in Mocha/Jasmine) starts.
     */
    beforeTest: async function(test, context) {
        // Enable network tracking via Puppeteer CDP session
        try {
            await setupNetworkTracker(test);
        } catch (e) {
            console.log(
                '[network] CDP network tracking not available:',
                e.message
            );
        }
    },
    /**
     * Hook that gets executed _before_ a hook within the suite starts (e.g. runs before calling
     * beforeEach in Mocha)
     */
    beforeHook: async function(test, context) {
        // Enable network tracking via Puppeteer CDP session
        try {
            await setupNetworkTracker(test);
        } catch (e) {
            console.log(
                '[network] CDP network tracking not available:',
                e.message
            );
        }
    },
    networkLog: {},
    /**
     * Hook that gets executed _after_ a hook within the suite starts (e.g. runs after calling
     * afterEach in Mocha)
     */
    afterHook: async function(
        test,
        context,
        { error, result, duration, passed, retries }
    ) {
        const tracker = await deleteNetworkTracker(test);
        if (!tracker) {
            return;
        }

        saveErrorImage(
            test,
            context,
            { error, result, duration, passed, retries },
            tracker.networkLog,
            tracker.requests
        );
    },
    /**
     * Function to be executed after a test (in Mocha/Jasmine).
     */
    afterTest: async function(
        test,
        context,
        { error, result, duration, passed, retries }
    ) {
        const tracker = await deleteNetworkTracker(test);
        if (!tracker) {
            return;
        }

        saveErrorImage(
            test,
            context,
            { error, result, duration, passed, retries },
            tracker.networkLog,
            tracker.requests
        );
    },
    /**
     * Hook that gets executed after the suite has ended
     * @param {Object} suite suite details
     */
    // afterSuite: function (suite) {
    // },
    /**
     * Runs after a WebdriverIO command gets executed
     * @param {String} commandName hook command name
     * @param {Array} args arguments that command would receive
     * @param {Number} result 0 - command success, 1 - command error
     * @param {Object} error error object if any
     */
    // afterCommand: function (commandName, args, result, error) {
    // },
    /**
     * Gets executed after all tests are done. You still have access to all global variables from
     * the test.
     * @param {Number} result 0 - test pass, 1 - test fail
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that ran
     */
    // after: function (result, capabilities, specs) {
    // },
    /**
     * Gets executed right after terminating the webdriver session.
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {Array.<String>} specs List of spec file paths that ran
     */
    // afterSession: function (config, capabilities, specs) {
    //
    // },
    /**
     * Gets executed after all workers got shut down and the process is about to exit. An error
     * thrown in the onComplete hook will result in the test run failing.
     * @param {Object} exitCode 0 - success, 1 - fail
     * @param {Object} config wdio configuration object
     * @param {Array.<Object>} capabilities list of capabilities details
     * @param {<Object>} results object containing test results
     */
    onComplete: function(exitCode, config, capabilities, results) {
        mergeReports(resultsDir, `${resultsDir}/completeResults.json`);
        //
        // //this is going to eliminate duplicate tests caused by retries
        // //leaving, for each unique test name only one result (error or pass)
        // transformJUNITFiles(resultsDir);
    },
    /**
     * Gets executed when a refresh happens.
     * @param {String} oldSessionId session ID of the old session
     * @param {String} newSessionId session ID of the new session
     */
    //onReload: function(oldSessionId, newSessionId) {
    //}
};
