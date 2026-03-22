/**
 * Common types and interfaces for embedding visualizations
 */

interface BaseEmbeddingData {
    studyIds: string[];
    title: string;
    description: string;
    totalPatients: number;
    sampleSize: number;
    embedding_type: 'patients' | 'samples';
}

export interface PatientEmbeddingData extends BaseEmbeddingData {
    embedding_type: 'patients';
    data: {
        patientId: string;
        x: number;
        y: number;
        data?: Record<string, any>;
    }[];
}

export interface SampleEmbeddingData extends BaseEmbeddingData {
    embedding_type: 'samples';
    data: {
        sampleId: string;
        x: number;
        y: number;
        data?: Record<string, any>;
    }[];
}

export type EmbeddingData = PatientEmbeddingData | SampleEmbeddingData;

export interface EmbeddingDataOption {
    value: string;
    label: string;
    data: EmbeddingData;
}

export interface EmbeddingPoint {
    x: number;
    y: number;
    patientId?: string;
    sampleId?: string;
    uniqueSampleKey?: string;
    color?: string;
    strokeColor?: string;
    displayLabel?: string;
    isInCohort?: boolean;
    [key: string]: any; // Allow additional properties for extensibility
}

export interface ViewState {
    target: [number, number, number];
    zoom: number;
    minZoom: number;
    maxZoom: number;
}

export interface EmbeddingVisualizationProps {
    data: EmbeddingPoint[];
    title?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    width?: number;
    height?: number;
    onPointSelection?: (selectedPoints: EmbeddingPoint[]) => void;
    selectedPatientIds?: string[];
    showLegend?: boolean;
    filename?: string;
    viewState?: ViewState;
    onViewStateChange?: (viewState: ViewState) => void;
    embeddingType?: 'patients' | 'samples';
    categoryCounts?: Map<string, number>;
    categoryColors?: Map<
        string,
        { fillColor: string; strokeColor: string; hasStroke: boolean }
    >;
    hiddenCategories?: Set<string>;
    onToggleCategoryVisibility?: (category: string) => void;
    onToggleAllCategories?: () => void;
    visibleSampleCount?: number;
    totalSampleCount?: number;
    visibleCategoryCount?: number;
    totalCategoryCount?: number;
    isNumericAttribute?: boolean;
    numericalValueRange?: [number, number];
    numericalValueToColor?: (x: number) => string;
    pinnedPoint?: EmbeddingPoint | null;
    onPinPoint?: (point: EmbeddingPoint) => void;
    onUnpinPoint?: () => void;
}

export interface EmbeddingControlsProps {
    embeddingOptions: EmbeddingDataOption[];
    selectedEmbedding: string;
    onEmbeddingChange: (value: string) => void;
    coloringComponent?: React.ReactNode;
}
