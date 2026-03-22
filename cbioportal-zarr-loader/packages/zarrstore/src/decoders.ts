import * as zarr from "zarrita";
import type { Readable } from "zarrita";

type ZarrGroup = zarr.Group<Readable>;
type ZarrArray = zarr.Array<zarr.DataType, Readable>;
type ZarrLocation = zarr.Location<Readable>;

export type OpenFn = (
  location: ZarrLocation,
  opts: { kind: "array" | "group" },
) => Promise<ZarrArray | ZarrGroup>;

export interface ArrayResult {
  data: zarr.TypedArray<zarr.DataType>;
  shape: number[];
}

export interface SparseMatrix {
  format: string;
  data: zarr.TypedArray<zarr.DataType>;
  indices: zarr.TypedArray<zarr.DataType>;
  indptr: zarr.TypedArray<zarr.DataType>;
  shape: number[];
}

export interface Categorical {
  values: (string | number | null)[];
  categories: zarr.TypedArray<zarr.DataType> | string[];
  ordered: boolean;
}

export interface Nullable {
  values: (number | boolean | null)[];
  mask: zarr.TypedArray<zarr.DataType>;
}

export interface Dataframe {
  index: string[];
  columns: Record<string, zarr.TypedArray<zarr.DataType> | (string | number | null)[]>;
  columnOrder: string[];
}

// Default opener tries v2 first, then v3
const defaultOpen: OpenFn = async (location, opts) => {
  try {
    return await zarr.open.v2(location, opts as { kind: "array" });
  } catch {
    return await zarr.open.v3(location, opts as { kind: "array" });
  }
};

export async function readArray(arr: ZarrArray): Promise<ArrayResult> {
  const chunk = await zarr.get(arr);
  return { data: chunk.data, shape: chunk.shape };
}

export function toStringArray(
  data: zarr.TypedArray<zarr.DataType> | string[],
): string[] {
  if (Array.isArray(data)) return data as string[];
  if (typeof (data as unknown as Record<number, unknown>)[0] === "string")
    return Array.from(data as Iterable<string>);
  // zarrita may return a TypedArray of bytes for vlen-utf8; decode if needed
  if (data instanceof Uint8Array) {
    const decoder = new TextDecoder();
    return decoder.decode(data).split("\0").filter(Boolean);
  }
  return Array.from(data as ArrayLike<unknown>, (v) => String(v));
}

export async function decodeCategorical(
  group: ZarrGroup,
  open: OpenFn = defaultOpen,
): Promise<Categorical> {
  const codes = (await open(group.resolve("codes"), { kind: "array" })) as ZarrArray;
  const categories = (await open(group.resolve("categories"), {
    kind: "array",
  })) as ZarrArray;
  const codesResult = await readArray(codes);
  const categoriesResult = await readArray(categories);
  const ordered = (group.attrs?.ordered as boolean) ?? false;

  const catValues =
    typeof (categoriesResult.data as unknown as Record<number, unknown>)[0] === "string" ||
    categoriesResult.data instanceof Array
      ? toStringArray(categoriesResult.data)
      : categoriesResult.data;

  const values = Array.from(codesResult.data as ArrayLike<number>, (code) =>
    code < 0 ? null : (catValues as ArrayLike<string | number>)[code],
  );

  return { values, categories: catValues, ordered };
}

export async function decodeColumn(
  group: ZarrGroup,
  colName: string,
  open: OpenFn = defaultOpen,
): Promise<zarr.TypedArray<zarr.DataType> | (string | number | null)[]> {
  let node: ZarrGroup;
  try {
    node = (await open(group.resolve(colName), { kind: "group" })) as ZarrGroup;
  } catch {
    // not a group — open as array
    const arr = (await open(group.resolve(colName), { kind: "array" })) as ZarrArray;
    const result = await readArray(arr);
    if (
      typeof (result.data as unknown as Record<number, unknown>)[0] === "string" ||
      result.data instanceof Array
    ) {
      return toStringArray(result.data);
    }
    return result.data;
  }

  const encodingType = node.attrs?.["encoding-type"] as string | undefined;
  if (encodingType === "categorical") {
    const decoded = await decodeCategorical(node, open);
    return decoded.values;
  }
  if (
    encodingType === "nullable-integer" ||
    encodingType === "nullable-boolean"
  ) {
    const decoded = await decodeNullable(node, open);
    return decoded.values;
  }
  // fallback: try reading as categorical (common even without explicit encoding-type)
  try {
    const decoded = await decodeCategorical(node, open);
    return decoded.values;
  } catch {
    throw new Error(
      `Unknown column encoding-type "${encodingType}" for column "${colName}"`,
    );
  }
}

