import { calculateQValues } from './BenjaminiHochbergFDRCalculator';
import { assert } from 'chai';
import { ExtendedSample } from 'shared/model/ExtendedSample';

const exampleData = [];

describe('#calculateQValue()', () => {
    it('returns p value as q value for the single data', () => {
        const arg = [0.0256];
        const exampleResult = [0.0256];
        assert.deepEqual(
            exampleResult,
            calculateQValues(arg),
            'single q value'
        );
    });

    it('returns 0s for the zero p values', () => {
        const arg = [0, 0, 0];
        const exampleResult = [0, 0, 0];
        assert.deepEqual(exampleResult, calculateQValues(arg), 'zero q values');
    });

    it('returns correct q values for multiple data', () => {
        const arg = [0.0256, 0.0635, 0.1465];
        const exampleResult = [0.07680000000000001, 0.09525, 0.1465];
        assert.deepEqual(
            exampleResult,
            calculateQValues(arg),
            'multiple q value'
        );
    });

    it('returns correct q values for massive data', () => {
        const arg = [
            0.001,
            0.002,
            0.003,
            0.004,
            0.005,
            0.006,
            0.007,
            0.008,
            0.009,
            0.1,
            0.2,
            0.4,
            0.5,
            0.6,
            0.7,
            0.8,
            0.9,
        ];
        const exampleResult = [
            0.017,
            0.017,
            0.017,
            0.017,
            0.017,
            0.017,
            0.017,
            0.017,
            0.017,
            0.17,
            0.30909090909090914,
            0.5666666666666668,
            0.6538461538461539,
            0.7285714285714285,
            0.7933333333333332,
            0.8500000000000001,
            0.9,
        ];
        assert.deepEqual(
            exampleResult,
            calculateQValues(arg),
            'massive q value'
        );
    });
});
