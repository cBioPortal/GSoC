import { IServerConfig } from 'config/IAppConfig';
import { GeneFilterOption } from '../mutation/GeneFilterMenu';

export function getGeneFilterDefault(frontendConfig: any): GeneFilterOption {
    if (frontendConfig && 'serverConfig' in frontendConfig) {
        const serverConfig: IServerConfig = frontendConfig.serverConfig;
        const propName = 'skin_patientview_filter_genes_profiled_all_samples';
        if (
            serverConfig &&
            propName in serverConfig &&
            serverConfig[propName]
        ) {
            return GeneFilterOption.ALL_SAMPLES;
        }
    }
    return GeneFilterOption.ANY_SAMPLE;
}
