import _ from 'lodash';

import {
    TranscriptConsequenceSummary,
    VariantAnnotation,
    VariantAnnotationSummary,
} from 'genome-nexus-ts-api-client';

import { Mutation } from '../model/Mutation';
import { genomicLocationString, extractGenomicLocation } from './MutationUtils';
import {
    getMutationTypeFromProteinChange,
    getProteinPositionFromProteinChange,
} from './ProteinChangeUtils';

export function resolveDefaultsForMissingValues(
    mutations: Partial<Mutation>[]
) {
    // if no protein position from user input or annotator, we derive it from the protein change.
    // in case no genomic location is available we can still plot lollipop diagram using this info.
    resolveMissingProteinPositions(mutations);

    // if no mutation type from user input or annotator, we derive it from the protein change.
    resolveMissingMutationTypes(mutations);
}

/**
 * Tries resolving the protein position value from the protein change string.
 */
export function resolveMissingProteinPositions(mutations: Partial<Mutation>[]) {
    mutations.forEach(mutation => {
        if (
            mutation.proteinPosStart === undefined &&
            mutation.proteinPosEnd === undefined
        ) {
            const proteinChange =
                mutation.proteinChange || mutation.aminoAcidChange;
            // derive protein start and end position from the protein change value.
            const proteinPosition = getProteinPositionFromProteinChange(
                proteinChange
            );

            if (proteinPosition) {
                mutation.proteinPosStart = proteinPosition.start;
                mutation.proteinPosEnd = proteinPosition.end;
            }
        }
    });
}

export function resolveMissingMutationTypes(mutations: Partial<Mutation>[]) {
    mutations.forEach(mutation => {
        if (!mutation.mutationType) {
            mutation.mutationType =
                getMutationTypeFromProteinChange(
                    mutation.proteinChange || mutation.aminoAcidChange
                ) || '';
        }
    });
}

export function annotateMutations(
    mutations: Partial<Mutation>[],
    indexedVariantAnnotations: { [genomicLocation: string]: VariantAnnotation }
): Partial<Mutation>[] {
    // add annotation values by updating corresponding fields
    // do not overwrite if proteinChange exist
    if (
        _.every(mutations, mutation => {
            return _.has(mutation, 'proteinChange');
        })
    ) {
        return mutations.map(mutation =>
            annotateMutation(mutation, indexedVariantAnnotations, false)
        );
    } else {
        return mutations.map(mutation =>
            annotateMutation(mutation, indexedVariantAnnotations, true)
        );
    }
}

/**
 * Returns those mutations where the most significant impact on a canonical
 * transcript is affecting the given transcript id.
 *
 * TODO: Once the comoponents downstream are improved to handle multiple
 * annotations we can change this function to return all mutations that have
 * any effect on the given transcript.
 */
export function filterMutationByTranscriptId(
    mutation: Mutation,
    ensemblTranscriptId: string,
    indexedVariantAnnotations: { [genomicLocation: string]: VariantAnnotation }
) {
    const genomicLocation = extractGenomicLocation(mutation);
    const variantAnnotation = genomicLocation
        ? indexedVariantAnnotations[genomicLocationString(genomicLocation)]
        : undefined;

    if (variantAnnotation) {
        return (
            variantAnnotation.annotation_summary.canonicalTranscriptId ===
            ensemblTranscriptId
        );
    } else {
        return false;
    }
}

