export interface ICivicGeneSummary {
    id: number;
    name: string;
    description: string;
    url: string;
    variants: { [variantName: string]: ICivicVariantSummary };
}

export interface ICivicVariantSummary {
    id: number;
    name: string;
    url: string;
    description: string;
    evidenceCounts: ICivivEvidenceCountsByType;
}
export interface ICivivEvidenceCountsByType {
    diagnosticCount?: number;
    predictiveCount?: number;
    prognosticCount?: number;
    predisposingCount?: number;
    oncogenicCount?: number;
    functionalCount?: number;
}

export interface ICivicGeneIndex {
    [name: string]: ICivicGeneSummary;
}

export interface ICivicVariantIndex {
    [geneName: string]: { [variantName: string]: ICivicVariantSummary };
}

export interface ICivicEntry {
    name: string;
    description: string;
    url: string;
    variants: { [name: string]: ICivicVariantSummary };
}
