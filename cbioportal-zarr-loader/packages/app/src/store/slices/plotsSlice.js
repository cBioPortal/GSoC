export const createPlotsSlice = (set, get) => ({
  // Plots tab state (independent of scatterplot coloring)
  plotGene: null,
  plotGeneExpression: null,
  plotGeneLoading: false,
  plotObsColumn: null,
  plotObsData: null,
  plotObsLoading: false,

  setPlotGene: async (geneName) => {
    const { adata, metadata } = get();
    if (!adata || !geneName) return;

    console.debug("[PlotsTab] setPlotGene called:", geneName);
    set({ plotGene: geneName, plotGeneLoading: true, plotGeneExpression: null });

    try {
      const { varNames, geneNames } = metadata;

      let queryName = geneName;
      if (geneNames !== varNames) {
        const idx = geneNames.indexOf(geneName);
        if (idx !== -1) {
          queryName = varNames[idx];
        }
      }

      console.debug("[PlotsTab] Fetching gene expression for queryName:", queryName);
      const values = await adata.geneExpression(queryName);
      console.debug("[PlotsTab] Gene expression fetched, length:", values?.length, "sample:", values?.slice(0, 5));
      set({ plotGeneExpression: values, plotGeneLoading: false });
    } catch (err) {
      console.error("[PlotsTab] Gene expression fetch error:", err);
      set({ plotGeneExpression: null, plotGeneLoading: false });
    }
  },

  clearPlotGene: () => {
    set({ plotGene: null, plotGeneExpression: null });
  },

  setPlotObsColumn: async (colName) => {
    const { adata } = get();
    if (!adata || !colName) return;

    console.debug("[PlotsTab] setPlotObsColumn called:", colName);
    set({ plotObsColumn: colName, plotObsLoading: true, plotObsData: null });

    try {
      console.debug("[PlotsTab] Fetching obs column:", colName);
      const values = await adata.obsColumn(colName);
      console.debug("[PlotsTab] Obs column fetched, length:", values?.length, "sample:", values?.slice(0, 5));
      set({ plotObsData: values, plotObsLoading: false });
    } catch (err) {
      console.error("[PlotsTab] Obs column fetch error:", err);
      set({ plotObsData: null, plotObsLoading: false });
    }
  },

  clearPlotObsColumn: () => {
    set({ plotObsColumn: null, plotObsData: null });
  },
});
