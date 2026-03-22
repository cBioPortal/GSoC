// TODO we could make some tweaks to make it contains all three types we support (gene, region, variant)
export const EXAMPLE_DATA_GRCH37 = [
    {
        value: '13:g.32921033G>C',
        label: '13:g.32921033G>C (BRCA2 R2336P)',
    },
    {
        value: '13:g.32972901_32972904del',
        label: '13:g.32972901_32972904del (BRCA2 I3418Kfs*8)',
    },
    {
        value: '17:g.41243783_41243784insT',
        label: '7:g.41243783_41243784insT (BRCA1 N1255Kfs*12)',
    },
    {
        value: '17:g.7577548C>T',
        label: '17:g.7577548C>T (TP53 G245S)',
    },
];

export const ANNOTATION_QUERY_FIELDS = [
    'hotspots',
    'annotation_summary',
    'my_variant_info',
    'mutation_assessor',
    'signal',
    'clinvar',
];

export const SHOW_MUTATION_ASSESSOR = true;

export const MskImpactFrequencyDigits = 3;
