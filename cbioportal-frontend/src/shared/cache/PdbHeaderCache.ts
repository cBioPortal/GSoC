import client from 'shared/api/genomeNexusClientInstance';
import LazyMobXCache from 'shared/lib/LazyMobXCache';
import { PdbHeader } from 'genome-nexus-ts-api-client';

function fetch(pdbIds: string[]): Promise<PdbHeader[]> {
    if (pdbIds.length === 0) {
        return Promise.reject('No pdb ids given');
    } else {
        return client.fetchPdbHeaderPOST({
            pdbIds: pdbIds,
        });
    }
}
export default class PdbHeaderCache extends LazyMobXCache<PdbHeader, string> {
    constructor() {
        super(
            q => q,
            (d: PdbHeader) => d.pdbId,
            fetch
        );
    }
}
