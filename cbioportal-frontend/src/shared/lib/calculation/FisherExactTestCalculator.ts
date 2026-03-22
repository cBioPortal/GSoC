import _ from 'lodash';

function getProbability(
    a: number,
    b: number,
    c: number,
    d: number,
    logFactorial: number[]
): number {
    const n: number = a + b + c + d;
    const p: number =
        logFactorial[a + b] +
        logFactorial[c + d] +
        logFactorial[a + c] +
        logFactorial[b + d] -
        (logFactorial[a] +
            logFactorial[b] +
            logFactorial[c] +
            logFactorial[d] +
            logFactorial[n]);
    return Math.exp(p);
}

export function getTwoTailedPValue(
    a: number,
    b: number,
    c: number,
    d: number
): number {
    let min: number, i: number;
    const n: number = a + b + c + d;
    let p: number = 0;
    let logFactorial: number[] = new Array(n + 1);
    logFactorial[0] = 0.0;

    _.forEach(logFactorial, (n, i) => {
        i > 0 ? (logFactorial[i] = logFactorial[i - 1] + Math.log(i)) : null;
    });

    let baseP = getProbability(a, b, c, d, logFactorial);
    let initialA = a,
        initialB = b,
        initialC = c,
        initialD = d;
    p += baseP;

    min = c < b ? c : b;
    _.forEach(_.range(0, min), () => {
        let tempP = getProbability(++a, --b, --c, ++d, logFactorial);
        if (tempP <= baseP) {
            p += tempP;
        }
    });

    a = initialA;
    b = initialB;
    c = initialC;
    d = initialD;

    min = a < d ? a : d;
    _.forEach(_.range(0, min), () => {
        let pTemp = getProbability(--a, ++b, ++c, --d, logFactorial);
        if (pTemp <= baseP) {
            p += pTemp;
        }
    });
    return p;
}
