/**
 * Kernel Density Estimation using a Gaussian kernel.
 *
 * @param {number[] | Float32Array} values - data points
 * @param {object} [options]
 * @param {number} [options.nPoints=512] - number of grid evaluation points
 * @param {number|null} [options.bandwidth=null] - override bandwidth (null = Silverman's rule)
 * @returns {{ x: number[], density: number[] }}
 */
export default function calculateKDE(values, { nPoints = 512, bandwidth = null } = {}) {
  const data = values instanceof Float32Array ? Array.from(values) : values;
  const n = data.length;

  if (n === 0) {
    return { x: [], density: [] };
  }

  // Compute mean
  let sum = 0;
  for (let i = 0; i < n; i++) sum += data[i];
  const mean = sum / n;

  // Compute standard deviation
  let sqSum = 0;
  for (let i = 0; i < n; i++) sqSum += (data[i] - mean) ** 2;
  const std = Math.sqrt(sqSum / n);

  // Silverman's rule of thumb: h = 1.06 * std * n^(-1/5)
  // Fall back to 1 if std is 0 (constant values)
  const h = bandwidth ?? (std > 0 ? 1.06 * std * Math.pow(n, -0.2) : 1);

  // Build evaluation grid extending 3 bandwidths beyond data range
  let min = data[0];
  let max = data[0];
  for (let i = 1; i < n; i++) {
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }
  const pad = 3 * h;
  const lo = min - pad;
  const hi = max + pad;
  const step = (hi - lo) / (nPoints - 1);

  const x = new Array(nPoints);
  const density = new Array(nPoints);

  const coeff = 1 / (n * h * Math.sqrt(2 * Math.PI));

  for (let i = 0; i < nPoints; i++) {
    const xi = lo + i * step;
    x[i] = xi;

    let d = 0;
    for (let j = 0; j < n; j++) {
      const u = (xi - data[j]) / h;
      d += Math.exp(-0.5 * u * u);
    }
    density[i] = d * coeff;
  }

  return { x, density };
}
