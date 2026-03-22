import calculateKDE from "./calculateKDE";

/**
 * Compute violin plot data (KDE curves) for each category group.
 *
 * @param {Array<Object>} data - Raw per-cell data objects
 * @param {string} categoryField - Key used for grouping (e.g. "cell_type")
 * @param {string} valueField - Key for the numeric value (e.g. "EGFR")
 * @param {object} [options]
 * @param {number} [options.nPoints=128] - KDE grid resolution per group
 * @returns {{ groups: string[], violins: Array<{ group: string, kde: { x: number[], density: number[] }, count: number, median: number }> }}
 */
export function computeViolinStats(data, categoryField, valueField, { nPoints = 128 } = {}) {
  if (!data || data.length === 0) {
    return { groups: [], violins: [] };
  }

  // Group values by category
  const grouped = new Map();
  for (const d of data) {
    const key = d[categoryField];
    if (key == null) continue;
    const val = d[valueField];
    if (val == null || Number.isNaN(val)) continue;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(val);
  }

  const groups = [...grouped.keys()].sort();
  const violins = [];

  for (const group of groups) {
    const values = grouped.get(group);
    values.sort((a, b) => a - b);

    const count = values.length;
    const median = values[Math.floor(count / 2)];
    const kde = calculateKDE(values, { nPoints });

    violins.push({ group, kde, count, median });
  }

  return { groups, violins };
}
