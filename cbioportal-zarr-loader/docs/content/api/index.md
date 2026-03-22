---
title: API Reference
sidebar_position: 0
---

# API Reference

The `@cbioportal-zarr-loader/zarrstore` package provides classes and utilities for reading AnnData files stored in Zarr format.

## Classes

- **[ZarrStore](./zarrstore)** — Low-level wrapper for working with Zarr stores
- **[AnnDataStore](./anndatastore)** — High-level interface for reading AnnData files

## Utilities

- **[Decoders](./decoders)** — Functions for decoding AnnData-specific encoding types

## Quick Start

```js
import { AnnDataStore } from '@cbioportal-zarr-loader/zarrstore';

// Open an AnnData file
const adata = await AnnDataStore.open('https://example.com/pbmc3k.zarr');

// Access metadata
console.log(`Shape: ${adata.nObs} x ${adata.nVar}`);

// Read observations
const { index, columns } = await adata.obs();
console.log('Cell barcodes:', index.slice(0, 5));

// Read embeddings
const umap = await adata.obsm('X_umap');
console.log('UMAP shape:', umap.shape);

// Read gene names
const genes = await adata.varNames();
console.log('Genes:', genes.slice(0, 5));
```
