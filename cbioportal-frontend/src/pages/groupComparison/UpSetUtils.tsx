export function getPlotDomain(
    xCount: number,
    yCount: number,
    categoryCoord: (categoryIndex: number) => number,
    calcXCoord: boolean = true,
    calcYCoord: boolean = true
) {
    let yDomain: number[];
    let xDomain: number[];
    if (xCount > 0) {
        xDomain = [
            categoryCoord(0),
            calcXCoord ? categoryCoord(Math.max(1, xCount - 1)) : xCount,
        ];
    } else {
        xDomain = [0, 0];
    }
    if (yCount > 0) {
        yDomain = [
            categoryCoord(0),
            calcYCoord ? categoryCoord(Math.max(1, yCount - 1)) : yCount,
        ];
    } else {
        yDomain = [0, 0];
    }

    return { x: xDomain, y: yDomain };
}
