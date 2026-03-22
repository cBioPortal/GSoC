import { useMemo } from "react";
import { computeDotplotStats } from "../utils/dotplotUtils";

export function useDotplotData(
  dotplotGenes: string[],
  dotplotGeneExpressions: Record<string, Float32Array>,
  dotplotObsData: string[] | null,
) {
  const groups = useMemo(() => {
    if (!dotplotObsData) return [];
    return [...new Set(dotplotObsData)].sort();
  }, [dotplotObsData]);

  const dotplotData = useMemo(
    () => computeDotplotStats(dotplotGenes, dotplotGeneExpressions, dotplotObsData as string[], groups),
    [dotplotGenes, dotplotGeneExpressions, dotplotObsData, groups],
  );

  return { groups, dotplotData };
}
