export const createDotplotSlice = (set, get) => ({
  // Dotplot tab state
  dotplotGenes: [],
  dotplotGeneExpressions: {},
  dotplotGeneLoading: null,
  dotplotObsColumn: null,
  dotplotObsData: null,
  dotplotObsLoading: false,

  toggleDotplotGene: async (geneName) => {
    const { adata, metadata, dotplotGenes, dotplotGeneExpressions } = get();
    if (!adata || !geneName) return;

    // Toggle off — remove gene
    if (dotplotGenes.includes(geneName)) {
      const { [geneName]: _, ...rest } = dotplotGeneExpressions;
      set({
        dotplotGenes: dotplotGenes.filter((g) => g !== geneName),
        dotplotGeneExpressions: rest,
      });
      return { removed: true };
    }

    // Toggle on — fetch and add gene
    set({ dotplotGeneLoading: geneName });

    try {
      const { varNames, geneNames } = metadata;
      let queryName = geneName;
      if (geneNames !== varNames) {
        const idx = geneNames.indexOf(geneName);
        if (idx !== -1) queryName = varNames[idx];
      }
      const values = await adata.geneExpression(queryName);
      console.debug("[DotplotTab] Gene expression for", geneName, ":", values?.length, "values, sample:", values?.slice(0, 10));

      if (!values || values.length === 0) {
        set({ dotplotGeneLoading: null });
        return { added: false, noExpression: true };
      }

      const { dotplotGenes: current, dotplotGeneExpressions: currentData } = get();
      set({
        dotplotGenes: [...current, geneName],
        dotplotGeneExpressions: { ...currentData, [geneName]: values },
        dotplotGeneLoading: null,
      });
      return { added: true };
    } catch (err) {
      console.error("[DotplotTab] Gene expression fetch error:", err);
      set({ dotplotGeneLoading: null });
      return { added: false, error: err.message };
    }
  },

  clearDotplotGenes: () => {
    set({ dotplotGenes: [], dotplotGeneExpressions: {} });
  },

  setDotplotObsColumn: async (colName) => {
    const { adata } = get();
    if (!adata || !colName) return;

    set({ dotplotObsColumn: colName, dotplotObsLoading: true, dotplotObsData: null });

    try {
      const values = await adata.obsColumn(colName);
      set({ dotplotObsData: values, dotplotObsLoading: false });
    } catch (err) {
      console.error("[DotplotTab] Obs column fetch error:", err);
      set({ dotplotObsData: null, dotplotObsLoading: false });
    }
  },

  clearDotplotObsColumn: () => {
    set({ dotplotObsColumn: null, dotplotObsData: null });
  },
});
