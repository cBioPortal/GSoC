import { assert } from 'chai';
import {
    getTabId,
    getSubTabId,
    parseSamplesSpecifications,
    ResultsViewTab,
} from './ResultsViewPageHelpers';
import { SamplesSpecificationElement } from './ResultsViewPageStore';

describe('ResultsViewPageHelpers', () => {
    describe('getTabId', () => {
        it('gets the tab id correctly', () => {
            assert.equal(getTabId('results'), undefined);
            assert.equal(getTabId('results/'), undefined);
            assert.equal(getTabId('results/asdf'), 'asdf' as any);
            assert.equal(
                getTabId('results/oncoprint'),
                ResultsViewTab.ONCOPRINT
            );
            assert.equal(
                getTabId('results/oncoprint/'),
                ResultsViewTab.ONCOPRINT
            );
        });
    });

    describe('getSubTabId', () => {
        it('should return the correct subtab for comparison path', () => {
            assert.equal(getSubTabId('/results/comparison/overlap'), 'overlap');
            assert.equal(
                getSubTabId('/results/comparison/survival'),
                'survival'
            );
            assert.equal(
                getSubTabId('/results/comparison/dna_methylation'),
                'dna_methylation'
            );
        });

        it('should return the correct subtab for pathways path', () => {
            assert.equal(
                getSubTabId('/results/pathways/pathwaymapper'),
                'pathwaymapper'
            );
            assert.equal(
                getSubTabId('/results/pathways/ndex-cancer-pathways'),
                'ndex-cancer-pathways'
            );
        });

        it('should return undefined for invalid paths', () => {
            assert.equal(getSubTabId('/results/comparison/'), undefined);
            assert.equal(getSubTabId('/results/pathways/'), undefined);
        });
    });
    describe('parseSamplesSpecifications', () => {
        it('should parse session caseids with \\r/\\n delimter', () => {
            let query = {
                Action: 'Submit',
                case_ids:
                    'msk_impact_2017:P-0000036-T01-IM3\r\nmsk_impact_2017:P-0010863-T01-IM5',
                Z_SCORE_THRESHOLD: '2',
                tab_index: 'tab_visualize',
                data_priority: '0',
                case_set_id: '-1',
                gene_list:
                    'EGFR ERBB2 MET RET ROS1 ALK KRAS NRAS NF1 BRAF MAP2K1',
                RPPA_SCORE_THRESHOLD: '2',
                cancer_study_list:
                    'msk_impact_2017,luad_broad,luad_tcga_pub,lung_msk_2017,luad_mskcc_2015',
            };

            let cancerStudyIds = [
                'msk_impact_2017',
                'luad_broad',
                'luad_tcga_pub',
                'lung_msk_2017',
                'luad_mskcc_2015',
            ];

            const ret = parseSamplesSpecifications(
                query.case_ids,
                undefined,
                query.case_set_id,
                cancerStudyIds
            );

            // @ts-ignore
            const expectedResult = [
                {
                    studyId: 'msk_impact_2017',
                    sampleId: 'P-0000036-T01-IM3',
                } as SamplesSpecificationElement,
                { studyId: 'msk_impact_2017', sampleId: 'P-0010863-T01-IM5' },
            ];

            assert.deepEqual(ret, expectedResult);
        });

        it('should parse session caseids with + delimiter', () => {
            let query = {
                Action: 'Submit',
                case_ids:
                    'msk_impact_2017:P-0000036-T01-IM3+msk_impact_2017:P-0010863-T01-IM5',
                Z_SCORE_THRESHOLD: '2',
                tab_index: 'tab_visualize',
                data_priority: '0',
                case_set_id: '-1',
                gene_list:
                    'EGFR ERBB2 MET RET ROS1 ALK KRAS NRAS NF1 BRAF MAP2K1',
                RPPA_SCORE_THRESHOLD: '2',
                cancer_study_list:
                    'msk_impact_2017,luad_broad,luad_tcga_pub,lung_msk_2017,luad_mskcc_2015',
            };

            // @ts-ignore
            let cancerStudyIds = [
                'msk_impact_2017',
                'luad_broad',
                'luad_tcga_pub',
                'lung_msk_2017',
                'luad_mskcc_2015',
            ];

            const ret = parseSamplesSpecifications(
                query.case_ids,
                undefined,
                query.case_set_id,
                cancerStudyIds
            );

            // @ts-ignore
            const expectedResult = [
                { studyId: 'msk_impact_2017', sampleId: 'P-0000036-T01-IM3' },
                { studyId: 'msk_impact_2017', sampleId: 'P-0010863-T01-IM5' },
            ];

            // @ts-ignore
            assert.deepEqual(ret, expectedResult);
        });
    });
});
