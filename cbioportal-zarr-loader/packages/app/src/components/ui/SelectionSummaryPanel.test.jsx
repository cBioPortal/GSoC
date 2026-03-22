import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import SelectionSummaryPanel from "./SelectionSummaryPanel";

const baseProps = {
  selectedCount: 150,
  categoryColorMap: {
    ClusterA: [31, 119, 180],
    ClusterB: [255, 127, 14],
  },
  colorColumn: "celltype",
  selectedGene: "TP53",
  maxHeight: 400,
  selectionSummary: {
    categoryBreakdown: null,
    expressionStats: null,
    tooltipBreakdowns: {},
  },
};

afterEach(cleanup);

describe("SelectionSummaryPanel", () => {
  it("renders selection count header", () => {
    render(<SelectionSummaryPanel {...baseProps} />);
    expect(screen.getByText("Selection Summary (150 cells)")).toBeInTheDocument();
  });

  it("renders category breakdown with color swatches and percentages", () => {
    render(
      <SelectionSummaryPanel
        {...baseProps}
        selectedCount={100}
        selectionSummary={{
          ...baseProps.selectionSummary,
          categoryBreakdown: [
            ["ClusterA", 70],
            ["ClusterB", 30],
          ],
        }}
      />
    );
    expect(screen.getByText("celltype")).toBeInTheDocument();
    expect(screen.getByText("ClusterA")).toBeInTheDocument();
    expect(screen.getByText("ClusterB")).toBeInTheDocument();
    expect(screen.getByText("70 (70.0%)")).toBeInTheDocument();
    expect(screen.getByText("30 (30.0%)")).toBeInTheDocument();
  });

  it("hides category section when categoryBreakdown is null", () => {
    render(<SelectionSummaryPanel {...baseProps} />);
    expect(screen.queryByText("celltype")).not.toBeInTheDocument();
  });

  it("renders expression stats (mean, min, max) formatted to 4 decimals", () => {
    render(
      <SelectionSummaryPanel
        {...baseProps}
        selectionSummary={{
          ...baseProps.selectionSummary,
          expressionStats: { mean: 1.23456, min: 0.00123, max: 5.67891 },
        }}
      />
    );
    expect(screen.getByText("TP53 expression")).toBeInTheDocument();
    expect(screen.getByText("Mean")).toBeInTheDocument();
    expect(screen.getByText("1.2346")).toBeInTheDocument();
    expect(screen.getByText("Min")).toBeInTheDocument();
    expect(screen.getByText("0.0012")).toBeInTheDocument();
    expect(screen.getByText("Max")).toBeInTheDocument();
    expect(screen.getByText("5.6789")).toBeInTheDocument();
  });

  it("hides expression section when expressionStats is null", () => {
    render(<SelectionSummaryPanel {...baseProps} />);
    expect(screen.queryByText("TP53 expression")).not.toBeInTheDocument();
  });

  it("renders tooltip column multi-select with options and selected values", () => {
    const onTooltipChange = vi.fn();
    render(
      <SelectionSummaryPanel
        {...baseProps}
        obsColumns={["cell_type", "donor_id", "Phase"]}
        tooltipColumns={["cell_type"]}
        onTooltipChange={onTooltipChange}
        tooltipColumnLoading={null}
      />
    );
    // The multi-select combobox should be rendered
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("hides tooltip column select when obsColumns is empty", () => {
    render(
      <SelectionSummaryPanel
        {...baseProps}
        obsColumns={[]}
        tooltipColumns={[]}
        onTooltipChange={vi.fn()}
        tooltipColumnLoading={null}
      />
    );
    expect(screen.queryByText("Add tooltip columns...")).not.toBeInTheDocument();
  });

  it("renders tooltip breakdowns via CollapsibleBreakdown", () => {
    render(
      <SelectionSummaryPanel
        {...baseProps}
        selectedCount={10}
        selectionSummary={{
          ...baseProps.selectionSummary,
          tooltipBreakdowns: {
            tissue: [
              ["brain", 6],
              ["liver", 4],
            ],
          },
        }}
      />
    );
    expect(screen.getByText("tissue")).toBeInTheDocument();
    expect(screen.getByText("brain")).toBeInTheDocument();
    expect(screen.getByText("6 (60.0%)")).toBeInTheDocument();
    expect(screen.getByText("liver")).toBeInTheDocument();
    expect(screen.getByText("4 (40.0%)")).toBeInTheDocument();
  });
});

describe("CollapsibleBreakdown", () => {
  const manyItems = Array.from({ length: 8 }, (_, i) => [`item${i}`, (8 - i) * 10]);

  it("shows first 5 items by default", () => {
    render(
      <SelectionSummaryPanel
        {...baseProps}
        selectedCount={360}
        selectionSummary={{
          ...baseProps.selectionSummary,
          tooltipBreakdowns: { status: manyItems },
        }}
      />
    );
    // First 5 items should be visible
    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`item${i}`)).toBeInTheDocument();
    }
    // Items beyond 5 should not be visible
    expect(screen.queryByText("item5")).not.toBeInTheDocument();
    expect(screen.queryByText("item6")).not.toBeInTheDocument();
    expect(screen.queryByText("item7")).not.toBeInTheDocument();
    // "Show all" link should be visible
    expect(screen.getByText("Show all (8)")).toBeInTheDocument();
  });

  it("expands to show all items on click", () => {
    render(
      <SelectionSummaryPanel
        {...baseProps}
        selectedCount={360}
        selectionSummary={{
          ...baseProps.selectionSummary,
          tooltipBreakdowns: { status: manyItems },
        }}
      />
    );
    fireEvent.click(screen.getByText("Show all (8)"));
    // All 8 items should now be visible
    for (let i = 0; i < 8; i++) {
      expect(screen.getByText(`item${i}`)).toBeInTheDocument();
    }
    // Should now show "Show less"
    expect(screen.getByText("Show less")).toBeInTheDocument();
  });
});
