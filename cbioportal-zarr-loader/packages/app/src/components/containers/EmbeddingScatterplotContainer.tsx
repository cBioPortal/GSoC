import { useMemo, useCallback } from "react";
import useAppStore from "../../store/useAppStore";
import { COLOR_SCALES } from "../../utils/colors";
import {
  buildScatterplotPoints,
  buildSelectionSummary,
  computeRange,
  sortCategoriesByCount,
  buildHexCategoryColorConfig,
} from "../../utils/scatterplotUtils";
import EmbeddingScatterplot from "../charts/EmbeddingScatterplot";
import type { ScatterPoint, ScatterBounds, ExpressionRange, HexColorMode, SelectionGeometry, SelectionSummary } from "../charts/EmbeddingScatterplot";

interface EmbeddingScatterplotContainerProps {
  data: Float32Array;
  shape: [number, number];
  label: string;
  maxPoints?: number;
  onSaveSelection?: () => void;
  showHexbinToggle?: boolean;
}

interface AppStoreSlice {
  colorColumn: string | null;
  colorData: unknown[] | null;
  selectedGene: string | null;
  geneExpression: Float32Array | null;
  tooltipData: Record<string, unknown[]>;
  tooltipColumns: string[];
  toggleTooltipColumn: (col: string) => void;
  tooltipColumnLoading: string | null;
  metadata: { obsColumns: string[] } | null;
  selectedPointIndices: number[];
  setSelectedPoints: (indices: number[]) => void;
  clearSelectedPoints: () => void;
  selectionGeometry: SelectionGeometry | null;
  setSelectionGeometry: (geo: SelectionGeometry | null) => void;
  colorScaleName: string;
  setColorScaleName: (name: string) => void;
}

export default function EmbeddingScatterplotContainer({
  data,
  shape,
  label,
  maxPoints = Infinity,
  onSaveSelection,
  showHexbinToggle = false,
}: EmbeddingScatterplotContainerProps) {
  const {
    colorColumn,
    colorData,
    selectedGene,
    geneExpression,
    tooltipData,
    tooltipColumns,
    toggleTooltipColumn,
    tooltipColumnLoading,
    metadata,
    selectedPointIndices,
    setSelectedPoints,
    clearSelectedPoints,
    selectionGeometry,
    setSelectionGeometry,
    colorScaleName,
    setColorScaleName,
  } = useAppStore() as AppStoreSlice;

  const expressionRange = useMemo(
    () => computeRange(geneExpression) as ExpressionRange | null,
    [geneExpression],
  );

  const { points, categoryColorMap, bounds } = useMemo(
    () => buildScatterplotPoints({ data, shape, maxPoints, colorData, geneExpression }) as {
      points: ScatterPoint[];
      categoryColorMap: Record<string, [number, number, number]>;
      bounds: ScatterBounds | null;
    },
    [data, shape, colorData, geneExpression, maxPoints],
  );

  const selectedSet = useMemo(
    () => new Set(selectedPointIndices),
    [selectedPointIndices],
  );

  const hasCategories = !!(colorData && Object.keys(categoryColorMap).length > 0);
  const hexColorMode: HexColorMode = geneExpression ? "expression" : hasCategories ? "category" : "density";

  const hexColorConfig = useMemo(() => {
    if (hexColorMode === "expression") {
      return {
        getColorWeight: (d: ScatterPoint) => d.expression ?? 0,
        colorAggregation: "MEAN",
        colorRange: (COLOR_SCALES as Record<string, number[][]>)[colorScaleName],
        colorDomain: expressionRange ? [expressionRange.min, expressionRange.max] : undefined,
        colorScaleType: "linear",
      };
    }
    if (hexColorMode === "category") {
      return buildHexCategoryColorConfig(categoryColorMap);
    }
    return {
      colorRange: [
        [224, 240, 255],
        [174, 214, 255],
        [124, 186, 255],
        [74, 160, 255],
        [24, 144, 255],
        [8, 100, 200],
      ],
    };
  }, [hexColorMode, colorScaleName, expressionRange, points, categoryColorMap]);

  const hexData = useMemo(
    () => selectedSet.size > 0 ? points.filter((p: ScatterPoint) => selectedSet.has(p.index)) : points,
    [points, selectedSet],
  );

  const sortedCategories = useMemo(
    () => (colorData ? sortCategoriesByCount(categoryColorMap, points) : []) as Array<[string, [number, number, number]]>,
    [categoryColorMap, colorData, points],
  );

  const selectionSummary = useMemo(
    () => buildSelectionSummary({
      selectedSet,
      points,
      hasColorData: hasCategories,
      hasGeneExpression: !!geneExpression,
      tooltipData,
    }) as SelectionSummary,
    [selectedSet, points, hasCategories, geneExpression, tooltipData],
  );

  return (
    <EmbeddingScatterplot
      data={data}
      shape={shape}
      label={label}
      maxPoints={maxPoints}
      onSaveSelection={onSaveSelection}
      showHexbinToggle={showHexbinToggle}
      points={points}
      categoryColorMap={categoryColorMap}
      bounds={bounds}
      expressionRange={expressionRange}
      selectedSet={selectedSet}
      hexColorConfig={hexColorConfig}
      hexData={hexData}
      sortedCategories={sortedCategories}
      selectionSummary={selectionSummary}
      hasCategories={hasCategories}
      hexColorMode={hexColorMode}
      colorColumn={colorColumn}
      colorData={colorData}
      selectedGene={selectedGene}
      geneExpression={geneExpression}
      tooltipData={tooltipData}
      tooltipColumns={tooltipColumns}
      toggleTooltipColumn={toggleTooltipColumn}
      tooltipColumnLoading={tooltipColumnLoading}
      metadata={metadata}
      selectedPointIndices={selectedPointIndices}
      setSelectedPoints={setSelectedPoints}
      clearSelectedPoints={clearSelectedPoints}
      selectionGeometry={selectionGeometry}
      setSelectionGeometry={setSelectionGeometry}
      colorScaleName={colorScaleName}
      setColorScaleName={setColorScaleName}
    />
  );
}
