import { fastParseInt16 } from './utils';
import { RGBAColor } from './oncoprintruleset';

export default function extractrgba(str: string): RGBAColor {
    if (str[0] === '#') {
        // hex, convert to rgba
        return hexToRGBA(str);
    }
    const match = str.match(
        /^[\s]*rgba\([\s]*([0-9.]+)[\s]*,[\s]*([0-9.]+)[\s]*,[\s]*([0-9.]+)[\s]*,[\s]*([0-9.]+)[\s]*\)[\s]*$/
    );
    if (match && match.length === 5) {
        return [
            parseFloat(match[1]) / 255,
            parseFloat(match[2]) / 255,
            parseFloat(match[3]) / 255,
            parseFloat(match[4]),
        ];
    }
    throw `could not extract rgba from ${str}`;
}

export function hexToRGBA(str: string): RGBAColor {
    const r = fastParseInt16(str[1] + str[2]);
    const g = fastParseInt16(str[3] + str[4]);
    const b = fastParseInt16(str[5] + str[6]);
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
