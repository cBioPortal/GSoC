const fs = require('fs/promises');
const path = require('path');

// get rid of railing slash
const BACKEND_ROOT = (process.env.BACKEND_ROOT || '').replace(/\/$/, '');

const SPEC_ROOT = `${BACKEND_ROOT}/test/api-e2e/specs`;

async function mergeTests() {
    const files = (await fs.readdir(SPEC_ROOT)).map(fileName => {
        return path.join(SPEC_ROOT, fileName);
    });

    const jsons = files.map(path => {
        return fs.readFile(path).then(data => {
            try {
                const json = JSON.parse(data);
                return { file: path, suites: json };
            } catch (ex) {
                console.log('invalid apiTest json spec');
                return [];
            }
        });
    });

    Promise.all(jsons)
        .then(d => {
            fs.writeFile('./api-e2e/json/merged-tests.json', JSON.stringify(d));
        })
        .then(r => console.log('merged-tests.json written'));
}

mergeTests();
