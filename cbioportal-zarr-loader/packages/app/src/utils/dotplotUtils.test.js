import { describe, it, expect } from "vitest";
import { computeDotplotStats } from "./dotplotUtils";

describe("computeDotplotStats", () => {
  const obsData = ["TypeA", "TypeA", "TypeB", "TypeB", "TypeA"];
  const groups = ["TypeA", "TypeB"];

  it("computes mean expression and fraction expressing per gene × group", () => {
    const genes = ["EGFR"];
    const geneExpressions = {
      // indices:    0    1    2    3    4
      EGFR: [1.0, 0.0, 2.0, 0.0, 3.0],
    };
    const stats = computeDotplotStats(genes, geneExpressions, obsData, groups);

    expect(stats).toHaveLength(2);

    const typeA = stats.find((s) => s.group === "TypeA");
    expect(typeA.gene).toBe("EGFR");
    expect(typeA.cellCount).toBe(3); // indices 0, 1, 4
    expect(typeA.expressingCount).toBe(2); // indices 0 (1.0) and 4 (3.0)
    expect(typeA.fractionExpressing).toBeCloseTo(2 / 3);
    expect(typeA.meanExpression).toBeCloseTo((1.0 + 0.0 + 3.0) / 3);

    const typeB = stats.find((s) => s.group === "TypeB");
    expect(typeB.cellCount).toBe(2); // indices 2, 3
    expect(typeB.expressingCount).toBe(1); // index 2 (2.0)
    expect(typeB.fractionExpressing).toBeCloseTo(0.5);
    expect(typeB.meanExpression).toBeCloseTo((2.0 + 0.0) / 2);
  });

  it("handles multiple genes", () => {
    const genes = ["EGFR", "TP53"];
    const geneExpressions = {
      EGFR: [1.0, 0.0, 0.0, 0.0, 0.0],
      TP53: [0.0, 0.0, 5.0, 5.0, 0.0],
    };
    const stats = computeDotplotStats(genes, geneExpressions, obsData, groups);

    expect(stats).toHaveLength(4); // 2 genes × 2 groups

    const egfrA = stats.find((s) => s.gene === "EGFR" && s.group === "TypeA");
    expect(egfrA.expressingCount).toBe(1);
    expect(egfrA.meanExpression).toBeCloseTo(1 / 3);

    const tp53B = stats.find((s) => s.gene === "TP53" && s.group === "TypeB");
    expect(tp53B.expressingCount).toBe(2);
    expect(tp53B.fractionExpressing).toBeCloseTo(1.0);
    expect(tp53B.meanExpression).toBeCloseTo(5.0);
  });

  it("returns null when genes array is empty", () => {
    expect(computeDotplotStats([], {}, obsData, groups)).toBeNull();
  });

  it("returns null when obsData is null", () => {
    expect(computeDotplotStats(["EGFR"], {}, null, groups)).toBeNull();
  });

  it("returns null when groups array is empty", () => {
    expect(computeDotplotStats(["EGFR"], {}, obsData, [])).toBeNull();
  });

  it("skips genes with no expression data", () => {
    const genes = ["EGFR", "MISSING"];
    const geneExpressions = {
      EGFR: [1.0, 1.0, 1.0, 1.0, 1.0],
    };
    const stats = computeDotplotStats(genes, geneExpressions, obsData, groups);

    expect(stats).toHaveLength(2); // only EGFR × 2 groups
    expect(stats.every((s) => s.gene === "EGFR")).toBe(true);
  });

  it("handles all-zero expression (no expressing cells)", () => {
    const genes = ["EGFR"];
    const geneExpressions = {
      EGFR: [0, 0, 0, 0, 0],
    };
    const stats = computeDotplotStats(genes, geneExpressions, obsData, groups);

    for (const s of stats) {
      expect(s.expressingCount).toBe(0);
      expect(s.fractionExpressing).toBe(0);
      expect(s.meanExpression).toBe(0);
    }
  });

  it("handles all cells expressing (all above baseline minimum)", () => {
    const genes = ["EGFR"];
    // Cell at index 2 has the baseline min (0); all others are above it
    const geneExpressions = {
      EGFR: [2, 3, 0, 5, 6],
    };
    const stats = computeDotplotStats(genes, geneExpressions, obsData, groups);

    // TypeA: indices 0,1,4 → values 2,3,6 — all above min (0) → fraction 1.0
    const typeA = stats.find((s) => s.group === "TypeA");
    expect(typeA.fractionExpressing).toBe(1);
    expect(typeA.expressingCount).toBe(typeA.cellCount);

    // TypeB: indices 2,3 → values 0,5 — one at min → fraction 0.5
    const typeB = stats.find((s) => s.group === "TypeB");
    expect(typeB.fractionExpressing).toBe(0.5);
    expect(typeB.expressingCount).toBe(1);
  });

  it("correctly thresholds log-normalized data with negative baseline", () => {
    const genes = ["CETN2"];
    // Simulates log-normalized values where non-expressing cells have a negative baseline
    const geneExpressions = {
      CETN2: [-0.56, -0.56, 1.2, -0.56, 2.5],
    };
    const stats = computeDotplotStats(genes, geneExpressions, obsData, groups);

    // TypeA: indices 0,1,4 → values -0.56, -0.56, 2.5 — one above min
    const typeA = stats.find((s) => s.group === "TypeA");
    expect(typeA.expressingCount).toBe(1);
    expect(typeA.fractionExpressing).toBeCloseTo(1 / 3);

    // TypeB: indices 2,3 → values 1.2, -0.56 — one above min
    const typeB = stats.find((s) => s.group === "TypeB");
    expect(typeB.expressingCount).toBe(1);
    expect(typeB.fractionExpressing).toBeCloseTo(0.5);
  });

  it("ignores obs values not in groups list", () => {
    const obs = ["TypeA", "TypeA", "TypeC", "TypeC", "TypeA"];
    const genes = ["EGFR"];
    const geneExpressions = {
      EGFR: [1, 1, 99, 99, 1],
    };
    // Only ask for TypeA — TypeC cells should be excluded
    const stats = computeDotplotStats(genes, geneExpressions, obs, ["TypeA"]);

    expect(stats).toHaveLength(1);
    expect(stats[0].cellCount).toBe(3);
    expect(stats[0].meanExpression).toBeCloseTo(1);
  });
});
