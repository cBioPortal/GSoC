import { describe, it, expect } from "vitest";
import { ZarrStore } from "./ZarrStore";

const TEST_URL = `${globalThis.__TEST_BASE_URL__}/pbmc3k.zarr`;

describe("ZarrStore", () => {
  it("opens a zarr store and exposes store, root, and attrs", async () => {
    const z = await ZarrStore.open(TEST_URL);

    expect(z.store).toBeDefined();
    expect(z.root).toBeDefined();
    expect(z.attrs).toBeDefined();
  });

  it("attrs contains AnnData encoding metadata", async () => {
    const z = await ZarrStore.open(TEST_URL);

    expect(z.attrs).toHaveProperty("encoding-type", "anndata");
    expect(z.attrs).toHaveProperty("encoding-version");
  });

  it("openArray returns an array with shape and dtype", async () => {
    const z = await ZarrStore.open(TEST_URL);
    const X = await z.openArray("X");

    expect(X.shape).toBeDefined();
    expect(X.dtype).toBeDefined();
  });

  it("openGroup returns a group with attrs", async () => {
    const z = await ZarrStore.open(TEST_URL);
    const obs = await z.openGroup("obs");

    expect(obs.attrs).toBeDefined();
  });
});
