import { getVariantAnnotation, Mutation, RemoteData } from 'cbioportal-utils';
import { VariantAnnotation } from 'genome-nexus-ts-api-client';

export function getAnnotation(
    mutation?: Mutation,
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >
) {
    return indexedVariantAnnotations
        ? getVariantAnnotation(mutation, indexedVariantAnnotations.result)
        : undefined;
}
