import { describe, it, expect } from "vitest";
import { computeViolinStats } from "./violinUtils";

describe("computeViolinStats", () => {
  it("computes KDE curves grouped by category", () => {
    const data = [
      { cat: "A", val: 1 },
      { cat: "A", val: 2 },
      { cat: "A", val: 3 },
      { cat: "B", val: 10 },
      { cat: "B", val: 11 },
    ];
    const { groups, violins } = computeViolinStats(data, "cat", "val");

    expect(groups).toEqual(["A", "B"]);
    expect(violins).toHaveLength(2);

    const a = violins.find((v) => v.group === "A");
    expect(a.count).toBe(3);
    expect(a.kde.x.length).toBeGreaterThan(0);
    expect(a.kde.density.length).toBe(a.kde.x.length);

    const b = violins.find((v) => v.group === "B");
    expect(b.count).toBe(2);
  });

  it("returns empty result for null or empty data", () => {
    expect(computeViolinStats(null, "cat", "val")).toEqual({ groups: [], violins: [] });
    expect(computeViolinStats([], "cat", "val")).toEqual({ groups: [], violins: [] });
  });

  it("respects custom nPoints", () => {
    const data = [
      { cat: "A", val: 1 },
      { cat: "A", val: 2 },
      { cat: "A", val: 3 },
    ];
    const { violins } = computeViolinStats(data, "cat", "val", { nPoints: 64 });
    expect(violins[0].kde.x).toHaveLength(64);
    expect(violins[0].kde.density).toHaveLength(64);
  });

  it("density values are non-negative", () => {
    const data = Array.from({ length: 50 }, (_, i) => ({ cat: "A", val: i }));
    const { violins } = computeViolinStats(data, "cat", "val");
    for (const d of violins[0].kde.density) {
      expect(d).toBeGreaterThanOrEqual(0);
    }
  });

  it("sorts groups alphabetically", () => {
    const data = [
      { cat: "Zebra", val: 1 },
      { cat: "Apple", val: 2 },
    ];
    const { groups } = computeViolinStats(data, "cat", "val");
    expect(groups).toEqual(["Apple", "Zebra"]);
  });

  it("skips rows with null category or value", () => {
    const data = [
      { cat: "A", val: 1 },
      { cat: null, val: 2 },
      { cat: "A", val: null },
      { cat: "A", val: 3 },
    ];
    const { violins } = computeViolinStats(data, "cat", "val");
    expect(violins).toHaveLength(1);
    expect(violins[0].count).toBe(2);
  });
});
