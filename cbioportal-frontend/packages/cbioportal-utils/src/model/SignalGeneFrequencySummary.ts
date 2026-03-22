export interface ISignalGeneFrequencySummary {
    hugoSymbol: string;
    penetrance: string[];
    sampleCount: number;
    frequencies: ISignalFrequencySummary[];
}

export interface ISignalTumorTypeFrequencySummary
    extends ISignalGeneFrequencySummary {
    tumorType: string;
}

export interface ISignalFrequencySummary {
    frequency: number;
    category: SignalFrequencySummaryCategory;
}

export enum SignalFrequencySummaryCategory {
    DEFAULT = 'NA',
    SOMATIC_DRIVER = 'somaticDriverByGene',
    PATHOGENIC_GERMLINE = 'pathogenicGermlineByGene',
    PERCENT_BIALLELIC = 'percentBiallelicByGene',
}
