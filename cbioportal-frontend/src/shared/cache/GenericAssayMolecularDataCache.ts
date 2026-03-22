import LazyMobXCache, { AugmentedData } from '../lib/LazyMobXCache';
import _ from 'lodash';
import { IDataQueryFilter } from '../lib/StoreUtils';
import { GenericAssayData } from 'cbioportal-ts-api-client';
import { fetchGenericAssayData } from 'shared/lib/GenericAssayUtils/GenericAssayCommonUtils';

export type GenericAssayDataEnhanced = GenericAssayData & {
    thresholdType?: '>' | '<';
};

interface IQuery {
    stableId: string;
    molecularProfileId: string;
}

type SampleFilterByProfile = {
    [molecularProfileId: string]: IDataQueryFilter;
};

function queryToKey(q: IQuery) {
    return `${q.molecularProfileId}~${q.stableId}`;
}

function dataToKey(d: GenericAssayData[], q: IQuery) {
    return `${q.molecularProfileId}~${q.stableId}`;
}

/**
/* Pairs each IQuery with an (array-wrapped) array of any matching data.
*/
function augmentQueryResults(queries: IQuery[], results: GenericAssayData[][]) {
    const keyedAugments: {
        [key: string]: AugmentedData<GenericAssayDataEnhanced[], IQuery>;
    } = {};
    for (const query of queries) {
        keyedAugments[queryToKey(query)] = {
            data: [[]],
            meta: query,
        };
    }
    for (const queryResult of results) {
        for (let datum of queryResult) {
            datum = handleValueThreshold(datum);
            keyedAugments[
                queryToKey({
                    molecularProfileId: datum.molecularProfileId,
                    stableId: datum.stableId,
                })
            ].data[0].push(datum);
        }
    }
    return _.values(keyedAugments);
}

// Values are passed as strings from the REST facility
// check for value threshold indicators ('>' or '<') to appear in front of values
// and convert to a numeric value and a separate value threshold indicator
function handleValueThreshold(
    datum: GenericAssayDataEnhanced
): GenericAssayDataEnhanced {
    if (!datum.thresholdType) {
        // only extract threshold('>' and '<' symbols) for numeric values
        // This will match a number with possible threshold('>' and '<' symbols) before it
        // Example 1, integer: 10
        // Example 2, float: 10.0015
        // Example 3, integer with threshold: >10
        // Example 4, float with threshold: <10.0015
        // Example 5, integer with threshold and space: > 10
        // Example 6, float with threshold and space: < 10.0015
        const matches = /^([><]? *)(-?\d+(\.\d+)?)$/.exec(datum.value);
        datum.thresholdType = undefined;
        if (matches) {
            datum.value = matches[2];
            // remove possible blanks from thresholdType
            const thresholdType = _.trim(matches[1]);
            if (thresholdType.length > 0) {
                if (thresholdType === '>') {
                    datum.thresholdType = thresholdType as '>';
                } else if (thresholdType === '<') {
                    datum.thresholdType = thresholdType as '<';
                }
            }
        }
    }

    return datum;
}

async function fetch(
    queries: IQuery[],
    sampleFilterByProfile: SampleFilterByProfile
): Promise<AugmentedData<GenericAssayData[], IQuery>[]> {
    const stableIdsByProfile = _.mapValues(
        _.groupBy(queries, q => q.molecularProfileId),
        profileQueries => profileQueries.map(q => q.stableId)
    );
    const genericAssayDataResult = await fetchGenericAssayData(
        stableIdsByProfile,
        sampleFilterByProfile
    );
    return augmentQueryResults(queries, genericAssayDataResult);
}

export default class GenericAssayMolecularDataCache extends LazyMobXCache<
    GenericAssayData[],
    IQuery,
    IQuery
> {
    constructor(molecularProfileIdToSampleFilter: SampleFilterByProfile) {
        super(queryToKey, dataToKey, fetch, molecularProfileIdToSampleFilter);
    }
}
