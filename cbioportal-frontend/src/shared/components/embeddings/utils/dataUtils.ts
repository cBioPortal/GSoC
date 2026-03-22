import { EmbeddingPoint } from '../EmbeddingTypes';

/**
 * Calculate the bounds of the data for centering the view
 */
export function calculateDataBounds(data: EmbeddingPoint[]) {
    if (!data || data.length === 0) {
        return { centerX: 0, centerY: 0, zoom: 0 };
    }

    const xValues = data.map(d => d.x);
    const yValues = data.map(d => d.y);

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minY = Math.min(...yValues);
    const maxY = Math.max(...yValues);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Calculate zoom to show all data with padding
    const rangeX = maxX - minX;
    const rangeY = maxY - minY;
    const paddingFactor = 0.9;

    // Use typical dimensions for calculation
    const width = 1200;
    const height = 600;

    const scaleX = rangeX > 0 ? (width * paddingFactor) / rangeX : 1;
    const scaleY = rangeY > 0 ? (height * paddingFactor) / rangeY : 1;
    const scale = Math.min(scaleX, scaleY);
    const zoom = scale > 0 ? Math.log2(scale) : 0;

    return { centerX, centerY, zoom: Math.max(-3, Math.min(10, zoom)) };
}
