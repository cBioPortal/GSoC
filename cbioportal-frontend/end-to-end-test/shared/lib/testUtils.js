var assert = require('assert');

module.exports = {
    assertScreenShotMatch(result, message) {
        if (result[0].referenceExists === false) {
            assert.fail('Missing reference screenshot');
        } else {
            console.log(
                'result[0].isWithinMisMatchTolerance ->->->',
                result[0]
            );
            assert(result[0].isWithinMisMatchTolerance, message);
        }
    },
};
