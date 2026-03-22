import LazyMobXCache from 'shared/lib/LazyMobXCache';
import client from 'shared/api/cbioportalInternalClientInstance';
import { VariantCount, VariantCountIdentifier } from 'cbioportal-ts-api-client';

function getKey<T extends { entrezGeneId: number; keyword?: string }>(
    obj: T
): string {
    if (obj.keyword) {
        return obj.entrezGeneId + '~' + obj.keyword;
    } else {
        return obj.entrezGeneId + '';
    }
}

function fetch(
    queries: VariantCountIdentifier[],
    mutationMolecularProfileId: string | undefined
): Promise<VariantCount[]> {
    if (!mutationMolecularProfileId) {
        return Promise.reject('No mutation molecular profile id given');
    } else if (queries.length > 0) {
        return client.fetchVariantCountsUsingPOST({
            molecularProfileId: mutationMolecularProfileId,
            variantCountIdentifiers: queries,
        });
    } else {
        return Promise.resolve([]);
    }
}

export default class VariantCountCache extends LazyMobXCache<
    VariantCount,
    VariantCountIdentifier
> {
    constructor(mutationMolecularProfileId: string | undefined) {
        super(getKey, getKey, fetch, mutationMolecularProfileId);
    }
}
