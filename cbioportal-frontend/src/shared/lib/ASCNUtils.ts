import _ from 'lodash';
import {
    ASCN_AMP,
    ASCN_GAIN,
    ASCN_LIGHTGREY,
    ASCN_HETLOSS,
    ASCN_HOMDEL,
    ASCN_BLACK,
    ASCN_WHITE,
} from 'shared/lib/Colors';

// Color inside the rectangle
export function getASCNCopyNumberColor(
    ASCNCopyNumberValueEnum: string
): string {
    switch (ASCNCopyNumberValueEnum) {
        case '2':
            return ASCN_AMP;
        case '1':
            return ASCN_GAIN;
        case '0':
            return ASCN_WHITE;
        case '-1':
            return ASCN_HETLOSS;
        case '-2':
            return ASCN_HOMDEL;
        case 'INDETERMINATE':
            return ASCN_LIGHTGREY;
        default:
            return ASCN_BLACK;
    }
}

// Border color
export function getASCNCopyNumberStrokeColor(
    ASCNCopyNumberValueEnum: string
): string {
    switch (ASCNCopyNumberValueEnum) {
        case '2':
            return ASCN_AMP;
        case '1':
            return ASCN_GAIN;
        case '0':
            return ASCN_LIGHTGREY;
        case '-1':
            return ASCN_HETLOSS;
        case '-2':
            return ASCN_HOMDEL;
        case 'INDETERMINATE':
            return 'ASCN_LIGHTGREY';
        default:
            return ASCN_BLACK;
    }
}

export function getASCNCopyNumberTextColor(
    ASCNCopyNumberValueEnum: string
): string {
    return ASCNCopyNumberValueEnum === '0' ? ASCN_BLACK : ASCN_WHITE;
}
