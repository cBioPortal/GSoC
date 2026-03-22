---
title: ZarrStore
sidebar_position: 1
---

# ZarrStore

A wrapper class for working with Zarr stores using [zarrita](https://github.com/manzt/zarrita.js).

## Import

```js
import { ZarrStore } from '@cbioportal-zarr-loader/zarrstore';
```

## Static Methods

### `ZarrStore.open(url)`

Opens a Zarr store from a URL.

**Parameters:**
- `url` (string) — URL pointing to a Zarr store

**Returns:** `Promise<ZarrStore>` — A new ZarrStore instance

**Example:**
```js
const store = await ZarrStore.open('https://example.com/data.zarr');
```

## Constructor

### `new ZarrStore(store, root)`

Creates a new ZarrStore instance. Typically you should use `ZarrStore.open()` instead.

**Parameters:**
- `store` — A zarrita store (e.g., `FetchStore`)
- `root` — A zarrita group representing the root of the store

## Instance Properties

### `store`

The underlying zarrita store.

### `root`

The root group of the Zarr hierarchy.

### `attrs`

Attributes associated with the root group.

## Instance Methods

### `openArray(path)`

Opens an array at the specified path within the store.

**Parameters:**
- `path` (string) — Path to the array relative to the root

**Returns:** `Promise<zarr.Array>` — A zarrita array

**Example:**
```js
const store = await ZarrStore.open('https://example.com/data.zarr');
const matrix = await store.openArray('X');
```

### `openGroup(path)`

Opens a group at the specified path within the store.

**Parameters:**
- `path` (string) — Path to the group relative to the root

**Returns:** `Promise<zarr.Group>` — A zarrita group

**Example:**
```js
const store = await ZarrStore.open('https://example.com/data.zarr');
const obsGroup = await store.openGroup('obs');
```
