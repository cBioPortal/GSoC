import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import Dotplot from "./Dotplot";

afterEach(cleanup);

const genes = ["EGFR", "TP53"];
const groups = ["TypeA", "TypeB"];
const data = [
  { gene: "EGFR", group: "TypeA", meanExpression: 1.5, fractionExpressing: 0.8, cellCount: 100, expressingCount: 80 },
  { gene: "EGFR", group: "TypeB", meanExpression: 0.3, fractionExpressing: 0.2, cellCount: 50, expressingCount: 10 },
  { gene: "TP53", group: "TypeA", meanExpression: 0.0, fractionExpressing: 0.0, cellCount: 100, expressingCount: 0 },
  { gene: "TP53", group: "TypeB", meanExpression: 2.1, fractionExpressing: 0.9, cellCount: 50, expressingCount: 45 },
];

const defaultProps = {
  genes,
  groups,
  data,
  width: 600,
  height: 400,
};

describe("Dotplot", () => {
  it("renders one circle per data point", () => {
    const { container } = render(<Dotplot {...defaultProps} />);
    const svg = container.querySelector("svg");
    const circles = svg.querySelectorAll("circle");
    // 4 data circles + 5 size legend circles (0.2, 0.4, 0.6, 0.8, 1.0)
    const legendCircles = container.querySelectorAll("svg:not(:first-child) circle");
    const dataCircles = circles.length - legendCircles.length;
    expect(dataCircles).toBe(data.length);
  });

  it("renders non-expressing dots with empty fill (#f0f0f0)", () => {
    const { container } = render(<Dotplot {...defaultProps} />);
    const svg = container.querySelector("svg");
    const circles = [...svg.querySelectorAll("circle")];
    // TP53 in TypeA has fractionExpressing=0
    const emptyDots = circles.filter((c) => c.getAttribute("fill") === "#f0f0f0");
    expect(emptyDots.length).toBeGreaterThanOrEqual(1);
  });

  it("renders integer axis labels by default (no showLabels)", () => {
    const { container } = render(<Dotplot {...defaultProps} />);
    const svg = container.querySelector("svg");
    const texts = [...svg.querySelectorAll("text")];
    const textContents = texts.map((t) => t.textContent);
    // Groups should appear as integers 1, 2 on x-axis
    expect(textContents).toContain("1");
    expect(textContents).toContain("2");
    // Gene names should appear on y-axis
    expect(textContents).toContain("EGFR");
    expect(textContents).toContain("TP53");
  });

  it("renders group name labels when showLabels is true", () => {
    const { container } = render(<Dotplot {...defaultProps} showLabels />);
    const svg = container.querySelector("svg");
    const texts = [...svg.querySelectorAll("text")];
    const textContents = texts.map((t) => t.textContent);
    expect(textContents).toContain("TypeA");
    expect(textContents).toContain("TypeB");
  });

  it("swaps axes when swapAxes is true", () => {
    const { container } = render(<Dotplot {...defaultProps} swapAxes showLabels />);
    const svg = container.querySelector("svg");
    const texts = [...svg.querySelectorAll("text")];
    const textContents = texts.map((t) => t.textContent);
    // With swapped axes + showLabels: genes on x (bottom axis), groups on y (left axis)
    // Both gene names and group names should still be present
    expect(textContents).toContain("EGFR");
    expect(textContents).toContain("TP53");
    expect(textContents).toContain("TypeA");
    expect(textContents).toContain("TypeB");
  });

  it("renders the mean expression color legend", () => {
    const { container } = render(<Dotplot {...defaultProps} />);
    expect(container.textContent).toContain("Mean expr");
  });

  it("renders the fraction size legend", () => {
    const { container } = render(<Dotplot {...defaultProps} />);
    expect(container.textContent).toContain("Fraction");
    // Legend shows percentage labels
    expect(container.textContent).toContain("20%");
    expect(container.textContent).toContain("100%");
  });

  it("renders with a single gene and single group", () => {
    const singleData = [
      { gene: "EGFR", group: "TypeA", meanExpression: 1.0, fractionExpressing: 1.0, cellCount: 10, expressingCount: 10 },
    ];
    const { container } = render(
      <Dotplot genes={["EGFR"]} groups={["TypeA"]} data={singleData} width={300} height={200} />,
    );
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    const circles = svg.querySelectorAll("circle");
    expect(circles.length).toBeGreaterThanOrEqual(1);
  });

  it("accepts magma color scale", () => {
    // Should render without error
    const { container } = render(<Dotplot {...defaultProps} colorScaleName="magma" />);
    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
  });
});
