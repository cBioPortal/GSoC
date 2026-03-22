var json = require('./json/merged-tests.json');
var axios = require('axios');
var { validate, reportValidationResult, runSpecs } = require('./validation');
const test = json[1].suites[0].tests[0];

const host = process.env.API_TEST_HOST || 'http://localhost:8082';

console.log(`RUNNING TESTS AGAINST: ${host}`);

async function main() {
    const start = Date.now();

    const fileFilter = process.env.API_TEST_FILTER || '';

    const files = fileFilter?.trim().length
        ? json.filter(f => new RegExp(fileFilter).test(f.file))
        : json;

    await axios.get(`${host}/api/info`).then(r => console.log(r.data));

    await runSpecs(files, axios, host);

    console.log(`Elapsed: ${Date.now() - start}`);
}

main();
