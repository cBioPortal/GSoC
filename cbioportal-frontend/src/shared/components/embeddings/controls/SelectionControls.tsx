import * as React from 'react';

export interface SelectionControlsProps {
    selectionMode: 'none' | 'lasso';
    onSelectionModeChange: (mode: 'none' | 'lasso') => void;
}

export const SelectionControls: React.FC<SelectionControlsProps> = ({
    selectionMode,
    onSelectionModeChange,
}) => {
    return (
        <div
            style={{
                display: 'flex',
                gap: '2px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #ccc',
                borderRadius: '4px',
                padding: '2px',
            }}
        >
            <button
                onClick={() => onSelectionModeChange('none')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    fontSize: '11px',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    backgroundColor:
                        selectionMode === 'none' ? '#007bff' : 'transparent',
                    color: selectionMode === 'none' ? 'white' : '#333',
                    transition: 'all 0.2s ease',
                }}
                title="Pan and zoom the visualization"
            >
                <i
                    className="fa-regular fa-hand"
                    style={{ marginRight: '4px', fontSize: '11px' }}
                ></i>
                Pan
            </button>
            <button
                onClick={() => onSelectionModeChange('lasso')}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    fontSize: '11px',
                    border: 'none',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    backgroundColor:
                        selectionMode === 'lasso' ? '#007bff' : 'transparent',
                    color: selectionMode === 'lasso' ? 'white' : '#333',
                    transition: 'all 0.2s ease',
                }}
                title="Draw a freeform lasso to select points"
            >
                <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="4,4"
                    style={{ marginRight: '4px' }}
                >
                    <path d="M3 8c0-3 2-5 6-5s8 2 10 6c2 4 1 8-2 10s-7 2-10 0S1 13 3 8Z" />
                </svg>
                Select
            </button>
        </div>
    );
};
