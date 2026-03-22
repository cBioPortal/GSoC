import * as React from 'react';
import _ from 'lodash';

import { toConditionalPrecision } from 'shared/lib/NumberUtils';
import numeral from 'numeral';

export function toPrecision(
    value: number,
    precision: number,
    threshold: number
) {
    // round to precision significant figures
    // with threshold being the upper bound on the numbers that are
    // rewritten in exponential notation

    if (0.000001 <= value && value < threshold)
        return value.toExponential(precision);

    let ret = value.toPrecision(precision);
    //if (ret.indexOf(".")!==-1)
    //    ret = ret.replace(/\.?0+$/,'');

    return ret;
}

export function toFixedWithoutTrailingZeros(
    value: number,
    digits: number
): string {
    let fixed = value.toFixed(digits);
    let zeros = '';
    for (let i = 0; i < digits; i++) {
        zeros += '0';
    }

    return numeral(value).format(`0[.][${zeros}]`);
}

/**
 * Works the same as the default toFixed() function when the result string is not expected to be a zero value
 * such as 0.0, 0.00, 0.000, etc.
 *
 * If the default toFixed() function returns a zero value, then converts it to an inequality such as
 * <0.1, <0.01, <0.001, etc.
 */
export function toFixedWithThreshold(value: number, digits: number): string {
    let fixed = value.toFixed(digits);

    // if we end up with 0.0...0, returns <0.0...1 instead
    if (value !== 0 && parseFloat(fixed) === 0) {
        const floatingZeros = digits > 1 ? _.fill(Array(digits - 1), '0') : [];

        // in case the value is negative, direction of the inequality changes
        // (because, for example, 0.02 < 0.1 but, -0.02 > -0.1)
        // we need to add the minus sign as well...
        const prefix = value > 0 ? '<' : '>-';

        fixed = `${prefix}0.${floatingZeros.join('')}1`;
    }

    return fixed;
}

export function getPercentage(proportion: number) {
    const perc = 100 * proportion;
    if (perc === 0) {
        return '0%';
    } else if (perc < 1) {
        return `<1%`;
    } else {
        return `${Math.round(perc)}%`;
    }
}

export function formatSignificanceValueWithStyle(value: number): JSX.Element {
    let formattedValue = <span>{toConditionalPrecision(value, 3, 0.01)}</span>;
    if (value < 0.05) {
        formattedValue = <b>{formattedValue}</b>;
    }
    return formattedValue;
}

export function formatLogOddsRatio(logOddsRatio: number): string {
    if (logOddsRatio < -10) {
        return '<-10';
    } else if (logOddsRatio > 10) {
        return '>10';
    }
    return logOddsRatio.toFixed(2);
}

export function roundLogRatio(logRatio: number, threshold: number): number {
    if (logRatio > threshold) {
        return threshold;
    } else if (logRatio < -threshold) {
        return -threshold;
    } else {
        return Number(logRatio.toFixed(2));
    }
}

export function toConditionalPrecisionWithMinimum(
    positiveNumber: number,
    precision: number,
    precisionThreshold: number,
    minimumExponent: number,
    prependEqualSign?: boolean
): string | React.ReactNode {
    if (positiveNumber === 0 || Math.log10(positiveNumber) < minimumExponent) {
        return (
            <span>
                &lt; 10<sup>{minimumExponent}</sup>
            </span>
        );
    } else {
        let transformed = toConditionalPrecision(
            positiveNumber,
            precision,
            precisionThreshold
        );
        return (
            <>
                {prependEqualSign ? ' = ' : ''}
                {transformed}
            </>
        );
    }
}

// return 'NA' for NaN value
// difference between this function and the previous one is it will display percentages less than 1% as <1%
export function getMutationalSignaturePercentage(
    proportion: number,
    digits: number = 0
) {
    //0.003 -> 0.3
    if (Number.isNaN(proportion)) {
        return 'NA';
    } else {
        if (100 * proportion < 1) {
            return '<1%';
        }
        return `${toFixedWithThreshold(100 * proportion, digits)}%`;
    }
}

export function shortenStudyName(studyName: string) {
    const parenIndex = studyName.indexOf('(');
    if (parenIndex > 50) {
        const studyNameRight: string = studyName.substring(parenIndex);
        const studyNameLeft: string = studyName.substring(0, 49);
        return studyNameLeft + '...' + studyNameRight;
    } else return studyName;
}
