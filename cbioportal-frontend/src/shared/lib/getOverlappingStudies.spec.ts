import { assert } from 'chai';
import getOverlappingStudies from './getOverlappingStudies';
import { CancerStudy } from 'cbioportal-ts-api-client';

describe('getOverlappingStudies', () => {
    it('finds overlapping studies based on pub/nonpub signature in studyId', () => {
        let studies = [{ studyId: 'moo_tcga' }, { studyId: 'moo1_tcga_pub' }];

        let ret = getOverlappingStudies(studies as CancerStudy[]);

        assert.equal(ret.length, 0, "shouldn't find anything");

        // now adjust
        studies = [{ studyId: 'moo_tcga' }, { studyId: 'moo_tcga_pub' }];

        ret = getOverlappingStudies(studies as CancerStudy[]);

        assert.equal(ret[0][0].studyId, 'moo_tcga');
        assert.equal(ret[0][1].studyId, 'moo_tcga_pub');
    });

    it('finds overlapping studies based on year suffix', () => {
        let studies = [
            { studyId: 'moo_tcga_2016' },
            { studyId: 'moo_tcga_2015' },
            { studyId: 'doo_tcga_2011' },
            { studyId: 'doo_tcga_2012' },
            { studyId: 'scoo_tcga_2011' },
            { studyId: 'floo_tcga_2012' },
        ];

        let ret = getOverlappingStudies(studies as CancerStudy[]);

        assert.equal(ret.length, 2);
    });

    it("doesn'nt detect non TCGA stuides", () => {
        let studies = [
            { studyId: 'blca_mskcc_solit_2014' },
            { studyId: 'blca_mskcc_solit_2012' },
        ];

        let ret = getOverlappingStudies(studies as CancerStudy[]);

        assert.equal(ret.length, 0);
    });

    it('finds them when year and pub are suffixes', () => {
        let studies = [
            { studyId: 'brca_tcga_pub2015' },
            { studyId: 'brca_tcga_pub' },
        ];

        let ret = getOverlappingStudies(studies as CancerStudy[]);

        assert.equal(ret.length, 1);
    });

    it('finds pan can, pub and provisional', () => {
        let studies = [
            { studyId: 'blca_tcga_pub' },
            { studyId: 'blca_tcga_pan_can_atlas_2018' },
            { studyId: 'blca_tcga' },
        ];

        let ret = getOverlappingStudies(studies as CancerStudy[]);

        assert.equal(ret[0].length, 3);
    });

    it('finds pan can and pub', () => {
        let studies = [
            { studyId: 'blca_tcga_pub' },
            { studyId: 'blca_tcga_pan_can_atlas_2018' },
        ];

        let ret = getOverlappingStudies(studies as CancerStudy[]);

        assert.equal(ret[0].length, 2);
    });
});
