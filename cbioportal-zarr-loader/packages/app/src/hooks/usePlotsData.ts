import { useMemo } from "react";
import { computeBoxplotStats } from "../utils/boxplotUtils";
import { computeViolinStats } from "../utils/violinUtils";

const MAX_CATEGORIES = 200;

export function usePlotsData(
  plotGeneExpression: Float32Array | null,
  plotObsData: string[] | null,
  plotObsColumn: string | null,
  plotGene: string | null,
  filterExpression: number | null,
) {
  const frequentValues = useMemo(() => {
    if (!plotGeneExpression) return [];
    const counts = new Map<number, number>();
    for (let i = 0; i < plotGeneExpression.length; i++) {
      const v = Math.round(plotGeneExpression[i] * 10000) / 10000;
      counts.set(v, (counts.get(v) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([val, count]) => ({
        value: val,
        label: `${val} (${count.toLocaleString()}x)`,
      }));
  }, [plotGeneExpression]);

  const data = useMemo(() => {
    if (!plotGeneExpression || !plotObsData || !plotObsColumn || !plotGene) return null;
    const raw = Array.from(plotGeneExpression, (val, i) => ({
      [plotObsColumn]: String(plotObsData[i]),
      [plotGene]: Math.round(val * 10000) / 10000,
    }));
    if (filterExpression !== null) {
      return raw.filter((d) => d[plotGene] !== filterExpression);
    }
    return raw;
  }, [plotGeneExpression, plotObsData, plotObsColumn, plotGene, filterExpression]);

  const categoryCount = useMemo(() => {
    if (!data || !plotObsColumn) return 0;
    return new Set(data.map((d) => d[plotObsColumn])).size;
  }, [data, plotObsColumn]);

  const tooManyCategories = categoryCount > MAX_CATEGORIES;

  const boxplotData = useMemo(() => {
    if (!data || tooManyCategories || !plotObsColumn || !plotGene) return null;
    return computeBoxplotStats(data, plotObsColumn, plotGene);
  }, [data, plotObsColumn, plotGene, tooManyCategories]);

  const violinData = useMemo(() => {
    if (!data || tooManyCategories || !plotObsColumn || !plotGene) return null;
    return computeViolinStats(data, plotObsColumn, plotGene);
  }, [data, plotObsColumn, plotGene, tooManyCategories]);

  return { frequentValues, data, categoryCount, tooManyCategories, boxplotData, violinData, MAX_CATEGORIES };
}
