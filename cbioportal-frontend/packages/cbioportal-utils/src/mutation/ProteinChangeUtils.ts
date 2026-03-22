const PROTEIN_CHANGE_MATCHERS = [
    /^([A-Z*]+)([0-9]+)([A-Z*?]*)$/,
    /[A-Z]?([0-9]+)(_[A-Z]?([0-9]+))?(delins|ins)([A-Z]+)/,
    /[A-Z]?([0-9]+)(_[A-Z]?([0-9]+))?(_)?splice/,
    /[A-Z]?([0-9]+)_[A-Z]?([0-9]+)(.+)/,
    /([A-Z*])([0-9]+)[A-Z]?fs.*/,
    /([A-Z]+)?([0-9]+)((ins)|(del)|(dup))/,
];

/**
 * Finds the uniprot location for the given protein change value.
 *
 * @return  protein location
 */
export function getProteinPositionFromProteinChange(
    proteinChange?: string
): { start: number; end: number } | undefined {
    if (!proteinChange) {
        return undefined;
    }

    // try all possible protein change patterns to resolve the protein position

    let proteinPosition = resolveProteinPositionForPattern0(proteinChange);

    if (!proteinPosition) {
        proteinPosition = resolveProteinPositionForPattern1(proteinChange);
    }

    if (!proteinPosition) {
        proteinPosition = resolveProteinPositionForPattern2(proteinChange);
    }

    if (!proteinPosition) {
        proteinPosition = resolveProteinPositionForPattern3(proteinChange);
    }

    if (!proteinPosition) {
        proteinPosition = resolveProteinPositionForPattern4(proteinChange);
    }

    if (!proteinPosition) {
        proteinPosition = resolveProteinPositionForPattern5(proteinChange);
    }

    if (!proteinPosition) {
        const location = extractFirstNumericalValue(proteinChange);
        proteinPosition = location
            ? { start: location, end: location }
            : undefined;
    }

    return proteinPosition;
}

function extractFirstNumericalValue(proteinChange: string) {
    let value;
    let match: RegExpMatchArray | null = null;

    if (proteinChange) {
        match = proteinChange.match(/[0-9]+/);
    }

    if (match) {
        value = parseInt(match[0], 10);
    }

    return value;
}

// main logic copied over from annotateAlteration method in
// https://github.com/oncokb/oncokb/blob/master/core/src/main/java/org/mskcc/cbio/oncokb/util/AlterationUtils.java
export function getMutationTypeFromProteinChange(
    proteinChange?: string
): string | undefined {
    if (!proteinChange) {
        return undefined;
    }

    if (proteinChange.startsWith('p.')) {
        proteinChange = proteinChange.substring(2);
    }

    if (proteinChange.includes('[')) {
        proteinChange = proteinChange.substring(0, proteinChange.indexOf('['));
    }

    proteinChange = proteinChange.trim();

    // try all possible protein change patterns to resolve the consequence

    let consequence = resolveConsequenceForPattern0(proteinChange);

    if (!consequence) {
        consequence = resolveConsequenceForPattern1(proteinChange);
    }

    if (!consequence) {
        consequence = resolveConsequenceForPattern2(proteinChange);
    }

    if (!consequence) {
        consequence = resolveConsequenceForPattern3(proteinChange);
    }

    if (!consequence) {
        consequence = resolveConsequenceForPattern4(proteinChange);
    }

    if (!consequence) {
        consequence = resolveConsequenceForPattern5(proteinChange);
    }

    return consequence;
}

function resolveProteinPositionForPattern0(
    proteinChange: string
): { start: number; end: number } | undefined {
    const match = proteinChange.match(PROTEIN_CHANGE_MATCHERS[0]);
    let proteinPosition;

    if (match) {
        const reference = match[1];
        const start = parseInt(match[2], 10);
        const variant = match[3];

        let end = start;

        if (
            reference !== variant &&
            reference !== '*' &&
            variant !== '*' &&
            start !== 1 &&
            variant !== '?'
        ) {
            end = start + reference.length - 1;
        }

        proteinPosition = { start, end };
    }

    return proteinPosition;
}

function resolveProteinPositionForPattern1(
    proteinChange: string
): { start: number; end: number } | undefined {
    const match = proteinChange.match(PROTEIN_CHANGE_MATCHERS[1]);
    let proteinPosition;

    if (match) {
        const start = parseInt(match[1], 10);
        const end = match[3] ? parseInt(match[3], 10) : start;

        proteinPosition = { start, end };
    }

    return proteinPosition;
}

