package org.cbioportal.domain.sample.embedding;

import java.util.List;
import org.cbioportal.domain.sample.SampleEmbedding;
import org.cbioportal.domain.sample.repository.SampleEmbeddingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Service class for sample embedding data.
 */
@Service
public class SampleEmbeddingService {

  @Autowired private SampleEmbeddingRepository sampleEmbeddingRepository;

  /**
   * Gets embeddings for a study.
   *
   * @param studyId the identifier of the cancer study
   * @return a list of {@link SampleEmbedding}
   */
  public List<SampleEmbedding> getEmbeddings(String studyId) {
    return sampleEmbeddingRepository.getEmbeddingsByStudy(studyId);
  }

  /**
   * Gets specific embeddings for a study and name.
   *
   * @param studyId the identifier of the cancer study
   * @param embeddingName the name of the embedding
   * @return a list of {@link SampleEmbedding}
   */
  public List<SampleEmbedding> getEmbeddingsByName(String studyId, String embeddingName) {
    return sampleEmbeddingRepository.getEmbeddingsByStudyAndName(studyId, embeddingName);
  }

  /**
   * Saves embeddings for a study.
   *
   * @param embeddings the list of embeddings to save
   */
  public void saveEmbeddings(List<SampleEmbedding> embeddings) {
    sampleEmbeddingRepository.saveEmbeddings(embeddings);
  }

  /**
   * Deletes embeddings for a study.
   *
   * @param studyId the identifier of the cancer study
   */
  public void deleteEmbeddings(String studyId) {
    sampleEmbeddingRepository.deleteEmbeddingsByStudy(studyId);
  }
}
