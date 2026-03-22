import * as React from 'react';

export interface ToolbarControlsProps {
    onExport: () => void;
    onCenter: () => void;
}

export const ToolbarControls: React.FC<ToolbarControlsProps> = ({
    onExport,
    onCenter,
}) => {
    return (
        <>
            <button
                onClick={onExport}
                style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #ccc',
                    borderRadius: '3px',
                    cursor: 'pointer',
                }}
            >
                Export PNG
            </button>

            <button
                onClick={onCenter}
                style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #ccc',
                    borderRadius: '3px',
                    cursor: 'pointer',
                }}
            >
                Center
            </button>
        </>
    );
};
