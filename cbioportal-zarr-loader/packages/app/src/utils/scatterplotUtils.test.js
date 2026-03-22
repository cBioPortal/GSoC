import { describe, it, expect } from "vitest";
import {
  pointInPolygon,
  simplifyPolygon,
  computeRange,
  computeViewState,
  buildScatterplotPoints,
  buildSelectionSummary,
  getPointFillColor,
  sortCategoriesByCount,
  buildHexCategoryColorConfig,
  MAX_CATEGORIES,
} from "./scatterplotUtils";
import { CATEGORICAL_COLORS, COLOR_SCALES, interpolateColorScale } from "./colors";

// ---------------------------------------------------------------------------
// pointInPolygon
// ---------------------------------------------------------------------------

// Unit square: (0,0), (4,0), (4,4), (0,4)
const square = [[0, 0], [4, 0], [4, 4], [0, 4]];

// Triangle: (0,0), (6,0), (3,6)
const triangle = [[0, 0], [6, 0], [3, 6]];

// L-shaped concave polygon
const lShape = [[0, 0], [4, 0], [4, 2], [2, 2], [2, 4], [0, 4]];

describe("pointInPolygon", () => {
  it("detects point inside a square", () => {
    expect(pointInPolygon(2, 2, square)).toBe(true);
  });

  it("detects point outside a square", () => {
    expect(pointInPolygon(5, 5, square)).toBe(false);
  });

  it("detects point inside a triangle", () => {
    expect(pointInPolygon(3, 2, triangle)).toBe(true);
  });

  it("detects point outside a triangle", () => {
    expect(pointInPolygon(0, 4, triangle)).toBe(false);
  });

  it("detects point inside concave polygon", () => {
    expect(pointInPolygon(1, 3, lShape)).toBe(true);
  });

  it("detects point in concavity as outside", () => {
    // (3, 3) is in the notch of the L — should be outside
    expect(pointInPolygon(3, 3, lShape)).toBe(false);
  });

  it("handles point far outside", () => {
    expect(pointInPolygon(100, 100, square)).toBe(false);
    expect(pointInPolygon(-1, -1, square)).toBe(false);
  });

  it("handles negative coordinates", () => {
    const centered = [[-2, -2], [2, -2], [2, 2], [-2, 2]];
    expect(pointInPolygon(0, 0, centered)).toBe(true);
    expect(pointInPolygon(-1, -1, centered)).toBe(true);
    expect(pointInPolygon(3, 3, centered)).toBe(false);
  });

  it("handles a degenerate polygon (fewer than 3 vertices)", () => {
    // A line segment isn't a polygon — point should be outside
    expect(pointInPolygon(1, 0, [[0, 0], [2, 0]])).toBe(false);
  });

  it("handles an empty polygon", () => {
    expect(pointInPolygon(0, 0, [])).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// simplifyPolygon
// ---------------------------------------------------------------------------

describe("simplifyPolygon", () => {
  it("returns polygon as-is when 3 or fewer points", () => {
    const tri = [[0, 0], [1, 0], [0, 1]];
    expect(simplifyPolygon(tri)).toEqual(tri);
  });

  it("removes collinear points", () => {
    // Straight line from (0,0) to (4,0) with intermediate points
    const line = [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]];
    const result = simplifyPolygon(line, 0.01);
    expect(result).toEqual([[0, 0], [4, 0]]);
  });

  it("preserves corners of a square", () => {
    // Square with many interpolated points along each edge
    const dense = [];
    for (let i = 0; i <= 10; i++) dense.push([i, 0]);
    for (let i = 0; i <= 10; i++) dense.push([10, i]);
    for (let i = 10; i >= 0; i--) dense.push([i, 10]);
    for (let i = 10; i >= 0; i--) dense.push([0, i]);
    const result = simplifyPolygon(dense, 0.01);
    // Should keep the 4 corners + closure
    expect(result.length).toBeLessThanOrEqual(5);
    expect(result[0]).toEqual([0, 0]);
    expect(result[result.length - 1]).toEqual([0, 0]);
  });

  it("reduces a dense polygon significantly", () => {
    // Circle approximated with 200 points
    const dense = [];
    for (let i = 0; i < 200; i++) {
      const angle = (2 * Math.PI * i) / 200;
      dense.push([Math.cos(angle) * 100, Math.sin(angle) * 100]);
    }
    const result = simplifyPolygon(dense);
    expect(result.length).toBeLessThan(dense.length);
    expect(result.length).toBeGreaterThan(3);
  });

  it("auto-computes epsilon from bounding box", () => {
    // Large-scale polygon should still simplify
    const dense = [];
    for (let i = 0; i < 100; i++) dense.push([i * 10, 0]);
    dense.push([990, 500]);
    const result = simplifyPolygon(dense);
    expect(result.length).toBeLessThan(dense.length);
  });
});

// ---------------------------------------------------------------------------
// computeRange
// ---------------------------------------------------------------------------

describe("computeRange", () => {
  it("returns null for null input", () => {
    expect(computeRange(null)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(computeRange(undefined)).toBeNull();
  });

  it("returns null for empty array", () => {
    expect(computeRange([])).toBeNull();
  });

  it("returns correct min and max for a regular array", () => {
    expect(computeRange([3, 1, 4, 1, 5, 9, 2, 6])).toEqual({ min: 1, max: 9 });
  });

  it("handles a single element", () => {
    expect(computeRange([42])).toEqual({ min: 42, max: 42 });
  });

  it("handles negative values", () => {
    expect(computeRange([-5, -1, -10, -3])).toEqual({ min: -10, max: -1 });
  });

  it("handles mixed positive and negative", () => {
    expect(computeRange([-2, 0, 3])).toEqual({ min: -2, max: 3 });
  });

  it("works with Float32Array", () => {
    const arr = new Float32Array([0.1, 0.9, 0.5]);
    const result = computeRange(arr);
    expect(result.min).toBeCloseTo(0.1);
    expect(result.max).toBeCloseTo(0.9);
  });

  it("handles all identical values", () => {
    expect(computeRange([7, 7, 7])).toEqual({ min: 7, max: 7 });
  });
});

// ---------------------------------------------------------------------------
// computeViewState
// ---------------------------------------------------------------------------

const squareBounds = { minX: 0, maxX: 100, minY: 0, maxY: 100 };
const wideBounds = { minX: -50, maxX: 50, minY: -10, maxY: 10 };
const squareContainer = { width: 600, height: 600 };

describe("computeViewState", () => {
  it("returns default state when bounds is null", () => {
    const result = computeViewState(null, squareContainer);
    expect(result).toEqual({ target: [0, 0], zoom: 0 });
  });

  it("centers target on the midpoint of bounds", () => {
    const { target } = computeViewState(squareBounds, squareContainer);
    expect(target).toEqual([50, 50]);
  });

  it("centers target with negative bounds", () => {
    const { target } = computeViewState(wideBounds, squareContainer);
    expect(target).toEqual([0, 0]);
  });

  it("uses the smaller container dimension for zoom", () => {
    const wide = { width: 1000, height: 400 };
    const tall = { width: 400, height: 1000 };
    const zoomWide = computeViewState(squareBounds, wide).zoom;
    const zoomTall = computeViewState(squareBounds, tall).zoom;
    // Both should use 400 as viewSize, so zoom should be the same
    expect(zoomWide).toBeCloseTo(zoomTall);
  });

  it("computes higher zoom for smaller data range", () => {
    const smallBounds = { minX: 0, maxX: 10, minY: 0, maxY: 10 };
    const largeBounds = { minX: 0, maxX: 1000, minY: 0, maxY: 1000 };
    const zoomSmall = computeViewState(smallBounds, squareContainer).zoom;
    const zoomLarge = computeViewState(largeBounds, squareContainer).zoom;
    expect(zoomSmall).toBeGreaterThan(zoomLarge);
  });

  it("clamps zoom to minimum of -5", () => {
    const hugeBounds = { minX: 0, maxX: 1e10, minY: 0, maxY: 1e10 };
    const { zoom } = computeViewState(hugeBounds, squareContainer);
    expect(zoom).toBe(-5);
  });

  it("clamps zoom to maximum of 10", () => {
    const tinyBounds = { minX: 0, maxX: 0.001, minY: 0, maxY: 0.001 };
    const { zoom } = computeViewState(tinyBounds, squareContainer);
    expect(zoom).toBe(10);
  });

  it("uses the larger data axis for zoom calculation", () => {
    const { zoom: zoomWide } = computeViewState(wideBounds, squareContainer);
    const { zoom: zoomSquare } = computeViewState(squareBounds, squareContainer);
    expect(zoomWide).toBeCloseTo(zoomSquare);
  });
});

// ---------------------------------------------------------------------------
// buildScatterplotPoints
// ---------------------------------------------------------------------------

// 4 points, 2 columns (x, y): row-major flat array
// Point 0: (1, 2), Point 1: (3, 4), Point 2: (5, 6), Point 3: (7, 8)
const data4x2 = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]);
const shape4x2 = [4, 2];

describe("buildScatterplotPoints", () => {
  it("returns empty result for null data", () => {
    const result = buildScatterplotPoints({ data: null, shape: [4, 2] });
    expect(result.points).toEqual([]);
    expect(result.bounds).toBeNull();
  });

  it("returns empty result for null shape", () => {
    const result = buildScatterplotPoints({ data: data4x2, shape: null });
    expect(result.points).toEqual([]);
    expect(result.bounds).toBeNull();
  });

  it("builds correct number of points", () => {
    const { points } = buildScatterplotPoints({ data: data4x2, shape: shape4x2 });
    expect(points).toHaveLength(4);
  });

  it("reads x from column 0 and flips y from column 1", () => {
    const { points } = buildScatterplotPoints({ data: data4x2, shape: shape4x2 });
    expect(points[0].position).toEqual([1, -2]);
    expect(points[1].position).toEqual([3, -4]);
    expect(points[2].position).toEqual([5, -6]);
    expect(points[3].position).toEqual([7, -8]);
  });

  it("preserves original row index on each point", () => {
    const { points } = buildScatterplotPoints({ data: data4x2, shape: shape4x2 });
    expect(points.map((p) => p.index)).toEqual([0, 1, 2, 3]);
  });

  it("computes correct bounds with flipped y", () => {
    const { bounds } = buildScatterplotPoints({ data: data4x2, shape: shape4x2 });
    expect(bounds.minX).toBe(1);
    expect(bounds.maxX).toBe(7);
    // y is flipped: -2, -4, -6, -8
    expect(bounds.minY).toBe(-8);
    expect(bounds.maxY).toBe(-2);
  });

  it("assigns category 'All' when no colorData", () => {
    const { points } = buildScatterplotPoints({ data: data4x2, shape: shape4x2 });
    for (const pt of points) {
      expect(pt.category).toBe("All");
    }
  });

  it("assigns categories from colorData", () => {
    const colorData = ["A", "B", "A", "C"];
    const { points, categoryColorMap } = buildScatterplotPoints({
      data: data4x2,
      shape: shape4x2,
      colorData,
    });
    expect(points[0].category).toBe("A");
    expect(points[1].category).toBe("B");
    expect(points[3].category).toBe("C");
    expect(Object.keys(categoryColorMap)).toEqual(["A", "B", "C"]);
  });

  it("maps category colors from CATEGORICAL_COLORS palette", () => {
    const colorData = ["X", "Y", "X", "Y"];
    const { categoryColorMap } = buildScatterplotPoints({
      data: data4x2,
      shape: shape4x2,
      colorData,
    });
    expect(categoryColorMap["X"]).toEqual(CATEGORICAL_COLORS[0]);
    expect(categoryColorMap["Y"]).toEqual(CATEGORICAL_COLORS[1]);
  });

  it("wraps color index when categories exceed palette size", () => {
    const n = CATEGORICAL_COLORS.length + 1;
    const flat = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      flat[i * 2] = i;
      flat[i * 2 + 1] = i;
    }
    const colorData = Array.from({ length: n }, (_, i) => `cat${i}`);
    const { categoryColorMap } = buildScatterplotPoints({
      data: flat,
      shape: [n, 2],
      colorData,
    });
    expect(categoryColorMap[`cat${CATEGORICAL_COLORS.length}`]).toEqual(CATEGORICAL_COLORS[0]);
  });

  it("attaches expression values from geneExpression", () => {
    const geneExpression = new Float32Array([0.1, 0.5, 0.9, 0.0]);
    const { points } = buildScatterplotPoints({
      data: data4x2,
      shape: shape4x2,
      geneExpression,
    });
    expect(points[0].expression).toBeCloseTo(0.1);
    expect(points[2].expression).toBeCloseTo(0.9);
  });

  it("sets expression to null when no geneExpression", () => {
    const { points } = buildScatterplotPoints({ data: data4x2, shape: shape4x2 });
    for (const pt of points) {
      expect(pt.expression).toBeNull();
    }
  });

  describe("downsampling via maxPoints", () => {
    const data10 = new Float32Array(20);
    for (let i = 0; i < 10; i++) {
      data10[i * 2] = i;
      data10[i * 2 + 1] = i * 10;
    }
    const shape10 = [10, 2];

    it("returns all points when maxPoints >= total", () => {
      const { points } = buildScatterplotPoints({ data: data10, shape: shape10, maxPoints: 100 });
      expect(points).toHaveLength(10);
    });

    it("downsamples when maxPoints < total", () => {
      const { points } = buildScatterplotPoints({ data: data10, shape: shape10, maxPoints: 5 });
      expect(points).toHaveLength(5);
      expect(points.map((p) => p.index)).toEqual([0, 2, 4, 6, 8]);
    });

    it("preserves correct positions after downsampling", () => {
      const { points } = buildScatterplotPoints({ data: data10, shape: shape10, maxPoints: 5 });
      expect(points[0].position[0]).toBe(0);
      expect(points[1].position[0]).toBe(2);
    });
  });

  it("returns empty categoryColorMap when unique values exceed MAX_CATEGORIES", () => {
    const n = MAX_CATEGORIES + 10;
    const flat = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      flat[i * 2] = i;
      flat[i * 2 + 1] = i;
    }
    // Every row has a unique category value (simulates a continuous float column)
    const colorData = Array.from({ length: n }, (_, i) => `val${i}`);
    const { categoryColorMap, points } = buildScatterplotPoints({
      data: flat,
      shape: [n, 2],
      colorData,
    });
    expect(Object.keys(categoryColorMap)).toHaveLength(0);
    // Points should still be built
    expect(points).toHaveLength(n);
  });

  it("keeps categoryColorMap when unique values are within MAX_CATEGORIES", () => {
    const colorData = ["A", "B", "A", "C"];
    const { categoryColorMap } = buildScatterplotPoints({
      data: data4x2,
      shape: shape4x2,
      colorData,
    });
    expect(Object.keys(categoryColorMap).length).toBeGreaterThan(0);
    expect(Object.keys(categoryColorMap)).toEqual(["A", "B", "C"]);
  });
});

