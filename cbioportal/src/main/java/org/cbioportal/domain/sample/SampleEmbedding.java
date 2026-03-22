package org.cbioportal.domain.sample;

import java.io.Serializable;

/**
 * Domain model representing sample embedding data (e.g., UMAP or PCA coordinates).
 */
public record SampleEmbedding(
    String cancerStudyIdentifier,
    String sampleStableId,
    String embeddingType,
    String embeddingName,
    Float x,
    Float y,
    Float z
) implements Serializable {
}
