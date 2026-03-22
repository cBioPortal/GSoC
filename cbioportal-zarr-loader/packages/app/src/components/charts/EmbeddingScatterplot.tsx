import { useState, useMemo, useRef, useCallback, useLayoutEffect } from "react";
import { Typography, Button, Select, Popover, Alert } from "antd";
import { ExpandOutlined, CompressOutlined, SelectOutlined, EditOutlined, CloseCircleOutlined, SaveOutlined, SettingOutlined, HeatMapOutlined, DotChartOutlined } from "@ant-design/icons";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer } from "@deck.gl/layers";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { OrthographicView } from "@deck.gl/core";
import { calculatePlotDimensions } from "../../utils/calculatePlotDimensions";
import { COLOR_SCALES, CATEGORICAL_COLORS } from "../../utils/colors";
import {
  computeViewState,
  getPointFillColor,
  MAX_CATEGORIES,
} from "../../utils/scatterplotUtils";
import HoverTooltip from "../ui/HoverTooltip";
import ExpressionLegend from "../ui/ExpressionLegend";
import SelectionSummaryPanel from "../ui/SelectionSummaryPanel";
import CollapsibleLegend from "../ui/CollapsibleLegend";
import SelectionOverlay from "../ui/SelectionOverlay";
import useSelectionInteraction from "../../hooks/useSelectionInteraction";

const { Text } = Typography;

export interface ScatterPoint {
  position: [number, number];
  category: string;
  colorIndex: number;
  index: number;
  expression: number | null;
}

export interface ScatterBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ExpressionRange {
  min: number;
  max: number;
}

export interface SelectionSummary {
  categoryBreakdown: Array<[string, number]> | null;
  expressionStats: { min: number; max: number; mean: number; count: number } | null;
  tooltipBreakdowns: Record<string, Array<[string, number]>>;
}

export type SelectionGeometry =
  | { type: "rectangle"; bounds: [number, number, number, number] }
  | { type: "lasso"; polygon: [number, number][] };

export type HexColorMode = "expression" | "category" | "density";

interface EmbeddingScatterplotProps {
  // Passthrough
  data: Float32Array;
  shape: [number, number];
  label: string;
  maxPoints?: number;
  onSaveSelection?: () => void;
  showHexbinToggle?: boolean;
  // Container-computed
  points: ScatterPoint[];
  categoryColorMap: Record<string, [number, number, number]>;
  bounds: ScatterBounds | null;
  expressionRange: ExpressionRange | null;
  selectedSet: Set<number>;
  hexColorConfig: Record<string, unknown>;
  hexData: ScatterPoint[];
  sortedCategories: Array<[string, [number, number, number]]>;
  selectionSummary: SelectionSummary;
  hasCategories: boolean;
  hexColorMode: HexColorMode;
  // Store reads
  colorColumn: string | null;
  colorData: unknown[] | null;
  selectedGene: string | null;
  geneExpression: Float32Array | null;
  tooltipData: Record<string, unknown[]>;
  tooltipColumns: string[];
  tooltipColumnLoading: string | null;
  metadata: { obsColumns: string[] } | null;
  selectedPointIndices: number[];
  selectionGeometry: SelectionGeometry | null;
  colorScaleName: string;
  // Store write callbacks
  setSelectedPoints: (indices: number[]) => void;
  clearSelectedPoints: () => void;
  setSelectionGeometry: (geo: SelectionGeometry | null) => void;
  setColorScaleName: (name: string) => void;
  toggleTooltipColumn: (col: string) => void;
}

type SelectMode = "pan" | "rectangle" | "lasso";

interface HexHoverObject {
  hexCount: number;
  binIndices?: number[];
  meanExpression?: number;
  dominantCategory?: string;
  dominantCount?: number;
}

interface HoverState {
  x: number;
  y: number;
  object: ScatterPoint | HexHoverObject;
}

interface TooltipFilter {
  col: string;
  value: string;
}

