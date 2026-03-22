import { describe, it, expect, beforeEach } from "vitest";
import useAppStore from "./useAppStore";

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.setState(useAppStore.getInitialState());
  });

  it("has the expected initial state", () => {
    const state = useAppStore.getState();

    expect(state.loading).toBe(true);
    expect(state.adata).toBeNull();
    expect(state.metadata).toBeNull();
    expect(state.obsColumnsSelected).toEqual([]);
    expect(state.obsColumnsData).toEqual({});
    expect(state.obsColumnLoading).toBeNull();
    expect(state.varColumnsSelected).toEqual([]);
    expect(state.varColumnsData).toEqual({});
    expect(state.varColumnLoading).toBeNull();
    expect(state.obsIndex).toBeNull();
    expect(state.varIndex).toBeNull();
  });
});
