import * as React from 'react';

export interface SelectionOverlayProps {
    isSelecting: boolean;
    selectionMode: 'none' | 'lasso';
    selectionPath: Array<{ x: number; y: number }>;
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({
    isSelecting,
    selectionMode,
    selectionPath,
}) => {
    if (
        !isSelecting ||
        selectionMode !== 'lasso' ||
        selectionPath.length < 2
    ) {
        return null;
    }

    // Calculate bounding box for SVG viewport
    let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
    for (const point of selectionPath) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
    }

    // Build SVG path string
    const pathData =
        `M ${selectionPath[0].x} ${selectionPath[0].y} ` +
        selectionPath
            .slice(1)
            .map(p => `L ${p.x} ${p.y}`)
            .join(' ') +
        ' Z';

    return (
        <svg
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 10,
            }}
        >
            <path
                d={pathData}
                fill="rgba(0, 123, 255, 0.1)"
                stroke="#007bff"
                strokeWidth={2}
                strokeDasharray="5,5"
            />
        </svg>
    );
};