export default function EmbeddingScatterplot({
  // Passthrough
  data,
  shape,
  label,
  maxPoints = Infinity,
  onSaveSelection,
  showHexbinToggle = false,
  // Container-computed
  points,
  categoryColorMap,
  bounds,
  expressionRange,
  selectedSet,
  hexColorConfig,
  hexData,
  sortedCategories,
  selectionSummary,
  hasCategories,
  hexColorMode,
  // Store reads
  colorColumn,
  colorData,
  selectedGene,
  geneExpression,
  tooltipData,
  tooltipColumns,
  tooltipColumnLoading,
  metadata,
  selectedPointIndices,
  selectionGeometry,
  colorScaleName,
  // Store write callbacks
  setSelectedPoints,
  clearSelectedPoints,
  setSelectionGeometry,
  setColorScaleName,
  toggleTooltipColumn,
}: EmbeddingScatterplotProps) {
  const [hoverInfo, setHoverInfo] = useState<HoverState | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [layerMode, setLayerMode] = useState<"hexbin" | "scatter">(showHexbinToggle ? "hexbin" : "scatter");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredExpression, setHoveredExpression] = useState<number | null>(null);
  const [hoveredTooltipFilter, setHoveredTooltipFilter] = useState<TooltipFilter | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const deckRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 600 });

  const {
    selectMode,
    setSelectMode,
    selectionRectRef,
    lassoSvgRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useSelectionInteraction({
    deckRef,
    points,
    setSelectedPoints,
    setSelectionGeometry,
    clearSelectedPoints,
  });

  // Calculate container dimensions based on available space and data aspect ratio
  useLayoutEffect(() => {
    const updateSize = () => {
      if (!containerRef.current || !bounds) return;

      const parentWidth = containerRef.current.parentElement?.clientWidth || 800;

      // Use larger dimensions when expanded
      const availableWidth = expanded
        ? Math.min(parentWidth - 100, 1200)
        : Math.min(parentWidth - 400, 800);
      const maxHeight = expanded ? 900 : 600;
      const minWidth = expanded ? 600 : 400;

      const dimensions = calculatePlotDimensions({
        bounds,
        availableWidth,
        maxHeight,
        minWidth,
      });

      setContainerSize(dimensions);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [bounds, expanded]);

  const initialViewState = useMemo(
    () => computeViewState(bounds, containerSize),
    [bounds, containerSize],
  );


  const hexHover = useCallback((info: any) => {
    if (!info.object) { setHoverInfo(null); return; }
    const pts = info.object.points;
    const count = info.object.count ?? pts?.length ?? info.object.colorValue;
    const hex: HexHoverObject = { hexCount: count };

    if (pts && pts.length > 0) {
      const unwrap = (p: any) => p.source ?? p;
      hex.binIndices = pts.map((p: any) => unwrap(p).index);
      if (hexColorMode === "expression") {
        const sum = pts.reduce((s: number, p: any) => s + (unwrap(p).expression ?? 0), 0);
        hex.meanExpression = sum / pts.length;
      }
      if (hexColorMode === "category") {
        const counts: Record<string, number> = {};
        for (const p of pts) {
          const cat = unwrap(p).category;
          counts[cat] = (counts[cat] || 0) + 1;
        }
        let maxCount = 0;
        for (const [cat, cnt] of Object.entries(counts)) {
          if (cnt > maxCount) { maxCount = cnt; hex.dominantCategory = cat; hex.dominantCount = cnt; }
        }
      }
    }
    setHoverInfo({ x: info.x, y: info.y, object: hex });
  }, [hexColorMode]);

  const layers = layerMode === "hexbin"
    ? [
        new HexagonLayer({
          id: "hexbin",
          data: hexData,
          getPosition: (d: ScatterPoint) => d.position,
          gpuAggregation: false,
          radius: 0.3,
          elevationScale: 0,
          extruded: false,
          coverage: 0.9,
          opacity: 0.8,
          pickable: true,
          onHover: hexHover,
          ...(hexColorConfig as any),
          updateTriggers: {
            getColorWeight: [geneExpression, expressionRange, selectedPointIndices],
            getColorValue: [colorData, selectedPointIndices],
          },
        }),
      ]
    : [
        new ScatterplotLayer({
          id: "scatterplot",
          data: points,
          getPosition: (d: ScatterPoint) => d.position,
          getFillColor: ((d: ScatterPoint) => getPointFillColor(d, {
            selectedSet,
            geneExpression,
            expressionRange,
            hasColorData: hasCategories,
            colorScale: (COLOR_SCALES as Record<string, number[][]>)[colorScaleName],
          })) as any,
          getRadius: (d: ScatterPoint) => {
            if (hoveredCategory != null && d.category === hoveredCategory) return 3;
            if (hoveredExpression != null && d.expression != null && expressionRange) {
              const tolerance = (expressionRange.max - expressionRange.min) * 0.05;
              if (Math.abs(d.expression - hoveredExpression) <= tolerance) return 3;
            }
            if (hoveredTooltipFilter != null) {
              const colValues = tooltipData[hoveredTooltipFilter.col];
              if (colValues && String(colValues[d.index]) === hoveredTooltipFilter.value) return 3;
            }
            return 1;
          },
          radiusUnits: "pixels",
          radiusMinPixels: 0.5,
          radiusMaxPixels: (hoveredCategory != null || hoveredExpression != null || hoveredTooltipFilter != null) ? 3 : 1,
          opacity: 0.7,
          pickable: true,
          onHover: (info: any) => setHoverInfo(info.object ? info : null),
          updateTriggers: {
            getFillColor: [colorData, geneExpression, expressionRange, colorScaleName, selectedPointIndices],
            getRadius: [hoveredCategory, hoveredExpression, hoveredTooltipFilter],
          },
        }),
      ];

  const handleTooltipChange = useCallback((newValues: string[]) => {
    const oldSet = new Set(tooltipColumns);
    const newSet = new Set(newValues);
    for (const col of newValues) {
      if (!oldSet.has(col)) toggleTooltipColumn(col);
    }
    for (const col of tooltipColumns) {
      if (!newSet.has(col)) toggleTooltipColumn(col);
    }
  }, [tooltipColumns, toggleTooltipColumn]);

  return (
    <>
      {points.length < shape?.[0] && (
        <Text type="secondary" style={{ marginBottom: 16, display: "block" }}>
          Showing {points.length.toLocaleString()} of {shape[0].toLocaleString()} points
        </Text>
      )}

      {colorData && !hasCategories && (
        <Alert
          type="warning"
          showIcon
          closable
          style={{ marginBottom: 12 }}
          message={`"${colorColumn}" has more than ${MAX_CATEGORIES} unique values and cannot be used for categorical coloring.`}
        />
      )}

      <div ref={containerRef} style={{ display: "flex", gap: 16 }}>
        <div
          style={{
            width: containerSize.width,
            height: containerSize.height,
            position: "relative",
            border: "1px solid #d9d9d9",
            borderRadius: 4,
            overflow: "hidden",
            cursor: selectMode !== "pan" ? "crosshair" : undefined,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <DeckGL
            ref={deckRef}
            key={`${containerSize.width}-${containerSize.height}`}
            width={containerSize.width}
            height={containerSize.height}
            views={new OrthographicView({ id: "ortho" })}
            initialViewState={initialViewState}
            controller={{ dragPan: selectMode === "pan" }}
            layers={layers}
          />
          <SelectionOverlay selectionRectRef={selectionRectRef} lassoSvgRef={lassoSvgRef} />
          <div style={{ position: "absolute", top: 8, left: 8, zIndex: 1, display: "flex", gap: 4 }} onMouseDown={(e) => e.stopPropagation()}>
            <Button
              size="small"
              type={selectMode === "rectangle" ? "primary" : "default"}
              icon={<SelectOutlined />}
              onClick={() => {
                if (selectMode === "rectangle") {
                  setSelectMode("pan");
                } else {
                  setSelectMode("rectangle");
                  clearSelectedPoints();
                }
              }}
              style={{ opacity: 0.85 }}
              title="Rectangle select"
            />
            <Button
              size="small"
              type={selectMode === "lasso" ? "primary" : "default"}
              icon={<EditOutlined />}
              onClick={() => {
                if (selectMode === "lasso") {
                  setSelectMode("pan");
                } else {
                  setSelectMode("lasso");
                  clearSelectedPoints();
                }
              }}
              style={{ opacity: 0.85 }}
              title="Lasso select"
            />
            {showHexbinToggle && (
              <Button
                size="small"
                type={layerMode === "hexbin" ? "primary" : "default"}
                icon={layerMode === "hexbin" ? <HeatMapOutlined /> : <DotChartOutlined />}
                onClick={() => setLayerMode(layerMode === "hexbin" ? "scatter" : "hexbin")}
                style={{ opacity: 0.85 }}
                title={layerMode === "hexbin" ? "Switch to scatter" : "Switch to hexbin"}
              />
            )}
          </div>
          <div style={{ position: "absolute", top: 8, right: 8, zIndex: 1, display: "flex", gap: 4 }} onMouseDown={(e) => e.stopPropagation()}>
            {geneExpression && (
              <Popover
                trigger="click"
                placement="bottomRight"
                content={
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Text>Color scale:</Text>
                    <Select
                      size="small"
                      value={colorScaleName}
                      onChange={setColorScaleName}
                      style={{ width: 100 }}
                      options={Object.keys(COLOR_SCALES).map((name) => ({ label: name, value: name }))}
                    />
                  </div>
                }
              >
                <Button
                  size="small"
                  icon={<SettingOutlined />}
                  style={{ opacity: 0.85 }}
                  title="Plot settings"
                />
              </Popover>
            )}
            <Button
              size="small"
              icon={expanded ? <CompressOutlined /> : <ExpandOutlined />}
              onClick={() => setExpanded(!expanded)}
              style={{ opacity: 0.85 }}
            />
          </div>
          {hoverInfo && (
            <HoverTooltip
              hoverInfo={hoverInfo}
              colorColumn={colorColumn}
              selectedGene={selectedGene}
              tooltipData={tooltipData}
              hasColorData={!!colorData}
              hasGeneExpression={!!geneExpression}
            />
          )}

          {/* Axis labels */}
          <div
            style={{
              position: "absolute",
              bottom: 4,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 12,
              color: "#666",
            }}
          >
            {label}_1
          </div>
          <div
            style={{
              position: "absolute",
              left: 4,
              top: "50%",
              transform: "translateY(-50%) rotate(-90deg)",
              fontSize: 12,
              color: "#666",
            }}
          >
            {label}_2
          </div>
          {(() => {
            let colorLabel;
            if (layerMode === "hexbin") {
              colorLabel = geneExpression ? `Mean ${selectedGene}` : colorData ? `Dominant ${colorColumn}` : "Point density";
            } else {
              colorLabel = geneExpression ? `${selectedGene} expression` : colorData ? colorColumn : null;
            }
            if (!colorLabel) return null;
            return (
              <div
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: 8,
                  background: "rgba(0,0,0,0.6)",
                  color: "white",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  pointerEvents: "none",
                }}
              >
                {colorLabel}
              </div>
            );
          })()}
          {selectedPointIndices.length > 0 && (
            <div
              style={{
                position: "absolute",
                bottom: 8,
                right: 8,
                background: "rgba(0,0,0,0.7)",
                color: "white",
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 12,
                zIndex: 1,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {selectedPointIndices.length.toLocaleString()} selected
              {selectionGeometry && onSaveSelection && (
                <SaveOutlined
                  onClick={onSaveSelection}
                  style={{ cursor: "pointer", fontSize: 14 }}
                  title="Save selection to config"
                />
              )}
              <CloseCircleOutlined
                onClick={clearSelectedPoints}
                style={{ cursor: "pointer", fontSize: 14 }}
                title="Clear selection"
              />
            </div>
          )}
        </div>

        {/* Legend */}
        {colorColumn && sortedCategories.length > 1 && (
          <CollapsibleLegend categories={sortedCategories} maxHeight={containerSize.height} onHoverCategory={setHoveredCategory} />
        )}

        {/* Gene expression color scale */}
        {geneExpression && expressionRange && (
          <ExpressionLegend
            selectedGene={selectedGene}
            expressionRange={expressionRange}
            colorScaleName={colorScaleName}
            onHoverExpression={setHoveredExpression}
          />
        )}

        {/* Selection summary */}
        {selectionSummary && (
          <SelectionSummaryPanel
            selectionSummary={selectionSummary}
            selectedCount={selectedPointIndices.length || points.length}
            categoryColorMap={categoryColorMap}
            colorColumn={colorColumn}
            selectedGene={selectedGene}
            maxHeight={containerSize.height}
            onHoverCategory={setHoveredCategory}
            onHoverTooltipValue={setHoveredTooltipFilter}
            obsColumns={metadata?.obsColumns}
            tooltipColumns={tooltipColumns}
            onTooltipChange={handleTooltipChange}
            tooltipColumnLoading={tooltipColumnLoading}
          />
        )}

      </div>
    </>
  );
}
