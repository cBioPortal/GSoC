export interface GroupComparisonMutation {
    proteinChange: string;
    groupAMutatedCount: number;
    groupBMutatedCount: number;
    groupAMutatedPercentage: number;
    groupBMutatedPercentage: number;
    logRatio: number;
    pValue: number;
    qValue: number;
    enrichedGroup: string;
}
