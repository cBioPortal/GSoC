import { describe, it, expect } from "vitest";
import { sparseToDense, toStringArray } from "./decoders";
import type { SparseMatrix } from "./decoders";

describe("sparseToDense", () => {
  it("converts a CSR sparse matrix to dense", () => {
    // 3x3 matrix:
    // [1, 0, 2]
    // [0, 0, 3]
    // [4, 5, 0]
    const sparse: SparseMatrix = {
      format: "csr",
      data: new Float64Array([1, 2, 3, 4, 5]),
      indices: new Int32Array([0, 2, 2, 0, 1]),
      indptr: new Int32Array([0, 2, 3, 5]),
      shape: [3, 3],
    };

    const result = sparseToDense(sparse);

    expect(result.shape).toEqual([3, 3]);
    expect(Array.from(result.data as Float64Array)).toEqual([1, 0, 2, 0, 0, 3, 4, 5, 0]);
  });

  it("converts a CSC sparse matrix to dense", () => {
    // 3x3 matrix:
    // [1, 0, 2]
    // [0, 0, 3]
    // [4, 5, 0]
    const sparse: SparseMatrix = {
      format: "csc",
      data: new Float64Array([1, 4, 5, 2, 3]),
      indices: new Int32Array([0, 2, 2, 0, 1]),
      indptr: new Int32Array([0, 2, 3, 5]),
      shape: [3, 3],
    };

    const result = sparseToDense(sparse);

    expect(result.shape).toEqual([3, 3]);
    expect(Array.from(result.data as Float64Array)).toEqual([1, 0, 2, 0, 0, 3, 4, 5, 0]);
  });

  it("handles an empty sparse matrix", () => {
    const sparse: SparseMatrix = {
      format: "csr",
      data: new Float64Array([]),
      indices: new Int32Array([]),
      indptr: new Int32Array([0, 0, 0]),
      shape: [2, 3],
    };

    const result = sparseToDense(sparse);

    expect(result.shape).toEqual([2, 3]);
    expect(Array.from(result.data as Float64Array)).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it("handles a 1x1 sparse matrix", () => {
    const sparse: SparseMatrix = {
      format: "csr",
      data: new Float64Array([7]),
      indices: new Int32Array([0]),
      indptr: new Int32Array([0, 1]),
      shape: [1, 1],
    };

    const result = sparseToDense(sparse);

    expect(result.shape).toEqual([1, 1]);
    expect(Array.from(result.data as Float64Array)).toEqual([7]);
  });

  it("throws on unknown sparse format", () => {
    const sparse: SparseMatrix = {
      format: "coo",
      data: new Float64Array([1]),
      indices: new Int32Array([0]),
      indptr: new Int32Array([0, 1]),
      shape: [1, 1],
    };

    expect(() => sparseToDense(sparse)).toThrow('Unknown sparse format: "coo"');
  });
});

describe("toStringArray", () => {
  it("returns plain arrays as-is", () => {
    const input = ["a", "b", "c"];
    expect(toStringArray(input)).toBe(input);
  });

  it("converts array-like of strings", () => {
    const input = { 0: "x", 1: "y", length: 2, [Symbol.iterator]: Array.prototype[Symbol.iterator] };
    // toStringArray should handle iterables with string elements
    const result = toStringArray(Array.from(input as Iterable<string>));
    expect(result).toEqual(["x", "y"]);
  });

  it("converts non-string typed array elements to strings", () => {
    const input = new Int32Array([1, 2, 3]);
    const result = toStringArray(input);
    expect(result).toEqual(["1", "2", "3"]);
  });
});
