import { describe, it, expect } from "vitest";
import { maxOf, minOf } from "./mathUtils";

describe("maxOf", () => {
  it("finds the maximum value in an array", () => {
    expect(maxOf([3, 1, 4, 1, 5, 9])).toBe(9);
  });

  it("works with an accessor function", () => {
    const data = [{ v: 10 }, { v: 30 }, { v: 20 }];
    expect(maxOf(data, (d) => d.v)).toBe(30);
  });

  it("returns -Infinity for an empty array", () => {
    expect(maxOf([])).toBe(-Infinity);
  });

  it("handles a single element", () => {
    expect(maxOf([42])).toBe(42);
  });

  it("handles negative values", () => {
    expect(maxOf([-5, -3, -8])).toBe(-3);
  });

  it("does not overflow the stack with large arrays", () => {
    const large = Array.from({ length: 500_000 }, (_, i) => i);
    expect(maxOf(large)).toBe(499_999);
  });
});

describe("minOf", () => {
  it("finds the minimum value in an array", () => {
    expect(minOf([3, 1, 4, 1, 5, 9])).toBe(1);
  });

  it("works with an accessor function", () => {
    const data = [{ v: 10 }, { v: 30 }, { v: 20 }];
    expect(minOf(data, (d) => d.v)).toBe(10);
  });

  it("returns Infinity for an empty array", () => {
    expect(minOf([])).toBe(Infinity);
  });

  it("handles a single element", () => {
    expect(minOf([42])).toBe(42);
  });

  it("handles negative values", () => {
    expect(minOf([-5, -3, -8])).toBe(-8);
  });

  it("does not overflow the stack with large arrays", () => {
    const large = Array.from({ length: 500_000 }, (_, i) => i);
    expect(minOf(large)).toBe(0);
  });
});
