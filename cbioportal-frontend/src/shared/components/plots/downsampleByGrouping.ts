type DownsamplingTree<D extends { x: number; y: number }> = {
    summaryPoint: {
        data: D[];
        x: number;
        y: number;
    };
    upLeft?: DownsamplingTree<D>;
    downLeft?: DownsamplingTree<D>;
    upRight?: DownsamplingTree<D>;
    downRight?: DownsamplingTree<D>;
};

function makeTree(basePoint: { x: number; y: number }): DownsamplingTree<any> {
    return {
        summaryPoint: {
            data: [],
            x: basePoint.x,
            y: basePoint.y,
        },
    };
}

function distanceSquared(
    a: { x: number; y: number },
    b: { x: number; y: number },
    transform?: {
        x: (X: number) => number;
        y: (Y: number) => number;
    }
): number {
    const dx = transform ? transform.x(a.x) - transform.x(b.x) : a.x - b.x;
    const dy = transform ? transform.y(a.y) - transform.y(b.y) : a.y - b.y;
    return dx * dx + dy * dy;
}

export type DSData<D> = {
    x: number;
    y: number;
    data: D[];
};

export function downsampleByGrouping<D extends { x: number; y: number }>(
    data: D[],
    distanceThreshold: number,
    transform?: {
        x: (X: number) => number;
        y: (Y: number) => number;
    }
): DSData<D>[] {
    if (!data.length) {
        return [];
    }

    // build tree
    const tree: DownsamplingTree<D> = makeTree(data[0]);
    const squaredDistanceThreshold = distanceThreshold * distanceThreshold;

    for (const datum of data) {
        let currentNode = tree;
        while (
            distanceSquared(currentNode.summaryPoint, datum, transform) >
            squaredDistanceThreshold
        ) {
            const gtX = datum.x >= currentNode.summaryPoint.x;
            const gtY = datum.y >= currentNode.summaryPoint.y;
            if (gtX && gtY) {
                currentNode.upRight = currentNode.upRight || makeTree(datum);
                currentNode = currentNode.upRight!;
            } else if (gtX && !gtY) {
                currentNode.downRight =
                    currentNode.downRight || makeTree(datum);
                currentNode = currentNode.downRight!;
            } else if (!gtX && gtY) {
                currentNode.upLeft = currentNode.upLeft || makeTree(datum);
                currentNode = currentNode.upLeft!;
            } else {
                currentNode.downLeft = currentNode.downLeft || makeTree(datum);
                currentNode = currentNode.downLeft!;
            }
        }
        // at this point we're at a base point which is close enough to the point we're adding
        currentNode.summaryPoint.data.push(datum);
    }

    // traverse tree and output summary points
    const ret = [];
    const queue = [tree];
    while (queue.length > 0) {
        const currentNode = queue.pop()!;
        ret.push(currentNode.summaryPoint);
        if (currentNode.upRight) queue.push(currentNode.upRight);

        if (currentNode.downRight) queue.push(currentNode.downRight);

        if (currentNode.upLeft) queue.push(currentNode.upLeft);

        if (currentNode.downLeft) queue.push(currentNode.downLeft);
    }

    return ret;
}
