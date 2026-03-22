// Categorical color palette (similar to D3 category10)
export const CATEGORICAL_COLORS = [
  [31, 119, 180],   // #1f77b4
  [255, 127, 14],   // #ff7f0e
  [44, 160, 44],    // #2ca02c
  [214, 39, 40],    // #d62728
  [148, 103, 189],  // #9467bd
  [140, 86, 75],    // #8c564b
  [227, 119, 194],  // #e377c2
  [127, 127, 127],  // #7f7f7f
  [188, 189, 34],   // #bcbd22
  [23, 190, 207],   // #17becf
  [174, 199, 232],  // #aec7e8
  [255, 187, 120],  // #ffbb78
  [152, 223, 138],  // #98df8a
  [255, 152, 150],  // #ff9896
  [197, 176, 213],  // #c5b0d5
];

// Continuous color scales
const VIRIDIS = [
  [68, 1, 84],
  [72, 40, 120],
  [62, 74, 137],
  [49, 104, 142],
  [38, 130, 142],
  [31, 158, 137],
  [53, 183, 121],
  [109, 205, 89],
  [180, 222, 44],
  [253, 231, 37],
];

const MAGMA = [
  [0, 0, 4],
  [28, 16, 68],
  [79, 18, 123],
  [129, 37, 129],
  [181, 54, 122],
  [229, 89, 100],
  [251, 135, 97],
  [254, 186, 118],
  [254, 227, 165],
  [252, 253, 191],
];

export const COLOR_SCALES = {
  viridis: VIRIDIS,
  magma: MAGMA,
};

/**
 * Interpolate through a color scale.
 * @param {number} t - Value between 0 and 1
 * @param {Array} scale - Array of RGB color arrays
 * @returns {[number, number, number]} RGB color array
 */
export function interpolateColorScale(t, scale) {
  const clampedT = Math.max(0, Math.min(1, t));
  const idx = clampedT * (scale.length - 1);
  const lower = Math.floor(idx);
  const upper = Math.min(lower + 1, scale.length - 1);
  const frac = idx - lower;
  return [
    Math.round(scale[lower][0] + (scale[upper][0] - scale[lower][0]) * frac),
    Math.round(scale[lower][1] + (scale[upper][1] - scale[lower][1]) * frac),
    Math.round(scale[lower][2] + (scale[upper][2] - scale[lower][2]) * frac),
  ];
}

/**
 * Convert RGB array to CSS rgb string.
 * @param {[number, number, number]} rgb - RGB color array
 * @returns {string} CSS rgb string
 */
export function rgbToString(rgb) {
  return `rgb(${rgb.join(",")})`;
}

/**
 * Generate a CSS gradient string from a color scale.
 * @param {Array} scale - Array of RGB color arrays
 * @param {string} direction - CSS gradient direction (e.g., "to bottom", "to right")
 * @returns {string} CSS linear-gradient string
 */
export function colorScaleGradient(scale, direction = "to bottom") {
  const colors = scale.slice().reverse().map(c => rgbToString(c)).join(", ");
  return `linear-gradient(${direction}, ${colors})`;
}
