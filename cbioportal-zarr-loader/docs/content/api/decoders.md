---
title: Decoders
sidebar_position: 3
---

# Decoders

Utility functions for decoding AnnData-specific encoding types stored in Zarr format. These are used internally by `AnnDataStore` but can also be used directly for custom decoding needs.

## Import

```js
import {
  readArray,
  toStringArray,
  decodeCategorical,
  decodeColumn,
  decodeDataframe,
  decodeNullable,
  decodeSparseMatrix,
  sparseToDense,
  decodeNode,
} from '@cbioportal-zarr-loader/zarrstore';
```

## Functions

### `readArray(arr)`

Reads an entire Zarr array into memory.

**Parameters:**
- `arr` — A zarrita array object

**Returns:** `Promise<{ data, shape }>`
- `data` — TypedArray or Array containing the array values
- `shape` — Array dimensions

**Example:**
```js
import * as zarr from 'zarrita';

const arr = await zarr.open(store.resolve('X'), { kind: 'array' });
const { data, shape } = await readArray(arr);
```

---

### `toStringArray(data)`

Converts array-like data to a string array. Handles TypedArrays, regular arrays, and null-terminated byte strings.

**Parameters:**
- `data` — Array-like data (Array, TypedArray, or Uint8Array)

**Returns:** `string[]`

**Example:**
```js
const strings = toStringArray(uint8Data);
```

---

### `decodeCategorical(group, open?)`

Decodes a categorical encoded column.

**Parameters:**
- `group` — Zarr group containing `codes` and `categories` arrays
- `open` (optional) — Custom opener function (defaults to trying v2 then v3)

**Returns:** `Promise<{ values, categories, ordered }>`
- `values` — Decoded values array with category labels
- `categories` — Array of unique category values
- `ordered` — Boolean indicating if categories are ordered

**Example:**
```js
const cellTypeGroup = await zarr.open(obsGroup.resolve('cell_type'), { kind: 'group' });
const { values, categories, ordered } = await decodeCategorical(cellTypeGroup);
// values: ['T cell', 'B cell', 'T cell', ...]
// categories: ['B cell', 'T cell', 'Monocyte', ...]
```

---

### `decodeColumn(group, colName, open?)`

Decodes a single dataframe column, automatically handling different encoding types.

**Parameters:**
- `group` — Parent Zarr group (e.g., obs or var group)
- `colName` (string) — Column name to decode
- `open` (optional) — Custom opener function

**Returns:** `Promise<Array>` — Decoded column values

**Supported encodings:**
- Plain arrays (numeric, string)
- `categorical`
- `nullable-integer`
- `nullable-boolean`

**Example:**
```js
const obsGroup = await zarrStore.openGroup('obs');
const cellTypes = await decodeColumn(obsGroup, 'cell_type');
```

---

### `decodeDataframe(group, open?)`

Decodes a complete AnnData dataframe (obs or var).

**Parameters:**
- `group` — Zarr group with `encoding-type: "dataframe"`
- `open` (optional) — Custom opener function

**Returns:** `Promise<{ index, columns, columnOrder }>`
- `index` — Row index values (e.g., cell barcodes, gene names)
- `columns` — Object mapping column names to decoded values
- `columnOrder` — Array of column names in original order

**Example:**
```js
const obsGroup = await zarrStore.openGroup('obs');
const { index, columns, columnOrder } = await decodeDataframe(obsGroup);
```

---

### `decodeNullable(group, open?)`

Decodes nullable integer or boolean arrays.

**Parameters:**
- `group` — Zarr group containing `values` and `mask` arrays
- `open` (optional) — Custom opener function

**Returns:** `Promise<{ values, mask }>`
- `values` — Array with `null` for masked positions
- `mask` — Boolean mask array

**Example:**
```js
const { values, mask } = await decodeNullable(nullableGroup);
// values: [1, 2, null, 4, null, ...]
```

---

### `decodeSparseMatrix(group, open?)`

Decodes a sparse matrix in CSR or CSC format.

**Parameters:**
- `group` — Zarr group with `encoding-type: "csr_matrix"` or `"csc_matrix"`
- `open` (optional) — Custom opener function

**Returns:** `Promise<{ format, data, indices, indptr, shape }>`
- `format` — `"csr"` or `"csc"`
- `data` — Non-zero values
- `indices` — Column (CSR) or row (CSC) indices
- `indptr` — Index pointers for each row (CSR) or column (CSC)
- `shape` — Matrix dimensions `[nRows, nCols]`

**Example:**
```js
const xGroup = await zarrStore.openGroup('X');
const sparse = await decodeSparseMatrix(xGroup);
console.log(`Sparse matrix: ${sparse.shape[0]}x${sparse.shape[1]}, ${sparse.data.length} non-zeros`);
```

---

### `sparseToDense(sparse)`

Converts a sparse matrix to dense format.

**Parameters:**
- `sparse` — Sparse matrix object from `decodeSparseMatrix`

**Returns:** `{ data, shape }`
- `data` — Float64Array containing dense matrix values in row-major order
- `shape` — Matrix dimensions

**Example:**
```js
const sparse = await decodeSparseMatrix(xGroup);
const { data, shape } = sparseToDense(sparse);

// Access element at [row, col]
const value = data[row * shape[1] + col];
```

---

### `decodeNode(location, open?)`

Generic decoder that automatically detects and decodes any AnnData node type.

**Parameters:**
- `location` — Zarr group or array location
- `open` (optional) — Custom opener function

**Returns:** `Promise<object>` — Decoded content (type depends on encoding)

**Supported encoding types:**
- `dataframe` → calls `decodeDataframe`
- `csr_matrix` / `csc_matrix` → calls `decodeSparseMatrix`
- `categorical` → calls `decodeCategorical`
- `nullable-integer` / `nullable-boolean` → calls `decodeNullable`
- `anndata` → throws error (use `AnnDataStore.open()` instead)
- Unknown/none → attempts to read as array, falls back to returning attrs

**Example:**
```js
// Automatically decode whatever is at this path
const result = await decodeNode(someGroup);
```
