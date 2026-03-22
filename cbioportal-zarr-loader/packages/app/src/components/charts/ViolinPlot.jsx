import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { useTooltip, TooltipWithBounds, defaultStyles } from "@visx/tooltip";
import { area, curveBasis } from "d3-shape";
import { CATEGORICAL_COLORS, rgbToString } from "../../utils/colors";
import { maxOf, minOf } from "../../utils/mathUtils";

const tooltipStyles = {
  ...defaultStyles,
  fontSize: 12,
  padding: "6px 10px",
};

const MIN_BAND_WIDTH = 50;

export default function ViolinPlot({ groups, violins, boxplotStats, showBoxplot = false, containerWidth = 800, height = 500, xLabel, yLabel }) {
  const { showTooltip, hideTooltip, tooltipOpen, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip();

  if (!violins || violins.length === 0) return null;

  // Dynamic margins
  const maxXLabelLen = groups.length > 0 ? maxOf(groups, (s) => s.length) : 0;
  const tickLabelHeight = Math.max(30, maxXLabelLen * 4);
  const bottomMargin = tickLabelHeight + 12 + (xLabel ? 20 : 0);

  // Estimate y-axis label width from KDE range extremes
  const kdeMin = minOf(violins, (v) => v.kde.x[0]);
  const kdeMax = maxOf(violins, (v) => v.kde.x[v.kde.x.length - 1]);
  const maxYLabelLen = Math.max(kdeMin.toFixed(2).length, kdeMax.toFixed(2).length, 4);
  const leftMargin = Math.max(50, maxYLabelLen * 7 + 16) + (yLabel ? 20 : 0);

  const MARGIN = { top: 20, right: 20, bottom: bottomMargin, left: leftMargin };

  const minWidth = groups.length * MIN_BAND_WIDTH + MARGIN.left + MARGIN.right;
  const width = Math.max(containerWidth, minWidth);

  const xMax = width - MARGIN.left - MARGIN.right;
  const yMax = height - MARGIN.top - MARGIN.bottom;

  const xScale = scaleBand({ domain: groups, range: [0, xMax], padding: 0.15 });

  // y-axis spans the full range of KDE x-values (which are the data values)
  const yPadding = (kdeMax - kdeMin) * 0.05 || 1;

  const yScale = scaleLinear({
    domain: [kdeMin - yPadding, kdeMax + yPadding],
    range: [yMax, 0],
    nice: true,
  });

  // Find max density across all groups for consistent width scaling
  let maxDensity = 0;
  for (const v of violins) {
    const m = maxOf(v.kde.density);
    if (m > maxDensity) maxDensity = m;
  }

  // Build boxplot lookup by group name
  const boxplotByGroup = {};
  if (showBoxplot && boxplotStats) {
    for (const s of boxplotStats) {
      boxplotByGroup[s.group] = s;
    }
  }

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
          {violins.map((v, i) => {
            const bandX = xScale(v.group);
            const bw = xScale.bandwidth();
            const cx = bandX + bw / 2;
            const halfWidth = bw / 2;
            const color = rgbToString(CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]);

            // Build mirrored area path from KDE
            // densityScale maps density -> horizontal pixel offset from center
            const densityScale = scaleLinear({
              domain: [0, maxDensity],
              range: [0, halfWidth],
            });

            const areaGenerator = area()
              .x0((d) => cx - densityScale(d.density))
              .x1((d) => cx + densityScale(d.density))
              .y((d) => yScale(d.value))
              .curve(curveBasis);

            const points = v.kde.x.map((val, j) => ({
              value: val,
              density: v.kde.density[j],
            }));

            const pathD = areaGenerator(points);

            const bp = boxplotByGroup[v.group];
            const tooltipPayload = bp ? { ...v, ...bp } : v;
            const boxWidth = bw * 0.25;

            return (
              <g key={v.group}>
                <path
                  d={pathD}
                  fill={color}
                  fillOpacity={0.6}
                  stroke={color}
                  strokeWidth={1}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => handleMouseEnter(e, tooltipPayload)}
                  onMouseLeave={hideTooltip}
                />
                {bp ? (
                  <g style={{ pointerEvents: "none" }}>
                    {/* Whisker line */}
                    <line
                      x1={cx} x2={cx}
                      y1={yScale(bp.whiskerHigh)} y2={yScale(bp.whiskerLow)}
                      stroke="#333" strokeWidth={1}
                    />
                    {/* Whisker caps */}
                    <line
                      x1={cx - boxWidth / 2} x2={cx + boxWidth / 2}
                      y1={yScale(bp.whiskerHigh)} y2={yScale(bp.whiskerHigh)}
                      stroke="#333" strokeWidth={1}
                    />
                    <line
                      x1={cx - boxWidth / 2} x2={cx + boxWidth / 2}
                      y1={yScale(bp.whiskerLow)} y2={yScale(bp.whiskerLow)}
                      stroke="#333" strokeWidth={1}
                    />
                    {/* IQR box */}
                    <rect
                      x={cx - boxWidth / 2}
                      y={yScale(bp.q3)}
                      width={boxWidth}
                      height={Math.max(yScale(bp.q1) - yScale(bp.q3), 1)}
                      fill="#fff"
                      fillOpacity={0.8}
                      stroke="#333"
                      strokeWidth={1}
                    />
                    {/* Median line */}
                    <line
                      x1={cx - boxWidth / 2} x2={cx + boxWidth / 2}
                      y1={yScale(bp.median)} y2={yScale(bp.median)}
                      stroke="#333" strokeWidth={2}
                    />
                  </g>
                ) : (
                  /* Fallback: simple median line when no boxplot */
                  <line
                    x1={cx - halfWidth * 0.4} x2={cx + halfWidth * 0.4}
                    y1={yScale(v.median)} y2={yScale(v.median)}
                    stroke="#fff" strokeWidth={2}
                  />
                )}
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
          {tooltipData.q1 != null && (
            <>
              <div>Q1: {tooltipData.q1.toFixed(3)}</div>
              <div>Q3: {tooltipData.q3.toFixed(3)}</div>
              <div>Min: {tooltipData.min.toFixed(3)}</div>
              <div>Max: {tooltipData.max.toFixed(3)}</div>
            </>
          )}
        </TooltipWithBounds>
      )}
    </div>
  );
}
