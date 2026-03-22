package org.cbioportal.legacy.persistence.mybatis;

import java.util.List;
import org.cbioportal.domain.sample.SampleEmbedding;
import org.cbioportal.domain.sample.repository.SampleEmbeddingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

/**
 * MyBatis implementation of the SampleEmbeddingRepository.
 */
@Repository
public class SampleEmbeddingMyBatisRepository implements SampleEmbeddingRepository {

  @Autowired private SampleEmbeddingMapper sampleEmbeddingMapper;

  @Override
  public List<SampleEmbedding> getEmbeddingsByStudy(String studyId) {
    return sampleEmbeddingMapper.getEmbeddingsByStudy(studyId);
  }

  @Override
  public List<SampleEmbedding> getEmbeddingsByStudyAndName(String studyId, String embeddingName) {
    return sampleEmbeddingMapper.getEmbeddingsByStudyAndName(studyId, embeddingName);
  }

  @Override
  public void saveEmbeddings(List<SampleEmbedding> embeddings) {
    sampleEmbeddingMapper.saveEmbeddings(embeddings);
  }

  @Override
  public void deleteEmbeddingsByStudy(String studyId) {
    sampleEmbeddingMapper.deleteEmbeddingsByStudy(studyId);
  }
}
