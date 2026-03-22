---
title: EmbeddingScatterplot Component
sidebar_position: 1
---

# EmbeddingScatterplot

An interactive 2-D embedding scatterplot built on [deck.gl](https://deck.gl). It renders dimensionality-reduction coordinates (UMAP, t-SNE, PCA, etc.) with support for categorical coloring, gene expression overlays, rectangle and lasso selection, hexbin density aggregation, hover tooltips, and a live selection summary panel.

The component is split into a **container** and a **presentational** component following the container/presentational pattern described below.

---

## Architecture: Container / Presentational Split

| File | Role |
|---|---|
| `packages/app/src/components/containers/EmbeddingScatterplotContainer.tsx` | Reads the Zustand store, runs all expensive `useMemo` derivations, and passes derived data down as props. |
| `packages/app/src/components/charts/EmbeddingScatterplot.tsx` | Pure presentational layer. Owns only local UI state (hover, expand, layer mode). Receives everything else through props. |

**Why the split?**

- The container is the only component that touches the store. Keeping store coupling in one place makes the presentational component independently testable — you can render it in isolation by supplying props without mocking Zustand.
- All CPU-intensive derivations (`buildScatterplotPoints`, `buildSelectionSummary`, `sortCategoriesByCount`, `computeRange`) live in the container behind `useMemo` so they only rerun when their specific dependencies change.

**Data flow:**

```
Zustand store
     |
     v
EmbeddingScatterplotContainer   <-- reads store, derives computed values
     |
     v (props)
EmbeddingScatterplot            <-- renders deck.gl canvas + UI chrome
     |
     v (callbacks)
Zustand store                   <-- setSelectedPoints, setSelectionGeometry, etc.
```

---

## Props Interface

### Passthrough Props

These are forwarded unchanged from the container to the presentational component. Callers supply them when rendering `EmbeddingScatterplotContainer`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `Float32Array` | required | Flat, row-major embedding coordinate array. Each row is one point; columns are embedding dimensions. The Y axis is flipped on read (`-data[i*cols+1]`) so that the orientation matches typical embedding plots. |
| `shape` | `[number, number]` | required | `[nRows, nCols]` — the logical shape of `data`. `nRows` is the cell count; `nCols` is the number of embedding dimensions (usually 2). |
| `label` | `string` | required | Embedding name shown as axis labels (`{label}_1`, `{label}_2`). |
| `maxPoints` | `number` | `Infinity` | Downsample threshold. When `nRows > maxPoints`, the container samples every `floor(nRows / maxPoints)`-th point before building the points array. Useful for very large datasets to keep rendering responsive. |
| `onSaveSelection` | `() => void` | `undefined` | Optional callback invoked when the user clicks the save icon in the selection badge. Intended to persist the current `selectionGeometry` to the view config. Only rendered when both `selectionGeometry` is non-null and this callback is provided. |
| `showHexbinToggle` | `boolean` | `false` | When `true`, a hexbin/scatter toggle button appears in the toolbar and the component starts in hexbin mode. |

### Container-Computed Props

Derived by the container from `data`, `shape`, and store state. Not intended to be supplied by callers directly.

| Prop | Type | Description |
|---|---|---|
| `points` | `ScatterPoint[]` | Array of parsed scatter points. Each point carries `{ position: [x, y], category, colorIndex, index, expression }`. Built by `buildScatterplotPoints`. |
| `categoryColorMap` | `Record<string, [number, number, number]>` | Maps each unique category string to an RGB color triple. Empty when no color column is active or when the column exceeds `MAX_CATEGORIES` unique values. |
| `bounds` | `ScatterBounds \| null` | Axis-aligned bounding box `{ minX, maxX, minY, maxY }` computed over all points. Drives initial zoom and aspect-ratio-preserving container sizing. |
| `expressionRange` | `ExpressionRange \| null` | `{ min, max }` of `geneExpression`. `null` when no gene is selected. Used to normalize expression values onto the color scale. |
| `selectedSet` | `Set<number>` | `selectedPointIndices` converted to a `Set` for O(1) membership tests during per-point color and radius lookups. |
| `hexColorConfig` | `Record<string, unknown>` | deck.gl `HexagonLayer` color props, keyed to the active `hexColorMode`. See [Hexbin Color Modes](#hexbin-color-modes). |
| `hexData` | `ScatterPoint[]` | Points fed to the `HexagonLayer`. Equals `points` when nothing is selected; equals the selected subset when a selection is active. |
| `sortedCategories` | `Array<[string, [number, number, number]]>` | Categories sorted by point count descending, paired with their RGB colors. Drives the `CollapsibleLegend`. |
| `selectionSummary` | `SelectionSummary` | Breakdowns over selected (or all) points: `categoryBreakdown`, `expressionStats`, and `tooltipBreakdowns`. Built by `buildSelectionSummary`. |
| `hasCategories` | `boolean` | `true` when `colorData` is present and `categoryColorMap` is non-empty. Guards categorical coloring paths throughout the presentational component. |
| `hexColorMode` | `HexColorMode` | One of `"expression"`, `"category"`, or `"density"`. Determines which `hexColorConfig` branch was built. |

### Store Read Props

Values read directly from the Zustand store by the container and forwarded to the presentational component.

| Prop | Type | Description |
|---|---|---|
| `colorColumn` | `string \| null` | Name of the obs column currently used for categorical coloring. |
| `colorData` | `unknown[] \| null` | Per-row values for `colorColumn`. |
| `selectedGene` | `string \| null` | Name of the gene whose expression is currently loaded. |
| `geneExpression` | `Float32Array \| null` | Per-row expression values for `selectedGene`. |
| `tooltipData` | `Record<string, unknown[]>` | Map of column name to per-row values for loaded tooltip columns. |
| `tooltipColumns` | `string[]` | Ordered list of columns currently shown in the hover tooltip. |
| `tooltipColumnLoading` | `string \| null` | Name of the column currently being fetched, shown as a loading indicator in the settings panel. |
| `metadata` | `{ obsColumns: string[] } \| null` | Dataset metadata. `obsColumns` populates the tooltip column selector. |
| `selectedPointIndices` | `number[]` | Array of selected point indices. Also drives the "N selected" badge. |
| `selectionGeometry` | `SelectionGeometry \| null` | The geometry of the last completed selection (rectangle or lasso polygon in world coordinates). Serialized into the view config when the user saves. |
| `colorScaleName` | `string` | Key into `COLOR_SCALES` for the active expression color scale (e.g. `"viridis"`). |

### Store Write Callbacks

Callbacks that write back to the Zustand store. Bound by the container from store actions; the presentational component calls them on user interaction.

| Prop | Type | Description |
|---|---|---|
| `setSelectedPoints` | `(indices: number[]) => void` | Replaces the selection with a new index array. Called by `useSelectionInteraction` on mouse-up after a completed rectangle or lasso gesture. |
| `clearSelectedPoints` | `() => void` | Resets `selectedPointIndices` to `[]` and clears `selectionGeometry`. Called by the close icon in the selection badge and when switching selection modes. |
| `setSelectionGeometry` | `(geo: SelectionGeometry \| null) => void` | Persists the completed selection geometry to the store. Called alongside `setSelectedPoints`. |
| `setColorScaleName` | `(name: string) => void` | Updates the active expression color scale. Called from the settings popover. |
| `toggleTooltipColumn` | `(col: string) => void` | Adds or removes a single column from the tooltip. The presentational component wraps this in `handleTooltipChange` to diff old vs. new multi-select values and call `toggleTooltipColumn` for each added/removed column. |

---

## Key Behaviors

### Selection Modes

Three modes are managed by the `useSelectionInteraction` hook. The active mode is local state inside the hook; the presentational component renders toolbar buttons to switch between them.

| Mode | Description |
|---|---|
| `pan` | Default. DeckGL drag-pan is enabled; mouse events are passed through to deck.gl. No selection interaction is active. |
| `rectangle` | Disables deck.gl drag-pan. On mouse-down, starts tracking a drag rectangle drawn via `SelectionOverlay`. On mouse-up, unprojects the screen rectangle to world coordinates and calls `setSelectedPoints` with all points whose position falls inside. The completed bounds are stored as `{ type: "rectangle", bounds: [minX, minY, maxX, maxY] }`. |
| `lasso` | Disables deck.gl drag-pan. Collects mouse positions as an SVG polyline while the button is held. On mouse-up, unprojects each vertex, runs a ray-casting point-in-polygon test against all scatter points, then stores the simplified polygon (Ramer-Douglas-Peucker, epsilon = 0.1% of bounding diagonal) as `{ type: "lasso", polygon: [...] }`. |

Switching to a selection mode clears any existing selection. Clicking the active mode button again reverts to `pan`.

### Hexbin vs. Scatter Layer Toggle

When `showHexbinToggle` is `true`, the component initializes in `layerMode = "hexbin"` and renders an Ant Design button that switches between `HexagonLayer` and `ScatterplotLayer`. When `showHexbinToggle` is `false`, the component is permanently in `layerMode = "scatter"`.

#### Hexbin Color Modes

The container selects one of three modes depending on what data is active, in priority order:

1. **`"expression"`** — `HexagonLayer` aggregates expression values by mean and colors bins using `colorScaleName` from `COLOR_SCALES`. `colorDomain` is set to the global `expressionRange`.
2. **`"category"`** — `HexagonLayer` finds the dominant category per bin and colors each bin using the same RGB palette as scatter mode, keeping color consistent when toggling layers.
3. **`"density"`** — No auxiliary data. A fixed 6-stop blue ramp encodes point count per bin.

### Hover Tooltips

Both layers are `pickable: true`. In scatter mode, `onHover` calls `setHoverInfo` with the `ScatterPoint` object. In hexbin mode, the `hexHover` callback constructs a `HexHoverObject`:

- **`hexCount`** — number of points in the bin.
- **`binIndices`** — point indices inside the bin (when deck.gl provides `points`).
- **`meanExpression`** — mean expression over bin points when `hexColorMode === "expression"`.
- **`dominantCategory` / `dominantCount`** — most common category and its count when `hexColorMode === "category"`.

The `HoverTooltip` component renders the tooltip positioned at `{ x, y }` screen coordinates.

### Expression Color Scales

When `geneExpression` is non-null, scatter points are colored by interpolating the selected `colorScaleName` scale between `expressionRange.min` (low) and `expressionRange.max` (high). The full list of available scales is the keys of `COLOR_SCALES` from `packages/app/src/utils/colors.js`.

A settings popover (gear icon, top-right corner of the canvas) exposes a `Select` dropdown to change the active scale. The popover only renders when `geneExpression` is non-null.

The `ExpressionLegend` component renders alongside the canvas whenever `geneExpression` and `expressionRange` are both non-null.

### Category Legend

When a color column is active and `sortedCategories` has more than one entry, a `CollapsibleLegend` is rendered to the right of the canvas. Hovering a category in the legend sets `hoveredCategory`, which causes the `ScatterplotLayer` to enlarge all matching points to radius 3 pixels (vs. the default 1 pixel). Non-hovered points are unaffected (radius and color remain unchanged).

The legend cap of `MAX_CATEGORIES` (10,000 unique values) prevents the categorical coloring path from running on effectively continuous columns. When a column exceeds this limit, the store still sets `colorData` but `categoryColorMap` is empty, `hasCategories` becomes `false`, and an Ant Design `Alert` is shown explaining the column cannot be used for categorical coloring.

### Selection Summary Panel

`SelectionSummaryPanel` renders to the right of the canvas at all times (not only during an active selection). Its content adapts:

- **No selection active** — shows breakdowns for the full dataset (all visible points).
- **Selection active** — shows breakdowns for only the selected subset.

The panel shows:

- **Category breakdown** — bar/list of category counts within the selection, when `hasCategories` is true.
- **Expression stats** — min, max, and mean for the selected points, when `geneExpression` is non-null.
- **Tooltip breakdowns** — per-column value-count breakdown for each loaded tooltip column.

Hovering a category row in the panel drives the same `hoveredCategory` state as the legend, highlighting matching points on the canvas. Hovering a tooltip value sets `hoveredTooltipFilter`, which highlights points where that column equals that value.

The panel also exposes a tooltip column selector backed by `metadata.obsColumns`. Adding or removing a column calls `toggleTooltipColumn` in the store.

### Sizing and Expand Mode

Container dimensions are recomputed on mount, on `bounds` change, and on window resize via `useLayoutEffect`. Dimensions are calculated by `calculatePlotDimensions` to preserve the aspect ratio of the embedding's bounding box while fitting within available space.

An expand toggle (top-right corner) switches between two size budgets:

| Mode | Max width | Max height | Min width |
|---|---|---|---|
| Normal | `min(parentWidth - 400, 800)` | 600 px | 400 px |
| Expanded | `min(parentWidth - 100, 1200)` | 900 px | 600 px |

The `DeckGL` component is re-keyed on size change (`key={width-height}`) to force a full remount, which prevents stale viewport state after resize.

---

## How the Container Wires Up to the Zustand Store

The container calls `useAppStore()` once and destructures all needed state and actions. Each derived value is wrapped in `useMemo` with a tightly scoped dependency array so renders triggered by unrelated store updates do not rerun expensive derivations.

```
useAppStore()
  colorColumn, colorData          --> buildScatterplotPoints --> points, categoryColorMap, bounds
  geneExpression                  --> computeRange           --> expressionRange
  selectedPointIndices            --> new Set(...)           --> selectedSet
  geneExpression, hexColorMode,
    colorScaleName, expressionRange,
    categoryColorMap              --> hexColorConfig
  points, selectedSet             --> filter                 --> hexData
  categoryColorMap, colorData,
    points                        --> sortCategoriesByCount  --> sortedCategories
  selectedSet, points, hasCategories,
    geneExpression, tooltipData   --> buildSelectionSummary  --> selectionSummary
```

The store actions `setSelectedPoints`, `clearSelectedPoints`, `setSelectionGeometry`, `setColorScaleName`, and `toggleTooltipColumn` are passed through as-is (no wrapping) since the presentational component calls them directly.

---

## Exported Types

These interfaces are exported from `EmbeddingScatterplot.tsx` and re-imported by the container.

```typescript
/** A single rendered point. */
interface ScatterPoint {
  position: [number, number];
  category: string;
  colorIndex: number;
  index: number;            // original row index in `data`
  expression: number | null;
}

/** Axis-aligned bounding box over all visible points. */
interface ScatterBounds {
  minX: number; maxX: number;
  minY: number; maxY: number;
}

/** Min/max of the active gene expression values. */
interface ExpressionRange {
  min: number;
  max: number;
}

/** Breakdown computed over selected (or all) points. */
interface SelectionSummary {
  categoryBreakdown: Array<[string, number]> | null;
  expressionStats: { min: number; max: number; mean: number; count: number } | null;
  tooltipBreakdowns: Record<string, Array<[string, number]>>;
}

/** Geometry persisted to the store after a completed selection gesture. */
type SelectionGeometry =
  | { type: "rectangle"; bounds: [number, number, number, number] }
  | { type: "lasso"; polygon: [number, number][] };

/** Which coloring strategy the HexagonLayer is using. */
type HexColorMode = "expression" | "category" | "density";
```

---

## Related Files

| File | Purpose |
|---|---|
| `packages/app/src/hooks/useSelectionInteraction.js` | Mouse event handlers for rectangle and lasso selection; owns the drag refs and SVG lasso overlay refs. |
| `packages/app/src/utils/scatterplotUtils.js` | `buildScatterplotPoints`, `buildSelectionSummary`, `computeRange`, `computeViewState`, `sortCategoriesByCount`, `buildHexCategoryColorConfig`, `getPointFillColor`, `pointInPolygon`, `simplifyPolygon`. |
| `packages/app/src/utils/colors.js` | `COLOR_SCALES` (expression color scales), `CATEGORICAL_COLORS` (palette for category coloring). |
| `packages/app/src/utils/calculatePlotDimensions.js` | Computes width/height that preserves data aspect ratio within available space. |
| `packages/app/src/components/ui/HoverTooltip.tsx` | Renders the floating tooltip on point/hex hover. |
| `packages/app/src/components/ui/ExpressionLegend.tsx` | Color scale legend shown when gene expression coloring is active. |
| `packages/app/src/components/ui/CollapsibleLegend.tsx` | Categorical color legend with hover-to-highlight. |
| `packages/app/src/components/ui/SelectionSummaryPanel.tsx` | Side panel with category, expression, and tooltip breakdowns. |
| `packages/app/src/components/ui/SelectionOverlay.tsx` | Absolutely-positioned `<div>` and SVG for the selection rectangle and lasso path. |
| `packages/app/src/store/useAppStore.js` | Zustand store that owns all selection, coloring, and tooltip state. |
