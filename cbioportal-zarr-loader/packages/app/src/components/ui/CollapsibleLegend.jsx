import { useState } from "react";

const LEGEND_LIMIT = 20;

export default function CollapsibleLegend({ categories, maxHeight, onHoverCategory }) {
  const [expanded, setExpanded] = useState(false);
  const [labelsVisible, setLabelsVisible] = useState(false);
  const hasMore = categories.length > LEGEND_LIMIT;
  const visible = expanded ? categories : categories.slice(0, LEGEND_LIMIT);

  if (!labelsVisible) {
    return (
      <div style={{ maxHeight, overflow: "auto", fontSize: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "flex-start" }}>
          {categories.map(([cat, color]) => (
            <div
              key={cat}
              title={cat}
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: `rgb(${color.join(",")})`,
                cursor: "pointer",
              }}
              onClick={() => setLabelsVisible(true)}
              onMouseEnter={() => onHoverCategory?.(cat)}
              onMouseLeave={() => onHoverCategory?.(null)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxHeight, overflow: "auto", fontSize: 12 }}>
      <span
        onClick={() => setLabelsVisible(false)}
        style={{ color: "#1890ff", cursor: "pointer", fontSize: 11, marginBottom: 4, display: "inline-block" }}
      >
        Hide labels
      </span>
      {visible.map(([cat, color]) => (
        <div
          key={cat}
          style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2, cursor: "default" }}
          onMouseEnter={() => onHoverCategory?.(cat)}
          onMouseLeave={() => onHoverCategory?.(null)}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              backgroundColor: `rgb(${color.join(",")})`,
              flexShrink: 0,
            }}
          />
          <span>{cat}</span>
        </div>
      ))}
      {hasMore && (
        <span
          onClick={() => setExpanded(!expanded)}
          style={{ color: "#1890ff", cursor: "pointer", fontSize: 11 }}
        >
          {expanded ? "Show less" : `Show all (${categories.length})`}
        </span>
      )}
    </div>
  );
}
