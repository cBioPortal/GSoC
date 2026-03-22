/**
 * Stack-safe maximum over an array. Avoids Math.max(...arr) which
 * overflows the call stack on large arrays.
 *
 * @param {Array} arr
 * @param {function} [fn] - optional accessor
 * @returns {number}
 */
export function maxOf(arr, fn) {
  let m = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    const v = fn ? fn(arr[i]) : arr[i];
    if (v > m) m = v;
  }
  return m;
}

/**
 * Stack-safe minimum over an array.
 *
 * @param {Array} arr
 * @param {function} [fn] - optional accessor
 * @returns {number}
 */
export function minOf(arr, fn) {
  let m = Infinity;
  for (let i = 0; i < arr.length; i++) {
    const v = fn ? fn(arr[i]) : arr[i];
    if (v < m) m = v;
  }
  return m;
}
