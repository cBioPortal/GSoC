import { MolecularProfile } from 'cbioportal-ts-api-client';

export function getSuffixOfMolecularProfile(profile: MolecularProfile) {
    return profile.molecularProfileId.replace(profile.studyId + '_', '');
}
