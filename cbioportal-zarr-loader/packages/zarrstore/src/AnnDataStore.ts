import * as zarr from "zarrita";
import type { Readable } from "zarrita";
import { ZarrStore } from "./ZarrStore";
import {
  readArray,
  decodeDataframe,
  decodeColumn,
  decodeCategorical,
  decodeSparseMatrix,
  decodeNode,
  toStringArray,
} from "./decoders";
import type {
  ArrayResult,
  SparseMatrix,
  Dataframe,
  DecodeNodeResult,
} from "./decoders";

type ZarrGroup = zarr.Group<Readable>;
type ZarrArray = zarr.Array<zarr.DataType, Readable>;

interface ConsolidatedMetadata {
  [key: string]: unknown;
}

interface ObsmBatch {
  data: zarr.TypedArray<zarr.DataType>;
  shape: number[];
  offset: number;
  total: number;
}

export class AnnDataStore {
  #zarrStore: ZarrStore;
  #shape: number[];
  #attrs: Record<string, unknown>;
  #consolidatedMetadata: ConsolidatedMetadata | null;
  #cache = new Map<string, Promise<unknown>>();

  constructor(
    zarrStore: ZarrStore,
    shape: number[],
    consolidatedMetadata: ConsolidatedMetadata | null = null,
  ) {
    this.#zarrStore = zarrStore;
    this.#attrs = zarrStore.attrs;
    this.#shape = shape;
    this.#consolidatedMetadata = consolidatedMetadata;
  }