function resolveProteinPositionForPattern2(
    proteinChange: string
): { start: number; end: number } | undefined {
    const match = proteinChange.match(PROTEIN_CHANGE_MATCHERS[2]);
    let proteinPosition;

    if (match) {
        const start = parseInt(match[1], 10);
        const end = match[3] ? parseInt(match[3], 10) : start;

        proteinPosition = { start, end };
    }

    return proteinPosition;
}

function resolveProteinPositionForPattern3(
    proteinChange: string
): { start: number; end: number } | undefined {
    const match = proteinChange.match(PROTEIN_CHANGE_MATCHERS[3]);
    let proteinPosition;

    if (match) {
        const start = parseInt(match[1], 10);
        const end = parseInt(match[2], 10);

        proteinPosition = { start, end };
    }

    return proteinPosition;
}

function resolveProteinPositionForPattern4(
    proteinChange: string
): { start: number; end: number } | undefined {
    const match = proteinChange.match(PROTEIN_CHANGE_MATCHERS[4]);
    let proteinPosition;

    if (match) {
        const start = parseInt(match[2], 10);
        const end = start;

        proteinPosition = { start, end };
    }

    return proteinPosition;
}

function resolveProteinPositionForPattern5(
    proteinChange: string
): { start: number; end: number } | undefined {
    const match = proteinChange.match(PROTEIN_CHANGE_MATCHERS[5]);
    let proteinPosition;

    if (match) {
        const start = parseInt(match[2], 10);
        const end = start;

        proteinPosition = { start, end };
    }

    return proteinPosition;
}

function resolveConsequenceForPattern0(
    proteinChange: string
): string | undefined {
    let consequence: string | undefined;

    // const p = Pattern.compile("^([A-Z\\*]+)([0-9]+)([A-Z\\*\\?]*)$");
    // const m = p.matcher(proteinChange);
    const match = proteinChange.match(PROTEIN_CHANGE_MATCHERS[0]);

    if (match) {
        const reference = match[1];
        const start = parseInt(match[2], 10);
        const variant = match[3];

        const refL = reference.length;
        const varL = variant.length;

        if (reference === variant) {
            consequence = 'synonymous_variant';
        } else if (reference === '*') {
            consequence = 'stop_lost';
        } else if (variant === '*') {
            consequence = 'stop_gained';
        } else if (start === 1) {
            consequence = 'start_lost';
        } else if (variant === '?') {
            consequence = 'any';
        } else {
            if (refL > 1 || varL > 1) {
                // Handle inframe insertion/deletion event. Exp: IK744K
                if (refL > varL) {
                    consequence = 'inframe_deletion';
                } else if (refL < varL) {
                    consequence = 'inframe_insertion';
                } else {
                    consequence = 'missense_variant';
                }
            } else {
                consequence = 'missense_variant';
            }
        }
    }

    return consequence;
}

function resolveConsequenceForPattern1(
    proteinChange: string
): string | undefined {
    let consequence: string | undefined;

    // const p = Pattern.compile("[A-Z]?([0-9]+)(_[A-Z]?([0-9]+))?(delins|ins)([A-Z]+)");
    // const m = p.matcher(proteinChange);
    const match = proteinChange.match(PROTEIN_CHANGE_MATCHERS[1]);

    if (match) {
        const start = parseInt(match[1], 10);
        const end = match[3] ? parseInt(match[3], 10) : start;
        const type = match[4];

        if (type === 'ins') {
            consequence = 'inframe_insertion';
        } else {
            const deletion = end - start + 1;
            const insertion = match[5].length;

            if (insertion - deletion > 0) {
                consequence = 'inframe_insertion';
            } else if (insertion - deletion === 0) {
                consequence = 'missense_variant';
            } else {
                consequence = 'inframe_deletion';
            }
        }
    }

    return consequence;
}

function resolveConsequenceForPattern2(
    proteinChange: string
): string | undefined {
    let consequence: string | undefined;

    // const p = Pattern.compile("[A-Z]?([0-9]+)(_[A-Z]?([0-9]+))?(_)?splice");
    // const m = p.matcher(proteinChange);
    const match = proteinChange.match(PROTEIN_CHANGE_MATCHERS[2]);

    if (match) {
        consequence = 'splice_region_variant';
    }

    return consequence;
}