// ---------------------------------------------------------------------------
// buildSelectionSummary
// ---------------------------------------------------------------------------

const selPoints = [
  { index: 0, category: "A", expression: 1.0 },
  { index: 1, category: "B", expression: 2.0 },
  { index: 2, category: "A", expression: 3.0 },
  { index: 3, category: "C", expression: 4.0 },
  { index: 4, category: "B", expression: 5.0 },
];

const defaults = {
  points: selPoints,
  hasColorData: false,
  hasGeneExpression: false,
  tooltipData: {},
};

describe("buildSelectionSummary", () => {
  it("returns summary of all points when nothing is selected", () => {
    const result = buildSelectionSummary({ ...defaults, selectedSet: new Set() });
    expect(result).not.toBeNull();
    expect(result.categoryBreakdown).toBeNull();
    expect(result.expressionStats).toBeNull();
    expect(result.tooltipBreakdowns).toEqual({});
  });

  it("includes category breakdown of all points when nothing is selected and hasColorData", () => {
    const result = buildSelectionSummary({ ...defaults, selectedSet: new Set(), hasColorData: true });
    expect(result.categoryBreakdown).toEqual([["A", 2], ["B", 2], ["C", 1]]);
  });

  describe("categoryBreakdown", () => {
    it("is null when hasColorData is false", () => {
      const result = buildSelectionSummary({
        ...defaults,
        selectedSet: new Set([0, 1]),
        hasColorData: false,
      });
      expect(result.categoryBreakdown).toBeNull();
    });

    it("counts categories for selected points only", () => {
      const result = buildSelectionSummary({
        ...defaults,
        selectedSet: new Set([0, 2, 3]),
        hasColorData: true,
      });
      expect(result.categoryBreakdown).toEqual([["A", 2], ["C", 1]]);
    });

    it("sorts categories by count descending", () => {
      const result = buildSelectionSummary({
        ...defaults,
        selectedSet: new Set([0, 1, 2, 3, 4]),
        hasColorData: true,
      });
      const counts = result.categoryBreakdown.map(([, c]) => c);
      for (let i = 1; i < counts.length; i++) {
        expect(counts[i]).toBeLessThanOrEqual(counts[i - 1]);
      }
    });
  });

  describe("expressionStats", () => {
    it("is null when hasGeneExpression is false", () => {
      const result = buildSelectionSummary({
        ...defaults,
        selectedSet: new Set([0, 1]),
        hasGeneExpression: false,
      });
      expect(result.expressionStats).toBeNull();
    });

    it("computes min, max, mean, count for selected points", () => {
      const result = buildSelectionSummary({
        ...defaults,
        selectedSet: new Set([1, 2, 3]),
        hasGeneExpression: true,
      });
      expect(result.expressionStats).toEqual({
        min: 2.0,
        max: 4.0,
        mean: 3.0,
        count: 3,
      });
    });

    it("skips points with null expression", () => {
      const mixedPoints = [
        { index: 0, category: "A", expression: null },
        { index: 1, category: "A", expression: 10 },
        { index: 2, category: "A", expression: 20 },
      ];
      const result = buildSelectionSummary({
        ...defaults,
        points: mixedPoints,
        selectedSet: new Set([0, 1, 2]),
        hasGeneExpression: true,
      });
      expect(result.expressionStats).toEqual({
        min: 10,
        max: 20,
        mean: 15,
        count: 2,
      });
    });

    it("is null when all selected expressions are null", () => {
      const nullPoints = [
        { index: 0, category: "A", expression: null },
        { index: 1, category: "A", expression: null },
      ];
      const result = buildSelectionSummary({
        ...defaults,
        points: nullPoints,
        selectedSet: new Set([0, 1]),
        hasGeneExpression: true,
      });
      expect(result.expressionStats).toBeNull();
    });
  });

  describe("tooltipBreakdowns", () => {
    it("is empty object when no tooltipData", () => {
      const result = buildSelectionSummary({
        ...defaults,
        selectedSet: new Set([0]),
        tooltipData: {},
      });
      expect(result.tooltipBreakdowns).toEqual({});
    });

    it("counts values per tooltip column for selected points", () => {
      const tooltipData = {
        tissue: ["brain", "liver", "brain", "lung", "liver"],
      };
      const result = buildSelectionSummary({
        ...defaults,
        selectedSet: new Set([0, 1, 2]),
        tooltipData,
      });
      expect(result.tooltipBreakdowns.tissue).toEqual([["brain", 2], ["liver", 1]]);
    });

    it("handles multiple tooltip columns", () => {
      const tooltipData = {
        tissue: ["brain", "liver", "brain"],
        stage: ["I", "II", "I"],
      };
      const result = buildSelectionSummary({
        ...defaults,
        points: selPoints.slice(0, 3),
        selectedSet: new Set([0, 1, 2]),
        tooltipData,
      });
      expect(Object.keys(result.tooltipBreakdowns)).toEqual(["tissue", "stage"]);
    });

    it("sorts breakdown values by count descending", () => {
      const tooltipData = {
        status: ["x", "y", "x", "x", "y"],
      };
      const result = buildSelectionSummary({
        ...defaults,
        selectedSet: new Set([0, 1, 2, 3, 4]),
        tooltipData,
      });
      expect(result.tooltipBreakdowns.status[0]).toEqual(["x", 3]);
      expect(result.tooltipBreakdowns.status[1]).toEqual(["y", 2]);
    });
  });
});

