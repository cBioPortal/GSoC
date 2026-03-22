import * as zarr from "zarrita";
import type { Readable } from "zarrita";

export class ZarrStore {
  store: zarr.FetchStore;
  root: zarr.Group<Readable>;
  attrs: Record<string, unknown>;

  constructor(store: zarr.FetchStore, root: zarr.Group<Readable>) {
    this.store = store;
    this.root = root;
    this.attrs = root.attrs;
  }

  static async open(url: string): Promise<ZarrStore> {
    const store = new zarr.FetchStore(url);
    const root = await zarr.open(store, { kind: "group" });
    return new ZarrStore(store, root);
  }

  async openArray(path: string): Promise<zarr.Array<zarr.DataType, Readable>> {
    return zarr.open(this.root.resolve(path), { kind: "array" });
  }

  async openGroup(path: string): Promise<zarr.Group<Readable>> {
    return zarr.open(this.root.resolve(path), { kind: "group" });
  }
}
