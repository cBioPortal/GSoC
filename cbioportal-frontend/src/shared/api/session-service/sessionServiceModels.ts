import { ClinicalData, StudyViewFilter } from 'cbioportal-ts-api-client';
import { ChartType } from 'pages/studyView/StudyViewUtils';
import {
    ClinicalTrackConfig,
    GeneticTrackConfig,
} from 'shared/components/oncoprint/Oncoprint';
import { PageSettingsIdentifier } from 'shared/userSession/PageSettingsIdentifier';

export interface Session {
    id: string;
    data: any;
}

export interface VirtualStudy extends Omit<Session, 'data'> {
    data: VirtualStudyData;
}

export interface Group extends Omit<Session, 'data'> {
    data: GroupData;
}

export interface CustomChart extends Omit<Session, 'data'> {
    data: CustomChartData;
}

export interface PageSettings extends Omit<Session, 'data'> {
    data: PageSettingsData;
}

export interface VirtualStudyData {
    name: string;
    description: string;
    studies: { id: string; samples: string[] }[];
    origin: string[];
    studyViewFilter: StudyViewFilter;
    typeOfCancerId?: string;
    pmid?: string;
}

export type GroupData = Omit<VirtualStudyData, 'studyViewFilter'>;

export type CustomChartIdentifierWithValue = Pick<
    ClinicalData,
    'studyId' | 'sampleId' | 'patientId' | 'value'
>;

export type CustomChartData = {
    origin: string[];
    displayName: string;
    description: string;
    datatype: string;
    patientAttribute: boolean;
    priority: number;
    data: CustomChartIdentifierWithValue[];
};

export type ComparisonSession = {
    id: string;
    groups: SessionGroupData[];
    origin: string[];
    clinicalAttributeName?: string;
    groupNameOrder?: string[];
};

export type SessionGroupData = GroupData & {
    uid?: string;
    color?: string; // for charts
};

export type ChartUserSetting = {
    id: string;
    name?: string;
    chartType?: ChartType;
    groups?: any; // for backward compatibility
    layout?: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    xAttrId?: string;
    yAttrId?: string;
    categoricalAttrId?: string;
    numericalAttrId?: string;
    patientAttribute: boolean;
    filterByCancerGenes?: boolean;
    customBins?: number[];
    disableLogScale?: boolean;
    description?: string;
    profileType?: string;
    hugoGeneSymbol?: string;
    genericAssayType?: string;
    genericAssayEntityId?: string;
    dataType?: string;
    showNA?: boolean;
    patientLevelProfile?: boolean;
};

export type StudyPageSettings = {
    chartSettings: ChartUserSetting[];
    origin: string[];
    groupColors: { [groupId: string]: string };
};

export type ResultPageSettings = {
    clinicallist?: ClinicalTrackConfig[];
    geneticlist?: GeneticTrackConfig[];
};

export type PageSettingsData = StudyPageSettings | ResultPageSettings;

export type PageSettingsUpdateRequest = PageSettingsIdentifier &
    PageSettingsData;
