import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import HoverTooltip from "./HoverTooltip";

const baseHoverInfo = {
  x: 100,
  y: 200,
  object: {
    position: [1.23456789, -0.98765432],
    index: 0,
    category: "ClusterA",
    expression: 2.71828,
  },
};

const baseProps = {
  hoverInfo: baseHoverInfo,
  colorColumn: "celltype",
  selectedGene: "TP53",
  tooltipData: {},
  hasColorData: false,
  hasGeneExpression: false,
};

afterEach(cleanup);

describe("HoverTooltip", () => {
  it("renders x/y coordinates formatted to 4 decimals", () => {
    render(<HoverTooltip {...baseProps} />);
    expect(screen.getByText("x: 1.2346")).toBeInTheDocument();
    expect(screen.getByText("y: -0.9877")).toBeInTheDocument();
  });

  it("shows category when hasColorData is true", () => {
    render(<HoverTooltip {...baseProps} hasColorData={true} />);
    expect(screen.getByText("celltype: ClusterA")).toBeInTheDocument();
  });

  it("hides category when hasColorData is false", () => {
    render(<HoverTooltip {...baseProps} hasColorData={false} />);
    expect(screen.queryByText("celltype: ClusterA")).not.toBeInTheDocument();
  });

  it("shows gene expression when hasGeneExpression is true", () => {
    render(<HoverTooltip {...baseProps} hasGeneExpression={true} />);
    expect(screen.getByText("TP53: 2.7183")).toBeInTheDocument();
  });

  it("hides gene expression when hasGeneExpression is false", () => {
    render(<HoverTooltip {...baseProps} hasGeneExpression={false} />);
    expect(screen.queryByText(/TP53:/)).not.toBeInTheDocument();
  });

  it("renders all tooltip columns from tooltipData", () => {
    const tooltipData = {
      tissue: ["brain", "liver", "lung"],
      stage: ["I", "II", "III"],
    };
    render(
      <HoverTooltip
        {...baseProps}
        tooltipData={tooltipData}
        hoverInfo={{
          ...baseHoverInfo,
          object: { ...baseHoverInfo.object, index: 1 },
        }}
      />
    );
    expect(screen.getByText("tissue: liver")).toBeInTheDocument();
    expect(screen.getByText("stage: II")).toBeInTheDocument();
  });

  it("renders nothing extra with empty tooltipData", () => {
    const { container } = render(
      <HoverTooltip {...baseProps} tooltipData={{}} />
    );
    // Should have exactly 2 divs for x and y (plus the wrapper)
    const innerDivs = container.firstChild.querySelectorAll(":scope > div");
    expect(innerDivs).toHaveLength(2); // x and y only
  });
});

// --- Hexbin tooltip tests ---

const hexHoverInfo = {
  x: 50,
  y: 75,
  object: {
    hexCount: 120,
    binIndices: [0, 1, 2, 3, 4],
  },
};

const hexProps = {
  hoverInfo: hexHoverInfo,
  colorColumn: "celltype",
  selectedGene: "TP53",
  tooltipData: {},
  hasColorData: false,
  hasGeneExpression: false,
};

