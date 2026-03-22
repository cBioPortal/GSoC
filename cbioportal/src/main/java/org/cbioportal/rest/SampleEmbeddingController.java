package org.cbioportal.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.cbioportal.domain.sample.SampleEmbedding;
import org.cbioportal.domain.sample.embedding.SampleEmbeddingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST Controller for sample embedding data.
 */
@RestController
@RequestMapping("/api")
@Tag(name = "sample-embedding-controller", description = "Sample Embedding Controller")
public class SampleEmbeddingController {

  @Autowired private SampleEmbeddingService sampleEmbeddingService;

  @RequestMapping(
      value = "/studies/{studyId}/embeddings/{embeddingName}",
      method = RequestMethod.GET,
      produces = MediaType.APPLICATION_JSON_VALUE)
  @Operation(description = "Get sample embeddings for a study and embedding name")
  public Map<String, Map<String, Float>> getEmbeddings(
      @Parameter(required = true, description = "Study ID e.g. acc_tcga") @PathVariable
          String studyId,
      @Parameter(required = true, description = "Embedding name e.g. umap") @PathVariable
          String embeddingName) {

    List<SampleEmbedding> embeddings =
        sampleEmbeddingService.getEmbeddingsByName(studyId, embeddingName);

    Map<String, Map<String, Float>> result = new HashMap<>();
    for (SampleEmbedding embedding : embeddings) {
      Map<String, Float> coords = new HashMap<>();
      coords.put("x", embedding.x());
      coords.put("y", embedding.y());
      if (embedding.z() != null) {
        coords.put("z", embedding.z());
      }
      result.put(embedding.sampleStableId(), coords);
    }
    return result;
  }
}
