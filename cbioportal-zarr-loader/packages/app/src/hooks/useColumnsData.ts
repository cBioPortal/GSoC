import { useMemo } from "react";

interface ValueCount {
  key: string;
  value: string;
  count: number;
}

export function useColumnsData(
  lastSelected: string | null,
  columnsData: Record<string, unknown[]>,
) {
  const valueCounts = useMemo<ValueCount[]>(() => {
    if (!lastSelected || !columnsData[lastSelected]) return [];
    const counts: Record<string, number> = {};
    for (const v of columnsData[lastSelected]) {
      const key = String(v);
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([value, count]) => ({ key: value, value, count }));
  }, [lastSelected, columnsData]);

  return { valueCounts };
}
