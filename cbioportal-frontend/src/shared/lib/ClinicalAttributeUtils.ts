import { ClinicalAttribute } from 'cbioportal-ts-api-client';
import { SpecialAttribute } from 'shared/cache/ClinicalDataCache';

/**
 * Singleton Cancer Study clinical attribute for use in coloring dropdowns.
 * This special attribute allows coloring samples by their study of origin.
 * Using a constant avoids creating new objects on every access.
 */
const CANCER_STUDY_ATTRIBUTE: ClinicalAttribute = {
    clinicalAttributeId: SpecialAttribute.StudyOfOrigin,
    displayName: 'Cancer Study',
    description: 'The cancer study for each sample',
    datatype: 'STRING',
    patientAttribute: false,
    priority: '1',
    studyId: '',
};

/**
 * Returns the Cancer Study clinical attribute for use in coloring dropdowns.
 */
export function createCancerStudyAttribute(): ClinicalAttribute {
    return CANCER_STUDY_ATTRIBUTE;
}

/**
 * Adds Cancer Study as a special attribute to the beginning of a clinical attributes list.
 */
export function addCancerStudyAttribute(
    baseAttributes: ClinicalAttribute[]
): ClinicalAttribute[] {
    return [createCancerStudyAttribute(), ...baseAttributes];
}
