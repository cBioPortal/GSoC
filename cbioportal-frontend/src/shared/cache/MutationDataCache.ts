import client from '../api/cbioportalClientInstance';
import LazyMobXCache, { AugmentedData } from '../lib/LazyMobXCache';
import {
    MolecularProfile,
    Mutation,
    MutationFilter,
} from 'cbioportal-ts-api-client';
import { IDataQueryFilter } from '../lib/StoreUtils';
import _ from 'lodash';

type Query = {
    entrezGeneId: number;
};

function dataToKey(d: Mutation[], entrezGeneId: number) {
    return `${entrezGeneId}`;
}

function queryToKey(q: Query) {
    return `${q.entrezGeneId}`;
}

async function fetch(
    queries: Query[],
    studyToMolecularProfile: { [studyId: string]: MolecularProfile },
    studyToDataQueryFilter: { [studyId: string]: IDataQueryFilter }
): Promise<AugmentedData<Mutation[], number>[]> {
    const studies = Object.keys(studyToMolecularProfile);
    const results: Mutation[][] = await Promise.all(
        studies.map(studyId => {
            const filter = studyToDataQueryFilter[studyId];
            const molecularProfile = studyToMolecularProfile[studyId];
            const entrezGeneIds = queries.map(x => x.entrezGeneId);
            if (filter && molecularProfile && entrezGeneIds.length > 0) {
                return client.fetchMutationsInMolecularProfileUsingPOST({
                    molecularProfileId: molecularProfile.molecularProfileId,
                    mutationFilter: {
                        ...filter,
                        entrezGeneIds,
                    } as MutationFilter,
                    projection: 'DETAILED',
                });
            } else {
                return Promise.resolve([]);
            }
        })
    );
    const genes = _.keyBy(queries, x => x.entrezGeneId);
    const groupedData = _.values(_.groupBy(_.flatten(results), 'entrezGeneId'));
    const ret = [];
    for (const geneData of groupedData) {
        if (geneData.length) {
            ret.push({
                meta: geneData[0].entrezGeneId,
                data: [geneData],
            });
            delete genes[geneData[0].entrezGeneId];
        }
    }
    for (const remainingGene of Object.keys(genes)) {
        ret.push({
            meta: parseInt(remainingGene, 10),
            data: [],
        });
    }

    return ret;
}

export default class MutationDataCache extends LazyMobXCache<
    Mutation[],
    Query,
    number
> {
    constructor(
        studyToMolecularProfile: { [studyId: string]: MolecularProfile },
        studyToDataQueryFilter: { [studyId: string]: IDataQueryFilter }
    ) {
        super(
            queryToKey,
            dataToKey,
            fetch,
            studyToMolecularProfile,
            studyToDataQueryFilter
        );
    }
}
