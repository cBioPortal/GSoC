import _ from 'lodash';
import { SingleGeneQuery } from 'shared/lib/oql/oql-parser';
import {
    AlterationFilter,
    BinsGeneratorConfig,
    CancerStudy,
    CBioPortalAPIInternal,
    ClinicalAttribute,
    ClinicalData,
    ClinicalDataBin,
    ClinicalDataBinFilter,
    ClinicalDataCount,
    ClinicalDataMultiStudyFilter,
    DataFilterValue,
    DensityPlotBin,
    Gene,
    GeneFilterQuery,
    GenePanelData,
    GenePanelDataMultipleStudyFilter,
    GenericAssayData,
    GenericAssayDataBin,
    GenericAssayDataFilter,
    GenericAssayDataMultipleStudyFilter,
    GenomicDataBin,
    GenomicDataCount,
    MolecularDataMultipleStudyFilter,
    MolecularProfile,
    MutationMultipleStudyFilter,
    NamespaceAttribute,
    NamespaceDataCount,
    NamespaceDataCountItem,
    NamespaceDataFilter,
    NumericGeneMolecularData,
    OredPatientTreatmentFilters,
    Patient,
    PatientIdentifier,
    PatientTreatmentReport,
    PatientTreatmentRow,
    Sample,
    SampleClinicalDataCollection,
    SampleIdentifier,
    SampleTreatmentReport,
    SampleTreatmentRow,
    StructuralVariantFilterQuery,
    StudyViewFilter,
} from 'cbioportal-ts-api-client';
import * as React from 'react';
import { buildCBioPortalPageUrl } from '../../shared/api/urls';
import { BarDatum } from './charts/barChart/BarChart';
import {
    BinMethodOption,
    GenericAssayChart,
    GenomicChart,
    SurvivalType,
    XvsYChartSettings,
    XvsYScatterChart,
    XvsYViolinChart,
} from './StudyViewPageStore';
import { StudyViewPageTabKeyEnum } from 'pages/studyView/StudyViewPageTabs';
import { Layout } from 'react-grid-layout';
import internalClient, {
    getInternalClient,
} from 'shared/api/cbioportalInternalClientInstance';
import defaultClient from 'shared/api/cbioportalClientInstance';
import client from 'shared/api/cbioportalClientInstance';
import {
    ChartDimension,
    ChartTypeEnum,
    Position,
    STUDY_VIEW_CONFIG,
} from './StudyViewConfig';
import { IStudyViewDensityScatterPlotDatum } from './charts/scatterPlot/StudyViewDensityScatterPlot';
import {
    CNA_COLOR_AMP,
    CNA_COLOR_DEFAULT,
    CNA_COLOR_DIPLOID,
    CNA_COLOR_GAIN,
    CNA_COLOR_HETLOSS,
    CNA_COLOR_HOMDEL,
    EditableSpan,
    getTextWidth,
    MobxPromise,
    stringListToIndexSet,
    toPromise,
} from 'cbioportal-frontend-commons';
import {
    CLI_NO_COLOR,
    CLI_YES_COLOR,
    DEFAULT_NA_COLOR,
    DEFAULT_UNKNOWN_COLOR,
    getClinicalValueColor,
} from 'shared/lib/Colors';
import { StudyViewComparisonGroup } from '../groupComparison/GroupComparisonUtils';
import styles from './styles.module.scss';
import { getGroupParameters } from 'pages/groupComparison/comparisonGroupManager/ComparisonGroupManagerUtils';
import { IStudyViewScatterPlotData } from './charts/scatterPlot/StudyViewScatterPlotUtils';
import { CNA_TO_ALTERATION } from 'pages/resultsView/enrichments/EnrichmentsUtil';
import ComplexKeyMap from 'shared/lib/complexKeyDataStructures/ComplexKeyMap';
import { Datalabel } from 'shared/lib/DataUtils';
import {
    CNAProfilesEnum,
    StructuralVariantProfilesEnum,
} from 'shared/components/query/QueryStoreUtils';
import { ChartOption } from './addChartButton/AddChartButton';
import { observer } from 'mobx-react';
import {
    ChartUserSetting,
    CustomChartIdentifierWithValue,
    SessionGroupData,
    VirtualStudy,
} from 'shared/api/session-service/sessionServiceModels';
import { getServerConfig } from 'config/config';
import joinJsx from 'shared/lib/joinJsx';
import { BoundType, NumberRange } from 'range-ts';
import {
    ClinicalEventTypeCount,
    GenericAssayDataCountFilter,
    GenericAssayDataCountItem,
    GenomicDataCountFilter,
    GenomicDataFilter,
} from 'cbioportal-ts-api-client/dist/generated/CBioPortalAPIInternal';
import { queryContainsStructVarAlteration } from 'shared/lib/oql/oqlfilter';
import { toast } from 'react-toastify';
import { useCallback } from 'react';
import { MutationOptionConstants } from 'shared/constants';
import { MolecularAlterationType_filenameSuffix } from 'shared/lib/StoreUtils';
import { MultiSelectionTableRow } from './table/MultiSelectionTable';
import Survival from 'pages/groupComparison/Survival';
import { StructVarMultiSelectionTableRow } from './table/StructuralVariantMultiSelectionTable';
import { ObservableMap } from 'mobx';

// Cannot use ClinicalDataTypeEnum here for the strong type. The model in the type is not strongly typed
export enum ClinicalDataTypeEnum {
    SAMPLE = 'SAMPLE',
    PATIENT = 'PATIENT',
}

export enum NumericalGroupComparisonType {
    QUARTILES = 'QUARTILES',
    MEDIAN = 'MEDIAN',
    BINS = 'BINS',
}

export enum DataType {
    STRING = 'STRING',
    NUMBER = 'NUMBER',
}

export type ClinicalDataType = 'SAMPLE' | 'PATIENT';

export type ChartType = keyof typeof ChartTypeEnum;

export enum SpecialChartsUniqueKeyEnum {
    CUSTOM_SELECT = 'CUSTOM_SELECT',
    SELECTED_COMPARISON_GROUPS = 'SELECTED_COMPARISON_GROUPS',
    CANCER_STUDIES = 'CANCER_STUDIES',
    MUTATION_COUNT = 'MUTATION_COUNT',
    VARIANT_ANNOTATIONS = 'VARIANT_ANNOTATIONS',
    FRACTION_GENOME_ALTERED = 'FRACTION_GENOME_ALTERED',
    GENOMIC_PROFILES_SAMPLE_COUNT = 'GENOMIC_PROFILES_SAMPLE_COUNT',
    CASE_LISTS_SAMPLE_COUNT = 'CASE_LISTS_SAMPLE_COUNT',
    PATIENT_TREATMENTS = 'PATIENT_TREATMENTS',
    PATIENT_TREATMENT_GROUPS = 'PATIENT_TREATMENT_GROUPS',
    PATIENT_TREATMENT_TARGET = 'PATIENT_TREATMENT_TARGET',
    SAMPLE_TREATMENTS = 'SAMPLE_TREATMENTS',
    SAMPLE_TREATMENT_GROUPS = 'SAMPLE_TREATMENT_GROUPS',
    SAMPLE_TREATMENT_TARGET = 'SAMPLE_TREATMENT_TARGET',
    CLINICAL_EVENT_TYPE_COUNTS = 'CLINICAL_EVENT_TYPE_COUNTS',
}

export type AnalysisGroup = {
    name?: string;
    value: string;
    color: string;
    legendText?: string;
};

export enum ChartMetaDataTypeEnum {
    CUSTOM_DATA = 'Custom_Data',
    X_VS_Y_SCATTER = 'X_Vs_Y_Scatter',
    X_VS_Y_VIOLIN = 'X_Vs_Y_Violin',
    CLINICAL = 'Clinical',
    GENOMIC = 'Genomic',
    GENE_SPECIFIC = 'Gene_Specific',
    GENERIC_ASSAY = 'Generic_Assay',
    VARIANT_ANNOTATIONS = 'Variant_Annotations',
}

export type ChartMeta = {
    clinicalAttribute?: ClinicalAttribute;
    namespaceAttribute?: NamespaceAttribute;
    genericAssayType?: string;
    mutationOptionType?: string;
    uniqueKey: string;
    displayName: string;
    description: string;
    priority: number;
    dataType: ChartMetaDataTypeEnum;
    patientAttribute: boolean;
    renderWhenDataChange: boolean;
};

export type ChartMetaWithDimensionAndChartType = ChartMeta & {
    dimension: ChartDimension;
    chartType: ChartType;
};
export type ChartDataCountSet = { [uniqueKey: string]: number };
export type StudyWithSamples = CancerStudy & {
    uniqueSampleKeys: string[];
};
export type StudyViewFilterWithSampleIdentifierFilters = StudyViewFilter & {
    sampleIdentifiersSet: { [id: string]: SampleIdentifier[] };
};

export type GenomicDataCountWithSampleUniqueKeys = GenomicDataCount & {
    sampleUniqueKeys: string[];
};

export type RectangleBounds = {
    xEnd?: number;
    xStart?: number;
    yEnd?: number;
    yStart?: number;
};

export type MolecularProfileOption = {
    value: string;
    count: number;
    label: string;
    description: string;
    dataType: string;
    alterationType: string;
    patientLevel?: boolean;
};

// DataBin is a generic type for ClinicalDataBin, GenomicDataBin and GenericAssayDataBin
export type DataBin = {
    id: string;
    count: number;
    end: number;
    specialValue: string;
    start: number;
};

export type MutationCategorization = 'MUTATED' | 'MUTATION_TYPE';

export const SPECIAL_CHARTS: ChartMetaWithDimensionAndChartType[] = [
    {
        uniqueKey: SpecialChartsUniqueKeyEnum.CANCER_STUDIES,
        displayName: 'Cancer Studies',
        description: 'The cancer study id for each sample in the cohort',
        dataType: ChartMetaDataTypeEnum.CLINICAL,
        patientAttribute: false,
        chartType: ChartTypeEnum.PIE_CHART,
        dimension: {
            w: 1,
            h: 1,
        },
        renderWhenDataChange: false,
        priority: 70,
    },
    {
        uniqueKey: SpecialChartsUniqueKeyEnum.GENOMIC_PROFILES_SAMPLE_COUNT,
        displayName: 'Data Types',
        description: '',
        chartType: ChartTypeEnum.GENOMIC_PROFILES_TABLE,
        dataType: ChartMetaDataTypeEnum.GENOMIC,
        patientAttribute: false,
        dimension: {
            w: 2,
            h: 2,
        },
        priority: 70,
        renderWhenDataChange: false,
    },
    {
        uniqueKey: SpecialChartsUniqueKeyEnum.CASE_LISTS_SAMPLE_COUNT,
        displayName: 'Case Lists',
        description: '',
        chartType: ChartTypeEnum.CASE_LIST_TABLE,
        dataType: ChartMetaDataTypeEnum.CLINICAL,
        patientAttribute: false,
        dimension: {
            w: 2,
            h: 2,
        },
        priority: 70,
        renderWhenDataChange: false,
    },
];

export const COLORS = [
    STUDY_VIEW_CONFIG.colors.theme.primary,
    STUDY_VIEW_CONFIG.colors.theme.secondary,
    STUDY_VIEW_CONFIG.colors.theme.tertiary,
    STUDY_VIEW_CONFIG.colors.theme.quaternary,
    '#990099',
    '#0099c6',
    '#dd4477',
    '#66aa00',
    '#b82e2e',
    '#316395',
    '#994499',
    '#22aa99',
    '#aaaa11',
    '#6633cc',
    '#e67300',
    '#8b0707',
    '#651067',
    '#329262',
    '#5574a6',
    '#3b3eac',
    '#b77322',
    '#16d620',
    '#b91383',
    '#f4359e',
    '#9c5935',
    '#a9c413',
    '#2a778d',
    '#668d1c',
    '#bea413',
    '#0c5922',
    '#743411',
    '#743440',
    '#9986e2',
    '#6c3912',
    '#788508',
    '#609618',
    '#790099',
    '#5099c6',
    '#2d4477',
    '#76aa00',
    '#882e2e',
    '#916395',
    '#794499',
    '#92aa99',
    '#2aaa11',
    '#5633cc',
    '#667300',
    '#100707',
    '#751067',
    '#229262',
    '#4574a6',
    '#103eac',
    '#177322',
    '#66d620',
    '#291383',
    '#94359e',
    '#5c5935',
    '#29c413',
    '#6a778d',
    '#868d1c',
    '#5ea413',
    '#6c5922',
    '#243411',
    '#103440',
    '#2886e2',
    '#d93912',
    '#f28508',
    '#110618',
    '#970099',
    '#0109c6',
    '#d10477',
    '#68aa00',
    '#b12e2e',
    '#310395',
    '#944499',
    '#24aa99',
    '#a4aa11',
    '#6333cc',
    '#e77300',
    '#820707',
    '#610067',
    '#339262',
    '#5874a6',
    '#313eac',
    '#b67322',
    '#13d620',
    '#b81383',
    '#f8359e',
    '#935935',
    '#a10413',
    '#29778d',
    '#678d1c',
    '#b2a413',
    '#075922',
    '#763411',
    '#773440',
    '#2996e2',
    '#dc4912',
    '#f81508',
    '#104618',
    '#991099',
    '#0049c6',
    '#dd2477',
    '#663a00',
    '#b84e2e',
    '#312395',
    '#993499',
    '#223a99',
    '#aa1a11',
    '#6673cc',
    '#e66300',
    '#8b5707',
    '#656067',
    '#323262',
    '#5514a6',
    '#3b8eac',
    '#b71322',
    '#165620',
    '#b99383',
    '#f4859e',
    '#9c4935',
    '#a91413',
    '#2a978d',
    '#669d1c',
    '#be1413',
    '#0c8922',
    '#742411',
    '#744440',
    '#2983e2',
    '#dc3612',
    '#f88808',
    '#109518',
    '#990599',
    '#0092c6',
    '#dd4977',
    '#66a900',
    '#b8282e',
    '#316295',
    '#994199',
    '#22a499',
    '#aaa101',
    '#66310c',
    '#e67200',
    '#8b0907',
    '#651167',
    '#329962',
    '#5573a6',
    '#3b37ac',
    '#b77822',
    '#16d120',
    '#b91783',
    '#f4339e',
    '#9c5105',
    '#a9c713',
    '#2a710d',
    '#66841c',
    '#bea913',
    '#0c5822',
    '#743911',
    '#743740',
    '#298632',
    '#dc3922',
    '#f88588',
    '#109658',
    '#990010',
    '#009916',
    '#dd4447',
    '#66aa60',
    '#b82e9e',
    '#316365',
    '#994489',
    '#22aa69',
    '#aaaa51',
    '#66332c',
    '#e67390',
    '#8b0777',
    '#651037',
    '#329232',
    '#557486',
    '#3b3e4c',
    '#b77372',
    '#16d690',
    '#b91310',
    '#f4358e',
    '#9c5910',
    '#a9c493',
    '#2a773d',
    '#668d5c',
    '#bea463',
    '#0c5952',
    '#743471',
    '#743450',
    '#2986e3',
    '#dc3914',
    '#f88503',
    '#109614',
    '#990092',
    '#0099c8',
    '#dd4476',
    '#66aa04',
    '#b82e27',
    '#316397',
    '#994495',
    '#22aa93',
    '#aaaa14',
    '#6633c1',
    '#e67303',
    '#8b0705',
    '#651062',
    '#329267',
    '#5574a1',
    '#3b3ea5',
];

export const EXPONENTIAL_FRACTION_DIGITS = 3;

export const MutationCountVsCnaYBinsMin = 52; // calibrated so that the dots are right up against each other. needs to correspond with the width and height of the chart
export const SURVIVAL_PLOT_ID_SUFFIX = 'SURVIVAL';

const OPERATOR_MAP: { [op: string]: string } = {
    '<=': '≤',
    '<': '<',
    '>=': '≥',
    '>': '>',
};

export function getClinicalAttributeOverlay(
    displayName: string,
    description: string,
    clinicalAttributeId?: string,
    isCompactSurvivalChart?: boolean
): JSX.Element {
    const comparisonDisplayName = displayName.toLowerCase().trim();
    let comparisonDescription = description
        .toLowerCase()
        .trim()
        .replace(/.&/, '');
    return (
        <div style={{ maxWidth: '300px' }}>
            <div>
                <b>{displayName}</b>{' '}
                {!!clinicalAttributeId && (
                    <span className={styles.titleMeta}>
                        ID: {clinicalAttributeId}
                    </span>
                )}
            </div>
            {comparisonDescription !== comparisonDisplayName && (
                <div>{description}</div>
            )}
            <br />
            {isCompactSurvivalChart && (
                <div>All events were floored to the nearest month</div>
            )}
            {!!clinicalAttributeId &&
                new RegExp(`${SURVIVAL_PLOT_ID_SUFFIX}$`).test(
                    clinicalAttributeId
                ) && <div>x axis unit: months</div>}
        </div>
    );
}

export function getDescriptionOverlay(
    displayName: string,
    description: string,
    id?: string
): JSX.Element {
    const comparisonDisplayName = displayName.toLowerCase().trim();
    let comparisonDescription = description
        .toLowerCase()
        .trim()
        .replace(/.&/, '');
    return (
        <div style={{ maxWidth: '300px' }}>
            <div>
                <b>{displayName}</b>{' '}
                {!!id && <span className={styles.titleMeta}>ID: {id}</span>}
            </div>
            {comparisonDescription !== comparisonDisplayName && (
                <div>{description}</div>
            )}
        </div>
    );
}

// This function acts as a toggle. If present in 'geneQueries',
// the query is removed. If absent a query is added.
export function updateGeneQuery(
    geneQueries: SingleGeneQuery[],
    selectedGene: string
): SingleGeneQuery[] {
    // Remove any query that is already known for this gene.
    let updatedQueries = _.filter(
        geneQueries,
        query =>
            query.gene !== selectedGene ||
            queryContainsStructVarAlteration(query)
    );
    if (updatedQueries.length === geneQueries.length) {
        updatedQueries.push({
            gene: selectedGene,
            alterations: false,
        });
    }
    return updatedQueries;
}

function translateSpecialText(text: string | undefined): string {
    if (!text) {
        return '';
    } else if (text === '>=') {
        return '≥';
    } else if (text === '<=') {
        return '≤';
    }

    return text;
}

export function formatRange(
    min: number | undefined,
    max: number | undefined,
    special: string | undefined
): string {
    special = translateSpecialText(special);

    if (min === undefined) {
        if (max === undefined) {
            return special;
        } else {
            return `${special}${max.toLocaleString()}`;
        }
    } else {
        if (max === undefined || min === max) {
            return `${special}${min.toLocaleString()}`;
        } else if (!special) {
            // assuming that min is exclusive and max is inclusive
            // use (min, max] notation instead of min-max
            return `(${min.toLocaleString()}, ${max.toLocaleString()}]`;
        } else {
            return `${special}${min.toLocaleString()}-${max.toLocaleString()}`;
        }
    }
}

function getBinStatsForTooltip(d: IStudyViewDensityScatterPlotDatum) {
    let yRange = formatRange(d.minY, d.maxY, undefined);
    let xRange = '';
    if (d.maxX.toFixed(2) !== d.minX.toFixed(2)) {
        xRange = `${d.minX.toFixed(2)}-${d.maxX.toFixed(2)}`;
    } else {
        xRange = d.minX.toFixed(2);
    }
    return { xRange, yRange };
}

export function makeDensityScatterPlotTooltip(
    chartInfo: XvsYScatterChart,
    chartSettings: XvsYChartSettings
) {
    return (d: IStudyViewDensityScatterPlotDatum) => {
        const binStats = getBinStatsForTooltip(d);
        return (
            <div>
                <div>
                    Number of Samples: <b>{d.count.toLocaleString()}</b>
                </div>
                <div>
                    {chartInfo.xAttr.displayName}
                    {chartSettings.xLogScale ? ' (log)' : ''}:{' '}
                    <b>{binStats.xRange}</b>
                </div>
                <div>
                    {chartInfo.yAttr.displayName}
                    {chartSettings.yLogScale ? ' (log)' : ''}:{' '}
                    <b>{binStats.yRange}</b>
                </div>
            </div>
        );
    };
}

