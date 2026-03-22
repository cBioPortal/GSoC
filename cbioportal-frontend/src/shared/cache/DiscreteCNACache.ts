import _ from 'lodash';
import {
    AugmentedData,
    CacheData,
    default as LazyMobXCache,
} from 'shared/lib/LazyMobXCache';
import client from 'shared/api/cbioportalClientInstance';
import {
    DiscreteCopyNumberData,
    DiscreteCopyNumberFilter,
    MolecularProfile,
} from 'cbioportal-ts-api-client';

export type DiscreteCNACacheDataType = CacheData<DiscreteCopyNumberData>;
type Query = { studyId: string; sampleId: string; entrezGeneId: number };

async function fetchForStudy(
    queries: Query[],
    studyId: string,
    molecularProfileIdDiscrete: string | undefined
): Promise<AugmentedData<DiscreteCopyNumberData, string>> {
    try {
        const uniqueSamples = _.uniq(queries.map(q => q.sampleId));
        const uniqueGenes = _.uniq(queries.map(q => q.entrezGeneId));
        let filters: DiscreteCopyNumberFilter[];
        if (uniqueSamples.length < uniqueGenes.length) {
            // Make one query per sample, since there are fewer samples than genes
            const sampleToEntrezList: { [sampleId: string]: number[] } = {};
            for (const query of queries) {
                sampleToEntrezList[query.sampleId] =
                    sampleToEntrezList[query.sampleId] || [];
                sampleToEntrezList[query.sampleId].push(query.entrezGeneId);
            }
            filters = Object.keys(sampleToEntrezList).map(sample => {
                return {
                    sampleIds: [sample],
                    entrezGeneIds: sampleToEntrezList[sample],
                } as DiscreteCopyNumberFilter;
            });
        } else {
            // Make one query per gene
            const entrezToSampleList: { [entrez: string]: string[] } = {};
            for (const query of queries) {
                entrezToSampleList[query.entrezGeneId] =
                    entrezToSampleList[query.entrezGeneId] || [];
                entrezToSampleList[query.entrezGeneId].push(query.sampleId);
            }
            filters = Object.keys(entrezToSampleList).map(entrez => {
                return {
                    sampleIds: entrezToSampleList[entrez],
                    entrezGeneIds: [parseInt(entrez, 10)],
                } as DiscreteCopyNumberFilter;
            });
        }
        const allData: DiscreteCopyNumberData[][] = await Promise.all(
            filters.map(filter => {
                if (typeof molecularProfileIdDiscrete === 'undefined') {
                    return Promise.reject('No molecular profile id given.');
                } else {
                    return client.fetchDiscreteCopyNumbersInMolecularProfileUsingPOST(
                        {
                            projection: 'DETAILED',
                            molecularProfileId: molecularProfileIdDiscrete,
                            discreteCopyNumberFilter: filter,
                            discreteCopyNumberEventType: 'ALL',
                        }
                    );
                }
            })
        );
        return { data: _.flatten(allData), meta: studyId };
    } catch (err) {
        throw err;
    }
}
export function fetch(
    queries: Query[],
    studyToMolecularProfileDiscrete: { [studyId: string]: MolecularProfile }
): Promise<AugmentedData<DiscreteCopyNumberData, string>[]> {
    if (!studyToMolecularProfileDiscrete) {
        throw 'No study to molecular profile id map given';
    } else {
        const studyToQueries = _.groupBy(queries, 'studyId');
        return Promise.all(
            Object.keys(studyToQueries).map(studyId => {
                const profile = studyToMolecularProfileDiscrete[studyId];
                if (profile) {
                    return fetchForStudy(
                        studyToQueries[studyId],
                        studyId,
                        profile.molecularProfileId
                    );
                } else {
                    return Promise.resolve({ data: [], meta: studyId });
                }
            })
        );
    }
}
function key(
    d: { studyId?: string; sampleId: string; entrezGeneId: number },
    m?: string
) {
    const studyId = d.studyId ? d.studyId : m;
    return `${studyId}~${d.sampleId}~${d.entrezGeneId}`;
}
export default class DiscreteCNACache extends LazyMobXCache<
    DiscreteCopyNumberData,
    Query,
    string
> {
    constructor(
        private studyToMolecularProfileDiscrete?: {
            [studyId: string]: MolecularProfile;
        }
    ) {
        super(key, key, fetch, studyToMolecularProfileDiscrete);
    }
    public get isActive(): boolean {
        return !!(
            this.studyToMolecularProfileDiscrete &&
            Object.keys(this.studyToMolecularProfileDiscrete).length > 0
        );
    }
}
