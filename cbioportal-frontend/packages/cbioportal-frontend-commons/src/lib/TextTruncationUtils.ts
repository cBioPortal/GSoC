import measureText from 'measure-text';
import _ from 'lodash';

export function getTextDiagonal(textHeight: number, textWidth: number) {
    return Math.sqrt(Math.pow(textWidth, 2) + Math.pow(textHeight, 2));
}

export function getTextHeight(
    text: string,
    fontFamily: string,
    fontSize: string
) {
    return measureText({ text, fontFamily, fontSize, lineHeight: 1 }).height
        .value;
}

export function getTextWidth(
    text: string,
    fontFamily: string,
    fontSize: string
) {
    return measureText({ text, fontFamily, fontSize, lineHeight: 1 }).width
        .value;
}

function splitTextByWidth(
    text: string,
    maxWidth: number,
    fontFamily: string,
    fontSize: string
) {
    const ret: string[] = [];
    let index = 0;
    let chunk = '';
    while (index < text.length) {
        chunk += text[index];
        if (getTextWidth(chunk, fontFamily, fontSize) >= maxWidth) {
            ret.push(chunk);
            chunk = '';
        }
        index += 1;
    }
    if (chunk.length) {
        ret.push(chunk);
    }
    return ret;
}

export function wrapText(
    text: string,
    maxWidth: number,
    fontFamily: string,
    fontSize: string
): string[] {
    if (getTextWidth(text, fontFamily, fontSize) <= maxWidth) {
        return [text];
    } else {
        // label too big, need to wrap to fit
        let words = text.split(/\s+/g); // first split words, for nicer breaks if possible
        // next split chunks of max width
        words = _.flatten(
            words.map(word =>
                splitTextByWidth(word, maxWidth, fontFamily, fontSize)
            )
        );
        let currentLine = '';
        const ret: string[] = [];
        for (const word of words) {
            if (getTextWidth(word, fontFamily, fontSize) >= maxWidth) {
                if (currentLine.length) {
                    ret.push(currentLine);
                }
                ret.push(word);
                currentLine = '';
            } else if (
                getTextWidth(
                    (currentLine.length ? currentLine + ' ' : currentLine) +
                        word,
                    fontFamily,
                    fontSize
                ) >= maxWidth
            ) {
                if (currentLine.length) {
                    ret.push(currentLine);
                }
                currentLine = word;
            } else {
                if (currentLine.length) {
                    currentLine += ' ';
                }
                currentLine += word;
            }
        }
        if (currentLine.length) {
            ret.push(currentLine);
        }
        return ret;
    }
}

export function truncateWithEllipsis(
    text: string,
    maxWidth: number,
    fontFamily: string,
    fontSize: string
): string {
    const wrapped = splitTextByWidth(text, maxWidth, fontFamily, fontSize);
    if (wrapped.length > 1) {
        return wrapped[0] + '...';
    } else {
        return wrapped[0];
    }
}

export function truncateWithEllipsisReport(
    text: string,
    maxWidth: number,
    fontFamily: string,
    fontSize: string
) {
    const wrapped = splitTextByWidth(text, maxWidth, fontFamily, fontSize);
    let isTruncated = false;
    if (wrapped.length > 1) {
        text = wrapped[0] + '...';
        isTruncated = true;
    } else {
        text = wrapped[0];
        isTruncated = false;
    }
    return {
        text,
        isTruncated,
    };
}
