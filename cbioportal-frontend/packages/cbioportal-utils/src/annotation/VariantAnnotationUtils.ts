import { VariantAnnotation } from 'genome-nexus-ts-api-client';

import { Mutation } from '../model/Mutation';
import {
    extractGenomicLocation,
    genomicLocationString,
} from '../mutation/MutationUtils';

export function getVariantAnnotation(
    mutation?: Mutation,
    indexedVariantAnnotations?: { [genomicLocation: string]: VariantAnnotation }
): VariantAnnotation | undefined {
    let variantAnnotation: VariantAnnotation | undefined;

    if (mutation && indexedVariantAnnotations) {
        const genomicLocation = extractGenomicLocation(mutation);
        const key = genomicLocation
            ? genomicLocationString(genomicLocation)
            : undefined;

        if (key) {
            variantAnnotation = indexedVariantAnnotations[key];
        }
    }

    return variantAnnotation;
}
