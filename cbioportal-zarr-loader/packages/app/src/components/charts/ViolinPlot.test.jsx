import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import ViolinPlot from "./ViolinPlot";

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

const defaultProps = {
  groups,
  violins,
  containerWidth: 600,
  height: 400,
};

describe("ViolinPlot", () => {
  it("renders an SVG with violin paths", () => {
    const { container } = render(<ViolinPlot {...defaultProps} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    const paths = svg.querySelectorAll("path");
    expect(paths.length).toBe(groups.length);
  });

  it("renders median lines for each violin", () => {
    const { container } = render(<ViolinPlot {...defaultProps} />);
    const svg = container.querySelector("svg");
    // Each violin has a median line (white, strokeWidth=2)
    const lines = [...svg.querySelectorAll("line")].filter(
      (l) => l.getAttribute("stroke") === "#fff" && l.getAttribute("stroke-width") === "2"
    );
    expect(lines.length).toBe(groups.length);
  });

  it("renders axis labels when provided", () => {
    const { container } = render(
      <ViolinPlot {...defaultProps} xLabel="cell_type" yLabel="EGFR" />
    );
    const texts = [...container.querySelectorAll("text")];
    const textContents = texts.map((t) => t.textContent);
    expect(textContents).toContain("cell_type");
    expect(textContents).toContain("EGFR");
  });

  it("renders tick labels for each group", () => {
    const { container } = render(<ViolinPlot {...defaultProps} />);
    const texts = [...container.querySelectorAll("text")];
    const textContents = texts.map((t) => t.textContent);
    expect(textContents).toContain("TypeA");
    expect(textContents).toContain("TypeB");
  });

  it("renders boxplot overlay when showBoxplot is true", () => {
    const { container } = render(
      <ViolinPlot {...defaultProps} showBoxplot boxplotStats={boxplotStats} />
    );
    const svg = container.querySelector("svg");
    // Each group gets a boxplot overlay with an IQR rect
    const rects = svg.querySelectorAll("rect");
    expect(rects.length).toBe(groups.length);
    // Whisker lines + caps: 3 lines per group (whisker + 2 caps) + median = 4 dark lines per group
    const darkLines = [...svg.querySelectorAll("line")].filter(
      (l) => l.getAttribute("stroke") === "#333"
    );
    expect(darkLines.length).toBe(groups.length * 4);
  });

  it("does not render boxplot overlay when showBoxplot is false", () => {
    const { container } = render(
      <ViolinPlot {...defaultProps} showBoxplot={false} boxplotStats={boxplotStats} />
    );
    const svg = container.querySelector("svg");
    const rects = svg.querySelectorAll("rect");
    expect(rects.length).toBe(0);
  });

  it("returns null when violins is empty", () => {
    const { container } = render(<ViolinPlot groups={[]} violins={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("scrolls horizontally when many groups exceed container width", () => {
    const manyGroups = Array.from({ length: 30 }, (_, i) => `Group${i}`);
    const manyViolins = manyGroups.map((g) => ({
      group: g,
      count: 3,
      median: 5,
      kde: { x: [0, 5, 10], density: [0.1, 0.3, 0.1] },
    }));
    const { container } = render(
      <ViolinPlot groups={manyGroups} violins={manyViolins} containerWidth={400} height={300} />
    );
    const wrapper = container.firstChild;
    expect(wrapper.style.overflowX).toBe("auto");
    const svg = container.querySelector("svg");
    const svgWidth = Number(svg.getAttribute("width"));
    expect(svgWidth).toBeGreaterThan(400);
  });
});
