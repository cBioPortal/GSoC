import { MyVariantInfo } from 'genome-nexus-ts-api-client';

export interface IMyVariantInfoIndex {
    [genomicLocation: string]: MyVariantInfo;
}
