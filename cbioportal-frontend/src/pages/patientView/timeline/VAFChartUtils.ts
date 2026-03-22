import { getVariantAlleleFrequency } from '../../../shared/lib/MutationUtils';
import { MutationStatus } from '../mutation/PatientViewMutationsTabUtils';
import { isSampleProfiled } from '../../../shared/lib/isSampleProfiled';
import _ from 'lodash';
import { Mutation, Sample } from 'cbioportal-ts-api-client';
import { CoverageInformation } from '../../../shared/lib/GenePanelUtils';
import { GROUP_BY_NONE } from './/VAFChartControls';
import { numberOfLeadingDecimalZeros } from 'cbioportal-utils';

const MIN_LOG_ARG = 0.001;

export interface IPoint {
    x: number;
    y: number;
    sampleId: string;
    mutation: Mutation;
    mutationStatus: MutationStatus;
}

function isPointBasedOnRealVAF(d: { mutationStatus: MutationStatus }) {
    return (
        d.mutationStatus === MutationStatus.MUTATED_WITH_VAF ||
        d.mutationStatus === MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED
    );
}

export function splitMutationsBySampleGroup(
    mutations: Mutation[][],
    sampleGroup: { [s: string]: string }
) {
    let groupedMutation: { [s: string]: Mutation[] } = {};
    let groupedMutations: Mutation[][] = [];

    mutations.forEach((mutation, i) => {
        groupedMutation = {};
        mutation.forEach((sample, j) => {
            if (groupedMutation[sampleGroup[sample.sampleId]] === undefined) {
                groupedMutation[sampleGroup[sample.sampleId]] = [];
            }
            groupedMutation[sampleGroup[sample.sampleId]].push(sample);
        });
        for (const m in groupedMutation) {
            groupedMutations.push(groupedMutation[m]);
        }
    });
    return groupedMutations;
}

