import _ from 'lodash';
import {
    default as SampleGeneCache,
    SampleAndGene,
} from 'shared/lib/SampleGeneCache';
import internalClient from 'shared/api/cbioportalInternalClientInstance';
import { MrnaPercentile } from 'cbioportal-ts-api-client';
import { CacheData } from 'shared/lib/LazyMobXCache';

export type MrnaExprRankCacheDataType = CacheData<MrnaPercentile>;

async function fetch(
    queries: SampleAndGene[],
    mrnaRankMolecularProfileId: string | null
): Promise<MrnaPercentile[]> {
    try {
        const sampleToEntrezList: { [sampleId: string]: number[] } = {};
        for (const query of queries) {
            sampleToEntrezList[query.sampleId] =
                sampleToEntrezList[query.sampleId] || [];
            sampleToEntrezList[query.sampleId].push(query.entrezGeneId);
        }
        const allMrnaPercentiles: MrnaPercentile[][] = await Promise.all(
            Object.keys(sampleToEntrezList).map((sampleId: string) =>
                mrnaRankMolecularProfileId === null
                    ? Promise.reject('No molecular profile id given.')
                    : internalClient.fetchMrnaPercentileUsingPOST({
                          molecularProfileId: mrnaRankMolecularProfileId,
                          sampleId,
                          entrezGeneIds: sampleToEntrezList[sampleId],
                      })
            )
        );
        return _.flatten(allMrnaPercentiles);
    } catch (err) {
        throw err;
    }
}

export default class MrnaExprRankCache extends SampleGeneCache<MrnaPercentile> {
    constructor(mrnaRankMolecularProfileId: string | null) {
        super(fetch, mrnaRankMolecularProfileId);
    }
}
