export interface MutualExclusivity {
    trackA: string;
    trackB: string;
    neitherCount: number;
    aNotBCount: number;
    bNotACount: number;
    bothCount: number;
    logOddsRatio: number;
    pValue: number;
    qValue: number;
    association: string;
}
