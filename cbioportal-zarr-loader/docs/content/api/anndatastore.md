---
title: AnnDataStore
sidebar_position: 2
---

# AnnDataStore

A high-level class for reading AnnData files stored in Zarr format. Provides convenient access to all AnnData components including the expression matrix, observations, variables, and various annotation slots.

## Import

```js
import { AnnDataStore } from '@cbioportal-zarr-loader/zarrstore';
```

## Static Methods

### `AnnDataStore.open(url)`

Opens an AnnData store from a URL.

**Parameters:**
- `url` (string) — URL pointing to an AnnData Zarr store

**Returns:** `Promise<AnnDataStore>`

**Throws:** Error if the store's `encoding-type` is not `"anndata"`

**Example:**
```js
const adata = await AnnDataStore.open('https://example.com/pbmc3k.zarr');
console.log(`Dataset: ${adata.nObs} cells x ${adata.nVar} genes`);
```

### `AnnDataStore.fromZarrStore(zarrStore)`

Creates an AnnDataStore from an existing ZarrStore instance.

**Parameters:**
- `zarrStore` (ZarrStore) — An already-opened ZarrStore

**Returns:** `Promise<AnnDataStore>`

**Throws:** Error if the store's `encoding-type` is not `"anndata"`

**Example:**
```js
const zarrStore = await ZarrStore.open('https://example.com/pbmc3k.zarr');
const adata = await AnnDataStore.fromZarrStore(zarrStore);
```

## Instance Properties

### `shape`

The shape of the data matrix as `[nObs, nVar]`.

**Type:** `[number, number]`

### `nObs`

Number of observations (cells/samples).

**Type:** `number`

### `nVar`

Number of variables (genes/features).

**Type:** `number`

### `attrs`

Root-level attributes from the Zarr store.

**Type:** `object`

### `zarrStore`

The underlying ZarrStore instance.

**Type:** `ZarrStore`

## Expression Matrix

### `X(sliceRange?)`

Reads the main data matrix (X).

**Parameters:**
- `sliceRange` (optional) `[number, number]` — Row slice range `[start, end]` for partial reads

**Returns:** `Promise<object>` — For dense matrices: `{ data, shape }`. For sparse matrices: `{ format, data, indices, indptr, shape }`

**Example:**
```js
// Read entire matrix
const { data, shape } = await adata.X();

// Read rows 0-99 only
const slice = await adata.X([0, 100]);
```

## Observations (obs)

### `obs()`

Reads the full observations dataframe.

**Returns:** `Promise<{ index, columns, columnOrder }>`

**Example:**
```js
const { index, columns, columnOrder } = await adata.obs();
console.log('Cell barcodes:', index);
console.log('Available columns:', columnOrder);
```

### `obsColumn(name)`

Reads a single observation column.

**Parameters:**
- `name` (string) — Column name

**Returns:** `Promise<Array>` — Column values

**Example:**
```js
const cellTypes = await adata.obsColumn('cell_type');
```

### `obsColumns()`

Lists available observation column names.

**Returns:** `Promise<string[]>`

### `obsNames()`

Returns observation index values (e.g., cell barcodes).

**Returns:** `Promise<string[]>`

## Variables (var)

### `var()`

Reads the full variables dataframe.

**Returns:** `Promise<{ index, columns, columnOrder }>`

### `varColumn(name)`

Reads a single variable column.

**Parameters:**
- `name` (string) — Column name

**Returns:** `Promise<Array>` — Column values

### `varColumns()`

Lists available variable column names.

**Returns:** `Promise<string[]>`

### `varNames()`

Returns variable index values (e.g., gene names).

**Returns:** `Promise<string[]>`

**Example:**
```js
const geneNames = await adata.varNames();
```

## Multi-dimensional Annotations

### `obsm(key)`

Reads an observation matrix (e.g., embeddings).

**Parameters:**
- `key` (string) — Matrix key (e.g., `"X_umap"`, `"X_pca"`)

**Returns:** `Promise<{ data, shape }>`

**Example:**
```js
const umap = await adata.obsm('X_umap');
console.log('UMAP coordinates shape:', umap.shape);
```

### `obsmKeys()`

Lists available observation matrix keys.

**Returns:** `string[]`

### `varm(key)`

Reads a variable matrix.

**Parameters:**
- `key` (string) — Matrix key

**Returns:** `Promise<{ data, shape }>`

### `varmKeys()`

Lists available variable matrix keys.

**Returns:** `string[]`

## Pairwise Annotations

### `obsp(key)`

Reads an observation pairwise matrix (e.g., distance matrices, graphs).

**Parameters:**
- `key` (string) — Matrix key (e.g., `"connectivities"`, `"distances"`)

**Returns:** `Promise<object>` — Decoded matrix (may be sparse)

### `obspKeys()`

Lists available observation pairwise matrix keys.

**Returns:** `string[]`

### `varp(key)`

Reads a variable pairwise matrix.

**Parameters:**
- `key` (string) — Matrix key

**Returns:** `Promise<object>`

### `varpKeys()`

Lists available variable pairwise matrix keys.

**Returns:** `string[]`

## Layers

### `layer(key)`

Reads an alternative expression layer.

**Parameters:**
- `key` (string) — Layer key (e.g., `"raw"`, `"normalized"`)

**Returns:** `Promise<object>` — Dense or sparse matrix

**Example:**
```js
const rawCounts = await adata.layer('raw');
```

### `layerKeys()`

Lists available layer keys.

**Returns:** `string[]`

## Unstructured Annotations (uns)

### `uns(key)`

Reads unstructured annotation data.

**Parameters:**
- `key` (string) — Annotation key

**Returns:** `Promise<object>` — Decoded data (type depends on stored content)

**Example:**
```js
const hvgInfo = await adata.uns('hvg');
```

### `unsKeys()`

Lists available unstructured annotation keys.

**Returns:** `string[]`
