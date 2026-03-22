import * as React from 'react';
import { EmbeddingPoint } from '../EmbeddingTypes';

export interface TooltipDisplayProps {
    hoveredPoint: EmbeddingPoint | null;
    embeddingType?: 'patients' | 'samples';
    isPinned?: boolean;
    onUnpin?: () => void;
}

export const TooltipDisplay: React.FC<TooltipDisplayProps> = ({
    hoveredPoint,
    embeddingType,
    isPinned,
    onUnpin,
}) => {
    const [copied, setCopied] = React.useState(false);

    if (!hoveredPoint) return null;

    // Show appropriate ID based on embedding type
    const idLabel = embeddingType === 'samples' ? 'Sample ID' : 'Patient ID';
    const idValue =
        embeddingType === 'samples'
            ? hoveredPoint.sampleId
            : hoveredPoint.patientId;

    // Build fields list - read directly from point properties
    const fields: { label: string; value: string }[] = [];

    fields.push({ label: idLabel, value: idValue || '' });

    // For patient embeddings, show sample ID if available
    if (embeddingType === 'patients' && hoveredPoint.sampleId) {
        fields.push({ label: 'Sample ID', value: hoveredPoint.sampleId });
    }

    fields.push({
        label: 'Position',
        value: `(${hoveredPoint.x.toFixed(2)}, ${hoveredPoint.y.toFixed(2)})`,
    });

    if (hoveredPoint.displayLabel) {
        fields.push({ label: 'Category', value: hoveredPoint.displayLabel });
    }

    const handleCopy = () => {
        const text = fields.map(f => `${f.label}: ${f.value}`).join('\n');
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        });
    };

    return (
        <div
            style={{
                position: 'absolute',
                zIndex: 1,
                pointerEvents: isPinned ? 'auto' : 'none',
                left: '10px',
                bottom: '10px',
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                color: 'white',
                padding: '8px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                maxWidth: '320px',
                border: isPinned ? '1px solid rgba(255,255,255,0.4)' : 'none',
            }}
        >
            {isPinned && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: '4px',
                        gap: '6px',
                    }}
                >
                    <button
                        onClick={handleCopy}
                        title="Copy to clipboard"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: copied ? '#4caf50' : 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                            padding: '0 2px',
                            fontSize: '12px',
                            lineHeight: 1,
                        }}
                    >
                        {copied ? '✓' : '📋'}
                    </button>
                    <button
                        onClick={onUnpin}
                        title="Close"
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(255,255,255,0.7)',
                            cursor: 'pointer',
                            padding: '0 2px',
                            fontSize: '12px',
                            lineHeight: 1,
                        }}
                    >
                        ×
                    </button>
                </div>
            )}
            {fields.map((field, i) => (
                <div key={i}>
                    <strong>{field.label}:</strong> {field.value}
                </div>
            ))}
        </div>
    );
};
