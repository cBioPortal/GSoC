import { assert } from 'chai';
import {
    computeCorrelationPValue,
    getDeterministicRandomNumber,
} from './PlotUtils';

describe('PlotUtils', () => {
    describe('getDeterministicRandomNumber', () => {
        it('returns numbers between specified range', () => {
            for (let i = 0; i < 100; i++) {
                const r1 = getDeterministicRandomNumber(i);
                assert.isTrue(r1 >= 0 && r1 <= 1);
                const r2 = getDeterministicRandomNumber(i, [-1, 6]);
                assert.isTrue(r2 >= -1 && r1 <= 6);
                const r3 = getDeterministicRandomNumber(i, [0.5, 0.8]);
                assert.isTrue(r3 >= 0.5 && r3 <= 0.8);
            }
        });
        it('returns same result for same seed (deterministic)', () => {
            for (let i = 0; i < 100; i++) {
                assert.equal(
                    getDeterministicRandomNumber(i),
                    getDeterministicRandomNumber(i)
                );
                assert.equal(
                    getDeterministicRandomNumber(i),
                    getDeterministicRandomNumber(i)
                );
                assert.equal(
                    getDeterministicRandomNumber(i),
                    getDeterministicRandomNumber(i)
                );
            }
        });
    });

    describe('computeCorrelationPValue', () => {
        it('gives the correct result on sample data', () => {
            // source: https://www.wessa.net/rwasp_spearman.wasp
            assert.approximately(
                computeCorrelationPValue(-0.423285542595266, 23),
                0.0441623330731344,
                0.0000000005
            );
        });
    });
});