export async function getSampleToClinicalData(
    samples: Sample[],
    attr: ClinicalAttribute
) {
    const data = await client.fetchClinicalDataUsingPOST({
        clinicalDataMultiStudyFilter: {
            attributeIds: [attr.clinicalAttributeId],
            identifiers: attr.patientAttribute
                ? samples.map(s => ({
                      entityId: s.patientId,
                      studyId: s.studyId,
                  }))
                : samples.map(s => ({
                      entityId: s.sampleId,
                      studyId: s.studyId,
                  })),
        } as ClinicalDataMultiStudyFilter,
        clinicalDataType: attr.patientAttribute ? 'PATIENT' : 'SAMPLE',
        projection: 'SUMMARY',
    });
    let ret: { [uniqueSampleKey: string]: ClinicalData };
    if (attr.patientAttribute) {
        const patientToData = _.keyBy(data, d => d.uniquePatientKey);
        ret = {};
        for (const sample of samples) {
            ret[sample.uniqueSampleKey] =
                patientToData[sample.uniquePatientKey];
        }
    } else {
        ret = _.keyBy(data, d => d.uniqueSampleKey);
    }
    return ret;
}

export function generateXvsYScatterPlotDownloadData(
    xAttr: ClinicalAttribute,
    yAttr: ClinicalAttribute,
    samples: Sample[],
    sampleXData: { [uniqueSampleKey: string]: ClinicalData },
    sampleYData: { [uniqueSampleKey: string]: ClinicalData }
) {
    const header = [
        'Cancer Study',
        'Patient ID',
        'Sample ID',
        xAttr.displayName,
        yAttr.displayName,
    ];

    const rows: string[][] = [];
    samples.forEach(sample => {
        const xData = sampleXData[sample.uniqueSampleKey];
        const yData = sampleYData[sample.uniqueSampleKey];
        if (xData && yData) {
            rows.push([
                sample.studyId,
                sample.patientId,
                sample.sampleId,
                xData ? xData.value : '-',
                yData ? yData.value : '-',
            ]);
        }
    });

    return [header]
        .concat(rows)
        .map(row => row.join('\t'))
        .join('\n');
}

export function generateScatterPlotDownloadData(
    data: IStudyViewScatterPlotData[],
    sampleToAnalysisGroup?: { [sampleKey: string]: string },
    analysisClinicalAttribute?: ClinicalAttribute,
    analysisGroups?: AnalysisGroup[]
) {
    const header = [
        'Cancer Study',
        'Patient ID',
        'Sample ID',
        'Mutation Count',
        'CNA Fraction',
    ];
    let valueToGroup: { [value: string]: AnalysisGroup };

    if (
        analysisClinicalAttribute !== undefined &&
        sampleToAnalysisGroup !== undefined
    ) {
        header.push(analysisClinicalAttribute.displayName);

        if (analysisGroups !== undefined) {
            header.push('Color');
            valueToGroup = _.keyBy(analysisGroups, 'value');
        }
    }

    const rows = data.map(datum => {
        const row = [
            `${datum.studyId}`,
            `${datum.patientId}`,
            `${datum.sampleId}`,
            `${datum.y}`,
            `${datum.x}`,
        ];

        if (
            analysisClinicalAttribute !== undefined &&
            sampleToAnalysisGroup !== undefined
        ) {
            const value = sampleToAnalysisGroup[datum.uniqueSampleKey];

            row.push(value !== undefined ? `${value}` : Datalabel.NA);

            if (analysisGroups !== undefined && value !== undefined) {
                row.push(
                    valueToGroup[value] !== undefined
                        ? valueToGroup[value].color
                        : Datalabel.NA
                );
            }
        }

        return row;
    });

    return [header]
        .concat(rows)
        .map(row => row.join('\t'))
        .join('\n');
}

export function isSelected(
    datum: { uniqueSampleKey: string },
    selectedSamples: { [uniqueSampleKey: string]: any }
) {
    return datum.uniqueSampleKey in selectedSamples;
}

export function getPriority(priorities: number[]): number {
    let priority = 0;
    _.some(priorities, _priority => {
        if (_priority === 0) {
            priority = 0;
            return true;
        }
        priority = (_priority + priority) / 2;
    });
    return priority;
}

export function getUniqueKey(attribute: ClinicalAttribute): string {
    return attribute.clinicalAttributeId;
}

export function getUniqueNamespaceKey(attribute: NamespaceAttribute): string {
    return attribute.outerKey.concat('_', attribute.innerKey);
}

function getNamespaceChartDisplayName(
    attribute: NamespaceAttribute,
    namespaceAttributes: NamespaceAttribute[]
): string {
    const innerKey = attribute.innerKey.split('_').join(' ');
    if (
        namespaceAttributes.filter(item => attribute.innerKey === item.innerKey)
            .length > 1
    ) {
        return `${innerKey} (${attribute.outerKey})`;
    } else {
        return innerKey;
    }
}

export function getGenomicChartUniqueKey(
    hugoGeneSymbol: string,
    profileType: string,
    mutationOptionType?: string
): string {
    return mutationOptionType
        ? hugoGeneSymbol + '_' + profileType + '_' + mutationOptionType
        : hugoGeneSymbol + '_' + profileType;
}

export function getGenericAssayChartUniqueKey(
    entityId: string,
    profileType: string
): string {
    return entityId + '_' + profileType;
}

const UNIQUE_KEY_SEPARATOR = ':';
const CHART_TYPE_SEPARATOR = ';';

export function getUniqueKeyFromGeneFilterMolecularProfileIds(
    molecularProfileIds: string[]
) {
    const svChartType = molecularProfileIds[0]?.includes('structural_variants')
        ? ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE
        : undefined;
    return getUniqueKeyFromMolecularProfileIds(
        molecularProfileIds,
        svChartType
    );
}

export function getUniqueKeyFromMolecularProfileIds(
    molecularProfileIds: string[],
    chartType?: ChartTypeEnum
) {
    const returnValue = _(molecularProfileIds)
        .sortBy()
        .join(UNIQUE_KEY_SEPARATOR);
    return chartType
        ? chartType + CHART_TYPE_SEPARATOR + returnValue
        : returnValue;
}

export function calculateSampleCountForClinicalEventTypeCountTable(
    selectedPatientCnt: number,
    selectedSampleCnt: number,
    clinicalEventTypeCounts?: ClinicalEventTypeCount[]
): number {
    let sampleCount = 0;
    if (!_.isEmpty(clinicalEventTypeCounts) && selectedPatientCnt > 0) {
        const maxClinicalEventTypeCount = _.maxBy(
            clinicalEventTypeCounts,
            c => c.count
        );
        const freqOfPatients =
            maxClinicalEventTypeCount!.count / selectedPatientCnt;
        sampleCount = selectedSampleCnt * freqOfPatients;
    }
    return sampleCount;
}

function startsWithSvChartType(chartType?: string) {
    return (
        chartType &&
        [
            ChartTypeEnum.STRUCTURAL_VARIANTS_TABLE,
            ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE,
        ].some(ct => chartType.startsWith(ct))
    );
}

export function getMolecularProfileIdsFromUniqueKey(uniqueKey: string) {
    // chartType is added to the uniqueKey for structural variant charts. Example: 'structural_variants;study1_structural_variants:study2_structural_variants'.
    // and for other charts, it is not added. Example: 'study1_mutations:study2_mutations'.
    return (startsWithSvChartType(uniqueKey)
        ? uniqueKey.substring(uniqueKey.indexOf(CHART_TYPE_SEPARATOR) + 1)
        : uniqueKey
    ).split(UNIQUE_KEY_SEPARATOR);
}

export function getCurrentDate() {
    return new Date().toISOString().slice(0, 10);
}

export function getVirtualStudyDescription(
    previousDescription: string | undefined,
    studyWithSamples: StudyWithSamples[],
    filter: StudyViewFilterWithSampleIdentifierFilters,
    attributeNamesSet: { [id: string]: string },
    molecularProfileNameSet: { [id: string]: string },
    caseListNameSet: { [key: string]: string },
    user?: string,
    hideSampleCounts: boolean = false
) {
    let descriptionLines: string[] = [];
    const createdOnStr = 'Created on';
    if (previousDescription) {
        // when the description is predefined, we just need to trim off anything after createdOnStr
        const regex = new RegExp(`${createdOnStr}.*`);
        descriptionLines.push(previousDescription.replace(regex, ''));
    } else {
        //add to samples and studies count
        let uniqueSampleKeys = _.uniq(
            _.flatMap(studyWithSamples, study => study.uniqueSampleKeys)
        );
        descriptionLines.push(
            (hideSampleCounts
                ? 'Samples'
                : `${uniqueSampleKeys.length} sample${
                      uniqueSampleKeys.length > 1 ? 's' : ''
                  }`) +
                ` from ${studyWithSamples.length} ${
                    studyWithSamples.length > 1 ? 'studies:' : 'study:'
                }`
        );
        //add individual studies sample count
        studyWithSamples.forEach(studyObj => {
            descriptionLines.push(
                `- ${studyObj.name}` +
                    (hideSampleCounts
                        ? ''
                        : ` (${studyObj.uniqueSampleKeys.length} sample${
                              uniqueSampleKeys.length > 1 ? 's' : ''
                          })`)
            );
        });
        //add filters
        let filterLines: string[] = [];
        if (!_.isEmpty(filter)) {
            _.each(filter.geneFilters || [], geneFilter => {
                let name =
                    attributeNamesSet[
                        getUniqueKeyFromMolecularProfileIds(
                            geneFilter.molecularProfileIds
                        )
                    ];
                filterLines.push(`- ${name}:`);
                filterLines = filterLines.concat(
                    geneFilter.geneQueries
                        .map(geneQuery => {
                            return geneQuery
                                .map(geneFilterQueryToOql)
                                .join(', ')
                                .trim();
                        })
                        .map(line => '  - ' + line)
                );
            });

            if (!_.isEmpty(filter.genomicProfiles)) {
                filterLines.push('- Genomic Profile Sample Counts:');
                filterLines = filterLines.concat(
                    filter.genomicProfiles
                        .map(profiles =>
                            profiles
                                .map(
                                    profile => molecularProfileNameSet[profile]
                                )
                                .join(', ')
                                .trim()
                        )
                        .map(line => '  - ' + line)
                );
            }

            if (!_.isEmpty(filter.caseLists)) {
                filterLines.push('- Case List Sample Counts:');
                filterLines = filterLines.concat(
                    filter.caseLists
                        .map(caseList =>
                            caseList
                                .map(caseList => caseListNameSet[caseList])
                                .join(', ')
                                .trim()
                        )
                        .map(line => '  - ' + line)
                );
            }

            _.each(filter.clinicalDataFilters || [], clinicalDataFilter => {
                let name = attributeNamesSet[clinicalDataFilter.attributeId];
                if (name) {
                    filterLines.push(
                        `- ${name}: ${intervalFiltersDisplayValue(
                            clinicalDataFilter.values,
                            () => {},
                            true
                        )}`
                    );
                }
            });

            _.each(filter.genomicDataFilters || [], genomicDataFilter => {
                const uniqueKey = getGenomicChartUniqueKey(
                    genomicDataFilter.hugoGeneSymbol,
                    genomicDataFilter.profileType
                );
                const name = attributeNamesSet[uniqueKey];

                if (name) {
                    filterLines.push(
                        `- ${name}: ${intervalFiltersDisplayValue(
                            genomicDataFilter.values,
                            () => {},
                            true
                        )}`
                    );
                }
            });

            _.each(filter.mutationDataFilters || [], mutationDataFilter => {
                const uniqueKey = getGenomicChartUniqueKey(
                    mutationDataFilter.hugoGeneSymbol,
                    mutationDataFilter.profileType,
                    mutationDataFilter.categorization
                );

                const name = attributeNamesSet[uniqueKey];

                if (name) {
                    _.each(mutationDataFilter.values || [], value => {
                        filterLines.push(
                            `- ${name}: ${intervalFiltersDisplayValue(
                                value,
                                () => {},
                                true
                            )}`
                        );
                    });
                }
            });

            _.each(
                filter.genericAssayDataFilters || [],
                genericAssayDataFilters => {
                    const uniqueKey = getGenericAssayChartUniqueKey(
                        genericAssayDataFilters.stableId,
                        genericAssayDataFilters.profileType
                    );
                    const name = attributeNamesSet[uniqueKey];
                    if (name) {
                        filterLines.push(
                            `- ${name}: ${intervalFiltersDisplayValue(
                                genericAssayDataFilters.values,
                                () => {},
                                true
                            )}`
                        );
                    }
                }
            );

            _.each(
                filter.sampleIdentifiersSet || {},
                (sampleIdentifiers, id) => {
                    let name = attributeNamesSet[id] || id;
                    filterLines.push(
                        `- ${name}: ${sampleIdentifiers.length} samples`
                    );
                }
            );
        }
        if (filterLines.length > 0) {
            descriptionLines.push('');
            descriptionLines.push('Filters:');
            descriptionLines = descriptionLines.concat(filterLines);
        }
        descriptionLines.push('');
    }
    //add creation and user name
    descriptionLines.push(
        `${createdOnStr} ` + getCurrentDate() + (user ? ' by ' + user : '')
    );
    return descriptionLines.join('\n');
}

export function isFiltered(
    filter: Partial<StudyViewFilterWithSampleIdentifierFilters>
) {
    const flag = !(
        _.isEmpty(filter) ||
        (_.isEmpty(filter.clinicalDataFilters) &&
            _.isEmpty(filter.geneFilters) &&
            _.isEmpty(filter.structuralVariantFilters) &&
            _.isEmpty(filter.genomicProfiles) &&
            _.isEmpty(filter.genomicDataFilters) &&
            _.isEmpty(filter.mutationDataFilters) &&
            _.isEmpty(filter.namespaceDataFilters) &&
            _.isEmpty(filter.genericAssayDataFilters) &&
            _.isEmpty(filter.caseLists) &&
            _.isEmpty(filter.customDataFilters) &&
            (!filter.patientTreatmentFilters ||
                _.isEmpty(filter.patientTreatmentFilters.filters)) &&
            (!filter.sampleTreatmentFilters ||
                _.isEmpty(filter.sampleTreatmentFilters.filters)) &&
            (!filter.patientTreatmentGroupFilters ||
                _.isEmpty(filter.patientTreatmentGroupFilters.filters)) &&
            (!filter.sampleTreatmentGroupFilters ||
                _.isEmpty(filter.sampleTreatmentGroupFilters.filters)) &&
            (!filter.patientTreatmentTargetFilters ||
                _.isEmpty(filter.patientTreatmentTargetFilters.filters)) &&
            (!filter.sampleTreatmentTargetFilters ||
                _.isEmpty(filter.sampleTreatmentTargetFilters.filters)) &&
            _.isEmpty(filter.clinicalEventFilters))
    );

    if (filter.sampleIdentifiersSet) {
        return flag || !_.isEmpty(filter.sampleIdentifiersSet);
    } else {
        return flag;
    }
}

export function makePatientToClinicalAnalysisGroup(
    samples: Pick<Sample, 'uniqueSampleKey' | 'uniquePatientKey'>[],
    sampleToAnalysisGroup: { [sampleKey: string]: string }
) {
    // only include a patient if all its samples are in the same analysis group
    const badPatients: { [patientKey: string]: boolean } = {};
    return _.reduce(
        samples,
        (map, sample) => {
            const patientKey = sample.uniquePatientKey;
            if (!(patientKey in badPatients)) {
                // weve not already determined that not all this patients samples are in the same group

                const sampleGroup =
                    sampleToAnalysisGroup[sample.uniqueSampleKey];
                if (patientKey in map) {
                    if (map[patientKey] !== sampleGroup) {
                        // this means that weve seen another sample for this patient thats not
                        //  in the same group. therefore, not all this patients samples are in
                        //  the same group, so we're going to omit it
                        delete map[patientKey];
                        badPatients[patientKey] = true;
                    } // otherwise, we already have the right group, so dont do anything
                } else {
                    // this is the first sample weve seen from this patient
                    map[patientKey] = sampleGroup;
                }
            }
            return map;
        },
        {} as { [patientKey: string]: string }
    );
}

export function toSvgDomNodeWithLegend(
    svgElement: SVGElement,
    params: {
        legendGroupSelector: string;
        selectorToHide?: string;
        chartGroupSelector?: string;
        centerLegend?: boolean;
    }
) {
    const svg = svgElement.cloneNode(true) as SVGElement;
    const legend = $(svgElement)
        .find(params.legendGroupSelector)
        .get(0);
    const legendBBox = legend.getBoundingClientRect();
    if (params.selectorToHide) {
        $(svg)
            .find(params.selectorToHide)
            .remove();
    }

    const height = +$(svgElement).height()! + legendBBox.height;
    const width = Math.max($(svgElement).width()!, legendBBox.width);

    // adjust width and height to make sure that the legend is fully visible
    $(svg).attr('height', height + 5);
    $(svg).attr('width', width);
    $(svg).css({ height: height + 5, width });

    // center elements
    if (params.centerLegend) {
        const widthDiff = Math.abs($(svgElement).width()! - legendBBox.width);
        const shift = widthDiff / 2;
        const transform = `translate(${shift}, 0)`;

        if ($(svgElement).width()! > legendBBox.width) {
            // legend needs to be centered wrt the chart
            $(svg)
                .find(params.legendGroupSelector)
                .attr('transform', transform);
        } else if (params.chartGroupSelector) {
            // chart needs to be centered wrt the legend
            $(svg)
                .find(params.chartGroupSelector)
                .attr('transform', transform);
        }
    }

    return svg;
}

export function getDataIntervalFilterValues(
    data: Array<{ start?: number; end?: number; specialValue?: string }>
): DataFilterValue[] {
    return data.map(
        dataBin =>
            ({
                start: dataBin.start,
                end: dataBin.end,
                value:
                    dataBin.start === undefined && dataBin.end === undefined
                        ? dataBin.specialValue
                        : undefined,
            } as DataFilterValue)
    );
}

export function getCategoricalFilterValues(
    values: string[]
): DataFilterValue[] {
    return values.map(
        value =>
            ({
                value: value,
            } as DataFilterValue)
    );
}

export function filterNumericalBins(data: DataBin[]) {
    return data.filter(
        dataBin => dataBin.start !== undefined || dataBin.end !== undefined
    );
}

export function filterCategoryBins(data: DataBin[]) {
    return data.filter(
        dataBin => dataBin.start === undefined && dataBin.end === undefined
    );
}

export function filterIntervalBins(numericalBins: DataBin[]) {
    return numericalBins.filter(
        dataBin => dataBin.start !== undefined && dataBin.end !== undefined
    );
}

export function calcIntervalBinValues(intervalBins: DataBin[]) {
    const values = intervalBins.map(dataBin => dataBin.start);

    if (intervalBins.length > 0) {
        const lastIntervalBin = intervalBins[intervalBins.length - 1];

        if (lastIntervalBin.start !== lastIntervalBin.end) {
            values.push(lastIntervalBin.end);
        }
    }

    return values;
}

export function needAdditionShiftForLogScaleBarChart(
    numericalBins: DataBin[]
): boolean {
    return (
        isLogScaleByDataBins(numericalBins) &&
        numericalBins[0].start !== undefined &&
        numericalBins[0].start !== 0 &&
        !isIntegerPowerOfTen(numericalBins[0].start)
    );
}

export function generateNumericalData(numericalBins: DataBin[]): BarDatum[] {
    // by default shift all x values by 1 -- we do not want to show a value right on the origin (zero)
    // additional possible shift for log scale
    const xShift = needAdditionShiftForLogScaleBarChart(numericalBins) ? 2 : 1;

    return numericalBins.map((dataBin: DataBin, index: number) => {
        let x;

        // we want to show special values (< or <=) right on the tick
        if (index === 0 && dataBin.start === undefined) {
            x = index;
        }
        // we want to show special values (> or >=) right on the tick (or next tick depending on the prev bin end)
        else if (
            index === numericalBins.length - 1 &&
            dataBin.end === undefined
        ) {
            x = index;

            // in case the previous data bin is a single value data bin (i.e start === end),
            // no need to add 1 (no interval needed for the previous value)
            if (
                index - 1 > -1 &&
                numericalBins[index - 1].start !== undefined &&
                numericalBins[index - 1].start !== numericalBins[index - 1].end
            ) {
                x++;
            }
        }
        // we want to show single values right on the tick
        else if (dataBin.start === dataBin.end) {
            x = index;
        }
        // we want to show range values in between 2 ticks
        else {
            x = index + 0.5;
        }

        // x is not the actual data value, it is the normalized data for representation
        // y is the actual count value
        return {
            x: x + xShift,
            y: dataBin.count,
            dataBin,
        };
    });
}

