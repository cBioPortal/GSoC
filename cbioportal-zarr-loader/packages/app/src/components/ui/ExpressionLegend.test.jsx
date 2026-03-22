import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ExpressionLegend from "./ExpressionLegend";

const baseProps = {
  selectedGene: "BRCA1",
  expressionRange: { min: 0.5, max: 9.75 },
  colorScaleName: "viridis",
};

afterEach(cleanup);

describe("ExpressionLegend", () => {
  it("renders the gene name label", () => {
    render(<ExpressionLegend {...baseProps} />);
    expect(screen.getByText("BRCA1")).toBeInTheDocument();
  });

  it("displays min, max, and midpoint values formatted to 2 decimals", () => {
    render(<ExpressionLegend {...baseProps} />);
    expect(screen.getByText("9.75")).toBeInTheDocument(); // max
    expect(screen.getByText("0.50")).toBeInTheDocument(); // min
    expect(screen.getByText("5.13")).toBeInTheDocument(); // midpoint (0.5+9.75)/2 = 5.125 -> 5.13
  });

  it("renders the gradient bar element", () => {
    const { container } = render(<ExpressionLegend {...baseProps} />);
    const gradientBar = container.querySelector(
      '[style*="linear-gradient"]'
    );
    expect(gradientBar).toBeInTheDocument();
    expect(gradientBar.style.width).toBe("20px");
    expect(gradientBar.style.height).toBe("200px");
  });

  it("handles different color scale names (magma)", () => {
    const { container } = render(
      <ExpressionLegend {...baseProps} colorScaleName="magma" />
    );
    const gradientBar = container.querySelector(
      '[style*="linear-gradient"]'
    );
    expect(gradientBar).toBeInTheDocument();
    // Magma starts with rgb(0,0,4) — verify it appears in the gradient
    expect(gradientBar.style.background).toContain("rgb(0, 0, 4)");
  });
});
