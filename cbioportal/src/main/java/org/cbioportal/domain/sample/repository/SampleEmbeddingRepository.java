package org.cbioportal.domain.sample.repository;

import java.util.List;
import org.cbioportal.domain.sample.SampleEmbedding;

/**
 * Repository interface for sample embedding data.
 */
public interface SampleEmbeddingRepository {

  /**
   * Retrieves all embeddings for a given cancer study.
   *
   * @param studyId the identifier of the cancer study
   * @return a list of {@link SampleEmbedding} for the study
   */
  List<SampleEmbedding> getEmbeddingsByStudy(String studyId);

  /**
   * Retrieves specific embeddings for a given cancer study and embedding name.
   *
   * @param studyId the identifier of the cancer study
   * @param embeddingName the name of the embedding (e.g., "umap", "pca")
   * @return a list of {@link SampleEmbedding} for the given study and embedding name
   */
  List<SampleEmbedding> getEmbeddingsByStudyAndName(String studyId, String embeddingName);

  /**
   * Saves or updates a list of sample embeddings.
   *
   * @param embeddings the list of embeddings to save
   */
  void saveEmbeddings(List<SampleEmbedding> embeddings);

  /**
   * Deletes all embeddings for a given cancer study.
   *
   * @param studyId the identifier of the cancer study
   */
  void deleteEmbeddingsByStudy(String studyId);
}