export function generateCategoricalData(
    categoryBins: DataBin[],
    startIndex: number
): BarDatum[] {
    // x is not the actual data value, it is the normalized data for representation
    // y is the actual count value
    return categoryBins.map((dataBin: DataBin, index: number) => ({
        x: startIndex + index + 1,
        y: dataBin.count,
        dataBin,
    }));
}

export function isLogScaleByValues(values: number[]) {
    return (
        // empty list is not considered log scale
        values.length > 0 &&
        values.find(
            value =>
                // any value between -1 and 1 (except 0) indicates that this is not a log scale
                (value !== 0 && -1 < value && value < 1) ||
                // any value not in the form of 10^0.5, 10^2, etc. also indicates that this is not a log scale
                (value !== 0 && getExponent(value) % 0.5 !== 0)
        ) === undefined
    );
}

export function shouldShowChart(
    filter: Partial<StudyViewFilterWithSampleIdentifierFilters>,
    uniqueDataSize: number,
    sizeOfAllSamples: number
) {
    return isFiltered(filter) || uniqueDataSize >= 2 || sizeOfAllSamples === 1;
}

export function isEveryBinDistinct(data?: DataBin[]) {
    return (
        data &&
        data.length > 0 &&
        data.find(dataBin => dataBin.start !== dataBin.end) === undefined
    );
}

function createRangeForDataBinOrFilter(
    start?: number,
    end?: number,
    specialValue?: string
): NumberRange {
    if (start !== undefined && end !== undefined) {
        if (start === end) {
            return NumberRange.closed(start, end); // [start, end]
        } else {
            return NumberRange.openClosed(start, end); // (start, end]
        }
    } else if (start !== undefined && end === undefined) {
        if (specialValue === '>=') {
            return NumberRange.downTo(start, BoundType.CLOSED); // [start, Infinity)
        } else {
            return NumberRange.downTo(start, BoundType.OPEN); // (start, Infinity)
        }
    } else if (start === undefined && end !== undefined) {
        if (specialValue === '<') {
            return NumberRange.upTo(end, BoundType.OPEN); // (-Infinity, end)
        } else {
            return NumberRange.upTo(end, BoundType.CLOSED); // (-Infinity, end]
        }
    } else {
        return NumberRange.all();
    }
}

export function isDataBinSelected(
    dataBin: DataBin,
    filters: DataFilterValue[]
): boolean {
    let isSelected: boolean;

    // numerical bin:
    // the entire bin range (from bin.start to bin.end) should be enclosed by at least one of the filters
    if (dataBin.start !== undefined || dataBin.end !== undefined) {
        const numericalFilters = filters.filter(
            filter => filter.start !== undefined || filter.end !== undefined
        );
        isSelected = _.some(numericalFilters, filter => {
            const filterRange = createRangeForDataBinOrFilter(
                filter.start,
                filter.end,
                filter.value
            );
            const binRange = createRangeForDataBinOrFilter(
                dataBin.start,
                dataBin.end,
                dataBin.specialValue
            );
            return filterRange.encloses(binRange);
        });
    }
    // categorical bin:
    // there should be at least one filter with the same filter value
    else {
        const categoricalFilters = filters.filter(
            filter => filter.start === undefined && filter.end === undefined
        );
        isSelected = _.compact(
            categoricalFilters.map(filter => filter.value)
        ).includes(dataBin.specialValue);
    }

    return isSelected;
}

export function isLogScaleByDataBins(data?: DataBin[]) {
    if (!data) {
        return false;
    }

    const numericalBins = filterNumericalBins(data);
    const intervalBins = filterIntervalBins(numericalBins);
    const values = calcIntervalBinValues(intervalBins);

    // use only interval bin values when determining logScale
    return !isEveryBinDistinct(intervalBins) && isLogScaleByValues(values);
}

export function isScientificSmallValue(value: number) {
    // value should be between -0.001 and 0.001 (except 0) to be considered as scientific small number
    return value !== 0 && -0.001 <= value && value <= 0.001;
}

export function formatNumericalTickValues(numericalBins: DataBin[]) {
    if (numericalBins.length === 0) {
        return [];
    }

    const firstBin = numericalBins[0];
    const lastBin = numericalBins[numericalBins.length - 1];
    const intervalBins = filterIntervalBins(numericalBins);
    let values = calcIntervalBinValues(intervalBins);

    // use only interval bin values when determining logScale
    const isLogScale =
        !isEveryBinDistinct(intervalBins) && isLogScaleByValues(values);

    if (firstBin.start === undefined) {
        values = [firstBin.end, ...values];
    } else if (isLogScale && firstBin.start !== 0) {
        // we don't want to start with a value like 10^0.5, -10^3.5, etc. we prefer integer powers of 10
        if (!isIntegerPowerOfTen(firstBin.start)) {
            values = [
                closestIntegerPowerOfTen(
                    firstBin.start,
                    DataBinPosition.LEADING
                ),
                ...values,
            ];
        }
    }

    if (lastBin.end === undefined) {
        values.push(lastBin.start);
    } else if (isLogScale && lastBin.end !== 0) {
        // we don't want to end with a value like 10^3.5, -10^0.5, etc. we prefer integer powers of 10
        if (!isIntegerPowerOfTen(lastBin.end)) {
            values.push(
                closestIntegerPowerOfTen(lastBin.end, DataBinPosition.TRAILING)
            );
        }
    }

    let formatted: string[];

    if (isLogScale) {
        formatted = formatLogScaleValues(values);
    } else if (
        intervalBins.length > 0 &&
        isScientificSmallValue(
            intervalBins[Math.floor(intervalBins.length / 2)].end
        )
    ) {
        // scientific notation
        formatted = values.map(value => value.toExponential(0));
    } else {
        formatted = formatLinearScaleValues(values);
    }

    if (firstBin.start === undefined) {
        formatted[0] = `${OPERATOR_MAP[firstBin.specialValue] ||
            firstBin.specialValue}${formatted[0]}`;
    }

    if (lastBin.end === undefined) {
        formatted[formatted.length - 1] = `${OPERATOR_MAP[
            lastBin.specialValue
        ] || lastBin.specialValue}${formatted[formatted.length - 1]}`;
    }

    return formatted;
}

export function formatLinearScaleValues(values: number[]) {
    return values.map(value =>
        isScientificSmallValue(value)
            ? value.toExponential(0)
            : toFixedDigit(value)
    );
}

export function formatLogScaleValues(values: number[]) {
    return values.map(value => {
        let displayValue;

        if (
            value === -10 ||
            value === -1 ||
            value === 0 ||
            value === 1 ||
            value === 10
        ) {
            displayValue = `${value}`;
        } else {
            const exponent = getExponent(value);

            if (Number.isInteger(exponent)) {
                displayValue = `10^${exponent.toFixed(0)}`;
            } else if (exponent % 0.5 === 0) {
                // hide non integer powers of 10 (but we still show the tick itself)
                displayValue = '';
            } else {
                // show special outliers (if any) as is
                displayValue = `${value}`;
            }

            if (displayValue && value < 0) {
                displayValue = `-${displayValue}`;
            }
        }

        return displayValue;
    });
}

export function isIntegerPowerOfTen(value: number) {
    let result = false;

    if (value) {
        const absLogValue = Math.log10(Math.abs(value));

        if (Number.isInteger(absLogValue)) {
            result = true;
        }
    }

    return result;
}

export enum DataBinPosition {
    LEADING = 1,
    TRAILING = -1,
}

export function closestIntegerPowerOfTen(
    value: number,
    dataBinPosition: DataBinPosition
) {
    if (value) {
        const absLogValue = Math.log10(Math.abs(value));
        const power =
            value * dataBinPosition > 0
                ? Math.floor(absLogValue)
                : Math.ceil(absLogValue);
        const integerPower = Math.pow(10, power);

        return Math.sign(value) * integerPower;
    } else {
        return 1;
    }
}

export function intervalFiltersDisplayValue(
    values: DataFilterValue[],
    onUpdate: (newRange: { start?: number; end?: number }) => void,
    stringOutput?: false
): JSX.Element;
export function intervalFiltersDisplayValue(
    values: DataFilterValue[],
    onUpdate: (newRange: { start?: number; end?: number }) => void,
    stringOutput: true
): string;
export function intervalFiltersDisplayValue(
    values: DataFilterValue[],
    onUpdate: (newRange: { start?: number; end?: number }) => void,
    stringOutput?: boolean
) {
    const categories = values
        .filter(value => value.start === undefined && value.end === undefined)
        .map(value => value.value);

    const numericals = values.filter(
        value => value.start !== undefined || value.end !== undefined
    );

    // merge numericals into one interval
    const start = numericals.length > 0 ? numericals[0].start : undefined;
    const end =
        numericals.length > 0
            ? numericals[numericals.length - 1].end
            : undefined;

    let displayValues: any[] = [];

    if (numericals.length > 0) {
        const startValue = formatValue(start!);
        const endValue = formatValue(end!);
        const startText = stringOutput ? (
            startValue
        ) : (
            <EditableSpan
                value={startValue}
                className={styles.editableSpanStyles}
                setValue={val => {
                    if (!val) {
                        // empty start
                        onUpdate({ end });
                    } else {
                        const valNum = parseFloat(val);
                        if (valNum === end!) {
                            // invalid value
                            return false;
                        }
                        if (valNum > end!) {
                            // invert range
                            onUpdate({ start: end, end: valNum });
                        } else {
                            onUpdate({ start: valNum, end });
                        }
                        return true;
                    }
                }}
                numericOnly={true}
                allowEmptyValue={false}
                textFieldAppearance={true}
            />
        );
        const endText = stringOutput ? (
            endValue
        ) : (
            <EditableSpan
                value={endValue}
                className={styles.editableSpanStyles}
                setValue={val => {
                    if (!val) {
                        // empty end
                        onUpdate({ start });
                    } else {
                        const valNum = parseFloat(val);
                        if (valNum === start!) {
                            // invalid value
                            return false;
                        }
                        if (valNum < start!) {
                            // invert range
                            onUpdate({ start: valNum, end: start });
                        } else {
                            onUpdate({ start, end: valNum });
                        }
                    }
                    return true;
                }}
                numericOnly={true}
                allowEmptyValue={false}
                textFieldAppearance={true}
            />
        );
        const startEqualsEndText = stringOutput ? (
            startValue
        ) : (
            <EditableSpan
                value={startValue}
                className={styles.editableSpanStyles}
                setValue={val => {
                    if (!val) {
                        // empty
                        onUpdate({ start: undefined, end: undefined });
                    } else {
                        onUpdate({
                            start: parseFloat(val),
                            end: parseFloat(val),
                        });
                    }
                }}
                numericOnly={true}
                allowEmptyValue={false}
                textFieldAppearance={true}
            />
        );

        const intervalDisplayValues = [];
        // both ends open
        if (start === undefined && end === undefined) {
            intervalDisplayValues.push('All Numbers');
        } else if (start === undefined) {
            intervalDisplayValues.push(`≤ `);
            intervalDisplayValues.push(endText);
        } else if (end === undefined) {
            if (numericals[0].start === numericals[0].end) {
                intervalDisplayValues.push(`≥ `);
            } else {
                intervalDisplayValues.push(`> `);
            }
            intervalDisplayValues.push(startText);
        } else if (start === end) {
            intervalDisplayValues.push(startEqualsEndText);
        } else if (numericals[0].start === numericals[0].end) {
            intervalDisplayValues.push(startText);
            intervalDisplayValues.push(` ≤ x ≤ `);
            intervalDisplayValues.push(endText);
        } else {
            intervalDisplayValues.push(startText);
            intervalDisplayValues.push(` < x ≤ `);
            intervalDisplayValues.push(endText);
        }

        displayValues.push(
            stringOutput
                ? intervalDisplayValues.join('')
                : intervalDisplayValues
        );
    }

    // copy categories as is
    if (categories.length > 0) {
        displayValues = displayValues.concat(categories);
    }

    if (stringOutput) {
        return displayValues.length > 0 ? displayValues.join(', ') : '';
    } else {
        return displayValues.length > 0 ? (
            joinJsx(displayValues, <span>{`, `}</span>)
        ) : (
            <>''</>
        );
    }
}

export function formatValue(value: number): string;
export function formatValue(value: undefined): undefined;
export function formatValue(value: number | undefined) {
    let formatted;

    if (value !== undefined) {
        if (isScientificSmallValue(value)) {
            formatted = value.toExponential(0);
        } else {
            formatted = toFixedDigit(value);
        }
    }

    return formatted;
}

export function toFixedDigit(value: number, fractionDigits: number = 2) {
    if (!value) {
        return `${value}`;
    }

    const absValue = Math.abs(value);

    // no need to format integers
    if (Number.isInteger(absValue)) {
        return `${value}`;
    }

    let digits = fractionDigits;

    // for small numbers we need to know the exact number of leading decimal zeroes
    if (value < 1 && value > -1) {
        const absLogValue = Math.abs(Math.log10(absValue % 1));
        const numberOfLeadingDecimalZeroes = Number.isInteger(absLogValue)
            ? Math.floor(absLogValue) - 1
            : Math.floor(absLogValue);

        digits += numberOfLeadingDecimalZeroes;
    }

    return `${Number(value.toFixed(digits))}`;
}

export function getChartMetaDataType(uniqueKey: string): ChartMetaDataTypeEnum {
    const GENOMIC_DATA_TYPES = [
        SpecialChartsUniqueKeyEnum.MUTATION_COUNT,
        SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED,
        SpecialChartsUniqueKeyEnum.GENOMIC_PROFILES_SAMPLE_COUNT,
    ];
    return _.includes(GENOMIC_DATA_TYPES, uniqueKey)
        ? ChartMetaDataTypeEnum.GENOMIC
        : ChartMetaDataTypeEnum.CLINICAL;
}

// 10px is reserved by ReactVisualized library as margin right
export function getFixedHeaderNumberCellMargin(
    columnWidth: number,
    theLongestString: string
) {
    return Math.floor(
        (columnWidth -
            10 -
            getFixedHeaderTableMaxLengthStringPixel(theLongestString)) /
            2
    );
}

export function getFixedHeaderTableMaxLengthStringPixel(text: string) {
    // This is a very specified function to calculate the text length
    // For fixed header table used in study view only
    const FRONT_SIZE = '13px';
    const FRONT_FAMILY = 'Helvetica Neue';
    return Math.floor(getTextWidth(text, FRONT_FAMILY, FRONT_SIZE));
}

export function correctMargin(margin: number) {
    return margin > 0 ? margin : 0;
}

export function correctColumnWidth(columnWidth: number) {
    return Math.ceil(columnWidth);
}

export function getFrequencyStr(value: number) {
    let str = '';

    if (value < 0 || _.isNaN(value)) {
        return Datalabel.NA;
    } else if (value === 0) {
        str = '0';
    } else if (value < 100 && value >= 99.9) {
        str = `99.9`;
    } else if (value >= 0.1) {
        str = value.toFixed(1).toString();
    } else {
        str = '<0.1';
    }
    return `${str}%`;
}

export function formatFrequency(value: number) {
    if (value < 0) {
        return -1;
    } else if (value === 0) {
        return 0;
    } else if (value < 100 && value >= 99.9) {
        return 99.9;
    } else if (value >= 0.1) {
        value = Math.round(value * 10) / 10;
    } else {
        // This is a default value for anything that lower than 0.1 since we only keep one digit.
        // This equals to <0.1 ain the getFrequencyStr function
        value = 0.05;
    }
    return value;
}

export function getExponent(value: number): number {
    // less precision for values like 3 and 31
    const fractionDigits = Math.abs(value) < 50 ? 1 : 2;

    return Number(Math.log10(Math.abs(value)).toFixed(fractionDigits));
}

export function getCNAByAlteration(alteration: string | number) {
    // "NA" here actually means "Not Profiled"
    // See details in https://github.com/cBioPortal/cbioportal/issues/10809
    if (alteration === 'NA') {
        return 'Not Profiled';
    }
    const numberValue = Number(alteration);
    return !isNaN(numberValue) ? CNA_TO_ALTERATION[numberValue] || '' : 'NA';
}

export function getCNAColorByAlteration(alteration: string): string {
    switch (alteration) {
        case 'HOMDEL':
            return CNA_COLOR_HOMDEL;
        case 'HETLOSS':
            return CNA_COLOR_HETLOSS;
        case 'DIPLOID':
            return CNA_COLOR_DIPLOID;
        case 'GAIN':
            return CNA_COLOR_GAIN;
        case 'AMP':
            return CNA_COLOR_AMP;
        default:
            return CNA_COLOR_DEFAULT;
    }
}

export function transformMutatedType(type: string): string {
    if (type === undefined || type === 'NA') return type;

    // Split the input string by underscores
    var words = type.split('_');

    // Capitalize the first letter of each word
    var capitalizedWords = words.map(_.capitalize);

    // Join the words back together with a space between them
    return capitalizedWords.join(' ');
}

export function getMutationColorByCategorization(type: string): string {
    switch (type) {
        case 'Mutated':
            return CLI_YES_COLOR;
        case 'Not Mutated':
            return CLI_NO_COLOR;
        case 'Not Profiled':
            return DEFAULT_NA_COLOR;
        default:
            return DEFAULT_UNKNOWN_COLOR;
    }
}

export function getDefaultChartTypeByClinicalAttribute(
    clinicalAttribute: ClinicalAttribute
): ChartType | undefined {
    if (
        STUDY_VIEW_CONFIG.tableAttrs.includes(getUniqueKey(clinicalAttribute))
    ) {
        return ChartTypeEnum.TABLE;
    }

    // TODO: update logic when number of categories above PIE_TO_TABLE_LIMIT
    if (clinicalAttribute.datatype === DataType.STRING) {
        return ChartTypeEnum.PIE_CHART;
    }

    if (clinicalAttribute.datatype === DataType.NUMBER) {
        return ChartTypeEnum.BAR_CHART;
    }

    return undefined;
}

/**
 * Calculate the layout used by react-grid-layout
 *
 * @param {ChartMeta[]} visibleAttributes
 * @param {number} cols number of grids per row, 6 cols will be the stander when using 13 inch laptop
 * @param {[id: string]: ChartDimension} chartsDimension
 * @returns {ReactGridLayout.Layout[]}
 */

export function findSpot(
    matrix: string[][],
    chartDimension: ChartDimension
): Position {
    if (matrix.length === 0) {
        return {
            x: 0,
            y: 0,
        };
    }
    let found: Position | undefined = undefined;
    _.each(matrix, (row: string[], rowIndex: number) => {
        _.each(row, (item: string, columnIndex: number) => {
            if (
                !item &&
                !isOccupied(
                    matrix,
                    { x: columnIndex, y: rowIndex },
                    chartDimension
                )
            ) {
                found = { x: columnIndex, y: rowIndex };
                return false;
            }
        });
        if (found) {
            return false;
        }
    });

    if (!found) {
        return {
            x: 0,
            y: matrix.length,
        };
    } else {
        return found;
    }
}

export function isOccupied(
    matrix: string[][],
    position: Position,
    chartDimension: ChartDimension
) {
    let occupied = false;
    if (matrix.length === 0) {
        return false;
    }

    // For chart higher than 1 grid, or wider than 1 grid, we only plot them on the odd index
    if (chartDimension.w > 1 && position.x % 2 !== 0) {
        occupied = true;
    }
    if (chartDimension.h > 1 && position.y % 2 !== 0) {
        occupied = true;
    }
    if (!occupied) {
        const xMax = position.x + chartDimension.w;
        const yMax = position.y + chartDimension.h;
        for (let i = position.y; i < yMax; i++) {
            if (i >= matrix.length) {
                break;
            }
            for (let j = position.x; j < xMax; j++) {
                if (j >= matrix[0].length || matrix[i][j]) {
                    occupied = true;
                    break;
                }
            }
            if (occupied) {
                break;
            }
        }
    }
    return occupied;
}

