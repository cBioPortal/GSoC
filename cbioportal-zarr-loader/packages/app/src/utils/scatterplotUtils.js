import { CATEGORICAL_COLORS, interpolateColorScale } from "./colors";

/** Maximum number of unique categories to support for color-by columns.
 *  Columns with more unique values (e.g. continuous floats) are left uncolored. */
export const MAX_CATEGORIES = 10000;

/**
 * Ray-casting point-in-polygon test.
 * Returns true if the point (x, y) lies inside the polygon.
 *
 * @param {number} x
 * @param {number} y
 * @param {Array<[number, number]>} polygon - Array of [x, y] vertices
 * @returns {boolean}
 */
export function pointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Simplify a polygon using the Ramer-Douglas-Peucker algorithm.
 * Reduces dense lasso traces to a compact set of vertices while preserving shape.
 *
 * @param {Array<[number, number]>} polygon - Array of [x, y] vertices
 * @param {number} [epsilon] - Distance tolerance. If omitted, auto-computed as 0.1% of the bounding diagonal.
 * @returns {Array<[number, number]>} Simplified polygon
 */
export function simplifyPolygon(polygon, epsilon) {
  if (polygon.length <= 3) return polygon;

  if (epsilon === undefined) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of polygon) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const diagonal = Math.sqrt((maxX - minX) ** 2 + (maxY - minY) ** 2);
    epsilon = diagonal * 0.001;
  }

  return rdp(polygon, epsilon);
}

function rdp(points, epsilon) {
  let maxDist = 0;
  let maxIdx = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDist(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = rdp(points.slice(0, maxIdx + 1), epsilon);
    const right = rdp(points.slice(maxIdx), epsilon);
    return left.slice(0, -1).concat(right);
  }

  return [first, last];
}

function perpendicularDist(point, lineStart, lineEnd) {
  const [px, py] = point;
  const [x1, y1] = lineStart;
  const [x2, y2] = lineEnd;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
  return Math.abs(dy * px - dx * py + x2 * y1 - y2 * x1) / Math.sqrt(lenSq);
}

/**
 * Compute the min and max of a numeric array.
 *
 * @param {Float32Array|number[]|null} values
 * @returns {{ min: number, max: number } | null} null if values is falsy or empty
 */
export function computeRange(values) {
  if (!values || values.length === 0) return null;
  let min = Infinity, max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    const val = values[i];
    if (val < min) min = val;
    if (val > max) max = val;
  }
  return { min, max };
}

/**
 * Compute the initial view state (center target and zoom level) for an
 * orthographic scatterplot given data bounds and container dimensions.
 *
 * @param {Object|null} bounds - { minX, maxX, minY, maxY }
 * @param {{ width: number, height: number }} containerSize
 * @returns {{ target: [number, number], zoom: number }}
 */
export function computeViewState(bounds, containerSize) {
  if (!bounds) return { target: [0, 0], zoom: 0 };

  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const rangeX = bounds.maxX - bounds.minX;
  const rangeY = bounds.maxY - bounds.minY;
  const maxRange = Math.max(rangeX, rangeY);

  const viewSize = Math.min(containerSize.width, containerSize.height);
  const zoom = Math.log2(viewSize / maxRange) - 0.1;

  return {
    target: [centerX, centerY],
    zoom: Math.max(-5, Math.min(zoom, 10)),
  };
}

/**
 * Build scatter plot points, category color map, and bounds from raw embedding data.
 *
 * @param {Object} options
 * @param {Float32Array|number[]} options.data - Flat array of embedding values (row-major)
 * @param {[number, number]} options.shape - [nRows, nCols]
 * @param {number} [options.maxPoints=Infinity] - Downsample to at most this many points
 * @param {ArrayLike<*>|null} [options.colorData=null] - Per-row category values for coloring
 * @param {Float32Array|number[]|null} [options.geneExpression=null] - Per-row expression values
 * @returns {{ points: Array, categoryColorMap: Object, bounds: Object|null }}
 */
export function buildScatterplotPoints({
  data,
  shape,
  maxPoints = Infinity,
  colorData = null,
  geneExpression = null,
}) {
  if (!data || !shape) return { points: [], categoryColorMap: {}, bounds: null };

  const cols = shape[1];
  const step = Math.max(1, Math.floor(shape[0] / maxPoints));

  // Build category color map (for obs columns).
  // If the column has more unique values than MAX_CATEGORIES (e.g. a continuous
  // float column like "percent.rb"), skip categorical coloring to avoid
  // freezing the UI / blowing the call stack in deck.gl.
  let categories = new Map();
  if (colorData) {
    for (let i = 0; i < shape[0]; i += step) {
      const cat = String(colorData[i]);
      if (!categories.has(cat)) {
        if (categories.size >= MAX_CATEGORIES) {
          // Too many unique values — treat as uncategorized
          categories = new Map();
          break;
        }
        categories.set(cat, (categories.size % CATEGORICAL_COLORS.length));
      }
    }
  }

  // Build points array and calculate bounds
  const pts = [];
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (let i = 0; i < shape[0]; i += step) {
    const x = data[i * cols];
    const y = -data[i * cols + 1]; // Flip Y axis

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    const cat = colorData ? String(colorData[i]) : "All";
    const exprValue = geneExpression ? geneExpression[i] : null;

    pts.push({
      position: [x, y],
      category: cat,
      colorIndex: categories.get(cat) ?? 0,
      index: i,
      expression: exprValue,
    });
  }

  // Convert categories map to object for legend
  const colorMap = {};
  categories.forEach((colorIdx, cat) => {
    colorMap[cat] = CATEGORICAL_COLORS[colorIdx];
  });

  return {
    points: pts,
    categoryColorMap: colorMap,
    bounds: { minX, maxX, minY, maxY },
  };
}

