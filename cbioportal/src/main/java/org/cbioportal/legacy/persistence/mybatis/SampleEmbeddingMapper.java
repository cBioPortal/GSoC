package org.cbioportal.legacy.persistence.mybatis;

import java.util.List;
import org.apache.ibatis.annotations.Param;
import org.cbioportal.domain.sample.SampleEmbedding;

/**
 * MyBatis Mapper for sample embedding data.
 */
public interface SampleEmbeddingMapper {

  List<SampleEmbedding> getEmbeddingsByStudy(@Param("studyId") String studyId);

  List<SampleEmbedding> getEmbeddingsByStudyAndName(
      @Param("studyId") String studyId, @Param("embeddingName") String embeddingName);

  void saveEmbeddings(@Param("embeddings") List<SampleEmbedding> embeddings);

  void deleteEmbeddingsByStudy(@Param("studyId") String studyId);
}
