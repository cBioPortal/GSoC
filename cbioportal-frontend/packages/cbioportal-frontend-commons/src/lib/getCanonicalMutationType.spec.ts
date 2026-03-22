import {
    CanonicalMutationType,
    default as getCanonicalMutationType,
    getProteinImpactType,
    ProteinImpactType,
} from './getCanonicalMutationType';
import { assert } from 'chai';

describe('getProteinImpactType', () => {
    it('maps mutation types to appropriate buckets', () => {
        assert.equal(getProteinImpactType("5'Flank"), ProteinImpactType.OTHER);
        assert.equal(
            getProteinImpactType('Missense_Mutation'),
            ProteinImpactType.MISSENSE
        );
        assert.equal(
            getProteinImpactType('Nonsense_Mutation'),
            ProteinImpactType.TRUNCATING
        );
        assert.equal(
            getProteinImpactType('Frame_Shift_Del'),
            ProteinImpactType.TRUNCATING
        );
        assert.equal(
            getProteinImpactType('In_Frame_Deletion'),
            ProteinImpactType.INFRAME
        );
    });
});

describe('getCanonicalMutationType', () => {
    it("maps unknown mutation types to 'other'", () => {
        assert.equal(
            getCanonicalMutationType('iasjdpfoai'),
            CanonicalMutationType.OTHER
        );
    });
});
