import { assert } from 'chai';
import { MolecularProfile } from 'cbioportal-ts-api-client';
import { getSuffixOfMolecularProfile } from './molecularProfileUtils';

describe('MolecularProfileUtils', () => {
    describe('getSuffixOfMolecularProfile', () => {
        it('get suffix correctly from molecular profile', () => {
            const profile = {
                molecularProfileId: 'ccle_broad_2019_CCLE_drug_treatment_IC50',
                studyId: 'ccle_broad_2019',
            } as MolecularProfile;
            const suffix = 'CCLE_drug_treatment_IC50';
            const result = getSuffixOfMolecularProfile(profile);
            assert.equal(result, suffix);
        });
    });
});
