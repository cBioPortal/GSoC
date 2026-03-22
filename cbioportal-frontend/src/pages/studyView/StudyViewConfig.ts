import { getServerConfig } from 'config/config';
import { StudyView } from '../../config/IAppConfig';
import { Layout } from 'react-grid-layout';
import _ from 'lodash';
import { ChartType } from './StudyViewUtils';
import { getBrowserWindow } from 'cbioportal-frontend-commons';

export type StudyViewColor = {
    theme: StudyViewColorTheme;
};

export type StudyViewColorTheme = {
    primary: string;
    secondary: string;
    tertiary: string;
    quaternary: string;

    unselectedGroup: string;
    selectedGroup: string;
    clinicalFilterTitle: string;
    clinicalFilterContent: string;
};

export type StudyViewThreshold = {
    pieToTable: number;
    piePadding: number;
    barRatio: number;
    rowsInTableForOneGrid: number;
    clinicalCharts: number;
    chartHighlight: number;
};

export type ChartDimension = {
    w: number;
    h: number;
    minW?: number;
    minH?: number;
};

export type Position = {
    x: number;
    y: number;
};

export type StudyViewLayout = {
    layout: Layout[];
    cols: number;
    grid: ChartDimension;
    gridMargin: Position;
    dimensions: { [chartType in ChartType]: ChartDimension };
};

export type StudyViewFrontEndConfig = {
    thresholds: StudyViewThreshold;
    initialBins: { [uniqueKey: string]: number[] };
    colors: StudyViewColor;
    alwaysShownClinicalAttributes: string[];
    layout: StudyViewLayout;
    defaultPriority: number;
};

export type StudyViewConfig = StudyView & StudyViewFrontEndConfig;

export enum ChartTypeEnum {
    PIE_CHART = 'PIE_CHART',
    BAR_CHART = 'BAR_CHART',
    SURVIVAL = 'SURVIVAL',
    TABLE = 'TABLE',
    SCATTER = 'SCATTER',
    VIOLIN_PLOT_TABLE = 'VIOLIN_PLOT_TABLE',
    VARIANT_ANNOTATIONS_TABLE = 'VARIANT_ANNOTATIONS_TABLE',
    MUTATED_GENES_TABLE = 'MUTATED_GENES_TABLE',
    MUTATION_TYPE_COUNTS_TABLE = 'MUTATION_TYPE_COUNTS_TABLE',
    STRUCTURAL_VARIANT_GENES_TABLE = 'STRUCTURAL_VARIANT_GENES_TABLE',
    STRUCTURAL_VARIANTS_TABLE = 'STRUCTURAL_VARIANTS_TABLE',
    CNA_GENES_TABLE = 'CNA_GENES_TABLE',
    GENOMIC_PROFILES_TABLE = 'GENOMIC_PROFILES_TABLE',
    CASE_LIST_TABLE = 'CASE_LIST_TABLE',
    SAMPLE_TREATMENTS_TABLE = 'SAMPLE_TREATMENTS_TABLE',
    SAMPLE_TREATMENT_GROUPS_TABLE = 'SAMPLE_TREATMENT_GROUPS_TABLE',
    SAMPLE_TREATMENT_TARGET_TABLE = 'SAMPLE_TREATMENT_TARGET_TABLE',
    PATIENT_TREATMENTS_TABLE = 'PATIENT_TREATMENTS_TABLE',
    PATIENT_TREATMENT_GROUPS_TABLE = 'PATIENT_TREATMENT_GROUPS_TABLE',
    PATIENT_TREATMENT_TARGET_TABLE = 'PATIENT_TREATMENT_TARGET_TABLE',
    CLINICAL_EVENT_TYPE_COUNTS_TABLE = 'CLINICAL_EVENT_TYPE_COUNTS_TABLE',
    NONE = 'NONE',
}

