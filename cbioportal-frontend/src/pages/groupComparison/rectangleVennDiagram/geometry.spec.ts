import { assert } from 'chai';
import { assertDeepEqualInAnyOrder } from '../../../shared/lib/SpecUtils';
import {
    getRegionArea,
    getRegionShape,
    rectangleDifference,
    rectangleDifferenceMultiple,
    rectangleIntersection,
} from './geometry';

describe('rectangleVennDiagram/geometry', () => {
    describe('rectangleIntersection', () => {
        it('one rectangle', () => {
            const rects = [{ x: 0, y: 0, xLength: 10, yLength: 3 }];
            assert.deepEqual(rectangleIntersection(...rects), {
                x: 0,
                y: 0,
                xLength: 10,
                yLength: 3,
            });
        });
        it('two disjoint rectangles', () => {
            const rects = [
                { x: 0, y: 0, xLength: 10, yLength: 3 },
                { x: 20, y: 0, xLength: 5, yLength: 3 },
            ];
            assert.deepEqual(rectangleIntersection(...rects), {
                x: 0,
                y: 0,
                xLength: 0,
                yLength: 0,
            });
        });
        it('two intersecting rectangles, one containing the other', () => {
            const rects = [
                { x: 0, y: 0, xLength: 10, yLength: 3 },
                { x: 5, y: 0, xLength: 5, yLength: 3 },
            ];
            assert.deepEqual(rectangleIntersection(...rects), {
                x: 5,
                y: 0,
                xLength: 5,
                yLength: 3,
            });
        });
        it('two intersecting rectangles, neither containing the other', () => {
            const rects = [
                { x: 0, y: 0, xLength: 10, yLength: 5 },
                { x: 5, y: 3, xLength: 20, yLength: 50 },
            ];
            assert.deepEqual(rectangleIntersection(...rects), {
                x: 5,
                y: 3,
                xLength: 5,
                yLength: 2,
            });
        });
        it('two intersecting rectangles and one disjoint rectangle', () => {
            const rects = [
                { x: 0, y: 0, xLength: 10, yLength: 3 },
                { x: 5, y: 0, xLength: 5, yLength: 3 },
                { x: 20, y: 0, xLength: 5, yLength: 3 },
            ];
            assert.deepEqual(rectangleIntersection(...rects), {
                x: 0,
                y: 0,
                xLength: 0,
                yLength: 0,
            });
        });
        it('three intersecting rectangles', () => {
            const rects = [
                { x: 0, y: 0, xLength: 10, yLength: 3 },
                { x: 5, y: 0, xLength: 5, yLength: 3 },
                { x: 2, y: 0, xLength: 5, yLength: 2 },
            ];
            assert.deepEqual(rectangleIntersection(...rects), {
                x: 5,
                y: 0,
                xLength: 2,
                yLength: 2,
            });
        });
        it('three disjoint rectangles', () => {
            const rects = [
                { x: 0, y: 0, xLength: 10, yLength: 3 },
                { x: 20, y: 0, xLength: 5, yLength: 3 },
                { x: 50, y: 0, xLength: 5, yLength: 3 },
            ];
            assert.deepEqual(rectangleIntersection(...rects), {
                x: 0,
                y: 0,
                xLength: 0,
                yLength: 0,
            });
        });
    });

    describe('rectangleDifference', () => {
        it('A disjoint with B', () => {
            const rects = [
                { x: 0, y: 0, xLength: 10, yLength: 3 },
                { x: 20, y: 0, xLength: 5, yLength: 3 },
            ];
            assertDeepEqualInAnyOrder(rectangleDifference(rects[0], rects[1]), [
                rects[0],
            ]);
        });
        it('A contains B', () => {
            const rects = [
                { x: 0, y: 0, xLength: 10, yLength: 3 },
                { x: 5, y: 0, xLength: 5, yLength: 3 },
            ];
            assertDeepEqualInAnyOrder(rectangleDifference(rects[0], rects[1]), [
                {
                    x: 0,
                    y: 0,
                    xLength: 5,
                    yLength: 3,
                },
            ]);
        });
        it('B contains A', () => {
            const rects = [
                { x: 0, y: 0, xLength: 10, yLength: 3 },
                { x: 5, y: 0, xLength: 5, yLength: 3 },
            ];
            assertDeepEqualInAnyOrder(
                rectangleDifference(rects[1], rects[0]),
                []
            );
        });
        it('A intersects and doesnt contain B', () => {
            const rects = [
                { x: 0, y: 0, xLength: 10, yLength: 5 },
                { x: 5, y: 3, xLength: 20, yLength: 50 },
            ];
            assertDeepEqualInAnyOrder(
                rectangleDifference(rects[0], rects[1]),
                [
                    { x: 0, y: 3, xLength: 5, yLength: 2 },
                    { x: 0, y: 0, xLength: 10, yLength: 3 },
                ],
                'A - B'
            );
            assertDeepEqualInAnyOrder(
                rectangleDifference(rects[1], rects[0]),
                [
                    { x: 5, y: 5, xLength: 20, yLength: 48 },
                    { x: 10, y: 3, xLength: 15, yLength: 2 },
                ],
                'B-A'
            );
        });
    });

    describe('rectangleDifferenceMultiple', () => {
        it('three intersecting rectangles', () => {
            const a = { x: -3, y: -2, xLength: 20, yLength: 30 };
            const b = { x: 5, y: 0, xLength: 5, yLength: 8 };
            const c = { x: -6, y: 6, xLength: 14, yLength: 5 };
            assertDeepEqualInAnyOrder(
                rectangleDifferenceMultiple(a, [b, c]),
                [
                    {
                        x: -3,
                        y: 11,
                        xLength: 20,
                        yLength: 17,
                    },
                    {
                        x: 8,
                        y: 8,
                        xLength: 9,
                        yLength: 3,
                    },
                    {
                        x: 10,
                        y: 0,
                        xLength: 7,
                        yLength: 8,
                    },
                    {
                        x: -3,
                        y: -2,
                        xLength: 20,
                        yLength: 2,
                    },
                    {
                        x: -3,
                        y: 0,
                        xLength: 8,
                        yLength: 6,
                    },
                ],
                'a - b - c'
            );
            assertDeepEqualInAnyOrder(
                rectangleDifferenceMultiple(b, [a, c]),
                [],
                'b - a - c'
            );
            assertDeepEqualInAnyOrder(
                rectangleDifferenceMultiple(c, [a, b]),
                [
                    {
                        x: -6,
                        y: 6,
                        xLength: 3,
                        yLength: 5,
                    },
                ],
                'c - a - b'
            );
        });
        it('three disjoint rectangles', () => {
            const a = { x: 0, y: 0, xLength: 10, yLength: 3 };
            const b = { x: 20, y: 0, xLength: 5, yLength: 3 };
            const c = { x: 50, y: 0, xLength: 5, yLength: 3 };
            assertDeepEqualInAnyOrder(rectangleDifferenceMultiple(a, [b, c]), [
                a,
            ]);
            assertDeepEqualInAnyOrder(rectangleDifferenceMultiple(b, [a, c]), [
                b,
            ]);
            assertDeepEqualInAnyOrder(rectangleDifferenceMultiple(c, [a, b]), [
                c,
            ]);
        });
    });

    describe('getRegionShape', () => {
        const setRectangles = {
            a: { x: -3, y: -2, xLength: 20, yLength: 30 },
            b: { x: 5, y: 0, xLength: 5, yLength: 8 },
            c: { x: -6, y: 6, xLength: 14, yLength: 5 },
        };

        it('A', () => {
            assertDeepEqualInAnyOrder(
                getRegionShape(['a'], { a: setRectangles.a }),
                [setRectangles.a]
            );
        });
        it('A and B', () => {
            assertDeepEqualInAnyOrder(
                getRegionShape(['a', 'b'], {
                    a: setRectangles.a,
                    b: setRectangles.b,
                }),
                [rectangleIntersection(setRectangles.a, setRectangles.b)]
            );
        });
        it('A not B', () => {
            assertDeepEqualInAnyOrder(
                getRegionShape(['a'], {
                    a: setRectangles.a,
                    b: setRectangles.b,
                }),
                rectangleDifference(setRectangles.a, setRectangles.b)
            );
        });
        it('A and B not C', () => {
            assertDeepEqualInAnyOrder(
                getRegionShape(['a', 'b'], setRectangles),
                rectangleDifference(
                    rectangleIntersection(setRectangles.a, setRectangles.b),
                    setRectangles.c
                )
            );
        });
        it('A not B not C', () => {
            assertDeepEqualInAnyOrder(
                getRegionShape(['a'], setRectangles),
                rectangleDifferenceMultiple(setRectangles.a, [
                    setRectangles.b,
                    setRectangles.c,
                ])
            );
        });
        it('A and B and C', () => {
            assertDeepEqualInAnyOrder(
                getRegionShape(['a', 'b', 'c'], setRectangles),
                [
                    rectangleIntersection(
                        setRectangles.a,
                        setRectangles.b,
                        setRectangles.c
                    ),
                ]
            );
        });
    });

    describe('getRegionArea', () => {
        const setRectangles = {
            a: { x: -3, y: -2, xLength: 20, yLength: 30 },
            b: { x: 5, y: 0, xLength: 5, yLength: 8 },
            c: { x: -6, y: 6, xLength: 14, yLength: 5 },
        };

        it('A', () => {
            const shape = getRegionShape(['a'], { a: setRectangles.a });
            assert.equal(getRegionArea(shape), 600);
        });
        it('A and B', () => {
            const shape = getRegionShape(['a', 'b'], {
                a: setRectangles.a,
                b: setRectangles.b,
            });
            assert.equal(getRegionArea(shape), 40);
        });
        it('A not B', () => {
            const shape = getRegionShape(['a'], {
                a: setRectangles.a,
                b: setRectangles.b,
            });
            assert.equal(getRegionArea(shape), 560);
        });
        it('A and B not C', () => {
            const shape = getRegionShape(['a', 'b'], setRectangles);
            assert.equal(getRegionArea(shape), 34);
        });
        it('A not B not C', () => {
            const shape = getRegionShape(['a'], setRectangles);
            assert.equal(getRegionArea(shape), 511);
        });
        it('A and B and C', () => {
            const shape = getRegionShape(['a', 'b', 'c'], setRectangles);
            assert.equal(getRegionArea(shape), 6);
        });
        it('empty region', () => {
            assert.equal(getRegionArea([]), 0);
        });

        it('region with empty rectangles', () => {
            assert.equal(
                getRegionArea([{ x: 0, y: 0, xLength: 0, yLength: 0 }]),
                0
            );
        });
    });
});
