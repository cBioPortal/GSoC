import * as React from 'react';

export interface AxisLabelsProps {
    xAxisLabel?: string;
    yAxisLabel?: string;
    actualWidth: number;
    actualHeight: number;
}

export const AxisLabels: React.FC<AxisLabelsProps> = ({
    xAxisLabel,
    yAxisLabel,
    actualWidth,
    actualHeight,
}) => {
    if (!xAxisLabel && !yAxisLabel) {
        return null;
    }

    return (
        <>
            {/* X-axis label */}
            {xAxisLabel && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '5px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#666',
                        pointerEvents: 'none',
                        zIndex: 1,
                    }}
                >
                    {xAxisLabel}
                </div>
            )}

            {/* Y-axis label */}
            {yAxisLabel && (
                <div
                    style={{
                        position: 'absolute',
                        left: '5px',
                        top: '50%',
                        transform: 'translateY(-50%) rotate(-90deg)',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#666',
                        pointerEvents: 'none',
                        zIndex: 1,
                        transformOrigin: 'center center',
                    }}
                >
                    {yAxisLabel}
                </div>
            )}
        </>
    );
};
