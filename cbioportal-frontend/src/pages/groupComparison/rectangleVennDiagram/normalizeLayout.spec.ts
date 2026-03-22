import { assert } from 'chai';
import { assertDeepEqualInAnyOrder } from '../../../shared/lib/SpecUtils';
import { getConnectedComponents } from './normalizeLayout';

describe('rectangleVennDiagram/normalizeLayout', () => {
    describe('getConnectedComponents', () => {
        it('one rectangle', () => {
            const rect = { x: 0, y: 0, xLength: 10, yLength: 3 };
            assertDeepEqualInAnyOrder(
                getConnectedComponents({
                    rect,
                }),
                [{ rectangles: [rect] }]
            );
        });
        it('two disjoint rectangles', () => {
            const rects = {
                rect1: { x: 0, y: 0, xLength: 10, yLength: 3 },
                rect2: { x: 20, y: 0, xLength: 5, yLength: 3 },
            };
            assertDeepEqualInAnyOrder(getConnectedComponents(rects), [
                { rectangles: [rects.rect1] },
                { rectangles: [rects.rect2] },
            ]);
        });
        it('two intersecting rectangles', () => {
            const rects = {
                rect1: { x: 0, y: 0, xLength: 10, yLength: 3 },
                rect2: { x: 5, y: 0, xLength: 5, yLength: 3 },
            };
            assertDeepEqualInAnyOrder(getConnectedComponents(rects), [
                { rectangles: [rects.rect1, rects.rect2] },
            ]);
        });
        it('two intersecting rectangles and one disjoint rectangle', () => {
            const rects = {
                rect1: { x: 0, y: 0, xLength: 10, yLength: 3 },
                rect2: { x: 5, y: 0, xLength: 5, yLength: 3 },
                rect3: { x: 20, y: 0, xLength: 5, yLength: 3 },
            };
            assertDeepEqualInAnyOrder(getConnectedComponents(rects), [
                { rectangles: [rects.rect1, rects.rect2] },
                { rectangles: [rects.rect3] },
            ]);
        });
        it('three intersecting rectangles', () => {
            const rects = {
                rect1: { x: 0, y: 0, xLength: 10, yLength: 3 },
                rect2: { x: 5, y: 0, xLength: 5, yLength: 3 },
                rect3: { x: 2, y: 0, xLength: 5, yLength: 3 },
            };
            assertDeepEqualInAnyOrder(getConnectedComponents(rects), [
                { rectangles: [rects.rect1, rects.rect2, rects.rect3] },
            ]);
        });
        it('three disjoint rectangles', () => {
            const rects = {
                rect1: { x: 0, y: 0, xLength: 10, yLength: 3 },
                rect2: { x: 20, y: 0, xLength: 5, yLength: 3 },
                rect3: { x: 50, y: 0, xLength: 5, yLength: 3 },
            };
            assertDeepEqualInAnyOrder(getConnectedComponents(rects), [
                { rectangles: [rects.rect1] },
                { rectangles: [rects.rect2] },
                ,
                { rectangles: [rects.rect3] },
            ]);
        });
    });
});
