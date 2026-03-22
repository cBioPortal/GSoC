const fs = require('fs');
const path = require('path');
const request = require('request');
const CodeGen = require('swagger-js-codegen').CodeGen;

const [node, script, folder, ...classNames] = process.argv;
for (const className of classNames) {
    const swagger = JSON.parse(
        fs.readFileSync(path.join(folder, `${className}-docs.json`))
    );
    const tsSourceCode = CodeGen.getTypescriptCode({ className, swagger });
    fs.writeFileSync(path.join(folder, `${className}.ts`), tsSourceCode);
}
