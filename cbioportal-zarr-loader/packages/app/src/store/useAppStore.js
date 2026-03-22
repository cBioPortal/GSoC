import { create } from "zustand";
import { AnnDataStore } from "@cbioportal-zarr-loader/zarrstore";
import { fetchFeatureFlags } from "../utils/featureFlags";

import { createColumnsSlice } from "./slices/columnsSlice";
import { createEmbeddingSlice } from "./slices/embeddingSlice";
import { createPlotsSlice } from "./slices/plotsSlice";
import { createDotplotSlice } from "./slices/dotplotSlice";
import { createConfigSlice } from "./slices/configSlice";

const createCoreSlice = (set, get) => ({
  // Feature flags (fetched from GitHub, local fallback)
  featureFlags: {},

  // Core data
  url: null,
  adata: null,
  metadata: null,
  loading: true,
  error: null,
  pendingFilterConfig: null,

  // Cached indices
  obsIndex: null,
  varIndex: null,

  initialize: async (url) => {
    const timings = {};

    try {
      let start = performance.now();
      const [store, featureFlags] = await Promise.all([
        AnnDataStore.open(url),
        fetchFeatureFlags(),
      ]);
      timings.open = performance.now() - start;

      start = performance.now();
      const obsColumns = await store.obsColumns();
      timings.obsColumns = performance.now() - start;

      start = performance.now();
      const varColumns = await store.varColumns();
      timings.varColumns = performance.now() - start;

      start = performance.now();
      const obsmKeys = store.obsmKeys();
      timings.obsmKeys = performance.now() - start;

      start = performance.now();
      const layerKeys = store.layerKeys();
      timings.layerKeys = performance.now() - start;

      start = performance.now();
      const obsNames = await store.obsNames();
      timings.obsNames = performance.now() - start;

      start = performance.now();
      const varNames = await store.varNames();
      timings.varNames = performance.now() - start;

      // Try to get feature_name column for display
      let geneNames = varNames;
      try {
        const featureNames = await store.varColumn("feature_name");
        if (featureNames && featureNames.length === varNames.length) {
          geneNames = featureNames;
        }
      } catch {
        // feature_name column doesn't exist
      }

      // Get chunk size from X array
      let chunks = null;
      try {
        const xArray = await store.zarrStore.openArray("X");
        chunks = xArray.chunks;
      } catch {
        try {
          const dataArray = await store.zarrStore.openArray("X/data");
          chunks = dataArray.chunks;
        } catch {
          // Couldn't get chunks
        }
      }

      set({
        url,
        adata: store,
        metadata: { obsColumns, varColumns, obsmKeys, layerKeys, varNames, geneNames, timings, chunks },
        obsIndex: obsNames,
        varIndex: varNames,
        featureFlags,
        loading: false,
        error: null,
      });

      // Drain queued config that arrived before initialization completed
      const { pendingFilterConfig } = get();
      if (pendingFilterConfig) {
        console.debug("[CZL:postMessage] Applying queued config after initialization");
        set({ pendingFilterConfig: null });
        await get().applyFilterConfig(pendingFilterConfig);
      }
    } catch (err) {
      set({ error: err.message, loading: false });
      console.error(err);
    }
  },
});

const useAppStore = create((...a) => ({
  ...createCoreSlice(...a),
  ...createColumnsSlice(...a),
  ...createEmbeddingSlice(...a),
  ...createPlotsSlice(...a),
  ...createDotplotSlice(...a),
  ...createConfigSlice(...a),
}));

export default useAppStore;
