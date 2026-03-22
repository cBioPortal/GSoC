import _ from 'lodash';
import { IPdbPositionRange } from 'shared/model/Pdb';
import { IResidueSpec } from './StructureVisualizer';

export interface IResidueSelector {
    resi: number;
    icode?: string;
}

export interface IResidueHelper {
    selector: IResidueSelector;
    residue: IResidueSpec;
}

/**
 * Converts the given PDB position to residue code(s)
 */
export function convertPdbPosToResCode(position: IPdbPositionRange): string[] {
    const residues: string[] = [];
    const start = position.start.position;
    const end = position.end.position;

    for (let i = start; i <= end; i++) {
        residues.push(`${i}`);
    }

    // TODO insertion code may not be accurate if residues.length > 2

    if (position.start.insertionCode) {
        residues[0] += '^' + position.start.insertionCode;
    }

    if (residues.length > 1 && position.end.insertionCode) {
        residues[residues.length - 1] += '^' + position.end.insertionCode;
    }

    return residues;
}

/**
 * Converts the given PDB position to residue and icode pairs
 */
export function convertPdbPosToResAndInsCode(
    position: IPdbPositionRange
): IResidueSelector[] {
    const residues: IResidueSelector[] = [];
    const start = position.start.position;
    const end = position.end.position;

    for (let i = start; i <= end; i++) {
        residues.push({
            resi: i,
        });
    }

    // TODO insertion code may not be accurate if residues.length > 2

    if (position.start.insertionCode) {
        residues[0].icode = position.start.insertionCode;
    }

    if (residues.length > 1 && position.end.insertionCode) {
        residues[residues.length - 1].icode = position.end.insertionCode;
    }

    return residues;
}

export function generateResiduePosToSelectorMap(
    residues: IResidueSpec[]
): { [residue: number]: IResidueHelper[] } {
    const map: { [residue: number]: IResidueHelper[] } = {};

    residues.forEach((residue: IResidueSpec) => {
        // TODO "rescode" selector does not work anymore for some reason (3Dmol.js bug?)
        //const resCodes = convertPositionsToResCode([residue.positionRange]);

        const residueSelectors = convertPdbPosToResAndInsCode(
            residue.positionRange
        );
        const grouped = _.groupBy(residueSelectors, 'resi');

        _.each(_.keys(grouped), (resi: number) => {
            if (!map[resi]) {
                map[resi] = [];
            }

            _.each(grouped[resi], (selector: IResidueSelector) => {
                map[resi].push({ selector, residue });
            });
        });
    });

    return map;
}

export function findUpdatedResidues(
    currentResidueToPositionMap: { [residue: number]: IResidueHelper[] },
    prevResidueToPositionMap: { [residue: number]: IResidueHelper[] }
): IResidueHelper[] {
    let residues: IResidueHelper[] = [];

    // compare current to prev and find the updated residues
    _.each(_.keys(currentResidueToPositionMap), (resi: number) => {
        if (
            !_.isEqual(
                currentResidueToPositionMap[resi],
                prevResidueToPositionMap[resi]
            )
        ) {
            residues = residues.concat(currentResidueToPositionMap[resi]);
        }
    });

    return residues;
}
