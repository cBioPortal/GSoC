import { assert } from 'chai';
import invertIncreasingFunction, {
    findXRangeOfIncreasingFunction,
} from './invertIncreasingFunction';

describe('invertIncreasingFunction', () => {
    it('correctly inverts square', () => {
        for (let i = 1; i < 10; i += 1) {
            assert.isTrue(
                Math.abs(
                    invertIncreasingFunction(x => x * x, i, [0, i]) -
                        Math.sqrt(i)
                ) < 0.001
            );
        }
    });
});

describe('findXRangeOfIncreasingFunction', () => {
    function testRange(func: (x: number) => number, y: number) {
        const range = findXRangeOfIncreasingFunction(func, y);
        assert.isAtMost(func(range[0]), y);
        assert.isAtLeast(func(range[1]), y);
    }

    it('finds an acceptable range for various inputs of square function', () => {
        const square = (x: number) => x * x;
        for (let i = 1; i < 10; i += 1) {
            testRange(square, i);
        }
    });
    it('finds an acceptable range for various inputs of log function', () => {
        const log = (x: number) => Math.log(x);
        for (let i = 1; i < 10; i += 1) {
            testRange(log, i);
        }
    });
    it('errors and fails to find an acceptable range when the input is not valid', () => {
        let errorOccurred = false;
        try {
            findXRangeOfIncreasingFunction(Math.exp, -1); // there is no lower bound, a, so that Math.exp(a) <= -1
        } catch (e) {
            errorOccurred = true;
        }
        assert.isTrue(
            errorOccurred,
            'Failed to throw error when lower bound doesnt exist'
        );

        errorOccurred = false;
        try {
            findXRangeOfIncreasingFunction(x => 1 - 1 / x, 2); // there is no upper bound, b, so that 2<=1/(1-b)
        } catch (e) {
            errorOccurred = true;
        }
        assert.isTrue(
            errorOccurred,
            'Failed to throw error when upper bound doesnt exist'
        );
    });
});