export function getDefaultChartDimension(): ChartDimension {
    return { w: 1, h: 1 };
}

export function calculateLayout(
    visibleAttributes: ChartMeta[],
    cols: number,
    chartsDimension: { [uniqueId: string]: ChartDimension },
    currentGridLayout: Layout[],
    currentFocusedChartByUser?: ChartMeta,
    currentFocusedChartByUserDimension?: ChartDimension
): Layout[] {
    let layout: Layout[] = [];
    let availableChartLayoutsMap: { [chartId: string]: boolean } = {};
    let matrix = [new Array(cols).fill('')] as string[][];

    // look if we need to put the chart to a fixed position and add the position to the matrix
    if (currentGridLayout.length > 0) {
        if (currentFocusedChartByUser && currentFocusedChartByUserDimension) {
            var currentFocusedChartIndex = currentGridLayout.findIndex(
                layout => layout.i === currentFocusedChartByUser.uniqueKey
            )!;

            if (currentFocusedChartIndex !== -1) {
                const currentChartLayout =
                    currentGridLayout[currentFocusedChartIndex];
                const newChartLayout = calculateNewLayoutForFocusedChart(
                    currentChartLayout,
                    currentFocusedChartByUser,
                    cols,
                    currentFocusedChartByUserDimension
                );
                layout.push(newChartLayout);
                availableChartLayoutsMap[
                    currentFocusedChartByUser.uniqueKey
                ] = true;
                matrix = generateMatrixByLayout(newChartLayout, cols);

                currentGridLayout[currentFocusedChartIndex] = newChartLayout;
            } else {
                throw new Error(
                    'cannot find matching unique key in the grid layout'
                );
            }
        }

        const chartOrderMap = _.keyBy(
            currentGridLayout,
            chartLayout => chartLayout.i
        );
        // order charts based on x and y (first order by y, if y is same for both then order by x)
        // push all undefined charts to last
        visibleAttributes.sort((a, b) => {
            const chart1 = chartOrderMap[a.uniqueKey];
            const chart2 = chartOrderMap[b.uniqueKey];
            if (chart1 || chart2) {
                if (!chart2) {
                    return -1;
                }
                if (!chart1) {
                    return 1;
                }
                return chart1.y === chart2.y
                    ? chart1.x - chart2.x
                    : chart1.y - chart2.y;
            }
            return 0;
        });
    } else {
        // sort the visibleAttributes by priority
        visibleAttributes.sort(chartMetaComparator);
    }

    // filter out the fixed position chart then calculate layout
    _.forEach(
        _.filter(
            visibleAttributes,
            (chart: ChartMeta) => !availableChartLayoutsMap[chart.uniqueKey]
        ),
        (chart: ChartMeta) => {
            const dimension =
                chartsDimension[chart.uniqueKey] || getDefaultChartDimension();
            const position = findSpot(matrix, dimension);
            while (position.y + dimension.h >= matrix.length) {
                matrix.push(new Array(cols).fill(''));
            }
            layout.push({
                i: chart.uniqueKey,
                x: position.x,
                y: position.y,
                w: dimension.w,
                h: dimension.h,
                minH: dimension.minH,
                minW: dimension.minW,
                isResizable: true,
            });
            const xMax = position.x + dimension.w;
            const yMax = position.y + dimension.h;
            for (let i = position.y; i < yMax; i++) {
                for (let j = position.x; j < xMax; j++) {
                    matrix[i][j] = chart.uniqueKey;
                }
            }
        }
    );
    return layout;
}

export function calculateNewLayoutForFocusedChart(
    previousLayout: Layout,
    currentFocusedChartByUser: ChartMeta,
    cols: number,
    currentFocusedChartByUserDimension: ChartDimension
): Layout {
    const initialX = previousLayout.x;
    const initialY = previousLayout.y;
    const dimensionWidth = currentFocusedChartByUserDimension.w;
    let x = initialX;
    let y = initialY;

    if (
        isFocusedChartShrunk(
            { w: previousLayout.w, h: previousLayout.h },
            currentFocusedChartByUserDimension
        )
    ) {
        x = initialX + previousLayout.w - dimensionWidth;
    } else if (
        initialX + dimensionWidth >= cols &&
        initialX - dimensionWidth >= 0
    ) {
        x = cols - dimensionWidth;
    }

    return {
        i: currentFocusedChartByUser.uniqueKey,
        x,
        y,
        w: currentFocusedChartByUserDimension.w,
        h: currentFocusedChartByUserDimension.h,
        isResizable: true,
    };
}

export function generateMatrixByLayout(
    layout: Layout,
    cols: number
): string[][] {
    let matrix = [new Array(cols).fill('')] as string[][];
    const xMax = layout.x + layout.w;
    const yMax = layout.y + layout.h;
    while (yMax >= matrix.length) {
        matrix.push(new Array(cols).fill(''));
    }
    for (let i = layout.y; i < yMax; i++) {
        for (let j = layout.x; j < xMax; j++) {
            matrix[i][j] = layout.i!;
        }
    }
    return matrix;
}

export function isFocusedChartShrunk(
    oldDimension: ChartDimension,
    newDimension: ChartDimension
): boolean {
    return oldDimension.w + oldDimension.h > newDimension.w + newDimension.h;
}

export function getPositionXByUniqueKey(
    layouts: Layout[],
    uniqueKey: string
): number | undefined {
    const findLayoutResult = _.find(layouts, layout => {
        if (layout.i === uniqueKey) {
            return layout;
        }
    });
    return findLayoutResult ? findLayoutResult.x : undefined;
}

export function getPositionYByUniqueKey(
    layouts: Layout[],
    uniqueKey: string
): number | undefined {
    const findLayoutResult = _.find(layouts, layout => {
        if (layout.i === uniqueKey) {
            return layout;
        }
    });
    return findLayoutResult ? findLayoutResult.y : undefined;
}

export function getDefaultPriorityByUniqueKey(uniqueKey: string): number {
    return STUDY_VIEW_CONFIG.priority[uniqueKey] === undefined
        ? 1
        : STUDY_VIEW_CONFIG.priority[uniqueKey];
}

export function getPriorityByClinicalAttribute(
    clinicalAttribute: ClinicalAttribute
): number {
    // If the priority is the default which means the priority has not been manually modified, then we should check
    // the whether there are priorities predefined
    const priorityFromDB = Number(clinicalAttribute.priority);
    if (priorityFromDB === STUDY_VIEW_CONFIG.defaultPriority) {
        const uniqueKey = getUniqueKey(clinicalAttribute);
        return STUDY_VIEW_CONFIG.priority[uniqueKey] === undefined
            ? STUDY_VIEW_CONFIG.defaultPriority
            : STUDY_VIEW_CONFIG.priority[uniqueKey];
    } else {
        return priorityFromDB;
    }
}

// Grid includes 10px margin
export function getWidthByDimension(
    chartDimension: ChartDimension,
    borderWidth: number
) {
    return (
        STUDY_VIEW_CONFIG.layout.grid.w * chartDimension.w +
        (chartDimension.w - 1) * STUDY_VIEW_CONFIG.layout.gridMargin.x -
        borderWidth * 2
    );
}

// Grid includes 15px header and 35px tool section
export function getHeightByDimension(
    chartDimension: ChartDimension,
    chartHeight: number
) {
    return (
        STUDY_VIEW_CONFIG.layout.grid.h * chartDimension.h +
        (chartDimension.h - 1) * STUDY_VIEW_CONFIG.layout.gridMargin.y -
        chartHeight
    );
}

// 30px tool section
export function getTableHeightByDimension(
    chartDimension: ChartDimension,
    chartHeight: number
) {
    return getHeightByDimension(chartDimension, chartHeight) - 30;
}

export function getQValue(qvalue: number): string {
    if (qvalue === 0) {
        return '0';
    } else {
        return qvalue.toExponential(EXPONENTIAL_FRACTION_DIGITS);
    }
}

export function pickClinicalAttrFixedColors(
    data: ClinicalDataCount[]
): { [attribute: string]: string } {
    return _.reduce(
        data,
        (acc: { [id: string]: string }, slice) => {
            // pick a fixed color if predefined
            const fixed = isNAClinicalValue(slice.value)
                ? DEFAULT_NA_COLOR
                : getClinicalValueColor(slice.value);

            if (fixed) {
                // update the map
                acc[slice.value] = fixed;
            }

            return acc;
        },
        {}
    );
}

export type ClinicalDataCountSummary = ClinicalDataCount & {
    color: string;
    percentage: number;
    freq: string;
    displayedValue?: string;
};

export function getClinicalDataCountWithColorByClinicalDataCount(
    counts: ClinicalDataCount[]
): ClinicalDataCountSummary[] {
    counts.sort(clinicalDataCountComparator);
    const colors = pickClinicalDataColors(counts);
    const sum = _.sumBy(counts, count => count.count);
    return counts.map(slice => {
        const percentage = slice.count / sum;
        return {
            ...slice,
            color: colors[slice.value],
            percentage: percentage,
            freq: getFrequencyStr(percentage * 100),
        };
    });
}

export function pickClinicalAttrColorsByIndex(
    data: ClinicalDataCount[],
    availableColors: string[]
): { [attribute: string]: string } {
    let colorIndex = 0;

    return _.reduce(
        data,
        (acc: { [id: string]: string }, slice) => {
            if (
                !isNAClinicalValue(slice.value) &&
                !getClinicalValueColor(slice.value)
            ) {
                acc[slice.value] =
                    availableColors[colorIndex % availableColors.length];
                colorIndex++;
            }
            return acc;
        },
        {}
    );
}

export function pickUnusedColor(
    data: ClinicalDataCount[],
    usedColors: Set<string>,
    availableColors: string[] = COLORS
): { [attribute: string]: string } {
    let colorIndex = 0;

    return _.reduce(
        data,
        (acc: { [id: string]: string }, slice) => {
            if (
                !isNAClinicalValue(slice.value) &&
                !getClinicalValueColor(slice.value)
            ) {
                if (usedColors.size < availableColors.length) {
                    while (
                        usedColors.has(
                            availableColors[colorIndex % availableColors.length]
                        )
                    ) {
                        colorIndex++;
                    }
                }
                acc[slice.value] =
                    availableColors[colorIndex % availableColors.length];
                colorIndex++;
            }
            return acc;
        },
        {}
    );
}

export function calculateClinicalDataCountFrequency(
    data: ChartDataCountSet,
    numOfSelectedSamples: number
): ChartDataCountSet {
    return _.reduce(
        data,
        (acc, next, key) => {
            acc[key] = (next * 100) / numOfSelectedSamples;
            return acc;
        },
        {} as { [attrId: string]: number }
    );
}

export function getOptionsByChartMetaDataType(
    chartsMeta: ChartMeta[],
    selectedAttrs: string[],
    allChartTypes: { [id: string]: ChartType },
    isSharedCustomData?: (chartId: string) => boolean,
    chartMetaSetForCurrentTab?: { [id: string]: ChartMeta }
): ChartOption[] {
    return _.map(chartsMeta, chartMeta => {
        const chartOption: ChartOption = {
            label: chartMeta.displayName,
            key: chartMeta.uniqueKey,
            chartType: allChartTypes[chartMeta.uniqueKey],
            disabled: chartMetaSetForCurrentTab
                ? !chartMetaSetForCurrentTab[chartMeta.uniqueKey] // if not chartMeta for current tab, disable option
                : false,
            selected: selectedAttrs.includes(chartMeta.uniqueKey),
            freq: 100,
        };
        if (isSharedCustomData) {
            chartOption.isSharedChart = isSharedCustomData(chartMeta.uniqueKey);
        }

        return chartOption;
    });
}

export function pickClinicalDataColors(
    data: ClinicalDataCount[],
    colors: string[] = COLORS
): { [attribute: string]: string } {
    let availableColors = _.cloneDeep(colors);

    // pick colors for the fixed clinical attribute values first
    const fixedColors = pickClinicalAttrFixedColors(data);

    // remove the picked color from the available colors list,
    // so that we won't pick it again for the same chart
    availableColors = _.difference(availableColors, _.values(fixedColors));

    // then pick colors for the remaining attributes
    return {
        ...pickClinicalAttrColorsByIndex(data, availableColors),
        ...fixedColors,
    };
}

export function pickNewColorForClinicData(
    d: ClinicalDataCount,
    usedColors: Set<string>
) {
    let dList = [];
    dList.push(d);
    const fixedColors = pickClinicalAttrFixedColors(dList);
    if (_.values(fixedColors).length != 0) return _.values(fixedColors)[0];
    return _.values(pickUnusedColor(dList, usedColors))[0];
}

export function isNAClinicalValue(value: string) {
    return value.toLowerCase().trim() === 'na';
}

export function getFilteredSampleIdentifiers(
    samples: Sample[],
    isFiltered?: (sample: Sample) => boolean
) {
    return _.reduce(
        samples,
        (acc, sample) => {
            if (isFiltered === undefined || isFiltered(sample)) {
                acc.push({
                    sampleId: sample.sampleId,
                    studyId: sample.studyId,
                });
            }
            return acc;
        },
        [] as SampleIdentifier[]
    );
}

/**
 * Get filtered samples by excluding filters for the selected chart
 */
export function getSamplesByExcludingFiltersOnChart(
    chartKey: string,
    filter: StudyViewFilter,
    sampleIdentiferFilterSet: { [id: string]: SampleIdentifier[] },
    queriedSampleIdentifiers: SampleIdentifier[],
    queriedStudyIds: string[]
): Promise<Sample[]> {
    //create filter without study/sample identifiers
    let updatedFilter: StudyViewFilter = {
        clinicalDataFilters: filter.clinicalDataFilters,
        geneFilters: filter.geneFilters,
        structuralVariantFilters: filter.structuralVariantFilters,
    } as any;

    let _sampleIdentifiers = _.reduce(
        sampleIdentiferFilterSet,
        (acc, sampleIdentifiers, key) => {
            //exclude chart filters
            if (chartKey !== key) {
                if (acc.length === 0) {
                    acc = sampleIdentifiers;
                } else {
                    acc = _.intersectionWith(
                        acc,
                        sampleIdentifiers,
                        _.isEqual
                    ) as SampleIdentifier[];
                }
            }
            return acc;
        },
        [] as SampleIdentifier[]
    );

    if (_sampleIdentifiers && _sampleIdentifiers.length > 0) {
        updatedFilter.sampleIdentifiers = _sampleIdentifiers;
    } else {
        if (_.isEmpty(queriedSampleIdentifiers)) {
            updatedFilter.studyIds = queriedStudyIds;
        } else {
            updatedFilter.sampleIdentifiers = queriedSampleIdentifiers;
        }
    }
    return getInternalClient().fetchFilteredSamplesUsingPOST({
        studyViewFilter: updatedFilter,
    });
}

export function getRequestedAwaitPromisesForClinicalData(
    isDefaultVisibleAttribute: boolean,
    isInitialFilterState: boolean,
    chartsAreFiltered: boolean,
    chartIsFiltered: boolean,
    unfilteredPromise: MobxPromise<any>,
    newlyAddedUnfilteredPromise: MobxPromise<any>,
    initialVisibleAttributesPromise: MobxPromise<any>
): MobxPromise<any>[] {
    if (isInitialFilterState && isDefaultVisibleAttribute && !chartIsFiltered) {
        return [initialVisibleAttributesPromise];
    } else if (!isDefaultVisibleAttribute && !chartsAreFiltered) {
        return [newlyAddedUnfilteredPromise];
    } else if (chartIsFiltered) {
        // It will get a new Promise assigned in the invoke function
        return [];
    } else {
        return [unfilteredPromise];
    }
}

export function customBinsAreValid(newBins: string[]): boolean {
    if (newBins.length === 0) {
        return false;
    }
    return !_.some(newBins, bin => {
        return isNaN(Number(bin));
    });
}

export async function getHugoSymbolByEntrezGeneId(
    entrezGeneId: number
): Promise<string> {
    const gene: Gene = await defaultClient.getGeneUsingGET({
        geneId: entrezGeneId.toString(),
    });
    return gene.hugoGeneSymbol;
}

// returns true when there is only one virtual study and no physical studies
export function showOriginStudiesInSummaryDescription(
    physicalStudies: CancerStudy[],
    virtualStudies: VirtualStudy[]
) {
    return physicalStudies.length === 0 && virtualStudies.length === 1;
}

export function getFilteredStudiesWithSamples(
    samples: Sample[],
    physicalStudies: CancerStudy[],
    virtualStudies: VirtualStudy[]
) {
    let queriedStudiesWithSamples: StudyWithSamples[] = [];
    const selectedStudySampleSet = _.groupBy(samples, sample => sample.studyId);

    _.each(physicalStudies, study => {
        const samples = selectedStudySampleSet[study.studyId];
        if (samples && samples.length > 0) {
            queriedStudiesWithSamples.push({
                ...study,
                uniqueSampleKeys: _.map(
                    samples,
                    sample => sample.uniqueSampleKey
                ),
            });
        }
    });

    _.each(virtualStudies, virtualStudy => {
        let selectedSamples: Sample[] = [];
        virtualStudy.data.studies.forEach(study => {
            let samples = selectedStudySampleSet[study.id];
            if (samples && samples.length > 0) {
                selectedSamples = selectedSamples.concat(samples);
            }
        });

        if (selectedSamples.length > 0) {
            let study = {
                name: virtualStudy.data.name,
                description: virtualStudy.data.description,
                studyId: virtualStudy.id,
            } as CancerStudy;
            queriedStudiesWithSamples.push({
                ...study,
                uniqueSampleKeys: _.map(
                    selectedSamples,
                    sample => sample.uniqueSampleKey
                ),
            });
        }
    });
    return queriedStudiesWithSamples;
}

export function clinicalDataCountComparator(
    a: ClinicalDataCount,
    b: ClinicalDataCount
): number {
    if (isNAClinicalValue(a.value)) {
        return isNAClinicalValue(b.value) ? 0 : 1;
    } else if (isNAClinicalValue(b.value)) {
        return -1;
    } else {
        return b.count - a.count;
    }
}

type ClinicalAttributeSorting = {
    priority: number;
    displayName: string;
};

export function clinicalAttributeSortingComparator(
    a: ClinicalAttributeSorting,
    b: ClinicalAttributeSorting
): number {
    return (
        b.priority - a.priority || a.displayName.localeCompare(b.displayName)
    );
}

export function clinicalAttributeComparator(
    a: ClinicalAttribute,
    b: ClinicalAttribute
): number {
    return clinicalAttributeSortingComparator(
        {
            priority: Number(a.priority),
            displayName: a.displayName,
        },
        {
            priority: Number(b.priority),
            displayName: b.displayName,
        }
    );
}

// Descent sort priority then ascent sort by display name
export function chartMetaComparator(a: ChartMeta, b: ChartMeta): number {
    return clinicalAttributeSortingComparator(
        {
            priority: a.priority,
            displayName: a.displayName,
        },
        {
            priority: b.priority,
            displayName: b.displayName,
        }
    );
}

export function submitToPage(
    url: string,
    params: { [id: string]: string },
    target?: string
) {
    try {
        window.localStorage.setItem(
            'legacyStudySubmission',
            JSON.stringify(params)
        );
        window.open(buildCBioPortalPageUrl(url), target);
    } catch (e) {
        // try clearing localStorage
        window.localStorage.clear();
        try {
            window.localStorage.setItem(
                'legacyStudySubmission',
                JSON.stringify(params)
            );
            window.open(buildCBioPortalPageUrl(url), target);
        } catch (e) {
            // TODO - currenlty alerting user with message until we have a proper solution
            alert('Sorry, the query is too large to submit');
        }
    }
}

export function getClinicalEqualityFilterValuesByString(
    filterValues: string
): string[] {
    return filterValues
        .replace(/\\,/g, '$@$')
        .split(',')
        .map(val => val.trim().replace(/\$@\$/g, ','));
}

export function getClinicalDataCountWithColorByCategoryCounts(
    yesCount: number,
    noCount: number
): ClinicalDataCountSummary[] {
    let dataCountSet: { [id: string]: ClinicalDataCount } = {};
    if (yesCount > 0) {
        dataCountSet[Datalabel.YES] = {
            count: yesCount,
            value: Datalabel.YES,
        };
    }
    if (noCount > 0) {
        dataCountSet[Datalabel.NO] = {
            count: noCount,
            value: Datalabel.NO,
        };
    }
    return getClinicalDataCountWithColorByClinicalDataCount(
        _.values(dataCountSet)
    );
}

