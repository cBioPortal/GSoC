import { useCallback } from "react";
import { COLOR_SCALES, colorScaleGradient } from "../../utils/colors";

const BAR_HEIGHT = 200;

export default function ExpressionLegend({
  selectedGene,
  expressionRange,
  colorScaleName,
  onHoverExpression,
}) {
  const handleMouseMove = useCallback((e) => {
    if (!onHoverExpression) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    // top = max, bottom = min
    const t = Math.max(0, Math.min(1, y / BAR_HEIGHT));
    const value = expressionRange.max - t * (expressionRange.max - expressionRange.min);
    onHoverExpression(value);
  }, [onHoverExpression, expressionRange]);

  const handleMouseLeave = useCallback(() => {
    onHoverExpression?.(null);
  }, [onHoverExpression]);

  return (
    <div style={{ fontSize: 12 }}>
      <div style={{ marginBottom: 4 }}>{selectedGene}</div>
      <div
        style={{
          width: 20,
          height: BAR_HEIGHT,
          background: colorScaleGradient(COLOR_SCALES[colorScaleName], "to bottom"),
          borderRadius: 2,
          cursor: "crosshair",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: BAR_HEIGHT, marginLeft: 4, position: "relative", top: -BAR_HEIGHT, pointerEvents: "none" }}>
        <span>{expressionRange.max.toFixed(2)}</span>
        <span>{((expressionRange.max + expressionRange.min) / 2).toFixed(2)}</span>
        <span>{expressionRange.min.toFixed(2)}</span>
      </div>
    </div>
  );
}