export async function decodeDataframe(
  group: ZarrGroup,
  open: OpenFn = defaultOpen,
): Promise<Dataframe> {
  const attrs = group.attrs;
  const indexKey = attrs["_index"] as string;
  const columnOrder = attrs["column-order"] as string[];

  const indexArr = (await open(group.resolve(indexKey), { kind: "array" })) as ZarrArray;
  const indexResult = await readArray(indexArr);
  const index = toStringArray(indexResult.data);

  const columns: Record<string, zarr.TypedArray<zarr.DataType> | (string | number | null)[]> = {};
  for (const colName of columnOrder) {
    columns[colName] = await decodeColumn(group, colName, open);
  }

  return { index, columns, columnOrder: Array.from(columnOrder) };
}

export async function decodeNullable(
  group: ZarrGroup,
  open: OpenFn = defaultOpen,
): Promise<Nullable> {
  const valuesArr = (await open(group.resolve("values"), {
    kind: "array",
  })) as ZarrArray;
  const maskArr = (await open(group.resolve("mask"), { kind: "array" })) as ZarrArray;
  const valuesResult = await readArray(valuesArr);
  const maskResult = await readArray(maskArr);

  const values = Array.from(
    valuesResult.data as ArrayLike<number | boolean>,
    (v, i) => ((maskResult.data as ArrayLike<number>)[i] ? null : v),
  );

  return { values, mask: maskResult.data };
}

export async function decodeSparseMatrix(
  group: ZarrGroup,
  open: OpenFn = defaultOpen,
): Promise<SparseMatrix> {
  const attrs = group.attrs;
  const format = (attrs["encoding-type"] as string)?.replace("_matrix", ""); // "csr" or "csc"
  const shape = attrs.shape as number[];

  const dataArr = (await open(group.resolve("data"), { kind: "array" })) as ZarrArray;
  const indicesArr = (await open(group.resolve("indices"), {
    kind: "array",
  })) as ZarrArray;
  const indptrArr = (await open(group.resolve("indptr"), {
    kind: "array",
  })) as ZarrArray;

  const [dataResult, indicesResult, indptrResult] = await Promise.all([
    readArray(dataArr),
    readArray(indicesArr),
    readArray(indptrArr),
  ]);

  return {
    format,
    data: dataResult.data,
    indices: indicesResult.data,
    indptr: indptrResult.data,
    shape,
  };
}

export function sparseToDense(sparse: SparseMatrix): ArrayResult {
  const { format, data, indices, indptr, shape } = sparse;
  const [nRows, nCols] = shape;
  const dense = new Float64Array(nRows * nCols);

  const numData = data as ArrayLike<number>;
  const numIndices = indices as ArrayLike<number>;
  const numIndptr = indptr as ArrayLike<number>;

  if (format === "csr") {
    for (let row = 0; row < nRows; row++) {
      for (let j = numIndptr[row]; j < numIndptr[row + 1]; j++) {
        dense[row * nCols + numIndices[j]] = numData[j];
      }
    }
  } else if (format === "csc") {
    for (let col = 0; col < nCols; col++) {
      for (let j = numIndptr[col]; j < numIndptr[col + 1]; j++) {
        dense[numIndices[j] * nCols + col] = numData[j];
      }
    }
  } else {
    throw new Error(`Unknown sparse format: "${format}"`);
  }

  return { data: dense, shape };
}

export type DecodeNodeResult =
  | Dataframe
  | SparseMatrix
  | Categorical
  | Nullable
  | ArrayResult
  | { attrs: Record<string, unknown> };

export async function decodeNode(
  location: ZarrGroup,
  open: OpenFn = defaultOpen,
): Promise<DecodeNodeResult> {
  const attrs = location.attrs;
  const encodingType = attrs?.["encoding-type"] as string | undefined;

  switch (encodingType) {
    case "anndata":
      throw new Error(
        'Use AnnDataStore.open() to read an anndata root, not decodeNode()',
      );
    case "dataframe":
      return decodeDataframe(location, open);
    case "csr_matrix":
    case "csc_matrix":
      return decodeSparseMatrix(location, open);
    case "categorical":
      return decodeCategorical(location, open);
    case "nullable-integer":
    case "nullable-boolean":
      return decodeNullable(location, open);
    default: {
      // Dense array or unknown group — try as array first
      try {
        const arr = (await open(location, { kind: "array" })) as ZarrArray;
        return readArray(arr);
      } catch {
        // Return the group attrs for unrecognized groups
        return { attrs };
      }
    }
  }
}
