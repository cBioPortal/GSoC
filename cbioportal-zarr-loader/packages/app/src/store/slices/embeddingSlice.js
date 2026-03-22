export const createEmbeddingSlice = (set, get) => ({
  // Obsm state
  selectedObsm: null,
  obsmData: null,
  obsmLoading: false,
  obsmTime: null,

  // Obsm streaming state
  obsmStreamingData: null,
  obsmStreamingLoading: false,
  obsmStreamingTime: null,
  obsmStreamingProgress: null,

  // Gene expression state (for scatterplot coloring)
  selectedGene: null,
  geneExpression: null,
  geneLoading: false,

  // Obs column for scatterplot coloring
  colorColumn: null,
  colorData: null,
  colorLoading: false,
  colorScaleName: "viridis",

  // Tooltip obs columns for scatterplot
  tooltipColumns: [],
  tooltipData: {},
  tooltipColumnLoading: null,

  // Selection state
  selectedPointIndices: [],
  selectionGeometry: null,

  fetchObsm: async (key) => {
    const { adata, obsIndex } = get();
    if (!adata) return;

    set({ selectedObsm: key, obsmLoading: true, obsmData: null });

    try {
      const start = performance.now();
      let index = obsIndex;
      if (!index) {
        index = await adata.obsNames();
        set({ obsIndex: index });
      }
      const result = await adata.obsm(key);
      set({
        obsmTime: performance.now() - start,
        obsmData: { ...result, index },
        obsmLoading: false,
      });
    } catch (err) {
      console.error(err);
      set({ obsmData: { error: err.message }, obsmLoading: false });
    }
  },

  fetchObsmStreaming: async (key) => {
    const { adata } = get();
    if (!adata) return;

    set({
      obsmStreamingData: null,
      obsmStreamingLoading: true,
      obsmStreamingTime: null,
      obsmStreamingProgress: 0,
    });

    try {
      const start = performance.now();
      let buffer = null;
      let nDims = 0;
      let loadedRows = 0;

      for await (const batch of adata.obsmStreaming(key)) {
        const { data, shape, offset, total } = batch;
        nDims = shape[1];

        if (!buffer) {
          buffer = new data.constructor(total * nDims);
        }

        buffer.set(data, offset * nDims);
        loadedRows = offset + shape[0];

        set({
          obsmStreamingData: { data: buffer, shape: [loadedRows, nDims] },
          obsmStreamingLoading: false,
          obsmStreamingProgress: loadedRows / total,
        });
      }

      set({
        obsmStreamingTime: performance.now() - start,
        obsmStreamingProgress: null,
      });
    } catch (err) {
      console.error(err);
      set({
        obsmStreamingData: { error: err.message },
        obsmStreamingLoading: false,
        obsmStreamingProgress: null,
      });
    }
  },

  setColorColumn: async (colName) => {
    const { adata } = get();

    if (!colName) {
      set({ colorColumn: null, colorData: null });
      return;
    }

    set({
      colorColumn: colName,
      colorLoading: true,
      selectedGene: null,
      geneExpression: null,
    });

    try {
      const values = await adata.obsColumn(colName);
      set({ colorData: values, colorLoading: false });
    } catch (err) {
      console.error(err);
      set({ colorData: null, colorLoading: false });
    }
  },

  setColorScaleName: (name) => set({ colorScaleName: name }),

  setSelectedGene: async (geneName) => {
    const { adata, metadata } = get();

    if (!geneName) {
      set({ selectedGene: null, geneExpression: null });
      return;
    }

    set({
      selectedGene: geneName,
      geneLoading: true,
      geneExpression: null,
      colorColumn: null,
      colorData: null,
    });

    try {
      const { varNames, geneNames } = metadata;

      let queryName = geneName;
      if (geneNames !== varNames) {
        const idx = geneNames.indexOf(geneName);
        if (idx !== -1) {
          queryName = varNames[idx];
        }
      }

      const values = await adata.geneExpression(queryName);
      set({ geneExpression: values, geneLoading: false });
    } catch (err) {
      console.error(err);
      set({ geneExpression: null, geneLoading: false });
    }
  },

  clearGeneSelection: () => {
    set({ selectedGene: null, geneExpression: null });
  },

  toggleTooltipColumn: async (colName) => {
    const { adata, tooltipColumns, tooltipData } = get();
    if (!adata) return;

    if (tooltipColumns.includes(colName)) {
      const { [colName]: _, ...rest } = tooltipData;
      set({
        tooltipColumns: tooltipColumns.filter((c) => c !== colName),
        tooltipData: rest,
      });
      return;
    }

    set({ tooltipColumnLoading: colName });
    try {
      const values = await adata.obsColumn(colName);
      const { tooltipColumns: current, tooltipData: currentData } = get();
      set({
        tooltipColumns: [...current, colName],
        tooltipData: { ...currentData, [colName]: values },
        tooltipColumnLoading: null,
      });
    } catch (err) {
      console.error(err);
      set({ tooltipColumnLoading: null });
    }
  },

  clearTooltipColumns: () => {
    set({ tooltipColumns: [], tooltipData: {} });
  },

  setSelectedPoints: (indices) => {
    set({ selectedPointIndices: indices });
  },

  setSelectionGeometry: (geometry) => set({ selectionGeometry: geometry }),

  clearSelectedPoints: () => {
    set({ selectedPointIndices: [], selectionGeometry: null });
  },
});
