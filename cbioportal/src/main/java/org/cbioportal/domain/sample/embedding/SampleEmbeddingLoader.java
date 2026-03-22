package org.cbioportal.domain.sample.embedding;

import org.cbioportal.domain.sample.SampleEmbedding;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class SampleEmbeddingLoader {

    private final SampleEmbeddingService sampleEmbeddingService;

    public SampleEmbeddingLoader(SampleEmbeddingService sampleEmbeddingService) {
        this.sampleEmbeddingService = sampleEmbeddingService;
    }

    /**
     * Loads embeddings from a TSV file.
     * Expected format:
     * Sample ID    UMAP_1    UMAP_2    [UMAP_3]
     * sample1      0.1       0.2       0.3
     * 
     * @param studyId The study ID
     * @param embeddingName The name of the embedding (e.g., "umap")
     * @param type The type (e.g., "sample")
     * @param filePath Path to the TSV file
     * @throws IOException If file reading fails
     */
    public void loadFromFile(String studyId, String embeddingName, String type, String filePath) throws IOException {
        List<SampleEmbedding> embeddings = new ArrayList<>();
        
        try (BufferedReader reader = new BufferedReader(new FileReader(filePath))) {
            String header = reader.readLine();
            if (header == null) return;
            
            String line;
            while ((line = reader.readLine()) != null) {
                String[] parts = line.split("\t");
                if (parts.length < 3) continue;
                
                String sampleId = parts[0];
                float x = Float.parseFloat(parts[1]);
                float y = Float.parseFloat(parts[2]);
                Float z = parts.length > 3 ? Float.parseFloat(parts[3]) : null;
                
                embeddings.add(new SampleEmbedding(null, studyId, sampleId, type, embeddingName, x, y, z));
            }
        }
        
        sampleEmbeddingService.saveEmbeddings(embeddings);
    }
}