export function computeRenderData(
    samples: Sample[],
    mutations: Mutation[][],
    sampleIdIndex: { [sampleId: string]: number },
    mutationProfileId: string,
    coverageInformation: CoverageInformation,
    groupByOption: string,
    sampleIdToClinicalValue: { [sampleId: string]: string }
) {
    const grayPoints: IPoint[] = []; // points that are purely interpolated for rendering, dont have data of their own
    const lineData: IPoint[][] = [];

    if (groupByOption && groupByOption != GROUP_BY_NONE)
        mutations = splitMutationsBySampleGroup(
            mutations,
            sampleIdToClinicalValue
        );

    for (const mergedMutation of mutations) {
        // determine data points in line for this mutation

        // first add data points for each mutation
        let thisLineData: Partial<IPoint>[] = [];
        // keep track of which samples have mutations
        const samplesWithData: { [uniqueSampleKey: string]: boolean } = {};
        const samplesWithDataGroup =
            groupByOption && groupByOption != GROUP_BY_NONE
                ? sampleIdToClinicalValue[mergedMutation[0].sampleId]
                : undefined;

        for (const mutation of mergedMutation) {
            const sampleKey = mutation.uniqueSampleKey;
            const sampleId = mutation.sampleId;
            const vafReport = getVariantAlleleFrequency(mutation);
            if (vafReport !== null) {
                // has VAF data

                if (mutation.mutationStatus.toLowerCase() === 'uncalled') {
                    if (mutation.tumorAltCount > 0) {
                        // add point for uncalled mutation with supporting reads
                        thisLineData.push({
                            x: sampleIdIndex[sampleId],
                            y: vafReport.vaf,
                            sampleId,
                            mutation,
                            mutationStatus:
                                MutationStatus.PROFILED_WITH_READS_BUT_UNCALLED,
                        });
                        samplesWithData[sampleKey] = true;
                    }
                } else {
                    // add point for called mutation with VAF data
                    thisLineData.push({
                        x: sampleIdIndex[sampleId],
                        y: vafReport.vaf,
                        sampleId,
                        mutation,
                        mutationStatus: MutationStatus.MUTATED_WITH_VAF,
                    });
                    samplesWithData[sampleKey] = true;
                }
            } else {
                // no VAF data - add point which will be extrapolated
                thisLineData.push({
                    x: sampleIdIndex[sampleId],
                    sampleId,
                    mutation,
                    mutationStatus: MutationStatus.MUTATED_BUT_NO_VAF,
                });
                samplesWithData[sampleKey] = true;
            }
        }

        const mutation = mergedMutation[0];
        // add data points for samples without mutations
        for (const sample of samples) {
            if (!(sample.uniqueSampleKey in samplesWithData)) {
                // check if it is in the same group as samplesWithData
                if (
                    groupByOption == undefined ||
                    groupByOption == GROUP_BY_NONE ||
                    sampleIdToClinicalValue[sample.sampleId] ==
                        samplesWithDataGroup
                ) {
                    if (
                        !isSampleProfiled(
                            sample.uniqueSampleKey,
                            mutationProfileId,
                            mutation.gene.hugoGeneSymbol,
                            coverageInformation
                        )
                    ) {
                        // not profiled
                        thisLineData.push({
                            x: sampleIdIndex[sample.sampleId],
                            sampleId: sample.sampleId,
                            mutation,
                            mutationStatus: MutationStatus.NOT_PROFILED,
                        });
                    } else {
                        thisLineData.push({
                            x: sampleIdIndex[sample.sampleId],
                            y: 0,
                            sampleId: sample.sampleId,
                            mutation,
                            mutationStatus:
                                MutationStatus.PROFILED_BUT_NOT_MUTATED,
                        });
                    }
                }
            }
        }
        // sort by sample order
        thisLineData = _.sortBy(thisLineData, d => d.x);
        // interpolate missing y values
        // take out anything from the left and right that dont have data - we'll only interpolate points with data to their left and right
        while (
            thisLineData.length > 0 &&
            !isPointBasedOnRealVAF(thisLineData[0] as IPoint)
        ) {
            thisLineData.shift();
        }
        while (
            thisLineData.length > 0 &&
            !isPointBasedOnRealVAF(
                thisLineData[thisLineData.length - 1] as IPoint
            )
        ) {
            thisLineData.pop();
        }
        if (thisLineData.length === 0) {
            // skip this mutation if theres no line data left to plot
            continue;
        }
        // interpolate, and pull out interpolated points into gray points array
        const thisLineDataWithoutGrayPoints: IPoint[] = [];
        const thisGrayPoints: IPoint[] = [];
        for (let i = 0; i < thisLineData.length; i++) {
            if (
                i !== 0 &&
                i !== thisLineData.length - 1 &&
                thisLineData[i].y === undefined
            ) {
                // find closest defined data to the left and right
                let leftIndex = 0,
                    rightIndex = 0;
                for (leftIndex = i; leftIndex >= 0; leftIndex--) {
                    if (thisLineData[leftIndex].y !== undefined) {
                        break;
                    }
                }
                for (
                    rightIndex = i;
                    rightIndex <= thisLineData.length - 1;
                    rightIndex++
                ) {
                    if (thisLineData[rightIndex].y !== undefined) {
                        break;
                    }
                }
                const step = 1 / (rightIndex - leftIndex);
                thisLineData[i].y =
                    (i - leftIndex) *
                    step *
                    (thisLineData[leftIndex].y! + thisLineData[rightIndex].y!);
                // add to grayPoints
                thisGrayPoints.push(thisLineData[i] as IPoint);
            } else {
                thisLineDataWithoutGrayPoints.push(thisLineData[i] as IPoint);
            }
        }
        // we know thisLineDataWithoutGrayPoints is nonempty because it could only be empty if every point in
        //  it was gray, in which case it would have been made empty and skipped above.
        grayPoints.push(...thisGrayPoints);
        lineData.push(thisLineDataWithoutGrayPoints);
    }
    return {
        lineData,
        grayPoints,
    };
}

export function getYAxisTickmarks(
    minY: number,
    maxY: number,
    numTicks: number = 6
): number[] {
    if (numTicks === 0) return [minY, maxY];
    const tickmarkSize = (maxY - minY) / (numTicks - 1);
    const tickMarks = [minY];
    for (let i = 1; i < numTicks; i++) {
        const rawValue = tickMarks[i - 1] + tickmarkSize;
        tickMarks[i] = rawValue;
    }
    return tickMarks;
}

