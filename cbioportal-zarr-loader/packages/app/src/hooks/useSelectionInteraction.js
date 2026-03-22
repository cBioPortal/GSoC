import { useState, useRef, useCallback } from "react";
import { pointInPolygon, simplifyPolygon } from "../utils/scatterplotUtils";

/**
 * Manages rectangle and lasso selection interactions for the scatterplot.
 * Owns all selection-related refs, state, and mouse event handlers.
 */
export default function useSelectionInteraction({
  deckRef,
  points,
  setSelectedPoints,
  setSelectionGeometry,
  clearSelectedPoints,
}) {
  const [selectMode, setSelectMode] = useState("pan");

  const dragStartRef = useRef(null);
  const dragEndRef = useRef(null);
  const selectionRectRef = useRef(null);
  const lassoPointsRef = useRef([]);
  const lassoSvgRef = useRef(null);

  const updateSelectionRect = useCallback(() => {
    const el = selectionRectRef.current;
    const start = dragStartRef.current;
    const end = dragEndRef.current;
    if (!el || !start || !end) {
      if (el) el.style.display = "none";
      return;
    }
    el.style.display = "block";
    el.style.left = `${Math.min(start.x, end.x)}px`;
    el.style.top = `${Math.min(start.y, end.y)}px`;
    el.style.width = `${Math.abs(end.x - start.x)}px`;
    el.style.height = `${Math.abs(end.y - start.y)}px`;
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (selectMode === "pan") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (selectMode === "rectangle") {
      dragStartRef.current = pos;
      dragEndRef.current = pos;
      updateSelectionRect();
    } else if (selectMode === "lasso") {
      lassoPointsRef.current = [pos];
      const svg = lassoSvgRef.current;
      if (svg) {
        svg.style.display = "block";
        svg.querySelector("polyline").setAttribute("points", `${pos.x},${pos.y}`);
      }
    }
  }, [selectMode, updateSelectionRect]);

  const handleMouseMove = useCallback((e) => {
    if (selectMode === "pan") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    if (selectMode === "rectangle") {
      if (!dragStartRef.current) return;
      dragEndRef.current = pos;
      updateSelectionRect();
    } else if (selectMode === "lasso") {
      if (lassoPointsRef.current.length === 0) return;
      const last = lassoPointsRef.current[lassoPointsRef.current.length - 1];
      if ((pos.x - last.x) ** 2 + (pos.y - last.y) ** 2 < 25) return;
      lassoPointsRef.current.push(pos);
      const svg = lassoSvgRef.current;
      if (svg) {
        const pointsStr = lassoPointsRef.current.map(p => `${p.x},${p.y}`).join(" ");
        svg.querySelector("polyline").setAttribute("points", pointsStr);
      }
    }
  }, [selectMode, updateSelectionRect]);

  const handleMouseUp = useCallback(() => {
    if (selectMode === "pan") return;

    if (selectMode === "rectangle") {
      if (!dragStartRef.current || !dragEndRef.current) return;
      const start = dragStartRef.current;
      const end = dragEndRef.current;
      const viewport = deckRef.current?.deck?.getViewports()?.[0];
      if (viewport) {
        const [wx1, wy1] = viewport.unproject([start.x, start.y]);
        const [wx2, wy2] = viewport.unproject([end.x, end.y]);
        const minWx = Math.min(wx1, wx2);
        const maxWx = Math.max(wx1, wx2);
        const minWy = Math.min(wy1, wy2);
        const maxWy = Math.max(wy1, wy2);

        const indices = [];
        for (const pt of points) {
          const [px, py] = pt.position;
          if (px >= minWx && px <= maxWx && py >= minWy && py <= maxWy) {
            indices.push(pt.index);
          }
        }
        setSelectionGeometry({ type: "rectangle", bounds: [minWx, minWy, maxWx, maxWy] });
        setSelectedPoints(indices);
      }
      dragStartRef.current = null;
      dragEndRef.current = null;
      updateSelectionRect();
    } else if (selectMode === "lasso") {
      const lassoPoints = lassoPointsRef.current;
      if (lassoPoints.length < 3) {
        lassoPointsRef.current = [];
        const svg = lassoSvgRef.current;
        if (svg) svg.style.display = "none";
        return;
      }
      const viewport = deckRef.current?.deck?.getViewports()?.[0];
      if (viewport) {
        const worldPolygon = lassoPoints.map(p => viewport.unproject([p.x, p.y]));
        const indices = [];
        for (const pt of points) {
          const [px, py] = pt.position;
          if (pointInPolygon(px, py, worldPolygon)) {
            indices.push(pt.index);
          }
        }
        setSelectionGeometry({ type: "lasso", polygon: simplifyPolygon(worldPolygon) });
        setSelectedPoints(indices);
      }
      lassoPointsRef.current = [];
      const svg = lassoSvgRef.current;
      if (svg) svg.style.display = "none";
    }
  }, [selectMode, points, setSelectedPoints, setSelectionGeometry, updateSelectionRect]);

  return {
    selectMode,
    setSelectMode,
    selectionRectRef,
    lassoSvgRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}
