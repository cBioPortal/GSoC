import _ from 'lodash';

export function adjustedLongestLabelLength(labels: string[]): number {
    const adjustedForCaps = labels.map(label => {
        const capitalizedLetters = label.match(/[A-Z]/g) || [];
        const undercaseLetters = label.match(/[a-z]/g) || [];
        const spaces = label.match(/\s/g) || [];
        const everythingelse =
            label.length -
            capitalizedLetters.length -
            undercaseLetters.length -
            spaces.length;
        return (
            capitalizedLetters.length * 2 +
            undercaseLetters.length * 1 +
            spaces.length * 2 +
            everythingelse * 1
        );
    });

    return _.max(adjustedForCaps) || 0;
}
