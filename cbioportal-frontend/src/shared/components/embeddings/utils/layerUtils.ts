import { ScatterplotLayer } from '@deck.gl/layers';
import { EmbeddingPoint } from '../EmbeddingTypes';
import { colorToRgb } from './coordinateUtils';

/**
 * Create the scatterplot layer for the embedding visualization
 */
export function createScatterplotLayer(
    data: EmbeddingPoint[],
    selectedPoints: EmbeddingPoint[],
    selectedPatientIds: string[] = [],
    onHover: (info: any) => void,
    onClick: (info: any) => void
) {
    // Convert to Sets for O(1) lookup performance (computed once per layer creation)
    const localSelectedSet = new Set(selectedPoints.map(p => p.patientId));
    const externalSelectedSet = new Set(selectedPatientIds);
    const hasAnySelection =
        selectedPoints.length > 0 || selectedPatientIds.length > 0;

    return new ScatterplotLayer({
        id: 'embedding-scatter',
        data,
        getPosition: (d: EmbeddingPoint) => [d.x, d.y],
        getRadius: (d: EmbeddingPoint) => {
            // Non-cohort samples never participate in selection - make them 10x smaller
            if (d.isInCohort === false) {
                return 0.003;
            }

            const isSelected =
                (d.patientId && localSelectedSet.has(d.patientId)) ||
                (d.patientId && externalSelectedSet.has(d.patientId));
            return isSelected ? 0.05 : 0.03;
        },
        getFillColor: (d: EmbeddingPoint) => {
            // Non-cohort samples always show their dark gray color
            if (d.isInCohort === false) {
                const color = d.color || '#666666';
                const rgb = colorToRgb(color);
                return [rgb[0], rgb[1], rgb[2], 255];
            }

            const isSelected =
                (d.patientId && localSelectedSet.has(d.patientId)) ||
                (d.patientId && externalSelectedSet.has(d.patientId));

            // If there's an active selection and this point is not selected, make it light gray
            if (hasAnySelection && !isSelected) {
                return [200, 200, 200, 255]; // Light gray for ALL unselected
            }

            // Default: show actual color (keep the fill color)
            const color = d.color || '#CCCCCC';
            const rgb = colorToRgb(color);
            return [rgb[0], rgb[1], rgb[2], 255];
        },
        getLineColor: (d: EmbeddingPoint) => {
            // Non-cohort samples always show their dark gray color
            if (d.isInCohort === false) {
                const color = d.color || '#666666';
                return colorToRgb(color); // Use same color for stroke and fill for consistency
            }

            const isSelected =
                (d.patientId && localSelectedSet.has(d.patientId)) ||
                (d.patientId && externalSelectedSet.has(d.patientId));

            // If there's an active selection and this point is not selected, make it light gray
            if (hasAnySelection && !isSelected) {
                return [200, 200, 200]; // Light gray for ALL unselected
            }

            // Use strokeColor when provided (for copy number and structural variants), otherwise use fill color
            const color = d.strokeColor || d.color || '#CCCCCC';
            return colorToRgb(color);
        },
        getLineWidth: (d: EmbeddingPoint) => {
            const isSelected =
                (d.patientId && localSelectedSet.has(d.patientId)) ||
                (d.patientId && externalSelectedSet.has(d.patientId));

            if (isSelected) {
                return 0.01; // Thicker border for selected points
            }

            // Special handling for specific categories
            // Check for Amplification and Deep Deletion (copy number alterations)
            if (
                d.displayLabel === 'Amplification' ||
                d.displayLabel === 'Deep Deletion'
            ) {
                return 0.007; // Moderately thick border for CNA points
            }

            // Check for Structural Variant
            if (d.displayLabel === 'Structural Variant') {
                return 0.007; // Moderately thick border for SV points
            }

            // Make all other points have a very thin consistent stroke width as in plots tab
            return 0.003; // Small consistent border width for most points
        },
        filled: true,
        stroked: true,
        pickable: true,
        onHover,
        onClick,
        updateTriggers: {
            getFillColor: [data, selectedPoints, selectedPatientIds],
            getLineColor: [data, selectedPoints, selectedPatientIds],
            getLineWidth: [data, selectedPoints, selectedPatientIds],
            getRadius: [selectedPoints, selectedPatientIds],
        },
    } as any);
}
