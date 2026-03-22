import _ from 'lodash';
import {
    CNA_COLOR_AMP,
    CNA_COLOR_GAIN,
    CNA_COLOR_HETLOSS,
    CNA_COLOR_HOMDEL,
    MUT_COLOR_INFRAME,
    MUT_COLOR_MISSENSE,
    MUT_COLOR_MISSENSE_PASSENGER,
    MUT_COLOR_PROMOTER,
    MUT_COLOR_SPLICE,
    MUT_COLOR_TRUNC,
    STRUCTURAL_VARIANT_COLOR,
} from 'cbioportal-frontend-commons';
import { RGBAColor } from 'oncoprintjs';
// Default grey
export const BLACK = '#000000';
export const LIGHT_GREY = '#D3D3D3';
export const DEFAULT_GREY = '#BEBEBE';
export const DARK_GREY = '#A9A9A9';

// icon colors
export const ICON_FILTER_ON = BLACK;
export const ICON_FILTER_OFF = DEFAULT_GREY;

// colors of ASCNCopyNumber icon
export const ASCN_AMP = '#ff0000';
export const ASCN_GAIN = '#e15b5b';
export const ASCN_HETLOSS = '#2a5eea';
export const ASCN_HOMDEL = '#0000ff';
export const ASCN_LIGHTGREY = '#bcbcbc';
export const ASCN_DARKGREY = '#a9a9a9';
export const ASCN_BLACK = '#000000';
export const ASCN_WHITE = '#ffffff';

export const DEFAULT_NA_COLOR = LIGHT_GREY;
export const DEFAULT_UNKNOWN_COLOR = DARK_GREY;

// clinical value colors
// Original version
// const CLI_YES_COLOR = "#109618";
// const CLI_NO_COLOR = "#DC3912";

// Colorblind safe version. http://colorbrewer2.org/#type=qualitative&scheme=Dark2&n=3
export const CLI_YES_COLOR = '#1b9e77';
export const CLI_NO_COLOR = '#d95f02';

export const CLI_FEMALE_COLOR = '#E0699E';
export const CLI_MALE_COLOR = '#2986E2';

export let RESERVED_CLINICAL_VALUE_COLORS: { [value: string]: string } = {
    true: CLI_YES_COLOR,
    yes: CLI_YES_COLOR,
    positive: CLI_YES_COLOR,
    'disease free': CLI_YES_COLOR,
    'tumor free': CLI_YES_COLOR,
    living: CLI_YES_COLOR,
    alive: CLI_YES_COLOR,
    'not progressed': CLI_YES_COLOR,

    false: CLI_NO_COLOR,
    no: CLI_NO_COLOR,
    negative: CLI_NO_COLOR,
    recurred: CLI_NO_COLOR,
    progressed: CLI_NO_COLOR,
    'recurred/progressed': CLI_NO_COLOR,
    'with tumor': CLI_NO_COLOR,
    deceased: CLI_NO_COLOR,

    female: CLI_FEMALE_COLOR,
    f: CLI_FEMALE_COLOR,

    male: CLI_MALE_COLOR,
    m: CLI_MALE_COLOR,

    other: DEFAULT_UNKNOWN_COLOR,

    unknown: DEFAULT_NA_COLOR,
    na: DEFAULT_NA_COLOR,

    missense: MUT_COLOR_MISSENSE,
    inframe: MUT_COLOR_INFRAME,
    truncating: MUT_COLOR_TRUNC,
    fusion: STRUCTURAL_VARIANT_COLOR,
    splice: MUT_COLOR_SPLICE,
    promoter: MUT_COLOR_PROMOTER,
    driver: MUT_COLOR_MISSENSE,
    vus: MUT_COLOR_MISSENSE_PASSENGER,
    // SURVIVAL_DATA: CLI_NO_COLOR
    '1:deceased': CLI_NO_COLOR,
    '1:recurred/progressed': CLI_NO_COLOR,
    '1:recurred': CLI_NO_COLOR,
    '1:progressed': CLI_NO_COLOR,
    '1:yes': CLI_NO_COLOR,
    '1:1': CLI_NO_COLOR,
    '1:progression': CLI_NO_COLOR,
    '1:event': CLI_NO_COLOR,
    '1:dead of melanoma': CLI_NO_COLOR,
    '1:dead with tumor': CLI_NO_COLOR,
    '1:metastatic relapse': CLI_NO_COLOR,
    '1:localized relapse': CLI_NO_COLOR,
    // SURVIVAL_DATA: CLI_YES_COLOR
    '0:living': CLI_YES_COLOR,
    '0:alive': CLI_YES_COLOR,
    '0:diseasefree': CLI_YES_COLOR,
    '0:no': CLI_YES_COLOR,
    '0:0': CLI_YES_COLOR,
    '0:progressionfree': CLI_YES_COLOR,
    '0:no progression': CLI_YES_COLOR,
    '0:not progressed': CLI_YES_COLOR,
    '0:censored': CLI_YES_COLOR,
    '0:censor': CLI_YES_COLOR,
    '0:alive or censored': CLI_YES_COLOR,
    '0:alive or dead tumor free': CLI_YES_COLOR,
    '0:no relapse': CLI_YES_COLOR,
    '0:progression free': CLI_YES_COLOR,
    '0:censure': CLI_YES_COLOR,
    '0:ned': CLI_YES_COLOR,
    // OTHER: MUT_COLOR_OTHER,
    'wild type': DEFAULT_GREY,
    'no mutation': DEFAULT_GREY,
    amplification: CNA_COLOR_AMP,
    gain: CNA_COLOR_GAIN,
    diploid: DEFAULT_GREY,
    unchanged: DEFAULT_GREY,
    loss: CNA_COLOR_HETLOSS,
    'shallow deletion': CNA_COLOR_HETLOSS,
    'deep deletion': CNA_COLOR_HOMDEL,
};

