import {
    getProteinPositionFromProteinChange,
    Mutation,
} from 'cbioportal-utils';
import { VariantAnnotationSummary } from 'genome-nexus-ts-api-client';
import { getTranscriptConsequenceSummary } from './AnnotationSummaryUtil';

export function variantToMutation(
    data: VariantAnnotationSummary | undefined
): Mutation[] {
    const mutations = [];
    let mutation: Mutation;
    if (data !== undefined) {
        const transcriptConsequenceSummary = getTranscriptConsequenceSummary(
            data
        );
        mutation = {
            gene: {
                hugoGeneSymbol: transcriptConsequenceSummary.hugoGeneSymbol,
                entrezGeneId: Number(transcriptConsequenceSummary.entrezGeneId),
            },
            chromosome: data.genomicLocation.chromosome,
            startPosition: data.genomicLocation.start,
            endPosition: data.genomicLocation.end,
            referenceAllele: data.genomicLocation.referenceAllele,
            variantAllele: data.genomicLocation.variantAllele,
            proteinChange: transcriptConsequenceSummary.hgvspShort,
            proteinPosStart: transcriptConsequenceSummary.proteinPosition
                ? transcriptConsequenceSummary.proteinPosition.start
                : getProteinPosStart(transcriptConsequenceSummary.hgvspShort),
            proteinPosEnd: transcriptConsequenceSummary.proteinPosition
                ? transcriptConsequenceSummary.proteinPosition.end
                : undefined,
            mutationType: transcriptConsequenceSummary.variantClassification,
        };
        mutations.push(mutation);
    }
    return mutations;
}

export function getProteinPosStart(proteinChange: string | undefined) {
    const proteinPosition = getProteinPositionFromProteinChange(proteinChange);
    return proteinPosition ? proteinPosition.start : 0;
}
