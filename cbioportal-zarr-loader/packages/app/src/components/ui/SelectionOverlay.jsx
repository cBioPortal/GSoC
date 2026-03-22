/**
 * Renders the selection rectangle and lasso SVG overlays.
 * Both are controlled imperatively via refs from useSelectionInteraction.
 */
export default function SelectionOverlay({ selectionRectRef, lassoSvgRef }) {
  return (
    <>
      {/* Selection rectangle overlay */}
      <div
        ref={selectionRectRef}
        style={{
          display: "none",
          position: "absolute",
          backgroundColor: "rgba(24, 144, 255, 0.15)",
          border: "1px solid rgba(24, 144, 255, 0.6)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      {/* Lasso SVG overlay */}
      <svg
        ref={lassoSvgRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 2,
          display: "none",
        }}
      >
        <polyline
          fill="rgba(24, 144, 255, 0.15)"
          stroke="rgba(24, 144, 255, 0.6)"
          strokeWidth="1"
          points=""
        />
      </svg>
    </>
  );
}
