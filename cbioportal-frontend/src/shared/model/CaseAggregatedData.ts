export type CaseAggregatedData<T> = {
    samples: { [uniqueSampleKey: string]: T[] };
    patients: { [uniquePatientKey: string]: T[] };
};
