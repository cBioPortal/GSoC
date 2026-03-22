import _ from 'lodash';
import { Region, SetRectangles, Set } from './layout';
import {
    getBoundingBox,
    Rectangle,
    rectangleArea,
    rectangleIntersection,
} from './geometry';

export function adjustSizesForMinimumSizeRegions(
    regions: Region[],
    sets: Set[]
) {
    // Adjust sizes in order to not have regions that are too tiny to interact with/see.
    // The minimum region size is a fraction of the biggest set size.
    const biggestSetSize = Math.max(...sets.map(s => s.size));
    const minRegionSize = biggestSetSize / 30;

    sets = _.cloneDeep(sets);
    regions = _.cloneDeep(regions);

    const setsMap = _.keyBy(sets, s => s.uid);
    for (const region of regions) {
        // Adjust sizes of nonempty regions in a consistent way:
        //  When adding to a region in order to bring it to the minimum, it also implies
        //  adding to the size of the intersection of sets, and adding to the size of all
        //  the sets of the region.
        // This keeps the consistency of the sizes to represent mathematically valid set relationships.
        if (region.size > 0 && region.size < minRegionSize) {
            const addition = minRegionSize - region.size;
            region.size += addition;
            region.sizeOfIntersectionOfSets += addition;
            for (const setId of region.sets) {
                setsMap[setId].size += addition;
            }
        }
    }

    return { regions, sets };
}

export function getConnectedComponents(setRectangles: SetRectangles) {
    const components: { rectangles: Rectangle[] }[] = [];
    const rectangles = _.values(setRectangles);

    for (const rect of rectangles) {
        // We iterate through the rectangles
        // First we check if `rect` is intersecting with any connected component we've already tracked
        let added = false;
        for (const component of components) {
            if (
                _.some(
                    component.rectangles,
                    componentRect =>
                        rectangleArea(
                            rectangleIntersection(rect, componentRect)
                        ) > 0
                )
            ) {
                component.rectangles.push(rect);
                added = true;
            }
        }
        // If not, then add it to a new component
        if (!added) {
            components.push({
                rectangles: [rect],
            });
        }
    }
    return components;
}

export function layoutConnectedComponents(setRectangles: SetRectangles) {
    // layout connected components by their bounding boxes
    let connectedComponents = getConnectedComponents(setRectangles);

    if (connectedComponents.length > 1) {
        // only need to make a change if more than one connected component
        // Lay them out in the following way:
        //
        // If 2:
        //  BIGGEST    SMALLEST

        // If 3:
        //   BIGGEST   NEXT_BIGGEST
        //
        //   SMALLEST

        // First sort by size
        connectedComponents = _.sortBy(
            connectedComponents,
            component => -rectangleArea(getBoundingBox(component.rectangles))
        );
        const boundingBoxes = connectedComponents.map(component =>
            getBoundingBox(component.rectangles)
        );
        const xPadding =
            Math.max(
                ...boundingBoxes.map(box => box.xRange.max - box.xRange.min)
            ) / 10;
        const yPadding =
            Math.max(
                ...boundingBoxes.map(box => box.yRange.max - box.yRange.min)
            ) / 10;

        // select the target coordinates for the layout
        let targetCoordinates: { x: number; y: number }[] = [];
        switch (boundingBoxes.length) {
            case 2:
                targetCoordinates = [
                    { x: 0, y: 0 },
                    { x: boundingBoxes[0].xLength + xPadding, y: 0 },
                ];
                break;
            case 3:
                targetCoordinates = [
                    { x: 0, y: 0 },
                    {
                        x:
                            Math.max(
                                boundingBoxes[0].xLength,
                                boundingBoxes[2].xLength
                            ) + xPadding,
                        y: 0,
                    },
                    {
                        x: 0,
                        y:
                            Math.max(
                                boundingBoxes[0].yLength,
                                boundingBoxes[1].yLength
                            ) + yPadding,
                    },
                ];
                break;
        }

        // Calculate the offsets from the target coordinates and add those offsets to each rectangle in the connected component
        for (let i = 0; i < targetCoordinates.length; i++) {
            const xDiff = targetCoordinates[i].x - boundingBoxes[i].xRange.min;
            const yDiff = targetCoordinates[i].y - boundingBoxes[i].yRange.min;
            for (const rectangle of connectedComponents[i].rectangles) {
                rectangle.x += xDiff;
                rectangle.y += yDiff;
            }
        }
    }
}

export function scaleAndCenterLayout(
    layout: SetRectangles,
    width: number,
    height: number,
    padding: number
) {
    // Based on https://github.com/benfred/venn.js/blob/d5a47bd12140f95a17402c6356af4631f53a0723/src/layout.js#L635

    const rectangles = _.values(layout);
    const setIds = Object.keys(layout);

    width -= 2 * padding;
    height -= 2 * padding;

    const bounds = getBoundingBox(rectangles);
    const xRange = bounds.xRange;
    const yRange = bounds.yRange;

    if (xRange.max == xRange.min || yRange.max == yRange.min) {
        console.log('not scaling layout: zero size detected');
        return layout;
    }

    const xScaling = width / (xRange.max - xRange.min);
    const yScaling = height / (yRange.max - yRange.min);
    const scaling = Math.min(yScaling, xScaling);

    // while we're at it, center the diagram too
    const xOffset = (width - (xRange.max - xRange.min) * scaling) / 2;
    const yOffset = (height - (yRange.max - yRange.min) * scaling) / 2;

    const scaled: SetRectangles = {};
    for (let i = 0; i < rectangles.length; ++i) {
        const rect = rectangles[i];
        scaled[setIds[i]] = {
            xLength: scaling * rect.xLength,
            yLength: scaling * rect.yLength,
            x: padding + xOffset + (rect.x - xRange.min) * scaling,
            y: padding + yOffset + (rect.y - yRange.min) * scaling,
        };
    }

    return scaled;
}