export function getStudyViewTabId(pathname: string) {
    const match = pathname.match(/study\/([^\/]+)/);
    if (match) {
        return match[1] as StudyViewPageTabKeyEnum;
    } else {
        return undefined;
    }
}

export function getSelectedGroupNames(
    groups: Pick<StudyViewComparisonGroup, 'name'>[]
) {
    if (groups.length <= 2) {
        return groups.map(group => group.name).join(' and ');
    } else {
        return `${groups[0].name} and ${groups.length - 1} other groups`;
    }
}

/**
 * Gets all unique patient identifiers from the groups
 * provided. A unique key can be generated for a patient
 * by appending the patient's study id to the patient's patient id, separated
 * by a character not allowed in either id- in this case a newline symbol.
 */
export function getPatientIdentifiers(
    groups: Pick<StudyViewComparisonGroup, 'studies'>[]
) {
    const patientIdentifiers: { [key: string]: PatientIdentifier } = {};

    groups.forEach(group => {
        group.studies.forEach(study => {
            study.patients.forEach(patientId => {
                patientIdentifiers[study.id + '\n' + patientId] = {
                    studyId: study.id,
                    patientId: patientId,
                };
            });
        });
    });

    return Object.values(patientIdentifiers);
}

export function isSpecialChart(chartMeta: ChartMeta) {
    return (
        SPECIAL_CHARTS.findIndex(cm => cm.uniqueKey === chartMeta.uniqueKey) >
        -1
    );
}

export function getChartSettingsMap(
    visibleAttributes: ChartMeta[],
    visibleAttributesForSummary: ChartMeta[],
    columns: number,
    chartDimensionSet: { [uniqueId: string]: ChartDimension },
    chartTypeSet: { [uniqueId: string]: ChartType },
    genomicChartSet: { [id: string]: GenomicChart },
    genericAssayChartSet: { [id: string]: GenericAssayChart },
    XvsYScatterChartSet: { [id: string]: XvsYScatterChart },
    XvsYViolinChartSet: { [id: string]: XvsYViolinChart },
    clinicalDataBinFilterSet: {
        [uniqueId: string]: ClinicalDataBinFilter & { showNA?: boolean };
    },
    filterMutatedGenesTableByCancerGenes: boolean = false,
    filterSVGenesTableByCancerGenes: boolean = false,
    filterCNAGenesTableByCancerGenes: boolean = false,
    gridLayout?: ReactGridLayout.Layout[]
) {
    if (!gridLayout) {
        gridLayout = calculateLayout(
            visibleAttributesForSummary,
            columns,
            chartDimensionSet,
            []
        );
    }

    let chartSettingsMap: { [chartId: string]: ChartUserSetting } = {};
    visibleAttributes.forEach(attribute => {
        const id = attribute.uniqueKey;
        const chartType = chartTypeSet[id] || 'NONE';
        let chartSetting: ChartUserSetting = {
            id: id,
            chartType,
            patientAttribute: attribute.patientAttribute, // add chart attribute type
        } as any;
        switch (chartType) {
            case ChartTypeEnum.MUTATED_GENES_TABLE:
                chartSetting.filterByCancerGenes = filterMutatedGenesTableByCancerGenes;
                break;
            case ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE:
                chartSetting.filterByCancerGenes = filterSVGenesTableByCancerGenes;
                break;
            case ChartTypeEnum.CNA_GENES_TABLE:
                chartSetting.filterByCancerGenes = filterCNAGenesTableByCancerGenes;
                break;
        }
        const genomicChart = genomicChartSet[id];
        if (genomicChart) {
            chartSetting.name = genomicChart.name;
            chartSetting.description = genomicChart.description;
            chartSetting.hugoGeneSymbol = genomicChart.hugoGeneSymbol;
            chartSetting.profileType = genomicChart.profileType;
        }
        const genericAssayChart = genericAssayChartSet[id];
        if (genericAssayChart) {
            chartSetting.name = genericAssayChart.name;
            chartSetting.description = genericAssayChart.description;
            chartSetting.genericAssayType = genericAssayChart.genericAssayType;
            chartSetting.genericAssayEntityId =
                genericAssayChart.genericAssayEntityId;
            chartSetting.profileType = genericAssayChart.profileType;
            chartSetting.dataType = genericAssayChart.dataType;
            chartSetting.patientLevelProfile = genericAssayChart.patientLevel;
        }
        const XvsYScatterChart = XvsYScatterChartSet[id];
        if (XvsYScatterChart) {
            chartSetting.xAttrId = XvsYScatterChart.xAttr.clinicalAttributeId;
            chartSetting.yAttrId = XvsYScatterChart.yAttr.clinicalAttributeId;
        }
        const XvsYViolinChart = XvsYViolinChartSet[id];
        if (XvsYViolinChart) {
            chartSetting.categoricalAttrId =
                XvsYViolinChart.categoricalAttr.clinicalAttributeId;
            chartSetting.numericalAttrId =
                XvsYViolinChart.numericalAttr.clinicalAttributeId;
        }
        if (clinicalDataBinFilterSet[id]) {
            if (clinicalDataBinFilterSet[id].disableLogScale) {
                chartSetting.disableLogScale = true;
            }
            if (clinicalDataBinFilterSet[id].showNA !== undefined) {
                chartSetting.showNA = clinicalDataBinFilterSet[id].showNA;
            }
            if (!_.isEmpty(clinicalDataBinFilterSet[id].customBins)) {
                chartSetting.customBins =
                    clinicalDataBinFilterSet[id].customBins;
            }
        }
        chartSettingsMap[id] = chartSetting;
    });
    // attributes disabled on the summary tab (used in Clinical Data tab but not Summary tab like most survival attributes)
    const disabledAttributes = _.differenceWith(
        visibleAttributes,
        visibleAttributesForSummary,
        _.isEqual
    );
    // add layout for each chart
    gridLayout.forEach(layout => {
        if (
            layout.i &&
            chartSettingsMap[layout.i] &&
            !disabledAttributes.find(a => a.uniqueKey === layout.i)
        ) {
            chartSettingsMap[layout.i].layout = {
                x: layout.x,
                y: layout.y,
                w: layout.w,
                h: layout.h,
            };
        }
    });
    return chartSettingsMap;
}

function formatNumber(d: number) {
    return Number.isInteger(d) ? d.toFixed(0) : d.toFixed(2);
}

export function getBinName(
    dataBin: Pick<DataBin, 'specialValue' | 'start' | 'end'>
) {
    // specialValue can be any non-numeric character. ex: "=<", ">", "NA"
    if (dataBin.specialValue !== undefined) {
        if (dataBin.start !== undefined) {
            return dataBin.specialValue + formatNumber(dataBin.start);
        }
        if (dataBin.end !== undefined) {
            return dataBin.specialValue + formatNumber(dataBin.end);
        }
        return dataBin.specialValue;
    }
    if (dataBin.start !== undefined && dataBin.end !== undefined) {
        return `${formatNumber(dataBin.start)}-${formatNumber(dataBin.end)}`;
    }
    return '';
}

export function getGroupedClinicalDataByBins(
    data: ClinicalData[],
    dataBins: DataBin[]
) {
    const numericDataBins = dataBins.filter(
        dataBin => dataBin.specialValue === undefined
    );
    const specialDataBins = dataBins.filter(
        dataBin => dataBin.specialValue !== undefined
    );
    return _.reduce(
        data,
        (acc, datum) => {
            let dataBin: DataBin | undefined;
            // Check if the ClinicalData value is number
            if (!isNaN(datum.value as any)) {
                //find if it belongs to any of numeric bins.
                dataBin = _.find(numericDataBins, dataBin => {
                    if (dataBin.start === dataBin.end) {
                        // this is a special case where the buckets are single integers, end
                        // is the same value as the start
                        // ideally this would never be the case--it should be handled in bin creation
                        // but this is simplest way to resolve problem
                        return (
                            parseFloat(datum.value) === dataBin.start ||
                            parseFloat(datum.value) === dataBin.end
                        );
                    } else {
                        return (
                            parseFloat(datum.value) > dataBin.start &&
                            parseFloat(datum.value) <= dataBin.end
                        );
                    }
                });
            }

            //If ClinicalData value is not a number of does not belong to any number bins
            if (dataBin === undefined) {
                //find if it belongs to any of sepcial bins.
                dataBin = _.find(specialDataBins, dataBin => {
                    if (!isNaN(datum.value as any)) {
                        if (dataBin.end !== undefined) {
                            return parseFloat(datum.value) <= dataBin.end;
                        } else if (dataBin.start !== undefined) {
                            return parseFloat(datum.value) > dataBin.start;
                        }
                    }
                    return dataBin.specialValue === datum.value;
                });
            }
            if (dataBin) {
                let name = getBinName(dataBin);
                if (acc[name] === undefined) {
                    acc[name] = [];
                }
                acc[name].push(datum);
            }
            return acc;
        },
        {} as {
            [id: string]: ClinicalData[];
        }
    );
}

export function getGroupsFromBins(
    samples: Sample[],
    patientAttribute: boolean,
    data: ClinicalData[],
    dataBins: DataBin[],
    origin: string[]
) {
    let patientToSamples: {
        [uniquePatientKey: string]: SampleIdentifier[];
    } = {};
    if (patientAttribute) {
        patientToSamples = _.groupBy(samples, s => s.uniquePatientKey);
    }

    const clinicalDataByBins = getGroupedClinicalDataByBins(data, dataBins);
    const binsOrder = dataBins.map(dataBin => getBinName(dataBin));
    const binsOrderSet = stringListToIndexSet(binsOrder);

    return _.reduce(
        clinicalDataByBins,
        (acc, clinicalData, name) => {
            if (clinicalData.length !== 0) {
                let sampleIdentifiers: SampleIdentifier[] = [];

                if (patientAttribute) {
                    sampleIdentifiers = _.flatMapDeep(
                        clinicalData,
                        (d: ClinicalData) => {
                            return patientToSamples[d.uniquePatientKey].map(
                                s => ({
                                    studyId: s.studyId,
                                    sampleId: s.sampleId,
                                })
                            );
                        }
                    );
                } else {
                    sampleIdentifiers = clinicalData.map(d => ({
                        studyId: d.studyId,
                        sampleId: d.sampleId,
                    }));
                }

                acc.push(getGroupParameters(name, sampleIdentifiers, origin));
            }
            return acc;
        },
        [] as SessionGroupData[]
    ).sort((a, b) => binsOrderSet[a.name] - binsOrderSet[b.name]);
}

export function getGroupsFromQuartiles(
    samples: Sample[],
    patientAttribute: boolean,
    quartiles: ClinicalData[][],
    origin: string[]
) {
    let patientToSamples: {
        [uniquePatientKey: string]: SampleIdentifier[];
    } = {};
    if (patientAttribute) {
        patientToSamples = _.groupBy(samples, s => s.uniquePatientKey);
    }
    // create groups using data
    return quartiles.map(quartile => {
        let sampleIdentifiers: SampleIdentifier[] = [];
        if (patientAttribute) {
            sampleIdentifiers = _.flatMapDeep(quartile, (d: ClinicalData) => {
                return patientToSamples[d.uniquePatientKey].map(s => ({
                    studyId: s.studyId,
                    sampleId: s.sampleId,
                }));
            });
        } else {
            sampleIdentifiers = quartile.map(d => ({
                studyId: d.studyId,
                sampleId: d.sampleId,
            }));
        }

        return getGroupParameters(
            `${formatNumber(parseFloat(quartile[0].value))}-${formatNumber(
                parseFloat(quartile[quartile.length - 1].value)
            )}`,
            sampleIdentifiers,
            origin
        );
    });
}

export function getButtonNameWithDownPointer(buttonName: string) {
    return (
        buttonName + ' ' + String.fromCharCode(9662)
    ); /*small solid down triangle*/
}

export function getFilteredAndCompressedDataIntervalFilters(
    values: DataFilterValue[]
): DataFilterValue {
    const numericals = values.filter(
        value => value.start !== undefined || value.end !== undefined
    );

    // merge numericals into one interval
    const start = numericals.length > 0 ? numericals[0].start : undefined;
    const end =
        numericals.length > 0
            ? numericals[numericals.length - 1].end
            : undefined;
    return { start, end } as any;
}

export function updateSavedUserPreferenceChartIds(
    chartSettings: ChartUserSetting[]
): ChartUserSetting[] {
    const customChartRegex = /^CUSTOM_FILTERS_\d+/i;
    const chartIdWithDataTypeRegex = /^(?:PATIENT_|SAMPLE_)([a-zA-Z0-9_]+)/i;
    let numberOfClinicalAttributeCharts = 0;
    let numberOfChartRequiringUpdates = 0;
    const specialChartKeySet = _.reduce(
        SpecialChartsUniqueKeyEnum,
        (acc, next) => {
            acc[next] = true;
            return acc;
        },
        {} as { [id: string]: boolean }
    );

    chartSettings.forEach(chartSetting => {
        let customChartmatch = chartSetting.id.match(customChartRegex);
        if (
            !customChartmatch &&
            specialChartKeySet[chartSetting.id] === undefined
        ) {
            numberOfClinicalAttributeCharts++;
            let match = chartSetting.id.match(chartIdWithDataTypeRegex);
            if (!!match) {
                numberOfChartRequiringUpdates++;
            }
        }
    });

    // Some of the clinical attributes id contains SAMPLE_ or PATIENT_ prefix. Updating them would not show those charts.
    // Only way is to check if the chart ids requires update is to see if the
    // number of clinical attribute charts shown is same as the number of chart ids requiring updates
    if (numberOfClinicalAttributeCharts === numberOfChartRequiringUpdates) {
        return chartSettings.map(chartSetting => {
            let match = chartSetting.id.match(chartIdWithDataTypeRegex);
            if (!!match) {
                return {
                    ...chartSetting,
                    id: match[1],
                };
            }
            return chartSetting;
        });
    }
    return chartSettings;
}

export async function getAllClinicalDataByStudyViewFilter(
    studyViewFilter: StudyViewFilter,
    searchTerm: string | undefined,
    sortAttributeId: any,
    sortDirection: any = 'asc',
    pageSize: number,
    pageNumber: number
): Promise<{
    totalItems: number;
    data: { [uniqueSampleKey: string]: ClinicalData[] };
}> {
    const [remoteClinicalDataCollection, totalItems]: [
        SampleClinicalDataCollection,
        number
    ] = await getInternalClient()
        .fetchClinicalDataClinicalTableUsingPOSTWithHttpInfo({
            studyViewFilter,
            pageSize: pageSize | 500,
            pageNumber: pageNumber || 0,
            searchTerm: searchTerm,
            sortBy: sortAttributeId,
            direction: sortDirection?.toUpperCase(),
        })
        .then(response => {
            return [
                response.body,
                parseInt(response.header['total-count'] || 0),
            ];
        });

    return {
        totalItems,
        data: remoteClinicalDataCollection.byUniqueSampleKey,
    };
}

export function convertClinicalDataBinsToDataBins(
    clinicalDataBins: ClinicalDataBin[]
): DataBin[] {
    return clinicalDataBins.map(clinicalDataBin => ({
        id: clinicalDataBin.attributeId,
        count: clinicalDataBin.count,
        end: clinicalDataBin.end,
        specialValue: clinicalDataBin.specialValue,
        start: clinicalDataBin.start,
    }));
}

export function convertGenomicDataBinsToDataBins(
    genomicDataBins: GenomicDataBin[]
): DataBin[] {
    return genomicDataBins.map(genomicDataBin => ({
        id: getGenomicChartUniqueKey(
            genomicDataBin.hugoGeneSymbol,
            genomicDataBin.profileType
        ),
        count: genomicDataBin.count,
        end: genomicDataBin.end,
        specialValue: genomicDataBin.specialValue,
        start: genomicDataBin.start,
    }));
}

export function convertGenericAssayDataBinsToDataBins(
    genericAssayDataBins: GenericAssayDataBin[]
): DataBin[] {
    return genericAssayDataBins.map(gaDataBin => ({
        id: getGenericAssayChartUniqueKey(
            gaDataBin.stableId,
            gaDataBin.profileType
        ),
        count: gaDataBin.count,
        end: gaDataBin.end,
        specialValue: gaDataBin.specialValue,
        start: gaDataBin.start,
    }));
}

export async function getMutationDataAsClinicalData(
    chartInfo: GenomicChart,
    molecularProfileMap: { [id: string]: MolecularProfile[] },
    samples: Sample[]
): Promise<ClinicalData[]> {
    const gene: Gene = await defaultClient.getGeneUsingGET({
        geneId: chartInfo.hugoGeneSymbol,
    });

    const molecularProfiles = molecularProfileMap[chartInfo.profileType];
    if (_.isEmpty(molecularProfiles)) {
        return [];
    }
    const molecularProfileMapByStudyId = _.keyBy(
        molecularProfiles,
        molecularProfile => molecularProfile.studyId
    );
    // samples are coming from all studies, need to be filtered before fetching
    const filteredSamples = samples.filter(
        sample => sample.studyId in molecularProfileMapByStudyId
    );
    const sampleMolecularIdentifiers = filteredSamples.map(sample => ({
        sampleId: sample.sampleId,
        molecularProfileId:
            molecularProfileMapByStudyId[sample.studyId].molecularProfileId,
    }));
    const mutationDataList = await defaultClient.fetchMutationsInMultipleMolecularProfilesUsingPOST(
        {
            projection: 'DETAILED',
            mutationMultipleStudyFilter: {
                entrezGeneIds: [gene.entrezGeneId],
                sampleMolecularIdentifiers: sampleMolecularIdentifiers,
            } as MutationMultipleStudyFilter,
        }
    );
    const mutationDataSet = new ComplexKeyMap<string>();
    mutationDataList.forEach(datum =>
        mutationDataSet.set(
            {
                sampleId: datum.sampleId,
                molecularProfileId: datum.molecularProfileId,
            },
            'Mutated'
        )
    );
    const genePanelData = await defaultClient.fetchGenePanelDataInMultipleMolecularProfilesUsingPOST(
        {
            genePanelDataMultipleStudyFilter: {
                sampleMolecularIdentifiers,
            } as GenePanelDataMultipleStudyFilter,
        }
    );
    genePanelData.forEach(datum => {
        if (
            !mutationDataSet.has({
                sampleId: datum.sampleId,
                molecularProfileId: datum.molecularProfileId,
            })
        ) {
            if (datum.profiled) {
                mutationDataSet.set(
                    {
                        sampleId: datum.sampleId,
                        molecularProfileId: datum.molecularProfileId,
                    },
                    'Not Mutated'
                );
            } else {
                mutationDataSet.set(
                    {
                        sampleId: datum.sampleId,
                        molecularProfileId: datum.molecularProfileId,
                    },
                    'Not Profiled'
                );
            }
        }
    });

    return filteredSamples.map(sample => {
        const molecularProfileId =
            molecularProfileMapByStudyId[sample.studyId].molecularProfileId;
        let datum = mutationDataSet.get({
            sampleId: sample.sampleId,
            molecularProfileId: molecularProfileId,
        });
        const clinicaData: ClinicalData = {
            clinicalAttributeId: gene.entrezGeneId + '-' + molecularProfileId,
            patientId: sample.patientId,
            sampleId: sample.sampleId,
            studyId: sample.studyId,
            uniquePatientKey: sample.uniquePatientKey,
            uniqueSampleKey: sample.uniqueSampleKey,
        } as any;

        clinicaData.value = datum ?? Datalabel.NA;
        return clinicaData;
    });
}

