export const createColumnsSlice = (set, get) => ({
  // Obs column state (multi-select)
  obsColumnsSelected: [],
  obsColumnsData: {},
  obsColumnLoading: null,
  obsColumnTime: null,

  // Var column state (multi-select)
  varColumnsSelected: [],
  varColumnsData: {},
  varColumnLoading: null,
  varColumnTime: null,

  toggleObsColumn: async (colName) => {
    const { adata, obsColumnsSelected, obsColumnsData } = get();
    if (!adata) return;

    if (obsColumnsSelected.includes(colName)) {
      const { [colName]: _, ...rest } = obsColumnsData;
      set({
        obsColumnsSelected: obsColumnsSelected.filter((c) => c !== colName),
        obsColumnsData: rest,
      });
      return;
    }

    set({ obsColumnLoading: colName });

    try {
      const start = performance.now();
      const values = await adata.obsColumn(colName);
      const { obsColumnsSelected: current, obsColumnsData: currentData } = get();
      set({
        obsColumnTime: performance.now() - start,
        obsColumnsSelected: [...current, colName],
        obsColumnsData: { ...currentData, [colName]: values },
        obsColumnLoading: null,
      });
    } catch (err) {
      console.error(err);
      set({ obsColumnLoading: null });
    }
  },

  toggleVarColumn: async (colName) => {
    const { adata, varColumnsSelected, varColumnsData } = get();
    if (!adata) return;

    if (varColumnsSelected.includes(colName)) {
      const { [colName]: _, ...rest } = varColumnsData;
      set({
        varColumnsSelected: varColumnsSelected.filter((c) => c !== colName),
        varColumnsData: rest,
      });
      return;
    }

    set({ varColumnLoading: colName });

    try {
      const start = performance.now();
      const values = await adata.varColumn(colName);
      const { varColumnsSelected: current, varColumnsData: currentData } = get();
      set({
        varColumnTime: performance.now() - start,
        varColumnsSelected: [...current, colName],
        varColumnsData: { ...currentData, [colName]: values },
        varColumnLoading: null,
      });
    } catch (err) {
      console.error(err);
      set({ varColumnLoading: null });
    }
  },

  clearObsColumns: () => {
    set({ obsColumnsSelected: [], obsColumnsData: {}, obsColumnTime: null });
  },

  clearVarColumns: () => {
    set({ varColumnsSelected: [], varColumnsData: {}, varColumnTime: null });
  },
});