export enum ChartTypeNameEnum {
    PIE_CHART = 'pie chart',
    BAR_CHART = 'bar chart',
    SURVIVAL = 'survival plot',
    TABLE = 'table',
    SCATTER = 'density plot',
    VIOLIN_PLOT_TABLE = 'table',
    MUTATED_GENES_TABLE = 'table',
    VARIANT_ANNOTATIONS_TABLE = 'table',
    MUTATION_TYPE_COUNTS_TABLE = 'table',
    STRUCTURAL_VARIANT_GENES_TABLE = 'table',
    STRUCTURAL_VARIANTS_TABLE = 'table',
    CNA_GENES_TABLE = 'table',
    GENOMIC_PROFILES_TABLE = 'table',
    CASE_LIST_TABLE = 'table',
    SAMPLE_TREATMENTS_TABLE = 'table',
    SAMPLE_TREATMENT_GROUPS_TABLE = 'table',
    SAMPLE_TREATMENT_TARGET_TABLE = 'table',
    PATIENT_TREATMENTS_TABLE = 'table',
    PATIENT_TREATMENT_GROUPS_TABLE = 'table',
    PATIENT_TREATMENT_TARGET_TABLE = 'table',
    CLINICAL_EVENT_TYPE_COUNTS_TABLE = 'table',
    NONE = 'none',
}

export const DEFAULT_SORTING_COLUMN = 'Freq';