export async function getGenomicDataAsClinicalData(
    chartInfo: GenomicChart,
    molecularProfileMap: { [id: string]: MolecularProfile[] },
    samples: Sample[]
): Promise<ClinicalData[]> {
    const gene: Gene = await defaultClient.getGeneUsingGET({
        geneId: chartInfo.hugoGeneSymbol,
    });

    const molecularProfiles = molecularProfileMap[chartInfo.profileType];
    if (_.isEmpty(molecularProfiles)) {
        return [];
    }
    const molecularProfileMapByStudyId = _.keyBy(
        molecularProfiles,
        molecularProfile => molecularProfile.studyId
    );
    // samples are coming from all studies, need to be filtered before fetching
    const filteredSamples = samples.filter(
        sample => sample.studyId in molecularProfileMapByStudyId
    );
    const sampleMolecularIdentifiers = filteredSamples.map(sample => ({
        sampleId: sample.sampleId,
        molecularProfileId:
            molecularProfileMapByStudyId[sample.studyId].molecularProfileId,
    }));
    const genomicDataList = await defaultClient.fetchMolecularDataInMultipleMolecularProfilesUsingPOST(
        {
            projection: 'DETAILED',
            molecularDataMultipleStudyFilter: {
                entrezGeneIds: [gene.entrezGeneId],
                sampleMolecularIdentifiers: sampleMolecularIdentifiers,
            } as MolecularDataMultipleStudyFilter,
        }
    );

    const genomicDataSet = new ComplexKeyMap<NumericGeneMolecularData>();
    genomicDataList.forEach(datum =>
        genomicDataSet.set(
            {
                sampleId: datum.sampleId,
                molecularProfileId: datum.molecularProfileId,
            },
            datum
        )
    );

    return filteredSamples.map(sample => {
        const molecularProfileId =
            molecularProfileMapByStudyId[sample.studyId].molecularProfileId;
        let datum = genomicDataSet.get({
            sampleId: sample.sampleId,
            molecularProfileId: molecularProfileId,
        });
        const clinicaData: ClinicalData = {
            clinicalAttributeId: gene.entrezGeneId + '-' + molecularProfileId,
            patientId: sample.patientId,
            sampleId: sample.sampleId,
            studyId: sample.studyId,
            uniquePatientKey: sample.uniquePatientKey,
            uniqueSampleKey: sample.uniqueSampleKey,
        } as any;

        if (datum) {
            clinicaData.value = `${datum.value}`;
        } else {
            clinicaData.value = Datalabel.NA;
        }
        return clinicaData;
    });
}

export async function getGenericAssayDataAsClinicalData(
    chartInfo: GenericAssayChart,
    molecularProfileMap: { [id: string]: MolecularProfile[] },
    samples: Sample[]
): Promise<ClinicalData[]> {
    const molecularProfiles = molecularProfileMap[chartInfo.profileType];
    if (_.isEmpty(molecularProfiles)) {
        return [];
    }
    const molecularProfileMapByStudyId = _.keyBy(
        molecularProfiles,
        molecularProfile => molecularProfile.studyId
    );
    // samples are coming from all studies, need to be filtered before fetching
    const filteredSamples = samples.filter(
        sample => sample.studyId in molecularProfileMapByStudyId
    );
    const sampleMolecularIdentifiers = filteredSamples.map(sample => ({
        sampleId: sample.sampleId,
        molecularProfileId:
            molecularProfileMapByStudyId[sample.studyId].molecularProfileId,
    }));
    const gaDataList = await defaultClient.fetchGenericAssayDataInMultipleMolecularProfilesUsingPOST(
        {
            projection: 'DETAILED',
            genericAssayDataMultipleStudyFilter: {
                genericAssayStableIds: [chartInfo.genericAssayEntityId],
                sampleMolecularIdentifiers: sampleMolecularIdentifiers,
            } as GenericAssayDataMultipleStudyFilter,
        }
    );

    const gaDataSet = new ComplexKeyMap<GenericAssayData>();
    gaDataList.forEach(datum =>
        gaDataSet.set(
            {
                sampleId: datum.sampleId,
                molecularProfileId: datum.molecularProfileId,
            },
            datum
        )
    );

    return filteredSamples.map(sample => {
        const molecularProfileId =
            molecularProfileMapByStudyId[sample.studyId].molecularProfileId;
        let datum = gaDataSet.get({
            sampleId: sample.sampleId,
            molecularProfileId: molecularProfileId,
        });
        const clinicaData: ClinicalData = {
            clinicalAttributeId:
                chartInfo.genericAssayEntityId + '-' + molecularProfileId,
            patientId: sample.patientId,
            sampleId: sample.sampleId,
            studyId: sample.studyId,
            uniquePatientKey: sample.uniquePatientKey,
            uniqueSampleKey: sample.uniqueSampleKey,
        } as any;

        if (datum) {
            clinicaData.value = `${datum.value}`;
        } else {
            clinicaData.value = Datalabel.NA;
        }
        return clinicaData;
    });
}

export function getStructuralVariantSamplesCount(molecularProfileSampleCountSet: {
    [id: string]: number;
}) {
    return (
        molecularProfileSampleCountSet[StructuralVariantProfilesEnum.fusion] ||
        molecularProfileSampleCountSet[
            StructuralVariantProfilesEnum.structural_variants
        ] ||
        0
    );
}

export function getCNASamplesCount(molecularProfileSampleCountSet: {
    [id: string]: number;
}) {
    return (
        molecularProfileSampleCountSet[CNAProfilesEnum.cna] ||
        molecularProfileSampleCountSet[CNAProfilesEnum.gistic] ||
        molecularProfileSampleCountSet[CNAProfilesEnum.cna_rae] ||
        molecularProfileSampleCountSet[CNAProfilesEnum.cna_consensus] ||
        0
    );
}

export function getMolecularProfileSamplesSet(
    samples: Sample[],
    genePanelData: GenePanelData[]
) {
    const sampleKeySet = _.keyBy(samples, sample => sample.uniqueSampleKey);

    return _.reduce(
        genePanelData,
        (acc: { [id: string]: string[] }, next) => {
            if (sampleKeySet[next.uniqueSampleKey] !== undefined) {
                if (acc[next.molecularProfileId] === undefined) {
                    acc[next.molecularProfileId] = [];
                }
                acc[next.molecularProfileId].push(next.uniqueSampleKey);
            }
            return acc;
        },
        {}
    );
}

export function geneFilterQueryToOql(query: GeneFilterQuery): string {
    return query.alterations.length > 0
        ? `${query.hugoGeneSymbol}:${query.alterations.join(' ')}`
        : query.hugoGeneSymbol;
}

/**
 * Default values for all GeneFilterQuery parameters.
 * Used in both construction (geneFilterQueryFromOql) and parsing (ensureBackwardCompatibilityOfFilters).
 * Provides complete defaults for all fields to ensure type safety.
 */
export const GENE_FILTER_QUERY_DEFAULTS = {
    hugoGeneSymbol: '',
    entrezGeneId: 0,
    alterations: [] as ('HOMDEL' | 'AMP' | 'GAIN' | 'DIPLOID' | 'HETLOSS')[],
    includeDriver: true,
    includeVUS: true,
    includeUnknownOncogenicity: true,
    includeUnknownTier: true,
    includeGermline: true,
    includeSomatic: true,
    includeUnknownStatus: true,
    tiersBooleanMap: {},
};

/**
 * Default values for all StructuralVariantFilterQuery parameters.
 * Used in both construction (StructuralVariantFilterQueryFromOql) and parsing (ensureBackwardCompatibilityOfFilters).
 * Provides complete defaults for all fields to ensure type safety.
 */
export const STRUCTURAL_VARIANT_FILTER_QUERY_DEFAULTS = {
    gene1Query: {
        hugoSymbol: '',
        entrezId: 0,
        specialValue: 'NO_GENE' as 'ANY_GENE' | 'NO_GENE',
    },
    gene2Query: {
        hugoSymbol: '',
        entrezId: 0,
        specialValue: 'NO_GENE' as 'ANY_GENE' | 'NO_GENE',
    },
    includeDriver: true,
    includeVUS: true,
    includeUnknownOncogenicity: true,
    includeUnknownTier: true,
    includeGermline: true,
    includeSomatic: true,
    includeUnknownStatus: true,
    tiersBooleanMap: {},
};

/**
 * Default values for AlterationFilter.
 * Used in both construction and parsing (ensureBackwardCompatibilityOfFilters).
 * Provides complete defaults for all fields to ensure type safety.
 */
export const ALTERATION_FILTER_DEFAULTS: AlterationFilter = ({
    copyNumberAlterationEventTypes: {
        AMP: true,
        HOMDEL: true,
    },
    mutationEventTypes: {
        any: true,
    },
    structuralVariants: null,
    includeDriver: true,
    includeVUS: true,
    includeUnknownOncogenicity: true,
    includeUnknownTier: true,
    includeGermline: true,
    includeSomatic: true,
    includeUnknownStatus: true,
    tiersBooleanMap: {},
} as any) as AlterationFilter;

export function geneFilterQueryFromOql(
    oql: string,
    includeDriver?: boolean,
    includeVUS?: boolean,
    includeUnknownOncogenicity?: boolean,
    selectedDriverTiers?: { [tier: string]: boolean },
    includeUnknownDriverTier?: boolean,
    includeGermline?: boolean,
    includeSomatic?: boolean,
    includeUnknownStatus?: boolean
): GeneFilterQuery {
    const [part1, part2]: string[] = oql.split(':');

    return _.mergeWith(
        {},
        GENE_FILTER_QUERY_DEFAULTS,
        {
            hugoGeneSymbol: part1.trim(),
            alterations: (part2 ? part2.trim().split(' ') : []) as (
                | 'HOMDEL'
                | 'AMP'
                | 'GAIN'
                | 'DIPLOID'
                | 'HETLOSS'
            )[],
            includeDriver,
            includeVUS,
            includeUnknownOncogenicity,
            tiersBooleanMap: selectedDriverTiers,
            includeUnknownTier: includeUnknownDriverTier,
            includeGermline,
            includeSomatic,
            includeUnknownStatus,
        },
        (defaultValue, providedValue) =>
            providedValue !== undefined ? providedValue : defaultValue
    );
}

export function ensureBackwardCompatibilityOfFilters(
    filters: Partial<StudyViewFilter>
) {
    // Handle geneFilters
    if (filters.geneFilters && filters.geneFilters.length) {
        filters.geneFilters.forEach(f => {
            f.geneQueries = f.geneQueries.map(arr => {
                return arr.map(inner => {
                    if (typeof inner === 'string') {
                        // Backward compatibility: convert string to object
                        return geneFilterQueryFromOql(inner);
                    } else {
                        // Merge with defaults: defaults first, then overrides from parsed object
                        return _.mergeWith(
                            {},
                            GENE_FILTER_QUERY_DEFAULTS,
                            inner,
                            (defaultValue, providedValue) =>
                                providedValue !== undefined
                                    ? providedValue
                                    : defaultValue
                        );
                    }
                });
            });
        });
    }

    // Handle structuralVariantFilters
    if (
        filters.structuralVariantFilters &&
        filters.structuralVariantFilters.length
    ) {
        filters.structuralVariantFilters.forEach(f => {
            f.structVarQueries = f.structVarQueries.map(arr => {
                return arr.map(inner =>
                    // Merge with defaults: defaults first, then overrides from parsed object
                    _.mergeWith(
                        {},
                        STRUCTURAL_VARIANT_FILTER_QUERY_DEFAULTS,
                        inner,
                        (defaultValue, providedValue) =>
                            providedValue !== undefined
                                ? providedValue
                                : defaultValue
                    )
                );
            });
        });
    }

    // Handle alterationFilter
    if (filters.alterationFilter) {
        // Merge with defaults: defaults first, then overrides from parsed object
        filters.alterationFilter = _.mergeWith(
            {},
            ALTERATION_FILTER_DEFAULTS,
            filters.alterationFilter,
            (defaultValue, providedValue) =>
                providedValue !== undefined ? providedValue : defaultValue
        );
    }

    return filters;
}

export const AlterationMenuHeader: React.FunctionComponent<{
    includeCnaTable: boolean;
}> = observer(({ includeCnaTable }) => {
    if (includeCnaTable) {
        return (
            <span style={{ marginTop: 'auto', marginBottom: 'auto' }}>
                Select the types of alterations to count in the{' '}
                <i>Mutated Genes</i>, <i>CNA Genes</i> and <i>Fusion Genes</i>{' '}
                tables.
            </span>
        );
    } else {
        return (
            <span style={{ marginTop: 'auto', marginBottom: 'auto' }}>
                Select the types of alterations to count in the{' '}
                <i>Mutated Genes</i> and <i>Fusion Genes</i> tables.
            </span>
        );
    }
});

export function buildSelectedDriverTiersMap(
    selectedTiers: string[],
    allTiers: string[]
): { [tier: string]: boolean } {
    return _(allTiers)
        .keyBy()
        .mapValues((value, tier) => selectedTiers.includes(tier))
        .value();
}

export const FilterIconMessage: React.FunctionComponent<{
    chartType: ChartType;
    annotatedFilterQuery: GeneFilterQuery | StructuralVariantFilterQuery;
}> = observer(({ chartType, annotatedFilterQuery }) => {
    const annotationFilterIsActive = annotationFilterActive(
        annotatedFilterQuery.includeDriver,
        annotatedFilterQuery.includeVUS,
        annotatedFilterQuery.includeUnknownOncogenicity
    );
    const tierFilterIsActive = driverTierFilterActive(
        annotatedFilterQuery.tiersBooleanMap,
        annotatedFilterQuery.includeUnknownTier
    );
    const statusFilterIsActive = statusFilterActive(
        annotatedFilterQuery.includeGermline,
        annotatedFilterQuery.includeSomatic,
        annotatedFilterQuery.includeUnknownStatus
    );
    const isMutationType =
        chartType === ChartTypeEnum.MUTATED_GENES_TABLE ||
        chartType === ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE ||
        chartType === ChartTypeEnum.STRUCTURAL_VARIANTS_TABLE;
    if (
        !annotationFilterIsActive &&
        !tierFilterIsActive &&
        (!statusFilterIsActive || !isMutationType)
    )
        return null;

    const driverFilterTextElements: string[] = [];
    if (annotationFilterIsActive) {
        annotatedFilterQuery.includeDriver &&
            driverFilterTextElements.push('driver');
        annotatedFilterQuery.includeVUS &&
            driverFilterTextElements.push('passenger');
        annotatedFilterQuery.includeUnknownOncogenicity &&
            driverFilterTextElements.push('unknown');
    }

    const statusFilterTextElements: string[] = [];
    if (statusFilterIsActive && isMutationType) {
        annotatedFilterQuery.includeGermline &&
            statusFilterTextElements.push('germline');
        annotatedFilterQuery.includeSomatic &&
            statusFilterTextElements.push('somatic');
        annotatedFilterQuery.includeUnknownStatus &&
            statusFilterTextElements.push('unknown');
    }

    const tierNames = tierFilterIsActive
        ? _(annotatedFilterQuery.tiersBooleanMap)
              .pickBy()
              .keys()
              .value()
        : [];
    if (tierFilterIsActive && annotatedFilterQuery.includeUnknownTier)
        tierNames.push('unknown');

    let driverFilterText = '';
    if (driverFilterTextElements.length === 1)
        driverFilterText = driverFilterTextElements[0];
    else if (driverFilterTextElements.length > 1)
        driverFilterText =
            driverFilterTextElements.slice(0, -1).join(', ') +
            ' or ' +
            driverFilterTextElements.slice(-1);

    let statusFilterText = '';
    if (statusFilterTextElements.length === 1)
        statusFilterText = statusFilterTextElements[0];
    else if (statusFilterTextElements.length > 1)
        statusFilterText =
            statusFilterTextElements.slice(0, -1).join(', ') +
            ' or ' +
            statusFilterTextElements.slice(-1);

    let tierFilterText = '';
    if (tierNames.length === 1) tierFilterText = tierNames[0];
    else if (tierNames.length > 1)
        tierFilterText =
            tierNames.slice(0, -1).join(', ') + ' or ' + tierNames.slice(-1);

    return (
        <div data-test={'groupedGeneFilterIcons'} className={styles.content}>
            {driverFilterText && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                >
                    <span>annotation:</span>&nbsp;
                    <span>{driverFilterText}</span>
                </div>
            )}
            {statusFilterText && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                >
                    <span>status:</span>&nbsp;
                    <span>{statusFilterText}</span>
                </div>
            )}
            {tierFilterText && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                    }}
                >
                    <span>category:</span>&nbsp;
                    <span>{tierFilterText}</span>
                </div>
            )}
        </div>
    );
});

export function driverTierFilterActive(
    tiersMap: { [tier: string]: boolean },
    includeUnknownTier: boolean
): boolean {
    const availableTiers = _.keys(tiersMap);
    const selectedTiers = _(tiersMap)
        .pickBy()
        .keys()
        .value();
    return (
        !(selectedTiers.length === 0 && !includeUnknownTier) &&
        !(selectedTiers.length === availableTiers.length && includeUnknownTier)
    );
}

export function annotationFilterActive(
    includeDriver: boolean,
    includeVUS: boolean,
    includeUnknownOncogenicity: boolean
): boolean {
    return (
        !(includeDriver && includeVUS && includeUnknownOncogenicity) &&
        !(!includeDriver && !includeVUS && !includeUnknownOncogenicity)
    );
}

export function statusFilterActive(
    includeGermline: boolean,
    includeSomatic: boolean,
    includeUnknownStatus: boolean
): boolean {
    return (
        !(includeGermline && includeSomatic && includeUnknownStatus) &&
        !(!includeGermline && !includeSomatic && !includeUnknownStatus)
    );
}

export function findInvalidMolecularProfileIds(
    filters: StudyViewFilter,
    molecularProfiles: MolecularProfile[]
): string[] {
    let geneFilters = filters.geneFilters;
    const molecularProfilesInFilters = _(
        geneFilters?.map(f => f.molecularProfileIds)
    )
        .flatten()
        .uniq()
        .value();
    let result = _.difference(
        molecularProfilesInFilters,
        molecularProfiles.map(p => p.molecularProfileId)
    );
    return result;
}

export function getFilteredMolecularProfilesByAlterationType(
    studyIdToMolecularProfiles: { [studyId: string]: MolecularProfile[] },
    alterationType: string,
    allowedDataTypes?: string[] // allowed MolecularProfile datatypes
) {
    return _.reduce(
        studyIdToMolecularProfiles,
        (acc: MolecularProfile[], molecularProfiles) => {
            let filteredMolecularProfiles = molecularProfiles.filter(
                profile => {
                    let isFiltered =
                        profile.molecularAlterationType === alterationType;
                    if (!_.isEmpty(allowedDataTypes)) {
                        isFiltered =
                            isFiltered &&
                            allowedDataTypes!.includes(profile.datatype);
                    }
                    return isFiltered;
                }
            );
            if (!_.isEmpty(allowedDataTypes)) {
                const dataTypeToIndexSet = stringListToIndexSet(
                    allowedDataTypes!
                );
                filteredMolecularProfiles = _.sortBy(
                    filteredMolecularProfiles,
                    profile => dataTypeToIndexSet[profile.datatype]
                );
            }
            if (!_.isEmpty(filteredMolecularProfiles)) {
                acc.push(filteredMolecularProfiles[0]);
            }
            return acc;
        },
        []
    );
}

export function getNonZeroUniqueBins(dataBins: DataBin[]) {
    return _.uniq(
        _.reduce(
            dataBins,
            (acc, next) => {
                if (!_.isUndefined(next.start) && next.start !== 0) {
                    acc.push(next.start);
                }
                if (!_.isUndefined(next.end) && next.end !== 0) {
                    acc.push(next.end);
                }
                return acc;
            },
            [] as number[]
        )
    );
}

export function getUserGroupColor(
    groupColors: { [groupId: string]: string },
    groupId: string
) {
    return groupColors && _.has(groupColors, groupId)
        ? groupColors[groupId]
        : undefined;
}

export function getRangeFromDataBins(bins: DataFilterValue[]) {
    const numericals = bins.filter(
        value => value.start !== undefined || value.end !== undefined
    );

    if (numericals.length === 0) {
        return undefined;
    }

    // merge numericals into one interval
    const min = numericals[0].start;
    const max = numericals[numericals.length - 1].end;

    return {
        min,
        max,
    };

    /*const allNumericals = bins.filter(
        bin => bin.start !== undefined || bin.end !== undefined
    );

    const binBounds = _.chain(allNumericals)
        .flatMap(bin => [bin.start, bin.end]) // put starts and ends into a list
        .filter(x => x !== undefined && x !== null)
        .value() as number[]; // get rid of any non-numbers;

    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const b of binBounds) {
        min = Math.min(b, min);
        max = Math.max(b, max);
    }
    return {min, max};*/
}

