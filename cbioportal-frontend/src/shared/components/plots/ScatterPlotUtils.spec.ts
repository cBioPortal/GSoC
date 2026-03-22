import { assert } from 'chai';
import {
    getNumberOfNewlines,
    getRegressionComputations,
    makeMultilineAxisLabel,
} from './ScatterPlotUtils';

describe('ScatterPlotUtils', () => {
    describe('getRegressionComputations', () => {
        it('gives the correct regression equation, R^2, and function for a sample input with no correlation', () => {
            const data: [number, number][] = [
                [0.10198768, 0.10165061],
                [0.10150876, 0.47896164],
                [0.30063469, 0.43840858],
                [0.24547808, 0.63594344],
                [0.05588675, 0.93228701],
                [0.95760052, 0.53645723],
                [0.02858332, 0.79155903],
                [0.49389574, 0.54855519],
                [0.77610317, 0.9879552],
                [0.00350206, 0.73565457],
            ];

            const computations = getRegressionComputations(data);
            // target values computed via python: scipy.stats.linregress
            const m = 0.079113612612723011;
            const b = 0.59449349756220937;
            const r2 = 0.010257434869772463;
            // test regression equation to make sure its approximately the same as what python gives
            const match = computations.string.match(
                /y = ([\d.]+)x \+ ([\d.]+)/
            );
            assert.isNotNull(match, 'equation has correct form');
            const M = parseFloat(match![1]);
            const B = parseFloat(match![2]);
            assert.approximately(M, m, 0.05);
            assert.approximately(B, b, 0.05);
            // make sure `predict` gives the same result as the equation
            for (let i = 0; i < 100; i += 1) {
                assert.approximately(
                    computations.predict(i)[1],
                    M * i + B,
                    0.0000005,
                    `value for ${i}`
                );
            }
            // test R^2
            assert.approximately(computations.r2, r2, 0.05, 'R^2');
        });
        it('gives the correct regression equation, R^2, and function for a sample input with strong correlation', () => {
            const data: [number, number][] = [
                [0, 0.33517481],
                [1, 3.00712561],
                [2, 6.73118302],
                [3, 9.25128682],
                [4, 12.0432596],
                [5, 15.9087018],
                [6, 18.71122156],
                [7, 21.69213527],
                [8, 24.57708193],
                [9, 27.98002031],
                [10, 30.67017471],
                [11, 33.55231386],
                [12, 36.20724938],
                [13, 39.21414698],
                [14, 42.74163248],
                [15, 45.95986539],
                [16, 48.28399276],
                [17, 51.52361803],
                [18, 54.62495359],
            ];

            const computations = getRegressionComputations(data);
            // target values computed via python: scipy.stats.linregress
            const m = 3.0120636256561446;
            const b = 0.41853989070105158;
            const r2 = 0.99970735279778178;
            // test regression equation to make sure its approximately the same as what python gives
            const match = computations.string.match(
                /y = ([\d.]+)x \+ ([\d.]+)/
            );
            assert.isNotNull(match, 'equation has correct form');
            const M = parseFloat(match![1]);
            const B = parseFloat(match![2]);
            assert.approximately(M, m, 0.05);
            assert.approximately(B, b, 0.05);
            // make sure `predict` gives the same result as the equation
            for (let i = 0; i < 100; i += 1) {
                assert.approximately(
                    computations.predict(i)[1],
                    M * i + B,
                    0.0000005,
                    `value for ${i}`
                );
            }
            // test R^2
            assert.approximately(computations.r2, r2, 0.05, 'R^2');
        });
    });

    describe('makeMultilineAxisLabel', () => {
        it('generates a multi-line label for label text given a char limit', () => {
            assert.equal(
                makeMultilineAxisLabel(
                    'mRNA Expression, RSEM (Batch normalized from Illumina HiSeq_RNASeqV2): TRIM24 ',
                    30
                ),
                'mRNA Expression, RSEM (Batch \nnormalized from Illumina \nHiSeq_RNASeqV2): TRIM24 '
            );
        });
        it('generates a normal label for label text under a given char limit', () => {
            assert.equal(
                makeMultilineAxisLabel(
                    'mRNA Expression, RSEM (Batch normalized from Illumina HiSeq_RNASeqV2): TRIM24 ',
                    80
                ),
                'mRNA Expression, RSEM (Batch normalized from Illumina HiSeq_RNASeqV2): TRIM24 '
            );
        });
        it('generates an empty label for a nonexistent label', () => {
            assert.equal(makeMultilineAxisLabel(undefined, 80), '');
        });
    });

    describe('getNumberOfNewlines', () => {
        it('gives the correct number of newline chars in some text', () => {
            assert.equal(getNumberOfNewlines('hello\nworld\n'), 2);
            assert.equal(getNumberOfNewlines('hello world'), 0);
        });
    });
});
