export interface IGisticSummary {
    amp: boolean;
    qValue: number;
    peakGeneCount: number;
}

export interface IGisticData {
    [entrezGeneId: string]: IGisticSummary[];
}
