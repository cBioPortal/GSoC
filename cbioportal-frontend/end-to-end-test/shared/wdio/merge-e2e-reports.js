var fs = require('fs');

function readFiles(dirname, onFileContent, onError) {
    const filenames = fs.readdirSync(dirname);
    filenames.forEach(function(filename) {
        if (filename.includes('.json')) {
            const content = fs.readFileSync(dirname + filename, 'utf-8');
            onFileContent(filename, content);
        }
    });
}

const mergeReports = function(resultsDir, targetPath) {
    function writeFile(data, path) {
        fs.writeFileSync(path, data, err => {
            if (err) console.log(err);
            console.log('Successfully Written to File.');
        });
    }

    const reports = [];

    readFiles(
        resultsDir,
        (filename, content) => {
            if (/results.*json$/.test(filename)) {
                try {
                    console.log(`adding ${filename}`);
                    const parsedContent = JSON.parse(content);
                    reports.push(parsedContent);
                } catch (ex) {
                    console.log(`json merge error `);
                    console.log(ex);
                    reports.push(content);
                }
            }
        },
        err => {
            console.log(err);
        }
    );
    writeFile(JSON.stringify(reports, null, 5), targetPath);
};

module.exports = mergeReports;