_.forEach(RESERVED_CLINICAL_VALUE_COLORS, (color, key) => {
    // expand reservedValue entries to handle other case possibilities. eg expand TRUE to True and true
    RESERVED_CLINICAL_VALUE_COLORS[key.toLowerCase()] = color;
    RESERVED_CLINICAL_VALUE_COLORS[key.toUpperCase()] = color;

    const withoutSpace = key.replace(/\s/g, '');
    RESERVED_CLINICAL_VALUE_COLORS[withoutSpace] = color;
    RESERVED_CLINICAL_VALUE_COLORS[withoutSpace.toLowerCase()] = color;
    RESERVED_CLINICAL_VALUE_COLORS[withoutSpace.toUpperCase()] = color;

    RESERVED_CLINICAL_VALUE_COLORS[
        key[0].toUpperCase() + key.slice(1).toLowerCase()
    ] = color;
    RESERVED_CLINICAL_VALUE_COLORS[
        key
            .split(' ')
            .map(word => word[0].toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
    ] = color;
});

export function getClinicalValueColor(value: string): string | undefined {
    return RESERVED_CLINICAL_VALUE_COLORS[
        value.replace(/\s/g, '').toLowerCase()
    ];
}

export function getReservedGroupColor(value: string): string | undefined {
    // if group is composed of multiple predefined colors (ex: 0:Living, Female) then return undefined
    let groupColor: string | undefined = undefined;
    const words: string[] = value.split(',');
    words.forEach((word, index) => {
        const color = getClinicalValueColor(word);
        if (color != undefined) {
            if (groupColor == undefined) groupColor = color;
            else {
                groupColor = undefined;
                return groupColor;
            }
        }
    });
    return groupColor;
}

export function hexToRGBA(str: string): [number, number, number, number] {
    const r = parseInt(str[1] + str[2], 16);
    const g = parseInt(str[3] + str[4], 16);
    const b = parseInt(str[5] + str[6], 16);
    return [r, g, b, 1];
}

export function rgbaToHex(rgba: RGBAColor): string {
    let hexR = rgba[0].toString(16);
    let hexG = rgba[1].toString(16);
    let hexB = rgba[2].toString(16);
    if (hexR.length === 1) {
        hexR = '0' + hexR;
    }
    if (hexG.length === 1) {
        hexG = '0' + hexG;
    }
    if (hexB.length === 1) {
        hexB = '0' + hexB;
    }
    return `#${hexR}${hexG}${hexB}`;
}
