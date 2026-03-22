import _ from 'lodash';
import { Alignment, PdbHeader } from 'genome-nexus-ts-api-client';
import {
    IPdbPositionRange,
    IPdbChain,
    PdbAlignmentIndex,
    ALIGNMENT_GAP,
    ALIGNMENT_MINUS,
    ALIGNMENT_PLUS,
    ALIGNMENT_SPACE,
} from 'shared/model/Pdb';

// TODO temporary workaround for pdb structures not well supported by 3Dmol.js
export const PDB_IGNORELIST = ['5xzc'];

/**
 * Generates a pdb info summary for the given pdb header and the chain id.
 */
export function generatePdbInfoSummary(pdbHeader: PdbHeader, chainId: string) {
    const summary: {
        pdbInfo: string;
        moleculeInfo?: string;
    } = {
        pdbInfo: pdbHeader.title,
    };

    // get chain specific molecule info
    _.find(pdbHeader.compound, (mol: any) => {
        if (
            mol.molecule &&
            _.indexOf(mol.chain, chainId.toLowerCase()) !== -1
        ) {
            // chain is associated with this mol,
            // get the organism info from the source
            summary.moleculeInfo = mol.molecule;
            return mol;
        }
    });

    return summary;
}

export function indexPdbAlignments(alignments: Alignment[]): PdbAlignmentIndex {
    return groupAlignmentsByPdbIdAndChain(alignments);
}

export function mergeIndexedPdbAlignments(
    indexedPdbData: PdbAlignmentIndex
): IPdbChain[] {
    const chains: IPdbChain[] = [];

    // generate chains
    _.each(indexedPdbData, (map: { [chainId: string]: Alignment[] }) => {
        _.each(map, (chainAlignments: Alignment[]) => {
            const chain = mergeAlignments(chainAlignments);

            if (chain) {
                chains.push(chain);
            }
        });
    });

    return chains;
}

function groupAlignmentsByPdbIdAndChain(alignments: Alignment[]) {
    const groupedAlignments: PdbAlignmentIndex = {};

    alignments.forEach((alignment: Alignment) => {
        if (!groupedAlignments[alignment.pdbId]) {
            groupedAlignments[alignment.pdbId] = {};
        }

        if (!groupedAlignments[alignment.pdbId][alignment.chain]) {
            groupedAlignments[alignment.pdbId][alignment.chain] = [];
        }

        groupedAlignments[alignment.pdbId][alignment.chain].push(alignment);
    });

    return groupedAlignments;
}

/**
 * Assuming that all the provided alignments have the same pdb id and chain,
 * merges multiple alignments into one.
 */
export function mergeAlignments(
    alignments: Alignment[]
): IPdbChain | undefined {
    let mergedAlignment = '';
    let start: number;

    if (alignments.length > 0) {
        // start with the first alignment
        start = alignments[0].seqFrom;
    } else {
        return undefined;
    }

    alignments.forEach((alignment: Alignment) => {
        const alignmentStr = generateAlignmentString(alignment) || '';
        const diff = Math.abs(alignment.seqFrom - start);

        if (alignment.seqFrom < start) {
            const gapOrOverlap = Math.abs(alignmentStr.length - diff);

            // overlap: we need to append non-overlapping segment of mergedAlignment to the current alignment
            if (alignmentStr.length >= diff) {
                mergedAlignment =
                    alignmentStr + mergedAlignment.substr(gapOrOverlap);
            }
            // gap: we need to add some gap before appending mergedAlignment
            else {
                mergedAlignment =
                    alignmentStr + alignmentGap(gapOrOverlap) + mergedAlignment;
            }
        } else if (alignment.seqFrom >= start) {
            const gapOrOverlap = Math.abs(mergedAlignment.length - diff);

            // overlap: we need to "insert" current alignment into merged alignment
            if (mergedAlignment.length >= diff) {
                mergedAlignment =
                    mergedAlignment.substr(
                        0,
                        mergedAlignment.length - gapOrOverlap
                    ) +
                    alignmentStr +
                    mergedAlignment.substr(
                        mergedAlignment.length -
                            gapOrOverlap +
                            alignmentStr.length
                    );
            }
            // gap: we need to add some gap before appending current alignment
            else {
                mergedAlignment =
                    mergedAlignment + alignmentGap(gapOrOverlap) + alignmentStr;
            }
        }

        start = Math.min(start, alignment.seqFrom);
    });

    return {
        pdbId: alignments[0].pdbId,
        chain: alignments[0].chain,
        // to be consistent with the alignment API we would like uniprot position range to be inclusive
        uniprotStart: start,
        uniprotEnd: start + mergedAlignment.length - 1,
        alignment: mergedAlignment,
        identityPerc: calcIdentityPerc(mergedAlignment),
        identity: calcIdentity(mergedAlignment),
    };
}

function alignmentGap(length: number) {
    const gap: string[] = [];

    // add gap characters (character count = distance)
    for (let i = 0; i < length; i++) {
        gap.push(ALIGNMENT_GAP);
    }

    return gap.join('');
}

export function generateAlignmentString(
    alignment: Alignment
): string | undefined {
    let alignmentStr: string | undefined;

    // process 3 alignment strings and create a visualization string
    const midline = alignment.midlineAlign;
    const uniprot = alignment.seqAlign;
    const pdb = alignment.pdbAlign;

    if (midline.length === uniprot.length && midline.length === pdb.length) {
        const stringBuilder = [];

        for (let i = 0; i < midline.length; i++) {
            // do not append anything if there is a gap in uniprot alignment
            if (uniprot[i] !== '-') {
                if (pdb[i] === '-') {
                    stringBuilder.push('-');
                } else {
                    stringBuilder.push(midline[i]);
                }
            }
        }

        alignmentStr = stringBuilder.join('');
    }

    return alignmentStr;
}

/**
 * Calculates the identity percentage of the given alignment string
 * based on mismatch ratio.
 */
function calcIdentityPerc(alignment: string): number {
    let gap = 0;
    let mismatch = 0;

    for (let i = 0; i < alignment.length; i++) {
        const symbol = alignment[i];

        if (symbol === ALIGNMENT_GAP) {
            // increment gap count (gaps excluded from ratio calculation)
            gap++;
        } else if (
            symbol === ALIGNMENT_MINUS ||
            symbol === ALIGNMENT_PLUS ||
            symbol === ALIGNMENT_SPACE
        ) {
            // any special symbol other than a gap is considered as a mismatch
            // TODO is it better to assign a different weight for each symbol?
            mismatch++;
        }
    }

    return 1.0 - mismatch / (alignment.length - gap);
}

/**
 * Calculates the identity (number of matches) for
 * the given alignment string.
 *
 */
function calcIdentity(alignment: string) {
    alignment = alignment.toLowerCase();

    let match = 0;

    for (let i = 0; i < alignment.length; i++) {
        if (alignment[i].match(/[a-z]/)) {
            match++;
        }
    }

    return match;
}

/**
 * Assigns numerical value to the given pdb id.
 * This is for sorting purposes, and always returns an array of size 4.
 * If invert is true, then A will have a greater value than Z.
 */
export function calcPdbIdNumericalValue(
    pdbId: string,
    invert?: boolean
): number[] {
    const values = [0, 0, 0, 0];
    const coeff = invert ? -1 : 1;

    // assuming pdb id is no longer than 4 characters
    for (let i = 0; i < pdbId.length || i < 5; i++) {
        values.push(coeff * pdbId.charCodeAt(i));
    }

    return values;
}
