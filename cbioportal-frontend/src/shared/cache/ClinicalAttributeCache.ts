import client from '../api/cbioportalClientInstance';
import LazyMobXCache from '../lib/LazyMobXCache';
import {
    ClinicalData,
    ClinicalAttribute,
    ClinicalDataMultiStudyFilter,
} from 'cbioportal-ts-api-client';
import _ from 'lodash';

type Query = {
    clinicalAttribute: ClinicalAttribute;
    entityId: string;
    studyId: string;
};

function queryToKey(q: Query) {
    return `${q.clinicalAttribute.clinicalAttributeId}~${q.entityId}~${q.studyId}`;
}
function dataToKey(d: ClinicalData) {
    const entityId = d.hasOwnProperty('sampleId') ? d.sampleId : d.patientId;
    return `${d.clinicalAttributeId}~${entityId}~${d.studyId}`;
}

export async function fetch(queries: Query[]): Promise<ClinicalData[]> {
    if (queries.length > 0) {
        const patientQueries = queries.filter(
            q => q.clinicalAttribute.patientAttribute
        );
        const sampleQueries = queries.filter(
            q => !q.clinicalAttribute.patientAttribute
        );

        const patientFilter: ClinicalDataMultiStudyFilter = {
            attributeIds: patientQueries.map(
                q => q.clinicalAttribute.clinicalAttributeId
            ),
            identifiers: patientQueries.map(q => ({
                entityId: q.entityId,
                studyId: q.studyId,
            })),
        };
        const sampleFilter: ClinicalDataMultiStudyFilter = {
            attributeIds: sampleQueries.map(
                q => q.clinicalAttribute.clinicalAttributeId
            ),
            identifiers: sampleQueries.map(q => ({
                entityId: q.entityId,
                studyId: q.studyId,
            })),
        };

        const clinicalData = [];
        if (patientQueries.length > 0) {
            clinicalData.push(
                await client.fetchClinicalDataUsingPOST({
                    clinicalDataType: 'PATIENT',
                    clinicalDataMultiStudyFilter: patientFilter,
                })
            );
        }
        if (sampleQueries.length > 0) {
            clinicalData.push(
                await client.fetchClinicalDataUsingPOST({
                    clinicalDataType: 'SAMPLE',
                    clinicalDataMultiStudyFilter: sampleFilter,
                })
            );
        }

        return Promise.all(clinicalData).then(d => _.flatten(d));
    } else {
        return [];
    }
}

export default class ClinicalAttributeCache extends LazyMobXCache<
    ClinicalData,
    Query,
    string
> {
    constructor() {
        super(queryToKey, dataToKey, fetch);
    }
}