const studyViewFrontEnd = {
    alwaysShownClinicalAttributes: ['CANCER_TYPE', 'CANCER_TYPE_DETAILED'],
    defaultPriority: 1,
    tableAttrs: ['CANCER_TYPE', 'CANCER_TYPE_DETAILED'],
    initialBins: {
        MSI_SCORE: [4, 10],
        MSI_SENSOR_SCORE: [4, 10],
        MSI_SCORE_MANTIS: [0.4, 0.6],
    },
    priority: {
        CANCER_TYPE: 3000,
        CANCER_TYPE_DETAILED: 2000,
        GENOMIC_PROFILES_SAMPLE_COUNT: 1000,
        CASE_LISTS_SAMPLE_COUNT: 1000,
        OS_SURVIVAL: 400,
        DFS_SURVIVAL: 300,
        DSS_SURVIVAL: 250,
        PFS_SURVIVAL: 250,
        MUTATED_GENES_TABLE: 90,
        STRUCTURAL_VARIANT_GENES_TABLE: 85,
        STRUCTURAL_VARIANTS_TABLE: 85,
        CNA_GENES_TABLE: 80,
        PATIENT_TREATMENTS_TABLE: 75,
        PATIENT_TREATMENT_GROUPS_TABLE: 75,
        PATIENT_TREATMENT_TARGET_TABLE: 75,
        SAMPLE_TREATMENTS_TABLE: 75,
        SAMPLE_TREATMENT_GROUPS_TABLE: 75,
        SAMPLE_TREATMENT_TARGET_TABLE: 75,
        CLINICAL_EVENT_TYPE_COUNTS_TABLE: 75,
        VARIANT_ANNOTATIONS_TABLE: 75,
        CANCER_STUDIES: 70,
        SEQUENCED: 60,
        HAS_CNA_DATA: 50,
        SAMPLE_COUNT: 40,
        MUTATION_COUNT: 30,
        FRACTION_GENOME_ALTERED: 20,
        GENDER: 9,
        SEX: 9,
        AGE: 9,
        RACE: 8,
        ETHNICITY: 8,
        SAMPLE_TYPE: 8,
        HISTOLOGY: 8,
        TUMOR_TYPE: 8,
        SUBTYPE: 8,
        TUMOR_SITE: 8,
        'X-VS-Y-FRACTION_GENOME_ALTERED-MUTATION_COUNT': 200,
    },
    thresholds: {
        pieToTable: 20,
        piePadding: 20,
        barRatio: 0.8,
        rowsInTableForOneGrid: 4,
        clinicalCharts: 20,
        chartHighlight: 10000,
    },
    layout: {
        layout: [],
        cols: 6,
        grid: {
            w: 195,
            h: 170,
        },
        gridMargin: {
            x: 5,
            y: 5,
        },
        dimensions: {
            [ChartTypeEnum.PIE_CHART]: {
                w: 1,
                h: 1,
            },
            [ChartTypeEnum.BAR_CHART]: {
                w: 2,
                h: 1,
            },
            [ChartTypeEnum.SCATTER]: {
                w: 2,
                h: 2,
            },
            [ChartTypeEnum.VIOLIN_PLOT_TABLE]: {
                w: 2,
                h: 2,
                minW: 2,
            },
            [ChartTypeEnum.TABLE]: {
                w: 2,
                h: 2,
                minW: 2,
            },
            [ChartTypeEnum.SURVIVAL]: {
                w: 1,
                h: 1,
            },
            [ChartTypeEnum.MUTATED_GENES_TABLE]: {
                w: 2,
                h: 2,
                minW: 2,
            },
            [ChartTypeEnum.MUTATION_TYPE_COUNTS_TABLE]: {
                w: 2,
                h: 2,
                minW: 2,
            },
            [ChartTypeEnum.VARIANT_ANNOTATIONS_TABLE]: {
                w: 2,
                h: 1,
                minW: 2,
            },
            [ChartTypeEnum.STRUCTURAL_VARIANT_GENES_TABLE]: {
                w: 2,
                h: 2,
                minW: 2,
            },
            [ChartTypeEnum.STRUCTURAL_VARIANTS_TABLE]: {
                w: 2,
                h: 2,
                minW: 2,
            },
            [ChartTypeEnum.CNA_GENES_TABLE]: {
                w: 2,
                h: 2,
                minW: 2,
            },
            [ChartTypeEnum.GENOMIC_PROFILES_TABLE]: {
                w: 2,
                h: 2,
                minW: 2,
            },
            [ChartTypeEnum.CASE_LIST_TABLE]: {
                w: 2,
                h: 2,
                minW: 2,
            },
            [ChartTypeEnum.SAMPLE_TREATMENTS_TABLE]: {
                w: 2,
                h: 2,
                minW: 2,
            },
            [ChartTypeEnum.PATIENT_TREATMENTS_TABLE]: {
                w: 2,
                h: 2,
                minW: 2,
            },
            [ChartTypeEnum.SAMPLE_TREATMENT_GROUPS_TABLE]: {
                w: 2,
                h: 2,
                minW: 2,
            },
            [ChartTypeEnum.PATIENT_TREATMENT_GROUPS_TABLE]: {
                w: 2,
                h: 2,
                minW: 2,
            },
            [ChartTypeEnum.SAMPLE_TREATMENT_TARGET_TABLE]: {
                w: 2,
                h: 2,
                minW: 2,
            },
            [ChartTypeEnum.PATIENT_TREATMENT_TARGET_TABLE]: {
                w: 2,
                h: 2,
                minW: 2,
            },
            [ChartTypeEnum.CLINICAL_EVENT_TYPE_COUNTS_TABLE]: {
                w: 2,
                h: 2,
                minW: 2,
            },
            [ChartTypeEnum.NONE]: {
                w: 0,
                h: 0,
            },
        },
    },

    colors: {
        theme: {
            primary: '#2986E2',
            secondary: '#DC3912',
            tertiary: '#f88508',
            quaternary: '#109618',

            unselectedGroup: '#2986E2',
            selectedGroup: '#DC3912',
            clinicalFilterTitle: '#A9A9A9',
            clinicalFilterContent: '#2986E2',
        },
    },
};

// these should really be passed in as instance specific configuration
if (/\.mskcc\.org/.test(getBrowserWindow().location.hostname)) {
    Object.assign(studyViewFrontEnd.priority, {
        MUTATED_GENES_TABLE: 940,
        CNA_GENES_TABLE: 930,
        STRUCTURAL_VARIANT_GENES_TABLE: 920,
        'X-VS-Y-FRACTION_GENOME_ALTERED-MUTATION_COUNT': 890,
        SAMPLE_COUNT: 820,
        GENOMIC_PROFILES_SAMPLE_COUNT: -1,
    });
}

export const STUDY_VIEW_CONFIG: StudyViewConfig = _.assign(
    studyViewFrontEnd,
    (getServerConfig() || {}).study_view
);