describe("HoverTooltip — hexbin mode", () => {
  it("renders hex bin count", () => {
    render(<HoverTooltip {...hexProps} />);
    expect(screen.getByText("Count: 120")).toBeInTheDocument();
  });

  it("does not render scatter-mode fields (x/y)", () => {
    render(<HoverTooltip {...hexProps} />);
    expect(screen.queryByText(/^x:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^y:/)).not.toBeInTheDocument();
  });

  it("renders mean expression when present", () => {
    render(
      <HoverTooltip
        {...hexProps}
        hoverInfo={{
          ...hexHoverInfo,
          object: { ...hexHoverInfo.object, meanExpression: 1.5678 },
        }}
      />
    );
    expect(screen.getByText("Mean TP53: 1.5678")).toBeInTheDocument();
  });

  it("does not render mean expression when absent", () => {
    render(<HoverTooltip {...hexProps} />);
    expect(screen.queryByText(/Mean TP53/)).not.toBeInTheDocument();
  });

  it("renders dominant category when present", () => {
    render(
      <HoverTooltip
        {...hexProps}
        hoverInfo={{
          ...hexHoverInfo,
          object: { ...hexHoverInfo.object, dominantCategory: "T cell", dominantCount: 80 },
        }}
      />
    );
    expect(screen.getByText("celltype: T cell (80)")).toBeInTheDocument();
  });

  it("does not render dominant category when absent", () => {
    render(<HoverTooltip {...hexProps} />);
    expect(screen.queryByText(/celltype:/)).not.toBeInTheDocument();
  });

  it("renders tooltip column breakdowns with counts and percentages", () => {
    const tooltipData = {
      tissue: ["brain", "liver", "brain", "brain", "lung"],
    };
    render(
      <HoverTooltip
        {...hexProps}
        tooltipData={tooltipData}
        hoverInfo={{
          ...hexHoverInfo,
          object: { hexCount: 5, binIndices: [0, 1, 2, 3, 4] },
        }}
      />
    );
    expect(screen.getByText("tissue")).toBeInTheDocument();
    expect(screen.getByText("brain")).toBeInTheDocument();
    expect(screen.getByText("3 (60.0%)")).toBeInTheDocument();
    expect(screen.getByText("liver")).toBeInTheDocument();
    expect(screen.getByText("lung")).toBeInTheDocument();
    // liver and lung both have 1 (20.0%)
    expect(screen.getAllByText("1 (20.0%)")).toHaveLength(2);
  });

  it("renders multiple tooltip column breakdowns", () => {
    const tooltipData = {
      tissue: ["brain", "liver", "brain"],
      stage: ["I", "II", "I"],
    };
    render(
      <HoverTooltip
        {...hexProps}
        tooltipData={tooltipData}
        hoverInfo={{
          ...hexHoverInfo,
          object: { hexCount: 3, binIndices: [0, 1, 2] },
        }}
      />
    );
    expect(screen.getByText("tissue")).toBeInTheDocument();
    expect(screen.getByText("stage")).toBeInTheDocument();
  });

  it("renders no breakdowns when tooltipData is empty", () => {
    const { container } = render(<HoverTooltip {...hexProps} tooltipData={{}} />);
    // Only the count div
    const innerDivs = container.firstChild.querySelectorAll(":scope > div");
    expect(innerDivs).toHaveLength(1);
  });

  it("renders no breakdowns when binIndices is absent", () => {
    const { container } = render(
      <HoverTooltip
        {...hexProps}
        tooltipData={{ tissue: ["brain", "liver"] }}
        hoverInfo={{
          ...hexHoverInfo,
          object: { hexCount: 10 },
        }}
      />
    );
    // Only the count div, no breakdown sections
    expect(screen.queryByText("tissue")).not.toBeInTheDocument();
  });

  it("limits breakdowns to top 5 values", () => {
    // 7 unique values, should only show 5
    const values = ["a", "b", "c", "d", "e", "f", "g"];
    const tooltipData = { col: values };
    render(
      <HoverTooltip
        {...hexProps}
        tooltipData={tooltipData}
        hoverInfo={{
          ...hexHoverInfo,
          object: { hexCount: 7, binIndices: [0, 1, 2, 3, 4, 5, 6] },
        }}
      />
    );
    // Each value has count 1, sorted alphabetically after tie-breaking
    // Only 5 should render
    const percentLabels = screen.getAllByText("1 (14.3%)");
    expect(percentLabels).toHaveLength(5);
  });

  it("shows fallback text when hex object has no hexCount", () => {
    render(
      <HoverTooltip
        {...hexProps}
        hoverInfo={{ x: 0, y: 0, object: {} }}
      />
    );
    expect(screen.getByText("Bin selected")).toBeInTheDocument();
  });
});