// ---------------------------------------------------------------------------
// getPointFillColor
// ---------------------------------------------------------------------------

const colorOpts = {
  selectedSet: new Set(),
  geneExpression: null,
  expressionRange: null,
  hasColorData: false,
  colorScale: COLOR_SCALES.viridis,
};

describe("getPointFillColor", () => {
  it("returns default blue when no coloring is active", () => {
    const point = { index: 0, expression: null, colorIndex: 0 };
    expect(getPointFillColor(point, colorOpts)).toEqual([24, 144, 255]);
  });

  it("returns dimmed color when point is not in selection", () => {
    const point = { index: 0, expression: null, colorIndex: 0 };
    const opts = { ...colorOpts, selectedSet: new Set([1, 2]) };
    expect(getPointFillColor(point, opts)).toEqual([180, 180, 180, 60]);
  });

  it("returns full color when point is in selection", () => {
    const point = { index: 1, expression: null, colorIndex: 0 };
    const opts = { ...colorOpts, selectedSet: new Set([1, 2]) };
    // Not dimmed, no expression, no color data → default blue
    expect(getPointFillColor(point, opts)).toEqual([24, 144, 255]);
  });

  it("returns categorical color when hasColorData is true", () => {
    const point = { index: 0, expression: null, colorIndex: 2 };
    const opts = { ...colorOpts, hasColorData: true };
    expect(getPointFillColor(point, opts)).toEqual(CATEGORICAL_COLORS[2]);
  });

  it("returns expression-based color when gene expression is active", () => {
    const expr = new Float32Array([0, 5, 10]);
    const range = { min: 0, max: 10 };
    const point = { index: 1, expression: 5, colorIndex: 0 };
    const opts = {
      ...colorOpts,
      geneExpression: expr,
      expressionRange: range,
      colorScale: COLOR_SCALES.viridis,
    };
    const result = getPointFillColor(point, opts);
    // t = 0.5, should match interpolateColorScale at midpoint
    expect(result).toEqual(interpolateColorScale(0.5, COLOR_SCALES.viridis));
  });

  it("expression coloring takes priority over categorical", () => {
    const expr = new Float32Array([0, 10]);
    const range = { min: 0, max: 10 };
    const point = { index: 0, expression: 0, colorIndex: 3 };
    const opts = {
      ...colorOpts,
      geneExpression: expr,
      expressionRange: range,
      hasColorData: true,
      colorScale: COLOR_SCALES.viridis,
    };
    const result = getPointFillColor(point, opts);
    // Should use expression (t=0), not categorical
    expect(result).toEqual(interpolateColorScale(0, COLOR_SCALES.viridis));
  });

  it("falls back to categorical when expression range is flat", () => {
    const expr = new Float32Array([5, 5]);
    const range = { min: 5, max: 5 };
    const point = { index: 0, expression: 5, colorIndex: 1 };
    const opts = {
      ...colorOpts,
      geneExpression: expr,
      expressionRange: range,
      hasColorData: true,
    };
    // max === min, so expression branch is skipped
    expect(getPointFillColor(point, opts)).toEqual(CATEGORICAL_COLORS[1]);
  });

  it("dimming takes priority over all other coloring", () => {
    const expr = new Float32Array([0, 10]);
    const range = { min: 0, max: 10 };
    const point = { index: 0, expression: 0, colorIndex: 0 };
    const opts = {
      ...colorOpts,
      selectedSet: new Set([1]),
      geneExpression: expr,
      expressionRange: range,
      hasColorData: true,
    };
    expect(getPointFillColor(point, opts)).toEqual([180, 180, 180, 60]);
  });
});

