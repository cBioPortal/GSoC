import { ViewState } from '../EmbeddingTypes';

/**
 * Converts data coordinates to screen coordinates
 */
export function dataToScreen(
    dataX: number,
    dataY: number,
    viewState: ViewState,
    width: number,
    height: number
): { x: number; y: number } {
    const scale = Math.pow(2, viewState.zoom);
    const centerX = width / 2;
    const centerY = height / 2;

    const screenX = centerX + (dataX - viewState.target[0]) * scale;
    const screenY = centerY - (dataY - viewState.target[1]) * scale; // Y is flipped

    return { x: screenX, y: screenY };
}

/**
 * Converts color string to RGB array
 * Supports both hex format (#RRGGBB) and rgb format (rgb(r, g, b))
 * Note: D3's color interpolation functions (like interpolateReds) return RGB format by default
 */
export function colorToRgb(color: string): [number, number, number] {
    // Handle rgb(r, g, b) format
    const rgbMatch = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i.exec(color);
    if (rgbMatch) {
        return [
            parseInt(rgbMatch[1], 10),
            parseInt(rgbMatch[2], 10),
            parseInt(rgbMatch[3], 10),
        ];
    }

    // Handle hex format
    const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
    return hexMatch
        ? [
              parseInt(hexMatch[1], 16),
              parseInt(hexMatch[2], 16),
              parseInt(hexMatch[3], 16),
          ]
        : [204, 204, 204]; // Default gray
}
