import { EnrichmentEventType } from 'shared/lib/comparison/ComparisonStoreUtils';

export default interface IComparisonURLWrapper {
    selectedEnrichmentEventTypes: EnrichmentEventType[] | undefined;
    updateSelectedEnrichmentEventTypes: (t: EnrichmentEventType[]) => void;
}
