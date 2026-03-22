import { MobxPromise } from 'cbioportal-frontend-commons';
import { Mutation } from 'cbioportal-ts-api-client';
import {
    GenomeNexusAPIInternal,
    GenomicLocation,
} from 'genome-nexus-ts-api-client';
import genomeNexusInternalClient from 'shared/api/genomeNexusInternalClientInstance';
import { concatMutationData } from './StoreUtils';
import { uniqueGenomicLocations } from './MutationUtils';

export async function fetchHotspotsData(
    mutationData: MobxPromise<Mutation[]>,
    uncalledMutationData?: MobxPromise<Mutation[]>,
    client: GenomeNexusAPIInternal = genomeNexusInternalClient
) {
    const mutationDataResult = filterMutationsOnNonHotspotGenes(
        concatMutationData(mutationData, uncalledMutationData)
    );

    if (mutationDataResult.length === 0) {
        return [];
    }

    const genomicLocations: GenomicLocation[] = uniqueGenomicLocations(
        mutationDataResult
    );

    return await client.fetchHotspotAnnotationByGenomicLocationPOST({
        genomicLocations: genomicLocations,
    });
}

export function filterMutationsOnNonHotspotGenes(mutationData: Mutation[]) {
    const hotspotGenes = require('shared/static-data/hotspotGenes.json');
    return mutationData.filter(
        (m: Mutation) =>
            !m.gene.hugoGeneSymbol ||
            hotspotGenes.includes(m.gene.hugoGeneSymbol)
    );
}
