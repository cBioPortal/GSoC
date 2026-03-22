import { ClinicalData } from '../generated/CBioPortalAPI';

export type ClinicalDataBySampleId = {
    id: string;
    clinicalData: Array<ClinicalData>;
};
