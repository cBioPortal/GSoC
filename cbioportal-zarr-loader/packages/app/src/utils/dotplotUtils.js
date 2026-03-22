/**
 * Compute dotplot statistics for each gene × group combination.
 *
 * @param {string[]} genes - List of gene names
 * @param {Object} geneExpressions - Map of gene name → Float32Array/array of expression values
 * @param {Array} obsData - Per-cell group assignments (same length as expression arrays)
 * @param {string[]} groups - Unique sorted group labels
 * @returns {Array|null} Array of { gene, group, meanExpression, fractionExpressing, cellCount, expressingCount }, or null if inputs are insufficient
 */
export function computeDotplotStats(genes, geneExpressions, obsData, groups) {
  if (genes.length === 0 || !obsData || groups.length === 0) return null;

  // Build group → indices mapping once
  const groupIndices = {};
  for (const g of groups) groupIndices[g] = [];
  for (let i = 0; i < obsData.length; i++) {
    const g = obsData[i];
    if (groupIndices[g]) groupIndices[g].push(i);
  }

  const stats = [];
  for (const gene of genes) {
    const expr = geneExpressions[gene];
    if (!expr) continue;

    // Find the minimum expression value for this gene.
    // In log-normalized data, non-expressing cells all share the same
    // baseline value (the transformed zero), which may be negative.
    let geneMin = Infinity;
    for (let i = 0; i < expr.length; i++) {
      if (expr[i] < geneMin) geneMin = expr[i];
    }

    for (const group of groups) {
      const indices = groupIndices[group];
      if (indices.length === 0) continue;
      let sum = 0;
      let expressing = 0;
      for (const idx of indices) {
        const val = expr[idx];
        sum += val;
        if (val > geneMin) expressing++;
      }
      stats.push({
        gene,
        group,
        meanExpression: sum / indices.length,
        fractionExpressing: expressing / indices.length,
        cellCount: indices.length,
        expressingCount: expressing,
      });
    }
  }
  return stats;
}