// ---------------------------------------------------------------------------
// sortCategoriesByCount
// ---------------------------------------------------------------------------

describe("sortCategoriesByCount", () => {
  it("returns empty array for empty categoryColorMap", () => {
    expect(sortCategoriesByCount({}, [])).toEqual([]);
  });

  it("sorts categories by point count descending", () => {
    const colorMap = {
      A: [255, 0, 0],
      B: [0, 255, 0],
      C: [0, 0, 255],
    };
    const pts = [
      { category: "B" },
      { category: "A" },
      { category: "B" },
      { category: "C" },
      { category: "B" },
    ];
    const result = sortCategoriesByCount(colorMap, pts);
    expect(result).toEqual([
      ["B", [0, 255, 0]],
      ["A", [255, 0, 0]],
      ["C", [0, 0, 255]],
    ]);
  });

  it("preserves color arrays in output", () => {
    const colorMap = { X: [10, 20, 30] };
    const pts = [{ category: "X" }];
    const result = sortCategoriesByCount(colorMap, pts);
    expect(result[0][1]).toEqual([10, 20, 30]);
  });

  it("handles categories in colorMap with zero points", () => {
    const colorMap = {
      A: [255, 0, 0],
      B: [0, 255, 0],
    };
    const pts = [{ category: "A" }, { category: "A" }];
    const result = sortCategoriesByCount(colorMap, pts);
    // A has 2, B has 0
    expect(result[0][0]).toBe("A");
    expect(result[1][0]).toBe("B");
  });

  it("handles single category", () => {
    const colorMap = { Only: [1, 2, 3] };
    const pts = [{ category: "Only" }, { category: "Only" }];
    const result = sortCategoriesByCount(colorMap, pts);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(["Only", [1, 2, 3]]);
  });
});

