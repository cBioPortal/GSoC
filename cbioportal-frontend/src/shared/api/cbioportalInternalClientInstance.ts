import { CBioPortalAPIInternal } from 'cbioportal-ts-api-client';
import { isClickhouseMode } from 'config/config';
import { proxyColumnStore } from 'shared/api/proxyColumnStore';
import { overrideApiRequestForColumnStore } from 'shared/api/overrideApiRequestForColumnStore';

const internalClient = new CBioPortalAPIInternal();

const internalClientColumnStore = new CBioPortalAPIInternal();

overrideApiRequestForColumnStore(internalClientColumnStore);

proxyColumnStore(internalClientColumnStore, 'fetchCNAGenes');
proxyColumnStore(internalClientColumnStore, 'fetchStructuralVariantGenes');
proxyColumnStore(internalClientColumnStore, 'fetchCaseListCounts');
proxyColumnStore(
    internalClientColumnStore,
    'fetchMolecularProfileSampleCounts'
);
proxyColumnStore(internalClientColumnStore, 'fetchMutatedGenes');
proxyColumnStore(internalClientColumnStore, 'fetchFilteredSamples');
proxyColumnStore(internalClientColumnStore, 'fetchClinicalDataCounts');
proxyColumnStore(internalClientColumnStore, 'fetchClinicalDataBinCounts');
proxyColumnStore(internalClientColumnStore, 'fetchClinicalDataDensityPlot');
proxyColumnStore(internalClientColumnStore, 'fetchMutationDataCounts');
proxyColumnStore(internalClientColumnStore, 'fetchPatientTreatmentCounts');
proxyColumnStore(internalClientColumnStore, 'fetchSampleTreatmentCounts');
proxyColumnStore(internalClientColumnStore, 'fetchClinicalDataDensityPlot');
proxyColumnStore(internalClientColumnStore, 'getClinicalEventTypeCounts');
proxyColumnStore(internalClientColumnStore, 'fetchMutationDataCounts');
proxyColumnStore(internalClientColumnStore, 'fetchGenomicDataCounts');
proxyColumnStore(internalClientColumnStore, 'fetchGenomicDataBinCounts');
proxyColumnStore(internalClientColumnStore, 'fetchGenericAssayDataBinCounts');
proxyColumnStore(internalClientColumnStore, 'fetchGenericAssayDataCounts');
proxyColumnStore(internalClientColumnStore, 'fetchClinicalDataViolinPlots');
proxyColumnStore(internalClientColumnStore, 'fetchAlterationEnrichments');
proxyColumnStore(internalClientColumnStore, 'fetchCoExpressions');

export default internalClient;

export function getInternalClient() {
    return isClickhouseMode() ? internalClientColumnStore : internalClient;
}