/**
 * Compute a summary of the currently selected points, including
 * category breakdowns, expression statistics, and tooltip column breakdowns.
 *
 * @param {Object} options
 * @param {Set<number>} options.selectedSet - Set of selected point indices
 * @param {Array<{index: number, category: string, expression: number|null}>} options.points
 * @param {boolean} options.hasColorData - Whether color column data is active
 * @param {boolean} options.hasGeneExpression - Whether gene expression data is active
 * @param {Object<string, ArrayLike>} options.tooltipData - Map of column name to per-row values
 * @returns {null|{categoryBreakdown: Array|null, expressionStats: Object|null, tooltipBreakdowns: Object}}
 */
export function buildSelectionSummary({
  selectedSet,
  points,
  hasColorData,
  hasGeneExpression,
  tooltipData,
}) {
  const hasSelection = selectedSet.size > 0;
  const matchPoint = (pt) => !hasSelection || selectedSet.has(pt.index);

  // Category breakdown
  let categoryBreakdown = null;
  if (hasColorData) {
    const counts = {};
    for (const pt of points) {
      if (!matchPoint(pt)) continue;
      counts[pt.category] = (counts[pt.category] || 0) + 1;
    }
    categoryBreakdown = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  // Expression stats
  let expressionStats = null;
  if (hasGeneExpression) {
    let min = Infinity, max = -Infinity, sum = 0, count = 0;
    for (const pt of points) {
      if (!matchPoint(pt) || pt.expression == null) continue;
      const v = pt.expression;
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
      count++;
    }
    if (count > 0) {
      expressionStats = { min, max, mean: sum / count, count };
    }
  }

  // Tooltip column breakdowns
  const tooltipBreakdowns = {};
  for (const [col, values] of Object.entries(tooltipData)) {
    const counts = {};
    for (const pt of points) {
      if (!matchPoint(pt)) continue;
      const val = String(values[pt.index]);
      counts[val] = (counts[val] || 0) + 1;
    }
    tooltipBreakdowns[col] = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }

  return { categoryBreakdown, expressionStats, tooltipBreakdowns };
}

/**
 * Determine the fill color for a scatterplot point based on selection state,
 * gene expression, or categorical coloring.
 *
 * @param {Object} point - A scatterplot point with index, expression, colorIndex
 * @param {Object} options
 * @param {Set<number>} options.selectedSet - Currently selected point indices
 * @param {Float32Array|number[]|null} options.geneExpression - Per-row expression values
 * @param {{ min: number, max: number }|null} options.expressionRange - Range of expression values
 * @param {boolean} options.hasColorData - Whether categorical coloring is active
 * @param {Array} options.colorScale - Color scale array (e.g. COLOR_SCALES.viridis)
 * @returns {number[]} RGBA or RGB color array
 */
export function getPointFillColor(point, { selectedSet, geneExpression, expressionRange, hasColorData, colorScale }) {
  const dimmed = selectedSet.size > 0 && !selectedSet.has(point.index);
  if (dimmed) return [180, 180, 180, 60];

  if (geneExpression && expressionRange && expressionRange.max > expressionRange.min) {
    const t = (point.expression - expressionRange.min) / (expressionRange.max - expressionRange.min);
    return interpolateColorScale(t, colorScale);
  }
  if (hasColorData) {
    return CATEGORICAL_COLORS[point.colorIndex];
  }
  return [24, 144, 255];
}

/**
 * Build the hexbin color configuration for categorical coloring.
 * Reuses the same category→color mapping as scatter mode so colors stay
 * consistent when switching between scatter and hexbin views.
 *
 * @param {Object} categoryColorMap - Map of category name to RGB color array (from buildScatterplotPoints)
 * @returns {{ getColorValue: Function, colorRange: Array, colorDomain: [number, number], colorScaleType: string, _uniqueCats: string[] }}
 */
export function buildHexCategoryColorConfig(categoryColorMap) {
  const uniqueCats = Object.keys(categoryColorMap);
  const catToIndex = Object.fromEntries(uniqueCats.map((c, i) => [c, i]));
  const catColors = uniqueCats.map((c) => categoryColorMap[c]);
  return {
    getColorValue: (pts) => {
      const counts = {};
      for (const p of pts) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
      let maxCount = 0, dominant = pts[0].category;
      for (const [cat, cnt] of Object.entries(counts)) {
        if (cnt > maxCount) { maxCount = cnt; dominant = cat; }
      }
      return catToIndex[dominant] ?? 0;
    },
    colorRange: catColors,
    colorDomain: [0, catColors.length],
    colorScaleType: "quantize",
    _uniqueCats: uniqueCats,
  };
}

/**
 * Sort categories by point count descending for legend display.
 *
 * @param {Object} categoryColorMap - Map of category name to RGB color array
 * @param {Array} points - Array of scatterplot points with .category property
 * @returns {Array<[string, number[]]>} Sorted array of [category, colorArray] pairs
 */
export function sortCategoriesByCount(categoryColorMap, points) {
  if (Object.keys(categoryColorMap).length === 0) return [];
  const counts = {};
  for (const pt of points) {
    counts[pt.category] = (counts[pt.category] || 0) + 1;
  }
  return Object.entries(categoryColorMap)
    .sort((a, b) => (counts[b[0]] || 0) - (counts[a[0]] || 0));
}
