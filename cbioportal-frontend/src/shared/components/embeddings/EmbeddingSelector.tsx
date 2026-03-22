import * as React from 'react';

export interface EmbeddingOption {
    value: string;
    label: string;
    description?: string;
}

export interface EmbeddingSelectorProps {
    options: EmbeddingOption[];
    selectedValue: string;
    onSelectionChange: (value: string) => void;
    label?: string;
    className?: string;
    style?: React.CSSProperties;
}

/**
 * Reusable dropdown component for selecting embedding types (UMAP, PCA, etc.)
 */
export const EmbeddingSelector: React.FC<EmbeddingSelectorProps> = ({
    options,
    selectedValue,
    onSelectionChange,
    label = 'Embedding Type:',
    className,
    style,
}) => {
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        onSelectionChange(event.target.value);
    };

    return (
        <div
            className={className}
            style={{ display: 'flex', alignItems: 'center', ...style }}
        >
            <label
                htmlFor="embedding-select"
                style={{ marginRight: '8px', whiteSpace: 'nowrap' }}
            >
                {label}
            </label>
            <select
                id="embedding-select"
                value={selectedValue}
                onChange={handleChange}
                className="form-control"
                style={{
                    minWidth: '150px',
                    height: '34px', // Match bootstrap form-control height
                    fontSize: '14px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    padding: '6px 12px',
                }}
            >
                {options.map(option => (
                    <option
                        key={option.value}
                        value={option.value}
                        title={option.description}
                    >
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};
