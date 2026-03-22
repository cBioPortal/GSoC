import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import BoxPlot from "./BoxPlot";

afterEach(cleanup);

const groups = ["TypeA", "TypeB"];
const stats = [
  { group: "TypeA", min: 1, q1: 2, median: 3, q3: 4, max: 5, whiskerLow: 1, whiskerHigh: 5, outliers: [], count: 5 },
  { group: "TypeB", min: 8, q1: 9, median: 10, q3: 11, max: 12, whiskerLow: 8, whiskerHigh: 12, outliers: [], count: 4 },
];

const defaultProps = { groups, stats, containerWidth: 600, height: 400 };

describe("BoxPlot", () => {
  it("renders an SVG with one rect (IQR box) per group", () => {
    const { container } = render(<BoxPlot {...defaultProps} />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    const rects = svg.querySelectorAll("rect");
    expect(rects.length).toBe(groups.length);
  });

  it("renders whisker lines and caps for each group", () => {
    const { container } = render(<BoxPlot {...defaultProps} />);
    const svg = container.querySelector("svg");
    // Per group: 1 whisker line + 2 caps + 1 median = 4 lines
    // Plus axis lines from AxisBottom/AxisLeft
    const groupLines = [...svg.querySelectorAll("line")].filter(
      (l) => l.getAttribute("stroke") === "#555" || l.getAttribute("stroke") === "#fff"
    );
    // 3 whisker/cap lines (#555) + 1 median (#fff) = 4 per group
    expect(groupLines.length).toBe(groups.length * 4);
  });

  it("renders median lines (white) for each group", () => {
    const { container } = render(<BoxPlot {...defaultProps} />);
    const svg = container.querySelector("svg");
    const medianLines = [...svg.querySelectorAll("line")].filter(
      (l) => l.getAttribute("stroke") === "#fff" && l.getAttribute("stroke-width") === "2"
    );
    expect(medianLines.length).toBe(groups.length);
  });

  it("renders outlier circles", () => {
    const statsWithOutliers = [
      { ...stats[0], outliers: [-5, 20] },
      { ...stats[1], outliers: [50] },
    ];
    const { container } = render(
      <BoxPlot groups={groups} stats={statsWithOutliers} containerWidth={600} height={400} />
    );
    const svg = container.querySelector("svg");
    const circles = svg.querySelectorAll("circle");
    expect(circles.length).toBe(3);
  });

  it("renders no outlier circles when there are none", () => {
    const { container } = render(<BoxPlot {...defaultProps} />);
    const svg = container.querySelector("svg");
    const circles = svg.querySelectorAll("circle");
    expect(circles.length).toBe(0);
  });

  it("renders axis labels when provided", () => {
    const { container } = render(
      <BoxPlot {...defaultProps} xLabel="cell_type" yLabel="EGFR" />
    );
    const texts = [...container.querySelectorAll("text")];
    const textContents = texts.map((t) => t.textContent);
    expect(textContents).toContain("cell_type");
    expect(textContents).toContain("EGFR");
  });

  it("does not render axis labels when not provided", () => {
    const { container } = render(<BoxPlot {...defaultProps} />);
    const texts = [...container.querySelectorAll("text")];
    const textContents = texts.map((t) => t.textContent);
    expect(textContents).not.toContain("cell_type");
    expect(textContents).not.toContain("EGFR");
  });

  it("renders tick labels for each group", () => {
    const { container } = render(<BoxPlot {...defaultProps} />);
    const texts = [...container.querySelectorAll("text")];
    const textContents = texts.map((t) => t.textContent);
    expect(textContents).toContain("TypeA");
    expect(textContents).toContain("TypeB");
  });

  it("returns null when stats is empty", () => {
    const { container } = render(<BoxPlot groups={[]} stats={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("returns null when stats is null", () => {
    const { container } = render(<BoxPlot groups={[]} stats={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("scrolls horizontally when many groups exceed container width", () => {
    const manyGroups = Array.from({ length: 30 }, (_, i) => `Group${i}`);
    const manyStats = manyGroups.map((g) => ({
      group: g, min: 0, q1: 2, median: 5, q3: 8, max: 10,
      whiskerLow: 0, whiskerHigh: 10, outliers: [], count: 10,
    }));
    const { container } = render(
      <BoxPlot groups={manyGroups} stats={manyStats} containerWidth={400} height={300} />
    );
    const wrapper = container.firstChild;
    expect(wrapper.style.overflowX).toBe("auto");
    const svg = container.querySelector("svg");
    const svgWidth = Number(svg.getAttribute("width"));
    expect(svgWidth).toBeGreaterThan(400);
  });
});