// ---------------------------------------------------------------------------
// buildHexCategoryColorConfig
// ---------------------------------------------------------------------------

describe("buildHexCategoryColorConfig", () => {
  it("uses the same colors as the categoryColorMap from scatter mode", () => {
    // Categories encountered in data order: C, A, B
    const colorData = ["C", "A", "B", "C", "A", "B"];
    const data = new Float32Array([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
    const { categoryColorMap } = buildScatterplotPoints({
      data,
      shape: [6, 2],
      colorData,
    });

    const hexConfig = buildHexCategoryColorConfig(categoryColorMap);

    // colorRange should match the scatter mode colors in the same category order
    const cats = Object.keys(categoryColorMap);
    for (let i = 0; i < cats.length; i++) {
      expect(hexConfig.colorRange[i]).toEqual(categoryColorMap[cats[i]]);
    }
  });

  it("preserves encounter-order colors, not alphabetical order", () => {
    // Data encounters "Zebra" first, then "Apple" — Zebra should get color index 0
    const colorData = ["Zebra", "Apple", "Zebra", "Apple"];
    const data = new Float32Array([0, 0, 1, 1, 2, 2, 3, 3]);
    const { categoryColorMap } = buildScatterplotPoints({
      data,
      shape: [4, 2],
      colorData,
    });

    const hexConfig = buildHexCategoryColorConfig(categoryColorMap);

    // Zebra was encountered first → should get CATEGORICAL_COLORS[0]
    expect(categoryColorMap["Zebra"]).toEqual(CATEGORICAL_COLORS[0]);
    expect(categoryColorMap["Apple"]).toEqual(CATEGORICAL_COLORS[1]);

    // Hex config should use the same mapping
    const zebraIdx = hexConfig._uniqueCats.indexOf("Zebra");
    const appleIdx = hexConfig._uniqueCats.indexOf("Apple");
    expect(hexConfig.colorRange[zebraIdx]).toEqual(CATEGORICAL_COLORS[0]);
    expect(hexConfig.colorRange[appleIdx]).toEqual(CATEGORICAL_COLORS[1]);
  });

  it("getColorValue returns index of the dominant category in a bin", () => {
    const categoryColorMap = {
      A: CATEGORICAL_COLORS[0],
      B: CATEGORICAL_COLORS[1],
      C: CATEGORICAL_COLORS[2],
    };
    const hexConfig = buildHexCategoryColorConfig(categoryColorMap);

    // Bin with 3 B's and 1 A → dominant is B (index 1)
    const binPoints = [
      { category: "B" },
      { category: "A" },
      { category: "B" },
      { category: "B" },
    ];
    expect(hexConfig.getColorValue(binPoints)).toBe(1);
  });

  it("sets correct colorDomain based on number of categories", () => {
    const categoryColorMap = {
      X: [1, 2, 3],
      Y: [4, 5, 6],
      Z: [7, 8, 9],
    };
    const hexConfig = buildHexCategoryColorConfig(categoryColorMap);
    expect(hexConfig.colorDomain).toEqual([0, 3]);
    expect(hexConfig.colorScaleType).toBe("quantize");
  });

  it("handles a single category", () => {
    const categoryColorMap = { Only: CATEGORICAL_COLORS[0] };
    const hexConfig = buildHexCategoryColorConfig(categoryColorMap);
    expect(hexConfig.colorRange).toEqual([CATEGORICAL_COLORS[0]]);
    expect(hexConfig.colorDomain).toEqual([0, 1]);
    expect(hexConfig._uniqueCats).toEqual(["Only"]);
  });
});
