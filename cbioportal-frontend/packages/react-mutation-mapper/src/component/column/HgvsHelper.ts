import { VariantAnnotation } from 'genome-nexus-ts-api-client';
import {
    generateHgvsgByMutation,
    Mutation,
    RemoteData,
} from 'cbioportal-utils';
import { getAnnotation } from './VariantAnnotationHelper';

export function getHgvsgColumnData(mutation: Mutation): string | null {
    return generateHgvsgByMutation(mutation) || null;
}

export function getHgvscColumnData(
    mutation: Mutation,
    indexedVariantAnnotations?: RemoteData<
        { [genomicLocation: string]: VariantAnnotation } | undefined
    >,
    selectedTranscriptId?: string
): string | null {
    const variantAnnotation = getAnnotation(
        mutation,
        indexedVariantAnnotations
    );

    if (!variantAnnotation) {
        return null;
    }

    let data: string | null =
        variantAnnotation.annotation_summary?.transcriptConsequenceSummary
            ?.hgvsc || null;

    // return data from transcriptConsequenceSummaries if transcript dropdown is enabled
    if (selectedTranscriptId) {
        const transcriptConsequenceSummary = variantAnnotation.annotation_summary?.transcriptConsequenceSummaries?.find(
            transcriptConsequenceSummary =>
                transcriptConsequenceSummary.transcriptId ===
                selectedTranscriptId
        );
        data = transcriptConsequenceSummary
            ? transcriptConsequenceSummary.hgvsc
            : null;
    }

    return data;
}
