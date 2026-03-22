import {
    Genome2StructureAPI,
    Alignment,
    ResidueMapping,
} from 'genome-nexus-ts-api-client';
import g2sClient from 'shared/api/g2sClientInstance';
import { CacheData } from 'shared/lib/LazyMobXCache';
import { MobxPromise, remoteData } from 'cbioportal-frontend-commons';

export type ResidueMappingQuery = {
    uniprotId: string;
    pdbId: string;
    chainId: string;
    uniprotPositions: number[];
};

export async function fetchAlignments(
    positions: number[],
    uniprotId: string,
    pdbId: string,
    chainId: string,
    client: Genome2StructureAPI = g2sClient
) {
    if (positions.length > 0) {
        return await client.postResidueMappingByPDBUsingPOST({
            idType: 'uniprot',
            id: uniprotId,
            pdbId,
            chainId,
            positionList: positions.map(position => `${position}`),
        });
    } else {
        return [];
    }
}

// TODO implement a cache that extends LazyMobXCache...
// this one is just doing a very basic caching based on the query parameters,
// ideally we should implement a fine caching based on "uniprotPositions"
export default class ResidueMappingCache {
    private queries: {
        [key: string]: MobxPromise<Array<CacheData<ResidueMapping> | null>>;
    } = {};

    public get(query: ResidueMappingQuery) {
        const key = this.generateQueryKey(query);

        if (!this.queries[key]) {
            this.queries[key] = remoteData<
                Array<CacheData<ResidueMapping> | null>
            >(
                {
                    invoke: async () => {
                        let residueMappingCacheData: Array<CacheData<
                            ResidueMapping
                        > | null> = [];
                        let residueMappings: ResidueMapping[] = [];

                        const alignments = await fetchAlignments(
                            query.uniprotPositions,
                            query.uniprotId,
                            query.pdbId,
                            query.chainId
                        );

                        if (alignments.length > 0) {
                            alignments.forEach((alignment: Alignment) => {
                                residueMappings = residueMappings.concat(
                                    alignment.residueMapping
                                );
                            });

                            residueMappingCacheData = residueMappings.map(
                                (residueMapping: ResidueMapping) =>
                                    ({
                                        status: 'complete',
                                        data: residueMapping,
                                    } as CacheData<ResidueMapping>)
                            );
                        }

                        return residueMappingCacheData;
                    },
                    onError: (err: Error) => {
                        // fail silently
                    },
                },
                this.defaultData(query)
            );
        }

        return this.queries[key];
    }

    private generateQueryKey(query: ResidueMappingQuery): string {
        return `${query.uniprotId}_${query.pdbId}_${
            query.chainId
        }_${query.uniprotPositions.join(',')}`;
    }

    private defaultData(
        query: ResidueMappingQuery
    ): Array<CacheData<ResidueMapping> | null> {
        return [null];
    }
}
