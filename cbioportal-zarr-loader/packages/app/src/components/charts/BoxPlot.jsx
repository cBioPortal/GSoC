import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { useTooltip, TooltipWithBounds, defaultStyles } from "@visx/tooltip";
import { CATEGORICAL_COLORS, rgbToString } from "../../utils/colors";
import { maxOf, minOf } from "../../utils/mathUtils";

const tooltipStyles = {
  ...defaultStyles,
  fontSize: 12,
  padding: "6px 10px",
};

const OUTLIER_RADIUS = 2.5;
const WHISKER_CAP_WIDTH = 0.4; // fraction of bandwidth

const MIN_BAND_WIDTH = 40;

export default function BoxPlot({ groups, stats, containerWidth = 800, height = 500, xLabel, yLabel }) {
  const { showTooltip, hideTooltip, tooltipOpen, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip();

  if (!stats || stats.length === 0) return null;

  // Dynamic margins based on label lengths
  const maxXLabelLen = groups.length > 0 ? maxOf(groups, (s) => s.length) : 0;
  const tickLabelHeight = Math.max(30, maxXLabelLen * 4);
  const bottomMargin = tickLabelHeight + 12 + (xLabel ? 20 : 0);

  // Estimate y-axis label width from values
  let maxYLabelLen = 4;
  for (const s of stats) {
    for (const v of [s.min, s.max]) {
      const len = v.toFixed(2).length;
      if (len > maxYLabelLen) maxYLabelLen = len;
    }
  }
  const leftMargin = Math.max(50, maxYLabelLen * 7 + 16) + (yLabel ? 20 : 0);

  const MARGIN = { top: 20, right: 20, bottom: bottomMargin, left: leftMargin };

  const minWidth = groups.length * MIN_BAND_WIDTH + MARGIN.left + MARGIN.right;
  const width = Math.max(containerWidth, minWidth);

  const xMax = width - MARGIN.left - MARGIN.right;
  const yMax = height - MARGIN.top - MARGIN.bottom;

  const xScale = scaleBand({ domain: groups, range: [0, xMax], padding: 0.3 });

  const yMin = minOf(stats, (s) => Math.min(s.min, minOf(s.outliers)));
  const yMaxVal = maxOf(stats, (s) => Math.max(s.max, maxOf(s.outliers)));
  const yPadding = (yMaxVal - yMin) * 0.05 || 1;

  const yScale = scaleLinear({
    domain: [yMin - yPadding, yMaxVal + yPadding],
    range: [yMax, 0],
    nice: true,
  });

  const handleMouseEnter = (event, d) => {
    const svg = event.currentTarget.ownerSVGElement;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());
    showTooltip({
      tooltipData: d,
      tooltipLeft: svgPoint.x,
      tooltipTop: svgPoint.y - 10,
    });
  };

  return (
    <div style={{ position: "relative", overflowX: width > containerWidth ? "auto" : "hidden", maxWidth: containerWidth }}>
      <svg width={width} height={height}>
        <Group left={MARGIN.left} top={MARGIN.top}>
          {stats.map((s, i) => {
            const x = xScale(s.group);
            const bw = xScale.bandwidth();
            const cx = x + bw / 2;
            const color = rgbToString(CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]);
            const capHalf = (bw * WHISKER_CAP_WIDTH) / 2;

            const boxTop = yScale(s.q3);
            const boxBottom = yScale(s.q1);
            const boxHeight = boxBottom - boxTop;

            return (
              <g key={s.group}>
                {/* Whisker line: whiskerLow → whiskerHigh */}
                <line
                  x1={cx}
                  x2={cx}
                  y1={yScale(s.whiskerHigh)}
                  y2={yScale(s.whiskerLow)}
                  stroke="#555"
                  strokeWidth={1}
                />

                {/* Whisker cap: high */}
                <line
                  x1={cx - capHalf}
                  x2={cx + capHalf}
                  y1={yScale(s.whiskerHigh)}
                  y2={yScale(s.whiskerHigh)}
                  stroke="#555"
                  strokeWidth={1}
                />

                {/* Whisker cap: low */}
                <line
                  x1={cx - capHalf}
                  x2={cx + capHalf}
                  y1={yScale(s.whiskerLow)}
                  y2={yScale(s.whiskerLow)}
                  stroke="#555"
                  strokeWidth={1}
                />

                {/* Box: Q1 → Q3 */}
                <rect
                  x={x}
                  y={boxTop}
                  width={bw}
                  height={Math.max(boxHeight, 1)}
                  fill={color}
                  fillOpacity={0.7}
                  stroke={color}
                  strokeWidth={1}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => handleMouseEnter(e, s)}
                  onMouseLeave={hideTooltip}
                />

                {/* Median line */}
                <line
                  x1={x}
                  x2={x + bw}
                  y1={yScale(s.median)}
                  y2={yScale(s.median)}
                  stroke="#fff"
                  strokeWidth={2}
                />

                {/* Outliers */}
                {s.outliers.map((v, oi) => (
                  <circle
                    key={oi}
                    cx={cx}
                    cy={yScale(v)}
                    r={OUTLIER_RADIUS}
                    fill={color}
                    fillOpacity={0.5}
                    stroke={color}
                    strokeWidth={0.5}
                  />
                ))}
              </g>
            );
          })}

          <AxisBottom
            scale={xScale}
            top={yMax}
            numTicks={groups.length}
            tickComponent={({ x, y, formattedValue }) => (
              <text
                x={x}
                y={y}
                fontSize={11}
                textAnchor="end"
                dy={-4}
                transform={`rotate(-45, ${x}, ${y})`}
              >
                {formattedValue}
              </text>
            )}
          />
          {xLabel && (
            <text
              x={xMax / 2}
              y={yMax + tickLabelHeight + 16}
              fontSize={13}
              fontWeight="bold"
              textAnchor="middle"
              fill="#333"
            >
              {xLabel}
            </text>
          )}
          <AxisLeft scale={yScale} />
          {yLabel && (
            <text
              x={-yMax / 2}
              y={-leftMargin + 14}
              transform="rotate(-90)"
              fontSize={13}
              fontWeight="bold"
              textAnchor="middle"
              fill="#333"
            >
              {yLabel}
            </text>
          )}
        </Group>
      </svg>

      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          style={tooltipStyles}
        >
          <div><strong>{tooltipData.group}</strong></div>
          <div>Count: {tooltipData.count.toLocaleString()}</div>
          <div>Median: {tooltipData.median.toFixed(3)}</div>
          <div>Q1: {tooltipData.q1.toFixed(3)}</div>
          <div>Q3: {tooltipData.q3.toFixed(3)}</div>
          <div>Min: {tooltipData.min.toFixed(3)}</div>
          <div>Max: {tooltipData.max.toFixed(3)}</div>
          {tooltipData.outliers.length > 0 && (
            <div>Outliers: {tooltipData.outliers.length}</div>
          )}
        </TooltipWithBounds>
      )}
    </div>
  );
}
