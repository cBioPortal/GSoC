import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchFeatureFlags } from "./featureFlags";

function setQueryString(qs) {
  Object.defineProperty(window, "location", {
    value: { search: qs },
    writable: true,
  });
}

beforeEach(() => {
  vi.stubEnv("VITE_FEATURE_FLAGS_URL", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  setQueryString("");
});

describe("fetchFeatureFlags", () => {
  it("returns local flags when no remote URL and no query params", async () => {
    const flags = await fetchFeatureFlags();
    expect(flags).toEqual({ heatmap: false, dotplot: false, raincloud: false, hexbin: false });
  });

  it("overrides a single flag via ?ff=dotplot", async () => {
    setQueryString("?ff=dotplot");
    const flags = await fetchFeatureFlags();
    expect(flags.dotplot).toBe(true);
    expect(flags.heatmap).toBe(false);
  });

  it("overrides multiple flags via ?ff=dotplot,heatmap", async () => {
    setQueryString("?ff=dotplot,heatmap");
    const flags = await fetchFeatureFlags();
    expect(flags.dotplot).toBe(true);
    expect(flags.heatmap).toBe(true);
  });

  it("adds unknown flags from query params", async () => {
    setQueryString("?ff=newFeature");
    const flags = await fetchFeatureFlags();
    expect(flags.newFeature).toBe(true);
    expect(flags.heatmap).toBe(false);
    expect(flags.dotplot).toBe(false);
  });

  it("trims whitespace around flag names", async () => {
    setQueryString("?ff=%20dotplot%20,%20heatmap%20");
    const flags = await fetchFeatureFlags();
    expect(flags.dotplot).toBe(true);
    expect(flags.heatmap).toBe(true);
  });

  it("returns local flags unchanged when ?ff is absent", async () => {
    setQueryString("?other=value");
    const flags = await fetchFeatureFlags();
    expect(flags).toEqual({ heatmap: false, dotplot: false, raincloud: false, hexbin: false });
  });

  it("fetches remote flags when VITE_FEATURE_FLAGS_URL is set", async () => {
    const remote = { heatmap: true, dotplot: false, beta: true };
    vi.stubEnv("VITE_FEATURE_FLAGS_URL", "https://example.com/flags.json");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(remote),
    });
    const flags = await fetchFeatureFlags();
    expect(flags).toEqual(remote);
  });

  it("query params override remote flags", async () => {
    const remote = { heatmap: false, dotplot: false };
    vi.stubEnv("VITE_FEATURE_FLAGS_URL", "https://example.com/flags.json");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(remote),
    });
    setQueryString("?ff=dotplot");
    const flags = await fetchFeatureFlags();
    expect(flags.dotplot).toBe(true);
    expect(flags.heatmap).toBe(false);
  });

  it("falls back to local flags when remote fetch fails", async () => {
    vi.stubEnv("VITE_FEATURE_FLAGS_URL", "https://example.com/flags.json");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    const flags = await fetchFeatureFlags();
    expect(flags).toEqual({ heatmap: false, dotplot: false, raincloud: false, hexbin: false });
  });

  it("falls back to local flags when remote returns non-ok", async () => {
    vi.stubEnv("VITE_FEATURE_FLAGS_URL", "https://example.com/flags.json");
    vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: false, status: 500 });
    const flags = await fetchFeatureFlags();
    expect(flags).toEqual({ heatmap: false, dotplot: false, raincloud: false, hexbin: false });
  });
});
