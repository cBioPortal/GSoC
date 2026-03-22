import { assert } from 'chai';

import {
    generateDownloadFilenamePrefixByStudies,
    generateDownloadFilenamePrefixByStudyIds,
} from './FilenameUtils';
import { CancerStudy } from 'cbioportal-ts-api-client';

describe('FilenameUtils', () => {
    describe('generateDownloadFilenamePrefixByStudyIds', () => {
        it('Generates empty string for undefined or empty input', () => {
            assert.equal(generateDownloadFilenamePrefixByStudyIds(), '');
            assert.equal(generateDownloadFilenamePrefixByStudyIds([]), '');
        });

        it('Generates a prefix with actual study name for a single study input', () => {
            assert.equal(
                generateDownloadFilenamePrefixByStudyIds(['singleStudy']),
                'singleStudy_'
            );
        });

        it('Generates a fixed prefix for with actual study name for multiple studies input', () => {
            assert.equal(
                generateDownloadFilenamePrefixByStudyIds(['study1', 'study2']),
                'combined_study_'
            );
        });
    });

    describe('generateDownloadFilenamePrefixByStudies', () => {
        it('Generates empty string for undefined or empty input', () => {
            assert.equal(generateDownloadFilenamePrefixByStudies(), '');
            assert.equal(generateDownloadFilenamePrefixByStudies([]), '');
        });

        it('Generates a prefix with actual study name for a single study input', () => {
            const singleStudy: CancerStudy[] = [
                {
                    studyId: 'singleStudy',
                },
            ] as CancerStudy[];

            assert.equal(
                generateDownloadFilenamePrefixByStudies(singleStudy),
                'singleStudy_'
            );
        });

        it('Generates a fixed prefix for with actual study name for multiple studies input', () => {
            const multipleStudies: CancerStudy[] = [
                {
                    studyId: 'study1',
                },
                {
                    studyId: 'study2',
                },
            ] as CancerStudy[];

            assert.equal(
                generateDownloadFilenamePrefixByStudies(multipleStudies),
                'combined_study_'
            );
        });
    });
});
