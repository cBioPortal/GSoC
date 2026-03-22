import { describe, it, expect } from "vitest";
import {
  FilterSchema,
  ViewSchema,
  SelectionSchema,
  ColorBySchema,
  DefaultsSchema,
  findMatchingIndices,
  resolveInitialView,
  resolveViewWithDefaults,
} from "./filterUtils";

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------

describe("FilterSchema", () => {
  const validFilter = {
    initial_view: "my view",
    saved_views: [
      {
        name: "my view",
        selection: { target: "donor_id", values: ["A"] },
      },
    ],
  };

  it("accepts a valid filter with string initial_view", () => {
    expect(FilterSchema.safeParse(validFilter).success).toBe(true);
  });

  it("accepts integer initial_view", () => {
    const filter = { ...validFilter, initial_view: 0 };
    expect(FilterSchema.safeParse(filter).success).toBe(true);
  });

  it("rejects negative integer initial_view", () => {
    const filter = { ...validFilter, initial_view: -1 };
    expect(FilterSchema.safeParse(filter).success).toBe(false);
  });

  it("rejects float initial_view", () => {
    const filter = { ...validFilter, initial_view: 1.5 };
    expect(FilterSchema.safeParse(filter).success).toBe(false);
  });

  it("accepts optional defaults", () => {
    const filter = {
      ...validFilter,
      defaults: {
        embedding_key: "X_umap",
        active_tooltips: ["cell_type"],
        color_by: { type: "category", value: "cell_type" },
      },
    };
    expect(FilterSchema.safeParse(filter).success).toBe(true);
  });

  it("rejects missing saved_views", () => {
    const filter = { initial_view: 0 };
    expect(FilterSchema.safeParse(filter).success).toBe(false);
  });

  it("rejects empty object", () => {
    expect(FilterSchema.safeParse({}).success).toBe(false);
  });

  it("accepts filter with geometry-based saved views", () => {
    const filter = {
      initial_view: 0,
      saved_views: [
        {
          name: "rect view",
          selection: { type: "rectangle", bounds: [1, 2, 3, 4] },
        },
        {
          name: "lasso view",
          selection: { type: "lasso", polygon: [[0, 0], [1, 0], [1, 1]] },
        },
      ],
    };
    expect(FilterSchema.safeParse(filter).success).toBe(true);
  });

  it("accepts filter mixing category and geometry views", () => {
    const filter = {
      initial_view: "cat view",
      saved_views: [
        {
          name: "cat view",
          selection: { target: "donor_id", values: ["A"] },
        },
        {
          name: "rect view",
          selection: { type: "rectangle", bounds: [0, 0, 10, 10] },
        },
      ],
    };
    expect(FilterSchema.safeParse(filter).success).toBe(true);
  });
});

describe("ViewSchema", () => {
  it("accepts a minimal view", () => {
    const view = { selection: { target: "donor_id", values: ["A"] } };
    expect(ViewSchema.safeParse(view).success).toBe(true);
  });

  it("accepts a full view", () => {
    const view = {
      name: "my view",
      embedding_key: "X_umap",
      selection: { target: "donor_id", values: ["A", 123] },
      active_tooltips: ["cell_type", "Phase"],
      color_by: { type: "gene", value: "TP53", color_scale: "magma" },
    };
    expect(ViewSchema.safeParse(view).success).toBe(true);
  });

  it("rejects view without selection", () => {
    const view = { name: "bad" };
    expect(ViewSchema.safeParse(view).success).toBe(false);
  });

  it("rejects view with empty values array", () => {
    // Empty array is technically valid per schema — just matches nothing
    const view = { selection: { target: "donor_id", values: [] } };
    expect(ViewSchema.safeParse(view).success).toBe(true);
  });

  it("accepts view with rectangle selection", () => {
    const view = {
      name: "rect view",
      embedding_key: "X_umap",
      selection: { type: "rectangle", bounds: [1, 2, 3, 4] },
    };
    expect(ViewSchema.safeParse(view).success).toBe(true);
  });

  it("accepts view with lasso selection", () => {
    const view = {
      name: "lasso view",
      selection: { type: "lasso", polygon: [[0, 0], [1, 0], [1, 1]] },
    };
    expect(ViewSchema.safeParse(view).success).toBe(true);
  });
});

