import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import CollapsibleLegend from "./CollapsibleLegend";

afterEach(cleanup);

const makeCategories = (n) =>
  Array.from({ length: n }, (_, i) => [`cat${i}`, [i * 10, i * 5, 200]]);

describe("CollapsibleLegend", () => {
  it("renders compact swatches by default (no text labels)", () => {
    const categories = makeCategories(5);
    const { container } = render(
      <CollapsibleLegend categories={categories} maxHeight={400} />
    );
    // Swatches are present via title attributes
    for (let i = 0; i < 5; i++) {
      expect(container.querySelector(`[title="cat${i}"]`)).toBeInTheDocument();
    }
    // Text labels are not rendered
    expect(screen.queryByText("cat0")).not.toBeInTheDocument();
  });

  it("renders color swatches with correct background colors", () => {
    const categories = [["TypeA", [31, 119, 180]]];
    const { container } = render(
      <CollapsibleLegend categories={categories} maxHeight={400} />
    );
    const swatch = container.querySelector('[style*="background-color"]');
    expect(swatch).toBeInTheDocument();
    expect(swatch.style.backgroundColor).toBe("rgb(31, 119, 180)");
  });

  it("clicking a swatch expands labels", () => {
    const categories = makeCategories(5);
    const { container } = render(
      <CollapsibleLegend categories={categories} maxHeight={400} />
    );
    fireEvent.click(container.querySelector('[title="cat0"]'));
    for (let i = 0; i < 5; i++) {
      expect(screen.getByText(`cat${i}`)).toBeInTheDocument();
    }
    expect(screen.getByText("Hide labels")).toBeInTheDocument();
  });

  it("shows only first 20 items when labels visible and categories exceed limit", () => {
    const categories = makeCategories(25);
    const { container } = render(
      <CollapsibleLegend categories={categories} maxHeight={400} />
    );
    // Expand labels by clicking a swatch
    fireEvent.click(container.querySelector('[title="cat0"]'));
    for (let i = 0; i < 20; i++) {
      expect(screen.getByText(`cat${i}`)).toBeInTheDocument();
    }
    expect(screen.queryByText("cat20")).not.toBeInTheDocument();
    expect(screen.getByText("Show all (25)")).toBeInTheDocument();
  });

  it("expands to show all items on click", () => {
    const categories = makeCategories(25);
    const { container } = render(
      <CollapsibleLegend categories={categories} maxHeight={400} />
    );
    fireEvent.click(container.querySelector('[title="cat0"]'));
    fireEvent.click(screen.getByText("Show all (25)"));
    for (let i = 0; i < 25; i++) {
      expect(screen.getByText(`cat${i}`)).toBeInTheDocument();
    }
    expect(screen.getByText("Show less")).toBeInTheDocument();
  });

  it("collapses back to limit on second click", () => {
    const categories = makeCategories(25);
    const { container } = render(
      <CollapsibleLegend categories={categories} maxHeight={400} />
    );
    fireEvent.click(container.querySelector('[title="cat0"]'));
    fireEvent.click(screen.getByText("Show all (25)"));
    fireEvent.click(screen.getByText("Show less"));
    expect(screen.queryByText("cat20")).not.toBeInTheDocument();
    expect(screen.getByText("Show all (25)")).toBeInTheDocument();
  });

  it("hides labels when 'Hide labels' is clicked", () => {
    const categories = makeCategories(5);
    const { container } = render(
      <CollapsibleLegend categories={categories} maxHeight={400} />
    );
    fireEvent.click(container.querySelector('[title="cat0"]'));
    expect(screen.getByText("cat0")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Hide labels"));
    expect(screen.queryByText("cat0")).not.toBeInTheDocument();
    // Swatches still present
    expect(container.querySelector('[title="cat0"]')).toBeInTheDocument();
  });
});
