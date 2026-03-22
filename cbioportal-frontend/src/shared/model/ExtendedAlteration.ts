import {
    MolecularProfile,
    Mutation,
    NumericGeneMolecularData,
    StructuralVariant,
} from 'cbioportal-ts-api-client';

export interface ExtendedAlteration
    extends Mutation,
        NumericGeneMolecularData,
        StructuralVariant {
    hugoGeneSymbol: string;
    molecularProfileAlterationType: MolecularProfile['molecularAlterationType'];
    // TODO: what is difference molecularProfileAlterationType and
    // alterationType?
    alterationType: string;
    alterationSubType: string;
}
