import {
    AnnotatedMutation,
    AnnotatedStructuralVariant,
} from 'shared/model/AnnotatedMutation';
import { AnnotatedNumericGeneMolecularData } from 'shared/model/AnnotatedNumericGeneMolecularData';
import { ExtendedAlteration } from 'shared/model/ExtendedAlteration';

export interface AnnotatedExtendedAlteration
    extends ExtendedAlteration,
        AnnotatedMutation,
        AnnotatedStructuralVariant,
        AnnotatedNumericGeneMolecularData {}
