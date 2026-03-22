import { describe, it, expect } from "vitest";
import { computeBoxplotStats } from "./boxplotUtils";

describe("computeBoxplotStats", () => {
  it("computes correct statistics for a simple dataset", () => {
    // 5-number summary for TypeA [1, 2, 3, 4, 5]:
    //   min=1, Q1=2, median=3, Q3=4, max=5, IQR=2, whiskerLow=1, whiskerHigh=5
    const data = [
      { cat: "TypeA", val: 1 },
      { cat: "TypeA", val: 2 },
      { cat: "TypeA", val: 3 },
      { cat: "TypeA", val: 4 },
      { cat: "TypeA", val: 5 },
    ];
    const { groups, stats } = computeBoxplotStats(data, "cat", "val");

    expect(groups).toEqual(["TypeA"]);
    expect(stats).toHaveLength(1);

    const s = stats[0];
    expect(s.group).toBe("TypeA");
    expect(s.count).toBe(5);
    expect(s.min).toBe(1);
    expect(s.max).toBe(5);
    expect(s.median).toBe(3);
    expect(s.q1).toBe(2);
    expect(s.q3).toBe(4);
    expect(s.whiskerLow).toBe(1);
    expect(s.whiskerHigh).toBe(5);
    expect(s.outliers).toEqual([]);
  });

  it("detects outliers beyond 1.5*IQR", () => {
    // Values: [1, 2, 3, 4, 5, 100]
    // Q1=2, Q3=5 (approx), IQR=3, upper fence=5+4.5=9.5 => 100 is outlier
    const data = [
      { cat: "A", val: 1 },
      { cat: "A", val: 2 },
      { cat: "A", val: 3 },
      { cat: "A", val: 4 },
      { cat: "A", val: 5 },
      { cat: "A", val: 100 },
    ];
    const { stats } = computeBoxplotStats(data, "cat", "val");
    expect(stats[0].outliers).toContain(100);
    expect(stats[0].whiskerHigh).toBeLessThan(100);
  });

  it("handles multiple groups", () => {
    const data = [
      { cat: "A", val: 10 },
      { cat: "A", val: 20 },
      { cat: "B", val: 30 },
      { cat: "B", val: 40 },
    ];
    const { groups, stats } = computeBoxplotStats(data, "cat", "val");

    expect(groups).toEqual(["A", "B"]);
    expect(stats).toHaveLength(2);

    const a = stats.find((s) => s.group === "A");
    expect(a.count).toBe(2);
    expect(a.min).toBe(10);
    expect(a.max).toBe(20);

    const b = stats.find((s) => s.group === "B");
    expect(b.count).toBe(2);
    expect(b.min).toBe(30);
    expect(b.max).toBe(40);
  });

  it("returns empty result for null or empty data", () => {
    expect(computeBoxplotStats(null, "cat", "val")).toEqual({ groups: [], stats: [] });
    expect(computeBoxplotStats([], "cat", "val")).toEqual({ groups: [], stats: [] });
  });

  it("handles single value per group", () => {
    const data = [{ cat: "X", val: 42 }];
    const { stats } = computeBoxplotStats(data, "cat", "val");
    expect(stats).toHaveLength(1);
    expect(stats[0].min).toBe(42);
    expect(stats[0].max).toBe(42);
    expect(stats[0].median).toBe(42);
    expect(stats[0].q1).toBe(42);
    expect(stats[0].q3).toBe(42);
    expect(stats[0].outliers).toEqual([]);
  });

  it("handles all identical values", () => {
    const data = [
      { cat: "A", val: 5 },
      { cat: "A", val: 5 },
      { cat: "A", val: 5 },
      { cat: "A", val: 5 },
    ];
    const { stats } = computeBoxplotStats(data, "cat", "val");
    expect(stats[0].min).toBe(5);
    expect(stats[0].max).toBe(5);
    expect(stats[0].q1).toBe(5);
    expect(stats[0].q3).toBe(5);
    expect(stats[0].median).toBe(5);
    expect(stats[0].whiskerLow).toBe(5);
    expect(stats[0].whiskerHigh).toBe(5);
    expect(stats[0].outliers).toEqual([]);
  });

  it("skips rows with null category or value", () => {
    const data = [
      { cat: "A", val: 1 },
      { cat: null, val: 2 },
      { cat: "A", val: null },
      { cat: "A", val: 3 },
    ];
    const { stats } = computeBoxplotStats(data, "cat", "val");
    expect(stats).toHaveLength(1);
    expect(stats[0].count).toBe(2); // only val=1 and val=3
  });

  it("sorts groups alphabetically", () => {
    const data = [
      { cat: "Zebra", val: 1 },
      { cat: "Apple", val: 2 },
      { cat: "Mango", val: 3 },
    ];
    const { groups } = computeBoxplotStats(data, "cat", "val");
    expect(groups).toEqual(["Apple", "Mango", "Zebra"]);
  });

  it("snaps whiskers to actual data points, not fence values", () => {
    // Values: [1, 2, 10, 11, 12, 13, 100]
    // Q1=2, Q3=13 (approx via d3), IQR=11
    // Upper fence = 13 + 16.5 = 29.5 — but no data point at 29.5
    // whiskerHigh should be 13 (last data point within fence), not 29.5
    const data = [
      { cat: "A", val: 1 },
      { cat: "A", val: 2 },
      { cat: "A", val: 10 },
      { cat: "A", val: 11 },
      { cat: "A", val: 12 },
      { cat: "A", val: 13 },
      { cat: "A", val: 100 },
    ];
    const { stats } = computeBoxplotStats(data, "cat", "val");
    // whiskerHigh should be an actual data value, not the fence
    expect([1, 2, 10, 11, 12, 13, 100]).toContain(stats[0].whiskerHigh);
    expect(stats[0].whiskerHigh).toBeLessThanOrEqual(13);
    expect(stats[0].outliers).toContain(100);
  });

  it("detects low outliers", () => {
    // Values: [-100, 10, 11, 12, 13, 14]
    // Q1≈10.25, Q3≈13.75, IQR=3.5, lower fence=10.25-5.25=5 => -100 is low outlier
    const data = [
      { cat: "A", val: -100 },
      { cat: "A", val: 10 },
      { cat: "A", val: 11 },
      { cat: "A", val: 12 },
      { cat: "A", val: 13 },
      { cat: "A", val: 14 },
    ];
    const { stats } = computeBoxplotStats(data, "cat", "val");
    expect(stats[0].outliers).toContain(-100);
    expect(stats[0].whiskerLow).toBeGreaterThan(-100);
  });
});
