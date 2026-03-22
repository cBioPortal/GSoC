import { assert } from 'chai';
import { calculateBoxPlotModel } from './boxPlotUtils';
import jStat from 'jStat';

describe('Box Plot Utils', () => {
    it('Calculates box plot model for distributions WITHOUT outliers', () => {
        const arr = [
            1,
            2,
            2,
            2.5,
            3,
            5,
            6,
            7,
            8,
            10,
            11,
            11.5,
            12,
            13,
            13,
            13,
            14.5,
            15,
            17,
            17.5,
            18,
            20,
            21,
        ];
        const result = calculateBoxPlotModel(arr);
        const expected = {
            q1: 5,
            q2: 12,
            q3: 14.5,
            IQR: 9.5,
            median: 12,
            whiskerUpper: 21,
            whiskerLower: 1,
        };
        assert.equal(result.q1, 5, 'q1');
        assert.equal(result.q2, 11.5, 'q2');
        assert.equal(result.q3, 14.5, 'q3');
        assert.equal(result.median, 11.5, 'median');
        assert.equal(result.IQR, 9.5, 'IQR');
        assert.equal(result.whiskerUpper, result.max, 'whiskerUpper is max');
        assert.equal(result.whiskerLower, result.min, 'whiskerLower is min');
    });

    it('Sets whiskers to quartile +- 1.5(IQR) when outliers exist', () => {
        const arr = [
            1,
            2,
            2,
            2.5,
            3,
            5,
            6,
            7,
            8,
            10,
            11,
            11.5,
            12,
            13,
            13,
            13,
            14.5,
            15,
            17,
            17.5,
            18,
            20,
            100,
        ];
        const result = calculateBoxPlotModel(arr);
        const expected = {
            q1: 5,
            q2: 12,
            q3: 14.5,
            IQR: 9.5,
            median: 12,
            whiskerUpper: 21,
            whiskerLower: 1,
        };
        assert.equal(result.q1, 5, 'q1');
        assert.equal(result.q2, 11.5, 'q2');
        assert.equal(result.q3, 14.5, 'q3');
        assert.equal(result.median, 11.5, 'median');
        assert.equal(result.IQR, 9.5, 'IQR');
        assert.equal(
            result.whiskerUpper,
            result.q3 + 1.5 * result.IQR,
            'whiskerUpper is NOT max'
        );
        assert.equal(result.whiskerLower, result.min, 'whiskerLower is min');
    });

    it('Sets whiskers to quartile +- 1.5(IQR) when outliers exist', () => {
        const arr = [
            -200,
            1,
            2,
            2,
            2.5,
            3,
            5,
            6,
            7,
            8,
            10,
            11,
            11.5,
            12,
            13,
            13,
            13,
            14.5,
            15,
            17,
            17.5,
            18,
            20,
        ];
        const result = calculateBoxPlotModel(arr);
        assert.equal(result.q1, 3, 'q1');
        assert.equal(result.q2, 11, 'q2');
        assert.equal(result.q3, 13, 'q3');
        assert.equal(result.median, 11, 'median');
        assert.equal(result.IQR, 10, 'IQR');
        assert.equal(result.whiskerUpper, 20, 'whiskerUpper is NOT max');
        assert.equal(
            result.whiskerLower,
            result.q1 - 1.5 * result.IQR,
            'whiskerLower is min'
        );
    });

    it('Gets upper and lower suspectedoutliers', () => {
        const arr = [
            -27,
            -26,
            -12,
            -11.9,
            2.5,
            3,
            5,
            6,
            7,
            8,
            10,
            11,
            11.5,
            12,
            13,
            13,
            13,
            14.5,
            15,
            27,
            28,
            42.9,
            44,
        ];
        const result = calculateBoxPlotModel(arr);
        assert.deepEqual(result.outliersLower.outliers, [-27], 'gets outlier');
        assert.deepEqual(
            result.outliersLower.suspectedOutliers,
            [-26, -12],
            'two suspected outliers'
        );
        assert.deepEqual(
            result.outliersUpper.suspectedOutliers,
            [28, 42.9],
            'two outliers'
        );
        assert.deepEqual(result.outliersUpper.outliers, [44], 'two outliers');
    });
});
