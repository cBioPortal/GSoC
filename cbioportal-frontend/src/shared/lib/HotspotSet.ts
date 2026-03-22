/* HotspotSet
 *
 * This class is designed for quickly querying whether a mutation is a hotspot.
 * It's supported to query by a single residue position, or a range of residue positions,
 *  and it does a binary search to quickly check whether the input range or position
 *  overlaps with any hotspot regions specified in the constructor.
 *
 * The class does not support telling you exactly which input intervals are overlapped-with,
 *  that information is lost. But it will tell you true or false: whether there was some input interval
 *  that is overlapped-with.
 */
export default class HotspotSet {
    private regions: [number, number][];
    constructor(intervals?: [number, number][]) {
        // intervals: [L:number, U:number][] where L <= U
        this.regions = intervals ? createHotspotRegions(intervals) : [];
    }

    public check(x: number, y?: number): boolean {
        //	if only x given, check if x lies in a hotspot
        //	if x and y given, check if [x,y] overlaps with a hotspot,
        //	    meaning is there a region [A,B] with (A<=y && B>=x)

        if (typeof y === 'undefined') {
            y = x;
        }

        const regions = this.regions;
        let lowerIndexIncl = 0;
        let upperIndexExcl = regions.length;
        let testRegionIndex: number;
        let testRegion: [number, number];
        let success: boolean = false;
        while (lowerIndexIncl < upperIndexExcl) {
            testRegionIndex = Math.floor((lowerIndexIncl + upperIndexExcl) / 2);
            testRegion = regions[testRegionIndex];
            if (testRegion[0] > y) {
                // too big
                upperIndexExcl = testRegionIndex;
            } else if (testRegion[1] < x) {
                // too small
                lowerIndexIncl = testRegionIndex + 1;
            } else {
                // both requirements met - success!
                success = true;
                break;
            }
        }
        return success;
    }

    public add(x: number, y: number): void {
        this.regions.push([x, y]);
        this.regions = createHotspotRegions(this.regions);
    }

    public _getHotspotRegions() {
        // Do not use - for testing only
        return this.regions;
    }
}

function createHotspotRegions(
    intervals: [number, number][]
): [number, number][] {
    // in: intervals:[L:number, U:number][] where L <= U
    // out: a list of intervals (type [L:number, U:number][] where L <= U) such that
    //	every interval is disjoint and the list is in sorted order
    if (intervals.length === 0) {
        return [];
    }

    // First, sort the intervals by lower bound
    intervals.sort(function(a, b) {
        return a[0] < b[0] ? -1 : 1;
    });
    // Then, consolidate them
    const ret: [number, number][] = [];
    let currentCombinedInterval: [number, number] = [
        intervals[0][0],
        intervals[0][1],
    ];
    let currentInterval: [number, number];
    let i = 1;
    while (i <= intervals.length) {
        if (i === intervals.length) {
            ret.push(currentCombinedInterval);
        } else {
            currentInterval = intervals[i];
            if (currentInterval[0] > currentCombinedInterval[1]) {
                // disjoint, should move on
                ret.push(currentCombinedInterval);
                currentCombinedInterval = [intervals[i][0], intervals[i][1]];
            } else {
                // overlaps, should combine
                // by the sort order, we know that currentCombinedInterval[0] <= currentInterval[0],
                //	so to combine we just need to take the max upper bound value
                currentCombinedInterval[1] = Math.max(
                    currentCombinedInterval[1],
                    currentInterval[1]
                );
            }
        }
        i++;
    }

    return ret;
}
