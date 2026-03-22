export {
  ColorBySchema,
  SelectionSchema,
  ViewSchema,
  DefaultsSchema,
  FilterSchema,
} from "../schemas/viewConfigSchemas";

/**
 * Find indices in columnData whose values match any of the filter values.
 */
export function findMatchingIndices(columnData, values) {
  const valueSet = new Set(values.map(String));
  const matchingIndices = [];
  for (let i = 0; i < columnData.length; i++) {
    if (valueSet.has(String(columnData[i]))) {
      matchingIndices.push(i);
    }
  }
  return matchingIndices;
}

/**
 * Resolve a view from saved_views by initial_view (name string or integer index).
 * Returns the matched view or null.
 */
export function resolveInitialView(initialView, savedViews) {
  if (typeof initialView === "number") {
    return initialView < savedViews.length ? savedViews[initialView] : null;
  }
  return savedViews.find(s => s.name === initialView) || null;
}

/**
 * Resolve view properties with defaults fallback.
 */
export function resolveViewWithDefaults(view, defaults = {}) {
  return {
    embeddingKey: view.embedding_key || defaults.embedding_key || null,
    activeTooltips: view.active_tooltips || defaults.active_tooltips || [],
    colorBy: view.color_by || defaults.color_by || null,
    selection: view.selection,
  };
}