/**
 * Decimal adjustment of a number.
 * from: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor
 * @param {String}  type  The type of adjustment.
 * @param {Number}  value The number.
 * @param {Integer} exp   The exponent (the 10 logarithm of the adjustment base).
 * @returns {Number} The adjusted value.
 */
function decimalAdjust(
    type: 'floor' | 'ceil' | 'round',
    value: number,
    exp: number
) {
    // If the exp is undefined or zero...
    if (typeof exp === 'undefined' || +exp === 0) {
        return Math[type](value);
    }
    value = +value;
    exp = +exp;
    // If the value is not a number or the exp is not an integer...
    if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
        return NaN;
    }
    // Shift
    let shiftStr = value.toString().split('e');
    let shiftNum = Math[type](
        +(shiftStr[0] + 'e' + (shiftStr[1] ? +shiftStr[1] - exp : -exp))
    );
    // Shift back
    shiftStr = shiftNum.toString().split('e');
    return +(shiftStr[0] + 'e' + (shiftStr[1] ? +shiftStr[1] + exp : exp));
}

// Convenience functions for decimal round, floor and ceil
export function round10(value: number, exp: number) {
    return decimalAdjust('round', value, exp);
}
export function floor10(value: number, exp: number) {
    return decimalAdjust('floor', value, exp);
}
export function ceil10(value: number, exp: number) {
    return decimalAdjust('ceil', value, exp);
}

export function yValueScaleFunction(
    minTickmarkValue: number,
    maxTickmarkValue: number,
    plotRange: number,
    log10Transform: boolean | undefined
): (value: number) => number {
    const yPadding = 10;

    if (maxTickmarkValue !== undefined && minTickmarkValue !== undefined) {
        // when truncating the range of values is distributed
        // differently over the svg vertical space
        const rangeMinusPadding = plotRange - yPadding * 2;

        if (log10Transform) {
            const logMinTickmark = Math.log10(
                Math.max(MIN_LOG_ARG, minTickmarkValue)
            );
            const logMaxTickmark = Math.log10(
                Math.max(MIN_LOG_ARG, maxTickmarkValue)
            );
            const valueRange = logMaxTickmark - logMinTickmark;
            const linearTransformationScale = rangeMinusPadding / valueRange;

            return (y: number) => {
                const logY = Math.log10(Math.max(MIN_LOG_ARG, y));
                // translate so that min tickmark represents the 0 line
                const translatedY = logY - logMinTickmark;
                return (
                    plotRange -
                    yPadding -
                    translatedY * linearTransformationScale
                );
            };
        } else {
            const valueRange = maxTickmarkValue - minTickmarkValue;
            const linearTransformationScale = rangeMinusPadding / valueRange;

            return (y: number) => {
                // translate so that min tickmark represents the 0 line
                const translatedY = y - minTickmarkValue;
                return (
                    plotRange -
                    yPadding -
                    translatedY * linearTransformationScale
                );
            };
        }
    }
    return (y: number) => y;
}

// Examples: 0 -> 0, 0.1 -> 0, 0.01 -> 1, 0.0001 -> 3
export function numLeadingDecimalZeros(y: number) {
    if (y == 0 || y >= 0.1) return 0;
    return numberOfLeadingDecimalZeros(y);
}

/**
 * Try to return tick labels with fractional part just long enogh to disttinguish them.
 * It tries up to 3th positions in fractional part. Otherwise return scientific representation of original numbers.
 * Function returns distinct labels.
 * If input contains duplicates function deduplicates and return less labels that amount of input numbers.
 * @param nums array of ticks as numbers
 */
export function minimalDistinctTickStrings(nums: number[]): string[] {
    const distinctNums = nums.filter((v, i, a) => a.indexOf(v) === i);

    const fractionalNumbersToShow = distinctNums.map(num =>
        Number.isInteger(num) ? 0 : numLeadingDecimalZeros(num) + 1
    );

    const fromPos = Math.min(...fractionalNumbersToShow);
    const toPos = 3;

    for (let pos = fromPos; pos <= toPos; pos++) {
        const labels = distinctNums
            .map(num => num.toFixed(pos))
            .filter((v, i, a) => a.indexOf(v) === i);
        if (labels.length === distinctNums.length) {
            return labels;
        }
    }
    return distinctNums.map(num => num.toExponential());
}
