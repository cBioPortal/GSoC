import { assert } from 'chai';
import { IPdbPositionRange } from 'shared/model/Pdb';
import {
    convertPdbPosToResCode,
    convertPdbPosToResAndInsCode,
    generateResiduePosToSelectorMap,
    findUpdatedResidues,
    IResidueHelper,
} from './PdbResidueUtils';
import { IResidueSpec } from './StructureVisualizer';

function initMockMap(): { [residue: number]: IResidueHelper[] } {
    return {
        666: [
            {
                selector: {
                    resi: 666,
                },
                residue: residueSpec(666, '#8B4513'),
            },
        ],
        1961: [
            {
                selector: {
                    resi: 1961,
                },
                residue: residueSpec(1961, '#ACDC99'),
            },
        ],
        765: [
            {
                selector: {
                    resi: 765,
                },
                residue: residueSpec(765, '#244281'),
            },
        ],
    };
}

function residueSpec(resi: number, color: string) {
    return {
        positionRange: {
            start: {
                position: resi,
            },
            end: {
                position: resi,
            },
        },
        color,
        highlighted: false,
    };
}

describe('PdbResidueUtils', () => {
    let pointPositionRange: IPdbPositionRange;
    let pointPositionRangeWithInsertion: IPdbPositionRange;
    let multiPositionRange: IPdbPositionRange;
    let multiPositionRangeWithInsertion: IPdbPositionRange;

    const residueSpec666: IResidueSpec = residueSpec(666, '#8B4513');
    const residueSpec1961: IResidueSpec = residueSpec(1961, '#ACDC99');
    const residueSpec765: IResidueSpec = residueSpec(765, '#244281');

    beforeAll(() => {
        pointPositionRange = {
            start: {
                position: 666,
            },
            end: {
                position: 666,
            },
        };

        multiPositionRange = {
            start: {
                position: 666,
            },
            end: {
                position: 668,
            },
        };

        pointPositionRangeWithInsertion = {
            start: {
                position: 666,
                insertionCode: 'D',
            },
            end: {
                position: 666,
            },
        };

        multiPositionRangeWithInsertion = {
            start: {
                position: 666,
                insertionCode: 'D',
            },
            end: {
                position: 668,
                insertionCode: 'D',
            },
        };
    });

    it('converts pdb positions to residue codes', () => {
        assert.deepEqual(convertPdbPosToResCode(pointPositionRange), ['666']);
        assert.deepEqual(convertPdbPosToResCode(multiPositionRange), [
            '666',
            '667',
            '668',
        ]);
        assert.deepEqual(
            convertPdbPosToResCode(pointPositionRangeWithInsertion),
            ['666^D']
        );
        assert.deepEqual(
            convertPdbPosToResCode(multiPositionRangeWithInsertion),
            ['666^D', '667', '668^D']
        );
    });

    it('converts pdb positions to residue and insertion code pairs', () => {
        assert.deepEqual(convertPdbPosToResAndInsCode(pointPositionRange), [
            { resi: 666 },
        ]);
        assert.deepEqual(convertPdbPosToResAndInsCode(multiPositionRange), [
            { resi: 666 },
            { resi: 667 },
            { resi: 668 },
        ]);
        assert.deepEqual(
            convertPdbPosToResAndInsCode(pointPositionRangeWithInsertion),
            [{ resi: 666, icode: 'D' }]
        );
        assert.deepEqual(
            convertPdbPosToResAndInsCode(multiPositionRangeWithInsertion),
            [
                { resi: 666, icode: 'D' },
                { resi: 667 },
                { resi: 668, icode: 'D' },
            ]
        );
    });

    it('converts pdb residue specs to residue helper map', () => {
        assert.deepEqual(
            generateResiduePosToSelectorMap([
                residueSpec666,
                residueSpec765,
                residueSpec1961,
            ]),
            initMockMap()
        );
    });

    it('finds the updated residues', () => {
        let originalMap = initMockMap();
        let modifiedMap = initMockMap();

        modifiedMap[666][0].residue.highlighted = true;

        assert.deepEqual(
            findUpdatedResidues(modifiedMap, originalMap),
            modifiedMap[666],
            'Only residue 666 should be classified as updated'
        );

        originalMap = initMockMap();
        modifiedMap = initMockMap();

        modifiedMap[765][0].residue.color = '#453412';
        modifiedMap[666][0].residue.highlighted = true;

        assert.deepEqual(
            findUpdatedResidues(modifiedMap, originalMap),
            [modifiedMap[666][0], modifiedMap[765][0]],
            'Residues 666 and 765 should be classified as updated'
        );

        originalMap = initMockMap();
        modifiedMap = initMockMap();

        modifiedMap[666][0].residue = residueSpec(666, '#8B4513'); // same specs as before
        modifiedMap[1961][0].selector = { resi: 1961 }; // same as before

        assert.equal(
            findUpdatedResidues(modifiedMap, originalMap).length,
            0,
            'None of the residues should be classified as updated'
        );
    });
});
