var path = require('path');
module.exports = function getScreenshotName(basePath, browserName) {
    return function(context) {
        var type = context.type;
        var testName = context.test.title;
        var browserVersion = parseInt(context.browser.version, 10);
        var browserViewport = context.meta.viewport;
        var browserWidth = browserViewport.width;
        var browserHeight = browserViewport.height;

        return path.join(
            basePath,
            `${testName}_element_chrome_1600x1000.png`
                .toLowerCase()
                .replace(/ /g, '_')
        );
    };
};