export async function updateCustomIntervalFilter(
    newRange: { start?: number; end?: number },
    chartMeta: Pick<ChartMeta, 'uniqueKey'>,
    getDataBinsPromise: (
        chartMeta: Pick<ChartMeta, 'uniqueKey'>
    ) => MobxPromise<DataBin[]>,
    getCurrentFilters: (chartUniqueKey: string) => DataFilterValue[],
    updateCustomBins: (
        chartUniqueKey: string,
        bins: number[],
        binMethod: 'MEDIAN' | 'QUARTILE' | 'CUSTOM' | 'GENERATE',
        generateBinsConfig?: BinsGeneratorConfig
    ) => void,
    updateIntervalFilters: (uniqueKey: string, bins: DataBin[]) => void
) {
    /* This function does what is necessary in order to set a custom range to filter a numerical attribute.
     What makes this necessary is that filters are specified in terms of data bins. Thus,
     to set up a custom range, we must first set up custom data bins, then use those custom
     bins to define the filter. At the same time, we need to retain the existing
     categorical filters (e.g. NA).
     */

    const currentCategoricals = getCurrentFilters(chartMeta.uniqueKey).filter(
        bin => bin.start === undefined && bin.end === undefined
    );
    const allBins: DataBin[] = getDataBinsPromise(chartMeta).result!;

    // Determine the new custom bin bounds (e.g. 0, 3, 5, 10) by taking the
    // current ones, adding the new custom range bounds, and then sorting
    // and getting unique elements.
    const allNumericals = allBins.filter(
        bin => bin.start !== undefined || bin.end !== undefined
    );
    const newBinBounds = _.chain(allNumericals)
        .flatMap(bin => [bin.start, bin.end]) // put starts and ends into a list
        .concat(newRange.start, newRange.end) // add update
        .filter(x => x !== undefined && x !== null) // get rid of any non-numbers
        .uniq() // get uniques
        .sortBy() // sort in ascending order
        .value() as number[];

    // Invoke the given callback to update the custom bins
    updateCustomBins(
        chartMeta.uniqueKey,
        newBinBounds,
        BinMethodOption.CUSTOM,
        {
            anchorValue: 0,
            binSize: 0,
        }
    );

    // Now, we will use the custom bins to define the new filter.
    // First, wait for the new bins to come back from the server.
    const newBins: DataBin[] = await toPromise(getDataBinsPromise(chartMeta)!);
    // Get the numerical ones only
    const newNumericals = newBins.filter(
        bin => bin.start !== undefined || bin.end !== undefined
    );
    // Find the desired bins in the API response
    const startBinIndex =
        newRange.start === undefined
            ? 0
            : newNumericals.findIndex(
                  bin => bin.start !== undefined && bin.start >= newRange.start!
              );
    const endBinIndex =
        newRange.end === undefined
            ? newNumericals.length - 1
            : _.findLastIndex(
                  newNumericals,
                  bin => bin.end !== undefined && bin.end <= newRange.end!
              );

    const targetNumericalBins = newNumericals.slice(
        startBinIndex,
        endBinIndex + 1
    );

    const categoricalsAsBins = currentCategoricals.map(v => ({
        start: v.start,
        end: v.end,
        specialValue: v.value,
    })) as DataBin[];

    // Update the filter, making sure to retain the existing categorical filters
    updateIntervalFilters(
        chartMeta.uniqueKey,
        targetNumericalBins.concat(categoricalsAsBins)
    );
}

export function getBinBounds(bins: DensityPlotBin[]) {
    const x = {
        max: Number.NEGATIVE_INFINITY,
        min: Number.POSITIVE_INFINITY,
    };
    const y = {
        max: Number.NEGATIVE_INFINITY,
        min: Number.POSITIVE_INFINITY,
    };

    bins.forEach(bin => {
        x.max = Math.max(x.max, bin.maxX);
        x.min = Math.min(x.min, bin.minX);
        y.max = Math.max(y.max, bin.maxY);
        y.min = Math.min(y.min, bin.minY);
    });

    return {
        x,
        y,
    };
}

export function logScalePossible(clinicalAttributeId: string) {
    return clinicalAttributeId === SpecialChartsUniqueKeyEnum.MUTATION_COUNT;
}

export function makeXvsYUniqueKey(xAttrId: string, yAttrId: string) {
    // make key the same regardless of axis order - only one chart allowed
    //  for a given pair
    const sorted = _.sortBy([xAttrId, yAttrId]);
    return `X-VS-Y-${sorted[0]}-${sorted[1]}`;
}

export function makeXvsYDisplayName(
    xAttr: ClinicalAttribute,
    yAttr: ClinicalAttribute
) {
    return `${yAttr.displayName} vs ${xAttr.displayName}`;
}

export function isQueriedStudyAuthorized(study: CancerStudy) {
    return (
        !getServerConfig().skin_home_page_show_unauthorized_studies ||
        (getServerConfig().skin_home_page_show_unauthorized_studies &&
            study.readPermission !== false)
    );
}

export function excludeFiltersForAttribute(
    filters: StudyViewFilter,
    clinicalAttributeId: string | string[]
) {
    let { clinicalDataFilters, ...rest } = filters;
    const clinicalAttributeIds = new Set();
    if (typeof clinicalAttributeId === 'string') {
        clinicalAttributeIds.add(clinicalAttributeId);
    } else {
        for (const id of clinicalAttributeId) {
            clinicalAttributeIds.add(id);
        }
    }

    clinicalDataFilters = clinicalDataFilters?.filter(
        f => !clinicalAttributeIds.has(f.attributeId)
    );
    return { clinicalDataFilters, ...rest };
}

export const FGA_VS_MUTATION_COUNT_KEY = makeXvsYUniqueKey(
    SpecialChartsUniqueKeyEnum.FRACTION_GENOME_ALTERED,
    SpecialChartsUniqueKeyEnum.MUTATION_COUNT
);

export const FGA_PLOT_DOMAIN = { min: 0, max: 1 };
export const MUTATION_COUNT_PLOT_DOMAIN = { min: 0 };

export type ComparisonCustomData = {
    patientId: string;
    sampleId: string;
    studyId: string;
    uniquePatientKey: string;
    uniqueSampleKey: string;
    value: string;
};

// This function returns the ClinicalData for the selected samples in a custom numerical dataset (for group comparison)
export function transformSampleDataToSelectedSampleClinicalData(
    sampleData: CustomChartIdentifierWithValue[],
    selectedSamples: Sample[],
    clinicalAttribute: ClinicalAttribute
): ClinicalData[] {
    const selectedSampleData: ComparisonCustomData[] = sampleData.map(
        sample =>
            ({
                ...sample,
                ...selectedSamples.find(
                    itmInner => itmInner.sampleId === sample.sampleId
                ),
            } as ComparisonCustomData)
    );
    const clinicalDataSamples = selectedSampleData
        .map(item => {
            return {
                clinicalAttribute: clinicalAttribute,
                clinicalAttributeId: clinicalAttribute.clinicalAttributeId,
                ...item,
            } as ClinicalData;
        })
        .filter(item => item.uniqueSampleKey !== undefined);
    return clinicalDataSamples;
}

const TOAST_SUPPRESS_KEY = 'SV-update-query';

export function showQueryUpdatedToast(message: string) {
    if (localStorage.getItem(TOAST_SUPPRESS_KEY) === null) {
        toast.success(
            () => (
                <ToastSuppressor
                    message={message}
                    toastKey={TOAST_SUPPRESS_KEY}
                />
            ),
            {
                delay: 0,
                position: 'top-right',
                autoClose: 4000,
                hideProgressBar: true,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            } as any
        );
    }
}

function ToastSuppressor(props: any) {
    const suppressToast = useCallback(() => {
        localStorage.setItem(props.toastKey, 'true');
    }, []);

    return (
        <>
            <p>{props.message}</p>
            <a onClick={suppressToast}>Don't show this again</a>
        </>
    );
}

export function getDefaultClinicalDataBinFilter(
    attribute: ClinicalAttribute
): ClinicalDataBinFilter & {
    showNA?: boolean | undefined;
} {
    return {
        attributeId: attribute.clinicalAttributeId,
        disableLogScale: false,
        showNA: false,
    } as ClinicalDataBinFilter & { showNA?: boolean };
}

export function generateColorMapKey(id: string, value: string): string {
    return `${id}.${value}`;
}

export async function invokeGenericAssayDataCount(
    chartInfo: GenericAssayChart,
    filters: StudyViewFilter
) {
    const result: GenericAssayDataCountItem[] = await getInternalClient().fetchGenericAssayDataCountsUsingPOST(
        {
            genericAssayDataCountFilter: {
                genericAssayDataFilters: [
                    {
                        stableId: chartInfo.genericAssayEntityId,
                        profileType: chartInfo.profileType,
                    } as GenericAssayDataFilter,
                ],
                studyViewFilter: filters,
            } as GenericAssayDataCountFilter,
        }
    );

    let data = result.find(d => d.stableId === chartInfo.genericAssayEntityId);
    let counts: ClinicalDataCount[] = [];
    let stableId: string = '';
    if (data !== undefined) {
        counts = data.counts.map(c => {
            return {
                count: c.count,
                value: c.value,
            } as ClinicalDataCount;
        });
        stableId = data.stableId;

        return { stableId: stableId, counts: counts };
    }

    return undefined;
}

export function invokeGenomicDataCountIncludeSampleid(
    chartInfo: GenomicChart,
    filters: StudyViewFilter,
    includeSampleIds: boolean
) {
    const params = {
        genomicDataCountFilter: {
            genomicDataFilters: [
                {
                    hugoGeneSymbol: chartInfo.hugoGeneSymbol,
                    profileType: chartInfo.profileType,
                } as GenomicDataFilter,
            ],
            studyViewFilter: filters,
        },
        $queryParameters: {
            projection: 'DETAILED',
            includeSampleIds,
        },
    };

    return getInternalClient().fetchMutationDataCountsUsingPOST(params);
}

export function groupSamplesByMutationStatus(data: any[], studyIds: string[]) {
    const SKIP_VALUES = new Set(['NOT_PROFILED']);
    const NON_MUTATION_VALUES = new Set(['NOT_MUTATED']);

    return (
        _.chain(data)
            .flatMap(d => d.counts ?? [])
            // Skip bins with 'NOT_PROFILED' or empty sampleIds
            .filter(c => !SKIP_VALUES.has(c.value) && c.sampleIds?.length > 0)
            .flatMap(c => {
                const group = NON_MUTATION_VALUES.has(c.value)
                    ? c.value
                    : 'MUTATED';

                // Map sampleIds to structured objects and remove unmatched samples if any
                return _.compact(
                    c.sampleIds.map((rawId: string) => {
                        const matchedStudyId = studyIds.find(studyId =>
                            rawId.startsWith(studyId + '_')
                        );

                        if (!matchedStudyId) return null;

                        return {
                            group,
                            studyId: matchedStudyId,
                            sampleId: rawId.substring(
                                matchedStudyId.length + 1
                            ),
                        };
                    })
                );
            })
            .groupBy('group')
            .mapValues(items =>
                _.uniqBy(
                    items.map(({ studyId, sampleId }) => ({
                        studyId,
                        sampleId,
                    })),
                    i => i.sampleId // for now using sampleId as unique identifier, but may need to switch to using sampleId + studyId if there are duplicate sampleIds across studies
                )
            )
            .value()
    );
}

export async function invokeGenomicDataCount(
    chartInfo: GenomicChart,
    filters: StudyViewFilter
) {
    let result = [];
    let getDisplayedValue;
    let getDisplayedColor;
    let params = {
        genomicDataCountFilter: {
            genomicDataFilters: [
                {
                    hugoGeneSymbol: chartInfo.hugoGeneSymbol,
                    profileType: chartInfo.profileType,
                } as GenomicDataFilter,
            ],
            studyViewFilter: filters,
        },
    } as any;

    // mutation data counts (pie chart)
    if (
        chartInfo.profileType ===
        MolecularAlterationType_filenameSuffix.MUTATION_EXTENDED
    ) {
        params = {
            ...params,
            $queryParameters: {
                projection: 'SUMMARY',
            },
        };
        result = await getInternalClient().fetchMutationDataCountsUsingPOST(
            params
        );
        getDisplayedValue = transformMutatedType;
        getDisplayedColor = (value: string) =>
            getMutationColorByCategorization(transformMutatedType(value));
    } else {
        result = await getInternalClient().fetchGenomicDataCountsUsingPOST(
            params
        );
        getDisplayedValue = getCNAByAlteration;
        getDisplayedColor = (value: string | number) =>
            getCNAColorByAlteration(getCNAByAlteration(value));
    }

    const data = result.find(
        d =>
            d.hugoGeneSymbol === chartInfo.hugoGeneSymbol &&
            d.profileType === chartInfo.profileType
    );

    let counts: ClinicalDataCount[] = [];
    let profileType: string = '';
    if (data !== undefined) {
        counts = data.counts.map(c => {
            return {
                count: c.count,
                value: c.value,
            } as ClinicalDataCount;
        });
        profileType = data.profileType;

        return {
            counts: counts,
            profileType: profileType,
            getDisplayedValue: getDisplayedValue,
            getDisplayedColor: getDisplayedColor,
        };
    }

    return undefined;
}

export async function invokeMutationDataCount(
    chartInfo: GenomicChart,
    filters: StudyViewFilter,
    profiledCases: number
) {
    const params = {
        genomicDataCountFilter: {
            genomicDataFilters: [
                {
                    hugoGeneSymbol: chartInfo.hugoGeneSymbol,
                    profileType: chartInfo.profileType,
                } as GenomicDataFilter,
            ],
            studyViewFilter: filters,
        },
        $queryParameters: {
            projection: 'DETAILED',
        },
    } as any;

    const result = await getInternalClient().fetchMutationDataCountsUsingPOST(
        params
    );

    const data = result.find(
        d =>
            d.hugoGeneSymbol === chartInfo.hugoGeneSymbol &&
            d.profileType === chartInfo.profileType
    );

    let counts: MultiSelectionTableRow[] = [];
    if (data !== undefined) {
        counts = data.counts.map(c => {
            return {
                uniqueKey: c.value,
                label: c.label,
                // "Altered" and "Profiled" really just mean
                //  "numerator" and "denominator" in percent
                //  calculation of table. Here, they mean
                //  "# filtered samples in profile" and "# filtered samples overall"
                numberOfAlteredCases: c.uniqueCount,
                numberOfProfiledCases: profiledCases,
                totalCount: c.count,
            } as MultiSelectionTableRow;
        });
    }

    return counts;
}

export async function invokeNamespaceDataCount(
    chartMeta: ChartMeta,
    filters: StudyViewFilter,
    profiledCases: number
) {
    const params = {
        namespaceDataCountFilter: {
            attributes: [
                {
                    outerKey: chartMeta.namespaceAttribute!.outerKey,
                    innerKey: chartMeta.namespaceAttribute!.innerKey,
                } as NamespaceDataFilter,
            ],
            studyViewFilter: filters,
        },
    };

    const result = await internalClient.fetchNamespaceDataCountsUsingPOST(
        params
    );

    const data = result.find(
        (d: NamespaceDataCountItem) =>
            d.outerKey === chartMeta.namespaceAttribute!.outerKey &&
            d.innerKey === chartMeta.namespaceAttribute!.innerKey
    );

    let counts: MultiSelectionTableRow[] = [];
    if (data !== undefined) {
        counts = data.counts.map((c: NamespaceDataCount) => {
            return {
                uniqueKey: c.value,
                label: c.value,
                // "Altered" and "Profiled" really just mean
                //  "numerator" and "denominator" in percent
                //  calculation of table. Here, they mean
                //  "# filtered samples in profile" and "# filtered samples overall"
                numberOfAlteredCases: c.count,
                numberOfProfiledCases: profiledCases,
                totalCount: c.totalCount,
            } as MultiSelectionTableRow;
        });
    }

    return counts;
}

export async function getCustomChartDownloadData(
    chartMeta: ChartMeta,
    selectedSamples: Sample[],
    selectedPatients: Patient[],
    caseIdentifiers?: CustomChartIdentifierWithValue[]
): Promise<string> {
    return new Promise<string>(resolve => {
        if (chartMeta && chartMeta.uniqueKey) {
            let isPatientChart = chartMeta.patientAttribute;
            let header = ['Study ID', 'Patient ID'];

            if (!isPatientChart) {
                header.push('Sample ID');
            }
            header.push(chartMeta.displayName);
            let data = [header.join('\t')];
            if (
                chartMeta.uniqueKey ===
                SpecialChartsUniqueKeyEnum.CANCER_STUDIES
            ) {
                data = data.concat(
                    selectedSamples.map((sample: Sample) => {
                        return [
                            sample.studyId || Datalabel.NA,
                            sample.patientId || Datalabel.NA,
                            sample.sampleId || Datalabel.NA,
                            sample.studyId,
                        ].join('\t');
                    })
                );
            } else if (!_.isEmpty(caseIdentifiers)) {
                if (isPatientChart) {
                    data = data.concat(
                        selectedPatients.map((patient: Patient) => {
                            let record = _.find(
                                caseIdentifiers,
                                (
                                    caseIdentifier: CustomChartIdentifierWithValue
                                ) => {
                                    return (
                                        caseIdentifier.studyId ===
                                            patient.studyId &&
                                        patient.patientId ===
                                            caseIdentifier.patientId
                                    );
                                }
                            );
                            return [
                                patient.studyId || Datalabel.NA,
                                patient.patientId || Datalabel.NA,
                                record === undefined ? 'NA' : record.value,
                            ].join('\t');
                        })
                    );
                } else {
                    data = data.concat(
                        selectedSamples.map((sample: Sample) => {
                            let record = _.find(
                                caseIdentifiers,
                                (
                                    caseIdentifier: CustomChartIdentifierWithValue
                                ) => {
                                    return (
                                        caseIdentifier.studyId ===
                                            sample.studyId &&
                                        sample.sampleId ===
                                            caseIdentifier.sampleId
                                    );
                                }
                            );
                            return [
                                sample.studyId || Datalabel.NA,
                                sample.patientId || Datalabel.NA,
                                sample.sampleId || Datalabel.NA,
                                record === undefined ? 'NA' : record.value,
                            ].join('\t');
                        })
                    );
                }
            }

            resolve(data.join('\n'));
        } else {
            resolve('');
        }
    });
}

export async function getScatterDownloadData(
    chartInfo: XvsYScatterChart,
    promise: MobxPromise<Sample[]>
): Promise<string> {
    const selectedSamples = await toPromise(promise);
    const [xData, yData] = await Promise.all([
        getSampleToClinicalData(selectedSamples, chartInfo.xAttr),
        getSampleToClinicalData(selectedSamples, chartInfo.yAttr),
    ]);
    return generateXvsYScatterPlotDownloadData(
        chartInfo.xAttr,
        chartInfo.yAttr,
        selectedSamples,
        xData,
        yData
    );
}

export function getSurvivalDownloadData(
    chartMeta: ChartMeta,
    survivalPlots: SurvivalType[],
    survivalDataMap: { [id: string]: ClinicalData[] },
    selectedPatients: Patient[],
    selectedPatientKeys: string[]
): string {
    const matchedPlot = _.find(
        survivalPlots,
        plot => plot.id === chartMeta.uniqueKey
    );
    if (matchedPlot && survivalDataMap) {
        const data: string[] = [];

        // find the unique clinical attribute ids
        const uniqueClinicalAttributeIds = matchedPlot.associatedAttrs;

        // add the header row
        data.push(
            ['Study ID', 'Patient ID', ...uniqueClinicalAttributeIds].join('\t')
        );

        // add the data rows
        const selectedPatientMap = _.reduce(
            selectedPatients,
            (acc, next) => {
                acc[next.uniquePatientKey] = next;
                return acc;
            },
            {} as { [uniquePatientKey: string]: Patient }
        );
        selectedPatientKeys.forEach(uniquePatientKey => {
            const clinicalDataList = survivalDataMap[uniquePatientKey];
            const row: string[] = [];

            if (clinicalDataList && clinicalDataList.length > 0) {
                row.push(clinicalDataList[0].studyId || Datalabel.NA);
                row.push(clinicalDataList[0].patientId || Datalabel.NA);
                const keyed = _.keyBy(clinicalDataList, 'clinicalAttributeId');

                _.each(uniqueClinicalAttributeIds, id => {
                    row.push(
                        keyed[id]
                            ? keyed[id].value || Datalabel.NA
                            : Datalabel.NA
                    );
                });
            } else {
                const selectedPatient = selectedPatientMap[uniquePatientKey];
                if (selectedPatient) {
                    row.push(selectedPatient.studyId || Datalabel.NA);
                    row.push(selectedPatient.patientId || Datalabel.NA);

                    _.each(uniqueClinicalAttributeIds, () => {
                        row.push(Datalabel.NA);
                    });
                }
            }

            data.push(row.join('\t'));
        });

        return data.join('\n');
    } else {
        return '';
    }
}

