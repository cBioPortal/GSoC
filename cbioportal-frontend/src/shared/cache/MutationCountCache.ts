import client from '../api/cbioportalClientInstance';
import LazyMobXCache from '../lib/LazyMobXCache';
import {
    ClinicalData,
    ClinicalDataMultiStudyFilter,
} from 'cbioportal-ts-api-client';
import _ from 'lodash';

type Query = {
    sampleId: string;
    studyId: string;
};

function key(d: { studyId: string; sampleId: string }) {
    return `${d.studyId}~${d.sampleId}`;
}
export async function fetch(queries: Query[]): Promise<ClinicalData[]> {
    if (queries.length > 0) {
        const filter: ClinicalDataMultiStudyFilter = {
            attributeIds: ['MUTATION_COUNT'],
            identifiers: queries.map((s: any) => ({
                entityId: s.sampleId,
                studyId: s.studyId,
            })),
        };
        return client.fetchClinicalDataUsingPOST({
            clinicalDataType: 'SAMPLE',
            clinicalDataMultiStudyFilter: filter,
        });
    } else {
        return Promise.resolve([]);
    }
}
export default class MutationCountCache extends LazyMobXCache<
    ClinicalData,
    Query,
    string
> {
    constructor() {
        super(key, key, fetch);
    }
}
