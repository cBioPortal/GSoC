import LazyMobXCache from './LazyMobXCache';
export type SampleAndGene = { sampleId: string; entrezGeneId: number };

export default class SampleGeneCache<
    T extends SampleAndGene
> extends LazyMobXCache<T, SampleAndGene> {
    constructor(
        fetch: (
            queries: SampleAndGene[],
            ...staticDependencies: any[]
        ) => Promise<T[]>,
        ...staticDependencies: any[]
    ) {
        super(
            q => q.sampleId + ',' + q.entrezGeneId,
            d => d.sampleId + ',' + d.entrezGeneId,
            fetch,
            ...staticDependencies
        );
    }
}
