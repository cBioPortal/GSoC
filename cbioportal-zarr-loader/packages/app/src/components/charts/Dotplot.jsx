import { Group } from "@visx/group";
import { scaleBand, scaleLinear, scaleSqrt } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { useTooltip, TooltipWithBounds, defaultStyles } from "@visx/tooltip";
import { Tooltip } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { COLOR_SCALES, colorScaleGradient, interpolateColorScale, rgbToString } from "../../utils/colors";

const MAX_RADIUS = 14;

const tooltipStyles = {
  ...defaultStyles,
  fontSize: 12,
  padding: "6px 10px",
};

export default function Dotplot({ genes, groups, data, width = 600, height = 400, showLabels = false, swapAxes = false, colorScaleName = "viridis" }) {
  const { showTooltip, hideTooltip, tooltipOpen, tooltipData, tooltipLeft, tooltipTop } =
    useTooltip();

  // When swapped: genes on x, groups on y. Default: groups on x, genes on y.
  const xItems = swapAxes ? genes : groups;
  const yItems = swapAxes ? groups : genes;

  // Map groups to integer labels for compact axis
  const groupIndices = groups.map((_, i) => i + 1);
  const groupToIndex = Object.fromEntries(groups.map((g, i) => [g, i + 1]));
  const indexToGroup = Object.fromEntries(groups.map((g, i) => [i + 1, g]));

  // Determine whether integer labels are used on each axis
  const useIntX = !swapAxes && !showLabels;
  const useIntY = swapAxes && !showLabels;

  const xDomain = swapAxes ? genes : (showLabels ? groups : groupIndices);
  const yDomain = swapAxes ? (showLabels ? groups : groupIndices) : genes;

  // Estimate bottom margin from longest x label when showing rotated labels
  const xLabelItems = showLabels ? xItems : [];
  const maxXLabelLen = xLabelItems.length > 0 ? Math.max(...xLabelItems.map((s) => s.length)) : 0;
  const bottomMargin = maxXLabelLen > 0 ? Math.max(40, maxXLabelLen * 6 + 20) : 40;

  // Estimate left margin from longest y label
  const yLabelItems = swapAxes ? (showLabels ? groups : groupIndices.map(String)) : genes;
  const maxYLabelLen = yLabelItems.length > 0 ? Math.max(...yLabelItems.map((s) => String(s).length)) : 0;
  const leftMargin = Math.max(40, maxYLabelLen * 7 + 16);

  const MARGIN = { top: 16, right: 8, bottom: bottomMargin, left: leftMargin };

  const svgWidth = width - 90;
  const xMax = svgWidth - MARGIN.left - MARGIN.right;
  const yMax = height - MARGIN.top - MARGIN.bottom;

  if (svgWidth <= 0 || xMax <= 0 || yMax <= 0) return null;

  const xScale = scaleBand({ domain: xDomain, range: [0, xMax], padding: 0.05 });
  const yScale = scaleBand({ domain: yDomain, range: [0, yMax], padding: 0.05 });

  const maxMean = Math.max(...data.map((d) => d.meanExpression), 0.01);

  const maxR = Math.min(MAX_RADIUS, xScale.bandwidth() / 2, yScale.bandwidth() / 2);
  const radiusScale = scaleSqrt({
    domain: [0, 1],
    range: [0, maxR],
  });

  const palette = COLOR_SCALES[colorScaleName] || COLOR_SCALES.viridis;
  const colorScale = (val) => rgbToString(interpolateColorScale(val / maxMean, palette));

  // Helpers to map data point to x/y keys
  const getXKey = (d) => {
    if (swapAxes) return d.gene;
    return showLabels ? d.group : groupToIndex[d.group];
  };
  const getYKey = (d) => {
    if (swapAxes) return showLabels ? d.group : groupToIndex[d.group];
    return d.gene;
  };

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

  const gradientCSS = colorScaleGradient(palette, "to bottom");

  return (
    <div style={{ position: "relative", overflowX: "auto" }}>
      <div style={{ display: "inline-flex", gap: 12, minWidth: "100%" }}>
      <svg width={svgWidth} height={height}>
        <Group left={MARGIN.left} top={MARGIN.top}>
          {/* Horizontal gridlines */}
          {yDomain.map((val) => (
            <line
              key={`h-${val}`}
              x1={0}
              x2={xMax}
              y1={(yScale(val) ?? 0) + yScale.bandwidth() / 2}
              y2={(yScale(val) ?? 0) + yScale.bandwidth() / 2}
              stroke="#f0f0f0"
              strokeWidth={1}
            />
          ))}
          {/* Vertical gridlines */}
          {xDomain.map((val) => (
            <line
              key={`v-${val}`}
              x1={(xScale(val) ?? 0) + xScale.bandwidth() / 2}
              x2={(xScale(val) ?? 0) + xScale.bandwidth() / 2}
              y1={0}
              y2={yMax}
              stroke="#f0f0f0"
              strokeWidth={1}
            />
          ))}
          {data.map((d) => {
            const cx = (xScale(getXKey(d)) ?? 0) + xScale.bandwidth() / 2;
            const cy = (yScale(getYKey(d)) ?? 0) + yScale.bandwidth() / 2;
            const isEmpty = d.fractionExpressing === 0;
            const r = isEmpty ? 3 : Math.max(radiusScale(d.fractionExpressing), 4);
            return (
              <circle
                key={`${d.gene}-${d.group}`}
                cx={cx}
                cy={cy}
                r={r}
                fill={isEmpty ? "#f0f0f0" : colorScale(d.meanExpression)}
                stroke={isEmpty ? "#ccc" : colorScale(d.meanExpression)}
                strokeWidth={isEmpty ? 1 : 0.5}
                style={{ cursor: "pointer" }}
                onMouseEnter={(e) => handleMouseEnter(e, d)}
                onMouseLeave={hideTooltip}
              />
            );
          })}
          <AxisBottom
            scale={xScale}
            top={yMax}
            numTicks={xDomain.length}
            tickComponent={({ x, y, formattedValue }) =>
              useIntX ? (
                <text
                  x={x}
                  y={y}
                  fontSize={11}
                  textAnchor="middle"
                  dy="0.25em"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    const svg = e.currentTarget.ownerSVGElement;
                    const pt = svg.createSVGPoint();
                    pt.x = e.clientX;
                    pt.y = e.clientY;
                    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
                    showTooltip({
                      tooltipData: { axisLabel: indexToGroup[formattedValue] },
                      tooltipLeft: svgPt.x,
                      tooltipTop: svgPt.y - 10,
                    });
                  }}
                  onMouseLeave={hideTooltip}
                >
                  {formattedValue}
                </text>
              ) : (
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
              )
            }
          />
          <AxisLeft
            scale={yScale}
            numTicks={yDomain.length}
            tickComponent={({ x, y, formattedValue }) =>
              useIntY ? (
                <text
                  x={x}
                  y={y}
                  fontSize={11}
                  textAnchor="end"
                  dx={-4}
                  dy={4}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(e) => {
                    const svg = e.currentTarget.ownerSVGElement;
                    const pt = svg.createSVGPoint();
                    pt.x = e.clientX;
                    pt.y = e.clientY;
                    const svgPt = pt.matrixTransform(svg.getScreenCTM().inverse());
                    showTooltip({
                      tooltipData: { axisLabel: indexToGroup[formattedValue] },
                      tooltipLeft: svgPt.x,
                      tooltipTop: svgPt.y - 10,
                    });
                  }}
                  onMouseLeave={hideTooltip}
                >
                  {formattedValue}
                </text>
              ) : (
                <text
                  x={x}
                  y={y}
                  fontSize={11}
                  textAnchor="end"
                  dx={-4}
                  dy={4}
                >
                  {formattedValue}
                </text>
              )
            }
          />
        </Group>
      </svg>

      {/* HTML legends */}
      <div style={{ fontSize: 10, color: "#595959", paddingTop: MARGIN.top, flexShrink: 0, width: 74, position: "sticky", right: 0, background: "white" }}>
        {/* Color legend */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>
            Mean expr{" "}
            <Tooltip title="The average expression level across all cells in the group, including non-expressing cells. Mapped to a viridis color scale (dark = low, bright = high).">
              <InfoCircleOutlined style={{ fontSize: 11, color: "#8c8c8c", cursor: "pointer" }} />
            </Tooltip>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <div
              style={{
                width: 14,
                height: Math.min(yMax, 100),
                background: gradientCSS,
                borderRadius: 2,
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", fontSize: 9 }}>
              <span>{maxMean.toFixed(2)}</span>
              <span>0</span>
            </div>
          </div>
        </div>

        {/* Size legend */}
        <div>
          <div style={{ fontWeight: "bold", marginBottom: 4 }}>
            Fraction{" "}
            <Tooltip title="The percentage of cells in the group where the gene is detected (expression > 0). A larger dot means the gene is active in more cells.">
              <InfoCircleOutlined style={{ fontSize: 11, color: "#8c8c8c", cursor: "pointer" }} />
            </Tooltip>
          </div>
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((frac) => {
            const r = radiusScale(frac);
            const d = maxR * 2 + 2;
            return (
              <div key={frac} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                <svg width={d} height={d}>
                  <circle cx={d / 2} cy={d / 2} r={r} fill="#888" />
                </svg>
                <span style={{ fontSize: 9 }}>{frac * 100}%</span>
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {tooltipOpen && tooltipData && (
        <TooltipWithBounds
          left={tooltipLeft}
          top={tooltipTop}
          style={tooltipStyles}
        >
          {tooltipData.axisLabel ? (
            <div>{tooltipData.axisLabel}</div>
          ) : (
            <>
              <div><strong>{tooltipData.group}</strong></div>
              <div>{tooltipData.gene}</div>
              <div>Cells: {tooltipData.expressingCount.toLocaleString()} / {tooltipData.cellCount.toLocaleString()}</div>
              <div>Fraction: {(tooltipData.fractionExpressing * 100).toFixed(1)}%</div>
              <div>Mean expr: {tooltipData.meanExpression.toFixed(3)}</div>
            </>
          )}
        </TooltipWithBounds>
      )}
    </div>
  );
}