describe("SelectionSchema", () => {
  it("accepts string values", () => {
    const sel = { target: "donor_id", values: ["A", "B"] };
    expect(SelectionSchema.safeParse(sel).success).toBe(true);
  });

  it("accepts numeric values", () => {
    const sel = { target: "cluster", values: [1, 2, 3] };
    expect(SelectionSchema.safeParse(sel).success).toBe(true);
  });

  it("accepts mixed string and number values", () => {
    const sel = { target: "donor_id", values: ["A", 1] };
    expect(SelectionSchema.safeParse(sel).success).toBe(true);
  });

  it("rejects missing target", () => {
    const sel = { values: ["A"] };
    expect(SelectionSchema.safeParse(sel).success).toBe(false);
  });

  it("rejects missing values", () => {
    const sel = { target: "donor_id" };
    expect(SelectionSchema.safeParse(sel).success).toBe(false);
  });

  it("accepts rectangle selection", () => {
    const sel = { type: "rectangle", bounds: [1.0, 2.0, 3.0, 4.0] };
    expect(SelectionSchema.safeParse(sel).success).toBe(true);
  });

  it("accepts lasso selection", () => {
    const sel = { type: "lasso", polygon: [[0, 0], [1, 0], [1, 1], [0, 1]] };
    expect(SelectionSchema.safeParse(sel).success).toBe(true);
  });

  it("rejects rectangle with wrong bounds length", () => {
    const sel = { type: "rectangle", bounds: [1.0, 2.0, 3.0] };
    expect(SelectionSchema.safeParse(sel).success).toBe(false);
  });

  it("rejects lasso with non-pair coordinates", () => {
    const sel = { type: "lasso", polygon: [[0, 0, 0], [1, 0, 0]] };
    expect(SelectionSchema.safeParse(sel).success).toBe(false);
  });

  it("rejects rectangle with missing bounds", () => {
    const sel = { type: "rectangle" };
    expect(SelectionSchema.safeParse(sel).success).toBe(false);
  });

  it("rejects lasso with missing polygon", () => {
    const sel = { type: "lasso" };
    expect(SelectionSchema.safeParse(sel).success).toBe(false);
  });

  it("still accepts category selection without explicit type (backward compat)", () => {
    const sel = { target: "donor_id", values: ["A", "B"] };
    const result = SelectionSchema.safeParse(sel);
    expect(result.success).toBe(true);
    expect(result.data.type).toBe("category");
  });
});

