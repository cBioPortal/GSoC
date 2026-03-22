import jStat from 'jStat';
import _ from 'lodash';

const SUSPECTED_OUTLIER_MULTIPLE = 1.5;
const OUTLIER_MULTIPLE = 3;

interface Outliers {
    upper: {
        suspectedOutliers: number[];
        outliers: number[];
    };
    lower: {
        suspectedOutliers: number[];
        outliers: number[];
    };
}

export type BoxPlotModel = {
    min: number;
    median: number;
    max: number;
    q1: number;
    q2: number;
    q3: number;
    x?: number;
    whiskerUpper: number;
    whiskerLower: number;
    IQR: number;
    outliersUpper: Outliers['upper'];
    outliersLower: Outliers['lower'];
    sortedVector: number[];
};

function calculateOutliers(
    vector: number[],
    suspectedOutlierThresholdUpper: number,
    outlierThresholdUpper: number,
    suspectedOutlierThresholdLower: number,
    outlierThresholdLower: number
): Outliers {
    return vector.reduce(
        (memo: Outliers, val) => {
            if (val >= suspectedOutlierThresholdUpper) {
                val < outlierThresholdUpper
                    ? memo.upper.suspectedOutliers.push(val)
                    : memo.upper.outliers.push(val);
            }

            if (val <= suspectedOutlierThresholdLower) {
                val > outlierThresholdLower
                    ? memo.lower.suspectedOutliers.push(val)
                    : memo.lower.outliers.push(val);
            }

            return memo;
        },
        {
            upper: { outliers: [], suspectedOutliers: [] },
            lower: { outliers: [], suspectedOutliers: [] },
        }
    );
}

export function calculateBoxPlotModel(vector: number[]): BoxPlotModel {
    const sortedVector = _.sortBy<number>(vector, [(n: number) => n]);

    const quartiles = jStat.quartiles(sortedVector) as number[];
    const median = jStat.median(sortedVector) as number;

    const q1: number = quartiles[0];
    const q2: number = quartiles[1];
    const q3: number = quartiles[2];
    const IQR: number = q3 - q1;
    const max: number = sortedVector[sortedVector.length - 1];
    const min: number = sortedVector[0];

    const outlierThresholdLower = q1 - OUTLIER_MULTIPLE * IQR;
    const outlierThresholdUpper = q3 + OUTLIER_MULTIPLE * IQR;

    const suspectedOutlierThresholdLower =
        q1 - SUSPECTED_OUTLIER_MULTIPLE * IQR;
    const suspectedOutlierThresholdUpper =
        q3 + SUSPECTED_OUTLIER_MULTIPLE * IQR;

    const outliers = calculateOutliers(
        sortedVector,
        suspectedOutlierThresholdUpper,
        outlierThresholdUpper,
        suspectedOutlierThresholdLower,
        outlierThresholdLower
    );

    const whiskerLower =
        outliers.lower.suspectedOutliers.length > 0 ||
        outliers.lower.outliers.length > 0
            ? suspectedOutlierThresholdLower
            : sortedVector[0];

    const whiskerUpper =
        outliers.upper.suspectedOutliers.length > 0 ||
        outliers.upper.outliers.length > 0
            ? suspectedOutlierThresholdUpper
            : sortedVector[sortedVector.length - 1];

    return {
        q1,
        q2,
        q3,
        IQR,
        median,
        whiskerUpper,
        whiskerLower,
        max,
        min,
        outliersUpper: outliers.upper,
        outliersLower: outliers.lower,
        sortedVector,
    };
}

export const BOX_STYLES = {
    min: { stroke: '#999999' },
    max: { stroke: '#999999' },
    q1: { fill: '#eeeeee' },
    q3: { fill: '#eeeeee' },
    median: { stroke: '#999999', strokeWidth: 1 },
};

export interface VictoryBoxPlotModel extends BoxPlotModel {
    realMin: number;
    realMax: number;
}

export function getBoxWidth(
    numBoxes: number,
    approximatePlotWidth: number = 750
) {
    const maxWidth = 80; // width with 1 box
    const minWidth = 18; // width with 33 boxes, calibrated to fit all 33 TCGA
    //                      pan-can atlas studies in one screen.

    // fit all (boxes + padding) at maxWidth if possible, otherwise smush in
    let boxWidth = Math.min(
        maxWidth,
        approximatePlotWidth / (numBoxes + (numBoxes - 1) / 2)
    );
    // don't smush too much
    boxWidth = Math.max(minWidth, boxWidth);

    return boxWidth;
}
