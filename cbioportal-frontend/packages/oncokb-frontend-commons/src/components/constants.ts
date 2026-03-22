export enum OtherBiomarkersQueryType {
    MSIH = 'MSIH',
    TMBH = 'TMBI',
}

export const OTHER_BIOMARKER_HUGO_SYMBOL = 'Other Biomarkers';
export const MSI_H_NAME = 'MSI-H';
export const TMB_H_NAME = 'TMB-H';
export const OTHER_BIOMARKER_NAME: {
    [key in OtherBiomarkersQueryType]: string;
} = {
    [OtherBiomarkersQueryType.MSIH]: MSI_H_NAME,
    [OtherBiomarkersQueryType.TMBH]: TMB_H_NAME,
};