export async function getMutatedGenesDownloadData(
    promise: MobxPromise<MultiSelectionTableRow[]>,
    oncokbCancerGeneFilterEnabled: boolean
): Promise<string> {
    if (promise.result) {
        let header = [
            'Gene',
            'MutSig(Q-value)',
            '# Mut',
            '#',
            'Profiled Samples',
            'Freq',
        ];
        if (oncokbCancerGeneFilterEnabled) {
            header.push('Is Cancer Gene (source: OncoKB)');
        }
        let data = [header.join('\t')];
        _.each(promise.result, (record: MultiSelectionTableRow) => {
            let rowData = [
                record.label,
                record.qValue === undefined ? '' : getQValue(record.qValue),
                record.totalCount,
                record.numberOfAlteredCases,
                record.numberOfProfiledCases,
                getFrequencyStr(
                    (record.numberOfAlteredCases /
                        record.numberOfProfiledCases) *
                        100
                ),
            ];
            if (oncokbCancerGeneFilterEnabled) {
                rowData.push(
                    oncokbCancerGeneFilterEnabled
                        ? record.isCancerGene
                            ? 'Yes'
                            : 'No'
                        : 'NA'
                );
            }
            data.push(rowData.join('\t'));
        });
        return data.join('\n');
    } else return '';
}

export function getStructuralVariantGenesDownloadData(
    promise:
        | MobxPromise<MultiSelectionTableRow[]>
        | MobxPromise<StructVarMultiSelectionTableRow[]>,
    oncokbCancerGeneFilterEnabled: boolean
): string {
    if (promise.result) {
        const header = [
            'Gene',
            '# Structural Variant',
            '#',
            'Profiled Samples',
            'Freq',
        ];
        if (oncokbCancerGeneFilterEnabled) {
            header.push('Is Cancer Gene (source: OncoKB)');
        }
        const data = [header.join('\t')];
        _.each(promise.result, (record: MultiSelectionTableRow) => {
            const rowData = [
                record.label,
                record.totalCount,
                record.numberOfAlteredCases,
                record.numberOfProfiledCases,
                getFrequencyStr(
                    (record.numberOfAlteredCases /
                        record.numberOfProfiledCases) *
                        100
                ),
            ];
            if (oncokbCancerGeneFilterEnabled) {
                rowData.push(
                    oncokbCancerGeneFilterEnabled
                        ? record.isCancerGene
                            ? 'Yes'
                            : 'No'
                        : 'NA'
                );
            }
            data.push(rowData.join('\t'));
        });
        return data.join('\n');
    } else return '';
}

export async function getGenesCNADownloadData(
    promise: MobxPromise<MultiSelectionTableRow[]>,
    oncokbCancerGeneFilterEnabled: boolean
): Promise<string> {
    if (promise.result) {
        let header = [
            'Gene',
            'Gistic(Q-value)',
            'Cytoband',
            'CNA',
            'Profiled Samples',
            '#',
            'Freq',
        ];
        if (oncokbCancerGeneFilterEnabled) {
            header.push('Is Cancer Gene (source: OncoKB)');
        }
        let data = [header.join('\t')];
        _.each(promise.result, (record: MultiSelectionTableRow) => {
            let rowData = [
                record.label,
                record.qValue === undefined ? '' : getQValue(record.qValue),
                record.cytoband,
                getCNAByAlteration(record.alteration!),
                record.numberOfAlteredCases,
                record.numberOfProfiledCases,
                getFrequencyStr(
                    (record.numberOfAlteredCases /
                        record.numberOfProfiledCases) *
                        100
                ),
            ];
            if (oncokbCancerGeneFilterEnabled) {
                rowData.push(
                    oncokbCancerGeneFilterEnabled
                        ? record.isCancerGene
                            ? 'Yes'
                            : 'No'
                        : 'NA'
                );
            }
            data.push(rowData.join('\t'));
        });
        return data.join('\n');
    } else return '';
}

export async function getPatientTreatmentDownloadData(
    promise: MobxPromise<PatientTreatmentReport>
): Promise<string> {
    if (promise.result) {
        const header = ['Treatment', '#'];
        let data = [header.join('\t')];
        _.each(
            promise.result.patientTreatments,
            (record: PatientTreatmentRow) => {
                let rowData = [record.treatment, record.count];
                data.push(rowData.join('\t'));
            }
        );
        return data.join('\n');
    } else return '';
}

export async function getSampleTreatmentDownloadData(
    promise: MobxPromise<SampleTreatmentReport>
): Promise<string> {
    if (promise.result) {
        const header = ['Treatment', 'Pre/Post', '#'];
        let data = [header.join('\t')];
        _.each(promise.result.treatments, (record: SampleTreatmentRow) => {
            let rowData = [record.treatment, record.time, record.count];
            data.push(rowData.join('\t'));
        });
        return data.join('\n');
    } else return '';
}

export async function getMutationTypesDownloadData(
    promise: MobxPromise<MultiSelectionTableRow[]>
): Promise<string> {
    if (promise.result) {
        let header = [
            'Mutation Event',
            '# Mut',
            '#',
            'Profiled Samples',
            'Freq',
        ];
        let data = [header.join('\t')];
        _.each(promise.result, (record: MultiSelectionTableRow) => {
            let rowData = [
                record.label,
                record.totalCount,
                record.numberOfAlteredCases,
                record.numberOfProfiledCases,
                getFrequencyStr(
                    (record.numberOfAlteredCases /
                        record.numberOfProfiledCases) *
                        100
                ),
            ];
            data.push(rowData.join('\t'));
        });
        return data.join('\n');
    } else return '';
}

export async function getVariantAnnotationTypesDownloadData(
    promise: MobxPromise<MultiSelectionTableRow[]>
): Promise<string> {
    if (promise.result) {
        let header = ['Annotation', '# VA', '#', 'Profiled Samples', 'Freq'];
        let data = [header.join('\t')];
        _.each(promise.result, (record: MultiSelectionTableRow) => {
            let rowData = [
                record.label,
                record.totalCount,
                record.numberOfAlteredCases,
                record.numberOfProfiledCases,
                getFrequencyStr(
                    (record.numberOfAlteredCases /
                        record.numberOfProfiledCases) *
                        100
                ),
            ];
            data.push(rowData.join('\t'));
        });
        return data.join('\n');
    } else return '';
}

export function getChartMetaSet(
    customCharts: ObservableMap<string, ChartMeta>,
    molecularProfiles: MolecularProfile[],
    geneSpecificCharts: ObservableMap<string, ChartMeta>,
    genericAssayCharts: ObservableMap<string, ChartMeta>,
    XvsYCharts: ObservableMap<string, ChartMeta>,
    clinicalAttributes: ClinicalAttribute[],
    namespaceAttributes: NamespaceAttribute[],
    survivalPlots: SurvivalType[],
    mutationProfiles: MolecularProfile[],
    structuralVariantProfiles: MolecularProfile[],
    isStructVarTableFeatureEnabled: boolean,
    cnaProfiles: MolecularProfile[],
    shouldDisplayClinicalEventTypeCounts?: boolean,
    shouldDisplaySampleTreatments?: boolean,
    shouldDisplayPatientTreatments?: boolean,
    shouldDisplaySampleTreatmentGroups?: boolean,
    shouldDisplayPatientTreatmentGroups?: boolean,
    shouldDisplaySampleTreatmentTarget?: boolean,
    shouldDisplayPatientTreatmentTarget?: boolean
) {
    const customChartMetaSet = _.fromPairs(customCharts.toJSON());
    // if no molecular profiles, genomic profiles sample count chart will be empty so remove it from set
    if (_.isEmpty(molecularProfiles)) {
        delete customChartMetaSet[
            SpecialChartsUniqueKeyEnum.GENOMIC_PROFILES_SAMPLE_COUNT
        ];
    }
    const geneSpecificChartMetaSet = _.fromPairs(geneSpecificCharts.toJSON());
    const genericAssayChartMetaSet = _.fromPairs(genericAssayCharts.toJSON());
    const XvsYChartMetaSet = _.fromPairs(XvsYCharts.toJSON());

    // Add meta information for clinical attributes
    // Convert to a Set for easy access and to update attribute meta information (would be useful while adding new features)
    const clinicalAttributeChartMetaSet = _.reduce(
        clinicalAttributes,
        (acc: { [id: string]: ChartMeta }, attribute) => {
            const uniqueKey = getUniqueKey(attribute);
            const priority = getPriorityByClinicalAttribute(attribute);
            if (priority > -1) {
                acc[uniqueKey] = {
                    displayName: attribute.displayName,
                    uniqueKey: uniqueKey,
                    dataType: getChartMetaDataType(uniqueKey),
                    patientAttribute: attribute.patientAttribute,
                    description: attribute.description,
                    priority: priority,
                    renderWhenDataChange: false,
                    clinicalAttribute: attribute,
                };
            }
            return acc;
        },
        {}
    );

    const survivalPlotChartMetaSet = _.reduce(
        survivalPlots,
        (acc: { [id: string]: ChartMeta }, survivalPlot) => {
            acc[survivalPlot.id] = {
                uniqueKey: survivalPlot.id,
                dataType: getChartMetaDataType(survivalPlot.id),
                patientAttribute: true,
                displayName: survivalPlot.title,
                clinicalAttribute: survivalPlot.survivalStatusAttribute,
                // use survival status attribute's priority as KM plot's priority for non-reserved plots
                priority:
                    STUDY_VIEW_CONFIG.priority[survivalPlot.id] ||
                    getPriorityByClinicalAttribute(
                        survivalPlot.survivalStatusAttribute
                    ),
                renderWhenDataChange: false,
                description: '',
            };
            return acc;
        },
        {}
    );

    const namespaceAttributeChartMetaSet = _.reduce(
        namespaceAttributes,
        (acc: { [id: string]: ChartMeta }, attribute) => {
            const uniqueKey = getUniqueNamespaceKey(attribute);
            const displayName = getNamespaceChartDisplayName(
                attribute,
                namespaceAttributes
            );
            acc[uniqueKey] = {
                displayName: displayName,
                uniqueKey: uniqueKey,
                dataType: ChartMetaDataTypeEnum.VARIANT_ANNOTATIONS,
                patientAttribute: false,
                description: `${attribute.outerKey}.${attribute.innerKey} from all profiles`,
                priority: 99,
                renderWhenDataChange: false,
                namespaceAttribute: attribute,
            };
            return acc;
        },
        {}
    );

    const chartMetaSet = {
        ...customChartMetaSet,
        ...geneSpecificChartMetaSet,
        ...genericAssayChartMetaSet,
        ...XvsYChartMetaSet,
        ...clinicalAttributeChartMetaSet,
        ...survivalPlotChartMetaSet,
        ...namespaceAttributeChartMetaSet,
    };

    if (shouldDisplayClinicalEventTypeCounts) {
        chartMetaSet['CLINICAL_EVENT_TYPE_COUNTS'] = {
            uniqueKey: 'CLINICAL_EVENT_TYPE_COUNTS',
            dataType: ChartMetaDataTypeEnum.CLINICAL,
            patientAttribute: false,
            displayName: 'Timeline Events Availability',
            priority: getDefaultPriorityByUniqueKey(
                ChartTypeEnum.CLINICAL_EVENT_TYPE_COUNTS_TABLE
            ),
            renderWhenDataChange: false,
            description:
                'Distinct Counts of Patients with Clinical Event Types',
        };
    }
    if (shouldDisplaySampleTreatments) {
        chartMetaSet['SAMPLE_TREATMENTS'] = {
            uniqueKey: 'SAMPLE_TREATMENTS',
            dataType: ChartMetaDataTypeEnum.CLINICAL,
            patientAttribute: true,
            displayName: 'Treatment per Sample (pre/post)',
            priority: getDefaultPriorityByUniqueKey(
                ChartTypeEnum.SAMPLE_TREATMENTS_TABLE
            ),
            renderWhenDataChange: true,
            description:
                'List of treatments and the corresponding number of samples acquired before treatment or after/on treatment',
        };
    }

    if (shouldDisplayPatientTreatments) {
        chartMetaSet['PATIENT_TREATMENTS'] = {
            uniqueKey: 'PATIENT_TREATMENTS',
            dataType: ChartMetaDataTypeEnum.CLINICAL,
            patientAttribute: true,
            displayName: 'Treatment per Patient',
            priority: getDefaultPriorityByUniqueKey(
                ChartTypeEnum.PATIENT_TREATMENTS_TABLE
            ),
            renderWhenDataChange: true,
            description:
                'List of treatments and the corresponding number of patients treated',
        };
    }

    if (shouldDisplaySampleTreatmentGroups) {
        chartMetaSet['SAMPLE_TREATMENT_GROUPS'] = {
            uniqueKey: 'SAMPLE_TREATMENT_GROUPS',
            dataType: ChartMetaDataTypeEnum.CLINICAL,
            patientAttribute: true,
            displayName: 'Treatment Category per Sample (pre/post)',
            priority: getDefaultPriorityByUniqueKey(
                ChartTypeEnum.SAMPLE_TREATMENT_GROUPS_TABLE
            ),
            renderWhenDataChange: true,
            description:
                'List of treatments groups and the corresponding number of samples acquired before treatment or after/on treatment',
        };
    }

    if (shouldDisplayPatientTreatmentGroups) {
        chartMetaSet['PATIENT_TREATMENT_GROUPS'] = {
            uniqueKey: 'PATIENT_TREATMENT_GROUPS',
            dataType: ChartMetaDataTypeEnum.CLINICAL,
            patientAttribute: true,
            displayName: 'Treatment Category per Patient',
            priority: getDefaultPriorityByUniqueKey(
                ChartTypeEnum.PATIENT_TREATMENT_GROUPS_TABLE
            ),
            renderWhenDataChange: true,
            description:
                'List of treatment groups and the corresponding number of patients treated',
        };
    }

    if (shouldDisplaySampleTreatmentTarget) {
        chartMetaSet['SAMPLE_TREATMENT_TARGET'] = {
            uniqueKey: 'SAMPLE_TREATMENT_TARGET',
            dataType: ChartMetaDataTypeEnum.CLINICAL,
            patientAttribute: true,
            displayName: 'Treatment Target per Sample (pre/post)',
            priority: getDefaultPriorityByUniqueKey(
                ChartTypeEnum.SAMPLE_TREATMENT_TARGET_TABLE
            ),
            renderWhenDataChange: true,
            description:
                'List of treatments targets and the corresponding number of samples acquired before treatment or after/on treatment',
        };
    }

    if (shouldDisplayPatientTreatmentTarget) {
        chartMetaSet['PATIENT_TREATMENT_TARGET'] = {
            uniqueKey: 'PATIENT_TREATMENT_TARGET',
            dataType: ChartMetaDataTypeEnum.CLINICAL,
            patientAttribute: true,
            displayName: 'Treatment Target per Patient',
            priority: getDefaultPriorityByUniqueKey(
                ChartTypeEnum.PATIENT_TREATMENT_TARGET_TABLE
            ),
            renderWhenDataChange: true,
            description:
                'List of treatment targets and the corresponding number of patients treated',
        };
    }

    if (!_.isEmpty(mutationProfiles)) {
        const uniqueKey = getUniqueKeyFromMolecularProfileIds(
            mutationProfiles.map(
                mutationProfile => mutationProfile.molecularProfileId
            )
        );
        chartMetaSet[uniqueKey] = {
            uniqueKey: uniqueKey,
            dataType: ChartMetaDataTypeEnum.GENOMIC,
            patientAttribute: false,
            displayName: 'Mutated Genes',
            priority: getDefaultPriorityByUniqueKey(
                ChartTypeEnum.MUTATED_GENES_TABLE
            ),
            renderWhenDataChange: false,
            description: '',
        };
    }

    if (!_.isEmpty(structuralVariantProfiles)) {
        const uniqueKey = getUniqueKeyFromMolecularProfileIds(
            structuralVariantProfiles.map(p => p.molecularProfileId),
            ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE
        );
        chartMetaSet[uniqueKey] = {
            uniqueKey,
            dataType: ChartMetaDataTypeEnum.GENOMIC,
            patientAttribute: false,
            displayName: 'Structural Variant Genes',
            priority: getDefaultPriorityByUniqueKey(
                ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE
            ),
            renderWhenDataChange: true,
            description: '',
        };
        if (isStructVarTableFeatureEnabled) {
            const structVarGenesUniqueKey = getUniqueKeyFromMolecularProfileIds(
                structuralVariantProfiles.map(p => p.molecularProfileId),
                ChartTypeEnum.STRUCTURAL_VARIANTS_TABLE
            );
            chartMetaSet[structVarGenesUniqueKey] = {
                uniqueKey: structVarGenesUniqueKey,
                dataType: ChartMetaDataTypeEnum.GENOMIC,
                patientAttribute: false,
                displayName: 'Structural Variants',
                priority: getDefaultPriorityByUniqueKey(
                    ChartTypeEnum.STRUCTURAL_VARIANTS_TABLE
                ),
                renderWhenDataChange: true,
                description: '',
            };
        }
    }

    if (!_.isEmpty(cnaProfiles)) {
        const uniqueKey = getUniqueKeyFromMolecularProfileIds(
            cnaProfiles.map(
                mutationProfile => mutationProfile.molecularProfileId
            )
        );
        chartMetaSet[uniqueKey] = {
            uniqueKey,
            dataType: ChartMetaDataTypeEnum.GENOMIC,
            patientAttribute: false,
            displayName: 'CNA Genes',
            renderWhenDataChange: false,
            priority: getDefaultPriorityByUniqueKey(
                ChartTypeEnum.CNA_GENES_TABLE
            ),
            description: '',
        };
    }

    return chartMetaSet;
}

export function getVisibleAttributes(
    chartVisibility: ObservableMap<string, boolean>,
    chartMetaSet: {
        [id: string]: ChartMeta;
    }
) {
    return _.reduce(
        Array.from(chartVisibility.entries() || []),
        (acc: ChartMeta[], [chartUniqueKey, visible]) => {
            if (visible && chartMetaSet[chartUniqueKey]) {
                let chartMeta = chartMetaSet[chartUniqueKey];
                acc.push(chartMeta);
            }
            return acc;
        },
        []
    );
}

// this function takes legacy patient treatment data and puts it in the form
// of the clickhouse treatment report.  it makes the new code backward
// compatible.  when rfc80 is complete this should be removed
export async function getPatientTreatmentReport(
    filter: StudyViewFilter,
    tier: any,
    client: CBioPortalAPIInternal
) {
    const legacyData = await client.getAllPatientTreatmentsUsingPOST({
        studyViewFilter: filter,
        tier,
    });
    const totalPatients = _(legacyData)
        .flatMap(r => r.samples)
        .map(r => r.patientId)
        .uniq()
        .value().length;
    const resp: PatientTreatmentReport = {
        patientTreatments: legacyData,
        totalSamples: 0, // this is always zero, should be cleaned up in backend and deleted
        totalPatients,
    };
    return resp;
}

// like the above, this function takes legacy patient treatment data and puts it in the form
// of the clickhouse treatment report.  it makes the new code backward
// compatible.  when rfc80 is complete this should be removed
export async function getSampleTreatmentReport(
    filter: StudyViewFilter,
    tier: any,
    client: CBioPortalAPIInternal
) {
    const old = await client.getAllSampleTreatmentsUsingPOST({
        studyViewFilter: filter,
    });
    const resp: SampleTreatmentReport = {
        treatments: old,
        totalSamples: _(old)
            .flatMap(r => r.samples)
            .map(r => r.sampleId)
            .uniq()
            .value().length,
    };
    return resp;
}
