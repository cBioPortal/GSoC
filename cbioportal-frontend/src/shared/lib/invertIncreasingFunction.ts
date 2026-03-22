export function findXRangeOfIncreasingFunction(
    func: (x: number) => number,
    y: number // the output range is so that func(range[0]) <= y <= func(range[1])
) {
    // find lower
    let lower = 0;
    let step = 1;
    while (func(lower) > y) {
        if (lower < Number.MIN_SAFE_INTEGER) {
            throw new Error('Couldnt find lower bound');
        }

        lower -= step;
        step *= 2;
    }

    step = 1;
    let upper = 0;
    while (func(upper) < y) {
        if (upper > Number.MAX_SAFE_INTEGER) {
            throw new Error('Couldnt find upper bound');
        }

        upper += step;
        step *= 2;
    }

    return [lower, upper] as [number, number];
}

export default function invertIncreasingFunction(
    func: (x: number) => number,
    y: number,
    xRange?: [number, number],
    iterations: number = 20
) {
    xRange = xRange || findXRangeOfIncreasingFunction(func, y);
    // tries to approximate the value x, within xRange, such that func(x) = targetOutput, assuming func is monotonic increasing
    let xMin = xRange[0];
    let xMax = xRange[1];
    let guess = (xMin + xMax) / 2;
    let iterationsLeft = iterations;
    while (iterationsLeft > 0 && func(guess) !== y) {
        if (func(guess) > y) {
            // too big
            xMax = guess;
        } else {
            // too small
            xMin = guess;
        }
        guess = (xMin + xMax) / 2;
        iterationsLeft -= 1;
    }
    return guess;
}

export function invertDecreasingFunction(
    func: (x: number) => number,
    y: number,
    xRange?: [number, number],
    iterations: number = 20
) {
    const increasingFn = (x: number) => -func(x);
    return invertIncreasingFunction(increasingFn, -y, xRange, iterations);
}
