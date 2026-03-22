import AccessorsForOqlFilter from './AccessorsForOqlFilter';
import { NumericGeneMolecularData } from 'cbioportal-ts-api-client';
import { StructuralVariant } from 'cbioportal-ts-api-client';

import { AlterationTypeConstants } from 'shared/constants';
import { AnnotatedMutation } from 'shared/model/AnnotatedMutation';
import { ExtendedAlteration } from 'shared/model/ExtendedAlteration';

export function annotateAlterationTypes(
    datum: (AnnotatedMutation | NumericGeneMolecularData | StructuralVariant) &
        Partial<ExtendedAlteration>,
    accessors: AccessorsForOqlFilter
): ExtendedAlteration {
    const molecularAlterationType = accessors.molecularAlterationType(
        datum.molecularProfileId
    );
    switch (molecularAlterationType) {
        case AlterationTypeConstants.MUTATION_EXTENDED:
            datum.alterationType = AlterationTypeConstants.MUTATION_EXTENDED;
            datum.alterationSubType = accessors.mut_type(
                datum as AnnotatedMutation
            ) as any;
            break;
        case AlterationTypeConstants.STRUCTURAL_VARIANT: {
            datum.alterationType = AlterationTypeConstants.STRUCTURAL_VARIANT;
            //TODO: what should it be?
            datum.alterationSubType = '';
            break;
        }
        case AlterationTypeConstants.COPY_NUMBER_ALTERATION:
            datum.alterationType =
                AlterationTypeConstants.COPY_NUMBER_ALTERATION;
            datum.alterationSubType = accessors.cna(
                datum as NumericGeneMolecularData
            );
            break;
        case AlterationTypeConstants.MRNA_EXPRESSION:
        case AlterationTypeConstants.PROTEIN_LEVEL:
            datum.alterationType = molecularAlterationType;
            break;
    }
    return datum as ExtendedAlteration;
}
