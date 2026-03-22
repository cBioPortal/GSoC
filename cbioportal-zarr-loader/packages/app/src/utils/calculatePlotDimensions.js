/**
 * Calculate plot dimensions based on available space and data bounds.
 * Maintains the aspect ratio of the data.
 *
 * @param {Object} options
 * @param {Object} options.bounds - Data bounds { minX, maxX, minY, maxY }
 * @param {number} options.availableWidth - Available width for the plot
 * @param {number} options.maxHeight - Maximum height constraint
 * @param {number} options.minWidth - Minimum width constraint
 * @returns {{ width: number, height: number }}
 */
export function calculatePlotDimensions({
  bounds,
  availableWidth = 600,
  maxHeight = 600,
  minWidth = 400,
}) {
  if (!bounds) {
    return { width: availableWidth, height: availableWidth };
  }

  const dataWidth = bounds.maxX - bounds.minX;
  const dataHeight = bounds.maxY - bounds.minY;
  const aspectRatio = dataWidth / dataHeight;

  let width, height;

  if (aspectRatio >= 1) {
    // Wider than tall
    width = Math.max(minWidth, availableWidth);
    height = width / aspectRatio;
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
  } else {
    // Taller than wide
    height = maxHeight;
    width = height * aspectRatio;
    if (width > availableWidth) {
      width = availableWidth;
      height = width / aspectRatio;
    }
  }

  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}
