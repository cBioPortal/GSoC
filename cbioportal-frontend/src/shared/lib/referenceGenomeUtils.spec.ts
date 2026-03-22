import { assert } from 'chai';
import { CancerStudy } from 'cbioportal-ts-api-client';
import {
    REFERENCE_GENOME,
    isMixedReferenceGenome,
} from './referenceGenomeUtils';

describe('referenceGenomeUtils functions', () => {
    it('isMixedReferenceGenome', () => {
        const cancerStudy1 = {
            studyId: 'test_study_1',
            referenceGenome: REFERENCE_GENOME.grch37.NCBI,
        } as CancerStudy;
        const cancerStudy2 = {
            studyId: 'test_study_2',
            referenceGenome: REFERENCE_GENOME.grch37.UCSC,
        } as CancerStudy;
        const cancerStudy3 = {
            studyId: 'test_study_3',
            referenceGenome: REFERENCE_GENOME.grch38.NCBI,
        } as CancerStudy;
        const cancerStudy4 = {
            studyId: 'test_study_4',
            referenceGenome: REFERENCE_GENOME.grch38.UCSC,
        } as CancerStudy;

        const mixedStudies1 = [cancerStudy1, cancerStudy3];
        const mixedStudies2 = [cancerStudy2, cancerStudy4];
        const mixedStudies3 = [cancerStudy1, cancerStudy4];
        const mixedStudies4 = [cancerStudy2, cancerStudy3];

        const notMixedStudies1 = [cancerStudy1, cancerStudy2];
        const notMixedStudies2 = [cancerStudy3, cancerStudy4];

        assert.isTrue(isMixedReferenceGenome(mixedStudies1));
        assert.isTrue(isMixedReferenceGenome(mixedStudies2));
        assert.isTrue(isMixedReferenceGenome(mixedStudies3));
        assert.isTrue(isMixedReferenceGenome(mixedStudies4));

        assert.isFalse(isMixedReferenceGenome(notMixedStudies1));
        assert.isFalse(isMixedReferenceGenome(notMixedStudies2));
    });
});
