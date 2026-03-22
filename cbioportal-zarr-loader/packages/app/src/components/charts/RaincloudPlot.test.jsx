import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import RaincloudPlot from "./RaincloudPlot";

afterEach(cleanup);

const groups = ["TypeA", "TypeB"];
const violins = [
  {
    group: "TypeA",
    count: 5,
    median: 3,
    kde: {
      x: [0, 1, 2, 3, 4, 5, 6],
      density: [0.01, 0.05, 0.15, 0.2, 0.15, 0.05, 0.01],
    },
  },
  {
    group: "TypeB",
    count: 4,
    median: 10,
    kde: {
      x: [7, 8, 9, 10, 11, 12, 13],
      density: [0.02, 0.08, 0.18, 0.22, 0.18, 0.08, 0.02],
    },
  },
];

const boxplotStats = [
  { group: "TypeA", min: 1, q1: 2, median: 3, q3: 4, max: 5, whiskerLow: 1, whiskerHigh: 5, outliers: [], count: 5 },
  { group: "TypeB", min: 8, q1: 9, median: 10, q3: 11, max: 12, whiskerLow: 8, whiskerHigh: 12, outliers: [], count: 4 },
];

const stripData = [
  { cell_type: "TypeA", EGFR: 1 },
  { cell_type: "TypeA", EGFR: 2 },
  { cell_type: "TypeA", EGFR: 3 },
  { cell_type: "TypeA", EGFR: 4 },
  { cell_type: "TypeA", EGFR: 5 },
  { cell_type: "TypeB", EGFR: 8 },
  { cell_type: "TypeB", EGFR: 9 },
  { cell_type: "TypeB", EGFR: 10 },
  { cell_type: "TypeB", EGFR: 11 },
];

const defaultProps = {
  groups,
  violins,
  containerWidth: 600,
  height: 400,
};

describe("RaincloudPlot", () => {
  // --- Empty / null ---

  it("returns null when violins is empty", () => {
    const { container } = render(<RaincloudPlot groups={[]} violins={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("returns null when violins is null", () => {
    const { container } = render(<RaincloudPlot groups={[]} violins={null} />);
    expect(container.innerHTML).toBe("");
  });

  // --- Half-violin ---

  it("renders an SVG with one path (half-violin) per group", () => {
    const { container } = render(<RaincloudPlot {...defaultProps} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    const paths = svg.querySelectorAll("path");
    expect(paths.length).toBe(groups.length);
  });

  // --- Boxplot ---

  it("renders boxplot elements when boxplotStats provided", () => {
    const { container } = render(
      <RaincloudPlot {...defaultProps} boxplotStats={boxplotStats} />
    );
    const svg = container.querySelector("svg");
    // One IQR rect per group
    const rects = svg.querySelectorAll("rect");
    expect(rects.length).toBe(groups.length);
    // Per group: 1 whisker + 2 caps + 1 median = 4 dark lines
    const darkLines = [...svg.querySelectorAll("line")].filter(
      (l) => l.getAttribute("stroke") === "#333"
    );
    expect(darkLines.length).toBe(groups.length * 4);
  });

  it("does not render boxplot elements when boxplotStats not provided", () => {
    const { container } = render(<RaincloudPlot {...defaultProps} />);
    const svg = container.querySelector("svg");
    const rects = svg.querySelectorAll("rect");
    expect(rects.length).toBe(0);
  });

  // --- Strip plot ---

  it("renders strip plot circles when data is provided", () => {
    const { container } = render(
      <RaincloudPlot
        {...defaultProps}
        data={stripData}
        categoryField="cell_type"
        valueField="EGFR"
      />
    );
    const svg = container.querySelector("svg");
    const circles = svg.querySelectorAll("circle");
    expect(circles.length).toBe(stripData.length);
  });

  it("does not render strip circles when data is not provided", () => {
    const { container } = render(<RaincloudPlot {...defaultProps} />);
    const svg = container.querySelector("svg");
    const circles = svg.querySelectorAll("circle");
    expect(circles.length).toBe(0);
  });

  // --- Axis labels ---

  it("renders axis labels when provided (horizontal)", () => {
    const { container } = render(
      <RaincloudPlot {...defaultProps} xLabel="EGFR" yLabel="cell_type" />
    );
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toContain("EGFR");
    expect(texts).toContain("cell_type");
  });

  it("renders axis labels when provided (vertical)", () => {
    const { container } = render(
      <RaincloudPlot {...defaultProps} horizontal={false} xLabel="cell_type" yLabel="EGFR" />
    );
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toContain("cell_type");
    expect(texts).toContain("EGFR");
  });

  // --- Tick labels ---

  it("renders tick labels for each group (horizontal)", () => {
    const { container } = render(<RaincloudPlot {...defaultProps} />);
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toContain("TypeA");
    expect(texts).toContain("TypeB");
  });

  it("renders tick labels for each group (vertical)", () => {
    const { container } = render(<RaincloudPlot {...defaultProps} horizontal={false} />);
    const texts = [...container.querySelectorAll("text")].map((t) => t.textContent);
    expect(texts).toContain("TypeA");
    expect(texts).toContain("TypeB");
  });

  // --- Orientation ---

  it("defaults to horizontal orientation", () => {
    const { container } = render(<RaincloudPlot {...defaultProps} />);
    const svg = container.querySelector("svg");
    const svgHeight = Number(svg.getAttribute("height"));
    // Horizontal mode scales height by groups * MIN_BAND_HEIGHT (80)
    expect(svgHeight).toBeGreaterThanOrEqual(400);
  });

  it("renders in vertical orientation when horizontal=false", () => {
    const { container } = render(
      <RaincloudPlot {...defaultProps} horizontal={false} />
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    // Vertical mode uses heightProp directly
    const svgHeight = Number(svg.getAttribute("height"));
    expect(svgHeight).toBe(400);
  });

  // --- All three layers together ---

  it("renders all three layers (half-violin, boxplot, strip) together", () => {
    const { container } = render(
      <RaincloudPlot
        {...defaultProps}
        boxplotStats={boxplotStats}
        data={stripData}
        categoryField="cell_type"
        valueField="EGFR"
      />
    );
    const svg = container.querySelector("svg");
    // Half-violins
    expect(svg.querySelectorAll("path").length).toBe(groups.length);
    // Boxplot rects
    expect(svg.querySelectorAll("rect").length).toBe(groups.length);
    // Strip circles
    expect(svg.querySelectorAll("circle").length).toBe(stripData.length);
  });

  // --- Horizontal scroll (vertical mode) ---

  it("scrolls horizontally when many groups exceed container width in vertical mode", () => {
    const manyGroups = Array.from({ length: 30 }, (_, i) => `Group${i}`);
    const manyViolins = manyGroups.map((g) => ({
      group: g,
      count: 3,
      median: 5,
      kde: { x: [0, 5, 10], density: [0.1, 0.3, 0.1] },
    }));
    const { container } = render(
      <RaincloudPlot
        groups={manyGroups}
        violins={manyViolins}
        horizontal={false}
        containerWidth={400}
        height={300}
      />
    );
    const wrapper = container.firstChild;
    expect(wrapper.style.overflowX).toBe("auto");
    const svg = container.querySelector("svg");
    const svgWidth = Number(svg.getAttribute("width"));
    expect(svgWidth).toBeGreaterThan(400);
  });
});