function resolveConsequenceForPattern3(
    proteinChange: string
): string | undefined {
    let consequence: string | undefined;

    // const p = Pattern.compile("[A-Z]?([0-9]+)_[A-Z]?([0-9]+)(.+)");
    // const m = p.matcher(proteinChange);
    const match = proteinChange.match(PROTEIN_CHANGE_MATCHERS[3]);

    if (match) {
        const v = match[3];
        switch (v) {
            case 'mis':
                consequence = 'missense_variant';
                break;
            case 'ins':
                consequence = 'inframe_insertion';
                break;
            case 'del':
                consequence = 'inframe_deletion';
                break;
            case 'fs':
                consequence = 'frameshift_variant';
                break;
            case 'trunc':
                consequence = 'feature_truncation';
                break;
            case 'dup':
                consequence = 'inframe_insertion';
                // isDup = true;
                break;
            case 'mut':
                consequence = 'any';
        }
    }

    return consequence;
}

function resolveConsequenceForPattern4(
    proteinChange: string
): string | undefined {
    let consequence: string | undefined;

    //const p = Pattern.compile("([A-Z\\*])([0-9]+)[A-Z]?fs.*");
    //const m = p.matcher(proteinChange);
    const match = proteinChange.match(PROTEIN_CHANGE_MATCHERS[4]);

    if (match) {
        //const ref = match[1);
        consequence = 'frameshift_variant';
    }

    return consequence;
}

function resolveConsequenceForPattern5(
    proteinChange: string
): string | undefined {
    let consequence: string | undefined;

    // const p = Pattern.compile("([A-Z]+)?([0-9]+)((ins)|(del)|(dup))");
    // const m = p.matcher(proteinChange);
    const match = proteinChange.match(PROTEIN_CHANGE_MATCHERS[5]);

    if (match) {
        // const ref = match[1);
        const v = match[3];

        switch (v) {
            case 'ins':
                consequence = 'inframe_insertion';
                break;
            case 'dup':
                // isDup = true;
                consequence = 'inframe_insertion';
                break;
            case 'del':
                consequence = 'inframe_deletion';
                break;
        }
    }

    return consequence;
}

// this is to sort alphabetically
// in case the protein position values are the same
function extractNonNumerical(matched: RegExpMatchArray): number[] {
    const nonNumerical: RegExp = /[^0-9]+/g;
    const buffer: RegExpMatchArray | null = matched[0].match(nonNumerical);
    const value: number[] = [];

    if (buffer && buffer.length > 0) {
        const str: string = buffer.join('');

        // since we are returning a float value
        // assigning numerical value for each character.
        // we have at most 2 characters, so this should be safe...
        for (let i: number = 0; i < str.length; i++) {
            value.push(str.charCodeAt(i));
        }
    }

    return value;
}

/**
 * Extracts the sort value for the protein change value.
 * The return value is based on the protein change location.
 *
 * @param proteinChange
 * @returns {number} sort value
 */
export function calcProteinChangeSortValue(
    proteinChange: string
): number | null {
    // let matched = proteinChange.match(/.*[A-Z]([0-9]+)[^0-9]+/);
    const alleleAndPosition: RegExp = /[A-Za-z][0-9]+./g;
    const position: RegExp = /[0-9]+/g;

    // first priority is to match values like V600E , V600, E747G, E747, X37_, X37, etc.
    let matched: RegExpMatchArray | null = proteinChange.match(
        alleleAndPosition
    );
    let buffer: number[] = [];

    // if no match, then search for numerical (position) match only
    if (!matched || matched.length === 0) {
        matched = proteinChange.match(position);
    }
    // if match, then extract the first numerical value for sorting purposes
    else {
        // this is to sort alphabetically
        buffer = extractNonNumerical(matched);
        matched = matched[0].match(position);
    }

    // if match, then use the first integer value as sorting data
    if (matched && matched.length > 0) {
        let toParse: string = matched[0];

        // this is to sort alphabetically
        if (buffer && buffer.length > 0) {
            // add the alphabetical information as the decimal part...
            // (not the best way to ensure alphabetical sorting,
            // but in this method we are only allowed to return a numerical value)
            toParse += '.' + buffer.join('');
        }

        return parseFloat(toParse);
    } else {
        // no match at all: do not sort
        return null;
    }
}

export function isGermlineMutationStatus(mutationStatus: string | null) {
    return (
        mutationStatus && mutationStatus.toLowerCase().indexOf('germline') > -1
    );
}
