import {
  FilterSchema,
  findMatchingIndices,
  resolveInitialView,
  resolveViewWithDefaults,
} from "../../utils/filterUtils";
import {
  pointInPolygon,
  buildScatterplotPoints,
} from "../../utils/scatterplotUtils";

export const createConfigSlice = (set, get) => ({
  // View config state (from JSON config or postMessage)
  filterJson: "",
  viewConfigDefaults: {},
  appliedSelections: [],
  activeSelectionIndex: undefined,

  // Apply a single resolved view (embedding, tooltips, color, selection)
  applyView: async (view) => {
    const defaults = get().viewConfigDefaults;
    const resolved = resolveViewWithDefaults(view, defaults);
    const { adata } = get();

    // Load embedding (skip if already on the same key)
    if (resolved.embeddingKey && resolved.embeddingKey !== get().selectedObsm) {
      await get().fetchObsm(resolved.embeddingKey);
    }

    const selection = resolved.selection;
    const selType = selection.type || "category";

    // Build the set of obs columns to fetch in parallel
    const tooltipCols = selType === "category"
      ? [...new Set([selection.target, ...resolved.activeTooltips])]
      : [...resolved.activeTooltips];

    // Determine color_by fetch
    const colorByCategoryCol = resolved.colorBy?.type === "category" ? resolved.colorBy.value : null;
    let geneQueryName = null;
    if (resolved.colorBy?.type === "gene") {
      const { geneNames, varNames } = get().metadata;
      const match = geneNames.find(g => g.toLowerCase() === resolved.colorBy.value.toLowerCase());
      if (match) {
        geneQueryName = match;
        if (geneNames !== varNames) {
          const idx = geneNames.indexOf(match);
          if (idx !== -1) geneQueryName = varNames[idx];
        }
      }
    }

    // Fetch all obs columns + color/gene in parallel
    const allObsCols = [...new Set([...tooltipCols, ...(colorByCategoryCol ? [colorByCategoryCol] : [])])];
    const fetches = allObsCols.map(col => adata.obsColumn(col).catch(() => null));
    if (geneQueryName) {
      fetches.push(adata.geneExpression(geneQueryName).catch(() => null));
    }

    const results = await Promise.all(fetches);

    // Unpack obs column results
    const obsResults = {};
    allObsCols.forEach((col, i) => { obsResults[col] = results[i]; });

    // Apply tooltips — single store write
    const newTooltipData = {};
    for (const col of tooltipCols) {
      if (obsResults[col]) newTooltipData[col] = obsResults[col];
    }
    set({ tooltipColumns: tooltipCols, tooltipData: newTooltipData, tooltipColumnLoading: null });

    // Apply color_by
    if (colorByCategoryCol && obsResults[colorByCategoryCol]) {
      set({
        colorColumn: colorByCategoryCol,
        colorData: obsResults[colorByCategoryCol],
        colorLoading: false,
        selectedGene: null,
        geneExpression: null,
      });
    } else if (geneQueryName) {
      const geneValues = results[results.length - 1];
      if (geneValues) {
        set({
          selectedGene: resolved.colorBy.value,
          geneExpression: geneValues,
          geneLoading: false,
          colorColumn: null,
          colorData: null,
        });
      }
    }
    if (resolved.colorBy?.color_scale) {
      set({ colorScaleName: resolved.colorBy.color_scale });
    }

    // Apply selection
    if (selType === "category") {
      const columnData = obsResults[selection.target];
      if (!columnData) return;
      const matchingIndices = findMatchingIndices(columnData, selection.values);
      set({ selectionGeometry: null, selectedPointIndices: matchingIndices });
    } else if (selType === "rectangle" || selType === "lasso") {
      const currentObsm = get().obsmData;
      if (!currentObsm?.data || !currentObsm?.shape) return;

      const { points } = buildScatterplotPoints({
        data: currentObsm.data,
        shape: currentObsm.shape,
      });

      const indices = [];
      if (selType === "rectangle") {
        const [minX, minY, maxX, maxY] = selection.bounds;
        for (const pt of points) {
          const [px, py] = pt.position;
          if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
            indices.push(pt.index);
          }
        }
        set({ selectionGeometry: { type: "rectangle", bounds: selection.bounds } });
      } else {
        for (const pt of points) {
          const [px, py] = pt.position;
          if (pointInPolygon(px, py, selection.polygon)) {
            indices.push(pt.index);
          }
        }
        set({ selectionGeometry: { type: "lasso", polygon: selection.polygon } });
      }

      set({ selectedPointIndices: indices });
    }
  },

  // Validate raw config, resolve initial view, apply it, and populate selections
  applyFilterConfig: async (raw) => {
    try {
      const { adata, loading } = get();
      if (!adata || loading) {
        console.debug("[CZL:postMessage] Store not ready, queuing config for after initialization");
        set({ pendingFilterConfig: raw });
        return { success: true, queued: true };
      }

      const result = FilterSchema.safeParse(raw);
      if (!result.success) {
        const errorMsg = result.error.issues.map(i => i.message).join("; ");
        return { success: false, error: errorMsg };
      }

      const { defaults: parsedDefaults = {}, initial_view, saved_views } = result.data;
      set({ viewConfigDefaults: parsedDefaults, filterJson: JSON.stringify(raw, null, 2) });

      const initialMatch = resolveInitialView(initial_view, saved_views);
      if (!initialMatch) {
        const msg = typeof initial_view === "number"
          ? `Index ${initial_view} out of range (${saved_views.length} saved views, use 0-${saved_views.length - 1})`
          : `View "${initial_view}" not found in saved_views`;
        return { success: false, error: msg };
      }

      await get().applyView(initialMatch);

      set({
        appliedSelections: saved_views,
        activeSelectionIndex: saved_views.indexOf(initialMatch),
      });

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  setActiveSelectionIndex: (index) => set({ activeSelectionIndex: index }),

  setAppliedSelections: (selections) => set({ appliedSelections: selections }),

  setFilterJson: (json) => set({ filterJson: json }),
});
