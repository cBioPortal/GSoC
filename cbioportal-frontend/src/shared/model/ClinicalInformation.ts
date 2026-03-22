import { ClinicalData, ClinicalDataBySampleId } from 'cbioportal-ts-api-client';

export type ClinicalInformationData = {
    patient?: {
        id: string;
        clinicalData: ClinicalData[];
    };
    samples?: ClinicalDataBySampleId[];
    nodes?: any[]; //PDXNode[],
};
