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
const MIN_BAND_HEIGHT = 80; // horizontal mode needs more room per group
const STRIP_RADIUS = 1.5;
const MAX_STRIP_POINTS = 5000;

/** Simple seeded PRNG (mulberry32) for deterministic jitter. */
function mulberry32(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * RaincloudPlot — combines a half-violin, boxplot, and strip plot
 * for each category group.
 *
 * horizontal=true (default): categories on Y-axis, values on X-axis
 * horizontal=false: categories on X-axis, values on Y-axis
 */
export default function RaincloudPlot({
  groups,
  violins,
  boxplotStats,
  data,
  categoryField,
  valueField,
  horizontal = true,
  containerWidth = 800,
  height: heightProp = 500,
  xLabel,
  yLabel,
}) {
  const { showTooltip, hideTooltip, tooltipOpen, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip();

  if (!violins || violins.length === 0) return null;

  // Use actual data range from boxplot stats when available (tighter than KDE grid),
  // fall back to KDE evaluation range otherwise.
  const hasBoxplot = boxplotStats && boxplotStats.length > 0;
  const dataMin = hasBoxplot ? minOf(boxplotStats, (s) => s.min) : minOf(violins, (v) => v.kde.x[0]);
  const dataMax = hasBoxplot ? maxOf(boxplotStats, (s) => s.max) : maxOf(violins, (v) => v.kde.x[v.kde.x.length - 1]);
  const valPadding = (dataMax - dataMin) * 0.05 || 1;

  // Dynamic margins — which axis gets categories vs values depends on orientation
  const maxCatLabelLen = groups.length > 0 ? maxOf(groups, (s) => s.length) : 0;
  const maxValLabelLen = Math.max(dataMin.toFixed(2).length, dataMax.toFixed(2).length, 4);

  let MARGIN, height;
  if (horizontal) {
    // Categories on left, values on bottom
    const leftMargin = Math.max(50, maxCatLabelLen * 7 + 16) + (yLabel ? 20 : 0);
    const bottomMargin = 30 + 12 + (xLabel ? 20 : 0);
    MARGIN = { top: 20, right: 20, bottom: bottomMargin, left: leftMargin };
    // Scale height to number of groups — each band needs enough room for
    // the half-violin, boxplot, and strip to not overlap
    height = Math.max(heightProp, groups.length * MIN_BAND_HEIGHT + MARGIN.top + MARGIN.bottom);
  } else {
    // Categories on bottom, values on left
    const tickLabelHeight = Math.max(30, maxCatLabelLen * 4);
    const bottomMargin = tickLabelHeight + 12 + (xLabel ? 20 : 0);
    const leftMargin = Math.max(50, maxValLabelLen * 7 + 16) + (yLabel ? 20 : 0);
    MARGIN = { top: 20, right: 20, bottom: bottomMargin, left: leftMargin };
    height = heightProp;
  }

  const minWidth = horizontal
    ? containerWidth
    : groups.length * MIN_BAND_WIDTH + MARGIN.left + MARGIN.right;
  const width = Math.max(containerWidth, minWidth);

  const xMax = width - MARGIN.left - MARGIN.right;
  const yMax = height - MARGIN.top - MARGIN.bottom;

  // Scales: bandScale for categories, valScale for continuous values
  const bandScale = scaleBand({
    domain: groups,
    range: horizontal ? [0, yMax] : [0, xMax],
    padding: 0.15,
  });

  const valScale = scaleLinear({
    domain: [dataMin - valPadding, dataMax + valPadding],
    range: horizontal ? [0, xMax] : [yMax, 0],
    nice: true,
  });

  // Find max density across all groups for consistent scaling
  let maxDensity = 0;
  for (const v of violins) {
    const m = maxOf(v.kde.density);
    if (m > maxDensity) maxDensity = m;
  }

  // Build boxplot lookup by group name
  const boxplotByGroup = {};
  if (boxplotStats) {
    for (const s of boxplotStats) {
      boxplotByGroup[s.group] = s;
    }
  }

  // Group raw data values by category for the strip plot
  const stripByGroup = {};
  if (data && categoryField && valueField) {
    for (const d of data) {
      const g = d[categoryField];
      if (g == null) continue;
      if (!stripByGroup[g]) stripByGroup[g] = [];
      stripByGroup[g].push(d[valueField]);
    }
    // Downsample large groups to keep SVG manageable
    const rand = mulberry32(42);
    for (const g of Object.keys(stripByGroup)) {
      const arr = stripByGroup[g];
      if (arr.length > MAX_STRIP_POINTS) {
        for (let i = arr.length - 1; i > arr.length - 1 - MAX_STRIP_POINTS; i--) {
          const j = Math.floor(rand() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        stripByGroup[g] = arr.slice(arr.length - MAX_STRIP_POINTS);
      }
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
    <div style={{ position: "relative", overflowX: width > containerWidth ? "auto" : "hidden", overflowY: height > heightProp ? "auto" : "hidden", maxWidth: containerWidth, maxHeight: horizontal ? height + 20 : undefined }}>
      <svg width={width} height={height}>
        <Group left={MARGIN.left} top={MARGIN.top}>
          {violins.map((v, i) => {
            const bandPos = bandScale(v.group);
            const bw = bandScale.bandwidth();
            const cy = bandPos + bw / 2; // center of band (used as cy in horizontal, cx in vertical)
            const color = rgbToString(CATEGORICAL_COLORS[i % CATEGORICAL_COLORS.length]);

            const densityScale = scaleLinear({
              domain: [0, maxDensity],
              range: [0, bw * 0.45],
            });

            const points = v.kde.x.map((val, j) => ({
              value: val,
              density: v.kde.density[j],
            }));

            const bp = boxplotByGroup[v.group];
            const tooltipPayload = bp ? { ...v, ...bp } : v;
            const boxThickness = bw * 0.15;

            let pathD, boxProps, whiskerLines, capLines, medianLine;

            if (horizontal) {
              // Half-violin: density extends upward (lower y) from center
              const areaGen = area()
                .y0(() => cy)
                .y1((d) => cy - densityScale(d.density))
                .x((d) => valScale(d.value))
                .curve(curveBasis);
              pathD = areaGen(points);

              if (bp) {
                const boxTop = cy + bw * 0.05;
                whiskerLines = { x1: valScale(bp.whiskerLow), x2: valScale(bp.whiskerHigh), y1: boxTop + boxThickness / 2, y2: boxTop + boxThickness / 2 };
                capLines = [
                  { x1: valScale(bp.whiskerLow), x2: valScale(bp.whiskerLow), y1: boxTop, y2: boxTop + boxThickness },
                  { x1: valScale(bp.whiskerHigh), x2: valScale(bp.whiskerHigh), y1: boxTop, y2: boxTop + boxThickness },
                ];
                boxProps = { x: valScale(bp.q1), y: boxTop, width: Math.max(valScale(bp.q3) - valScale(bp.q1), 1), height: boxThickness };
                medianLine = { x1: valScale(bp.median), x2: valScale(bp.median), y1: boxTop, y2: boxTop + boxThickness };
              }
            } else {
              // Vertical: density extends left from center
              const areaGen = area()
                .x0(() => cy)
                .x1((d) => cy - densityScale(d.density))
                .y((d) => valScale(d.value))
                .curve(curveBasis);
              pathD = areaGen(points);

              if (bp) {
                const boxLeft = cy + bw * 0.05;
                whiskerLines = { x1: boxLeft + boxThickness / 2, x2: boxLeft + boxThickness / 2, y1: valScale(bp.whiskerHigh), y2: valScale(bp.whiskerLow) };
                capLines = [
                  { x1: boxLeft, x2: boxLeft + boxThickness, y1: valScale(bp.whiskerHigh), y2: valScale(bp.whiskerHigh) },
                  { x1: boxLeft, x2: boxLeft + boxThickness, y1: valScale(bp.whiskerLow), y2: valScale(bp.whiskerLow) },
                ];
                boxProps = { x: boxLeft, y: valScale(bp.q3), width: boxThickness, height: Math.max(valScale(bp.q1) - valScale(bp.q3), 1) };
                medianLine = { x1: boxLeft, x2: boxLeft + boxThickness, y1: valScale(bp.median), y2: valScale(bp.median) };
              }
            }

            return (
              <g key={v.group}>
                {/* Half-violin */}
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
                {/* Boxplot */}
                {bp && (
                  <g>
                    <line {...whiskerLines} stroke="#333" strokeWidth={1} />
                    {capLines.map((cap, ci) => (
                      <line key={ci} {...cap} stroke="#333" strokeWidth={1} />
                    ))}
                    <rect
                      {...boxProps}
                      fill="#fff"
                      fillOpacity={0.8}
                      stroke="#333"
                      strokeWidth={1}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={(e) => handleMouseEnter(e, tooltipPayload)}
                      onMouseLeave={hideTooltip}
                    />
                    <line {...medianLine} stroke="#333" strokeWidth={2} />
                  </g>
                )}
                {/* Strip plot */}
                {stripByGroup[v.group] && (() => {
                  const jitter = mulberry32(i + 1);
                  if (horizontal) {
                    const stripTop = cy + bw * 0.25;
                    const stripHeight = bw * 0.2;
                    return stripByGroup[v.group].map((val, si) => (
                      <circle
                        key={si}
                        cx={valScale(val)}
                        cy={stripTop + jitter() * stripHeight}
                        r={STRIP_RADIUS}
                        fill={color}
                        fillOpacity={0.3}
                        stroke="none"
                      />
                    ));
                  } else {
                    const stripLeft = cy + bw * 0.25;
                    const stripWidth = bw * 0.2;
                    return stripByGroup[v.group].map((val, si) => (
                      <circle
                        key={si}
                        cx={stripLeft + jitter() * stripWidth}
                        cy={valScale(val)}
                        r={STRIP_RADIUS}
                        fill={color}
                        fillOpacity={0.3}
                        stroke="none"
                      />
                    ));
                  }
                })()}
              </g>
            );
          })}

          {horizontal ? (
            <>
              <AxisBottom scale={valScale} top={yMax} />
              {xLabel && (
                <text
                  x={xMax / 2}
                  y={yMax + 36}
                  fontSize={13}
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#333"
                >
                  {xLabel}
                </text>
              )}
              <AxisLeft
                scale={bandScale}
                numTicks={groups.length}
                tickComponent={({ x, y, formattedValue }) => (
                  <text
                    x={x}
                    y={y}
                    fontSize={11}
                    textAnchor="end"
                    dy="0.32em"
                    dx={-4}
                  >
                    {formattedValue}
                  </text>
                )}
              />
              {yLabel && (
                <text
                  x={-yMax / 2}
                  y={-MARGIN.left + 14}
                  transform="rotate(-90)"
                  fontSize={13}
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#333"
                >
                  {yLabel}
                </text>
              )}
            </>
          ) : (
            <>
              <AxisBottom
                scale={bandScale}
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
                  y={yMax + MARGIN.bottom - 8}
                  fontSize={13}
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#333"
                >
                  {xLabel}
                </text>
              )}
              <AxisLeft scale={valScale} />
              {yLabel && (
                <text
                  x={-yMax / 2}
                  y={-MARGIN.left + 14}
                  transform="rotate(-90)"
                  fontSize={13}
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="#333"
                >
                  {yLabel}
                </text>
              )}
            </>
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