export function getMutationByTranscriptId<T extends Mutation>(
    mutation: T,
    ensemblTranscriptId: string,
    indexedVariantAnnotations: { [genomicLocation: string]: VariantAnnotation },
    isCanonicalTranscript: boolean = false,
    skipAnnotationForCanonicalTranscript: boolean = false
): T | undefined {
    const genomicLocation = extractGenomicLocation(mutation);
    const variantAnnotation = genomicLocation
        ? indexedVariantAnnotations[genomicLocationString(genomicLocation)]
        : undefined;

    const transcriptConsequenceSummaries =
        variantAnnotation &&
        variantAnnotation.annotation_summary &&
        variantAnnotation.annotation_summary.transcriptConsequenceSummaries &&
        variantAnnotation.annotation_summary.transcriptConsequenceSummaries.filter(
            (tc: TranscriptConsequenceSummary) =>
                tc.transcriptId === ensemblTranscriptId
        );

    if (isCanonicalTranscript && skipAnnotationForCanonicalTranscript) {
        return mutation;
    }
    if (
        variantAnnotation &&
        transcriptConsequenceSummaries &&
        transcriptConsequenceSummaries.length > 0
    ) {
        const transcriptConsequenceSummary = transcriptConsequenceSummaries[0]; // TODO: should pick most impactful one
        const annotatedMutation = getAnnotatedMutationFromAnnotationSummary(
            mutation,
            variantAnnotation.annotation_summary,
            transcriptConsequenceSummary,
            isCanonicalTranscript,
            !skipAnnotationForCanonicalTranscript
        );
        // do not ignore mutations that don't have a protein change
        // include silent mutations
        if (!annotatedMutation.proteinChange) {
            annotatedMutation.proteinChange = '';
        }
        return annotatedMutation as T;
    } else {
        return undefined;
    }
}

export function getAnnotatedMutationFromAnnotationSummary(
    mutation: Partial<Mutation>,
    annotationSummary: VariantAnnotationSummary,
    transcriptConsequenceSummary: TranscriptConsequenceSummary,
    isCanonicalTranscript: boolean,
    shouldOverwriteByAnnotatedMutation: boolean = false
) {
    const annotatedMutation: Partial<Mutation> = initAnnotatedMutation(
        mutation
    );
    // Overwrite only non-canonical transcripts
    if (!isCanonicalTranscript || shouldOverwriteByAnnotatedMutation) {
        annotatedMutation.variantType = annotationSummary.variantType;
        annotatedMutation.proteinChange =
            transcriptConsequenceSummary.hgvspShort;
        // remove p. prefix if exists
        if (annotatedMutation.proteinChange) {
            annotatedMutation.proteinChange = annotatedMutation.proteinChange.replace(
                /^p./,
                ''
            );
        }

        annotatedMutation.mutationType =
            transcriptConsequenceSummary.variantClassification;

        if (transcriptConsequenceSummary.proteinPosition) {
            // TODO: make this logic more clear, lollipopplot fills in proteinstart
            // and end if it's undefined but proteinChange exists
            annotatedMutation.proteinPosStart =
                transcriptConsequenceSummary.proteinPosition.start;
            annotatedMutation.proteinPosEnd =
                transcriptConsequenceSummary.proteinPosition.end;
        } else {
            annotatedMutation.proteinPosStart = undefined;
            annotatedMutation.proteinPosEnd = undefined;
        }
    }

    // Entrez Gene id is critical for OncoKB annotation
    const entrezGeneId = parseInt(
        transcriptConsequenceSummary.entrezGeneId,
        10
    );

    annotatedMutation.gene = {
        ...annotatedMutation.gene,
        hugoGeneSymbol:
            (isCanonicalTranscript &&
                annotatedMutation.gene &&
                annotatedMutation.gene.hugoGeneSymbol) ||
            transcriptConsequenceSummary.hugoGeneSymbol,
        entrezGeneId:
            (annotatedMutation.gene && annotatedMutation.gene.entrezGeneId) ||
            entrezGeneId,
    };

    return annotatedMutation;
}

export function getMutationsByTranscriptId<T extends Mutation>(
    mutations: T[],
    ensemblTranscriptId: string,
    indexedVariantAnnotations: { [genomicLocation: string]: VariantAnnotation },
    isCanonicalTranscript?: boolean,
    skipAnnotationForCanonicalTranscript: boolean = false
): T[] {
    const fusionMutation = getFusionMutations(mutations);
    // only non-fusion mutations need to get mutation with transcript id
    const annotatableMutations: Mutation[] = _.difference(
        mutations,
        fusionMutation
    );
    return _.concat(
        _.compact(
            annotatableMutations.map(mutation =>
                getMutationByTranscriptId(
                    mutation,
                    ensemblTranscriptId,
                    indexedVariantAnnotations,
                    isCanonicalTranscript,
                    skipAnnotationForCanonicalTranscript
                )
            )
        ),
        fusionMutation
    ) as T[];
}

