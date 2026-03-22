import { CBioPortalAPI } from 'cbioportal-ts-api-client';

const client = new CBioPortalAPI();

import { isClickhouseMode } from 'config/config';
import { proxyColumnStore } from 'shared/api/proxyColumnStore';
import { overrideApiRequestForColumnStore } from 'shared/api/overrideApiRequestForColumnStore';

const clientColumnStore = new CBioPortalAPI();

export function getClient() {
    return isClickhouseMode() ? clientColumnStore : client;
}

overrideApiRequestForColumnStore(clientColumnStore);

proxyColumnStore(clientColumnStore, 'fetchSamples');
proxyColumnStore(clientColumnStore, 'getSamplesByKeyword');
proxyColumnStore(clientColumnStore, 'getSampleInStudy');
proxyColumnStore(clientColumnStore, 'getAllSamplesInStudy');
proxyColumnStore(clientColumnStore, 'getAllSamplesOfPatientInStudy');
proxyColumnStore(clientColumnStore, 'getAllStudies');

export default client;