  #cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
    if (!this.#cache.has(key)) {
      this.#cache.set(key, fn());
    }
    return this.#cache.get(key) as Promise<T>;
  }

  clearCache(): void {
    this.#cache.clear();
  }

  static async open(url: string): Promise<AnnDataStore> {
    const zarrStore = await ZarrStore.open(url);
    const attrs = zarrStore.attrs;

    if (attrs["encoding-type"] !== "anndata") {
      throw new Error(
        `Expected encoding-type "anndata", got "${attrs["encoding-type"]}"`,
      );
    }

    const shape = await AnnDataStore.#resolveShape(zarrStore);
    const consolidatedMetadata = await AnnDataStore.#loadConsolidatedMetadata(
      zarrStore,
    );
    return new AnnDataStore(zarrStore, shape, consolidatedMetadata);
  }

  static async fromZarrStore(zarrStore: ZarrStore): Promise<AnnDataStore> {
    const attrs = zarrStore.attrs;

    if (attrs["encoding-type"] !== "anndata") {
      throw new Error(
        `Expected encoding-type "anndata", got "${attrs["encoding-type"]}"`,
      );
    }

    const shape = await AnnDataStore.#resolveShape(zarrStore);
    const consolidatedMetadata = await AnnDataStore.#loadConsolidatedMetadata(
      zarrStore,
    );
    return new AnnDataStore(zarrStore, shape, consolidatedMetadata);
  }

  static async #loadConsolidatedMetadata(
    zarrStore: ZarrStore,
  ): Promise<ConsolidatedMetadata | null> {
    try {
      const response = await fetch(
        String(zarrStore.store.url).replace(/\/$/, "") + "/.zmetadata",
      );
      if (!response.ok) return null;
      const data = (await response.json()) as { metadata?: ConsolidatedMetadata };
      return data.metadata || null;
    } catch {
      return null;
    }
  }

  static async #resolveShape(zarrStore: ZarrStore): Promise<number[]> {
    // Try opening X as an array first (dense), fall back to group (sparse)
    try {
      const xArr = await zarrStore.openArray("X");
      return xArr.shape;
    } catch {
      const xGroup = await zarrStore.openGroup("X");
      return xGroup.attrs.shape as number[];
    }
  }

  // --- Metadata (synchronous) ---

  get shape(): number[] {
    return this.#shape;
  }

  get nObs(): number {
    return this.#shape[0];
  }

  get nVar(): number {
    return this.#shape[1];
  }

  get attrs(): Record<string, unknown> {
    return this.#attrs;
  }

  get zarrStore(): ZarrStore {
    return this.#zarrStore;
  }

  // --- X matrix ---

  async X(sliceRange?: [number, number]): Promise<ArrayResult | SparseMatrix> {
    let node: ZarrArray | ZarrGroup;
    try {
      node = await this.#zarrStore.openArray("X");
    } catch {
      node = await this.#zarrStore.openGroup("X");
    }

    if ((node.attrs?.["encoding-type"] as string)?.endsWith("_matrix")) {
      return decodeSparseMatrix(node as ZarrGroup);
    }

    // Dense array
    if (sliceRange) {
      const [start, end] = sliceRange;
      const chunk = await zarr.get(node as ZarrArray, [zarr.slice(start, end), null]);
      return { data: chunk.data, shape: chunk.shape };
    }
    return readArray(node as ZarrArray);
  }

  async geneExpression(geneName: string): Promise<zarr.TypedArray<zarr.DataType>> {
    return this.#cached(`geneExpression:${geneName}`, async () => {
      // Get gene index from var names
      const varNames = await this.varNames();
      const geneIndex = varNames.indexOf(geneName);
      if (geneIndex === -1) {
        throw new Error(`Gene "${geneName}" not found`);
      }

      // Try to open X as dense array
      let node: ZarrArray | ZarrGroup;
      try {
        node = await this.#zarrStore.openArray("X");
      } catch {
        node = await this.#zarrStore.openGroup("X");
      }

      if ((node.attrs?.["encoding-type"] as string)?.endsWith("_matrix")) {
        // Sparse matrix - need to decode and extract column
        const sparse = await decodeSparseMatrix(node as ZarrGroup);
        // For CSR matrix, we need to iterate through all rows
        // This is less efficient but works for any sparse format
        const result = new Float32Array(this.#shape[0]);
        const data = sparse.data as ArrayLike<number>;
        const indices = sparse.indices as ArrayLike<number>;
        const indptr = sparse.indptr as ArrayLike<number>;
        for (let row = 0; row < this.#shape[0]; row++) {
          const rowStart = indptr[row];
          const rowEnd = indptr[row + 1];
          for (let j = rowStart; j < rowEnd; j++) {
            if (indices[j] === geneIndex) {
              result[row] = data[j];
              break;
            }
          }
        }
        return result;
      }

      // Dense array - slice the column
      const chunk = await zarr.get(node as ZarrArray, [null, geneIndex]);
      return chunk.data;
    });
  }

  // --- obs / var dataframes ---

  obs(): Promise<Dataframe> {
    return this.#cached("obs", async () => {
      const group = await this.#zarrStore.openGroup("obs");
      return decodeDataframe(group);
    });
  }

  obsColumn(name: string): Promise<zarr.TypedArray<zarr.DataType> | (string | number | null)[]> {
    return this.#cached(`obs:${name}`, async () => {
      const group = await this.#zarrStore.openGroup("obs");
      return decodeColumn(group, name);
    });
  }

  obsColumns(): Promise<string[]> {
    return this.#cached("obsColumns", async () => {
      const group = await this.#zarrStore.openGroup("obs");
      return Array.from(group.attrs["column-order"] as string[]);
    });
  }

  obsNames(): Promise<(string | number | null)[]> {
    return this.#cached("obsNames", async () => {
      const group = await this.#zarrStore.openGroup("obs");
      const indexKey = group.attrs["_index"] as string;
      // Index can be an array or a categorical group
      try {
        const arr = await zarr.open(group.resolve(indexKey), { kind: "array" });
        const result = await readArray(arr);
        return toStringArray(result.data);
      } catch {
        // It's a categorical group
        const catGroup = await zarr.open(group.resolve(indexKey), {
          kind: "group",
        });
        const decoded = await decodeCategorical(catGroup);
        return decoded.values;
      }
    });
  }

  var(): Promise<Dataframe> {
    return this.#cached("var", async () => {
      const group = await this.#zarrStore.openGroup("var");
      return decodeDataframe(group);
    });
  }

  varColumn(name: string): Promise<zarr.TypedArray<zarr.DataType> | (string | number | null)[]> {
    return this.#cached(`var:${name}`, async () => {
      const group = await this.#zarrStore.openGroup("var");
      return decodeColumn(group, name);
    });
  }

  varColumns(): Promise<string[]> {
    return this.#cached("varColumns", async () => {
      const group = await this.#zarrStore.openGroup("var");
      return Array.from(group.attrs["column-order"] as string[]);
    });
  }

  varNames(): Promise<(string | number | null)[]> {
    return this.#cached("varNames", async () => {
      const group = await this.#zarrStore.openGroup("var");
      const indexKey = group.attrs["_index"] as string;
      // Index can be an array or a categorical group
      try {
        const arr = await zarr.open(group.resolve(indexKey), { kind: "array" });
        const result = await readArray(arr);
        return toStringArray(result.data);
      } catch {
        // It's a categorical group
        const catGroup = await zarr.open(group.resolve(indexKey), {
          kind: "group",
        });
        const decoded = await decodeCategorical(catGroup);
        return decoded.values;
      }
    });
  }

  // --- Dict-of-matrices slots ---

  #slotKeys(path: string): string[] {
    if (!this.#consolidatedMetadata) {
      return [];
    }
    const prefix = path + "/";
    const keys = new Set<string>();
    for (const key of Object.keys(this.#consolidatedMetadata)) {
      if (key.startsWith(prefix)) {
        const rest = key.slice(prefix.length);
        const slashIndex = rest.indexOf("/");
        if (slashIndex > 0) {
          keys.add(rest.slice(0, slashIndex));
        }
      }
    }
    return Array.from(keys);
  }

  #slotNode(path: string, key: string): Promise<DecodeNodeResult> {
    return this.#cached(`${path}:${key}`, async () => {
      const node = await this.#zarrStore.openGroup(`${path}/${key}`);
      return decodeNode(node);
    });
  }

  #slotArray(path: string, key: string): Promise<ArrayResult | DecodeNodeResult> {
    return this.#cached(`${path}:${key}`, async () => {
      try {
        const arr = await this.#zarrStore.openArray(`${path}/${key}`);
        return readArray(arr);
      } catch {
        const node = await this.#zarrStore.openGroup(`${path}/${key}`);
        return decodeNode(node);
      }
    });
  }

  obsm(key: string): Promise<ArrayResult | DecodeNodeResult> {
    return this.#slotArray("obsm", key);
  }

  async *obsmStreaming(key: string, batchSize?: number): AsyncGenerator<ObsmBatch> {
    const arr = await this.#zarrStore.openArray(`obsm/${key}`);
    const [nObs] = arr.shape;
    const step = batchSize ?? arr.chunks[0];

    for (let offset = 0; offset < nObs; offset += step) {
      const end = Math.min(offset + step, nObs);
      const chunk = await zarr.get(arr, [zarr.slice(offset, end), null]);
      yield { data: chunk.data, shape: chunk.shape, offset, total: nObs };
    }
  }

  obsmKeys(): string[] {
    return this.#slotKeys("obsm");
  }

  varm(key: string): Promise<ArrayResult | DecodeNodeResult> {
    return this.#slotArray("varm", key);
  }

  varmKeys(): string[] {
    return this.#slotKeys("varm");
  }

  obsp(key: string): Promise<DecodeNodeResult> {
    return this.#slotNode("obsp", key);
  }

  obspKeys(): string[] {
    return this.#slotKeys("obsp");
  }

  varp(key: string): Promise<DecodeNodeResult> {
    return this.#slotNode("varp", key);
  }

  varpKeys(): string[] {
    return this.#slotKeys("varp");
  }

  // --- Layers ---

  layer(key: string): Promise<ArrayResult | DecodeNodeResult> {
    return this.#slotArray("layers", key);
  }

  layerKeys(): string[] {
    return this.#slotKeys("layers");
  }

  // --- Unstructured (uns) ---

  uns(key: string): Promise<ArrayResult | DecodeNodeResult> {
    return this.#slotArray("uns", key);
  }

  unsKeys(): string[] {
    return this.#slotKeys("uns");
  }
}
