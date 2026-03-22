import { Gistic } from 'cbioportal-ts-api-client';

export function getGeneSymbols(gistic?: Gistic) {
    if (gistic) return gistic.genes.map(gene => gene.hugoGeneSymbol);
    return [];
}

// Regular expression for parsing a cytoband string, eg. 17p12.1
const cytobandRegExp = new RegExp(
    '^' +
    '([0-9]{1,2})' + // match the chr
    '([pq])' + // match the arm
    '([0-9]{1,2})' + // match the first coordinate
    '(?:.?)' + // noncapturing, optional, match the decimal point
    '([0-9]{0,2})' + // optional, match the 2nd coordinate
        '$'
);

export function sortByCytoband(cyto1: string, cyto2: string) {
    let x = cyto1.match(cytobandRegExp);
    let y = cyto2.match(cytobandRegExp);

    if (!x || !y) return +!!x - +!!y;

    // sorts two cytobands,
    // where a cytoband in an array of strings, e.g. [12, p, 11, 5] ~ 12p11.5
    if (parseInt(x[1], 10) - parseInt(y[1], 10) !== 0)
        return parseInt(x[1], 10) - parseInt(y[1], 10);
    else if (x[2] === 'p' && y[2] === 'q') return -1;
    else if (x[2] === 'q' && y[2] === 'p') return 1;
    else if (x[2] === y[2]) return parseInt(x[3], 10) - parseInt(y[3], 10);

    return 0;
}
