import _ from 'lodash';
import numeral from 'numeral';
import { axisTickLabelStyles } from '../../src/theme/cBioPortalTheme';
import { wrapText } from './TextTruncationUtils';

export function wrapTick(label: string, maxWidth: number): string[] {
    return wrapText(
        label,
        maxWidth,
        axisTickLabelStyles.fontFamily,
        axisTickLabelStyles.fontSize + 'px'
    );
}

function zeroes(times: number) {
    let ret = '';
    for (let i = 0; i < times; i++) {
        ret += '0';
    }
    return ret;
}

function getUniqueFormat(
    values: number[],
    formatFn: (precision: number) => string
) {
    let precision = 0;
    let format = '';
    while (precision < 3) {
        format = formatFn(precision);
        const uniqueValues = _.uniq(values.map(v => numeral(v).format(format)));
        if (uniqueValues.length === values.length) {
            //unique!
            break;
        }
        precision++;
    }
    return format;
}

export function getUniqueFormatThousands(values: number[]) {
    values = values.filter(v => Math.abs(v) >= 1000);
    return getUniqueFormat(values, precision => `0.[${zeroes(precision)}]a`);
}

export function getUniqueFormatLessThanThousands(values: number[]) {
    values = values.filter(v => Math.abs(v) < 1000);
    return getUniqueFormat(values, precision => `0.[${zeroes(precision)}]`);
}

export function tickFormatNumeral(
    val: number,
    values: number[],
    transform?: (t: number) => number
) {
    // transform is, e.g., log
    if (transform) {
        val = transform(val);
        values = values.map(transform);
    }
    if (val >= 1000) {
        return numeral(val).format(getUniqueFormatThousands(values));
    } else {
        return numeral(val).format(getUniqueFormatLessThanThousands(values));
    }
}
