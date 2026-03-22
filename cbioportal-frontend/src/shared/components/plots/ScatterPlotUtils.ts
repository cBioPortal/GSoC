import regression from 'regression';

export function getRegressionComputations(
    data: [number, number][] //x,y
): {
    predict: (x: number) => [number, number]; // x => [x,y]
    string: string; // "y = mx + b"
    r2: number; // R^2 value
} {
    return regression.linear(data);
}

export function makeMultilineAxisLabel(
    axisLabel: string | undefined,
    charLimit: number
): string {
    if (!axisLabel) {
        return '';
    }

    return generateLineChunks(axisLabel, charLimit).join('\n');
}

export function getNumberOfNewlines(text: string): number {
    const regex = /\n/g;
    const matches = text.match(regex);
    return matches ? matches.length : 0;
}

function generateLineChunks(axisLabel: string, charLimit: number): string[] {
    const wordsFollowedBySpaces = axisLabel.match(/([^\s]+\s*)/g);
    if (!wordsFollowedBySpaces) {
        return [];
    }

    const result = wordsFollowedBySpaces.reduce(
        (previousValue, currentChunk) => {
            const lastChunk = previousValue.pop();
            const possiblyNewChunk = lastChunk
                ? lastChunk + currentChunk
                : currentChunk;
            if (possiblyNewChunk.length > charLimit) {
                if (lastChunk) {
                    previousValue.push(lastChunk);
                }
                previousValue.push(currentChunk);
            } else {
                previousValue.push(possiblyNewChunk);
            }

            return previousValue;
        },
        [] as string[]
    );

    return result;
}
