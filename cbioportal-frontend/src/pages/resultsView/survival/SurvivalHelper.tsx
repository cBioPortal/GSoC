import jStat from 'jStat';

export type ConfidenceIntervalSet = {
    low: number;
    high: number;
};

export function calculateLogConfidenceIntervals(
    survivalFunctionEstimate: number,
    standardError: number,
    confidenceLevel = 0.95
): ConfidenceIntervalSet {
    // calculate confidence intervals
    const zValue = jStat.normal.inv(1 - (1 - confidenceLevel) / 2, 0, 1);
    // Reference: https://github.com/cran/survival/blob/master/R/survfit.R#L308-L316
    const xx = survivalFunctionEstimate === 0 ? NaN : survivalFunctionEstimate;
    const se2 = (standardError / survivalFunctionEstimate) * zValue;
    const temp1 = Math.exp(Math.log(xx) - se2);
    const temp2 = Math.exp(Math.log(xx) + se2);
    const low = temp1;
    const high = Math.min(temp2, 1);
    return {
        low,
        high,
    } as ConfidenceIntervalSet;
}
