export enum DataFilterType {
    ONCOKB = 'oncokb',
    HOTSPOT = 'hotspot',
    POSITION = 'position',
    MUTATION = 'mutation',
    CANCER_TYPE = 'cancerType',
    PROTEIN_IMPACT_TYPE = 'proteinImpactType',
    MUTATION_STATUS = 'mutationStatus',
    PROTEIN_CHANGE = 'proteinChange',
}

export type DataFilter<T = any> = {
    id?: string;
    type: string;
    values: T[];
};
