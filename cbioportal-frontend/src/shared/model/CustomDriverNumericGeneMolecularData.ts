import { NumericGeneMolecularData } from 'cbioportal-ts-api-client';

export interface CustomDriverNumericGeneMolecularData
    extends NumericGeneMolecularData {
    driverFilter: string;
    driverFilterAnnotation: string;
    driverTiersFilter: string;
    driverTiersFilterAnnotation: string;
}