export function filterMutationsByTranscriptId(
    mutations: Mutation[],
    ensemblTranscriptId: string,
    indexedVariantAnnotations: { [genomicLocation: string]: VariantAnnotation }
) {
    return mutations.filter(mutation =>
        filterMutationByTranscriptId(
            mutation,
            ensemblTranscriptId,
            indexedVariantAnnotations
        )
    );
}

export function annotateMutation(
    mutation: Partial<Mutation>,
    indexedVariantAnnotations: { [genomicLocation: string]: VariantAnnotation },
    shouldOverwriteByAnnotatedMutation?: boolean
): Partial<Mutation> {
    const genomicLocation = extractGenomicLocation(mutation);
    const variantAnnotation = genomicLocation
        ? indexedVariantAnnotations[genomicLocationString(genomicLocation)]
        : undefined;
    let canonicalTranscript: TranscriptConsequenceSummary | undefined;

    const annotationSummary = variantAnnotation?.annotation_summary;

    if (annotationSummary) {
        canonicalTranscript = findCanonicalTranscript(annotationSummary);
    }

    if (annotationSummary && canonicalTranscript) {
        return getAnnotatedMutationFromAnnotationSummary(
            mutation,
            annotationSummary,
            canonicalTranscript,
            true,
            shouldOverwriteByAnnotatedMutation
        );
    } else {
        return initAnnotatedMutation(mutation);
    }
}

export function initAnnotatedMutation(
    mutation: Partial<Mutation>
): Partial<Mutation> {
    return {
        ...mutation,
        // set some default values in case annotation fails
        variantType: mutation.variantType || '',
        gene: mutation.gene || {
            hugoGeneSymbol: '',
        },
        proteinChange: mutation.proteinChange || '',
        mutationType: mutation.mutationType || '',
    };
}

// TODO: figure out how this is used. We know what the canonical transcript is
// from ensembl/canonical-transcript endpoint
export function findCanonicalTranscript(
    annotationSummary: VariantAnnotationSummary
): TranscriptConsequenceSummary | undefined {
    let canonical: TranscriptConsequenceSummary | undefined = _.find(
        annotationSummary.transcriptConsequenceSummaries,
        transcriptConsequenceSummary =>
            transcriptConsequenceSummary.transcriptId ===
            annotationSummary.canonicalTranscriptId
    );

    // if no transcript matching the canonical transcript id, then return the first one (if exists)
    if (!canonical) {
        canonical =
            annotationSummary.transcriptConsequenceSummaries.length > 0
                ? annotationSummary.transcriptConsequenceSummaries[0]
                : undefined;
    }

    return canonical;
}

export function indexAnnotationsByGenomicLocation(
    variantAnnotations: VariantAnnotation[]
): { [genomicLocation: string]: VariantAnnotation } {
    return _.keyBy(variantAnnotations, annotation =>
        annotation.originalVariantQuery
            ? annotation.originalVariantQuery
            : genomicLocationStringFromVariantAnnotation(annotation)
    );
}

export function genomicLocationStringFromVariantAnnotation(
    annotation: VariantAnnotation
) {
    const chromosome = annotation.seq_region_name;
    const start = annotation.start;
    const end = annotation.end;
    const referenceAllele = annotation.allele_string.split('/')[0];
    const variantAllele = annotation.allele_string.split('/')[1];

    return genomicLocationString({
        chromosome,
        start,
        end,
        referenceAllele,
        variantAllele,
    });
}

export function getFusionMutations<T extends Mutation>(mutations: T[]): T[] {
    const fusionRegex = new RegExp('fusion', 'i');
    return mutations.filter(
        (m: T) => m.mutationType && fusionRegex.test(m.mutationType)
    );
}
