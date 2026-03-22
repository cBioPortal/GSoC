import { ServerConfigHelpers, UrlParamPair, pairMatchesPath } from './config';
import { assert } from 'chai';

describe('ServerConfigHelpers', () => {
    describe('parses config data format', () => {
        it('parses two entrees and arrays from comma delimitted list', () => {
            const testString =
                'TCGA PanCancer Atlas Studies#*pan_can_atlas*;Curated set of non-redundant studies#acbc_mskcc_2015,acc_tcga_pan_can_atlas_2018';
            const output = ServerConfigHelpers.parseConfigFormat(testString);
            assert.deepEqual(output, {
                'TCGA PanCancer Atlas Studies': ['*pan_can_atlas*'],
                'Curated set of non-redundant studies': [
                    'acbc_mskcc_2015',
                    'acc_tcga_pan_can_atlas_2018',
                ],
            });
        });

        it('handles trailing semicolon', () => {
            const testString =
                'TCGA PanCancer Atlas Studies#*pan_can_atlas*;Curated set of non-redundant studies#acbc_mskcc_2015,acc_tcga_pan_can_atlas_2018;';
            const output = ServerConfigHelpers.parseConfigFormat(testString);
            assert.deepEqual(output, {
                'TCGA PanCancer Atlas Studies': ['*pan_can_atlas*'],
                'Curated set of non-redundant studies': [
                    'acbc_mskcc_2015',
                    'acc_tcga_pan_can_atlas_2018',
                ],
            });
        });
    });
});