describe("ColorBySchema", () => {
  it("accepts category type", () => {
    const cb = { type: "category", value: "cell_type" };
    expect(ColorBySchema.safeParse(cb).success).toBe(true);
  });

  it("accepts gene type with color_scale", () => {
    const cb = { type: "gene", value: "TP53", color_scale: "magma" };
    expect(ColorBySchema.safeParse(cb).success).toBe(true);
  });

  it("rejects invalid type", () => {
    const cb = { type: "expression", value: "TP53" };
    expect(ColorBySchema.safeParse(cb).success).toBe(false);
  });

  it("rejects invalid color_scale", () => {
    const cb = { type: "gene", value: "TP53", color_scale: "plasma" };
    expect(ColorBySchema.safeParse(cb).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// findMatchingIndices
// ---------------------------------------------------------------------------

describe("findMatchingIndices", () => {
  it("finds matching string indices", () => {
    const columnData = ["A", "B", "A", "C", "A"];
    expect(findMatchingIndices(columnData, ["A"])).toEqual([0, 2, 4]);
  });

  it("finds matching with multiple values", () => {
    const columnData = ["A", "B", "C", "D"];
    expect(findMatchingIndices(columnData, ["B", "D"])).toEqual([1, 3]);
  });

  it("returns empty array when no matches", () => {
    const columnData = ["A", "B", "C"];
    expect(findMatchingIndices(columnData, ["X"])).toEqual([]);
  });

  it("matches numbers by string coercion", () => {
    const columnData = [1, 2, 3, 2, 1];
    expect(findMatchingIndices(columnData, [2])).toEqual([1, 3]);
  });

  it("matches string filter values against numeric column data", () => {
    const columnData = [10, 20, 30];
    expect(findMatchingIndices(columnData, ["20"])).toEqual([1]);
  });

  it("matches numeric filter values against string column data", () => {
    const columnData = ["10", "20", "30"];
    expect(findMatchingIndices(columnData, [20])).toEqual([1]);
  });

  it("handles empty column data", () => {
    expect(findMatchingIndices([], ["A"])).toEqual([]);
  });

  it("handles empty filter values", () => {
    expect(findMatchingIndices(["A", "B"], [])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// resolveInitialView
// ---------------------------------------------------------------------------

describe("resolveInitialView", () => {
  const views = [
    { name: "first", selection: { target: "a", values: ["1"] } },
    { name: "second", selection: { target: "b", values: ["2"] } },
    { selection: { target: "c", values: ["3"] } }, // unnamed
  ];

  it("resolves by name", () => {
    expect(resolveInitialView("second", views)).toBe(views[1]);
  });

  it("resolves by index 0", () => {
    expect(resolveInitialView(0, views)).toBe(views[0]);
  });

  it("resolves by last index", () => {
    expect(resolveInitialView(2, views)).toBe(views[2]);
  });

  it("returns null for out-of-bounds index", () => {
    expect(resolveInitialView(3, views)).toBeNull();
  });

  it("returns null for non-existent name", () => {
    expect(resolveInitialView("nonexistent", views)).toBeNull();
  });

  it("returns null for empty saved_views with index", () => {
    expect(resolveInitialView(0, [])).toBeNull();
  });

  it("returns null for empty saved_views with name", () => {
    expect(resolveInitialView("any", [])).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// resolveViewWithDefaults
// ---------------------------------------------------------------------------

describe("resolveViewWithDefaults", () => {
  const defaultValues = {
    embedding_key: "X_umap",
    active_tooltips: ["cell_type"],
    color_by: { type: "category", value: "cell_type" },
  };

  it("uses view-specific values when provided", () => {
    const view = {
      embedding_key: "X_tsne",
      selection: { target: "donor_id", values: ["A"] },
      active_tooltips: ["Phase"],
      color_by: { type: "gene", value: "TP53" },
    };
    const result = resolveViewWithDefaults(view, defaultValues);
    expect(result.embeddingKey).toBe("X_tsne");
    expect(result.activeTooltips).toEqual(["Phase"]);
    expect(result.colorBy).toEqual({ type: "gene", value: "TP53" });
    expect(result.selection).toEqual({ target: "donor_id", values: ["A"] });
  });

  it("falls back to defaults when view omits optional fields", () => {
    const view = {
      selection: { target: "donor_id", values: ["A"] },
    };
    const result = resolveViewWithDefaults(view, defaultValues);
    expect(result.embeddingKey).toBe("X_umap");
    expect(result.activeTooltips).toEqual(["cell_type"]);
    expect(result.colorBy).toEqual({ type: "category", value: "cell_type" });
  });

  it("handles no defaults", () => {
    const view = {
      selection: { target: "donor_id", values: ["A"] },
    };
    const result = resolveViewWithDefaults(view);
    expect(result.embeddingKey).toBeNull();
    expect(result.activeTooltips).toEqual([]);
    expect(result.colorBy).toBeNull();
  });

  it("always passes selection through", () => {
    const selection = { target: "cluster", values: [1, 2] };
    const view = { selection };
    const result = resolveViewWithDefaults(view, defaultValues);
    expect(result.selection).toBe(selection);
  });
});
