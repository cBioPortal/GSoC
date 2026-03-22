import {
    GenericAssayCountSummary,
    GroupStatistics,
} from 'cbioportal-ts-api-client';

export interface BaseEnrichmentRow {
    checked: boolean;
    disabled: boolean;
    logRatio?: number;
    pValue: number;
    qValue: number;
    groupsSet: { [id: string]: GroupStatistics };
    enrichedGroup: string;
}

export interface ExpressionEnrichmentRow extends BaseEnrichmentRow {
    hugoGeneSymbol: string;
    entrezGeneId: number;
    cytoband: string;
}

export interface GenericAssayEnrichmentRow extends BaseEnrichmentRow {
    stableId: string;
    entityName: string;
}

export interface GenericAssayBinaryEnrichmentRow {
    checked: boolean;
    disabled: boolean;
    logRatio?: number;
    pValue: number;
    qValue: number;
    enrichedGroup: string;
    stableId: string;
    entityName: string;
    groupsSet: {
        [id: string]: GenericAssayCountSummary & { alteredPercentage: number };
    };
}

export interface GenericAssayCategoricalEnrichmentRow {
    checked: boolean;
    disabled: boolean;
    enrichedGroup: string;
    pValue: number;
    qValue: number;
    stableId: string;
    entityName: string;
    attributeType: string;
    statisticalTest: string;
    groupsSet: { [id: string]: GroupStatistics };
}
