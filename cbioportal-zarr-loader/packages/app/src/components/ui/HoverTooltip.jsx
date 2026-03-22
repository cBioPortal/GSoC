const BREAKDOWN_LIMIT = 5;

function HexBreakdowns({ binIndices, hexCount, tooltipData }) {
  if (!binIndices || Object.keys(tooltipData).length === 0) return null;

  return Object.entries(tooltipData).map(([col, values]) => {
    const counts = {};
    for (const idx of binIndices) {
      const val = String(values[idx] ?? "");
      counts[val] = (counts[val] || 0) + 1;
    }
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, BREAKDOWN_LIMIT);

    return (
      <div key={col} style={{ marginTop: 4 }}>
        <div style={{ opacity: 0.7, fontSize: 11 }}>{col}</div>
        {sorted.map(([val, count]) => (
          <div key={val} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <span>{val}</span>
            <span>{count} ({((count / hexCount) * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
    );
  });
}

export default function HoverTooltip({
  hoverInfo,
  colorColumn,
  selectedGene,
  tooltipData,
  hasColorData,
  hasGeneExpression,
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: hoverInfo.x + 10,
        top: hoverInfo.y + 10,
        background: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "4px 8px",
        borderRadius: 4,
        fontSize: 12,
        pointerEvents: "none",
      }}
    >
      {hoverInfo.object.position ? (
        <>
          <div>x: {hoverInfo.object.position[0].toFixed(4)}</div>
          <div>y: {hoverInfo.object.position[1].toFixed(4)}</div>
          {hasColorData && <div>{colorColumn}: {hoverInfo.object.category}</div>}
          {hasGeneExpression && <div>{selectedGene}: {hoverInfo.object.expression?.toFixed(4)}</div>}
          {Object.entries(tooltipData).map(([col, values]) => (
            <div key={col}>{col}: {values[hoverInfo.object.index]}</div>
          ))}
        </>
      ) : hoverInfo.object.hexCount != null ? (
        <>
          <div>Count: {hoverInfo.object.hexCount.toLocaleString()}</div>
          {hoverInfo.object.meanExpression != null && (
            <div>Mean {selectedGene}: {hoverInfo.object.meanExpression.toFixed(4)}</div>
          )}
          {hoverInfo.object.dominantCategory != null && (
            <div>{colorColumn}: {hoverInfo.object.dominantCategory} ({hoverInfo.object.dominantCount})</div>
          )}
          <HexBreakdowns
            binIndices={hoverInfo.object.binIndices}
            hexCount={hoverInfo.object.hexCount}
            tooltipData={tooltipData}
          />
        </>
      ) : (
        <div>Bin selected</div>
      )}
    </div>
  );
}
