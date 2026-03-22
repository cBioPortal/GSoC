export interface IMutationalSignature {
    sampleId: string;
    uniqueSampleKey: string;
    patientId: string;
    uniquePatientKey: string;
    studyId: string;
    mutationalSignatureId: string;
    version: string;
    value: number;
    confidence: number;
    numberOfMutationsForSample: number;
    meta: IMutationalSignatureMeta;
}

export interface IMutationalSignatureMeta {
    mutationalSignatureId: string;
    name: string;
    description: string;
    url: string;
    category: string;
    confidenceStatement: string;
}

export interface IMutationalCounts {
    uniqueSampleKey: string;
    patientId: string;
    uniquePatientKey: string;
    studyId: string;
    sampleId: string;
    mutationalSignatureLabel: string;
    mutationalSignatureClass: string;
    version: string;
    value: number;
    percentage: number;
}

export type MutationalSignatureLabelMap = {
    stableId: string;
    signatureLabel: string;
    signatureClass: string;
    name: string;
};

export type MutationalSignatureCount = {
    mutationalSignatureLabel: string;
    patientId: string;
    sampleId: string;
    studyId: string;
    stableId: string;
    molecularProfileId: string;
    uniquePatientKey: string;
    uniqueSampleKey: string;
    value: string;
    version: string;
};
