import { Sample } from 'cbioportal-ts-api-client';

export interface ExtendedSample extends Sample {
    cancerType: string;
    cancerTypeDetailed: string;
}
