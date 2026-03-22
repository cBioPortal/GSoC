import LazyMobXCache from '../lib/LazyMobXCache';
import { Gene } from 'cbioportal-ts-api-client';
import client from '../api/cbioportalClientInstance';

type Query = {
    hugoGeneSymbol: string;
};

function key(o: { hugoGeneSymbol: string }) {
    return o.hugoGeneSymbol.toUpperCase();
}

async function fetch(queries: Query[]) {
    return client.fetchGenesUsingPOST({
        geneIdType: 'HUGO_GENE_SYMBOL',
        geneIds: queries.map(q => q.hugoGeneSymbol.toUpperCase()),
    });
}

export default class GeneCache extends LazyMobXCache<Gene, Query> {
    constructor() {
        super(key, key, fetch);
    }
}
