import _ from 'lodash';
import { SetRectangles } from './layout';

export type Rectangle = {
    x: number;
    y: number;
    xLength: number;
    yLength: number;
}; // bottom-left aligned
export type RegionShape = Rectangle[];

export function rectangleArea(
    rectangle: Pick<Rectangle, 'xLength' | 'yLength'>
) {
    return rectangle.xLength * rectangle.yLength;
}

export function rectangleDistance(rect1: Rectangle, rect2: Rectangle) {
    const x = rect1.x - rect2.x;
    const y = rect1.y - rect2.y;
    return Math.sqrt(x * x + y * y);
}

export function rectangleIntersection(...rectangles: Rectangle[]): Rectangle {
    // Iteratively intersect every rectangle in the list with an accumulator
    let intersection = rectangles[0];
    for (let i = 1; i < rectangles.length; i++) {
        // Perform the intersection - this is standard way to do it
        const rect = rectangles[i];

        const xMin = Math.max(intersection.x, rect.x);
        const xMax = Math.min(
            intersection.x + intersection.xLength,
            rect.x + rect.xLength
        );

        const yMin = Math.max(intersection.y, rect.y);
        const yMax = Math.min(
            intersection.y + intersection.yLength,
            rect.y + rect.yLength
        );

        if (xMin >= xMax || yMin >= yMax) {
            // no intersection
            return {
                x: 0,
                y: 0,
                xLength: 0,
                yLength: 0,
            };
        } else {
            intersection = {
                x: xMin,
                y: yMin,
                xLength: xMax - xMin,
                yLength: yMax - yMin,
            };
        }
    }
    return intersection;
}

export function rectangleDifference(a: Rectangle, b: Rectangle): RegionShape {
    if (rectangleArea(rectangleIntersection(a, b)) === 0) {
        // no intersection -> no difference
        return [a];
    }
    // Otherwise, there is some intersection

    // The difference `a \ b` is equivalent to the intersection `a intersect complement(B)`, and
    //  we know how to intersect. Thus we'll represent the set complement of b by four rectangles:
    //  top, left, bottom, right (as below), and intersect a with all of them to get the result.
    /*
        |------------------|
        |        top       |
        |------------------|
        | left | b | right |
        |------------------|
        |       bottom     |
        --------------------
     */
    // To avoid any problems with infinity, just take the set complement with respect to the bounding box of the two

    const boundingBox = getBoundingBox([a, b]);
    const setComplementOfB = [
        // top box
        {
            x: boundingBox.xRange.min,
            y: b.y + b.yLength,
            xLength: boundingBox.xLength,
            yLength: boundingBox.yRange.max - (b.y + b.yLength),
        },
        // left box
        {
            x: boundingBox.xRange.min,
            y: b.y,
            xLength: b.x - boundingBox.xRange.min,
            yLength: b.yLength,
        },
        // bottom box
        {
            x: boundingBox.xRange.min,
            y: boundingBox.yRange.min,
            xLength: boundingBox.xLength,
            yLength: b.y - boundingBox.yRange.min,
        },
        // right box
        {
            x: b.x + b.xLength,
            y: b.y,
            xLength: boundingBox.xRange.max - (b.x + b.xLength),
            yLength: b.yLength,
        },
    ];

    // Intersect a with each of those rectangles
    let intersection = setComplementOfB.map(rect =>
        rectangleIntersection(rect, a)
    );
    // filter out empty rectangles
    intersection = intersection.filter(r => rectangleArea(r) > 0);
    return intersection;
}

export function rectangleDifferenceMultiple(
    a: Rectangle,
    subRects: Rectangle[]
): RegionShape {
    let difference = [a];
    for (const subRect of subRects) {
        difference = _.flatMap(difference, rect =>
            rectangleDifference(rect, subRect)
        );
    }
    return difference;
}

export function getRegionArea(region: RegionShape) {
    return _.sumBy(region, rectangleArea);
}

export function getRegionShape(sets: string[], setRectangles: SetRectangles) {
    const intersectionRect = rectangleIntersection(
        ...sets.map(s => setRectangles[s])
    );

    const excludedRectangles = _.difference(
        Object.keys(setRectangles),
        sets
    ).map(uid => setRectangles[uid]);

    return rectangleDifferenceMultiple(intersectionRect, excludedRectangles);
}

export function getBoundingBox(rectangles: Rectangle[]) {
    const ret = {
        xRange: {
            min: Math.min(...rectangles.map(r => r.x)),
            max: Math.max(...rectangles.map(r => r.x + r.xLength)),
        },
        yRange: {
            min: Math.min(...rectangles.map(r => r.y)),
            max: Math.max(...rectangles.map(r => r.y + r.yLength)),
        },
        xLength: 0,
        yLength: 0,
    };
    ret.xLength = ret.xRange.max - ret.xRange.min;
    ret.yLength = ret.yRange.max - ret.yRange.min;
    return ret;
}
