import LazyMobXCache, { AugmentedData } from '../lib/LazyMobXCache';
import {
    GenesetMolecularData,
    GenesetDataFilterCriteria,
} from 'cbioportal-ts-api-client';
import client from 'shared/api/cbioportalInternalClientInstance';
import _ from 'lodash';
import { IDataQueryFilter } from '../lib/StoreUtils';

interface IQuery {
    genesetId: string;
    molecularProfileId: string;
}

type SampleFilterByProfile = {
    [molecularProfileId: string]: IDataQueryFilter;
};

function queryToKey(q: IQuery) {
    return `${q.molecularProfileId}~${q.genesetId}`;
}

function dataToKey(d: GenesetMolecularData[], q: IQuery) {
    return `${q.molecularProfileId}~${q.genesetId}`;
}

/**
/* Pairs each IQuery with an (array-wrapped) array of any matching data.
*/
function augmentQueryResults(
    queries: IQuery[],
    results: GenesetMolecularData[][]
) {
    const keyedAugments: {
        [key: string]: AugmentedData<GenesetMolecularData[], IQuery>;
    } = {};
    for (const query of queries) {
        keyedAugments[queryToKey(query)] = {
            data: [[]],
            meta: query,
        };
    }
    for (const queryResult of results) {
        for (const datum of queryResult) {
            keyedAugments[
                queryToKey({
                    molecularProfileId: datum.geneticProfileId,
                    genesetId: datum.genesetId,
                })
            ].data[0].push(datum);
        }
    }
    return _.values(keyedAugments);
}

async function fetch(
    queries: IQuery[],
    sampleFilterByProfile: SampleFilterByProfile
): Promise<AugmentedData<GenesetMolecularData[], IQuery>[]> {
    const genesetIdsByProfile = _.mapValues(
        _.groupBy(queries, q => q.molecularProfileId),
        profileQueries => profileQueries.map(q => q.genesetId)
    );
    const params = Object.keys(genesetIdsByProfile).map(profileId => ({
        geneticProfileId: profileId,
        // the Swagger-generated type expected by the client method below
        // incorrectly requires both samples and a sample list;
        // use 'as' to tell TypeScript that this object really does fit.
        // tslint:disable-next-line: no-object-literal-type-assertion
        genesetDataFilterCriteria: {
            genesetIds: genesetIdsByProfile[profileId],
            ...sampleFilterByProfile[profileId],
        } as GenesetDataFilterCriteria,
    }));
    const dataPromises = params.map(param =>
        client.fetchGeneticDataItemsUsingPOST(param)
    );
    const results: GenesetMolecularData[][] = await Promise.all(dataPromises);
    return augmentQueryResults(queries, results);
}

export default class GenesetMolecularDataCache extends LazyMobXCache<
    GenesetMolecularData[],
    IQuery,
    IQuery
> {
    constructor(molecularProfileIdToSampleFilter: SampleFilterByProfile) {
        super(queryToKey, dataToKey, fetch, molecularProfileIdToSampleFilter);
    }
}
