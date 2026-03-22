import { assert } from 'chai';
import { mergeAlignments } from './PdbUtils';
import { initPdbAlignment } from 'test/PdbMockUtils';
import { IPdbChain } from 'shared/model/Pdb';
import { Alignment } from 'genome-nexus-ts-api-client';

describe('PdbUtils', () => {
    it('merges alignments properly', () => {
        let alignments: Alignment[];
        let chain: IPdbChain | undefined;

        // overlapping, ordered
        alignments = [
            initPdbAlignment('ABCDEFG', 6),
            initPdbAlignment('EFGXYZ', 10),
        ];

        chain = mergeAlignments(alignments);
        assert.equal(chain && chain.alignment, 'ABCDEFGXYZ');
        assert.equal(chain && chain.uniprotStart, 6);
        assert.equal(chain && chain.uniprotEnd, 15);

        // overlapping, reverse ordered
        alignments = [
            initPdbAlignment('EFGXYZ', 10),
            initPdbAlignment('ABCDEFG', 6),
        ];

        chain = mergeAlignments(alignments);
        assert.equal(chain && chain.alignment, 'ABCDEFGXYZ');
        assert.equal(chain && chain.uniprotStart, 6);
        assert.equal(chain && chain.uniprotEnd, 15);

        // gap, ordered
        alignments = [
            initPdbAlignment('Portal', 2),
            initPdbAlignment('Rocks', 11),
        ];

        chain = mergeAlignments(alignments);
        assert.equal(chain && chain.alignment, 'Portal***Rocks');
        assert.equal(chain && chain.uniprotStart, 2);
        assert.equal(chain && chain.uniprotEnd, 15);

        // gap, reverse ordered
        alignments = [
            initPdbAlignment('Rocks', 11),
            initPdbAlignment('Portal', 2),
        ];

        chain = mergeAlignments(alignments);
        assert.equal(chain && chain.alignment, 'Portal***Rocks');
        assert.equal(chain && chain.uniprotStart, 2);
        assert.equal(chain && chain.uniprotEnd, 15);

        // gap, reverse ordered
        alignments = [
            initPdbAlignment('ThisIsTheEnd', 33),
            initPdbAlignment('Random', 2),
            initPdbAlignment('StarryNight', 22),
            initPdbAlignment('RockStar', 18),
            initPdbAlignment('WhatTheRock', 11),
        ];

        chain = mergeAlignments(alignments);
        assert.equal(
            chain && chain.alignment,
            'Random***WhatTheRockStarryNightThisIsTheEnd'
        );
        assert.equal(chain && chain.uniprotStart, 2);
        assert.equal(chain && chain.uniprotEnd, 44);
    });
});
