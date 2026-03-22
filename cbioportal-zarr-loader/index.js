import * as zarr from "zarrita";
import { ZarrStore } from "@cbioportal-zarr-loader/zarrstore";

const z = await ZarrStore.open(
  "http://localhost:3000/spectrum_all_cells.zarr",
);
console.log("Root attributes:", z.attrs);

// Open the X array (expression matrix)
const X = await z.openArray("X");
console.log("\nX array:");
console.log("  Shape:", X.shape);
console.log("  Chunks:", X.chunks);
console.log("  Dtype:", X.dtype);

// Open obs and var groups
const obs = await z.openGroup("obs");
console.log("\nobs attributes:", obs.attrs);

const varGroup = await z.openGroup("var");
console.log("var attributes:", varGroup.attrs);

// Read a small slice: first 5 cells x first 10 genes
const slice = await zarr.get(X, [zarr.slice(5), zarr.slice(10)]);
console.log("\nX[0:5, 0:10]:");
console.log("  Shape:", slice.shape);
console.log("  Data:", slice.data);
