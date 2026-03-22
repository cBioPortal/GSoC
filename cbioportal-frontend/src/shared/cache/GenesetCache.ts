import LazyMobXCache from '../lib/LazyMobXCache';
import { Geneset } from 'cbioportal-ts-api-client';
import internalClient from '../api/cbioportalInternalClientInstance';

type Query = {
    genesetId: string;
};

function key(o: { genesetId: string }) {
    return o.genesetId.toUpperCase();
}

async function fetch(queries: Query[]) {
    return internalClient.fetchGenesetsUsingPOST({
        genesetIds: queries.map(q => q.genesetId.toUpperCase()),
    });
}

export default class GenesetCache extends LazyMobXCache<Geneset, Query> {
    constructor() {
        super(key, key, fetch);
    }
}
