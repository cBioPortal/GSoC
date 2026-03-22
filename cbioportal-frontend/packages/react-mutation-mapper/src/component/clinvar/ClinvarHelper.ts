import { getVariantAnnotation, Mutation, RemoteData } from 'cbioportal-utils';
import { Clinvar, VariantAnnotation } from 'genome-nexus-ts-api-client';

export function getClinvarData(
    mutation: Mutation,
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >
): Clinvar | undefined {
    const variantAnnotation = getVariantAnnotation(
        mutation,
        indexedVariantAnnotations!.result
    );
    return variantAnnotation?.clinvar?.annotation;
}
