import { describe, it, expect } from "vitest";
import calculateKDE from "./calculateKDE";

describe("calculateKDE", () => {
  // Helper: trapezoidal integration
  function trapz(x, y) {
    let sum = 0;
    for (let i = 1; i < x.length; i++) {
      sum += (x[i] - x[i - 1]) * (y[i] + y[i - 1]) / 2;
    }
    return sum;
  }

  const normalish = Array.from({ length: 200 }, (_, i) => {
    // deterministic pseudo-normal via simple transform
    const u = (i + 0.5) / 200;
    return 5 * (u - 0.5); // uniform [-2.5, 2.5]
  });

  it("returns correct shape with default nPoints", () => {
    const { x, density } = calculateKDE(normalish);
    expect(x).toHaveLength(512);
    expect(density).toHaveLength(512);
  });

  it("returns correct shape with custom nPoints", () => {
    const { x, density } = calculateKDE(normalish, { nPoints: 100 });
    expect(x).toHaveLength(100);
    expect(density).toHaveLength(100);
  });

  it("density values are non-negative", () => {
    const { density } = calculateKDE(normalish);
    for (const d of density) {
      expect(d).toBeGreaterThanOrEqual(0);
    }
  });

  it("density integrates to approximately 1", () => {
    const { x, density } = calculateKDE(normalish);
    const area = trapz(x, density);
    expect(area).toBeCloseTo(1, 1);
  });

  it("peak density is near the mean for symmetric input", () => {
    const { x, density } = calculateKDE(normalish);
    const maxIdx = density.indexOf(Math.max(...density));
    const peakX = x[maxIdx];
    // Mean of uniform [-2.5, 2.5] is 0
    expect(Math.abs(peakX)).toBeLessThan(0.5);
  });

  it("custom bandwidth works", () => {
    const { x, density } = calculateKDE(normalish, { bandwidth: 0.1 });
    const area = trapz(x, density);
    // Should still integrate to ~1 even with narrow bandwidth
    expect(area).toBeCloseTo(1, 1);
  });

  it("handles a single value", () => {
    const { x, density } = calculateKDE([42], { nPoints: 64 });
    expect(x).toHaveLength(64);
    expect(density).toHaveLength(64);
    // Should still be a valid density
    const area = trapz(x, density);
    expect(area).toBeCloseTo(1, 1);
  });

  it("handles constant values", () => {
    const { x, density } = calculateKDE([3, 3, 3, 3, 3], { nPoints: 64 });
    expect(x).toHaveLength(64);
    expect(density).toHaveLength(64);
    const area = trapz(x, density);
    expect(area).toBeCloseTo(1, 1);
  });

  it("handles Float32Array input", () => {
    const arr = new Float32Array([1, 2, 3, 4, 5]);
    const { x, density } = calculateKDE(arr, { nPoints: 64 });
    expect(x).toHaveLength(64);
    expect(density).toHaveLength(64);
  });

  it("returns empty arrays for empty input", () => {
    const { x, density } = calculateKDE([]);
    expect(x).toHaveLength(0);
    expect(density).toHaveLength(0);
  });
});
