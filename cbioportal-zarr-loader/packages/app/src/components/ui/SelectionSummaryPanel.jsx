import { useState } from "react";
import { Typography, Select, Spin } from "antd";

const { Text } = Typography;
const BREAKDOWN_LIMIT = 5;
const CATEGORY_BREAKDOWN_LIMIT = 10;

function CollapsibleBreakdown({ col, breakdown, total, onHoverValue }) {
  const [expanded, setExpanded] = useState(false);
  const hasMore = breakdown.length > BREAKDOWN_LIMIT;
  const visible = expanded ? breakdown : breakdown.slice(0, BREAKDOWN_LIMIT);

  return (
    <div style={{ marginTop: 8 }}>
      <Text type="secondary" style={{ fontSize: 11 }}>{col}</Text>
      <table style={{ width: "100%", marginTop: 4, borderCollapse: "collapse" }}>
        <tbody>
          {visible.map(([val, count]) => (
            <tr
              key={val}
              className="summary-row"
              style={{ cursor: "default" }}
              onMouseEnter={() => onHoverValue?.({ col, value: val })}
              onMouseLeave={() => onHoverValue?.(null)}
            >
              <td style={{ paddingRight: 8 }}>{val}</td>
              <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                {count.toLocaleString()} ({((count / total) * 100).toFixed(1)}%)
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {hasMore && (
        <span
          onClick={() => setExpanded(!expanded)}
          style={{ color: "#1890ff", cursor: "pointer", fontSize: 11 }}
        >
          {expanded ? "Show less" : `Show all (${breakdown.length})`}
        </span>
      )}
    </div>
  );
}

export default function SelectionSummaryPanel({
  selectionSummary,
  selectedCount,
  categoryColorMap,
  colorColumn,
  selectedGene,
  maxHeight,
  onHoverCategory,
  onHoverTooltipValue,
  obsColumns,
  tooltipColumns,
  onTooltipChange,
  tooltipColumnLoading,
}) {
  const [categoryExpanded, setCategoryExpanded] = useState(false);

  return (
    <div style={{ maxHeight, display: "flex", flexDirection: "column", fontSize: 12, minWidth: 280, borderLeft: "1px solid #d9d9d9", paddingLeft: 16 }}>
      <style>{`.summary-row:hover { background-color: rgba(0, 0, 0, 0.04); }`}</style>
      {/* Sticky header: title + column picker */}
      <div style={{ position: "sticky", top: 0, background: "#fff", zIndex: 1, paddingBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Text strong style={{ fontSize: 12, whiteSpace: "nowrap" }}>
            Selection Summary ({selectedCount.toLocaleString()} cells)
          </Text>
          {obsColumns && obsColumns.length > 0 && (
            <Select
              mode="multiple"
              size="small"
              showSearch
              placeholder="Add columns..."
              style={{ flex: 1, minWidth: 120 }}
              value={tooltipColumns}
              onChange={onTooltipChange}
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
              options={obsColumns.map((col) => ({ label: col, value: col }))}
              loading={!!tooltipColumnLoading}
              notFoundContent={tooltipColumnLoading ? <Spin size="small" /> : undefined}
              maxTagCount="responsive"
              allowClear
            />
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ overflow: "auto", flex: 1 }}>
        {selectionSummary.categoryBreakdown && (() => {
          const hasMore = selectionSummary.categoryBreakdown.length > CATEGORY_BREAKDOWN_LIMIT;
          const visible = categoryExpanded ? selectionSummary.categoryBreakdown : selectionSummary.categoryBreakdown.slice(0, CATEGORY_BREAKDOWN_LIMIT);
          return (
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: 11 }}>{colorColumn}</Text>
              <table style={{ width: "100%", marginTop: 4, borderCollapse: "collapse" }}>
                <tbody>
                  {visible.map(([cat, count]) => (
                    <tr
                      key={cat}
                      className="summary-row"
                      style={{ cursor: "default" }}
                      onMouseEnter={() => onHoverCategory?.(cat)}
                      onMouseLeave={() => onHoverCategory?.(null)}
                    >
                      <td style={{ paddingRight: 8, display: "flex", alignItems: "center", gap: 4 }}>
                        {categoryColorMap[cat] && (
                          <span style={{
                            display: "inline-block",
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            backgroundColor: `rgb(${categoryColorMap[cat].join(",")})`,
                            flexShrink: 0,
                          }} />
                        )}
                        <span>{cat}</span>
                      </td>
                      <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                        {count.toLocaleString()} ({((count / selectedCount) * 100).toFixed(1)}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hasMore && (
                <span
                  onClick={() => setCategoryExpanded(!categoryExpanded)}
                  style={{ color: "#1890ff", cursor: "pointer", fontSize: 11 }}
                >
                  {categoryExpanded ? "Show less" : `Show all (${selectionSummary.categoryBreakdown.length})`}
                </span>
              )}
            </div>
          );
        })()}

        {selectionSummary.expressionStats && (
          <div style={{ marginTop: 8 }}>
            <Text type="secondary" style={{ fontSize: 11 }}>{selectedGene} expression</Text>
            <table style={{ width: "100%", marginTop: 4, borderCollapse: "collapse" }}>
              <tbody>
                <tr><td>Mean</td><td style={{ textAlign: "right" }}>{selectionSummary.expressionStats.mean.toFixed(4)}</td></tr>
                <tr><td>Min</td><td style={{ textAlign: "right" }}>{selectionSummary.expressionStats.min.toFixed(4)}</td></tr>
                <tr><td>Max</td><td style={{ textAlign: "right" }}>{selectionSummary.expressionStats.max.toFixed(4)}</td></tr>
              </tbody>
            </table>
          </div>
        )}

        {Object.entries(selectionSummary.tooltipBreakdowns).map(([col, breakdown]) => (
          <CollapsibleBreakdown key={col} col={col} breakdown={breakdown} total={selectedCount} onHoverValue={onHoverTooltipValue} />
        ))}
      </div>
    </div>
  );
}
