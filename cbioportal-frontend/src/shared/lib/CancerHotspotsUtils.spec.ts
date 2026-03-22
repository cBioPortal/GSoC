import { assert } from 'chai';

import { Mutation } from 'cbioportal-ts-api-client';
import { filterMutationsOnNonHotspotGenes } from './CancerHotspotsUtils';

describe('CancerHotspotsUtils', () => {
    describe('filterMutationsOnNonHotspotGenes', () => {
        it('filters mutations on non hotspot genes', () => {
            const mutations = [
                { gene: { hugoGeneSymbol: 'TP53' } },
                { gene: { hugoGeneSymbol: 'CLEC9A' } },
            ] as Mutation[];
            assert.isTrue(
                filterMutationsOnNonHotspotGenes(mutations).length === 1
            );
        });
    });
});
