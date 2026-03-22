import { renderHook } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { usePlotsData } from "./usePlotsData";

function makeExpression(values: number[]): Float32Array {
  return new Float32Array(values);
}

describe("usePlotsData", () => {
  it("returns empty defaults when expression is null", () => {
    const { result } = renderHook(() =>
      usePlotsData(null, null, null, null, null),
    );
    expect(result.current.frequentValues).toEqual([]);
    expect(result.current.data).toBeNull();
    expect(result.current.categoryCount).toBe(0);
    expect(result.current.tooManyCategories).toBe(false);
    expect(result.current.boxplotData).toBeNull();
    expect(result.current.violinData).toBeNull();
  });

  it("computes frequentValues from expression data", () => {
    const expr = makeExpression([1.0, 1.0, 2.0, 3.0]);
    const { result } = renderHook(() =>
      usePlotsData(expr, null, null, null, null),
    );
    expect(result.current.frequentValues).toHaveLength(3);
    expect(result.current.frequentValues[0].value).toBe(1);
    expect(result.current.frequentValues[0].label).toContain("2x");
  });

  it("combines expression and obs data into records", () => {
    const expr = makeExpression([1.5, 2.5, 3.5]);
    const obs = ["A", "B", "A"];
    const { result } = renderHook(() =>
      usePlotsData(expr, obs, "cell_type", "EGFR", null),
    );
    expect(result.current.data).toHaveLength(3);
    expect(result.current.data![0]).toEqual({ cell_type: "A", EGFR: 1.5 });
    expect(result.current.categoryCount).toBe(2);
    expect(result.current.tooManyCategories).toBe(false);
  });

  it("filters out excluded expression value", () => {
    const expr = makeExpression([0, 0, 1.0, 2.0]);
    const obs = ["A", "B", "A", "B"];
    const { result } = renderHook(() =>
      usePlotsData(expr, obs, "group", "GEN1", 0),
    );
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data!.every((d) => d["GEN1"] !== 0)).toBe(true);
  });

  it("flags tooManyCategories when over threshold", () => {
    const n = 250;
    const expr = makeExpression(Array.from({ length: n }, (_, i) => i));
    const obs = Array.from({ length: n }, (_, i) => `cat_${i}`);
    const { result } = renderHook(() =>
      usePlotsData(expr, obs, "group", "GEN1", null),
    );
    expect(result.current.categoryCount).toBe(250);
    expect(result.current.tooManyCategories).toBe(true);
    expect(result.current.boxplotData).toBeNull();
    expect(result.current.violinData).toBeNull();
  });

  it("computes boxplotData and violinData when categories are within threshold", () => {
    const expr = makeExpression([1, 2, 3, 4, 5, 6]);
    const obs = ["A", "A", "A", "B", "B", "B"];
    const { result } = renderHook(() =>
      usePlotsData(expr, obs, "group", "GEN1", null),
    );
    expect(result.current.boxplotData).not.toBeNull();
    expect(result.current.violinData).not.toBeNull();
    expect(result.current.boxplotData!.groups).toEqual(["A", "B"]);
    expect(result.current.violinData!.groups).toEqual(["A", "B"]);
  });
});
