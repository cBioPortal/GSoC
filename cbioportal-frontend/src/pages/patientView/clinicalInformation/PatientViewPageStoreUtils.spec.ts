import {
    handlePathologyReportCheckResponse,
    PatientViewPageStore,
} from './PatientViewPageStore';
import { assert } from 'chai';
import { GeneFilterOption } from '../mutation/GeneFilterMenu';
import { IServerConfig } from 'config/IAppConfig';
import { getGeneFilterDefault } from './PatientViewPageStoreUtil';

describe('PatientViewPageStoreUtils', () => {
    describe('getGeneFilterDefault()', () => {
        it('sets filter to `all samples`', () => {
            const frontendConfig = {
                serverConfig: {
                    skin_patientview_filter_genes_profiled_all_samples: true,
                } as IServerConfig,
            };
            assert.equal(
                getGeneFilterDefault(frontendConfig),
                GeneFilterOption.ALL_SAMPLES
            );
        });

        it('sets filter to `any sample`', () => {
            const frontendConfig = {
                serverConfig: {
                    skin_patientview_filter_genes_profiled_all_samples: false,
                } as IServerConfig,
            };
            assert.equal(
                getGeneFilterDefault(frontendConfig),
                GeneFilterOption.ANY_SAMPLE
            );
        });

        it('when missing defaults to `any sample`', () => {
            const frontendConfig = { serverConfig: {} as IServerConfig };
            assert.equal(
                getGeneFilterDefault(frontendConfig),
                GeneFilterOption.ANY_SAMPLE
            );
        });
    });
});
