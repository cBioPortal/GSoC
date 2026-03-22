import {
    getTextWidth,
    longestCommonStartingSubstring,
} from 'cbioportal-frontend-commons';
import { countMutationsByProteinChange, Mutation } from 'cbioportal-utils';
import { PfamDomainRange } from 'genome-nexus-ts-api-client';
import numeral from 'numeral';

import { LollipopSpec } from '../model/LollipopSpec';

export function lollipopLabelText(
    mutationsAtPosition: Mutation[],
    size?: number
): string {
    const mutationCountsByProteinChange = countMutationsByProteinChange(
        mutationsAtPosition
    ).filter(c => c.proteinChange !== undefined);

    // only pick specified number of protein change values
    const proteinChanges = mutationCountsByProteinChange
        .map(m => m.proteinChange)
        .slice(0, size && size > 0 ? size : undefined);

    // sort alphabetically (to make it easier to find longest common starting substring)
    const proteinChangesSorted = proteinChanges.slice(0).sort();

    let startStr = '';
    if (proteinChangesSorted.length > 1) {
        // only need to compare first and last element of sorted string list to find longest common starting substring of all of them
        startStr = longestCommonStartingSubstring(
            proteinChangesSorted[0],
            proteinChangesSorted[proteinChangesSorted.length - 1]
        );
    }

    // remove longest common starting substring from all protein change values
    const proteinChangesTrimmed = proteinChanges.map(p =>
        p.substring(startStr.length)
    );

    // construct label (sorted by protein change count, not alphabetically)
    let label = startStr + proteinChangesTrimmed.join('/');

    if (proteinChanges.length < mutationCountsByProteinChange.length) {
        label = `${label} and ${mutationCountsByProteinChange.length -
            proteinChanges.length} more`;
    }

    return label;
}

export function lollipopLabelTextAnchor(
    labelText: string,
    codon: number,
    fontFamily: string,
    fontSize: number,
    geneWidth: number,
    proteinLength: number
): string {
    let anchor = 'middle';
    const approxLabelWidth = getTextWidth(
        labelText,
        fontFamily,
        `${fontSize}px`
    );
    const lollipopDistanceToOrigin = codon * (geneWidth / proteinLength);
    const lollipopDistanceToXMax = geneWidth - lollipopDistanceToOrigin;

    // if lollipop is too close to the origin, in order to prevent label overlap set anchor to "start"
    if (approxLabelWidth / 2 > lollipopDistanceToOrigin) {
        anchor = 'start';
    }
    // if lollipop is too close to the end of the protein, in order to prevent overflow set anchor to "end"
    else if (approxLabelWidth / 2 > lollipopDistanceToXMax) {
        anchor = 'end';
    }

    return anchor;
}

export function calcYMaxInput(
    yMaxInput: number | undefined,
    yMaxStep: number,
    countRange: number[],
    oppositeCountRange: number[],
    yAxisSameScale?: boolean
) {
    // allow the user input value to go over the actual count range
    let input = yMaxInput;

    if (input === undefined) {
        input = yAxisSameScale
            ? numeral(
                  numeral(
                      getCommonYAxisMaxSliderValue(
                          yMaxStep,
                          countRange,
                          oppositeCountRange
                      )
                  ).format(String(yMaxStep))
              ).value()
            : numeral(
                  numeral(getYAxisMaxSliderValue(yMaxStep, countRange)).format(
                      String(yMaxStep)
                  )
              ).value();
    }

    return input;
}

export function getCommonYAxisMaxSliderValue(
    yMaxStep: number,
    countRange: number[],
    oppositeCountRange: number[],
    yMaxInput?: number
) {
    const defaultTopMin = getYAxisMaxSliderValue(
        yMaxStep,
        countRange,
        yMaxInput
    );
    const defaultBottomMin = getYAxisMaxSliderValue(
        yMaxStep,
        oppositeCountRange,
        yMaxInput
    );

    return Math.max(defaultTopMin, defaultBottomMin);
}

export function getYAxisMaxSliderValue(
    yMaxStep: number,
    countRange: number[],
    yMaxInput?: number
) {
    const defaultMin = yMaxStep * Math.ceil(countRange[1] / yMaxStep);
    // we don't want max slider value to go over the actual max, even if the user input goes over it
    return Math.min(defaultMin, yMaxInput || defaultMin);
}

export function getYAxisMaxInputValue(yMaxStep: number, input: string) {
    const value = parseFloat(input);
    return value < yMaxStep ? yMaxStep : value;
}

export function calcCountRange(
    lollipops: LollipopSpec[],
    defaultMax: number = 5,
    defaultMin: number = 1
): [number, number] {
    if (lollipops.length === 0) {
        return [0, 0];
    } else {
        let max = defaultMax;
        let min = defaultMin;

        for (const lollipop of lollipops) {
            max = Math.max(max, lollipop.count);
            min = Number.isInteger(lollipop.count)
                ? Math.min(min, lollipop.count)
                : Math.min(0.1, lollipop.count);
        }

        return [min, Math.max(min, max)];
    }
}

function isInThisDomain(codon: number) {
    return (range: PfamDomainRange): boolean => {
        return codon >= range.pfamDomainStart && codon <= range.pfamDomainEnd;
    };
}

export function byMiddlemostPosition(averageCodon: number) {
    return (x: LollipopSpec, y: LollipopSpec): 1 | -1 | 0 => {
        const yDistance = Math.abs(y.codon - averageCodon);
        const xDistance = Math.abs(x.codon - averageCodon);
        if (yDistance > xDistance) {
            return -1;
        } else if (xDistance > yDistance) {
            return 1;
        } else {
            return 0;
        }
    };
}

export function byWhetherExistsInADomain(remainingDomains: PfamDomainRange[]) {
    return (x: LollipopSpec, y: LollipopSpec): 0 | 1 | -1 => {
        const isYInADomain = remainingDomains.some(isInThisDomain(y.codon));
        const isXInADomain = remainingDomains.some(isInThisDomain(x.codon));
        if (
            (isYInADomain && isXInADomain) ||
            (!isYInADomain && !isXInADomain)
        ) {
            return 0;
        } else if (isYInADomain) {
            return 1;
        } else {
            return -1;
        }
    };
}

export function byMutationCount(x: LollipopSpec, y: LollipopSpec): number {
    if (y.count > x.count) {
        return 1;
    } else if (y.count < x.count) {
        return -1;
    }
    return 0;
}
