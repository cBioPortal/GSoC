import { CancerStudy } from 'cbioportal-ts-api-client';

export function generateDownloadFilenamePrefixByStudies(
    studies?: CancerStudy[]
) {
    return generateDownloadFilenamePrefixByStudyIds(
        studies ? studies.map(s => s.studyId) : undefined
    );
}

export function generateDownloadFilenamePrefixByStudyIds(studyIds?: string[]) {
    let prefix = '';

    if (studyIds) {
        if (studyIds.length > 1) {
            prefix = 'combined_study_';
        } else if (studyIds.length === 1) {
            prefix = `${studyIds[0]}_`;
        }
    }

    return prefix;
}
