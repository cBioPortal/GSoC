import { describe, it, expect } from "vitest";
import { AnnDataStore } from "./AnnDataStore";
import { ZarrStore } from "./ZarrStore";
import type { ArrayResult } from "./decoders";

const TEST_URL = `${globalThis.__TEST_BASE_URL__}/pbmc3k.zarr`;

describe("AnnDataStore", () => {
  describe("open", () => {
    it("opens a store and exposes shape metadata", async () => {
      const adata = await AnnDataStore.open(TEST_URL);

      expect(adata.shape).toBeDefined();
      expect(adata.shape).toHaveLength(2);
      expect(adata.nObs).toBe(adata.shape[0]);
      expect(adata.nVar).toBe(adata.shape[1]);
    });

    it("exposes root attrs with anndata encoding-type", async () => {
      const adata = await AnnDataStore.open(TEST_URL);

      expect(adata.attrs).toHaveProperty("encoding-type", "anndata");
    });

    it("exposes the underlying ZarrStore", async () => {
      const adata = await AnnDataStore.open(TEST_URL);

      expect(adata.zarrStore).toBeInstanceOf(ZarrStore);
    });
  });

  describe("fromZarrStore", () => {
    it("creates AnnDataStore from an existing ZarrStore", async () => {
      const zs = await ZarrStore.open(TEST_URL);
      const adata = await AnnDataStore.fromZarrStore(zs);

      expect(adata.shape).toBeDefined();
      expect(adata.zarrStore).toBe(zs);
    });
  });

  describe("X matrix", () => {
    it("reads the full X matrix", async () => {
      const adata = await AnnDataStore.open(TEST_URL);
      const x = await adata.X();

      expect(x).toBeDefined();
      // sparse will have format/data/indices/indptr/shape
      // dense will have data/shape
      expect(x.data).toBeDefined();
      expect(x.shape).toBeDefined();
    });
  });

  describe("obs", () => {
    it("reads the full obs dataframe", async () => {
      const adata = await AnnDataStore.open(TEST_URL);
      const obs = await adata.obs();

      expect(obs.index).toBeDefined();
      expect(obs.columns).toBeDefined();
      expect(obs.columnOrder).toBeDefined();
      expect(Array.isArray(obs.index)).toBe(true);
      expect(obs.index.length).toBe(adata.nObs);
    });

    it("reads obs column names", async () => {
      const adata = await AnnDataStore.open(TEST_URL);
      const cols = await adata.obsColumns();

      expect(Array.isArray(cols)).toBe(true);
      expect(cols.length).toBeGreaterThan(0);
    });

    it("reads a single obs column", async () => {
      const adata = await AnnDataStore.open(TEST_URL);
      const cols = await adata.obsColumns();
      const col = await adata.obsColumn(cols[0]);

      expect(col).toBeDefined();
      expect(col.length).toBe(adata.nObs);
    });

    it("reads obs names (index)", async () => {
      const adata = await AnnDataStore.open(TEST_URL);
      const names = await adata.obsNames();

      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBe(adata.nObs);
    });
  });

  describe("var", () => {
    it("reads the full var dataframe", async () => {
      const adata = await AnnDataStore.open(TEST_URL);
      const v = await adata.var();

      expect(v.index).toBeDefined();
      expect(v.columns).toBeDefined();
      expect(v.columnOrder).toBeDefined();
      expect(Array.isArray(v.index)).toBe(true);
      expect(v.index.length).toBe(adata.nVar);
    });

    it("reads var names (gene names)", async () => {
      const adata = await AnnDataStore.open(TEST_URL);
      const names = await adata.varNames();

      expect(Array.isArray(names)).toBe(true);
      expect(names.length).toBe(adata.nVar);
    });
  });

  describe("obsm", () => {
    it("lists obsm keys", async () => {
      const adata = await AnnDataStore.open(TEST_URL);
      const keys = adata.obsmKeys();

      expect(Array.isArray(keys)).toBe(true);
    });

    it("reads an obsm entry if keys exist", async () => {
      const adata = await AnnDataStore.open(TEST_URL);
      const keys = adata.obsmKeys();

      if (keys.length > 0) {
        const entry = (await adata.obsm(keys[0])) as ArrayResult;
        expect(entry).toBeDefined();
        expect(entry.data).toBeDefined();
      }
    });

    it("streams obsm in batches with correct metadata", async () => {
      const adata = await AnnDataStore.open(TEST_URL);
      const keys = adata.obsmKeys();
      if (keys.length === 0) return;

      const batches: { data: unknown; shape: number[]; offset: number; total: number }[] = [];
      for await (const batch of adata.obsmStreaming(keys[0])) {
        expect(batch.data).toBeDefined();
        expect(batch.shape).toHaveLength(2);
        expect(batch.offset).toBeGreaterThanOrEqual(0);
        expect(batch.total).toBe(adata.nObs);
        batches.push(batch);
      }

      expect(batches.length).toBeGreaterThan(0);
    });

    it("streaming batches concatenate to match non-streaming obsm", async () => {
      const adata = await AnnDataStore.open(TEST_URL);
      const keys = adata.obsmKeys();
      if (keys.length === 0) return;

      const key = keys[0];
      const full = (await adata.obsm(key)) as ArrayResult;

      const batches: { data: ArrayLike<number>; shape: number[]; offset: number; total: number }[] = [];
      for await (const batch of adata.obsmStreaming(key)) {
        batches.push(batch as { data: ArrayLike<number>; shape: number[]; offset: number; total: number });
      }

      // Verify offsets increment correctly
      let expectedOffset = 0;
      for (const batch of batches) {
        expect(batch.offset).toBe(expectedOffset);
        expectedOffset += batch.shape[0];
      }
      expect(expectedOffset).toBe(full.shape[0]);

      // Concatenate batch data and compare to full result
      const totalElements = batches.reduce((sum, b) => sum + b.data.length, 0);
      const TypedArrayCtor = (full.data as unknown as Float64Array).constructor as Float64ArrayConstructor;
      const concatenated = new TypedArrayCtor(totalElements);
      let writeOffset = 0;
      for (const batch of batches) {
        concatenated.set(batch.data as unknown as Float64Array, writeOffset);
        writeOffset += batch.data.length;
      }

      expect(concatenated.length).toBe(full.data.length);
      expect(concatenated).toEqual(full.data);
    });

    it("respects custom batchSize parameter", async () => {
      const adata = await AnnDataStore.open(TEST_URL);
      const keys = adata.obsmKeys();
      if (keys.length === 0) return;

      const batchSize = 100;
      const batches: { data: unknown; shape: number[]; offset: number; total: number }[] = [];
      for await (const batch of adata.obsmStreaming(keys[0], batchSize)) {
        batches.push(batch);
      }

      // All batches except possibly the last should have batchSize rows
      for (let i = 0; i < batches.length - 1; i++) {
        expect(batches[i].shape[0]).toBe(batchSize);
      }
      // Last batch should be <= batchSize
      const last = batches[batches.length - 1];
      expect(last.shape[0]).toBeLessThanOrEqual(batchSize);
      expect(last.offset + last.shape[0]).toBe(last.total);
    });
  });

  describe("layers", () => {
    it("lists layer keys", async () => {
      const adata = await AnnDataStore.open(TEST_URL);
      const keys = adata.layerKeys();

      expect(Array.isArray(keys)).toBe(true);
    });
  });

  describe("uns", () => {
    it("lists uns keys", async () => {
      const adata = await AnnDataStore.open(TEST_URL);
      const keys = adata.unsKeys();

      expect(Array.isArray(keys)).toBe(true);
    });
  });
});
