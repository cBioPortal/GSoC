import $ from 'jquery';

export function truncateDisplayText(
    label: string,
    textElt: SVGTextElement | null,
    width: number
) {
    // Truncate text if necessary
    if (!textElt) {
        return label;
    }

    if (!$(textElt!).is(':visible')) {
        return label;
    }

    let substringLength = label.length;
    // Find the number of characters that will fit inside
    while (
        substringLength > 0 &&
        textElt!.getSubStringLength(0, substringLength) > width
    ) {
        substringLength -= 1;
    }
    let displayText = label;
    if (substringLength < label.length) {
        // If we have to do shortening
        substringLength -= 2; // make room for ellipsis ".."
        if (substringLength <= 0) {
            // too short to show any string
            displayText = '';
        } else {
            // if it's long enough to show anything at all
            displayText = label.substr(0, substringLength) + '..';
        }
    }
    return displayText;
}
